// ============================================================================
// Movie Card Component - Poster-based movie display
// ============================================================================

'use client';

import { getTMDBPosterUrl } from '@/lib/tmdb';
import type { Movie } from '@/types';

interface MovieCardProps {
  movie: Movie;
  isSelected?: boolean;
  isDisabled?: boolean;
  onToggle?: (movieId: string) => void;
  showCheckbox?: boolean;
  size?: 'sm' | 'sm-md' | 'md' | 'lg';
}

export function MovieCard({
  movie,
  isSelected = false,
  isDisabled = false,
  onToggle,
  showCheckbox = true,
  size = 'md',
}: MovieCardProps) {
  // Use w342 for better quality at larger display sizes
  const posterUrl = getTMDBPosterUrl(movie.poster_path, 'w342');

  // Size configurations with fixed dimensions
  const sizeConfig = {
    sm: { width: 100, height: 150, text: 'text-xs' },
    'sm-md': { width: 115, height: 172, text: 'text-xs' },
    md: { width: 130, height: 195, text: 'text-xs' },
    lg: { width: 150, height: 225, text: 'text-sm' },
  };

  const config = sizeConfig[size];

  const handleClick = () => {
    if (!isDisabled && onToggle) {
      onToggle(movie.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isDisabled && onToggle) {
      e.preventDefault();
      onToggle(movie.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onToggle ? 'button' : undefined}
      tabIndex={onToggle && !isDisabled ? 0 : undefined}
      aria-pressed={onToggle ? isSelected : undefined}
      aria-disabled={isDisabled}
      style={{ width: config.width }}
      className={`
        relative rounded-lg overflow-hidden transition-all duration-200
        ${onToggle ? 'cursor-pointer' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-dark-bg scale-[1.03]' : ''}
        ${!isSelected && onToggle && !isDisabled ? 'hover:ring-1 hover:ring-dark-border' : ''}
      `}
    >
      {/* Poster Image */}
      <div
        className="relative bg-dark-elevated"
        style={{ width: config.width, height: config.height }}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={`${movie.title} poster`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-2 bg-dark-surface">
            <span className="text-center text-gray-400 text-xs leading-tight line-clamp-3">
              {movie.title}
            </span>
          </div>
        )}

        {/* Selection checkbox overlay */}
        {showCheckbox && (
          <div className="absolute top-1.5 right-1.5">
            <div
              className={`
                w-5 h-5 rounded border-2 flex items-center justify-center
                ${isSelected
                  ? 'bg-accent border-accent'
                  : 'border-white/70 bg-black/30 backdrop-blur-sm'
                }
              `}
            >
              {isSelected && (
                <svg
                  className="w-3 h-3 text-dark-bg"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Selected indicator glow */}
        {isSelected && (
          <div className="absolute inset-0 bg-accent/10 pointer-events-none" />
        )}
      </div>

      {/* Movie info footer */}
      <div className="bg-dark-surface p-1.5">
        {/* Movie title */}
        <div
          className={`${config.text} font-medium text-gray-100 truncate mb-1`}
          title={movie.title}
        >
          {movie.title}
        </div>

        {/* Proj + Cost */}
        <div className="flex justify-between items-start gap-1 text-xs">
          <div>
            <div className="text-gray-500 leading-none">Proj</div>
            <div className="text-gray-300">{movie.projected_gross.toFixed(1)}M</div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 leading-none">Cost</div>
            <div className="text-accent font-semibold">${movie.salary.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
