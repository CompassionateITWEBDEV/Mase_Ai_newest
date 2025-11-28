-- Migration: Add chart_id column to oasis_assessments table
-- This allows OASIS assessments to be grouped with other documents in the same chart

-- Add chart_id column
ALTER TABLE oasis_assessments 
ADD COLUMN IF NOT EXISTS chart_id TEXT;

-- Create index on chart_id for faster queries
CREATE INDEX IF NOT EXISTS idx_oasis_assessments_chart_id ON oasis_assessments(chart_id);

-- Add comment for documentation
COMMENT ON COLUMN oasis_assessments.chart_id IS 'Groups OASIS assessments with other documents in the same patient chart/episode';


