// ============================================================================
// Movie Card Component - Poster-based movie display
// ============================================================================

'use client';

import { getTMDBPosterUrl, POSTER_SIZES } from '@/lib/tmdb';
import type { Movie } from '@/types';

interface MovieCardProps {
  movie: Movie;
  isSelected?: boolean;
  isDisabled?: boolean;
  onToggle?: (movieId: string) => void;
  showCheckbox?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function MovieCard({
  movie,
  isSelected = false,
  isDisabled = false,
  onToggle,
  showCheckbox = true,
  size = 'md',
}: MovieCardProps) {
  const posterUrl = getTMDBPosterUrl(movie.poster_path, POSTER_SIZES.GRID);

  // Size configurations
  const sizeConfig = {
    sm: { width: 92, height: 138, textSize: 'text-xs' },
    md: { width: 120, height: 180, textSize: 'text-sm' },
    lg: { width: 154, height: 231, textSize: 'text-base' },
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
      className={`
        relative rounded-lg overflow-hidden transition-all duration-200
        ${onToggle ? 'cursor-pointer' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-dark-bg scale-105' : ''}
        ${!isSelected && onToggle && !isDisabled ? 'hover:scale-102 hover:ring-1 hover:ring-dark-border' : ''}
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
          // Fallback when no poster available
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
      <div className="bg-dark-surface p-2" style={{ width: config.width }}>
        <div className={`flex justify-between items-center gap-1 ${config.textSize}`}>
          <span className="text-gray-400 truncate">
            {movie.projected_gross.toFixed(1)}M
          </span>
          <span className="text-accent font-semibold whitespace-nowrap">
            ${movie.salary}
          </span>
        </div>
      </div>
    </div>
  );
}
