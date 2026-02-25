-- Prevent duplicate jobs (same employer, title, location) and duplicate applications (same job, email).
-- Run the one-time cleanup script (supabase/scripts/001_cleanup_duplicate_jobs_and_applications.sql) first.

-- Jobs: one row per (employer_id, title, location). NULL location is allowed; multiple rows with NULL location are allowed (SQL semantics).
ALTER TABLE jobs
  ADD CONSTRAINT jobs_employer_id_title_location_key UNIQUE (employer_id, title, location);

COMMENT ON CONSTRAINT jobs_employer_id_title_location_key ON jobs IS 'Prevents duplicate job postings for the same employer, title and location.';

-- Applications: one application per candidate (email) per job
ALTER TABLE applications
  ADD CONSTRAINT applications_job_id_email_key UNIQUE (job_id, email);

COMMENT ON CONSTRAINT applications_job_id_email_key ON applications IS 'A candidate cannot apply to the same job more than once.';
