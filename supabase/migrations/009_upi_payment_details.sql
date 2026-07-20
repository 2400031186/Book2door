-- Update UPI payment details
-- Run after 008

UPDATE settings
SET value = value
  || '{"upi_id": "book2door@ybl", "upi_qr_url": "/upi-qr.png"}'::jsonb
WHERE key = 'pricing';
