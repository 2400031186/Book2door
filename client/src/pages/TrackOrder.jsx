import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SignInButton } from '@clerk/clerk-react';
import {
  Search, Package, CheckCircle2, MapPin, Phone, Copy, ChevronDown, ChevronUp,
} from 'lucide-react';
import { ordersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  fetchGuestOrderDetails,
  loadGuestOrders,
  mergeOrderResults,
} from '../utils/guestOrders';
import Button from '../components/Button';
import Card from '../components/Card';
import { Input } from '../components/Input';
import PageTransition from '../components/PageTransition';

const TRACK_STEPS = ['Order Placed', 'Payment Received', 'Done'];

function getTrackingStepIndex(status) {
  if (status === 'delivered') return 2;
  if (['received', 'printing', 'packing', 'out_for_delivery'].includes(status)) return 1;
  return 0;
}

function getCustomerStatusLabel(status) {
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'delivered') return 'Done';
  if (['received', 'printing', 'packing', 'out_for_delivery'].includes(status)) return 'Payment Received';
  if (status === 'payment_review') return 'Payment Review';
  if (status === 'pending_payment') return 'Order Placed';
  return status?.replace(/_/g, ' ') || 'Unknown';
}

function getStatusMessage(status, pickupLocation) {
  if (status === 'pending_payment') return 'Complete UPI payment to continue.';
  if (status === 'payment_review') return 'We are verifying your payment. This usually takes a short while.';
  if (status === 'received' || status === 'printing' || status === 'packing') {
    return 'Payment confirmed. We are preparing your order.';
  }
  if (status === 'out_for_delivery') {
    return pickupLocation
      ? `Ready for pickup at ${pickupLocation}.`
      : 'Your order is ready for pickup.';
  }
  if (status === 'delivered') return 'Order complete. Thank you for ordering with Book2Door.';
  return null;
}

function mapHistoryLabel(status) {
  if (status === 'delivered') return 'Done';
  if (status === 'received') return 'Payment Received';
  if (['printing', 'packing'].includes(status)) return 'Preparing Order';
  if (status === 'out_for_delivery') return 'Ready for Pickup';
  if (status === 'payment_review') return 'Payment Under Review';
  if (status === 'pending_payment') return 'Order Placed';
  if (status === 'cancelled') return 'Cancelled';
  return status?.replace(/_/g, ' ') || status;
}

function statusBadgeClass(status) {
  if (status === 'delivered') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  if (status === 'cancelled') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  if (status === 'pending_payment' || status === 'payment_review') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  }
  return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200';
}

function ProgressSteps({ status, pickupLocation }) {
  if (status === 'cancelled') {
    return (
      <p className="text-sm text-red-600 font-medium py-2">This order was cancelled.</p>
    );
  }

  const idx = getTrackingStepIndex(status);
  const message = getStatusMessage(status, pickupLocation);

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        {TRACK_STEPS.map((label, i) => {
          const done = i <= idx;
          const current = i === idx;
          return (
            <div key={label} className="flex-1 flex flex-col items-center min-w-0">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold mb-2 ${
                  done
                    ? 'gradient-bg'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400'
                } ${current ? 'ring-2 ring-offset-2 ring-neutral-400 dark:ring-offset-[#141414]' : ''}`}
              >
                {done ? <CheckCircle2 size={18} /> : i + 1}
              </div>
              <span className={`text-xs sm:text-sm text-center leading-tight ${current ? 'font-bold' : done ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 mb-3 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full gradient-bg transition-all duration-500"
          style={{ width: `${(idx / (TRACK_STEPS.length - 1)) * 100}%` }}
        />
      </div>

      {message && (
        <p className="text-sm text-neutral-600 dark:text-neutral-300 text-center">{message}</p>
      )}
    </div>
  );
}

function OrderCard({ order, history, payments, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const payment = payments?.[0];

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="overflow-hidden p-0 mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left p-4 sm:p-5 flex items-start gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition"
      >
        <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0">
          <Package size={20} className="text-neutral-600 dark:text-neutral-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono font-bold text-sm sm:text-base">{order.order_number}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeClass(order.status)}`}>
              {getCustomerStatusLabel(order.status)}
            </span>
          </div>
          <p className="text-sm text-neutral-500">
            ₹{Number(order.grand_total).toFixed(2)}
            {order.pickup_location ? ` · ${order.pickup_location}` : ''}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <div className="shrink-0 text-neutral-400 mt-1">
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {open && (
        <div className="px-4 sm:px-5 pb-5 space-y-5 border-t border-neutral-200 dark:border-neutral-800 pt-4">
          <ProgressSteps status={order.status} pickupLocation={order.pickup_location} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3">
              <p className="text-xs text-neutral-500 mb-0.5">Customer</p>
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-neutral-500 flex items-center gap-1 mt-1">
                <Phone size={12} /> {order.phone}
              </p>
            </div>
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-3">
              <p className="text-xs text-neutral-500 mb-0.5">Pickup</p>
              <p className="font-medium flex items-center gap-1">
                <MapPin size={14} className="shrink-0" />
                {order.pickup_location || '—'}
              </p>
              {payment && (
                <p className="text-neutral-500 mt-1 capitalize">
                  Payment: {payment.status}
                  {order.payment_type === 'split' ? ' · Partial' : ' · Full'}
                </p>
              )}
            </div>
          </div>

          {history?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">Updates</p>
              <ul className="space-y-2">
                {[...history].reverse().slice(0, 5).map((h, i) => (
                  <li key={h.id || i} className="text-sm flex gap-2">
                    <span className="text-neutral-400 text-xs whitespace-nowrap pt-0.5">
                      {new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    <span>
                      <span className="font-medium">{mapHistoryLabel(h.status)}</span>
                      {h.note ? <span className="text-neutral-500"> — {h.note}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="secondary" size="sm" className="w-full sm:w-auto" onClick={copyOrderId}>
              <Copy size={14} /> {copied ? 'Copied!' : 'Copy Order ID'}
            </Button>
            <Link to={`/order/${order.id}`} className="w-full sm:w-auto">
              <Button size="sm" className="w-full">View Full Details</Button>
            </Link>
          </div>
        </div>
      )}
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

    let cancelled = false;

    async function loadOrders() {
      setLoading(true);
      setError('');

      try {
        const guestSaved = loadGuestOrders();
        const guestResults = guestSaved.length
          ? await fetchGuestOrderDetails(guestSaved)
          : [];

        if (isSignedIn) {
          const { data } = await ordersApi.getMine();
          const accountResults = Array.isArray(data) ? data : [];
          if (!cancelled) {
            setResults(mergeOrderResults(accountResults, guestResults));
            setSearched(false);
          }
        } else if (!cancelled) {
          setResults(guestResults);
          setSearched(false);
        }
      } catch (err) {
        if (!cancelled) {
          const guestSaved = loadGuestOrders();
          if (guestSaved.length) {
            const guestResults = await fetchGuestOrderDetails(guestSaved);
            setResults(guestResults);
          } else {
            setResults([]);
          }
          const msg =
            err.response?.data?.error ||
            (err.response?.status === 401
              ? 'Could not load account orders. Your saved orders are shown below.'
              : 'Failed to load orders');
          setError(isSignedIn ? msg : '');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrders();
    return () => { cancelled = true; };
  }, [isSignedIn, authLoading]);

  useEffect(() => {
    const initial = searchParams.get('query');
    if (!initial?.trim() || authLoading) return;

    setQuery(initial.trim());
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
  }, [searchParams, authLoading]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults(null);
    setSearched(true);

    try {
      const { data } = await ordersApi.track(query.trim());
      const found = Array.isArray(data) ? data : [data];
      const guestSaved = loadGuestOrders();
      const guestResults = guestSaved.length
        ? await fetchGuestOrderDetails(guestSaved)
        : [];
      setResults(mergeOrderResults(found, guestResults));
    } catch (err) {
      setError(err.response?.data?.error || 'No orders found. Check your order ID or phone number.');
    } finally {
      setLoading(false);
    }
  };

  const list = Array.isArray(results) ? results : [];
  const showGuestEmpty = !loading && !searched && list.length === 0;
  const showNoResults = searched && !loading && list.length === 0 && !error;

  return (
    <PageTransition>
      <Helmet><title>Track Order — Book2Door</title></Helmet>

      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
            <Package size={22} className="text-inherit" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Track Order</h1>
          <p className="text-neutral-500 text-sm sm:text-base max-w-sm mx-auto">
            Track with your order ID or phone. No login required — your orders are saved on this device.
          </p>
        </div>

        <Card className="p-4 sm:p-5 mb-6">
          <form onSubmit={handleSearch} className="space-y-3">
            <Input
              label="Order ID or Phone"
              placeholder="e.g. B2D-20260720-AB12 or 9876543210"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="tel"
            />
            <Button type="submit" disabled={loading || !query.trim()} className="w-full" size="lg">
              <Search size={18} />
              {loading ? 'Searching...' : 'Find My Order'}
            </Button>
          </form>
          <p className="text-xs text-neutral-400 mt-3 text-center">
            Order ID is on your confirmation page / SMS after payment.
          </p>
        </Card>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {loading && list.length === 0 && (
          <div className="flex flex-col items-center py-12 gap-3">
            <div className="animate-spin w-8 h-8 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full" />
            <p className="text-sm text-neutral-500">Looking up your order…</p>
          </div>
        )}

        {showGuestEmpty && (
          <Card className="text-center py-10 p-6">
            <Package size={40} className="mx-auto mb-3 text-neutral-300" />
            <p className="font-semibold mb-1">No orders yet</p>
            <p className="text-sm text-neutral-500 mb-4">
              Place an order without signing in. It will appear here automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center mb-4">
              <Link to="/books"><Button>Browse Books</Button></Link>
              <Link to="/upload"><Button variant="secondary">Upload PDF</Button></Link>
            </div>
            <p className="text-xs text-neutral-400">
              Optional:{' '}
              <SignInButton mode="modal">
                <button type="button" className="underline underline-offset-2">Sign in</button>
              </SignInButton>
              {' '}to sync orders across devices.
            </p>
          </Card>
        )}

        {!showGuestEmpty && list.length > 0 && !searched && (
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Your orders ({list.length})
            </h2>
          </div>
        )}

        {showNoResults && (
          <Card className="text-center py-10 p-6">
            <p className="font-semibold mb-1">No orders found</p>
            <p className="text-sm text-neutral-500">
              Double-check the order ID (starts with B2D-) or the phone used at checkout.
            </p>
          </Card>
        )}

        {searched && list.length > 0 && (
          <p className="text-sm text-neutral-500 mb-3">
            {list.length} result{list.length !== 1 ? 's' : ''} found
          </p>
        )}

        {list.map(({ order, history, payments }, i) => (
          <OrderCard
            key={order.id}
            order={order}
            history={history}
            payments={payments}
            defaultOpen={list.length === 1 || i === 0}
          />
        ))}
      </div>
    </PageTransition>
  );
}
