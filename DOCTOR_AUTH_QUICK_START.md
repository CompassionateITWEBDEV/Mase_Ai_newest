# Doctor Authentication - Quick Start Guide

## 🚀 Setup Instructions (5 Minutes)

### Step 1: Run Database Migration
Execute the SQL script to add authentication fields to the physicians table:

```bash
# Option 1: Via Supabase Dashboard
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Open scripts/121-add-doctor-authentication.sql
4. Click "Run"
```

```bash
# Option 2: Via Command Line (if you have psql)
psql -h your-supabase-host -U postgres -d postgres -f scripts/121-add-doctor-authentication.sql
```

### Step 2: Test the System
That's it! The frontend and API are already implemented. Now you can test:

---

## 🧪 Testing the Doctor Authentication

### Test 1: Register a New Doctor
1. Navigate to `/doctor-portal`
2. Click the **"Sign Up"** tab
3. Fill out the 3-step form:

**Step 1 - Personal Info:**
- First Name: `John`
- Last Name: `Smith`
- Email: `john.smith@test.com`
- Phone: `555-1234`
- Password: `password123`
- Confirm Password: `password123`

**Step 2 - Professional Credentials:**
- NPI: `1234567890` (must be 10 digits)
- DEA: `BS1234567`
- Specialty: `Emergency Medicine`
- License Number: `MD123456`
- License State: `MI`
- Years Experience: `15`
- Hourly Rate: `150.00`
- Bio: `Board-certified emergency medicine physician with 15 years of experience.`

**Step 3 - Terms:**
- ✅ Check both boxes (Terms & HIPAA)
- Click **"Submit Application"**

4. You should see a success toast
5. You'll be redirected to the login screen

### Test 2: Login as Doctor
1. On the `/doctor-portal` page, ensure you're on the **"Login"** tab
2. Enter:
   - Email: `john.smith@test.com`
   - Password: `password123`
3. Click **"Login"**
4. You should see:
   - Success toast: "Welcome back, Dr. John Smith!"
   - Portal dashboard with 3 tabs: Live Consultations, Dashboard, Availability
   - Your name in the header
   - Logout button

### Test 3: Access Portal Features
Once logged in, you can:
- **Live Consultations Tab:** View and accept pending consultation requests
- **Dashboard Tab:** See today's stats (consultations, earnings, rating)
- **Availability Tab:** Toggle your availability status
- **Logout:** Click logout button to return to login screen

---

## 🔗 Integration with Telehealth

### How It Works Together
1. **Nurse requests consultation** from `/track/[staffId]` page
2. **System finds available doctors** (where `is_available: true`)
3. **Consultation appears** in doctor's "Live Consultations" tab
4. **Doctor accepts** and video call starts
5. **Consultation completed** and stats updated

### Making Yourself Available
1. Login to doctor portal
2. Go to "Availability" tab
3. Toggle "Available" status to ON
4. You'll now receive consultation requests from nurses

---

## 📊 Verify in Database

Check that your doctor account was created:

```sql
-- View all doctors with authentication
SELECT 
  id,
  first_name,
  last_name,
  email,
  npi,
  specialty,
  is_available,
  telehealth_enabled,
  created_at
FROM physicians
WHERE email IS NOT NULL
ORDER BY created_at DESC;
```

---

## 🎯 What's Been Implemented

### ✅ Database
- Extended `physicians` table with authentication fields
- Added indexes for performance
- Added RLS policies (via existing grants)

### ✅ Backend APIs
- `POST /api/auth/register-doctor` - Doctor registration
- `POST /api/auth/login` (updated) - Doctor login with `accountType: 'doctor'`
- Full validation and error handling

### ✅ Frontend
- Doctor portal login/signup UI
- Multi-step registration form
- Authentication state management
- Protected portal content
- Logout functionality
- Integration with video call system

### ✅ Security
- Email format validation
- Password length validation
- NPI format validation (10 digits)
- Duplicate email/NPI prevention
- Account status checking (`is_active`)

---

## 🔐 Security Notes

### Current State (Development)
⚠️ Passwords are currently stored as plain text for development/testing

### Before Production
You MUST implement:
1. **bcrypt password hashing**
2. **JWT tokens** for session management
3. **Email verification**
4. **Rate limiting** on login endpoint
5. **2FA** for doctor accounts

See `DOCTOR_AUTHENTICATION_GUIDE.md` for detailed security implementation.

---

## 🐛 Troubleshooting

### "Email already registered"
- Use a different email
- Check database: `SELECT * FROM physicians WHERE email = 'your@email.com'`

### "Invalid NPI"
- Must be exactly 10 digits
- No spaces, dashes, or letters
- Example: `1234567890`

### "Password too short"
- Minimum 6 characters required

### Can't see portal after login
- Open browser console (F12)
- Check for errors
- Verify localStorage: `localStorage.getItem('currentUser')`
- Should see JSON with doctor info

### Portal shows login screen even after login
- Clear browser cache and localStorage
- Try logging in again
- Check that `accountType: 'doctor'` in localStorage

---

## 📝 Quick Reference

### Test Credentials (if you uncomment sample data in SQL)
```
Email: doctor@test.com
Password: password123
NPI: 9999999999
```

### API Endpoints
```
POST /api/auth/register-doctor  - Register new doctor
POST /api/auth/login            - Login (accountType: 'doctor')
```

### Key Files
```
scripts/121-add-doctor-authentication.sql       - Database migration
app/api/auth/register-doctor/route.ts          - Registration API
app/api/auth/login/route.ts                    - Login API (updated)
app/doctor-portal/page.tsx                     - Portal with auth
components/doctor-portal/enhanced-doctor-signup.tsx - Signup form
```

---

## ✨ Next Steps

1. ✅ Run the database migration
2. ✅ Test doctor registration
3. ✅ Test doctor login
4. ✅ Test portal access
5. ✅ Test logout
6. 🔄 Test full consultation workflow (nurse request → doctor accept → video call)
7. 📋 Plan production security enhancements

---

## 🎉 You're All Set!

The complete doctor authentication system is now implemented and ready to use. Doctors can:
- Register with their credentials
- Login to the portal
- Manage their availability
- Accept telehealth consultations
- Conduct video calls with nurses
- Track their earnings and stats

For detailed documentation, see `DOCTOR_AUTHENTICATION_GUIDE.md`.

