-- Fix patients table - ensure all required columns exist
-- This fixes "Could not find column" errors

-- Add axxess_id column if it doesn't exist
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS axxess_id TEXT;

-- Add medical_record_number column if it doesn't exist
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS medical_record_number TEXT;

-- Handle medical_record_number NOT NULL constraint
DO $$
BEGIN
    -- If column exists but has NULL values, set default values
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'medical_record_number'
    ) THEN
        -- Set default values for existing NULL records
        UPDATE public.patients 
        SET medical_record_number = COALESCE(axxess_id, 'MRN-' || id::text) 
        WHERE medical_record_number IS NULL;
        
        -- If column is nullable but should be NOT NULL, make it NOT NULL
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'patients' 
            AND column_name = 'medical_record_number' 
            AND is_nullable = 'YES'
        ) THEN
            ALTER TABLE public.patients ALTER COLUMN medical_record_number SET NOT NULL;
        END IF;
    END IF;
END $$;

-- Make it unique and not null if it doesn't have constraints
DO $$
BEGIN
    -- Check if unique constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'patients_axxess_id_key'
    ) THEN
        ALTER TABLE public.patients
        ADD CONSTRAINT patients_axxess_id_key UNIQUE (axxess_id);
    END IF;
    
    -- Check if NOT NULL constraint exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'axxess_id' 
        AND is_nullable = 'YES'
    ) THEN
        -- Set existing null values to a default before adding NOT NULL
        UPDATE public.patients SET axxess_id = 'AX-' || id::text WHERE axxess_id IS NULL;
        ALTER TABLE public.patients ALTER COLUMN axxess_id SET NOT NULL;
    END IF;
END $$;

-- Add age column if it doesn't exist
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS age INTEGER;

-- Add date_of_birth column if it doesn't exist
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add other potentially missing columns
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS referral_date DATE,
ADD COLUMN IF NOT EXISTS current_status TEXT,
ADD COLUMN IF NOT EXISTS discharge_status TEXT,
ADD COLUMN IF NOT EXISTS referral_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES public.staff(id),
ADD COLUMN IF NOT EXISTS soc_due_date DATE,
ADD COLUMN IF NOT EXISTS soc_window_status TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS referral_type TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT,
ADD COLUMN IF NOT EXISTS diagnosis TEXT,
ADD COLUMN IF NOT EXISTS insurance TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS episode_start_date DATE,
ADD COLUMN IF NOT EXISTS episode_end_date DATE,
ADD COLUMN IF NOT EXISTS next_re_eval_date DATE,
ADD COLUMN IF NOT EXISTS lupa_status TEXT,
ADD COLUMN IF NOT EXISTS total_episode_cost NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS projected_cost NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS visit_frequencies JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS patient_goals JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS dme_orders JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS wound_care JSONB,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Handle first_name and last_name NOT NULL constraints
DO $$
BEGIN
    -- If first_name column exists but has NULL values, extract from name
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'first_name'
    ) THEN
        -- Set default values for existing NULL records
        UPDATE public.patients 
        SET first_name = COALESCE(
            first_name,
            SPLIT_PART(name, ' ', 1),
            'Unknown'
        )
        WHERE first_name IS NULL;
        
        -- If column is nullable but should be NOT NULL, make it NOT NULL
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'patients' 
            AND column_name = 'first_name' 
            AND is_nullable = 'YES'
        ) THEN
            ALTER TABLE public.patients ALTER COLUMN first_name SET NOT NULL;
        END IF;
    END IF;
    
    -- Handle last_name (can be nullable or use first_name as fallback)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'last_name'
    ) THEN
        -- Set default values for existing NULL records
        UPDATE public.patients 
        SET last_name = COALESCE(
            last_name,
            CASE 
                WHEN name LIKE '% %' THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
                ELSE first_name
            END,
            first_name
        )
        WHERE last_name IS NULL;
    END IF;
END $$;

-- Handle date_of_birth NOT NULL constraint
DO $$
BEGIN
    -- If date_of_birth column exists but has NULL values, set default values
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'date_of_birth'
    ) THEN
        -- Set default values for existing NULL records (70 years ago)
        UPDATE public.patients 
        SET date_of_birth = COALESCE(
            date_of_birth,
            (CURRENT_DATE - INTERVAL '70 years')::DATE
        )
        WHERE date_of_birth IS NULL;
        
        -- If column is nullable but should be NOT NULL, make it NOT NULL
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'patients' 
            AND column_name = 'date_of_birth' 
            AND is_nullable = 'YES'
        ) THEN
            ALTER TABLE public.patients ALTER COLUMN date_of_birth SET NOT NULL;
        END IF;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.patients.axxess_id IS 'Unique Axxess system identifier for the patient';
COMMENT ON COLUMN public.patients.age IS 'Patient age in years';
COMMENT ON COLUMN public.patients.first_name IS 'Patient first name (required)';
COMMENT ON COLUMN public.patients.last_name IS 'Patient last name';
COMMENT ON COLUMN public.patients.date_of_birth IS 'Patient date of birth (required)';

