// ============================================================================
// Pending Invites Component - Show sent email invites
// ============================================================================

'use client';

import { useState, useTransition } from 'react';
import { cancelInvite } from '@/actions/friend-invites';
import type { FriendInvite } from '@/types';

interface PendingInvitesProps {
  invites: FriendInvite[];
}

export function PendingInvites({ invites }: PendingInvitesProps) {
  const [isPending, startTransition] = useTransition();
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCancel = (inviteId: string) => {
    startTransition(async () => {
      const result = await cancelInvite(inviteId);
      if (result.success) {
        setCancelledIds((prev) => new Set(prev).add(inviteId));
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to cancel invite' });
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  const filteredInvites = invites.filter((i) => !cancelledIds.has(i.id));

  if (filteredInvites.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-300">
        Pending Invites ({filteredInvites.length})
      </h3>

      {filteredInvites.map((invite) => (
        <div
          key={invite.id}
          className="flex items-center justify-between py-2 px-3 bg-dark-elevated rounded-lg"
        >
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-100">{invite.invited_email}</span>
            <span className="text-xs text-gray-500 ml-2">(awaiting signup)</span>
          </div>
          <button
            onClick={() => handleCancel(invite.id)}
            disabled={isPending}
            className="text-xs text-gray-400 hover:text-red-400 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      ))}

      {/* Status message */}
      {message && (
        <div className="text-sm py-2 px-3 rounded bg-red-900/30 text-red-400">
          {message.text}
        </div>
      )}
    </div>
  );
}
