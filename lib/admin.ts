// ============================================================================
// Admin Authorization Helpers
// ============================================================================

'use server';

import { createClient, getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

/**
 * Checks if the current authenticated user is an admin
 * Returns true if admin, false otherwise
 *
 * Usage:
 * const adminStatus = await isAdmin();
 * if (adminStatus) { ... }
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getUser();
  if (!user) {
    return false;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Requires admin access - redirects to home page if not admin
 * Use this in admin page components to protect routes
 *
 * Usage (in server component):
 * export default async function AdminPage() {
 *   await requireAdmin();
 *   // ... rest of page
 * }
 */
export async function requireAdmin(): Promise<void> {
  const user = await getUser();

  // First check authentication
  if (!user) {
    redirect('/login');
  }

  // Then check admin status
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    redirect('/?error=unauthorized');
  }
}

/**
 * Checks admin access for server actions
 * Throws error if not admin (better for API endpoints)
 *
 * Usage (in server action):
 * export async function adminAction() {
 *   await checkAdminAccess();
 *   // ... admin operation
 * }
 */
export async function checkAdminAccess(): Promise<void> {
  const user = await getUser();

  if (!user) {
    throw new Error('Authentication required. Please log in.');
  }

  const adminStatus = await isAdmin();
  if (!adminStatus) {
    throw new Error('Unauthorized. Admin access required.');
  }
}
