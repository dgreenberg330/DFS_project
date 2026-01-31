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
function formatReleaseDate(releaseDate: string): { date: string; week: number } {
  // Parse as local date to avoid timezone issues
  const [year, month, day] = releaseDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const weeks = getWeeksInTheater(releaseDate);
  return { date: formatted, week: weeks };
}

function ReleaseDateDisplay({ releaseDate }: { releaseDate: string }) {
  const { date, week } = formatReleaseDate(releaseDate);
  return (
    <>
      {date}
      {week > 1 && (
        <>
          <br />
          (Week {week})
        </>
      )}
    </>
  );
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
      {/* Mobile: Multi-row layout */}
      <div className="md:hidden">
        {/* Title row with primary stat */}
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-semibold text-gray-100 leading-tight">{movie.title}</h3>
          <div className="flex-shrink-0 ml-2">
            {(isResolved || (isLocked && hasEstimates)) ? (
              <div className={`text-sm font-bold flex items-center gap-1 ${scoreColor}`}>
                <span className="text-[10px] text-gray-500 uppercase">{isResolved ? 'Score:' : 'Est:'}</span>
                {showDirection && direction === 'uptick' && (
                  <img src="/uptick.png" alt="" className="w-3 h-3" />
                )}
                {showDirection && direction === 'downtick' && (
                  <img src="/downtick.png" alt="" className="w-3 h-3" />
                )}
                {scoreValue.toFixed(1)} {scoreLabel}
              </div>
            ) : (
              <div className="text-sm font-semibold text-accent flex items-center gap-1">
                <span className="text-[10px] text-gray-500 uppercase">Cost:</span>
                ${movie.salary.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Content with floated elements */}
        <div>
          {/* Floated Poster (left) */}
          <div
            className="relative float-left rounded-lg overflow-hidden bg-dark-elevated mr-2"
            style={{ width: 90, height: 135 }}
          >
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={`${movie.title} poster`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-2 bg-dark-surface">
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

          {/* Floated Game Info (right) */}
          <div className="float-right text-right ml-2 w-16 -mt-0.5">
            <div className="space-y-1">
              {(isResolved || (isLocked && hasEstimates)) && (
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Cost</div>
                  <div className="text-sm font-semibold text-accent">${movie.salary.toLocaleString()}</div>
                </div>
              )}
              <div>
                <div className="text-[10px] text-gray-500 uppercase">Proj</div>
                <div className="text-xs text-gray-100">${movie.projected_gross.toFixed(1)}M</div>
              </div>
              {!isNewRelease(movie.release_date) && movie.prior_week_gross !== null && (
                <div>
                  <div className="text-[10px] text-gray-500 uppercase">Last wk</div>
                  <div className="text-xs text-gray-100">${movie.prior_week_gross.toFixed(1)}M</div>
                </div>
              )}
            </div>
          </div>

          {/* Flowing content */}
          <div className="text-xs leading-tight">
            {formatBudget(tmdb?.budget ?? null) && (
              <p className="text-gray-300">
                <span className="text-gray-500">Budget:</span> {formatBudget(tmdb?.budget ?? null)}
              </p>
            )}
            {tmdb?.runtime && (
              <p className="text-gray-300">
                <span className="text-gray-500">Runtime:</span> {tmdb.runtime} min
              </p>
            )}
            <p className="text-gray-300">
              <span className="text-gray-500">Release:</span> <ReleaseDateDisplay releaseDate={movie.release_date} />
            </p>
            {movie.distributor && (
              <p className="text-gray-300">
                <span className="text-gray-500">Distributor:</span> {movie.distributor}
              </p>
            )}
            {tmdb?.director && (
              <p className="text-gray-300">
                <span className="text-gray-500">Director:</span> {tmdb.director}
              </p>
            )}
            {tmdb?.cast && tmdb.cast.length > 0 && (
              <p className="text-gray-300">
                <span className="text-gray-500">Cast:</span> {tmdb.cast.join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Spacer to clear floats */}
        <div className="clear-both h-3" />

        {/* Description */}
        {tmdb?.overview && (
          <p className="text-xs text-gray-400">{tmdb.overview}</p>
        )}
      </div>

      {/* Desktop: Three-column layout */}
      <div className="hidden md:flex gap-3 items-start" style={{ minHeight: 216 }}>
        {/* Left: Poster */}
        <div
          className="relative flex-shrink-0 rounded-lg overflow-hidden bg-dark-elevated"
          style={{ width: 144, height: 216 }}
        >
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={`${movie.title} poster`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-3 bg-dark-surface">
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
        <div className="flex-1 min-w-0 flex flex-col ml-1">
          <h3 className="text-lg font-semibold text-gray-100 mb-2">{movie.title}</h3>

          {/* Metadata in two columns */}
          <div className="flex gap-12 text-sm mb-3">
            {/* Left column: Director, Cast, Release Date */}
            <div className="space-y-1 flex-1">
              {tmdb?.director && (
                <p className="text-gray-300">
                  <span className="text-gray-500">Director:</span> {tmdb.director}
                </p>
              )}
              {tmdb?.cast && tmdb.cast.length > 0 && (
                <p className="text-gray-300">
                  <span className="text-gray-500">Cast:</span> {tmdb.cast.join(', ')}
                </p>
              )}
              <p className="text-gray-300">
                <span className="text-gray-500">Release Date:</span> <ReleaseDateDisplay releaseDate={movie.release_date} />
              </p>
            </div>

            {/* Right column: Budget, Distributor, Runtime */}
            <div className="space-y-1 flex-1">
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

          {tmdb?.overview && (
            <p className="text-sm text-gray-400 mt-auto">{tmdb.overview}</p>
          )}
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
                ${movie.projected_gross.toFixed(1)}M
              </div>
            </div>

            {/* Last week (for holdovers) */}
            {!isNewRelease(movie.release_date) && movie.prior_week_gross !== null && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Last week</div>
                <div className="text-base text-gray-100">
                  ${movie.prior_week_gross.toFixed(1)}M
                </div>
              </div>
            )}

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
