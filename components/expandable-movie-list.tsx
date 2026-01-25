// ============================================================================
// Expandable Movie List - Client Component
// ============================================================================

'use client';

import { useState } from 'react';
import { Movie } from '@/types';

interface ExpandableMovieListProps {
  movies: Movie[];
}

export function ExpandableMovieList({ movies }: ExpandableMovieListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayMovies = isExpanded ? movies : movies.slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
        This Week's Movies ({movies.length})
      </h3>
      <div className="space-y-2">
        {displayMovies.map((movie) => (
          <div
            key={movie.id}
            className="py-2 border-b border-gray-100 last:border-0"
          >
            {/* Row 1: Title + Salary */}
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-900 text-sm sm:text-base truncate min-w-0 flex-1">{movie.title}</div>
              <div className="text-sm sm:text-base font-bold text-gray-900 flex-shrink-0">${movie.salary}</div>
            </div>
            {/* Row 2: Release date + Proj */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                Release date: {new Date(movie.release_date + 'T00:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
              </div>
              <div className="text-xs text-gray-600">Proj: {movie.projected_gross.toFixed(2)}M</div>
            </div>
            {/* Row 3: Distributor */}
            {movie.distributor && (
              <div className="text-xs text-gray-600">{movie.distributor}</div>
            )}
          </div>
        ))}
        {movies.length > 5 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium pt-2 text-left"
          >
            {isExpanded ? '− Show less' : `+ ${movies.length - 5} more movies`}
          </button>
        )}
      </div>
    </div>
  );
}
