// ============================================================================
// Landing Page
// ============================================================================

import Link from 'next/link';
import { getCurrentContest } from '@/actions/contests';
import { getThisWeeksMovies } from '@/actions/charts';
import { Header } from '@/components/header';
import { ExpandableMovieList } from '@/components/expandable-movie-list';
import { WebApplicationJsonLd, FAQJsonLd } from '@/components/json-ld';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shugsy - Fantasy Sports for the Box Office | Free to Play',
  description: 'Play free box office fantasy sports. Pick your lineup of movies, stay under the salary cap, and score points based on domestic weekend gross. Compete weekly!',
  alternates: {
    canonical: 'https://www.shugsy.com',
  },
  openGraph: {
    title: 'Shugsy - Fantasy Sports for the Box Office',
    description: 'Play free box office fantasy sports. Pick movies, predict grosses, win the weekend!',
    url: 'https://www.shugsy.com',
    images: [{ url: '/shugsy-preview-card.png', width: 1200, height: 628 }],
  },
  twitter: {
    card: 'summary',
    images: [{ url: '/shugsy-twitter-share.png?v=1', width: 800, height: 800 }],
  },
};

export default async function LandingPage() {
  // Fetch both contest (for CTA/lock time) and movies (from charts, persists after resolved)
  const [currentContest, thisWeeksMovies] = await Promise.all([
    getCurrentContest(),
    getThisWeeksMovies(),
  ]);

  return (
    <div className="min-h-screen bg-dark-bg">
      <WebApplicationJsonLd />
      <FAQJsonLd />
      <Header />

      <main id="main-content">
        {/* Hero */}
        <section aria-label="Introduction" className="bg-gradient-to-b from-gray-900 via-gray-800 to-dark-bg pt-12 sm:pt-16 pb-16 sm:pb-24">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center">
              <h1 className="text-[1.45rem] sm:text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                Fantasy Sports for the<span className="text-teal-400"> Box Office</span>
              </h1>
            <p className="text-[0.8rem] sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-10 tracking-tight">
              Spot the sleepers. Fade the flops. Build the winning lineup.
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

        {/* Movie Slate Preview - Uses charts data (persists even after contest resolved) */}
        {thisWeeksMovies.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 -mt-6 sm:-mt-8 mb-12 sm:mb-16">
            <ExpandableMovieList movies={thisWeeksMovies} />
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 -mt-6 sm:-mt-8">
          {/* How It Works */}
          <section aria-label="How it works" className="bg-dark-surface rounded-2xl shadow-xl p-4 sm:p-8 mb-6 sm:mb-8 border border-dark-border">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-100 mb-4 sm:mb-8 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-4 sm:gap-8">
              <div className="flex items-start gap-3 md:flex-col md:items-center md:text-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-accent/20 text-accent rounded-full flex items-center justify-center text-base sm:text-xl font-bold shrink-0 md:mb-4">1</div>
                <div>
                  <h3 className="font-semibold text-gray-100 text-sm sm:text-base mb-1 sm:mb-2">Pick Your Lineup</h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Select 2-4 movies within a $50,000 salary cap.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 md:flex-col md:items-center md:text-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-accent/20 text-accent rounded-full flex items-center justify-center text-base sm:text-xl font-bold shrink-0 md:mb-4">2</div>
                <div>
                  <h3 className="font-semibold text-gray-100 text-sm sm:text-base mb-1 sm:mb-2">Watch the Box Office</h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Score = total weekend gross of your movies.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 md:flex-col md:items-center md:text-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-accent/20 text-accent rounded-full flex items-center justify-center text-base sm:text-xl font-bold shrink-0 md:mb-4">3</div>
                <div>
                  <h3 className="font-semibold text-gray-100 text-sm sm:text-base mb-1 sm:mb-2">Compete & Win</h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    $1M box office = 1 point. Highest score wins!
                  </p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
