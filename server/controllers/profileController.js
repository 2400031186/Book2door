import { upsertProfile } from '../utils/auth.js';

export async function syncProfile(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { full_name, email } = req.body || {};
    const profile = await upsertProfile(req.user, {
      full_name: full_name || req.user.fullName,
      email: email || req.user.email,
    });

    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
