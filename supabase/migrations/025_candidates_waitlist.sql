-- Alpha landing: waitlist signups stored in candidates with status 'waitlist'
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS status TEXT;

COMMENT ON COLUMN candidates.status IS 'waitlist = alpha signup only; active = has applied or completed profile; NULL = legacy.';

-- Anon-safe: check by email and either return already_joined or insert new row with status waitlist
CREATE OR REPLACE FUNCTION public.join_waitlist(p_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalised TEXT := LOWER(TRIM(p_email));
BEGIN
  IF v_normalised = '' OR v_normalised NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;

  IF EXISTS (SELECT 1 FROM candidates WHERE LOWER(TRIM(email)) = v_normalised) THEN
    RETURN 'already_joined';
  END IF;

  BEGIN
    INSERT INTO candidates (email, status)
    VALUES (TRIM(p_email), 'waitlist');
    RETURN 'joined';
  EXCEPTION
    WHEN unique_violation THEN
      RETURN 'already_joined';
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_waitlist(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.join_waitlist(TEXT) TO authenticated;

COMMENT ON FUNCTION public.join_waitlist(TEXT) IS 'Alpha landing: add email to waitlist. Returns joined or already_joined. Idempotent.';
