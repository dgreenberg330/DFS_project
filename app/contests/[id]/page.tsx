// ============================================================================
// Contest Page - Rules, Entry Count, Countdown
// ============================================================================

import { getContest } from '@/actions/contests';
import { getUser, createClient } from '@/lib/supabase-server';
import { getUserEntry } from '@/actions/lineups';
import { getPreliminaryLeaderboard, getCurrentEstimateDay } from '@/actions/scoring';
import { ExpandableMovieList } from '@/components/expandable-movie-list';
import { Header } from '@/components/header';
import { ContestEventJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';
import { ContestViewTracker } from '@/components/gtm-tracker';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { Movie } from '@/types';
import type { ContestStatus } from '@/lib/gtm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: contestId } = await params;
  const contest = await getContest(contestId);

  const movieNames = contest.movies?.slice(0, 3).map((m: Movie) => m.title).join(', ') || '';
  const description = `Enter the ${contest.name} box office fantasy contest. Pick movies like ${movieNames} and compete on opening weekend gross. Free to play!`;

  return {
    title: contest.name,
    description,
    openGraph: {
      title: `${contest.name} - Box Office Fantasy Contest`,
      description,
      url: `https://www.shugsy.com/contests/${contestId}`,
      images: [{ url: 'https://i.imgur.com/FO942Hj.png', width: 1200, height: 628 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: {
        url: 'https://i.imgur.com/FO942Hj.png',
        type: 'image/png',
        width: 1200,
        height: 628,
      },
    },
    alternates: {
      canonical: `https://www.shugsy.com/contests/${contestId}`,
    },
  };
}

export default async function ContestPage({ params }: PageProps) {
  const { id: contestId } = await params;
  const user = await getUser();
  const contest = await getContest(contestId);

  // Defensive check: ensure contest has movies array
  if (!contest.movies || !Array.isArray(contest.movies)) {
    throw new Error('Contest data is incomplete. Please try again later.');
  }

  // Get entry count
  const supabase = await createClient();
  const { count: entryCount } = await supabase
    .from('entries')
    .select('*', { count: 'exact', head: true })
    .eq('contest_id', contestId);

  // Check if user has entry
  const userEntry = user ? await getUserEntry(contestId) : null;

  // Defensive check: validate lock_time before using
  if (!contest.lock_time) {
    throw new Error('Contest lock time is not set. Please contact support.');
  }

  // Calculate time until lock
  const now = new Date();
  const lockTime = new Date(contest.lock_time);
  const timeUntilLock = lockTime.getTime() - now.getTime();
  const isLocked = contest.status !== 'upcoming';

  // Format dates for schema
  const weekendStart = contest.weekend_start ? new Date(contest.weekend_start + 'T00:00:00') : new Date();
  const weekendEnd = contest.weekend_end ? new Date(contest.weekend_end + 'T00:00:00') : new Date();

  // Check for preliminary leaderboard data (locked contests with estimates)
  let hasEstimates = false;
  let estimateDay: 'friday' | 'saturday' | 'weekend' | null = null;

  if (contest.status === 'locked') {
    try {
      const prelimData = await getPreliminaryLeaderboard(contestId);
      hasEstimates = prelimData.hasEstimates;

      // Determine which day's estimates are in based on movies
      if (hasEstimates && contest.movies) {
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
    } catch {
      // Ignore errors - estimates not available
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <ContestViewTracker
        contestId={contestId}
        contestStatus={contest.status as ContestStatus}
      />
      <ContestEventJsonLd
        name={`${contest.name} - Box Office Fantasy`}
        description={`Predict opening weekend box office for movies like ${contest.movies?.slice(0, 3).map((m: Movie) => m.title).join(', ') || 'this weekend\'s releases'}. Free fantasy sports game.`}
        startDate={weekendStart.toISOString()}
        endDate={weekendEnd.toISOString()}
        url={`https://www.shugsy.com/contests/${contestId}`}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.shugsy.com' },
          { name: contest.name, url: `https://www.shugsy.com/contests/${contestId}` },
        ]}
      />
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Contest Title */}
        <div className="mb-6">
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-100">{contest.name}</h1>
        </div>

        {/* Status Banner */}
        <div className="bg-dark-surface rounded-lg shadow-lg p-4 sm:p-6 mb-6 border border-dark-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-lg font-semibold text-gray-100 tracking-tight">
                {isLocked ? 'Contest Locked' : 'Contest Open'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 tracking-tight">
                {isLocked ? (
                  <>Results will be posted after the weekend</>
                ) : (
                  <>
                    Locks:{' '}
                    {lockTime.toLocaleString('en-US', {
                      timeZone: 'America/New_York',
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZoneName: 'short',
                    })}
                  </>
                )}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm sm:text-lg font-semibold text-gray-100">{entryCount || 0}</div>
              <div className="text-xs sm:text-sm text-gray-400">
                {entryCount === 1 ? 'Entry' : 'Entries'}
              </div>
            </div>
          </div>
        </div>

        {/* User Actions */}
        {!user ? (
          <div className="bg-dark-surface border border-accent/30 rounded-lg p-6 mb-6">
            <p className="text-gray-200 mb-4">Sign in to enter this contest.</p>
            <Link
              href="/login"
              className="inline-block px-6 py-2 bg-accent text-dark-bg font-medium rounded-lg hover:bg-accent-light"
            >
              Sign In
            </Link>
          </div>
        ) : userEntry ? (
          <div className="bg-dark-surface border border-green-600/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-medium text-green-400 text-sm sm:text-base tracking-tight">
                {hasEstimates && estimateDay ? (
                  <>
                    {estimateDay === 'friday' && 'Friday estimates released!'}
                    {estimateDay === 'saturday' && 'Saturday estimates released!'}
                    {estimateDay === 'weekend' && 'Weekend estimates released!'}
                  </>
                ) : (
                  "You've entered this contest!"
                )}
              </h3>
              <div className="flex gap-2 shrink-0">
                {hasEstimates && estimateDay ? (
                  <Link
                    href={`/contests/${contestId}/leaderboard`}
                    className="px-3 sm:px-4 py-2 bg-accent text-dark-bg text-sm font-medium rounded-lg hover:bg-accent-light min-w-[110px] sm:min-w-[120px] text-center"
                  >
                    View Rankings
                  </Link>
                ) : (
                  <Link
                    href={`/contests/${contestId}/my-lineup`}
                    className="px-3 sm:px-4 py-2 bg-accent text-dark-bg text-sm font-medium rounded-lg hover:bg-accent-light min-w-[110px] sm:min-w-[120px] text-center"
                  >
                    View Lineup
                  </Link>
                )}
                {!isLocked && (
                  <Link
                    href={`/contests/${contestId}/lineup`}
                    className="px-3 sm:px-4 py-2 bg-dark-elevated border border-accent text-accent text-sm font-medium rounded-lg hover:bg-dark-surface"
                  >
                    Edit
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : isLocked ? (
          <div className="bg-dark-surface border border-amber-600/50 rounded-lg p-6 mb-6">
            <p className="text-amber-400">
              This contest is locked. You cannot enter at this time.
            </p>
          </div>
        ) : (
          <div className="bg-dark-surface rounded-lg shadow-lg p-6 mb-6 border border-dark-border">
            <h3 className="font-semibold text-gray-100 mb-2">Ready to play?</h3>
            <p className="text-sm text-gray-400 mb-4">
              Build your lineup and compete in this contest.
            </p>
            <Link
              href={`/contests/${contestId}/lineup`}
              className="inline-block px-6 py-3 bg-accent text-dark-bg font-medium rounded-lg hover:bg-accent-light"
            >
              Build Lineup
            </Link>
          </div>
        )}

        {/* Rules */}
        <div className="bg-dark-surface rounded-lg shadow-lg p-4 sm:p-6 mb-6 border border-dark-border">
          <h3 className="text-base sm:text-lg font-semibold text-gray-100 mb-3 sm:mb-4">Contest Rules</h3>
          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-300 tracking-tight">
            <div className="flex gap-2 sm:gap-3">
              <span className="text-accent font-semibold shrink-0">Lineup:</span>
              <span>Select 2-4 movies</span>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <span className="text-accent font-semibold shrink-0">Salary Cap:</span>
              <span>$50,000 max total salary</span>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <span className="text-accent font-semibold shrink-0">Entry Limit:</span>
              <span>One lineup per user</span>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <span className="text-accent font-semibold shrink-0">Lock Time:</span>
              <span>Thursday 8PM ET</span>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <span className="text-accent font-semibold shrink-0">Scoring:</span>
              <span>$1M weekend gross = 1 point</span>
            </div>
          </div>
        </div>

        {/* Movie List Preview */}
        <ExpandableMovieList movies={contest.movies} />


        {/* Navigation */}
        {contest.status === 'resolved' && (
          <div className="mt-6 text-sm text-right">
            <Link
              href={`/contests/${contestId}/leaderboard`}
              className="text-accent hover:text-accent-light"
            >
              View Leaderboard &rarr;
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
