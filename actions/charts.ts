// ============================================================================
// Charts Server Actions
// ============================================================================

'use server';

import { createClient } from '@/lib/supabase-server';
import { batchGetTMDBMovieInfo } from '@/lib/tmdb-api';
import type { ContestWithMovies, Movie, MovieWithTMDBDetails } from '@/types';

/**
 * Gets the most recent published contest (any status)
 * Used by charts page to show movies even after contest is resolved
 *
 * @returns Most recent published contest with movies, or null if none
 */
export async function getMostRecentContest(): Promise<ContestWithMovies | null> {
  const supabase = await createClient();

  // Get most recent published contest regardless of status
  const { data: contest, error } = await supabase
    .from('contests')
    .select('*')
    .eq('published', true)
    .order('lock_time', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // No contest found is not an error
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch contest: ${error.message}`);
  }

  if (!contest) {
    return null;
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
 * Gets movies for charts page with TMDB details attached
 * Fetches from most recent published contest
 *
 * @returns Array of movies with TMDB details, or empty array
 */
export async function getChartsMovies(): Promise<MovieWithTMDBDetails[]> {
  const contest = await getMostRecentContest();

  if (!contest || !contest.movies || contest.movies.length === 0) {
    return [];
  }

  // Get TMDB IDs for movies that have them
  const tmdbIds = contest.movies
    .filter((m) => m.tmdb_id)
    .map((m) => m.tmdb_id as number);

  // Batch fetch TMDB details
  const tmdbDetailsMap = await batchGetTMDBMovieInfo(tmdbIds);

  // Attach TMDB details to movies
  const moviesWithDetails: MovieWithTMDBDetails[] = contest.movies.map((movie) => ({
    ...movie,
    tmdb_details: movie.tmdb_id ? tmdbDetailsMap.get(movie.tmdb_id) || null : null,
  }));

  return moviesWithDetails;
}

/**
 * Gets this week's movies from the most recent published contest
 * Shared function for landing page and contest page movie sections
 *
 * @returns Array of movies (without TMDB details for lighter usage)
 */
export async function getThisWeeksMovies(): Promise<Movie[]> {
  const contest = await getMostRecentContest();

  if (!contest || !contest.movies) {
    return [];
  }

  return contest.movies;
}

/**
 * Gets the most recent contest data for display purposes
 * Returns contest info plus movies
 */
export async function getChartsContestData(): Promise<{
  contest: ContestWithMovies | null;
  movies: MovieWithTMDBDetails[];
}> {
  const contest = await getMostRecentContest();

  if (!contest || !contest.movies || contest.movies.length === 0) {
    return { contest: null, movies: [] };
  }

  // Get TMDB IDs for movies that have them
  const tmdbIds = contest.movies
    .filter((m) => m.tmdb_id)
    .map((m) => m.tmdb_id as number);

  // Batch fetch TMDB details
  const tmdbDetailsMap = await batchGetTMDBMovieInfo(tmdbIds);

  // Attach TMDB details to movies
  const moviesWithDetails: MovieWithTMDBDetails[] = contest.movies.map((movie) => ({
    ...movie,
    tmdb_details: movie.tmdb_id ? tmdbDetailsMap.get(movie.tmdb_id) || null : null,
  }));

  return { contest, movies: moviesWithDetails };
}
