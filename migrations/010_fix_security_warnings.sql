-- ============================================================================
-- Fix Supabase Security Warnings
-- ============================================================================

-- =============================================================================
-- FIX FUNCTION SEARCH_PATH ISSUES
-- Set immutable search_path to prevent search_path injection attacks
-- =============================================================================

-- Fix update_friend_request_updated_at function
CREATE OR REPLACE FUNCTION public.update_friend_request_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix get_friend_ids function
CREATE OR REPLACE FUNCTION public.get_friend_ids(user_uuid UUID)
RETURNS TABLE(friend_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN f.user_a_id = user_uuid THEN f.user_b_id
      ELSE f.user_a_id
    END AS friend_id
  FROM public.friendships f
  WHERE f.user_a_id = user_uuid OR f.user_b_id = user_uuid;
END;
$$;

-- Fix set_unsubscribe_token function (if it exists)
CREATE OR REPLACE FUNCTION public.set_unsubscribe_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.unsubscribe_token IS NULL THEN
    NEW.unsubscribe_token = encode(gen_random_bytes(32), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

-- =============================================================================
-- FIX RLS POLICY PERFORMANCE ISSUES
-- Wrap auth.uid() in (select auth.uid()) for better query performance
-- =============================================================================

-- Drop and recreate friendships policies
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete own friendships" ON public.friendships;

CREATE POLICY "Users can view own friendships" ON public.friendships
  FOR SELECT USING (
    (select auth.uid()) = user_a_id OR (select auth.uid()) = user_b_id
  );

CREATE POLICY "Users can delete own friendships" ON public.friendships
  FOR DELETE USING (
    (select auth.uid()) = user_a_id OR (select auth.uid()) = user_b_id
  );

-- Drop and recreate friend_requests policies
DROP POLICY IF EXISTS "Users can view own friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can update own friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can delete own friend requests" ON public.friend_requests;

CREATE POLICY "Users can view own friend requests" ON public.friend_requests
  FOR SELECT USING (
    (select auth.uid()) = from_user_id OR (select auth.uid()) = to_user_id
  );

CREATE POLICY "Users can send friend requests" ON public.friend_requests
  FOR INSERT WITH CHECK (
    (select auth.uid()) = from_user_id
  );

CREATE POLICY "Users can update own friend requests" ON public.friend_requests
  FOR UPDATE USING (
    (select auth.uid()) = from_user_id OR (select auth.uid()) = to_user_id
  );

CREATE POLICY "Users can delete own friend requests" ON public.friend_requests
  FOR DELETE USING (
    (select auth.uid()) = from_user_id
  );

-- Drop and recreate friend_invites policies
DROP POLICY IF EXISTS "Users can view own invites" ON public.friend_invites;
DROP POLICY IF EXISTS "Users can create invites" ON public.friend_invites;
DROP POLICY IF EXISTS "Users can update own invites" ON public.friend_invites;
DROP POLICY IF EXISTS "Users can delete own invites" ON public.friend_invites;

CREATE POLICY "Users can view own invites" ON public.friend_invites
  FOR SELECT USING (
    (select auth.uid()) = inviter_user_id
  );

CREATE POLICY "Users can create invites" ON public.friend_invites
  FOR INSERT WITH CHECK (
    (select auth.uid()) = inviter_user_id
  );

CREATE POLICY "Users can update own invites" ON public.friend_invites
  FOR UPDATE USING (
    (select auth.uid()) = inviter_user_id
  );

CREATE POLICY "Users can delete own invites" ON public.friend_invites
  FOR DELETE USING (
    (select auth.uid()) = inviter_user_id
  );

-- =============================================================================
-- FIX LINEUPS INSERT POLICY
-- The existing policy allows unrestricted INSERT - tighten it
-- =============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can insert lineups for their entries" ON public.lineups;
DROP POLICY IF EXISTS "Users can insert lineups" ON public.lineups;

-- Create a proper policy that only allows inserting lineups for authenticated users
-- The lineup is created first, then linked via entries table
-- We verify ownership through entries when the entry is created
CREATE POLICY "Authenticated users can insert lineups" ON public.lineups
  FOR INSERT WITH CHECK (
    (select auth.uid()) IS NOT NULL
  );
