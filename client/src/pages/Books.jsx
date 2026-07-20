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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Browse Books</h1>
        <p className="text-neutral-500 mb-6 sm:mb-8 text-sm sm:text-base">
          Find workbooks by course code, year, and semester. No login required.
        </p>

        <div className="glass-card p-4 mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="lg:col-span-2 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by title or course code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-h-11 pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#141414] text-sm outline-none focus:border-[#0A0A0A] dark:focus:border-white"
            />
          </div>
          <Select label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">All Years</option>
            {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
          </Select>
          <Select label="Semester" value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="">All Semesters</option>
            {SEMESTERS.map((s) => <option key={s} value={s}>Sem {s}</option>)}
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => <BookCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p>No books found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <Card hover className="flex flex-col h-full p-4 sm:p-6">
                  <div className="aspect-[3/4] rounded-xl bg-white dark:bg-neutral-900 mb-4 flex items-center justify-center overflow-hidden border border-neutral-200 dark:border-neutral-800 p-3">
                    <img
                      src={getBookCoverUrl(book.cover_image_url)}
                      alt={book.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="font-semibold line-clamp-2 mb-1">{book.title}</h3>
                  <p className="text-xs text-neutral-500 mb-2">
                    Year {book.year} · Sem {book.semester}
                  </p>
                  <p className="text-lg font-bold mb-2">₹{book.price}</p>
                  <p className="text-sm mb-4 mt-auto">
                    <span className="text-neutral-500">Course Code </span>
                    <span className="font-mono font-bold text-neutral-600 dark:text-neutral-300">{book.course_code}</span>
                  </p>
                  <Button
                    className="w-full"
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
          <div className="mt-8 sticky bottom-4 z-10 flex justify-center">
            <Link to="/cart">
              <Button size="lg" className="shadow-lg">View Cart ({itemCount})</Button>
            </Link>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
