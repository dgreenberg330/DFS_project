// ============================================================================
// Authentication Server Actions
// ============================================================================

'use server';

import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

/**
 * Sends magic link email to user
 *
 * @param email User's email address
 * @returns Success message or error
 *
 * Usage:
 * const result = await sendMagicLink('user@example.com');
 */
export async function sendMagicLink(email: string) {
  // Defensive check: validate email
  if (!email || email.trim() === '') {
    return { error: 'Email address is required.' };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get('origin') || 'http://localhost:3000';

  // Send magic link via Supabase Auth
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // User will be redirected here after clicking link
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: `Unable to send login link: ${error.message}` };
  }

  return { success: true };
}

/**
 * Signs out current user
 * Redirects to home page after logout
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

/**
 * Checks if user is authenticated
 * Returns user or null
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}