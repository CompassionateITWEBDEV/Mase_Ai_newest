-- ⚡ RUN THIS NOW - FINAL FIX FOR ALL MISSING COLUMNS
-- Copy and paste this ENTIRE script into Supabase SQL Editor and click RUN

BEGIN;

-- Add ALL required columns with defaults (INCLUDING clinical_summary!)
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS patient_name TEXT NOT NULL DEFAULT 'Unknown';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referral_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referral_source TEXT NOT NULL DEFAULT 'Manual Entry';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referral_type TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS clinical_summary TEXT NOT NULL DEFAULT 'Pending clinical review';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS diagnosis TEXT NOT NULL DEFAULT 'Not specified';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS insurance_provider TEXT NOT NULL DEFAULT 'Not provided';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS insurance_id TEXT NOT NULL DEFAULT 'Not provided';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'New';

-- Add referral_number with smart handling
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals' AND column_name = 'referral_number'
    ) THEN
        ALTER TABLE public.referrals ADD COLUMN referral_number TEXT;
        UPDATE public.referrals SET referral_number = 'REF-' || id::TEXT WHERE referral_number IS NULL;
        ALTER TABLE public.referrals ALTER COLUMN referral_number SET NOT NULL;
    ELSE
        UPDATE public.referrals SET referral_number = 'REF-' || id::TEXT WHERE referral_number IS NULL;
    END IF;
END $$;

-- Add optional columns for advanced features
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS ai_reason TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS ai_recommendation TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS soc_due_date DATE;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS extendedcare_data JSONB;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS eligibility_status JSONB;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS insurance_monitoring JSONB;

-- Add timestamp columns if they don't exist
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_referrals_updated_at ON public.referrals;
CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON public.referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_patient_name ON public.referrals(patient_name);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_date ON public.referrals(referral_date);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_number ON public.referrals(referral_number);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_type ON public.referrals(referral_type);

COMMIT;

-- Verify all columns exist
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'referrals' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

