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
  if (input.salary !== undefined && (input.salary < 5 || input.salary > 100)) {
    throw new Error('Movie salary must be between $5 and $100.');
  }

  // Build update object with only provided fields
  const updateData: Partial<Movie> = {};
  if (input.title) updateData.title = input.title;
  if (input.release_date) updateData.release_date = input.release_date;
  if (input.distributor !== undefined) updateData.distributor = input.distributor;
  if (input.theater_count !== undefined) updateData.theater_count = input.theater_count;
  if (input.salary !== undefined) updateData.salary = input.salary;
  if (input.projected_gross !== undefined) updateData.projected_gross = input.projected_gross;

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
