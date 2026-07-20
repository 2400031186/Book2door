export function getBookCartUnitPrice(singleSideAmount, sideMode, pricing) {
  const base = Number(singleSideAmount) || 0;
  if (sideMode === 'double') {
    const singleRate = pricing?.pdf_bw_single_per_page ?? pricing?.pdf_bw_per_page ?? 1;
    const doubleRate = pricing?.pdf_bw_double_per_page ?? 0.5;
    const ratio = singleRate > 0 ? doubleRate / singleRate : 0.5;
    return Math.round(base * ratio * 100) / 100;
  }
  return Math.round(base * 100) / 100;
}

export function formatSideLabel(sideMode) {
  return sideMode === 'double' ? 'Double-sided' : 'Single-sided';
}
