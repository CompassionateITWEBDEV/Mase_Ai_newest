-- Add patient_id and ensure medical_record_number and axxess_id columns exist
-- Structure:
-- - patient_id: PT-2024-001 format (Patient ID)
-- - medical_record_number: Medical Record ID (same as Medical ID)
-- - axxess_id: Axxess system ID (already exists)

-- Add patient_id column (PT-2024-001 format)
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS patient_id TEXT;

-- Ensure medical_record_number column exists (Medical Record ID = Medical ID)
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS medical_record_number TEXT;

-- Ensure axxess_id column exists (should already exist)
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS axxess_id TEXT;

-- Migrate existing data: Copy medical_record_number to patient_id if it's in PT- format
UPDATE public.patients
SET patient_id = medical_record_number
WHERE medical_record_number IS NOT NULL 
  AND medical_record_number LIKE 'PT-%'
  AND patient_id IS NULL;

-- For records without PT- format, generate patient_id
DO $$
DECLARE
    patient_record RECORD;
    year_str TEXT;
    counter INT;
    new_patient_id TEXT;
BEGIN
    year_str := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- For each patient without patient_id
    FOR patient_record IN 
        SELECT id, patient_id, medical_record_number, axxess_id
        FROM public.patients
        WHERE patient_id IS NULL
    LOOP
        -- Get the highest sequence number for this year
        SELECT COALESCE(MAX(CAST(SUBSTRING(patient_id FROM 'PT-\d{4}-(\d+)') AS INT)), 0) + 1
        INTO counter
        FROM public.patients
        WHERE patient_id LIKE 'PT-' || year_str || '-%';
        
        -- Format: PT-YYYY-XXX (3 digits, zero-padded)
        new_patient_id := 'PT-' || year_str || '-' || LPAD(counter::TEXT, 3, '0');
        
        -- Update the patient record
        UPDATE public.patients
        SET patient_id = new_patient_id
        WHERE id = patient_record.id;
    END LOOP;
END $$;

-- medical_record_number is the Medical Record ID (same thing)
-- No need to copy, it's already the Medical ID

-- Add unique constraints
DO $$
BEGIN
    -- Add unique constraint for patient_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'patients_patient_id_key'
    ) THEN
        -- First, ensure no duplicates
        UPDATE public.patients p1
        SET patient_id = patient_id || '-' || SUBSTRING(p1.id::TEXT FROM 1 FOR 8)
        WHERE EXISTS (
            SELECT 1 FROM public.patients p2
            WHERE p2.patient_id = p1.patient_id
            AND p2.id != p1.id
            AND p1.patient_id IS NOT NULL
        );
        
        ALTER TABLE public.patients
        ADD CONSTRAINT patients_patient_id_key UNIQUE (patient_id);
    END IF;
    
    -- Add unique constraint for medical_record_number if it doesn't exist
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
            AND p1.medical_record_number IS NOT NULL
        );
        
        ALTER TABLE public.patients
        ADD CONSTRAINT patients_medical_record_number_key UNIQUE (medical_record_number);
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.patients.patient_id IS 'Patient ID in format PT-YYYY-XXX (e.g., PT-2024-001)';
COMMENT ON COLUMN public.patients.medical_record_number IS 'Medical Record ID (Medical ID)';
COMMENT ON COLUMN public.patients.axxess_id IS 'Axxess system identifier (e.g., AX-12345)';

