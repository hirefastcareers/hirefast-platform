-- Technical Skills/Tickets layer for Industrial sectors (Engineering, Manufacturing)
-- jobs.required_skills: tickets/certs the recruiter requires for the role (e.g. Forklift, CSCS, NVQ Level 2)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_skills TEXT[] DEFAULT '{}';
COMMENT ON COLUMN jobs.required_skills IS 'Required tickets/certs for the role (e.g. Forklift, CSCS). Used for Engineering/Manufacturing match score and candidate checklist.';

-- applications.candidate_skills: tickets/certs the candidate declared they hold
ALTER TABLE applications ADD COLUMN IF NOT EXISTS candidate_skills TEXT[] DEFAULT '{}';
COMMENT ON COLUMN applications.candidate_skills IS 'Tickets/certs the candidate holds (subset of job required_skills). Used for 50% skills match and Missing Requirements badge.';
