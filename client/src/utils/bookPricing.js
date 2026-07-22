export function getBookCartUnitPrice(book, sideMode) {
  const single = Number(book?.price) || 0;
  if (sideMode === 'double') {
    if (book?.price_double != null && book.price_double !== '') {
      return Math.round((Number(book.price_double) || 0) * 100) / 100;
    }
    return Math.round(single * 0.5 * 100) / 100;
  }
  return Math.round(single * 100) / 100;
}

export function formatSideLabel(sideMode) {
  return sideMode === 'double' ? 'Double-sided' : 'Single-sided';
}
