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

    if (error) {
      // Handle expired or invalid tokens with helpful messages
      const isExpiredToken = error.message.includes('expired')
        || error.message.includes('invalid')
        || error.code === 'otp_expired';

      // If this was a recovery attempt, redirect with specific error
      if (type === 'recovery') {
        if (isExpiredToken) {
          return NextResponse.redirect(
            `${origin}/forgot-password?error=expired&message=Your reset link has expired. Please request a new one.`
          );
        }
        return NextResponse.redirect(
          `${origin}/forgot-password?error=failed&message=Unable to verify reset link. Please request a new one.`
        );
      }

      // For other auth flows, redirect to login with error
      console.error('Auth callback error:', error.message);
      if (isExpiredToken) {
        return NextResponse.redirect(`${origin}/login?error=link_expired`);
      }
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    // Code exchange succeeded - check if user has set username
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        // Check if username was provided during signup (stored in user metadata)
        // Profile should already exist from signup, but this serves as a fallback
        const usernameFromMetadata = user.user_metadata?.username;

        if (usernameFromMetadata) {
          // Try to create profile with username from signup metadata
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              username: usernameFromMetadata,
            });

          if (profileError) {
            console.error('Failed to create profile:', profileError.message);
            // If username is taken (race condition or duplicate), redirect to setup
            if (profileError.code === '23505') {
              return NextResponse.redirect(`${origin}/setup-username?error=username_taken`);
            }
            // For any other error, also redirect to setup to let user choose username
            return NextResponse.redirect(`${origin}/setup-username?error=profile_error`);
          }
          // Profile created successfully, continue to account
        } else {
          // No username in metadata - redirect to username setup (legacy flow)
          return NextResponse.redirect(`${origin}/setup-username`);
        }
      }
    }

    // For password recovery flow, set flag and redirect to reset-password page
    // This ensures user must complete password reset before accessing other pages
    if (type === 'recovery') {
      // Set flag in user metadata (server-side, can't be bypassed)
      await supabase.auth.updateUser({
        data: { pending_password_reset: true }
      });

      // Also set cookie for faster middleware checks
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
  } catch (error) {
    // Catch any unexpected errors
    console.error('Unexpected error in auth callback:', error);
    return NextResponse.redirect('/login?error=unexpected_error');
  }
}