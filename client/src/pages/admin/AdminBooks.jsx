import { useEffect, useState, useRef } from 'react';
import { BookOpen, Download, FileText, Pencil, Trash2, Upload, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { Input, Select } from '../../components/Input';
import Modal from '../../components/Modal';
import Skeleton from '../../components/Skeleton';

const YEARS = ['1', '2', '3', '4'];
const SEMESTERS = ['1', '2'];

const EMPTY_FORM = {
  course_code: '',
  title: '',
  year: '1',
  semester: '1',
  price: '',
  is_active: true,
};

function StatusBadge({ active }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      active
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
    }`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pdfFile, setPdfFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const fileInputRef = useRef(null);

  const fetchBooks = () => {
    setLoading(true);
    adminApi.books().then(({ data }) => setBooks(data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBooks(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPdfFile(null);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (book) => {
    setEditing(book);
    setForm({
      course_code: book.course_code,
      title: book.title,
      year: book.year,
      semester: book.semester,
      price: book.price,
      is_active: book.is_active,
    });
    setPdfFile(null);
    setError('');
    setModalOpen(true);
  };

  const handlePdfSelect = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Maximum PDF size is 10MB');
      return;
    }
    setPdfFile(file);
    setError('');
  };

  const handleSave = async () => {
    if (!form.course_code.trim()) {
      setError('Course code is required');
      return;
    }
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.price) {
      setError('Price is required');
      return;
    }
    if (!editing && !pdfFile) {
      setError('Book PDF is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (pdfFile) fd.append('pdf', pdfFile);

      if (editing) {
        await adminApi.updateBook(editing.id, fd);
      } else {
        await adminApi.createBook(fd);
      }
      setModalOpen(false);
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save book');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this book?')) return;
    await adminApi.deleteBook(id);
    fetchBooks();
  };

  const handleDownloadPdf = async (book) => {
    setDownloadingId(book.id);
    try {
      const { data } = await adminApi.downloadBookPdf(book.id);
      if (data?.url) {
        const a = document.createElement('a');
        a.href = data.url;
        a.download = data.file_name || `${book.course_code}.pdf`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Books</h1>
          <p className="text-sm text-slate-500 mt-1">Manage catalog books and upload PDF files for printing.</p>
        </div>
        <Button onClick={openCreate}>
          <BookOpen size={16} /> Add Book
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : books.length === 0 ? (
        <Card className="text-center py-16">
          <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No books yet. Add your first book with a PDF.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Course</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Year / Sem</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Price</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">PDF</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-brand-600">{b.course_code}</td>
                    <td className="py-3 px-4 max-w-[200px] truncate">{b.title}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Y{b.year} · S{b.semester}</td>
                    <td className="py-3 px-4 font-medium">₹{b.price}</td>
                    <td className="py-3 px-4">
                      {b.pdf_path ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(b)}
                          disabled={downloadingId === b.id}
                          className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline disabled:opacity-50"
                        >
                          <FileText size={14} />
                          {downloadingId === b.id ? 'Downloading...' : (b.pdf_file_name || 'Download PDF')}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">No PDF</span>
                      )}
                    </td>
                    <td className="py-3 px-4"><StatusBadge active={b.is_active} /></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(b)}>
                          <Pencil size={14} /> Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(b.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Book' : 'Add Book'} size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Course Code *"
              placeholder="e.g. CS101"
              value={form.course_code}
              onChange={(e) => setForm({ ...form, course_code: e.target.value.toUpperCase() })}
            />
            <Input label="Price (₹) *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
              {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
            </Select>
            <Select label="Semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
              {SEMESTERS.map((s) => <option key={s} value={s}>Sem {s}</option>)}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Book PDF {!editing && '*'}
            </label>
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                handlePdfSelect(e.dataTransfer.files[0]);
              }}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-brand-500 hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => handlePdfSelect(e.target.files[0])}
              />
              {pdfFile ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 size={32} className="text-green-500" />
                  <p className="font-medium text-sm">{pdfFile.name}</p>
                  <p className="text-xs text-slate-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB · Click to replace</p>
                </div>
              ) : editing?.pdf_file_name ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText size={32} className="text-brand-500" />
                  <p className="font-medium text-sm">{editing.pdf_file_name}</p>
                  <p className="text-xs text-slate-500">Current PDF · Click to upload a new one</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload size={32} className="text-slate-400" />
                  <p className="font-medium text-sm">Upload book PDF</p>
                  <p className="text-xs text-slate-500">Drag & drop or click · Max 10MB</p>
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? 'Saving...' : editing ? 'Update Book' : 'Add Book'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
