'use client';

import { useState } from 'react';
import type { Movie, EstimateDay } from '@/types';

interface LineupMovieData {
  movie: Movie | Movie[];
}

interface LeaderboardEntryProps {
  rank: number;
  index: number;
  username: string;
  isUserEntry: boolean;
  isPerfectLineup: boolean;
  isPreliminary?: boolean;
  totalScore: number;
  movies: LineupMovieData[];
}

// Client-side versions of the estimate functions
function getCurrentEstimateDay(movie: Movie): EstimateDay {
  if (movie.actual_gross !== null) return 'final';
  if (movie.sunday_estimate !== null) return 'sunday';
  if (movie.saturday_estimate !== null) return 'saturday';
  if (movie.friday_estimate !== null) return 'friday';
  return 'none';
}

function calculateCurrentEstimate(movie: Movie): number | null {
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

function getEstimateDirection(movie: Movie): 'uptick' | 'downtick' | 'neutral' | null {
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

  const epsilon = 0.01;
  if (currentEstimate > threshold + epsilon) return 'uptick';
  if (currentEstimate < threshold - epsilon) return 'downtick';
  return 'neutral';
}

export function LeaderboardEntry({
  rank,
  index,
  username,
  isUserEntry,
  isPerfectLineup,
  isPreliminary = false,
  totalScore,
  movies,
}: LeaderboardEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort movies by score (actual or estimate), highest to lowest
  const sortedMovies = [...movies].sort((a, b) => {
    const movieA = Array.isArray(a.movie) ? a.movie[0] : a.movie;
    const movieB = Array.isArray(b.movie) ? b.movie[0] : b.movie;

    if (isPreliminary) {
      const estimateA = calculateCurrentEstimate(movieA) ?? movieA.projected_gross;
      const estimateB = calculateCurrentEstimate(movieB) ?? movieB.projected_gross;
      return estimateB - estimateA;
    }

    return (movieB.actual_gross ?? 0) - (movieA.actual_gross ?? 0);
  });

  return (
    <div
      className={`p-4 ${
        isUserEntry ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      } ${index < 3 && !isUserEntry ? 'bg-yellow-50' : ''}`}
    >
      {/* Header row - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-4 text-left"
      >
        {/* Rank */}
        <div className="flex-shrink-0 w-8 sm:w-12 text-center">
          <div
            className={`text-lg sm:text-2xl font-bold ${
              index === 0
                ? 'text-yellow-600'
                : index === 1
                ? 'text-gray-500'
                : index === 2
                ? 'text-orange-600'
                : 'text-gray-900'
            }`}
          >
            #{rank}
          </div>
        </div>

        {/* Username */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="font-medium text-gray-900 text-base sm:text-lg">
            {isUserEntry ? 'You' : username}
          </span>
          {isUserEntry && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
              Your Entry
            </span>
          )}
          {/* Only show perfect lineup badge for final leaderboard */}
          {isPerfectLineup && !isPreliminary && (
            <img
              src="/perfect-lineup-badge.png"
              alt="Perfect Lineup"
              title="Perfect Lineup - Achieved the maximum possible score!"
              className="h-6 w-auto"
            />
          )}
        </div>

        {/* Score + expand indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              {totalScore?.toFixed(2) || '0.0'}
            </div>
            <div className="text-xs text-gray-600">
              {isPreliminary ? 'est. pts' : 'points'}
            </div>
          </div>
          <div className="text-gray-400">
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded content - movie breakdown */}
      {isExpanded && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="space-y-3">
            {sortedMovies.map((lm) => {
              const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;

              // For preliminary mode, use estimate-based scoring
              if (isPreliminary) {
                const estimate = calculateCurrentEstimate(movie);
                const direction = getEstimateDirection(movie);
                const displayScore = estimate ?? movie.projected_gross;

                const scoreColor =
                  direction === 'uptick'
                    ? 'text-green-600'
                    : direction === 'downtick'
                    ? 'text-red-600'
                    : 'text-gray-900';

                return (
                  <div key={movie.id} className="flex items-start gap-4 text-sm">
                    {/* Spacer to match rank column */}
                    <div className="flex-shrink-0 w-8 sm:w-12" />
                    {/* Movie title + salary */}
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-700 block">{movie.title}</span>
                      <span className="text-xs text-gray-500">${movie.salary}</span>
                    </div>
                    {/* Score aligned with total points */}
                    <div className="flex items-start gap-3">
                      <div className="text-right">
                        <div className={`font-medium ${scoreColor} flex items-center justify-end gap-1`}>
                          {direction === 'uptick' && (
                            <img src="/uptick.png" alt="" className="w-3 h-3" />
                          )}
                          {direction === 'downtick' && (
                            <img src="/downtick.png" alt="" className="w-3 h-3" />
                          )}
                          {displayScore.toFixed(2)}M
                        </div>
                        <div className="text-xs text-gray-500">
                          proj: {movie.projected_gross?.toFixed(2)}M
                        </div>
                      </div>
                      {/* Spacer to match chevron */}
                      <div className="w-5" />
                    </div>
                  </div>
                );
              }

              // Final mode - use actual_gross
              const actual = movie.actual_gross ?? 0;
              const projected = movie.projected_gross ?? 0;
              const actualColor =
                actual > projected
                  ? 'text-green-600'
                  : actual < projected
                  ? 'text-red-600'
                  : 'text-gray-900';

              return (
                <div key={movie.id} className="flex items-start gap-4 text-sm">
                  {/* Spacer to match rank column */}
                  <div className="flex-shrink-0 w-8 sm:w-12" />
                  {/* Movie title + salary */}
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-700 block">{movie.title}</span>
                    <span className="text-xs text-gray-500">${movie.salary}</span>
                  </div>
                  {/* Score aligned with total points */}
                  <div className="flex items-start gap-3">
                    <div className="text-right">
                      <div className={`font-medium ${actualColor} flex items-center justify-end gap-1`}>
                        {actual > projected && (
                          <img src="/uptick.png" alt="" className="w-3 h-3" />
                        )}
                        {actual < projected && (
                          <img src="/downtick.png" alt="" className="w-3 h-3" />
                        )}
                        {movie.actual_gross?.toFixed(2)}M
                      </div>
                      <div className="text-xs text-gray-500">
                        Proj: {movie.projected_gross?.toFixed(2)}M
                      </div>
                    </div>
                    {/* Spacer to match chevron */}
                    <div className="w-5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
