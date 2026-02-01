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
import { Header } from '@/components/header';
import { FriendsSection } from '@/components/friends-section';
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

  // Fetch user profile - may be null if profile creation failed
  const profile = await getUserProfile();

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
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Account Header */}
        <div className="bg-dark-elevated rounded-lg border border-dark-border p-6 mb-6">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Account</h1>
            {profile && (
              <p className="text-base sm:text-lg text-gray-300">@{profile.username}</p>
            )}
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
        </div>

        {/* Friends Section */}
        <div className="mb-6">
          <FriendsSection />
        </div>

        {/* Active Contests */}
        {activeEntries.length > 0 && (
          <div className="bg-dark-surface rounded-lg border border-dark-border mb-6">
            <div className="p-4 sm:p-6 border-b border-dark-border bg-dark-elevated rounded-t-lg">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-100">Active Contests</h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">In progress or awaiting results</p>
            </div>

            <div className="divide-y divide-dark-border">
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
                  // Check all movies for estimates
                  for (const lm of movies) {
                    const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
                    if (movie && getCurrentEstimateDay(movie) !== 'none') {
                      hasEstimates = true;
                      break;
                    }
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
                    className="block p-4 sm:p-6 hover:bg-dark-elevated transition-colors"
                  >
                    {/* Status Badge */}
                    <div className="mb-2">
                      {contest.status === 'upcoming' && (
                        <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded">
                          Open
                        </span>
                      )}
                      {contest.status === 'locked' && (
                        <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded">
                          Locked
                        </span>
                      )}
                    </div>

                    {/* Contest Info - Two rows for alignment */}
                    <div className="mb-4 space-y-1">
                      {/* Row 1: Title + Points */}
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-100 min-w-0 truncate">{contest.name}</h3>
                        <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-accent flex-shrink-0">
                          {displayScore.toFixed(2)} pts
                        </span>
                      </div>
                      {/* Row 2: Date + Score label */}
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs sm:text-sm md:text-sm text-gray-400">
                          {new Date(contest.weekend_start + 'T00:00:00').toLocaleDateString()} -{' '}
                          {new Date(contest.weekend_end + 'T00:00:00').toLocaleDateString()}
                        </p>
                        <span className="text-xs sm:text-sm text-gray-400 flex-shrink-0">{scoreLabel}</span>
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
                            ? 'text-green-400'
                            : direction === 'downtick'
                            ? 'text-red-400'
                            : 'text-gray-400';

                        return (
                          <div
                            key={movie.id}
                            className="flex items-start justify-between gap-2 text-xs sm:text-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-gray-200">{movie.title}</span>
                            </div>
                            <div className={`flex-shrink-0 text-right flex items-center justify-end gap-1 ${scoreColor}`}>
                              {direction === 'uptick' && (
                                <img src="/uptick.png" alt="" className="w-2.5 h-2.5" />
                              )}
                              {direction === 'downtick' && (
                                <img src="/downtick.png" alt="" className="w-2.5 h-2.5" />
                              )}
                              <span>{displayValue.toFixed(2)} pts</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action hint */}
                    <div className="mt-2 text-xs sm:text-sm text-accent">
                      {isLocked ? 'View lineup →' : 'Edit lineup →'}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Past Results */}
        <div className="bg-dark-surface rounded-lg border border-dark-border">
          <div className="p-4 sm:p-6 border-b border-dark-border bg-dark-elevated rounded-t-lg">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-100">Past Contests</h2>
          </div>

          {pastEntries.length === 0 && activeEntries.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <p>No past contests yet.</p>
              <p className="text-sm mt-2">Enter your first contest to see results here!</p>
            </div>
          ) : pastEntries.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <p>No completed contests yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-border">
              {pastEntries.map((entry) => {
                // Handle nested lineup structure
                const lineup = Array.isArray(entry.lineup) ? entry.lineup[0] : entry.lineup;
                const contest = Array.isArray(entry.contest) ? entry.contest[0] : entry.contest;
                const movies = lineup.movies || [];

                return (
                  <Link
                    key={entry.id}
                    href={`/contests/${contest.id}/my-lineup`}
                    className="block p-4 sm:p-6 hover:bg-dark-elevated transition-colors"
                  >
                    {/* Contest Info - Two rows for alignment */}
                    <div className="mb-4 space-y-1">
                      {/* Row 1: Title + Points */}
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-100 min-w-0 truncate">{contest.name}</h3>
                        {lineup.status === 'scored' && lineup.total_score !== null ? (
                          <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-accent flex-shrink-0">
                            {lineup.total_score.toFixed(2)} pts
                          </span>
                        ) : (
                          <span className="text-xs sm:text-sm md:text-base text-gray-400 flex-shrink-0">Awaiting results</span>
                        )}
                      </div>
                      {/* Row 2: Date + Rank */}
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs sm:text-sm md:text-sm text-gray-400">
                          {new Date(contest.weekend_start + 'T00:00:00').toLocaleDateString()} -{' '}
                          {new Date(contest.weekend_end + 'T00:00:00').toLocaleDateString()}
                        </p>
                        {lineup.status === 'scored' && entry.rank && (
                          <span className="text-xs sm:text-sm md:text-sm text-gray-400 flex-shrink-0">
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
                              <span className="font-medium text-gray-200">{movie.title}</span>
                            </div>
                            <div className="flex-shrink-0 text-gray-400 text-right whitespace-nowrap">
                              {movie.actual_gross !== null ? (
                                <span>{movie.actual_gross.toFixed(2)} pts</span>
                              ) : (
                                <span>${movie.salary}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* View link */}
                    <div className="mt-2 text-xs sm:text-sm text-accent">View details &rarr;</div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats Summary (if has entries) */}
        {allEntries.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4">
            <div className="bg-dark-surface rounded-lg border border-dark-border p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-gray-100">{allEntries.length}</div>
              <div className="text-xs sm:text-sm text-gray-400">Total Contests</div>
            </div>
            <div className="bg-dark-surface rounded-lg border border-dark-border p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-gray-100">
                {allEntries.filter((e) => {
                  const lineup = Array.isArray(e.lineup) ? e.lineup[0] : e.lineup;
                  return lineup.status === 'scored';
                }).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-400">Completed</div>
            </div>
            <div className="bg-dark-surface rounded-lg border border-dark-border p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-gray-100">
                {allEntries.filter((e) => e.rank === 1).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-400">Wins</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
