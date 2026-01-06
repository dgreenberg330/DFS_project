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
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        This Week's Movies ({movies.length})
      </h3>
      <div className="space-y-2">
        {displayMovies.map((movie) => (
          <div
            key={movie.id}
            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
          >
            <div>
              <div className="font-medium text-gray-900">{movie.title}</div>
              <div className="text-xs text-gray-600">
                {movie.distributor} • Proj: {movie.projected_gross.toFixed(1)}M
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900">${movie.salary}</div>
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
