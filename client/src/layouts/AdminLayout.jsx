import { Link, NavLink, Outlet, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, ShoppingBag, CreditCard, Settings, ArrowLeft,
} from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { useAuth } from '../context/AuthContext';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/books', label: 'Books', icon: BookOpen },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { isSignedIn, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
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
    <div className="min-h-screen flex">
      <aside className="w-64 glass border-r border-white/20 hidden lg:flex flex-col">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50">
          <h1 className="font-bold text-lg gradient-text">Book2Door Admin</h1>
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
                    ? 'gradient-bg text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 space-y-2">
          <Link to="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 px-3 py-2">
            <ArrowLeft size={16} /> Back to Site
          </Link>
          <div className="px-3 py-2">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        <div className="lg:hidden p-4 glass border-b flex gap-2 overflow-x-auto items-center justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {adminNav.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                    isActive ? 'gradient-bg text-white' : 'bg-slate-100 dark:bg-slate-800'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
