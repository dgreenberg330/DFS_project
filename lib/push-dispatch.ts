// ============================================================================
// Push Dispatch Helper - Send push notifications to users
// ============================================================================
// Handles fetching device tokens, dedup checks, sending pushes,
// logging results, and deactivating bad tokens.
// ============================================================================

import { createAdminClient } from '@/lib/supabase-admin';
import { sendPushNotification, isPushConfigured, type PushPayload } from '@/lib/push';
import type { PushNotificationType } from '@/types';

export interface PushDispatchResult {
  sent: number;
  failed: number;
}

/**
 * Send a push notification to all active devices for a user.
 * Handles dedup, logging, and bad token deactivation.
 */
export async function sendPushToUser(
  userId: string,
  contestId: string,
  notificationType: PushNotificationType,
  payload: PushPayload
): Promise<PushDispatchResult> {
  if (!isPushConfigured()) {
    return { sent: 0, failed: 0 };
  }

  const supabase = createAdminClient();

  // Dedup check: skip if already sent for this user+contest+type
  const { data: existingLog } = await supabase
    .from('push_notification_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('contest_id', contestId)
    .eq('notification_type', notificationType)
    .eq('status', 'sent')
    .maybeSingle();

  if (existingLog) {
    return { sent: 0, failed: 0 };
  }

  // Fetch active device tokens for this user
  const { data: tokens, error: tokensError } = await supabase
    .from('device_tokens')
    .select('id, device_token')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (tokensError || !tokens || tokens.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const token of tokens) {
    const result = await sendPushNotification(token.device_token, payload);

    // Log the push notification
    await supabase.from('push_notification_logs').insert({
      user_id: userId,
      contest_id: contestId,
      device_token_id: token.id,
      notification_type: notificationType,
      title: payload.title,
      body: payload.body,
      deep_link: payload.deepLink || null,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error || null,
      apns_id: result.apnsId || null,
      sent_at: result.success ? new Date().toISOString() : null,
    });

    if (result.success) {
      sent++;
      // Update last_used_at on the device token
      await supabase
        .from('device_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', token.id);
    } else {
      failed++;
      // Deactivate tokens rejected by APNs as invalid
      if (result.reason === 'BadDeviceToken' || result.reason === 'Unregistered') {
        await supabase
          .from('device_tokens')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', token.id);
      }
    }
  }

  return { sent, failed };
}
