-- HireFast: Multi-Tenant Database Schema
-- Run this in Supabase SQL Editor or via Supabase CLI

-- =============================================================================
-- 1. CREATE TABLES
-- =============================================================================

-- Employers table (tenant root)
CREATE TABLE IF NOT EXISTS employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  industry_sector TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table (linked to employers)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  recruiter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  location TEXT,
  pay_rate TEXT,
  description_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications table (linked to jobs and employers)
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  commute_distance NUMERIC,
  match_score NUMERIC,
  status TEXT DEFAULT 'pending',
  last_interest_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT applications_employer_job_consistency CHECK (
    employer_id = (SELECT employer_id FROM jobs WHERE id = job_id)
  )
);

-- Recruiter-Employer mapping (for RLS: which employers can a recruiter access?)
CREATE TABLE IF NOT EXISTS recruiter_employers (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, employer_id)
);

-- =============================================================================
-- 2. INDEXES (for performance)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_employer_id ON applications(employer_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_recruiter_employers_user_id ON recruiter_employers(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_employers_employer_id ON recruiter_employers(employer_id);

-- =============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_employers ENABLE ROW LEVEL SECURITY;

-- Helper function: get employer IDs the current user (recruiter) can access
CREATE OR REPLACE FUNCTION public.user_employer_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT employer_id FROM recruiter_employers WHERE user_id = auth.uid()
  UNION
  SELECT DISTINCT employer_id FROM jobs WHERE recruiter_id = auth.uid();
$$;

-- --- EMPLOYERS ---
-- Recruiters can only SELECT employers they have access to
CREATE POLICY "Recruiters can view their employers"
  ON employers FOR SELECT
  USING (id IN (SELECT public.user_employer_ids()));

-- Authenticated users can create employers (onboarding flow)
CREATE POLICY "Authenticated users can create employers"
  ON employers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Recruiters can update their employers"
  ON employers FOR UPDATE
  USING (id IN (SELECT public.user_employer_ids()));

-- --- JOBS ---
-- Recruiters can only see jobs for their employer(s)
CREATE POLICY "Recruiters can view jobs for their employers"
  ON jobs FOR SELECT
  USING (employer_id IN (SELECT public.user_employer_ids()));

CREATE POLICY "Recruiters can insert jobs for their employers"
  ON jobs FOR INSERT
  WITH CHECK (employer_id IN (SELECT public.user_employer_ids()));

CREATE POLICY "Recruiters can update jobs for their employers"
  ON jobs FOR UPDATE
  USING (employer_id IN (SELECT public.user_employer_ids()));

CREATE POLICY "Recruiters can delete jobs for their employers"
  ON jobs FOR DELETE
  USING (employer_id IN (SELECT public.user_employer_ids()));

-- --- APPLICATIONS ---
-- Recruiters can only see applications for their employer(s)
CREATE POLICY "Recruiters can view applications for their employers"
  ON applications FOR SELECT
  USING (employer_id IN (SELECT public.user_employer_ids()));

CREATE POLICY "Recruiters can insert applications for their employers"
  ON applications FOR INSERT
  WITH CHECK (employer_id IN (SELECT public.user_employer_ids()));

CREATE POLICY "Recruiters can update applications for their employers"
  ON applications FOR UPDATE
  USING (employer_id IN (SELECT public.user_employer_ids()));

CREATE POLICY "Recruiters can delete applications for their employers"
  ON applications FOR DELETE
  USING (employer_id IN (SELECT public.user_employer_ids()));

-- --- RECRUITER_EMPLOYERS ---
-- Users can only see their own assignments
CREATE POLICY "Users can view their own employer assignments"
  ON recruiter_employers FOR SELECT
  USING (user_id = auth.uid());

-- Service role can manage recruiter assignments (onboarding, admin)
CREATE POLICY "Service role manages recruiter assignments"
  ON recruiter_employers FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger: auto-assign creator to recruiter_employers when they create an employer
CREATE OR REPLACE FUNCTION public.auto_assign_employer_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO recruiter_employers (user_id, employer_id)
    VALUES (NEW.created_by, NEW.id)
    ON CONFLICT (user_id, employer_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER employers_auto_assign_creator
  AFTER INSERT ON employers
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_employer_creator();

-- =============================================================================
-- 4. UPDATED_AT TRIGGER (optional but recommended)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER employers_updated_at
  BEFORE UPDATE ON employers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
