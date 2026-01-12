// ============================================================================
// Admin Contest Server Actions
// ============================================================================

'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { checkAdminAccess } from '@/lib/admin';
import { Contest } from '@/types';

/**
 * Gets all contests (for admin dashboard)
 * Returns contests sorted by lock_time descending (most recent first)
 *
 * Usage:
 * const contests = await getAllContests();
 */
export async function getAllContests(): Promise<Contest[]> {
  await checkAdminAccess();

  const supabase = createAdminClient();

  const { data: contests, error } = await supabase
    .from('contests')
    .select('*')
    .order('lock_time', { ascending: false });

  if (error) {
    throw new Error(`Failed to load contests: ${error.message}`);
  }

  return contests || [];
}

/**
 * Gets contest entry count
 * Used on scoring page to show how many entries will be scored
 *
 * Usage:
 * const entryCount = await getContestEntryCount(contestId);
 */
export async function getContestEntryCount(contestId: string): Promise<number> {
  await checkAdminAccess();

  if (!contestId) {
    throw new Error('Contest ID required.');
  }

  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from('entries')
    .select('*', { count: 'exact', head: true })
    .eq('contest_id', contestId);

  if (error) {
    throw new Error(`Failed to count entries: ${error.message}`);
  }

  return count || 0;
}

/**
 * Deletes a contest (admin only)
 * Checks if contest has entries and prevents deletion if so
 *
 * Usage:
 * await deleteContest(contestId);
 */
export async function deleteContest(contestId: string): Promise<void> {
  await checkAdminAccess();

  if (!contestId) {
    throw new Error('Contest ID required.');
  }

  const supabase = createAdminClient();

  // Check if contest has entries
  const { count, error: countError } = await supabase
    .from('entries')
    .select('*', { count: 'exact', head: true })
    .eq('contest_id', contestId);

  if (countError) {
    throw new Error(`Failed to check entries: ${countError.message}`);
  }

  if (count && count > 0) {
    throw new Error(`Cannot delete contest: ${count} user entries exist. Delete entries first.`);
  }

  // Delete contest (movies will cascade delete due to foreign key)
  const { error: deleteError } = await supabase
    .from('contests')
    .delete()
    .eq('id', contestId);

  if (deleteError) {
    throw new Error(`Failed to delete contest: ${deleteError.message}`);
  }
}
