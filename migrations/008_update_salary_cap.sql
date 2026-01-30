-- Migration: Update salary cap from $100 to $50,000
-- Changes movie salary constraint from 0-100 to 1-50000

-- Drop the old constraint
ALTER TABLE movies DROP CONSTRAINT IF EXISTS movies_salary_check;

-- Add the new constraint with updated range
ALTER TABLE movies ADD CONSTRAINT movies_salary_check CHECK (salary >= 1 AND salary <= 50000);

-- Update schema comments (informational only)
COMMENT ON COLUMN movies.salary IS 'Movie salary in dollars ($1-$50,000 range)';
