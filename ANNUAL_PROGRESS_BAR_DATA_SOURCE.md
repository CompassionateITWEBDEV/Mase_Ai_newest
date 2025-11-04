# Annual Progress Bar - Data Source and Calculation

## Problem
The annual progress bar at the Employee Progress tab was not showing the correct completed hours because it was reading from the `employee_training_requirements` table which was not being updated when trainings were completed.

## Solution
The API now **calculates the actual completed hours in real-time** from the training completions data, not from a stale database field.

## Data Sources

### 1. **Completed Hours** (Numerator)
**Source**: `in_service_completions` table
**Calculation**: 
```javascript
const completedHours = empCompletions.reduce((sum, completion) => {
  return sum + parseFloat(completion.ceu_hours_earned || "0")
}, 0)
```
**What this means**: 
- Sums up ALL `ceu_hours_earned` from all training completions for the employee
- Automatically updates whenever a training is completed
- Example: If employee completed 3 trainings with 2, 3, and 1.5 CEU hours respectively, completedHours = 6.5

### 2. **In-Progress Hours**
**Source**: `in_service_enrollments` table (filtered by status = "in_progress")
**Calculation**:
```javascript
const inProgressHours = empEnrollments
  .filter(e => e.status === "in_progress")
  .reduce((sum, enrollment) => {
    return sum + parseFloat(enrollment.in_service_trainings?.ceu_hours || "0")
  }, 0)
```
**What this means**:
- Sums up CEU hours from all trainings currently in progress
- Example: If employee is currently doing 2 trainings worth 2 and 3 hours, inProgressHours = 5

### 3. **Annual Requirement** (Denominator)
**Source**: `employee_training_requirements` table → `annual_requirement_hours` field
**Fallback**: If no requirement exists, uses role-based default from `getRoleBasedRequirement(role)` function
**What this means**:
- This is the TOTAL hours required for the year
- Example: If employee needs 12 CEU hours per year, annualRequirement = 12

### 4. **Progress Percentage**
**Calculation**:
```javascript
const progress = (completedHours / annualRequirement) * 100
// Capped at 100%
const displayProgress = Math.min(100, progress)
```

## Data Flow

```
1. Staff completes training module
   ↓
2. Record saved to in_service_completions with ceu_hours_earned
   ↓
3. When admin opens Employee Progress tab
   ↓
4. API fetches all completions for each employee
   ↓
5. API CALCULATES completedHours from completions (not from requirements table)
   ↓
6. API updates employee_training_requirements table with calculated values
   ↓
7. UI displays progress bar: (completedHours / annualRequirement) * 100
```

## Example Data Flow

### Scenario: Employee John completes a training

**Before completion:**
- `in_service_completions`: 2 records (2 hrs, 3 hrs) = 5 hrs completed
- `in_service_enrollments`: 1 in-progress (2 hrs)
- `employee_training_requirements`: annual_requirement_hours = 12

**Progress bar shows:**
- Completed: 5 hrs
- Annual requirement: 12 hrs
- Progress: (5 / 12) * 100 = 41.67% (Blue color)

**After John completes the in-progress training:**
- `in_service_completions`: 3 records (2 hrs, 3 hrs, 2 hrs) = **7 hrs completed**
- `in_service_enrollments`: 0 in-progress
- `employee_training_requirements`: annual_requirement_hours = 12

**Progress bar NOW shows:**
- Completed: 7 hrs
- Annual requirement: 12 hrs
- Progress: (7 / 12) * 100 = 58.33% (Blue color)

## Color Coding

The progress percentage is color-coded for quick visual status:

- **Green** (`text-green-600`): 100% or more (Fully compliant!)
- **Blue** (`text-blue-600`): 75% to 99% (Almost there)
- **Yellow** (`text-yellow-600`): 50% to 74% (On track but needs more)
- **Gray** (`text-muted-foreground`): Below 50% (Needs attention)

## What Gets Stored in Database

The API now updates the `employee_training_requirements` table with the **calculated values** for caching/reporting:

```javascript
await supabase
  .from("employee_training_requirements")
  .update({
    completed_hours: completedHours,        // Calculated from completions
    in_progress_hours: inProgressHours,     // Calculated from enrollments
    remaining_hours: remainingHours,        // Calculated: requirement - completed - in-progress
    compliance_status: status,              // Calculated based on remaining hours
    last_training_date: lastCompletionDate, // From latest completion
    updated_at: new Date().toISOString()
  })
```

## Testing

### Test Case 1: New Employee with No Completions
**Expected:**
- completedHours: 0
- annualRequirement: (role-based default, e.g., 12)
- Progress: 0%
- Color: Gray

### Test Case 2: Employee with Some Completions
**Given:** 
- 3 completed trainings: 2, 3, 1.5 hours
- Annual requirement: 12 hours
**Expected:**
- completedHours: 6.5
- Progress: 54.17%
- Color: Yellow

### Test Case 3: Employee Meeting Requirement
**Given:**
- 4 completed trainings: 3, 3, 3, 3 hours
- Annual requirement: 12 hours
**Expected:**
- completedHours: 12
- Progress: 100%
- Color: Green

### Test Case 4: Employee Exceeding Requirement
**Given:**
- 5 completed trainings: 3, 3, 3, 3, 3 hours
- Annual requirement: 12 hours
**Expected:**
- completedHours: 15
- Progress: 100% (capped)
- Color: Green

## Console Logging

The API logs progress data for debugging:

```javascript
console.log(`[ANNUAL PROGRESS] Employee: John Doe`, {
  completions: 3,
  completedHours: 6.5,
  inProgressEnrollments: 1,
  inProgressHours: 2,
  annualRequirementFromDB: 12
})
```

Check the server console to see these logs when the Employee Progress tab is loaded.

## Summary

✅ **What Changed:**
- completedHours is now **calculated from actual completions** (not stale database field)
- inProgressHours is **calculated from active enrollments**
- Both are recalculated every time the Employee Progress page loads
- Database is updated with calculated values for caching

✅ **What This Fixes:**
- Progress bar now reflects ACTUAL completed trainings
- Progress updates IMMEDIATELY when a training is completed (after page refresh)
- No need to manually update employee_training_requirements table
- Annual progress is always accurate and up-to-date

✅ **What Data is Reflected:**
- **Numerator (Top)**: Sum of all CEU hours from `in_service_completions`
- **Denominator (Bottom)**: Annual requirement from `employee_training_requirements`
- **Percentage**: (completedHours / annualRequirement) * 100, capped at 100%
- **Color**: Based on percentage thresholds for visual status

