# Interview Status Message Fix

## ✅ What Was Changed

Changed the message from "Not specified" to "Awaiting schedule" for interview details that don't have data yet.

---

## 🔧 Changes

**Before:**
- Date: Not specified
- Time: Not specified
- Location: Not specified

**After:**
- Date: Awaiting schedule
- Time: Awaiting schedule
- Location: Awaiting schedule

---

## 🎯 Why This Is Better

"Awaiting schedule" clearly communicates that:
- The employer has accepted the application
- The interview details are pending
- The information will appear once scheduled

---

## 📊 Root Cause

The "Not specified" message appears because the interview data (`interview_date`, `interview_time`, `interview_location`) is null in the database. This happens when:

1. ✅ Employer accepts application → Status changes to `interview_scheduled`
2. ⏳ Employer has not yet set date/time/location → Fields are NULL
3. 📝 Once employer schedules with details → Fields get populated

---

## ✅ Next Steps

When the employer schedules the interview with details:
- ✅ Date will show (e.g., "Monday, December 25, 2024")
- ✅ Time will show (e.g., "2:00 PM")
- ✅ Location will show (e.g., "Zoom Meeting")

The message "Awaiting schedule" will be replaced with actual details.

---

**Status:** ✅ Improved messaging  
**Files Modified:**
- `app/applicant-dashboard/page.tsx` - Changed message from "Not specified" to "Awaiting schedule"

