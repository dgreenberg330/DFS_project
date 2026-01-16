-- ============================================================================
-- Migration: Fix Supabase Security Warnings
-- ============================================================================
-- Addresses the following warnings:
-- 1. Function search_path (security)
-- 2. Lineups RLS unrestricted access policy (security)
-- 3-9. RLS policy performance (wrap auth.uid() in subselect)
--
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. FIX FUNCTION SEARCH_PATH
-- ============================================================================
-- Set immutable search_path to prevent search_path injection attacks

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. FIX LINEUPS RLS - Remove blanket policy if exists
-- ============================================================================
-- Drop the problematic "Allow all operations" policy if it exists
-- (This policy may have been added manually in production)

DROP POLICY IF EXISTS "Allow all operations on lineups for ALL" ON lineups;

-- ============================================================================
-- 3-9. FIX RLS PERFORMANCE - Wrap auth.uid() in subselect
-- ============================================================================
-- The pattern (select auth.uid()) is evaluated once per query instead of
-- once per row, significantly improving performance at scale.

-- -----------------------------------------------------------------------------
-- USER_PROFILES policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- Note: Supabase combined insert+update into one policy, so also handle that
DROP POLICY IF EXISTS "Users can insert and update their own profile" ON user_profiles;
CREATE POLICY "Users can insert and update their own profile"
  ON user_profiles FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- ENTRIES policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own entries" ON entries;
CREATE POLICY "Users can view their own entries"
  ON entries FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own entries" ON entries;
CREATE POLICY "Users can insert their own entries"
  ON entries FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own entries" ON entries;
CREATE POLICY "Users can update their own entries"
  ON entries FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own entries" ON entries;
CREATE POLICY "Users can delete their own entries"
  ON entries FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Handle combined policy if it exists
DROP POLICY IF EXISTS "Users can view, insert, update, and delete their own entries" ON entries;

-- -----------------------------------------------------------------------------
-- LINEUPS policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own lineups" ON lineups;
CREATE POLICY "Users can view their own lineups"
  ON lineups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.lineup_id = lineups.id
      AND entries.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert lineups" ON lineups;
CREATE POLICY "Users can insert lineups"
  ON lineups FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own lineups" ON lineups;
CREATE POLICY "Users can update their own lineups"
  ON lineups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.lineup_id = lineups.id
      AND entries.user_id = (select auth.uid())
    )
  );

-- -----------------------------------------------------------------------------
-- LINEUP_MOVIES policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their lineup movies" ON lineup_movies;
CREATE POLICY "Users can view their lineup movies"
  ON lineup_movies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.lineup_id = lineup_movies.lineup_id
      AND entries.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert lineup movies" ON lineup_movies;
CREATE POLICY "Users can insert lineup movies"
  ON lineup_movies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.lineup_id = lineup_movies.lineup_id
      AND entries.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete their lineup movies" ON lineup_movies;
CREATE POLICY "Users can delete their lineup movies"
  ON lineup_movies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.lineup_id = lineup_movies.lineup_id
      AND entries.user_id = (select auth.uid())
    )
  );

-- Handle combined policy if it exists
DROP POLICY IF EXISTS "Users can view, insert, and delete, their lineup movies" ON lineup_movies;

-- -----------------------------------------------------------------------------
-- CONTESTS policies (admin)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert contests" ON contests;
CREATE POLICY "Admins can insert contests"
  ON contests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can update contests" ON contests;
CREATE POLICY "Admins can update contests"
  ON contests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can delete contests" ON contests;
CREATE POLICY "Admins can delete contests"
  ON contests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

-- Handle combined policy if it exists
DROP POLICY IF EXISTS "Admins can insert, update, and delete contests" ON contests;

-- -----------------------------------------------------------------------------
-- MOVIES policies (admin)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert movies" ON movies;
CREATE POLICY "Admins can insert movies"
  ON movies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can update movies" ON movies;
CREATE POLICY "Admins can update movies"
  ON movies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can delete movies" ON movies;
CREATE POLICY "Admins can delete movies"
  ON movies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

-- Handle combined policy if it exists
DROP POLICY IF EXISTS "Admins can insert, update, and delete movies" ON movies;

-- -----------------------------------------------------------------------------
-- ADMIN_USERS policies
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can check own admin status" ON admin_users;
CREATE POLICY "Users can check own admin status"
  ON admin_users FOR SELECT
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify in Supabase Dashboard:
-- 1. Database > Functions > update_updated_at_column should show search_path = ''
-- 2. Authentication > Policies > lineups should NOT have "Allow all operations" policy
-- 3. All policies should use (select auth.uid()) pattern
