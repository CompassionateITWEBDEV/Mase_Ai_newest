# Document Upload Fix Guide

## Problem
Documents are not being inserted into the `application_form_documents` table due to a database constraint violation. The error shows:
```
new row for relation "application_form_documents" violates check constraint "application_form_documents_status_check"
```

## Root Cause
The database constraint on the `status` column is blocking inserts. The constraint should only allow: `'pending'`, `'verified'`, or `'rejected'`, but the database may have a different constraint or the constraint may be incorrectly configured.

## Solution

### Step 1: Run the SQL Fix Script
You **MUST** run the SQL script to fix the database constraint:

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of **`FIX_APPLICATION_FORM_DOCUMENTS_STATUS_CONSTRAINT_FINAL.sql`** (or the SIMPLE version)
4. Run the script

**Important**: If you get an error saying the constraint already exists, use the **FINAL** or **SIMPLE** version which properly drops the constraint first.

This will:
- Update any existing invalid status values to 'pending'
- Drop the old constraint (if it exists)
- Create the correct constraint that allows: 'pending', 'verified', 'rejected'

### Step 2: Verify the Fix
After running the SQL script, try uploading a document again. The upload should now work correctly.

## Code Changes Made

1. **Enhanced Error Handling**: Added detailed logging to help identify constraint issues
2. **Status Validation**: Explicitly set status to 'pending' with type safety
3. **Better Error Messages**: More helpful error messages that guide users to run the SQL fix

## Files Modified

- `app/api/applications/documents/upload/route.ts` - Enhanced error handling and validation
- `FIX_APPLICATION_FORM_DOCUMENTS_STATUS_CONSTRAINT.sql` - SQL script to fix the constraint

## Testing

After running the SQL script:
1. Try uploading a document through the application page
2. Check the browser console for any errors
3. Verify the document appears in the `application_form_documents` table in Supabase

## Notes

- The code now explicitly sets `status: 'pending'` for all new document uploads
- The SQL script handles edge cases and will work even if the constraint doesn't exist or has a different name
- All existing documents with invalid status values will be updated to 'pending'

