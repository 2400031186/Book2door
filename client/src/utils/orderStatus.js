/** Shared order status helpers for admin UI */

export function isPartialOrder(order) {
  if (!order || order.payment_type !== 'split') return false;
  if (Number(order.cod_amount) <= 0) return false;
  return !['pending_payment', 'payment_review', 'cancelled'].includes(order.status);
}

export function getOrderDisplayStatus(order) {
  if (isPartialOrder(order) && order.status === 'received') {
    return 'received_partial';
  }
  return order.status;
}

export function formatOrderStatusLabel(status) {
  if (status === 'received_partial') return 'Received · Partial';
  return (status || 'unknown').replace(/_/g, ' ');
}

export const ORDER_FILTER_OPTIONS = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'payment_review', label: 'Payment Review' },
  { value: 'received', label: 'Received' },
  { value: 'received_partial', label: 'Received · Partial' },
  { value: 'partial', label: 'Partial Payment (COD pending)' },
  { value: 'printing', label: 'Printing' },
  { value: 'packing', label: 'Packing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];
