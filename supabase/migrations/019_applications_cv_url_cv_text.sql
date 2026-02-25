-- CV Speed-Reader: optional CV URL (uploaded file) and extracted text for preview + keyword highlight
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cv_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cv_text TEXT;

COMMENT ON COLUMN applications.cv_url IS 'Optional URL to uploaded CV (e.g. Supabase Storage).';
COMMENT ON COLUMN applications.cv_text IS 'Extracted or pasted CV text for Speed-Reader preview and required_skills keyword highlighting.';
