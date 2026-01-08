// ============================================================================
// Account Page - User Profile and Past Results
// ============================================================================

import { getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getPastEntries } from '@/actions/account';
import { getUserProfile } from '@/actions/user-profiles';
import { SignOutButton } from '@/components/sign-out-button';
import Link from 'next/link';

export default async function AccountPage() {
  // Require authentication
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch user profile and past contest entries
  const profile = await getUserProfile();
  const allEntries = await getPastEntries();

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back to Home Link */}
        <Link
          href="/"
          className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account</h1>
              {profile && (
                <p className="text-lg text-gray-700 mt-1">@{profile.username}</p>
              )}
              <p className="text-sm text-gray-600 mt-1">{user.email}</p>
            </div>
            <div className="space-y-2">
              <Link
                href="/account/edit-username"
                className="block text-sm text-blue-600 hover:text-blue-700"
              >
                Edit Username
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>

        {/* Active Contests */}
        {activeEntries.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Active Contests</h2>
              <p className="text-sm text-gray-600 mt-1">In progress or awaiting results</p>
            </div>

            <div className="divide-y divide-gray-200">
              {activeEntries.map((entry) => {
                const lineup = Array.isArray(entry.lineup) ? entry.lineup[0] : entry.lineup;
                const contest = Array.isArray(entry.contest) ? entry.contest[0] : entry.contest;
                const movies = lineup.movies || [];

                // Calculate projected score
                const projectedScore = movies.reduce((sum: number, lm: any) => {
                  const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
                  return sum + (movie.projected_gross || 0);
                }, 0);

                const isLocked = contest.status !== 'upcoming' || lineup.status !== 'editable';

                return (
                  <Link
                    key={entry.id}
                    href={
                      isLocked
                        ? `/contests/${contest.id}/my-lineup`
                        : `/contests/${contest.id}/lineup`
                    }
                    className="block p-6 hover:bg-gray-50 transition-colors"
                  >
                    {/* Contest Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{contest.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-gray-600">
                            {new Date(contest.weekend_start).toLocaleDateString()} -{' '}
                            {new Date(contest.weekend_end).toLocaleDateString()}
                          </p>
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
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {projectedScore.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600">Projected pts</div>
                      </div>
                    </div>

                    {/* Lineup Movies */}
                    <div className="space-y-2">
                      {movies.map((lm: any) => {
                        const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
                        return (
                          <div
                            key={movie.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">{movie.title}</span>
                              <span className="text-gray-500 ml-2">${movie.salary}</span>
                            </div>
                            <div className="text-gray-600">
                              Proj: {movie.projected_gross.toFixed(1)}M
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total Salary */}
                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Total Salary:</span>
                        <span>
                          $
                          {movies.reduce((sum: number, lm: any) => {
                            const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
                            return sum + movie.salary;
                          }, 0)}
                        </span>
                      </div>
                    </div>

                    {/* Action hint */}
                    <div className="mt-3 text-sm text-blue-600">
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
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Past Contests</h2>
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
                    className="block p-6 hover:bg-gray-50 transition-colors"
                  >
                    {/* Contest Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{contest.name}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(contest.weekend_start).toLocaleDateString()} -{' '}
                          {new Date(contest.weekend_end).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        {lineup.status === 'scored' && lineup.total_score !== null ? (
                          <>
                            <div className="text-2xl font-bold text-blue-600">
                              {lineup.total_score.toFixed(1)} pts
                            </div>
                            {entry.rank && (
                              <div className="text-sm text-gray-600">Rank #{entry.rank}</div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-gray-600">Awaiting results</div>
                        )}
                      </div>
                    </div>

                    {/* Lineup Movies */}
                    <div className="space-y-2">
                      {movies.map((lm: any) => {
                        const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
                        return (
                          <div
                            key={movie.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">{movie.title}</span>
                              <span className="text-gray-500 ml-2">${movie.salary}</span>
                            </div>
                            {movie.actual_gross !== null && (
                              <div className="text-gray-600">
                                ${movie.actual_gross.toFixed(1)}M (
                                {movie.actual_gross.toFixed(1)} pts)
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Total Salary */}
                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Total Salary:</span>
                        <span>
                          $
                          {movies.reduce((sum: number, lm: any) => {
                            const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
                            return sum + movie.salary;
                          }, 0)}
                        </span>
                      </div>
                    </div>

                    {/* View link */}
                    <div className="mt-3 text-sm text-blue-600">View details →</div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats Summary (if has entries) */}
        {allEntries.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{allEntries.length}</div>
              <div className="text-sm text-gray-600">Total Contests</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {allEntries.filter((e) => {
                  const lineup = Array.isArray(e.lineup) ? e.lineup[0] : e.lineup;
                  return lineup.status === 'scored';
                }).length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {allEntries.filter((e) => e.rank === 1).length}
              </div>
              <div className="text-sm text-gray-600">Wins</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
