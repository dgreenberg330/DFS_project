// ============================================================================
// Friend Requests Component - Show incoming and outgoing requests
// ============================================================================

'use client';

import { useTransition, useState } from 'react';
import { acceptFriendRequest, rejectFriendRequest, cancelFriendRequest } from '@/actions/friends';
import type { FriendRequestWithUser } from '@/types';

interface FriendRequestsProps {
  incomingRequests: FriendRequestWithUser[];
  outgoingRequests: FriendRequestWithUser[];
}

export function FriendRequests({ incomingRequests, outgoingRequests }: FriendRequestsProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  const handleAccept = (requestId: string) => {
    startTransition(async () => {
      const result = await acceptFriendRequest(requestId);
      if (result.success) {
        setMessage({ type: 'success', text: 'Friend added!' });
        setProcessedIds((prev) => new Set(prev).add(requestId));
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to accept' });
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const handleReject = (requestId: string) => {
    startTransition(async () => {
      const result = await rejectFriendRequest(requestId);
      if (result.success) {
        setProcessedIds((prev) => new Set(prev).add(requestId));
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to reject' });
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  const handleCancel = (requestId: string) => {
    startTransition(async () => {
      const result = await cancelFriendRequest(requestId);
      if (result.success) {
        setProcessedIds((prev) => new Set(prev).add(requestId));
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to cancel' });
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  // Filter out processed requests
  const filteredIncoming = incomingRequests.filter((r) => !processedIds.has(r.id));
  const filteredOutgoing = outgoingRequests.filter((r) => !processedIds.has(r.id));

  const totalRequests = filteredIncoming.length + filteredOutgoing.length;

  if (totalRequests === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-300">
        Friend Requests ({totalRequests})
      </h3>

      {/* Incoming requests */}
      {filteredIncoming.map((request) => (
        <div
          key={request.id}
          className="flex items-center justify-between py-2 px-3 bg-dark-elevated rounded-lg"
        >
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-100">@{request.from_user.username}</span>
            <span className="text-xs text-gray-400 ml-2">wants to be friends</span>
          </div>
          <div className="flex gap-2 ml-2">
            <button
              onClick={() => handleAccept(request.id)}
              disabled={isPending}
              className="px-3 py-1 bg-accent text-white text-xs font-medium rounded hover:bg-accent-dark disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => handleReject(request.id)}
              disabled={isPending}
              className="px-3 py-1 bg-dark-surface text-gray-400 text-xs font-medium rounded hover:text-red-400 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      ))}

      {/* Outgoing requests */}
      {filteredOutgoing.map((request) => (
        <div
          key={request.id}
          className="flex items-center justify-between py-2 px-3 bg-dark-elevated rounded-lg"
        >
          <div className="flex-1 min-w-0">
            <span className="text-xs text-gray-400">Sent to </span>
            <span className="text-sm text-gray-100">@{request.to_user.username}</span>
            <span className="text-xs text-gray-500 ml-2">(pending)</span>
          </div>
          <button
            onClick={() => handleCancel(request.id)}
            disabled={isPending}
            className="px-3 py-1 text-xs text-gray-400 hover:text-red-400 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      ))}

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
