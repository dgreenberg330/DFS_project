// ============================================================================
// API Route: Register Device Token
// ============================================================================
// POST /api/register-device
// Registers an APNs device token for push notifications.
// Auth: JWT from Authorization header (iOS app)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromJWT } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const user = await getUserFromJWT(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    device_token?: string;
    platform?: string;
    app_version?: string;
    device_model?: string;
    os_version?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { device_token, platform, app_version, device_model, os_version } = body;

  if (!device_token || typeof device_token !== 'string') {
    return NextResponse.json({ error: 'device_token is required' }, { status: 400 });
  }

  // Build device_name from model and OS info
  const deviceName = [device_model, os_version].filter(Boolean).join(' - ') || null;

  const supabase = createAdminClient();

  // Upsert: update if token already exists for this user, insert otherwise
  const { error } = await supabase
    .from('device_tokens')
    .upsert(
      {
        user_id: user.id,
        device_token,
        platform: platform || 'ios',
        device_name: deviceName,
        app_version: app_version || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,device_token',
      }
    );

  if (error) {
    console.error('Failed to register device:', error);
    return NextResponse.json({ error: 'Failed to register device' }, { status: 500 });
  }

  return NextResponse.json({ success: true, user_id: user.id });
}
