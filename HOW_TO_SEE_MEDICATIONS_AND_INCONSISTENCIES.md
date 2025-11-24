# How to See Medications and Inconsistencies

## Why They're Not Showing

The **Medication Management** and **Inconsistencies Detected** sections are not showing because:

1. ❌ The `medications` column doesn't exist in the database yet
2. ❌ Existing documents were processed BEFORE these features were added
3. ❌ The AI needs to re-analyze documents to extract this data

## Solution: 2 Steps

### Step 1: Add Database Column (Required)

**Open Supabase SQL Editor** and run this:

```sql
-- Add medications column
ALTER TABLE oasis_assessments 
ADD COLUMN IF NOT EXISTS medications JSONB DEFAULT '[]'::jsonb;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_oasis_assessments_medications 
ON oasis_assessments USING GIN (medications);
```

**How to do this:**
1. Go to your Supabase project
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Paste the SQL above
5. Click "Run" or press `Ctrl+Enter`

You should see: `Success. No rows returned`

### Step 2: Upload a New PDF

After running the migration:

1. Go to the OASIS upload page
2. Upload a new PDF (or re-upload an existing one)
3. Wait for processing to complete
4. View the optimization report

You should now see:
- ✅ **Medication Management** section (if medications are in the PDF)
- ✅ **Inconsistencies Detected** section (if conflicts are found)

## What About Existing Documents?

Existing documents in the database **will NOT** have medications or inconsistencies because they were processed before these features existed.

**Options:**
1. **Re-upload the PDF** - Easiest solution
2. **Keep existing data** - Medications/inconsistencies won't show for old documents

## How to Verify It's Working

### Check Console Logs

Open browser DevTools (F12) and look for:

```
[OASIS] 💊 Medications extracted: 3 [{name: "Metformin", ...}, ...]
[OASIS] ⚠️ Inconsistencies detected: 2 [{conflictType: "...", ...}, ...]
```

If you see:
- `Medications extracted: 0 []` → No medications in PDF or column doesn't exist
- `Inconsistencies detected: 0 []` → No conflicts found or old document

### Check Database

Run this in Supabase SQL Editor:

```sql
-- Check if column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'oasis_assessments' 
AND column_name = 'medications';

-- Check recent documents
SELECT 
  id, 
  file_name,
  medications,
  inconsistencies,
  created_at
FROM oasis_assessments 
ORDER BY created_at DESC 
LIMIT 5;
```

## Expected Results

### For New Documents (After Migration + Upload):
- ✅ Medications column has data: `[{name: "Metformin", dosage: "500mg", ...}]`
- ✅ Inconsistencies column has data: `[{conflictType: "...", severity: "high", ...}]`
- ✅ Sections appear in UI

### For Old Documents (Before Migration):
- ❌ Medications column: `null` or `[]`
- ❌ Inconsistencies column: `null` or `[]`
- ❌ Sections don't appear in UI (this is expected)

## Quick Test

1. **Run migration** (Step 1 above)
2. **Upload this test PDF**: Any OASIS form with medications listed
3. **Check console**: Should see medication count > 0
4. **View report**: Should see Medication Management section

## Troubleshooting

### "Column already exists" error
✅ Good! The column was already added. Proceed to Step 2.

### Sections still don't show after upload
1. Check console for medication/inconsistency counts
2. Check if PDF actually has medications (M2001-M2003 section)
3. Check if PDF has any inconsistencies to detect
4. Verify migration ran successfully

### Console shows "0" for both
This means:
- PDF doesn't have medications section, OR
- PDF doesn't have any detectable inconsistencies

This is **normal** for some documents.

## Summary

**Before Migration:**
```
Old Document → No medications column → API returns null → UI shows nothing
```

**After Migration + New Upload:**
```
New PDF → AI extracts medications → Stores in DB → API returns data → UI displays section
```

**The key**: You must run the migration AND upload a new PDF to see these sections!

