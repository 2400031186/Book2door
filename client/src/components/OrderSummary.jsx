import usePricing from '../hooks/usePricing';
import { useCart, getLineTotal } from '../context/CartContext';

function computeTotals(subtotal, deliveryCharge, splitPaymentFee, paymentType, splitPercent) {
  const delivery = subtotal > 0 ? deliveryCharge : 0;
  const baseTotal = Math.round((subtotal + delivery) * 100) / 100;
  const splitFee = paymentType === 'split' && subtotal > 0 ? splitPaymentFee : 0;
  const grandTotal = Math.round((baseTotal + splitFee) * 100) / 100;
  const advanceAmount =
    paymentType === 'split'
      ? Math.round(grandTotal * ((splitPercent ?? 50) / 100) * 100) / 100
      : grandTotal;
  const codAmount = paymentType === 'split' ? Math.round((grandTotal - advanceAmount) * 100) / 100 : 0;

  return { delivery, baseTotal, splitFee, grandTotal, advanceAmount, codAmount };
}

export default function OrderSummary({
  paymentType,
  splitPercent,
  showItems = true,
  showMinOrderWarning = false,
  className = '',
}) {
  const { items, subtotal } = useCart();
  const { deliveryCharge, minOrder, splitPaymentFee, loading } = usePricing();

  const { delivery, splitFee, grandTotal, advanceAmount, codAmount } = computeTotals(
    subtotal,
    deliveryCharge,
    splitPaymentFee,
    paymentType,
    splitPercent
  );
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
                    ? `${item.course_code || 'Book'} · Qty ${item.quantity} · ${item.sideMode === 'double' ? 'Double' : 'Single'}-sided`
                    : `PDF Print · ${item.page_count || '—'} pages${item.print_options?.sideMode ? ` · ${item.print_options.sideMode === 'double' ? 'Double' : 'Single'}-sided` : ''}`}
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
          <span className="text-neutral-500">Pickup</span>
          <span>{delivery <= 0 ? 'Free' : `₹${delivery.toFixed(2)}`}</span>
        </div>
        {paymentType === 'split' && splitFee > 0 && (
          <div className="flex justify-between text-amber-700 dark:text-amber-400">
            <span>Split payment fee</span>
            <span>+₹{splitFee.toFixed(2)}</span>
          </div>
        )}
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
              <span>COD at Pickup</span>
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

export function useOrderTotals(paymentType = 'full') {
  const { subtotal } = useCart();
  const { deliveryCharge, splitPercent, splitPaymentFee, minOrder } = usePricing();
  const totals = computeTotals(subtotal, deliveryCharge, splitPaymentFee, paymentType, splitPercent);

  return {
    subtotal,
    delivery: totals.delivery,
    baseTotal: totals.baseTotal,
    splitFee: totals.splitFee,
    grandTotal: totals.grandTotal,
    advanceAmount: totals.advanceAmount,
    codAmount: totals.codAmount,
    minOrder,
    splitPercent,
    splitPaymentFee,
  };
}
