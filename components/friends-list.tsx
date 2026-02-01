// ============================================================================
// Friends List Component - Display current friends
// ============================================================================

'use client';

import { useState, useTransition } from 'react';
import { removeFriend } from '@/actions/friends';
import type { FriendData } from '@/types';

interface FriendsListProps {
  friends: FriendData[];
}

export function FriendsList({ friends }: FriendsListProps) {
  const [isPending, startTransition] = useTransition();
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRemove = (userId: string) => {
    if (!confirm('Remove this friend?')) return;

    startTransition(async () => {
      const result = await removeFriend(userId);
      if (result.success) {
        setRemovedIds((prev) => new Set(prev).add(userId));
        setMessage({ type: 'success', text: 'Friend removed' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to remove friend' });
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const filteredFriends = friends.filter((f) => !removedIds.has(f.user_id));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-300">
        My Friends ({filteredFriends.length})
      </h3>

      {filteredFriends.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">No friends yet. Search for users or invite friends by email.</p>
      ) : (
        <div className="space-y-2">
          {filteredFriends.map((friend) => (
            <div
              key={friend.user_id}
              className="flex items-center justify-between py-2 px-3 bg-dark-elevated rounded-lg"
            >
              <span className="text-sm text-gray-100">@{friend.username}</span>
              <button
                onClick={() => handleRemove(friend.user_id)}
                disabled={isPending}
                className="text-xs text-gray-400 hover:text-red-400 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Status message */}
      {message && (
        <div
          className={`text-sm py-2 px-3 rounded ${
            message.type === 'success'
              ? 'bg-green-900/30 text-green-400'
              : 'bg-red-900/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
