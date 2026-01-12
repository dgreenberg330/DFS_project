// ============================================================================
// Scoring Server Actions
// ============================================================================

'use server';

import { createClient } from '@/lib/supabase-server';
import { ContestStatus, LineupStatus, ScoredLineup } from '@/types';
import { checkAdminAccess } from '@/lib/admin';
import { revalidatePath } from 'next/cache';

/**
 * Scores a contest and generates leaderboard
 *
 * Process:
 * 1. Validate contest is in 'locked' status (not upcoming or already resolved)
 * 2. For each entry in the contest:
 *    - Sum actual_gross of all movies in the lineup
 *    - Update lineup.total_score
 *    - Update lineup.status to 'scored'
 * 3. Update contest.status to 'resolved'
 * 4. Return sorted leaderboard (descending by total_score)
 *
 * Should be called manually Sunday night after entering actual grosses.
 * No background jobs in MVP, so admin runs this after updating actuals.
 *
 * @param contestId Contest to score
 * @returns Sorted array of scored lineups (leaderboard)
 *
 * Usage:
 * // 1. Update movie actuals (Sunday night)
 * await updateMovieActuals(movieId, actualGross);
 *
 * // 2. Run scoring
 * const leaderboard = await scoreContest(contestId);
 *
 * // 3. Send winner emails (separate function)
 * await sendWinnerEmails(leaderboard);
 */
export async function scoreContest(contestId: string): Promise<ScoredLineup[]> {
  // Admin access required
  await checkAdminAccess();

  // Defensive check: validate contestId
  if (!contestId || contestId.trim() === '') {
    throw new Error('Contest ID is required.');
  }

  const supabase = await createClient();

  // Validate contest exists and is locked
  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .select('*')
    .eq('id', contestId)
    .single();

  if (contestError) {
    if (contestError.code === 'PGRST116') {
      throw new Error('Contest not found. It may have been deleted.');
    }
    throw new Error(`Unable to load contest: ${contestError.message}`);
  }

  // Defensive check: ensure contest exists
  if (!contest) {
    throw new Error('Contest not found.');
  }

  if (contest.status !== ContestStatus.LOCKED) {
    throw new Error(`Cannot score contest. Contest must be locked first, current status: ${contest.status}.`);
  }

  // Fetch all entries for this contest with their lineups and movies
  // Note: lineup_movies must be nested inside lineups (not entries) because
  // the foreign key relationship is: entries -> lineups -> lineup_movies -> movies
  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select(`
      id,
      user_id,
      lineup_id,
      lineup:lineups (
        id,
        status,
        movies:lineup_movies (
          movie:movies (
            id,
            actual_gross
          )
        )
      )
    `)
    .eq('contest_id', contestId);

  if (entriesError) {
    throw new Error(`Unable to load contest entries: ${entriesError.message}`);
  }

  // Defensive check: ensure entries exists
  if (!entries) {
    throw new Error('Unable to load contest entries. Please try again.');
  }

  if (entries.length === 0) {
    throw new Error('No entries to score. This contest has no participants.');
  }

  // Calculate score for each lineup
  const scoredLineups: ScoredLineup[] = [];

  for (const entry of entries) {
    // Defensive check: ensure entry has lineup
    if (!entry.lineup) {
      throw new Error(`Entry ${entry.id} is missing lineup data. Data integrity issue.`);
    }

    const lineup = Array.isArray(entry.lineup) ? entry.lineup[0] : entry.lineup;

    // Defensive check: ensure lineup exists after extraction
    if (!lineup || !lineup.id) {
      throw new Error(`Invalid lineup data for entry ${entry.id}. Data integrity issue.`);
    }

    // Movies are nested inside lineup (lineup_movies references lineups, not entries)
    const lineupMovies = lineup.movies || [];

    // Defensive check: ensure lineup has movies
    if (lineupMovies.length === 0) {
      throw new Error(`Lineup ${lineup.id} has no movies. Data integrity issue.`);
    }

    // Validate all movies have actual_gross
    const missingActuals = lineupMovies.filter(lm => {
      const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
      return !movie || movie.actual_gross === null || movie.actual_gross === undefined;
    });

    if (missingActuals.length > 0) {
      throw new Error(
        `Cannot score: ${missingActuals.length} movie(s) missing box office results. ` +
        'Please enter all actual grosses before scoring the contest.'
      );
    }

    // Sum actual_gross for all movies in lineup
    // Scoring: $1M box office = 1 point
    const totalScore = lineupMovies.reduce((sum, lm) => {
      const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
      return sum + (movie.actual_gross || 0);
    }, 0);

    // Update lineup with score and scored status
    const { error: updateError } = await supabase
      .from('lineups')
      .update({
        total_score: totalScore,
        status: LineupStatus.SCORED,
      })
      .eq('id', lineup.id);

    if (updateError) {
      throw new Error(`Failed to update lineup ${lineup.id}: ${updateError.message}`);
    }

    scoredLineups.push({
      lineup_id: lineup.id,
      entry_id: entry.id,
      user_id: entry.user_id,
      total_score: totalScore,
      rank: 0, // Will be assigned after sorting
    });
  }

  // Sort by total_score descending (highest score = rank 1)
  scoredLineups.sort((a, b) => b.total_score - a.total_score);

  // Assign ranks (handle ties: same score = same rank)
  let currentRank = 1;
  for (let i = 0; i < scoredLineups.length; i++) {
    if (i > 0 && scoredLineups[i].total_score < scoredLineups[i - 1].total_score) {
      currentRank = i + 1;
    }
    scoredLineups[i].rank = currentRank;
  }

  // Update contest status to resolved
  const { error: resolveError } = await supabase
    .from('contests')
    .update({ status: ContestStatus.RESOLVED })
    .eq('id', contestId);

  if (resolveError) {
    throw new Error(`Failed to resolve contest: ${resolveError.message}`);
  }

  revalidatePath('/contests');
  revalidatePath(`/contests/${contestId}`);
  revalidatePath(`/contests/${contestId}/leaderboard`);

  return scoredLineups;
}

/**
 * Gets leaderboard for a scored/resolved contest
 * Returns entries sorted by total_score with user info
 */
export async function getLeaderboard(contestId: string) {
  // Defensive check: validate contestId
  if (!contestId || contestId.trim() === '') {
    throw new Error('Contest ID is required.');
  }

  const supabase = await createClient();

  // Fetch contest to verify it's been scored
  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .select('status')
    .eq('id', contestId)
    .single();

  if (contestError) {
    if (contestError.code === 'PGRST116') {
      throw new Error('Contest not found. It may have been deleted.');
    }
    throw new Error(`Unable to load contest: ${contestError.message}`);
  }

  // Defensive check: ensure contest exists
  if (!contest) {
    throw new Error('Contest not found.');
  }

  if (contest.status !== ContestStatus.RESOLVED) {
    throw new Error('Leaderboard not available yet. Contest results have not been finalized.');
  }

  // Fetch all entries with lineups and movies
  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select(`
      *,
      lineup:lineups (
        *,
        movies:lineup_movies (
          movie:movies (*)
        )
      )
    `)
    .eq('contest_id', contestId)
    .order('lineup.total_score', { ascending: false });

  if (entriesError) {
    throw new Error(`Failed to fetch leaderboard: ${entriesError.message}`);
  }

  // Fetch usernames for each entry (no emails exposed for privacy)
  const entriesWithUsers = await Promise.all(
    (entries || []).map(async (entry) => {
      // Only fetch username from user_profiles - never expose emails publicly
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('user_id', entry.user_id)
        .maybeSingle();

      return {
        ...entry,
        user: {
          id: entry.user_id,
          username: profile?.username || 'Anonymous',
        },
      };
    })
  );

  // Assign ranks based on total_score
  let currentRank = 1;
  for (let i = 0; i < entriesWithUsers.length; i++) {
    const lineup = Array.isArray(entriesWithUsers[i].lineup)
      ? entriesWithUsers[i].lineup[0]
      : entriesWithUsers[i].lineup;

    if (i > 0) {
      const prevLineup = Array.isArray(entriesWithUsers[i - 1].lineup)
        ? entriesWithUsers[i - 1].lineup[0]
        : entriesWithUsers[i - 1].lineup;

      if (lineup.total_score < prevLineup.total_score) {
        currentRank = i + 1;
      }
    }

    entriesWithUsers[i].rank = currentRank;
  }

  return entriesWithUsers;
}

/**
 * Updates actual gross for a movie (admin action, Sunday night)
 *
 * @param movieId Movie to update
 * @param actualGross Final opening weekend gross in millions (e.g., 25.5 = $25.5M)
 */
export async function updateMovieActuals(movieId: string, actualGross: number) {
  // Admin access required
  await checkAdminAccess();

  // Defensive check: validate inputs
  if (!movieId || movieId.trim() === '') {
    throw new Error('Movie ID is required.');
  }

  if (actualGross === undefined || actualGross === null) {
    throw new Error('Actual gross amount is required.');
  }

  if (actualGross < 0) {
    throw new Error('Actual gross cannot be negative.');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('movies')
    .update({ actual_gross: actualGross })
    .eq('id', movieId);

  if (error) {
    throw new Error(`Unable to update box office results: ${error.message}`);
  }

  revalidatePath('/contests');
}

/**
 * Batch update actuals for multiple movies
 * Useful for updating entire contest slate at once Sunday night
 *
 * Usage:
 * await batchUpdateActuals([
 *   { movieId: "movie1-uuid", actualGross: 25.5 },
 *   { movieId: "movie2-uuid", actualGross: 18.2 },
 *   { movieId: "movie3-uuid", actualGross: 12.7 },
 * ]);
 */
export async function batchUpdateActuals(
  updates: { movieId: string; actualGross: number }[]
) {
  // Admin access required
  await checkAdminAccess();

  // Defensive check: validate input
  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    throw new Error('Invalid updates list. At least one update is required.');
  }

  // Validate all updates have required fields
  const invalidUpdates = updates.filter(u => !u.movieId || u.actualGross === undefined || u.actualGross === null);
  if (invalidUpdates.length > 0) {
    throw new Error('All updates must have movie ID and actual gross amount.');
  }

  // Validate no negative grosses
  const negativeGrosses = updates.filter(u => u.actualGross < 0);
  if (negativeGrosses.length > 0) {
    throw new Error('Actual gross amounts cannot be negative.');
  }

  const supabase = await createClient();

  // Update each movie
  // Note: Could optimize with SQL UPDATE ... FROM if performance becomes issue
  for (const update of updates) {
    const { error } = await supabase
      .from('movies')
      .update({ actual_gross: update.actualGross })
      .eq('id', update.movieId);

    if (error) {
      throw new Error(`Unable to update movie ${update.movieId}: ${error.message}`);
    }
  }

  revalidatePath('/contests');
}