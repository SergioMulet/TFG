import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hgjxsgldvybbqlxkrgsx.supabase.co';

// It is ok to expose supabase publishable key, RLS is activated
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_syaWrkEn7m5sZQeK5F8fYg_mwbHoby_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: false,
  },
});