-- Fix RLS policies for Book2Door (Express backend + Clerk auth)
-- Run this in Supabase SQL Editor if you see:
-- "new row violates row-level security policy"

-- ============================================
-- 1. Drop old deny-all policies
-- ============================================
DROP POLICY IF EXISTS "Deny direct profiles access" ON profiles;
DROP POLICY IF EXISTS "Deny direct pdf_uploads access" ON pdf_uploads;
DROP POLICY IF EXISTS "Deny direct orders access" ON orders;
DROP POLICY IF EXISTS "Deny direct order_items access" ON order_items;
DROP POLICY IF EXISTS "Deny direct payments access" ON payments;
DROP POLICY IF EXISTS "Deny direct order_status_history access" ON order_status_history;
DROP POLICY IF EXISTS "Deny direct settings access" ON settings;

-- ============================================
-- 2. Disable RLS on backend-managed tables
--    (All writes go through Express API with secret key)
-- ============================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Books: keep RLS with public read for active books only
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read active books" ON books;
CREATE POLICY "Public can read active books" ON books
  FOR SELECT USING (is_active = TRUE);

-- Allow backend full access to books (for admin CRUD via API)
DROP POLICY IF EXISTS "Backend full access books" ON books;
CREATE POLICY "Backend full access books" ON books
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================
-- 3. Storage bucket policies
--    Fixes RLS errors on pdf_uploads / payment_screenshots uploads
-- ============================================

-- PDF uploads bucket
DROP POLICY IF EXISTS "book2door_pdf_uploads_select" ON storage.objects;
DROP POLICY IF EXISTS "book2door_pdf_uploads_insert" ON storage.objects;
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

-- Payment screenshots bucket
DROP POLICY IF EXISTS "book2door_payment_screenshots_select" ON storage.objects;
DROP POLICY IF EXISTS "book2door_payment_screenshots_insert" ON storage.objects;
DROP POLICY IF EXISTS "book2door_payment_screenshots_update" ON storage.objects;
DROP POLICY IF EXISTS "book2door_payment_screenshots_delete" ON storage.objects;

CREATE POLICY "book2door_payment_screenshots_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment_screenshots');
CREATE POLICY "book2door_payment_screenshots_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment_screenshots');
CREATE POLICY "book2door_payment_screenshots_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'payment_screenshots');
CREATE POLICY "book2door_payment_screenshots_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'payment_screenshots');

-- Book images bucket
DROP POLICY IF EXISTS "book2door_book_images_select" ON storage.objects;
DROP POLICY IF EXISTS "book2door_book_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "book2door_book_images_update" ON storage.objects;
DROP POLICY IF EXISTS "book2door_book_images_delete" ON storage.objects;

CREATE POLICY "book2door_book_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'book_images');
CREATE POLICY "book2door_book_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'book_images');
CREATE POLICY "book2door_book_images_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'book_images');
CREATE POLICY "book2door_book_images_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'book_images');

-- Payment QR bucket (public read)
DROP POLICY IF EXISTS "book2door_payment_qr_select" ON storage.objects;
DROP POLICY IF EXISTS "book2door_payment_qr_insert" ON storage.objects;
DROP POLICY IF EXISTS "book2door_payment_qr_update" ON storage.objects;
DROP POLICY IF EXISTS "book2door_payment_qr_delete" ON storage.objects;

CREATE POLICY "book2door_payment_qr_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment_qr');
CREATE POLICY "book2door_payment_qr_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment_qr');
CREATE POLICY "book2door_payment_qr_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'payment_qr');
CREATE POLICY "book2door_payment_qr_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'payment_qr');

-- ============================================
-- 4. Ensure buckets exist
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('book_images', 'book_images', FALSE, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('pdf_uploads', 'pdf_uploads', FALSE, 20971520, ARRAY['application/pdf']),
  ('payment_screenshots', 'payment_screenshots', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg']),
  ('payment_qr', 'payment_qr', TRUE, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. Ensure profiles table matches Clerk (if 002 not run yet)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    RAISE NOTICE 'Run 002_clerk_auth.sql first if using Clerk auth';
  END IF;
END $$;
