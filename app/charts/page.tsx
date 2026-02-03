// ============================================================================
// Charts Page - This Week's Movie Slate
// ============================================================================

import { getChartsContestData } from '@/actions/charts';
import { Header } from '@/components/header';
import { ChartMovieRow } from '@/components/chart-movie-row';
import { BreadcrumbJsonLd } from '@/components/json-ld';
import { getCurrentEstimateDay } from '@/lib/estimate-utils';
import type { Metadata } from 'next';
import type { ContestStatus, EstimateDay } from '@/types';

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
    images: [{ url: '/shugsy-preview-card.png?v=2', width: 1200, height: 628 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: {
      url: 'https://www.shugsy.com/shugsy-preview-card.png?v=2',
      type: 'image/png',
      width: 1200,
      height: 628,
    },
  },
};

function getEstimateBannerText(estimateDay: EstimateDay): string | null {
  switch (estimateDay) {
    case 'friday':
      return 'Friday estimates released!';
    case 'saturday':
      return 'Friday & Saturday estimates released!';
    case 'sunday':
      return 'Weekend estimates released!';
    default:
      return null;
  }
}

export default async function ChartsPage() {
  const { contest, movies } = await getChartsContestData();

  // Determine highest estimate day across all movies
  const estimateDays: EstimateDay[] = movies.map((m) => getCurrentEstimateDay(m));
  const dayPriority: Record<EstimateDay, number> = { none: 0, friday: 1, saturday: 2, sunday: 3, final: 4 };
  const highestEstimateDay = estimateDays.reduce<EstimateDay>(
    (highest, current) => (dayPriority[current] > dayPriority[highest] ? current : highest),
    'none'
  );
  const bannerText = getEstimateBannerText(highestEstimateDay);

  return (
    <div className="min-h-screen bg-dark-bg">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.shugsy.com' },
          { name: 'Charts', url: 'https://www.shugsy.com/charts' },
        ]}
      />
      <Header />

      <main id="main-content" className="max-w-4xl mx-auto px-4 py-8 w-full">
        {/* Page Header */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-100">
            Box Office Charts
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {contest
              ? `${contest.name} - Track projections and results`
              : "This week's movies with projections and results"}
          </p>
        </div>

        {/* Estimate Banner */}
        {bannerText && (
          <div className="mb-4 bg-accent/10 border border-accent/30 rounded-lg px-4 py-3 text-center">
            <span className="text-accent font-semibold">{bannerText}</span>
          </div>
        )}

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
