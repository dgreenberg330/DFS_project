// ============================================================================
// Lineup Server Actions
// ============================================================================

'use server';

import { createClient, getUser } from '@/lib/supabase-server';
import { validateLineup, validateMoviesInContest } from '@/lib/validation';
import { ContestStatus, LineupStatus, SubmitLineupInput } from '@/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Submits or updates a user's lineup for a contest
 *
 * Validation:
 * - User must be authenticated
 * - Contest must be in 'upcoming' status (not locked)
 * - Must select 2-4 movies
 * - All movies must belong to the contest
 * - Total salary must not exceed $100
 * - One entry per user per contest (enforced by unique constraint)
 *
 * Behavior:
 * - If user has no entry for this contest: creates new lineup + entry
 * - If user has existing entry: updates lineup if still editable
 *
 * @param input Contest ID and array of movie IDs
 * @returns Created/updated entry with lineup
 *
 * Usage:
 * const entry = await submitLineup({
 *   contest_id: "contest-uuid",
 *   movie_ids: ["movie1-uuid", "movie2-uuid", "movie3-uuid"]
 * });
 */
export async function submitLineup(input: SubmitLineupInput) {
  // Defensive check: validate input
  if (!input || !input.contest_id || !input.movie_ids) {
    throw new Error('Invalid lineup submission. Contest and movies are required.');
  }

  // Verify user is authenticated
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  // Validate contest exists and is still accepting entries
  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .select('*')
    .eq('id', input.contest_id)
    .single();

  if (contestError) {
    if (contestError.code === 'PGRST116') {
      throw new Error('Contest not found. It may have been deleted.');
    }
    throw new Error('Unable to load contest. Please try again.');
  }

  // Defensive check: ensure contest exists
  if (!contest) {
    throw new Error('Contest not found.');
  }

  if (contest.status !== ContestStatus.UPCOMING) {
    throw new Error('This contest is locked. Lineups can no longer be submitted or edited.');
  }

  // Defensive check: ensure movie_ids is an array
  if (!Array.isArray(input.movie_ids)) {
    throw new Error('Invalid movie selection format.');
  }

  // Validate movie count (2-4 movies)
  if (input.movie_ids.length < 2 || input.movie_ids.length > 4) {
    throw new Error('You must select between 2 and 4 movies for your lineup.');
  }

  // Fetch selected movies
  const { data: movies, error: moviesError } = await supabase
    .from('movies')
    .select('*')
    .in('id', input.movie_ids);

  if (moviesError) {
    throw new Error('Unable to load selected movies. Please try again.');
  }

  // Defensive check: ensure all movies were found
  if (!movies || movies.length === 0) {
    throw new Error('Selected movies not found. Please refresh and try again.');
  }

  if (movies.length !== input.movie_ids.length) {
    throw new Error('One or more selected movies are invalid. Please refresh and try again.');
  }

  // Validate all movies belong to this contest
  validateMoviesInContest(movies, input.contest_id);

  // Validate lineup constraints (salary cap, movie count)
  const validation = validateLineup(movies);
  if (!validation.isValid) {
    throw new Error(`Invalid lineup: ${validation.errors.join(', ')}`);
  }

  // Check if user already has an entry for this contest
  const { data: existingEntry, error: entryFetchError } = await supabase
    .from('entries')
    .select('id, lineup_id, lineup:lineups(*)')
    .eq('user_id', user.id)
    .eq('contest_id', input.contest_id)
    .single();

  // If user has existing entry, update it
  if (existingEntry && !entryFetchError) {
    const lineup = Array.isArray(existingEntry.lineup)
      ? existingEntry.lineup[0]
      : existingEntry.lineup;

    // Defensive check: ensure lineup exists
    if (!lineup) {
      throw new Error('Your existing lineup could not be found. Please contact support.');
    }

    // Check if lineup is still editable
    if (lineup.status !== LineupStatus.EDITABLE) {
      throw new Error('Your lineup can no longer be edited. The contest is locked.');
    }

    // Delete old lineup_movies
    await supabase
      .from('lineup_movies')
      .delete()
      .eq('lineup_id', existingEntry.lineup_id);

    // Insert new lineup_movies
    const lineupMovies = input.movie_ids.map(movie_id => ({
      lineup_id: existingEntry.lineup_id,
      movie_id,
    }));

    const { error: insertError } = await supabase
      .from('lineup_movies')
      .insert(lineupMovies);

    if (insertError) {
      throw new Error(`Failed to update lineup: ${insertError.message}`);
    }

    revalidatePath('/contests');
    revalidatePath(`/contests/${input.contest_id}`);
    revalidatePath('/account');

    // Redirect to account page after successful update
    redirect('/account');
  }

  // No existing entry - create new lineup + entry
  const { data: newLineup, error: lineupError } = await supabase
    .from('lineups')
    .insert({
      status: LineupStatus.EDITABLE,
      total_score: null, // Will be calculated during scoring
    })
    .select()
    .single();

  if (lineupError || !newLineup) {
    throw new Error(`Failed to create lineup: ${lineupError?.message}`);
  }

  // Create entry linking user, contest, and lineup
  const { data: newEntry, error: entryError } = await supabase
    .from('entries')
    .insert({
      user_id: user.id,
      contest_id: input.contest_id,
      lineup_id: newLineup.id,
    })
    .select()
    .single();

  if (entryError) {
    // Cleanup: delete the lineup we just created
    await supabase.from('lineups').delete().eq('id', newLineup.id);

    // Check if error is due to unique constraint (user already has entry)
    if (entryError.code === '23505') {
      throw new Error('You already have an entry for this contest');
    }
    throw new Error(`Failed to create entry: ${entryError.message}`);
  }

  // Create lineup_movies records
  const lineupMovies = input.movie_ids.map(movie_id => ({
    lineup_id: newLineup.id,
    movie_id,
  }));

  const { error: lineupMoviesError } = await supabase
    .from('lineup_movies')
    .insert(lineupMovies);

  if (lineupMoviesError) {
    // Cleanup: delete entry and lineup
    await supabase.from('entries').delete().eq('id', newEntry.id);
    await supabase.from('lineups').delete().eq('id', newLineup.id);
    throw new Error(`Failed to save lineup movies: ${lineupMoviesError.message}`);
  }

  revalidatePath('/contests');
  revalidatePath(`/contests/${input.contest_id}`);
  revalidatePath('/account');

  // Redirect to account page after successful submission
  redirect('/account');
}

/**
 * Gets user's entry for a specific contest with lineup and movies
 */
export async function getUserEntry(contestId: string) {
  // Defensive check: validate contestId
  if (!contestId || contestId.trim() === '') {
    throw new Error('Contest ID is required.');
  }

  const user = await getUser();
  if (!user) {
    return null;
  }

  const supabase = await createClient();

  const { data: entry, error } = await supabase
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
    .eq('user_id', user.id)
    .eq('contest_id', contestId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No entry found
    }
    throw new Error(`Failed to fetch entry: ${error.message}`);
  }

  return entry;
}

/**
 * Calculates projected score for a lineup (before actuals are in)
 * Used to show users their projected total while building lineup
 */
export async function calculateProjectedScore(movieIds: string[]): Promise<number> {
  // Defensive check: validate input
  if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
    return 0;
  }

  const supabase = await createClient();

  const { data: movies, error } = await supabase
    .from('movies')
    .select('projected_gross')
    .in('id', movieIds);

  if (error || !movies) {
    throw new Error('Unable to calculate projected score. Please try again.');
  }

  // Defensive check: ensure we have movies
  if (movies.length === 0) {
    return 0;
  }

  // Sum projected_gross: $1M = 1 point
  return movies.reduce((sum, movie) => {
    // Defensive check: handle null/undefined projected_gross
    return sum + (movie.projected_gross || 0);
  }, 0);
}