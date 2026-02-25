-- Optional employer profile fields for signup form (location, website, company_description)
ALTER TABLE employers ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE employers ADD COLUMN IF NOT EXISTS company_description TEXT;
COMMENT ON COLUMN employers.location IS 'Employer location (e.g. city).';
COMMENT ON COLUMN employers.website IS 'Employer website URL.';
COMMENT ON COLUMN employers.company_description IS 'About the company for candidates.';
