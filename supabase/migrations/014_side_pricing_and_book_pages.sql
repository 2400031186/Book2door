-- Single-side ₹1/page, double-side ₹0.5/page; store page count on catalog books

ALTER TABLE books ADD COLUMN IF NOT EXISTS page_count INTEGER CHECK (page_count IS NULL OR page_count > 0);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE settings
SET value = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(value, '{pdf_bw_per_page}', '1'),
      '{pdf_bw_single_per_page}', '1'
    ),
    '{pdf_bw_double_per_page}', '0.5'
  ),
  '{double_side_multiplier}', '0.5'
),
updated_at = NOW()
WHERE key = 'pricing';
