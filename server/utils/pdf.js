import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';

export async function getPdfPageCount(filePath) {
  const buffer = await fs.readFile(filePath);
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  return pdfDoc.getPageCount();
}

export async function getPdfPageCountFromBuffer(buffer) {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  return pdfDoc.getPageCount();
}
