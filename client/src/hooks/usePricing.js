import { useEffect, useState } from 'react';
import { settingsApi } from '../services/api';

export function usePricing() {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsApi
      .getPricing()
      .then(({ data }) => setPricing(data.pricing))
      .catch(() => setPricing({ delivery_flat: 50, split_advance_percent: 50, min_order: 100 }))
      .finally(() => setLoading(false));
  }, []);

  const deliveryCharge = pricing && pricing.delivery_flat ? pricing.delivery_flat : 50;
  const splitPercent = pricing?.split_advance_percent ?? 50;
  const minOrder = pricing?.min_order ?? 100;

  return { pricing, loading, deliveryCharge, splitPercent, minOrder };
}

export default usePricing;
