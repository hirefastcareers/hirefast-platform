-- Compliance: Right to Work (has_rtw) and Ghosting: last contact timestamp
ALTER TABLE applications ADD COLUMN IF NOT EXISTS has_rtw BOOLEAN;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

COMMENT ON COLUMN applications.has_rtw IS 'Candidate declared right to work in the UK; if false, match_score must be 0.';
COMMENT ON COLUMN applications.last_contacted_at IS 'Set when recruiter contacts candidate (e.g. clicks WhatsApp); clears ghosting warning.';
