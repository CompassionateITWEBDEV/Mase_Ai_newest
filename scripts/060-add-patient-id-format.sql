-- Ensure medical_record_number column exists and can store PT-2024-001 format
-- This script ensures the column is properly set up for Patient ID format

-- Add medical_record_number column if it doesn't exist
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS medical_record_number TEXT;

-- Update existing records to have PT-YYYY-XXX format if they don't have one
DO $$
DECLARE
    patient_record RECORD;
    year_str TEXT;
    counter INT;
    new_mrn TEXT;
BEGIN
    -- Get current year
    year_str := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- For each patient without a proper PT- format MRN
    FOR patient_record IN 
        SELECT id, medical_record_number, axxess_id, created_at
        FROM public.patients
        WHERE medical_record_number IS NULL 
           OR medical_record_number NOT LIKE 'PT-%'
           OR medical_record_number = ''
    LOOP
        -- Generate PT-YYYY-XXX format
        -- Get count of existing PT records for this year to create unique number
        SELECT COALESCE(MAX(CAST(SUBSTRING(medical_record_number FROM 'PT-\d{4}-(\d+)') AS INT)), 0) + 1
        INTO counter
        FROM public.patients
        WHERE medical_record_number LIKE 'PT-' || year_str || '-%';
        
        -- Format: PT-YYYY-XXX (3 digits, zero-padded)
        new_mrn := 'PT-' || year_str || '-' || LPAD(counter::TEXT, 3, '0');
        
        -- Update the patient record
        UPDATE public.patients
        SET medical_record_number = new_mrn
        WHERE id = patient_record.id;
    END LOOP;
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'patients_medical_record_number_key'
    ) THEN
        -- First, ensure no duplicates
        UPDATE public.patients p1
        SET medical_record_number = medical_record_number || '-' || SUBSTRING(p1.id::TEXT FROM 1 FOR 8)
        WHERE EXISTS (
            SELECT 1 FROM public.patients p2
            WHERE p2.medical_record_number = p1.medical_record_number
            AND p2.id != p1.id
        );
        
        -- Then add unique constraint
        ALTER TABLE public.patients
        ADD CONSTRAINT patients_medical_record_number_key UNIQUE (medical_record_number);
    END IF;
END $$;

-- Add comment
COMMENT ON COLUMN public.patients.medical_record_number IS 'Patient ID in format PT-YYYY-XXX (e.g., PT-2024-001)';

