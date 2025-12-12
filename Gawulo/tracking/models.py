"""
Tracking models for the ReachHub Trust as a Service platform.

Defines models for real-time order tracking, location services,
and delivery management with offline capabilities.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from orders.models import Order
from vendors.models import Vendor
import uuid


class DeliveryPartner(models.Model):
    """
    Delivery partner model for managing delivery personnel.
    
    Supports both internal delivery staff and external delivery partners.
    """
    
    PARTNER_TYPES = (
        ('internal', 'Internal Staff'),
        ('external', 'External Partner'),
        ('vendor', 'Vendor Own'),
    )
    
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
        ('offline', 'Offline'),
    )
    
    # Basic Information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='delivery_profile')
    partner_type = models.CharField(max_length=20, choices=PARTNER_TYPES, default='internal')
    
    # Personal Information
    full_name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    id_number = models.CharField(max_length=20, blank=True)
    
    # Vehicle Information
    vehicle_type = models.CharField(max_length=50, blank=True)  # car, motorcycle, bicycle, etc.
    vehicle_registration = models.CharField(max_length=20, blank=True)
    vehicle_color = models.CharField(max_length=30, blank=True)
    vehicle_model = models.CharField(max_length=50, blank=True)
    
    # Status and Availability
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_available = models.BooleanField(default=True)
    current_location_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_location_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    last_location_update = models.DateTimeField(null=True, blank=True)
    
    # Performance Metrics
    total_deliveries = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Working Hours
    working_hours = models.JSONField(default=dict, blank=True)
    preferred_areas = models.JSONField(default=list, blank=True)
    
    # Verification
    is_verified = models.BooleanField(default=False)
    verification_documents = models.JSONField(default=list, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Delivery Partner'
        verbose_name_plural = 'Delivery Partners'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.full_name} ({self.get_partner_type_display()})"
    
    def is_online(self):
        """Check if delivery partner is currently online and available."""
        if not self.is_available or self.status != 'active':
            return False
        
        # Check if location was updated recently (within last 10 minutes)
        if self.last_location_update:
            time_diff = timezone.now() - self.last_location_update
            return time_diff.total_seconds() < 600  # 10 minutes
        
        return False
    
    def update_location(self, latitude, longitude):
        """Update current location."""
        self.current_location_lat = latitude
        self.current_location_lng = longitude
        self.last_location_update = timezone.now()
        self.save()
    
    def get_active_deliveries(self):
        """Get currently active deliveries for this partner."""
        return self.deliveries.filter(status__in=['assigned', 'picked_up', 'out_for_delivery'])


class Delivery(models.Model):
    """
    Delivery model for tracking individual deliveries.
    
    Links orders to delivery partners and tracks delivery progress.
    """
    
    DELIVERY_STATUS = (
        ('pending', 'Pending Assignment'),
        ('assigned', 'Assigned to Partner'),
        ('picked_up', 'Picked Up from Vendor'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    )
    
    # Basic Information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery')
    delivery_partner = models.ForeignKey(DeliveryPartner, on_delete=models.SET_NULL, 
                                       null=True, blank=True, related_name='deliveries')
    
    # Delivery Details
    pickup_address = models.TextField()
    delivery_address = models.TextField()
    pickup_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    pickup_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    delivery_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    delivery_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Status and Tracking
    status = models.CharField(max_length=20, choices=DELIVERY_STATUS, default='pending')
    estimated_pickup_time = models.DateTimeField(null=True, blank=True)
    estimated_delivery_time = models.DateTimeField(null=True, blank=True)
    actual_pickup_time = models.DateTimeField(null=True, blank=True)
    actual_delivery_time = models.DateTimeField(null=True, blank=True)
    
    # Delivery Instructions
    special_instructions = models.TextField(blank=True)
    customer_contact = models.CharField(max_length=15, blank=True)
    customer_name = models.CharField(max_length=200, blank=True)
    
    # Financial Information
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    partner_commission = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Delivery'
        verbose_name_plural = 'Deliveries'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Delivery for Order #{self.order.order_number}"
    
    def assign_partner(self, partner):
        """Assign delivery partner to this delivery."""
        self.delivery_partner = partner
        self.status = 'assigned'
        self.save()
    
    def mark_picked_up(self):
        """Mark delivery as picked up."""
        self.status = 'picked_up'
        self.actual_pickup_time = timezone.now()
        self.save()
    
    def mark_out_for_delivery(self):
        """Mark delivery as out for delivery."""
        self.status = 'out_for_delivery'
        self.save()
    
    def mark_delivered(self):
        """Mark delivery as completed."""
        self.status = 'delivered'
        self.actual_delivery_time = timezone.now()
        self.save()
    
    def get_estimated_duration(self):
        """Get estimated delivery duration in minutes."""
        if self.estimated_pickup_time and self.estimated_delivery_time:
            duration = self.estimated_delivery_time - self.estimated_pickup_time
            return int(duration.total_seconds() / 60)
        return None


class LocationUpdate(models.Model):
    """
    Track location updates for delivery partners and orders.
    
    Stores historical location data for tracking and analytics.
    """
    
    UPDATE_TYPES = (
        ('delivery_partner', 'Delivery Partner'),
        ('order_tracking', 'Order Tracking'),
        ('vendor_location', 'Vendor Location'),
    )
    
    # Basic Information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    update_type = models.CharField(max_length=20, choices=UPDATE_TYPES)
    
    # Location Data
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    accuracy = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    speed = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    heading = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Related Objects
    delivery_partner = models.ForeignKey(DeliveryPartner, on_delete=models.CASCADE, 
                                       null=True, blank=True, related_name='location_updates')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, 
                            null=True, blank=True, related_name='location_updates')
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, 
                             null=True, blank=True, related_name='location_updates')
    
    # Metadata
    device_info = models.JSONField(default=dict, blank=True)
    battery_level = models.PositiveIntegerField(null=True, blank=True)
    network_type = models.CharField(max_length=20, blank=True)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Location Update'
        verbose_name_plural = 'Location Updates'
    
    def __str__(self):
        return f"{self.update_type} - {self.latitude}, {self.longitude}"


class DeliveryRoute(models.Model):
    """
    Store optimized delivery routes for delivery partners.
    """
    
    delivery_partner = models.ForeignKey(DeliveryPartner, on_delete=models.CASCADE, 
                                       related_name='routes')
    route_data = models.JSONField()  # Store route coordinates and waypoints
    estimated_duration = models.PositiveIntegerField(help_text="Duration in minutes")
    estimated_distance = models.DecimalField(max_digits=8, decimal_places=2, 
                                           help_text="Distance in kilometers")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Delivery Route'
        verbose_name_plural = 'Delivery Routes'
    
    def __str__(self):
        return f"Route for {self.delivery_partner.full_name}"


class DeliveryZone(models.Model):
    """
    Define delivery zones for efficient delivery management.
    """
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Zone Boundaries (simplified as center point and radius)
    center_latitude = models.DecimalField(max_digits=9, decimal_places=6)
    center_longitude = models.DecimalField(max_digits=9, decimal_places=6)
    radius_km = models.DecimalField(max_digits=5, decimal_places=2)
    
    # Delivery Settings
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estimated_delivery_time = models.PositiveIntegerField(default=45, 
                                                        help_text="Estimated time in minutes")
    
    # Status
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Delivery Zone'
        verbose_name_plural = 'Delivery Zones'
    
    def __str__(self):
        return f"{self.name} - {self.radius_km}km radius"
    
    def is_point_in_zone(self, latitude, longitude):
        """Check if a point is within this delivery zone."""
        from math import radians, cos, sin, asin, sqrt
        
        # Convert to radians
        lat1, lon1 = radians(self.center_latitude), radians(self.center_longitude)
        lat2, lon2 = radians(latitude), radians(longitude)
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        distance = 6371 * c  # Earth's radius in km
        
        return distance <= self.radius_km


class DeliveryAnalytics(models.Model):
    """
    Store delivery analytics and performance metrics.
    """
    
    delivery_partner = models.ForeignKey(DeliveryPartner, on_delete=models.CASCADE, 
                                       related_name='analytics')
    date = models.DateField()
    
    # Metrics
    total_deliveries = models.PositiveIntegerField(default=0)
    completed_deliveries = models.PositiveIntegerField(default=0)
    failed_deliveries = models.PositiveIntegerField(default=0)
    total_distance = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    average_delivery_time = models.PositiveIntegerField(default=0, 
                                                      help_text="Average time in minutes")
    
    # Customer Satisfaction
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_ratings = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['delivery_partner', 'date']
        ordering = ['-date']
        verbose_name = 'Delivery Analytics'
        verbose_name_plural = 'Delivery Analytics'
    
    def __str__(self):
        return f"Analytics for {self.delivery_partner.full_name} - {self.date}"
    
    def get_completion_rate(self):
        """Calculate delivery completion rate."""
        if self.total_deliveries > 0:
            return (self.completed_deliveries / self.total_deliveries) * 100
        return 0
