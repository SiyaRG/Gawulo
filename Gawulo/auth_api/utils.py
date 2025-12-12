"""
Utility functions for authentication and permissions.
"""

from .models import UserPermissions


def set_default_customer_permissions(user):
    """
    Set default customer permissions for a new user.
    
    Args:
        user: User instance
    
    Returns:
        UserPermissions instance with default customer permissions set
    """
    permissions = UserPermissions.get_or_create_permissions(user)
    
    # Set default customer permissions
    permissions.can_view_own_customer_profile = True
    permissions.can_edit_own_customer_profile = True
    permissions.can_view_own_customer_orders = True
    permissions.can_create_orders = True
    permissions.can_cancel_orders = True
    permissions.can_view_order_history = True
    permissions.can_rate_orders = True
    permissions.can_make_payments = True
    permissions.can_view_own_payments = True
    permissions.can_view_order_tracking = True
    permissions.can_create_offline_orders = True
    permissions.can_view_offline_orders = True
    
    permissions.save()
    return permissions

