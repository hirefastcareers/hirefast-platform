-- Optional "Immediate Start" badge on job cards (set when posting the job)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS immediate_start BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN jobs.immediate_start IS 'When true, job card shows "Immediate Start" badge on the candidate job list. Set on the job posting form.';
