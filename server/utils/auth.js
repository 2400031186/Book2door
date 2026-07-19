import { verifyToken } from '@clerk/backend';
import { supabase } from '../config/supabase.js';

export async function verifyClerkToken(token) {
  if (!token || typeof token !== 'string') return null;

  // Only attempt verification for valid JWT-shaped tokens
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    return {
      id: payload.sub,
      email: payload.email || payload.primary_email_address || null,
      fullName: payload.name || payload.full_name || null,
    };
  } catch {
    return null;
  }
}

export async function getProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data;
}

export async function upsertProfile(user) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        full_name: user.fullName || null,
        email: user.email || null,
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function isAdmin(userId) {
  const profile = await getProfile(userId);
  return profile?.role === 'admin';
}
