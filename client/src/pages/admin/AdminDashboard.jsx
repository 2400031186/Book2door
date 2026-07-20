import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle, ArrowRight, BookOpen, CreditCard, Package, ShoppingBag,
  TrendingUp, Wallet,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';
import {
  formatOrderStatusLabel,
  getOrderDisplayStatus,
  isPartialOrder,
} from '../../utils/orderStatus';

function StatCard({ label, value, sub, icon: Icon, color, iconBg, to, urgent }) {
  const content = (
    <Card className={`h-full transition hover:shadow-md ${to ? 'cursor-pointer hover:border-brand-300 dark:hover:border-brand-700' : ''} ${urgent && Number(value) > 0 ? 'ring-2 ring-amber-400/50' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? 0}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
      {to && (
        <p className="text-xs text-brand-600 mt-3 flex items-center gap-1">
          View <ArrowRight size={12} />
        </p>
      )}
    </Card>
  );

  return to ? <Link to={to} className="block">{content}</Link> : content;
}

function StatusPill({ order }) {
  const displayStatus = getOrderDisplayStatus(order);
  const partial = isPartialOrder(order);

  const styles = {
    pending_payment: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    payment_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    received: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    received_partial: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    printing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    packing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    out_for_delivery: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[displayStatus] || styles.pending_payment}`}>
      {formatOrderStatusLabel(displayStatus)}
      {partial && displayStatus !== 'received_partial' && ' · Partial'}
    </span>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard().then(({ data: d }) => setData(d)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const needsAction = (data?.orderCounts?.payment_review || 0) + (data?.pendingPayments || 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of orders, payments, and what needs your attention.</p>
      </div>

      {needsAction > 0 && (
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-200">Action needed</p>
              <p className="text-sm text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                {data.pendingPayments} payment{data.pendingPayments !== 1 ? 's' : ''} to review
                {data.orderCounts?.payment_review > 0 && ` · ${data.orderCounts.payment_review} order${data.orderCounts.payment_review !== 1 ? 's' : ''} awaiting approval`}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Link to="/admin/payments" className="text-xs font-medium text-amber-900 dark:text-amber-200 underline">
                  Review payments →
                </Link>
                <Link to="/admin/orders?status=payment_review" className="text-xs font-medium text-amber-900 dark:text-amber-200 underline">
                  View orders →
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Orders"
          value={data?.todayOrders}
          sub={`₹${Number(data?.todayRevenue || 0).toLocaleString('en-IN')} value`}
          icon={TrendingUp}
          color="text-brand-600"
          iconBg="bg-brand-100 dark:bg-brand-900/30"
          to="/admin/orders?status=all"
        />
        <StatCard
          label="Payment Review"
          value={data?.orderCounts?.payment_review}
          sub="Awaiting approval"
          icon={CreditCard}
          color="text-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          to="/admin/orders?status=payment_review"
          urgent
        />
        <StatCard
          label="Partial · COD Pending"
          value={data?.partialOrders}
          sub={`${data?.receivedPartial || 0} received partial`}
          icon={Wallet}
          color="text-orange-600"
          iconBg="bg-orange-100 dark:bg-orange-900/30"
          to="/admin/orders?status=partial"
          urgent={data?.partialOrders > 0}
        />
        <StatCard
          label="In Progress"
          value={data?.inProgress}
          sub="Printing · Packing · Delivery"
          icon={Package}
          color="text-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          to="/admin/orders?status=printing"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Delivered"
          value={data?.orderCounts?.delivered}
          icon={ShoppingBag}
          color="text-green-600"
          iconBg="bg-green-100 dark:bg-green-900/30"
          to="/admin/orders?status=delivered"
        />
        <StatCard
          label="Pending Payment"
          value={data?.orderCounts?.pending_payment}
          icon={CreditCard}
          color="text-slate-600"
          iconBg="bg-slate-100 dark:bg-slate-800"
          to="/admin/orders?status=pending_payment"
        />
        <StatCard
          label="Active Books"
          value={data?.totalBooks}
          icon={BookOpen}
          color="text-purple-600"
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          to="/admin/books"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link to="/admin/orders?status=all" className="text-sm text-brand-600 hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <Card className="overflow-hidden p-0">
          {!data?.recentOrders?.length ? (
            <p className="text-slate-500 text-center py-10">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Order</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Pickup</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Total</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <td className="py-3 px-4">
                        <Link to="/admin/orders" className="font-mono text-xs font-semibold text-brand-600 hover:underline">
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{o.customer_name}</p>
                        <p className="text-xs text-slate-500">{o.phone}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-[100px] truncate">{o.pickup_location || '—'}</td>
                      <td className="py-3 px-4 font-semibold">₹{o.grand_total}</td>
                      <td className="py-3 px-4"><StatusPill order={o} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
