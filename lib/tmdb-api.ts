// ============================================================================
// TMDB API Integration
// ============================================================================

import { unstable_cache } from 'next/cache';
import type { TMDBMovieDetails } from '@/types';

const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Cache TMDB data for 24 hours
const CACHE_REVALIDATE_SECONDS = 60 * 60 * 24;

/**
 * TMDB movie response from /movie/{id}
 */
interface TMDBMovieResponse {
  id: number;
  overview: string | null;
  budget: number;
  runtime: number | null;
  genres: Array<{ id: number; name: string }>;
}

/**
 * TMDB credits response from /movie/{id}/credits
 */
interface TMDBCreditsResponse {
  cast: Array<{
    id: number;
    name: string;
    order: number;
  }>;
  crew: Array<{
    id: number;
    name: string;
    job: string;
    department: string;
  }>;
}

/**
 * Fetches movie details from TMDB API
 * @param tmdbId TMDB movie ID
 * @returns Movie details (overview, budget, runtime, genres)
 */
async function fetchTMDBMovieDetails(tmdbId: number): Promise<{
  overview: string | null;
  budget: number | null;
  runtime: number | null;
  genres: string[];
} | null> {
  if (!TMDB_API_KEY) {
    console.warn('TMDB_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${TMDB_API_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`,
      { next: { revalidate: CACHE_REVALIDATE_SECONDS } }
    );

    if (!response.ok) {
      console.error(`TMDB API error for movie ${tmdbId}: ${response.status}`);
      return null;
    }

    const data: TMDBMovieResponse = await response.json();

    return {
      overview: data.overview || null,
      budget: data.budget > 0 ? data.budget : null,
      runtime: data.runtime || null,
      genres: data.genres?.map((g) => g.name) || [],
    };
  } catch (error) {
    console.error(`Failed to fetch TMDB details for movie ${tmdbId}:`, error);
    return null;
  }
}

/**
 * Fetches movie credits from TMDB API
 * @param tmdbId TMDB movie ID
 * @returns Director name and top 3 cast members
 */
async function fetchTMDBCredits(tmdbId: number): Promise<{
  director: string | null;
  cast: string[];
} | null> {
  if (!TMDB_API_KEY) {
    console.warn('TMDB_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${TMDB_API_BASE_URL}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}`,
      { next: { revalidate: CACHE_REVALIDATE_SECONDS } }
    );

    if (!response.ok) {
      console.error(`TMDB credits API error for movie ${tmdbId}: ${response.status}`);
      return null;
    }

    const data: TMDBCreditsResponse = await response.json();

    // Find director from crew
    const director = data.crew?.find((c) => c.job === 'Director')?.name || null;

    // Get top 3 cast members by order
    const cast = (data.cast || [])
      .sort((a, b) => a.order - b.order)
      .slice(0, 3)
      .map((c) => c.name);

    return { director, cast };
  } catch (error) {
    console.error(`Failed to fetch TMDB credits for movie ${tmdbId}:`, error);
    return null;
  }
}

/**
 * Internal function to fetch and combine TMDB movie info
 */
async function _getTMDBMovieInfo(tmdbId: number): Promise<TMDBMovieDetails | null> {
  // Fetch details and credits in parallel
  const [details, credits] = await Promise.all([
    fetchTMDBMovieDetails(tmdbId),
    fetchTMDBCredits(tmdbId),
  ]);

  if (!details && !credits) {
    return null;
  }

  return {
    tmdb_id: tmdbId,
    overview: details?.overview || null,
    budget: details?.budget || null,
    runtime: details?.runtime || null,
    genres: details?.genres || [],
    director: credits?.director || null,
    cast: credits?.cast || [],
  };
}

/**
 * Gets combined TMDB movie info with 24hr caching
 * @param tmdbId TMDB movie ID
 * @returns TMDBMovieDetails or null if not available
 */
export const getTMDBMovieInfo = unstable_cache(
  async (tmdbId: number): Promise<TMDBMovieDetails | null> => {
    return _getTMDBMovieInfo(tmdbId);
  },
  ['tmdb-movie-info'],
  { revalidate: CACHE_REVALIDATE_SECONDS }
);

/**
 * Batch fetch TMDB info for multiple movies
 * @param tmdbIds Array of TMDB movie IDs
 * @returns Map of tmdb_id to TMDBMovieDetails
 */
export async function batchGetTMDBMovieInfo(
  tmdbIds: number[]
): Promise<Map<number, TMDBMovieDetails>> {
  const results = new Map<number, TMDBMovieDetails>();

  // Filter out invalid IDs
  const validIds = tmdbIds.filter((id) => id && id > 0);

  // Fetch all in parallel
  const promises = validIds.map(async (tmdbId) => {
    const info = await getTMDBMovieInfo(tmdbId);
    if (info) {
      results.set(tmdbId, info);
    }
  });

  await Promise.all(promises);

  return results;
}
