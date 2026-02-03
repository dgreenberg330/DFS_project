// ============================================================================
// Leaderboard Page - Final and Preliminary Rankings
// ============================================================================

import { getContest } from '@/actions/contests';
import { getLeaderboard, getPerfectLineupInfo, getPreliminaryLeaderboard, getCurrentEstimateDay } from '@/actions/scoring';
import { getFriendIds } from '@/actions/friends';
import { getUser } from '@/lib/supabase-server';
import { Header } from '@/components/header';
import { BreadcrumbJsonLd } from '@/components/json-ld';
import { LeaderboardViewTracker } from '@/components/gtm-tracker';
import { LeaderboardEntry } from '@/components/leaderboard-entry';
import { LeaderboardTabs } from '@/components/leaderboard-tabs';
import Link from 'next/link';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
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
      images: [{ url: 'https://i.imgur.com/2xJ0DV8.png', width: 1200, height: 628 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: {
        url: 'https://i.imgur.com/2xJ0DV8.png',
        type: 'image/png',
        width: 1200,
        height: 628,
      },
    },
    alternates: {
      canonical: `https://www.shugsy.com/contests/${contestId}/leaderboard`,
    },
  };
}

export default async function LeaderboardPage({ params, searchParams }: PageProps) {
  const { id: contestId } = await params;
  const { filter } = await searchParams;
  const user = await getUser();
  const contest = await getContest(contestId);

  // Get friend IDs for filtering (only if user is logged in)
  const friendIds = user ? await getFriendIds() : [];
  const showFriendsOnly = filter === 'friends' && user;

  // Count friends who entered this contest (calculated after we get the leaderboard)
  let friendsInContest = 0;

  // For upcoming contests, show waiting message
  if (contest.status === 'upcoming') {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-100">Leaderboard</h1>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 text-center">
            <p className="text-yellow-400 font-medium mb-2">
              Leaderboard Not Available Yet
            </p>
            <p className="text-sm text-yellow-300/80">
              Results will be posted after the contest locks.
            </p>
            <p className="text-sm text-yellow-300/80 mt-2">
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
          <div className="min-h-screen bg-dark-bg">
            <Header />
            <div className="max-w-3xl mx-auto px-4 py-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-100">Leaderboard</h1>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 text-center">
                <p className="text-yellow-400 font-medium mb-2">
                  Waiting for Weekend Estimates
                </p>
                <p className="text-sm text-yellow-300/80">
                  Check back later for preliminary rankings as box office estimates come in.
                </p>
                <p className="text-sm text-yellow-300/80 mt-2">
                  Contest status: <span className="font-medium">Locked, awaiting results</span>
                </p>
              </div>
            </div>
          </div>
        );
      }

      const fullLeaderboard = preliminaryData.entries;

      // Count friends in contest
      friendsInContest = fullLeaderboard.filter((entry) =>
        friendIds.includes(entry.user_id)
      ).length;

      // Filter leaderboard if showing friends only
      const leaderboard = showFriendsOnly
        ? fullLeaderboard.filter((entry) =>
            entry.user_id === user?.id || friendIds.includes(entry.user_id)
          )
        : fullLeaderboard;

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
        <div className="min-h-screen bg-dark-bg">
          <LeaderboardViewTracker
            contestId={contestId}
            totalEntries={leaderboard.length}
          />
          <BreadcrumbJsonLd
            items={[
              { name: 'Home', url: 'https://www.shugsy.com' },
              { name: contest.name, url: `https://www.shugsy.com/contests/${contestId}` },
              { name: 'Rankings', url: `https://www.shugsy.com/contests/${contestId}/leaderboard` },
            ]}
          />
          <Header />
          <main className="max-w-4xl mx-auto px-4 py-8">
            {/* Page Title - Preliminary */}
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Current Rankings</h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Based on {estimateDay === 'friday' ? 'Friday' : estimateDay === 'saturday' ? 'Saturday' : 'weekend'} estimates - final results coming soon
              </p>
            </div>

            {/* Contest Info */}
            <div className="bg-dark-surface rounded-lg border border-dark-border p-4 mb-6">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-100">{leaderboard.length}</div>
                  <div className="text-xs text-gray-400">Total Entries</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-accent">
                    {leaderboard[0]?.currentScore?.toFixed(2) || '0.0'}
                  </div>
                  <div className="text-xs text-gray-400">Leading Score</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-100">
                    {userEntryIndex >= 0 ? leaderboard[userEntryIndex].rank : '-'}
                  </div>
                  <div className="text-xs text-gray-400">Your Rank</div>
                </div>
              </div>
            </div>

            {/* Preliminary Notice */}
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 sm:p-4 mb-6">
              <p className="text-xs sm:text-sm text-accent/90 tracking-tight">
                Rankings are based on estimates and may change. Final results will be posted after the weekend.
              </p>
            </div>

            {/* Leaderboard Tabs (only show if user is logged in) */}
            {user && (
              <LeaderboardTabs contestId={contestId} friendCount={friendsInContest} />
            )}

            {/* Leaderboard */}
            <div className="bg-dark-surface rounded-lg border border-dark-border">
              <div className="p-4 border-b border-dark-border">
                <h2 className="font-semibold text-gray-100">
                  {showFriendsOnly ? 'Friends Rankings' : 'Rankings'}
                </h2>
              </div>

              {showFriendsOnly && leaderboard.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  <p>No friends entered this contest.</p>
                  <p className="text-sm mt-1">Add friends on your account page to see them here.</p>
                </div>
              ) : (
                <div className="divide-y divide-dark-border">
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
              )}
            </div>

            {/* Navigation */}
            {user && (
              <div className="mt-6 text-right">
                <Link href="/account" className="text-sm text-accent hover:text-accent-light">
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
        <div className="min-h-screen bg-dark-bg">
          <Header />
          <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-100">Leaderboard</h1>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 text-center">
              <p className="text-yellow-400 font-medium mb-2">
                Leaderboard Not Available Yet
              </p>
              <p className="text-sm text-yellow-300/80">
                Results will be posted after the contest is scored (Sunday night).
              </p>
              <p className="text-sm text-yellow-300/80 mt-2">
                Contest status: <span className="font-medium">Locked, awaiting results</span>
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  // For resolved contests, show final leaderboard
  const [fullLeaderboard, perfectLineupInfo] = await Promise.all([
    getLeaderboard(contestId),
    getPerfectLineupInfo(contestId),
  ]);

  // Count friends in contest
  friendsInContest = fullLeaderboard.filter((entry) =>
    friendIds.includes(entry.user_id)
  ).length;

  // Filter leaderboard if showing friends only
  const leaderboard = showFriendsOnly
    ? fullLeaderboard.filter((entry) =>
        entry.user_id === user?.id || friendIds.includes(entry.user_id)
      )
    : fullLeaderboard;

  // Find user's entry if logged in
  const userEntryIndex = user
    ? leaderboard.findIndex((entry) => entry.user_id === user.id)
    : -1;

  return (
    <div className="min-h-screen bg-dark-bg">
      <LeaderboardViewTracker
        contestId={contestId}
        totalEntries={leaderboard.length}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.shugsy.com' },
          { name: contest.name, url: `https://www.shugsy.com/contests/${contestId}` },
          { name: 'Leaderboard', url: `https://www.shugsy.com/contests/${contestId}/leaderboard` },
        ]}
      />
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Final Leaderboard</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">{contest.name}</p>
        </div>

        {/* Contest Info */}
        <div className="bg-dark-surface rounded-lg border border-dark-border p-4 mb-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-100">{leaderboard.length}</div>
              <div className="text-xs text-gray-400">Total Entries</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-accent">
                {leaderboard[0]
                  ? (() => {
                      const lineup = Array.isArray(leaderboard[0].lineup)
                        ? leaderboard[0].lineup[0]
                        : leaderboard[0].lineup;
                      return lineup.total_score?.toFixed(2) || '0.0';
                    })()
                  : '0.0'}
              </div>
              <div className="text-xs text-gray-400">Winning Score</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-gray-100">
                {userEntryIndex >= 0 ? userEntryIndex + 1 : '-'}
              </div>
              <div className="text-xs text-gray-400">Your Rank</div>
            </div>
          </div>
        </div>

        {/* Leaderboard Tabs (only show if user is logged in) */}
        {user && (
          <LeaderboardTabs contestId={contestId} friendCount={friendsInContest} />
        )}

        {/* Leaderboard */}
        <div className="bg-dark-surface rounded-lg border border-dark-border">
          <div className="p-4 border-b border-dark-border">
            <h2 className="font-semibold text-gray-100">
              {showFriendsOnly ? 'Friends Rankings' : 'Rankings'}
            </h2>
          </div>

          {showFriendsOnly && leaderboard.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <p>No friends entered this contest.</p>
              <p className="text-sm mt-1">Add friends on your account page to see them here.</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-border">
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
          )}
        </div>

        {/* Navigation */}
        {user && (
          <div className="mt-6 text-right">
            <Link href="/account" className="text-sm text-accent hover:text-accent-light">
              View All My Entries &rarr;
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
