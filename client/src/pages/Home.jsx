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
  { icon: BookOpen, title: 'Book Printing', desc: 'Curated workbooks and study materials by course code, year, and semester.' },
  { icon: Upload, title: 'Custom PDF Printing', desc: 'Upload your notes and get them printed with binding options.' },
  { icon: Truck, title: 'Campus Pickup', desc: 'Pick up at Aravali, Vindhya, Kailash residency, or S-block.' },
  { icon: IndianRupee, title: 'Affordable Pricing', desc: 'Transparent pricing with no hidden charges. Split payment available.' },
  { icon: Award, title: 'High Quality Printing', desc: 'Crisp prints on premium paper with color and B&W options.' },
];

const stats = [
  { value: '2,500+', label: 'Orders Delivered' },
  { value: '1,200+', label: 'Happy Students' },
  { value: '3 Days', label: 'Avg. Delivery Time' },
];

const testimonials = [
  { name: 'Priya S.', yearInfo: 'Year 2, Sem 1', text: 'Got my DSA notes printed and bound perfectly. Pickup was easy!', rating: 5 },
  { name: 'Rahul M.', yearInfo: 'Year 1, Sem 2', text: 'The split payment option is a lifesaver. Quality prints every time.', rating: 5 },
  { name: 'Ananya K.', yearInfo: 'Year 2, Sem 2', text: 'Best platform for workbook printing. Much better than local shops.', rating: 5 },
];

const faqs = [
  { q: 'Do I need an account to order?', a: 'No. You can browse, upload, checkout, and pay without signing in. Sign in only if you want saved details or order history.' },
  { q: 'How long does delivery take?', a: 'Orders are typically ready for campus pickup within 3–5 business days after payment confirmation.' },
  { q: 'Can I upload my own PDF?', a: 'Yes! Upload any PDF and choose color/B&W, single/double sided, copies, and binding.' },
  { q: 'What is split payment?', a: 'Pay 50% advance online via UPI and the remaining 50% as cash on delivery / pickup.' },
  { q: 'How do I track my order?', a: 'Use your order ID or phone number on the Track Order page.' },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left font-medium gap-3 min-h-11"
      >
        <span>{q}</span>
        <ChevronDown size={18} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm text-neutral-500 dark:text-neutral-400">{a}</p>}
    </div>
  );
}

export default function Home() {
  return (
    <PageTransition>
      <Helmet>
        <title>Book2Door — Get Your Books Delivered</title>
        <meta name="description" content="Premium book printing and campus pickup for students. Upload PDFs, browse workbooks — no account needed." />
      </Helmet>

      {/* Hero — brand first, one composition */}
      <section className="relative overflow-hidden border-b border-neutral-200 dark:border-neutral-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-200/60 via-transparent to-transparent dark:from-neutral-800/40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-2xl"
          >
            <p className="text-sm font-semibold tracking-[0.2em] uppercase text-neutral-500 mb-4">
              Book2Door
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-5">
              Print. Pickup.
              <br />
              Done.
            </h1>
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 mb-3 max-w-lg">
              Order workbooks or upload your PDF. Pay by UPI. Pick up on campus.
            </p>
            <p className="text-sm text-neutral-500 mb-8">No account needed to order.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/books" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto"><BookOpen size={20} /> Browse Books</Button>
              </Link>
              <Link to="/upload" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto"><Upload size={20} /> Upload PDF</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <h2 className="text-xl sm:text-2xl font-bold mb-8">Why Book2Door?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Card hover className="h-full p-5 sm:p-6">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-inherit" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-card grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 p-6 sm:p-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-2xl sm:text-3xl font-bold">{s.value}</div>
              <div className="text-sm text-neutral-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <h2 className="text-xl sm:text-2xl font-bold mb-8">What Students Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((t) => (
            <Card key={t.name} className="p-5 sm:p-6">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} className="fill-neutral-900 text-neutral-900 dark:fill-white dark:text-white" />
                ))}
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">&ldquo;{t.text}&rdquo;</p>
              <div className="text-sm font-medium">{t.name}</div>
              <div className="text-xs text-neutral-500">{t.yearInfo}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <h2 className="text-xl sm:text-2xl font-bold mb-8 text-center">FAQ</h2>
        <Card className="p-5 sm:p-6">
          {faqs.map((f) => (
            <FAQItem key={f.q} q={f.q} a={f.a} />
          ))}
        </Card>
      </section>
    </PageTransition>
  );
}
