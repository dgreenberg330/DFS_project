// ============================================================================
// API Auth Helper - JWT-based authentication for API routes
// ============================================================================
// Used by API routes that receive JWT from iOS app's Authorization header.
// Creates a Supabase client authenticated with the provided JWT.
// ============================================================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

/**
 * Extracts JWT from Authorization header and creates an authenticated
 * Supabase client. Returns null if no valid JWT is present.
 */
export function createClientFromJWT(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const jwt = authHeader.slice(7);
  if (!jwt) {
    return null;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Extracts and verifies the authenticated user from a JWT-bearing request.
 * Returns the user object or null if authentication fails.
 */
export async function getUserFromJWT(request: NextRequest) {
  const supabase = createClientFromJWT(request);
  if (!supabase) {
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }

  return user;
}
