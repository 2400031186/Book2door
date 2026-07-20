import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Trash2, Plus, Minus, ShoppingBag, FileText } from 'lucide-react';
import { useCart, getLineTotal } from '../context/CartContext';
import { getBookCoverUrl } from '../constants/books';
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
        <div className="animate-spin w-8 h-8 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <PageTransition>
        <Helmet><title>Cart — Book2Door</title></Helmet>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <ShoppingBag size={64} className="mx-auto mb-6 text-neutral-300" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-neutral-500 mb-6">Browse books or upload a PDF — no account needed.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/books"><Button className="w-full sm:w-auto">Browse Books</Button></Link>
            <Link to="/upload"><Button variant="secondary" className="w-full sm:w-auto">Upload PDF</Button></Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Helmet><title>{`Cart (${items.length}) — Book2Door`}</title></Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Your Cart</h1>
          <button type="button" onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 min-h-11 px-2">
            Clear cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {items.map((item) => (
              <Card key={item.cartKey} className="flex gap-3 sm:gap-4 p-4 sm:p-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0 overflow-hidden p-1">
                  {item.type === 'book' ? (
                    <img
                      src={getBookCoverUrl(item.cover_image_url)}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <FileText size={24} className="text-neutral-600 dark:text-neutral-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    {item.type === 'book' ? item.title : item.file_name}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {item.type === 'book'
                      ? `${item.course_code || 'Book'} · Year ${item.year || '—'} · Sem ${item.semester || '—'}`
                      : 'Custom PDF Print'}
                    {item.type === 'pdf' && item.page_count ? ` · ${item.page_count} pages` : ''}
                  </p>
                  <p className="font-bold mt-1">
                    ₹{getLineTotal(item).toFixed(2)}
                    {item.type === 'book' && item.quantity > 1 && (
                      <span className="text-xs font-normal text-neutral-500 ml-1">
                        (₹{Number(item.price).toFixed(2)} × {item.quantity})
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {item.type === 'book' && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                        className="min-h-9 min-w-9 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                        className="min-h-9 min-w-9 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(item.cartKey)}
                    className="min-h-9 min-w-9 flex items-center justify-center text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <div>
            <Card className="sticky bottom-4 lg:top-24 p-4 sm:p-6">
              <h2 className="font-semibold mb-4">Price Summary</h2>
              <OrderSummary showItems={false} showMinOrderWarning />
              <p className="text-xs text-neutral-500 mt-3">Checkout without an account.</p>

              {canCheckout ? (
                <Link to="/checkout" className="block mt-4 sm:mt-6">
                  <Button className="w-full" size="lg">Proceed to Checkout</Button>
                </Link>
              ) : (
                <Button className="w-full mt-4 sm:mt-6" size="lg" disabled>
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
