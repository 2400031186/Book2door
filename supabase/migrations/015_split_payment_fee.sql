-- ₹15 extra charge when customer chooses split payment at checkout

UPDATE settings
SET value = jsonb_set(value, '{split_payment_fee}', '15'),
    updated_at = NOW()
WHERE key = 'pricing';
