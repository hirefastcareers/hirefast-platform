-- Interest-check tracking for applications (magic-link flow)
-- project_overview: "Interest Checks" via magic links; .cursorrules: "Interest Check magic link flows for candidates"

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS interest_check_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS interest_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS interest_status TEXT NOT NULL DEFAULT 'none';

ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_interest_status_check;

ALTER TABLE applications
  ADD CONSTRAINT applications_interest_status_check
  CHECK (interest_status IN ('none', 'pending', 'confirmed', 'withdrawn'));

-- Token for magic link: set when sending the check; candidate presents it to update their response
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interest_check_token TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_applications_interest_check_token ON applications(interest_check_token) WHERE interest_check_token IS NOT NULL;

COMMENT ON COLUMN applications.interest_check_sent_at IS 'When the recruiter sent the interest-check magic link.';
COMMENT ON COLUMN applications.interest_confirmed_at IS 'When the candidate responded (e.g. confirmed interest).';
COMMENT ON COLUMN applications.interest_status IS 'none | pending (sent) | confirmed | withdrawn.';
COMMENT ON COLUMN applications.interest_check_token IS 'Token in magic link; used to allow candidate to update interest_status/interest_confirmed_at.';

-- RLS: candidates (unauthenticated) update via magic-link token only, not direct UPDATE
-- This function validates the token and updates only interest_status and interest_confirmed_at
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
    updated_at = NOW()
  WHERE id = p_application_id
    AND interest_check_token IS NOT NULL
    AND interest_check_token = p_interest_check_token;
END;
$$;

-- Allow anon and authenticated to call (magic-link flow is typically anon)
GRANT EXECUTE ON FUNCTION public.update_application_interest_check(TEXT, UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_application_interest_check(TEXT, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.update_application_interest_check IS 'Magic-link flow: candidate passes token from URL to update their interest (confirmed/withdrawn). Validates token then updates only interest_status and interest_confirmed_at.';
