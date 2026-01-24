// ============================================================================
// Perfect Lineup Detection Utilities
// ============================================================================

import type { Movie } from '@/types';
import { LINEUP_CONSTRAINTS } from '@/types';

const { SALARY_CAP, MIN_MOVIES, MAX_MOVIES } = LINEUP_CONSTRAINTS;

/**
 * Generates all combinations of a given size from an array
 */
function combinations<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];

  function combine(start: number, combo: T[]) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      combo.push(array[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }

  combine(0, []);
  return result;
}

/**
 * Calculates the maximum possible score for a contest given salary constraints
 *
 * Constraints:
 * - 2-4 movies per lineup
 * - $100 salary cap
 * - Score = sum of actual_gross
 *
 * @param movies All movies in the contest with actual_gross populated
 * @returns Maximum possible score and the optimal lineup
 */
export function calculateMaxPossibleScore(movies: Movie[]): {
  maxScore: number;
  optimalLineup: Movie[];
} {
  // Filter to movies with actual_gross (required for scoring)
  const scorableMovies = movies.filter(m => m.actual_gross !== null);

  if (scorableMovies.length < MIN_MOVIES) {
    return { maxScore: 0, optimalLineup: [] };
  }

  let maxScore = 0;
  let optimalLineup: Movie[] = [];

  // Check all valid combinations (2, 3, and 4 movies)
  for (let size = MIN_MOVIES; size <= Math.min(MAX_MOVIES, scorableMovies.length); size++) {
    const combos = combinations(scorableMovies, size);

    for (const combo of combos) {
      // Check salary constraint
      const totalSalary = combo.reduce((sum, m) => sum + m.salary, 0);
      if (totalSalary > SALARY_CAP) continue;

      // Calculate score
      const score = combo.reduce((sum, m) => sum + (m.actual_gross ?? 0), 0);

      if (score > maxScore) {
        maxScore = score;
        optimalLineup = combo;
      }
    }
  }

  return { maxScore, optimalLineup };
}
