import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

const Home = lazy(() => import('./pages/Home'));
const Books = lazy(() => import('./pages/Books'));
const UploadPdf = lazy(() => import('./pages/UploadPdf'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminBooks = lazy(() => import('./pages/admin/AdminBooks'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'));
const AdminOrderBook = lazy(() => import('./pages/admin/AdminOrderBook'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin w-8 h-8 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full" />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <AnimatePresence mode="wait">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route element={<MainLayout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/books" element={<Books />} />
                      <Route path="/upload" element={<UploadPdf />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/order/:id" element={<OrderSuccess />} />
                      <Route path="/track" element={<TrackOrder />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                    </Route>

                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="order-book" element={<AdminOrderBook />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="books" element={<AdminBooks />} />
                      <Route path="payments" element={<AdminPayments />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>
                  </Routes>
                </Suspense>
              </AnimatePresence>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
