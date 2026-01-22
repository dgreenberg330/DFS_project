// ============================================================================
// My Lineup Page - Locked View After Submission
// ============================================================================

import { getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getContest } from '@/actions/contests';
import { getUserEntry } from '@/actions/lineups';
import { getPerfectLineupInfo } from '@/actions/scoring';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Lineup</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">{contest.name}</p>
        </div>

        {/* Status */}
        <div
          className={`rounded-lg border p-4 mb-6 ${
            isScored
              ? 'bg-blue-50 border-blue-200'
              : isLocked
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-green-50 border-green-200'
          }`}
        >
          <p
            className={`font-medium ${
              isScored
                ? 'text-blue-900'
                : isLocked
                ? 'text-yellow-900'
                : 'text-green-900'
            }`}
          >
            {isScored
              ? 'Final Results'
              : isLocked
              ? 'Lineup Locked. Good luck!'
              : 'Lineup Submitted'}
          </p>
          {!isLocked && (
            <p className="text-sm text-green-800 mt-1">
              You can edit your lineup until the contest locks.
            </p>
          )}
        </div>

        {/* Rank Section - only shown for scored contests */}
        {rank !== null && totalEntries !== null && (
          <div className={`rounded-lg shadow-md border p-6 mb-6 ${
            rank === 1
              ? 'bg-yellow-100 border-yellow-400'
              : rank === 2
              ? 'bg-gray-100 border-gray-400'
              : rank === 3
              ? 'bg-[#CE894640] border-[#CE8946]'
              : 'bg-slate-100 border-slate-300'
          }`}>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
              {/* Empty left column for alignment */}
              <div></div>
              {/* Center: Rank text */}
              <div className="text-center">
                <div className={`text-base sm:text-2xl font-bold ${
                  rank === 1
                    ? 'text-yellow-700'
                    : rank === 2
                    ? 'text-gray-600'
                    : rank === 3
                    ? 'text-[#8B5A2B]'
                    : 'text-slate-700'
                }`}>
                  #{getOrdinalSuffix(rank)} place
                </div>
                <div className={`text-xs ${
                  rank === 1
                    ? 'text-yellow-600'
                    : rank === 2
                    ? 'text-gray-500'
                    : rank === 3
                    ? 'text-[#CE8946]'
                    : 'text-slate-500'
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
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{movies.length}</div>
              <div className="text-xs text-gray-600">Movies</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">${totalSalary}</div>
              <div className="text-xs text-gray-600">Total Salary</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {isScored && lineup.total_score !== null
                  ? lineup.total_score.toFixed(1)
                  : projectedScore.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">
                {isScored ? 'Final Points' : 'Proj. Points'}
              </div>
            </div>
          </div>
        </div>

        {/* Movies */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Selected Movies</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {movies.map((lm: LineupMovieData) => {
              const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
              return (
                <div key={movie.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Movie Info */}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{movie.title}</h3>
                      <div className="mt-1 text-xs text-gray-600 space-y-0.5">
                        <div>{new Date(movie.release_date).toLocaleDateString()}</div>
                        {movie.distributor && <div>{movie.distributor}</div>}
                        {movie.theater_count && (
                          <div>{movie.theater_count.toLocaleString()} theaters</div>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-gray-900">${movie.salary}</div>
                      {(isLocked || isScored) && movie.actual_gross !== null ? (
                        <>
                          <div className={`text-sm font-medium flex items-center justify-end gap-1 ${
                            movie.actual_gross > movie.projected_gross
                              ? 'text-green-600'
                              : movie.actual_gross < movie.projected_gross
                              ? 'text-red-600'
                              : 'text-gray-900'
                          }`}>
                            {movie.actual_gross > movie.projected_gross && (
                              <img src="/uptick.png" alt="" className="w-3 h-3" />
                            )}
                            {movie.actual_gross < movie.projected_gross && (
                              <img src="/downtick.png" alt="" className="w-3 h-3" />
                            )}
                            {movie.actual_gross.toFixed(1)} pts
                          </div>
                          <div className="text-xs text-gray-500">
                            Proj: {movie.projected_gross.toFixed(1)}M
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-600">
                          Proj: {movie.projected_gross.toFixed(1)}M
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Total:</span>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">${totalSalary}</div>
                <div className="text-sm text-blue-600 font-medium">
                  {isScored && lineup.total_score !== null
                    ? `${lineup.total_score.toFixed(1)} pts`
                    : `Proj: ${projectedScore.toFixed(1)} pts`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          {!isLocked && (
            <Link
              href={`/contests/${contestId}/lineup`}
              className="block px-6 py-3 bg-blue-600 text-white text-center font-medium rounded-lg hover:bg-blue-700"
            >
              Edit Lineup
            </Link>
          )}

          {contest.status === 'resolved' && (
            <Link
              href={`/contests/${contestId}/leaderboard`}
              className="block px-6 py-3 bg-white border border-gray-300 text-gray-700 text-center font-medium rounded-lg hover:bg-gray-50"
            >
              View Leaderboard
            </Link>
          )}

          <Link
            href="/account"
            className="block text-center text-sm text-blue-600 hover:text-blue-700"
          >
            View All My Entries →
          </Link>
        </div>
      </div>
    </div>
  );
}
