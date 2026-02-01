// ============================================================================
// Friends Server Actions
// ============================================================================

'use server';

import { getUser, createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import type { FriendData, FriendRequestWithUser, UserSearchResult } from '@/types';

/**
 * Search users by username
 * Returns up to 10 results with friend status
 */
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const user = await getUser();
  if (!user) {
    return [];
  }

  const supabase = await createClient();
  const searchTerm = query.trim().toLowerCase();

  // Search for users by username (case-insensitive partial match)
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('user_id, username')
    .ilike('username', `%${searchTerm}%`)
    .neq('user_id', user.id)
    .limit(10);

  if (error) {
    console.error('Failed to search users:', error.message);
    return [];
  }

  if (!profiles || profiles.length === 0) {
    return [];
  }

  // Get friend statuses for these users
  const userIds = profiles.map((p) => p.user_id);

  // Check friendships
  const { data: friendships } = await supabase
    .from('friendships')
    .select('id, user_a_id, user_b_id')
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

  // Check pending requests
  const { data: requests } = await supabase
    .from('friend_requests')
    .select('id, from_user_id, to_user_id, status')
    .eq('status', 'pending')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);

  // Build friend status map
  const friendSet = new Set<string>();
  const pendingSentMap = new Map<string, string>();
  const pendingReceivedMap = new Map<string, string>();

  friendships?.forEach((f) => {
    const friendId = f.user_a_id === user.id ? f.user_b_id : f.user_a_id;
    friendSet.add(friendId);
  });

  requests?.forEach((r) => {
    if (r.from_user_id === user.id) {
      pendingSentMap.set(r.to_user_id, r.id);
    } else {
      pendingReceivedMap.set(r.from_user_id, r.id);
    }
  });

  return profiles.map((profile) => {
    let friend_status: UserSearchResult['friend_status'] = 'none';
    let request_id: string | undefined;

    if (friendSet.has(profile.user_id)) {
      friend_status = 'friends';
    } else if (pendingSentMap.has(profile.user_id)) {
      friend_status = 'pending_sent';
      request_id = pendingSentMap.get(profile.user_id);
    } else if (pendingReceivedMap.has(profile.user_id)) {
      friend_status = 'pending_received';
      request_id = pendingReceivedMap.get(profile.user_id);
    }

    return {
      user_id: profile.user_id,
      username: profile.username,
      friend_status,
      request_id,
    };
  });
}

/**
 * Send a friend request to another user
 */
export async function sendFriendRequest(toUserId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  if (toUserId === user.id) {
    return { success: false, error: 'Cannot send friend request to yourself' };
  }

  const supabase = await createClient();

  // Check if already friends
  const { data: existingFriendship } = await supabase
    .from('friendships')
    .select('id')
    .or(
      `and(user_a_id.eq.${user.id},user_b_id.eq.${toUserId}),and(user_a_id.eq.${toUserId},user_b_id.eq.${user.id})`
    )
    .maybeSingle();

  if (existingFriendship) {
    return { success: false, error: 'Already friends with this user' };
  }

  // Check if request already exists
  const { data: existingRequest } = await supabase
    .from('friend_requests')
    .select('id, status')
    .or(
      `and(from_user_id.eq.${user.id},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${user.id})`
    )
    .eq('status', 'pending')
    .maybeSingle();

  if (existingRequest) {
    return { success: false, error: 'Friend request already pending' };
  }

  // Create friend request
  const { error } = await supabase
    .from('friend_requests')
    .insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      status: 'pending',
    });

  if (error) {
    console.error('Failed to send friend request:', error.message);
    return { success: false, error: 'Failed to send friend request' };
  }

  revalidatePath('/account');
  return { success: true };
}

/**
 * Accept a friend request
 * Creates friendship and updates request status
 */
export async function acceptFriendRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  // Get the request and verify user is the recipient
  const { data: request, error: fetchError } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('id', requestId)
    .eq('to_user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (fetchError || !request) {
    return { success: false, error: 'Friend request not found' };
  }

  // Use admin client to create friendship (bypasses RLS for insert)
  const adminClient = createAdminClient();

  // Ensure consistent ordering for friendship
  const [userA, userB] = request.from_user_id < user.id
    ? [request.from_user_id, user.id]
    : [user.id, request.from_user_id];

  const { error: friendshipError } = await adminClient
    .from('friendships')
    .insert({
      user_a_id: userA,
      user_b_id: userB,
    });

  if (friendshipError) {
    console.error('Failed to create friendship:', friendshipError.message);
    return { success: false, error: 'Failed to create friendship' };
  }

  // Update request status
  const { error: updateError } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (updateError) {
    console.error('Failed to update request status:', updateError.message);
  }

  revalidatePath('/account');
  return { success: true };
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('friend_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)
    .eq('to_user_id', user.id)
    .eq('status', 'pending');

  if (error) {
    console.error('Failed to reject friend request:', error.message);
    return { success: false, error: 'Failed to reject friend request' };
  }

  revalidatePath('/account');
  return { success: true };
}

/**
 * Cancel a sent friend request
 */
export async function cancelFriendRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', requestId)
    .eq('from_user_id', user.id)
    .eq('status', 'pending');

  if (error) {
    console.error('Failed to cancel friend request:', error.message);
    return { success: false, error: 'Failed to cancel friend request' };
  }

  revalidatePath('/account');
  return { success: true };
}

/**
 * Remove a friend (delete friendship)
 */
export async function removeFriend(friendUserId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  // Try deleting in either direction
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(
      `and(user_a_id.eq.${user.id},user_b_id.eq.${friendUserId}),and(user_a_id.eq.${friendUserId},user_b_id.eq.${user.id})`
    );

  if (error) {
    console.error('Failed to remove friend:', error.message);
    return { success: false, error: 'Failed to remove friend' };
  }

  revalidatePath('/account');
  return { success: true };
}

/**
 * Get list of friends with usernames
 */
export async function getFriends(): Promise<FriendData[]> {
  const user = await getUser();
  if (!user) {
    return [];
  }

  const supabase = await createClient();

  // Get all friendships
  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('id, user_a_id, user_b_id, created_at')
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error || !friendships) {
    console.error('Failed to fetch friends:', error?.message);
    return [];
  }

  // Get friend user IDs
  const friendUserIds = friendships.map((f) =>
    f.user_a_id === user.id ? f.user_b_id : f.user_a_id
  );

  if (friendUserIds.length === 0) {
    return [];
  }

  // Get friend profiles
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, username')
    .in('user_id', friendUserIds);

  if (!profiles) {
    return [];
  }

  // Create username lookup
  const usernameMap = new Map(profiles.map((p) => [p.user_id, p.username]));

  return friendships.map((f) => {
    const friendId = f.user_a_id === user.id ? f.user_b_id : f.user_a_id;
    return {
      user_id: friendId,
      username: usernameMap.get(friendId) || 'Unknown',
      friendship_id: f.id,
      created_at: f.created_at,
    };
  });
}

/**
 * Get incoming friend requests (to current user)
 */
export async function getIncomingFriendRequests(): Promise<FriendRequestWithUser[]> {
  const user = await getUser();
  if (!user) {
    return [];
  }

  const supabase = await createClient();

  const { data: requests, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('to_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error || !requests) {
    return [];
  }

  // Get sender profiles
  const senderIds = requests.map((r) => r.from_user_id);
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, username')
    .in('user_id', senderIds);

  const usernameMap = new Map(profiles?.map((p) => [p.user_id, p.username]) || []);

  return requests.map((r) => ({
    ...r,
    from_user: {
      id: r.from_user_id,
      username: usernameMap.get(r.from_user_id) || 'Unknown',
    },
    to_user: {
      id: user.id,
      username: '', // Not needed for incoming
    },
  }));
}

/**
 * Get outgoing friend requests (from current user)
 */
export async function getOutgoingFriendRequests(): Promise<FriendRequestWithUser[]> {
  const user = await getUser();
  if (!user) {
    return [];
  }

  const supabase = await createClient();

  const { data: requests, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('from_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error || !requests) {
    return [];
  }

  // Get recipient profiles
  const recipientIds = requests.map((r) => r.to_user_id);
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, username')
    .in('user_id', recipientIds);

  const usernameMap = new Map(profiles?.map((p) => [p.user_id, p.username]) || []);

  return requests.map((r) => ({
    ...r,
    from_user: {
      id: user.id,
      username: '', // Not needed for outgoing
    },
    to_user: {
      id: r.to_user_id,
      username: usernameMap.get(r.to_user_id) || 'Unknown',
    },
  }));
}

/**
 * Get friend IDs for leaderboard filtering
 */
export async function getFriendIds(): Promise<string[]> {
  const user = await getUser();
  if (!user) {
    return [];
  }

  const supabase = await createClient();

  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('user_a_id, user_b_id')
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`);

  if (error || !friendships) {
    return [];
  }

  return friendships.map((f) =>
    f.user_a_id === user.id ? f.user_b_id : f.user_a_id
  );
}
