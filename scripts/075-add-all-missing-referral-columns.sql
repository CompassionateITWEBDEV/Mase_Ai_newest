-- Comprehensive Migration: Add all missing columns to referrals table
-- This script safely adds all columns that might be missing from the referrals table

BEGIN;

-- Add diagnosis column if missing
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

-- Add ai_reason column if missing
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

-- Add ai_recommendation column if missing
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

-- Add soc_due_date column if missing
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

-- Add extendedcare_data column if missing
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

-- Add eligibility_status column if missing
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

-- Add insurance_monitoring column if missing
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

-- Add comments
COMMENT ON COLUMN public.referrals.diagnosis IS 'Primary diagnosis or reason for referral';
COMMENT ON COLUMN public.referrals.ai_recommendation IS 'AI-powered recommendation: Approve, Deny, or Review';
COMMENT ON COLUMN public.referrals.ai_reason IS 'AI-powered reasoning and explanation for the recommendation';
COMMENT ON COLUMN public.referrals.soc_due_date IS 'Start of Care due date';
COMMENT ON COLUMN public.referrals.extendedcare_data IS 'JSONB field storing ExtendedCare network specific information';
COMMENT ON COLUMN public.referrals.eligibility_status IS 'JSONB field storing eligibility check results and history';
COMMENT ON COLUMN public.referrals.insurance_monitoring IS 'JSONB field storing insurance monitoring status and history';

-- Create indexes for JSONB columns if they don't exist
CREATE INDEX IF NOT EXISTS idx_referrals_extendedcare_data ON public.referrals USING GIN(extendedcare_data);
CREATE INDEX IF NOT EXISTS idx_referrals_eligibility_status ON public.referrals USING GIN(eligibility_status);
CREATE INDEX IF NOT EXISTS idx_referrals_insurance_monitoring ON public.referrals USING GIN(insurance_monitoring);

COMMIT;

-- Display current schema
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'referrals'
ORDER BY ordinal_position;

