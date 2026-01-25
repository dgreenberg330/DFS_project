// ============================================================================
// Daily Estimate Utility Functions
// ============================================================================

import type { Movie, EstimateDay } from '@/types';

/**
 * Determines which estimate day we're on based on which estimate fields are populated
 * @param movie Movie to check
 * @returns Current estimate day
 */
export function getCurrentEstimateDay(movie: Movie): EstimateDay {
  if (movie.actual_gross !== null) return 'final';
  if (movie.sunday_estimate !== null) return 'sunday';
  if (movie.saturday_estimate !== null) return 'saturday';
  if (movie.friday_estimate !== null) return 'friday';
  return 'none';
}

/**
 * Calculates the current score estimate based on available data
 * - Day 1: score = friday_estimate
 * - Day 2: score = friday_estimate + saturday_estimate
 * - Day 3: score = sunday_estimate (cumulative, replaces sum)
 * - Final: score = actual_gross
 *
 * @param movie Movie to calculate estimate for
 * @returns Current estimated score, or null if no estimates
 */
export function calculateCurrentEstimate(movie: Movie): number | null {
  const day = getCurrentEstimateDay(movie);

  switch (day) {
    case 'final':
      return movie.actual_gross;
    case 'sunday':
      return movie.sunday_estimate;
    case 'saturday':
      return (movie.friday_estimate ?? 0) + (movie.saturday_estimate ?? 0);
    case 'friday':
      return movie.friday_estimate;
    case 'none':
      return null;
  }
}

/**
 * Determines uptick/downtick direction based on current estimate vs projection
 * Thresholds adjust based on which day we're on:
 * - Day 1: uptick if friday_estimate > projected_gross / 3
 * - Day 2: uptick if (friday + saturday) > projected_gross * 2/3
 * - Day 3: uptick if sunday_estimate > projected_gross
 * - Final: uptick if actual_gross > projected_gross
 *
 * @param movie Movie to check
 * @returns 'uptick' | 'downtick' | 'neutral' | null (null if no estimates)
 */
export function getEstimateDirection(movie: Movie): 'uptick' | 'downtick' | 'neutral' | null {
  const day = getCurrentEstimateDay(movie);
  const currentEstimate = calculateCurrentEstimate(movie);

  if (currentEstimate === null || day === 'none') return null;

  const projected = movie.projected_gross;
  let threshold: number;

  switch (day) {
    case 'final':
      threshold = projected;
      break;
    case 'sunday':
      threshold = projected;
      break;
    case 'saturday':
      threshold = projected * (2 / 3);
      break;
    case 'friday':
      threshold = projected / 3;
      break;
    default:
      return null;
  }

  // Use small epsilon for float comparison
  const epsilon = 0.01;
  if (currentEstimate > threshold + epsilon) return 'uptick';
  if (currentEstimate < threshold - epsilon) return 'downtick';
  return 'neutral';
}
