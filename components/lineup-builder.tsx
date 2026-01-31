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
import { MovieCard } from '@/components/movie-card';
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

    // Mark as submitted early to prevent abandoned tracking
    hasSubmittedRef.current = true;

    // GTM: Track submission before server action (redirect prevents code after)
    trackLineupSubmitted({
      contest_id: contest.id,
      user_id: userId,
      salary_used: totalSalary,
      num_movies: selectedMovieIds.length,
    });

    try {
      await submitLineup({
        contest_id: contest.id,
        movie_ids: selectedMovieIds,
      });

      // This won't run - submitLineup redirects on success
      setSubmitted(true);
      toast.success('Lineup submitted successfully!');
    } catch (err: unknown) {
      // Re-throw redirect errors so Next.js handles them
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
        throw err;
      }

      // Reset submitted flag on actual errors
      hasSubmittedRef.current = false;

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
      <div className="bg-dark-surface border border-dark-border rounded-lg p-6 text-center">
        <p className="text-amber-400 font-medium">
          This contest is locked. Lineups can no longer be edited.
        </p>
        <a
          href={`/contests/${contest.id}/leaderboard`}
          className="mt-4 inline-block text-sm text-accent hover:text-accent-light"
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
        <div className="bg-dark-surface border border-green-600/50 rounded-lg p-4 text-center" role="alert" aria-live="polite">
          <p className="text-green-400 font-medium">Lineup saved. Good luck!</p>
          <p className="text-sm text-gray-400 mt-1">
            You can edit your lineup until the contest locks.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-dark-surface border border-red-600/50 rounded-lg p-4" role="alert" aria-live="assertive">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Lineup Summary */}
      <div className="bg-dark-surface rounded-lg shadow-lg p-4 border border-dark-border">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div>
            <div className="text-xl sm:text-2xl font-bold text-gray-100">{movieCount}/4</div>
            <div className="text-xs text-gray-400">Movies</div>
          </div>
          <div>
            <div
              className={`text-xl sm:text-2xl font-bold ${
                remainingSalary < 0 ? 'text-red-400' : 'text-gray-100'
              }`}
            >
              ${remainingSalary.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Remaining</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-accent">
              {projectedScore.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">Projected Pts</div>
          </div>
        </div>

        {/* Validation Hints */}
        <div className="mt-3 pt-3 border-t border-dark-border text-xs text-gray-400">
          {movieCount < 2 && <p>Select at least 2 movies</p>}
          {movieCount >= 2 && movieCount <= 4 && remainingSalary >= 0 && (
            <p className="text-green-400">✓ Valid lineup</p>
          )}
          {remainingSalary < 0 && (
            <p className="text-red-400">Salary cap exceeded by ${Math.abs(remainingSalary).toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Movie Grid */}
      <div className="bg-dark-surface rounded-lg shadow-lg border border-dark-border">
        <div className="p-3 sm:p-4 border-b border-dark-border">
          <h2 className="text-sm sm:text-base font-semibold text-gray-100">Available Movies</h2>
          <p className="text-xs text-gray-400 mt-1">
            Select 2-4 movies within $50K cap
          </p>
        </div>

        {safeMovies.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No movies available for this contest.
          </div>
        ) : (
          <div className="p-3 sm:p-6">
            {/* Mobile: 2 columns with medium cards */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-5 justify-items-center sm:hidden">
              {safeMovies.map((movie) => {
                const isSelected = selectedMovieIds.includes(movie.id);
                const wouldExceedCount = !isSelected && movieCount >= 4;

                return (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    isSelected={isSelected}
                    isDisabled={wouldExceedCount}
                    onToggle={toggleMovie}
                    showCheckbox={true}
                    size="md"
                  />
                );
              })}
            </div>

            {/* Desktop: 4-5 columns with medium cards */}
            <div className="hidden sm:grid sm:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-5 justify-items-center">
              {safeMovies.map((movie) => {
                const isSelected = selectedMovieIds.includes(movie.id);
                const wouldExceedCount = !isSelected && movieCount >= 4;

                return (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    isSelected={isSelected}
                    isDisabled={wouldExceedCount}
                    onToggle={toggleMovie}
                    showCheckbox={true}
                    size="md"
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!validation.isValid || submitting}
        className="w-full py-3 px-4 bg-accent text-dark-bg font-semibold rounded-lg hover:bg-accent-light focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting
          ? 'Submitting...'
          : existingMovieIds.length > 0
          ? 'Update Lineup'
          : 'Submit Lineup'}
      </button>

      {/* Help Text */}
      <div className="text-xs text-gray-400 text-center space-y-1 pb-16 sm:pb-0">
        <p>You can edit your lineup until the contest locks.</p>
        <p>
          <a href="/account" className="text-accent hover:text-accent-light">
            View My Account
          </a>
          {' • '}
          <a href="/" className="text-accent hover:text-accent-light">
            Home
          </a>
        </p>
      </div>

      {/* Mobile sticky bottom status bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-dark-border px-4 py-2 sm:hidden z-50">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Movies:</span>
            <span className="font-semibold text-gray-100">{movieCount}/4</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Left:</span>
            <span className={`font-semibold ${remainingSalary < 0 ? 'text-red-400' : 'text-gray-100'}`}>
              ${remainingSalary.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Proj:</span>
            <span className="font-semibold text-accent">{projectedScore.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
