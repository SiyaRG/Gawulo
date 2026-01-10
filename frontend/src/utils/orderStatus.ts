/**
 * Order status workflow validation and utility functions.
 */

export type OrderStatus = 'Confirmed' | 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Ready' | 'PickedUp' | 'Cancelled' | 'Refunded';

export const ORDER_STATUSES = [
  { value: 'Pending', label: 'Pending', description: 'Order received, awaiting confirmation.' },
  { value: 'Confirmed', label: 'Confirmed', description: 'Order confirmed by vendor, awaiting preparation.' },
  { value: 'Processing', label: 'Processing', description: 'Your order is being prepared.' },
  { value: 'Shipped', label: 'Out for Delivery', description: 'Your order is on its way.' },
  { value: 'Delivered', label: 'Delivered', description: 'Order has been successfully delivered.' },
  { value: 'Ready', label: 'Ready for Pickup', description: 'Your order is ready for pickup.' },
  { value: 'PickedUp', label: 'Picked Up', description: 'Order has been successfully picked up.' },
  { value: 'Cancelled', label: 'Cancelled', description: 'Order has been cancelled.' },
  { value: 'Refunded', label: 'Refunded', description: 'Order has been refunded.' },
];

/**
 * Get valid next statuses for a given current status and delivery type.
 */
export function getValidNextStatuses(
  currentStatus: string,
  userType: 'customer' | 'vendor' | 'admin',
  deliveryType?: 'delivery' | 'pickup'
): string[] {
  // Define transitions based on delivery type
  let transitions: Record<string, string[]>;
  
  if (deliveryType === 'pickup') {
    // Pickup workflow: Processing -> Ready -> PickedUp
    transitions = {
      'Pending': ['Confirmed', 'Cancelled'],
      'Confirmed': ['Processing', 'Cancelled'],
      'Processing': ['Ready', 'Cancelled'],
      'Ready': ['PickedUp', 'Cancelled'],
      'PickedUp': [],
      'Cancelled': [],
      'Refunded': [],
    };
  } else {
    // Delivery workflow: Processing -> Shipped -> Delivered
    transitions = {
      'Pending': ['Confirmed', 'Cancelled'],
      'Confirmed': ['Processing', 'Cancelled'],
      'Processing': ['Shipped', 'Cancelled'],
      'Shipped': ['Delivered', 'Cancelled'],
      'Delivered': [],
      'Cancelled': [],
      'Refunded': [],
    };
  }

  let allowed = transitions[currentStatus] || [];

  if (userType === 'customer') {
    // Customers can only cancel Pending or Confirmed orders
    if (currentStatus === 'Pending' || currentStatus === 'Confirmed') {
      return allowed.filter(s => s === 'Cancelled');
    }
    return []; // Customers cannot change other statuses
  } else if (userType === 'vendor') {
    // Vendors can transition through the main flow and cancel
    return allowed.filter(s => s !== 'Refunded'); // Vendors typically don't initiate refunds directly
  } else if (userType === 'admin') {
    // Admins have full control
    return allowed;
  }
  return [];
}

/**
 * Check if an order can be cancelled based on its status.
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return ['Confirmed', 'Pending', 'Processing', 'Shipped', 'Ready'].includes(status);
}

/**
 * Check if a status transition is valid.
 */
export function isValidTransition(
  from: OrderStatus,
  to: OrderStatus,
  deliveryType?: 'delivery' | 'pickup'
): boolean {
  if (from === to) return true;
  const validNext = getValidNextStatuses(from, 'admin', deliveryType);
  return validNext.includes(to);
}

/**
 * Get color for status chip display.
 */
export function getStatusColor(status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  switch (status) {
    case 'Pending':
      return 'warning';
    case 'Confirmed':
      return 'info';
    case 'Processing':
      return 'primary';
    case 'Shipped':
      return 'secondary';
    case 'Delivered':
      return 'success';
    case 'Ready':
      return 'info';
    case 'PickedUp':
      return 'success';
    case 'Cancelled':
      return 'error';
    case 'Refunded':
      return 'error';
    default:
      return 'default';
  }
}

/**
 * Get human-readable label for status.
 */
export function getStatusLabel(status: OrderStatus): string {
  const statusObj = ORDER_STATUSES.find(s => s.value === status);
  return statusObj?.label || status;
}

/**
 * Check if status is a final status (no further transitions possible).
 */
export function isFinalStatus(status: OrderStatus, deliveryType?: 'delivery' | 'pickup'): boolean {
  if (deliveryType === 'pickup') {
    return ['PickedUp', 'Cancelled', 'Refunded'].includes(status);
  }
  return ['Delivered', 'Cancelled', 'Refunded'].includes(status);
}

/**
 * Check if customer can cancel order with this status.
 */
export function canCustomerCancel(status: OrderStatus): boolean {
  return ['Confirmed', 'Pending'].includes(status);
}
