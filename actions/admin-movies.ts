// ============================================================================
// Admin Movie Server Actions
// ============================================================================

'use server';

import { createClient } from '@/lib/supabase-server';
import { checkAdminAccess } from '@/lib/admin';
import { Movie, UpdateMovieInput } from '@/types';
import { revalidatePath } from 'next/cache';

/**
 * Updates an existing movie (admin only)
 * Used in the movies management page
 *
 * Usage:
 * await updateMovie(movieId, {
 *   salary: 50,
 *   projected_gross: 30.5
 * });
 */
export async function updateMovie(
  movieId: string,
  input: UpdateMovieInput
): Promise<Movie> {
  await checkAdminAccess();

  if (!movieId || !input) {
    throw new Error('Movie ID and update data required.');
  }

  const supabase = await createClient();

  // Validate salary if provided
  if (input.salary !== undefined && (input.salary < 1 || input.salary > 50000)) {
    throw new Error('Movie salary must be between $1 and $50,000.');
  }

  // Build update object with only provided fields
  const updateData: Partial<Movie> = {};
  if (input.title) updateData.title = input.title;
  if (input.release_date) updateData.release_date = input.release_date;
  if (input.distributor !== undefined) updateData.distributor = input.distributor;
  if (input.theater_count !== undefined) updateData.theater_count = input.theater_count;
  if (input.salary !== undefined) updateData.salary = input.salary;
  if (input.projected_gross !== undefined) updateData.projected_gross = input.projected_gross;
  if (input.prior_week_gross !== undefined) updateData.prior_week_gross = input.prior_week_gross;
  if (input.tmdb_id !== undefined) updateData.tmdb_id = input.tmdb_id;
  if (input.poster_path !== undefined) updateData.poster_path = input.poster_path;

  const { data: movie, error } = await supabase
    .from('movies')
    .update(updateData)
    .eq('id', movieId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update movie: ${error.message}`);
  }

  if (!movie) {
    throw new Error('Movie not found.');
  }

  revalidatePath('/admin');
  revalidatePath(`/admin/contests/${movie.contest_id}/movies`);
  revalidatePath(`/contests/${movie.contest_id}`);
  return movie;
}

/**
 * Deletes a movie (admin only)
 * Checks that no lineups have selected this movie first
 *
 * Usage:
 * await deleteMovie(movieId);
 */
export async function deleteMovie(movieId: string): Promise<void> {
  await checkAdminAccess();

  if (!movieId) {
    throw new Error('Movie ID required.');
  }

  const supabase = await createClient();

  // Check if movie is in any lineups
  const { data: lineupMovies, error: checkError } = await supabase
    .from('lineup_movies')
    .select('lineup_id')
    .eq('movie_id', movieId)
    .limit(1);

  if (checkError) {
    throw new Error(`Failed to check movie usage: ${checkError.message}`);
  }

  if (lineupMovies && lineupMovies.length > 0) {
    throw new Error('Cannot delete movie: already selected in user lineups.');
  }

  // Get contest_id before deleting (for revalidation)
  const { data: movie } = await supabase
    .from('movies')
    .select('contest_id')
    .eq('id', movieId)
    .single();

  const { error: deleteError } = await supabase
    .from('movies')
    .delete()
    .eq('id', movieId);

  if (deleteError) {
    throw new Error(`Failed to delete movie: ${deleteError.message}`);
  }

  revalidatePath('/admin');
  if (movie) {
    revalidatePath(`/admin/contests/${movie.contest_id}/movies`);
    revalidatePath(`/contests/${movie.contest_id}`);
  }
}

/**
 * Gets all historical movies from other contests (admin only)
 * Useful for selecting previously entered movies
 * Returns only the most recent instance of each movie (by title)
 *
 * Usage:
 * await getHistoricalMovies(currentContestId);
 */
export async function getHistoricalMovies(currentContestId: string): Promise<Movie[]> {
  await checkAdminAccess();

  if (!currentContestId) {
    throw new Error('Current contest ID required.');
  }

  const supabase = await createClient();

  const { data: movies, error } = await supabase
    .from('movies')
    .select('*')
    .neq('contest_id', currentContestId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load historical movies: ${error.message}`);
  }

  // Deduplicate by title, keeping only the most recent instance
  // (already sorted by created_at desc, so first occurrence is most recent)
  const seen = new Set<string>();
  const uniqueMovies = (movies || []).filter((movie) => {
    const titleLower = movie.title.toLowerCase();
    if (seen.has(titleLower)) {
      return false;
    }
    seen.add(titleLower);
    return true;
  });

  return uniqueMovies;
}

/**
 * Copies a historical movie to current contest (admin only)
 *
 * Usage:
 * await copyMovieToContest(movieId, targetContestId);
 */
export async function copyMovieToContest(
  sourceMovieId: string,
  targetContestId: string,
  overrides?: { release_date?: string; salary?: number; projected_gross?: number }
): Promise<Movie> {
  await checkAdminAccess();

  if (!sourceMovieId || !targetContestId) {
    throw new Error('Source movie ID and target contest ID required.');
  }

  const supabase = await createClient();

  // Get source movie
  const { data: sourceMovie, error: fetchError } = await supabase
    .from('movies')
    .select('*')
    .eq('id', sourceMovieId)
    .single();

  if (fetchError || !sourceMovie) {
    throw new Error('Source movie not found.');
  }

  // Create new movie with overrides
  const { data: newMovie, error: createError } = await supabase
    .from('movies')
    .insert({
      contest_id: targetContestId,
      title: sourceMovie.title,
      release_date: overrides?.release_date || sourceMovie.release_date,
      distributor: sourceMovie.distributor,
      theater_count: sourceMovie.theater_count,
      salary: overrides?.salary || sourceMovie.salary,
      projected_gross: overrides?.projected_gross || sourceMovie.projected_gross,
      prior_week_gross: sourceMovie.actual_gross ?? sourceMovie.prior_week_gross,
      tmdb_id: sourceMovie.tmdb_id,
      poster_path: sourceMovie.poster_path,
    })
    .select()
    .single();

  if (createError || !newMovie) {
    throw new Error(`Failed to copy movie: ${createError?.message || 'Unknown error'}`);
  }

  revalidatePath('/admin');
  revalidatePath(`/admin/contests/${targetContestId}/movies`);
  revalidatePath(`/contests/${targetContestId}`);
  return newMovie;
}
