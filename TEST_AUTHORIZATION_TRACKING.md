# Testing Authorization Tracking Feature

## Prerequisites
Before testing, ensure:
1. Development server is running (`npm run dev`)
2. Supabase is configured and connected
3. Database table `authorizations` exists
4. You're logged in as a user with authorization permissions

## Test Scenario 1: View Authorization Tab

### Steps:
1. Navigate to `/referral-management`
2. Look for "Authorization Tracking" tab next to "Referral Processing"
3. Click the "Authorization Tracking" tab

### Expected Results:
✅ Tab switches to Authorization Tracking view
✅ Shows 5 status tabs: Pending, In Review, Approved, Denied, Expired
✅ Shows search bar and priority filter
✅ Shows Refresh button
✅ Either shows authorizations or "No authorizations found" message

### If Tab Not Visible:
- Check user has `authorization.read` or `authorization.track` permission
- Verify current user role in header badge

## Test Scenario 2: Create Authorization via Referral

### Steps:
1. Go to "Referral Processing" tab
2. In the "Manual Referral Entry" form (right sidebar):
   - Patient Name: "John Doe"
   - Insurance Provider: "Medicare"
   - Insurance ID: "123456789"
   - Primary Diagnosis: "Post-operative care"
3. Click "Submit Referral"
4. Find the newly created referral in "New Referrals" section
5. Click "Request Prior Auth" button
6. Wait for success message
7. Switch to "Authorization Tracking" tab

### Expected Results:
✅ Referral created successfully
✅ Success message: "Prior authorization requested successfully!"
✅ Authorization appears in "Pending" tab
✅ Pending count shows (1)
✅ Authorization shows correct patient name
✅ Status badge shows "pending" in yellow

### Authorization Details Should Show:
- Patient Name: John Doe
- Insurance: Medicare
- Diagnosis: Post-operative care
- Priority badge
- Status badge
- "View Details" button

## Test Scenario 3: View Authorization Details

### Steps:
1. In Authorization Tracking tab, Pending section
2. Click "View Details" on an authorization

### Expected Results:
✅ Card expands to show detailed view
✅ Left section shows:
  - Authorization ID
  - Authorization Type (initial/recertification/additional_services)
  - Diagnosis Code (if available)
  - Assigned To (if assigned)
  - Estimated Reimbursement
✅ Requested Services section shows service badges
✅ Right section shows "Authorization Timeline"
✅ Timeline shows at least one entry: "Authorization request submitted"

## Test Scenario 4: Update Authorization Status (Write Permission Required)

### Steps:
1. Ensure you're logged in as a user with `authorization.write` permission
2. View authorization details (previous test)
3. Look for action buttons at bottom of details section
4. Click "Mark Approved"
5. Wait for success message

### Expected Results:
✅ Shows success alert: "Authorization approved successfully!"
✅ Authorization moves from "Pending" to "Approved" tab
✅ Status badge changes to green "approved"
✅ Timeline updates with new entry
✅ Approved tab count increases by 1
✅ Pending tab count decreases by 1

## Test Scenario 5: Search and Filter

### Steps:
1. Have at least 2-3 authorizations created
2. In search box, type partial patient name
3. In priority filter dropdown, select a priority level
4. Click "Refresh" button

### Expected Results:
✅ Search filters authorizations by patient name
✅ Priority filter shows only matching priorities
✅ Refresh button reloads data from database
✅ Filter and search work together

## Test Scenario 6: Read-Only Mode

### Steps:
1. Log in as a user WITHOUT `authorization.write` permission
2. Navigate to Authorization Tracking tab
3. View authorization details

### Expected Results:
✅ Can see all authorizations
✅ Can view all details
✅ NO action buttons appear (Mark Approved, Mark Denied, etc.)
✅ Shows info message: "You have view-only access to authorization tracking"

## Test Scenario 7: Error Handling

### Test A: Missing Database Table
1. Temporarily drop authorizations table in Supabase
2. Refresh Authorization Tracking tab

**Expected:**
✅ Shows red error alert
✅ Error message includes troubleshooting steps
✅ Shows "Try Again" button
✅ Suggests running setup SQL script

### Test B: Network Error
1. Disconnect from internet or stop dev server
2. Click Refresh in Authorization Tracking tab

**Expected:**
✅ Shows error message
✅ Error is descriptive (connection failed, etc.)
✅ Can retry when connection restored

## Test Scenario 8: Empty States

### Steps:
1. Ensure database has no authorizations
2. Visit each status tab (Pending, In Review, Approved, etc.)

### Expected Results:
✅ Each tab shows friendly empty state message
✅ Pending tab shows instructions on how to create authorization
✅ Empty state has icon and descriptive text
✅ No console errors

## Console Verification

### Browser Console Should Show:
```
Fetching authorizations...
Fetched authorizations: [array of data]
```

### Server Console Should Show:
```
=== Fetching authorizations ===
Query filters: {...}
✅ Fetched N authorizations
```

### Should NOT Show:
- ❌ Uncaught errors
- ❌ Warning about missing dependencies
- ❌ CORS errors
- ❌ 500 server errors

## Performance Checks

### Loading Times:
- Initial load: < 2 seconds
- Tab switch: < 500ms
- Status update: < 1 second
- Refresh: < 2 seconds

### Memory:
- No memory leaks on tab switching
- Proper cleanup on unmount

## Browser Compatibility

Test in:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if on Mac)

## Mobile Responsiveness

Test on mobile viewport:
- Search/filter controls stack vertically
- Cards display properly
- Tabs are scrollable if needed
- Details view is readable

## Integration Tests

### Test: Referral → Authorization Flow
1. Create referral
2. Request prior auth
3. Verify authorization created with correct data
4. Verify referral status updated to "Pending Auth"
5. Approve authorization
6. Verify can track back to original referral

### Test: Multiple Users
1. Create authorization as User A
2. Log out, log in as User B
3. Verify User B can see authorization
4. If User B has write permission, verify can update

## Regression Testing

After any code changes, verify:
- [ ] All tabs still load
- [ ] Search still works
- [ ] Filter still works
- [ ] Details expand/collapse
- [ ] Status updates work
- [ ] Timeline displays correctly
- [ ] Empty states show properly
- [ ] Error handling works
- [ ] Permissions are respected

## Known Limitations

1. **Pagination**: Not yet implemented - all authorizations load at once
   - May be slow if > 100 authorizations
   - Consider adding pagination for large datasets

2. **Real-time Updates**: Component doesn't auto-refresh
   - Need to click Refresh button to see changes
   - Consider adding real-time subscriptions

3. **Bulk Operations**: No bulk approve/deny
   - Each authorization must be updated individually

4. **Export**: No export to CSV/PDF feature yet

## Troubleshooting Test Failures

### If tabs don't show counts:
- Check `authsByStatus` object in component
- Verify filter logic is working
- Check status field matches expected values

### If details don't expand:
- Check `selectedAuth` state
- Verify click handler on "View Details" button
- Check console for React errors

### If updates don't save:
- Check API endpoint `/api/authorizations/[id]` is working
- Verify PATCH request succeeds
- Check database constraints
- Verify timeline JSON is valid

### If search doesn't work:
- Check `searchTerm` state updates
- Verify filter function includes `.toLowerCase()`
- Check patient_name field exists in data

## Success Criteria

All tests pass when:
- ✅ Tab loads without errors
- ✅ Can view all authorizations
- ✅ Can filter and search
- ✅ Can view details
- ✅ Can update status (with permission)
- ✅ Timeline tracks all changes
- ✅ Empty states are helpful
- ✅ Error messages are clear
- ✅ Read-only mode works correctly
- ✅ No console errors or warnings

## Last Updated
November 17, 2025



