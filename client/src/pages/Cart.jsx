import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Trash2, Plus, Minus, ShoppingBag, FileText, BookOpen } from 'lucide-react';
import { useCart, getLineTotal } from '../context/CartContext';
import usePricing from '../hooks/usePricing';
import Button from '../components/Button';
import Card from '../components/Card';
import OrderSummary, { useOrderTotals } from '../components/OrderSummary';
import PageTransition from '../components/PageTransition';

export default function Cart() {
  const { items, ready, updateQuantity, removeItem, clearCart } = useCart();
  const { minOrder } = usePricing();
  const { grandTotal } = useOrderTotals('split');
  const canCheckout = grandTotal >= minOrder;

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <PageTransition>
        <Helmet><title>Cart — Book2Door</title></Helmet>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <ShoppingBag size={64} className="mx-auto mb-6 text-slate-300" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-slate-500 mb-6">Browse books or upload a PDF to get started.</p>
          <div className="flex gap-4 justify-center">
            <Link to="/books"><Button>Browse Books</Button></Link>
            <Link to="/upload"><Button variant="secondary">Upload PDF</Button></Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Helmet><title>{`Cart (${items.length}) — Book2Door`}</title></Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Your Cart</h1>
          <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600">
            Clear cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.cartKey} className="flex gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-900/30 dark:to-accent-900/30 flex items-center justify-center shrink-0">
                  {item.type === 'book' ? (
                    <BookOpen size={24} className="text-brand-500" />
                  ) : (
                    <FileText size={24} className="text-accent-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    {item.type === 'book' ? item.title : item.file_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {item.type === 'book' ? item.subject : 'Custom PDF Print'}
                    {item.type === 'pdf' && item.page_count ? ` · ${item.page_count} pages` : ''}
                  </p>
                  <p className="text-brand-600 font-bold mt-1">
                    ₹{getLineTotal(item).toFixed(2)}
                    {item.type === 'book' && item.quantity > 1 && (
                      <span className="text-xs font-normal text-slate-500 ml-1">
                        (₹{Number(item.price).toFixed(2)} × {item.quantity})
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {item.type === 'book' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(item.cartKey)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <div>
            <Card className="sticky top-24">
              <h2 className="font-semibold mb-4">Price Summary</h2>
              <OrderSummary showItems={false} showMinOrderWarning />

              {canCheckout ? (
                <Link to="/checkout" className="block mt-6">
                  <Button className="w-full" size="lg">Proceed to Checkout</Button>
                </Link>
              ) : (
                <Button className="w-full mt-6" size="lg" disabled>
                  Minimum order ₹{minOrder}
                </Button>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
