import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SignInButton } from '@clerk/clerk-react';
import { Search, Package, CheckCircle2, Circle } from 'lucide-react';
import { ordersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import { Input } from '../components/Input';
import PageTransition from '../components/PageTransition';

const STATUS_STEPS = ['received', 'printing', 'packing', 'out_for_delivery', 'delivered'];
const STATUS_LABELS = {
  pending_payment: 'Pending Payment',
  payment_review: 'Payment Review',
  received: 'Order Received',
  printing: 'Printing',
  packing: 'Packing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function Timeline({ history, currentStatus }) {
  const relevantHistory = history?.filter((h) =>
    STATUS_STEPS.includes(h.status) || h.status === 'payment_review' || h.status === 'pending_payment'
  ) || [];

  const currentIdx = STATUS_STEPS.indexOf(currentStatus);

  return (
    <div className="relative pl-8 space-y-6">
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700" />
      {relevantHistory.map((entry, i) => {
        const stepIdx = STATUS_STEPS.indexOf(entry.status);
        const isComplete = stepIdx >= 0 && stepIdx <= currentIdx;
        const isCurrent = entry.status === currentStatus;

        return (
          <div key={entry.id || i} className="relative">
            <div className={`absolute -left-5 w-6 h-6 rounded-full flex items-center justify-center ${
              isComplete ? 'gradient-bg' : 'bg-slate-200 dark:bg-slate-700'
            }`}>
              {isComplete ? (
                <CheckCircle2 size={14} className="text-white" />
              ) : (
                <Circle size={14} className="text-slate-400" />
              )}
            </div>
            <div>
              <p className={`font-medium ${isCurrent ? 'text-brand-600' : ''}`}>
                {STATUS_LABELS[entry.status] || entry.status}
              </p>
              {entry.note && <p className="text-sm text-slate-500">{entry.note}</p>}
              <p className="text-xs text-slate-400 mt-1">
                {new Date(entry.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order, history, payments }) {
  return (
    <Card className="mb-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Package size={24} className="text-brand-500 shrink-0" />
          <div className="min-w-0">
            <p className="font-mono font-semibold truncate">{order.order_number}</p>
            <p className="text-sm text-slate-500">
              {order.customer_name} · ₹{order.grand_total} · {STATUS_LABELS[order.status] || order.status}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <Link to={`/order/${order.id}`} className="text-sm text-brand-600 hover:underline shrink-0">
          Details
        </Link>
      </div>

      {payments?.[0] && (
        <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-sm">
          Payment: <span className="capitalize font-medium">{payments[0].status}</span>
        </div>
      )}

      <Timeline history={history} currentStatus={order.status} />
    </Card>
  );
}

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const { isSignedIn, loading: authLoading } = useAuth();
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (isSignedIn) {
      setLoading(true);
      setError('');
      ordersApi
        .getMine()
        .then(({ data }) => {
          setResults(Array.isArray(data) ? data : []);
          setSearched(false);
        })
        .catch((err) => {
          setResults([]);
          const msg =
            err.response?.data?.error ||
            (err.response?.status === 401
              ? 'Please sign in again to view your orders'
              : err.message?.includes('Network')
                ? 'Cannot reach the API. Check Vercel env vars and redeploy.'
                : 'Failed to load your orders');
          setError(msg);
        })
        .finally(() => setLoading(false));
      return;
    }

    setResults(null);
    setError('');
  }, [isSignedIn, authLoading]);

  useEffect(() => {
    const initial = searchParams.get('query');
    if (!initial?.trim() || isSignedIn || authLoading) return;

    setLoading(true);
    setError('');
    ordersApi
      .track(initial.trim())
      .then(({ data }) => {
        setResults(Array.isArray(data) ? data : [data]);
        setSearched(true);
      })
      .catch((err) => setError(err.response?.data?.error || 'No orders found'))
      .finally(() => setLoading(false));
  }, [searchParams, isSignedIn, authLoading]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);
    setSearched(true);

    try {
      const { data } = await ordersApi.track(query.trim());
      setResults(Array.isArray(data) ? data : [data]);
    } catch (err) {
      setError(err.response?.data?.error || 'No orders found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <Helmet><title>Track Order — Book2Door</title></Helmet>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
        <p className="text-slate-500 mb-8">
          {isSignedIn
            ? 'Your orders are shown below. You can also search by order ID or phone.'
            : 'Sign in to see your orders, or search by order ID / phone number.'}
        </p>

        {!authLoading && !isSignedIn && (
          <Card className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Sign in to view all your orders automatically.
            </p>
            <SignInButton mode="modal">
              <Button size="sm">Sign In</Button>
            </SignInButton>
          </Card>
        )}

        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <Input
            placeholder="Order ID (B2D-...) or Phone Number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            <Search size={16} /> {loading ? 'Searching...' : 'Track'}
          </Button>
        </form>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading && !results && (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && isSignedIn && results?.length === 0 && !searched && (
          <Card className="text-center py-10">
            <Package size={40} className="mx-auto mb-4 text-slate-300" />
            <p className="font-medium mb-1">No orders yet</p>
            <p className="text-sm text-slate-500 mb-4">Place an order and it will show up here.</p>
            <Link to="/books"><Button>Browse Books</Button></Link>
          </Card>
        )}

        {results?.map(({ order, history, payments }) => (
          <OrderCard key={order.id} order={order} history={history} payments={payments} />
        ))}
      </div>
    </PageTransition>
  );
}
