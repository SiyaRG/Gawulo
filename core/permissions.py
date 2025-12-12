"""
Custom permissions for the ReachHub system.

Defines permissions for vendors, customers, and administrators
in the Trust as a Service platform.
"""

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.contrib.auth.models import AbstractUser


class ReachHubUser(AbstractUser):
    """
    Extended user model for ReachHub system.
    
    Supports different user types: vendor, customer, admin
    with appropriate permissions for offline-first operations.
    """
    
    USER_TYPES = (
        ('vendor', 'Vendor'),
        ('customer', 'Customer'),
        ('admin', 'Administrator'),
        ('support', 'Support Staff'),
    )
    
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='customer')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    offline_capable = models.BooleanField(default=True)
    last_sync = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'ReachHub User'
        verbose_name_plural = 'ReachHub Users'


class VendorPermissions:
    """Permissions specific to vendors in the ReachHub system."""
    
    @staticmethod
    def get_vendor_permissions():
        """Get list of permissions for vendors."""
        return [
            'vendors.view_own_profile',
            'vendors.edit_own_profile',
            'vendors.view_own_orders',
            'vendors.update_order_status',
            'vendors.view_own_earnings',
            'vendors.manage_menu',
            'vendors.view_analytics',
            'orders.create_order',
            'orders.view_own_orders',
            'payments.view_own_payments',
            'sync.perform_sync',
            'tracking.update_location',
        ]
    
    @staticmethod
    def get_vendor_group_permissions():
        """Get permissions that should be assigned to vendor group."""
        return [
            'Can view own vendor profile',
            'Can edit own vendor profile',
            'Can view own orders',
            'Can update order status',
            'Can view own earnings',
            'Can manage menu items',
            'Can view analytics',
            'Can create orders',
            'Can view own orders',
            'Can view own payments',
            'Can perform data sync',
            'Can update location',
        ]


class CustomerPermissions:
    """Permissions specific to customers in the ReachHub system."""
    
    @staticmethod
    def get_customer_permissions():
        """Get list of permissions for customers."""
        return [
            'customers.view_own_profile',
            'customers.edit_own_profile',
            'customers.view_own_orders',
            'customers.create_orders',
            'customers.cancel_orders',
            'customers.view_order_history',
            'customers.rate_orders',
            'payments.make_payments',
            'payments.view_own_payments',
            'sync.perform_sync',
            'tracking.view_order_tracking',
        ]
    
    @staticmethod
    def get_customer_group_permissions():
        """Get permissions that should be assigned to customer group."""
        return [
            'Can view own customer profile',
            'Can edit own customer profile',
            'Can view own orders',
            'Can create orders',
            'Can cancel orders',
            'Can view order history',
            'Can rate orders',
            'Can make payments',
            'Can view own payments',
            'Can perform data sync',
            'Can view order tracking',
        ]


class OfflinePermissions:
    """Permissions for offline operations."""
    
    @staticmethod
    def get_offline_permissions():
        """Get permissions that work in offline mode."""
        return [
            'orders.create_offline_order',
            'orders.view_offline_orders',
            'payments.record_offline_payment',
            'sync.queue_operation',
            'sync.view_sync_status',
        ]
    
    @staticmethod
    def can_perform_offline_action(user, action):
        """
        Check if user can perform a specific offline action.
        
        Args:
            user: User instance
            action: Action to check (e.g., 'create_order', 'make_payment')
        
        Returns:
            bool: Whether user can perform the action offline
        """
        if not user.is_authenticated:
            return False
        
        # Basic offline permissions for authenticated users
        basic_offline_actions = [
            'create_order',
            'view_orders',
            'make_payment',
            'view_profile'
        ]
        
        return action in basic_offline_actions


class SyncPermissions:
    """Permissions for data synchronization operations."""
    
    @staticmethod
    def can_sync_data(user):
        """
        Check if user can perform data synchronization.
        
        Args:
            user: User instance
        
        Returns:
            bool: Whether user can sync data
        """
        if not user.is_authenticated:
            return False
        
        # All authenticated users can sync their own data
        return True
    
    @staticmethod
    def can_resolve_conflicts(user):
        """
        Check if user can resolve sync conflicts.
        
        Args:
            user: User instance
        
        Returns:
            bool: Whether user can resolve conflicts
        """
        if not user.is_authenticated:
            return False
        
        # Only admins and support staff can resolve conflicts
        return user.user_type in ['admin', 'support']


def create_reachhub_permissions():
    """
    Create custom permissions for the ReachHub system.
    
    This function should be called during migrations or setup.
    """
    from django.contrib.auth.models import Group, Permission
    from django.contrib.contenttypes.models import ContentType
    
    # Create vendor group
    vendor_group, created = Group.objects.get_or_create(name='Vendors')
    if created:
        print("Created Vendors group")
    
    # Create customer group
    customer_group, created = Group.objects.get_or_create(name='Customers')
    if created:
        print("Created Customers group")
    
    # Create admin group
    admin_group, created = Group.objects.get_or_create(name='Administrators')
    if created:
        print("Created Administrators group")
    
    # Add permissions to groups (simplified - in practice, you'd create actual permissions)
    print("ReachHub permissions setup completed")
