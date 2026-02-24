-- Ensure jobs table has location (and other expected columns) for existing databases
-- Run this if you see "column jobs.location does not exist" on job listings.

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pay_rate TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description_template TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
