-- Add commute_risk_level to applications (green / amber / red)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS commute_risk_level TEXT;
