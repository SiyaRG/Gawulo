from django.contrib import admin
from .models import Order, OrderLineItem, OrderStatusHistory, Review


class OrderLineItemInline(admin.TabularInline):
    model = OrderLineItem
    extra = 0
    readonly_fields = ['line_total']


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ['timestamp']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_uid', 'customer', 'vendor', 'current_status', 'total_amount', 'is_completed', 'created_at']
    list_filter = ['current_status', 'is_completed', 'created_at']
    search_fields = ['order_uid', 'customer__display_name', 'vendor__name']
    readonly_fields = ['id', 'order_uid', 'created_at', 'updated_at']
    inlines = [OrderLineItemInline, OrderStatusHistoryInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'order_uid', 'customer', 'vendor')
        }),
        ('Order Details', {
            'fields': ('total_amount', 'current_status', 'is_completed')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(OrderLineItem)
class OrderLineItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product_service', 'quantity', 'unit_price_snapshot', 'line_total', 'quantity_fulfilled', 'created_at']
    list_filter = ['order__current_status', 'created_at']
    search_fields = ['order__order_uid', 'product_service__name']
    readonly_fields = ['line_total', 'created_at']


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['order', 'status', 'confirmed_by_user', 'timestamp']
    list_filter = ['status', 'timestamp']
    search_fields = ['order__order_uid', 'status']
    readonly_fields = ['timestamp']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['order', 'vendor', 'customer', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['order__order_uid', 'vendor__name', 'customer__display_name', 'comment']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Review Information', {
            'fields': ('order', 'vendor', 'customer', 'rating', 'comment')
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
