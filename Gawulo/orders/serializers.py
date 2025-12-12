from rest_framework import serializers
from .models import Order, OrderLineItem, OrderStatusHistory, Review
from vendors.serializers import VendorSerializer, ProductServiceSerializer
from vendors.models import ProductService
from auth_api.models import Customer


class OrderLineItemSerializer(serializers.ModelSerializer):
    """Serializer for OrderLineItem model."""
    product_service = ProductServiceSerializer(read_only=True)
    product_service_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = OrderLineItem
        fields = [
            'id', 'product_service', 'product_service_id', 'quantity', 
            'unit_price_snapshot', 'discount_applied', 'line_total',
            'quantity_fulfilled'
        ]
        read_only_fields = ['id', 'line_total', 'quantity_fulfilled']


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
    
    class Meta:
        model = Review
        fields = [
            'id', 'order', 'vendor', 'vendor_name', 'customer', 'customer_name',
            'rating', 'comment', 'created_at'
        ]
        read_only_fields = ['id', 'order', 'vendor', 'customer', 'created_at']


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
    vendor_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Order
        fields = [
            'vendor_id', 'line_items'
        ]
    
    def create(self, validated_data):
        """Create order with line items."""
        line_items_data = validated_data.pop('line_items')
        vendor_id = validated_data.pop('vendor_id')
        
        from vendors.models import Vendor
        vendor = Vendor.objects.get(id=vendor_id)
        
        # Create order
        order = Order.objects.create(
            vendor=vendor,
            total_amount=0,  # Will be calculated after line items
            current_status='Confirmed'
        )
        
        # Create order line items and calculate total
        total_amount = 0
        for item_data in line_items_data:
            product_service_id = item_data.pop('product_service_id')
            product_service = ProductService.objects.get(id=product_service_id)
            
            # Calculate line total
            unit_price = product_service.current_price
            quantity = item_data.get('quantity', 1)
            discount = item_data.get('discount_applied', 0.0)
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
        """Validate status transition."""
        order = self.instance
        valid_transitions = {
            'Confirmed': ['Processing', 'Cancelled'],
            'Pending': ['Confirmed', 'Cancelled'],
            'Processing': ['Shipped', 'Cancelled'],
            'Shipped': ['Delivered', 'Cancelled'],
            'Delivered': [],
            'Cancelled': [],
            'Refunded': []
        }
        
        current_status = order.current_status
        allowed_transitions = valid_transitions.get(current_status, [])
        
        if value not in allowed_transitions and value != current_status:
            raise serializers.ValidationError(
                f"Cannot transition from {current_status} to {value}"
            )
        
        return value
