import { supabase } from '../config/supabase.js';
import { invalidateSettingsCache } from './pricing.js';

export const STORAGE_LIMIT_BYTES = 1073741824; // 1 GB

export const BUCKETS = ['pdf_uploads', 'payment_screenshots', 'payment_qr', 'book_images'];

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

export function formatBytes(bytes) {
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

function getFileExtension(name) {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx).toLowerCase() : '';
}

export function getFileType(name, bucket) {
  const ext = getFileExtension(name);
  if (ext === '.pdf' || bucket === 'pdf_uploads') return 'pdf';
  if (IMAGE_EXTENSIONS.has(ext) || bucket === 'payment_screenshots' || bucket === 'payment_qr' || bucket === 'book_images') {
    return 'image';
  }
  return 'other';
}

function extractQrPathFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('/')) return null;
  const marker = '/payment_qr/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

async function listBucketPrefix(bucket, prefix = '') {
  const files = [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: 'created_at', order: 'desc' },
  });

  if (error) throw error;

  for (const item of data || []) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name;

    if (item.id) {
      files.push({
        bucket,
        path: itemPath,
        name: item.name,
        size: item.metadata?.size || 0,
        created_at: item.created_at || item.updated_at || null,
        mime_type: item.metadata?.mimetype || null,
      });
    } else {
      const nested = await listBucketPrefix(bucket, itemPath);
      files.push(...nested);
    }
  }

  return files;
}

export async function listAllFiles() {
  const all = [];
  for (const bucket of BUCKETS) {
    try {
      const bucketFiles = await listBucketPrefix(bucket);
      all.push(...bucketFiles);
    } catch {
      /* bucket may not exist in some environments */
    }
  }
  return all.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

export async function buildReferenceMap() {
  const refMap = new Map();

  const [{ data: books }, { data: pdfUploads }, { data: payments }, { data: settingsRows }] = await Promise.all([
    supabase.from('books').select('id, course_code, pdf_path').not('pdf_path', 'is', null),
    supabase.from('pdf_uploads').select('id, file_name, file_path').not('file_path', 'is', null),
    supabase.from('payments').select('id, screenshot_url, orders(order_number)').not('screenshot_url', 'is', null),
    supabase.from('settings').select('value').eq('key', 'pricing').maybeSingle(),
  ]);

  for (const book of books || []) {
    if (book.pdf_path) {
      refMap.set(`pdf_uploads:${book.pdf_path}`, {
        type: 'book',
        label: book.course_code,
        id: book.id,
      });
    }
  }

  for (const pdf of pdfUploads || []) {
    if (pdf.file_path) {
      refMap.set(`pdf_uploads:${pdf.file_path}`, {
        type: 'customer_pdf',
        label: pdf.file_name || 'Customer PDF',
        id: pdf.id,
      });
    }
  }

  for (const payment of payments || []) {
    if (payment.screenshot_url) {
      const orderNumber = payment.orders?.order_number || 'Order';
      refMap.set(`payment_screenshots:${payment.screenshot_url}`, {
        type: 'payment',
        label: orderNumber,
        id: payment.id,
      });
    }
  }

  const qrPath = extractQrPathFromUrl(settingsRows?.value?.upi_qr_url);
  if (qrPath) {
    refMap.set(`payment_qr:${qrPath}`, {
      type: 'upi_qr',
      label: 'UPI QR',
      id: null,
    });
  }

  return refMap;
}

export function enrichFilesWithRefs(files, refMap) {
  return files.map((file) => {
    const key = `${file.bucket}:${file.path}`;
    const reference = refMap.get(key) || null;
    const fileType = getFileType(file.name, file.bucket);
    return {
      ...file,
      fileType,
      reference,
      isOrphan: !reference,
    };
  });
}

export async function getStorageSummary() {
  const files = await listAllFiles();
  const refMap = await buildReferenceMap();
  const enriched = enrichFilesWithRefs(files, refMap);

  let totalBytes = 0;
  let pdfCount = 0;
  let imageCount = 0;
  let orphanCount = 0;

  for (const file of enriched) {
    totalBytes += file.size || 0;
    if (file.fileType === 'pdf') pdfCount += 1;
    if (file.fileType === 'image') imageCount += 1;
    if (file.isOrphan) orphanCount += 1;
  }

  return {
    limitBytes: STORAGE_LIMIT_BYTES,
    usedBytes: totalBytes,
    usedFormatted: formatBytes(totalBytes),
    limitFormatted: formatBytes(STORAGE_LIMIT_BYTES),
    percentUsed: Math.min(100, Math.round((totalBytes / STORAGE_LIMIT_BYTES) * 100)),
    fileCount: enriched.length,
    pdfCount,
    imageCount,
    orphanCount,
    files: enriched,
  };
}

export async function getCurrentStorageUsage() {
  const files = await listAllFiles();
  return files.reduce((sum, file) => sum + (file.size || 0), 0);
}

export async function assertStorageQuota(additionalBytes = 0) {
  const used = await getCurrentStorageUsage();
  if (used + additionalBytes > STORAGE_LIMIT_BYTES) {
    const err = new Error('Storage full (1 GB limit). Delete unused files from Store.');
    err.statusCode = 413;
    throw err;
  }
  return { used, remaining: STORAGE_LIMIT_BYTES - used };
}

async function clearBookReference(path) {
  await supabase
    .from('books')
    .update({ pdf_path: null, pdf_file_name: null })
    .eq('pdf_path', path);
}

async function clearPdfUploadReference(path) {
  const { data: rows } = await supabase
    .from('pdf_uploads')
    .select('id')
    .eq('file_path', path);

  for (const row of rows || []) {
    const { count } = await supabase
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('pdf_upload_id', row.id);

    if ((count || 0) === 0) {
      await supabase.from('pdf_uploads').delete().eq('id', row.id);
    } else {
      await supabase.from('pdf_uploads').update({ file_path: null }).eq('id', row.id);
    }
  }
}

async function clearPaymentReference(path) {
  await supabase
    .from('payments')
    .update({ screenshot_url: null })
    .eq('screenshot_url', path);
}

async function clearQrReference() {
  const { data: settingsRow } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'pricing')
    .maybeSingle();

  const current = settingsRow?.value || {};
  if (extractQrPathFromUrl(current.upi_qr_url)) {
    const updated = { ...current, upi_qr_url: '/upi-qr.png' };
    await supabase
      .from('settings')
      .upsert({ key: 'pricing', value: updated, updated_at: new Date().toISOString() });
    invalidateSettingsCache();
  }
}

export async function deleteStorageObject(bucket, path) {
  if (!BUCKETS.includes(bucket) || !path) {
    const err = new Error('Invalid storage object');
    err.statusCode = 400;
    throw err;
  }

  const { error: removeError } = await supabase.storage.from(bucket).remove([path]);
  if (removeError) throw removeError;

  if (bucket === 'pdf_uploads') {
    await clearBookReference(path);
    await clearPdfUploadReference(path);
  } else if (bucket === 'payment_screenshots') {
    await clearPaymentReference(path);
  } else if (bucket === 'payment_qr') {
    await clearQrReference();
  }

  return { success: true };
}

export async function getSignedPreviewUrl(bucket, path) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
