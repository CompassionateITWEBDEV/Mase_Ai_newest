# Fixing Reschedule Request Table Columns

## Problem
The `interview_reschedule_requests` table is missing the `proposed_date` column (and possibly others), causing the error:
```
Failed to create reschedule request: Could not find the 'proposed_date' column
```

## Solution

### Option 1: Quick Fix (Recommended)
Run this simple SQL in your Supabase SQL Editor:

```sql
ALTER TABLE interview_reschedule_requests 
ADD COLUMN IF NOT EXISTS proposed_date DATE;

ALTER TABLE interview_reschedule_requests 
ADD COLUMN IF NOT EXISTS proposed_time TIME;

ALTER TABLE interview_reschedule_requests 
ADD COLUMN IF NOT EXISTS original_date TIMESTAMP WITH TIME ZONE;
```

### Option 2: Complete Migration
Run the full migration from `scripts/040-3-fix-reschedule-table-columns.sql` in your Supabase SQL Editor.

## How to Run
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the SQL from Option 1 above
4. Click "Run" or press Ctrl+Enter
5. The columns will be added and the reschedule request functionality should work

## What This Fixes
- Adds `proposed_date` column (required)
- Adds `proposed_time` column (required)
- Adds `original_date` column (for tracking)
- Allows applicants to successfully submit reschedule requests

