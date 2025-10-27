# Interview Data Debug - "Not specified" Issue

## 🐛 Problem

Interview details showing "Not specified" in applicant dashboard:
- Date: Not specified
- Time: Not specified
- Location: Not specified

---

## 🔍 Root Cause

The interview data (`interview_date`, `interview_time`, `interview_location`, `interviewer`) is not being loaded or doesn't exist in the database.

---

## ✅ Solution Steps

### **Step 1: Check Database Columns**

Run this in Supabase SQL Editor:
```sql
-- File: CHECK_INTERVIEW_COLUMNS.sql

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'job_applications' 
AND column_name IN (
  'interview_date',
  'interview_time', 
  'interview_location',
  'interviewer',
  'interview_notes'
);
```

### **Step 2: Check if Interview Data Exists**

```sql
SELECT 
    id,
    status,
    interview_date,
    interview_time,
    interview_location,
    interviewer,
    interview_notes
FROM job_applications
WHERE status = 'interview_scheduled'
LIMIT 5;
```

### **Step 3: Add Columns if They Don't Exist**

If columns are missing, run:
```sql
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS interview_date DATE,
ADD COLUMN IF NOT EXISTS interview_time TIME,
ADD COLUMN IF NOT EXISTS interview_location TEXT,
ADD COLUMN IF NOT EXISTS interviewer TEXT,
ADD COLUMN IF NOT EXISTS interview_notes TEXT;
```

---

## 📊 What I Fixed

### **1. Added Debug Logging** ✅
- Added console logging to see what data is being returned
- File: `app/api/applications/list/route.ts`

### **2. Enhance UI Display** ✅
- Already updated to show all interview details
- File: `app/applicant-dashboard/page.tsx` (lines 1960-2006)

---

## 🧪 Debugging Steps

1. **Open browser console**
2. **Navigate to My Applications tab**
3. **Look for logs** like:
   ```
   Sample application (first one): {
     id: "...",
     status: "interview_scheduled",
     interview_date: null,  ← Check this
     interview_time: null,  ← Check this
     interview_location: null,  ← Check this
     interviewer: null,  ← Check this
     interview_notes: null
   }
   ```

---

## ✅ Expected Behavior

After fixing, you should see:
```
┌─────────────────────────────────────────┐
│ 📅 Interview Scheduled                  │
├─────────────────────────────────────────┤
│ 📅 Date: Monday, December 25, 2024     │
│ 🕐 Time: 2:00 PM                       │
│ 📍 Location: Zoom Meeting              │
│ 👥 Interviewer: John Smith             │
└─────────────────────────────────────────┘
```

---

## 🔧 Next Steps

1. Run `CHECK_INTERVIEW_COLUMNS.sql` to verify columns exist
2. Check if interview data exists in database
3. If data exists but not showing:
   - Check browser console logs
   - Verify API response includes interview fields
4. If columns don't exist:
   - Run the ALTER TABLE command above
   - Re-schedule the interview from employer dashboard

---

**Status:** Debugging in progress  
**Files Modified:**
- `app/api/applications/list/route.ts` - Added debug logging
- `CHECK_INTERVIEW_COLUMNS.sql` - Database check script

