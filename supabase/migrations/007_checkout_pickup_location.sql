-- Replace address/city/pincode with pickup location
-- Run after 006

ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_location TEXT;

ALTER TABLE orders ALTER COLUMN address DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN city DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN pincode DROP NOT NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pickup_location TEXT;

-- Add default pickup locations to pricing settings
UPDATE settings
SET value = value || '{"pickup_locations": ["Aravali hostel", "Vindhya hostel", "Kailash residency", "S-block"]}'::jsonb
WHERE key = 'pricing'
  AND NOT (value ? 'pickup_locations');
