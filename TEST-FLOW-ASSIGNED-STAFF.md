# Test Flow: Assigned Staff from Database

## ✅ HOW IT WORKS NOW

### 1️⃣ REFERRAL MANAGEMENT - Request Prior Auth

When you click **"Request Prior Auth"** for a referral:

```javascript
// Line 645: Get REAL staff from database
const assignedStaff = await getAvailableStaff(priority)
// Returns: "John Doe, RN" (from your staff table in database)

// Line 654-671: Create authorization
await fetch("/api/authorizations", {
  body: JSON.stringify({
    assignedTo: assignedStaff,  // "John Doe, RN"
    ...
  })
})

// Line 680-687: Save assigned staff to referral
await fetch(`/api/referrals/${id}`, {
  body: JSON.stringify({ 
    status: "Pending Auth",
    assignedStaff: assignedStaff  // "John Doe, RN" saved to referral!
  })
})
```

**What `getAvailableStaff()` does:**
- ✅ Fetches real staff from database via `/api/staff/list`
- ✅ Filters for active staff only
- ✅ Filters for eligible staff (RN, BSN, MSN, nurses)
- ✅ For urgent/high priority → assigns senior staff
- ✅ Uses round-robin distribution
- ✅ Returns: `"John Doe, RN"` (real staff name + credentials)

### 2️⃣ STAFF DASHBOARD - Onboarding Tab

When **John Doe** logs in and goes to Onboarding tab:

```javascript
// Line 806: Get current logged-in staff name
const currentStaffName = selectedStaff?.name  // "John Doe"

// Line 814-815: Fetch only referrals assigned to this staff
const assignedToQuery = `&assignedTo=${encodeURIComponent(currentStaffName)}`
await fetch(`/api/referrals?status=Approved&needsPatient=true${assignedToQuery}`)

// API filters by:
query.ilike("assigned_staff", `%${assignedTo}%`)
// SQL: WHERE assigned_staff ILIKE '%John Doe%'
```

**Result:** John Doe sees only referrals where `assigned_staff` contains "John Doe"!

### 3️⃣ API FILTERING

The API endpoint (`/api/referrals`) filters correctly:

```javascript
// Line 28-31 in app/api/referrals/route.ts
if (assignedTo) {
  query = query.ilike("assigned_staff", `%${assignedTo}%`)
}
```

## 🎯 COMPLETE FLOW EXAMPLE

### Scenario: New referral for Angelo

1. **Referral Management Page:**
   - You see Angelo's referral (Status: "New")
   - Click **"Request Prior Auth"**
   
2. **System Auto-Assigns:**
   ```
   🔍 Fetched 5 staff members from database
   ✅ 4 active staff members found
   🎯 3 eligible staff members (RNs)
   ✅ Assigned to: John Doe, RN
   ```

3. **Database Saves:**
   ```sql
   -- Authorization table
   INSERT INTO authorizations (assigned_to, ...)
   VALUES ('John Doe, RN', ...);
   
   -- Referrals table (NEW!)
   UPDATE referrals_new 
   SET assigned_staff = 'John Doe, RN', 
       status = 'Pending Auth'
   WHERE id = 'angelo-referral-id';
   ```

4. **Authorization Approved:**
   - Authorization status changes to "Approved"
   - Click **"Approve Referral & Create Patient"**
   - `assigned_staff` is preserved → still "John Doe, RN"

5. **John Doe Logs In:**
   - Goes to Staff Dashboard
   - Clicks "Onboarding" tab
   - Query: `SELECT * FROM referrals_new WHERE status='Approved' AND patient_id IS NULL AND assigned_staff ILIKE '%John Doe%'`
   - **Sees Angelo in his list!** ✅

6. **Sarah Johnson Logs In:**
   - Goes to Staff Dashboard
   - Clicks "Onboarding" tab
   - Query: `SELECT * FROM referrals_new WHERE status='Approved' AND patient_id IS NULL AND assigned_staff ILIKE '%Sarah Johnson%'`
   - **Does NOT see Angelo** (not assigned to her) ✅

## 🔧 WHAT YOU NEED TO DO

### ONLY ONE STEP: Run the SQL migration

```sql
-- This adds the column to store assigned staff
ALTER TABLE public.referrals_new
ADD COLUMN IF NOT EXISTS assigned_staff TEXT;

-- This backfills existing referrals with their assigned staff
UPDATE public.referrals_new r
SET assigned_staff = a.assigned_to
FROM public.authorizations a
WHERE r.id = a.referral_id
  AND r.assigned_staff IS NULL
  AND a.assigned_to IS NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_referrals_new_assigned_staff 
ON public.referrals_new(assigned_staff);
```

**That's it!** Ang code sakto na - gi-fetch na gikan sa real database ang staff, gi-save na sa referral, ug gi-filter na sa onboarding tab. Kulang lang ang database column!

## 📋 VERIFICATION CHECKLIST

After running the SQL:

- [ ] Check `referrals_new` table - should have `assigned_staff` column
- [ ] Existing referrals with authorizations should be backfilled
- [ ] Go to Referral Management → Request Prior Auth → check console logs
- [ ] Should see: "✅ Assigned to: [Real Staff Name], RN"
- [ ] Go to Staff Dashboard → Onboarding tab
- [ ] Should see only referrals assigned to logged-in staff
- [ ] Log in as different staff → should see different referrals

## 🎉 EXPECTED BEHAVIOR

**Before Migration:** 
- ❌ Column doesn't exist
- ❌ Assigned staff not saved
- ❌ Onboarding tab shows nothing or everyone

**After Migration:**
- ✅ Column exists
- ✅ Assigned staff saved from real database
- ✅ Each staff sees only their assigned patients
- ✅ Proper filtering by staff name



