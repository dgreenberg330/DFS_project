-- ============================================================================
-- Migration 005: Add Daily Estimates for Incremental Scoring
-- ============================================================================
-- Adds columns to track weekend box office estimates:
-- - friday_estimate: Individual Friday gross (entered Saturday)
-- - saturday_estimate: Individual Saturday gross (entered Sunday)
-- - sunday_estimate: Cumulative weekend total (entered Monday)
--
-- Scoring calculation:
-- - Day 1: score = friday_estimate
-- - Day 2: score = friday_estimate + saturday_estimate
-- - Day 3: score = sunday_estimate (cumulative, replaces sum)
-- - Final: score = actual_gross
-- ============================================================================

ALTER TABLE movies
  ADD COLUMN friday_estimate NUMERIC(10, 2),
  ADD COLUMN saturday_estimate NUMERIC(10, 2),
  ADD COLUMN sunday_estimate NUMERIC(10, 2);

-- Add comment for documentation
COMMENT ON COLUMN movies.friday_estimate IS 'Individual Friday box office estimate in millions (entered Saturday morning)';
COMMENT ON COLUMN movies.saturday_estimate IS 'Individual Saturday box office estimate in millions (entered Sunday morning)';
COMMENT ON COLUMN movies.sunday_estimate IS 'Cumulative weekend total estimate in millions (entered Monday morning)';
