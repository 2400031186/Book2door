import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { Input } from '../../components/Input';
import Skeleton from '../../components/Skeleton';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrFile, setQrFile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    adminApi.getSettings().then(({ data }) => setSettings(data)).finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const fd = new FormData();
      Object.entries(settings).forEach(([k, v]) => {
        if (k !== 'upi_qr_url') fd.append(k, v);
      });
      if (qrFile) fd.append('qr', qrFile);

      const { data } = await adminApi.updateSettings(fd);
      setSettings(data);
      setMessage('Settings saved successfully!');
    } catch {
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-96 w-full" />;

  const fields = [
    { key: 'pdf_bw_per_page', label: 'B&W Price per Page (₹)' },
    { key: 'pdf_color_per_page', label: 'Color Price per Page (₹)' },
    { key: 'single_side_multiplier', label: 'Single Side Multiplier' },
    { key: 'double_side_multiplier', label: 'Double Side Multiplier' },
    { key: 'spiral_binding', label: 'Spiral Binding Charge (₹)' },
    { key: 'delivery_flat', label: 'Delivery Charge (₹)' },
    { key: 'min_order', label: 'Minimum Order (₹)' },
    { key: 'split_advance_percent', label: 'Split Advance (%)' },
    { key: 'upi_id', label: 'UPI ID' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pricing Settings</h1>

      <Card className="max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(({ key, label }) => (
            <Input
              key={key}
              label={label}
              type={key === 'upi_id' ? 'text' : 'number'}
              step={key.includes('multiplier') ? '0.1' : '1'}
              value={settings[key] ?? ''}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">UPI QR Code Image</label>
            <input type="file" accept="image/*" onChange={(e) => setQrFile(e.target.files[0])} />
          </div>
          {settings.upi_qr_url && (
            <img src={settings.upi_qr_url} alt="Current QR" className="w-32 h-32 rounded-lg" />
          )}
        </div>

        {message && <p className={`mt-4 text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>}

        <Button onClick={handleSave} disabled={saving} className="mt-6">
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Card>
    </div>
  );
}
