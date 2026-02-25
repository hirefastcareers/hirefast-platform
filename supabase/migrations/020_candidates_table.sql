-- Candidate Profile ("Digital Passport") - one row per candidate, keyed by email
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  candidate_skills TEXT[] DEFAULT '{}',
  has_rtw BOOLEAN,
  cv_url TEXT,
  cv_text TEXT,
  profile_token TEXT UNIQUE DEFAULT (gen_random_uuid()::text),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure profile_token is set on insert for magic-link edit
CREATE OR REPLACE FUNCTION candidates_set_profile_token()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.profile_token IS NULL THEN
    NEW.profile_token := gen_random_uuid()::text;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS candidates_set_profile_token_trigger ON candidates;
CREATE TRIGGER candidates_set_profile_token_trigger
  BEFORE INSERT ON candidates
  FOR EACH ROW EXECUTE FUNCTION public.candidates_set_profile_token();

CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_profile_token ON candidates(profile_token) WHERE profile_token IS NOT NULL;

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Anon can create a profile (insert only)
CREATE POLICY "Anyone can create a candidate profile"
  ON candidates FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow read/update only via profile token (magic link)
CREATE OR REPLACE FUNCTION public.get_candidate_by_token(p_token TEXT)
RETURNS SETOF candidates
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM candidates WHERE profile_token = p_token LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.update_candidate_by_token(
  p_token TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_candidate_skills TEXT[],
  p_has_rtw BOOLEAN,
  p_cv_url TEXT,
  p_cv_text TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE candidates
  SET
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(p_phone, phone),
    candidate_skills = COALESCE(p_candidate_skills, candidate_skills),
    has_rtw = COALESCE(p_has_rtw, has_rtw),
    cv_url = COALESCE(p_cv_url, cv_url),
    cv_text = COALESCE(p_cv_text, cv_text),
    updated_at = NOW()
  WHERE profile_token = p_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_candidate_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_candidate_by_token(TEXT, TEXT, TEXT, TEXT[], BOOLEAN, TEXT, TEXT) TO anon;

COMMENT ON TABLE candidates IS 'Candidate Digital Passport - one row per candidate (email). Used for profile page and CV parsing.';
