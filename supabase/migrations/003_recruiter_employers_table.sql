-- Create recruiter_employers table (required for Rapid Post / Recruiter Dashboard)
-- Run in Supabase SQL Editor if you see: "Could not find the table 'public.recruiter_employers'"

-- Ensure employers exists (minimal structure if you created it elsewhere)
CREATE TABLE IF NOT EXISTS employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  industry_sector TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add created_by if missing (for auto-assigning recruiter when they create an employer)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employers' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE employers ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Recruiter–employer mapping (which recruiters can access which employers)
CREATE TABLE IF NOT EXISTS recruiter_employers (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, employer_id)
);

CREATE INDEX IF NOT EXISTS idx_recruiter_employers_user_id ON recruiter_employers(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_employers_employer_id ON recruiter_employers(employer_id);

ALTER TABLE recruiter_employers ENABLE ROW LEVEL SECURITY;

-- Recruiters can see their own employer assignments
DROP POLICY IF EXISTS "Users can view their own employer assignments" ON recruiter_employers;
CREATE POLICY "Users can view their own employer assignments"
  ON recruiter_employers FOR SELECT
  USING (user_id = auth.uid());

-- Service role can manage assignments (e.g. when creating employers or adding users)
DROP POLICY IF EXISTS "Service role manages recruiter assignments" ON recruiter_employers;
CREATE POLICY "Service role manages recruiter assignments"
  ON recruiter_employers FOR ALL
  USING (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- After this migration, link your user to an employer so Rapid Post works:
-- 1. Auth > Users — copy your user UUID.
-- 2. If needed, create an employer: INSERT INTO employers (company_name, admin_email)
--      VALUES ('Your Company', 'you@example.com') RETURNING id;
-- 3. Then: INSERT INTO recruiter_employers (user_id, employer_id)
--      VALUES ('your-user-uuid', 'employer-id-from-step-2')
--      ON CONFLICT (user_id, employer_id) DO NOTHING;
-- -----------------------------------------------------------------------------
