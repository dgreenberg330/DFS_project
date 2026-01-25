// ============================================================================
// Account Page - User Profile and Past Results
// ============================================================================

import { getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getPastEntries } from '@/actions/account';
import { getUserProfile } from '@/actions/user-profiles';
import {
  getCurrentEstimateDay,
  calculateCurrentEstimate,
  getEstimateDirection,
} from '@/actions/scoring';
import { SignOutButton } from '@/components/sign-out-button';
import { Header } from '@/components/header';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { Movie, Contest, Lineup, Entry } from '@/types';

// Type for lineup movie with nested movie data from Supabase joins
interface LineupMovieData {
  movie: Movie | Movie[];
}

// Type for entry data from getPastEntries
interface EntryData extends Entry {
  lineup: (Lineup & { movies: LineupMovieData[] }) | (Lineup & { movies: LineupMovieData[] })[];
  contest: Contest | Contest[];
  rank?: number;
  totalEntries?: number;
}

export const metadata: Metadata = {
  title: 'My Account',
  description: 'View your Shugsy account, past contest entries, rankings, and stats. Track your box office fantasy sports performance.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountPage() {
  // Require authentication
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch user profile - if it fails or returns null, redirect to setup
  const profile = await getUserProfile();
  if (!profile) {
    redirect('/setup-username');
  }

  // Fetch past contest entries with error handling
  let allEntries: EntryData[] = [];
  try {
    allEntries = await getPastEntries();
  } catch (error) {
    console.error('Error loading entries:', error);
    allEntries = [];
  }

  // Defensive check: ensure allEntries is an array
  const entries = Array.isArray(allEntries) ? allEntries : [];

  // Separate active and past contests
  const activeEntries = entries.filter((entry) => {
    // Defensive check: ensure entry has contest
    if (!entry.contest) return false;
    const contest = Array.isArray(entry.contest) ? entry.contest[0] : entry.contest;
    return contest && contest.status !== 'resolved';
  });

  const pastEntries = entries.filter((entry) => {
    // Defensive check: ensure entry has contest
    if (!entry.contest) return false;
    const contest = Array.isArray(entry.contest) ? entry.contest[0] : entry.contest;
    return contest && contest.status === 'resolved';
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Account Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Account</h1>
              <SignOutButton />
            </div>
            {profile && (
              <div className="flex items-center justify-between">
                <p className="text-base sm:text-lg text-gray-700">@{profile.username}</p>
                <Link
                  href="/account/edit-username"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Edit Username
                </Link>
              </div>
            )}
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>

        {/* Active Contests */}
        {activeEntries.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Active Contests</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">In progress or awaiting results</p>
            </div>

            <div className="divide-y divide-gray-200">
              {activeEntries.map((entry) => {
                const lineup = Array.isArray(entry.lineup) ? entry.lineup[0] : entry.lineup;
                const contest = Array.isArray(entry.contest) ? entry.contest[0] : entry.contest;
                const movies = lineup.movies || [];

                // Calculate projected score
                const projectedScore = movies.reduce((sum: number, lm: LineupMovieData) => {
                  const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
                  return sum + (movie.projected_gross || 0);
                }, 0);

                const isLocked = contest.status !== 'upcoming' || lineup.status !== 'editable';

                // Check if we have estimates for locked contests
                let hasEstimates = false;
                let currentEstimatedScore = projectedScore;

                if (contest.status === 'locked') {
                  const firstMovie = movies[0] ? (Array.isArray(movies[0].movie) ? movies[0].movie[0] : movies[0].movie) : null;
                  if (firstMovie) {
                    const estimateDay = getCurrentEstimateDay(firstMovie);
                    hasEstimates = estimateDay !== 'none';
                  }

                  if (hasEstimates) {
                    currentEstimatedScore = movies.reduce((sum: number, lm: LineupMovieData) => {
                      const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
                      const estimate = calculateCurrentEstimate(movie);
                      return sum + (estimate ?? movie.projected_gross);
                    }, 0);
                  }
                }

                const displayScore = hasEstimates ? currentEstimatedScore : projectedScore;
                const scoreLabel = hasEstimates ? 'Current est.' : 'Projected pts';

                return (
                  <Link
                    key={entry.id}
                    href={
                      isLocked
                        ? `/contests/${contest.id}/my-lineup`
                        : `/contests/${contest.id}/lineup`
                    }
                    className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                  >
                    {/* Status Badge */}
                    <div className="mb-2">
                      {contest.status === 'upcoming' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Open
                        </span>
                      )}
                      {contest.status === 'locked' && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                          Locked
                        </span>
                      )}
                    </div>

                    {/* Contest Info - Two rows for alignment */}
                    <div className="mb-4 space-y-1">
                      {/* Row 1: Title + Points */}
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-900 min-w-0 truncate">{contest.name}</h3>
                        <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-blue-600 flex-shrink-0">
                          {displayScore.toFixed(1)} pts
                        </span>
                      </div>
                      {/* Row 2: Date + Score label */}
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs sm:text-sm md:text-sm text-gray-500">
                          {new Date(contest.weekend_start + 'T00:00:00').toLocaleDateString()} -{' '}
                          {new Date(contest.weekend_end + 'T00:00:00').toLocaleDateString()}
                        </p>
                        <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">{scoreLabel}</span>
                      </div>
                    </div>

                    {/* Lineup Movies */}
                    <div className="space-y-1">
                      {[...movies]
                        .sort((a, b) => {
                          const movieA = Array.isArray(a.movie) ? a.movie[0] : a.movie;
                          const movieB = Array.isArray(b.movie) ? b.movie[0] : b.movie;

                          if (hasEstimates) {
                            const estA = calculateCurrentEstimate(movieA) ?? movieA.projected_gross;
                            const estB = calculateCurrentEstimate(movieB) ?? movieB.projected_gross;
                            return estB - estA;
                          }
                          return movieB.projected_gross - movieA.projected_gross;
                        })
                        .map((lm: LineupMovieData) => {
                        const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
                        const direction = hasEstimates ? getEstimateDirection(movie) : null;
                        const displayValue = hasEstimates
                          ? calculateCurrentEstimate(movie) ?? movie.projected_gross
                          : movie.projected_gross;

                        const scoreColor =
                          direction === 'uptick'
                            ? 'text-green-600'
                            : direction === 'downtick'
                            ? 'text-red-600'
                            : 'text-gray-600';

                        return (
                          <div
                            key={movie.id}
                            className="flex items-start justify-between gap-2 text-xs sm:text-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-gray-900">{movie.title}</span>
                            </div>
                            <div className={`flex-shrink-0 w-20 text-right flex items-center justify-end gap-1 ${scoreColor}`}>
                              {direction === 'uptick' && (
                                <img src="/uptick.png" alt="" className="w-2.5 h-2.5" />
                              )}
                              {direction === 'downtick' && (
                                <img src="/downtick.png" alt="" className="w-2.5 h-2.5" />
                              )}
                              {hasEstimates ? (
                                <span>{displayValue.toFixed(1)}</span>
                              ) : (
                                <span>${movie.salary}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action hint */}
                    <div className="mt-2 text-xs sm:text-sm text-blue-600">
                      {isLocked ? 'View lineup →' : 'Edit lineup →'}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Past Results */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Past Contests</h2>
          </div>

          {pastEntries.length === 0 && activeEntries.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No past contests yet.</p>
              <p className="text-sm mt-2">Enter your first contest to see results here!</p>
            </div>
          ) : pastEntries.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No completed contests yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pastEntries.map((entry) => {
                // Handle nested lineup structure
                const lineup = Array.isArray(entry.lineup) ? entry.lineup[0] : entry.lineup;
                const contest = Array.isArray(entry.contest) ? entry.contest[0] : entry.contest;
                const movies = lineup.movies || [];

                return (
                  <Link
                    key={entry.id}
                    href={`/contests/${contest.id}/my-lineup`}
                    className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                  >
                    {/* Contest Info - Two rows for alignment */}
                    <div className="mb-4 space-y-1">
                      {/* Row 1: Title + Points */}
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-900 min-w-0 truncate">{contest.name}</h3>
                        {lineup.status === 'scored' && lineup.total_score !== null ? (
                          <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-blue-600 flex-shrink-0">
                            {lineup.total_score.toFixed(1)} pts
                          </span>
                        ) : (
                          <span className="text-xs sm:text-sm md:text-base text-gray-600 flex-shrink-0">Awaiting results</span>
                        )}
                      </div>
                      {/* Row 2: Date + Rank */}
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs sm:text-sm md:text-sm text-gray-500">
                          {new Date(contest.weekend_start + 'T00:00:00').toLocaleDateString()} -{' '}
                          {new Date(contest.weekend_end + 'T00:00:00').toLocaleDateString()}
                        </p>
                        {lineup.status === 'scored' && entry.rank && (
                          <span className="text-xs sm:text-sm md:text-sm text-gray-600 flex-shrink-0">
                            Rank: #{entry.rank}{entry.totalEntries && ` of ${entry.totalEntries}`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Lineup Movies - sorted by points (highest first) */}
                    <div className="space-y-1">
                      {[...movies]
                        .sort((a, b) => {
                          const movieA = Array.isArray(a.movie) ? a.movie[0] : a.movie;
                          const movieB = Array.isArray(b.movie) ? b.movie[0] : b.movie;
                          return (movieB.actual_gross ?? 0) - (movieA.actual_gross ?? 0);
                        })
                        .map((lm: LineupMovieData) => {
                        const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
                        return (
                          <div
                            key={movie.id}
                            className="flex items-start justify-between gap-2 text-xs sm:text-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-gray-900">{movie.title}</span>
                            </div>
                            <div className="flex-shrink-0 text-gray-600 w-14 text-right">
                              {movie.actual_gross !== null ? (
                                <span>{movie.actual_gross.toFixed(1)} pts</span>
                              ) : (
                                <span>${movie.salary}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* View link */}
                    <div className="mt-2 text-xs sm:text-sm text-blue-600">View details &rarr;</div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats Summary (if has entries) */}
        {allEntries.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4">
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{allEntries.length}</div>
              <div className="text-xs sm:text-sm text-gray-600">Total Contests</div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {allEntries.filter((e) => {
                  const lineup = Array.isArray(e.lineup) ? e.lineup[0] : e.lineup;
                  return lineup.status === 'scored';
                }).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {allEntries.filter((e) => e.rank === 1).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Wins</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
