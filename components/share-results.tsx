// ============================================================================
// Share Results Card - Visual share card captured as image for social sharing
// ============================================================================

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
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

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Convert an external image URL to a base64 data URL to avoid CORS issues
async function toDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
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
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [posterDataUrls, setPosterDataUrls] = useState<Record<number, string>>({});
  const cardRef = useRef<HTMLDivElement>(null);
  const cachedBlobRef = useRef<Blob | null>(null);

  const rankText = rank && totalEntries ? `#${getOrdinalSuffix(rank)} place out of ${totalEntries} ${totalEntries === 1 ? 'entry' : 'entries'}` : '';

  function getShareUrl() {
    return `${window.location.origin}/contests/${contestId}/leaderboard`;
  }

  function getShareText() {
    return `I scored ${score.toFixed(1)} pts in ${contestName} on Shugsy! ${rankText}. Think you can beat me?`;
  }

  // Pre-fetch poster images as data URLs when modal opens to avoid CORS
  useEffect(() => {
    if (!showCard) return;

    const fetchPosters = async () => {
      const results: Record<number, string> = {};
      await Promise.all(
        movies.map(async (movie, i) => {
          // poster_path may be a full URL or a TMDB path - handle both
          const posterUrl = movie.poster_path?.startsWith('http')
            ? movie.poster_path
            : getTMDBPosterUrl(movie.poster_path, 'w185');
          if (posterUrl) {
            const dataUrl = await toDataUrl(posterUrl);
            if (dataUrl) results[i] = dataUrl;
          }
        })
      );
      setPosterDataUrls(results);
    };

    fetchPosters();
  }, [showCard, movies]);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (cachedBlobRef.current) return cachedBlobRef.current;
    if (!cardRef.current) return null;

    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: true,
        includeQueryParams: true,
      });
      // Convert data URL to blob without fetch (avoids CSP connect-src restrictions)
      const [header, base64] = dataUrl.split(',');
      const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      cachedBlobRef.current = blob;
      return blob;
    } catch {
      toast.error('Failed to generate image. Please try again.');
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  function handleOpenModal() {
    cachedBlobRef.current = null;
    setPosterDataUrls({});
    setShowCard(true);
  }

  function handleShareX() {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener');
  }

  function handleShareFacebook() {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener');
  }

  function handleShareReddit() {
    const title = encodeURIComponent(getShareText());
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.reddit.com/submit?url=${url}&title=${title}`, '_blank', 'noopener');
  }

  async function handleShareInstagram() {
    const blob = await generateImage();
    if (!blob) return;
    downloadBlob(blob, `shugsy-results-${contestName.replace(/\s+/g, '-').toLowerCase()}.png`);
    toast.success('Image saved! Open Instagram and share it from your camera roll.');
  }

  async function handleDownload() {
    const blob = await generateImage();
    if (!blob) return;
    downloadBlob(blob, `shugsy-results-${contestName.replace(/\s+/g, '-').toLowerCase()}.png`);
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(`${getShareText()}\n${getShareUrl()}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = `${getShareText()}\n${getShareUrl()}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        onClick={handleOpenModal}
        className="block w-full px-6 py-3 bg-dark-surface border border-accent text-accent text-center font-medium rounded-lg hover:bg-dark-elevated transition-colors"
      >
        Share Results
      </button>

      {/* Share Card Modal */}
      {showCard && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70" onClick={() => setShowCard(false)}>
          <div className="w-full max-w-sm sm:max-w-md p-3 pb-[env(safe-area-inset-bottom,12px)]" onClick={(e) => e.stopPropagation()}>
            {/* The Visual Card (captured as image) */}
            <div ref={cardRef} className={`bg-dark-bg rounded-xl border-2 ${rankBorderColor} overflow-hidden`}>
              {/* Card Header */}
              <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2 sm:pb-3">
                <div className="flex items-center justify-between mb-1">
                  <img src="/logo_full.png" alt="Shugsy" className="h-8 sm:h-10 w-auto" />
                  <span className="text-gray-500 text-[10px] sm:text-xs">{contestName}</span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-accent leading-none">{score.toFixed(1)}</div>
                    <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5">&nbsp;points</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-xs sm:text-sm font-semibold text-gray-200">@{username}</div>
                  </div>
                </div>
              </div>

              {/* Rank Banner - single line */}
              {rank !== null && totalEntries !== null && (
                <div className="px-4 sm:px-5 pb-2 sm:pb-3">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <span className={`text-xs sm:text-sm font-bold ${rankColor}`}>
                      #{getOrdinalSuffix(rank)} place out of {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}
                    </span>
                    {isPerfectLineup && (
                      <img
                        src="/perfect-lineup-badge.png"
                        alt="Perfect Lineup"
                        className="h-4 sm:h-5 w-auto"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Movie Posters Row */}
              <div className="px-4 sm:px-5 pb-1.5 sm:pb-2">
                <div className="flex gap-1.5 sm:gap-2">
                  {movies.map((movie, i) => {
                    // Use pre-fetched data URL if available, otherwise fall back to TMDB URL
                    const posterUrl = posterDataUrls[i] || getTMDBPosterUrl(movie.poster_path, 'w185');
                    return (
                      <div key={i} className="flex-1 min-w-0">
                        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-dark-elevated mb-1 sm:mb-1.5">
                          {posterUrl ? (
                            <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 text-[9px] sm:text-xs text-center p-1">
                              {movie.title}
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] sm:text-xs font-semibold text-accent leading-tight">
                            {(movie.actual_gross ?? 0).toFixed(1)}
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-gray-500 truncate">{movie.title}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-4 sm:px-5 py-2 sm:py-2.5 bg-dark-surface/50 flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] text-gray-500">shugsy.com</span>
                <span className="text-[10px] sm:text-[11px] text-gray-500">Box Office Fantasy Sports</span>
              </div>
            </div>

            {/* Platform Share Buttons */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-3 mt-3 sm:mt-4">
              {/* X (Twitter) */}
              <button
                onClick={handleShareX}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white text-black hover:bg-gray-200 active:scale-95 transition-all"
                title="Share on X"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>

              {/* Facebook */}
              <button
                onClick={handleShareFacebook}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-[#1877F2] text-white hover:bg-[#166FE5] active:scale-95 transition-all"
                title="Share on Facebook"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>

              {/* Reddit */}
              <button
                onClick={handleShareReddit}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-[#FF4500] text-white hover:bg-[#E03D00] active:scale-95 transition-all"
                title="Share on Reddit"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                </svg>
              </button>

              {/* Instagram (download) */}
              <button
                onClick={handleShareInstagram}
                disabled={generating}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full text-white hover:opacity-80 active:scale-95 transition-all"
                style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
                title="Save for Instagram"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-2 mt-2.5 sm:mt-3">
              <button
                onClick={handleDownload}
                disabled={generating}
                className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 bg-dark-surface border border-dark-border text-gray-100 font-medium rounded-lg hover:bg-dark-elevated active:scale-[0.98] transition-all text-xs sm:text-sm flex items-center justify-center gap-1.5"
              >
                {generating ? (
                  'Generating...'
                ) : (
                  <>
                    <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-current">
                      <path d="M10 3a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V4a1 1 0 011-1z" />
                      <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                    </svg>
                    Download
                  </>
                )}
              </button>
              <button
                onClick={handleCopyLink}
                className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 bg-dark-surface border border-dark-border text-gray-100 font-medium rounded-lg hover:bg-dark-elevated active:scale-[0.98] transition-all text-xs sm:text-sm"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={() => setShowCard(false)}
                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-dark-surface border border-dark-border text-gray-400 font-medium rounded-lg hover:bg-dark-elevated active:scale-[0.98] transition-all text-xs sm:text-sm"
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
