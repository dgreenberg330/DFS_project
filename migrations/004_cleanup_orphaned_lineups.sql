-- ============================================================================
-- Migration: Cleanup Orphaned Lineups on Entry Delete
-- ============================================================================
-- When entries are deleted (e.g., via contest cascade delete), this trigger
-- automatically deletes the associated lineup to prevent orphaned records.
--
-- Run this in Supabase SQL Editor or via CLI:
-- psql -h <host> -d postgres -f migrations/004_cleanup_orphaned_lineups.sql
-- ============================================================================

-- Create function to delete orphaned lineup when entry is deleted
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

-- Create trigger to run after entry deletion
DROP TRIGGER IF EXISTS delete_lineup_on_entry_delete ON entries;
CREATE TRIGGER delete_lineup_on_entry_delete
  AFTER DELETE ON entries
  FOR EACH ROW EXECUTE FUNCTION cleanup_orphaned_lineup();
