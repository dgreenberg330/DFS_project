// ============================================================================
// Charts Page - This Week's Movie Slate
// ============================================================================

import { getChartsContestData } from '@/actions/charts';
import { Header } from '@/components/header';
import { ChartMovieRow } from '@/components/chart-movie-row';
import { BreadcrumbJsonLd } from '@/components/json-ld';
import type { Metadata } from 'next';
import type { ContestStatus } from '@/types';

export const metadata: Metadata = {
  title: 'Box Office Charts | Shugsy',
  description:
    "This week's movie slate with projections, box office estimates, and final results. Track opening weekend performance for fantasy box office games.",
  alternates: {
    canonical: 'https://www.shugsy.com/charts',
  },
  openGraph: {
    title: 'Box Office Charts | Shugsy',
    description:
      "Track this week's movie slate with projections and box office results for fantasy sports.",
    url: 'https://www.shugsy.com/charts',
    images: [{ url: '/shugsy-share.png', width: 1200, height: 628 }],
  },
  twitter: {
    images: [{ url: '/shugsy-share.png', width: 1200, height: 628 }],
  },
};

export default async function ChartsPage() {
  const { contest, movies } = await getChartsContestData();

  return (
    <div className="min-h-screen bg-dark-bg">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://shugsy.com' },
          { name: 'Charts', url: 'https://shugsy.com/charts' },
        ]}
      />
      <Header />

      <main id="main-content" className="max-w-4xl mx-auto px-4 py-8 w-full">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-100">
            Box Office Charts
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {contest
              ? `${contest.name} - Track projections and results`
              : "This week's movies with projections and results"}
          </p>
        </div>

        {/* Movie List */}
        {movies.length > 0 ? (
          <div className="space-y-4">
            {movies.map((movie) => (
              <ChartMovieRow
                key={movie.id}
                movie={movie}
                contestStatus={(contest?.status || 'upcoming') as ContestStatus}
              />
            ))}
          </div>
        ) : (
          <div className="bg-dark-surface rounded-lg border border-dark-border p-8 text-center">
            <p className="text-gray-400">
              No movies available. Check back when a new contest is published!
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
