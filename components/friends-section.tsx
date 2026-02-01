// ============================================================================
// Friends Section - Container for all friends functionality
// ============================================================================

import { getFriends, getIncomingFriendRequests, getOutgoingFriendRequests } from '@/actions/friends';
import { getSentInvites } from '@/actions/friend-invites';
import { UserSearch } from './user-search';
import { FriendInviteForm } from './friend-invite-form';
import { FriendRequests } from './friend-requests';
import { FriendsList } from './friends-list';
import { PendingInvites } from './pending-invites';

export async function FriendsSection() {
  const [friends, incomingRequests, outgoingRequests, pendingInvites] = await Promise.all([
    getFriends(),
    getIncomingFriendRequests(),
    getOutgoingFriendRequests(),
    getSentInvites(),
  ]);

  const hasRequests = incomingRequests.length > 0 || outgoingRequests.length > 0;

  return (
    <div className="bg-dark-surface rounded-lg border border-dark-border">
      <div className="p-4 sm:p-6 border-b border-dark-border bg-dark-elevated rounded-t-lg">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-100">Friends</h2>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">Add friends to compare on leaderboards</p>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Search and Invite */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Search Users</label>
            <UserSearch />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Invite by Email</label>
            <FriendInviteForm />
          </div>
        </div>

        {/* Friend Requests */}
        {hasRequests && (
          <FriendRequests
            incomingRequests={incomingRequests}
            outgoingRequests={outgoingRequests}
          />
        )}

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <PendingInvites invites={pendingInvites} />
        )}

        {/* Friends List */}
        <FriendsList friends={friends} />
      </div>
    </div>
  );
}
