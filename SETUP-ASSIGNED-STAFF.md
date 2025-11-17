# Setup Guide: Assigned Staff for Onboarding Tab

## What This Fixes
When you assign a staff member to a referral in **Referral Management**, that staff member will now see that referral in their **Staff Dashboard > Onboarding Tab**.

## Step 1: Run the Database Migration

Go to your **Supabase SQL Editor** and run this script:

```sql
-- File: scripts/067-add-assigned-staff-to-referrals-with-backfill.sql

-- Step 1: Add assigned_staff column to referrals_new table
ALTER TABLE public.referrals_new
ADD COLUMN IF NOT EXISTS assigned_staff TEXT;

-- Step 2: Backfill existing referrals with assigned staff from their authorizations
UPDATE public.referrals_new r
SET assigned_staff = a.assigned_to
FROM public.authorizations a
WHERE r.id = a.referral_id
  AND r.assigned_staff IS NULL
  AND a.assigned_to IS NOT NULL;

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_referrals_new_assigned_staff ON public.referrals_new(assigned_staff);

-- Step 4: Add comment for documentation
COMMENT ON COLUMN public.referrals_new.assigned_staff IS 'Name of staff member assigned to process this referral (from authorization assignment)';

-- Step 5: Show summary
SELECT 
  COUNT(*) as total_referrals,
  COUNT(assigned_staff) as referrals_with_assigned_staff,
  COUNT(*) - COUNT(assigned_staff) as referrals_without_assigned_staff
FROM public.referrals_new;
```

## Step 2: How It Works Now

### In Referral Management:

1. **When you click "Request Prior Auth":**
   - System automatically assigns a staff member (e.g., "John Doe, RN")
   - Saves to both:
     - `authorizations.assigned_to` = "John Doe, RN"
     - `referrals_new.assigned_staff` = "John Doe, RN"

2. **When authorization is approved and you click "Approve Referral":**
   - The assigned staff is preserved in the referral
   - Patient is created with this assignment

### In Staff Dashboard:

1. **When John Doe logs in:**
   - Goes to "Onboarding" tab
   - Sees ONLY referrals where `assigned_staff` = "John Doe, RN"

2. **Other staff members:**
   - Each staff member sees only their own assigned patients
   - No more seeing everyone's patients!

## Step 3: Test It

1. Go to **Referral Management**
2. Find a "New" referral
3. Click **"Request Prior Auth"**
   - ✅ Note the assigned staff name (e.g., "John Doe, RN")
4. When authorization is approved, click **"Approve Referral"**
5. Log in to **Staff Dashboard** as that staff member
6. Go to **Onboarding tab**
   - ✅ You should see that patient!

## What Was Fixed

### Before:
- ❌ Staff assignment was only in authorization table
- ❌ Onboarding tab showed ALL patients or NO patients
- ❌ No way to filter by assigned staff

### After:
- ✅ Staff assignment saved in referral table
- ✅ Onboarding tab filters by assigned staff
- ✅ Each staff sees only their patients
- ✅ Existing data backfilled automatically

## Files Changed

1. `app/referral-management/page.tsx`
   - Added `assignedStaff` to referral updates
   - Preserves assignment when approving

2. `app/api/referrals/[id]/route.ts`
   - Added support for `assignedStaff` field

3. `scripts/067-add-assigned-staff-to-referrals-with-backfill.sql`
   - Database migration script
   - Backfills existing data

4. `app/staff-dashboard/page.tsx`
   - Already filters by `assigned_staff` from API


