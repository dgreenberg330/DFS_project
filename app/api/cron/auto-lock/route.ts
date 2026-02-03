// ============================================================================
// Cron Endpoint: Auto-Lock Contests
// ============================================================================
// Vercel Cron calls this endpoint to automatically lock expired contests
// Schedule: Friday 00:00 and 01:00 UTC (covers Thursday 8PM ET in both EDT and EST)
// ============================================================================

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { ContestStatus } from '@/types';
import { revalidatePath } from 'next/cache';

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

  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  // Find all upcoming contests whose lock_time has passed
  const { data: expiredContests, error: fetchError } = await adminClient
    .from('contests')
    .select('id, name')
    .eq('status', ContestStatus.UPCOMING)
    .lt('lock_time', now);

  if (fetchError) {
    console.error('Auto-lock: Failed to fetch contests:', fetchError);
    return NextResponse.json({ error: 'Failed to fetch contests' }, { status: 500 });
  }

  if (!expiredContests || expiredContests.length === 0) {
    return NextResponse.json({
      message: 'No contests to lock',
      locked: 0,
    });
  }

  const contestIds = expiredContests.map(c => c.id).filter(Boolean);

  if (contestIds.length === 0) {
    return NextResponse.json({
      message: 'No contests to lock',
      locked: 0,
    });
  }

  // Update contests to locked status
  const { error: contestError } = await adminClient
    .from('contests')
    .update({ status: ContestStatus.LOCKED })
    .in('id', contestIds);

  if (contestError) {
    console.error('Auto-lock: Failed to lock contests:', contestError);
    return NextResponse.json({ error: 'Failed to lock contests' }, { status: 500 });
  }

  // Get all lineups for these contests via entries
  const { data: entries, error: entriesError } = await adminClient
    .from('entries')
    .select('lineup_id')
    .in('contest_id', contestIds);

  if (entriesError) {
    console.error('Auto-lock: Failed to fetch lineups:', entriesError);
    return NextResponse.json({ error: 'Failed to lock lineups' }, { status: 500 });
  }

  let lineupsLocked = 0;

  if (entries && entries.length > 0) {
    const lineupIds = entries.map(e => e.lineup_id).filter(Boolean);

    if (lineupIds.length > 0) {
      const { error: lineupError } = await adminClient
        .from('lineups')
        .update({ status: 'locked' })
        .in('id', lineupIds)
        .eq('status', 'editable');

      if (lineupError) {
        console.error('Auto-lock: Failed to lock lineups:', lineupError);
        return NextResponse.json({ error: 'Failed to lock lineups' }, { status: 500 });
      }

      lineupsLocked = lineupIds.length;
    }
  }

  revalidatePath('/contests');
  for (const id of contestIds) {
    revalidatePath(`/contests/${id}`);
  }

  const lockedNames = expiredContests.map(c => c.name);
  console.log(`Auto-lock: Locked ${contestIds.length} contest(s): ${lockedNames.join(', ')}`);

  return NextResponse.json({
    message: 'Auto-lock completed',
    locked: contestIds.length,
    contests: lockedNames,
    lineupsLocked,
  });
}
