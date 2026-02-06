-- ============================================================================
-- Migration 011: Add Push Notification Support
-- ============================================================================
-- Adds device_tokens table, push_notification_logs table, and push
-- preference columns on user_profiles for iOS push notifications.
-- ============================================================================

-- ============================================================================
-- 1. Device Tokens Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'ios' CHECK (platform IN ('ios')),
  device_name TEXT,
  app_version TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upsert support: one token per user+device combo
CREATE UNIQUE INDEX idx_device_tokens_user_token ON device_tokens(user_id, device_token);

-- Fast lookup of active tokens for a user (used during push dispatch)
CREATE INDEX idx_device_tokens_active ON device_tokens(user_id) WHERE is_active = TRUE;

-- RLS policies: users can manage their own device tokens
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own device tokens"
  ON device_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own device tokens"
  ON device_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own device tokens"
  ON device_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own device tokens"
  ON device_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. Push Notification Logs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contest_id UUID REFERENCES contests(id) ON DELETE SET NULL,
  device_token_id UUID REFERENCES device_tokens(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('lock_reminder', 'contest_results', 'new_contest')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  deep_link TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  apns_id TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dedup: prevent sending same notification type to same user for same contest
CREATE UNIQUE INDEX idx_push_logs_dedup ON push_notification_logs(user_id, contest_id, notification_type)
  WHERE status = 'sent';

-- RLS policies: users can view their own logs; only service role can insert/update
ALTER TABLE push_notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push logs"
  ON push_notification_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Service role bypasses RLS for inserts/updates (no user-facing insert/update policies needed)

-- ============================================================================
-- 3. Push Preference Columns on user_profiles
-- ============================================================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS push_lock_reminders BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS push_contest_results BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS push_new_contests BOOLEAN NOT NULL DEFAULT TRUE;
