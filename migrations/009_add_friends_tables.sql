-- ============================================================================
-- Friends Feature: Friendships, Friend Requests, and Friend Invites
-- ============================================================================

-- =============================================================================
-- FRIENDSHIPS TABLE
-- Stores bidirectional friend relationships. Uses ordering constraint to ensure
-- each friendship is stored once (user_a_id < user_b_id).
-- =============================================================================

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure consistent ordering: user_a_id is always the "smaller" UUID
  CONSTRAINT friendship_ordering CHECK (user_a_id < user_b_id),
  -- Prevent duplicate friendships
  CONSTRAINT unique_friendship UNIQUE (user_a_id, user_b_id)
);

-- Indexes for efficient friend lookups
CREATE INDEX idx_friendships_user_a ON friendships(user_a_id);
CREATE INDEX idx_friendships_user_b ON friendships(user_b_id);

-- RLS Policies
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Users can view friendships they're part of
CREATE POLICY "Users can view own friendships" ON friendships
  FOR SELECT USING (
    auth.uid() = user_a_id OR auth.uid() = user_b_id
  );

-- Users can delete friendships they're part of (unfriend)
CREATE POLICY "Users can delete own friendships" ON friendships
  FOR DELETE USING (
    auth.uid() = user_a_id OR auth.uid() = user_b_id
  );

-- Insert handled via server action with admin client (after accepting request)

-- =============================================================================
-- FRIEND REQUESTS TABLE
-- Stores pending, accepted, or rejected friend requests.
-- =============================================================================

CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate requests from same user to same target
  CONSTRAINT unique_friend_request UNIQUE (from_user_id, to_user_id),
  -- Prevent self-requests
  CONSTRAINT no_self_request CHECK (from_user_id != to_user_id)
);

-- Indexes
CREATE INDEX idx_friend_requests_from ON friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_to ON friend_requests(to_user_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);

-- RLS Policies
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Users can view requests they sent or received
CREATE POLICY "Users can view own friend requests" ON friend_requests
  FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );

-- Users can send friend requests (insert as from_user)
CREATE POLICY "Users can send friend requests" ON friend_requests
  FOR INSERT WITH CHECK (
    auth.uid() = from_user_id
  );

-- Users can update requests they received (accept/reject) or sent (cancel)
CREATE POLICY "Users can update own friend requests" ON friend_requests
  FOR UPDATE USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );

-- Users can delete requests they sent (cancel)
CREATE POLICY "Users can delete own friend requests" ON friend_requests
  FOR DELETE USING (
    auth.uid() = from_user_id
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_friend_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_friend_request_updated_at
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_friend_request_updated_at();

-- =============================================================================
-- FRIEND INVITES TABLE
-- Stores email invites for non-users. When they sign up, creates a friend request
-- or auto-accepts if they use the invite link.
-- =============================================================================

CREATE TABLE friend_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invite_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled')),
  registered_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One invite per email per inviter
  CONSTRAINT unique_invite_per_user UNIQUE (inviter_user_id, invited_email)
);

-- Indexes
CREATE INDEX idx_friend_invites_inviter ON friend_invites(inviter_user_id);
CREATE INDEX idx_friend_invites_email ON friend_invites(invited_email);
CREATE INDEX idx_friend_invites_token ON friend_invites(invite_token);
CREATE INDEX idx_friend_invites_status ON friend_invites(status);

-- RLS Policies
ALTER TABLE friend_invites ENABLE ROW LEVEL SECURITY;

-- Users can view invites they sent
CREATE POLICY "Users can view own invites" ON friend_invites
  FOR SELECT USING (
    auth.uid() = inviter_user_id
  );

-- Users can send invites
CREATE POLICY "Users can create invites" ON friend_invites
  FOR INSERT WITH CHECK (
    auth.uid() = inviter_user_id
  );

-- Users can update/cancel their invites
CREATE POLICY "Users can update own invites" ON friend_invites
  FOR UPDATE USING (
    auth.uid() = inviter_user_id
  );

-- Users can delete their invites
CREATE POLICY "Users can delete own invites" ON friend_invites
  FOR DELETE USING (
    auth.uid() = inviter_user_id
  );

-- =============================================================================
-- HELPER FUNCTION: Get friend IDs for a user
-- Used by leaderboard filtering to efficiently get all friend user IDs
-- =============================================================================

CREATE OR REPLACE FUNCTION get_friend_ids(user_uuid UUID)
RETURNS TABLE(friend_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN user_a_id = user_uuid THEN user_b_id
      ELSE user_a_id
    END AS friend_id
  FROM friendships
  WHERE user_a_id = user_uuid OR user_b_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
