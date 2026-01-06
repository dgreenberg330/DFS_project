// ============================================================================
// Validation Helpers
// ============================================================================

import { Movie } from '@/types';

export const LINEUP_CONSTRAINTS = {
  MIN_MOVIES: 2,
  MAX_MOVIES: 4,
  SALARY_CAP: 100,
} as const;

/**
 * Validates lineup movie selection
 * Returns validation result with errors if invalid
 */
export function validateLineup(movies: Movie[]) {
  const errors: string[] = [];
  const movieCount = movies.length;
  const totalSalary = movies.reduce((sum, movie) => sum + movie.salary, 0);

  // Check movie count (2-4 movies required)
  if (movieCount < LINEUP_CONSTRAINTS.MIN_MOVIES) {
    errors.push(`Must select at least ${LINEUP_CONSTRAINTS.MIN_MOVIES} movies`);
  }
  if (movieCount > LINEUP_CONSTRAINTS.MAX_MOVIES) {
    errors.push(`Cannot select more than ${LINEUP_CONSTRAINTS.MAX_MOVIES} movies`);
  }

  // Check salary cap ($100 maximum)
  if (totalSalary > LINEUP_CONSTRAINTS.SALARY_CAP) {
    errors.push(`Total salary $${totalSalary} exceeds cap of $${LINEUP_CONSTRAINTS.SALARY_CAP}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    movieCount,
    totalSalary,
    remainingSalary: LINEUP_CONSTRAINTS.SALARY_CAP - totalSalary,
  };
}

/**
 * Validates all movie IDs belong to the specified contest
 */
export function validateMoviesInContest(movies: Movie[], contestId: string) {
  const invalidMovies = movies.filter(m => m.contest_id !== contestId);

  if (invalidMovies.length > 0) {
    throw new Error(`Movies do not belong to contest: ${invalidMovies.map(m => m.title).join(', ')}`);
  }
}