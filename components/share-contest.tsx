// ============================================================================
// Share Contest Button - Challenge friends to a specific contest
// ============================================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { FriendData } from '@/types';

interface ShareContestProps {
  contestId: string;
  contestName: string;
  friends: FriendData[];
}

export function ShareContest({ contestId, contestName, friends }: ShareContestProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);

  const shareUrl = `${window.location.origin}/contests/${contestId}?ref=challenge`;

  function getShareText(friendUsername?: string) {
    if (friendUsername) {
      return `Hey @${friendUsername}, I just locked in my lineup for ${contestName} on Shugsy. Think you can beat me?`;
    }
    return `I just locked in my lineup for ${contestName} on Shugsy. Think you can beat me?`;
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyLink() {
    const friendUsername = friends.find(f => f.user_id === selectedFriend)?.username;
    await copyToClipboard(`${getShareText(friendUsername)}\n${shareUrl}`);
  }

  async function handleNativeShare() {
    const friendUsername = friends.find(f => f.user_id === selectedFriend)?.username;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${contestName} - Shugsy Challenge`,
          text: getShareText(friendUsername),
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="block w-full px-6 py-3 bg-dark-surface border border-accent text-accent text-center font-medium rounded-lg hover:bg-dark-elevated transition-colors"
      >
        Challenge a Friend
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowModal(false)}>
          <div className="max-w-md w-full bg-dark-bg rounded-xl border border-dark-border overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-dark-border">
              <h3 className="text-lg font-semibold text-gray-100">Challenge a Friend</h3>
              <p className="text-sm text-gray-400 mt-1">{contestName}</p>
            </div>

            {/* Friends List */}
            {friends.length > 0 ? (
              <div className="px-5 py-3 border-b border-dark-border">
                <p className="text-xs text-gray-500 mb-2">Select a friend to personalize your challenge:</p>
                <div className="flex flex-wrap gap-2">
                  {friends.map((friend) => (
                    <button
                      key={friend.user_id}
                      onClick={() => setSelectedFriend(
                        selectedFriend === friend.user_id ? null : friend.user_id
                      )}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedFriend === friend.user_id
                          ? 'bg-accent text-dark-bg'
                          : 'bg-dark-elevated text-gray-300 hover:bg-dark-surface'
                      }`}
                    >
                      @{friend.username}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 border-b border-dark-border">
                <p className="text-sm text-gray-400 mb-2">No friends yet! Add friends to challenge them directly.</p>
                <Link
                  href="/friends"
                  className="text-sm text-accent hover:text-accent-light font-medium"
                  onClick={() => setShowModal(false)}
                >
                  Find Friends &rarr;
                </Link>
              </div>
            )}

            {/* Share Message Preview */}
            <div className="px-5 py-3 border-b border-dark-border">
              <p className="text-xs text-gray-500 mb-1.5">Message preview:</p>
              <div className="bg-dark-elevated rounded-lg p-3 text-sm text-gray-300">
                {getShareText(friends.find(f => f.user_id === selectedFriend)?.username)}
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-4 flex gap-2">
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
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 bg-dark-surface border border-dark-border text-gray-400 font-medium rounded-lg hover:bg-dark-elevated transition-colors text-sm"
              >
                Close
              </button>
            </div>

            {/* Footer - Find Friends link */}
            {friends.length > 0 && (
              <div className="px-5 pb-4 pt-0">
                <Link
                  href="/friends"
                  className="text-xs text-gray-500 hover:text-accent transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  Manage friends &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
