// ============================================================================
// Account Server Actions
// ============================================================================

'use server';

import { getUser, createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { redirect } from 'next/navigation';

/**
 * Gets the count of entries for the current user
 * Used for analytics (contest_sequence dimension)
 */
export async function getUserEntryCount(): Promise<number> {
  const user = await getUser();

  if (!user) {
    return 0;
  }

  const supabase = await createClient();

  const { count, error } = await supabase
    .from('entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to fetch entry count:', error.message);
    return 0;
  }

  return count || 0;
}

/**
 * Gets the user's cohort - which contest week they first joined
 * Returns the sequential contest number (1, 2, 3, etc.)
 * Used for analytics (user_cohort dimension)
 */
export async function getUserCohort(): Promise<number> {
  const user = await getUser();

  if (!user) {
    return 0;
  }

  const supabase = await createClient();

  // Get user's first entry (earliest by created_at)
  const { data: firstEntry, error: entryError } = await supabase
    .from('entries')
    .select('contest_id, contests(weekend_start)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (entryError || !firstEntry) {
    return 0;
  }

  // Get the contest's weekend_start
  const contest = Array.isArray(firstEntry.contests)
    ? firstEntry.contests[0]
    : firstEntry.contests;

  if (!contest?.weekend_start) {
    return 0;
  }

  // Count how many contests have weekend_start <= this contest's weekend_start
  // This gives us the sequential contest number (cohort)
  const { count, error: countError } = await supabase
    .from('contests')
    .select('*', { count: 'exact', head: true })
    .lte('weekend_start', contest.weekend_start);

  if (countError) {
    console.error('Failed to calculate user cohort:', countError.message);
    return 0;
  }

  return count || 0;
}

/**
 * Gets all past contest entries for current user
 * Includes contest info, lineup, movies, and rank
 * Ordered by most recent first
 */
export async function getPastEntries() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  // Fetch all entries with related data
  const { data: entries, error } = await supabase
    .from('entries')
    .select(`
      *,
      contest:contests (
        id,
        name,
        status,
        weekend_start,
        weekend_end
      ),
      lineup:lineups (
        id,
        status,
        total_score,
        movies:lineup_movies (
          movie:movies (
            id,
            title,
            salary,
            projected_gross,
            actual_gross
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch past entries: ${error.message}`);
  }

  // For scored contests, calculate rank by comparing with other entries
  const entriesWithRanks = await Promise.all(
    (entries || []).map(async (entry) => {
      // Defensive check: ensure entry has lineup and contest
      if (!entry.lineup || !entry.contest) {
        return { ...entry, rank: null };
      }

      const lineup = Array.isArray(entry.lineup) ? entry.lineup[0] : entry.lineup;
      const contest = Array.isArray(entry.contest) ? entry.contest[0] : entry.contest;

      // Defensive check: ensure lineup and contest exist after extraction
      if (!lineup || !contest) {
        return { ...entry, rank: null };
      }

      // Only calculate rank for scored/resolved contests
      if (lineup.status === 'scored' && contest.status === 'resolved') {
        // Get all entries for this contest (use admin client to bypass RLS and see all entries)
        const adminClient = createAdminClient();
        const { data: allEntries } = await adminClient
          .from('entries')
          .select('lineup:lineups(total_score)')
          .eq('contest_id', contest.id);

        if (allEntries && allEntries.length > 0) {
          // Sort by total_score descending
          const scores = allEntries
            .map((e) => {
              const l = Array.isArray(e.lineup) ? e.lineup[0] : e.lineup;
              return l?.total_score;
            })
            .filter((score) => score !== null && score !== undefined)
            .sort((a, b) => b - a);

          // Defensive check: ensure we have scores
          if (scores.length === 0) {
            return { ...entry, rank: null, totalEntries: null };
          }

          // Find rank (1-indexed)
          const rank = scores.findIndex((score) => score === lineup.total_score) + 1;

          return {
            ...entry,
            rank: rank > 0 ? rank : null,
            totalEntries: allEntries.length
          };
        }
      }

      return { ...entry, rank: null, totalEntries: null };
    })
  );

  return entriesWithRanks;
}