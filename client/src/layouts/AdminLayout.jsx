import { Link, NavLink, Outlet, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, ShoppingBag, CreditCard, Settings, ArrowLeft, ClipboardList, HardDrive,
} from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { useAuth } from '../context/AuthContext';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/order-book', label: 'Order Book', icon: ClipboardList },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/books', label: 'Books', icon: BookOpen },
  { to: '/admin/store', label: 'Store', icon: HardDrive },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { isSignedIn, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0A0A0A]">
        <div className="animate-spin w-8 h-8 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace state={{ from: '/admin' }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex bg-[#FAFAFA] dark:bg-[#0A0A0A]">
      <aside className="w-64 bg-white dark:bg-[#141414] border-r border-neutral-200 dark:border-neutral-800 hidden lg:flex flex-col">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h1 className="font-bold text-lg">Book2Door Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {adminNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'gradient-bg'
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
          <Link to="/" className="flex items-center gap-2 text-sm text-neutral-500 hover:text-[#0A0A0A] dark:hover:text-white px-3 py-2">
            <ArrowLeft size={16} /> Back to Site
          </Link>
          <div className="px-3 py-2">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        <div className="lg:hidden p-3 bg-white dark:bg-[#141414] border-b border-neutral-200 dark:border-neutral-800 flex gap-2 overflow-x-auto items-center justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {adminNav.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm whitespace-nowrap min-h-11 flex items-center ${
                    isActive ? 'gradient-bg' : 'bg-neutral-100 dark:bg-neutral-900'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
