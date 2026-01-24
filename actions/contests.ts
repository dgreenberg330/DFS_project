// ============================================================================
// Contest Server Actions
// ============================================================================

'use server';

import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { Contest, ContestStatus, CreateContestInput } from '@/types';
import { checkAdminAccess } from '@/lib/admin';
import { revalidatePath } from 'next/cache';

/**
 * Creates a new contest
 *
 * @param input Contest details (name, lock_time in UTC, weekend dates)
 * @returns Created contest
 *
 * Usage:
 * const contest = await createContest({
 *   name: "Weekend of Jan 10-12, 2025",
 *   lock_time: "2025-01-10T01:00:00Z", // Thursday 8PM ET = Friday 1AM UTC
 *   weekend_start: "2025-01-10",
 *   weekend_end: "2025-01-12"
 * });
 */
export async function createContest(input: CreateContestInput): Promise<Contest> {
  // Admin access required
  await checkAdminAccess();

  // Defensive check: validate input
  if (!input || !input.name || !input.lock_time || !input.weekend_start || !input.weekend_end) {
    throw new Error('Invalid contest input. All fields are required.');
  }

  const supabase = await createClient();

  // Create contest with 'upcoming' status (default)
  const { data: contest, error } = await supabase
    .from('contests')
    .insert({
      name: input.name,
      lock_time: input.lock_time,
      weekend_start: input.weekend_start,
      weekend_end: input.weekend_end,
      status: ContestStatus.UPCOMING,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create contest: ${error.message}`);
  }

  // Defensive check: ensure contest was created
  if (!contest) {
    throw new Error('Contest creation failed. Please try again.');
  }

  revalidatePath('/contests');
  return contest;
}

/**
 * Gets a contest by ID with movies populated
 */
export async function getContest(contestId: string) {
  // Defensive check: validate contestId
  if (!contestId || contestId.trim() === '') {
    throw new Error('Contest ID is required.');
  }

  const supabase = await createClient();

  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .select('*')
    .eq('id', contestId)
    .single();

  if (contestError) {
    if (contestError.code === 'PGRST116') {
      throw new Error('Contest not found. It may have been deleted.');
    }
    throw new Error(`Failed to load contest: ${contestError.message}`);
  }

  // Defensive check: ensure contest exists
  if (!contest) {
    throw new Error('Contest not found.');
  }

  const { data: movies, error: moviesError } = await supabase
    .from('movies')
    .select('*')
    .eq('contest_id', contestId)
    .order('salary', { ascending: false });

  if (moviesError) {
    throw new Error(`Failed to load movies for this contest: ${moviesError.message}`);
  }

  return { ...contest, movies: movies || [] };
}

/**
 * Gets the current active contest (most recent upcoming or locked contest)
 * Includes movies sorted by salary descending
 */
export async function getCurrentContest() {
  const supabase = await createClient();

  const { data: contest, error } = await supabase
    .from('contests')
    .select('*')
    .in('status', [ContestStatus.UPCOMING, ContestStatus.LOCKED])
    .eq('published', true)
    .order('lock_time', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // No active contest is not an error, return null
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch current contest: ${error.message}`);
  }

  // Fetch movies for the contest
  const { data: movies, error: moviesError } = await supabase
    .from('movies')
    .select('*')
    .eq('contest_id', contest.id)
    .order('salary', { ascending: false });

  if (moviesError) {
    throw new Error(`Failed to load movies: ${moviesError.message}`);
  }

  return { ...contest, movies: movies || [] };
}

/**
 * Locks contests whose lock_time has passed
 * Transitions contest: upcoming -> locked
 * Transitions all lineups: editable -> locked
 *
 * Should be called manually or via scheduled task before contest starts.
 * No cron in MVP, so admin runs this Thursday evening.
 *
 * Usage:
 * await lockExpiredContests(); // Call Thursday ~8PM ET
 */
export async function lockExpiredContests(): Promise<string[]> {
  // Admin access required
  await checkAdminAccess();

  // Use admin client throughout to bypass RLS (entries table restricts to own entries)
  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  // Find all upcoming contests whose lock_time has passed
  const { data: expiredContests, error: fetchError } = await adminClient
    .from('contests')
    .select('id')
    .eq('status', ContestStatus.UPCOMING)
    .lt('lock_time', now);

  if (fetchError) {
    throw new Error(`Unable to check for expired contests: ${fetchError.message}`);
  }

  if (!expiredContests || expiredContests.length === 0) {
    return []; // No contests to lock
  }

  const contestIds = expiredContests.map(c => c.id).filter(Boolean);

  // Defensive check: ensure we have valid contest IDs
  if (contestIds.length === 0) {
    return [];
  }

  // Update contests to locked status
  const { error: contestError } = await adminClient
    .from('contests')
    .update({ status: ContestStatus.LOCKED })
    .in('id', contestIds);

  if (contestError) {
    throw new Error(`Failed to lock contests. Please try again: ${contestError.message}`);
  }

  // Get all lineups for these contests via entries (admin client bypasses RLS)
  const { data: entries, error: entriesError } = await adminClient
    .from('entries')
    .select('lineup_id')
    .in('contest_id', contestIds);

  if (entriesError) {
    throw new Error(`Failed to lock lineups for contests: ${entriesError.message}`);
  }

  if (entries && entries.length > 0) {
    const lineupIds = entries.map(e => e.lineup_id).filter(Boolean);

    // Defensive check: only proceed if we have lineup IDs
    if (lineupIds.length > 0) {
      // Update all lineups to locked status
      const { error: lineupError } = await adminClient
        .from('lineups')
        .update({ status: 'locked' })
        .in('id', lineupIds)
        .eq('status', 'editable'); // Only lock editable lineups

      if (lineupError) {
        throw new Error(`Failed to lock user lineups: ${lineupError.message}`);
      }
    }
  }

  revalidatePath('/contests');
  return contestIds;
}

/**
 * Manually locks a specific contest (admin override)
 * Idempotent - can be run multiple times safely
 */
export async function lockContest(contestId: string): Promise<void> {
  // Admin access required
  await checkAdminAccess();

  // Defensive check: validate contestId
  if (!contestId || contestId.trim() === '') {
    throw new Error('Contest ID is required.');
  }

  // Use admin client for all operations to bypass RLS
  const adminClient = createAdminClient();

  // Update contest status (idempotent - works even if already locked)
  const { error: contestError } = await adminClient
    .from('contests')
    .update({ status: ContestStatus.LOCKED })
    .eq('id', contestId)
    .in('status', [ContestStatus.UPCOMING, ContestStatus.LOCKED]);

  if (contestError) {
    throw new Error(`Failed to lock contest: ${contestError.message}`);
  }

  // Lock all associated lineups
  const { data: entries, error: entriesError } = await adminClient
    .from('entries')
    .select('lineup_id')
    .eq('contest_id', contestId);

  if (entriesError) {
    throw new Error(`Failed to lock user lineups: ${entriesError.message}`);
  }

  if (entries && entries.length > 0) {
    const lineupIds = entries.map(e => e.lineup_id).filter(Boolean);

    // Defensive check: only proceed if we have lineup IDs
    if (lineupIds.length > 0) {
      const { error: lineupError } = await adminClient
        .from('lineups')
        .update({ status: 'locked' })
        .in('id', lineupIds)
        .eq('status', 'editable');

      if (lineupError) {
        throw new Error(`Failed to lock user lineups: ${lineupError.message}`);
      }
    }
  }

  revalidatePath('/contests');
  revalidatePath(`/contests/${contestId}`);
}

/**
 * Publishes a contest, making it visible to users on the home page
 * Requires at least 6 movies before publishing
 */
export async function publishContest(contestId: string): Promise<void> {
  // Admin access required
  await checkAdminAccess();

  // Defensive check: validate contestId
  if (!contestId || contestId.trim() === '') {
    throw new Error('Contest ID is required.');
  }

  const supabase = await createClient();

  // Check that contest exists and is not already published
  const { data: contest, error: contestFetchError } = await supabase
    .from('contests')
    .select('id, published, status')
    .eq('id', contestId)
    .single();

  if (contestFetchError) {
    if (contestFetchError.code === 'PGRST116') {
      throw new Error('Contest not found.');
    }
    throw new Error(`Failed to fetch contest: ${contestFetchError.message}`);
  }

  if (contest.published) {
    throw new Error('Contest is already published.');
  }

  // Count movies for this contest
  const { count, error: countError } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('contest_id', contestId);

  if (countError) {
    throw new Error(`Failed to count movies: ${countError.message}`);
  }

  const movieCount = count || 0;
  if (movieCount < 6) {
    throw new Error(`Cannot publish contest with fewer than 6 movies. Currently has ${movieCount} movie(s).`);
  }

  // Publish the contest
  const { error: updateError } = await supabase
    .from('contests')
    .update({ published: true })
    .eq('id', contestId);

  if (updateError) {
    throw new Error(`Failed to publish contest: ${updateError.message}`);
  }

  revalidatePath('/');
  revalidatePath('/contests');
  revalidatePath(`/contests/${contestId}`);
  revalidatePath('/admin');
  revalidatePath(`/admin/contests/${contestId}/movies`);
}

/**
 * Unpublishes a contest, hiding it from users
 * Only allowed if contest is still 'upcoming' (not locked or resolved)
 */
export async function unpublishContest(contestId: string): Promise<void> {
  // Admin access required
  await checkAdminAccess();

  // Defensive check: validate contestId
  if (!contestId || contestId.trim() === '') {
    throw new Error('Contest ID is required.');
  }

  const supabase = await createClient();

  // Check that contest exists and is upcoming
  const { data: contest, error: contestFetchError } = await supabase
    .from('contests')
    .select('id, published, status')
    .eq('id', contestId)
    .single();

  if (contestFetchError) {
    if (contestFetchError.code === 'PGRST116') {
      throw new Error('Contest not found.');
    }
    throw new Error(`Failed to fetch contest: ${contestFetchError.message}`);
  }

  if (!contest.published) {
    throw new Error('Contest is not published.');
  }

  if (contest.status !== 'upcoming') {
    throw new Error('Cannot unpublish a contest that is locked or resolved.');
  }

  // Unpublish the contest
  const { error: updateError } = await supabase
    .from('contests')
    .update({ published: false })
    .eq('id', contestId);

  if (updateError) {
    throw new Error(`Failed to unpublish contest: ${updateError.message}`);
  }

  revalidatePath('/');
  revalidatePath('/contests');
  revalidatePath(`/contests/${contestId}`);
  revalidatePath('/admin');
  revalidatePath(`/admin/contests/${contestId}/movies`);
}