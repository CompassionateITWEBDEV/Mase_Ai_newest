# Fix Nurse and Patient Names in Consultation Dialog

## Problem

The consultation dialog shows:
- **Patient**: "Unknown Patient" ❌
- **Nurse**: "Nurse" ❌

Instead of real names from the database.

---

## Root Causes

### 1. Nurse Name Missing
**Cause**: Staff records in database don't have names populated

**Solution**: Run SQL script to populate staff names

### 2. Patient Name Missing
**Cause**: Visit records don't have patient_id or the field mapping is wrong

**Solution**: APIs updated to return proper patient data

---

## Fixes Applied

### Backend APIs Updated

1. ✅ **Created `/api/staff` endpoint**
   - Returns staff name, role, costPerMile
   - Queries `staff` table

2. ✅ **Updated `/api/visits/active`**
   - Now returns `patient_id` and `patient_name`

3. ✅ **Updated `/api/visits/start`**
   - Now returns `patient_id` and `patient_name`

### Frontend Debugging Added

Added console logs to track data flow:
- `✅ [TRACK] Staff data loaded`
- `✅ [TRACK] Active visit loaded`
- `🩺 [CONSULTATION] Opening dialog with data`

---

## Steps to Fix

### Step 1: Fix Staff Names in Database

Run this SQL script:

```sql
\i scripts/999-fix-staff-names.sql
```

Or manually:

```sql
-- Check current staff
SELECT id, name, email, role_id FROM staff;

-- Update staff without names
UPDATE staff 
SET name = split_part(email, '@', 1)
WHERE name IS NULL OR name = '';

-- Or set specific names
UPDATE staff SET name = 'John Doe' WHERE email = 'john@example.com';
UPDATE staff SET name = 'Jane Smith' WHERE email = 'jane@example.com';
```

### Step 2: Verify Staff Table Has Data

```sql
-- List all staff
SELECT * FROM staff;

-- If no staff exists, create one
INSERT INTO staff (email, name, role_id, is_active)
VALUES 
  ('nurse@example.com', 'Sarah Johnson', 'nurse', true),
  ('doctor@example.com', 'Dr. Michael Chen', 'doctor', true);
```

### Step 3: Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Refresh the track page
4. Look for these logs:

```
✅ [TRACK] Staff data loaded: { success: true, staff: { name: "Sarah Johnson" } }
✅ [TRACK] Setting staff name: Sarah Johnson
```

If you see:
```
⚠️ [TRACK] Staff data not found or incomplete
```

Then the staff record doesn't exist or the API is failing.

### Step 4: Verify Visit Data

When you start a visit, check console:

```
✅ [VISIT START] Visit started, data received: {
  id: "...",
  patient_id: "...",
  patient_name: "John Smith",
  ...
}
```

When you open the consultation dialog:

```
🩺 [CONSULTATION] Opening dialog with data: {
  currentVisit: { patient_name: "John Smith" },
  staffName: "Sarah Johnson",
  ...
}
```

---

## Troubleshooting

### Issue 1: "Nurse" Still Shows

**Cause**: Staff record doesn't exist or name is null

**Check**:
```sql
SELECT * FROM staff WHERE id = 'your-staff-id';
```

**Fix**:
```sql
UPDATE staff SET name = 'Real Name' WHERE id = 'your-staff-id';
```

### Issue 2: "Unknown Patient" Still Shows

**Cause**: Visit doesn't have patient_name

**Check console for**:
```
currentVisit: { patient_name: undefined }
```

**Fix**: When creating visit, make sure patient name is provided:
- Check the "Start Visit" form has patient name
- Check the API is saving patient_name to database

**Verify in database**:
```sql
SELECT id, patient_name, patient_address, status 
FROM staff_visits 
WHERE status = 'in_progress' 
ORDER BY start_time DESC 
LIMIT 5;
```

### Issue 3: API Returns 404

**Cause**: `/api/staff` endpoint not found

**Check**: Look for error in console:
```
❌ [TRACK] Error fetching staff data: 404
```

**Fix**: Make sure `app/api/staff/route.ts` exists (already created)

### Issue 4: Wrong Staff ID in URL

**Cause**: URL has wrong staff ID

**Check**: URL should be like:
```
/track/703afc46-3fb0-4d3b-9079-b902297d4a32
```

**Fix**: Make sure you're using the correct staff ID from the database

---

## Testing

### Test Case 1: Staff Name

1. Go to database and set a staff name:
   ```sql
   UPDATE staff SET name = 'Test Nurse' WHERE id = 'your-id';
   ```

2. Refresh track page

3. Open console, should see:
   ```
   ✅ [TRACK] Setting staff name: Test Nurse
   ```

4. Click "Request Doctor", should see:
   ```
   Nurse: Test Nurse
   ```

### Test Case 2: Patient Name

1. Start a visit with patient name "John Doe"

2. Check console:
   ```
   ✅ [VISIT START] Visit started, data received: { patient_name: "John Doe" }
   ```

3. Click "Request Doctor", should see:
   ```
   Patient: John Doe
   ```

---

## Quick SQL Commands

### Check Staff Data
```sql
SELECT id, name, email, role_id FROM staff;
```

### Check Active Visits
```sql
SELECT id, staff_id, patient_name, status, start_time 
FROM staff_visits 
WHERE status = 'in_progress';
```

### Set Staff Name
```sql
UPDATE staff 
SET name = 'Your Nurse Name' 
WHERE id = 'staff-uuid-here';
```

### Check What Staff ID You're Using
Look at the URL bar:
```
localhost:3000/track/[THIS-IS-THE-STAFF-ID]
```

Then check that staff exists:
```sql
SELECT * FROM staff WHERE id = 'paste-id-here';
```

---

## Summary

✅ **APIs Fixed**: All endpoints now return proper data  
✅ **Debugging Added**: Console logs show data flow  
✅ **SQL Script**: Run `999-fix-staff-names.sql`  
✅ **Staff Table**: Must have records with names  
✅ **Visits Table**: Must have patient_name field  

**Next Step**: Check browser console to see what data is actually loading! The logs will tell you exactly what's wrong.

