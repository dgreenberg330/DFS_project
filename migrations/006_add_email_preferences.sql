-- ============================================================================
-- Migration 006: Add Email Preferences and Email Logs
-- ============================================================================
-- Adds email notification preferences to user_profiles and creates
-- email_logs table for tracking sent emails
-- ============================================================================

-- Enable pgcrypto extension for gen_random_bytes (used for unsubscribe tokens)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add email preference columns to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS email_lock_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_contest_results BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS email_new_contests BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT UNIQUE;

-- Create index for unsubscribe token lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_unsubscribe_token
  ON user_profiles(unsubscribe_token)
  WHERE unsubscribe_token IS NOT NULL;

-- ============================================================================
-- EMAIL_LOGS
-- ============================================================================
-- Tracks sent emails for analytics and duplicate prevention
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contest_id UUID REFERENCES contests(id) ON DELETE SET NULL,

  -- Email details
  email_type TEXT NOT NULL, -- 'lock_reminder', 'contest_results', 'new_contest'
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  resend_id TEXT, -- ID from Resend API for tracking

  -- Timestamps
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_contest_id ON email_logs(contest_id);
CREATE INDEX idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);

-- Composite index for duplicate prevention
CREATE INDEX idx_email_logs_dedup ON email_logs(user_id, contest_id, email_type);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own email logs (for potential future "email history" feature)
CREATE POLICY "Users can view their own email logs"
  ON email_logs FOR SELECT
  USING (user_id = (select auth.uid()));

-- Only service role can insert/update email logs (done via admin client)
-- No INSERT/UPDATE policies for regular users

-- ============================================================================
-- Generate unsubscribe tokens for existing users
-- ============================================================================
-- Generate tokens for users who don't have one yet
UPDATE user_profiles
SET unsubscribe_token = encode(gen_random_bytes(32), 'hex')
WHERE unsubscribe_token IS NULL;

-- ============================================================================
-- Function to generate unsubscribe token on profile creation
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_unsubscribe_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.unsubscribe_token IS NULL THEN
    NEW.unsubscribe_token = encode(gen_random_bytes(32), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_unsubscribe_token'
  ) THEN
    CREATE TRIGGER set_unsubscribe_token
      BEFORE INSERT ON user_profiles
      FOR EACH ROW EXECUTE FUNCTION generate_unsubscribe_token();
  END IF;
END;
$$;
