import { supabase } from '../config/supabase.js';

let cachedSettings = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function getPricingSettings(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && now - cacheTime < CACHE_TTL) {
    return cachedSettings;
  }

  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'pricing')
    .single();

  if (error || !data) {
    cachedSettings = getDefaultSettings();
  } else {
    cachedSettings = { ...getDefaultSettings(), ...data.value };
  }

  cacheTime = now;
  return cachedSettings;
}

export function invalidateSettingsCache() {
  cachedSettings = null;
  cacheTime = 0;
}

function getDefaultSettings() {
  return {
    pdf_bw_per_page: 1.5,
    pdf_color_per_page: 3.0,
    single_side_multiplier: 1.0,
    double_side_multiplier: 0.7,
    // Binding is fixed permanently at ₹75
    spiral_binding: 75,
    delivery_flat: 50,
    min_order: 100,
    split_advance_percent: 50,
    upi_id: 'book2door@ybl',
    upi_qr_url: '/upi-qr.png',
    pickup_locations: ['Aravali hostel', 'Vindhya hostel', 'Kailash residency', 'S-block'],
  };
}

export function calculatePdfPrice(pageCount, options, settings) {
  const {
    colorMode = 'bw',
    sideMode = 'single',
    copies = 1,
    spiralBinding = false,
  } = options;

  const rate = colorMode === 'color' ? settings.pdf_color_per_page : settings.pdf_bw_per_page;
  const sideMultiplier =
    sideMode === 'double' ? settings.double_side_multiplier : settings.single_side_multiplier;
  // Permanent binding charge (remove dependency on DB setting).
  const bindingCharge = spiralBinding ? 75 : 0;

  const printCost = pageCount * rate * sideMultiplier * copies;
  return Math.round((printCost + bindingCharge) * 100) / 100;
}

export function calculateBookLineTotal(price, quantity) {
  return Math.round(price * quantity * 100) / 100;
}

export function calculateOrderTotals(items, settings) {
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const deliveryCharge = subtotal > 0 ? settings.delivery_flat : 0;
  const grandTotal = Math.round((subtotal + deliveryCharge) * 100) / 100;

  return { subtotal, deliveryCharge, grandTotal };
}

export function calculatePaymentSplit(grandTotal, paymentType, settings) {
  if (paymentType === 'full') {
    return { advanceAmount: grandTotal, codAmount: 0 };
  }

  const advancePercent = settings.split_advance_percent / 100;
  const advanceAmount = Math.round(grandTotal * advancePercent * 100) / 100;
  const codAmount = Math.round((grandTotal - advanceAmount) * 100) / 100;

  return { advanceAmount, codAmount };
}

export function generateOrderNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `B2D-${dateStr}-${random}`;
}
