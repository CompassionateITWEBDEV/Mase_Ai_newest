# Staff Training Progress Bar Fix

## Issues Fixed

### 1. **Progress Bar Resetting on Page Refresh**

**Problem:**
The overall progress bar was resetting to 0% when refreshing the staff-training page, even after completing modules. The progress calculation was not properly using the data stored in the database.

**Root Cause:**
- When fetching training data, the code was setting React state for `completedModules` but then immediately trying to use that state variable in the same function to calculate `currentModuleIndex`
- React state updates are asynchronous, so the state variable still contained the old value (empty array) when trying to calculate the current module
- This caused the module completion tracking to be incorrect and the progress bar to show incorrect values

**Solution:**
Modified `app/staff-training/[trainingId]/page.tsx` (lines 107-145):
- Changed the code to parse the enrollment data from the database into local variables FIRST
- Use these parsed local variables (e.g., `parsedCompletedModules`) to calculate the `currentModuleIndex`
- This ensures the calculation uses the actual data from the database, not the outdated state value
- The progress bar now correctly displays the progress stored in the database (`enrollment.progress`)

**What Changed:**
```typescript
// BEFORE: Using state variable that hasn't updated yet
const modules = foundEnrollment.completedModules || []
setCompletedModules(Array.isArray(modules) ? modules : [])
// ... later trying to use completedModules state (which is still empty!)
if (!completedModules.includes(moduleId)) { // WRONG!

// AFTER: Using parsed local variable with actual database data
const enrollmentCompletedModules = foundEnrollment.completedModules || []
const parsedCompletedModules = Array.isArray(enrollmentCompletedModules) ? enrollmentCompletedModules : []
setCompletedModules(parsedCompletedModules)
// ... later using the parsed variable with correct data
if (!parsedCompletedModules.includes(moduleId)) { // CORRECT!
```

### 2. **Module Completion Tracking**

**Problem:**
When refreshing the page, completed modules were not being properly tracked, causing the progress to reset.

**Solution:**
- All module tracking data (completed modules, viewed files, quiz scores, time spent) is now properly parsed from the database on page load
- The data is stored in the `in_service_enrollments` table with these columns:
  - `progress` - Overall completion percentage (0-100)
  - `completed_modules` - JSONB array of completed module IDs
  - `viewed_files` - JSONB object mapping moduleId to array of viewed file IDs
  - `module_quiz_scores` - JSONB object mapping moduleId to quiz score
  - `module_time_spent` - JSONB object mapping moduleId to seconds spent
- When the page loads, all this data is fetched from the database and properly restored

### 3. **Start Training Button Status Update**

**Problem:**
When clicking "Start Training" from the staff dashboard, the status should change to "in_progress" and be visible in the in-service page employee details.

**Solution:**
The functionality was already working correctly:
- When clicking "Start Training" or "Continue Training" in the staff dashboard (`app/staff-dashboard/page.tsx` lines 1815-1849):
  - Calls `/api/in-service/employee-progress` with `action: "start"`
  - This creates or updates the enrollment record with `status: "in_progress"`
- The in-service page (`app/in-service/page.tsx`) displays trainings based on their status:
  - **Assigned Trainings (Not Started)**: Shows trainings with `status = "enrolled"` (lines 3998-4037)
  - **In Progress Trainings**: Shows trainings with `status = "in_progress"` (lines 4039-4066)
- When the employee progress API is called, it properly separates trainings by status:
  - `assignedTrainings` - status = "enrolled" (not started)
  - `inProgressTrainings` - status = "in_progress" (actively working on)
  - `completedTrainings` - status = "completed" (finished)

**To See Updated Status:**
After clicking "Start Training" from the staff dashboard, refresh the in-service page or reopen the employee details modal to see the training moved to the "In Progress Trainings" section with the current progress percentage displayed.

## How It Works Now

### Progress Persistence Flow:

1. **Module Completion:**
   - User views all files in a module and passes any required quizzes
   - The `completeModule()` function:
     - Updates state immediately: `setCompletedModules()` and `setEnrollment()`
     - Calculates new progress: `(completedModules.length / totalModules) * 100`
     - **Progress bar updates instantly** (before database save)
     - Calls API: `POST /api/in-service/employee-progress` with `action: "progress"`
     - Database updates: `progress`, `completed_modules`, `viewed_files`, `module_quiz_scores`, `module_time_spent`
     - Shows toast: "Module Completed! Progress: XX%"

2. **Continue Training (Page Load):**
   - User clicks "Continue Training" from staff dashboard
   - Page calls API: `GET /api/in-service/employee-progress?employeeId={staffId}`
   - API fetches enrollment record from database with all saved data
   - Frontend parses and restores all states:
     - `enrollment.progress` → displayed in progress bar
     - `completedModules` → marks modules as complete with green checkmarks
     - `viewedFiles` → marks files as viewed with "Viewed" badge
     - `moduleQuizScores` → displays quiz scores for each module
     - `moduleTimeSpent` → displays time spent on each module
     - `currentModuleIndex` → positions user at first incomplete module
   - **Shows toast notification**: "Progress Restored: Continuing from X of Y modules completed (XX%)"
   - **Console logs all restored data** for debugging

3. **Page Refresh:**
   - Same as "Continue Training" - all progress is loaded from database
   - User can see exactly where they left off:
     - ✅ Progress bar shows correct percentage
     - ✅ Completed modules show green "Completed" badge
     - ✅ Viewed files show "Viewed" badge
     - ✅ Quiz scores are displayed
     - ✅ Current module is highlighted
     - ✅ Can continue from where they stopped

4. **Status Changes:**
   - "Not Started" (`enrolled`) → User clicks "Start Training" → Status changes to "in_progress"
   - "In Progress" (`in_progress`) → User completes all modules and final quiz → Status changes to "completed"
   - All status changes are persisted in the `in_service_enrollments.status` column

## Database Schema

The training progress data is stored in the `in_service_enrollments` table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique enrollment ID |
| `employee_id` | UUID | Reference to employee (staff.id or applicants.id) |
| `training_id` | UUID | Reference to training (in_service_trainings.id) |
| `status` | TEXT | "enrolled", "in_progress", or "completed" |
| `progress` | INTEGER | Overall completion percentage (0-100) |
| `completed_modules` | JSONB | Array of completed module IDs: `["module-1", "module-2"]` |
| `viewed_files` | JSONB | Object mapping module IDs to file IDs: `{"module-1": ["file-1", "file-2"]}` |
| `module_quiz_scores` | JSONB | Object mapping module IDs to scores: `{"module-1": 85, "module-2": 90}` |
| `module_time_spent` | JSONB | Object mapping module IDs to seconds: `{"module-1": 1200, "module-2": 900}` |
| `start_date` | TIMESTAMP | When training was started |
| `last_accessed` | TIMESTAMP | Last time training was accessed |

## Testing the Fix

### Test 1: Progress Persistence
1. Go to staff dashboard → Training tab
2. Click "Start Training" or "Continue Training" on any training
3. Complete one or more modules by viewing all files and passing quizzes
4. Note the overall progress percentage (e.g., 33%, 66%)
5. **Refresh the page (F5 or Ctrl+R)**
6. ✅ **Expected:** Progress bar shows the same percentage as before refresh
7. ✅ **Expected:** Completed modules are marked with green checkmark and "Completed" badge
8. ✅ **Expected:** Current module index is at the first incomplete module

### Test 2: Module Tracking
1. Start a training with multiple modules
2. Complete module 1 (view all files, pass quiz if required)
3. Note: Module 1 shows "Completed" badge with checkmark
4. Refresh the page
5. ✅ **Expected:** Module 1 still shows as completed
6. ✅ **Expected:** Viewed files in module 1 show "Viewed" badge
7. ✅ **Expected:** Module quiz score is displayed (if taken)
8. ✅ **Expected:** Time spent on module 1 is displayed

### Test 3: Status Update in In-Service Page
1. Go to staff dashboard → Training tab
2. Find a training with status "Not Started" or "assigned"
3. Click "Start Training"
4. Go to In-Service page → Employees tab
5. Click "View Details" on the employee who started the training
6. ✅ **Expected:** Training appears in "In Progress Trainings" section (blue background)
7. ✅ **Expected:** Progress bar shows 0% or current progress
8. ✅ **Expected:** Start date is displayed

## Additional Notes

- **Automatic Progress Calculation:** Progress is automatically calculated based on completed modules: `(completedModules / totalModules) * 100`
- **Sequential Module Access:** Modules must be completed in order (module 2 is locked until module 1 is complete)
- **Quiz Requirements:** If a module has a quiz, it must be passed before the module is marked as complete
- **File Tracking:** All files within a module must be viewed before the module can be completed
- **Time Tracking:** Time spent on each module is tracked and persisted (visible in module details)

## Files Modified

1. **app/staff-training/[trainingId]/page.tsx**
   - **Lines 97-184:** Enhanced data loading with comprehensive debugging:
     - Logs employee training counts (in progress, completed, assigned)
     - Logs found enrollment data (status, progress, completed modules)
     - Restores all progress data from database with console logging
     - Shows toast notification when progress is restored
     - Explicitly sets enrollment state with progress and status
   - **Lines 300-374:** Enhanced `completeModule()` function with:
     - Immediate UI update by calling `setEnrollment()` BEFORE database save
     - Console logging for debugging progress updates
     - Error handling with state reversion if save fails
     - Auto-update status to "completed" when progress reaches 100%
   - **Lines 606-633:** Improved progress calculation logic:
     - Dual calculation: from enrollment (database) and from completed modules (state)
     - Uses enrollment progress when available, calculated progress otherwise
     - Ensures progress bar always reflects the most current value
     - Added debug logging to track progress updates in real-time
   - Ensures progress bar and module completion tracking persist across page refreshes and update immediately after each module completion

## API Endpoints Used

1. **GET /api/in-service/employee-progress?employeeId={id}**
   - Fetches all training progress data for an employee
   - Returns: `assignedTrainings`, `inProgressTrainings`, `completedTrainings`

2. **POST /api/in-service/employee-progress**
   - Actions:
     - `start` - Changes status from "enrolled" to "in_progress"
     - `progress` - Updates progress percentage and module tracking data
     - `complete` - Changes status to "completed" and creates completion record

3. **GET /api/in-service/trainings?trainingId={id}**
   - Fetches training details including modules, quizzes, and content

## Key Improvements

### Immediate UI Updates
The progress bar now updates **instantly** when a module is completed:
1. ✅ User completes all files in a module and passes quiz (if required)
2. ✅ `completeModule()` is called
3. ✅ **Progress bar updates immediately** (before saving to database)
4. ✅ Progress is saved to database in the background
5. ✅ If save fails, changes are automatically reverted

### Smart Progress Calculation
The system uses a dual-source approach:
- **Primary Source:** Enrollment progress from database (restored on page load)
- **Fallback Source:** Calculated progress from completed modules state (for immediate updates)
- **Result:** Progress bar always shows the most current value, whether from database or fresh calculation

### Real-Time Debugging
Console logs now track every progress update:

**When continuing training (page load):**
```javascript
Loading training progress for employee: {
  employeeId: "abc123",
  trainingId: "xyz789",
  inProgress: 1,
  completed: 2,
  assigned: 0
}

Found enrollment data: {
  status: "in_progress",
  progress: 33,
  completedModules: ["module-1"],
  enrollmentId: "enroll123",
  trainingId: "xyz789"
}

Restoring completed modules: ["module-1"]
Restoring viewed files: { "module-1": ["file-1", "file-2"] }
Restoring quiz scores: { "module-1": 85 }
Restoring time spent: { "module-1": 1200 }
Current module to continue from: 1
✅ Training progress restored successfully!
```

**When completing a module:**
```javascript
Module module-2 completed. Progress: 2/3 = 67%
Progress saved to database: 67%

Staff Training Progress: {
  completedModules: 2,
  totalModules: 3,
  calculatedProgress: 67,
  enrollmentProgress: 67,
  displayedProgress: 67,
  status: "in_progress"
}
```

This makes it easy to verify that progress is being tracked, saved, and restored correctly.

## Summary

All issues have been resolved. The progress bar now:
1. ✅ **Updates immediately** when modules are completed (no refresh needed)
2. ✅ **Persists correctly** across page refreshes (data from database)
3. ✅ **Reflects accurate status** in the in-service page
4. ✅ **Handles errors gracefully** with automatic state reversion
5. ✅ **Provides debug logging** for easy troubleshooting

The system now provides a reliable, responsive, and consistent training experience for staff members.

