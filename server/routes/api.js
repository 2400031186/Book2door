import { Router } from 'express';
import { getPublicPricing } from '../controllers/settingsController.js';
import { getBooks, getBookById } from '../controllers/booksController.js';
import { uploadPdf, quotePdfPrice } from '../controllers/uploadController.js';
import { createOrder, getOrderById, getMyOrders, trackOrder, getCheckoutDetails } from '../controllers/ordersController.js';
import { submitPayment, getPaymentById } from '../controllers/paymentsController.js';
import { syncProfile } from '../controllers/profileController.js';
import { authMiddleware, requireAuth } from '../middleware/auth.js';
import { uploadPdf as uploadPdfMw, uploadScreenshot } from '../middleware/upload.js';
import { uploadLimiter, paymentLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/settings/pricing', getPublicPricing);
router.get('/books', getBooks);
router.get('/books/:id', getBookById);

router.post('/upload/pdf', uploadLimiter, authMiddleware, (req, res, next) => {
  uploadPdfMw(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    uploadPdf(req, res);
  });
});

router.post('/upload/quote', quotePdfPrice);

router.post('/profile/sync', requireAuth, syncProfile);

router.post('/orders', authMiddleware, createOrder);
router.get('/orders/checkout-details', requireAuth, getCheckoutDetails);
router.get('/orders/mine', requireAuth, getMyOrders);
router.get('/orders/:id', getOrderById);
router.get('/track/:query', trackOrder);

router.post('/payments', paymentLimiter, (req, res, next) => {
  uploadScreenshot(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    submitPayment(req, res);
  });
});

router.get('/payment/:id', getPaymentById);

export default router;
