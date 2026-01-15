// ============================================================================
// Contest Page - Rules, Entry Count, Countdown
// ============================================================================

import { getContest } from '@/actions/contests';
import { getUser, createClient } from '@/lib/supabase-server';
import { getUserEntry } from '@/actions/lineups';
import { ExpandableMovieList } from '@/components/expandable-movie-list';
import { Header } from '@/components/header';
import { ContestEventJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: contestId } = await params;
  const contest = await getContest(contestId);

  const movieNames = contest.movies?.slice(0, 3).map((m: any) => m.title).join(', ') || '';
  const description = `Enter the ${contest.name} box office fantasy contest. Pick movies like ${movieNames} and compete on opening weekend gross. Free to play!`;

  return {
    title: contest.name,
    description,
    openGraph: {
      title: `${contest.name} - Box Office Fantasy Contest`,
      description,
      url: `https://www.shugsy.com/contests/${contestId}`,
      images: [{ url: '/shugsy-share.png', width: 1200, height: 628 }],
    },
    twitter: {
      images: [{ url: '/shugsy-share.png', width: 1200, height: 628 }],
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

  return (
    <div className="min-h-screen bg-gray-50">
      <ContestEventJsonLd
        name={`${contest.name} - Box Office Fantasy`}
        description={`Predict opening weekend box office for movies like ${contest.movies?.slice(0, 3).map((m: any) => m.title).join(', ') || 'this weekend\'s releases'}. Free fantasy sports game.`}
        startDate={weekendStart.toISOString()}
        endDate={weekendEnd.toISOString()}
        url={`https://shugsy.com/contests/${contestId}`}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://shugsy.com' },
          { name: contest.name, url: `https://shugsy.com/contests/${contestId}` },
        ]}
      />
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Contest Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{contest.name}</h1>
        </div>

        {/* Status Banner */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isLocked ? 'Contest Locked' : 'Contest Open'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isLocked ? (
                  <>Lineups are locked. Results will be posted after the weekend.</>
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
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{entryCount || 0}</div>
              <div className="text-sm text-gray-600">
                {entryCount === 1 ? 'Entry' : 'Entries'}
              </div>
            </div>
          </div>
        </div>

        {/* User Actions */}
        {!user ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-blue-900 mb-4">Sign in to enter this contest.</p>
            <Link
              href="/login"
              className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              Sign In
            </Link>
          </div>
        ) : userEntry ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <p className="text-green-900 mb-4">You're entered in this contest!</p>
            <div className="flex gap-3">
              <Link
                href={`/contests/${contestId}/my-lineup`}
                className="inline-block px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
              >
                View My Lineup
              </Link>
              {!isLocked && (
                <Link
                  href={`/contests/${contestId}/lineup`}
                  className="inline-block px-6 py-2 bg-white border border-green-600 text-green-700 font-medium rounded-lg hover:bg-green-50"
                >
                  Edit Lineup
                </Link>
              )}
            </div>
          </div>
        ) : isLocked ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <p className="text-yellow-900">
              This contest is locked. You cannot enter at this time.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Ready to play?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Build your lineup and compete on the leaderboard.
            </p>
            <Link
              href={`/contests/${contestId}/lineup`}
              className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
            >
              Build Lineup
            </Link>
          </div>
        )}

        {/* Rules */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contest Rules</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex gap-3">
              <span className="text-blue-600 font-semibold">Lineup:</span>
              <span>Select 2-4 movies</span>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-600 font-semibold">Salary Cap:</span>
              <span>$100 maximum total salary</span>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-600 font-semibold">Entry Limit:</span>
              <span>One lineup per user</span>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-600 font-semibold">Lock Time:</span>
              <span>Thursday 8PM ET</span>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-600 font-semibold">Scoring:</span>
              <span>
                Total domestic opening weekend gross (Fri-Sun). $1M box office = 1 point
              </span>
            </div>
            <div className="flex gap-3">
              <span className="text-blue-600 font-semibold">Final Score:</span>
              <span>Sum of all selected movies' opening weekend gross</span>
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
              className="text-blue-600 hover:text-blue-700"
            >
              View Leaderboard →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
