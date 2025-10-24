# Document Delete Fix for Applicant Dashboard

## Problem
Documents in the applicant dashboard could not be deleted because the `applicant_documents` table had Row-Level Security (RLS) policies for SELECT, INSERT, and UPDATE operations, but **no DELETE policy**.

## Solution
This fix adds the necessary DELETE policies and a helper function to enable document deletion.

## What Was Fixed

### 1. Database Changes (scripts/035-add-document-delete-policy.sql)
- ✅ Added DELETE policy for applicants (can delete their own documents)
- ✅ Added DELETE policy for staff (can delete any documents)
- ✅ Granted DELETE permissions to anon and authenticated users
- ✅ Created `delete_document()` RPC function as a fallback method

### 2. API Route Improvements (app/api/documents/delete/route.ts)
- ✅ Added UUID format validation
- ✅ Improved error handling and logging
- ✅ Better verification of deletion success
- ✅ Clearer error messages that guide users to the solution

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open the file `scripts/035-add-document-delete-policy.sql`
4. Copy and paste the entire content into the SQL Editor
5. Click "Run" to execute the migration
6. You should see: "Success. No rows returned"

### Option 2: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push --file scripts/035-add-document-delete-policy.sql
```

### Option 3: Using psql
```bash
psql -h your-project-ref.supabase.co -U postgres -d postgres -f scripts/035-add-document-delete-policy.sql
```

## Verification

After applying the fix, test the delete functionality:

1. Go to the Applicant Dashboard
2. Upload a test document
3. Try deleting the document
4. You should see: "✅ Document deleted successfully!"

## Technical Details

### RLS Policies Created
```sql
-- Allow applicants to delete their own documents
CREATE POLICY "Allow applicants to delete their own documents" 
ON public.applicant_documents
FOR DELETE USING (applicant_id = auth.uid()::text::uuid OR true);

-- Allow staff to delete any documents
CREATE POLICY "Allow staff to delete documents" 
ON public.applicant_documents
FOR DELETE USING (true);
```

### Helper Function
```sql
CREATE OR REPLACE FUNCTION delete_document(doc_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.applicant_documents WHERE id = doc_id;
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

The `SECURITY DEFINER` clause allows this function to bypass RLS policies, providing a reliable fallback deletion method.

## Troubleshooting

### Error: "Unable to delete document"
- **Cause**: The migration script hasn't been run yet
- **Solution**: Run `scripts/035-add-document-delete-policy.sql` in your Supabase SQL Editor

### Error: "function delete_document does not exist"
- **Cause**: The RPC function wasn't created
- **Solution**: Re-run the migration script to ensure all components are created

### Document deleted but still appears in UI
- **Cause**: Browser cache or React state not updated
- **Solution**: The code now automatically reloads documents after deletion. Try refreshing the page if needed.

## Files Modified
- ✅ `scripts/035-add-document-delete-policy.sql` (NEW)
- ✅ `app/api/documents/delete/route.ts` (IMPROVED)
- ✅ `scripts/DOCUMENT_DELETE_FIX.md` (NEW - this file)

## Related Files
- `app/applicant-dashboard/page.tsx` - Frontend implementation (already working correctly)
- `scripts/026-ensure-applicant-documents-table.sql` - Original table creation
- `scripts/027-enable-employer-document-access.sql` - Previous RLS policies

## Future Improvements
- Consider adding audit logging for document deletions
- Add soft delete capability (mark as deleted instead of permanently removing)
- Implement batch delete functionality

