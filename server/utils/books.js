export const DEFAULT_BOOK_COVER = '/default-book-cover.png';

export function withDefaultCover(book) {
  if (!book) return book;
  return {
    ...book,
    cover_image_url: book.cover_image_url || DEFAULT_BOOK_COVER,
  };
}

export function withDefaultCovers(books) {
  return (books || []).map(withDefaultCover);
}
