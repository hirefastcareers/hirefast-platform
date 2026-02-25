-- Public interest-check context (anon can fetch only with valid token) and withdraw => reject

-- Returns candidate name, job title, employer name when token matches and interest check is pending
CREATE OR REPLACE FUNCTION public.get_interest_check_context(
  p_application_id UUID,
  p_token TEXT
)
RETURNS TABLE(full_name TEXT, job_title TEXT, company_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.full_name, j.title, e.company_name
  FROM applications a
  JOIN jobs j ON j.id = a.job_id
  JOIN employers e ON e.id = a.employer_id
  WHERE a.id = p_application_id
    AND a.interest_check_token IS NOT NULL
    AND a.interest_check_token = p_token
    AND a.interest_status = 'pending';
$$;

GRANT EXECUTE ON FUNCTION public.get_interest_check_context(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_interest_check_context(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.get_interest_check_context IS 'Magic-link flow: returns context for confirm-interest page only when token matches and interest_status is pending.';

-- When candidate selects "No, I'm no longer looking", also set application status to rejected
CREATE OR REPLACE FUNCTION public.update_application_interest_check(
  p_interest_check_token TEXT,
  p_application_id UUID,
  p_interest_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_interest_status NOT IN ('confirmed', 'withdrawn') THEN
    RAISE EXCEPTION 'interest_status must be confirmed or withdrawn';
  END IF;

  UPDATE applications
  SET
    interest_status = p_interest_status,
    interest_confirmed_at = CASE
      WHEN p_interest_status = 'confirmed' THEN NOW()
      ELSE interest_confirmed_at
    END,
    status = CASE
      WHEN p_interest_status = 'withdrawn' THEN 'rejected'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_application_id
    AND interest_check_token IS NOT NULL
    AND interest_check_token = p_interest_check_token;
END;
$$;
