// ============================================================================
// Friends Page - View and manage friends
// ============================================================================

import { getUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getFriends, getIncomingFriendRequests, getOutgoingFriendRequests } from '@/actions/friends';
import { getSentInvites } from '@/actions/friend-invites';
import { Header } from '@/components/header';
import { FriendsPageContent } from '@/components/friends-page-content';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Friends',
  description: 'View and manage your friends on Shugsy.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function FriendsPage() {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  const [friends, incomingRequests, outgoingRequests, pendingInvites] = await Promise.all([
    getFriends(),
    getIncomingFriendRequests(),
    getOutgoingFriendRequests(),
    getSentInvites(),
  ]);

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <FriendsPageContent
          friends={friends}
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          pendingInvites={pendingInvites}
        />
      </div>
    </div>
  );
}
