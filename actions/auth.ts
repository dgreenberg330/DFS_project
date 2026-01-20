// ============================================================================
// Authentication Server Actions
// ============================================================================

'use server';

import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

/**
 * Signs in user with email and password
 */
export async function signIn(email: string, password: string) {
  if (!email || email.trim() === '') {
    return { error: 'Email address is required.' };
  }

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Invalid email or password.' };
    }
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Signs up new user with email and password
 */
export async function signUp(email: string, password: string) {
  if (!email || email.trim() === '') {
    return { error: 'Email address is required.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get('origin') || 'http://localhost:3000';

  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      return { error: 'This email is already in use.', code: 'EMAIL_EXISTS' };
    }
    return { error: error.message };
  }

  return { success: true, message: 'Check your email to confirm your account.' };
}

/**
 * Sends password reset email
 */
export async function resetPassword(email: string) {
  if (!email || email.trim() === '') {
    return { error: 'Email address is required.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get('origin') || 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${origin}/auth/callback?next=/account/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Updates user password (after reset)
 */
export async function updatePassword(password: string) {
  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
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
