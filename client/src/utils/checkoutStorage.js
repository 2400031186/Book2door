const CHECKOUT_STORAGE_KEY = 'book2door-checkout';

export function loadSavedCheckout() {
  try {
    const saved = localStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore */
  }
  return null;
}

export function saveCheckoutDetails(details) {
  try {
    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(details));
  } catch {
    /* ignore */
  }
}
