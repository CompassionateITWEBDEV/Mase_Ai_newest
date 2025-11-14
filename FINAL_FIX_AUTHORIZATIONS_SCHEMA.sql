-- ================================================================
-- FINAL FIX FOR AUTHORIZATIONS TABLE SCHEMA ERROR
-- This fixes the "last_updated column not found" error
-- ================================================================
-- Run this ENTIRE script in Supabase SQL Editor
-- ================================================================

BEGIN;

-- ================================================================
-- STEP 1: Drop and recreate the table with correct schema
-- ================================================================

-- Drop the old table completely (this ensures a clean slate)
DROP TABLE IF EXISTS public.authorizations CASCADE;

-- Create the table with the CORRECT schema (using updated_at, NOT last_updated)
CREATE TABLE public.authorizations (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Patient information
  patient_name TEXT NOT NULL,
  patient_id TEXT,
  
  -- Insurance information
  insurance_provider TEXT NOT NULL,
  insurance_id TEXT NOT NULL,
  
  -- Authorization details
  authorization_type TEXT NOT NULL DEFAULT 'initial',
  authorization_number TEXT,
  
  -- Services
  requested_services TEXT[] NOT NULL DEFAULT '{}',
  approved_services TEXT[] DEFAULT '{}',
  approved_visits INTEGER,
  
  -- Diagnosis
  diagnosis_code TEXT,
  diagnosis TEXT NOT NULL,
  
  -- Status and priority
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  
  -- Dates
  submitted_date DATE NOT NULL DEFAULT CURRENT_DATE,
  response_date DATE,
  expiration_date DATE,
  
  -- Financial
  estimated_reimbursement DECIMAL(10, 2) DEFAULT 0,
  actual_reimbursement DECIMAL(10, 2),
  
  -- Assignment
  assigned_to TEXT,
  assigned_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  
  -- Notes and reasons
  denial_reason TEXT,
  reviewer_notes TEXT,
  
  -- Timeline tracking (JSON array)
  timeline JSONB DEFAULT '[]'::jsonb,
  
  -- Referral linkage
  referral_id UUID REFERENCES public.referrals(id) ON DELETE CASCADE,
  
  -- ⚠️ IMPORTANT: Only these two timestamp columns (NO last_updated!)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- STEP 2: Create indexes for performance
-- ================================================================

CREATE INDEX idx_authorizations_status 
ON public.authorizations(status);

CREATE INDEX idx_authorizations_patient_name 
ON public.authorizations(patient_name);

CREATE INDEX idx_authorizations_priority 
ON public.authorizations(priority);

CREATE INDEX idx_authorizations_assigned_staff_id 
ON public.authorizations(assigned_staff_id);

CREATE INDEX idx_authorizations_referral_id 
ON public.authorizations(referral_id);

CREATE INDEX idx_authorizations_submitted_date 
ON public.authorizations(submitted_date DESC);

CREATE INDEX idx_authorizations_expiration_date 
ON public.authorizations(expiration_date) 
WHERE expiration_date IS NOT NULL;

-- ================================================================
-- STEP 3: Create/Update trigger for updated_at column
-- ================================================================

-- Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
DROP TRIGGER IF EXISTS update_authorizations_updated_at ON public.authorizations;
CREATE TRIGGER update_authorizations_updated_at
    BEFORE UPDATE ON public.authorizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- STEP 4: Add table and column comments
-- ================================================================

COMMENT ON TABLE public.authorizations IS 'Tracks authorization requests and their status for insurance approvals';
COMMENT ON COLUMN public.authorizations.authorization_type IS 'Type of authorization: initial, recertification, or additional_services';
COMMENT ON COLUMN public.authorizations.status IS 'Current status: pending, approved, denied, expired, or in_review';
COMMENT ON COLUMN public.authorizations.priority IS 'Priority level: low, medium, high, or urgent';
COMMENT ON COLUMN public.authorizations.timeline IS 'JSON array of timeline events tracking authorization history';
COMMENT ON COLUMN public.authorizations.created_at IS 'Timestamp when the authorization was created';
COMMENT ON COLUMN public.authorizations.updated_at IS 'Timestamp when the authorization was last updated (auto-updated by trigger)';

COMMIT;

-- ================================================================
-- STEP 5: Reload Supabase schema cache (CRITICAL!)
-- ================================================================
-- This is what fixes the "last_updated column not found" error
NOTIFY pgrst, 'reload schema';

-- ================================================================
-- STEP 6: Verify the fix
-- ================================================================

-- Check the table structure
SELECT 
    '✅ Table structure verification:' as status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'authorizations'
ORDER BY ordinal_position;

-- Verify that last_updated does NOT exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'authorizations' 
        AND column_name = 'last_updated'
    ) THEN
        RAISE EXCEPTION '❌ ERROR: last_updated column still exists!';
    ELSE
        RAISE NOTICE '✅ SUCCESS: last_updated column does not exist';
    END IF;
END $$;

-- Verify that updated_at DOES exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'authorizations' 
        AND column_name = 'updated_at'
    ) THEN
        RAISE NOTICE '✅ SUCCESS: updated_at column exists';
    ELSE
        RAISE EXCEPTION '❌ ERROR: updated_at column does not exist!';
    END IF;
END $$;

-- ================================================================
-- ✅ DONE! 
-- ================================================================
-- After running this script:
-- 1. The authorizations table has been recreated with the correct schema
-- 2. The schema cache has been reloaded
-- 3. The "last_updated column not found" error should be resolved
-- 
-- Next steps:
-- 1. Refresh your application
-- 2. Try fetching authorizations again
-- 3. If you still see the error, restart your Next.js dev server
-- ================================================================

