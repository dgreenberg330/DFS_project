-- ============================================================================
-- Migration: Cleanup Duplicate Policies
-- ============================================================================
-- Fixes issues from previous migration:
-- 1. Remove blanket "Allow all operations on lineups" policy (exact name)
-- 2. Remove duplicate user_profiles policies
-- 3. Keep only the optimized policies
--
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. FIX LINEUPS - Remove ALL blanket/duplicate policies
-- ============================================================================

-- Drop various possible names for the blanket policy
DROP POLICY IF EXISTS "Allow all operations on lineups" ON lineups;
DROP POLICY IF EXISTS "Allow all operations on lineups for ALL" ON lineups;
DROP POLICY IF EXISTS "Allow all operations on lineups for authenticated" ON lineups;

-- ============================================================================
-- 2. FIX USER_PROFILES - Remove duplicate policies
-- ============================================================================

-- Drop the combined policy that was incorrectly added
DROP POLICY IF EXISTS "Users can insert and update their own profile" ON user_profiles;

-- The individual optimized policies should remain:
-- - "Users can insert their own profile"
-- - "Users can update their own profile"
-- - "Anyone can view user profiles"

-- ============================================================================
-- 3. VERIFY FINAL STATE
-- ============================================================================
-- After running, lineups should have exactly these policies:
--   - "Users can view their own lineups" (SELECT)
--   - "Users can insert lineups" (INSERT) - WITH CHECK (true) is intentional
--   - "Users can update their own lineups" (UPDATE)
--
-- user_profiles should have exactly these policies:
--   - "Anyone can view user profiles" (SELECT)
--   - "Users can insert their own profile" (INSERT)
--   - "Users can update their own profile" (UPDATE)
--
-- Note: "Users can insert lineups" WITH CHECK (true) is intentional.
-- Lineup ownership is established through the entries table, not the lineup itself.
-- Users create a lineup, then create an entry linking user_id + contest_id + lineup_id.
-- The entry creation is protected by auth.uid() = user_id.
