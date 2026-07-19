import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, Phone, Send, QrCode, Upload, CheckCircle, Copy } from 'lucide-react';
import { ordersApi, paymentsApi, settingsApi } from '../services/api';
import { useCart } from '../context/CartContext';
import usePricing from '../hooks/usePricing';
import Button from '../components/Button';
import Card from '../components/Card';
import { Input, Textarea } from '../components/Input';
import OrderSummary, { useOrderTotals } from '../components/OrderSummary';
import PageTransition from '../components/PageTransition';

export default function Checkout() {
  const { items, ready, clearCart } = useCart();
  const { splitPercent, minOrder } = usePricing();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [paymentType, setPaymentType] = useState('split');
  const [step, setStep] = useState('form');
  const [orderData, setOrderData] = useState(null);
  const [upiInfo, setUpiInfo] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const { grandTotal, advanceAmount, codAmount } = useOrderTotals(paymentType);

  useEffect(() => {
    if (ready && items.length === 0 && step === 'form') {
      navigate('/cart');
    }
  }, [ready, items.length, step, navigate]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const onSubmitOrder = async (data) => {
    if (grandTotal < minOrder) {
      setError(`Minimum order amount is ₹${minOrder}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        ...data,
        payment_type: paymentType,
        items: items.map((item) => ({
          type: item.type,
          id: item.id,
          quantity: item.quantity || 1,
        })),
      };

      const { data: result } = await ordersApi.create(payload);
      setOrderData(result);

      const pricingRes = await settingsApi.getPricing();
      const amountDue =
        result.payment?.amount_due_now ??
        (paymentType === 'full' ? result.order.grand_total : result.payment.advance_amount);

      setUpiInfo({
        upi_id: result.upi_id || pricingRes.data.upi_id,
        upi_qr_url: result.upi_qr_url || pricingRes.data.upi_qr_url,
        amount: Number(amountDue),
        paymentType: result.order.payment_type,
      });

      setStep('payment');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshot = (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setError('Only JPG, JPEG, and PNG files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Maximum file size is 5MB');
      return;
    }
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  };

  const submitPayment = async () => {
    if (!confirmed) {
      setError('Please confirm that you have completed the payment');
      return;
    }
    if (!screenshot) {
      setError('Please upload payment screenshot');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('order_id', orderData.order.id);
      formData.append('payment_confirmed', 'true');
      formData.append('screenshot', screenshot);

      await paymentsApi.submit(formData);
      clearCart();
      navigate(`/order/${orderData.order.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Payment submission failed');
    } finally {
      setLoading(false);
    }
  };

  const copyUpi = () => {
    if (upiInfo?.upi_id) {
      navigator.clipboard.writeText(upiInfo.upi_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210';
  const supportPhone = import.meta.env.VITE_SUPPORT_PHONE || '919876543210';
  const telegram = import.meta.env.VITE_TELEGRAM_USERNAME || 'book2door';

  return (
    <PageTransition>
      <Helmet><title>Checkout — Book2Door</title></Helmet>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-slate-500 mb-8">
          {step === 'form' ? 'Enter delivery details and choose payment method' : 'Complete your UPI payment'}
        </p>

        {step === 'form' ? (
          <form onSubmit={handleSubmit(onSubmitOrder)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <h2 className="font-semibold mb-4">Delivery Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Name *" {...register('customer_name', { required: 'Name is required' })} error={errors.customer_name?.message} />
                  <Input label="College ID *" {...register('college_id', { required: 'College ID is required' })} error={errors.college_id?.message} />
                  <Input label="Phone *" {...register('phone', { required: 'Phone is required', pattern: { value: /^\d{10}$/, message: 'Enter 10-digit phone' } })} error={errors.phone?.message} />
                  <Input label="City *" {...register('city', { required: 'City is required' })} error={errors.city?.message} />
                  <Input label="Pincode *" {...register('pincode', { required: 'Pincode is required' })} error={errors.pincode?.message} />
                  <div className="sm:col-span-2">
                    <Input label="Address *" {...register('address', { required: 'Address is required' })} error={errors.address?.message} />
                  </div>
                  <div className="sm:col-span-2">
                    <Textarea label="Order Notes" rows={2} {...register('order_notes')} />
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className="font-semibold mb-4">Payment Method</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentType('full')}
                    className={`p-4 rounded-xl border-2 text-left transition ${paymentType === 'full' ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                    <div className="font-semibold">Full Payment</div>
                    <div className="text-sm text-slate-500">Pay ₹{grandTotal.toFixed(2)} online now</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('split')}
                    className={`p-4 rounded-xl border-2 text-left transition ${paymentType === 'split' ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                    <div className="font-semibold">Split Payment</div>
                    <div className="text-sm text-slate-500">
                      ₹{advanceAmount.toFixed(2)} now + ₹{codAmount.toFixed(2)} COD
                    </div>
                  </button>
                </div>
              </Card>
            </div>

            <div>
              <Card className="sticky top-24">
                <h2 className="font-semibold mb-4">Order Summary</h2>
                <OrderSummary paymentType={paymentType} splitPercent={splitPercent} showMinOrderWarning />
                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                <Button
                  type="submit"
                  className="w-full mt-6"
                  disabled={loading || grandTotal < minOrder}
                >
                  {loading ? 'Creating Order...' : 'Continue to Payment'}
                </Button>
              </Card>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <QrCode size={20} /> Pay via UPI
                </h2>
                <div className="text-center space-y-4">
                  {orderData?.order?.order_number && (
                    <p className="text-sm text-slate-500">
                      Order: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{orderData.order.order_number}</span>
                    </p>
                  )}
                  {upiInfo?.upi_qr_url ? (
                    <img src={upiInfo.upi_qr_url} alt="UPI QR" className="mx-auto w-48 h-48 rounded-xl border" />
                  ) : (
                    <div className="mx-auto w-48 h-48 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <QrCode size={64} className="text-slate-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-500">UPI ID</p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="font-mono font-semibold">{upiInfo?.upi_id || 'book2door@upi'}</p>
                      <button type="button" onClick={copyUpi} className="p-1 hover:text-brand-600" title="Copy UPI ID">
                        <Copy size={16} />
                      </button>
                    </div>
                    {copied && <p className="text-xs text-green-600 mt-1">Copied!</p>}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">
                      {upiInfo?.paymentType === 'split' ? 'Advance Amount to Pay' : 'Amount to Pay'}
                    </p>
                    <p className="text-3xl font-bold gradient-text">₹{Number(upiInfo?.amount || 0).toFixed(2)}</p>
                  </div>
                  {upiInfo?.paymentType === 'split' && orderData?.order && (
                    <p className="text-sm text-slate-500">
                      Remaining ₹{Number(orderData.order.cod_amount).toFixed(2)} due on delivery
                    </p>
                  )}
                  <p className="text-xs text-slate-500">Scan QR → Pay → Upload screenshot below</p>
                </div>
              </Card>

              <Card>
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Upload size={20} /> Upload Payment Screenshot
                </h2>
                <div className="space-y-4">
                  <label className="block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-brand-500 transition">
                    <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={(e) => handleScreenshot(e.target.files[0])} />
                    {preview ? (
                      <img src={preview} alt="Preview" className="mx-auto max-h-40 rounded-lg" />
                    ) : (
                      <p className="text-sm text-slate-500">Click to upload JPG/PNG (max 5MB)</p>
                    )}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                    I have completed the payment.
                  </label>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <Button className="w-full" onClick={submitPayment} disabled={loading}>
                    <CheckCircle size={16} /> {loading ? 'Submitting...' : 'Confirm Payment'}
                  </Button>
                </div>
              </Card>

              <Card>
                <h2 className="font-semibold mb-3">Need help paying?</h2>
                <div className="flex flex-wrap gap-3">
                  <a href={`https://wa.me/${whatsapp}?text=Order%20${orderData?.order?.order_number}%20-%20Need%20help%20with%20payment`} target="_blank" rel="noreferrer">
                    <Button variant="secondary" size="sm"><MessageCircle size={16} /> WhatsApp</Button>
                  </a>
                  <a href={`https://t.me/${telegram}`} target="_blank" rel="noreferrer">
                    <Button variant="secondary" size="sm"><Send size={16} /> Telegram</Button>
                  </a>
                  <a href={`tel:+${supportPhone}`}>
                    <Button variant="secondary" size="sm"><Phone size={16} /> Call</Button>
                  </a>
                </div>
              </Card>
            </div>

            <div>
              <Card className="sticky top-24">
                <h2 className="font-semibold mb-4">Order Summary</h2>
                {orderData?.order && (
                  <OrderSummary
                    paymentType={orderData.order.payment_type}
                    splitPercent={splitPercent}
                    showItems
                  />
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
