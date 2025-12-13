"""
Utility functions for authentication and permissions.
"""

from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import secrets
from .models import UserPermissions, OTPVerification


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


def generate_otp_for_user(user):
    """
    Generate and store an OTP for a user.
    
    Args:
        user: User instance
    
    Returns:
        tuple: (otp_code, session_token, otp_verification_instance)
    """
    # Get OTP expiry time from settings (default 10 minutes)
    expiry_minutes = getattr(settings, 'OTP_EXPIRY_MINUTES', 10)
    expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
    
    # Generate session token
    session_token = secrets.token_urlsafe(32)
    
    # Create OTP verification record
    otp_verification = OTPVerification.objects.create(
        user=user,
        expires_at=expires_at,
        session_token=session_token
    )
    
    # Generate OTP code
    otp_code = otp_verification.generate_otp()
    
    return otp_code, session_token, otp_verification


def send_otp_email(user, otp_code):
    """
    Send OTP code to user via email.
    
    Args:
        user: User instance
        otp_code: The OTP code to send
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Get OTP expiry time from settings
        expiry_minutes = getattr(settings, 'OTP_EXPIRY_MINUTES', 10)
        
        subject = 'Your Two-Factor Authentication Code'
        message = f"""
Hello {user.get_full_name() or user.email},

Your two-factor authentication code is: {otp_code}

This code will expire in {expiry_minutes} minutes.

If you did not request this code, please ignore this email.

Best regards,
Gawulo Team
"""
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@gawulo.com')
        
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[user.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        # Log error in production
        print(f"Error sending OTP email: {e}")
        return False

