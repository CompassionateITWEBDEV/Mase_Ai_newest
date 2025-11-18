-- ============================================================
-- BACKFILL: Set assigned_staff_id on referrals from authorizations
-- ============================================================
-- This updates existing referrals to have the assigned_staff_id
-- from their linked authorizations
-- ============================================================

-- Step 1: Update referrals with assigned_staff_id from authorizations
UPDATE public.referrals_new r
SET assigned_staff_id = a.assigned_staff_id
FROM public.authorizations a
WHERE r.id = a.referral_id
  AND a.assigned_staff_id IS NOT NULL
  AND (r.assigned_staff_id IS NULL OR r.assigned_staff_id != a.assigned_staff_id);

-- Step 2: Show results
SELECT 
  '✅ BACKFILL COMPLETE' as status,
  COUNT(*) as total_referrals,
  COUNT(assigned_staff_id) as with_assigned_staff,
  COUNT(*) - COUNT(assigned_staff_id) as without_assigned_staff
FROM public.referrals_new;

-- Step 3: Show sample referrals with their assigned staff
SELECT 
  '📋 SAMPLE REFERRALS' as report,
  r.id,
  r.patient_name,
  r.status,
  r.assigned_staff_id,
  s.name as staff_name,
  s.credentials as staff_credentials
FROM public.referrals_new r
LEFT JOIN public.staff s ON r.assigned_staff_id = s.id
WHERE r.assigned_staff_id IS NOT NULL
ORDER BY r.created_at DESC
LIMIT 10;

-- Step 4: Check if there are referrals without assigned_staff_id
SELECT 
  '⚠️ REFERRALS WITHOUT STAFF' as warning,
  r.id,
  r.patient_name,
  r.status,
  a.assigned_to as auth_assigned_to,
  a.assigned_staff_id as auth_staff_id
FROM public.referrals_new r
LEFT JOIN public.authorizations a ON r.id = a.referral_id
WHERE r.assigned_staff_id IS NULL
  AND r.status IN ('Pending Auth', 'Approved')
ORDER BY r.created_at DESC
LIMIT 10;



