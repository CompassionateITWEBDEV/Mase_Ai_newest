# Doctor Authentication - Logging & Alerts Guide

## 🎯 Overview

Comprehensive logging and alerts have been added to the doctor registration system to help track the registration process and debug any issues.

---

## 📊 Logging Levels

### Backend Logs (API)
All logs are prefixed with `[DOCTOR REGISTRATION]` for easy filtering.

#### ✅ Success Logs (Green)
```
✅ [DOCTOR REGISTRATION] All validations passed
✅ [DOCTOR REGISTRATION] Email is unique
✅ [DOCTOR REGISTRATION] NPI is unique
✅ [DOCTOR REGISTRATION] Doctor successfully inserted into database!
🎉 [DOCTOR REGISTRATION] New doctor created: {...}
```

#### ❌ Error Logs (Red)
```
❌ [DOCTOR REGISTRATION] Validation failed: Missing required fields
❌ [DOCTOR REGISTRATION] Invalid NPI format: 123
❌ [DOCTOR REGISTRATION] Invalid email format: notanemail
❌ [DOCTOR REGISTRATION] Password too short
❌ [DOCTOR REGISTRATION] Email already exists: doctor@test.com
❌ [DOCTOR REGISTRATION] NPI already exists: 1234567890
❌ [DOCTOR REGISTRATION] Database insert error: {...}
❌ [DOCTOR REGISTRATION] Unexpected error occurred: {...}
```

#### 🔍 Info Logs (Blue)
```
🏥 [DOCTOR REGISTRATION] Starting registration process...
📋 [DOCTOR REGISTRATION] Received data: {...}
🔍 [DOCTOR REGISTRATION] Validating NPI format: 1234567890
🔍 [DOCTOR REGISTRATION] Validating email format: doctor@test.com
🔍 [DOCTOR REGISTRATION] Validating password length
🔍 [DOCTOR REGISTRATION] Checking for duplicate email: doctor@test.com
🔍 [DOCTOR REGISTRATION] Checking for duplicate NPI: 1234567890
🔌 [DOCTOR REGISTRATION] Connecting to database...
💾 [DOCTOR REGISTRATION] Inserting new doctor into database...
📝 [DOCTOR REGISTRATION] Doctor data to insert: {...}
```

---

## 🎨 Frontend Logs

All frontend logs are prefixed with `[FRONTEND]` for easy filtering.

#### ✅ Success Logs
```
🏥 [FRONTEND] Starting doctor registration...
✅ [FRONTEND] All validations passed
📤 [FRONTEND] Sending registration request to API...
📋 [FRONTEND] Registration data: {...}
📥 [FRONTEND] Received response: 200 OK
📦 [FRONTEND] Response data: {...}
✅ [FRONTEND] Registration successful!
🎉 [FRONTEND] Doctor created: {...}
🔄 [FRONTEND] Redirecting to doctor portal...
```

#### ❌ Error Logs
```
❌ [FRONTEND] Validation failed: Password mismatch
❌ [FRONTEND] Validation failed: Password too short
❌ [FRONTEND] Validation failed: Invalid NPI format
❌ [FRONTEND] Registration failed: Email already registered
❌ [FRONTEND] Registration error: {...}
❌ [FRONTEND] Error details: {...}
```

---

## 🔔 Alert System

### Success Alert
When registration is successful, the user sees:

**Toast Notification:**
```
✅ Registration Successful!
Welcome, Dr. John Smith! You can now login to the doctor portal.
```

**Browser Alert:**
```
🎉 SUCCESS!

Doctor Account Created:

Name: Dr. John Smith
Email: doctor@test.com
NPI: 1234567890
Specialty: Emergency Medicine

You will be redirected to the login page in 3 seconds.
```

### Error Alert
When registration fails, the user sees:

**Toast Notification:**
```
❌ Registration Failed
[Error message from API]
```

**Browser Alert:**
```
❌ REGISTRATION FAILED

Error: [Error message]

Please check the console for more details and try again.
```

---

## 🔍 How to Debug Registration Issues

### Step 1: Open Browser Console
1. Press `F12` or right-click → "Inspect"
2. Go to "Console" tab
3. Look for logs starting with `[FRONTEND]` or `[DOCTOR REGISTRATION]`

### Step 2: Check Server Logs
1. Look at your terminal/console where Next.js is running
2. Search for logs with `[DOCTOR REGISTRATION]`
3. Follow the flow from start to finish

### Step 3: Identify the Issue

#### Example: Email Already Registered
**Frontend Console:**
```
🏥 [FRONTEND] Starting doctor registration...
✅ [FRONTEND] All validations passed
📤 [FRONTEND] Sending registration request to API...
📥 [FRONTEND] Received response: 400 Bad Request
❌ [FRONTEND] Registration failed: Email already registered
```

**Server Console:**
```
🏥 [DOCTOR REGISTRATION] Starting registration process...
📋 [DOCTOR REGISTRATION] Received data: {...}
✅ [DOCTOR REGISTRATION] All validations passed
🔍 [DOCTOR REGISTRATION] Checking for duplicate email: doctor@test.com
❌ [DOCTOR REGISTRATION] Email already exists: doctor@test.com
```

**Solution:** Use a different email address

#### Example: Invalid NPI Format
**Frontend Console:**
```
🏥 [FRONTEND] Starting doctor registration...
❌ [FRONTEND] Validation failed: Invalid NPI format
```

**Solution:** NPI must be exactly 10 digits

#### Example: Database Error
**Server Console:**
```
🏥 [DOCTOR REGISTRATION] Starting registration process...
✅ [DOCTOR REGISTRATION] All validations passed
💾 [DOCTOR REGISTRATION] Inserting new doctor into database...
❌ [DOCTOR REGISTRATION] Database insert error: {
  code: '23505',
  message: 'duplicate key value violates unique constraint',
  details: 'Key (npi)=(1234567890) already exists.'
}
```

**Solution:** NPI already exists in database

---

## 📋 Complete Registration Flow Logs

### Successful Registration

```
// FRONTEND
🏥 [FRONTEND] Starting doctor registration...
✅ [FRONTEND] All validations passed
📤 [FRONTEND] Sending registration request to API...
📋 [FRONTEND] Registration data: {
  firstName: "John",
  lastName: "Smith",
  email: "doctor@test.com",
  npi: "1234567890",
  specialty: "Emergency Medicine",
  licenseState: "MI"
}

// BACKEND
🏥 [DOCTOR REGISTRATION] Starting registration process...
📋 [DOCTOR REGISTRATION] Received data: {
  firstName: "John",
  lastName: "Smith",
  email: "doctor@test.com",
  npi: "1234567890",
  specialty: "Emergency Medicine",
  licenseState: "MI",
  hasPassword: true,
  hasDEA: true,
  hasBio: true
}
✅ [DOCTOR REGISTRATION] All validations passed
🔍 [DOCTOR REGISTRATION] Validating NPI format: 1234567890
🔍 [DOCTOR REGISTRATION] Validating email format: doctor@test.com
🔍 [DOCTOR REGISTRATION] Validating password length
✅ [DOCTOR REGISTRATION] All validations passed
🔌 [DOCTOR REGISTRATION] Connecting to database...
🔍 [DOCTOR REGISTRATION] Checking for duplicate email: doctor@test.com
✅ [DOCTOR REGISTRATION] Email is unique
🔍 [DOCTOR REGISTRATION] Checking for duplicate NPI: 1234567890
✅ [DOCTOR REGISTRATION] NPI is unique
💾 [DOCTOR REGISTRATION] Inserting new doctor into database...
📝 [DOCTOR REGISTRATION] Doctor data to insert: {
  first_name: "John",
  last_name: "Smith",
  email: "doctor@test.com",
  password_hash: "[HIDDEN]",
  npi: "1234567890",
  specialty: "Emergency Medicine",
  license_number: "MD123456",
  license_state: "MI",
  years_experience: 15,
  hourly_rate: 150,
  telehealth_enabled: true,
  is_available: false,
  is_active: true
}
✅ [DOCTOR REGISTRATION] Doctor successfully inserted into database!
🎉 [DOCTOR REGISTRATION] New doctor created: {
  id: "uuid-here",
  name: "Dr. John Smith",
  email: "doctor@test.com",
  npi: "1234567890",
  specialty: "Emergency Medicine"
}

// FRONTEND
📥 [FRONTEND] Received response: 200 OK
📦 [FRONTEND] Response data: {
  success: true,
  message: "Doctor account created successfully!",
  doctor: {...}
}
✅ [FRONTEND] Registration successful!
🎉 [FRONTEND] Doctor created: {...}
🔄 [FRONTEND] Redirecting to doctor portal...
```

---

## 🛠️ Troubleshooting Common Issues

### Issue 1: No Logs Appearing
**Problem:** Console is empty, no logs showing
**Solution:** 
- Make sure browser console is open (F12)
- Check "All" or "Verbose" level in console filter
- Check server terminal is running

### Issue 2: Registration Hangs
**Problem:** Loading spinner never stops
**Solution:**
- Check server console for errors
- Look for database connection issues
- Verify Supabase credentials are set

### Issue 3: Duplicate Key Error
**Problem:** `duplicate key value violates unique constraint`
**Solution:**
- Email or NPI already exists
- Use different email or NPI
- Check database: `SELECT * FROM physicians WHERE email = 'your@email.com'`

### Issue 4: Missing Environment Variables
**Problem:** `Missing Supabase environment variables`
**Solution:**
- Check `.env.local` file exists
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Restart development server

---

## 📊 Log Analysis

### Filter Logs in Browser Console
```javascript
// Show only registration logs
console.log.filter(log => log.includes('[FRONTEND]'))

// Show only errors
console.error.filter(log => log.includes('❌'))

// Show only success
console.log.filter(log => log.includes('✅'))
```

### Filter Logs in Terminal
```bash
# On Windows PowerShell
npm run dev | Select-String "DOCTOR REGISTRATION"

# On Linux/Mac
npm run dev | grep "DOCTOR REGISTRATION"
```

---

## 🎯 What Each Log Tells You

| Log Message | Meaning | Action |
|-------------|---------|--------|
| `Starting registration process` | API received request | Normal flow |
| `All validations passed` | Data is valid | Normal flow |
| `Email is unique` | No duplicate email | Normal flow |
| `NPI is unique` | No duplicate NPI | Normal flow |
| `Doctor successfully inserted` | Registration complete | Success! |
| `Email already exists` | Duplicate email | Use different email |
| `NPI already exists` | Duplicate NPI | Use different NPI |
| `Invalid NPI format` | NPI not 10 digits | Fix NPI format |
| `Invalid email format` | Email format wrong | Fix email format |
| `Password too short` | Password < 6 chars | Use longer password |
| `Database insert error` | DB operation failed | Check DB connection |
| `Unexpected error` | Unknown error | Check error details |

---

## ✅ Summary

### Logging Features
- ✅ Comprehensive backend logging
- ✅ Detailed frontend logging
- ✅ Color-coded log levels (emojis)
- ✅ Easy filtering with prefixes
- ✅ Data sanitization (passwords hidden)
- ✅ Error stack traces
- ✅ Success confirmations

### Alert Features
- ✅ Toast notifications (non-blocking)
- ✅ Browser alerts (blocking, detailed)
- ✅ Success alerts with doctor info
- ✅ Error alerts with troubleshooting hints
- ✅ Auto-redirect after success

### Debugging Tools
- ✅ Step-by-step flow tracking
- ✅ Validation checkpoints
- ✅ Database operation logging
- ✅ Error details and hints
- ✅ Data inspection (sanitized)

---

## 🎉 You're All Set!

Now when you register a doctor, you'll see:
1. **Console logs** tracking every step
2. **Toast notifications** for feedback
3. **Browser alerts** for important events
4. **Detailed error messages** if something fails

Just open your browser console (F12) and watch the logs as you register! 🚀

