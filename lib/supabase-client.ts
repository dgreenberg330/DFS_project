// ============================================================================
// Supabase Client for Client Components
// ============================================================================

'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates Supabase client for Client Components
 * Singleton pattern - only create once
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}