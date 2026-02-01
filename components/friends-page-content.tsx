// ============================================================================
// Friends Page Content - Client component with tabs for friends management
// ============================================================================

'use client';

import { useState, useTransition, useMemo } from 'react';
import { removeFriend, cancelFriendRequest, acceptFriendRequest, rejectFriendRequest } from '@/actions/friends';
import { cancelInvite } from '@/actions/friend-invites';
import { UserSearch } from './user-search';
import { FriendInviteForm } from './friend-invite-form';
import type { FriendData, FriendRequestWithUser, FriendInvite } from '@/types';

type Tab = 'friends' | 'requests' | 'add';

interface FriendsPageContentProps {
  friends: FriendData[];
  incomingRequests: FriendRequestWithUser[];
  outgoingRequests: FriendRequestWithUser[];
  pendingInvites: FriendInvite[];
}

export function FriendsPageContent({
  friends,
  incomingRequests,
  outgoingRequests,
  pendingInvites,
}: FriendsPageContentProps) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [removedFriendIds, setRemovedFriendIds] = useState<Set<string>>(new Set());
  const [cancelledRequestIds, setCancelledRequestIds] = useState<Set<string>>(new Set());
  const [cancelledInviteIds, setCancelledInviteIds] = useState<Set<string>>(new Set());
  const [processedIncomingIds, setProcessedIncomingIds] = useState<Set<string>>(new Set());

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Friend actions
  const handleRemoveFriend = (userId: string, username: string) => {
    if (!confirm(`Remove @${username} from friends?`)) return;
    startTransition(async () => {
      const result = await removeFriend(userId);
      if (result.success) {
        setRemovedFriendIds((prev) => new Set(prev).add(userId));
        showMessage('success', 'Friend removed');
      } else {
        showMessage('error', result.error || 'Failed to remove friend');
      }
    });
  };

  // Outgoing request actions
  const handleCancelRequest = (requestId: string) => {
    startTransition(async () => {
      const result = await cancelFriendRequest(requestId);
      if (result.success) {
        setCancelledRequestIds((prev) => new Set(prev).add(requestId));
      } else {
        showMessage('error', result.error || 'Failed to cancel request');
      }
    });
  };

  // Invite actions
  const handleCancelInvite = (inviteId: string) => {
    startTransition(async () => {
      const result = await cancelInvite(inviteId);
      if (result.success) {
        setCancelledInviteIds((prev) => new Set(prev).add(inviteId));
      } else {
        showMessage('error', result.error || 'Failed to cancel invite');
      }
    });
  };

  // Incoming request actions
  const handleAcceptRequest = (requestId: string) => {
    startTransition(async () => {
      const result = await acceptFriendRequest(requestId);
      if (result.success) {
        setProcessedIncomingIds((prev) => new Set(prev).add(requestId));
        showMessage('success', 'Friend added!');
      } else {
        showMessage('error', result.error || 'Failed to accept');
      }
    });
  };

  const handleRejectRequest = (requestId: string) => {
    startTransition(async () => {
      const result = await rejectFriendRequest(requestId);
      if (result.success) {
        setProcessedIncomingIds((prev) => new Set(prev).add(requestId));
      } else {
        showMessage('error', result.error || 'Failed to reject');
      }
    });
  };

  // Filter out removed/cancelled items
  const activeFriends = friends.filter((f) => !removedFriendIds.has(f.user_id));
  const activeOutgoingRequests = outgoingRequests.filter((r) => !cancelledRequestIds.has(r.id));
  const activeInvites = pendingInvites.filter((i) => !cancelledInviteIds.has(i.id));
  const activeIncomingRequests = incomingRequests.filter((r) => !processedIncomingIds.has(r.id));

  // Search filter for friends
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return activeFriends;
    const query = searchQuery.toLowerCase();
    return activeFriends.filter((f) => f.username.toLowerCase().includes(query));
  }, [activeFriends, searchQuery]);

  const hasPending = activeOutgoingRequests.length > 0 || activeInvites.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-xl font-bold text-gray-100">Friends</h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-dark-elevated rounded-lg">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'friends'
              ? 'bg-dark-surface text-gray-100'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Friends ({activeFriends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'requests'
              ? 'bg-dark-surface text-gray-100'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Requests {activeIncomingRequests.length > 0 && `(${activeIncomingRequests.length})`}
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'add'
              ? 'bg-dark-surface text-gray-100'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Add Friend
        </button>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`text-sm py-2 px-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-900/30 text-green-400'
              : 'bg-red-900/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div className="space-y-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-accent"
          />

          {/* Pending Requests & Invites */}
          {hasPending && (
            <div className="bg-dark-surface rounded-lg border border-dark-border overflow-hidden">
              <div className="px-4 py-3 bg-dark-elevated border-b border-dark-border">
                <h2 className="text-sm font-medium text-gray-300">Pending</h2>
              </div>
              <div className="divide-y divide-dark-border">
                {activeOutgoingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-100">@{request.to_user.username}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-dark-elevated text-gray-400 rounded">
                          Request sent
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelRequest(request.id)}
                      disabled={isPending}
                      className="text-xs text-gray-400 hover:text-red-400 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
                {activeInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-100">{invite.invited_email}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-dark-elevated text-gray-400 rounded">
                          Invite sent
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      disabled={isPending}
                      className="text-xs text-gray-400 hover:text-red-400 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          <div className="bg-dark-surface rounded-lg border border-dark-border overflow-hidden">
            {filteredFriends.length === 0 ? (
              <div className="px-4 py-8 text-center">
                {activeFriends.length === 0 ? (
                  <p className="text-sm text-gray-500">No friends yet. Go to Add Friend to get started!</p>
                ) : (
                  <p className="text-sm text-gray-500">No friends match &quot;{searchQuery}&quot;</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-dark-border">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.user_id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-dark-elevated transition-colors"
                  >
                    <span className="text-sm text-gray-100">@{friend.username}</span>
                    <button
                      onClick={() => handleRemoveFriend(friend.user_id, friend.username)}
                      disabled={isPending}
                      className="text-xs text-gray-400 hover:text-red-400 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="bg-dark-surface rounded-lg border border-dark-border overflow-hidden">
          {activeIncomingRequests.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No pending friend requests.</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-border">
              {activeIncomingRequests.map((request) => (
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
                      onClick={() => handleAcceptRequest(request.id)}
                      disabled={isPending}
                      className="px-3 py-1.5 bg-accent text-white text-xs font-medium rounded hover:bg-accent-dark disabled:opacity-50 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      disabled={isPending}
                      className="px-3 py-1.5 bg-dark-elevated text-gray-400 text-xs font-medium rounded hover:text-red-400 disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Friend Tab */}
      {activeTab === 'add' && (
        <div className="space-y-6">
          <div className="bg-dark-surface rounded-lg border border-dark-border">
            <div className="px-4 py-3 bg-dark-elevated border-b border-dark-border rounded-t-lg">
              <h2 className="text-sm font-medium text-gray-300">Search by username</h2>
            </div>
            <div className="p-4 pb-6">
              <UserSearch />
            </div>
          </div>

          <div className="bg-dark-surface rounded-lg border border-dark-border">
            <div className="px-4 py-3 bg-dark-elevated border-b border-dark-border rounded-t-lg">
              <h2 className="text-sm font-medium text-gray-300">Invite by email</h2>
            </div>
            <div className="p-4">
              <FriendInviteForm />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
