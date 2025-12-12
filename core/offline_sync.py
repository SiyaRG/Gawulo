"""
Offline synchronization utilities for ReachHub system.

This module handles data synchronization between local storage and server
when connectivity is available, implementing conflict resolution strategies.
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)


class OfflineSyncManager:
    """
    Manages offline data synchronization for the Gawulo system.
    
    Handles:
    - Queue management for pending operations
    - Conflict detection and resolution
    - Data integrity validation
    - Sync status monitoring
    """
    
    def __init__(self):
        self.sync_queue_key = "reachhub_sync_queue"
        self.conflict_resolution_strategy = "server_wins"  # or "client_wins", "manual"
    
    def add_to_sync_queue(self, operation_type: str, data: Dict[str, Any], 
                         timestamp: Optional[datetime] = None) -> bool:
        """
        Add an operation to the sync queue for later synchronization.
        
        Args:
            operation_type: Type of operation (create, update, delete)
            data: Operation data
            timestamp: Operation timestamp (defaults to now)
        
        Returns:
            bool: Success status
        """
        try:
            if timestamp is None:
                timestamp = datetime.now()
            
            queue_item = {
                'operation_type': operation_type,
                'data': data,
                'timestamp': timestamp.isoformat(),
                'status': 'pending',
                'retry_count': 0
            }
            
            # Get existing queue
            queue = cache.get(self.sync_queue_key, [])
            queue.append(queue_item)
            
            # Store updated queue
            cache.set(self.sync_queue_key, queue, timeout=86400)  # 24 hours
            
            logger.info(f"Added {operation_type} operation to sync queue")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add operation to sync queue: {e}")
            return False
    
    def get_sync_queue(self) -> List[Dict[str, Any]]:
        """Get all pending operations from the sync queue."""
        return cache.get(self.sync_queue_key, [])
    
    def clear_sync_queue(self) -> bool:
        """Clear the sync queue after successful synchronization."""
        try:
            cache.delete(self.sync_queue_key)
            logger.info("Sync queue cleared successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to clear sync queue: {e}")
            return False
    
    def resolve_conflict(self, local_data: Dict[str, Any], 
                        server_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Resolve conflicts between local and server data.
        
        Args:
            local_data: Local version of the data
            server_data: Server version of the data
        
        Returns:
            Dict[str, Any]: Resolved data
        """
        if self.conflict_resolution_strategy == "server_wins":
            return server_data
        elif self.conflict_resolution_strategy == "client_wins":
            return local_data
        elif self.conflict_resolution_strategy == "manual":
            # For manual resolution, return both versions for user decision
            return {
                'local_version': local_data,
                'server_version': server_data,
                'requires_manual_resolution': True
            }
        else:
            # Default to server wins
            return server_data
    
    def validate_data_integrity(self, data: Dict[str, Any]) -> bool:
        """
        Validate data integrity before synchronization.
        
        Args:
            data: Data to validate
        
        Returns:
            bool: Validation result
        """
        try:
            # Basic validation - can be extended based on specific requirements
            required_fields = ['id', 'created_at', 'updated_at']
            
            for field in required_fields:
                if field not in data:
                    logger.warning(f"Missing required field: {field}")
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Data integrity validation failed: {e}")
            return False
    
    def get_sync_status(self) -> Dict[str, Any]:
        """
        Get current synchronization status.
        
        Returns:
            Dict[str, Any]: Sync status information
        """
        queue = self.get_sync_queue()
        
        return {
            'queue_length': len(queue),
            'pending_operations': len([op for op in queue if op['status'] == 'pending']),
            'failed_operations': len([op for op in queue if op['status'] == 'failed']),
            'last_sync_attempt': cache.get('reachhub_last_sync_attempt'),
            'is_online': self._check_connectivity()
        }
    
    def _check_connectivity(self) -> bool:
        """
        Check if the system has internet connectivity.
        
        Returns:
            bool: Connectivity status
        """
        try:
            # Simple connectivity check - can be enhanced
            import requests
            response = requests.get('https://httpbin.org/status/200', timeout=5)
            return response.status_code == 200
        except:
            return False


# Global sync manager instance
sync_manager = OfflineSyncManager()
