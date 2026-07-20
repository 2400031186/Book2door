import { useEffect, useState, useCallback } from 'react';
import {
  BookOpen, CheckCircle2, ClipboardList, Download, FileText, MapPin, Phone, RotateCcw, Upload, User,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { Select } from '../../components/Input';
import Skeleton from '../../components/Skeleton';
import { formatOrderStatusLabel } from '../../utils/orderStatus';

const FILTER_OPTIONS = [
  { value: 'to_print', label: 'Ready to Print (Received → Delivery)' },
  { value: 'active', label: 'All Active Orders' },
  { value: 'all', label: 'All Orders (incl. pending)' },
];

const STATUS_COLORS = {
  received: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  printing: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  packing: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
  out_for_delivery: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20',
  payment_review: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  pending_payment: 'text-slate-600 bg-slate-100 dark:bg-slate-800',
  delivered: 'text-green-600 bg-green-50 dark:bg-green-900/20',
};

function formatPrintOptions(opts) {
  if (!opts || typeof opts !== 'object') return null;
  const parts = [];
  if (opts.colorMode) parts.push(opts.colorMode === 'color' ? 'Color' : 'B&W');
  if (opts.sideMode) parts.push(opts.sideMode === 'double' ? 'Double-sided' : 'Single-sided');
  if (opts.copies) parts.push(`${opts.copies} cop${opts.copies > 1 ? 'ies' : 'y'}`);
  if (opts.spiralBinding) parts.push('Binding');
  return parts.length ? parts.join(' · ') : null;
}

function SectionTabs({ section, onChange, variant = 'brand' }) {
  const activeClass = variant === 'accent'
    ? { pending: 'text-accent-600', completed: 'text-green-600' }
    : { pending: 'text-brand-600', completed: 'text-green-600' };

  return (
    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
      <button
        type="button"
        onClick={() => onChange('pending')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
          section === 'pending'
            ? `bg-white dark:bg-slate-900 shadow-sm ${activeClass.pending}`
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
        }`}
      >
        To Print
      </button>
      <button
        type="button"
        onClick={() => onChange('completed')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
          section === 'completed'
            ? `bg-white dark:bg-slate-900 shadow-sm ${activeClass.completed}`
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
        }`}
      >
        <CheckCircle2 size={14} /> Completed
      </button>
    </div>
  );
}

function MiniSummary({ summary, section, kind }) {
  const isDone = section === 'completed';
  const count = kind === 'books' ? summary?.unique_books : summary?.pdf_uploads;
  const label = kind === 'books'
    ? (isDone ? 'Books printed' : 'Books to print')
    : (isDone ? 'PDFs printed' : 'PDFs to print');

  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <span className="text-slate-500">
        <span className={`font-bold ${isDone ? 'text-green-600' : kind === 'books' ? 'text-brand-600' : 'text-accent-600'}`}>
          {count ?? 0}
        </span>{' '}{label}
      </span>
      <span className="text-slate-500">
        <span className={`font-bold ${isDone ? 'text-green-600' : 'text-orange-600'}`}>{summary?.total_copies ?? 0}</span> copies
      </span>
      <span className="text-slate-500">
        <span className="font-bold text-slate-700 dark:text-slate-200">{summary?.total_lines ?? 0}</span> lines
      </span>
    </div>
  );
}

function LinesTable({ group, section, onComplete, onUndo, completingId }) {
  const isCompleted = section === 'completed';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
            <th className="text-left py-2.5 px-4 font-medium">Customer</th>
            <th className="text-left py-2.5 px-4 font-medium">Order</th>
            <th className="text-left py-2.5 px-4 font-medium">Pickup</th>
            <th className="text-center py-2.5 px-4 font-medium">Qty</th>
            <th className="text-left py-2.5 px-4 font-medium">Status</th>
            <th className="text-center py-2.5 px-4 font-medium min-w-[120px]">
              {isCompleted ? 'Printed' : 'Printed Complete'}
            </th>
          </tr>
        </thead>
        <tbody>
          {group.lines.map((line) => (
            <tr key={line.item_id} className="border-t border-slate-100 dark:border-slate-800">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="font-medium">{line.customer_name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone size={10} /> {line.phone}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 font-mono text-xs">{line.order_number}</td>
              <td className="py-3 px-4">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                  <MapPin size={12} className="shrink-0" />
                  {line.pickup_location || '—'}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold ${
                  isCompleted
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                }`}>
                  {line.quantity}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_COLORS[line.status] || STATUS_COLORS.pending_payment}`}>
                  {formatOrderStatusLabel(line.status)}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                {isCompleted ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                      <CheckCircle2 size={14} /> Done
                    </span>
                    {line.print_completed_at && (
                      <span className="text-[10px] text-slate-400">
                        {new Date(line.print_completed_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={completingId === line.item_id}
                      onClick={() => onUndo(line.item_id)}
                      className="text-[10px] text-slate-400 hover:text-brand-600 flex items-center gap-0.5 mt-0.5"
                    >
                      <RotateCcw size={10} /> Undo
                    </button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={completingId === line.item_id}
                    onClick={() => onComplete(line.item_id)}
                    className="text-xs px-3"
                  >
                    <CheckCircle2 size={14} />
                    {completingId === line.item_id ? '...' : 'Complete'}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-700">
            <td colSpan={3} className="py-2.5 px-4 text-right font-medium text-slate-600">Total</td>
            <td className={`py-2.5 px-4 text-center font-bold text-lg ${isCompleted ? 'text-green-600' : 'text-orange-600'}`}>
              {group.total_quantity}
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function BookGroupCard({ group, section, onComplete, onUndo, completingId, downloadingId, onDownloadBookPdf }) {
  const isCompleted = section === 'completed';

  return (
    <Card className="overflow-hidden p-0">
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-200 dark:border-slate-700 ${
        isCompleted ? 'bg-green-50/80' : 'bg-gradient-to-r from-brand-50/80 to-transparent dark:from-brand-900/20'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
            isCompleted ? 'bg-green-100 dark:bg-green-900/40' : 'bg-brand-100 dark:bg-brand-900/40'
          }`}>
            {isCompleted ? <CheckCircle2 size={28} className="text-green-600" /> : <BookOpen size={28} className="text-brand-600" />}
          </div>
          <div>
            <p className="font-mono text-xl font-bold text-brand-600">{group.course_code}</p>
            <p className="font-medium text-slate-800 dark:text-slate-100">{group.title}</p>
            <p className="text-sm text-slate-500 mt-0.5">Year {group.year} · Sem {group.semester}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:text-right">
          <div>
            <p className={`text-4xl font-bold ${isCompleted ? 'text-green-600' : 'text-orange-600'}`}>{group.total_quantity}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">{isCompleted ? 'Copies Printed' : 'Copies to Print'}</p>
          </div>
          {group.pdf_path && !isCompleted && (
            <Button variant="secondary" size="sm" disabled={downloadingId === group.book_id} onClick={() => onDownloadBookPdf(group.book_id, group.pdf_file_name)}>
              <Download size={16} /> {downloadingId === group.book_id ? '...' : 'PDF'}
            </Button>
          )}
        </div>
      </div>
      <LinesTable group={group} section={section} onComplete={onComplete} onUndo={onUndo} completingId={completingId} />
    </Card>
  );
}

function PdfGroupCard({ group, section, onComplete, onUndo, completingId, downloadingId, onDownloadUploadPdf }) {
  const isCompleted = section === 'completed';
  const printOpts = formatPrintOptions(group.print_options);

  return (
    <Card className="overflow-hidden p-0">
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-200 dark:border-slate-700 ${
        isCompleted ? 'bg-green-50/80' : 'bg-gradient-to-r from-accent-50/80 to-transparent dark:from-accent-900/20'
      }`}>
        <div className="flex items-start gap-4 min-w-0">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
            isCompleted ? 'bg-green-100 dark:bg-green-900/40' : 'bg-accent-100 dark:bg-accent-900/40'
          }`}>
            {isCompleted ? <CheckCircle2 size={28} className="text-green-600" /> : <FileText size={28} className="text-accent-600" />}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{group.file_name}</p>
            <p className="text-sm text-slate-500 mt-0.5">
              {group.page_count ? `${group.page_count} pages` : 'Custom print'}
              {printOpts ? ` · ${printOpts}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:text-right shrink-0">
          <div>
            <p className={`text-4xl font-bold ${isCompleted ? 'text-green-600' : 'text-orange-600'}`}>{group.total_quantity}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wide">{isCompleted ? 'Printed' : 'To Print'}</p>
          </div>
          {!isCompleted && (
            <Button variant="secondary" size="sm" disabled={downloadingId === group.pdf_id} onClick={() => onDownloadUploadPdf(group.pdf_id, group.file_name)}>
              <Download size={16} /> {downloadingId === group.pdf_id ? '...' : 'PDF'}
            </Button>
          )}
        </div>
      </div>
      <LinesTable group={group} section={section} onComplete={onComplete} onUndo={onUndo} completingId={completingId} />
    </Card>
  );
}

function EmptyBlock({ section, kind }) {
  const isDone = section === 'completed';
  return (
    <Card className="text-center py-10">
      {isDone ? (
        <>
          <CheckCircle2 size={36} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 text-sm">No completed {kind === 'books' ? 'book' : 'PDF'} prints yet.</p>
        </>
      ) : (
        <>
          {kind === 'books' ? (
            <BookOpen size={36} className="mx-auto text-slate-300 mb-2" />
          ) : (
            <FileText size={36} className="mx-auto text-slate-300 mb-2" />
          )}
          <p className="text-slate-500 text-sm">Nothing to print here.</p>
        </>
      )}
    </Card>
  );
}

export default function AdminOrderBook() {
  const [filter, setFilter] = useState('to_print');
  const [bookSection, setBookSection] = useState('pending');
  const [pdfSection, setPdfSection] = useState('pending');
  const [bookData, setBookData] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingPdfs, setLoadingPdfs] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  const fetchBooks = useCallback(() => {
    setLoadingBooks(true);
    adminApi.orderBook({ filter, section: bookSection, type: 'books' })
      .then(({ data }) => setBookData(data))
      .finally(() => setLoadingBooks(false));
  }, [filter, bookSection]);

  const fetchPdfs = useCallback(() => {
    setLoadingPdfs(true);
    adminApi.orderBook({ filter, section: pdfSection, type: 'pdf' })
      .then(({ data }) => setPdfData(data))
      .finally(() => setLoadingPdfs(false));
  }, [filter, pdfSection]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);
  useEffect(() => { fetchPdfs(); }, [fetchPdfs]);

  const downloadFile = async (apiCall, id, fileName) => {
    setDownloadingId(id);
    try {
      const { data: res } = await apiCall(id);
      if (res?.url) {
        const a = document.createElement('a');
        a.href = res.url;
        a.download = res.file_name || fileName || 'document.pdf';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrintStatus = async (itemId, completed) => {
    setCompletingId(itemId);
    try {
      await adminApi.markOrderBookPrinted(itemId, completed);
      fetchBooks();
      fetchPdfs();
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList size={26} className="text-brand-600" />
            Order Book
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Catalog books and upload PDFs — each section has its own print queue.
          </p>
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full sm:w-72">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>

      {/* Catalog Books section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen size={20} className="text-brand-600" />
            Catalog Books
          </h2>
          <SectionTabs section={bookSection} onChange={setBookSection} variant="brand" />
        </div>

        {!loadingBooks && bookData?.summary && (
          <MiniSummary summary={bookData.summary} section={bookSection} kind="books" />
        )}

        {loadingBooks ? (
          <Skeleton className="h-40 w-full" />
        ) : bookData?.books?.length > 0 ? (
          <div className="space-y-5">
            {bookData.books.map((book) => (
              <BookGroupCard
                key={book.book_id}
                group={book}
                section={bookSection}
                completingId={completingId}
                downloadingId={downloadingId}
                onComplete={(id) => handlePrintStatus(id, true)}
                onUndo={(id) => handlePrintStatus(id, false)}
                onDownloadBookPdf={(id, name) => downloadFile(adminApi.downloadBookPdf, id, name)}
              />
            ))}
          </div>
        ) : (
          <EmptyBlock section={bookSection} kind="books" />
        )}
      </section>

      {/* Upload PDF section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Upload size={20} className="text-accent-600" />
            Upload PDF Orders
          </h2>
          <SectionTabs section={pdfSection} onChange={setPdfSection} variant="accent" />
        </div>

        {!loadingPdfs && pdfData?.summary && (
          <MiniSummary summary={pdfData.summary} section={pdfSection} kind="pdfs" />
        )}

        {loadingPdfs ? (
          <Skeleton className="h-40 w-full" />
        ) : pdfData?.pdf_orders?.length > 0 ? (
          <div className="space-y-5">
            {pdfData.pdf_orders.map((pdf) => (
              <PdfGroupCard
                key={pdf.pdf_id}
                group={pdf}
                section={pdfSection}
                completingId={completingId}
                downloadingId={downloadingId}
                onComplete={(id) => handlePrintStatus(id, true)}
                onUndo={(id) => handlePrintStatus(id, false)}
                onDownloadUploadPdf={(id, name) => downloadFile(adminApi.downloadPdf, id, name)}
              />
            ))}
          </div>
        ) : (
          <EmptyBlock section={pdfSection} kind="pdfs" />
        )}
      </section>
    </div>
  );
}
