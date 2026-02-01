// ============================================================================
// Incoming Friend Requests - Shows pending requests the user received
// ============================================================================

'use client';

import { useState, useTransition } from 'react';
import { acceptFriendRequest, rejectFriendRequest } from '@/actions/friends';
import type { FriendRequestWithUser } from '@/types';

interface IncomingFriendRequestsProps {
  requests: FriendRequestWithUser[];
}

export function IncomingFriendRequests({ requests }: IncomingFriendRequestsProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAccept = (requestId: string) => {
    startTransition(async () => {
      const result = await acceptFriendRequest(requestId);
      if (result.success) {
        setProcessedIds((prev) => new Set(prev).add(requestId));
        showMessage('success', 'Friend added!');
      } else {
        showMessage('error', result.error || 'Failed to accept');
      }
    });
  };

  const handleReject = (requestId: string) => {
    startTransition(async () => {
      const result = await rejectFriendRequest(requestId);
      if (result.success) {
        setProcessedIds((prev) => new Set(prev).add(requestId));
      } else {
        showMessage('error', result.error || 'Failed to reject');
      }
    });
  };

  const activeRequests = requests.filter((r) => !processedIds.has(r.id));

  if (activeRequests.length === 0) {
    return null;
  }

  return (
    <div className="bg-dark-surface rounded-lg border border-dark-border overflow-hidden">
      <div className="px-4 py-3 bg-dark-elevated border-b border-dark-border flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-100">Friend Requests</h2>
        <span className="px-2 py-0.5 bg-accent text-white text-xs font-medium rounded-full">
          {activeRequests.length}
        </span>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`px-4 py-2 text-sm ${
            message.type === 'success'
              ? 'bg-green-900/30 text-green-400'
              : 'bg-red-900/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="divide-y divide-dark-border">
        {activeRequests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-100">@{request.from_user.username}</span>
              <span className="text-xs text-gray-500 ml-2">wants to be friends</span>
            </div>
            <div className="flex gap-2 ml-3">
              <button
                onClick={() => handleAccept(request.id)}
                disabled={isPending}
                className="px-3 py-1.5 bg-accent text-white text-xs font-medium rounded hover:bg-accent-dark disabled:opacity-50 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => handleReject(request.id)}
                disabled={isPending}
                className="px-3 py-1.5 bg-dark-elevated text-gray-400 text-xs font-medium rounded hover:text-red-400 disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
