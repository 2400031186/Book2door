import { Link } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Search, ShoppingCart, BookOpen } from 'lucide-react';
import { booksApi } from '../services/api';
import { useCart } from '../context/CartContext';
import Button from '../components/Button';
import Card from '../components/Card';
import { Input, Select } from '../components/Input';
import { BookCardSkeleton } from '../components/Skeleton';
import PageTransition from '../components/PageTransition';

const BRANCHES = ['CSE', 'ECE', 'ME', 'CIVIL', 'EEE'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const { addBook, itemCount } = useCart();
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, [branch, semester, subject]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (branch) params.branch = branch;
      if (semester) params.semester = semester;
      if (subject) params.subject = subject;
      const { data } = await booksApi.getAll(params);
      setBooks(data);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return books;
    const q = search.toLowerCase();
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.subject.toLowerCase().includes(q) ||
        b.branch.toLowerCase().includes(q)
    );
  }, [books, search]);

  return (
    <PageTransition>
      <Helmet>
        <title>Browse Books — Book2Door</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-2">Browse Books</h1>
        <p className="text-slate-500 mb-8">Find workbooks and study materials for your branch and semester.</p>

        <div className="glass-card p-4 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search books..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <Select label="Branch" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">All Branches</option>
            {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Select label="Semester" value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="">All Semesters</option>
            {SEMESTERS.map((s) => <option key={s} value={s}>Sem {s}</option>)}
          </Select>
          <Input
            label="Subject"
            placeholder="e.g. Mathematics"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <BookCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p>No books found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card hover className="flex flex-col h-full">
                  <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-900/30 dark:to-accent-900/30 mb-4 flex items-center justify-center overflow-hidden">
                    {book.cover_image_url ? (
                      <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen size={48} className="text-brand-400 opacity-50" />
                    )}
                  </div>
                  <h3 className="font-semibold line-clamp-2 mb-1">{book.title}</h3>
                  <p className="text-xs text-slate-500 mb-1">{book.subject} · {book.branch} · Sem {book.semester}</p>
                  <p className="text-lg font-bold text-brand-600 dark:text-brand-400 mb-4">₹{book.price}</p>
                  <Button
                    className="w-full mt-auto"
                    onClick={() => {
                      addBook(book);
                      setAddedId(book.id);
                      setTimeout(() => setAddedId(null), 2000);
                    }}
                  >
                    <ShoppingCart size={16} />
                    {addedId === book.id ? 'Added!' : 'Add to Cart'}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        {itemCount > 0 && (
          <div className="mt-8 text-center">
            <Link to="/cart">
              <Button variant="secondary">View Cart ({itemCount} items)</Button>
            </Link>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
