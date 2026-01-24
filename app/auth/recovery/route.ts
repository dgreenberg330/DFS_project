// ============================================================================
// Password Recovery Callback Route
// Dedicated route for password reset flow - more reliable than query params
// ============================================================================

import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    if (!request.url) {
      return NextResponse.redirect('/forgot-password?error=invalid_request');
    }

    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code || code.trim() === '') {
      return NextResponse.redirect(`${origin}/forgot-password?error=missing_code&message=Invalid reset link. Please request a new one.`);
    }

    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.redirect(`${origin}/forgot-password?error=service_unavailable`);
    }

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Recovery callback error:', error.message);

      const isExpiredOrInvalid = error.message.includes('expired')
        || error.message.includes('invalid')
        || error.code === 'otp_expired';

      if (isExpiredOrInvalid) {
        return NextResponse.redirect(
          `${origin}/forgot-password?error=expired&message=Your reset link has expired. Please request a new one.`
        );
      }

      return NextResponse.redirect(
        `${origin}/forgot-password?error=failed&message=Unable to verify reset link. Please try again.`
      );
    }

    // Success - this is definitely a password recovery flow
    // Set flag in user metadata
    await supabase.auth.updateUser({
      data: { pending_password_reset: true }
    });

    // Set cookie and redirect to reset password page
    const response = NextResponse.redirect(`${origin}/account/reset-password`);
    response.cookies.set('pending_password_reset', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 30, // 30 minutes to complete reset
    });

    return response;
  } catch (error) {
    console.error('Unexpected error in recovery callback:', error);
    return NextResponse.redirect('/forgot-password?error=unexpected_error&message=Something went wrong. Please try again.');
  }
}
