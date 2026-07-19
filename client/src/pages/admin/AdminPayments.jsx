import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { Textarea } from '../../components/Input';
import Modal from '../../components/Modal';
import Skeleton from '../../components/Skeleton';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchPayments = () => {
    setLoading(true);
    adminApi.payments().then(({ data }) => setPayments(data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleAction = async (status) => {
    setUpdating(true);
    try {
      await adminApi.updatePayment(selected.id, { status, admin_note: note });
      setSelected(null);
      setNote('');
      fetchPayments();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Payments</h1>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : payments.length === 0 ? (
        <Card><p className="text-slate-500 text-center py-8">No payments yet.</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map((p) => (
            <Card key={p.id}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-mono text-sm">{p.orders?.order_number}</p>
                  <p className="text-sm text-slate-500">{p.orders?.customer_name}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                  p.status === 'approved' ? 'bg-green-100 text-green-700' :
                  p.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {p.status}
                </span>
              </div>
              <p className="font-bold mb-3">₹{p.amount}</p>
              {p.screenshot_signed_url && (
                <img src={p.screenshot_signed_url} alt="Payment" className="w-full h-32 object-cover rounded-lg mb-3" />
              )}
              {p.status === 'pending' && (
                <Button size="sm" className="w-full" onClick={() => setSelected(p)}>Review</Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Review Payment">
        {selected && (
          <div className="space-y-4">
            {selected.screenshot_signed_url && (
              <img src={selected.screenshot_signed_url} alt="Payment" className="w-full rounded-lg" />
            )}
            <p>Amount: <strong>₹{selected.amount}</strong></p>
            <p>Order: <strong>{selected.orders?.order_number}</strong></p>
            <Textarea label="Admin Note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => handleAction('approved')} disabled={updating}>Approve</Button>
              <Button variant="danger" className="flex-1" onClick={() => handleAction('rejected')} disabled={updating}>Reject</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
