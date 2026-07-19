import { Link } from 'react-router-dom';
import { BookOpen, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/50 dark:border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="p-1.5 rounded-xl gradient-bg">
                <BookOpen size={18} className="text-white" />
              </div>
              <span className="gradient-text">Book2Door</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Premium book printing and delivery for students. Get your notes and workbooks delivered to your doorstep.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/books" className="hover:text-brand-600 transition">Browse Books</Link></li>
              <li><Link to="/upload" className="hover:text-brand-600 transition">Upload PDF</Link></li>
              <li><Link to="/track" className="hover:text-brand-600 transition">Track Order</Link></li>
              <li><Link to="/cart" className="hover:text-brand-600 transition">Cart</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-2"><Mail size={14} /> support@book2door.com</li>
              <li className="flex items-center gap-2"><Phone size={14} /> +91 98765 43210</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Features</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>Custom PDF Printing</li>
              <li>Spiral Binding</li>
              <li>Fast Delivery</li>
              <li>Split Payment (50% Advance)</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200/50 dark:border-slate-800/50 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Book2Door. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
