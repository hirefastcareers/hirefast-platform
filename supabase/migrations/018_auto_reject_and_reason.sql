-- Job setting: auto-reject low matches (no RTW or commute > 30 miles)
-- Applications: reason field for reject (manual or auto)

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS auto_reject_low_matches BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN jobs.auto_reject_low_matches IS 'When true, new applications with has_rtw = false or commute_distance > 30 are auto-rejected with reason.';

ALTER TABLE applications ADD COLUMN IF NOT EXISTS reason TEXT;
COMMENT ON COLUMN applications.reason IS 'Reject reason, e.g. Auto-rejected: Failed Compliance/Distance or Rejected by recruiter.';

-- After insert: if job has auto_reject_low_matches and application fails (no RTW or >30 mi), set rejected
CREATE OR REPLACE FUNCTION public.auto_reject_low_match_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auto_reject boolean;
  v_should_reject boolean := false;
BEGIN
  SELECT j.auto_reject_low_matches INTO v_auto_reject
  FROM jobs j WHERE j.id = NEW.job_id;

  IF v_auto_reject THEN
    IF NEW.has_rtw = false THEN
      v_should_reject := true;
    ELSIF NEW.commute_distance IS NOT NULL AND NEW.commute_distance > 30 THEN
      v_should_reject := true;
    END IF;
  END IF;

  IF v_should_reject THEN
    NEW.status := 'rejected';
    NEW.reason := 'Auto-rejected: Failed Compliance/Distance';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS applications_auto_reject_low_match ON applications;
CREATE TRIGGER applications_auto_reject_low_match
  BEFORE INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_reject_low_match_application();

COMMENT ON FUNCTION public.auto_reject_low_match_application IS 'BEFORE INSERT: if job.auto_reject_low_matches and (has_rtw = false or commute_distance > 30), set status rejected and reason.';
