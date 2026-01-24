-- ============================================================================
-- Box Office Fantasy Sports - Database Schema
-- ============================================================================
-- Design notes:
-- - All timestamps stored in UTC, displayed as ET in frontend
-- - User data lives in Supabase auth.users (email, id)
-- - Money fields: salary (integer dollars), gross (numeric millions)
-- - Scoring: $1M box office = 1 point
-- ============================================================================

-- Contest states: upcoming -> locked -> resolved
CREATE TYPE contest_status AS ENUM ('upcoming', 'locked', 'resolved');

-- Lineup states: editable -> locked -> scored
CREATE TYPE lineup_status AS ENUM ('editable', 'locked', 'scored');

-- ============================================================================
-- CONTESTS
-- ============================================================================
CREATE TABLE contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contest identification
  name TEXT NOT NULL, -- e.g., "Weekend of Jan 10-12, 2025"

  -- Timing (all stored in UTC)
  lock_time TIMESTAMPTZ NOT NULL, -- Thursday 8PM ET converted to UTC
  weekend_start DATE NOT NULL, -- Friday of opening weekend
  weekend_end DATE NOT NULL, -- Sunday of opening weekend

  -- State management
  status contest_status NOT NULL DEFAULT 'upcoming',
  published BOOLEAN NOT NULL DEFAULT FALSE, -- Contest visible to users only when true

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contests_status ON contests(status);
CREATE INDEX idx_contests_lock_time ON contests(lock_time);

-- ============================================================================
-- MOVIES
-- ============================================================================
CREATE TABLE movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,

  -- Movie details
  title TEXT NOT NULL,
  release_date DATE NOT NULL,
  distributor TEXT, -- Optional
  theater_count INTEGER, -- Optional

  -- Pricing and projections
  salary INTEGER NOT NULL CHECK (salary >= 0 AND salary <= 100), -- $0-100 range
  projected_gross NUMERIC(10, 2) NOT NULL, -- Millions, e.g., 25.50 = $25.5M

  -- Actuals (filled in Sunday night)
  actual_gross NUMERIC(10, 2), -- Millions, nullable until results in

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movies_contest_id ON movies(contest_id);

-- ============================================================================
-- LINEUPS
-- ============================================================================
-- Represents a user's movie selections for a contest
-- Separate from entries to maintain clean state management
CREATE TABLE lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- State and scoring
  status lineup_status NOT NULL DEFAULT 'editable',
  total_score NUMERIC(10, 2), -- Sum of actual_gross for selected movies

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ENTRIES
-- ============================================================================
-- Links user + contest + lineup
-- One entry per user per contest (enforced by unique constraint)
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  lineup_id UUID NOT NULL REFERENCES lineups(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: one entry per user per contest
  CONSTRAINT unique_user_contest UNIQUE (user_id, contest_id)
);

CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_contest_id ON entries(contest_id);
CREATE INDEX idx_entries_lineup_id ON entries(lineup_id);

-- ============================================================================
-- ADMIN_USERS
-- ============================================================================
-- Tracks which users have admin privileges for managing contests
-- Simple whitelist approach for MVP
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: one row per admin user
  CONSTRAINT unique_admin_user UNIQUE (user_id)
);

CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);

-- NOTE: First admin must be manually inserted via SQL:
-- INSERT INTO admin_users (user_id) VALUES ('user-uuid-here');

-- ============================================================================
-- USER_PROFILES
-- ============================================================================
-- Extended user profile data beyond Supabase auth.users
-- Links to auth.users via user_id foreign key
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Username (unique, alphanumeric + underscore, 3-20 chars)
  username TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_profile UNIQUE (user_id),
  CONSTRAINT unique_username UNIQUE (username),
  CONSTRAINT valid_username CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- ============================================================================
-- LINEUP_MOVIES (Join Table)
-- ============================================================================
-- Many-to-many relationship between lineups and movies
-- Constraint: 2-4 movies per lineup (enforced at application level)
CREATE TABLE lineup_movies (
  lineup_id UUID NOT NULL REFERENCES lineups(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (lineup_id, movie_id)
);

CREATE INDEX idx_lineup_movies_movie_id ON lineup_movies(movie_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
-- Auto-update updated_at timestamp on row changes
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

CREATE TRIGGER update_contests_updated_at BEFORE UPDATE ON contests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON movies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lineups_updated_at BEFORE UPDATE ON lineups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables (should be enabled by default in Supabase, but explicit is better)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- USER_PROFILES: Users can read all profiles, but only update their own
CREATE POLICY "Anyone can view user profiles"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- ENTRIES: Users can only see and manage their own entries
CREATE POLICY "Users can view their own entries"
  ON entries FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own entries"
  ON entries FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own entries"
  ON entries FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own entries"
  ON entries FOR DELETE
  USING ((select auth.uid()) = user_id);

-- LINEUPS: Users can manage lineups through entries relationship
-- Allow access if user owns an entry that references this lineup
CREATE POLICY "Users can view their own lineups"
  ON lineups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.lineup_id = lineups.id
      AND entries.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert lineups"
  ON lineups FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own lineups"
  ON lineups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.lineup_id = lineups.id
      AND entries.user_id = (select auth.uid())
    )
  );

-- LINEUP_MOVIES: Users can manage movies in their own lineups
CREATE POLICY "Users can view their lineup movies"
  ON lineup_movies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.lineup_id = lineup_movies.lineup_id
      AND entries.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert lineup movies"
  ON lineup_movies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.lineup_id = lineup_movies.lineup_id
      AND entries.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete their lineup movies"
  ON lineup_movies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.lineup_id = lineup_movies.lineup_id
      AND entries.user_id = (select auth.uid())
    )
  );

-- CONTESTS: Everyone can view contests (public data)
CREATE POLICY "Anyone can view contests"
  ON contests FOR SELECT
  USING (true);

-- Admin users can manage contests (INSERT/UPDATE/DELETE handled separately via admin check)
CREATE POLICY "Admins can insert contests"
  ON contests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can update contests"
  ON contests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can delete contests"
  ON contests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

-- MOVIES: Everyone can view movies (public data)
CREATE POLICY "Anyone can view movies"
  ON movies FOR SELECT
  USING (true);

-- Admin users can manage movies
CREATE POLICY "Admins can insert movies"
  ON movies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can update movies"
  ON movies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can delete movies"
  ON movies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = (select auth.uid())
    )
  );

-- ADMIN_USERS: Users can check their own admin status
CREATE POLICY "Users can check own admin status"
  ON admin_users FOR SELECT
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- CLEANUP TRIGGER FOR ORPHANED LINEUPS
-- ============================================================================
-- When entries are deleted (e.g., contest cascade delete), clean up orphaned lineups
-- Since lineups don't have a direct FK to contests, this trigger ensures they're deleted
CREATE OR REPLACE FUNCTION cleanup_orphaned_lineup()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Delete the lineup that was associated with the deleted entry
  DELETE FROM public.lineups WHERE id = OLD.lineup_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER delete_lineup_on_entry_delete
  AFTER DELETE ON entries
  FOR EACH ROW EXECUTE FUNCTION cleanup_orphaned_lineup();

-- ============================================================================
-- NOTES
-- ============================================================================
-- Assumptions and design choices:
--
-- 1. User data: Using Supabase auth.users for authentication and user identity.
--    No separate user_profiles table needed for MVP.
--
-- 2. Money representation:
--    - salary: INTEGER (0-100 range, represents dollars like $45)
--    - projected_gross, actual_gross, total_score: NUMERIC(10,2)
--      (represents millions, e.g., 25.50 = $25.5M)
--
-- 3. Lineup constraints (2-4 movies, $100 salary cap):
--    Enforced at application level, not database constraints, per spec's
--    guidance to "prevent illegal lineups" in the UI.
--
-- 4. Entry uniqueness: Enforced at database level with unique constraint
--    on (user_id, contest_id) to guarantee one entry per user per contest.
--
-- 5. State transitions: Application logic will enforce state flow
--    (contests: upcoming->locked->resolved, lineups: editable->locked->scored).
--
-- 6. Carryover movies: Not explicitly modeled. Movies can have release_date
--    before the contest weekend; admin manually adds them to the slate.
--
-- 7. Scoring: Run as batch process Sunday night. Loop through lineups,
--    sum actual_gross from lineup_movies join, update lineup.total_score.
--
-- 8. Time zones: All timestamptz stored in UTC. Frontend converts to ET.
--    lock_time stored as Thursday 8PM ET -> UTC conversion.