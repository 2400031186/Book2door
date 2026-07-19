import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Truck, Upload, IndianRupee, Award, ChevronDown, Star, BookOpen,
} from 'lucide-react';
import { useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import PageTransition from '../components/PageTransition';

const features = [
  { icon: BookOpen, title: 'Book Printing', desc: 'Curated workbooks and study materials for every branch and semester.' },
  { icon: Upload, title: 'Custom PDF Printing', desc: 'Upload your notes and get them printed with binding options.' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Doorstep delivery within 3–5 business days across campus areas.' },
  { icon: IndianRupee, title: 'Affordable Pricing', desc: 'Transparent pricing with no hidden charges. Split payment available.' },
  { icon: Award, title: 'High Quality Printing', desc: 'Crisp prints on premium paper with color and B&W options.' },
];

const stats = [
  { value: '2,500+', label: 'Orders Delivered' },
  { value: '1,200+', label: 'Happy Students' },
  { value: '3 Days', label: 'Avg. Delivery Time' },
];

const testimonials = [
  { name: 'Priya S.', branch: 'CSE, Sem 3', text: 'Got my DSA notes printed and bound perfectly. Delivery was super fast!', rating: 5 },
  { name: 'Rahul M.', branch: 'ECE, Sem 2', text: 'The split payment option is a lifesaver. Quality prints every time.', rating: 5 },
  { name: 'Ananya K.', branch: 'ME, Sem 4', text: 'Best platform for workbook printing. Much better than local shops.', rating: 5 },
];

const faqs = [
  { q: 'How long does delivery take?', a: 'Standard delivery takes 3–5 business days after payment confirmation.' },
  { q: 'Can I upload my own PDF?', a: 'Yes! Upload any PDF and choose color/B&W, single/double sided, copies, and spiral binding.' },
  { q: 'What is split payment?', a: 'Pay 50% advance online via UPI and the remaining 50% as cash on delivery.' },
  { q: 'How do I track my order?', a: 'Use your order ID or phone number on the Track Order page.' },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200/50 dark:border-slate-700/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left font-medium"
      >
        {q}
        <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm text-slate-500 dark:text-slate-400">{a}</p>}
    </div>
  );
}

export default function Home() {
  return (
    <PageTransition>
      <Helmet>
        <title>Book2Door — Get Your Books Delivered to Your Door</title>
        <meta name="description" content="Premium book printing and delivery for students. Upload PDFs, browse workbooks, and get doorstep delivery." />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 via-accent-500/5 to-brand-500/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Get Your Books{' '}
              <span className="gradient-text">Delivered to Your Door</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
              Print custom PDFs, order curated workbooks, and enjoy fast doorstep delivery with transparent pricing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/upload">
                <Button size="lg"><Upload size={20} /> Upload PDF</Button>
              </Link>
              <Link to="/books">
                <Button variant="secondary" size="lg"><BookOpen size={20} /> Browse Books</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Why Book2Door?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card hover className="h-full">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass-card grid grid-cols-1 sm:grid-cols-3 gap-8 p-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold gradient-text">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">What Students Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <Card key={t.name}>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">&ldquo;{t.text}&rdquo;</p>
              <div className="text-sm font-medium">{t.name}</div>
              <div className="text-xs text-slate-500">{t.branch}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <Card>
          {faqs.map((f) => (
            <FAQItem key={f.q} q={f.q} a={f.a} />
          ))}
        </Card>
      </section>
    </PageTransition>
  );
}
