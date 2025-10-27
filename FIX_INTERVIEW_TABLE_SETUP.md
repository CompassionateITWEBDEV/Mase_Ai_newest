# Fix Interview Schedules Table Issue

## Problem
"Failed to create interview schedule: undefined" error

## Solution

### Step 1: Check if table exists in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Table Editor**
3. Look for `interview_schedules` table

### Step 2: If table doesn't exist, run the migration

**Option A: Run via Supabase SQL Editor**

1. Go to Supabase Dashboard
2. Click on **SQL Editor**
3. Copy the contents of `scripts/039-create-interview-schedules-table.sql`
4. Paste and execute

**Option B: Run via terminal**

```bash
# Connect to your Supabase instance and run:
psql [your-connection-string] < scripts/039-create-interview-schedules-table.sql
```

### Step 3: Verify the table structure

The `interview_schedules` table should have these columns:

```sql
id                      UUID PRIMARY KEY
job_posting_id          UUID NOT NULL
applicant_id            UUID NOT NULL
employer_id             UUID NOT NULL
interview_date          TIMESTAMP WITH TIME ZONE NOT NULL
interview_type          VARCHAR(50) NOT NULL DEFAULT 'video'
interview_location      TEXT (nullable)
meeting_link            TEXT (nullable)
interview_notes         TEXT (nullable)
status                  VARCHAR(20) NOT NULL DEFAULT 'scheduled'
duration_minutes        INTEGER DEFAULT 60
interviewer_name        VARCHAR(255) (nullable)
interviewer_email       VARCHAR(255) (nullable)
created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
created_by              UUID (nullable)
```

### Step 4: Quick Test SQL

Run this in Supabase SQL Editor to check:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'interview_schedules'
ORDER BY ordinal_position;
```

### Step 5: If table exists but missing columns

Run this migration to add missing columns:

```sql
-- Add missing columns if they don't exist
ALTER TABLE interview_schedules 
ADD COLUMN IF NOT EXISTS interviewer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS interviewer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS meeting_link TEXT,
ADD COLUMN IF NOT EXISTS interview_location TEXT,
ADD COLUMN IF NOT EXISTS interview_notes TEXT;

-- Update default for duration_minutes
ALTER TABLE interview_schedules 
ALTER COLUMN duration_minutes SET DEFAULT 60;
```

## Debugging

If you're still getting errors, check the console logs. The error should now show:
- Exact error message
- Error hint from database
- Error details
- Data being inserted

Look for messages like:
- "column X does not exist"
- "relation interview_schedules does not exist"
- "not null violation"

## After Fix

Once the table is set up correctly:
1. Try scheduling an interview again
2. Check console logs for detailed error info if it fails
3. The interview should be created successfully

