-- Remove subject; limit semester to 1 or 2 only
-- Run AFTER 005

-- Normalize existing semesters to 1 or 2
UPDATE books
SET semester = CASE WHEN semester::int % 2 = 1 THEN '1' ELSE '2' END
WHERE semester NOT IN ('1', '2');

ALTER TABLE books DROP COLUMN IF EXISTS subject;

ALTER TABLE books DROP CONSTRAINT IF EXISTS books_semester_check;
ALTER TABLE books ADD CONSTRAINT books_semester_check CHECK (semester IN ('1', '2'));
