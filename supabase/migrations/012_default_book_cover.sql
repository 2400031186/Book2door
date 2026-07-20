-- Set default cover image for all books (KL University logo)
UPDATE books
SET cover_image_url = '/default-book-cover.png'
WHERE cover_image_url IS NULL OR cover_image_url = '';
