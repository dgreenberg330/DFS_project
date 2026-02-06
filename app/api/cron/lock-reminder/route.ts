// ============================================================================
// Cron Endpoint: Lock Reminder Emails
// ============================================================================
// Vercel Cron calls this endpoint to send lock reminder emails
// Schedule: Thursday 5PM ET (22:00 UTC) - 3 hours before 8PM ET lock
// ============================================================================

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendLockReminderEmails } from '@/actions/emails';
import { isEmailConfigured } from '@/lib/email';
import { isPushConfigured } from '@/lib/push';

// Verify cron secret to prevent unauthorized calls
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If no secret configured, allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === 'development';
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if any notification service is configured
  if (!isEmailConfigured() && !isPushConfigured()) {
    return NextResponse.json({
      message: 'No notification services configured',
      skipped: true,
    });
  }

  const supabase = createAdminClient();

  // Find upcoming contests that lock within 4 hours (cron runs 3 hours before lock)
  const now = new Date();
  const in4Hours = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  const { data: contests, error } = await supabase
    .from('contests')
    .select('id, name, lock_time')
    .eq('status', 'upcoming')
    .eq('published', true)
    .gte('lock_time', now.toISOString())
    .lte('lock_time', in4Hours.toISOString());

  if (error) {
    console.error('Failed to fetch contests:', error);
    return NextResponse.json({ error: 'Failed to fetch contests' }, { status: 500 });
  }

  if (!contests || contests.length === 0) {
    return NextResponse.json({
      message: 'No contests locking soon',
      contests: 0,
    });
  }

  const results: {
    contestId: string;
    contestName: string;
    hoursUntilLock: number;
    sent: number;
    failed: number;
    pushSent: number;
    pushFailed: number;
  }[] = [];

  for (const contest of contests) {
    try {
      const { sent, failed, pushSent, pushFailed } = await sendLockReminderEmails(contest.id, 3);
      results.push({
        contestId: contest.id,
        contestName: contest.name,
        hoursUntilLock: 3,
        sent,
        failed,
        pushSent,
        pushFailed,
      });
    } catch (err) {
      console.error(`Failed to send reminders for ${contest.name}:`, err);
      results.push({
        contestId: contest.id,
        contestName: contest.name,
        hoursUntilLock: 3,
        sent: 0,
        failed: -1, // Indicates complete failure
        pushSent: 0,
        pushFailed: 0,
      });
    }
  }

  return NextResponse.json({
    message: 'Lock reminder cron completed',
    results,
  });
}
