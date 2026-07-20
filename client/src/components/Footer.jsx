import { Link } from 'react-router-dom';
import { BookOpen, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-[#0A0A0A]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="p-1.5 rounded-lg gradient-bg">
                <BookOpen size={18} className="text-inherit" />
              </div>
              <span className="gradient-text">Book2Door</span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Premium book and PDF printing for students. Free campus pickup — no account required.
            </p>
            <p className="text-xs text-neutral-400">Order without login · Track on this device</p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-neutral-500">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-neutral-600 dark:text-neutral-400">
              <li><Link to="/books" className="hover:text-[#0A0A0A] dark:hover:text-white transition">Browse Books</Link></li>
              <li><Link to="/upload" className="hover:text-[#0A0A0A] dark:hover:text-white transition">Upload PDF</Link></li>
              <li><Link to="/track" className="hover:text-[#0A0A0A] dark:hover:text-white transition">Track Order</Link></li>
              <li><Link to="/cart" className="hover:text-[#0A0A0A] dark:hover:text-white transition">Cart</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-neutral-500">Support</h4>
            <ul className="space-y-2.5 text-sm text-neutral-600 dark:text-neutral-400">
              <li className="flex items-center gap-2"><Mail size={14} /> support@book2door.com</li>
              <li className="flex items-center gap-2"><Phone size={14} /> +91 98765 43210</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-neutral-500">Features</h4>
            <ul className="space-y-2.5 text-sm text-neutral-600 dark:text-neutral-400">
              <li>PDF Printing — ₹1/page</li>
              <li>Binding — ₹75</li>
              <li>Free Campus Pickup</li>
              <li>Split Payment</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} Book2Door. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
