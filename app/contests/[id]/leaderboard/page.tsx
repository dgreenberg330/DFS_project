// ============================================================================
// Leaderboard Page - Final and Preliminary Rankings
// ============================================================================

import { getContest } from '@/actions/contests';
import { getLeaderboard, getPerfectLineupInfo, getPreliminaryLeaderboard, getCurrentEstimateDay } from '@/actions/scoring';
import { getUser } from '@/lib/supabase-server';
import { Header } from '@/components/header';
import { BreadcrumbJsonLd } from '@/components/json-ld';
import { LeaderboardViewTracker } from '@/components/gtm-tracker';
import { LeaderboardEntry } from '@/components/leaderboard-entry';
import Link from 'next/link';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: contestId } = await params;
  const contest = await getContest(contestId);

  const isPreliminary = contest.status === 'locked';
  const title = isPreliminary
    ? `${contest.name} Current Rankings`
    : `${contest.name} Leaderboard - Results`;
  const description = isPreliminary
    ? `View current rankings for the ${contest.name} box office fantasy contest. Based on weekend estimates - final results coming soon.`
    : `View the final leaderboard and results for the ${contest.name} box office fantasy contest. See how players scored based on opening weekend gross.`;

  return {
    title,
    description,
    openGraph: {
      title: isPreliminary ? `${contest.name} Current Rankings` : `${contest.name} Leaderboard`,
      description,
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

  // For upcoming contests, show waiting message
  if (contest.status === 'upcoming') {
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
              Results will be posted after the contest locks.
            </p>
            <p className="text-sm text-yellow-800 mt-2">
              Contest status: <span className="font-medium">Open for entries</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // For locked contests, try to show preliminary leaderboard
  if (contest.status === 'locked') {
    try {
      const preliminaryData = await getPreliminaryLeaderboard(contestId);

      // If no estimates yet, show waiting message
      if (!preliminaryData.hasEstimates) {
        return (
          <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="max-w-3xl mx-auto px-4 py-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-900 font-medium mb-2">
                  Waiting for Weekend Estimates
                </p>
                <p className="text-sm text-yellow-800">
                  Check back later for preliminary rankings as box office estimates come in.
                </p>
                <p className="text-sm text-yellow-800 mt-2">
                  Contest status: <span className="font-medium">Locked, awaiting results</span>
                </p>
              </div>
            </div>
          </div>
        );
      }

      const leaderboard = preliminaryData.entries;

      // Determine which day's estimates are available
      let estimateDay: 'friday' | 'saturday' | 'weekend' = 'weekend';
      if (contest.movies && contest.movies.length > 0) {
        for (const movie of contest.movies) {
          const day = getCurrentEstimateDay(movie);
          if (day === 'sunday' || day === 'final') {
            estimateDay = 'weekend';
            break;
          } else if (day === 'saturday') {
            estimateDay = 'saturday';
          } else if (day === 'friday' && estimateDay !== 'saturday') {
            estimateDay = 'friday';
          }
        }
      }

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
              { name: 'Rankings', url: `https://shugsy.com/contests/${contestId}/leaderboard` },
            ]}
          />
          <Header />
          <main className="max-w-4xl mx-auto px-4 py-8">
            {/* Page Title - Preliminary */}
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Current Rankings</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Based on {estimateDay === 'friday' ? 'Friday' : estimateDay === 'saturday' ? 'Saturday' : 'weekend'} estimates - final results coming soon
              </p>
            </div>

            {/* Contest Info */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">{leaderboard.length}</div>
                  <div className="text-xs text-gray-600">Total Entries</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {leaderboard[0]?.currentScore?.toFixed(2) || '0.0'}
                  </div>
                  <div className="text-xs text-gray-600">Leading Score</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {userEntryIndex >= 0 ? leaderboard[userEntryIndex].rank : '-'}
                  </div>
                  <div className="text-xs text-gray-600">Your Rank</div>
                </div>
              </div>
            </div>

            {/* Preliminary Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-6">
              <p className="text-xs sm:text-sm text-blue-800 tracking-tight">
                Rankings are based on estimates and may change. Final results will be posted after the weekend.
              </p>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Rankings</h2>
              </div>

              <div className="divide-y divide-gray-200">
                {leaderboard.map((entry, index) => {
                  const lineup = Array.isArray(entry.lineup) ? entry.lineup[0] : entry.lineup;
                  const movies = lineup?.movies || [];
                  const isUserEntry = !!(user && entry.user_id === user.id);

                  return (
                    <LeaderboardEntry
                      key={entry.id}
                      rank={entry.rank ?? index + 1}
                      index={index}
                      username={entry.user.username}
                      isUserEntry={isUserEntry}
                      isPerfectLineup={false}
                      isPreliminary={true}
                      totalScore={entry.currentScore ?? 0}
                      movies={movies}
                    />
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            {user && (
              <div className="mt-6 text-right">
                <Link href="/account" className="text-sm text-blue-600 hover:text-blue-700">
                  View All My Entries &rarr;
                </Link>
              </div>
            )}
          </main>
        </div>
      );
    } catch {
      // If preliminary leaderboard fails, show waiting message
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
              <p className="text-sm text-yellow-800 mt-2">
                Contest status: <span className="font-medium">Locked, awaiting results</span>
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  // For resolved contests, show final leaderboard
  const [leaderboard, perfectLineupInfo] = await Promise.all([
    getLeaderboard(contestId),
    getPerfectLineupInfo(contestId),
  ]);

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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Final Leaderboard</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">{contest.name}</p>
        </div>

        {/* Contest Info */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{leaderboard.length}</div>
              <div className="text-xs text-gray-600">Total Entries</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {leaderboard[0]
                  ? (() => {
                      const lineup = Array.isArray(leaderboard[0].lineup)
                        ? leaderboard[0].lineup[0]
                        : leaderboard[0].lineup;
                      return lineup.total_score?.toFixed(2) || '0.0';
                    })()
                  : '0.0'}
              </div>
              <div className="text-xs text-gray-600">Winning Score</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
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
              const isUserEntry = !!(user && entry.user_id === user.id);

              const isPerfectLineup = perfectLineupInfo.perfectLineupUserIds.includes(entry.user_id);

              return (
                <LeaderboardEntry
                  key={entry.id}
                  rank={entry.rank ?? index + 1}
                  index={index}
                  username={entry.user.username}
                  isUserEntry={isUserEntry}
                  isPerfectLineup={isPerfectLineup}
                  isPreliminary={false}
                  totalScore={lineup.total_score ?? 0}
                  movies={movies}
                />
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        {user && (
          <div className="mt-6 text-right">
            <Link href="/account" className="text-sm text-blue-600 hover:text-blue-700">
              View All My Entries &rarr;
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
