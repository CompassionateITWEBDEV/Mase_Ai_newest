-- Verify and fix staff table structure
-- Check if staff table exists and has correct columns

-- First, let's see what columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'staff'
ORDER BY ordinal_position;

-- If staff table doesn't have email column, we need to check the structure
-- The table might have been created with different columns

