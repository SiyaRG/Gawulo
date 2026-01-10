"""
Order models for the Gawulo platform.

Defines models for orders, order line items, order status history, and reviews.
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid


class Order(models.Model):
    """
    Order model for customer orders.
    
    Uses UUID for public-facing order identifier and tracks order status.
    """
    
    ORDER_STATUS = (
        ('Confirmed', 'Confirmed'),
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Ready', 'Ready for Pickup'),
        ('PickedUp', 'Picked Up'),
        ('Cancelled', 'Cancelled'),
        ('Refunded', 'Refunded'),
    )
    
    DELIVERY_TYPE = (
        ('delivery', 'Delivery'),
        ('pickup', 'Pickup'),
    )
    
    id = models.AutoField(primary_key=True)
    order_uid = models.CharField(max_length=10, unique=True, editable=False)
    vendor = models.ForeignKey('vendors.Vendor', on_delete=models.CASCADE, related_name='orders')
    customer = models.ForeignKey('auth_api.Customer', on_delete=models.CASCADE, related_name='orders')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    current_status = models.CharField(max_length=50, choices=ORDER_STATUS, default='Confirmed')
    delivery_type = models.CharField(max_length=20, choices=DELIVERY_TYPE, default='delivery', blank=True)
    delivery_address = models.TextField(blank=True, null=True)
    delivery_instructions = models.TextField(blank=True, null=True)
    estimated_ready_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Estimated time when order will be ready for pickup/delivery'
    )
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_uid']),
            models.Index(fields=['vendor', 'current_status']),
            models.Index(fields=['customer', 'created_at']),
        ]
    
    def __str__(self):
        return f"Order {self.order_uid} - {self.customer.display_name}"
    
    def save(self, *args, **kwargs):
        """Ensure order_uid is set if not provided and prevent modification of created_at."""
        if not self.order_uid:
            # Generate date-based order ID: YYYYMMDD-N format
            today = timezone.now().date()
            date_str = today.strftime('%Y%m%d')
            
            # Get the highest sequence number for today
            today_orders = Order.objects.filter(
                order_uid__startswith=date_str
            ).exclude(pk=self.pk if self.pk else None)
            
            if today_orders.exists():
                # Extract sequence numbers and find max
                max_seq = 0
                for order in today_orders:
                    try:
                        seq = int(order.order_uid.split('-')[1])
                        max_seq = max(max_seq, seq)
                    except (ValueError, IndexError):
                        pass
                sequence = max_seq + 1
            else:
                sequence = 1
            
            # Format: YYYYMMDD-N (e.g., 20250112-1)
            self.order_uid = f"{date_str}-{sequence}"
        
        # Automatically set is_completed based on status
        # Orders are completed when they are Delivered, PickedUp, or Refunded
        if self.current_status in ['Delivered', 'PickedUp', 'Refunded']:
            self.is_completed = True
        else:
            self.is_completed = False
        
        if self.pk:
            # Preserve original created_at when updating
            original = Order.objects.get(pk=self.pk)
            self.created_at = original.created_at
        super().save(*args, **kwargs)
    
    def mark_completed(self):
        """Mark order as completed. Status should already be set to Delivered, PickedUp, or Refunded."""
        # Don't change the status - it should already be correct
        # Just ensure is_completed is set
        if self.current_status not in ['Delivered', 'PickedUp', 'Refunded']:
            raise ValueError(f"Cannot mark order as completed with status '{self.current_status}'. Status must be 'Delivered', 'PickedUp', or 'Refunded'.")
        self.is_completed = True
        self.save()


class OrderLineItem(models.Model):
    """
    Individual line items within an order.
    
    Stores product/service information with price snapshots for financial integrity.
    """
    
    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='line_items')
    product_service = models.ForeignKey(
        'vendors.ProductService', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='order_line_items'
    )
    quantity = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    unit_price_snapshot = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text='Price captured at time of order for financial integrity'
    )
    discount_applied = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)
    quantity_fulfilled = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    
    class Meta:
        verbose_name = 'Order Line Item'
        verbose_name_plural = 'Order Line Items'
        ordering = ['id']
    
    def __str__(self):
        product_name = self.product_service.name if self.product_service else "Unknown Product"
        return f"{self.quantity}x {product_name} - Order {self.order.order_uid}"
    
    def save(self, *args, **kwargs):
        """Calculate line_total if not set and prevent modification of created_at."""
        if not self.line_total:
            base_total = self.quantity * self.unit_price_snapshot
            self.line_total = base_total - self.discount_applied
        if self.pk:
            # Preserve original created_at when updating
            original = OrderLineItem.objects.get(pk=self.pk)
            self.created_at = original.created_at
        super().save(*args, **kwargs)
    
    @property
    def quantity_remaining(self):
        """Calculate remaining quantity to fulfill."""
        return max(0, self.quantity - self.quantity_fulfilled)
    
    def is_fully_fulfilled(self):
        """Check if line item is fully fulfilled."""
        return self.quantity_fulfilled >= self.quantity


class OrderStatusHistory(models.Model):
    """
    Track order status changes for audit and customer communication.
    
    Records each status change with timestamp and user who confirmed it.
    Note: confirmed_by_user is required per schema. Use a system user for automated actions.
    """
    
    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)
    confirmed_by_user = models.ForeignKey(
        User, 
        on_delete=models.PROTECT,
        related_name='confirmed_status_changes'
    )
    
    class Meta:
        verbose_name = 'Order Status History'
        verbose_name_plural = 'Order Status Histories'
        ordering = ['-timestamp']
    
    def __str__(self):
        user_name = self.confirmed_by_user.username if self.confirmed_by_user else "System"
        return f"Order {self.order.order_uid} - {self.status} by {user_name} at {self.timestamp}"
    
    def save(self, *args, **kwargs):
        """Prevent modification of timestamp on existing records."""
        if self.pk:
            # Preserve original timestamp when updating
            original = OrderStatusHistory.objects.get(pk=self.pk)
            self.timestamp = original.timestamp
        super().save(*args, **kwargs)


class RefundRequest(models.Model):
    """
    Refund request model for order refunds.
    
    Allows customers to request refunds and vendors/admins to approve or deny them.
    """
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('denied', 'Denied'),
    )
    
    id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='refund_requests')
    requested_by = models.ForeignKey('auth_api.Customer', on_delete=models.CASCADE, related_name='refund_requests')
    reason = models.TextField(help_text='Reason for refund request')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    processed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_refund_requests',
        help_text='User who approved or denied the refund'
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    denial_reason = models.TextField(null=True, blank=True, help_text='Reason for denial if denied')
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        verbose_name = 'Refund Request'
        verbose_name_plural = 'Refund Requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order', 'status']),
            models.Index(fields=['requested_by', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"Refund Request for Order {self.order.order_uid} - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        """Prevent modification of created_at on existing records."""
        if self.pk:
            original = RefundRequest.objects.get(pk=self.pk)
            self.created_at = original.created_at
        super().save(*args, **kwargs)


class Review(models.Model):
    """
    Customer reviews for completed orders.
    
    One review per order, linking customer, vendor, and order.
    """
    
    id = models.AutoField(primary_key=True)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='review')
    vendor = models.ForeignKey('vendors.Vendor', on_delete=models.CASCADE, related_name='reviews')
    customer = models.ForeignKey('auth_api.Customer', on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    
    class Meta:
        verbose_name = 'Review'
        verbose_name_plural = 'Reviews'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor', 'rating']),
            models.Index(fields=['customer', 'created_at']),
        ]
    
    def __str__(self):
        return f"Review for Order {self.order.order_uid} - {self.rating} stars"
    
    def save(self, *args, **kwargs):
        """Update vendor rating statistics when review is saved and prevent modification of created_at."""
        if self.pk:
            # Preserve original created_at when updating
            original = Review.objects.get(pk=self.pk)
            self.created_at = original.created_at
        super().save(*args, **kwargs)
        self._update_vendor_rating()
    
    def _update_vendor_rating(self):
        """Update vendor's average rating and review count."""
        vendor = self.vendor
        reviews = Review.objects.filter(vendor=vendor)
        if reviews.exists():
            total_rating = sum(review.rating for review in reviews)
            vendor.average_rating = round(total_rating / reviews.count(), 1)
            vendor.review_count = reviews.count()
        else:
            # If no reviews, reset to 0
            vendor.average_rating = 0.0
            vendor.review_count = 0
        vendor.save()
    
    def delete(self, *args, **kwargs):
        """Override delete to update vendor rating when review is deleted."""
        vendor = self.vendor
        super().delete(*args, **kwargs)
        # Recalculate vendor rating after deletion
        reviews = Review.objects.filter(vendor=vendor)
        if reviews.exists():
            total_rating = sum(review.rating for review in reviews)
            vendor.average_rating = round(total_rating / reviews.count(), 1)
            vendor.review_count = reviews.count()
        else:
            vendor.average_rating = 0.0
            vendor.review_count = 0
        vendor.save()
