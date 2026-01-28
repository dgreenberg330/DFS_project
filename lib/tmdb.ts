// ============================================================================
// TMDB Utility Functions
// ============================================================================

/**
 * TMDB poster image sizes
 * - w92: Tiny thumbnail (92px wide)
 * - w154: Small thumbnail (154px wide)
 * - w185: Grid card size (185px wide)
 * - w342: Medium display (342px wide)
 * - w500: Large display (500px wide)
 * - w780: Extra large (780px wide)
 * - original: Full resolution
 */
export type TMDBPosterSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

/**
 * Builds a full TMDB poster URL from a poster path
 * @param posterPath - The poster path from TMDB (e.g., "/abc123.jpg")
 * @param size - The desired image size (default: w185 for grid cards)
 * @returns Full URL to the poster image, or null if no poster path
 */
export function getTMDBPosterUrl(
  posterPath: string | null | undefined,
  size: TMDBPosterSize = 'w185'
): string | null {
  if (!posterPath) {
    return null;
  }

  // Ensure poster path starts with /
  const normalizedPath = posterPath.startsWith('/') ? posterPath : `/${posterPath}`;

  return `${TMDB_IMAGE_BASE_URL}/${size}${normalizedPath}`;
}

/**
 * Recommended sizes for different use cases
 */
export const POSTER_SIZES = {
  /** Grid card in lineup builder (185px) */
  GRID: 'w185' as TMDBPosterSize,
  /** Larger display on movie detail (342px) */
  DETAIL: 'w342' as TMDBPosterSize,
  /** Full-size hero display (500px) */
  HERO: 'w500' as TMDBPosterSize,
} as const;
