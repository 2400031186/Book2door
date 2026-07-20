import { Link, NavLink } from 'react-router-dom';
import { BookOpen, ShoppingCart, Sun, Moon, Menu, X } from 'lucide-react';
import { useState } from 'react';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/clerk-react';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

const navLinks = [
  { to: '/books', label: 'Books' },
  { to: '/upload', label: 'Upload PDF' },
  { to: '/track', label: 'Track Order' },
  { to: '/cart', label: 'Cart' },
];

export default function Navbar() {
  const { toggleTheme, isDark } = useTheme();
  const { itemCount } = useCart();
  const { isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 glass border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg sm:text-xl shrink-0 min-w-0">
            <div className="p-1.5 rounded-lg gradient-bg shrink-0">
              <BookOpen size={18} className="text-inherit" />
            </div>
            <span className="gradient-text truncate">Book2Door</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.filter((l) => l.to !== '/cart').map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition hover:opacity-70 ${isActive ? 'text-[#0A0A0A] dark:text-white' : 'text-neutral-500 dark:text-neutral-400'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={toggleTheme}
              className="min-h-11 min-w-11 flex items-center justify-center rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              to="/cart"
              className="relative min-h-11 min-w-11 flex items-center justify-center rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              aria-label="Cart"
            >
              <ShoppingCart size={18} />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 text-[10px] font-bold rounded-full gradient-bg flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Sign In / User always visible on mobile top bar */}
            <SignedOut>
              <SignInButton mode="modal">
                <Button size="sm" className="min-h-11 px-3 sm:px-4 text-xs sm:text-sm">
                  Sign In
                </Button>
              </SignInButton>
              <div className="hidden md:block">
                <SignUpButton mode="modal">
                  <Button variant="secondary" size="sm">Sign Up</Button>
                </SignUpButton>
              </div>
            </SignedOut>
            <SignedIn>
              <div className="hidden md:block">
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="secondary" size="sm">Admin</Button>
                  </Link>
                )}
              </div>
              <div className="min-h-11 min-w-11 flex items-center justify-center">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>

            <button
              className="md:hidden min-h-11 min-w-11 flex items-center justify-center rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-neutral-200 dark:border-neutral-800 pt-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-3 rounded-xl text-sm font-medium min-h-11 ${
                    isActive
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-[#0A0A0A] dark:text-white'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <SignedOut>
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="block px-3 py-3 w-full text-left text-sm font-medium rounded-xl min-h-11 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-3 rounded-xl text-sm font-medium min-h-11 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Admin Panel
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
