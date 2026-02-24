-- Allow candidates to submit applications and store postcode for commute
-- Run in Supabase SQL Editor if Apply page insert fails (RLS or missing column).

ALTER TABLE applications ADD COLUMN IF NOT EXISTS candidate_postcode TEXT;

-- Allow anyone (e.g. anonymous candidates) to insert an application for an active job
DROP POLICY IF EXISTS "Candidates can submit applications" ON applications;
CREATE POLICY "Candidates can submit applications"
  ON applications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_id AND j.is_active = true
    )
  );
