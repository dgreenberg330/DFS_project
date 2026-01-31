// ============================================================================
// My Lineup Page - Locked View After Submission
// ============================================================================

import { getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getContest } from '@/actions/contests';
import { getUserEntry } from '@/actions/lineups';
import {
  getPerfectLineupInfo,
  getCurrentEstimateDay,
  calculateCurrentEstimate,
  getEstimateDirection,
  getPreliminaryLeaderboard,
} from '@/actions/scoring';
import { createAdminClient } from '@/lib/supabase-admin';
import { Header } from '@/components/header';
import Link from 'next/link';
import type { Movie } from '@/types';

// Helper to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Type for lineup movie with nested movie data from Supabase joins
interface LineupMovieData {
  movie: Movie | Movie[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MyLineupPage({ params }: PageProps) {
  const { id: contestId } = await params;

  // Require authentication
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  // Get contest and user's entry
  const contest = await getContest(contestId);
  const entry = await getUserEntry(contestId);

  // If no entry, redirect to lineup builder
  if (!entry) {
    redirect(`/contests/${contestId}/lineup`);
  }

  // Extract lineup data
  const lineup = Array.isArray(entry.lineup) ? entry.lineup[0] : entry.lineup;
  const movies = lineup.movies || [];

  // Calculate totals
  const totalSalary = movies.reduce((sum: number, lm: LineupMovieData) => {
    const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
    return sum + movie.salary;
  }, 0);

  const projectedScore = movies.reduce((sum: number, lm: LineupMovieData) => {
    const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
    return sum + movie.projected_gross;
  }, 0);

  const isLocked = contest.status !== 'upcoming' || lineup.status !== 'editable';
  const isScored = lineup.status === 'scored';

  // Check if any movies have estimates (for locked but not scored contests)
  let hasEstimates = false;
  let currentEstimatedScore = 0;
  let currentRank: number | null = null;
  let estimateDayLabel: 'Friday' | 'Saturday' | 'weekend' = 'Friday';

  if (isLocked && !isScored && contest.status === 'locked') {
    // Check for estimates and determine which day (find the most advanced day)
    for (const lm of movies) {
      const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
      if (movie) {
        const day = getCurrentEstimateDay(movie);
        if (day !== 'none') {
          hasEstimates = true;
          if (day === 'sunday' || day === 'final') {
            estimateDayLabel = 'weekend';
            break; // weekend is the max, no need to check more
          } else if (day === 'saturday') {
            estimateDayLabel = 'Saturday';
          }
          // Friday is the default, no need to set it
        }
      }
    }

    if (hasEstimates) {
      // Calculate current estimated score
      currentEstimatedScore = movies.reduce((sum: number, lm: LineupMovieData) => {
        const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
        const estimate = calculateCurrentEstimate(movie);
        return sum + (estimate ?? movie.projected_gross);
      }, 0);

      // Get current rank from preliminary leaderboard
      try {
        const prelimData = await getPreliminaryLeaderboard(contestId);
        if (prelimData.hasEstimates) {
          const userEntry = prelimData.entries.find(e => e.user_id === user.id);
          if (userEntry) {
            currentRank = userEntry.rank;
          }
        }
      } catch {
        // Ignore errors, rank will be null
      }
    }
  }

  // Calculate rank and check for perfect lineup for scored contests
  let rank: number | null = null;
  let totalEntries: number | null = null;
  let isPerfectLineup = false;

  if (isScored && contest.status === 'resolved') {
    const adminClient = createAdminClient();
    const { data: allEntries } = await adminClient
      .from('entries')
      .select('lineup:lineups(total_score)')
      .eq('contest_id', contestId);

    if (allEntries && allEntries.length > 0) {
      const scores = allEntries
        .map((e) => {
          const l = Array.isArray(e.lineup) ? e.lineup[0] : e.lineup;
          return l?.total_score ?? 0;
        })
        .sort((a, b) => b - a);

      const userRank = scores.findIndex((score) => score === lineup.total_score) + 1;
      rank = userRank > 0 ? userRank : null;
      totalEntries = allEntries.length;
    }

    // Check if user achieved a perfect lineup
    const perfectLineupInfo = await getPerfectLineupInfo(contestId);
    isPerfectLineup = perfectLineupInfo.perfectLineupUserIds.includes(user.id);
  }

  // Determine what score to display
  const displayScore = isScored && lineup.total_score !== null
    ? lineup.total_score
    : hasEstimates
    ? currentEstimatedScore
    : projectedScore;

  const scoreLabel = isScored
    ? 'Final Points'
    : hasEstimates
    ? 'Current Est.'
    : 'Proj. Points';

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-100">My Lineup</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">{contest.name}</p>
        </div>

        {/* Status - only show for non-scored contests */}
        {!isScored && (
          <div
            className={`rounded-lg border p-4 mb-6 ${
              isLocked
                ? 'bg-yellow-900/20 border-yellow-700/50'
                : 'bg-green-900/20 border-green-700/50'
            }`}
          >
            <p
              className={`font-medium ${
                isLocked
                  ? 'text-yellow-400'
                  : 'text-green-400'
              }`}
            >
              {isLocked
                ? 'Lineup Locked. Good luck!'
                : 'Lineup Submitted'}
            </p>
            {!isLocked && (
              <p className="text-sm text-green-300 mt-1">
                You can edit your lineup until the contest locks.
              </p>
            )}
            {hasEstimates && currentRank !== null && (
              <p className="text-sm text-yellow-300 mt-1">
                Current rank: #{currentRank} (based on {estimateDayLabel} estimates)
              </p>
            )}
          </div>
        )}

        {/* Rank Section - only shown for scored contests */}
        {rank !== null && totalEntries !== null && (
          <div className={`rounded-lg border p-6 mb-6 ${
            rank === 1
              ? 'bg-gradient-to-r from-[#AE7C2B]/60 via-[#F2DE7A]/40 to-[#AE7C2B]/60 border-[#F2DE7A]/70'
              : rank === 2
              ? 'bg-gradient-to-r from-[#545353]/60 via-[#FFFFFF]/30 to-[#545353]/60 border-[#FFFFFF]/50'
              : rank === 3
              ? 'bg-gradient-to-r from-[#AE492B]/60 via-[#F2BA7A]/40 to-[#AE492B]/60 border-[#F2BA7A]/70'
              : 'bg-dark-surface border-dark-border'
          }`}>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
              {/* Empty left column for alignment */}
              <div></div>
              {/* Center: Rank text */}
              <div className="text-center">
                <div className={`text-base sm:text-2xl font-bold ${
                  rank === 1
                    ? 'text-yellow-400'
                    : rank === 2
                    ? 'text-gray-300'
                    : rank === 3
                    ? 'text-orange-400'
                    : 'text-gray-100'
                }`}>
                  #{getOrdinalSuffix(rank)} place
                </div>
                <div className={`text-xs ${
                  rank === 1
                    ? 'text-yellow-500'
                    : rank === 2
                    ? 'text-gray-400'
                    : rank === 3
                    ? 'text-orange-500'
                    : 'text-gray-400'
                }`}>
                  out of {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}
                </div>
              </div>
              {/* Right: Perfect lineup badge */}
              <div className="text-center overflow-hidden">
                {isPerfectLineup && (
                  <img
                    src="/perfect-lineup-badge.png"
                    alt="Perfect Lineup"
                    title="Perfect Lineup - Achieved the maximum possible score!"
                    className="h-7 sm:h-8 w-auto mx-auto max-w-full object-contain"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Score Summary */}
        <div className="bg-dark-surface rounded-lg border border-dark-border p-6 mb-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-100">{movies.length}</div>
              <div className="text-xs text-gray-400">Movies</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-100">${totalSalary}</div>
              <div className="text-xs text-gray-400">Total Salary</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-accent">
                {displayScore.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">
                {scoreLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Movies */}
        <div className="bg-dark-surface rounded-lg border border-dark-border">
          <div className="p-4 border-b border-dark-border">
            <h2 className="font-semibold text-gray-100">Selected Movies</h2>
          </div>

          <div className="divide-y divide-dark-border">
            {[...movies]
              .sort((a, b) => {
                const movieA = Array.isArray(a.movie) ? a.movie[0] : a.movie;
                const movieB = Array.isArray(b.movie) ? b.movie[0] : b.movie;

                // Sort by current score: actual > estimate > projected
                if (isScored) {
                  return (movieB.actual_gross ?? 0) - (movieA.actual_gross ?? 0);
                }

                if (hasEstimates) {
                  const estA = calculateCurrentEstimate(movieA) ?? movieA.projected_gross;
                  const estB = calculateCurrentEstimate(movieB) ?? movieB.projected_gross;
                  return estB - estA;
                }

                return movieB.projected_gross - movieA.projected_gross;
              })
              .map((lm: LineupMovieData) => {
              const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;

              // Determine what to display based on state
              let displayValue: number;
              let displayLabel: string;
              let direction: 'uptick' | 'downtick' | 'neutral' | null = null;

              if (isScored && movie.actual_gross !== null) {
                // Final scored state
                displayValue = movie.actual_gross;
                displayLabel = 'pts';
                direction = movie.actual_gross > movie.projected_gross
                  ? 'uptick'
                  : movie.actual_gross < movie.projected_gross
                  ? 'downtick'
                  : 'neutral';
              } else if (hasEstimates) {
                // Locked with estimates
                const estimate = calculateCurrentEstimate(movie);
                displayValue = estimate ?? movie.projected_gross;
                displayLabel = 'est.';
                direction = getEstimateDirection(movie);
              } else {
                // Just projected
                displayValue = movie.projected_gross;
                displayLabel = 'proj.';
              }

              const scoreColor =
                direction === 'uptick'
                  ? 'text-green-400'
                  : direction === 'downtick'
                  ? 'text-red-400'
                  : 'text-gray-100';

              return (
                <div key={movie.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Movie Info */}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-100">{movie.title}</h3>
                      <div className="mt-1 text-xs text-gray-400 space-y-0.5">
                        <div>{new Date(movie.release_date).toLocaleDateString()}</div>
                        {movie.distributor && <div>{movie.distributor}</div>}
                        {movie.theater_count && (
                          <div>{movie.theater_count.toLocaleString()} theaters</div>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      {/* Points/Estimate - Top, largest */}
                      {(isScored || hasEstimates) ? (
                        <div className={`text-lg font-bold flex items-center justify-end gap-1 ${scoreColor}`}>
                          {direction === 'uptick' && (
                            <img src="/uptick.png" alt="" className="w-3 h-3" />
                          )}
                          {direction === 'downtick' && (
                            <img src="/downtick.png" alt="" className="w-3 h-3" />
                          )}
                          {displayValue.toFixed(2)} {displayLabel}
                        </div>
                      ) : (
                        <div className="text-lg font-bold text-gray-100">
                          {movie.projected_gross.toFixed(2)} proj.
                        </div>
                      )}
                      {/* Projection - Middle */}
                      {(isScored || hasEstimates) && (
                        <div className="text-xs text-gray-500">
                          proj: {movie.projected_gross.toFixed(2)}
                        </div>
                      )}
                      {/* Salary - Bottom, smallest */}
                      <div className="text-xs text-gray-500">${movie.salary}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="p-4 bg-dark-elevated border-t border-dark-border">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-100">Total:</span>
              <div className="text-lg font-bold text-accent">
                {isScored && lineup.total_score !== null
                  ? `${lineup.total_score.toFixed(2)} pts`
                  : hasEstimates
                  ? `${currentEstimatedScore.toFixed(2)} est.`
                  : `${projectedScore.toFixed(2)} proj.`}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          {!isLocked && (
            <Link
              href={`/contests/${contestId}/lineup`}
              className="block px-6 py-3 bg-accent text-dark-bg text-center font-medium rounded-lg hover:bg-accent-light"
            >
              Edit Lineup
            </Link>
          )}

          {contest.status === 'resolved' && (
            <Link
              href={`/contests/${contestId}/leaderboard`}
              className="block px-6 py-3 bg-dark-surface border border-dark-border text-gray-100 text-center font-medium rounded-lg hover:bg-dark-elevated"
            >
              View Leaderboard
            </Link>
          )}

          {contest.status === 'locked' && hasEstimates && (
            <Link
              href={`/contests/${contestId}/leaderboard`}
              className="block px-6 py-3 bg-dark-surface border border-dark-border text-gray-100 text-center font-medium rounded-lg hover:bg-dark-elevated"
            >
              View Current Rankings
            </Link>
          )}

          <Link
            href="/account"
            className="block text-center text-sm text-accent hover:text-accent-light"
          >
            View All My Entries &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
