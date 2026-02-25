-- RPC to create employer on signup: runs as definer so RLS doesn't block the insert.
-- If the user already has an employer (e.g. from a previous failed attempt), returns that employer id so we don't create duplicates.
CREATE OR REPLACE FUNCTION public.create_employer_on_signup(
  p_company_name TEXT,
  p_admin_email TEXT,
  p_location TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_company_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated. Confirm your email or sign in first.';
  END IF;

  -- If user already has an employer, return it (e.g. they hit "already registered" and we're signing them in)
  SELECT employer_id INTO v_id
  FROM recruiter_employers
  WHERE user_id = v_uid
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO employers (company_name, admin_email, created_by, location, website, company_description)
  VALUES (p_company_name, p_admin_email, v_uid, p_location, p_website, p_company_description)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.create_employer_on_signup IS 'Create employer and link to current user, or return existing employer id. Bypasses RLS.';

-- Allow authenticated users to call (e.g. right after signUp when session is active)
GRANT EXECUTE ON FUNCTION public.create_employer_on_signup TO authenticated;
