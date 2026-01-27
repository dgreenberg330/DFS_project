// ============================================================================
// User Profile Actions - Username Management
// ============================================================================

'use server';

import { getUser, createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { USERNAME_CONSTRAINTS } from '@/types';

/**
 * Validates username format
 * Helper function for internal use
 */
function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username || username.trim() === '') {
    return { isValid: false, error: 'Username is required.' };
  }

  const trimmed = username.trim();

  if (trimmed.length < USERNAME_CONSTRAINTS.MIN_LENGTH) {
    return { isValid: false, error: `Username must be at least ${USERNAME_CONSTRAINTS.MIN_LENGTH} characters.` };
  }

  if (trimmed.length > USERNAME_CONSTRAINTS.MAX_LENGTH) {
    return { isValid: false, error: `Username must be at most ${USERNAME_CONSTRAINTS.MAX_LENGTH} characters.` };
  }

  if (!USERNAME_CONSTRAINTS.PATTERN.test(trimmed)) {
    return { isValid: false, error: `Username can only contain ${USERNAME_CONSTRAINTS.PATTERN_DESCRIPTION}.` };
  }

  return { isValid: true };
}

/**
 * Gets user profile for current user
 * Returns null if no profile exists
 */
export async function getUserProfile() {
  const user = await getUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  return profile;
}

/**
 * Creates or updates username for current user
 * Returns error message if failed, null if successful
 */
export async function setUsername(username: string): Promise<{ error?: string }> {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  // Validate format
  const validation = validateUsername(username);
  if (!validation.isValid) {
    return { error: validation.error };
  }

  const trimmed = username.trim();
  const supabase = await createClient();

  // Check if username is already taken
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('username', trimmed)
    .maybeSingle();

  if (existing && existing.user_id !== user.id) {
    return { error: 'Username is already taken. Please choose another.' };
  }

  // Check if profile exists
  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (currentProfile) {
    // Update existing profile
    const { error } = await supabase
      .from('user_profiles')
      .update({ username: trimmed })
      .eq('user_id', user.id);

    if (error) {
      return { error: `Failed to update username: ${error.message}` };
    }
  } else {
    // Create new profile
    const { error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        username: trimmed,
      });

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return { error: 'Username is already taken. Please choose another.' };
      }
      return { error: `Failed to create profile: ${error.message}` };
    }
  }

  revalidatePath('/account');
  revalidatePath('/contests');

  return {};
}

/**
 * Checks if current user has set their username
 * Used to enforce username requirement on first login
 */
export async function hasUsername(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile !== null;
}
