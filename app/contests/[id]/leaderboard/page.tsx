// ============================================================================
// Leaderboard Page - Final Scores Only (No Live Updates)
// ============================================================================

import { getContest } from '@/actions/contests';
import { getLeaderboard } from '@/actions/scoring';
import { getUser } from '@/lib/supabase-server';
import { Header } from '@/components/header';
import { BreadcrumbJsonLd } from '@/components/json-ld';
import { LeaderboardViewTracker } from '@/components/gtm-tracker';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { Movie } from '@/types';

// Type for lineup movie with nested movie data from Supabase joins
interface LineupMovieData {
  movie: Movie | Movie[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: contestId } = await params;
  const contest = await getContest(contestId);

  return {
    title: `${contest.name} Leaderboard - Results`,
    description: `View the final leaderboard and results for the ${contest.name} box office fantasy contest. See how players scored based on opening weekend gross.`,
    openGraph: {
      title: `${contest.name} Leaderboard`,
      description: `Final results for the ${contest.name} box office fantasy contest.`,
      url: `https://www.shugsy.com/contests/${contestId}/leaderboard`,
      images: [{ url: '/shugsy-share.png', width: 1200, height: 628 }],
    },
    twitter: {
      images: [{ url: '/shugsy-share.png', width: 1200, height: 628 }],
    },
    alternates: {
      canonical: `https://www.shugsy.com/contests/${contestId}/leaderboard`,
    },
  };
}

export default async function LeaderboardPage({ params }: PageProps) {
  const { id: contestId } = await params;
  const user = await getUser();
  const contest = await getContest(contestId);

  // Only show leaderboard for resolved contests
  if (contest.status !== 'resolved') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-900 font-medium mb-2">
              Leaderboard Not Available Yet
            </p>
            <p className="text-sm text-yellow-800">
              Results will be posted after the contest is scored (Sunday night).
            </p>
            {contest.status === 'upcoming' && (
              <p className="text-sm text-yellow-800 mt-2">
                Contest status: <span className="font-medium">Open for entries</span>
              </p>
            )}
            {contest.status === 'locked' && (
              <p className="text-sm text-yellow-800 mt-2">
                Contest status: <span className="font-medium">Locked, awaiting results</span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Get leaderboard data
  const leaderboard = await getLeaderboard(contestId);

  // Find user's entry if logged in
  const userEntryIndex = user
    ? leaderboard.findIndex((entry) => entry.user_id === user.id)
    : -1;

  return (
    <div className="min-h-screen bg-gray-50">
      <LeaderboardViewTracker
        contestId={contestId}
        totalEntries={leaderboard.length}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://shugsy.com' },
          { name: contest.name, url: `https://shugsy.com/contests/${contestId}` },
          { name: 'Leaderboard', url: `https://shugsy.com/contests/${contestId}/leaderboard` },
        ]}
      />
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Final Leaderboard</h1>
          <p className="text-sm text-gray-600 mt-1">{contest.name}</p>
        </div>

        {/* Contest Info */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{leaderboard.length}</div>
              <div className="text-xs text-gray-600">Total Entries</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {leaderboard[0]
                  ? (() => {
                      const lineup = Array.isArray(leaderboard[0].lineup)
                        ? leaderboard[0].lineup[0]
                        : leaderboard[0].lineup;
                      return lineup.total_score?.toFixed(1) || '0.0';
                    })()
                  : '0.0'}
              </div>
              <div className="text-xs text-gray-600">Winning Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {userEntryIndex >= 0 ? userEntryIndex + 1 : '-'}
              </div>
              <div className="text-xs text-gray-600">Your Rank</div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Rankings</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {leaderboard.map((entry, index) => {
              const lineup = Array.isArray(entry.lineup) ? entry.lineup[0] : entry.lineup;
              const movies = lineup.movies || [];
              const isUserEntry = user && entry.user_id === user.id;

              return (
                <div
                  key={entry.id}
                  className={`p-4 ${
                    isUserEntry ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  } ${index < 3 ? 'bg-yellow-50' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-12 text-center">
                      <div
                        className={`text-2xl font-bold ${
                          index === 0
                            ? 'text-yellow-600'
                            : index === 1
                            ? 'text-gray-500'
                            : index === 2
                            ? 'text-orange-600'
                            : 'text-gray-900'
                        }`}
                      >
                        #{entry.rank}
                      </div>
                    </div>

                    {/* Entry Details */}
                    <div className="flex-1 min-w-0">
                      {/* User */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {isUserEntry ? 'You' : entry.user.username}
                        </span>
                        {isUserEntry && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Your Entry
                          </span>
                        )}
                      </div>

                      {/* Movies */}
                      <div className="space-y-1">
                        {movies.map((lm: LineupMovieData) => {
                          const movie = Array.isArray(lm.movie) ? lm.movie[0] : lm.movie;
                          return (
                            <div
                              key={movie.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-gray-700 truncate">{movie.title}</span>
                              <span className="text-gray-600 flex-shrink-0 ml-2">
                                {movie.actual_gross?.toFixed(1)}M
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-blue-600">
                        {lineup.total_score?.toFixed(1) || '0.0'}
                      </div>
                      <div className="text-xs text-gray-600">points</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        {user && (
          <div className="mt-6 text-right">
            <Link href="/account" className="text-sm text-blue-600 hover:text-blue-700">
              View All My Entries →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
