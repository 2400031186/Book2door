import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuth.js';
import { uploadBookPdf, uploadQr } from '../middleware/upload.js';
import {
  getDashboard,
  getAdminOrders,
  updateOrderStatus,
  deleteOrder,
  createBook,
  updateBook,
  deleteBook,
  getAdminPayments,
  updatePaymentStatus,
  getAdminSettings,
  updateAdminSettings,
  downloadPdf,
  downloadBookPdf,
  getAllBooksAdmin,
  getOrderBook,
  updateOrderBookItemPrint,
  checkAdminRole,
  getStore,
  deleteStoreFile,
  getStoreFilePreview,
} from '../controllers/adminController.js';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/check', checkAdminRole);
router.get('/dashboard', getDashboard);
router.get('/orders', getAdminOrders);
router.get('/order-book', getOrderBook);
router.put('/order-book/items/:id/print', updateOrderBookItemPrint);
router.put('/orders/:id/status', updateOrderStatus);
router.delete('/orders/:id', deleteOrder);

router.get('/books', getAllBooksAdmin);
router.post('/books', (req, res, next) => {
  uploadBookPdf(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    createBook(req, res);
  });
});
router.put('/books/:id', (req, res, next) => {
  uploadBookPdf(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    updateBook(req, res);
  });
});
router.delete('/books/:id', deleteBook);

router.get('/payments', getAdminPayments);
router.put('/payments/:id', updatePaymentStatus);

router.get('/settings', getAdminSettings);
router.put('/settings', (req, res, next) => {
  uploadQr(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    updateAdminSettings(req, res);
  });
});

router.get('/pdf/:id/download', downloadPdf);
router.get('/books/:id/pdf', downloadBookPdf);

router.get('/store', getStore);
router.get('/store/preview', getStoreFilePreview);
router.delete('/store', deleteStoreFile);

export default router;
