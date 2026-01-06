// ============================================================================
// Landing Page
// ============================================================================

import Link from 'next/link';
import { getCurrentContest } from '@/actions/contests';
import { getUser } from '@/lib/supabase-server';

export default async function LandingPage() {
  const user = await getUser();
  const currentContest = await getCurrentContest();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Box Office Fantasy</h1>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/account"
                  className="text-sm text-gray-700 hover:text-gray-900"
                >
                  Account
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Fantasy Sports for Movie Box Office
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Pick your lineup. Compete on opening weekend box office.
          </p>

          {/* CTA */}
          {currentContest ? (
            <div className="space-y-3">
              <Link
                href={`/contests/${currentContest.id}`}
                className="inline-block px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Play This Week's Contest
              </Link>
              <div className="text-sm text-gray-600">
                Locks:{' '}
                {new Date(currentContest.lock_time).toLocaleString('en-US', {
                  timeZone: 'America/New_York',
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short',
                })}
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No active contest at the moment. Check back soon!</p>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">1</div>
              <h4 className="font-semibold text-gray-900 mb-2">Pick Your Lineup</h4>
              <p className="text-sm text-gray-600">
                Select 2-4 movies from the weekly slate within a $100 salary cap.
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">2</div>
              <h4 className="font-semibold text-gray-900 mb-2">Watch the Box Office</h4>
              <p className="text-sm text-gray-600">
                Your score is the total domestic opening weekend gross of your movies.
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
              <h4 className="font-semibold text-gray-900 mb-2">Compete on the Leaderboard</h4>
              <p className="text-sm text-gray-600">
                $1M box office = 1 point. Highest total score wins!
              </p>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="bg-white rounded-lg shadow p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Contest Rules</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Select 2-4 movies from the weekly slate (3 is optimal)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Stay within the $100 salary cap</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>One entry per user per contest</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Lineups lock Thursday 8PM ET</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Scoring based on Friday-Sunday domestic box office gross</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>$1 million box office = 1 point</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Free to play, leaderboard competition</span>
            </li>
          </ul>
        </div>

        {/* Admin Link */}
        {user && (
          <div className="mt-8 text-center">
            <Link
              href="/admin/create-contest"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Admin: Create Test Contest
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
