// ============================================================================
// API Route: Notification Preferences
// ============================================================================
// PUT /api/notification-preferences
// Updates push notification preferences for the authenticated user.
// Auth: JWT from Authorization header (iOS app)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromJWT } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';

export async function PUT(request: NextRequest) {
  const user = await getUserFromJWT(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Build update object - accept both our naming and iOS app naming
  const update: Record<string, boolean> = {};

  // Our naming convention
  if (typeof body.push_lock_reminders === 'boolean') {
    update.push_lock_reminders = body.push_lock_reminders;
  }
  if (typeof body.push_contest_results === 'boolean') {
    update.push_contest_results = body.push_contest_results;
  }
  if (typeof body.push_new_contests === 'boolean') {
    update.push_new_contests = body.push_new_contests;
  }

  // iOS app naming convention (maps to our column names)
  if (typeof body.push_lineup_reminders === 'boolean') {
    update.push_lock_reminders = body.push_lineup_reminders;
  }
  if (typeof body.push_competition_end === 'boolean') {
    update.push_contest_results = body.push_competition_end;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid preferences provided' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('user_profiles')
    .update(update)
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to update preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
