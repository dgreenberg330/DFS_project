// ============================================================================
// Landing Page
// ============================================================================

import Link from 'next/link';
import { getCurrentContest } from '@/actions/contests';
import { Header } from '@/components/header';
import { WebApplicationJsonLd, FAQJsonLd } from '@/components/json-ld';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shugsy - Fantasy Sports for the Box Office | Predict Opening Weekend Grosses',
  description: 'Play free box office fantasy sports. Pick your lineup of movies, stay under the salary cap, and score points based on domestic opening weekend gross. Compete weekly!',
  alternates: {
    canonical: 'https://shugsy.com',
  },
  openGraph: {
    title: 'Shugsy - Fantasy Sports for the Box Office',
    description: 'Play free box office fantasy sports. Pick movies, predict grosses, win the weekend!',
    url: 'https://shugsy.com',
  },
};

export default async function LandingPage() {
  const currentContest = await getCurrentContest();

  return (
    <div className="min-h-screen bg-gray-100">
      <WebApplicationJsonLd />
      <FAQJsonLd />
      <Header />

      <main>
        {/* Hero */}
        <section aria-label="Introduction" className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-100 pt-16 pb-24">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Fantasy Sports for the
                <span className="text-teal-400"> Box Office</span>
              </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Pick your lineup. Compete on domestic weekend box office.
            </p>

            {/* CTA */}
            {currentContest ? (
              <div className="space-y-4">
                <Link
                  href={`/contests/${currentContest.id}`}
                  className="inline-block px-10 py-4 bg-teal-500 text-white text-lg font-semibold rounded-xl hover:bg-teal-400 transition-all hover:scale-105 shadow-lg shadow-teal-500/25"
                >
                  Play This Week's Contest
                </Link>
                <div className="text-sm text-gray-300">
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
              <p className="text-gray-400">No active contest at the moment. Check back soon!</p>
            )}
          </div>
        </div>
      </section>

        <div className="max-w-4xl mx-auto px-4 -mt-8">
          {/* How It Works */}
          <section aria-label="How it works" className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
                <h3 className="font-semibold text-gray-900 mb-2">Pick Your Lineup</h3>
                <p className="text-sm text-gray-600">
                  Select 2-4 movies from the weekly slate within a $100 salary cap.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
                <h3 className="font-semibold text-gray-900 mb-2">Watch the Box Office</h3>
                <p className="text-sm text-gray-600">
                  Your score is the total domestic weekend gross of your movies.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
                <h3 className="font-semibold text-gray-900 mb-2">Compete & Win</h3>
                <p className="text-sm text-gray-600">
                  $1M box office = 1 point. Highest total score wins!
                </p>
              </div>
            </div>
          </section>

          {/* Rules */}
          <section aria-label="Contest rules" className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Contest Rules</h2>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                <span>Select 2-4 movies from the weekly slate</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                <span>Stay within the $100 salary cap</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                <span>One entry per user per contest</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                <span>Lineups lock Thursday 8PM ET</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                <span>Scoring: Friday-Sunday domestic gross</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                <span>$1 million box office = 1 point</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
