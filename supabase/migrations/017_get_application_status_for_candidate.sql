-- Express Apply: let candidates check if they already applied (anon-safe, no SELECT on applications).
-- Returns created_at and status only when (job_id, email) match one row.

CREATE OR REPLACE FUNCTION public.get_application_status_for_candidate(
  p_job_id UUID,
  p_email TEXT
)
RETURNS TABLE(created_at TIMESTAMPTZ, status TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.created_at, a.status
  FROM applications a
  WHERE a.job_id = p_job_id
    AND LOWER(TRIM(a.email)) = LOWER(TRIM(p_email))
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_application_status_for_candidate(UUID, TEXT) IS 'Allows candidate to check if they already applied (job_id + email). Returns created_at and status only; anon-safe.';

GRANT EXECUTE ON FUNCTION public.get_application_status_for_candidate(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_application_status_for_candidate(UUID, TEXT) TO authenticated;
