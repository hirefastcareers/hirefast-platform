-- Add commute_distance (and match_score if missing) so Apply page insert succeeds.
-- Run in Supabase SQL Editor if you see: Could not find the 'commute_distance' column.

ALTER TABLE applications ADD COLUMN IF NOT EXISTS commute_distance NUMERIC;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS match_score NUMERIC;
