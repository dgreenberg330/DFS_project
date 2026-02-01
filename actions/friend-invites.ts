// ============================================================================
// Friend Invites Server Actions
// ============================================================================

'use server';

import { getUser, createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { sendFriendInviteEmail } from '@/lib/email';
import type { FriendInvite } from '@/types';

/**
 * Send a friend invite email to a non-user
 */
export async function sendFriendInvite(email: string): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const emailLower = email.trim().toLowerCase();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower)) {
    return { success: false, error: 'Invalid email address' };
  }

  // Don't allow inviting yourself
  if (emailLower === user.email?.toLowerCase()) {
    return { success: false, error: 'Cannot invite yourself' };
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Check if email is already registered
  const { data: existingProfile } = await adminClient
    .from('user_profiles')
    .select('user_id')
    .eq('user_id', (
      await adminClient.auth.admin.listUsers()
    ).data.users.find((u) => u.email?.toLowerCase() === emailLower)?.id || '')
    .maybeSingle();

  // Simpler check: search for user by email in auth.users via admin
  const { data: usersData } = await adminClient.auth.admin.listUsers();
  const existingUser = usersData?.users.find((u) => u.email?.toLowerCase() === emailLower);

  if (existingUser) {
    return { success: false, error: 'This person already has an account. Search for their username instead.' };
  }

  // Check if invite already sent
  const { data: existingInvite } = await supabase
    .from('friend_invites')
    .select('id, status')
    .eq('inviter_user_id', user.id)
    .eq('invited_email', emailLower)
    .maybeSingle();

  if (existingInvite) {
    if (existingInvite.status === 'pending') {
      return { success: false, error: 'Invite already sent to this email' };
    }
    // If cancelled, we can re-send - delete old invite first
    await supabase
      .from('friend_invites')
      .delete()
      .eq('id', existingInvite.id);
  }

  // Create invite
  const { data: invite, error: insertError } = await supabase
    .from('friend_invites')
    .insert({
      inviter_user_id: user.id,
      invited_email: emailLower,
      status: 'pending',
    })
    .select('invite_token')
    .single();

  if (insertError || !invite) {
    console.error('Failed to create invite:', insertError?.message);
    return { success: false, error: 'Failed to create invite' };
  }

  // Get inviter's username
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('username')
    .eq('user_id', user.id)
    .single();

  // Send email
  const emailResult = await sendFriendInviteEmail(emailLower, {
    inviterUsername: profile?.username || 'A friend',
    inviteToken: invite.invite_token,
  });

  if (!emailResult.success) {
    // Clean up invite if email fails
    await supabase
      .from('friend_invites')
      .delete()
      .eq('inviter_user_id', user.id)
      .eq('invited_email', emailLower);

    return { success: false, error: 'Failed to send invite email' };
  }

  revalidatePath('/account');
  return { success: true };
}

/**
 * Get pending invites sent by current user
 */
export async function getSentInvites(): Promise<FriendInvite[]> {
  const user = await getUser();
  if (!user) {
    return [];
  }

  const supabase = await createClient();

  const { data: invites, error } = await supabase
    .from('friend_invites')
    .select('*')
    .eq('inviter_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch invites:', error.message);
    return [];
  }

  return invites || [];
}

/**
 * Cancel a pending invite
 */
export async function cancelInvite(inviteId: string): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('friend_invites')
    .update({ status: 'cancelled' })
    .eq('id', inviteId)
    .eq('inviter_user_id', user.id)
    .eq('status', 'pending');

  if (error) {
    console.error('Failed to cancel invite:', error.message);
    return { success: false, error: 'Failed to cancel invite' };
  }

  revalidatePath('/account');
  return { success: true };
}

/**
 * Process an invite when a user signs up
 * Called from auth callback when invite_token is present
 * Returns the inviter's user ID if successful
 */
export async function processInviteSignup(
  inviteToken: string,
  newUserId: string
): Promise<{ success: boolean; inviterUserId?: string }> {
  const adminClient = createAdminClient();

  // Find the invite
  const { data: invite, error: fetchError } = await adminClient
    .from('friend_invites')
    .select('*')
    .eq('invite_token', inviteToken)
    .eq('status', 'pending')
    .maybeSingle();

  if (fetchError || !invite) {
    return { success: false };
  }

  // Update invite status
  await adminClient
    .from('friend_invites')
    .update({
      status: 'accepted',
      registered_user_id: newUserId,
    })
    .eq('id', invite.id);

  // Auto-create friendship
  const [userA, userB] = invite.inviter_user_id < newUserId
    ? [invite.inviter_user_id, newUserId]
    : [newUserId, invite.inviter_user_id];

  await adminClient
    .from('friendships')
    .insert({
      user_a_id: userA,
      user_b_id: userB,
    });

  return { success: true, inviterUserId: invite.inviter_user_id };
}

/**
 * Check if a new user's email has pending invites and create friend requests
 * Called from auth callback after signup (when no invite token)
 */
export async function processPendingInvitesForEmail(
  email: string,
  newUserId: string
): Promise<void> {
  const adminClient = createAdminClient();
  const emailLower = email.toLowerCase();

  // Find all pending invites for this email
  const { data: invites } = await adminClient
    .from('friend_invites')
    .select('id, inviter_user_id')
    .eq('invited_email', emailLower)
    .eq('status', 'pending');

  if (!invites || invites.length === 0) {
    return;
  }

  // Create friend requests from each inviter
  for (const invite of invites) {
    // Create friend request (use upsert to handle duplicates)
    await adminClient
      .from('friend_requests')
      .upsert(
        {
          from_user_id: invite.inviter_user_id,
          to_user_id: newUserId,
          status: 'pending',
        },
        { onConflict: 'from_user_id,to_user_id', ignoreDuplicates: true }
      );

    // Update invite status
    await adminClient
      .from('friend_invites')
      .update({
        status: 'accepted',
        registered_user_id: newUserId,
      })
      .eq('id', invite.id);
  }
}
