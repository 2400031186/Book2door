-- Free delivery and ₹1 per page B&W PDF printing
UPDATE settings
SET value = jsonb_set(
  jsonb_set(value, '{delivery_flat}', '0'),
  '{pdf_bw_per_page}',
  '1'
),
updated_at = NOW()
WHERE key = 'pricing';
