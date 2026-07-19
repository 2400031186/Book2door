import { verifyClerkToken, upsertProfile } from '../utils/auth.js';

export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = header.slice(7);
  const user = await verifyClerkToken(token);

  if (user) {
    try {
      await upsertProfile(user);
    } catch {
      /* profile sync is best-effort */
    }
  }

  req.user = user;
  next();
}

export async function requireAuth(req, res, next) {
  await authMiddleware(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  });
}
