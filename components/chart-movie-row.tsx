// ============================================================================
// Chart Movie Row Component
// ============================================================================

'use client';

import { getTMDBPosterUrl } from '@/lib/tmdb';
import {
  getCurrentEstimateDay,
  calculateCurrentEstimate,
  getEstimateDirection,
} from '@/lib/estimate-utils';
import type { MovieWithTMDBDetails, ContestStatus } from '@/types';

interface ChartMovieRowProps {
  movie: MovieWithTMDBDetails;
  contestStatus: ContestStatus;
}

/**
 * Formats budget in millions/billions for display
 */
function formatBudget(budget: number | null): string | null {
  if (!budget || budget === 0) return null;

  if (budget >= 1_000_000_000) {
    return `$${(budget / 1_000_000_000).toFixed(1)}B`;
  }
  if (budget >= 1_000_000) {
    return `$${Math.round(budget / 1_000_000)}M`;
  }
  return `$${budget.toLocaleString()}`;
}

/**
 * Calculates weeks in theater from release date
 */
function getWeeksInTheater(releaseDate: string): number {
  // Parse as local date to avoid timezone issues
  const [year, month, day] = releaseDate.split('-').map(Number);
  const release = new Date(year, month - 1, day);
  const now = new Date();
  const diffTime = now.getTime() - release.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.ceil(diffDays / 7));
}

/**
 * Checks if movie is new (first week)
 */
function isNewRelease(releaseDate: string): boolean {
  return getWeeksInTheater(releaseDate) === 1;
}

/**
 * Formats release date with week number for non-new releases
 */
function formatReleaseDate(releaseDate: string): string {
  // Parse as local date to avoid timezone issues
  const [year, month, day] = releaseDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const weeks = getWeeksInTheater(releaseDate);
  if (weeks > 1) {
    return `${formatted} (Week ${weeks})`;
  }
  return formatted;
}

export function ChartMovieRow({ movie, contestStatus }: ChartMovieRowProps) {
  const posterUrl = getTMDBPosterUrl(movie.poster_path, 'w342');
  const tmdb = movie.tmdb_details;

  // Determine score display based on contest status
  const isResolved = contestStatus === 'resolved';
  const isLocked = contestStatus === 'locked';
  const isUpcoming = contestStatus === 'upcoming';

  // Check for estimates
  const estimateDay = getCurrentEstimateDay(movie);
  const hasEstimates = estimateDay !== 'none' && estimateDay !== 'final';
  const currentEstimate = calculateCurrentEstimate(movie);
  const direction = getEstimateDirection(movie);

  // Determine what to display for score
  let scoreValue: number;
  let scoreLabel: string;
  let showDirection = false;

  if (isResolved && movie.actual_gross !== null) {
    // Final score
    scoreValue = movie.actual_gross;
    scoreLabel = 'pts';
    showDirection = true;
  } else if (isLocked && hasEstimates && currentEstimate !== null) {
    // Estimated score during locked contest
    scoreValue = currentEstimate;
    scoreLabel = 'est.';
    showDirection = true;
  } else {
    // Projection (upcoming or no estimates)
    scoreValue = movie.projected_gross;
    scoreLabel = 'proj.';
  }

  const scoreColor =
    showDirection && direction === 'uptick'
      ? 'text-green-400'
      : showDirection && direction === 'downtick'
      ? 'text-red-400'
      : 'text-gray-100';

  return (
    <div className="bg-dark-surface rounded-lg border border-dark-border p-4 md:p-5">
      {/* Mobile: Stacked layout */}
      <div className="md:hidden">
        {/* Top row: Poster + Title */}
        <div className="flex gap-4 mb-4">
          {/* Poster */}
          <div className="relative flex-shrink-0 w-24 h-36 rounded-lg overflow-hidden bg-dark-elevated">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={`${movie.title} poster`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-2">
                <span className="text-center text-gray-400 text-xs leading-tight">
                  {movie.title}
                </span>
              </div>
            )}
            {isNewRelease(movie.release_date) && (
              <div className="absolute bottom-0 left-0 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tr">
                NEW
              </div>
            )}
          </div>

          {/* Title and quick info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-100 mb-1">{movie.title}</h3>
            {tmdb?.director && (
              <p className="text-xs text-gray-400 mb-1">Dir. {tmdb.director}</p>
            )}
            {tmdb?.cast && tmdb.cast.length > 0 && (
              <p className="text-xs text-gray-400 mb-2">{tmdb.cast.join(', ')}</p>
            )}
            {/* Mobile game info */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Cost</span>
                <span className="text-accent font-semibold">${movie.salary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Projection</span>
                <div className="text-right">
                  <span className="text-gray-100">{movie.projected_gross.toFixed(1)} pts</span>
                  {!isNewRelease(movie.release_date) && movie.prior_week_gross !== null && (
                    <div className="text-xs text-gray-500">Prior: {movie.prior_week_gross.toFixed(1)}</div>
                  )}
                </div>
              </div>
              {(isResolved || (isLocked && hasEstimates)) && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Score</span>
                  <span className={`font-semibold flex items-center gap-1 ${scoreColor}`}>
                    {showDirection && direction === 'uptick' && (
                      <img src="/uptick.png" alt="" className="w-3 h-3" />
                    )}
                    {showDirection && direction === 'downtick' && (
                      <img src="/downtick.png" alt="" className="w-3 h-3" />
                    )}
                    {scoreValue.toFixed(1)} {scoreLabel}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overview */}
        {tmdb?.overview && (
          <p className="text-xs text-gray-400 line-clamp-3 mb-2">{tmdb.overview}</p>
        )}

        {/* Metadata rows */}
        <div className="space-y-1 text-xs text-gray-400">
          <p><span className="text-gray-500">Release Date:</span> {formatReleaseDate(movie.release_date)}</p>
          {formatBudget(tmdb?.budget ?? null) && (
            <p><span className="text-gray-500">Budget:</span> {formatBudget(tmdb?.budget ?? null)}</p>
          )}
          {movie.distributor && (
            <p><span className="text-gray-500">Distributor:</span> {movie.distributor}</p>
          )}
          {tmdb?.runtime && (
            <p><span className="text-gray-500">Runtime:</span> {tmdb.runtime} min</p>
          )}
        </div>
      </div>

      {/* Desktop: Three-column layout */}
      <div className="hidden md:flex gap-5">
        {/* Left: Poster */}
        <div className="relative flex-shrink-0 w-36 h-54 rounded-lg overflow-hidden bg-dark-elevated">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={`${movie.title} poster`}
              className="w-full h-full object-cover"
              style={{ width: 144, height: 216 }}
              loading="lazy"
            />
          ) : (
            <div
              className="flex items-center justify-center p-3 bg-dark-surface"
              style={{ width: 144, height: 216 }}
            >
              <span className="text-center text-gray-400 text-sm leading-tight">
                {movie.title}
              </span>
            </div>
          )}
          {isNewRelease(movie.release_date) && (
            <div className="absolute bottom-0 left-0 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-tr">
              NEW
            </div>
          )}
        </div>

        {/* Middle: TMDB Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-100 mb-2">{movie.title}</h3>

          {tmdb?.overview && (
            <p className="text-sm text-gray-400 line-clamp-3 mb-3">{tmdb.overview}</p>
          )}

          {tmdb?.director && (
            <p className="text-sm text-gray-300 mb-1">
              <span className="text-gray-500">Director:</span> {tmdb.director}
            </p>
          )}

          {tmdb?.cast && tmdb.cast.length > 0 && (
            <p className="text-sm text-gray-300 mb-2">
              <span className="text-gray-500">Cast:</span> {tmdb.cast.join(', ')}
            </p>
          )}

          {/* Metadata rows */}
          <div className="space-y-1 text-sm">
            <p className="text-gray-300">
              <span className="text-gray-500">Release Date:</span> {formatReleaseDate(movie.release_date)}
            </p>
            {formatBudget(tmdb?.budget ?? null) && (
              <p className="text-gray-300">
                <span className="text-gray-500">Budget:</span> {formatBudget(tmdb?.budget ?? null)}
              </p>
            )}
            {movie.distributor && (
              <p className="text-gray-300">
                <span className="text-gray-500">Distributor:</span> {movie.distributor}
              </p>
            )}
            {tmdb?.runtime && (
              <p className="text-gray-300">
                <span className="text-gray-500">Runtime:</span> {tmdb.runtime} min
              </p>
            )}
            {movie.theater_count && (
              <p className="text-gray-300">
                <span className="text-gray-500">Theaters:</span> {movie.theater_count.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Right: Game Info */}
        <div className="flex-shrink-0 w-32 text-right">
          <div className="space-y-3">
            {/* Cost */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Cost</div>
              <div className="text-lg font-semibold text-accent">
                ${movie.salary.toLocaleString()}
              </div>
            </div>

            {/* Projection */}
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Projection</div>
              <div className="text-base text-gray-100">
                {movie.projected_gross.toFixed(1)} pts
              </div>
              {!isNewRelease(movie.release_date) && movie.prior_week_gross !== null && (
                <div className="text-xs text-gray-500 mt-0.5">
                  Prior: {movie.prior_week_gross.toFixed(1)} pts
                </div>
              )}
            </div>

            {/* Score (shown for resolved or locked with estimates) */}
            {(isResolved || (isLocked && hasEstimates)) && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  {isResolved ? 'Score' : 'Estimate'}
                </div>
                <div className={`text-lg font-bold flex items-center justify-end gap-1 ${scoreColor}`}>
                  {showDirection && direction === 'uptick' && (
                    <img src="/uptick.png" alt="" className="w-3.5 h-3.5" />
                  )}
                  {showDirection && direction === 'downtick' && (
                    <img src="/downtick.png" alt="" className="w-3.5 h-3.5" />
                  )}
                  {scoreValue.toFixed(1)} {scoreLabel}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
