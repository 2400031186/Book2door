import usePricing from '../hooks/usePricing';
import { useCart, getLineTotal } from '../context/CartContext';

export default function OrderSummary({
  paymentType,
  splitPercent,
  showItems = true,
  showMinOrderWarning = false,
  className = '',
}) {
  const { items, subtotal } = useCart();
  const { deliveryCharge, minOrder, loading } = usePricing();

  const delivery = subtotal > 0 ? deliveryCharge : 0;
  const grandTotal = Math.round((subtotal + delivery) * 100) / 100;
  const advanceAmount =
    paymentType === 'split'
      ? Math.round(grandTotal * ((splitPercent ?? 50) / 100) * 100) / 100
      : grandTotal;
  const codAmount = paymentType === 'split' ? Math.round((grandTotal - advanceAmount) * 100) / 100 : 0;
  const belowMin = grandTotal > 0 && grandTotal < minOrder;

  if (loading) {
    return <div className={`text-sm text-slate-500 ${className}`}>Loading prices...</div>;
  }

  return (
    <div className={className}>
      {showItems && items.length > 0 && (
        <div className="space-y-3 mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          {items.map((item) => (
            <div key={item.cartKey} className="flex justify-between gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">
                  {item.type === 'book' ? item.title : item.file_name}
                </p>
                <p className="text-xs text-neutral-500">
                  {item.type === 'book'
                    ? `${item.course_code || 'Book'} · Qty ${item.quantity}`
                    : `PDF Print · ${item.page_count || '—'} pages`}
                </p>
              </div>
              <p className="font-medium shrink-0">₹{getLineTotal(item).toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-500">Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Delivery</span>
          <span>₹{delivery.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t border-neutral-200 dark:border-neutral-800 pt-2">
          <span>Grand Total</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>

        {paymentType === 'split' && (
          <>
            <div className="flex justify-between font-medium">
              <span>Advance ({splitPercent ?? 50}%)</span>
              <span>₹{advanceAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>COD on Delivery</span>
              <span>₹{codAmount.toFixed(2)}</span>
            </div>
          </>
        )}

        {paymentType === 'full' && (
          <div className="flex justify-between font-medium">
            <span>Pay Now (Full)</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        )}
      </div>

      {showMinOrderWarning && belowMin && (
        <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
          Minimum order is ₹{minOrder}. Add more items to checkout.
        </p>
      )}
    </div>
  );
}

export function useOrderTotals(paymentType = 'split') {
  const { subtotal } = useCart();
  const { deliveryCharge, splitPercent, minOrder } = usePricing();
  const delivery = subtotal > 0 ? deliveryCharge : 0;
  const grandTotal = Math.round((subtotal + delivery) * 100) / 100;
  const advanceAmount =
    paymentType === 'split'
      ? Math.round(grandTotal * (splitPercent / 100) * 100) / 100
      : grandTotal;
  const codAmount = paymentType === 'split' ? grandTotal - advanceAmount : 0;

  return { subtotal, delivery, grandTotal, advanceAmount, codAmount, minOrder, splitPercent };
}
