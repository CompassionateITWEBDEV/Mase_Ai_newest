# Fix: Completed Trainings Not Displaying

## Problem ❌

Completed trainings are not showing up in the staff dashboard training tab for specific employees.

## Root Cause 🔍

The code was already set up to fetch and display completed trainings, but:
1. Missing fields: `completionDate`, `score`, `certificateId`
2. Not enough console logging to debug
3. Type definitions incomplete

## Solution ✅

### 1. Added Missing Fields

Updated the type definition to include:
```typescript
const allTrainings: Array<{
  id: string
  name: string
  progress: number
  completed: boolean
  dueDate: string
  completionDate?: string      // NEW ✅
  trainingId?: string
  status?: string
  category?: string
  ceuHours?: number
  score?: number               // NEW ✅
  certificateId?: string       // NEW ✅
}> = []
```

### 2. Enhanced Completed Training Processing

```typescript
// Add completed trainings
if (employee.completedTrainings && Array.isArray(employee.completedTrainings)) {
  console.log("Processing completed trainings:", employee.completedTrainings.length)
  
  employee.completedTrainings.forEach((training: any) => {
    allTrainings.push({
      id: training.enrollmentId || training.id,
      name: training.title || training.training,
      progress: 100,
      completed: true,
      dueDate: `Completed ${new Date(training.completionDate).toLocaleDateString()}`,
      completionDate: training.completionDate || training.completed_at,  // ✅
      trainingId: training.trainingId || training.id,
      status: "completed",
      category: training.category,
      ceuHours: training.ceuHours,
      score: training.score,                                              // ✅
      certificateId: training.certificateId || training.certificate_id,  // ✅
    })
  })
}
```

### 3. Added Debug Logging

```typescript
console.log("Completed training:", {
  title: training.title,
  completionDate: training.completionDate,
  score: training.score,
  trainingId: training.trainingId
})
```

---

## How to Debug

### Check Browser Console

Open browser DevTools (F12) and look for:

```
Staff Dashboard: Loading trainings for staff ID: xxx
Staff Dashboard: Response status: 200
Staff Dashboard: Training data received: { ... }
Staff Dashboard: Employee training data: {
  assignedCount: 0,
  inProgressCount: 0,
  completedCount: X,  ← Should show count
  upcomingCount: 0
}
Staff Dashboard: Processing completed trainings: X
Completed training: {
  title: "Training Name",
  completionDate: "2024-12-15...",
  score: 95,
  trainingId: "..."
}
Staff Dashboard: Total trainings to display: X
```

### If Completed Count is 0

The issue is in the API response. Check:
1. `/api/in-service/employee-progress?employeeId=xxx`
2. Does it return `completedTrainings` array?
3. Is the array empty?

### If API Returns Data But Not Displaying

Check:
1. `displayStaff.trainingModules` in React DevTools
2. Are completed trainings in the array?
3. Do they have `status: "completed"`?

---

## API Response Expected Format

```json
{
  "success": true,
  "employees": [
    {
      "employeeId": "xxx",
      "full_name": "John Doe",
      "assignedTrainings": [...],
      "inProgressTrainings": [...],
      "completedTrainings": [
        {
          "enrollmentId": "enroll123",
          "trainingId": "train456",
          "title": "Patient Safety Training",
          "category": "Safety",
          "ceuHours": 2,
          "completionDate": "2024-12-15T10:30:00Z",
          "score": 95,
          "certificateId": "CERT-1234567890-ABC123"
        }
      ],
      "upcomingDeadlines": [...]
    }
  ]
}
```

---

## Testing Steps

### Step 1: Complete a Training
1. Go to a training
2. Complete all modules
3. Pass all quizzes
4. Training marked as complete

### Step 2: Check API Response
```bash
# Open browser console
# Navigate to Network tab
# Filter: employee-progress
# Look for response
```

Expected response should include completed training in `completedTrainings` array.

### Step 3: Check Dashboard Display
1. Go to Staff Dashboard
2. Select the staff member
3. Click Training tab
4. Look for completed section

**Should see:**
- Summary stats: "Completed: 1" (or more)
- Green training card with:
  - ✅ Completion date
  - ✅ Score badge
  - ✅ "View Certificate" button
  - ✅ "Review Content" button

### Step 4: Check Console Logs
```
Look for in browser console:
- "Staff Dashboard: Processing completed trainings: 1"
- "Completed training: { title: ..., completionDate: ..., score: ... }"
- "Staff Dashboard: Total trainings to display: X"
```

---

## If Still Not Working

### Check 1: API Endpoint
The API might not be returning completed trainings. Check:
```
/api/in-service/employee-progress
```

Make sure it includes logic to fetch completed trainings from database.

### Check 2: Database Query
Check if the query includes:
```sql
SELECT * FROM employee_training_progress
WHERE employee_id = $1
AND status = 'completed'
```

### Check 3: Database Data
Verify data exists:
```sql
SELECT 
  employee_id,
  training_id,
  status,
  progress,
  completion_date,
  score
FROM employee_training_progress
WHERE employee_id = 'xxx'
AND status = 'completed'
```

---

## Quick Fix Commands

### Add Console Logging
```javascript
// In staff-dashboard page.tsx, around line 383
console.log("Raw API response:", data)
console.log("Employee data:", data.employees[0])
console.log("Completed trainings:", data.employees[0]?.completedTrainings)
```

### Check if Data Exists
```javascript
// After line 470
if (employee.completedTrainings) {
  console.log("Completed trainings count:", employee.completedTrainings.length)
  console.log("First completed training:", employee.completedTrainings[0])
}
```

---

## Common Issues and Solutions

### Issue 1: API Returns Empty Array
**Problem:** `completedTrainings: []`

**Solution:** Check API endpoint logic. Ensure it's querying for completed trainings.

### Issue 2: Wrong Status Value
**Problem:** Status is `"complete"` instead of `"completed"`

**Solution:** Update status mapping or API to use consistent values.

### Issue 3: Missing completionDate
**Problem:** `completionDate` is null or undefined

**Solution:** Ensure database stores completion timestamp when training completes.

### Issue 4: Wrong Employee ID
**Problem:** Querying with wrong employee ID

**Solution:** Verify `selectedStaff.id` matches database employee records.

---

## Summary (Cebuano/English)

### Gi-fix nato:
1. ✅ Added `completionDate`, `score`, `certificateId` fields
2. ✅ Enhanced console logging para easy debugging
3. ✅ Updated type definitions
4. ✅ Added detailed comments

### Para ma-display ang completed trainings:
1. **API must return** `completedTrainings` array
2. **Array must have** training objects with:
   - title
   - completionDate
   - score
   - trainingId
   - certificateId
3. **Dashboard will display** with green card and buttons

### If wala pa display:
1. Check console logs
2. Check API response
3. Check database data
4. Follow debugging steps above

**The code is ready! Now check if ang API nag-return ug completed trainings data! 🔍**

