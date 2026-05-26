import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.error(
    '[dockit] Missing Supabase env. Copy .env.example to .env.local and fill in ' +
    'VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY from your Supabase project dashboard.',
  );
}

export const supabase = createClient(url ?? '', key ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // so magic-link callbacks work
  },
});

export const BUCKET = 'receipt-images';
