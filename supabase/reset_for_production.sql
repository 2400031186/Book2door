-- =============================================================================
-- Book2Door — Reset for production
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor (on your PRODUCTION project).
--
-- What this does:
--   1. Deletes all files from storage buckets (PDFs, screenshots, QR, covers)
--   2. Clears test orders, payments, uploads, and customer profiles
--   3. Keeps: settings, books catalog, admin profile
--   4. Re-applies production pricing (₹1/page, free pickup)
--   5. Ensures admin account exists
--
-- Does NOT clear:
--   - Clerk users (delete test users in Clerk Dashboard → Users)
--   - books table (optional wipe below)
--   - settings row (only pricing fields updated)
--
-- BEFORE RUNNING: confirm you are on the correct Supabase project.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Storage — remove all uploaded files (resets ~1 GB File Store quota)
-- -----------------------------------------------------------------------------
DELETE FROM storage.objects
WHERE bucket_id IN (
  'pdf_uploads',
  'payment_screenshots',
  'payment_qr',
  'book_images'
);

-- -----------------------------------------------------------------------------
-- 2. Database — clear transactional / test data
--    (order matters: child tables included in TRUNCATE list)
-- -----------------------------------------------------------------------------
TRUNCATE TABLE
  order_status_history,
  payments,
  order_items,
  orders,
  pdf_uploads
RESTART IDENTITY CASCADE;

-- Remove customer profiles; admin row is re-inserted below
DELETE FROM profiles
WHERE role <> 'admin';

-- -----------------------------------------------------------------------------
-- 3. Production pricing (same as migrations/013_free_delivery_pdf_pricing.sql)
-- -----------------------------------------------------------------------------
UPDATE settings
SET value = jsonb_set(
  jsonb_set(value, '{delivery_flat}', '0'),
  '{pdf_bw_per_page}',
  '1'
),
updated_at = NOW()
WHERE key = 'pricing';

-- -----------------------------------------------------------------------------
-- 4. Admin account — update your Clerk user ID / email if needed
--    Find ID in Clerk Dashboard → Users (starts with user_)
-- -----------------------------------------------------------------------------
INSERT INTO profiles (id, full_name, email, role)
VALUES (
  'user_3GjDtJKwvAToV4exxgx1I3VXqzR',
  'SADHWIK LANKALAPALLI',
  'sadhwikchowdary9@gmail.com',
  'admin'
)
ON CONFLICT (id) DO UPDATE
SET
  role = 'admin',
  email = EXCLUDED.email,
  full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);

COMMIT;

-- =============================================================================
-- AFTER RUNNING — manual steps
-- =============================================================================
-- 1. Storage → verify all four buckets are empty
-- 2. Admin → Settings → re-upload UPI QR (payment_qr bucket was cleared)
-- 3. Clerk Dashboard → delete test users you don't want in production
-- 4. Test: sign in → cart → checkout → payment → track order
-- =============================================================================


-- =============================================================================
-- OPTIONAL — uncomment only if you need a fuller reset
-- =============================================================================

-- A) Remove ALL books (fresh catalog; re-add via Admin → Books)
-- TRUNCATE TABLE books RESTART IDENTITY CASCADE;

-- B) Nuclear: wipe books + all profiles (then re-run section 4 admin INSERT above)
-- TRUNCATE TABLE books RESTART IDENTITY CASCADE;
-- DELETE FROM profiles;
