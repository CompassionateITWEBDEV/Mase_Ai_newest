-- Add comprehensive OASIS analysis fields to oasis_assessments table

-- Add functional status (M1800-M1870)
ALTER TABLE oasis_assessments 
ADD COLUMN IF NOT EXISTS functional_status JSONB;

-- Add full extracted data
ALTER TABLE oasis_assessments 
ADD COLUMN IF NOT EXISTS extracted_data JSONB;

-- Add missing information
ALTER TABLE oasis_assessments 
ADD COLUMN IF NOT EXISTS missing_information JSONB;

-- Add inconsistencies
ALTER TABLE oasis_assessments 
ADD COLUMN IF NOT EXISTS inconsistencies JSONB;

-- Add debug info
ALTER TABLE oasis_assessments 
ADD COLUMN IF NOT EXISTS debug_info JSONB;

-- Add comments for documentation
COMMENT ON COLUMN oasis_assessments.functional_status IS 'All 9 functional status items (M1800-M1870) with current values, descriptions, and suggested improvements';
COMMENT ON COLUMN oasis_assessments.extracted_data IS 'Full extracted data including oasisCorrections, qualityMeasures, and raw functional status';
COMMENT ON COLUMN oasis_assessments.missing_information IS 'List of missing OASIS fields with location, impact, and recommendations';
COMMENT ON COLUMN oasis_assessments.inconsistencies IS 'Detected inconsistencies between document sections with severity and recommendations';
COMMENT ON COLUMN oasis_assessments.debug_info IS 'Debug information for troubleshooting extraction issues';


