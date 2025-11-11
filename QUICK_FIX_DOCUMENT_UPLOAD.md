# Quick Fix: Document Upload Constraint Error

## Problem
Error: `constraint "application_form_documents_status_check" for relation "application_form_documents" already exists`

## Solution

Run this **simple SQL script** in your Supabase SQL Editor:

```sql
-- Step 1: Update any invalid statuses
UPDATE public.application_form_documents 
SET status = 'pending' 
WHERE status IS NULL OR status NOT IN ('pending', 'verified', 'rejected');

-- Step 2: Drop the existing constraint
ALTER TABLE public.application_form_documents 
DROP CONSTRAINT IF EXISTS application_form_documents_status_check;

-- Step 3: Recreate with correct values
ALTER TABLE public.application_form_documents 
ADD CONSTRAINT application_form_documents_status_check 
CHECK (status IN ('pending', 'verified', 'rejected'));
```

## Steps

1. Open Supabase Dashboard → SQL Editor
2. Copy the SQL above
3. Paste and click "Run"
4. Try uploading a document again

The script will:
- ✅ Drop the old constraint (even if it exists)
- ✅ Create the correct constraint
- ✅ Fix any existing invalid data

After running this, document uploads should work!


