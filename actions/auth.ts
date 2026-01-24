// ============================================================================
// Authentication Server Actions
// ============================================================================

'use server';

import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { USERNAME_CONSTRAINTS } from '@/types';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ============================================================================
// Rate Limiting for Auth Actions
// ============================================================================

// Initialize Redis client (only if env vars are set)
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Strict rate limiter for actual auth attempts: 5 per minute per IP
const authActionLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      prefix: 'ratelimit:auth-action',
    })
  : null;

/**
 * Get client IP address from request headers
 */
async function getClientIP(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const realIP = headersList.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return '127.0.0.1';
}

/**
 * Check rate limit for auth actions
 * Returns error message if rate limited, null if allowed
 */
async function checkAuthRateLimit(): Promise<string | null> {
  if (!authActionLimiter) {
    return null; // No rate limiting if Redis not configured
  }

  const ip = await getClientIP();
  const { success, reset } = await authActionLimiter.limit(ip);

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return `Too many attempts. Please try again in ${retryAfter} seconds.`;
  }

  return null;
}

/**
 * Password requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PASSWORD_ERROR = 'Password must be at least 8 characters with uppercase, lowercase, and a number.';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  // Check rate limit first
  const rateLimitError = await checkAuthRateLimit();
  if (rateLimitError) {
    return { error: rateLimitError };
  }

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
  // Check rate limit first
  const rateLimitError = await checkAuthRateLimit();
  if (rateLimitError) {
    return { error: rateLimitError };
  }

  if (!email || email.trim() === '') {
    return { error: 'Email address is required.' };
  }

  if (!EMAIL_REGEX.test(email)) {
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

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        username: trimmedUsername, // Store in user metadata as backup
      },
    },
  });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      return { error: 'An account with this email already exists.', code: 'EMAIL_EXISTS' };
    }
    return { error: error.message };
  }

  // Create user profile immediately using admin client (bypasses RLS)
  // This ensures profile exists when user confirms email, avoiding second username prompt
  if (data.user) {
    const adminClient = createAdminClient();
    const { error: profileError } = await adminClient
      .from('user_profiles')
      .insert({
        user_id: data.user.id,
        username: trimmedUsername,
      });

    if (profileError) {
      // If profile creation fails (e.g., username race condition),
      // the callback will handle it via user_metadata fallback
      console.error('Failed to create profile during signup:', profileError.message);
    }
  }

  return { success: true, message: 'Check your email to confirm your account.' };
}

/**
 * Sends password reset email
 */
export async function resetPassword(email: string) {
  // Check rate limit first
  const rateLimitError = await checkAuthRateLimit();
  if (rateLimitError) {
    return { error: rateLimitError };
  }

  if (!email || email.trim() === '') {
    return { error: 'Email address is required.' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get('origin') || 'http://localhost:3000';

  // Use dedicated recovery route - more reliable than query params which can get stripped
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${origin}/auth/recovery`,
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
    data: { pending_password_reset: null }, // Clear the metadata flag
  });

  if (error) {
    return { error: error.message };
  }

  // Clear the pending password reset cookie
  const cookieStore = await cookies();
  cookieStore.delete('pending_password_reset');

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
