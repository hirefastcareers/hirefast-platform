-- Candidates: postcode (Truth Engine) and speed_summary (CV Speed-Reader)
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS postcode TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS speed_summary TEXT;

COMMENT ON COLUMN candidates.postcode IS 'Partial or full UK postcode for distance calculation (Truth Engine).';
COMMENT ON COLUMN candidates.speed_summary IS '1-sentence Speed-Reader summary of work history (max 120 chars), from CV extraction.';

-- Replace update_candidate_by_token with version that includes postcode and speed_summary
DROP FUNCTION IF EXISTS public.update_candidate_by_token(TEXT, TEXT, TEXT, TEXT[], BOOLEAN, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.update_candidate_by_token(
  p_token TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_candidate_skills TEXT[],
  p_has_rtw BOOLEAN,
  p_cv_url TEXT,
  p_cv_text TEXT,
  p_postcode TEXT DEFAULT NULL,
  p_speed_summary TEXT DEFAULT NULL
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
    postcode = COALESCE(p_postcode, postcode),
    speed_summary = COALESCE(p_speed_summary, speed_summary),
    updated_at = NOW()
  WHERE profile_token = p_token;
END;
$$;

-- anon already has EXECUTE; re-grant with new signature (same name, new params)
GRANT EXECUTE ON FUNCTION public.update_candidate_by_token(TEXT, TEXT, TEXT, TEXT[], BOOLEAN, TEXT, TEXT, TEXT, TEXT) TO anon;
