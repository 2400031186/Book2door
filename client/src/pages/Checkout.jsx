import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, Phone, Send, QrCode, Upload, CheckCircle, Copy } from 'lucide-react';
import { ordersApi, paymentsApi, settingsApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import usePricing from '../hooks/usePricing';
import Button from '../components/Button';
import Card from '../components/Card';
import { Input, Textarea, Select } from '../components/Input';
import OrderSummary, { useOrderTotals } from '../components/OrderSummary';
import PageTransition from '../components/PageTransition';

const CHECKOUT_STORAGE_KEY = 'book2door-checkout';

function loadSavedCheckout() {
  try {
    const saved = localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return null;
}

function saveCheckoutDetails(details) {
  try {
    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(details));
  } catch {
    /* ignore */
  }
}

export default function Checkout() {
  const { items, ready, clearCart } = useCart();
  const { isSignedIn } = useAuth();
  const { splitPercent, minOrder } = usePricing();
  const navigate = useNavigate();
  const saved = loadSavedCheckout();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customer_name: saved?.customer_name || '',
      college_id: saved?.college_id || '',
      phone: saved?.phone || '',
      pickup_location: saved?.pickup_location || '',
      order_notes: '',
    },
  });
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
  const [pickupLocations, setPickupLocations] = useState([]);
  const [savedPickup, setSavedPickup] = useState(saved?.pickup_location || '');
  const [changingPickup, setChangingPickup] = useState(false);

  const { grandTotal, advanceAmount, codAmount } = useOrderTotals(paymentType);

  useEffect(() => {
    settingsApi.getPricing().then(({ data }) => {
      setPickupLocations(data.pickup_locations || []);
    });
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;

    ordersApi.getCheckoutDetails()
      .then(({ data }) => {
        if (!data) return;

        if (data.customer_name) setValue('customer_name', data.customer_name);
        if (data.college_id) setValue('college_id', data.college_id);
        if (data.phone) setValue('phone', data.phone);
        if (data.pickup_location) {
          setValue('pickup_location', data.pickup_location);
          setSavedPickup(data.pickup_location);
          saveCheckoutDetails({
            customer_name: data.customer_name || saved?.customer_name || '',
            college_id: data.college_id || saved?.college_id || '',
            phone: data.phone || saved?.phone || '',
            pickup_location: data.pickup_location,
          });
        }
      })
      .catch(() => {});
  }, [isSignedIn, setValue]);

  useEffect(() => {
    if (savedPickup && !changingPickup) {
      setValue('pickup_location', savedPickup);
    }
  }, [savedPickup, changingPickup, setValue]);

  useEffect(() => {
    if (ready && items.length === 0 && step === 'form') {
      navigate('/cart');
    }
  }, [ready, items.length, step, navigate]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-8 h-8 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  const showSavedPickupOnly = savedPickup && !changingPickup;
  const pickupOptions = showSavedPickupOnly
    ? [savedPickup]
    : pickupLocations;

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

      saveCheckoutDetails({
        customer_name: data.customer_name,
        college_id: data.college_id,
        phone: data.phone,
        pickup_location: data.pickup_location,
      });
      setSavedPickup(data.pickup_location);
      setChangingPickup(false);

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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-neutral-500 mb-2 text-sm sm:text-base">
          {step === 'form' ? 'Enter your details and choose a pickup location' : 'Complete your UPI payment'}
        </p>
        {step === 'form' && (
          <p className="text-xs sm:text-sm text-neutral-400 mb-6 sm:mb-8">
            No account needed. Sign in only if you want your details saved for next time.
          </p>
        )}

        {step === 'form' ? (
          <form onSubmit={handleSubmit(onSubmitOrder)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6">
                <h2 className="font-semibold mb-4">Pickup Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Name *" {...register('customer_name', { required: 'Name is required' })} error={errors.customer_name?.message} />
                  <Input label="College ID *" {...register('college_id', { required: 'College ID is required' })} error={errors.college_id?.message} />
                  <Input label="Phone *" {...register('phone', { required: 'Phone is required', pattern: { value: /^\d{10}$/, message: 'Enter 10-digit phone' } })} error={errors.phone?.message} />
                  <div className="sm:col-span-2">
                    {showSavedPickupOnly ? (
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Pickup Location *
                        </label>
                        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#141414] px-4 py-2.5 min-h-11">
                          <span className="text-sm flex-1">{savedPickup}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setChangingPickup(true);
                              setValue('pickup_location', '');
                            }}
                            className="text-xs font-medium underline underline-offset-2"
                          >
                            Change
                          </button>
                        </div>
                        <input type="hidden" {...register('pickup_location', { required: 'Pickup location is required' })} />
                      </div>
                    ) : (
                      <Select
                        label="Pickup Location *"
                        {...register('pickup_location', { required: 'Pickup location is required' })}
                        error={errors.pickup_location?.message}
                      >
                        <option value="">Select pickup location</option>
                        {pickupOptions.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </Select>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Textarea label="Order Notes" rows={2} {...register('order_notes')} />
                  </div>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <h2 className="font-semibold mb-4">Payment Method</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentType('full')}
                    className={`p-4 rounded-xl border-2 text-left transition min-h-11 ${paymentType === 'full' ? 'border-[#0A0A0A] dark:border-white bg-neutral-50 dark:bg-neutral-900' : 'border-neutral-200 dark:border-neutral-700'}`}
                  >
                    <div className="font-semibold">Full Payment</div>
                    <div className="text-sm text-neutral-500">Pay ₹{grandTotal.toFixed(2)} online now</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('split')}
                    className={`p-4 rounded-xl border-2 text-left transition min-h-11 ${paymentType === 'split' ? 'border-[#0A0A0A] dark:border-white bg-neutral-50 dark:bg-neutral-900' : 'border-neutral-200 dark:border-neutral-700'}`}
                  >
                    <div className="font-semibold">Split Payment</div>
                    <div className="text-sm text-neutral-500">
                      ₹{advanceAmount.toFixed(2)} now + ₹{codAmount.toFixed(2)} COD
                    </div>
                  </button>
                </div>
              </Card>
            </div>

            <div>
              <Card className="sticky bottom-4 lg:top-24 p-4 sm:p-6">
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
                      <p className="font-mono font-semibold">{upiInfo?.upi_id || 'book2door@ybl'}</p>
                      <button type="button" onClick={copyUpi} className="p-1 hover:opacity-70" title="Copy UPI ID">
                        <Copy size={16} />
                      </button>
                    </div>
                    {copied && <p className="text-xs text-green-600 mt-1">Copied!</p>}
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">
                      {upiInfo?.paymentType === 'split' ? 'Advance Amount to Pay' : 'Amount to Pay'}
                    </p>
                    <p className="text-3xl font-bold">₹{Number(upiInfo?.amount || 0).toFixed(2)}</p>
                  </div>
                  {upiInfo?.paymentType === 'split' && orderData?.order && (
                    <p className="text-sm text-neutral-500">
                      Remaining ₹{Number(orderData.order.cod_amount).toFixed(2)} due on delivery
                    </p>
                  )}
                  <p className="text-xs text-neutral-500">Scan QR → Pay → Upload screenshot below</p>
                </div>
              </Card>

              <Card>
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Upload size={20} /> Upload Payment Screenshot
                </h2>
                <div className="space-y-4">
                  <label className="block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-[#0A0A0A] dark:hover:border-white transition border-neutral-300 dark:border-neutral-600">
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
