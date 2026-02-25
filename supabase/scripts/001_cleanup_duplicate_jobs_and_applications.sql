-- One-time cleanup: remove duplicate rows before adding UNIQUE constraints.
-- Run this ONCE in Supabase SQL Editor (or via CLI) BEFORE applying migration 016.
--
-- Duplicate definition:
--   applications: same (job_id, email)
--   jobs: same (employer_id, title, location) — location NULL treated as ''
--
-- We keep one row per group (earliest id) and delete the rest.
-- For jobs, CASCADE will remove applications that belong to deleted duplicate jobs.

BEGIN;

-- 1) Applications: delete duplicate (job_id, email), keep row with smallest id
DELETE FROM applications a
USING applications b
WHERE a.job_id = b.job_id
  AND a.email = b.email
  AND a.id > b.id;

-- 2) Jobs: delete duplicate (employer_id, title, location), keep row with smallest id
--    CASCADE will delete applications that reference the removed job ids
DELETE FROM jobs j1
USING jobs j2
WHERE j1.employer_id = j2.employer_id
  AND j1.title = j2.title
  AND COALESCE(j1.location, '') = COALESCE(j2.location, '')
  AND j1.id > j2.id;

COMMIT;
