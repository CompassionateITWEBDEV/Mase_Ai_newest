# Fixing Reschedule Request Issues

## Problems Encountered
1. Missing columns: The `interview_reschedule_requests` table was missing the `proposed_date` column
2. RLS policy violation: Row-level security policies were blocking inserts

### Error Messages:
```
Failed to create reschedule request: Could not find the 'proposed_date' column
Failed to create reschedule request: new row violates row-level security policy
```

## Solution

### Step 1: Add Missing Columns
Run this SQL in your Supabase SQL Editor:

```sql
ALTER TABLE interview_reschedule_requests 
ADD COLUMN IF NOT EXISTS proposed_date DATE;

ALTER TABLE interview_reschedule_requests 
ADD COLUMN IF NOT EXISTS proposed_time TIME;

ALTER TABLE interview_reschedule_requests 
ADD COLUMN IF NOT EXISTS original_date TIMESTAMP WITH TIME ZONE;
```

### Step 2: Fix RLS Policies
If you're getting RLS policy violation errors, run the SQL from `scripts/fix-reschedule-rls.sql`:

```sql
DROP POLICY IF EXISTS "Users can view their own reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Users can insert their own reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Users can update their own reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Service role can access all reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Employers can view their reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Applicants can view their reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Applicants can insert reschedule requests" ON interview_reschedule_requests;
DROP POLICY IF EXISTS "Employers can update their reschedule requests" ON interview_reschedule_requests;

CREATE POLICY "Service role bypass RLS" 
  ON interview_reschedule_requests FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view their own reschedule requests" 
  ON interview_reschedule_requests FOR SELECT 
  USING (
    auth.role() = 'service_role' OR
    employer_id::text = auth.uid()::text OR
    applicant_id::text = auth.uid()::text
  );

CREATE POLICY "Applicants can insert reschedule requests" 
  ON interview_reschedule_requests FOR INSERT 
  WITH CHECK (
    auth.role() = 'service_role' OR
    applicant_id::text = auth.uid()::text
  );

CREATE POLICY "Employers can update reschedule requests" 
  ON interview_reschedule_requests FOR UPDATE 
  USING (
    auth.role() = 'service_role' OR
    employer_id::text = auth.uid()::text
  );
```

## How to Run
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the SQL from Step 1 above
4. Click "Run" or press Ctrl+Enter
5. Then repeat for Step 2 if needed
6. The reschedule request functionality should now work

## What This Fixes
- Adds `proposed_date` column (required)
- Adds `proposed_time` column (required)
- Adds `original_date` column (for tracking)
- Allows service role to bypass RLS policies
- Allows applicants to successfully submit reschedule requests

## Additional Notes
The API route now enforces that the `SUPABASE_SERVICE_ROLE_KEY` environment variable is set, and it will return a clear error if it's missing. This helps debug configuration issues.
