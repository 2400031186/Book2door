import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

let supabaseInstance = null;

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server/.env');
  }

  if (!supabaseServiceKey.startsWith('eyJ') && !supabaseServiceKey.startsWith('sb_secret_')) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is invalid. Use the service_role JWT (eyJ...) or secret key (sb_secret_...) from Supabase Dashboard → Settings → API.'
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return supabaseInstance;
}

export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      return getSupabase()[prop];
    },
  }
);

export default supabase;
