import axios from 'axios';

function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_URL;
  // On Vercel/production, never call localhost — use same-origin /api
  if (import.meta.env.PROD && (!configured || String(configured).includes('localhost'))) {
    return '/api';
  }
  return configured || '/api';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

let tokenGetter = null;

export function setAuthTokenGetter(getter) {
  tokenGetter = getter;
}

api.interceptors.request.use(async (config) => {
  // FormData must NOT use application/json — let the browser set multipart boundary
  if (config.data instanceof FormData) {
    if (config.headers?.set) {
      config.headers.delete('Content-Type');
    } else {
      delete config.headers['Content-Type'];
    }
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  if (tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token && token.split('.').length === 3) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      /* ignore token errors */
    }
  }
  return config;
});

export default api;

export const booksApi = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
};

export const settingsApi = {
  getPricing: () => api.get('/settings/pricing'),
};

export const uploadApi = {
  uploadPdf: (formData) => api.post('/upload/pdf', formData),
  quote: (data) => api.post('/upload/quote', data),
};

export const ordersApi = {
  create: (data) => api.post('/orders', data),
  getById: (id) => api.get(`/orders/${id}`),
  getMine: () => api.get('/orders/mine'),
  getCheckoutDetails: () => api.get('/orders/checkout-details'),
  track: (query) => api.get(`/track/${encodeURIComponent(query)}`),
};

export const paymentsApi = {
  submit: (formData) => api.post('/payments', formData),
};

export const adminApi = {
  check: () => api.get('/admin/check'),
  dashboard: () => api.get('/admin/dashboard'),
  orders: (params) => api.get('/admin/orders', { params }),
  orderBook: (params) => api.get('/admin/order-book', { params }),
  markOrderBookPrinted: (itemId, completed = true) =>
    api.put(`/admin/order-book/items/${itemId}/print`, { completed }),
  updateOrderStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
  deleteOrder: (id) => api.delete(`/admin/orders/${id}`),
  books: () => api.get('/admin/books'),
  createBook: (formData) => api.post('/admin/books', formData),
  updateBook: (id, formData) => api.put(`/admin/books/${id}`, formData),
  deleteBook: (id) => api.delete(`/admin/books/${id}`),
  payments: (params) => api.get('/admin/payments', { params }),
  updatePayment: (id, data) => api.put(`/admin/payments/${id}`, data),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (formData) => api.put('/admin/settings', formData),
  downloadPdf: (id) => api.get(`/admin/pdf/${id}/download`),
  downloadBookPdf: (id) => api.get(`/admin/books/${id}/pdf`),
  store: () => api.get('/admin/store'),
  storePreview: (bucket, path) => api.get('/admin/store/preview', { params: { bucket, path } }),
  deleteStoreFile: (bucket, path) => api.delete('/admin/store', { data: { bucket, path } }),
};
