-- COMPLETE MIGRATION: Add ALL required columns to referrals table
-- Run this ONE TIME to fix all missing columns

BEGIN;

-- Add insurance_id column (REQUIRED)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals' 
        AND column_name = 'insurance_id'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN insurance_id TEXT NOT NULL DEFAULT 'Not provided';
        RAISE NOTICE '✓ Added insurance_id column';
    ELSE
        RAISE NOTICE '✓ insurance_id column already exists';
    END IF;
END $$;

-- Add insurance_provider column (REQUIRED)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals' 
        AND column_name = 'insurance_provider'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN insurance_provider TEXT NOT NULL DEFAULT 'Not provided';
        RAISE NOTICE '✓ Added insurance_provider column';
    ELSE
        RAISE NOTICE '✓ insurance_provider column already exists';
    END IF;
END $$;

-- Add diagnosis column (REQUIRED)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals' 
        AND column_name = 'diagnosis'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN diagnosis TEXT NOT NULL DEFAULT 'Not specified';
        RAISE NOTICE '✓ Added diagnosis column';
    ELSE
        RAISE NOTICE '✓ diagnosis column already exists';
    END IF;
END $$;

-- Add patient_name column (REQUIRED)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals' 
        AND column_name = 'patient_name'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN patient_name TEXT NOT NULL DEFAULT 'Unknown';
        RAISE NOTICE '✓ Added patient_name column';
    ELSE
        RAISE NOTICE '✓ patient_name column already exists';
    END IF;
END $$;

-- Add referral_date column (REQUIRED)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals' 
        AND column_name = 'referral_date'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN referral_date DATE NOT NULL DEFAULT CURRENT_DATE;
        RAISE NOTICE '✓ Added referral_date column';
    ELSE
        RAISE NOTICE '✓ referral_date column already exists';
    END IF;
END $$;

-- Add referral_source column (REQUIRED)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals' 
        AND column_name = 'referral_source'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN referral_source TEXT NOT NULL DEFAULT 'Manual Entry';
        RAISE NOTICE '✓ Added referral_source column';
    ELSE
        RAISE NOTICE '✓ referral_source column already exists';
    END IF;
END $$;

-- Add status column (REQUIRED)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN status TEXT NOT NULL DEFAULT 'New';
        RAISE NOTICE '✓ Added status column';
    ELSE
        RAISE NOTICE '✓ status column already exists';
    END IF;
END $$;

-- Add referral_number column (REQUIRED) - Auto-generate unique number
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals' 
        AND column_name = 'referral_number'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN referral_number TEXT;
        -- Generate referral numbers for existing rows
        UPDATE public.referrals 
        SET referral_number = 'REF-' || LPAD(id::TEXT, 8, '0')
        WHERE referral_number IS NULL;
        -- Now make it NOT NULL with a default
        ALTER TABLE public.referrals ALTER COLUMN referral_number SET NOT NULL;
        ALTER TABLE public.referrals ALTER COLUMN referral_number SET DEFAULT 'REF-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        RAISE NOTICE '✓ Added referral_number column';
    ELSE
        RAISE NOTICE '✓ referral_number column already exists';
        -- Ensure existing NULL values are filled
        UPDATE public.referrals 
        SET referral_number = 'REF-' || LPAD(id::TEXT, 8, '0')
        WHERE referral_number IS NULL;
    END IF;
END $$;

-- Add referral_type column (REQUIRED)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals' 
        AND column_name = 'referral_type'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN referral_type TEXT NOT NULL DEFAULT 'standard';
        RAISE NOTICE '✓ Added referral_type column';
    ELSE
        RAISE NOTICE '✓ referral_type column already exists';
        -- Fill any NULL values
        UPDATE public.referrals 
        SET referral_type = 'standard'
        WHERE referral_type IS NULL;
    END IF;
END $$;

-- Add ai_reason column (OPTIONAL)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals' 
        AND column_name = 'ai_reason'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN ai_reason TEXT;
        RAISE NOTICE '✓ Added ai_reason column';
    ELSE
        RAISE NOTICE '✓ ai_reason column already exists';
    END IF;
END $$;

-- Add ai_recommendation column (OPTIONAL)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals' 
        AND column_name = 'ai_recommendation'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN ai_recommendation TEXT;
        RAISE NOTICE '✓ Added ai_recommendation column';
    ELSE
        RAISE NOTICE '✓ ai_recommendation column already exists';
    END IF;
END $$;

-- Add soc_due_date column (OPTIONAL)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals' 
        AND column_name = 'soc_due_date'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN soc_due_date DATE;
        RAISE NOTICE '✓ Added soc_due_date column';
    ELSE
        RAISE NOTICE '✓ soc_due_date column already exists';
    END IF;
END $$;

-- Add extendedcare_data column (OPTIONAL)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals' 
        AND column_name = 'extendedcare_data'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN extendedcare_data JSONB;
        RAISE NOTICE '✓ Added extendedcare_data column';
    ELSE
        RAISE NOTICE '✓ extendedcare_data column already exists';
    END IF;
END $$;

-- Add eligibility_status column (OPTIONAL)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals' 
        AND column_name = 'eligibility_status'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN eligibility_status JSONB;
        RAISE NOTICE '✓ Added eligibility_status column';
    ELSE
        RAISE NOTICE '✓ eligibility_status column already exists';
    END IF;
END $$;

-- Add insurance_monitoring column (OPTIONAL)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'referrals' 
        AND column_name = 'insurance_monitoring'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN insurance_monitoring JSONB;
        RAISE NOTICE '✓ Added insurance_monitoring column';
    ELSE
        RAISE NOTICE '✓ insurance_monitoring column already exists';
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.referrals.patient_name IS 'Full name of the patient';
COMMENT ON COLUMN public.referrals.referral_date IS 'Date when the referral was made';
COMMENT ON COLUMN public.referrals.referral_source IS 'Source of the referral (Manual Entry, ExtendedCare, etc.)';
COMMENT ON COLUMN public.referrals.diagnosis IS 'Primary diagnosis or reason for referral';
COMMENT ON COLUMN public.referrals.insurance_provider IS 'Name of insurance company';
COMMENT ON COLUMN public.referrals.insurance_id IS 'Patient insurance ID number';
COMMENT ON COLUMN public.referrals.status IS 'Current status: New, Pending Auth, Approved, Denied';
COMMENT ON COLUMN public.referrals.ai_recommendation IS 'AI-powered recommendation: Approve, Deny, or Review';
COMMENT ON COLUMN public.referrals.ai_reason IS 'AI-powered reasoning and explanation for the recommendation';
COMMENT ON COLUMN public.referrals.soc_due_date IS 'Start of Care due date';
COMMENT ON COLUMN public.referrals.extendedcare_data IS 'JSONB field storing ExtendedCare network specific information';
COMMENT ON COLUMN public.referrals.eligibility_status IS 'JSONB field storing eligibility check results and history';
COMMENT ON COLUMN public.referrals.insurance_monitoring IS 'JSONB field storing insurance monitoring status and history';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_patient_name ON public.referrals(patient_name);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_date ON public.referrals(referral_date);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_source ON public.referrals(referral_source);
CREATE INDEX IF NOT EXISTS idx_referrals_insurance_provider ON public.referrals(insurance_provider);

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_referrals_extendedcare_data ON public.referrals USING GIN(extendedcare_data);
CREATE INDEX IF NOT EXISTS idx_referrals_eligibility_status ON public.referrals USING GIN(eligibility_status);
CREATE INDEX IF NOT EXISTS idx_referrals_insurance_monitoring ON public.referrals USING GIN(insurance_monitoring);

COMMIT;

-- Display the complete schema
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('patient_name', 'referral_date', 'referral_source', 'diagnosis', 'insurance_provider', 'insurance_id', 'status') 
        THEN 'REQUIRED' 
        ELSE 'OPTIONAL' 
    END as field_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'referrals'
ORDER BY 
    CASE 
        WHEN column_name IN ('id') THEN 1
        WHEN column_name IN ('patient_name', 'referral_date', 'referral_source', 'diagnosis', 'insurance_provider', 'insurance_id', 'status') THEN 2
        ELSE 3
    END,
    ordinal_position;

