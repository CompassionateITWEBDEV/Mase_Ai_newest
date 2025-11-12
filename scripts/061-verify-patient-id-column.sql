-- Verify and ensure medical_record_number column exists in patients table
-- This script checks if the column exists and creates it if missing

-- Check if column exists
DO $$
BEGIN
    -- Add medical_record_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'medical_record_number'
    ) THEN
        ALTER TABLE public.patients
        ADD COLUMN medical_record_number TEXT;
        
        RAISE NOTICE 'Added medical_record_number column to patients table';
    ELSE
        RAISE NOTICE 'medical_record_number column already exists';
    END IF;
END $$;

-- Verify the column structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'patients'
AND column_name IN ('medical_record_number', 'axxess_id', 'id')
ORDER BY column_name;

-- Show sample data to verify format
SELECT 
    id,
    medical_record_number,
    axxess_id,
    name
FROM public.patients
ORDER BY created_at DESC
LIMIT 5;

