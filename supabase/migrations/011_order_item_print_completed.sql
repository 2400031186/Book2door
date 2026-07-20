-- Track print completion per order line (Order Book)
-- Run after 010

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS print_completed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS print_completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_order_items_print_completed ON order_items(print_completed) WHERE item_type = 'book';
