# Job View Tracking Fix

## ✅ Problem Solved

**User Request:** "same logic sa profile view sa applicant when the employer want to see the applicant details"

When applicants view job postings, it should track views the same way that profile views work for applicants.

---

## 🔧 What Was Fixed

### **Before (WRONG):**
- Views were tracked automatically when loading the job list
- This inflated view counts (every time jobs loaded = views tracked)
- Views were not truly tracking when user actually viewed details

### **After (CORRECT):**
- Views are only tracked when user **clicks** on a job posting to view details
- Same logic as profile views - tracks actual engagement
- View count increments only when user opens the job details modal

---

## 📝 Changes Made

### **1. Removed Auto-Tracking from Job List**

**File:** `app/applicant-dashboard/page.tsx` (Line 671)

**Before:**
```typescript
if (data.success && data.jobs) {
  const jobsWithScores = ensureJobsHaveMatchScores(data.jobs)
  setJobs(jobsWithScores)
  if (applicantInfo) {
    generateRecommendedJobs(data.jobs)
  }
  // Track views for all loaded jobs ← WRONG!
  trackJobViews(data.jobs)
}
```

**After:**
```typescript
if (data.success && data.jobs) {
  const jobsWithScores = ensureJobsHaveMatchScores(data.jobs)
  setJobs(jobsWithScores)
  if (applicantInfo) {
    generateRecommendedJobs(data.jobs)
  }
  // DON'T track views automatically - only track when user clicks to view details ← CORRECT!
}
```

---

### **2. Enhanced View Tracking Function**

**File:** `app/applicant-dashboard/page.tsx` (Lines 1282-1319)

**Changes:**
1. ✅ Added detailed console logging
2. ✅ Added error handling with response check
3. ✅ Refresh job data after tracking to show updated count
4. ✅ Logs applicant info for debugging

**New Code:**
```typescript
const trackJobView = async (jobId: string) => {
  if (!applicantInfo?.id) {
    console.log('⚠️ Cannot track job view: No applicant ID')
    return
  }

  console.log('👁️ Tracking job view:', {
    jobId,
    applicantId: applicantInfo.id,
    applicantName: `${applicantInfo.firstName} ${applicantInfo.lastName}`
  })

  try {
    const response = await fetch('/api/jobs/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_posting_id: jobId,
        user_type: 'applicant',
        user_id: applicantInfo.id
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Job view tracking failed:', errorData)
      return
    }

    const data = await response.json()
    console.log('✅ Job view tracked successfully:', data)
    
    // Refresh job data to show updated view count
    refreshJobData()
  } catch (error) {
    console.error('❌ Error tracking job view:', error)
  }
}
```

---

### **3. Improved Refresh Function**

**File:** `app/applicant-dashboard/page.tsx` (Lines 1322-1343)

**Changes:**
1. ✅ Preserves search query when refreshing
2. ✅ Updates selected job if modal is open
3. ✅ Shows updated view count in real-time

**New Code:**
```typescript
const refreshJobData = async () => {
  try {
    const response = await fetch(`/api/jobs/list?status=active&limit=50${searchQuery ? `&search=${searchQuery}` : ''}`)
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.jobs) {
        const jobsWithScores = ensureJobsHaveMatchScores(data.jobs)
        setJobs(jobsWithScores)
        
        // Update selected job if it exists (shows updated view count in modal)
        if (selectedJob) {
          const updatedJob = jobsWithScores.find((job: any) => job.id === selectedJob.id)
          if (updatedJob) {
            setSelectedJob(updatedJob)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error refreshing job data:', error)
  }
}
```

---

## 🎯 How It Works Now

### **View Tracking Flow:**

```
1. Applicant views job list
        ↓
2. Jobs load, NO views tracked (just display)
        ↓
3. Applicant clicks on a job posting
        ↓
4. viewJobDetails(job) called
        ↓
5. Job details modal opens
        ↓
6. trackJobView(job.id) called
        ↓
7. API checks if user already viewed
        ↓
8. If NEW view:
   ├─ Insert into job_views table
   └─ Increment job_postings.views_count
        ↓
9. refreshJobData() called
        ↓
10. Updated view count shown in modal ✅
```

---

## 🔍 Console Logs (For Debugging)

When tracking a view, you'll see:
```
👁️ Tracking job view: {
  jobId: "abc-123",
  applicantId: "user-456", 
  applicantName: "John Doe"
}

// In server logs:
👁️ Job view tracking request: {...}
📊 Incrementing view count for job: abc-123
📈 Current view count: 5, incrementing to 6
✅ View count updated successfully

✅ Job view tracked successfully: {
  success: true,
  message: "Job view recorded successfully",
  view_count: 6
}
```

---

## 🧪 How to Test

### **Test 1: First View**
1. Login as applicant
2. Go to Jobs tab
3. Click on a job posting
4. **Check:** View count should increment

### **Test 2: Second View (Same Job)**
1. Close modal
2. Click on same job again
3. **Check:** View count should NOT increment (already viewed)

### **Test 3: Different Applicant**
1. Login as different applicant
2. Click on same job
3. **Check:** View count should increment (different user)

### **Test 4: Check in Employer Dashboard**
1. Login as employer
2. View job posting details
3. **Check:** Should see correct view count

---

## 📊 Database

### **Tables Used:**
1. **`job_views`** - Tracks individual views per user
2. **`job_postings`** - Stores total view count (`views_count` column)

### **View Count Logic:**
- View count = Number of unique applicants who viewed the job
- Each applicant counts as 1 view (even if they view it multiple times)
- Similar to profile views for applicants

---

## ✅ Summary

| What | Before | After |
|------|--------|-------|
| **When tracked** | On list load | On click to view details |
| **Count accuracy** | Inflated | Accurate |
| **Logic** | Different from profile views | Same as profile views |
| **Real-time update** | No | Yes |
| **Console logs** | Basic | Detailed |

---

**Status:** ✅ FIXED  
**Files Modified:**
- `app/applicant-dashboard/page.tsx` - Fixed view tracking logic  
- `app/api/jobs/view/route.ts` - Already correct (no changes needed)

**Ready to Test:** ✅

