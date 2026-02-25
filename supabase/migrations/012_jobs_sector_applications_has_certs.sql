-- Sector-aware Truth Engine and Engineering compliance
-- jobs.sector: used for distance thresholds (engineering 20mi green, manufacturing 10mi green) and Apply page (engineering shows certs toggle)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS sector TEXT;
COMMENT ON COLUMN jobs.sector IS 'Template sector when created via Rapid Post: logistics, engineering, manufacturing, retail. Used for commute thresholds and Engineering certs gate.';

-- applications.has_certs: for Engineering roles, candidate declares required safety tickets/certifications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS has_certs BOOLEAN;
COMMENT ON COLUMN applications.has_certs IS 'For Engineering roles: candidate declared they hold required safety tickets/certs for the role; if false, match_score can be reduced.';
