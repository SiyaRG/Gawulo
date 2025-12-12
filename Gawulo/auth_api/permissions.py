"""
Django REST Framework permission classes for granular permissions.

Provides permission classes that can be used to protect API views
based on granular permissions stored in the UserPermissions model.
"""

from rest_framework import permissions
from .models import UserPermissions


class HasGranularPermission(permissions.BasePermission):
    """
    Permission class that checks if a user has a specific granular permission.
    
    Usage:
        permission_classes = [HasGranularPermission('can_view_own_vendor_profile')]
    """
    
    def __init__(self, permission_field_name):
        """
        Initialize with a permission field name.
        
        Args:
            permission_field_name: The permission field name to check (e.g., 'can_view_own_vendor_profile')
        """
        self.permission_field_name = permission_field_name
    
    def has_permission(self, request, view):
        """
        Check if the user has the required permission.
        
        Args:
            request: The request object
            view: The view being accessed
        
        Returns:
            bool: True if user has permission, False otherwise
        """
        if not request.user or not request.user.is_authenticated:
            return False
        
        return UserPermissions.user_has_permission(request.user, self.permission_field_name)


class HasAnyGranularPermission(permissions.BasePermission):
    """
    Permission class that checks if a user has any of the specified permissions.
    
    Usage:
        permission_classes = [HasAnyGranularPermission(['can_view_own_vendor_profile', 'can_edit_own_vendor_profile'])]
    """
    
    def __init__(self, permission_field_names):
        """
        Initialize with a list of permission field names.
        
        Args:
            permission_field_names: List of permission field names to check
        """
        self.permission_field_names = permission_field_names
    
    def has_permission(self, request, view):
        """
        Check if the user has any of the required permissions.
        
        Args:
            request: The request object
            view: The view being accessed
        
        Returns:
            bool: True if user has at least one permission, False otherwise
        """
        if not request.user or not request.user.is_authenticated:
            return False
        
        return UserPermissions.user_has_any_permission(request.user, self.permission_field_names)


class HasAllGranularPermissions(permissions.BasePermission):
    """
    Permission class that checks if a user has all of the specified permissions.
    
    Usage:
        permission_classes = [HasAllGranularPermissions(['can_view_own_vendor_profile', 'can_edit_own_vendor_profile'])]
    """
    
    def __init__(self, permission_field_names):
        """
        Initialize with a list of permission field names.
        
        Args:
            permission_field_names: List of permission field names to check
        """
        self.permission_field_names = permission_field_names
    
    def has_permission(self, request, view):
        """
        Check if the user has all of the required permissions.
        
        Args:
            request: The request object
            view: The view being accessed
        
        Returns:
            bool: True if user has all permissions, False otherwise
        """
        if not request.user or not request.user.is_authenticated:
            return False
        
        return UserPermissions.user_has_all_permissions(request.user, self.permission_field_names)


class IsOwnerOrHasPermission(permissions.BasePermission):
    """
    Permission class that allows access if user owns the resource OR has a specific permission.
    
    Usage:
        permission_classes = [IsOwnerOrHasPermission('can_view_all_vendors')]
        
        In your view, implement get_object_owner() method that returns the owner of the object.
    """
    
    def __init__(self, permission_field_name):
        """
        Initialize with a permission field name.
        
        Args:
            permission_field_name: The permission field name to check if user is not the owner
        """
        self.permission_field_name = permission_field_name
    
    def has_permission(self, request, view):
        """
        Check if the user has permission to access the view.
        
        Args:
            request: The request object
            view: The view being accessed
        
        Returns:
            bool: True if user is authenticated, False otherwise
        """
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Check if the user has permission to access the specific object.
        
        Args:
            request: The request object
            view: The view being accessed
            obj: The object being accessed
        
        Returns:
            bool: True if user owns the object or has the permission
        """
        # Check if user has the permission (allows viewing all objects)
        if UserPermissions.user_has_permission(request.user, self.permission_field_name):
            return True
        
        # Check if user owns the object
        if hasattr(view, 'get_object_owner'):
            owner = view.get_object_owner(obj)
            return owner == request.user
        
        # Default: check if object has a user attribute
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Default: check if object has an owner attribute
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        
        # If we can't determine ownership, deny access
        return False

