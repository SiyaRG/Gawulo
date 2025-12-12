"""
Order models for the ReachHub Trust as a Service platform.

Defines models for orders, order items, and order tracking with
offline-capable operations and real-time status updates.
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.utils import timezone
import uuid


class Order(models.Model):
    """
    Order model for food orders with offline support.
    
    Supports offline creation and synchronization when connectivity is restored.
    """
    
    ORDER_STATUS = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready for Pickup/Delivery'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('failed', 'Failed'),
    )
    
    DELIVERY_TYPE = (
        ('delivery', 'Delivery'),
        ('pickup', 'Pickup'),
    )
    
    # Basic Information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    vendor = models.ForeignKey('vendors.Vendor', on_delete=models.CASCADE, related_name='orders')
    
    # Order Details
    delivery_type = models.CharField(max_length=20, choices=DELIVERY_TYPE, default='delivery')
    delivery_address = models.TextField(blank=True)
    delivery_instructions = models.TextField(blank=True)
    special_instructions = models.TextField(blank=True)
    
    # Pricing
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Status and Tracking
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='pending')
    estimated_delivery_time = models.DateTimeField(null=True, blank=True)
    actual_delivery_time = models.DateTimeField(null=True, blank=True)
    
    # Offline Support
    created_offline = models.BooleanField(default=False)
    synced_to_server = models.BooleanField(default=True)
    sync_timestamp = models.DateTimeField(auto_now=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order {self.order_number} - {self.customer.username}"
    
    def save(self, *args, **kwargs):
        """Generate order number if not provided."""
        if not self.order_number:
            self.order_number = self.generate_order_number()
        super().save(*args, **kwargs)
    
    def generate_order_number(self):
        """Generate unique order number."""
        import random
        import string
        timestamp = timezone.now().strftime('%Y%m%d%H%M')
        random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        return f"GAW{timestamp}{random_chars}"
    
    def get_total_items(self):
        """Get total number of items in the order."""
        return sum(item.quantity for item in self.items.all())
    
    def can_be_cancelled(self):
        """Check if order can be cancelled."""
        return self.status in ['pending', 'confirmed']
    
    def update_status(self, new_status):
        """Update order status with validation."""
        if new_status in dict(self.ORDER_STATUS):
            self.status = new_status
            self.save()
            return True
        return False


class OrderItem(models.Model):
    """
    Individual items within an order.
    
    Links menu items to orders with quantity and pricing information.
    """
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey('vendors.MenuItem', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Customizations
    special_instructions = models.TextField(blank=True)
    customizations = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['order', 'menu_item']
    
    def __str__(self):
        return f"{self.quantity}x {self.menu_item.name} - Order {self.order.order_number}"
    
    def save(self, *args, **kwargs):
        """Calculate total price if not set."""
        if not self.total_price:
            self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class OrderStatusHistory(models.Model):
    """
    Track order status changes for audit and customer communication.
    """
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=20, choices=Order.ORDER_STATUS)
    notes = models.TextField(blank=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Order status histories'
    
    def __str__(self):
        return f"Order {self.order.order_number} - {self.status} at {self.created_at}"


class OrderRating(models.Model):
    """
    Customer ratings and reviews for completed orders.
    """
    
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='rating')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='order_ratings')
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MinValueValidator(5)])
    comment = models.TextField(blank=True)
    
    # Rating categories
    food_quality = models.PositiveIntegerField(validators=[MinValueValidator(1), MinValueValidator(5)], null=True, blank=True)
    delivery_speed = models.PositiveIntegerField(validators=[MinValueValidator(1), MinValueValidator(5)], null=True, blank=True)
    service_quality = models.PositiveIntegerField(validators=[MinValueValidator(1), MinValueValidator(5)], null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Rating for Order {self.order.order_number} - {self.rating}/5"


class OfflineOrderQueue(models.Model):
    """
    Queue for orders created offline that need to be synced to server.
    """
    
    order_data = models.JSONField()  # Store complete order data
    customer_id = models.IntegerField()
    vendor_id = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)
    synced = models.BooleanField(default=False)
    sync_attempts = models.PositiveIntegerField(default=0)
    last_sync_attempt = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Offline Order Queue - {self.created_at}"
