import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { Input, Select } from '../../components/Input';
import Modal from '../../components/Modal';
import Skeleton from '../../components/Skeleton';

const BRANCHES = ['CSE', 'ECE', 'ME', 'CIVIL', 'EEE'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', subject: '', branch: 'CSE', semester: '1', price: '', is_active: true });
  const [cover, setCover] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchBooks = () => {
    setLoading(true);
    adminApi.books().then(({ data }) => setBooks(data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBooks(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', subject: '', branch: 'CSE', semester: '1', price: '', is_active: true });
    setCover(null);
    setModalOpen(true);
  };

  const openEdit = (book) => {
    setEditing(book);
    setForm({
      title: book.title,
      subject: book.subject,
      branch: book.branch,
      semester: book.semester,
      price: book.price,
      is_active: book.is_active,
    });
    setCover(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (cover) fd.append('cover', cover);

      if (editing) {
        await adminApi.updateBook(editing.id, fd);
      } else {
        await adminApi.createBook(fd);
      }
      setModalOpen(false);
      fetchBooks();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this book?')) return;
    await adminApi.deleteBook(id);
    fetchBooks();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Books</h1>
        <Button onClick={openCreate}>Add Book</Button>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-2">Title</th>
                <th className="text-left py-3 px-2">Subject</th>
                <th className="text-left py-3 px-2">Branch</th>
                <th className="text-left py-3 px-2">Sem</th>
                <th className="text-left py-3 px-2">Price</th>
                <th className="text-left py-3 px-2">Active</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-3 px-2">{b.title}</td>
                  <td className="py-3 px-2">{b.subject}</td>
                  <td className="py-3 px-2">{b.branch}</td>
                  <td className="py-3 px-2">{b.semester}</td>
                  <td className="py-3 px-2">₹{b.price}</td>
                  <td className="py-3 px-2">{b.is_active ? 'Yes' : 'No'}</td>
                  <td className="py-3 px-2 space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(b)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(b.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Book' : 'Add Book'}>
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <Select label="Branch" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
            {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Select label="Semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
            {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Input label="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <div>
            <label className="block text-sm font-medium mb-1">Cover Image</label>
            <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files[0])} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Book'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
