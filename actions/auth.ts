// ============================================================================
// Authentication Server Actions
// ============================================================================

'use server';

import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { USERNAME_CONSTRAINTS } from '@/types';

/**
 * Password requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PASSWORD_ERROR = 'Password must be at least 8 characters with uppercase, lowercase, and a number.';

/**
 * Validates password strength
 */
function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Password is required.' };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return { isValid: false, error: PASSWORD_ERROR };
  }
  return { isValid: true };
}

/**
 * Signs in user with email and password
 */
export async function signIn(email: string, password: string) {
  if (!email || email.trim() === '') {
    return { error: 'Email address is required.' };
  }

  // For sign in, just check password exists (don't enforce new rules on existing passwords)
  if (!password) {
    return { error: 'Password is required.' };
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
 * Signs up new user with email, password, and username
 */
export async function signUp(email: string, password: string, username: string) {
  if (!email || email.trim() === '') {
    return { error: 'Email address is required.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.error };
  }

  // Validate username
  if (!username || username.trim() === '') {
    return { error: 'Username is required.' };
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length < USERNAME_CONSTRAINTS.MIN_LENGTH) {
    return { error: `Username must be at least ${USERNAME_CONSTRAINTS.MIN_LENGTH} characters.` };
  }

  if (trimmedUsername.length > USERNAME_CONSTRAINTS.MAX_LENGTH) {
    return { error: `Username must be at most ${USERNAME_CONSTRAINTS.MAX_LENGTH} characters.` };
  }

  if (!USERNAME_CONSTRAINTS.PATTERN.test(trimmedUsername)) {
    return { error: `Username can only contain ${USERNAME_CONSTRAINTS.PATTERN_DESCRIPTION}.` };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get('origin') || 'http://localhost:3000';

  // Check if username is already taken
  const { data: existingUsername } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('username', trimmedUsername)
    .maybeSingle();

  if (existingUsername) {
    return { error: 'Username is already taken. Please choose another.' };
  }

  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        username: trimmedUsername, // Store in user metadata
      },
    },
  });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      return { error: 'An account with this email already exists.', code: 'EMAIL_EXISTS' };
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
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.error };
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
