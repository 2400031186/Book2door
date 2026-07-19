-- Re-enable RLS with proper policies (removes "UNRESTRICTED" badge in Supabase UI)
-- Backend (Express + service/secret key) still works — service_role bypasses RLS
-- Run AFTER 001, 002, 003

-- ============================================
-- 1. Re-enable RLS on all tables
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Drop old / duplicate policies
-- ============================================
DROP POLICY IF EXISTS "Backend full access books" ON books;
DROP POLICY IF EXISTS "Public can read active books" ON books;
DROP POLICY IF EXISTS "service_role_all_profiles" ON profiles;
DROP POLICY IF EXISTS "service_role_all_pdf_uploads" ON pdf_uploads;
DROP POLICY IF EXISTS "service_role_all_orders" ON orders;
DROP POLICY IF EXISTS "service_role_all_order_items" ON order_items;
DROP POLICY IF EXISTS "service_role_all_payments" ON payments;
DROP POLICY IF EXISTS "service_role_all_order_status_history" ON order_status_history;
DROP POLICY IF EXISTS "service_role_all_settings" ON settings;
DROP POLICY IF EXISTS "service_role_all_books" ON books;

-- ============================================
-- 3. Service-role policies (backend API access)
--    service_role key bypasses RLS; these policies
--    secure direct anon/authenticated access
-- ============================================

CREATE POLICY "service_role_all_profiles" ON profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_pdf_uploads" ON pdf_uploads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_orders" ON orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_order_items" ON order_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_payments" ON payments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_order_status_history" ON order_status_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_settings" ON settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_books" ON books
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- 4. Public read for active books (storefront)
-- ============================================
CREATE POLICY "public_read_active_books" ON books
  FOR SELECT TO anon, authenticated
  USING (is_active = TRUE);

-- ============================================
-- 5. Storage — service role + permissive bucket access
-- ============================================
DROP POLICY IF EXISTS "book2door_storage_service_role" ON storage.objects;

CREATE POLICY "book2door_storage_service_role" ON storage.objects
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Keep bucket-scoped policies for anon/authenticated (from 003)
-- If missing, recreate them:
DROP POLICY IF EXISTS "book2door_pdf_uploads_insert" ON storage.objects;
DROP POLICY IF EXISTS "book2door_pdf_uploads_select" ON storage.objects;
DROP POLICY IF EXISTS "book2door_pdf_uploads_update" ON storage.objects;
DROP POLICY IF EXISTS "book2door_pdf_uploads_delete" ON storage.objects;

CREATE POLICY "book2door_pdf_uploads_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'pdf_uploads');
CREATE POLICY "book2door_pdf_uploads_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pdf_uploads');
CREATE POLICY "book2door_pdf_uploads_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'pdf_uploads');
CREATE POLICY "book2door_pdf_uploads_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'pdf_uploads');

DROP POLICY IF EXISTS "book2door_payment_screenshots_insert" ON storage.objects;
DROP POLICY IF EXISTS "book2door_payment_screenshots_select" ON storage.objects;

CREATE POLICY "book2door_payment_screenshots_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment_screenshots');
CREATE POLICY "book2door_payment_screenshots_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment_screenshots');

DROP POLICY IF EXISTS "book2door_book_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "book2door_book_images_select" ON storage.objects;

CREATE POLICY "book2door_book_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'book_images');
CREATE POLICY "book2door_book_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'book_images');

DROP POLICY IF EXISTS "book2door_payment_qr_select" ON storage.objects;
CREATE POLICY "book2door_payment_qr_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment_qr');
