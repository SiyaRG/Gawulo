from django.contrib import admin
from .models import Order, OrderItem, OrderStatusHistory, OrderRating, OfflineOrderQueue


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['total_price']


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ['created_at']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'customer', 'vendor', 'status', 'total_amount', 'delivery_type', 'created_at']
    list_filter = ['status', 'delivery_type', 'created_offline', 'synced_to_server', 'created_at']
    search_fields = ['order_number', 'customer__username', 'vendor__business_name']
    readonly_fields = ['id', 'order_number', 'created_at', 'updated_at', 'sync_timestamp']
    inlines = [OrderItemInline, OrderStatusHistoryInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'order_number', 'customer', 'vendor')
        }),
        ('Order Details', {
            'fields': ('delivery_type', 'delivery_address', 'delivery_instructions', 'special_instructions')
        }),
        ('Pricing', {
            'fields': ('subtotal', 'delivery_fee', 'tax_amount', 'total_amount')
        }),
        ('Status & Tracking', {
            'fields': ('status', 'estimated_delivery_time', 'actual_delivery_time')
        }),
        ('Offline Support', {
            'fields': ('created_offline', 'synced_to_server', 'sync_timestamp')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'menu_item', 'quantity', 'unit_price', 'total_price']
    list_filter = ['order__status', 'created_at']
    search_fields = ['order__order_number', 'menu_item__name']
    readonly_fields = ['total_price', 'created_at', 'updated_at']


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['order', 'status', 'updated_by', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['order__order_number', 'notes']
    readonly_fields = ['created_at']


@admin.register(OrderRating)
class OrderRatingAdmin(admin.ModelAdmin):
    list_display = ['order', 'customer', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['order__order_number', 'customer__username', 'comment']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(OfflineOrderQueue)
class OfflineOrderQueueAdmin(admin.ModelAdmin):
    list_display = ['customer_id', 'vendor_id', 'synced', 'sync_attempts', 'created_at']
    list_filter = ['synced', 'created_at']
    search_fields = ['error_message']
    readonly_fields = ['created_at', 'last_sync_attempt']
