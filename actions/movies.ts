// ============================================================================
// Movie Server Actions
// ============================================================================

'use server';

import { createClient } from '@/lib/supabase-server';
import { CreateMovieInput, Movie } from '@/types';
import { checkAdminAccess } from '@/lib/admin';
import { revalidatePath } from 'next/cache';

/**
 * Creates a new movie for a contest
 * Admin action, typically done Monday-Tuesday when setting up weekly slate
 *
 * @param input Movie details including salary and projected gross
 * @returns Created movie
 *
 * Usage:
 * const movie = await createMovie({
 *   contest_id: "contest-uuid",
 *   title: "Movie Title",
 *   release_date: "2025-01-10",
 *   distributor: "Studio Name",
 *   theater_count: 3500,
 *   salary: 45, // $45
 *   projected_gross: 25.5 // $25.5M
 * });
 */
export async function createMovie(input: CreateMovieInput): Promise<Movie> {
  // Admin access required
  await checkAdminAccess();

  // Defensive check: validate input
  if (!input || !input.contest_id || !input.title || !input.release_date) {
    throw new Error('Invalid movie data. Contest, title, and release date are required.');
  }

  // Defensive check: validate salary exists
  if (input.salary === undefined || input.salary === null) {
    throw new Error('Movie salary is required.');
  }

  const supabase = await createClient();

  // Validate salary is within acceptable range (per schema: 5-100)
  if (input.salary < 5 || input.salary > 100) {
    throw new Error('Movie salary must be between $5 and $100.');
  }

  const { data: movie, error } = await supabase
    .from('movies')
    .insert({
      contest_id: input.contest_id,
      title: input.title,
      release_date: input.release_date,
      distributor: input.distributor || null,
      theater_count: input.theater_count || null,
      salary: input.salary,
      projected_gross: input.projected_gross,
      actual_gross: null, // Will be filled Sunday night
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create movie: ${error.message}`);
  }

  // Defensive check: ensure movie was created
  if (!movie) {
    throw new Error('Movie creation failed. Please try again.');
  }

  revalidatePath('/contests');
  revalidatePath(`/contests/${input.contest_id}`);
  return movie;
}

/**
 * Batch create movies for a contest
 * More efficient than creating one at a time when setting up full slate
 *
 * Usage:
 * await batchCreateMovies([
 *   { contest_id, title: "Movie 1", release_date, salary: 48, projected_gross: 30.0 },
 *   { contest_id, title: "Movie 2", release_date, salary: 35, projected_gross: 20.5 },
 *   // ... more movies
 * ]);
 */
export async function batchCreateMovies(movies: CreateMovieInput[]): Promise<Movie[]> {
  // Admin access required
  await checkAdminAccess();

  // Defensive check: validate input
  if (!movies || !Array.isArray(movies) || movies.length === 0) {
    throw new Error('Invalid movie list. At least one movie is required.');
  }

  const supabase = await createClient();

  // Validate all movies have required fields
  const invalidMovies = movies.filter(m => !m.contest_id || !m.title || !m.release_date || m.salary === undefined);
  if (invalidMovies.length > 0) {
    throw new Error('All movies must have contest, title, release date, and salary.');
  }

  // Validate all salaries
  const invalidSalaries = movies.filter(m => m.salary < 5 || m.salary > 100);
  if (invalidSalaries.length > 0) {
    throw new Error('All movie salaries must be between $5 and $100.');
  }

  // Insert all movies at once
  const { data, error } = await supabase
    .from('movies')
    .insert(
      movies.map(input => ({
        contest_id: input.contest_id,
        title: input.title,
        release_date: input.release_date,
        distributor: input.distributor || null,
        theater_count: input.theater_count || null,
        salary: input.salary,
        projected_gross: input.projected_gross,
        actual_gross: null,
      }))
    )
    .select();

  if (error) {
    throw new Error(`Failed to create movies: ${error.message}`);
  }

  if (movies.length > 0) {
    revalidatePath('/contests');
    revalidatePath(`/contests/${movies[0].contest_id}`);
  }

  return data;
}

/**
 * Gets all movies for a contest
 */
export async function getContestMovies(contestId: string): Promise<Movie[]> {
  // Defensive check: validate contestId
  if (!contestId || contestId.trim() === '') {
    throw new Error('Contest ID is required.');
  }

  const supabase = await createClient();

  const { data: movies, error } = await supabase
    .from('movies')
    .select('*')
    .eq('contest_id', contestId)
    .order('salary', { ascending: false }); // Show highest salary first

  if (error) {
    throw new Error(`Unable to load movies for this contest: ${error.message}`);
  }

  return movies || [];
}