import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import Card from '../../components/Card';
import Skeleton from '../../components/Skeleton';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard().then(({ data: d }) => setData(d)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  const cards = [
    { label: 'Pending Payments', value: data?.pendingPayments, color: 'text-yellow-500' },
    { label: 'Payment Review', value: data?.orderCounts?.payment_review, color: 'text-orange-500' },
    { label: 'In Progress', value: (data?.orderCounts?.printing || 0) + (data?.orderCounts?.packing || 0), color: 'text-blue-500' },
    { label: 'Delivered', value: data?.orderCounts?.delivered, color: 'text-green-500' },
    { label: 'Total Books', value: data?.totalBooks, color: 'text-brand-500' },
    { label: 'Received', value: data?.orderCounts?.received, color: 'text-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className={`text-3xl font-bold ${c.color}`}>{c.value ?? 0}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
