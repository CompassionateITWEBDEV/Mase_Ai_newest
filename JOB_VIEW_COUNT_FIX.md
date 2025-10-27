# Job View Count Fix - One View Per Applicant Per Job

## Problem

Job views were counting multiple times if the same applicant viewed the job post multiple times. This inflated the view count.

**Desired Behavior:**
- Each applicant account should count as 1 view per job post
- View count = Number of unique applicants who viewed the job
- Purpose: Track how many different applicants showed interest in the job

---

## Root Cause

The query to check if a user had already viewed a job was using incorrect syntax:
```typescript
// OLD (INCORRECT):
.or(`${user_type}_id.eq.${user_id}`)
.single()  // This throws error when no rows found
```

This caused issues:
1. `.or()` syntax was not working correctly with dynamic column names
2. `.single()` throws error when no rows found, causing confusion
3. Check wasn't properly detecting existing views

---

## Solution

### Fixed the duplicate view check query:

```typescript
// NEW (CORRECT):
let query = supabase
  .from('job_views')
  .select('id, viewed_at')
  .eq('job_posting_id', job_posting_id)

// Add the appropriate user ID filter based on type
if (user_type === 'applicant') {
  query = query.eq('applicant_id', user_id)
} else if (user_type === 'employer') {
  query = query.eq('employer_id', user_id)
} else if (user_type === 'staff') {
  query = query.eq('staff_id', user_id)
}

const { data: existing, error: checkError } = await query.limit(1)
existingView = existing && existing.length > 0 ? existing[0] : null
```

### Key Improvements:

1. ✅ **Proper column filtering** - Uses specific `.eq()` for each user type
2. ✅ **Error handling** - Uses `.limit(1)` instead of `.single()` to avoid errors
3. ✅ **Better logging** - Added detailed console logs to track the flow
4. ✅ **Early return** - Returns immediately if user already viewed (prevents increment)

---

## How It Works Now

### View Tracking Flow:

1. **Applicant views job post** → Frontend calls `/api/jobs/view`
2. **API checks** → Query `job_views` table for this specific job + applicant combo
3. **If already viewed** → Return success, **DON'T increment count**
4. **If new view** → 
   - Insert record in `job_views` table
   - Increment `job_postings.views_count` by 1
   - Return success with updated count

### Example Scenario:

**Job Post: "Senior Nurse"**

| Applicant | Views Job | Count | Result |
|-----------|-----------|-------|--------|
| Alice | 1st time | 1 → 2 | ✅ Count incremented |
| Bob | 1st time | 2 → 3 | ✅ Count incremented |
| Alice | 2nd time | 3 → 3 | ❌ **NO increment** (already viewed) |
| Alice | 3rd time | 3 → 3 | ❌ **NO increment** (already viewed) |
| Carol | 1st time | 3 → 4 | ✅ Count incremented |

**Final Count: 4** (3 unique applicants: Alice, Bob, Carol)

---

## Testing

### Test Cases:

1. ✅ **First view** → Should increment count
2. ✅ **Second view by same user** → Should NOT increment
3. ✅ **Different user views** → Should increment count
4. ✅ **Anonymous view** (no user_id) → Should still track (for future analysis)

### How to Verify:

1. Login as an applicant
2. View a job post
3. Check console logs for:
   ```
   👁️ Job view tracking request: {...}
   📊 Incrementing view count for job: {...}
   📈 Current view count: X, incrementing to X+1
   ✅ View count updated successfully
   ```
4. View the same job again
5. Check logs should show:
   ```
   👁️ Job view tracking request: {...}
   User has already viewed this job, skipping view count increment
   ```
6. Check the job's view count - should be the same

---

## Database Structure

### `job_views` Table:
```sql
job_posting_id  | applicant_id | employer_id | staff_id | viewed_at          | ip_address
----------------|--------------|-------------|----------|--------------------|------------
abc-123         | user-456     | NULL        | NULL     | 2025-01-15 10:30   | 192.168.1.1
abc-123         | user-789     | NULL        | NULL     | 2025-01-15 11:00   | 192.168.1.2
abc-123         | user-456     | NULL        | NULL     | 2025-01-15 14:00   | 192.168.1.1  (same user, different time - no increment)
```

### `job_postings` Table:
```sql
id      | title           | views_count
--------|-----------------|------------
abc-123 | Senior Nurse    | 2           (user-456 and user-789)
```

---

## Console Logs for Debugging

When working correctly, you'll see:

**First View:**
```
👁️ Job view tracking request: { job_posting_id: 'abc-123', user_type: 'applicant', user_id: 'user-456' }
📊 Incrementing view count for job: abc-123
📈 Current view count: 0, incrementing to 1
✅ View count updated successfully
```

**Duplicate View:**
```
👁️ Job view tracking request: { job_posting_id: 'abc-123', user_type: 'applicant', user_id: 'user-456' }
User has already viewed this job, skipping view count increment
```

---

## Benefits

✅ **Accurate metrics** - View count reflects unique applicants  
✅ **Better analytics** - Know how many different people viewed your job  
✅ **Prevents inflation** - No double counting from same user  
✅ **Better insights** - Compare views vs applications to see conversion rates  

---

## Files Modified

- `app/api/jobs/view/route.ts` - Fixed duplicate view checking logic

---

**Status:** ✅ Fixed and Tested

