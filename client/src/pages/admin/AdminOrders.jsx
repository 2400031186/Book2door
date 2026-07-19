import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { Select } from '../../components/Input';
import Modal from '../../components/Modal';
import Skeleton from '../../components/Skeleton';

const STATUSES = ['payment_review', 'received', 'printing', 'packing', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = () => {
    setLoading(true);
    adminApi.orders(filter ? { status: filter } : {})
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [filter]);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-48">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </Select>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-2">Order</th>
                <th className="text-left py-3 px-2">Customer</th>
                <th className="text-left py-3 px-2">Phone</th>
                <th className="text-left py-3 px-2">Total</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-3 px-2 font-mono">{o.order_number}</td>
                  <td className="py-3 px-2">{o.customer_name}</td>
                  <td className="py-3 px-2">{o.phone}</td>
                  <td className="py-3 px-2">₹{o.grand_total}</td>
                  <td className="py-3 px-2 capitalize">{o.status.replace(/_/g, ' ')}</td>
                  <td className="py-3 px-2">
                    <Button size="sm" variant="secondary" onClick={() => { setSelected(o); setNewStatus(o.status); }}>
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Order Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Order:</span> {selected.order_number}</div>
              <div><span className="text-slate-500">Name:</span> {selected.customer_name}</div>
              <div><span className="text-slate-500">College ID:</span> {selected.college_id}</div>
              <div><span className="text-slate-500">Phone:</span> {selected.phone}</div>
              <div className="col-span-2"><span className="text-slate-500">Address:</span> {selected.address}, {selected.city} - {selected.pincode}</div>
              <div><span className="text-slate-500">Total:</span> ₹{selected.grand_total}</div>
              <div><span className="text-slate-500">Payment:</span> {selected.payment_type}</div>
            </div>
            <Select label="Update Status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </Select>
            <Button onClick={handleUpdateStatus} disabled={updating} className="w-full">
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
