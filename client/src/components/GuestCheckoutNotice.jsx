import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import Card from './Card';

export default function GuestCheckoutNotice({ compact = false }) {
  if (compact) {
    return (
      <p className="text-xs text-neutral-500">
        No account needed — checkout and track your order without signing in.
      </p>
    );
  }

  return (
    <Card className="p-4 sm:p-5 border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shrink-0">
          <ShoppingBag size={18} className="text-inherit" />
        </div>
        <div>
          <p className="font-semibold text-sm sm:text-base">Guest checkout</p>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Order without creating an account. Sign in is optional and only saves your details for next time.
          </p>
        </div>
      </div>
    </Card>
  );
}
