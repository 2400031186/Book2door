-- Store separate single-side and double-side prices for catalog books

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS price_double DECIMAL(10, 2);

-- Backfill: for existing books, set double price to half of single-side (if missing)
UPDATE books
SET price_double = ROUND((price::numeric / 2) * 100) / 100
WHERE price_double IS NULL AND price IS NOT NULL;

ALTER TABLE books
  ALTER COLUMN price_double SET DEFAULT 0;

UPDATE books
SET price_double = 0
WHERE price_double IS NULL;

ALTER TABLE books
  ALTER COLUMN price_double SET NOT NULL;

ALTER TABLE books
  DROP CONSTRAINT IF EXISTS books_price_double_check;

ALTER TABLE books
  ADD CONSTRAINT books_price_double_check CHECK (price_double >= 0);
