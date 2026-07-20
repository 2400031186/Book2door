export const DEFAULT_BOOK_COVER = '/default-book-cover.png';

export function getBookCoverUrl(coverUrl) {
  return coverUrl || DEFAULT_BOOK_COVER;
}
