# Training Tab Debug Guide

## Problem Description

**User Report:** 
"sa training tab sa dashboard in accurate ang data nag login ko sa staff login kini na staff naay 2 training na complete but pag visit nako sa training tab wla na reflect tong accurate data sometime wlay data ma display"

**Translation:**
In the training tab on the dashboard, the data is inaccurate. I logged in as staff, this staff has 2 completed trainings, but when I visit the training tab, the accurate data is not reflected. Sometimes no data is displayed.

---

## Root Causes (Possible)

### 1. **Staff ID Mismatch** ⚠️
- `currentUser.id` from login doesn't match `staff.id` in database
- Email match fails during staff selection
- Wrong staff record selected

### 2. **API Filtering Issues** ⚠️
- `/api/in-service/employee-progress` not filtering correctly by employeeId
- Case-sensitive ID matching
- UUID vs string mismatch

### 3. **Data Source Issues** ⚠️
- Completed trainings in `in_service_enrollments` (status='completed') not counted
- Only checking `in_service_completions` table
- Missing join or query issue

### 4. **Vercel Deployment Issues** ✅ (ALREADY FIXED)
- Connection exhaustion
- Silent query failures
- Cached data
- These were fixed in all routes earlier

---

## Debugging Steps

### Step 1: Check Logged-In User

**Open browser console** (F12) when on staff dashboard and run:

```javascript
JSON.parse(localStorage.getItem('currentUser'))
```

**Expected output:**
```json
{
  "id": "some-uuid",
  "email": "staff@example.com",
  "name": "Staff Name",
  "role": "role_name",
  "accountType": "staff"
}
```

**Check:**
- ✅ Is the ID correct?
- ✅ Is the email correct?
- ✅ Is accountType "staff"?

---

### Step 2: Check Selected Staff

**In browser console, filter console logs:**

```
Staff Dashboard: 👤 Staff details
```

**Look for:**
```
Staff Dashboard: 👤 Staff details: {
  id: "some-uuid",
  name: "Staff Name",
  email: "staff@example.com"
}
```

**Check:**
- ✅ Does this ID match the logged-in user ID?
- ✅ Does the name and email match?

---

### Step 3: Use Debug API

I created a special debug endpoint: `/api/staff-training-debug`

**Test with staff ID:**
```
http://localhost:3000/api/staff-training-debug?employeeId=YOUR_STAFF_ID
```

**Or test with email:**
```
http://localhost:3000/api/staff-training-debug?email=staff@example.com
```

**What it shows:**
```json
{
  "success": true,
  "debug": {
    "staff": {
      "id": "uuid",
      "name": "Staff Name",
      "email": "staff@example.com",
      "role": "role_name",
      "credentials": "RN",
      "isActive": true
    },
    "counts": {
      "totalEnrollments": 5,
      "completedEnrollments": 2,
      "inProgressEnrollments": 1,
      "enrolledOnly": 2,
      "completionRecords": 2,
      "applicableAssignments": 3,
      "totalCompletedTrainings": 2
    },
    "enrollments": [...],
    "completions": [...],
    "completedTrainings": [
      {
        "source": "completions_table",
        "trainingTitle": "Training 1",
        "completionDate": "2024-11-05",
        "score": 95,
        "ceuHours": 2,
        "certificate": "CERT-123"
      },
      {
        "source": "enrollment_status",
        "trainingTitle": "Training 2",
        "completionDate": "2024-11-04",
        "ceuHours": 1.5
      }
    ],
    "assignments": [...]
  }
}
```

**Check:**
- ✅ Does `totalCompletedTrainings` match expected number?
- ✅ Are the 2 completed trainings shown?
- ✅ Check `completedTrainings` array - are both trainings there?
- ✅ Check `source` field - where is each completion coming from?

---

### Step 4: Check API Response

**In browser console, filter for:**
```
Staff Dashboard: ✅ Training data received
```

**Look for:**
```json
{
  "success": true,
  "employeeCount": 1,
  "hasEmployees": true,
  "employees": [...]
}
```

**Then check:**
```
Staff Dashboard: 📊 Employee training data: {
  "employeeId": "uuid",
  "employeeName": "Staff Name",
  "assignedCount": 2,
  "inProgressCount": 1,
  "completedCount": 2,
  "upcomingCount": 0
}
```

**Verify:**
- ✅ Is `completedCount` correct (should be 2)?
- ✅ Are the completed trainings listed?

---

### Step 5: Check Training Display

**Look for these console logs:**
```
Staff Dashboard: Processing completed trainings: 2
```

**And for each training:**
```
Completed training: {
  title: "Training Name",
  completionDate: "2024-11-05",
  score: 95,
  trainingId: "uuid"
}
```

**Verify:**
- ✅ Are both completed trainings being processed?
- ✅ Do they have title, completionDate, and trainingId?

---

## Common Issues & Solutions

### Issue 1: Staff ID doesn't match

**Symptoms:**
- Debug API shows "Staff not found"
- Console shows different IDs for currentUser vs selectedStaff

**Solution:**
1. Check if email match is working:
   - Compare `currentUser.email` to staff records in database
   - Ensure email is exactly the same (case-insensitive)

2. Check database:
   ```sql
   SELECT id, email, name, role_id, is_active
   FROM staff
   WHERE email = 'staff@example.com';
   ```

3. Update staff record if needed:
   ```sql
   UPDATE staff
   SET email = 'correct@email.com'
   WHERE id = 'staff-uuid';
   ```

---

### Issue 2: Completed trainings not in database

**Symptoms:**
- Debug API shows `totalCompletedTrainings: 0`
- Both `completions` and `enrollments` arrays are empty or don't have completed status

**Solution:**
1. Check enrollments table:
   ```sql
   SELECT id, training_id, employee_id, status, progress, updated_at
   FROM in_service_enrollments
   WHERE employee_id = 'staff-uuid'
   AND status = 'completed';
   ```

2. Check completions table:
   ```sql
   SELECT id, training_id, employee_id, completion_date, score, ceu_hours_earned, certificate_number
   FROM in_service_completions
   WHERE employee_id = 'staff-uuid';
   ```

3. If training should be completed, update enrollment:
   ```sql
   UPDATE in_service_enrollments
   SET status = 'completed', progress = 100, updated_at = NOW()
   WHERE id = 'enrollment-uuid';
   ```

---

### Issue 3: API not returning data

**Symptoms:**
- API returns empty `employees` array
- Console shows "No active staff found" or similar

**Solution:**

1. Test API directly in browser:
   ```
   http://localhost:3000/api/in-service/employee-progress?employeeId=YOUR_STAFF_ID
   ```

2. Check response:
   - If `employees: []` → Staff ID doesn't exist or not active
   - If error → Check Vercel logs for database errors

3. Verify staff is active:
   ```sql
   SELECT id, name, email, is_active
   FROM staff
   WHERE id = 'staff-uuid';
   ```

4. If `is_active = false`, update:
   ```sql
   UPDATE staff
   SET is_active = true
   WHERE id = 'staff-uuid';
   ```

---

### Issue 4: Data shows in API but not in UI

**Symptoms:**
- Debug API shows correct data
- API response has `completedCount: 2`
- But UI shows 0 or wrong trainings

**Solution:**

1. **Check browser console for errors**
   - Look for red errors in console
   - Check if data is being filtered out

2. **Clear browser cache**
   ```
   Ctrl + Shift + R (Windows)
   Cmd + Shift + R (Mac)
   ```

3. **Check if Training Tab is active**
   - Click on "Training" tab
   - Wait for data to load
   - Check console for loading messages

4. **Check localStorage**
   ```javascript
   // Clear and reload
   localStorage.clear()
   location.reload()
   ```

---

## Testing Checklist

### Local Testing:
- [ ] Run `npm run dev`
- [ ] Login as staff with completed trainings
- [ ] Check browser console for staff ID
- [ ] Visit training tab
- [ ] Check console for "Processing completed trainings: X"
- [ ] Verify trainings display correctly
- [ ] Test debug API with staff ID
- [ ] Verify counts match

### Vercel Testing:
- [ ] Deploy latest changes
- [ ] Test same flow as local
- [ ] Check Vercel logs for errors
- [ ] Look for emoji indicators (🔄 ✅ ⚠️ ❌)
- [ ] Test debug API on Vercel
- [ ] Compare results with local

---

## SQL Queries for Verification

### Check staff record:
```sql
SELECT id, email, name, role_id, credentials, is_active
FROM staff
WHERE email = 'YOUR_EMAIL';
```

### Check enrollments for staff:
```sql
SELECT 
  e.id,
  e.status,
  e.progress,
  t.title,
  t.ceu_hours,
  e.enrollment_date,
  e.updated_at
FROM in_service_enrollments e
JOIN in_service_trainings t ON e.training_id = t.id
WHERE e.employee_id = 'YOUR_STAFF_ID'
ORDER BY e.updated_at DESC;
```

### Check completions for staff:
```sql
SELECT 
  c.id,
  t.title,
  c.completion_date,
  c.score,
  c.ceu_hours_earned,
  c.certificate_number
FROM in_service_completions c
JOIN in_service_trainings t ON c.training_id = t.id
WHERE c.employee_id = 'YOUR_STAFF_ID'
ORDER BY c.completion_date DESC;
```

### Check completed trainings (both sources):
```sql
-- From completions table
SELECT 'completion' as source, t.title, c.completion_date, c.score, c.ceu_hours_earned
FROM in_service_completions c
JOIN in_service_trainings t ON c.training_id = t.id
WHERE c.employee_id = 'YOUR_STAFF_ID'

UNION ALL

-- From enrollments with status='completed' (without completion record)
SELECT 'enrollment' as source, t.title, e.updated_at as completion_date, NULL as score, t.ceu_hours
FROM in_service_enrollments e
JOIN in_service_trainings t ON e.training_id = t.id
WHERE e.employee_id = 'YOUR_STAFF_ID'
AND e.status = 'completed'
AND NOT EXISTS (
  SELECT 1 FROM in_service_completions c2
  WHERE c2.enrollment_id = e.id
)
ORDER BY completion_date DESC;
```

---

## Quick Fix Commands

### 1. Mark training as completed in enrollments:
```sql
UPDATE in_service_enrollments
SET status = 'completed', progress = 100, updated_at = NOW()
WHERE employee_id = 'STAFF_ID'
AND training_id = 'TRAINING_ID';
```

### 2. Create completion record (with certificate):
```sql
INSERT INTO in_service_completions (
  enrollment_id,
  training_id,
  employee_id,
  completion_date,
  score,
  ceu_hours_earned,
  certificate_number
) VALUES (
  'ENROLLMENT_ID',
  'TRAINING_ID',
  'STAFF_ID',
  NOW(),
  95,
  2.0,
  'CERT-' || floor(random() * 1000000)
);
```

### 3. Activate staff record:
```sql
UPDATE staff
SET is_active = true, updated_at = NOW()
WHERE id = 'STAFF_ID';
```

---

## Contact for Help

If issue persists after trying all steps above, provide:

1. **Debug API output:**
   - `/api/staff-training-debug?employeeId=YOUR_ID`

2. **Browser console logs:**
   - Filter by "Staff Dashboard"
   - Copy all logs related to training loading

3. **Vercel logs:**
   - `vercel logs --follow`
   - Copy logs with emoji indicators

4. **Database query results:**
   - Run the verification SQL queries above
   - Copy the results

---

**Last Updated:** November 6, 2025

