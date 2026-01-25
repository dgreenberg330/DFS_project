// ============================================================================
// Email Server Actions
// ============================================================================

'use server';

import { createAdminClient } from '@/lib/supabase-admin';
import { getUser, createClient } from '@/lib/supabase-server';
import { checkAdminAccess } from '@/lib/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  sendLockReminderEmail,
  sendContestResultsEmail,
  sendNewContestEmail,
  isEmailConfigured,
} from '@/lib/email';
import type { EmailPreferencesInput, EmailType } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://shugsy.com';

// ============================================================================
// User Actions
// ============================================================================

/**
 * Update email preferences for current user
 */
export async function updateEmailPreferences(
  preferences: EmailPreferencesInput
): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('user_profiles')
    .update(preferences)
    .eq('user_id', user.id);

  if (error) {
    return { error: `Failed to update preferences: ${error.message}` };
  }

  revalidatePath('/account');
  return {};
}

/**
 * Unsubscribe from emails using token (no auth required)
 */
export async function unsubscribeByToken(
  token: string,
  emailType?: string
): Promise<{ success: boolean; error?: string }> {
  if (!token || token.trim() === '') {
    return { success: false, error: 'Invalid unsubscribe token' };
  }

  const supabase = createAdminClient();

  // Find user by token
  const { data: profile, error: findError } = await supabase
    .from('user_profiles')
    .select('id, email_lock_reminders, email_contest_results, email_new_contests')
    .eq('unsubscribe_token', token)
    .single();

  if (findError || !profile) {
    return { success: false, error: 'Invalid or expired unsubscribe link' };
  }

  // Determine which preference to update
  let updateData: Partial<EmailPreferencesInput> = {};

  if (emailType === 'lock_reminders') {
    updateData = { email_lock_reminders: false };
  } else if (emailType === 'contest_results') {
    updateData = { email_contest_results: false };
  } else if (emailType === 'new_contests') {
    updateData = { email_new_contests: false };
  } else {
    // Unsubscribe from all
    updateData = {
      email_lock_reminders: false,
      email_contest_results: false,
      email_new_contests: false,
    };
  }

  const { error: updateError } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('id', profile.id);

  if (updateError) {
    return { success: false, error: 'Failed to update preferences' };
  }

  return { success: true };
}

// ============================================================================
// Admin Actions - Lock Reminders
// ============================================================================

/**
 * Send lock reminder emails for a contest
 * Targets users who have NOT yet submitted a lineup
 */
export async function sendLockReminderEmails(
  contestId: string,
  hoursUntilLock: number = 24
): Promise<{ sent: number; failed: number; errors: string[] }> {
  await checkAdminAccess();

  if (!isEmailConfigured()) {
    throw new Error('Email service not configured. Set RESEND_API_KEY environment variable.');
  }

  const supabase = createAdminClient();

  // Get contest details
  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .select('id, name, status')
    .eq('id', contestId)
    .single();

  if (contestError || !contest) {
    throw new Error('Contest not found');
  }

  if (contest.status !== 'upcoming') {
    throw new Error('Can only send reminders for upcoming contests');
  }

  // Get users who already have entries in this contest
  const { data: existingEntries } = await supabase
    .from('entries')
    .select('user_id')
    .eq('contest_id', contestId);

  const usersWithEntries = new Set((existingEntries || []).map(e => e.user_id));

  // Get all users with email_lock_reminders enabled
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('user_id, username, unsubscribe_token, email_lock_reminders')
    .eq('email_lock_reminders', true);

  if (profilesError) {
    throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
  }

  // Filter out users who already have entries
  const eligibleProfiles = (profiles || []).filter(
    p => !usersWithEntries.has(p.user_id)
  );

  if (eligibleProfiles.length === 0) {
    return { sent: 0, failed: 0, errors: [] };
  }

  // Get emails from auth.users
  const userIds = eligibleProfiles.map(p => p.user_id);
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    throw new Error(`Failed to fetch user emails: ${authError.message}`);
  }

  const userEmailMap = new Map(
    authUsers.users.filter(u => userIds.includes(u.id)).map(u => [u.id, u.email])
  );

  // Send emails
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const profile of eligibleProfiles) {
    const email = userEmailMap.get(profile.user_id);
    if (!email) continue;

    // Check for duplicate - don't send if already sent today
    const { data: existingLog } = await supabase
      .from('email_logs')
      .select('id')
      .eq('user_id', profile.user_id)
      .eq('contest_id', contestId)
      .eq('email_type', 'lock_reminder')
      .eq('status', 'sent')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (existingLog) {
      continue; // Skip - already sent recently
    }

    const result = await sendLockReminderEmail(
      email,
      profile.unsubscribe_token || '',
      {
        username: profile.username,
        contestName: contest.name,
        hoursUntilLock,
        contestUrl: `${APP_URL}/contests/${contestId}`,
      }
    );

    // Log the email
    await supabase.from('email_logs').insert({
      user_id: profile.user_id,
      contest_id: contestId,
      email_type: 'lock_reminder' as EmailType,
      recipient_email: email,
      subject: `Lineups lock in ${hoursUntilLock} hours - ${contest.name}`,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error || null,
      resend_id: result.resendId || null,
      sent_at: result.success ? new Date().toISOString() : null,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${email}: ${result.error}`);
    }
  }

  return { sent, failed, errors };
}

// ============================================================================
// Admin Actions - Contest Results
// ============================================================================

/**
 * Send contest results emails to all participants
 */
export async function sendContestResultsEmails(
  contestId: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  await checkAdminAccess();

  if (!isEmailConfigured()) {
    throw new Error('Email service not configured. Set RESEND_API_KEY environment variable.');
  }

  const supabase = createAdminClient();

  // Get contest details
  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .select('id, name, status')
    .eq('id', contestId)
    .single();

  if (contestError || !contest) {
    throw new Error('Contest not found');
  }

  if (contest.status !== 'resolved') {
    throw new Error('Can only send results for resolved contests');
  }

  // Get all entries with lineups and user profiles
  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select(`
      user_id,
      lineup:lineups (total_score)
    `)
    .eq('contest_id', contestId);

  if (entriesError) {
    throw new Error(`Failed to fetch entries: ${entriesError.message}`);
  }

  if (!entries || entries.length === 0) {
    return { sent: 0, failed: 0, errors: [] };
  }

  // Calculate ranks
  const entriesWithScores = entries.map(e => {
    const lineup = Array.isArray(e.lineup) ? e.lineup[0] : e.lineup;
    return {
      user_id: e.user_id,
      total_score: lineup?.total_score || 0,
    };
  });

  entriesWithScores.sort((a, b) => b.total_score - a.total_score);

  const rankedEntries: { user_id: string; total_score: number; rank: number }[] = [];
  let currentRank = 1;
  for (let i = 0; i < entriesWithScores.length; i++) {
    if (i > 0 && entriesWithScores[i].total_score < entriesWithScores[i - 1].total_score) {
      currentRank = i + 1;
    }
    rankedEntries.push({ ...entriesWithScores[i], rank: currentRank });
  }

  const totalEntries = rankedEntries.length;

  // Get profiles with email preferences
  const userIds = rankedEntries.map(e => e.user_id);
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, username, unsubscribe_token, email_contest_results')
    .in('user_id', userIds);

  const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

  // Get emails
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const userEmailMap = new Map(
    authUsers.users.filter(u => userIds.includes(u.id)).map(u => [u.id, u.email])
  );

  // Send emails
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const entry of rankedEntries) {
    const profile = profileMap.get(entry.user_id);
    if (!profile || !profile.email_contest_results) continue;

    const email = userEmailMap.get(entry.user_id);
    if (!email) continue;

    // Check for duplicate
    const { data: existingLog } = await supabase
      .from('email_logs')
      .select('id')
      .eq('user_id', entry.user_id)
      .eq('contest_id', contestId)
      .eq('email_type', 'contest_results')
      .eq('status', 'sent')
      .maybeSingle();

    if (existingLog) continue;

    const result = await sendContestResultsEmail(
      email,
      profile.unsubscribe_token || '',
      {
        username: profile.username,
        contestName: contest.name,
        rank: entry.rank,
        totalEntries,
        score: entry.total_score,
        leaderboardUrl: `${APP_URL}/contests/${contestId}/leaderboard`,
      }
    );

    // Log the email
    await supabase.from('email_logs').insert({
      user_id: entry.user_id,
      contest_id: contestId,
      email_type: 'contest_results' as EmailType,
      recipient_email: email,
      subject: entry.rank === 1
        ? `You won ${contest.name}!`
        : `Your results for ${contest.name}`,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error || null,
      resend_id: result.resendId || null,
      sent_at: result.success ? new Date().toISOString() : null,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${email}: ${result.error}`);
    }
  }

  return { sent, failed, errors };
}

// ============================================================================
// Admin Actions - New Contest Announcement
// ============================================================================

/**
 * Send new contest announcement emails to all opted-in users
 */
export async function sendNewContestEmails(
  contestId: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  await checkAdminAccess();

  if (!isEmailConfigured()) {
    throw new Error('Email service not configured. Set RESEND_API_KEY environment variable.');
  }

  const supabase = createAdminClient();

  // Get contest details with movie count
  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .select('id, name, weekend_start, weekend_end, status, published')
    .eq('id', contestId)
    .single();

  if (contestError || !contest) {
    throw new Error('Contest not found');
  }

  if (!contest.published) {
    throw new Error('Can only announce published contests');
  }

  // Get movie count
  const { count: movieCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('contest_id', contestId);

  // Get all users with email_new_contests enabled
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('user_id, username, unsubscribe_token, email_new_contests')
    .eq('email_new_contests', true);

  if (profilesError) {
    throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
  }

  if (!profiles || profiles.length === 0) {
    return { sent: 0, failed: 0, errors: [] };
  }

  // Get emails
  const userIds = profiles.map(p => p.user_id);
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const userEmailMap = new Map(
    authUsers.users.filter(u => userIds.includes(u.id)).map(u => [u.id, u.email])
  );

  // Format weekend dates
  const weekendStart = new Date(contest.weekend_start + 'T00:00:00');
  const weekendEnd = new Date(contest.weekend_end + 'T00:00:00');
  const weekendDates = `${weekendStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekendEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  // Send emails
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const profile of profiles) {
    const email = userEmailMap.get(profile.user_id);
    if (!email) continue;

    // Check for duplicate
    const { data: existingLog } = await supabase
      .from('email_logs')
      .select('id')
      .eq('user_id', profile.user_id)
      .eq('contest_id', contestId)
      .eq('email_type', 'new_contest')
      .eq('status', 'sent')
      .maybeSingle();

    if (existingLog) continue;

    const result = await sendNewContestEmail(
      email,
      profile.unsubscribe_token || '',
      {
        username: profile.username,
        contestName: contest.name,
        weekendDates,
        movieCount: movieCount || 0,
        contestUrl: `${APP_URL}/contests/${contestId}`,
      }
    );

    // Log the email
    await supabase.from('email_logs').insert({
      user_id: profile.user_id,
      contest_id: contestId,
      email_type: 'new_contest' as EmailType,
      recipient_email: email,
      subject: `New contest: ${contest.name}`,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error || null,
      resend_id: result.resendId || null,
      sent_at: result.success ? new Date().toISOString() : null,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${email}: ${result.error}`);
    }
  }

  return { sent, failed, errors };
}

// ============================================================================
// Admin Utilities
// ============================================================================

/**
 * Get email stats for a contest
 */
export async function getContestEmailStats(contestId: string): Promise<{
  lockReminders: { sent: number; failed: number };
  results: { sent: number; failed: number };
  newContest: { sent: number; failed: number };
}> {
  await checkAdminAccess();

  const supabase = createAdminClient();

  const { data: logs } = await supabase
    .from('email_logs')
    .select('email_type, status')
    .eq('contest_id', contestId);

  const stats = {
    lockReminders: { sent: 0, failed: 0 },
    results: { sent: 0, failed: 0 },
    newContest: { sent: 0, failed: 0 },
  };

  for (const log of logs || []) {
    const key = log.email_type === 'lock_reminder' ? 'lockReminders'
      : log.email_type === 'contest_results' ? 'results'
      : 'newContest';

    if (log.status === 'sent') {
      stats[key].sent++;
    } else if (log.status === 'failed') {
      stats[key].failed++;
    }
  }

  return stats;
}
