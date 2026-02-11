// ============================================================================
// Share Results Card - Visual share card with movie posters
// ============================================================================

'use client';

import { useState, useRef } from 'react';
import { getTMDBPosterUrl } from '@/lib/tmdb';

interface ShareMovie {
  title: string;
  actual_gross: number | null;
  salary: number;
  poster_path: string | null;
}

interface ShareResultsProps {
  contestId: string;
  contestName: string;
  score: number;
  rank: number | null;
  totalEntries: number | null;
  movies: ShareMovie[];
  username: string;
  isPerfectLineup?: boolean;
}

export function ShareResults({
  contestId,
  contestName,
  score,
  rank,
  totalEntries,
  movies,
  username,
  isPerfectLineup,
}: ShareResultsProps) {
  const [showCard, setShowCard] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const shareUrl = `${window.location.origin}/contests/${contestId}/leaderboard`;
  const rankText = rank && totalEntries ? ` Finished #${rank} out of ${totalEntries}.` : '';
  const shareText = `I scored ${score.toFixed(1)} pts in ${contestName} on Shugsy!${rankText} Think you can beat me?`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = `${shareText}\n${shareUrl}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My Shugsy Results - ${contestName}`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    }
  }

  const rankColor = rank === 1
    ? 'text-yellow-400'
    : rank === 2
    ? 'text-gray-300'
    : rank === 3
    ? 'text-orange-400'
    : 'text-gray-100';

  const rankBorderColor = rank === 1
    ? 'border-yellow-500/50'
    : rank === 2
    ? 'border-gray-400/50'
    : rank === 3
    ? 'border-orange-500/50'
    : 'border-accent/50';

  return (
    <>
      <button
        onClick={() => setShowCard(true)}
        className="block w-full px-6 py-3 bg-dark-surface border border-accent text-accent text-center font-medium rounded-lg hover:bg-dark-elevated transition-colors"
      >
        Share Results
      </button>

      {/* Share Card Modal */}
      {showCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowCard(false)}>
          <div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            {/* The Visual Card */}
            <div ref={cardRef} className={`bg-dark-bg rounded-xl border-2 ${rankBorderColor} overflow-hidden`}>
              {/* Card Header */}
              <div className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-accent font-bold text-lg tracking-tight">SHUGSY</span>
                  <span className="text-gray-500 text-xs">{contestName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-4xl font-extrabold text-accent leading-none">{score.toFixed(1)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">points</div>
                  </div>
                  {rank !== null && totalEntries !== null && (
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${rankColor}`}>#{rank}</div>
                      <div className="text-xs text-gray-500">of {totalEntries}</div>
                    </div>
                  )}
                  <div className="ml-auto text-right">
                    <div className="text-sm font-semibold text-gray-200">@{username}</div>
                    {isPerfectLineup && (
                      <div className="text-xs text-yellow-400 font-medium">Perfect Lineup</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Movie Posters Row */}
              <div className="px-5 pb-2">
                <div className="flex gap-2">
                  {movies.map((movie, i) => {
                    const posterUrl = getTMDBPosterUrl(movie.poster_path, 'w185');
                    return (
                      <div key={i} className="flex-1 min-w-0">
                        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-dark-elevated mb-1.5">
                          {posterUrl ? (
                            <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs text-center p-1">
                              {movie.title}
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-semibold text-accent leading-tight">
                            {(movie.actual_gross ?? 0).toFixed(1)}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">{movie.title}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-2.5 bg-dark-surface/50 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">shugsy.com</span>
                <span className="text-[11px] text-gray-500">Box Office Fantasy Sports</span>
              </div>
            </div>

            {/* Share Actions (below card) */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleCopyLink}
                className="flex-1 px-4 py-2.5 bg-accent text-dark-bg font-medium rounded-lg hover:bg-accent-light transition-colors text-sm"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="flex-1 px-4 py-2.5 bg-dark-surface border border-dark-border text-gray-100 font-medium rounded-lg hover:bg-dark-elevated transition-colors text-sm"
                >
                  Share
                </button>
              )}
              <button
                onClick={() => setShowCard(false)}
                className="px-4 py-2.5 bg-dark-surface border border-dark-border text-gray-400 font-medium rounded-lg hover:bg-dark-elevated transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
