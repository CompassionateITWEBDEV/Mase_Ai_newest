-- Add assigned_staff column to referrals_new table
-- This enables tracking which staff member is responsible for processing each referral

-- Step 1: Add assigned_staff column to referrals_new table
ALTER TABLE public.referrals_new
ADD COLUMN IF NOT EXISTS assigned_staff TEXT;

-- Step 2: Create index for better query performance on staff assignment filtering
CREATE INDEX IF NOT EXISTS idx_referrals_new_assigned_staff ON public.referrals_new(assigned_staff);

-- Step 3: Add comment for documentation
COMMENT ON COLUMN public.referrals_new.assigned_staff IS 'Name of staff member assigned to process this referral (from authorization assignment)';

