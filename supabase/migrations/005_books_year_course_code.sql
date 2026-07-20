-- Replace branch with year (1-4) and add course_code as main book identifier
-- Run AFTER 001-004

ALTER TABLE books ADD COLUMN IF NOT EXISTS course_code TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS year TEXT;

-- Backfill year from semester: sem 1-2 -> 1, 3-4 -> 2, 5-6 -> 3, 7-8 -> 4
UPDATE books
SET year = CASE
  WHEN semester::int <= 2 THEN '1'
  WHEN semester::int <= 4 THEN '2'
  WHEN semester::int <= 6 THEN '3'
  ELSE '4'
END
WHERE year IS NULL;

-- Backfill course_code for known seed titles
UPDATE books SET course_code = 'MA101' WHERE title = 'Engineering Mathematics I' AND course_code IS NULL;
UPDATE books SET course_code = 'CS301' WHERE title = 'Data Structures & Algorithms' AND course_code IS NULL;
UPDATE books SET course_code = 'EC201' WHERE title = 'Digital Electronics' AND course_code IS NULL;
UPDATE books SET course_code = 'PH101' WHERE title = 'Engineering Physics' AND course_code IS NULL;
UPDATE books SET course_code = 'CS401' WHERE title = 'Operating Systems' AND course_code IS NULL;
UPDATE books SET course_code = 'EC301' WHERE title = 'Signals and Systems' AND course_code IS NULL;
UPDATE books SET course_code = 'ME301' WHERE title = 'Thermodynamics' AND course_code IS NULL;
UPDATE books SET course_code = 'CS501' WHERE title = 'Database Management Systems' AND course_code IS NULL;

-- Fallback for any remaining rows
UPDATE books
SET course_code = 'BOOK-' || UPPER(SUBSTRING(id::text, 1, 8))
WHERE course_code IS NULL;

ALTER TABLE books ALTER COLUMN course_code SET NOT NULL;
ALTER TABLE books ALTER COLUMN year SET NOT NULL;

ALTER TABLE books ADD CONSTRAINT books_course_code_unique UNIQUE (course_code);
ALTER TABLE books ADD CONSTRAINT books_year_check CHECK (year IN ('1', '2', '3', '4'));

ALTER TABLE books DROP COLUMN IF EXISTS branch;
