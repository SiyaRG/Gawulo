from rest_framework import serializers
from .models import Order, OrderLineItem, OrderStatusHistory, Review, RefundRequest
from vendors.serializers import VendorSerializer, ProductServiceSerializer
from vendors.models import ProductService
from auth_api.models import Customer
from datetime import timedelta


class OrderLineItemSerializer(serializers.ModelSerializer):
    """Serializer for OrderLineItem model."""
    product_service = ProductServiceSerializer(read_only=True)
    product_service_id = serializers.IntegerField(write_only=True, required=False)
    unit_price_snapshot = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, read_only=True)
    
    class Meta:
        model = OrderLineItem
        fields = [
            'id', 'product_service', 'product_service_id', 'quantity', 
            'unit_price_snapshot', 'discount_applied', 'line_total',
            'quantity_fulfilled'
        ]
        read_only_fields = ['id', 'unit_price_snapshot', 'line_total', 'quantity_fulfilled']


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    """Serializer for OrderStatusHistory model."""
    confirmed_by_name = serializers.CharField(source='confirmed_by_user.username', read_only=True)
    
    class Meta:
        model = OrderStatusHistory
        fields = [
            'id', 'order', 'status', 'confirmed_by_user', 'confirmed_by_name', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for Review model."""
    customer_name = serializers.CharField(source='customer.display_name', read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    order_uid = serializers.CharField(source='order.order_uid', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'order', 'order_uid', 'vendor', 'vendor_name', 'customer', 'customer_name',
            'rating', 'comment', 'created_at'
        ]
        read_only_fields = ['id', 'order', 'order_uid', 'vendor', 'customer', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Order model."""
    vendor = VendorSerializer(read_only=True)
    line_items = OrderLineItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    review = ReviewSerializer(read_only=True)
    customer_name = serializers.CharField(source='customer.display_name', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_uid', 'customer', 'customer_name', 'vendor',
            'total_amount', 'current_status', 'is_completed',
            'delivery_type', 'delivery_address', 'delivery_instructions',
            'estimated_ready_time',
            'created_at', 'updated_at', 'line_items',
            'status_history', 'review'
        ]
        read_only_fields = [
            'id', 'order_uid', 'total_amount', 'created_at', 'updated_at',
            'line_items', 'status_history', 'review'
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new orders."""
    line_items = OrderLineItemSerializer(many=True)
    vendor_id = serializers.IntegerField(write_only=True, required=False)  # Optional, will be derived from line items
    
    class Meta:
        model = Order
        fields = [
            'vendor_id', 'line_items', 'delivery_type', 'delivery_address', 'delivery_instructions'
        ]
    
    def create(self, validated_data):
        """Create order with line items."""
        line_items_data = validated_data.pop('line_items')
        vendor_id = validated_data.pop('vendor_id', None)  # Optional, will be derived from line items
        
        from vendors.models import Vendor, ProductService
        from auth_api.models import Customer
        
        # Validate that we have line items
        if not line_items_data:
            raise serializers.ValidationError("At least one line item is required.")
        
        # Derive vendor from the first line item's product_service
        first_item_data = line_items_data[0].copy()
        first_product_service_id = first_item_data.get('product_service_id')
        if not first_product_service_id:
            raise serializers.ValidationError("product_service_id is required for all line items.")
        
        first_product_service = ProductService.objects.get(id=first_product_service_id)
        vendor = first_product_service.vendor
        
        # Get delivery_type from validated_data
        delivery_type = validated_data.get('delivery_type', 'delivery')
        
        # Validate that all line items belong to the same vendor and are available for delivery_type
        total_preparation_minutes = 0
        for item_data in line_items_data:
            product_service_id = item_data.get('product_service_id')
            if not product_service_id:
                raise serializers.ValidationError("product_service_id is required for all line items.")
            
            product_service = ProductService.objects.get(id=product_service_id)
            if product_service.vendor != vendor:
                raise serializers.ValidationError(
                    f"All line items must belong to the same vendor. "
                    f"Item {product_service.name} belongs to {product_service.vendor.name}, "
                    f"but order is for {vendor.name}."
                )
            
            # Validate item availability for delivery type
            if delivery_type == 'delivery' and product_service.available_for not in ('delivery', 'both'):
                raise serializers.ValidationError(
                    f"Item '{product_service.name}' is not available for delivery. "
                    f"It is only available for: {product_service.get_available_for_display()}."
                )
            elif delivery_type == 'pickup' and product_service.available_for not in ('pickup', 'both'):
                raise serializers.ValidationError(
                    f"Item '{product_service.name}' is not available for pickup. "
                    f"It is only available for: {product_service.get_available_for_display()}."
                )
            
            # Sum preparation time (use item's estimated time or default to 0)
            if product_service.estimated_preparation_time_minutes:
                total_preparation_minutes += product_service.estimated_preparation_time_minutes
        
        # If vendor_id was provided, validate it matches the derived vendor
        if vendor_id and vendor_id != vendor.id:
            raise serializers.ValidationError(
                f"Provided vendor_id ({vendor_id}) does not match the vendor from line items ({vendor.id})."
            )
        
        # Get customer - it should be passed via serializer.save(customer=customer) from the view
        # If not in validated_data, get from request context
        customer = validated_data.pop('customer', None)
        if not customer:
            request = self.context.get('request')
            if not request or not request.user:
                raise serializers.ValidationError("User must be authenticated to create an order.")
            
            # Try to get customer from the user
            try:
                customer = request.user.customer_profile
            except Customer.DoesNotExist:
                # If customer profile doesn't exist, create it
                # Set display_name from user's first_name/last_name or username
                display_name = None
                if request.user.first_name or request.user.last_name:
                    display_name = f"{request.user.first_name} {request.user.last_name}".strip()
                else:
                    display_name = request.user.username or request.user.email.split('@')[0]
                customer = Customer.objects.create(user=request.user, display_name=display_name)
        
        # Calculate estimated ready time if we have preparation time
        estimated_ready_time = None
        if total_preparation_minutes > 0:
            from django.utils import timezone
            estimated_ready_time = timezone.now() + timedelta(minutes=total_preparation_minutes)
        
        # Ensure delivery_type is explicitly set (default to 'delivery' if not provided)
        delivery_type = validated_data.pop('delivery_type', 'delivery')
        
        # Create order
        order = Order.objects.create(
            vendor=vendor,
            customer=customer,
            total_amount=0,  # Will be calculated after line items
            current_status='Confirmed',
            estimated_ready_time=estimated_ready_time,
            delivery_type=delivery_type,
            **validated_data  # Include delivery_address, delivery_instructions if provided
        )
        
        # Create order line items and calculate total
        from decimal import Decimal
        total_amount = Decimal('0.00')
        for item_data in line_items_data:
            product_service_id = item_data.pop('product_service_id')
            product_service = ProductService.objects.get(id=product_service_id)
            
            # Calculate line total
            unit_price = product_service.current_price
            quantity = item_data.get('quantity', 1)
            discount = Decimal(str(item_data.get('discount_applied', 0.0)))
            line_total = (unit_price * quantity) - discount
            total_amount += line_total
            
            OrderLineItem.objects.create(
                order=order,
                product_service=product_service,
                unit_price_snapshot=unit_price,
                line_total=line_total,
                **item_data
            )
        
        # Update order total
        order.total_amount = total_amount
        order.save()
        
        return order


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating order status."""
    
    class Meta:
        model = Order
        fields = ['current_status']
    
    def validate_current_status(self, value):
        """Validate status transition based on delivery type."""
        order = self.instance
        if not order:
            return value
        
        current_status = order.current_status
        delivery_type = order.delivery_type or 'delivery'
        
        # Prevent any changes to refunded orders - refunds cannot be reversed
        if current_status == 'Refunded':
            raise serializers.ValidationError(
                "Cannot change the status of a refunded order. Refunds cannot be reversed."
            )
        
        # Define valid transitions based on delivery type
        if delivery_type == 'pickup':
            # Pickup workflow: Processing -> Ready -> PickedUp
            valid_transitions = {
                'Pending': ['Confirmed', 'Cancelled'],
                'Confirmed': ['Processing', 'Cancelled'],
                'Processing': ['Ready', 'Cancelled'],
                'Ready': ['PickedUp', 'Cancelled'],
                'PickedUp': [],
                'Cancelled': [],
                'Refunded': [],  # Refunded orders cannot be changed
            }
        else:  # delivery
            # Delivery workflow: Processing -> Shipped -> Delivered
            valid_transitions = {
                'Pending': ['Confirmed', 'Cancelled'],
                'Confirmed': ['Processing', 'Cancelled'],
                'Processing': ['Shipped', 'Cancelled'],
                'Shipped': ['Delivered', 'Cancelled'],
                'Delivered': [],
                'Cancelled': [],
                'Refunded': [],  # Refunded orders cannot be changed
            }
        
        # Check if transition is valid
        allowed_statuses = valid_transitions.get(current_status, [])
        if value not in allowed_statuses and value != current_status:
            raise serializers.ValidationError(
                f"Cannot transition from '{current_status}' to '{value}' for {delivery_type} orders. "
                f"Valid next statuses: {', '.join(allowed_statuses) if allowed_statuses else 'none'}."
            )
        
        return value


class RefundRequestSerializer(serializers.ModelSerializer):
    """Serializer for RefundRequest model."""
    requested_by_name = serializers.CharField(source='requested_by.display_name', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.username', read_only=True)
    order_uid = serializers.CharField(source='order.order_uid', read_only=True)
    
    class Meta:
        model = RefundRequest
        fields = [
            'id', 'order', 'order_uid', 'requested_by', 'requested_by_name',
            'reason', 'status', 'processed_by', 'processed_by_name',
            'processed_at', 'denial_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'requested_by', 'status', 'processed_by', 'processed_at',
            'created_at', 'updated_at'
        ]


class RefundRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating refund requests."""
    
    class Meta:
        model = RefundRequest
        fields = ['order', 'reason']
    
    def validate_order(self, value):
        """Validate that the order belongs to the requesting customer."""
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("User must be authenticated.")
        
        try:
            customer = request.user.customer_profile
        except Customer.DoesNotExist:
            raise serializers.ValidationError("User does not have a customer profile.")
        
        # Check if order belongs to the customer
        if value.customer != customer:
            raise serializers.ValidationError("You can only request refunds for your own orders.")
        
        # Check if order is eligible for refund
        if value.current_status in ['Cancelled', 'Refunded']:
            raise serializers.ValidationError("This order is already cancelled or refunded.")
        
        # Check if there's already a pending refund request
        if RefundRequest.objects.filter(order=value, status='pending').exists():
            raise serializers.ValidationError("A pending refund request already exists for this order.")
        
        # Check if there's already an approved refund request (refunds cannot be reversed)
        if RefundRequest.objects.filter(order=value, status='approved').exists():
            raise serializers.ValidationError("This order has already been refunded and cannot be refunded again.")
        
        return value


class OrderEstimatedTimeUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating estimated ready time."""
    class Meta:
        model = Order
        fields = ['estimated_ready_time']


class OrderCancelSerializer(serializers.Serializer):
    """Serializer for order cancellation requests."""
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)
    
    class Meta:
        fields = ['reason']