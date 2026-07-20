import { createClerkClient, verifyToken } from '@clerk/backend';
import { supabase } from '../config/supabase.js';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

function buildFullName(payload) {
  const first = payload.first_name || payload.given_name || '';
  const last = payload.last_name || payload.family_name || '';
  const combined = `${first} ${last}`.trim();
  return payload.name || payload.full_name || combined || null;
}

function extractEmail(payload) {
  return (
    payload.email
    || payload.primary_email_address
    || payload.email_address
    || null
  );
}

async function fetchClerkUserDetails(userId) {
  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
      || clerkUser.emailAddresses?.[0]?.emailAddress
      || null;
    const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim()
      || clerkUser.username
      || null;
    return { email, fullName };
  } catch {
    return { email: null, fullName: null };
  }
}

export async function verifyClerkToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    let email = extractEmail(payload);
    let fullName = buildFullName(payload);

    if (!email || !fullName) {
      const clerkDetails = await fetchClerkUserDetails(payload.sub);
      email = email || clerkDetails.email;
      fullName = fullName || clerkDetails.fullName;
    }

    return {
      id: payload.sub,
      email,
      fullName,
    };
  } catch {
    return null;
  }
}

export async function getProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data;
}

export async function upsertProfile(user, extra = {}) {
  const existing = user?.id ? await getProfile(user.id) : null;

  const payload = {
    id: user.id,
    full_name: extra.full_name || user.fullName || existing?.full_name || null,
    email: extra.email || user.email || existing?.email || null,
    phone: extra.phone ?? existing?.phone ?? null,
    college_id: extra.college_id ?? existing?.college_id ?? null,
    pickup_location: extra.pickup_location ?? existing?.pickup_location ?? null,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function isAdmin(userId) {
  const profile = await getProfile(userId);
  return profile?.role === 'admin';
}
