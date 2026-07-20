import { Link } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Search, ShoppingCart, BookOpen } from 'lucide-react';
import { booksApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { getBookCoverUrl } from '../constants/books';
import Button from '../components/Button';
import Card from '../components/Card';
import { Select } from '../components/Input';
import { BookCardSkeleton } from '../components/Skeleton';
import PageTransition from '../components/PageTransition';

const YEARS = ['1', '2', '3', '4'];
const SEMESTERS = ['1', '2'];

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const { addBook, itemCount } = useCart();
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, [year, semester]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (year) params.year = year;
      if (semester) params.semester = semester;
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
        b.course_code?.toLowerCase().includes(q)
    );
  }, [books, search]);

  return (
    <PageTransition>
      <Helmet>
        <title>Browse Books — Book2Door</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        <h1 className="text-xl sm:text-3xl font-bold mb-1">Browse Books</h1>
        <p className="text-neutral-500 mb-4 sm:mb-6 text-xs sm:text-base">
          Find workbooks by course code, year, and semester.
        </p>

        <div className="glass-card p-3 sm:p-4 mb-4 sm:mb-6 space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="book-search" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Search
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                id="book-search"
                type="text"
                placeholder="Title or course code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-h-11 pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#141414] text-sm outline-none focus:border-[#0A0A0A] dark:focus:border-white focus:ring-2 focus:ring-neutral-400/30"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">All Years</option>
              {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
            </Select>
            <Select label="Semester" value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="">All Semesters</option>
              {SEMESTERS.map((s) => <option key={s} value={s}>Sem {s}</option>)}
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <BookCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-neutral-500">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No books found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.25) }}
              >
                <Card hover className="flex flex-col h-full !p-3 sm:!p-4">
                  <div className="aspect-square rounded-lg bg-white dark:bg-neutral-900 mb-2 flex items-center justify-center overflow-hidden border border-neutral-200 dark:border-neutral-800 p-1.5 sm:p-2">
                    <img
                      src={getBookCoverUrl(book.cover_image_url)}
                      alt={book.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold line-clamp-2 leading-snug mb-1">{book.title}</h3>
                  <p className="text-[10px] sm:text-xs text-neutral-500 mb-1">
                    Y{book.year} · Sem {book.semester}
                  </p>
                  <p className="text-sm sm:text-base font-bold mb-1">₹{book.price}</p>
                  <p className="text-[10px] sm:text-xs mb-2 mt-auto leading-tight">
                    <span className="text-neutral-500">Code </span>
                    <span className="font-mono font-bold text-neutral-600 dark:text-neutral-300">{book.course_code}</span>
                  </p>
                  <Button
                    size="sm"
                    className="w-full text-xs sm:text-sm"
                    onClick={() => {
                      addBook(book);
                      setAddedId(book.id);
                      setTimeout(() => setAddedId(null), 2000);
                    }}
                  >
                    <ShoppingCart size={14} />
                    {addedId === book.id ? 'Added!' : 'Add'}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {itemCount > 0 && (
          <div className="mt-6 sticky bottom-3 z-10 flex justify-center">
            <Link to="/cart">
              <Button size="md" className="shadow-lg text-sm">View Cart ({itemCount})</Button>
            </Link>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
