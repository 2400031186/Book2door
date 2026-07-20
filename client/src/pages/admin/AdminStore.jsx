import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Download, Eye, FileText, HardDrive, Image as ImageIcon, Search, Trash2,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import Skeleton from '../../components/Skeleton';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pdf', label: 'PDFs' },
  { id: 'image', label: 'Images' },
  { id: 'unused', label: 'Unused' },
];

const BUCKET_LABELS = {
  pdf_uploads: 'PDFs',
  payment_screenshots: 'Screenshots',
  payment_qr: 'UPI QR',
  book_images: 'Book Images',
};

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function referenceLabel(reference) {
  if (!reference) return 'Unused';
  if (reference.type === 'book') return `Book ${reference.label}`;
  if (reference.type === 'customer_pdf') return `Upload: ${reference.label}`;
  if (reference.type === 'payment') return `Order ${reference.label}`;
  if (reference.type === 'upi_qr') return reference.label;
  return reference.label;
}

function UsageBar({ usedBytes, limitBytes, percentUsed }) {
  const barColor =
    percentUsed >= 100
      ? 'bg-red-600'
      : percentUsed >= 90
        ? 'bg-amber-500'
        : percentUsed >= 80
          ? 'bg-amber-400'
          : 'gradient-bg';

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium">
          {formatBytes(usedBytes)} / {formatBytes(limitBytes)} used
        </span>
        <span className="text-neutral-500">{percentUsed}%</span>
      </div>
      <div className="h-3 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, percentUsed)}%` }}
        />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
    </Card>
  );
}

export default function AdminStore() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewName, setPreviewName] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchStore = useCallback(() => {
    setLoading(true);
    adminApi
      .store()
      .then(({ data }) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  const filteredFiles = useMemo(() => {
    if (!summary?.files) return [];
    let files = summary.files;

    if (filter === 'pdf') files = files.filter((f) => f.fileType === 'pdf');
    if (filter === 'image') files = files.filter((f) => f.fileType === 'image');
    if (filter === 'unused') files = files.filter((f) => f.isOrphan);

    if (search.trim()) {
      const q = search.toLowerCase();
      files = files.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.path.toLowerCase().includes(q) ||
          referenceLabel(f.reference).toLowerCase().includes(q)
      );
    }

    return files;
  }, [summary, filter, search]);

  const handlePreview = async (file) => {
    setActionError('');
    try {
      const { data } = await adminApi.storePreview(file.bucket, file.path);
      setPreviewUrl(data.url);
      setPreviewName(file.name);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Could not load preview');
    }
  };

  const handleViewPdf = (file) => {
    const params = new URLSearchParams({
      bucket: file.bucket,
      path: file.path,
      name: file.name,
    });
    window.open(`/admin/store/view?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async (file) => {
    setActionError('');
    try {
      const { data } = await adminApi.storePreview(file.bucket, file.path);
      const link = document.createElement('a');
      link.href = data.url;
      link.download = file.name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Could not download file');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError('');
    try {
      await adminApi.deleteStoreFile(deleteTarget.bucket, deleteTarget.path);
      setDeleteTarget(null);
      fetchStore();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const percentUsed = summary?.percentUsed || 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
            <HardDrive size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Store</h1>
            <p className="text-sm text-neutral-500">Manage PDFs and images (1 GB limit)</p>
          </div>
        </div>
      </div>

      {percentUsed >= 90 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-200">Storage almost full</p>
            <p className="text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              Delete unused files below to free space before new uploads are blocked.
            </p>
          </div>
        </div>
      )}

      <Card className="p-5">
        <UsageBar
          usedBytes={summary?.usedBytes || 0}
          limitBytes={summary?.limitBytes || 1073741824}
          percentUsed={percentUsed}
        />
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total files" value={summary?.fileCount || 0} />
        <SummaryCard label="PDFs" value={summary?.pdfCount || 0} />
        <SummaryCard label="Images" value={summary?.imageCount || 0} />
        <SummaryCard
          label="Unused"
          value={summary?.orphanCount || 0}
          sub="Safe to delete"
        />
      </div>

      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === id
                    ? 'gradient-bg'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#141414] text-sm outline-none focus:border-[#0A0A0A] dark:focus:border-white"
            />
          </div>
        </div>

        {actionError && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {actionError}
          </div>
        )}

        {filteredFiles.length === 0 ? (
          <div className="text-center py-16 text-neutral-500">
            <HardDrive size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No files found</p>
            <p className="text-sm mt-1">
              {summary?.fileCount ? 'Try a different filter or search.' : 'No files in storage yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-left">
                    <th className="py-3 px-3 font-medium text-neutral-500">File</th>
                    <th className="py-3 px-3 font-medium text-neutral-500">Type</th>
                    <th className="py-3 px-3 font-medium text-neutral-500">Size</th>
                    <th className="py-3 px-3 font-medium text-neutral-500">Linked to</th>
                    <th className="py-3 px-3 font-medium text-neutral-500">Date</th>
                    <th className="py-3 px-3 font-medium text-neutral-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr
                      key={`${file.bucket}:${file.path}`}
                      className="border-b border-neutral-100 dark:border-neutral-800/80 hover:bg-neutral-50 dark:hover:bg-neutral-900/40"
                    >
                      <td className="py-3 px-3">
                        <p className="font-medium truncate max-w-[200px]" title={file.name}>{file.name}</p>
                        <span className="text-xs text-neutral-400">{BUCKET_LABELS[file.bucket] || file.bucket}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-neutral-600 dark:text-neutral-300">
                          {file.fileType === 'pdf' ? <FileText size={14} /> : <ImageIcon size={14} />}
                          {file.fileType === 'pdf' ? 'PDF' : 'Image'}
                        </span>
                      </td>
                      <td className="py-3 px-3">{formatBytes(file.size)}</td>
                      <td className="py-3 px-3">
                        {file.isOrphan ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Unused
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                              In use
                            </span>
                            <span className="text-neutral-600 dark:text-neutral-300">{referenceLabel(file.reference)}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-neutral-500">{formatDate(file.created_at)}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-end gap-1">
                          {file.fileType === 'image' && (
                            <button
                              type="button"
                              onClick={() => handlePreview(file)}
                              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                              title="Preview"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          {file.fileType === 'pdf' && (
                            <button
                              type="button"
                              onClick={() => handleViewPdf(file)}
                              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                              title="View PDF"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDownload(file)}
                            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(file)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {filteredFiles.map((file) => (
                <div
                  key={`${file.bucket}:${file.path}`}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {BUCKET_LABELS[file.bucket]} · {formatBytes(file.size)} · {formatDate(file.created_at)}
                      </p>
                    </div>
                    {file.fileType === 'pdf' ? (
                      <FileText size={18} className="shrink-0 text-neutral-400" />
                    ) : (
                      <ImageIcon size={18} className="shrink-0 text-neutral-400" />
                    )}
                  </div>
                  <div>
                    {file.isOrphan ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Unused
                      </span>
                    ) : (
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">
                        In use · {referenceLabel(file.reference)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {file.fileType === 'image' && (
                      <Button variant="secondary" size="sm" className="flex-1" onClick={() => handlePreview(file)}>
                        <Eye size={14} /> View
                      </Button>
                    )}
                    {file.fileType === 'pdf' && (
                      <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleViewPdf(file)}>
                        <Eye size={14} /> View
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleDownload(file)}>
                      <Download size={14} /> Download
                    </Button>
                    <Button variant="secondary" size="sm" className="flex-1 text-red-600" onClick={() => setDeleteTarget(file)}>
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete file"
        size="sm"
      >
        {deleteTarget && (
          <div className="space-y-4">
            {deleteTarget.isOrphan ? (
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Delete <span className="font-medium">{deleteTarget.name}</span> permanently? This cannot be undone.
              </p>
            ) : (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-200">This file is in use</p>
                <p className="text-amber-800/80 dark:text-amber-300/80 mt-1">
                  Linked to {referenceLabel(deleteTarget.reference)}. Deleting will remove the file and clear the link.
                </p>
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
                {deleting ? 'Deleting...' : 'Delete permanently'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!previewUrl}
        onClose={() => { setPreviewUrl(null); setPreviewName(''); }}
        title={previewName || 'Preview'}
        size="lg"
      >
        {previewUrl && (
          <div className="flex justify-center">
            <img src={previewUrl} alt={previewName} className="max-h-[70vh] rounded-lg object-contain" />
          </div>
        )}
      </Modal>
    </div>
  );
}
