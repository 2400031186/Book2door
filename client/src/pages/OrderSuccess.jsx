import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, Clock, Package } from 'lucide-react';
import { ordersApi } from '../services/api';
import Button from '../components/Button';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import PageTransition from '../components/PageTransition';

const STATUS_LABELS = {
  pending_payment: 'Awaiting Payment',
  payment_review: 'Payment Under Review',
  received: 'Order Received',
  printing: 'Printing',
  packing: 'Packing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderSuccess() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getById(id).then(({ data: d }) => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-500">Order not found.</p>
        <Link to="/"><Button className="mt-4">Go Home</Button></Link>
      </div>
    );
  }

  const { order, items, payments } = data;
  const latestPayment = payments?.[0];
  const paymentStatus = latestPayment?.status || 'pending';

  return (
    <PageTransition>
      <Helmet><title>{`Order ${order.order_number} — Book2Door`}</title></Helmet>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-slate-500">Thank you for your order. We&apos;ll process it shortly.</p>
        </div>

        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Order ID</p>
              <p className="font-mono font-semibold">{order.order_number}</p>
            </div>
            <div>
              <p className="text-slate-500">Order Status</p>
              <p className="font-semibold">{STATUS_LABELS[order.status] || order.status}</p>
            </div>
            <div>
              <p className="text-slate-500">Payment Status</p>
              <p className="font-semibold capitalize">{paymentStatus}</p>
            </div>
            <div>
              <p className="text-slate-500">Grand Total</p>
              <p className="font-bold text-brand-600">₹{order.grand_total}</p>
            </div>
            {order.payment_type === 'split' && (
              <>
                <div>
                  <p className="text-slate-500">Advance Paid</p>
                  <p>₹{order.advance_amount}</p>
                </div>
                <div>
                  <p className="text-slate-500">COD Remaining</p>
                  <p>₹{order.cod_amount}</p>
                </div>
              </>
            )}
          </div>

          {items?.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <p className="font-medium mb-3">Order Items</p>
              <ul className="space-y-2 text-sm">
                {items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-2">
                    <span className="truncate">
                      {item.books?.title || item.pdf_uploads?.file_name || item.item_type}
                    </span>
                    <span className="shrink-0">₹{item.line_total}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20">
            <Clock size={20} className="text-brand-600" />
            <div>
              <p className="font-medium">Estimated Delivery</p>
              <p className="text-sm text-slate-500">3–5 business days after payment confirmation</p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Link to={`/track?query=${order.order_number}`} className="flex-1">
              <Button variant="secondary" className="w-full"><Package size={16} /> Track Order</Button>
            </Link>
            <Link to="/books" className="flex-1">
              <Button className="w-full">Continue Shopping</Button>
            </Link>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
