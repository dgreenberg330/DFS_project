// ============================================================================
// Lineup Builder Component - Client Component
// ============================================================================

'use client';

import { useState, useEffect, useRef } from 'react';
import { submitLineup } from '@/actions/lineups';
import { validateLineup } from '@/lib/validation';
import { toast } from 'sonner';
import {
  trackLineupBuilderOpened,
  trackLineupSubmitted,
  trackLineupAbandoned,
  getAbandonedStage,
} from '@/lib/gtm';
import type { ContestWithMovies, Movie } from '@/types';

interface LineupBuilderProps {
  contest: ContestWithMovies;
  movies: Movie[];
  existingMovieIds: string[];
  isLocked: boolean;
  userId: string;
}

export function LineupBuilder({
  contest,
  movies,
  existingMovieIds,
  isLocked,
  userId,
}: LineupBuilderProps) {
  // Defensive check: ensure existingMovieIds is an array
  const safeExistingIds = Array.isArray(existingMovieIds) ? existingMovieIds : [];

  const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>(safeExistingIds);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if lineup was submitted (to prevent abandoned tracking after submit)
  const hasSubmittedRef = useRef(false);

  // Refs to store latest values for abandoned tracking (avoids useEffect re-running)
  const selectedCountRef = useRef(0);
  const isValidRef = useRef(false);

  // Defensive check: ensure movies is an array
  const safeMovies = Array.isArray(movies) ? movies : [];

  // Get selected movies
  const selectedMovies = safeMovies.filter((m) => selectedMovieIds.includes(m.id));

  // Validate lineup
  const validation = validateLineup(selectedMovies);
  const totalSalary = validation.totalSalary;
  const remainingSalary = validation.remainingSalary;
  const movieCount = validation.movieCount;

  // Calculate projected score (defensive check for null projected_gross)
  const projectedScore = selectedMovies.reduce(
    (sum, movie) => sum + (movie.projected_gross || 0),
    0
  );

  // Keep refs updated with latest values for abandoned tracking
  useEffect(() => {
    selectedCountRef.current = selectedMovieIds.length;
    isValidRef.current = validation.isValid;
  }, [selectedMovieIds.length, validation.isValid]);

  // GTM: Track lineup builder opened on mount
  useEffect(() => {
    if (!isLocked) {
      trackLineupBuilderOpened({
        contest_id: contest.id,
        user_id: userId,
      });
    }
  }, [contest.id, userId, isLocked]);

  // GTM: Track abandoned lineup on page unload/navigation
  // Only fires on actual page close/refresh or navigation away
  useEffect(() => {
    const trackAbandoned = () => {
      // Don't track if already submitted or if contest is locked
      if (hasSubmittedRef.current || isLocked) return;

      const stage = getAbandonedStage(selectedCountRef.current, isValidRef.current);
      trackLineupAbandoned({
        contest_id: contest.id,
        user_id: userId,
        stage_abandoned: stage,
      });
    };

    // Track on beforeunload (page close/refresh)
    const handleBeforeUnload = () => {
      trackAbandoned();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also track on component unmount (navigation away)
      trackAbandoned();
    };
    // Only run on mount/unmount - refs provide latest values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contest.id, userId, isLocked]);

  // Toggle movie selection
  function toggleMovie(movieId: string) {
    if (isLocked) return; // Cannot edit if locked

    setError(null);
    setSubmitted(false);

    if (selectedMovieIds.includes(movieId)) {
      // Deselect
      setSelectedMovieIds(selectedMovieIds.filter((id) => id !== movieId));
    } else {
      // Select (check if would exceed 4 movies)
      if (selectedMovieIds.length >= 4) {
        toast.error('Cannot select more than 4 movies');
        return;
      }
      setSelectedMovieIds([...selectedMovieIds, movieId]);
    }
  }

  // Submit lineup
  async function handleSubmit() {
    if (!validation.isValid) {
      toast.error(validation.errors.join(', '));
      return;
    }

    // Defensive check: ensure we have a contest ID
    if (!contest?.id) {
      toast.error('Contest information is missing. Please refresh the page.');
      return;
    }

    // Defensive check: ensure we have selected movies
    if (!selectedMovieIds || selectedMovieIds.length === 0) {
      toast.error('Please select at least 2 movies.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitLineup({
        contest_id: contest.id,
        movie_ids: selectedMovieIds,
      });

      // Mark as submitted to prevent abandoned tracking
      hasSubmittedRef.current = true;
      setSubmitted(true);

      // GTM: Track successful lineup submission
      trackLineupSubmitted({
        contest_id: contest.id,
        user_id: userId,
        salary_used: totalSalary,
        num_movies: selectedMovieIds.length,
      });

      toast.success('Lineup submitted successfully!');
    } catch (err: unknown) {
      // Provide more helpful error messages
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit lineup. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Lineup submission error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  // Contest is locked
  if (isLocked) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800 font-medium">
          This contest is locked. Lineups can no longer be edited.
        </p>
        <a
          href={`/contests/${contest.id}/leaderboard`}
          className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700"
        >
          View Leaderboard →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center" role="alert" aria-live="polite">
          <p className="text-green-800 font-medium">Lineup saved. Good luck!</p>
          <p className="text-sm text-green-700 mt-1">
            You can edit your lineup until the contest locks.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert" aria-live="assertive">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Lineup Summary */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{movieCount}/4</div>
            <div className="text-xs text-gray-600">Movies</div>
          </div>
          <div>
            <div
              className={`text-2xl font-bold ${
                remainingSalary < 0 ? 'text-red-600' : 'text-gray-900'
              }`}
            >
              ${remainingSalary}
            </div>
            <div className="text-xs text-gray-600">Remaining</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {projectedScore.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600">Projected Pts</div>
          </div>
        </div>

        {/* Validation Hints */}
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
          {movieCount < 2 && <p>Select at least 2 movies</p>}
          {movieCount >= 2 && movieCount <= 4 && remainingSalary >= 0 && (
            <p className="text-green-600">✓ Valid lineup</p>
          )}
          {remainingSalary < 0 && (
            <p className="text-red-600">Salary cap exceeded by ${Math.abs(remainingSalary)}</p>
          )}
        </div>
      </div>

      {/* Movie List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Available Movies</h2>
          <p className="text-xs text-gray-600 mt-1">
            Select 2-4 movies within $100 salary cap
          </p>
        </div>

        {safeMovies.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No movies available for this contest.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {safeMovies.map((movie) => {
            const isSelected = selectedMovieIds.includes(movie.id);
            const wouldExceedCount = !isSelected && movieCount >= 4;

            return (
              <button
                key={movie.id}
                onClick={() => toggleMovie(movie.id)}
                disabled={wouldExceedCount}
                className={`w-full text-left p-4 transition-colors ${
                  isSelected
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'hover:bg-gray-50'
                } ${wouldExceedCount ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Movie Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-medium text-gray-900 truncate">
                        {movie.title}
                      </h3>
                    </div>

                    {/* Metadata */}
                    <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                      <span>{new Date(movie.release_date).toLocaleDateString()}</span>
                      {movie.distributor && <span>{movie.distributor}</span>}
                      {movie.theater_count && (
                        <span>{movie.theater_count.toLocaleString()} theaters</span>
                      )}
                    </div>
                  </div>

                  {/* Salary & Projection */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-gray-900">
                      ${movie.salary}
                    </div>
                    <div className="text-xs text-gray-600">
                      Proj: {movie.projected_gross.toFixed(1)}M
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!validation.isValid || submitting}
        className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting
          ? 'Submitting...'
          : existingMovieIds.length > 0
          ? 'Update Lineup'
          : 'Submit Lineup'}
      </button>

      {/* Help Text */}
      <div className="text-xs text-gray-600 text-center space-y-1">
        <p>You can edit your lineup until the contest locks.</p>
        <p>
          <a href="/account" className="text-blue-600 hover:text-blue-700">
            View My Account
          </a>
          {' • '}
          <a href="/" className="text-blue-600 hover:text-blue-700">
            Home
          </a>
        </p>
      </div>
    </div>
  );
}
