import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { uploadApi, settingsApi } from '../services/api';
import { useCart } from '../context/CartContext';
import Button from '../components/Button';
import Card from '../components/Card';
import { Input, Select, Textarea } from '../components/Input';
import PageTransition from '../components/PageTransition';

export default function UploadPdf() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      sideMode: 'single',
      copies: 1,
      notes: '',
    },
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [pricing, setPricing] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const { addPdf, itemCount } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);

  const sideMode = watch('sideMode');
  const copies = watch('copies');

  useEffect(() => {
    settingsApi.getPricing().then(({ data }) => setPricing(data.pricing)).catch(() => {});
  }, []);

  const handleFile = (f) => {
    const isPdf =
      f &&
      (f.type === 'application/pdf' ||
        f.type === 'application/octet-stream' ||
        f.name?.toLowerCase().endsWith('.pdf'));

    if (!isPdf) {
      setError('Please select a valid PDF file');
      return;
    }
    if (f.size > 4.5 * 1024 * 1024) {
      setError('PDF must be under 4.5MB. Please compress the file and try again.');
      return;
    }
    setFile(f);
    setResult(null);
    setError('');
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const onSubmit = async (data) => {
    if (!file) {
      setError('Please upload a PDF file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      // Print mode removed from UI: fixed to Black & White (bw)
      formData.append('colorMode', 'bw');
      formData.append('sideMode', data.sideMode);
      formData.append('copies', data.copies);
      // Binding is now permanent (no checkbox) at ₹75
      formData.append('spiralBinding', 'true');
      formData.append('notes', data.notes);

      const { data: uploadResult } = await uploadApi.uploadPdf(formData);
      setResult(uploadResult);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageTransition>
      <Helmet>
        <title>Upload PDF — Book2Door</title>
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Upload PDF for Printing</h1>
        <p className="text-neutral-500 mb-4 sm:mb-6 text-sm sm:text-base">
          Upload your notes and customize print options. Sign in required at checkout.
        </p>

        <Card className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800">
          <p className="text-sm font-medium mb-1">Printing price</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Black &amp; White: <span className="font-bold">₹{pricing?.pdf_bw_per_page ?? 1} per page</span>
            {' · '}Binding: <span className="font-bold">₹75</span> (included on every order)
          </p>
        </Card>

        {addedToCart && (
          <Card className="mb-6 border-2 border-green-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-green-600 font-medium">PDF added to cart successfully!</p>
            <Link to="/cart">
              <Button>View Cart ({itemCount})</Button>
            </Link>
          </Card>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition ${
                dragOver
                  ? 'border-[#0A0A0A] dark:border-white bg-neutral-100 dark:bg-neutral-900'
                  : 'border-neutral-300 dark:border-neutral-600'
              }`}
            >
              <Upload size={40} className="mx-auto mb-4 text-neutral-500" />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
                  <FileText size={16} />
                  <span className="break-all">{file.name}</span>
                  <button type="button" onClick={() => setFile(null)} className="text-red-500 ml-2">Remove</button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-neutral-500 mb-2">Drag & drop your PDF here, or</p>
                  <label className="cursor-pointer">
                    <span className="font-medium underline underline-offset-2">Browse files</span>
                    <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                  </label>
                </>
              )}
              <p className="text-xs text-neutral-400 mt-2">PDF only, max 4.5MB</p>
            </div>
          </Card>

          <Card className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Sides" {...register('sideMode')}>
              <option value="single">Single Side</option>
              <option value="double">Double Side</option>
            </Select>
            <Input
              label="Number of Copies"
              type="number"
              min={1}
              max={50}
              {...register('copies', { required: true, min: 1, valueAsNumber: true })}
              error={errors.copies?.message}
            />
            <div className="sm:col-span-2">
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">
                Binding is included for every order (+₹75).
              </p>
              <Textarea label="Notes (optional)" rows={3} {...register('notes')} placeholder="Any special instructions..." />
            </div>
          </Card>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={uploading || !file}>
            {uploading ? 'Uploading & Calculating...' : 'Upload & Get Price Quote'}
          </Button>
        </form>

        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mt-6 border-2 border-green-500/30">
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <CheckCircle size={20} />
                <span className="font-semibold">Price Calculated</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div><span className="text-neutral-500">Pages:</span> {result.page_count}</div>
                <div><span className="text-neutral-500">Rate:</span> ₹{pricing?.pdf_bw_per_page ?? 1}/page</div>
                <div><span className="text-neutral-500">Sides:</span> {sideMode === 'double' ? 'Double' : 'Single'}</div>
                <div><span className="text-neutral-500">Copies:</span> {copies}</div>
                <div><span className="text-neutral-500">Binding:</span> +₹75</div>
              </div>
              <div className="text-2xl font-bold mb-4">₹{result.calculated_price}</div>
              <Button
                className="w-full"
                onClick={() => {
                  addPdf(result);
                  setAddedToCart(true);
                  setResult(null);
                }}
              >
                Add to Cart
              </Button>
            </Card>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
