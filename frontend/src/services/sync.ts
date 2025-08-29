// Sync service for data synchronization
import { SyncQueue, Order, Payment, Vendor, MenuItem, ApiResponse } from '../types/index';
import { storage } from './storage';
import { API_ENDPOINTS } from '../types/index';

class SyncService {
  private isSyncing = false;

  async performSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    this.isSyncing = true;
    console.log('Starting synchronization...');

    try {
      const isOnline = await storage.isOnline();
      if (!isOnline) {
        console.log('Device is offline, skipping sync');
        return;
      }

      // Get pending sync queue items
      const pendingItems = await storage.getSyncQueueByStatus('pending');
      console.log(`Found ${pendingItems.length} pending sync items`);

      if (pendingItems.length === 0) {
        console.log('No pending items to sync');
        return;
      }

      // Process each pending item
      for (const item of pendingItems) {
        await this.processSyncItem(item);
      }

      console.log('Synchronization completed successfully');
    } catch (error) {
      console.error('Synchronization failed:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  private async processSyncItem(item: SyncQueue): Promise<void> {
    try {
      console.log(`Processing sync item: ${item.operation_type} ${item.model_type}`);

      // Mark item as processing
      item.status = 'processing';
      await storage.updateSyncQueueItem(item);

      let success = false;

      switch (item.model_type) {
        case 'order':
          success = await this.syncOrder(item);
          break;
        case 'payment':
          success = await this.syncPayment(item);
          break;
        case 'vendor':
          success = await this.syncVendor(item);
          break;
        case 'menu_item':
          success = await this.syncMenuItem(item);
          break;
        default:
          console.warn(`Unknown model type: ${item.model_type}`);
          success = false;
      }

      if (success) {
        // Mark as completed and remove from queue
        await storage.removeFromSyncQueue(item.id);
        console.log(`Successfully synced ${item.model_type}`);
      } else {
        // Mark as failed
        item.status = 'failed';
        item.retry_count += 1;
        await storage.updateSyncQueueItem(item);
        console.log(`Failed to sync ${item.model_type}`);
      }
    } catch (error) {
      console.error(`Error processing sync item:`, error);
      
      // Mark as failed
      item.status = 'failed';
      item.retry_count += 1;
      item.error_message = error instanceof Error ? error.message : 'Unknown error';
      await storage.updateSyncQueueItem(item);
    }
  }

  private async syncOrder(item: SyncQueue): Promise<boolean> {
    try {
      const orderData = item.data as Order;
      
      if (item.operation_type === 'create') {
        const response = await fetch(API_ENDPOINTS.ORDERS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`,
          },
          body: JSON.stringify(orderData),
        });

        if (response.ok) {
          const result = await response.json();
          // Update local order with server ID
          orderData.id = result.data.id;
          orderData.synced_to_server = true;
          await storage.saveOrder(orderData);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error syncing order:', error);
      return false;
    }
  }

  private async syncPayment(item: SyncQueue): Promise<boolean> {
    try {
      const paymentData = item.data as Payment;
      
      if (item.operation_type === 'create') {
        const response = await fetch(API_ENDPOINTS.PAYMENTS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`,
          },
          body: JSON.stringify(paymentData),
        });

        if (response.ok) {
          const result = await response.json();
          paymentData.id = result.data.id;
          paymentData.synced_to_server = true;
          await storage.savePayment(paymentData);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error syncing payment:', error);
      return false;
    }
  }

  private async syncVendor(item: SyncQueue): Promise<boolean> {
    try {
      const vendorData = item.data as Vendor;
      
      if (item.operation_type === 'update') {
        const response = await fetch(API_ENDPOINTS.VENDOR_DETAIL(vendorData.id), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`,
          },
          body: JSON.stringify(vendorData),
        });

        if (response.ok) {
          await storage.saveVendor(vendorData);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error syncing vendor:', error);
      return false;
    }
  }

  private async syncMenuItem(item: SyncQueue): Promise<boolean> {
    try {
      const menuItemData = item.data as MenuItem;
      
      if (item.operation_type === 'update') {
        const response = await fetch(API_ENDPOINTS.MENU_ITEM_DETAIL(menuItemData.id), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`,
          },
          body: JSON.stringify(menuItemData),
        });

        if (response.ok) {
          await storage.saveMenuItem(menuItemData);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error syncing menu item:', error);
      return false;
    }
  }

  async addToSyncQueue(
    operationType: 'create' | 'update' | 'delete',
    modelType: 'order' | 'payment' | 'vendor' | 'menu_item' | 'review' | 'user',
    data: any,
    localId?: string
  ): Promise<void> {
    const syncItem: SyncQueue = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user: await storage.getCurrentUser() as any,
      operation_type: operationType,
      model_type: modelType,
      local_id: localId,
      data: data,
      original_data: {},
      status: 'pending',
      retry_count: 0,
      max_retries: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await storage.addToSyncQueue(syncItem);
    console.log(`Added ${operationType} ${modelType} to sync queue`);
  }

  async getSyncStatus(): Promise<{
    isSyncing: boolean;
    pendingOperations: number;
    failedOperations: number;
    lastSync: string;
  }> {
    const pendingItems = await storage.getSyncQueueByStatus('pending');
    const failedItems = await storage.getSyncQueueByStatus('failed');
    const lastSync = await storage.getAppState('lastSync') || 'Never';

    return {
      isSyncing: this.isSyncing,
      pendingOperations: pendingItems.length,
      failedOperations: failedItems.length,
      lastSync,
    };
  }

  private getAuthToken(): string {
    // This should be implemented based on your auth system
    return localStorage.getItem('authToken') || '';
  }
}

// Export singleton instance
export const sync = new SyncService();
export default sync;

