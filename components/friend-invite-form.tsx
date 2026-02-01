// ============================================================================
// Friend Invite Form - Invite non-users by email
// ============================================================================

'use client';

import { useState, useTransition } from 'react';
import { sendFriendInvite } from '@/actions/friend-invites';

export function FriendInviteForm() {
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    startTransition(async () => {
      const result = await sendFriendInvite(email);
      if (result.success) {
        setMessage({ type: 'success', text: 'Invite sent!' });
        setEmail('');
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send invite' });
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@email.com"
          disabled={isPending}
          className="flex-1 px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isPending || !email.trim()}
          className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Sending...' : 'Invite'}
        </button>
      </div>

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
    </form>
  );
}
