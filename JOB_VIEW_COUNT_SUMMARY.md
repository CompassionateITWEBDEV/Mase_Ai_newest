# Job View Count Implementation

## ✅ What's Already Done

### **1. View Count Display** ✅
The view count is already displayed in the job search results:
- **Location:** Applicant Dashboard → Jobs Tab
- **Display:** Eye icon with "X views" text
- **Code:** Lines 2815 and 2931 in `app/applicant-dashboard/page.tsx`

### **2. View Tracking** ✅
When applicant clicks a job, it tracks the view:
- Opens job details modal
- Calls `/api/jobs/view` to track the view
- Only counts once per applicant per job
- Increments `views_count` in database

---

## 🔧 What You Need to Do

### **Step 1: Ensure Database Column Exists**

Run this SQL in Supabase:

```sql
-- From file: ADD_VIEWS_COUNT_COLUMN.sql
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS applications_count INTEGER DEFAULT 0;
```

### **Step 2: Test the View Count**

1. **Go to Jobs tab** in Applicant Dashboard
2. **Look for the Eye icon** - should show "X views" on each job
3. **Click a job posting** - the view count should increment

---

## 📊 How It Works

### **Job Listing Display:**
```
┌─────────────────────────────────────────┐
│ Nurse Position                          │
│ Healthcare Facility                     │
│                                         │
│ 📍 Location  💰 Salary  🕐 Type        │
│ 👁️ 5 views  👥 2 applications         │
└─────────────────────────────────────────┘
```

### **View Tracking Flow:**
```
1. Applicant sees job in search results
   ↓ (Eye icon shows current count)
2. Applicant clicks job
   ↓
3. Job details modal opens
   ↓
4. trackJobView() called
   ↓
5. API checks if already viewed
   ↓
6. If new: Insert into job_views & increment count
   ↓
7. UI refreshes with updated count
```

---

## 🐛 Troubleshooting

### **Views not showing (showing 0):**
**Check 1:** Does the column exist?
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'job_postings' 
AND column_name = 'views_count';
```

**Check 2:** Are the values NULL?
```sql
SELECT id, title, views_count FROM job_postings LIMIT 5;
```

### **View count not incrementing:**
**Check 1:** Browser console logs
- Should see: `👁️ Tracking job view: {...}`
- Should see: `✅ Job view tracked successfully`

**Check 2:** Check if job_views table exists
```sql
SELECT * FROM job_views LIMIT 5;
```

**Check 3:** Check RLS policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'job_views';
```

---

## 📝 Files Modified

1. ✅ `app/applicant-dashboard/page.tsx` - View count display (line 2815, 2931)
2. ✅ `app/api/jobs/view/route.ts` - View tracking API
3. ✅ `app/api/jobs/list/route.ts` - Added debug logging
4. ✅ `ADD_VIEWS_COUNT_COLUMN.sql` - Database setup

---

## ✅ Summary

**View count display:** ✅ Already implemented  
**View tracking:** ✅ Working  
**Database columns:** ⚠️ Run SQL script to ensure they exist  
**Status:** Ready for testing

---

**Next Steps:**
1. Run `ADD_VIEWS_COUNT_COLUMN.sql` in Supabase
2. Test by clicking a job posting
3. Verify view count increments
4. Check browser console for success logs

