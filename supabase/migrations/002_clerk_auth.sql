-- Migrate auth from Supabase Auth to Clerk (text user IDs)

-- Drop Supabase auth trigger if present
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate profiles for Clerk user IDs
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  college_id TEXT,
  pickup_location TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny direct profiles access" ON profiles FOR ALL USING (FALSE);

-- Update user_id columns to TEXT for Clerk IDs
ALTER TABLE pdf_uploads DROP CONSTRAINT IF EXISTS pdf_uploads_user_id_fkey;
ALTER TABLE pdf_uploads ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE orders ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
