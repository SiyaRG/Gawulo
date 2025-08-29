from django.contrib import admin
from .models import Vendor, MenuCategory, MenuItem, VendorReview, VendorEarnings, VendorDocument


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ['business_name', 'user', 'business_type', 'status', 'is_verified', 'rating', 'total_orders']
    list_filter = ['status', 'business_type', 'is_verified', 'offline_capable']
    search_fields = ['business_name', 'user__username', 'phone_number', 'email']
    readonly_fields = ['id', 'created_at', 'updated_at', 'last_sync']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user', 'business_name', 'business_type', 'description')
        }),
        ('Contact Information', {
            'fields': ('phone_number', 'email', 'address', 'latitude', 'longitude')
        }),
        ('Business Settings', {
            'fields': ('operating_hours', 'delivery_radius', 'minimum_order', 'delivery_fee')
        }),
        ('Status & Verification', {
            'fields': ('status', 'is_verified', 'rating', 'total_orders')
        }),
        ('Offline Support', {
            'fields': ('offline_capable', 'last_sync', 'sync_status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(MenuCategory)
class MenuCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'vendor', 'is_active', 'sort_order']
    list_filter = ['is_active', 'vendor']
    search_fields = ['name', 'vendor__business_name']
    ordering = ['vendor', 'sort_order']


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'vendor', 'category', 'price', 'availability_status', 'is_featured']
    list_filter = ['availability_status', 'is_featured', 'category', 'vendor']
    search_fields = ['name', 'description', 'vendor__business_name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'last_updated']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'vendor', 'category', 'name', 'description')
        }),
        ('Pricing & Availability', {
            'fields': ('price', 'original_price', 'availability_status', 'is_featured')
        }),
        ('Media & Details', {
            'fields': ('image', 'preparation_time', 'allergens', 'dietary_info')
        }),
        ('Offline Support', {
            'fields': ('offline_available', 'last_updated')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(VendorReview)
class VendorReviewAdmin(admin.ModelAdmin):
    list_display = ['vendor', 'customer', 'rating', 'is_verified_purchase', 'created_at']
    list_filter = ['rating', 'is_verified_purchase', 'created_at']
    search_fields = ['vendor__business_name', 'customer__username', 'comment']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(VendorEarnings)
class VendorEarningsAdmin(admin.ModelAdmin):
    list_display = ['vendor', 'date', 'total_orders', 'total_revenue', 'net_earnings']
    list_filter = ['date', 'vendor']
    search_fields = ['vendor__business_name']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date'


@admin.register(VendorDocument)
class VendorDocumentAdmin(admin.ModelAdmin):
    list_display = ['vendor', 'document_type', 'is_verified', 'verified_by', 'created_at']
    list_filter = ['document_type', 'is_verified', 'created_at']
    search_fields = ['vendor__business_name']
    readonly_fields = ['created_at', 'updated_at']
