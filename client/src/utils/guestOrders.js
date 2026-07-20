const STORAGE_KEY = 'book2door-guest-orders';

export function loadGuestOrders() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGuestOrder({ id, order_number, phone }) {
  if (!id || !order_number) return;

  const entry = {
    id,
    order_number,
    phone: phone || '',
    saved_at: new Date().toISOString(),
  };

  const existing = loadGuestOrders().filter(
    (o) => o.id !== entry.id && o.order_number !== entry.order_number
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([entry, ...existing].slice(0, 25))
  );
}

export async function fetchGuestOrderDetails(guestOrders) {
  const { ordersApi } = await import('../services/api');
  const results = await Promise.all(
    guestOrders.map(async (guest) => {
      try {
        const { data } = await ordersApi.getById(guest.id);
        if (!data?.order) return null;
        return {
          order: data.order,
          history: data.history || [],
          payments: data.payments || [],
        };
      } catch {
        return null;
      }
    })
  );
  return results.filter(Boolean);
}

export function mergeOrderResults(...lists) {
  const seen = new Set();
  const merged = [];

  for (const list of lists) {
    for (const entry of list || []) {
      const id = entry?.order?.id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      merged.push(entry);
    }
  }

  return merged.sort(
    (a, b) => new Date(b.order.created_at) - new Date(a.order.created_at)
  );
}
