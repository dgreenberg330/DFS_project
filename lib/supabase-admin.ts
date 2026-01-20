// ============================================================================
// Supabase Admin Client (Service Role - Bypasses RLS)
// ============================================================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates Supabase client with service role key
 * IMPORTANT: Only use for admin operations that need to bypass RLS
 * Never expose this client to the browser
 */
export function createAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
