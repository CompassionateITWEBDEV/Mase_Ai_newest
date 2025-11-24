-- ============================================================
-- PROPER FIX: Use staff_id (UUID) instead of staff name (TEXT)
-- ============================================================
-- This is the CORRECT way to handle staff assignment
-- Using foreign keys instead of text strings
-- ============================================================

-- Step 1: Add assigned_staff_id column to referrals_new (UUID foreign key)
ALTER TABLE public.referrals_new
ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;

-- Step 2: Add assigned_staff_id column to authorizations table
ALTER TABLE public.authorizations
ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;

-- Step 3: Backfill referrals_new.assigned_staff_id from authorizations
-- Match by referral_id and use the staff ID from authorization
UPDATE public.referrals_new r
SET assigned_staff_id = a.assigned_staff_id
FROM public.authorizations a
WHERE r.id = a.referral_id
  AND r.assigned_staff_id IS NULL
  AND a.assigned_staff_id IS NOT NULL;

-- Step 4: Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_referrals_new_assigned_staff_id 
ON public.referrals_new(assigned_staff_id);

CREATE INDEX IF NOT EXISTS idx_authorizations_assigned_staff_id 
ON public.authorizations(assigned_staff_id);

-- Step 5: Add comments for documentation
COMMENT ON COLUMN public.referrals_new.assigned_staff_id IS 
'Foreign key to staff table - ID of staff member assigned to process this referral';

COMMENT ON COLUMN public.authorizations.assigned_staff_id IS 
'Foreign key to staff table - ID of staff member assigned to handle this authorization';

-- Step 6: Create a view for easy querying with staff names
CREATE OR REPLACE VIEW public.referrals_with_assigned_staff AS
SELECT 
  r.*,
  s.id as staff_id,
  s.name as staff_name,
  s.email as staff_email,
  s.department as staff_department,
  s.credentials as staff_credentials,
  CONCAT(s.name, CASE WHEN s.credentials IS NOT NULL THEN ', ' || s.credentials ELSE '' END) as staff_display_name
FROM public.referrals_new r
LEFT JOIN public.staff s ON r.assigned_staff_id = s.id;

COMMENT ON VIEW public.referrals_with_assigned_staff IS 
'View that joins referrals with assigned staff information for easy querying';

-- Step 7: Verification - Show referrals with their assigned staff
SELECT 
  '✅ REFERRALS WITH ASSIGNED STAFF' as report,
  r.patient_name,
  r.status,
  s.name as assigned_staff_name,
  s.credentials as staff_credentials,
  r.assigned_staff_id as staff_id
FROM public.referrals_new r
LEFT JOIN public.staff s ON r.assigned_staff_id = s.id
WHERE r.assigned_staff_id IS NOT NULL
ORDER BY r.referral_date DESC
LIMIT 10;

-- Step 8: Show summary
SELECT 
  '📊 SUMMARY' as report,
  COUNT(*) as total_referrals,
  COUNT(assigned_staff_id) as with_assigned_staff_id,
  COUNT(*) - COUNT(assigned_staff_id) as without_assigned_staff_id
FROM public.referrals_new;






