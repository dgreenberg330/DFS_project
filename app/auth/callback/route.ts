// ============================================================================
// Auth Callback Route Handler
// Handles redirect after user clicks email links (magic link, password reset)
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
    const type = searchParams.get('type'); // 'recovery' for password reset
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
          // Check if username was provided during signup (stored in user metadata)
          const usernameFromMetadata = user.user_metadata?.username;

          if (usernameFromMetadata) {
            // Create profile with username from signup
            const { error: profileError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: user.id,
                username: usernameFromMetadata,
              });

            if (profileError) {
              console.error('Failed to create profile:', profileError.message);
              // If username is taken (race condition), redirect to setup
              if (profileError.code === '23505') {
                return NextResponse.redirect(`${origin}/setup-username?error=username_taken`);
              }
            }
            // Profile created successfully, continue to account
          } else {
            // No username in metadata - redirect to username setup (legacy flow)
            return NextResponse.redirect(`${origin}/setup-username`);
          }
        }
      }

      // For password recovery flow, set cookie and redirect to reset-password page
      // Cookie ensures user must complete password reset before accessing other pages
      if (type === 'recovery') {
        const response = NextResponse.redirect(`${origin}/account/reset-password`);
        response.cookies.set('pending_password_reset', 'true', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 30, // 30 minutes to complete reset
        });
        return response;
      }

      // Defensive check: validate next path is a safe relative path
      // Prevents open redirect attacks (e.g., //evil.com or /\evil.com)
      const safePath = next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')
        ? next
        : '/account';
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