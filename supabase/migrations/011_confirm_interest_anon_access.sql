-- Confirm-interest route: ensure public (unauthenticated) access is scoped to one row by token.
-- The app does NOT use direct SELECT/UPDATE on applications/jobs; it uses SECURITY DEFINER
-- functions that only return or update the row matching (application_id, token).

-- 1) SELECT: anon cannot read applications/jobs directly (RLS has no policy for anon SELECT).
--    The page calls get_interest_check_context(application_id, token), which runs as definer,
--    reads applications + jobs + employers, and returns only (full_name, job_title, company_name)
--    when the row matches the token and interest_status = 'pending'. So public users only
--    get data for the single application they have the magic link for.

-- 2) UPDATE: anon cannot update applications directly (RLS has no policy for anon UPDATE).
--    The page calls update_application_interest_check(token, application_id, interest_status),
--    which runs as definer and updates only interest_status, interest_confirmed_at (and
--    status when withdrawn) for the row where interest_check_token = token. So public
--    users can only update that single row.

-- Ensure anon can invoke these functions (idempotent).
GRANT EXECUTE ON FUNCTION public.get_interest_check_context(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_interest_check_context(UUID, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION public.update_application_interest_check(TEXT, UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_application_interest_check(TEXT, UUID, TEXT) TO authenticated;

-- anon must have INSERT on applications for the Apply page (policy "Candidates can submit applications").
-- anon must NOT have SELECT or UPDATE on applications; confirm-interest uses only the RPCs above,
-- which use SECURITY DEFINER to read/update the single row matching the magic-link token.
