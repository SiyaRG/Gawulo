from django.contrib import admin
from django.db import models
from .models import (
    PasswordResetToken, Customer, Address, UserDocument, UserPermissions, UserProfile,
    OTPVerification, OAuthAccount
)


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'expires_at', 'is_used', 'created_at']
    list_filter = ['is_used', 'created_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['id', 'token_hash', 'created_at']
    fieldsets = (
        ('Token Information', {
            'fields': ('id', 'user', 'token_hash', 'expires_at', 'is_used')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'user', 'created_at', 'deleted_at']
    list_filter = ['created_at', 'deleted_at']
    search_fields = ['display_name', 'user__username', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Customer Information', {
            'fields': ('id', 'user', 'display_name')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'deleted_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone_number', 'country_code', 'primary_language', 'created_at', 'updated_at']
    list_filter = ['primary_language', 'created_at', 'updated_at']
    search_fields = ['user__username', 'user__email', 'phone_number', 'country_code']
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = ['languages']
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Contact Information', {
            'fields': ('phone_number', 'country_code')
        }),
        ('Address', {
            'fields': ('primary_address',),
            'description': 'Country is stored in the primary address.'
        }),
        ('Languages', {
            'fields': ('primary_language', 'languages'),
            'description': 'Primary language is used for UI preferences. Languages field supports multiple languages.'
        }),
        ('Security', {
            'fields': ('two_factor_enabled',),
            'description': 'Enable two-factor authentication for this user.'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['line1', 'city', 'postal_code', 'get_country_name', 'user', 'entity_type', 'address_type', 'created_at']
    list_filter = ['country', 'address_type', 'entity_type', 'created_at']
    search_fields = ['line1', 'line2', 'city', 'postal_code', 'country__name', 'country__iso_alpha2', 'user__username', 'user__email']
    readonly_fields = ['id', 'created_at']
    fieldsets = (
        ('Address Information', {
            'fields': ('id', 'line1', 'line2', 'city', 'state_province', 'postal_code', 'country')
        }),
        ('User Reference', {
            'fields': ('user',)
        }),
        ('Entity Reference', {
            'fields': ('entity_type', 'entity_id', 'address_type'),
            'description': 'Legacy polymorphic fields for backward compatibility'
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_country_name(self, obj):
        """Display country name in list view."""
        return obj.country.name if obj.country else 'N/A'
    get_country_name.short_description = 'Country'


@admin.register(UserDocument)
class UserDocumentAdmin(admin.ModelAdmin):
    list_display = ['user', 'file_name', 'document_type', 'mime_type', 'created_at']
    list_filter = ['document_type', 'created_at']
    search_fields = ['user__username', 'user__email', 'file_name']
    readonly_fields = ['id', 'created_at']
    fieldsets = (
        ('Document Information', {
            'fields': ('id', 'user', 'file_name', 'document_type')
        }),
        ('Storage', {
            'fields': ('storage_path', 'mime_type')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(UserPermissions)
class UserPermissionsAdmin(admin.ModelAdmin):
    list_display = ['user', 'get_active_permissions_count', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Vendor Permissions', {
            'fields': (
                'can_view_own_vendor_profile',
                'can_edit_own_vendor_profile',
                'can_view_own_vendor_orders',
                'can_update_order_status',
                'can_view_own_vendor_earnings',
                'can_manage_vendor_menu',
                'can_view_vendor_analytics',
            ),
            'classes': ('collapse',)
        }),
        ('Customer Permissions', {
            'fields': (
                'can_view_own_customer_profile',
                'can_edit_own_customer_profile',
                'can_view_own_customer_orders',
                'can_create_orders',
                'can_cancel_orders',
                'can_view_order_history',
                'can_rate_orders',
            ),
            'classes': ('collapse',)
        }),
        ('Payment Permissions', {
            'fields': (
                'can_make_payments',
                'can_view_own_payments',
                'can_view_all_payments',
                'can_process_refunds',
            ),
            'classes': ('collapse',)
        }),
        ('Order Permissions', {
            'fields': (
                'can_view_all_orders',
                'can_manage_orders',
            ),
            'classes': ('collapse',)
        }),
        ('Sync Permissions', {
            'fields': (
                'can_perform_sync',
                'can_resolve_sync_conflicts',
                'can_view_sync_status',
            ),
            'classes': ('collapse',)
        }),
        ('Tracking Permissions', {
            'fields': (
                'can_update_location',
                'can_view_order_tracking',
                'can_manage_deliveries',
            ),
            'classes': ('collapse',)
        }),
        ('Admin Permissions', {
            'fields': (
                'can_view_all_vendors',
                'can_manage_vendors',
                'can_view_all_customers',
                'can_manage_customers',
                'can_view_audit_logs',
                'can_manage_system_settings',
            ),
            'classes': ('collapse',)
        }),
        ('Offline Permissions', {
            'fields': (
                'can_create_offline_orders',
                'can_view_offline_orders',
                'can_record_offline_payments',
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_active_permissions_count(self, obj):
        """Display the number of active permissions."""
        count = sum(1 for field in obj._meta.get_fields() 
                   if isinstance(field, models.BooleanField) and getattr(obj, field.name, False))
        return count
    get_active_permissions_count.short_description = 'Active Permissions'


@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'expires_at', 'is_used', 'created_at']
    list_filter = ['is_used', 'created_at', 'expires_at']
    search_fields = ['user__username', 'user__email', 'session_token']
    readonly_fields = ['id', 'otp_hash', 'created_at']
    fieldsets = (
        ('OTP Information', {
            'fields': ('id', 'user', 'otp_hash', 'session_token', 'expires_at', 'is_used')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(OAuthAccount)
class OAuthAccountAdmin(admin.ModelAdmin):
    list_display = ['user', 'provider', 'email', 'provider_user_id', 'created_at']
    list_filter = ['provider', 'created_at']
    search_fields = ['user__username', 'user__email', 'email', 'provider_user_id']
    readonly_fields = ['id', 'created_at']
    fieldsets = (
        ('OAuth Account Information', {
            'fields': ('id', 'user', 'provider', 'provider_user_id', 'email')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
