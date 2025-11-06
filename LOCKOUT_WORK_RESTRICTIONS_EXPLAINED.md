# "Locked Out" - Work Restrictions Explanation 🔒

## What is "Locked Out"?

**"Locked Out"** means employees who are **automatically restricted from certain work activities** because they are **Non-Compliant** with their CEU (Continuing Education Unit) requirements.

Kini nga feature is for **compliance enforcement** - para sigurado nga ang tanan staff naka-complete sa ilang required trainings before ma-allow sila sa certain work activities.

## Unsa Ang Ma-Restrict? (What Gets Restricted?)

Kung ang employee is **NON-COMPLIANT** (overdue sa ilang CEU requirements), automatically sila ma-lock out gikan sa:

### 🔒 **3 Restricted Activities:**

1. **📅 New Shift Scheduling** (`scheduling`)
   - Dili na sila pwede ma-assign sa bag-ong schedules
   - Existing schedules okay pa, pero bag-ong shift bawal na

2. **💰 Payroll Processing** (`payroll`)
   - Possible restrictions sa payroll (depending sa policy)
   - Para sigurado nga naa'y incentive to complete trainings

3. **🏥 New Patient Assignments** (`patient_assignments`)
   - Dili na pwede ma-assign sa bag-ong patients
   - Important for patient safety - dapat trained ang staff

## Kanus-a Ma-Lockout Ang Employee?

```typescript
// Automatic lockout logic
if (status === "non_compliant") {
  workRestrictions = ["scheduling", "payroll", "patient_assignments"]
} else {
  workRestrictions = [] // No restrictions
}
```

### ❌ **NON-COMPLIANT Status** = Automatic Lockout

An employee becomes **Non-Compliant** when:
```
daysUntilDue < 0  (Past due date = OVERDUE!)
```

**Example:**
- Required CEU Hours: 25
- Completed Hours: 15
- Due Date: January 1, 2025
- Today: January 10, 2025
- **Status**: ❌ NON-COMPLIANT (9 days overdue!)
- **Result**: 🔒 LOCKED OUT from scheduling, payroll, patient assignments

## How It Works in the System

### 1. **Backend Calculation** (`app/api/continuing-education/data/route.ts`)

```typescript
// Step 1: Calculate days until due
const daysUntilDue = calculateDaysUntilDue(hireDate, roleReq.period, periodEnd)

// Step 2: Determine compliance status
const status = calculateComplianceStatus(completedHours, requiredHours, daysUntilDue)

// Step 3: Apply work restrictions if non-compliant
const workRestrictions: string[] = []
if (status === "non_compliant") {
  workRestrictions.push("scheduling", "payroll", "patient_assignments")
}
```

### 2. **Count Locked Out Employees**

```typescript
// Count how many employees are locked out
const stats = {
  ...
  lockedOut: filteredEmployees.filter((e) => e.workRestrictions.length > 0).length
}
```

### 3. **Display in UI**

#### A. Overview Tab - Stats Card
```
┌─────────────┐
│     3       │  ← Number of locked out employees
│ Locked Out  │
└─────────────┘
```

#### B. Urgent Actions Section
Shows all non-compliant employees with work restrictions:
```
🔴 John Doe
   CEU requirements overdue • Work restrictions active
   [Overdue]
```

#### C. Employee Tracking Tab
Shows "Restricted" badge next to locked out employees:
```
Jane Smith  [RN]  [Non-Compliant]  [🔒 Restricted]
```

#### D. View Details Modal
Shows detailed restriction information:
```
🔒 Active Work Restrictions

Employee is restricted from:
• New shift scheduling
• Payroll processing
• New patient assignments

Complete CEU requirements to lift restrictions automatically.
```

## Visual Indicators

### 1. **Stats Card (Overview Tab)**
```typescript
<Card>
  <CardContent className="p-4 text-center">
    <div className="text-2xl font-bold text-purple-600">
      {complianceStats.lockedOut}  ← Real count from database
    </div>
    <div className="text-sm text-gray-600">Locked Out</div>
  </CardContent>
</Card>
```

### 2. **Badge in Employee List**
```typescript
{employee.workRestrictions.length > 0 && (
  <Badge className="bg-red-100 text-red-800">
    <Lock className="h-3 w-3 mr-1" />
    Work Restricted
  </Badge>
)}
```

### 3. **Restriction Details in Modal**
```typescript
{selectedEmployee.workRestrictions.length > 0 && (
  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
    <Lock className="h-5 w-5 text-red-500" />
    <span className="font-medium text-red-800">
      Employee is restricted from:
    </span>
    <ul>
      {workRestrictions.map(restriction => (
        <li>{restriction}</li>
      ))}
    </ul>
    <p className="text-sm text-red-600 mt-2">
      Complete CEU requirements to lift restrictions automatically.
    </p>
  </div>
)}
```

## How to Unlock an Employee

### Automatic Unlocking ✅

When an employee completes their CEU requirements:

1. **Complete Required Training**
   ```sql
   INSERT INTO in_service_completions 
     (enrollment_id, training_id, staff_id, completion_date, ceu_hours_earned)
   VALUES (...);
   ```

2. **System Recalculates Status**
   ```
   Completed Hours: 25/25 ✅
   Days Until Due: 120 days
   Status: COMPLIANT
   Work Restrictions: [] (EMPTY = NO RESTRICTIONS!)
   ```

3. **Restrictions Automatically Lifted**
   - No more lockout badge
   - Can be scheduled again
   - Payroll processing resumes
   - Can receive new patient assignments

### Manual Override (If Needed)

If you need to manually adjust:

```sql
-- Update employee's period end date to give more time
UPDATE employee_training_requirements
SET current_period_end = '2025-12-31'
WHERE staff_id = 'xxx';

-- Or reduce required hours (if justified)
UPDATE employee_training_requirements
SET annual_ceu_hours = 20
WHERE staff_id = 'xxx';
```

## Real-World Scenarios

### Scenario 1: Nurse Overdue on CEUs
```
Name: Sarah Johnson, RN
Required Hours: 25
Completed Hours: 15
Due Date: Jan 1, 2025 (10 days ago!)
Status: ❌ NON-COMPLIANT
Locked Out: 🔒 YES

Restrictions:
• Cannot be scheduled for new shifts
• Payroll may be affected
• Cannot accept new patient assignments

Solution: Complete 10 more CEU hours ASAP!
```

### Scenario 2: After Completing Training
```
Name: Sarah Johnson, RN
Required Hours: 25
Completed Hours: 25 ✅
Due Date: Jan 1, 2025
Status: ✅ COMPLIANT
Locked Out: ❌ NO

Restrictions: NONE - Full work privileges restored!
```

## Benefits of Lockout System

1. **📋 Compliance Enforcement**
   - Ensures all staff maintain required certifications
   - Meets state regulatory requirements

2. **⚖️ Fair & Automatic**
   - Rules apply equally to everyone
   - No manual intervention needed

3. **🏥 Patient Safety**
   - Only properly trained staff get patient assignments
   - Reduces risk of outdated practices

4. **📊 Clear Visibility**
   - Managers can see who is locked out
   - Urgent actions section highlights issues

5. **💪 Motivation**
   - Work restrictions motivate staff to complete trainings
   - Clear consequences for non-compliance

## Database Tables Involved

### Primary Logic:
```sql
-- 1. Check employee's training completion
SELECT * FROM in_service_completions 
WHERE staff_id = 'xxx';

-- 2. Check required hours
SELECT * FROM employee_training_requirements 
WHERE staff_id = 'xxx';

-- 3. Calculate if overdue
IF current_period_end < CURRENT_DATE 
   AND completed_hours < required_hours
THEN
   status = 'non_compliant'
   work_restrictions = ['scheduling', 'payroll', 'patient_assignments']
END IF
```

## Summary

### What is "Locked Out"?
🔒 Employees who are **automatically restricted from work activities** because they are **overdue** on required CEU trainings.

### When Does It Happen?
⏰ When an employee's CEU due date has **passed** and they **haven't completed** required hours.

### What Gets Restricted?
- 📅 New shift scheduling
- 💰 Payroll processing  
- 🏥 New patient assignments

### How to Fix It?
✅ **Complete the required CEU training hours** - restrictions lift automatically!

### Is It Permanent?
❌ No! As soon as you complete requirements, lockout is removed immediately.

### Purpose?
🎯 To ensure all healthcare staff maintain required certifications for **patient safety** and **regulatory compliance**.

---

**Status**: ✅ Implemented and Active  
**Feature Type**: Automatic Compliance Enforcement  
**Last Updated**: November 5, 2025


