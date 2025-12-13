"""
Custom authentication backends for email-based authentication.
"""

from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()


class EmailAuthenticationBackend(ModelBackend):
    """
    Custom authentication backend that authenticates users by email instead of username.
    """
    
    def authenticate(self, request, username=None, password=None, email=None, **kwargs):
        """
        Authenticate a user by email and password.
        
        Args:
            request: The HTTP request
            username: Not used, kept for compatibility
            password: User password
            email: User email address
            **kwargs: Additional keyword arguments
        
        Returns:
            User instance if authentication succeeds, None otherwise
        """
        # Use email if provided, otherwise fall back to username (for backward compatibility)
        identifier = email or username
        
        if not identifier or not password:
            return None
        
        try:
            # Try to find user by email
            user = User.objects.get(Q(email=identifier) | Q(username=identifier))
            
            # Check password
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            # Run default password hasher to prevent timing attacks
            User().set_password(password)
        
        return None
    
    def get_user(self, user_id):
        """
        Get user by ID.
        
        Args:
            user_id: User ID
        
        Returns:
            User instance if found, None otherwise
        """
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

