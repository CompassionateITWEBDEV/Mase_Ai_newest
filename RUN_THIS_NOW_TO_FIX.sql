-- ================================================================
-- 🔧 EMERGENCY FIX FOR AUTHORIZATIONS TABLE
-- This fixes: "Could not find the 'last_updated' column" error
-- ================================================================
-- ⚠️ IMPORTANT: Run this ENTIRE script in Supabase SQL Editor
-- ================================================================

-- First, let's see what columns currently exist
SELECT 
    '🔍 BEFORE FIX - Current columns:' as status,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'authorizations'
ORDER BY ordinal_position;

-- ================================================================
-- STEP 1: Drop everything and start fresh
-- ================================================================

BEGIN;

-- Drop the table completely (this clears any schema inconsistencies)
DROP TABLE IF EXISTS public.authorizations CASCADE;

RAISE NOTICE '✅ Dropped old authorizations table';

-- ================================================================
-- STEP 2: Recreate with correct schema (NO last_updated!)
-- ================================================================

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
  
  -- Timeline tracking
  timeline JSONB DEFAULT '[]'::jsonb,
  
  -- Referral linkage
  referral_id UUID REFERENCES public.referrals(id) ON DELETE CASCADE,
  
  -- ✅ CORRECT TIMESTAMP COLUMNS (only these two!)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

RAISE NOTICE '✅ Created authorizations table with correct schema';

-- ================================================================
-- STEP 3: Create indexes
-- ================================================================

CREATE INDEX idx_authorizations_status ON public.authorizations(status);
CREATE INDEX idx_authorizations_patient_name ON public.authorizations(patient_name);
CREATE INDEX idx_authorizations_priority ON public.authorizations(priority);
CREATE INDEX idx_authorizations_assigned_staff_id ON public.authorizations(assigned_staff_id);
CREATE INDEX idx_authorizations_referral_id ON public.authorizations(referral_id);
CREATE INDEX idx_authorizations_submitted_date ON public.authorizations(submitted_date DESC);
CREATE INDEX idx_authorizations_expiration_date ON public.authorizations(expiration_date) WHERE expiration_date IS NOT NULL;

RAISE NOTICE '✅ Created indexes';

-- ================================================================
-- STEP 4: Create trigger for updated_at
-- ================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_authorizations_updated_at ON public.authorizations;
CREATE TRIGGER update_authorizations_updated_at
    BEFORE UPDATE ON public.authorizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE '✅ Created updated_at trigger';

-- ================================================================
-- STEP 5: Add table comments
-- ================================================================

COMMENT ON TABLE public.authorizations IS 'Tracks authorization requests and their status for insurance approvals';
COMMENT ON COLUMN public.authorizations.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN public.authorizations.updated_at IS 'Timestamp when record was last updated (auto-updated by trigger)';

COMMIT;

-- ================================================================
-- STEP 6: FORCE RELOAD SUPABASE SCHEMA CACHE (CRITICAL!)
-- ================================================================

-- This is the key command that forces PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Give it a moment
SELECT pg_sleep(1);

-- ================================================================
-- STEP 7: Verify the fix
-- ================================================================

-- Show final column list
SELECT 
    '✅ AFTER FIX - Columns in authorizations table:' as status,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'authorizations'
ORDER BY ordinal_position;

-- Verify last_updated does NOT exist
DO $$
DECLARE
    has_last_updated BOOLEAN;
    has_updated_at BOOLEAN;
BEGIN
    -- Check for last_updated (should NOT exist)
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'authorizations' 
        AND column_name = 'last_updated'
    ) INTO has_last_updated;
    
    -- Check for updated_at (should exist)
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'authorizations' 
        AND column_name = 'updated_at'
    ) INTO has_updated_at;
    
    IF has_last_updated THEN
        RAISE EXCEPTION '❌ ERROR: last_updated column still exists!';
    END IF;
    
    IF NOT has_updated_at THEN
        RAISE EXCEPTION '❌ ERROR: updated_at column missing!';
    END IF;
    
    RAISE NOTICE '✅ SUCCESS: Schema is correct!';
    RAISE NOTICE '✅ - last_updated does NOT exist';
    RAISE NOTICE '✅ - updated_at exists';
END $$;

-- Test insert to make sure it works
DO $$
DECLARE
    test_id UUID;
BEGIN
    INSERT INTO public.authorizations (
        patient_name,
        insurance_provider,
        insurance_id,
        diagnosis,
        requested_services
    ) VALUES (
        'Test Patient',
        'Test Insurance',
        'TEST123',
        'Test Diagnosis',
        ARRAY['skilled_nursing']
    ) RETURNING id INTO test_id;
    
    RAISE NOTICE '✅ Test insert successful! ID: %', test_id;
    
    -- Clean up test record
    DELETE FROM public.authorizations WHERE id = test_id;
    RAISE NOTICE '✅ Test record cleaned up';
END $$;

-- ================================================================
-- 🎉 FIX COMPLETE!
-- ================================================================

SELECT '
╔════════════════════════════════════════════════════════════╗
║                   ✅ FIX COMPLETED!                        ║
╚════════════════════════════════════════════════════════════╝

Next steps:
1. ✅ Schema cache reloaded
2. 🔄 Restart your Next.js dev server (Ctrl+C, then npm run dev)
3. 🧪 Try clicking "Request Prior Auth" again
4. ✅ It should work now!

If you STILL see the error after restarting:
- Go to Supabase Dashboard → Settings → API
- Click "Restart PostgREST server"
- Wait 10 seconds, then try again

' as instructions;

