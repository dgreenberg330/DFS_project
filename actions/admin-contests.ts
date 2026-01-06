// ============================================================================
// Admin Contest Server Actions
// ============================================================================

'use server';

import { createClient } from '@/lib/supabase-server';
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

  const supabase = await createClient();

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

  const supabase = await createClient();

  const { count, error } = await supabase
    .from('entries')
    .select('*', { count: 'exact', head: true })
    .eq('contest_id', contestId);

  if (error) {
    throw new Error(`Failed to count entries: ${error.message}`);
  }

  return count || 0;
}
