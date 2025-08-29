// Storage service for offline data
import { Order, Payment, SyncQueue, Vendor, MenuItem, User } from '../types/index';

class StorageService {
  private storage: Map<string, any> = new Map();

  async init(): Promise<void> {
    console.log('StorageService initialized');
  }

  // Orders methods
  async saveOrder(order: Order): Promise<void> {
    this.storage.set(`order_${order.id}`, order);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.storage.get(`order_${id}`);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.storage.values()).filter(item => item.id && item.items);
  }

  // Payments methods
  async savePayment(payment: Payment): Promise<void> {
    this.storage.set(`payment_${payment.id}`, payment);
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.storage.get(`payment_${id}`);
  }

  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.storage.values()).filter(item => item.id && item.amount);
  }

  // Sync queue methods
  async addToSyncQueue(item: SyncQueue): Promise<void> {
    this.storage.set(`sync_${item.id}`, item);
  }

  async getSyncQueueByStatus(status: string): Promise<SyncQueue[]> {
    return Array.from(this.storage.values()).filter(item => item.status === status);
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    this.storage.delete(`sync_${id}`);
  }

  async updateSyncQueueItem(item: SyncQueue): Promise<void> {
    this.storage.set(`sync_${item.id}`, item);
  }

  async getAllSyncQueue(): Promise<SyncQueue[]> {
    return Array.from(this.storage.values()).filter(item => item.operation_type);
  }

  // Vendors methods
  async saveVendor(vendor: Vendor): Promise<void> {
    this.storage.set(`vendor_${vendor.id}`, vendor);
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    return this.storage.get(`vendor_${id}`);
  }

  async getAllVendors(): Promise<Vendor[]> {
    return Array.from(this.storage.values()).filter(item => item.id && item.business_name);
  }

  // Menu items methods
  async saveMenuItem(item: MenuItem): Promise<void> {
    this.storage.set(`menuitem_${item.id}`, item);
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    return this.storage.get(`menuitem_${id}`);
  }

  async getAllMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.storage.values()).filter(item => item.id && item.name);
  }

  // Users methods
  async saveUser(user: User): Promise<void> {
    this.storage.set(`user_${user.id}`, user);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.storage.get(`user_${id}`);
  }

  async getCurrentUser(): Promise<User | undefined> {
    return this.storage.get('currentUser');
  }

  async setCurrentUser(user: User | null): Promise<void> {
    this.storage.set('currentUser', user);
  }

  // App state methods
  async saveAppState(key: string, value: any): Promise<void> {
    this.storage.set(`appstate_${key}`, value);
  }

  async getAppState(key: string): Promise<any> {
    return this.storage.get(`appstate_${key}`);
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    this.storage.clear();
  }

  async getDatabaseSize(): Promise<number> {
    return this.storage.size;
  }

  async isOnline(): Promise<boolean> {
    try {
      const response = await fetch('/api/health/', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Batch operations
  async saveOrders(orders: Order[]): Promise<void> {
    orders.forEach(order => this.storage.set(`order_${order.id}`, order));
  }

  async savePayments(payments: Payment[]): Promise<void> {
    payments.forEach(payment => this.storage.set(`payment_${payment.id}`, payment));
  }

  async saveVendors(vendors: Vendor[]): Promise<void> {
    vendors.forEach(vendor => this.storage.set(`vendor_${vendor.id}`, vendor));
  }

  async saveMenuItems(items: MenuItem[]): Promise<void> {
    items.forEach(item => this.storage.set(`menuitem_${item.id}`, item));
  }
}

// Export singleton instance
export const storage = new StorageService();
export default storage;


