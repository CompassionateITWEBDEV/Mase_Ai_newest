# 🔍 Debug Guide: Why Onboarding Tab is Empty

## Current Situation

**Referral Management:**
- ✅ Angelo's referral assigned to: **"John Doe, RN"**
- ✅ Status: Pending (shown in Authorization Tracking)

**Staff Dashboard (John Doe logged in):**
- ❌ **"No pending onboarding patients"**
- ❌ **Angelo is NOT showing up**

## Why This Happens

### The Missing Link: `assigned_staff` Column

The code tries to:
```javascript
// Line 199 in staff-dashboard/page.tsx
assignedNurse: referral.assigned_staff || "Unassigned"
```

But the database column **doesn't exist yet**! So:
- `referral.assigned_staff` = `undefined`
- Shows as: **"Unassigned"**

### The Filter That Fails

```javascript
// Line 814 in staff-dashboard/page.tsx
const assignedToQuery = `&assignedTo=${encodeURIComponent(currentStaffName)}`
// Query: /api/referrals?status=Approved&needsPatient=true&assignedTo=John%20Doe

// Line 30 in app/api/referrals/route.ts
query = query.ilike("assigned_staff", `%${assignedTo}%`)
// SQL: WHERE assigned_staff ILIKE '%John Doe%'
```

**BUT:**
- Column `assigned_staff` doesn't exist
- Query returns empty result
- Onboarding tab shows: "No pending onboarding patients"

## The Fix

### ✅ RUN THIS SQL NOW:

Open **Supabase SQL Editor** and paste:

```sql
-- Add the column
ALTER TABLE public.referrals_new
ADD COLUMN IF NOT EXISTS assigned_staff TEXT;

-- Backfill from existing authorizations
UPDATE public.referrals_new r
SET assigned_staff = a.assigned_to
FROM public.authorizations a
WHERE r.id = a.referral_id
  AND r.assigned_staff IS NULL
  AND a.assigned_to IS NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_referrals_new_assigned_staff 
ON public.referrals_new(assigned_staff);

-- Verify it worked
SELECT patient_name, status, assigned_staff 
FROM public.referrals_new 
WHERE assigned_staff IS NOT NULL;
```

### After Running SQL:

1. **Refresh Supabase Dashboard**
   - Check `referrals_new` table
   - Look for `assigned_staff` column
   - Angelo's referral should show: `assigned_staff = "John Doe, RN"`

2. **Check in App:**
   - Go to Referral Management (refresh page)
   - Angelo should still show "Assigned To: John Doe, RN"

3. **Test Staff Dashboard:**
   - Log in as John Doe
   - Go to "Patient Onboarding" tab
   - **Angelo should appear!** ✅

## Matching Logic Explained

The matching uses PostgreSQL `ILIKE` (case-insensitive):

```sql
-- Saved in database:
assigned_staff = 'John Doe, RN'

-- Query from staff dashboard:
WHERE assigned_staff ILIKE '%John Doe%'

-- Result: ✅ MATCH!
-- Because 'John Doe, RN' contains 'John Doe'
```

This means:
- Staff name: `"John Doe"` → matches `"John Doe, RN"` ✅
- Staff name: `"Sarah Johnson"` → doesn't match `"John Doe, RN"` ❌

## Expected Flow After Fix

```
1. Referral Management
   - Angelo assigned to: "John Doe, RN"
   - Saved to: referrals_new.assigned_staff ✅

2. Database
   - Query: SELECT * FROM referrals_new 
            WHERE assigned_staff = 'John Doe, RN'
   - Result: Angelo's referral found ✅

3. Staff Dashboard (John Doe)
   - Query: WHERE assigned_staff ILIKE '%John Doe%'
   - Result: Angelo's referral matched ✅
   - Display: Shows Angelo in onboarding tab ✅

4. Staff Dashboard (Sarah Johnson)
   - Query: WHERE assigned_staff ILIKE '%Sarah Johnson%'
   - Result: No match (Angelo assigned to John)
   - Display: "No pending onboarding patients" ✅
```

## Verification Checklist

After running the SQL migration:

- [ ] Column exists in database
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'referrals_new' 
  AND column_name = 'assigned_staff';
  ```

- [ ] Angelo's referral has assigned_staff
  ```sql
  SELECT patient_name, assigned_staff, status
  FROM referrals_new
  WHERE patient_name ILIKE '%Angelo%';
  ```

- [ ] Query works manually
  ```sql
  SELECT patient_name, assigned_staff
  FROM referrals_new
  WHERE status = 'Approved'
  AND patient_id IS NULL
  AND assigned_staff ILIKE '%John Doe%';
  ```

- [ ] App shows data
  - Open browser console (F12)
  - Go to Staff Dashboard > Patient Onboarding
  - Look for console logs:
    - `✅ Fetched X referrals assigned to John Doe`
  - Should see Angelo in the list

## Common Issues

### Issue 1: "Column already exists" error
**Solution:** Column was already added. Just run the UPDATE statement.

### Issue 2: Still shows "No pending onboarding patients"
**Check:**
1. Is the referral status "Approved"? (Should be from Authorization Tracking)
2. Is patient_id NULL? (Should be - no patient created yet)
3. Is assigned_staff set? Run: `SELECT assigned_staff FROM referrals_new WHERE patient_name ILIKE '%Angelo%';`

### Issue 3: Wrong staff sees the patient
**Check:**
- Who is logged in? Check browser console.
- What is selectedStaff?.name? Should match the assigned staff.

## Success Indicators

When everything works:

✅ **Database:** Column exists with data
✅ **Console Logs:** Shows "Fetched X referrals assigned to John Doe"
✅ **UI:** Angelo appears in John Doe's onboarding tab
✅ **UI:** Angelo does NOT appear in Sarah Johnson's onboarding tab
✅ **Filtering:** Each staff sees only their assigned patients



