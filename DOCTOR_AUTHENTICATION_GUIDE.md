# Doctor Authentication System

## Overview

The Doctor Authentication System enables doctors to register, login, and access the telehealth doctor portal. This system integrates with the existing authentication infrastructure and extends the `physicians` table to support login credentials and telehealth features.

---

## Architecture

### Database Schema

#### Physicians Table Extensions
The `physicians` table has been extended with the following authentication and telehealth fields:

```sql
-- Authentication Fields
email TEXT UNIQUE                    -- Doctor's login email
password_hash TEXT                   -- Hashed password (TODO: implement bcrypt in production)
last_login TIMESTAMPTZ              -- Last login timestamp

-- Telehealth Fields
is_available BOOLEAN DEFAULT false   -- Current availability status
telehealth_enabled BOOLEAN DEFAULT true
availability_mode TEXT DEFAULT 'immediate'  -- 'immediate', 'scheduled', or 'both'
hourly_rate DECIMAL(10,2) DEFAULT 125.00
bio TEXT                            -- Professional biography
years_experience INTEGER
total_consultations INTEGER DEFAULT 0
average_rating DECIMAL(3,2) DEFAULT 0.00
```

### API Endpoints

#### 1. Doctor Registration
**Endpoint:** `POST /api/auth/register-doctor`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "doctor@example.com",
  "password": "password123",
  "npi": "1234567890",
  "dea": "BS1234567",
  "specialty": "Emergency Medicine",
  "licenseNumber": "MD123456",
  "licenseState": "MI",
  "yearsExperience": 15,
  "bio": "Board-certified emergency medicine physician...",
  "hourlyRate": 150.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Doctor account created successfully!",
  "doctor": {
    "id": "uuid",
    "name": "Dr. John Smith",
    "email": "doctor@example.com",
    "npi": "1234567890",
    "specialty": "Emergency Medicine"
  }
}
```

**Validation:**
- Email format validation
- Password minimum 6 characters
- NPI must be exactly 10 digits
- All required fields must be present

#### 2. Doctor Login
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "doctor@example.com",
  "password": "password123",
  "accountType": "doctor"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful!",
  "user": {
    "id": "uuid",
    "email": "doctor@example.com",
    "name": "Dr. John Smith",
    "firstName": "John",
    "lastName": "Smith",
    "npi": "1234567890",
    "specialty": "Emergency Medicine",
    "isAvailable": false,
    "telehealthEnabled": true,
    "accountType": "doctor"
  },
  "redirectTo": "/doctor-portal"
}
```

---

## Frontend Components

### 1. Doctor Portal Login/Signup
**File:** `app/doctor-portal/page.tsx`

The doctor portal now includes:
- **Login Tab:** Email and password authentication
- **Sign Up Tab:** Multi-step registration form
- **Authentication Check:** Portal content only visible to authenticated doctors
- **Logout Button:** Clear session and return to login

### 2. Enhanced Doctor Signup Component
**File:** `components/doctor-portal/enhanced-doctor-signup.tsx`

**Features:**
- 3-step registration process:
  1. Personal Information (name, email, password, phone)
  2. Professional Credentials (NPI, DEA, specialty, license, experience)
  3. Terms and Verification (HIPAA compliance, terms of service)
- Real-time validation
- Integration with `/api/auth/register-doctor`
- Automatic redirect to login after successful registration

---

## User Flow

### Registration Flow
1. Doctor visits `/doctor-portal`
2. Clicks "Sign Up" tab
3. Completes 3-step registration form:
   - Step 1: Personal info and password
   - Step 2: Professional credentials
   - Step 3: Terms and HIPAA compliance
4. Submits application
5. Account created in `physicians` table with `verification_status: 'pending'`
6. Redirected to login screen
7. Can immediately login and access portal

### Login Flow
1. Doctor visits `/doctor-portal`
2. Enters email and password in "Login" tab
3. System checks `physicians` table for matching credentials
4. If valid and `is_active: true`, user is authenticated
5. User data stored in `localStorage` as `currentUser`
6. Portal content becomes visible
7. Doctor can view consultations, manage availability, and accept video calls

### Logout Flow
1. Doctor clicks "Logout" button in header
2. `currentUser` removed from `localStorage`
3. Portal returns to login/signup screen

---

## Security Considerations

### Current Implementation
⚠️ **Development Mode:**
- Passwords are stored as plain text in `password_hash` column
- This is for development/testing purposes only

### Production Requirements
✅ **Before Production:**
1. **Implement bcrypt password hashing:**
   ```typescript
   import bcrypt from 'bcryptjs'
   
   // Registration
   const hashedPassword = await bcrypt.hash(password, 10)
   
   // Login
   const isValid = await bcrypt.compare(password, user.password_hash)
   ```

2. **Add JWT tokens** for session management instead of localStorage

3. **Implement rate limiting** on login endpoint

4. **Add email verification** before allowing login

5. **Enable 2FA** for doctor accounts

6. **Add CAPTCHA** to prevent automated registration

---

## Database Setup

### Running the Migration
Execute the SQL script to add authentication fields:

```bash
# Run in Supabase SQL Editor or via CLI
psql -f scripts/121-add-doctor-authentication.sql
```

### Manual Setup (if needed)
If you prefer to run the migration manually:

1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Copy contents of `scripts/121-add-doctor-authentication.sql`
4. Execute the script
5. Verify new columns exist in `physicians` table

---

## Testing

### Test Doctor Account
You can create a test doctor account by uncommenting the sample data in `scripts/121-add-doctor-authentication.sql`:

```sql
-- Test credentials
Email: doctor@test.com
Password: password123
NPI: 9999999999
```

### Manual Testing Steps
1. ✅ **Registration:**
   - Visit `/doctor-portal`
   - Click "Sign Up" tab
   - Fill out all 3 steps
   - Submit form
   - Verify success toast
   - Check database for new physician record

2. ✅ **Login:**
   - Visit `/doctor-portal`
   - Enter registered email and password
   - Click "Login"
   - Verify redirect to portal dashboard
   - Check localStorage for `currentUser`

3. ✅ **Portal Access:**
   - Verify "Live Consultations" tab is visible
   - Verify "Dashboard" shows stats
   - Verify "Availability" toggle works
   - Verify doctor name appears in header

4. ✅ **Logout:**
   - Click "Logout" button
   - Verify return to login screen
   - Verify localStorage cleared
   - Verify cannot access portal content

---

## Integration with Telehealth System

### Consultation Workflow
1. Nurse requests consultation from track page
2. System finds available doctors (`is_available: true`)
3. Consultation appears in doctor's "Live Consultations" tab
4. Doctor accepts consultation
5. Video call session created with doctor's token
6. Doctor and nurse connect via video call
7. Doctor completes consultation with notes
8. Consultation marked as complete
9. Doctor's stats updated (`total_consultations`, `earnings`)

### Availability Management
Doctors can toggle their availability status:
- **Available:** Receives consultation requests
- **Unavailable:** No new consultations assigned

This is managed through the `EnhancedAvailabilityToggle` component.

---

## File Structure

```
app/
├── api/
│   └── auth/
│       ├── login/route.ts              # Updated with doctor login
│       └── register-doctor/route.ts    # New doctor registration endpoint
├── doctor-portal/
│   └── page.tsx                        # Updated with login/signup UI
components/
└── doctor-portal/
    └── enhanced-doctor-signup.tsx      # Updated with real API integration
scripts/
└── 121-add-doctor-authentication.sql   # Database migration
```

---

## Troubleshooting

### Common Issues

**Issue:** "Email already registered"
- **Solution:** Use a different email or check if account already exists

**Issue:** "Invalid NPI"
- **Solution:** Ensure NPI is exactly 10 digits with no spaces or dashes

**Issue:** "Password too short"
- **Solution:** Password must be at least 6 characters

**Issue:** "Doctor account is inactive"
- **Solution:** Contact admin to activate account (set `is_active: true`)

**Issue:** Can't see portal after login
- **Solution:** Check browser console for errors, verify localStorage has `currentUser`

---

## Future Enhancements

### Planned Features
1. **Email Verification:** Send verification email before allowing login
2. **Password Reset:** Forgot password functionality
3. **Profile Management:** Edit profile, credentials, and bio
4. **Admin Approval:** Require admin verification before activation
5. **Credential Verification:** Automated NPI and DEA verification
6. **Multi-State Licensing:** Support for multiple state licenses
7. **Availability Scheduling:** Set scheduled availability windows
8. **Earnings Dashboard:** Detailed earnings reports and analytics
9. **Patient Reviews:** View and respond to patient feedback
10. **Continuing Education:** Track CME credits and certifications

---

## Support

For questions or issues with the doctor authentication system:
1. Check this documentation
2. Review error messages in browser console
3. Check database logs in Supabase
4. Verify all migration scripts have been run
5. Test with the provided test account credentials

---

## Summary

The Doctor Authentication System provides a complete registration and login flow for telehealth doctors. It extends the existing `physicians` table with authentication fields, adds dedicated API endpoints, and integrates seamlessly with the doctor portal UI. The system is ready for development/testing and includes clear guidelines for production security hardening.

**Key Features:**
- ✅ Doctor registration with credential validation
- ✅ Email/password login
- ✅ Session management via localStorage
- ✅ Protected portal content
- ✅ Integration with telehealth consultations
- ✅ Availability management
- ✅ Earnings tracking

**Next Steps:**
1. Run database migration (`121-add-doctor-authentication.sql`)
2. Test registration and login flows
3. Integrate with existing telehealth consultation system
4. Plan production security enhancements (bcrypt, JWT, email verification)

