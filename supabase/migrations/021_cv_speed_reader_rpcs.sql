-- CV Speed-Reader: pull CV from Candidate Profile (candidates table) and Request CV magic link.
-- Only recruiters with access to the application (via user_employer_ids) can call these.

-- 1) Get candidate CV for an application (from candidates table by application email)
CREATE OR REPLACE FUNCTION public.get_candidate_cv_for_application(p_application_id UUID)
RETURNS TABLE(cv_url TEXT, cv_text TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT a.email INTO v_email
  FROM applications a
  WHERE a.id = p_application_id
    AND a.employer_id IN (SELECT public.user_employer_ids());
  IF v_email IS NULL THEN
    RETURN; -- no row: either invalid id or no access
  END IF;
  RETURN QUERY
  SELECT c.cv_url, c.cv_text
  FROM candidates c
  WHERE c.email = v_email
  LIMIT 1;
END;
$$;

-- 2) Get or create a profile magic link for the candidate (so recruiter can "Request CV")
CREATE OR REPLACE FUNCTION public.get_or_create_candidate_profile_link(p_application_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_token TEXT;
  v_link TEXT;
BEGIN
  SELECT a.email INTO v_email
  FROM applications a
  WHERE a.id = p_application_id
    AND a.employer_id IN (SELECT public.user_employer_ids());
  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT c.profile_token INTO v_token
  FROM candidates c
  WHERE c.email = v_email
  LIMIT 1;

  IF v_token IS NULL THEN
    INSERT INTO candidates (email)
    VALUES (v_email)
    ON CONFLICT (email) DO NOTHING;
    SELECT c.profile_token INTO v_token
    FROM candidates c
    WHERE c.email = v_email
    LIMIT 1;
  END IF;

  IF v_token IS NULL THEN
    RETURN NULL;
  END IF;

  -- Return full URL for the profile edit page (frontend will prepend origin if needed)
  v_link := '/profile?t=' || v_token;
  RETURN v_link;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_candidate_cv_for_application(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_candidate_profile_link(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_candidate_cv_for_application IS 'CV Speed-Reader: return candidate CV from Candidate Profile (candidates table) for an application. Caller must have access to the application.';
COMMENT ON FUNCTION public.get_or_create_candidate_profile_link IS 'Request CV: get or create candidate profile and return profile magic link path (e.g. /profile?t=...). Caller must have access to the application.';
