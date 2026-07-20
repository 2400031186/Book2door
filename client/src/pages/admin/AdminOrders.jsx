import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen, FileText, Download, ImageOff, User, Phone, MapPin, Hash,
  CreditCard, Package, Clock, ChevronRight,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { Select } from '../../components/Input';
import Modal from '../../components/Modal';
import Skeleton from '../../components/Skeleton';
import {
  ORDER_FILTER_OPTIONS,
  formatOrderStatusLabel,
  getOrderDisplayStatus,
  isPartialOrder,
} from '../../utils/orderStatus';

const STATUSES = ['payment_review', 'received', 'printing', 'packing', 'out_for_delivery', 'delivered', 'cancelled'];

const ORDER_STATUS_STYLES = {
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

const PAYMENT_STATUS_STYLES = {
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

function StatusBadge({ status, order, styles = ORDER_STATUS_STYLES }) {
  const displayStatus = order ? getOrderDisplayStatus(order) : status;
  const partial = order && isPartialOrder(order) && displayStatus !== 'received_partial';
  const label = formatOrderStatusLabel(displayStatus) + (partial ? ' · Partial' : '');

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[displayStatus] || styles.pending_payment}`}>
      {label}
    </span>
  );
}

function PaymentBadge({ order }) {
  if (order.payment_type === 'split' && Number(order.cod_amount) > 0) {
    return (
      <span className="inline-flex flex-col gap-0.5">
        <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Partial</span>
        <span className="text-[10px] text-slate-400">COD ₹{order.cod_amount}</span>
      </span>
    );
  }
  return <span className="text-xs text-slate-500">Full</span>;
}

function formatPrintOptions(opts) {
  if (!opts || typeof opts !== 'object') return null;
  const parts = [];
  if (opts.colorMode) parts.push(opts.colorMode === 'color' ? 'Color' : 'B&W');
  if (opts.sideMode) parts.push(opts.sideMode === 'double' ? 'Double-sided' : 'Single-sided');
  if (opts.copies) parts.push(`${opts.copies} cop${opts.copies > 1 ? 'ies' : 'y'}`);
  if (opts.spiralBinding) parts.push('Binding');
  return parts.length ? parts.join(' · ') : null;
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
        <Icon size={15} className="text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

function OrderItemRow({ item, onDownloadPdf, onDownloadBookPdf, downloadingId }) {
  const isBook = item.item_type === 'book';
  const book = item.books;
  const pdf = item.pdf_uploads;
  const downloadKey = isBook ? book?.id : pdf?.id;
  const isDownloading = downloadKey && downloadingId === downloadKey;

  const handleDownload = () => {
    if (isBook && book?.pdf_path) {
      onDownloadBookPdf(book.id, book.pdf_file_name || `${book.course_code}.pdf`);
    } else if (!isBook && pdf?.id) {
      onDownloadPdf(pdf.id, pdf.file_name);
    }
  };

  const canDownload = (isBook && book?.pdf_path) || (!isBook && pdf?.id);

  return (
    <div className="flex gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-900/40 dark:to-accent-900/40 flex items-center justify-center shrink-0">
        {isBook ? (
          <BookOpen size={20} className="text-brand-600" />
        ) : (
          <FileText size={20} className="text-accent-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm">
              {isBook ? book?.title || 'Book (removed)' : pdf?.file_name || 'PDF (removed)'}
            </p>
            {isBook && book && (
              <p className="text-xs text-slate-500 mt-1">
                <span className="font-mono font-semibold text-brand-600">{book.course_code}</span>
                {' · Year '}{book.year} · Sem {book.semester}
              </p>
            )}
            {!isBook && pdf && (
              <p className="text-xs text-slate-500 mt-1">
                {pdf.page_count ? `${pdf.page_count} pages` : 'Custom PDF print'}
                {formatPrintOptions(pdf.print_options) ? ` · ${formatPrintOptions(pdf.print_options)}` : ''}
              </p>
            )}
          </div>
          <span className="text-sm font-bold text-brand-600 shrink-0">₹{Number(item.line_total).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-400">Qty {item.quantity}</span>
          {canDownload && (
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
            >
              <Download size={14} />
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentSection({ payments }) {
  const latest = payments?.[0];

  if (!latest) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-400 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
        <CreditCard size={28} className="mb-2 opacity-50" />
        <p className="text-sm">No payment submitted yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg font-bold">₹{latest.amount}</span>
        <StatusBadge status={latest.status} styles={PAYMENT_STATUS_STYLES} />
        <span className="text-xs text-slate-500 capitalize">{latest.payment_type} payment</span>
      </div>
      {latest.admin_note && (
        <p className="text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
          Admin note: {latest.admin_note}
        </p>
      )}
      {latest.screenshot_signed_url ? (
        <a href={latest.screenshot_signed_url} target="_blank" rel="noopener noreferrer" className="block group">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900">
            <img
              src={latest.screenshot_signed_url}
              alt="Payment screenshot"
              className="w-full max-h-72 object-contain"
            />
          </div>
          <p className="text-xs text-brand-600 mt-2 group-hover:underline">Click to open full image →</p>
        </a>
      ) : (
        <div className="flex flex-col items-center gap-2 text-slate-400 py-10 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <ImageOff size={24} />
          <p className="text-sm">Screenshot not available</p>
        </div>
      )}
    </div>
  );
}

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const filter = searchParams.get('status') || 'all';
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    const params = filter === 'all' ? { status: 'all' } : { status: filter };
    adminApi.orders(params)
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [filter]);

  const handleFilterChange = (value) => {
    if (value === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ status: value });
    }
  };

  const handleUpdateStatus = async () => {
    if (!selected || !newStatus) return;
    setUpdating(true);
    try {
      await adminApi.updateOrderStatus(selected.id, { status: newStatus });
      setSelected(null);
      fetchOrders();
    } finally {
      setUpdating(false);
    }
  };

  const downloadFile = async (apiCall, id, fileName) => {
    setDownloadingId(id);
    try {
      const { data } = await apiCall(id);
      if (data?.url) {
        const a = document.createElement('a');
        a.href = data.url;
        a.download = data.file_name || fileName || 'document.pdf';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Review orders, download PDFs, and update status.</p>
        </div>
        <Select value={filter} onChange={(e) => handleFilterChange(e.target.value)} className="w-full sm:w-56">
          {ORDER_FILTER_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : orders.length === 0 ? (
        <Card className="text-center py-16">
          <Package size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No orders found.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Order</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Pickup</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Total</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Payment</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-semibold">{o.order_number}</span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{o.customer_name}</p>
                      <p className="text-xs text-slate-500">{o.phone}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-[120px] truncate">
                      {o.pickup_location || '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold">₹{o.grand_total}</td>
                    <td className="py-3 px-4"><PaymentBadge order={o} /></td>
                    <td className="py-3 px-4"><StatusBadge order={o} /></td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => { setSelected(o); setNewStatus(o.status); }}
                      >
                        Manage <ChevronRight size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="" size="2xl">
        {selected && (
          <div className="space-y-0 -mt-2">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Order</p>
                <h2 className="text-xl font-bold font-mono">{selected.order_number}</h2>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(selected.created_at).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge order={selected} />
                {isPartialOrder(selected) && (
                  <span className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg">
                    ₹{selected.cod_amount} COD pending on delivery
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 py-6">
              {/* Left column */}
              <div className="lg:col-span-2 space-y-5">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Customer</h3>
                  <Card className="p-4 space-y-1">
                    <InfoRow icon={User} label="Name" value={selected.customer_name} />
                    <InfoRow icon={Hash} label="College ID" value={selected.college_id} />
                    <InfoRow icon={Phone} label="Phone" value={selected.phone} />
                    <InfoRow
                      icon={MapPin}
                      label="Pickup Location"
                      value={selected.pickup_location || [selected.address, selected.city, selected.pincode].filter(Boolean).join(', ') || null}
                    />
                    {selected.order_notes && (
                      <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500">Order Notes</p>
                        <p className="text-sm mt-0.5">{selected.order_notes}</p>
                      </div>
                    )}
                  </Card>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Items ({selected.order_items?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {selected.order_items?.length > 0 ? (
                      selected.order_items.map((item) => (
                        <OrderItemRow
                          key={item.id}
                          item={item}
                          onDownloadPdf={(id, name) => downloadFile(adminApi.downloadPdf, id, name)}
                          onDownloadBookPdf={(id, name) => downloadFile(adminApi.downloadBookPdf, id, name)}
                          downloadingId={downloadingId}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-4">No items in this order.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="lg:col-span-3 space-y-5">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Payment</h3>
                  <Card className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-xs text-slate-500">Subtotal</p>
                        <p className="font-semibold">₹{selected.subtotal}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Delivery</p>
                        <p className="font-semibold">₹{selected.delivery_charge}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Grand Total</p>
                        <p className="font-bold text-brand-600 text-lg">₹{selected.grand_total}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Payment Type</p>
                        <p className="font-medium capitalize">{selected.payment_type}</p>
                      </div>
                      {selected.payment_type === 'split' && (
                        <>
                          <div>
                            <p className="text-xs text-slate-500">Advance Paid</p>
                            <p className="font-semibold">₹{selected.advance_amount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">COD Remaining</p>
                            <p className="font-semibold">₹{selected.cod_amount}</p>
                          </div>
                        </>
                      )}
                    </div>
                    <PaymentSection payments={selected.payments} />
                  </Card>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Update Status</h3>
                  <Card className="p-4">
                    <Select label="Order Status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </Select>
                    <Button onClick={handleUpdateStatus} disabled={updating} className="w-full mt-4">
                      {updating ? 'Updating...' : 'Save Status'}
                    </Button>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
