-- ============================================================
-- CRITICAL FIX: Add assigned_staff column for onboarding tab
-- ============================================================
-- This fixes the issue where staff can't see their assigned patients
-- in the Staff Dashboard > Patient Onboarding tab
--
-- Run this SQL in your Supabase SQL Editor NOW!
-- ============================================================

-- Step 1: Add assigned_staff column to referrals_new table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'referrals_new' 
        AND column_name = 'assigned_staff'
    ) THEN
        ALTER TABLE public.referrals_new ADD COLUMN assigned_staff TEXT;
        RAISE NOTICE '✅ Column assigned_staff added successfully';
    ELSE
        RAISE NOTICE '⚠️ Column assigned_staff already exists';
    END IF;
END $$;

-- Step 2: Backfill existing referrals with assigned staff from authorizations
-- This updates all existing referrals that have authorizations
UPDATE public.referrals_new r
SET assigned_staff = a.assigned_to
FROM public.authorizations a
WHERE r.id = a.referral_id
  AND (r.assigned_staff IS NULL OR r.assigned_staff = '')
  AND a.assigned_to IS NOT NULL
  AND a.assigned_to != '';

-- Step 3: Show how many were updated
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM public.referrals_new
    WHERE assigned_staff IS NOT NULL AND assigned_staff != '';
    
    RAISE NOTICE '✅ Backfill complete: % referrals now have assigned_staff', updated_count;
END $$;

-- Step 4: Create index for better query performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'referrals_new' 
        AND indexname = 'idx_referrals_new_assigned_staff'
    ) THEN
        CREATE INDEX idx_referrals_new_assigned_staff ON public.referrals_new(assigned_staff);
        RAISE NOTICE '✅ Index created for better query performance';
    ELSE
        RAISE NOTICE '⚠️ Index already exists';
    END IF;
END $$;

-- Step 5: Add comment for documentation
COMMENT ON COLUMN public.referrals_new.assigned_staff IS 
'Name of staff member assigned to process this referral (from authorization assignment). Format: "FirstName LastName, Credentials" (e.g., "John Doe, RN")';

-- Step 6: Show summary report
SELECT 
  '📊 SUMMARY REPORT' as report,
  COUNT(*) as total_referrals,
  COUNT(assigned_staff) as with_assigned_staff,
  COUNT(*) - COUNT(assigned_staff) as without_assigned_staff,
  ROUND(100.0 * COUNT(assigned_staff) / NULLIF(COUNT(*), 0), 1) as percentage_assigned
FROM public.referrals_new;

-- Step 7: Show sample assigned referrals
SELECT 
  '📋 SAMPLE ASSIGNED REFERRALS' as sample,
  patient_name,
  status,
  assigned_staff,
  referral_date
FROM public.referrals_new
WHERE assigned_staff IS NOT NULL
ORDER BY referral_date DESC
LIMIT 5;

-- Step 8: Verify the fix is working
SELECT 
  '✅ VERIFICATION' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'referrals_new' 
      AND column_name = 'assigned_staff'
    ) THEN '✅ Column exists'
    ELSE '❌ Column missing'
  END as column_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE tablename = 'referrals_new' 
      AND indexname = 'idx_referrals_new_assigned_staff'
    ) THEN '✅ Index exists'
    ELSE '❌ Index missing'
  END as index_status;
