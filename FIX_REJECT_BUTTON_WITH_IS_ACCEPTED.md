# Fix Reject Button - Using is_accepted Column

## ❌ Problem

The reject button was not being disabled after accepting an application because it was checking the `notes` field, which was not a reliable way to track acceptance.

---

## ✅ Solution

Added a new database column `is_accepted` (BOOLEAN) to properly track if an application has been accepted for interview scheduling.

---

## 📝 Changes Made

### **1. Database Changes**

**File:** `ADD_IS_ACCEPTED_COLUMN.sql`

```sql
-- Add is_accepted column to track if application is accepted
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN DEFAULT FALSE;

-- Update existing applications where notes contains "Application accepted"
UPDATE job_applications 
SET is_accepted = TRUE 
WHERE notes LIKE '%Application accepted%';

-- Add comment
COMMENT ON COLUMN job_applications.is_accepted IS 
'Indicates if the application has been accepted for interview scheduling';
```

**Action Required:** Run this SQL in Supabase SQL Editor.

---

### **2. Frontend Changes - Accept Button Logic**

**File:** `app/employer-dashboard/page.tsx`

**Before:**
```typescript
// Used notes field
{application.status === 'pending' && (
  <Button onClick={() => updateApplicationStatus(..., 'Application accepted for interview scheduling')}>
    Accept Application
  </Button>
)}

{application.status === 'pending' && application.notes?.includes('Application accepted') && (
  <Button disabled>Accepted</Button>
)}
```

**After:**
```typescript
// Uses is_accepted field
{application.status === 'pending' && !application.is_accepted && (
  <Button onClick={() => handleAcceptApplication(application.id)}>
    Accept Application
  </Button>
)}

{application.status === 'pending' && application.is_accepted && (
  <Button disabled>Accepted</Button>
)}
```

---

### **3. New Function: handleAcceptApplication**

**File:** `app/employer-dashboard/page.tsx` (Lines 494-522)

```typescript
const handleAcceptApplication = async (applicationId: string) => {
  try {
    const response = await fetch('/api/applications/update-status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId,
        status: 'pending',
        is_accepted: true,  // ← Sets is_accepted = true
        notes: 'Application accepted for interview scheduling'
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (data.success) {
      console.log('✅ Application accepted successfully')
      loadApplications()
    } else {
      throw new Error(data.error || 'Failed to accept application')
    }
  } catch (error) {
    console.error('Error accepting application:', error)
    alert('Failed to accept application. Please try again.')
  }
}
```

---

### **4. Reject Button Logic Updated**

**File:** `app/employer-dashboard/page.tsx`

**Before:**
```typescript
disabled={... || (application.status === 'pending' && 
                  application.notes?.includes('Application accepted'))}
```

**After:**
```typescript
disabled={... || (application.status === 'pending' && 
                  application.is_accepted)}
```

**Now the reject button is properly disabled when:**
- Status is `rejected` ✅
- Status is `accepted` ✅
- Status is `hired` ✅
- Status is `pending` AND `is_accepted = true` ✅ ← NEW!

---

### **5. Schedule Interview Button Logic Updated**

**Before:**
```typescript
disabled={
  !(application.status === 'pending' && application.notes?.includes('Application accepted')) &&
  ...
}
```

**After:**
```typescript
disabled={
  !(application.status === 'pending' && application.is_accepted) &&
  ...
}
```

**Now the Schedule Interview button:**
- ✅ Enabled when `status = 'pending'` AND `is_accepted = true`
- ❌ Disabled for new applications (not accepted yet)

---

### **6. API Changes**

**File:** `app/api/applications/update-status/route.ts`

**Changes:**
```typescript
// Extract is_accepted from request
const { applicationId, status, notes, is_accepted } = await request.json()

// Add to updateData if provided
if (is_accepted !== undefined) {
  updateData.is_accepted = is_accepted
}
```

---

## 🧪 Testing

### **Step 1: Run SQL Migration**

1. Open Supabase SQL Editor
2. Copy contents of `ADD_IS_ACCEPTED_COLUMN.sql`
3. Run it
4. Verify: Column should exist with `DEFAULT FALSE`

### **Step 2: Test Accept Application**

1. Open application (status: `pending`, `is_accepted`: `false`)
2. Click "Accept Application"
3. Confirm
4. Check Supabase:
   - Status: `pending`
   - `is_accepted`: `true` ✅
   - Notes: "Application accepted for interview scheduling"

### **Step 3: Verify Reject Button**

1. After accepting, check reject button
2. Reject button should be **DISABLED** ✅
3. Check console: Should show `✅ Application accepted successfully`

### **Step 4: Verify Schedule Interview**

1. After accepting, check Schedule Interview button
2. Should be **ENABLED** ✅
3. Can now schedule interview

---

## 📊 Complete Flow

```
New Application
  Status: pending
  is_accepted: false
  Reject: ENABLED ✅
  Schedule Interview: DISABLED ❌
        ↓
Accept Application (click)
        ↓
Confirm
        ↓
Status: pending
is_accepted: true ✅  ← SET TO TRUE
Notes: "Application accepted for interview scheduling"
Reject: DISABLED ❌  ← NOW DISABLED
Schedule Interview: ENABLED ✅
        ↓
Schedule Interview
        ↓
Status: interview_scheduled
Reject: ENABLED ✅
```

---

## ✅ Summary

### **What Was Fixed:**

1. ✅ Added `is_accepted` column to database
2. ✅ Created `handleAcceptApplication` function
3. ✅ Updated Accept button to use `is_accepted`
4. ✅ Updated Reject button to check `is_accepted`
5. ✅ Updated Schedule Interview button to check `is_accepted`
6. ✅ Updated API to handle `is_accepted` parameter
7. ✅ Applied to both list and modal views

### **Result:**

- Reject button is now properly disabled after accepting application
- Uses database column instead of notes field (more reliable)
- Works in both application list and detail modal
- Persists correctly in Supabase

---

## 🚀 Action Required

**Run this SQL in Supabase:**
```sql
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN DEFAULT FALSE;

UPDATE job_applications 
SET is_accepted = TRUE 
WHERE notes LIKE '%Application accepted%';
```

**Then test the flow!** ✅

---

**Status:** ✅ Fixed
**Ready to Test:** ✅

