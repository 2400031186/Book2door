import fs from 'fs/promises';

/** Works with multer memoryStorage (Vercel) or diskStorage (local). */
export async function getUploadBuffer(file) {
  if (!file) return null;
  if (file.buffer) return file.buffer;
  if (file.path) return fs.readFile(file.path);
  throw new Error('Uploaded file has no buffer or path');
}

export async function cleanupUpload(file) {
  if (file?.path) {
    await fs.unlink(file.path).catch(() => {});
  }
}
