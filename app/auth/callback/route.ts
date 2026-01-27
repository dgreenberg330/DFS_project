// ============================================================================
// Auth Callback Route Handler
// Handles redirect after user clicks email links (magic link, password reset)
// ============================================================================

import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

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

    // Try to ensure user profile exists (created during signup, this is a fallback)
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        // Profile doesn't exist - try to create it from signup metadata
        const usernameFromMetadata = user.user_metadata?.username;

        if (usernameFromMetadata) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              username: usernameFromMetadata,
              unsubscribe_token: randomBytes(32).toString('hex'),
            });

          if (profileError) {
            // Log error but continue - user is authenticated and can use account
            console.error('Failed to create profile in callback:', profileError.message);
          }
        }
        // If no username in metadata or profile creation failed, continue anyway
        // The account page will handle missing profile gracefully
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