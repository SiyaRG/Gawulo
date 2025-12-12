from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['event_time', 'service_name', 'action_name', 'table_name', 'row_id', 'user', 'success']
    list_filter = ['success', 'service_name', 'action_name', 'table_name', 'event_time']
    search_fields = ['service_name', 'action_name', 'table_name', 'user__username', 'source_ip']
    readonly_fields = ['id', 'event_time']
    date_hierarchy = 'event_time'
    fieldsets = (
        ('Event Information', {
            'fields': ('id', 'event_time', 'service_name', 'action_name')
        }),
        ('Target', {
            'fields': ('table_name', 'row_id')
        }),
        ('Actor & Context', {
            'fields': ('user', 'source_ip', 'success')
        }),
        ('Data', {
            'fields': ('data_payload',),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        """Prevent manual creation of audit logs."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Prevent modification of audit logs."""
        return False
