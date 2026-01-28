// ============================================================================
// Movie List - Client Component
// ============================================================================

'use client';

import { MovieCard } from '@/components/movie-card';
import { Movie } from '@/types';

interface ExpandableMovieListProps {
  movies: Movie[];
}

export function ExpandableMovieList({ movies }: ExpandableMovieListProps) {
  // Check if last row has orphan on desktop (5 columns)
  const hasOrphanDesktop = movies.length % 5 === 1;

  return (
    <div className="bg-dark-surface rounded-lg shadow-lg p-4 sm:p-6 border border-dark-border">
      <h3 className="text-base sm:text-lg font-semibold text-gray-100 mb-3 sm:mb-4">
        This Week&apos;s Movies ({movies.length})
      </h3>

      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-3">
          {movies.map((movie) => (
            <div key={movie.id} className="flex-shrink-0">
              <MovieCard
                movie={movie}
                showCheckbox={false}
                size="sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: 5-column grid */}
      <div className="hidden md:grid md:grid-cols-5 gap-3 justify-items-center">
        {movies.map((movie, index) => {
          const isLastDesktop = index === movies.length - 1 && hasOrphanDesktop;

          return (
            <div
              key={movie.id}
              className={isLastDesktop ? 'md:col-span-5 md:flex md:justify-center' : ''}
            >
              <MovieCard
                movie={movie}
                showCheckbox={false}
                size="sm"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
