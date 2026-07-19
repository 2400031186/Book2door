import { verifyClerkToken, isAdmin, upsertProfile } from '../utils/auth.js';

export async function adminAuthMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = header.slice(7);
  const user = await verifyClerkToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    await upsertProfile(user);
  } catch {
    /* best-effort */
  }

  const admin = await isAdmin(user.id);
  if (!admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  req.user = user;
  next();
}
