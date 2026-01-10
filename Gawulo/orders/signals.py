"""
Django signals for broadcasting order updates via WebSocket.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Order, OrderStatusHistory
from .serializers import OrderSerializer


@receiver(post_save, sender=OrderStatusHistory)
def order_status_history_created(sender, instance, created, **kwargs):
    """Broadcast order update when status history is created."""
    if created:
        order = instance.order
        broadcast_order_update(order, 'order_update')


@receiver(pre_save, sender=Order)
def order_status_changed(sender, instance, **kwargs):
    """Detect and broadcast order status changes."""
    if instance.pk:
        try:
            old_order = Order.objects.get(pk=instance.pk)
            if old_order.current_status != instance.current_status:
                # Status changed, broadcast update
                broadcast_order_update(instance, 'order_update')
        except Order.DoesNotExist:
            pass
    else:
        # New order created
        pass


@receiver(post_save, sender=Order)
def order_created_or_updated(sender, instance, created, **kwargs):
    """Broadcast new order or order update."""
    if created:
        broadcast_order_update(instance, 'new_order')
    else:
        # Check if this is a significant update (not just status change which is handled above)
        broadcast_order_update(instance, 'order_update')


def broadcast_order_update(order, message_type):
    """Broadcast order update to vendor and customer channel groups."""
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    
    # Serialize order
    serializer = OrderSerializer(order)
    order_data = serializer.data
    
    # Get vendor and customer IDs
    vendor_id = order.vendor.id
    customer_id = order.customer.id
    
    # Prepare message
    message = {
        'type': message_type,
        'order': order_data,
        'timestamp': timezone.now().isoformat()
    }
    
    # Broadcast to vendor channel
    vendor_group_name = f'vendor_{vendor_id}_orders'
    async_to_sync(channel_layer.group_send)(
        vendor_group_name,
        {
            'type': message_type,
            'order': order_data,
            'timestamp': message['timestamp']
        }
    )
    
    # Broadcast to customer channel
    customer_group_name = f'customer_{customer_id}_orders'
    async_to_sync(channel_layer.group_send)(
        customer_group_name,
        {
            'type': message_type,
            'order': order_data,
            'timestamp': message['timestamp']
        }
    )

