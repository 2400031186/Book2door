-- Update pickup locations list
-- Run after 007

UPDATE settings
SET value = jsonb_set(
  value,
  '{pickup_locations}',
  '["Aravali hostel", "Vindhya hostel", "Kailash residency", "S-block"]'::jsonb
)
WHERE key = 'pricing';
