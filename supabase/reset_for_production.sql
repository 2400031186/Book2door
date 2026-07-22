-- =============================================================================
-- Book2Door — Reset for production (DATABASE ONLY)
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor (on your PRODUCTION project).
--
-- STORAGE: Supabase blocks DELETE FROM storage.objects in SQL.
-- Clear files FIRST using ONE of these:
--   A) From project root:  npm run clear-storage
--      (needs server/.env with SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
--   B) Dashboard → Storage → open each bucket → select all → Delete
--      Buckets: pdf_uploads, payment_screenshots, payment_qr, book_images
--
-- What this SQL script does:
--   1. Clears test orders, payments, uploads, and customer profiles
--   2. Keeps: settings, books catalog, admin profile
--   3. Re-applies production pricing
--   4. Ensures admin account exists
--
-- Does NOT clear:
--   - Storage files (use npm run clear-storage or Dashboard)
--   - Clerk users (Clerk Dashboard → Users)
--   - books table (optional wipe below)
--
-- BEFORE RUNNING: confirm you are on the correct Supabase project.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Database — clear transactional / test data
-- -----------------------------------------------------------------------------
TRUNCATE TABLE
  order_status_history,
  payments,
  order_items,
  orders,
  pdf_uploads
RESTART IDENTITY CASCADE;

DELETE FROM profiles
WHERE role <> 'admin';

-- -----------------------------------------------------------------------------
-- 2. Production pricing (delivery, pages, side rates, split fee)
-- -----------------------------------------------------------------------------
UPDATE settings
SET value = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(value, '{delivery_flat}', '0'),
          '{pdf_bw_per_page}', '1'
        ),
        '{pdf_bw_single_per_page}', '1'
      ),
      '{pdf_bw_double_per_page}', '0.5'
    ),
    '{double_side_multiplier}', '0.5'
  ),
  '{split_payment_fee}', '15'
),
updated_at = NOW()
WHERE key = 'pricing';

-- -----------------------------------------------------------------------------
-- 3. Admin account — update your Clerk user ID / email if needed
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
-- AFTER RUNNING
-- =============================================================================
-- 1. npm run clear-storage  (if not done already)
-- 2. Admin → Settings → re-upload UPI QR
-- 3. Re-upload book PDFs if you kept books but cleared storage
-- 4. Clerk Dashboard → delete test users
-- 5. Test a full order flow
-- =============================================================================


-- =============================================================================
-- OPTIONAL — uncomment only if you need a fuller reset
-- =============================================================================

-- A) Remove ALL books (fresh catalog; re-add via Admin → Books)
-- TRUNCATE TABLE books RESTART IDENTITY CASCADE;

-- B) Nuclear: wipe books + all profiles (then re-run section 3 admin INSERT above)
-- TRUNCATE TABLE books RESTART IDENTITY CASCADE;
-- DELETE FROM profiles;
