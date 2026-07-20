-- Store book PDF files (admin uploads)
-- Run after 009

ALTER TABLE books ADD COLUMN IF NOT EXISTS pdf_path TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS pdf_file_name TEXT;
