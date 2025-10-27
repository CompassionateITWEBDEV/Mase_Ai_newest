# Fix RLS Error for Interview Reschedule Requests

## Error Message
```
Failed to send reschedule request: Failed to create reschedule request: new row violates row-level security policy for table "interview_reschedule_requests"
```

## Cause
The RLS (Row Level Security) policies were blocking the API from inserting reschedule requests when using the service role key.

## Solution

### Step 1: Run the Fix Script
Run this SQL in your Supabase SQL Editor:

**File:** `scripts/040-1-fix-rls-policies.sql`

This script will:
- Drop existing RLS policies
- Recreate them with `service_role` bypass
- Allow the API to insert reschedule requests

### Step 2: Verify
After running the script, try the reschedule feature again from the applicant dashboard.

## What Was Fixed

### RLS Policies Updated
All policies now include `auth.role() = 'service_role'` OR condition:
- ✅ Employers can view their reschedule requests
- ✅ Applicants can view their reschedule requests  
- ✅ Applicants can insert reschedule requests
- ✅ Employers can update their reschedule requests

### How It Works Now
1. API uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
2. RLS policies allow `service_role` OR matching user IDs
3. Reschedule requests can be created successfully

## Alternative: Disable RLS (NOT RECOMMENDED)
If you still have issues, you can temporarily disable RLS for testing:

```sql
ALTER TABLE interview_reschedule_requests DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning:** This is not secure for production. Only use for testing.

## Summary
The fix allows the API (with service_role) to insert reschedule requests while still maintaining security for regular users. All policies now check for service_role first, then validate user ownership.

