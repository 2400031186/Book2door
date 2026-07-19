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
];

export default function Navbar() {
  const { toggleTheme, isDark } = useTheme();
  const { itemCount } = useCart();
  const { isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 glass border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="p-1.5 rounded-xl gradient-bg">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="gradient-text">Book2Door</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition hover:text-brand-600 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-300'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link to="/cart" className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <ShoppingCart size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold rounded-full gradient-bg text-white flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            <div className="hidden md:flex items-center gap-2">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="secondary" size="sm">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">Sign Up</Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="secondary" size="sm">Admin</Button>
                  </Link>
                )}
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>

            <button
              className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {link.label}
              </NavLink>
            ))}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="block px-3 py-2 w-full text-left">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="block px-3 py-2 w-full text-left">Sign Up</button>
              </SignUpButton>
            </SignedOut>
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="block px-3 py-2">
                Admin Panel
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
