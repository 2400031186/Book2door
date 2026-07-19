-- Book2Door initial schema

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  college_id TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Books catalog
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  branch TEXT NOT NULL,
  semester TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  cover_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin-configurable settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PDF uploads
CREATE TABLE IF NOT EXISTS pdf_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  page_count INTEGER NOT NULL CHECK (page_count > 0),
  print_options JSONB NOT NULL DEFAULT '{}',
  calculated_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  college_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  order_notes TEXT,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  delivery_charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('full', 'split')),
  advance_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cod_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment', 'payment_review', 'received', 'printing',
    'packing', 'out_for_delivery', 'delivered', 'cancelled'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('book', 'pdf')),
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  pdf_upload_id UUID REFERENCES pdf_uploads(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  line_total DECIMAL(10, 2) NOT NULL DEFAULT 0
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('full', 'split')),
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order status history for tracking timeline
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Public read for active books
CREATE POLICY "Public can read active books" ON books
  FOR SELECT USING (is_active = TRUE);

-- Public read for pricing settings (non-sensitive keys only handled by API)
CREATE POLICY "Deny direct settings access" ON settings
  FOR ALL USING (FALSE);

-- Deny direct access on sensitive tables (backend uses service role)
CREATE POLICY "Deny direct profiles access" ON profiles FOR ALL USING (FALSE);
CREATE POLICY "Deny direct pdf_uploads access" ON pdf_uploads FOR ALL USING (FALSE);
CREATE POLICY "Deny direct orders access" ON orders FOR ALL USING (FALSE);
CREATE POLICY "Deny direct order_items access" ON order_items FOR ALL USING (FALSE);
CREATE POLICY "Deny direct payments access" ON payments FOR ALL USING (FALSE);
CREATE POLICY "Deny direct order_status_history access" ON order_status_history FOR ALL USING (FALSE);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('book_images', 'book_images', FALSE, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('pdf_uploads', 'pdf_uploads', FALSE, 20971520, ARRAY['application/pdf']),
  ('payment_screenshots', 'payment_screenshots', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg']),
  ('payment_qr', 'payment_qr', TRUE, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Seed pricing settings
INSERT INTO settings (key, value) VALUES
  ('pricing', '{
    "pdf_bw_per_page": 1.5,
    "pdf_color_per_page": 3.0,
    "single_side_multiplier": 1.0,
    "double_side_multiplier": 0.7,
    "spiral_binding": 40,
    "delivery_flat": 50,
    "min_order": 100,
    "split_advance_percent": 50,
    "upi_id": "book2door@upi",
    "upi_qr_url": ""
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Seed sample books
INSERT INTO books (title, subject, branch, semester, price, cover_image_url) VALUES
  ('Engineering Mathematics I', 'Mathematics', 'CSE', '1', 299.00, NULL),
  ('Data Structures & Algorithms', 'DSA', 'CSE', '3', 449.00, NULL),
  ('Digital Electronics', 'Electronics', 'ECE', '2', 349.00, NULL),
  ('Engineering Physics', 'Physics', 'ME', '1', 279.00, NULL),
  ('Operating Systems', 'OS', 'CSE', '4', 399.00, NULL),
  ('Signals and Systems', 'Signals', 'ECE', '3', 379.00, NULL),
  ('Thermodynamics', 'Thermal', 'ME', '3', 329.00, NULL),
  ('Database Management Systems', 'DBMS', 'CSE', '5', 419.00, NULL)
ON CONFLICT DO NOTHING;
