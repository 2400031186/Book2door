import multer from 'multer';

const storage = multer.memoryStorage();

function pdfFilter(_req, file, cb) {
  const name = file.originalname?.toLowerCase() || '';
  const isPdf =
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/octet-stream' ||
    name.endsWith('.pdf');

  if (isPdf) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
}

function imageFilter(_req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, and PNG images are allowed'), false);
  }
}

export const uploadPdf = multer({
  storage,
  limits: { fileSize: 4.5 * 1024 * 1024 },
  fileFilter: pdfFilter,
}).single('pdf');

export const uploadScreenshot = multer({
  storage,
  limits: { fileSize: 4.5 * 1024 * 1024 },
  fileFilter: imageFilter,
}).single('screenshot');

export const uploadBookImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter,
}).single('cover');

export const uploadQr = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter,
}).single('qr');
