# ✅ FINAL FIX: Using Staff ID Instead of Name

## Problem Identified
You were right! The system was saving staff **NAME** (text string) instead of staff **ID** (UUID). This is bad database design and causes filtering issues.

## What Was Fixed

### 1. Database Schema (Run SQL First!)
File: `scripts/069-fix-assigned-staff-use-id-not-name.sql`

**Adds proper foreign key columns:**
- `referrals_new.assigned_staff_id` → UUID references staff(id)
- `authorizations.assigned_staff_id` → UUID references staff(id)

### 2. Referral Management Code
File: `app/referral-management/page.tsx`

**Changed `getAvailableStaff()` function:**
```typescript
// Before: Returns string
async function getAvailableStaff(): Promise<string | null>
// Returns: "John Doe, RN"

// After: Returns object with ID
async function getAvailableStaff(): Promise<{ id: string; name: string; displayName: string } | null>
// Returns: { id: "uuid-here", name: "John Doe", displayName: "John Doe, RN" }
```

**Updated `handleRequestAuth()`:**
```typescript
// Now saves both:
assignedTo: assignedStaff.displayName,     // For UI display (legacy)
assignedStaffId: assignedStaff.id,         // For database filtering (NEW!)
```

**Updated `handleApprove()`:**
```typescript
// Preserves staff ID when approving:
assignedStaffId: authorization.assigned_staff_id
```

### 3. API Endpoints Updated

**`/api/authorizations` (POST):**
```typescript
// Now accepts and saves both:
assigned_to: assignedTo || null,           // Display name
assigned_staff_id: assignedStaffId || null // Staff UUID
```

**`/api/referrals/[id]` (PATCH):**
```typescript
// Now handles staff ID:
if (body.assignedStaffId !== undefined) 
  updateData.assigned_staff_id = body.assignedStaffId
```

**`/api/referrals` (GET):**
```typescript
// Now filters by staff ID:
if (assignedTo) {
  // Lookup staff by name to get ID
  const staff = await supabase
    .from("staff")
    .select("id")
    .ilike("name", `%${assignedTo}%`)
    .single()
  
  // Filter by ID
  query = query.eq("assigned_staff_id", staff.id)
}
```

### 4. Staff Dashboard
File: `app/staff-dashboard/page.tsx` (No changes needed!)

Already uses `selectedStaff?.name` which gets matched to staff ID via API.

## How It Works Now

### Complete Flow:

```
1. REFERRAL MANAGEMENT
   User clicks "Request Prior Auth"
   ↓
   getAvailableStaff(priority)
   ↓
   Queries database: SELECT * FROM staff WHERE ...
   Returns: {
     id: "123e4567-e89b-12d3-a456-426614174000",
     name: "John Doe",
     displayName: "John Doe, RN"
   }
   ↓
   Creates Authorization:
   - assigned_to: "John Doe, RN" (for display)
   - assigned_staff_id: "123e4567..." (for filtering)
   ↓
   Updates Referral:
   - assigned_staff_id: "123e4567..."
   ↓
   DATABASE SAVES:
   referrals_new.assigned_staff_id = "123e4567..."
   authorizations.assigned_staff_id = "123e4567..."

2. STAFF DASHBOARD (John Doe logs in)
   Goes to "Patient Onboarding" tab
   ↓
   API Call: /api/referrals?status=Approved&assignedTo=John Doe
   ↓
   API Logic:
   - Lookup: SELECT id FROM staff WHERE name ILIKE '%John Doe%'
   - Gets: "123e4567..."
   - Query: SELECT * FROM referrals_new 
            WHERE assigned_staff_id = '123e4567...'
   ↓
   Returns: Angelo's referral ✅
   ↓
   DISPLAYS: Angelo in onboarding list!
```

## Steps to Apply Fix

### Step 1: Run SQL Migration

Open Supabase SQL Editor and run:

```sql
-- File: scripts/069-fix-assigned-staff-use-id-not-name.sql

-- Add staff ID columns
ALTER TABLE public.referrals_new
ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;

ALTER TABLE public.authorizations
ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referrals_new_assigned_staff_id 
ON public.referrals_new(assigned_staff_id);

CREATE INDEX IF NOT EXISTS idx_authorizations_assigned_staff_id 
ON public.authorizations(assigned_staff_id);
```

### Step 2: Verify Code Changes

All code changes are already done in:
- ✅ `app/referral-management/page.tsx`
- ✅ `app/api/referrals/route.ts`
- ✅ `app/api/referrals/[id]/route.ts`
- ✅ `app/api/authorizations/route.ts`

### Step 3: Test the Flow

1. **Go to Referral Management**
   - Find a "New" referral
   - Click "Request Prior Auth"
   - Check browser console:
     - Should see: `✅ Assigned to: John Doe, RN (ID: uuid-here)`

2. **Check Database**
   ```sql
   SELECT 
     patient_name,
     status,
     assigned_staff_id,
     (SELECT name FROM staff WHERE id = assigned_staff_id) as staff_name
   FROM referrals_new
   WHERE patient_name ILIKE '%Angelo%';
   ```
   - Should see Angelo with `assigned_staff_id` = UUID

3. **Check Authorization**
   ```sql
   SELECT 
     patient_name,
     assigned_to,
     assigned_staff_id,
     (SELECT name FROM staff WHERE id = assigned_staff_id) as staff_name
   FROM authorizations
   WHERE patient_name ILIKE '%Angelo%';
   ```
   - Should see both `assigned_to` (display) and `assigned_staff_id` (UUID)

4. **Login to Staff Dashboard as John Doe**
   - Go to "Patient Onboarding" tab
   - Should see Angelo! ✅

5. **Login to Staff Dashboard as Different Staff**
   - Go to "Patient Onboarding" tab  
   - Should NOT see Angelo ✅

## Benefits of This Approach

### ✅ Proper Database Design
- Foreign key relationships
- Data integrity enforced
- Can use JOIN queries

### ✅ Reliable Filtering
- No typos or name variations
- Exact UUID matching
- Fast indexed lookups

### ✅ Flexible Queries
```sql
-- Can join with staff table to get details
SELECT r.*, s.name, s.email, s.department
FROM referrals_new r
JOIN staff s ON r.assigned_staff_id = s.id
WHERE r.status = 'Approved';
```

### ✅ Easy to Update
```sql
-- If staff name changes, no problem!
UPDATE staff SET name = 'Johnathan Doe' WHERE id = '123e4567...';
-- All referrals still linked by ID
```

## Verification Checklist

After running SQL and testing:

- [ ] `assigned_staff_id` column exists in `referrals_new`
- [ ] `assigned_staff_id` column exists in `authorizations`
- [ ] Indexes created for both columns
- [ ] Foreign key relationships working
- [ ] New referrals save staff ID correctly
- [ ] Console shows "Assigned to: Name (ID: uuid)"
- [ ] Database shows UUID in `assigned_staff_id`
- [ ] Onboarding tab filters by staff ID
- [ ] Each staff sees only their patients
- [ ] No errors in browser console

## Common Issues & Solutions

### Issue: "Column assigned_staff_id does not exist"
**Solution:** Run the SQL migration first!

### Issue: "Null value in assigned_staff_id"
**Check:**
1. Did you create a NEW referral after running SQL?
2. Old referrals need backfill (see next section)

### Issue: Still showing wrong staff's patients
**Check:**
1. Browser console - which staff is logged in?
2. Database - what's the assigned_staff_id value?
3. Staff table - does the logged-in staff exist with correct ID?

## Backfill Old Data (Optional)

If you have existing referrals that need staff IDs:

```sql
-- Match staff names to IDs and update referrals
UPDATE public.referrals_new r
SET assigned_staff_id = s.id
FROM public.staff s
WHERE r.assigned_staff IS NOT NULL
  AND s.name ILIKE '%' || SPLIT_PART(r.assigned_staff, ',', 1) || '%'
  AND r.assigned_staff_id IS NULL;

-- Same for authorizations
UPDATE public.authorizations a
SET assigned_staff_id = s.id
FROM public.staff s
WHERE a.assigned_to IS NOT NULL
  AND s.name ILIKE '%' || SPLIT_PART(a.assigned_to, ',', 1) || '%'
  AND a.assigned_staff_id IS NULL;
```

## Summary

**Before:** Saved staff name as text → Hard to filter, error-prone
**After:** Saves staff ID as UUID → Clean, reliable, proper database design

**Result:** Onboarding tab now shows only referrals assigned to the logged-in staff member! 🎉



