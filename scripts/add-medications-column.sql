-- Add medications column to oasis_assessments table
-- This stores the extracted medication list from M2001-M2003 sections

ALTER TABLE oasis_assessments 
ADD COLUMN IF NOT EXISTS medications JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN oasis_assessments.medications IS 'Extracted medication list from M2001-M2003 sections. Array of medication objects with name, dosage, frequency, route, indication, prescriber, startDate, and concerns.';

-- Create index for faster queries on medications
CREATE INDEX IF NOT EXISTS idx_oasis_assessments_medications ON oasis_assessments USING GIN (medications);

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'oasis_assessments' 
AND column_name = 'medications';


