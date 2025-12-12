from django.contrib import admin
from .models import Vendor, ProductService, VendorDocument


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'category', 'is_verified', 'average_rating', 'review_count', 'created_at']
    list_filter = ['category', 'is_verified', 'created_at']
    search_fields = ['name', 'user__username', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user', 'name', 'category', 'profile_description')
        }),
        ('Status & Ratings', {
            'fields': ('is_verified', 'average_rating', 'review_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'deleted_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ProductService)
class ProductServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'vendor', 'current_price', 'is_service', 'created_at']
    list_filter = ['is_service', 'vendor', 'created_at']
    search_fields = ['name', 'description', 'vendor__name']
    readonly_fields = ['id', 'created_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'vendor', 'name', 'description', 'is_service')
        }),
        ('Pricing', {
            'fields': ('current_price',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'deleted_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(VendorDocument)
class VendorDocumentAdmin(admin.ModelAdmin):
    list_display = ['vendor', 'file_name', 'document_type', 'mime_type', 'created_at']
    list_filter = ['document_type', 'created_at']
    search_fields = ['vendor__name', 'file_name']
    readonly_fields = ['id', 'created_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'vendor', 'file_name', 'document_type')
        }),
        ('Storage', {
            'fields': ('storage_path', 'mime_type')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
