# Continuing Education & Compliance - Database Connections

## Database Schema Overview

This document shows exactly which database tables the Continuing Education & Compliance section connects to and what data flows between them.

---

## Table Connections Diagram

```
┌─────────────────────────────────────────────────────────────┐
│          Continuing Education & Compliance Page             │
│                 (app/continuing-education/page.tsx)         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Fetches Data
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              API: /api/continuing-education/data            │
│            (app/api/continuing-education/data/route.ts)     │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬──────────────┐
         │               │               │              │
         ↓               ↓               ↓              ↓
    ┌────────┐   ┌──────────────┐  ┌─────────┐  ┌──────────┐
    │ staff  │   │in_service_   │  │in_serv  │  │employee_ │
    │        │   │completions   │  │ice_enro │  │training_ │
    │        │   │              │  │llments  │  │requireme │
    │        │   │              │  │         │  │nts       │
    └────────┘   └──────────────┘  └─────────┘  └──────────┘
```

---

## Detailed Table Connections

### 1. **`staff` Table** → Employees

**What It Provides**:
- Employee basic information
- Name, email, department
- Role/credentials (RN, LPN, CNA, etc.)
- Active status

**How It's Used**:
```sql
SELECT id, name, email, role_id, credentials, department
FROM staff
WHERE is_active = true
```

**In UI**:
- Employee list in "Employee Tracking" tab
- Employee selection in upload certificate dialog
- Name display throughout the page

---

### 2. **`in_service_completions` Table** → CEU Certificates

**What It Provides**:
- Completed training records
- CEU hours earned
- Completion dates
- Certificate numbers
- Scores

**How It's Used**:
```sql
SELECT ic.*, ist.title, ist.category, ist.accreditation
FROM in_service_completions ic
JOIN in_service_trainings ist ON ic.training_id = ist.id
WHERE ic.employee_id = ?
```

**In UI**:
- Certificate list for each employee
- CEU hours calculation
- Completion history
- Certificate verification status

---

### 3. **`in_service_enrollments` Table** → Training Progress

**What It Provides**:
- Enrollment status (enrolled, in_progress, completed)
- Progress percentage
- Start dates
- Last accessed dates

**How It's Used**:
```sql
SELECT ie.*, ist.*
FROM in_service_enrollments ie
JOIN in_service_trainings ist ON ie.training_id = ist.id
WHERE ie.employee_id = ?
```

**In UI**:
- Progress bars
- In-progress training display
- Assigned training status
- Onboarding progress tracking

---

### 4. **`in_service_trainings` Table** → Training Courses

**What It Provides**:
- Training titles
- CEU hours available
- Categories
- Mandatory status
- Accreditation info

**How It's Used**:
```sql
SELECT *
FROM in_service_trainings
WHERE mandatory = true AND status = 'active'
```

**In UI**:
- Onboarding modules list
- Training details in completions
- CEU hour values
- Training categories

---

### 5. **`employee_training_requirements` Table** → Annual Requirements

**What It Provides**:
- Annual CEU requirement hours
- Completed hours tracking
- In-progress hours
- Compliance status
- Last training date

**How It's Used**:
```sql
SELECT *
FROM employee_training_requirements
WHERE employee_id = ? AND year = EXTRACT(YEAR FROM NOW())
```

**In UI**:
- Annual requirement display
- Progress toward requirements
- Compliance status calculation
- Remaining hours needed

---

## Data Flow Examples

### Example 1: Loading Employee Compliance Data

```
1. User opens /continuing-education page
   ↓
2. Page calls GET /api/continuing-education/data
   ↓
3. API queries:
   - staff table → Get active employees
   - in_service_completions → Get CEU certificates
   - in_service_enrollments → Get training progress
   - employee_training_requirements → Get annual requirements
   ↓
4. API calculates:
   - Completed hours (sum of CEU from completions)
   - Required hours (from role-based requirements)
   - Compliance status (based on progress vs deadline)
   - Work restrictions (if non-compliant)
   ↓
5. API returns formatted employee data
   ↓
6. Page displays:
   - Employee list with compliance badges
   - Statistics (compliant, at risk, due soon, non-compliant)
   - Certificate count
   - Progress bars
```

### Example 2: Uploading External Certificate

```
1. Admin clicks "Upload Certificate" button
   ↓
2. Fills form:
   - Selects employee (from staff table)
   - Enters course title
   - Enters provider
   - Enters completion date
   - Enters CEU hours earned
   - Optionally uploads file
   ↓
3. Form submits to POST /api/continuing-education/upload-certificate
   ↓
4. API processes:
   a. Validates employee exists in staff table
   b. Creates new in_service_trainings record (external course)
   c. Creates in_service_enrollments record (status: completed)
   d. Creates in_service_completions record (with CEU hours)
   e. Triggers update to employee_training_requirements table
   ↓
5. Automatic calculations:
   - Completed hours updated
   - Compliance status recalculated
   - Work restrictions removed if now compliant
   ↓
6. Page refreshes and shows updated CEU hours
```

### Example 3: Checking Onboarding Progress

```
1. Admin clicks on employee in "Onboarding" tab
   ↓
2. System checks:
   a. Gets all mandatory trainings (in_service_trainings WHERE mandatory = true)
   b. Gets employee completions (in_service_completions WHERE employee_id = ?)
   c. Matches completions to mandatory trainings
   ↓
3. Calculates:
   - Total mandatory modules: 9
   - Completed modules: 7
   - Progress: 77%
   ↓
4. Displays:
   - Progress bar (77%)
   - "In Progress" badge
   - Work restrictions if incomplete
```

---

## SQL Queries Used

### Get Employee with CEU Data

```sql
-- Get employee info
SELECT s.id, s.name, s.email, s.credentials, s.role_id, s.department
FROM staff s
WHERE s.is_active = true;

-- Get their completions (CEU hours)
SELECT 
  ic.id,
  ic.employee_id,
  ic.completion_date,
  ic.ceu_hours_earned,
  ic.certificate_number,
  ic.score,
  ist.title,
  ist.category,
  ist.accreditation
FROM in_service_completions ic
JOIN in_service_trainings ist ON ic.training_id = ist.id
WHERE ic.employee_id = 'employee-uuid'
AND EXTRACT(YEAR FROM ic.completion_date) = EXTRACT(YEAR FROM NOW());

-- Get their current year requirements
SELECT *
FROM employee_training_requirements
WHERE employee_id = 'employee-uuid'
AND year = EXTRACT(YEAR FROM NOW());
```

### Calculate Compliance Status

```sql
-- Calculate total completed hours for current year
SELECT 
  employee_id,
  SUM(ceu_hours_earned) as total_completed_hours
FROM in_service_completions
WHERE employee_id = 'employee-uuid'
AND EXTRACT(YEAR FROM completion_date) = EXTRACT(YEAR FROM NOW())
GROUP BY employee_id;

-- Compare to requirement (determined by role)
-- RN = 25 hours/biennial
-- LPN = 20 hours/biennial
-- CNA = 12 hours/annual
-- etc.
```

### Get Mandatory Trainings (Onboarding)

```sql
SELECT *
FROM in_service_trainings
WHERE mandatory = true
AND status = 'active';

-- Check which ones employee has completed
SELECT training_id
FROM in_service_completions
WHERE employee_id = 'employee-uuid'
AND training_id IN (SELECT id FROM in_service_trainings WHERE mandatory = true);
```

---

## Automatic Updates

### Triggers and Functions in Database

The database has triggers that automatically update related tables:

1. **When `in_service_completions` record is created**:
   - `employee_training_requirements` table updates `completed_hours`
   - `employee_training_requirements` table recalculates `remaining_hours`
   - `employee_training_requirements` table updates `compliance_status`
   - `in_service_trainings` table increments `completed_count`

2. **When `in_service_enrollments` is updated to status='completed'**:
   - Can trigger creation of `in_service_completions` record
   - Updates employee progress tracking

3. **Compliance status calculation**:
   - Automatically determines if employee is:
     - `on_track` - Meeting requirements
     - `at_risk` - Behind schedule
     - `behind` - Significantly behind
     - `non_compliant` - Past deadline

---

## Real-Time Compliance Enforcement

### Work Restrictions Applied Automatically

When an employee becomes **non-compliant** (past CEU deadline):

```sql
-- System checks:
IF (days_until_due < 0 OR completed_hours < required_hours) THEN
  -- Apply restrictions:
  work_restrictions = ['scheduling', 'payroll', 'patient_assignments']
  
  -- User sees:
  - Red "NON-COMPLIANT" badge
  - Lock icon
  - "Work Restricted" status
  - Cannot be scheduled for shifts
  - Cannot receive payroll
  - Cannot be assigned patients
END IF
```

### Automatic Removal of Restrictions

When employee completes enough CEUs:

```sql
-- System checks:
IF (completed_hours >= required_hours) THEN
  -- Remove restrictions:
  work_restrictions = []
  compliance_status = 'on_track'
  
  -- User sees:
  - Green "COMPLIANT" badge
  - Unlock icon
  - Full work privileges restored
END IF
```

---

## Summary

### Tables Used:
1. ✅ `staff` - Employee information
2. ✅ `in_service_trainings` - Training courses
3. ✅ `in_service_enrollments` - Training progress
4. ✅ `in_service_completions` - CEU certificates
5. ✅ `employee_training_requirements` - Annual tracking

### Features Connected:
1. ✅ Employee compliance tracking
2. ✅ CEU hour calculation
3. ✅ Certificate management
4. ✅ Onboarding progress
5. ✅ Work restrictions
6. ✅ State requirements enforcement

### Data Flows:
- Real-time queries to database
- Automatic compliance calculations
- Live work restriction enforcement
- Certificate upload and storage
- Annual requirement tracking

**No Mock Data Remaining** - All data comes from actual database tables! 🎉


