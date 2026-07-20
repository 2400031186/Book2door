import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { adminApi } from '../../services/api';
import Button from '../../components/Button';
import Skeleton from '../../components/Skeleton';

export default function AdminStoreViewer() {
  const [searchParams] = useSearchParams();
  const bucket = searchParams.get('bucket') || '';
  const path = searchParams.get('path') || '';
  const name = searchParams.get('name') || 'Document.pdf';

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bucket || !path) {
      setError('Missing file information.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    adminApi
      .storePreview(bucket, path)
      .then(({ data }) => setUrl(data.url))
      .catch((err) => setError(err.response?.data?.error || 'Could not load PDF'))
      .finally(() => setLoading(false));
  }, [bucket, path]);

  const handleDownload = () => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/admin/store"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition shrink-0"
          >
            <ArrowLeft size={16} />
            Back to Store
          </Link>
          <div className="hidden sm:block w-px h-5 bg-neutral-200 dark:bg-neutral-700" />
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={18} className="shrink-0 text-neutral-400" />
            <h1 className="font-semibold truncate" title={name}>{name}</h1>
          </div>
        </div>
        {url && (
          <Button variant="secondary" size="sm" onClick={handleDownload} className="w-full sm:w-auto">
            <Download size={16} />
            Download
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex-1 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="flex-1 min-h-[70vh] w-full" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-6 text-center">
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <Link to="/admin/store" className="inline-block mt-4">
            <Button variant="secondary" size="sm">Return to Store</Button>
          </Link>
        </div>
      )}

      {!loading && !error && url && (
        <div className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-100 dark:bg-neutral-900 min-h-[70vh]">
          <iframe
            src={url}
            title={name}
            className="w-full h-[calc(100vh-10rem)] min-h-[70vh] bg-white"
          />
        </div>
      )}
    </div>
  );
}
