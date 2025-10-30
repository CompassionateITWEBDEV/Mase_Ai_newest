-- Test script to check column mapping
-- This will help us verify that the form data matches the database columns

-- Check what columns exist in the application_forms table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'application_forms' 
ORDER BY ordinal_position;


