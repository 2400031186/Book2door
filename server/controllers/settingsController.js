import { getPricingSettings } from '../utils/pricing.js';

export async function getPublicPricing(req, res) {
  try {
    const settings = await getPricingSettings();
    const { upi_id, upi_qr_url, ...pricing } = settings;
    res.json({ pricing, upi_id, upi_qr_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
