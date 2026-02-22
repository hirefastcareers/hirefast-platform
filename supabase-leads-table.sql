-- Recruiter Command Centre: "leads" table for the dashboard
-- Run this in the Supabase SQL Editor if the table does not exist.

CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT,
  email TEXT NOT NULL,
  postcode TEXT,
  role TEXT,
  secondary_email TEXT,  -- null or empty = drop-off risk (highlight in UI)
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: index for UK postcode and role filtering
CREATE INDEX IF NOT EXISTS idx_leads_postcode ON leads(postcode);
CREATE INDEX IF NOT EXISTS idx_leads_role ON leads(role);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Optional: seed a few rows for testing (remove in production)
-- INSERT INTO leads (full_name, email, postcode, role, secondary_email, processed)
-- VALUES
--   ('Jane Smith', 'jane@example.com', 'SW1A 1AA', 'Developer', 'jane.alt@example.com', false),
--   ('John Doe', 'john@example.com', 'M1 1AE', 'Designer', NULL, false);
