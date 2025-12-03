-- Fix NULL chart_id values in oasis_assessments table
-- This script updates existing records that have NULL chart_id

-- First, check how many records have NULL chart_id
SELECT COUNT(*) as null_chart_ids 
FROM oasis_assessments 
WHERE chart_id IS NULL;

-- Update records with NULL chart_id
-- Use upload_id to create a unique chart_id for each record
UPDATE oasis_assessments 
SET chart_id = 'chart-' || upload_id::text
WHERE chart_id IS NULL;

-- Verify the update
SELECT 
  id,
  upload_id,
  chart_id,
  file_name,
  patient_name,
  created_at
FROM oasis_assessments
WHERE chart_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any remaining NULL values
SELECT COUNT(*) as remaining_nulls
FROM oasis_assessments 
WHERE chart_id IS NULL;




