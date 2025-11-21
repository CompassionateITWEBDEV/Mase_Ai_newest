# Authorization Tracking Troubleshooting Guide

## Overview
This guide helps you troubleshoot issues with the Authorization Tracking feature in the Referral Management page.

## Common Issues and Solutions

### 1. Authorization Tab Not Loading / Showing Errors

#### Symptoms:
- Authorization tracking tab shows an error message
- "Database error" appears when clicking the tab
- Spinner shows indefinitely

#### Solutions:

**A. Check Database Table Exists**
1. Open Supabase Dashboard
2. Go to Table Editor
3. Look for `authorizations` table
4. If missing, run: `RUN_THIS_NOW_TO_FIX.sql`

**B. Verify Environment Variables**
1. Check your `.env.local` file contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
2. Get the Service Role Key from: Supabase Dashboard > Settings > API
3. Restart your development server after adding/changing env vars

**C. Run Database Setup Script**
```sql
-- Run this in Supabase SQL Editor
-- File: RUN_THIS_NOW_TO_FIX.sql
```

### 2. No Authorizations Showing (But No Error)

#### Symptoms:
- Tab loads successfully
- Shows "No authorizations found" message
- All status tabs show (0)

#### This is Normal When:
- You haven't created any authorization requests yet
- This is a fresh installation

#### To Create Test Data:
1. Go to "Referral Processing" tab
2. Create a manual referral using the form
3. Click "Request Prior Auth" on the referral
4. Authorization will appear in the Authorization Tracking tab

### 3. Authorization Tab Not Visible

#### Symptoms:
- Only see "Referral Processing" tab
- "Authorization Tracking" tab is missing

#### Cause:
User permissions - the current user doesn't have authorization tracking permissions

#### Solution:
Check the user's role has authorization permissions:
```typescript
// In lib/auth.ts
// User needs one of these permissions:
- authorization.read
- authorization.track
- authorization.write
```

### 4. Can View But Can't Update Authorizations

#### Symptoms:
- Can see authorizations
- No action buttons appear (Approve, Deny, etc.)
- Shows as "read-only"

#### Cause:
User has view permission but not management permission

#### Solution:
User needs `authorization.write` permission to manage authorizations.

### 5. API Errors When Fetching Data

#### Symptoms:
- Console shows "Failed to fetch authorizations"
- Network tab shows 500 errors
- API endpoint returns error

#### Debugging Steps:

**A. Check Browser Console**
```javascript
// Open browser DevTools (F12)
// Look for error messages like:
"Database error: relation 'authorizations' does not exist"
"Missing SUPABASE_SERVICE_ROLE_KEY"
```

**B. Check Server Logs**
```bash
# In your terminal where dev server is running
# Look for:
"❌ Supabase error:"
"Missing environment variable"
```

**C. Test API Directly**
```bash
# Test the API endpoint
curl http://localhost:3000/api/authorizations
```

### 6. Updates Not Saving

#### Symptoms:
- Click "Mark Approved" but status doesn't change
- Changes revert after refresh
- Shows "Failed to update authorization" error

#### Solutions:

**A. Check Database Permissions**
1. Ensure RLS policies allow updates
2. Verify service role key has access
3. Check foreign key constraints are satisfied

**B. Verify Timeline Updates**
The authorization timeline should be updated with each change. Check:
```javascript
// Timeline entry format:
{
  date: "2024-01-01T00:00:00Z",
  action: "Status updated to approved",
  user: "Staff Nurse",
  notes: "Optional notes"
}
```

### 7. Performance Issues / Slow Loading

#### Symptoms:
- Tab takes long time to load
- Spinner shows for several seconds
- Page becomes unresponsive

#### Solutions:

**A. Check Data Volume**
```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) FROM authorizations;
```
If count > 1000, consider pagination

**B. Verify Indexes Exist**
```sql
-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename = 'authorizations';

-- Should see:
-- idx_authorizations_status
-- idx_authorizations_patient_name
-- idx_authorizations_priority
```

**C. Add Missing Indexes**
```sql
CREATE INDEX IF NOT EXISTS idx_authorizations_status 
ON authorizations(status);

CREATE INDEX IF NOT EXISTS idx_authorizations_patient_name 
ON authorizations(patient_name);
```

## Quick Diagnostic Checklist

Run through this checklist to identify issues:

- [ ] Database table `authorizations` exists
- [ ] Environment variable `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] Development server restarted after env changes
- [ ] User has authorization view/manage permissions
- [ ] API endpoint `/api/authorizations` returns 200 status
- [ ] Browser console shows no errors
- [ ] Server logs show no errors

## Testing the Feature

### Manual Test Steps:

1. **Create a Referral**
   - Go to Referral Management page
   - Fill out manual referral form
   - Submit referral

2. **Request Authorization**
   - Click "Request Prior Auth" on the referral
   - Should see success message

3. **View Authorization**
   - Click "Authorization Tracking" tab
   - Should see the authorization in "Pending" tab
   - Authorization count should show (1)

4. **Update Authorization** (if you have write permission)
   - Click "View Details" on an authorization
   - Click "Mark Approved"
   - Should see success alert
   - Status should update to "Approved"
   - Should appear in "Approved" tab

5. **Check Timeline**
   - Expand authorization details
   - View "Authorization Timeline" section
   - Should see timeline entries for each action

## Getting Help

If you're still experiencing issues:

1. **Check Console Logs**
   - Browser DevTools Console (F12)
   - Server Terminal Output

2. **Check Database**
   - Supabase Dashboard > Table Editor
   - View `authorizations` table structure and data

3. **Verify API Response**
   - Network tab in DevTools
   - Look at `/api/authorizations` response

4. **Review Code**
   - `components/authorization-tracker.tsx` - Frontend component
   - `app/api/authorizations/route.ts` - Backend API
   - `lib/supabase/server.ts` - Database client

## Additional Resources

- **Database Schema**: `scripts/077-create-authorizations-table.sql`
- **Quick Fix Script**: `RUN_THIS_NOW_TO_FIX.sql`
- **Component Source**: `components/authorization-tracker.tsx`
- **API Route**: `app/api/authorizations/route.ts`

## Recent Fixes Applied

✅ Fixed React hooks dependency warnings with useCallback
✅ Added comprehensive error handling and user feedback
✅ Improved empty state messages with helpful instructions
✅ Added troubleshooting guidance in error messages
✅ Enhanced loading states and error recovery

## Last Updated
November 17, 2025




