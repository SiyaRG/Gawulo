from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory, OrderRating
from vendors.serializers import VendorSerializer, MenuItemSerializer
from vendors.models import MenuItem


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for OrderItem model."""
    menu_item = MenuItemSerializer(read_only=True)
    menu_item_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'menu_item', 'menu_item_id', 'quantity', 'unit_price', 
            'total_price', 'special_instructions', 'customizations',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'unit_price', 'total_price', 'created_at', 'updated_at']


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    """Serializer for OrderStatusHistory model."""
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)
    
    class Meta:
        model = OrderStatusHistory
        fields = [
            'id', 'order', 'status', 'notes', 'updated_by', 'updated_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class OrderRatingSerializer(serializers.ModelSerializer):
    """Serializer for OrderRating model."""
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    
    class Meta:
        model = OrderRating
        fields = [
            'id', 'order', 'customer', 'customer_name', 'rating', 'comment',
            'food_quality', 'delivery_speed', 'service_quality',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'customer', 'created_at', 'updated_at']


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Order model."""
    vendor = VendorSerializer(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    rating = OrderRatingSerializer(read_only=True)
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    total_items = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'customer_name', 'vendor',
            'delivery_type', 'delivery_address', 'delivery_instructions',
            'special_instructions', 'subtotal', 'delivery_fee', 'tax_amount',
            'total_amount', 'status', 'estimated_delivery_time',
            'actual_delivery_time', 'created_offline', 'synced_to_server',
            'sync_timestamp', 'created_at', 'updated_at', 'items',
            'status_history', 'rating', 'total_items'
        ]
        read_only_fields = [
            'id', 'order_number', 'subtotal', 'delivery_fee', 'tax_amount',
            'total_amount', 'created_offline', 'synced_to_server', 'sync_timestamp',
            'created_at', 'updated_at', 'items', 'status_history', 'rating', 'total_items'
        ]
    
    def get_total_items(self, obj):
        """Get total number of items in the order."""
        return obj.get_total_items()


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new orders."""
    items = OrderItemSerializer(many=True)
    vendor_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Order
        fields = [
            'vendor_id', 'delivery_type', 'delivery_address', 'delivery_instructions',
            'special_instructions', 'items'
        ]
    
    def create(self, validated_data):
        """Create order with items."""
        items_data = validated_data.pop('items')
        vendor_id = validated_data.pop('vendor_id')
        
        # Create order
        order = Order.objects.create(
            vendor_id=vendor_id,
            **validated_data
        )
        
        # Create order items
        for item_data in items_data:
            menu_item_id = item_data.pop('menu_item_id')
            menu_item = MenuItem.objects.get(id=menu_item_id)
            
            OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                unit_price=menu_item.price,
                **item_data
            )
        
        return order


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating order status."""
    
    class Meta:
        model = Order
        fields = ['status']
    
    def validate_status(self, value):
        """Validate status transition."""
        order = self.instance
        valid_transitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['preparing', 'cancelled'],
            'preparing': ['ready', 'cancelled'],
            'ready': ['out_for_delivery', 'cancelled'],
            'out_for_delivery': ['delivered', 'cancelled'],
            'delivered': [],
            'cancelled': [],
            'failed': []
        }
        
        current_status = order.status
        allowed_transitions = valid_transitions.get(current_status, [])
        
        if value not in allowed_transitions:
            raise serializers.ValidationError(
                f"Cannot transition from {current_status} to {value}"
            )
        
        return value
