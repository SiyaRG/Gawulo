from django.contrib import admin
from .models import PaymentTransaction


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ['transaction_uid', 'order', 'gateway_name', 'amount_settled', 'currency', 'gateway_status', 'created_at']
    list_filter = ['gateway_name', 'gateway_status', 'currency', 'created_at']
    search_fields = ['transaction_uid', 'order__order_uid']
    readonly_fields = ['id', 'created_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'order', 'transaction_uid')
        }),
        ('Payment Details', {
            'fields': ('gateway_name', 'amount_settled', 'currency', 'gateway_status')
        }),
        ('Transaction Data', {
            'fields': ('transaction_details',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
