-- Add shortlisted_at for anti-ghosting: track when a candidate was shortlisted
ALTER TABLE applications ADD COLUMN IF NOT EXISTS shortlisted_at TIMESTAMPTZ;

COMMENT ON COLUMN applications.shortlisted_at IS 'Set when status becomes shortlisted; used for anti-ghosting follow-up.';
