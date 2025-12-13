"""
Authentication and user-related models for the Gawulo platform.

Defines models for user authentication, password reset, customer profiles,
addresses, and user documents.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import hashlib
import secrets


class PasswordResetToken(models.Model):
    """
    Password reset token model for secure password reset functionality.
    
    Stores hashed tokens with expiration dates and usage tracking.
    """
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token_hash = models.CharField(max_length=64, null=True, blank=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    
    class Meta:
        verbose_name = 'Password Reset Token'
        verbose_name_plural = 'Password Reset Tokens'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Password reset token for {self.user.email} - {self.created_at}"
    
    def generate_token(self):
        """Generate a secure random token and store its hash."""
        token = secrets.token_urlsafe(32)
        self.token_hash = hashlib.sha256(token.encode()).hexdigest()
        self.save()
        return token
    
    def verify_token(self, token):
        """Verify if the provided token matches the stored hash."""
        if self.is_used:
            return False
        if timezone.now() > self.expires_at:
            return False
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        return token_hash == self.token_hash
    
    def mark_as_used(self):
        """Mark the token as used."""
        self.is_used = True
        self.save()
    
    def save(self, *args, **kwargs):
        """Prevent modification of created_at on existing records."""
        if self.pk:
            # Preserve original created_at when updating
            original = PasswordResetToken.objects.get(pk=self.pk)
            self.created_at = original.created_at
        super().save(*args, **kwargs)


class OTPVerification(models.Model):
    """
    OTP verification model for two-factor authentication.
    
    Stores hashed OTP codes with expiration dates and usage tracking.
    """
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_verifications')
    otp_hash = models.CharField(max_length=64)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    session_token = models.CharField(max_length=64, unique=True, null=True, blank=True)
    
    class Meta:
        verbose_name = 'OTP Verification'
        verbose_name_plural = 'OTP Verifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_used', 'expires_at']),
            models.Index(fields=['session_token']),
        ]
    
    def __str__(self):
        return f"OTP for {self.user.email} - {self.created_at}"
    
    def generate_otp(self):
        """Generate a secure 6-digit OTP and store its hash."""
        import random
        otp = str(random.randint(100000, 999999))
        self.otp_hash = hashlib.sha256(otp.encode()).hexdigest()
        self.save()
        return otp
    
    def verify_otp(self, otp):
        """Verify if the provided OTP matches the stored hash."""
        if self.is_used:
            return False
        if timezone.now() > self.expires_at:
            return False
        otp_hash = hashlib.sha256(otp.encode()).hexdigest()
        return otp_hash == self.otp_hash
    
    def mark_as_used(self):
        """Mark the OTP as used."""
        self.is_used = True
        self.save()
    
    def is_valid(self):
        """Check if OTP is still valid (not used and not expired)."""
        return not self.is_used and timezone.now() <= self.expires_at


class OAuthAccount(models.Model):
    """
    OAuth account model for linking social authentication providers to users.
    
    Stores provider information and links to user accounts.
    """
    
    PROVIDER_CHOICES = (
        ('google', 'Google'),
        ('facebook', 'Facebook'),
    )
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='oauth_accounts')
    provider = models.CharField(max_length=50, choices=PROVIDER_CHOICES)
    provider_user_id = models.CharField(max_length=255)
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    
    class Meta:
        verbose_name = 'OAuth Account'
        verbose_name_plural = 'OAuth Accounts'
        ordering = ['-created_at']
        unique_together = [['provider', 'provider_user_id']]
        indexes = [
            models.Index(fields=['provider', 'provider_user_id']),
            models.Index(fields=['user', 'provider']),
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return f"{self.provider} account for {self.email}"


class Customer(models.Model):
    """
    Customer profile model extending Django User.
    
    Stores customer-specific information and supports soft deletes.
    """
    
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    display_name = models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.display_name} ({self.user.email})"
    
    def soft_delete(self):
        """Perform soft delete by setting deleted_at timestamp."""
        if not self.deleted_at:
            self.deleted_at = timezone.now()
            self.save()
    
    def restore(self):
        """Restore a soft-deleted customer."""
        if self.deleted_at:
            self.deleted_at = None
            self.save()
    
    @property
    def is_deleted(self):
        """Check if customer is soft-deleted."""
        return self.deleted_at is not None
    
    def save(self, *args, **kwargs):
        """Prevent modification of created_at on existing records."""
        if self.pk:
            # Preserve original created_at when updating
            original = Customer.objects.get(pk=self.pk)
            self.created_at = original.created_at
        super().save(*args, **kwargs)


class UserProfile(models.Model):
    """
    User profile model extending Django User with contact, location, and language information.
    
    Provides phone number, country, country code, address linking, and language preferences for all users.
    """
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        primary_key=True,
        help_text="User this profile belongs to"
    )
    phone_number = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        help_text="User's phone number"
    )
    country_code = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="Country calling code (e.g., +1, +27)"
    )
    primary_address = models.ForeignKey(
        'auth_api.Address',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='primary_address_users',
        help_text="User's primary address"
    )
    primary_language = models.ForeignKey(
        'lookups.Language',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='primary_language_users',
        help_text="User's primary/preferred language"
    )
    languages = models.ManyToManyField(
        'lookups.Language',
        related_name='users',
        blank=True,
        help_text="Languages the user speaks/understands"
    )
    two_factor_enabled = models.BooleanField(
        default=False,
        help_text="Whether two-factor authentication is enabled for this user"
    )
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
    
    def __str__(self):
        return f"Profile for {self.user.username}"
    
    def save(self, *args, **kwargs):
        """Auto-populate country_code from primary_address country if not provided."""
        if not self.country_code and self.primary_address and self.primary_address.country:
            try:
                country_codes = self.primary_address.country.codes
                if country_codes and country_codes.calling_code:
                    self.country_code = f"+{country_codes.calling_code}"
            except (AttributeError, Exception):
                # Country codes may not exist for this country
                pass
        super().save(*args, **kwargs)
    
    @classmethod
    def get_or_create_profile(cls, user):
        """
        Get or create profile for a user.
        
        Args:
            user: User instance
        
        Returns:
            UserProfile instance
        """
        profile, created = cls.objects.get_or_create(user=user)
        return profile


class Address(models.Model):
    """
    Polymorphic address model for any entity type.
    
    Can be used for customers, vendors, orders, or any other entity
    that needs address information. Now also supports direct User linking.
    """
    
    ADDRESS_TYPES = (
        ('billing', 'Billing'),
        ('shipping', 'Shipping'),
        ('business', 'Business'),
        ('residential', 'Residential'),
        ('pickup', 'Pickup'),
        ('delivery', 'Delivery'),
    )
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='addresses',
        null=True,
        blank=True,
        help_text="User this address belongs to (if applicable)"
    )
    entity_type = models.CharField(max_length=50, null=True, blank=True)
    entity_id = models.IntegerField(null=True, blank=True)
    address_type = models.CharField(max_length=50, choices=ADDRESS_TYPES, null=True, blank=True)
    line1 = models.CharField(max_length=255)
    line2 = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=100)
    state_province = models.CharField(max_length=100, null=True, blank=True)
    postal_code = models.CharField(max_length=20)
    country = models.ForeignKey(
        'lookups.Country',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='addresses',
        help_text="Country for this address"
    )
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    
    class Meta:
        verbose_name = 'Address'
        verbose_name_plural = 'Addresses'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        country_name = self.country.name if self.country else 'N/A'
        return f"{self.line1}, {self.city}, {self.postal_code}, {country_name}"
    
    def get_full_address(self):
        """Get formatted full address string."""
        parts = [self.line1]
        if self.line2:
            parts.append(self.line2)
        country_name = self.country.name if self.country else ''
        parts.extend([self.city, self.state_province, self.postal_code, country_name])
        return ', '.join(filter(None, parts))
    
    def save(self, *args, **kwargs):
        """Prevent modification of created_at on existing records."""
        if self.pk:
            # Preserve original created_at when updating
            original = Address.objects.get(pk=self.pk)
            self.created_at = original.created_at
        super().save(*args, **kwargs)


class UserDocument(models.Model):
    """
    Document storage model for user-related documents.
    
    Stores file metadata and storage paths for user documents.
    """
    
    DOCUMENT_TYPES = (
        ('id_document', 'ID Document'),
        ('proof_of_address', 'Proof of Address'),
        ('profile_picture', 'Profile Picture'),
        ('other', 'Other'),
        ('proof_of_account', 'Proof of Account'),
    )
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    file_name = models.CharField(max_length=255)
    document_type = models.CharField(max_length=100, choices=DOCUMENT_TYPES, null=True, blank=True)
    file = models.FileField(
        upload_to='user_documents/',
        null=True,
        blank=True,
        help_text="Uploaded file"
    )
    external_url = models.URLField(
        max_length=500,
        null=True,
        blank=True,
        help_text="External URL for the document (e.g., OAuth profile picture)"
    )
    storage_path = models.CharField(max_length=512, null=True, blank=True)
    mime_type = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    
    class Meta:
        verbose_name = 'User Document'
        verbose_name_plural = 'User Documents'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.file_name} - {self.user.email}"
    
    def save(self, *args, **kwargs):
        """Prevent modification of created_at on existing records."""
        if self.pk:
            # Preserve original created_at when updating
            original = UserDocument.objects.get(pk=self.pk)
            self.created_at = original.created_at
        super().save(*args, **kwargs)


class UserPermissions(models.Model):
    """
    Granular permissions model with boolean fields for each permission.
    
    One-to-one relationship with User. Each user has a single permissions record
    with boolean flags for each granular permission.
    """
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='permissions',
        primary_key=True,
        help_text="User this permissions record belongs to"
    )
    
    # Vendor permissions
    can_view_own_vendor_profile = models.BooleanField(default=False, help_text="Can view own vendor profile")
    can_edit_own_vendor_profile = models.BooleanField(default=False, help_text="Can edit own vendor profile")
    can_view_own_vendor_orders = models.BooleanField(default=False, help_text="Can view own vendor orders")
    can_update_order_status = models.BooleanField(default=False, help_text="Can update order status")
    can_view_own_vendor_earnings = models.BooleanField(default=False, help_text="Can view own vendor earnings")
    can_manage_vendor_menu = models.BooleanField(default=False, help_text="Can manage vendor menu items")
    can_view_vendor_analytics = models.BooleanField(default=False, help_text="Can view vendor analytics")
    
    # Customer permissions
    can_view_own_customer_profile = models.BooleanField(default=False, help_text="Can view own customer profile")
    can_edit_own_customer_profile = models.BooleanField(default=False, help_text="Can edit own customer profile")
    can_view_own_customer_orders = models.BooleanField(default=False, help_text="Can view own customer orders")
    can_create_orders = models.BooleanField(default=False, help_text="Can create orders")
    can_cancel_orders = models.BooleanField(default=False, help_text="Can cancel orders")
    can_view_order_history = models.BooleanField(default=False, help_text="Can view order history")
    can_rate_orders = models.BooleanField(default=False, help_text="Can rate orders")
    
    # Payment permissions
    can_make_payments = models.BooleanField(default=False, help_text="Can make payments")
    can_view_own_payments = models.BooleanField(default=False, help_text="Can view own payments")
    can_view_all_payments = models.BooleanField(default=False, help_text="Can view all payments (admin)")
    can_process_refunds = models.BooleanField(default=False, help_text="Can process refunds")
    
    # Order permissions
    can_view_all_orders = models.BooleanField(default=False, help_text="Can view all orders (admin)")
    can_manage_orders = models.BooleanField(default=False, help_text="Can manage all orders (admin)")
    
    # Sync permissions
    can_perform_sync = models.BooleanField(default=False, help_text="Can perform data synchronization")
    can_resolve_sync_conflicts = models.BooleanField(default=False, help_text="Can resolve sync conflicts")
    can_view_sync_status = models.BooleanField(default=False, help_text="Can view sync status")
    
    # Tracking permissions
    can_update_location = models.BooleanField(default=False, help_text="Can update delivery location")
    can_view_order_tracking = models.BooleanField(default=False, help_text="Can view order tracking")
    can_manage_deliveries = models.BooleanField(default=False, help_text="Can manage deliveries (admin)")
    
    # Admin permissions
    can_view_all_vendors = models.BooleanField(default=False, help_text="Can view all vendors (admin)")
    can_manage_vendors = models.BooleanField(default=False, help_text="Can manage vendors (admin)")
    can_view_all_customers = models.BooleanField(default=False, help_text="Can view all customers (admin)")
    can_manage_customers = models.BooleanField(default=False, help_text="Can manage customers (admin)")
    can_view_audit_logs = models.BooleanField(default=False, help_text="Can view audit logs")
    can_manage_system_settings = models.BooleanField(default=False, help_text="Can manage system settings")
    
    # Offline permissions
    can_create_offline_orders = models.BooleanField(default=False, help_text="Can create orders offline")
    can_view_offline_orders = models.BooleanField(default=False, help_text="Can view offline orders")
    can_record_offline_payments = models.BooleanField(default=False, help_text="Can record offline payments")
    
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User Permissions'
        verbose_name_plural = 'User Permissions'
    
    def __str__(self):
        return f"Permissions for {self.user.username}"
    
    @classmethod
    def get_or_create_permissions(cls, user):
        """
        Get or create permissions record for a user.
        
        Args:
            user: User instance
        
        Returns:
            UserPermissions instance
        """
        permissions, created = cls.objects.get_or_create(user=user)
        return permissions
    
    def has_permission(self, permission_field_name):
        """
        Check if user has a specific permission by field name.
        
        Args:
            permission_field_name: Name of the permission field (e.g., 'can_view_own_vendor_profile')
        
        Returns:
            bool: True if user has the permission, False otherwise
        """
        if not hasattr(self, permission_field_name):
            return False
        return getattr(self, permission_field_name, False)
    
    @classmethod
    def user_has_permission(cls, user, permission_field_name):
        """
        Check if a user has a specific permission.
        
        Args:
            user: User instance
            permission_field_name: Name of the permission field (e.g., 'can_view_own_vendor_profile')
        
        Returns:
            bool: True if user has the permission, False otherwise
        """
        if not user or not user.is_authenticated:
            return False
        
        # Superusers have all permissions
        if user.is_superuser:
            return True
        
        try:
            permissions = cls.objects.get(user=user)
            return permissions.has_permission(permission_field_name)
        except cls.DoesNotExist:
            return False
    
    @classmethod
    def user_has_any_permission(cls, user, permission_field_names):
        """
        Check if a user has any of the specified permissions.
        
        Args:
            user: User instance
            permission_field_names: List of permission field names to check
        
        Returns:
            bool: True if user has at least one of the permissions
        """
        if not user or not user.is_authenticated:
            return False
        
        if user.is_superuser:
            return True
        
        try:
            permissions = cls.objects.get(user=user)
            return any(permissions.has_permission(name) for name in permission_field_names)
        except cls.DoesNotExist:
            return False
    
    @classmethod
    def user_has_all_permissions(cls, user, permission_field_names):
        """
        Check if a user has all of the specified permissions.
        
        Args:
            user: User instance
            permission_field_names: List of permission field names to check
        
        Returns:
            bool: True if user has all of the permissions
        """
        if not user or not user.is_authenticated:
            return False
        
        if user.is_superuser:
            return True
        
        try:
            permissions = cls.objects.get(user=user)
            return all(permissions.has_permission(name) for name in permission_field_names)
        except cls.DoesNotExist:
            return False