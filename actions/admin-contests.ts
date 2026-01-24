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
 * Deletes a contest and all associated data (admin only)
 * Cascades: entries, lineups, lineup_movies, movies
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

  // Get all lineup IDs associated with this contest's entries
  // (lineups don't have a direct FK to contests, so we need to delete them manually)
  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select('lineup_id')
    .eq('contest_id', contestId);

  if (entriesError) {
    throw new Error(`Failed to fetch entries: ${entriesError.message}`);
  }

  // Delete lineups first (this will cascade to lineup_movies)
  if (entries && entries.length > 0) {
    const lineupIds = entries.map(e => e.lineup_id);
    const { error: lineupsError } = await supabase
      .from('lineups')
      .delete()
      .in('id', lineupIds);

    if (lineupsError) {
      throw new Error(`Failed to delete lineups: ${lineupsError.message}`);
    }
  }

  // Delete contest (entries and movies will cascade delete due to foreign keys)
  const { error: deleteError } = await supabase
    .from('contests')
    .delete()
    .eq('id', contestId);

  if (deleteError) {
    throw new Error(`Failed to delete contest: ${deleteError.message}`);
  }
}
