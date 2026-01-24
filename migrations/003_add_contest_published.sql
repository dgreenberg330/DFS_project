-- ============================================================================
-- Migration: Add published column to contests
-- ============================================================================
-- Prevents contests from appearing on the home page until admin explicitly
-- publishes them after adding all movies.

-- Add published column (default false so existing contests remain unpublished)
ALTER TABLE contests ADD COLUMN published BOOLEAN NOT NULL DEFAULT FALSE;

-- Update existing upcoming contests to be published (so they remain visible)
-- Remove this if you want to require manual publishing of existing contests
UPDATE contests SET published = TRUE WHERE status IN ('upcoming', 'locked', 'resolved');

-- Add index for filtering by published status
CREATE INDEX idx_contests_published ON contests(published);
