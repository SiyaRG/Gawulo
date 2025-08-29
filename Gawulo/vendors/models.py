"""
Vendor models for the Gawulo offline-first food ordering system.

Defines models for vendor profiles, menus, business information,
and offline-capable operations.
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid


class Vendor(models.Model):
    """
    Vendor profile model for food vendors in townships.
    
    Supports offline operations and data synchronization.
    """
    
    VENDOR_STATUS = (
        ('pending', 'Pending Approval'),
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('inactive', 'Inactive'),
    )
    
    BUSINESS_TYPES = (
        ('street_food', 'Street Food'),
        ('home_kitchen', 'Home Kitchen'),
        ('restaurant', 'Restaurant'),
        ('catering', 'Catering'),
        ('bakery', 'Bakery'),
        ('other', 'Other'),
    )
    
    # Basic Information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vendor_profile')
    business_name = models.CharField(max_length=200)
    business_type = models.CharField(max_length=20, choices=BUSINESS_TYPES)
    description = models.TextField(blank=True)
    
    # Contact Information
    phone_number = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    address = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Business Information
    operating_hours = models.JSONField(default=dict)  # Store as JSON for flexibility
    delivery_radius = models.PositiveIntegerField(default=5, help_text="Delivery radius in kilometers")
    minimum_order = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Status and Verification
    status = models.CharField(max_length=20, choices=VENDOR_STATUS, default='pending')
    is_verified = models.BooleanField(default=False)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, 
                               validators=[MinValueValidator(0), MaxValueValidator(5)])
    total_orders = models.PositiveIntegerField(default=0)
    
    # Offline Support
    offline_capable = models.BooleanField(default=True)
    last_sync = models.DateTimeField(null=True, blank=True)
    sync_status = models.CharField(max_length=20, default='synced')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Vendor'
        verbose_name_plural = 'Vendors'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.business_name} - {self.user.username}"
    
    def get_average_rating(self):
        """Calculate average rating from reviews."""
        reviews = self.reviews.all()
        if reviews:
            return sum(review.rating for review in reviews) / len(reviews)
        return 0
    
    def is_operating_now(self):
        """Check if vendor is currently operating based on operating hours."""
        # Implementation would check current time against operating_hours
        return True  # Placeholder
    
    def can_accept_orders(self):
        """Check if vendor can accept new orders."""
        return (self.status == 'active' and 
                self.is_verified and 
                self.is_operating_now())


class MenuCategory(models.Model):
    """Menu category for organizing vendor menu items."""
    
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='menu_categories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['sort_order', 'name']
        unique_together = ['vendor', 'name']
    
    def __str__(self):
        return f"{self.vendor.business_name} - {self.name}"


class MenuItem(models.Model):
    """
    Menu item model for vendor food items.
    
    Supports offline operations and real-time availability updates.
    """
    
    AVAILABILITY_STATUS = (
        ('available', 'Available'),
        ('unavailable', 'Unavailable'),
        ('out_of_stock', 'Out of Stock'),
    )
    
    # Basic Information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='menu_items')
    category = models.ForeignKey(MenuCategory, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Pricing and Availability
    price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    availability_status = models.CharField(max_length=20, choices=AVAILABILITY_STATUS, default='available')
    is_featured = models.BooleanField(default=False)
    
    # Images and Media
    image = models.ImageField(upload_to='menu_items/', blank=True, null=True)
    
    # Preparation and Delivery
    preparation_time = models.PositiveIntegerField(default=30, help_text="Preparation time in minutes")
    allergens = models.JSONField(default=list, blank=True)
    dietary_info = models.JSONField(default=dict, blank=True)
    
    # Offline Support
    offline_available = models.BooleanField(default=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category__sort_order', 'name']
        unique_together = ['vendor', 'name']
    
    def __str__(self):
        return f"{self.vendor.business_name} - {self.name}"
    
    def is_available(self):
        """Check if item is currently available."""
        return self.availability_status == 'available'
    
    def get_discount_percentage(self):
        """Calculate discount percentage if original price exists."""
        if self.original_price and self.original_price > self.price:
            return ((self.original_price - self.price) / self.original_price) * 100
        return 0


class VendorReview(models.Model):
    """Customer reviews for vendors."""
    
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='reviews')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vendor_reviews')
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    is_verified_purchase = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['vendor', 'customer']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Review by {self.customer.username} for {self.vendor.business_name}"


class VendorEarnings(models.Model):
    """Track vendor earnings and financial information."""
    
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='earnings')
    date = models.DateField()
    total_orders = models.PositiveIntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['vendor', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.vendor.business_name} - {self.date} - R{self.net_earnings}"


class VendorDocument(models.Model):
    """Store vendor verification documents."""
    
    DOCUMENT_TYPES = (
        ('id_document', 'ID Document'),
        ('business_license', 'Business License'),
        ('food_handling_cert', 'Food Handling Certificate'),
        ('tax_clearance', 'Tax Clearance Certificate'),
        ('other', 'Other'),
    )
    
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=30, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to='vendor_documents/')
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.vendor.business_name} - {self.get_document_type_display()}"
