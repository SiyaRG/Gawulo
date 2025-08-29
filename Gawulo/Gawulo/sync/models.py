"""
Sync models for the Gawulo offline-first food ordering system.

Defines models for data synchronization, conflict resolution,
and offline queue management.
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid
import json


class SyncQueue(models.Model):
    """
    Queue for managing offline operations that need to be synchronized.
    
    Stores operations created offline for later synchronization when connectivity is available.
    """
    
    OPERATION_TYPES = (
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
    )
    
    MODEL_TYPES = (
        ('order', 'Order'),
        ('payment', 'Payment'),
        ('vendor', 'Vendor'),
        ('menu_item', 'Menu Item'),
        ('review', 'Review'),
        ('user', 'User'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('conflict', 'Conflict'),
    )
    
    # Basic Information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sync_operations')
    
    # Operation Details
    operation_type = models.CharField(max_length=20, choices=OPERATION_TYPES)
    model_type = models.CharField(max_length=20, choices=MODEL_TYPES)
    local_id = models.CharField(max_length=100, blank=True)
    server_id = models.CharField(max_length=100, blank=True)
    
    # Data
    data = models.JSONField()  # Store the complete operation data
    original_data = models.JSONField(default=dict, blank=True)  # For conflict resolution
    
    # Status and Tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    retry_count = models.PositiveIntegerField(default=0)
    max_retries = models.PositiveIntegerField(default=3)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['created_at']
        verbose_name = 'Sync Queue Item'
        verbose_name_plural = 'Sync Queue Items'
    
    def __str__(self):
        return f"{self.operation_type} {self.model_type} - {self.user.username}"
    
    def can_retry(self):
        """Check if operation can be retried."""
        return self.retry_count < self.max_retries and self.status in ['failed', 'conflict']
    
    def increment_retry(self):
        """Increment retry count."""
        self.retry_count += 1
        self.save()
    
    def mark_processing(self):
        """Mark operation as processing."""
        self.status = 'processing'
        self.save()
    
    def mark_completed(self):
        """Mark operation as completed."""
        self.status = 'completed'
        self.processed_at = timezone.now()
        self.save()
    
    def mark_failed(self, error_message=""):
        """Mark operation as failed."""
        self.status = 'failed'
        self.error_message = error_message
        self.save()
    
    def mark_conflict(self):
        """Mark operation as having conflicts."""
        self.status = 'conflict'
        self.save()


class SyncConflict(models.Model):
    """
    Track conflicts that occur during synchronization.
    
    Stores both local and server versions for manual resolution.
    """
    
    RESOLUTION_STATUS = (
        ('pending', 'Pending'),
        ('resolved', 'Resolved'),
        ('ignored', 'Ignored'),
    )
    
    RESOLUTION_STRATEGY = (
        ('server_wins', 'Server Wins'),
        ('client_wins', 'Client Wins'),
        ('manual', 'Manual Resolution'),
        ('merge', 'Merge'),
    )
    
    sync_queue_item = models.ForeignKey(SyncQueue, on_delete=models.CASCADE, related_name='conflicts')
    local_data = models.JSONField()
    server_data = models.JSONField()
    conflict_field = models.CharField(max_length=100, blank=True)
    
    resolution_status = models.CharField(max_length=20, choices=RESOLUTION_STATUS, default='pending')
    resolution_strategy = models.CharField(max_length=20, choices=RESOLUTION_STRATEGY, default='manual')
    resolved_data = models.JSONField(default=dict, blank=True)
    
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Sync Conflict'
        verbose_name_plural = 'Sync Conflicts'
    
    def __str__(self):
        return f"Conflict for {self.sync_queue_item} - {self.conflict_field}"
    
    def resolve(self, resolved_data, resolved_by=None, strategy='manual'):
        """Resolve the conflict."""
        self.resolved_data = resolved_data
        self.resolution_status = 'resolved'
        self.resolution_strategy = strategy
        self.resolved_by = resolved_by
        self.resolved_at = timezone.now()
        self.save()


class SyncSession(models.Model):
    """
    Track synchronization sessions for monitoring and debugging.
    """
    
    SESSION_STATUS = (
        ('started', 'Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sync_sessions')
    session_id = models.CharField(max_length=100, unique=True)
    
    # Session Details
    status = models.CharField(max_length=20, choices=SESSION_STATUS, default='started')
    total_operations = models.PositiveIntegerField(default=0)
    successful_operations = models.PositiveIntegerField(default=0)
    failed_operations = models.PositiveIntegerField(default=0)
    conflicts_resolved = models.PositiveIntegerField(default=0)
    
    # Network Information
    connection_type = models.CharField(max_length=20, blank=True)  # wifi, mobile, etc.
    bandwidth_used = models.PositiveIntegerField(default=0)  # in bytes
    
    # Timestamps
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration = models.PositiveIntegerField(default=0)  # in seconds
    
    class Meta:
        ordering = ['-started_at']
        verbose_name = 'Sync Session'
        verbose_name_plural = 'Sync Sessions'
    
    def __str__(self):
        return f"Sync Session {self.session_id} - {self.user.username}"
    
    def complete_session(self):
        """Mark session as completed."""
        self.status = 'completed'
        self.completed_at = timezone.now()
        if self.started_at:
            self.duration = int((self.completed_at - self.started_at).total_seconds())
        self.save()
    
    def get_success_rate(self):
        """Calculate success rate of the session."""
        if self.total_operations > 0:
            return (self.successful_operations / self.total_operations) * 100
        return 0


class DataSnapshot(models.Model):
    """
    Store snapshots of data for offline access and conflict detection.
    """
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='data_snapshots')
    model_type = models.CharField(max_length=20, choices=SyncQueue.MODEL_TYPES)
    record_id = models.CharField(max_length=100)
    
    # Snapshot Data
    data = models.JSONField()
    version = models.PositiveIntegerField(default=1)
    checksum = models.CharField(max_length=64, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['user', 'model_type', 'record_id', 'version']
        ordering = ['-created_at']
        verbose_name = 'Data Snapshot'
        verbose_name_plural = 'Data Snapshots'
    
    def __str__(self):
        return f"Snapshot {self.model_type}:{self.record_id} v{self.version}"
    
    def is_expired(self):
        """Check if snapshot has expired."""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False


class SyncConfiguration(models.Model):
    """
    Configuration settings for synchronization behavior.
    """
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='sync_config')
    
    # Sync Settings
    auto_sync_enabled = models.BooleanField(default=True)
    sync_interval = models.PositiveIntegerField(default=300)  # in seconds
    max_retries = models.PositiveIntegerField(default=3)
    retry_delay = models.PositiveIntegerField(default=60)  # in seconds
    
    # Conflict Resolution
    default_conflict_strategy = models.CharField(
        max_length=20, 
        choices=SyncConflict.RESOLUTION_STRATEGY, 
        default='manual'
    )
    
    # Data Retention
    sync_history_retention_days = models.PositiveIntegerField(default=30)
    snapshot_retention_days = models.PositiveIntegerField(default=7)
    
    # Network Settings
    sync_on_wifi_only = models.BooleanField(default=False)
    max_bandwidth_per_sync = models.PositiveIntegerField(default=10485760)  # 10MB in bytes
    
    # Notifications
    notify_on_sync_completion = models.BooleanField(default=True)
    notify_on_conflicts = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Sync Configuration'
        verbose_name_plural = 'Sync Configurations'
    
    def __str__(self):
        return f"Sync Config for {self.user.username}"
    
    def get_sync_interval_minutes(self):
        """Get sync interval in minutes."""
        return self.sync_interval / 60
    
    def can_sync_now(self, connection_type='unknown'):
        """Check if sync can be performed based on current settings."""
        if not self.auto_sync_enabled:
            return False
        
        if self.sync_on_wifi_only and connection_type != 'wifi':
            return False
        
        return True
