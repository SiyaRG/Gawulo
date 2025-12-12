"""
Audit logging models for the Gawulo platform.

Defines models for tracking all system changes and events for data governance.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class AuditLog(models.Model):
    """
    Audit log model for tracking all system changes and events.
    
    Records who did what, when, and with what data for compliance and debugging.
    """
    
    id = models.BigAutoField(primary_key=True)
    event_time = models.DateTimeField(auto_now_add=True, editable=False)
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='audit_logs',
        help_text='Actor who initiated the change (Nullable for system actions)'
    )
    service_name = models.CharField(max_length=100)
    action_name = models.CharField(max_length=50, null=True, blank=True)
    table_name = models.CharField(max_length=100)
    row_id = models.IntegerField(help_text='Primary key of the row affected')
    data_payload = models.JSONField(default=dict, blank=True)
    source_ip = models.CharField(max_length=45, null=True, blank=True)
    success = models.BooleanField()
    
    class Meta:
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-event_time']
        indexes = [
            models.Index(fields=['event_time']),
            models.Index(fields=['user', 'event_time']),
            models.Index(fields=['table_name', 'row_id']),
            models.Index(fields=['service_name', 'action_name']),
        ]
    
    def __str__(self):
        user_str = self.user.username if self.user else "System"
        status = "Success" if self.success else "Failed"
        return f"{self.service_name}.{self.action_name} on {self.table_name}#{self.row_id} by {user_str} - {status}"
    
    @classmethod
    def log_event(cls, service_name, table_name, row_id, action_name=None, user=None, 
                  data_payload=None, source_ip=None, success=True):
        """
        Convenience method to create an audit log entry.
        
        Args:
            service_name: Name of the service/module performing the action
            table_name: Name of the database table/model
            row_id: Primary key of the affected row
            action_name: Name of the action (e.g., 'create', 'update', 'delete')
            user: User who performed the action (None for system actions)
            data_payload: JSON-serializable data about the change
            source_ip: IP address of the request source
            success: Whether the action was successful
        
        Returns:
            AuditLog instance
        """
        return cls.objects.create(
            service_name=service_name,
            action_name=action_name,
            table_name=table_name,
            row_id=row_id,
            user=user,
            data_payload=data_payload or {},
            source_ip=source_ip,
            success=success
        )
    
    def save(self, *args, **kwargs):
        """Prevent modification of event_time on existing records."""
        if self.pk:
            # Preserve original event_time when updating
            original = AuditLog.objects.get(pk=self.pk)
            self.event_time = original.event_time
        super().save(*args, **kwargs)
