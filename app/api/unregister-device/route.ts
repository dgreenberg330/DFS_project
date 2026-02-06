// ============================================================================
// API Route: Unregister Device Token
// ============================================================================
// POST /api/unregister-device
// Removes a device token (e.g., on logout or app uninstall).
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
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { device_token } = body;

  if (!device_token || typeof device_token !== 'string') {
    return NextResponse.json({ error: 'device_token is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('device_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('device_token', device_token);

  if (error) {
    console.error('Failed to unregister device:', error);
    return NextResponse.json({ error: 'Failed to unregister device' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
