-- Add assigned_staff column to referrals_new table
-- This enables tracking which staff member is responsible for processing each referral

-- Step 1: Add assigned_staff column to referrals_new table
ALTER TABLE public.referrals_new
ADD COLUMN IF NOT EXISTS assigned_staff TEXT;

-- Step 2: Backfill existing referrals with assigned staff from their authorizations
-- This updates referrals that already have authorizations with the assigned staff name
UPDATE public.referrals_new r
SET assigned_staff = a.assigned_to
FROM public.authorizations a
WHERE r.id = a.referral_id
  AND r.assigned_staff IS NULL
  AND a.assigned_to IS NOT NULL;

-- Step 3: Create index for better query performance on staff assignment filtering
CREATE INDEX IF NOT EXISTS idx_referrals_new_assigned_staff ON public.referrals_new(assigned_staff);

-- Step 4: Add comment for documentation
COMMENT ON COLUMN public.referrals_new.assigned_staff IS 'Name of staff member assigned to process this referral (from authorization assignment)';

-- Step 5: Show summary of what was updated
SELECT 
  COUNT(*) as total_referrals,
  COUNT(assigned_staff) as referrals_with_assigned_staff,
  COUNT(*) - COUNT(assigned_staff) as referrals_without_assigned_staff
FROM public.referrals_new;






