# Doctor Authentication - Test Checklist

## Pre-Testing Setup
- [ ] Database migration executed (`scripts/121-add-doctor-authentication.sql`)
- [ ] Supabase connection working
- [ ] Development server running

---

## Test Suite 1: Doctor Registration

### Test 1.1: Valid Registration
- [ ] Navigate to `/doctor-portal`
- [ ] Click "Sign Up" tab
- [ ] Fill all required fields with valid data
- [ ] Complete all 3 steps
- [ ] Check both terms checkboxes
- [ ] Click "Submit Application"
- [ ] **Expected:** Success toast appears
- [ ] **Expected:** Redirected to login screen after 2 seconds
- [ ] **Expected:** New record in `physicians` table

### Test 1.2: Email Validation
- [ ] Try to register with invalid email format (e.g., `notanemail`)
- [ ] **Expected:** Error toast: "Invalid email format"

### Test 1.3: Password Validation
- [ ] Try to register with password < 6 characters
- [ ] **Expected:** Error toast: "Password must be at least 6 characters"

### Test 1.4: Password Mismatch
- [ ] Enter different passwords in password and confirm password fields
- [ ] **Expected:** Error toast: "Passwords do not match"

### Test 1.5: NPI Validation
- [ ] Try to register with NPI that's not 10 digits (e.g., `123`)
- [ ] **Expected:** Error toast: "NPI must be 10 digits"

### Test 1.6: Duplicate Email
- [ ] Register a doctor with email `test@doctor.com`
- [ ] Try to register another doctor with same email
- [ ] **Expected:** Error toast: "Email already registered"

### Test 1.7: Duplicate NPI
- [ ] Register a doctor with NPI `1234567890`
- [ ] Try to register another doctor with same NPI
- [ ] **Expected:** Error toast: "NPI already registered"

---

## Test Suite 2: Doctor Login

### Test 2.1: Valid Login
- [ ] Navigate to `/doctor-portal`
- [ ] Ensure "Login" tab is selected
- [ ] Enter registered email and password
- [ ] Click "Login"
- [ ] **Expected:** Success toast: "Welcome back, Dr. [Name]!"
- [ ] **Expected:** Portal dashboard visible
- [ ] **Expected:** Doctor name in header
- [ ] **Expected:** Logout button visible
- [ ] **Expected:** `currentUser` in localStorage with `accountType: 'doctor'`

### Test 2.2: Invalid Email
- [ ] Try to login with unregistered email
- [ ] **Expected:** Error toast: "Invalid email or password"

### Test 2.3: Invalid Password
- [ ] Try to login with correct email but wrong password
- [ ] **Expected:** Error toast: "Invalid email or password"

### Test 2.4: Empty Fields
- [ ] Try to submit login form with empty email
- [ ] **Expected:** HTML5 validation prevents submission
- [ ] Try to submit login form with empty password
- [ ] **Expected:** HTML5 validation prevents submission

### Test 2.5: Inactive Account
- [ ] Set `is_active: false` for a doctor in database
- [ ] Try to login with that doctor's credentials
- [ ] **Expected:** Error toast: "Doctor account is inactive"

---

## Test Suite 3: Portal Access

### Test 3.1: Authenticated Access
- [ ] Login as doctor
- [ ] **Expected:** See 3 tabs: "Live Consultations", "Dashboard", "Availability"
- [ ] **Expected:** Can click and view all tabs
- [ ] **Expected:** Doctor name appears in header
- [ ] **Expected:** Logout button visible

### Test 3.2: Unauthenticated Access
- [ ] Clear localStorage
- [ ] Navigate to `/doctor-portal`
- [ ] **Expected:** See login/signup screen
- [ ] **Expected:** Portal content NOT visible
- [ ] **Expected:** Only "Login" and "Sign Up" tabs visible

### Test 3.3: Dashboard Stats
- [ ] Login as doctor
- [ ] Go to "Dashboard" tab
- [ ] **Expected:** See 3 stat cards:
  - Today's Consultations (number)
  - Today's Earnings (dollar amount)
  - Average Rating (decimal)

### Test 3.4: Availability Toggle
- [ ] Login as doctor
- [ ] Go to "Availability" tab
- [ ] **Expected:** See availability toggle component
- [ ] Toggle availability ON
- [ ] **Expected:** Status updates in database (`is_available: true`)

---

## Test Suite 4: Logout

### Test 4.1: Logout Functionality
- [ ] Login as doctor
- [ ] Click "Logout" button in header
- [ ] **Expected:** Success toast: "Logged Out"
- [ ] **Expected:** Returned to login/signup screen
- [ ] **Expected:** Portal content no longer visible
- [ ] **Expected:** `currentUser` removed from localStorage

### Test 4.2: Post-Logout Access
- [ ] After logout, try to navigate back
- [ ] **Expected:** Still see login/signup screen
- [ ] **Expected:** Cannot access portal content without re-login

---

## Test Suite 5: Session Persistence

### Test 5.1: Page Refresh
- [ ] Login as doctor
- [ ] Refresh the page (F5)
- [ ] **Expected:** Still logged in
- [ ] **Expected:** Portal content still visible
- [ ] **Expected:** `currentUser` still in localStorage

### Test 5.2: New Tab
- [ ] Login as doctor in one tab
- [ ] Open `/doctor-portal` in new tab
- [ ] **Expected:** Already logged in (if localStorage shared)
- [ ] **Expected:** Portal content visible

### Test 5.3: Browser Restart
- [ ] Login as doctor
- [ ] Close browser completely
- [ ] Reopen browser and navigate to `/doctor-portal`
- [ ] **Expected:** Need to login again (localStorage cleared)

---

## Test Suite 6: Integration with Telehealth

### Test 6.1: Consultation Visibility
- [ ] Login as doctor
- [ ] Set availability to ON
- [ ] Have a nurse create a consultation request
- [ ] Go to "Live Consultations" tab
- [ ] **Expected:** See pending consultation request
- [ ] **Expected:** See patient info, urgency, vital signs
- [ ] **Expected:** See "Accept" and "Decline" buttons

### Test 6.2: Accept Consultation
- [ ] Login as doctor
- [ ] View pending consultation
- [ ] Click "Accept & Start Video Call"
- [ ] **Expected:** Video call interface opens
- [ ] **Expected:** Consultation status updates to "accepted"
- [ ] **Expected:** Consultation removed from pending list

### Test 6.3: Decline Consultation
- [ ] Login as doctor
- [ ] View pending consultation
- [ ] Click "Decline"
- [ ] **Expected:** Consultation removed from list
- [ ] **Expected:** Status updated to "rejected" in database

### Test 6.4: Consultation Stats Update
- [ ] Login as doctor
- [ ] Complete a consultation
- [ ] Go to "Dashboard" tab
- [ ] **Expected:** "Today's Consultations" count increased
- [ ] **Expected:** "Today's Earnings" updated with compensation amount

---

## Test Suite 7: Database Verification

### Test 7.1: Registration Data
```sql
SELECT 
  id, first_name, last_name, email, npi, specialty, 
  is_active, telehealth_enabled, created_at
FROM physicians
WHERE email = 'your-test-email@test.com';
```
- [ ] **Expected:** Record exists with correct data
- [ ] **Expected:** `is_active: true`
- [ ] **Expected:** `telehealth_enabled: true`

### Test 7.2: Login Timestamp
```sql
SELECT id, email, last_login
FROM physicians
WHERE email = 'your-test-email@test.com';
```
- [ ] Login as doctor
- [ ] Run query
- [ ] **Expected:** `last_login` updated to current timestamp

### Test 7.3: Availability Status
```sql
SELECT id, email, is_available
FROM physicians
WHERE email = 'your-test-email@test.com';
```
- [ ] Toggle availability in portal
- [ ] Run query
- [ ] **Expected:** `is_available` matches portal toggle state

---

## Test Suite 8: Error Handling

### Test 8.1: Network Error (Registration)
- [ ] Disconnect internet
- [ ] Try to register
- [ ] **Expected:** Error toast with network error message

### Test 8.2: Network Error (Login)
- [ ] Disconnect internet
- [ ] Try to login
- [ ] **Expected:** Error toast with network error message

### Test 8.3: API Error
- [ ] Stop backend server
- [ ] Try to login
- [ ] **Expected:** Error toast with connection error

---

## Test Suite 9: UI/UX

### Test 9.1: Form Validation Feedback
- [ ] Try to submit registration with empty required fields
- [ ] **Expected:** HTML5 validation messages appear
- [ ] **Expected:** Form doesn't submit

### Test 9.2: Loading States
- [ ] Click "Login" button
- [ ] **Expected:** Button text changes to "Logging in..."
- [ ] **Expected:** Button disabled during request

### Test 9.3: Toast Notifications
- [ ] Perform various actions (login, logout, register)
- [ ] **Expected:** Appropriate toast notifications appear
- [ ] **Expected:** Toasts auto-dismiss after a few seconds

### Test 9.4: Responsive Design
- [ ] Test on mobile viewport (< 768px)
- [ ] **Expected:** Forms are readable and usable
- [ ] **Expected:** Buttons are tappable
- [ ] **Expected:** No horizontal scroll

---

## Test Suite 10: Edge Cases

### Test 10.1: Special Characters in Password
- [ ] Register with password containing special chars: `P@ssw0rd!123`
- [ ] **Expected:** Registration succeeds
- [ ] Try to login with same password
- [ ] **Expected:** Login succeeds

### Test 10.2: Long Bio Text
- [ ] Register with very long bio (> 1000 characters)
- [ ] **Expected:** Registration succeeds
- [ ] **Expected:** Bio stored correctly in database

### Test 10.3: Multiple Simultaneous Logins
- [ ] Login as same doctor in 2 different browsers
- [ ] **Expected:** Both sessions work independently
- [ ] Logout in one browser
- [ ] **Expected:** Other browser still logged in

---

## Test Results Summary

### Passed Tests: _____ / _____
### Failed Tests: _____ / _____
### Blocked Tests: _____ / _____

---

## Issues Found

| Test ID | Description | Severity | Status |
|---------|-------------|----------|--------|
| | | | |

---

## Notes

- Test Date: __________
- Tester: __________
- Environment: __________
- Browser: __________
- Database: __________

---

## Sign-Off

- [ ] All critical tests passed
- [ ] All high-priority tests passed
- [ ] Known issues documented
- [ ] Ready for production (with security enhancements)

**Tester Signature:** ___________________
**Date:** ___________________

