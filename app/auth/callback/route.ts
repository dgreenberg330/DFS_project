// ============================================================================
// Auth Callback Route Handler
// Handles redirect after user clicks magic link in email
// ============================================================================

import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Defensive check: validate request URL
    if (!request.url) {
      return NextResponse.redirect('/login?error=invalid_request');
    }

    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/account';

    // Defensive check: validate code exists
    if (!code || code.trim() === '') {
      return NextResponse.redirect(`${origin}/login?error=missing_code`);
    }

    const supabase = await createClient();

    // Defensive check: ensure supabase client was created
    if (!supabase) {
      return NextResponse.redirect(`${origin}/login?error=service_unavailable`);
    }

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has set username
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profile) {
          // First login - redirect to username setup
          return NextResponse.redirect(`${origin}/setup-username`);
        }
      }

      // Defensive check: validate next path starts with /
      const safePath = next.startsWith('/') ? next : '/account';
      // Successful authentication, redirect to account or specified page
      return NextResponse.redirect(`${origin}${safePath}`);
    }

    // Error occurred during code exchange
    console.error('Auth callback error:', error.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  } catch (error) {
    // Catch any unexpected errors
    console.error('Unexpected error in auth callback:', error);
    return NextResponse.redirect('/login?error=unexpected_error');
  }
}