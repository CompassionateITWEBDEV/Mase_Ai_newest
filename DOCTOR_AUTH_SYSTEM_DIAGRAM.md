# Doctor Authentication System - Visual Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DOCTOR AUTHENTICATION SYSTEM                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    /doctor-portal (page.tsx)                         │  │
│  │                                                                      │  │
│  │  ┌────────────────────┐         ┌────────────────────────────────┐ │  │
│  │  │  NOT AUTHENTICATED │         │      AUTHENTICATED             │ │  │
│  │  │                    │         │                                │ │  │
│  │  │  ┌──────────────┐  │         │  ┌──────────────────────────┐ │ │  │
│  │  │  │ Login Tab    │  │         │  │  Header (Name, Logout)   │ │ │  │
│  │  │  │ - Email      │  │         │  └──────────────────────────┘ │ │  │
│  │  │  │ - Password   │  │         │                                │ │  │
│  │  │  │ - Login Btn  │  │         │  ┌──────────────────────────┐ │ │  │
│  │  │  └──────────────┘  │         │  │  Live Consultations Tab  │ │ │  │
│  │  │                    │         │  │  - Pending requests      │ │ │  │
│  │  │  ┌──────────────┐  │         │  │  - Accept/Decline btns   │ │ │  │
│  │  │  │ Signup Tab   │  │         │  └──────────────────────────┘ │ │  │
│  │  │  │ - Step 1     │  │         │                                │ │  │
│  │  │  │ - Step 2     │  │         │  ┌──────────────────────────┐ │ │  │
│  │  │  │ - Step 3     │  │         │  │  Dashboard Tab           │ │ │  │
│  │  │  │ - Submit     │  │         │  │  - Stats (consults, $$)  │ │ │  │
│  │  │  └──────────────┘  │         │  └──────────────────────────┘ │ │  │
│  │  │                    │         │                                │ │  │
│  │  └────────────────────┘         │  ┌──────────────────────────┐ │ │  │
│  │                                  │  │  Availability Tab        │ │ │  │
│  │                                  │  │  - Toggle ON/OFF         │ │ │  │
│  │                                  │  └──────────────────────────┘ │ │  │
│  │                                  │                                │ │  │
│  └──────────────────────────────────────────────────────────────────┘ │  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │        EnhancedDoctorSignup (enhanced-doctor-signup.tsx)            │  │
│  │                                                                      │  │
│  │  Step 1: Personal Info    Step 2: Credentials    Step 3: Terms     │  │
│  │  ├─ Name                  ├─ NPI                 ├─ Terms Checkbox  │  │
│  │  ├─ Email                 ├─ DEA                 ├─ HIPAA Checkbox  │  │
│  │  ├─ Phone                 ├─ Specialty           └─ Submit Button   │  │
│  │  ├─ Password              ├─ License                                │  │
│  │  └─ Confirm Password      ├─ Experience                             │  │
│  │                           └─ Hourly Rate                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ HTTP Requests
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               API LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  POST /api/auth/register-doctor                                      │  │
│  │  ├─ Validate email format                                            │  │
│  │  ├─ Validate password length (min 6)                                 │  │
│  │  ├─ Validate NPI format (10 digits)                                  │  │
│  │  ├─ Check for duplicate email                                        │  │
│  │  ├─ Check for duplicate NPI                                          │  │
│  │  ├─ Insert into physicians table                                     │  │
│  │  └─ Return doctor profile                                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  POST /api/auth/login                                                │  │
│  │  ├─ Check accountType === 'doctor'                                   │  │
│  │  ├─ Query physicians table by email                                  │  │
│  │  ├─ Verify password (plain text in dev)                              │  │
│  │  ├─ Check is_active status                                           │  │
│  │  ├─ Update last_login timestamp                                      │  │
│  │  └─ Return doctor profile + redirectTo                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ SQL Queries
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATABASE LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    physicians TABLE                                  │  │
│  │                                                                      │  │
│  │  Existing Fields:              New Authentication Fields:           │  │
│  │  ├─ id (UUID)                  ├─ email (TEXT UNIQUE)               │  │
│  │  ├─ npi (TEXT)                 ├─ password_hash (TEXT)              │  │
│  │  ├─ first_name (TEXT)          ├─ last_login (TIMESTAMPTZ)          │  │
│  │  ├─ last_name (TEXT)           │                                    │  │
│  │  ├─ specialty (TEXT)           New Telehealth Fields:               │  │
│  │  ├─ license_number (TEXT)      ├─ is_available (BOOLEAN)            │  │
│  │  ├─ license_state (TEXT)       ├─ telehealth_enabled (BOOLEAN)      │  │
│  │  ├─ dea_number (TEXT)          ├─ availability_mode (TEXT)          │  │
│  │  ├─ is_active (BOOLEAN)        ├─ hourly_rate (DECIMAL)             │  │
│  │  └─ created_at (TIMESTAMPTZ)   ├─ bio (TEXT)                        │  │
│  │                                 ├─ years_experience (INTEGER)        │  │
│  │                                 ├─ total_consultations (INTEGER)     │  │
│  │                                 └─ average_rating (DECIMAL)          │  │
│  │                                                                      │  │
│  │  Indexes:                                                            │  │
│  │  ├─ idx_physicians_email                                            │  │
│  │  ├─ idx_physicians_is_available                                     │  │
│  │  └─ idx_physicians_telehealth_enabled                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## User Flow Diagrams

### Registration Flow

```
┌────────────┐
│   Doctor   │
│   Visits   │
│  /doctor-  │
│   portal   │
└─────┬──────┘
      │
      ▼
┌────────────────────┐
│  See Login/Signup  │
│      Screen        │
└─────┬──────────────┘
      │
      ▼
┌────────────────────┐
│  Click "Sign Up"   │
│       Tab          │
└─────┬──────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  Step 1: Personal Information          │
│  ├─ First Name: John                   │
│  ├─ Last Name: Smith                   │
│  ├─ Email: doctor@example.com          │
│  ├─ Phone: 555-1234                    │
│  ├─ Password: ********                 │
│  └─ Confirm Password: ********         │
│                                        │
│  [Next Button]                         │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  Step 2: Professional Credentials      │
│  ├─ NPI: 1234567890                    │
│  ├─ DEA: BS1234567                     │
│  ├─ Specialty: Emergency Medicine      │
│  ├─ License Number: MD123456           │
│  ├─ License State: MI                  │
│  ├─ Years Experience: 15               │
│  ├─ Hourly Rate: $150.00               │
│  └─ Bio: Board-certified...            │
│                                        │
│  [Previous] [Next]                     │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  Step 3: Terms and Verification        │
│  ☑ I agree to Terms of Service         │
│  ☑ I acknowledge HIPAA compliance      │
│                                        │
│  [Previous] [Submit Application]       │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  POST /api/auth/register-doctor        │
│  ├─ Validate all fields                │
│  ├─ Check for duplicates               │
│  └─ Insert into physicians table       │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  ✅ Success Toast                       │
│  "Doctor account created successfully!" │
└─────┬──────────────────────────────────┘
      │
      ▼ (after 2 seconds)
┌────────────────────┐
│  Redirect to       │
│  Login Screen      │
└────────────────────┘
```

### Login Flow

```
┌────────────┐
│   Doctor   │
│   Visits   │
│  /doctor-  │
│   portal   │
└─────┬──────┘
      │
      ▼
┌────────────────────┐
│  See Login Screen  │
│  (if not logged in)│
└─────┬──────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  Login Form                            │
│  ├─ Email: doctor@example.com          │
│  └─ Password: ********                 │
│                                        │
│  [Login Button]                        │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  POST /api/auth/login                  │
│  {                                     │
│    email: "doctor@example.com",        │
│    password: "password123",            │
│    accountType: "doctor"               │
│  }                                     │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  Query physicians table                │
│  WHERE email = 'doctor@example.com'    │
│  AND password_hash = 'password123'     │
└─────┬──────────────────────────────────┘
      │
      ├─────────────────┐
      │                 │
      ▼ (valid)         ▼ (invalid)
┌──────────────┐  ┌──────────────────┐
│ Check        │  │ ❌ Error Toast    │
│ is_active    │  │ "Invalid email   │
│ status       │  │ or password"     │
└─────┬────────┘  └──────────────────┘
      │
      ├─────────────────┐
      │                 │
      ▼ (true)          ▼ (false)
┌──────────────┐  ┌──────────────────┐
│ Update       │  │ ❌ Error Toast    │
│ last_login   │  │ "Account is      │
│ timestamp    │  │ inactive"        │
└─────┬────────┘  └──────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  Save to localStorage                  │
│  {                                     │
│    id: "uuid",                         │
│    name: "Dr. John Smith",             │
│    email: "doctor@example.com",        │
│    accountType: "doctor",              │
│    ...                                 │
│  }                                     │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  ✅ Success Toast                       │
│  "Welcome back, Dr. John Smith!"       │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────┐
│  Portal Content    │
│  Becomes Visible   │
│  ├─ Live           │
│  │  Consultations  │
│  ├─ Dashboard      │
│  └─ Availability   │
└────────────────────┘
```

### Consultation Acceptance Flow

```
┌────────────────────┐
│  Doctor Logged In  │
│  & Available: ON   │
└─────┬──────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  Nurse Creates Consultation Request    │
│  (from /track/[staffId] page)          │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  POST /api/telehealth/consultation     │
│  action: "request_consultation"        │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  System finds available doctor         │
│  WHERE is_available = true             │
│  AND telehealth_enabled = true         │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  Consultation appears in doctor's      │
│  "Live Consultations" tab              │
│  (polling every 5 seconds)             │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  Doctor clicks "Accept & Start Video"  │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  POST /api/telehealth/create-session   │
│  Creates Vonage video session          │
│  Generates tokens for doctor & nurse   │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  Video Call Interface Opens            │
│  ├─ Doctor's video (local)             │
│  ├─ Nurse's video (remote)             │
│  └─ Controls (mic, camera, end call)   │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  Doctor completes consultation         │
│  Clicks "End Call"                     │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  POST /api/telehealth/consultation     │
│  action: "complete_consultation"       │
│  ├─ Doctor notes                       │
│  ├─ Diagnosis                          │
│  └─ Treatment plan                     │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  Update physician stats                │
│  ├─ total_consultations += 1           │
│  └─ earnings += compensation_amount    │
└─────┬──────────────────────────────────┘
      │
      ▼
┌────────────────────┐
│  ✅ Consultation    │
│  Completed         │
└────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REGISTRATION DATA FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

Frontend Form Data                    API Validation                Database
─────────────────                    ──────────────                ────────

firstName: "John"                    ✓ Required field              first_name
lastName: "Smith"        ────────►   ✓ Required field   ────────►  last_name
email: "doc@test.com"                ✓ Email format                email
                                     ✓ Not duplicate               (UNIQUE)
password: "pass123"                  ✓ Length >= 6                 password_hash
                                     ✓ Matches confirm             (plain text)
npi: "1234567890"                    ✓ 10 digits                   npi
                                     ✓ Not duplicate               (UNIQUE)
dea: "BS1234567"                     ✓ Optional                    dea_number
specialty: "Emergency"               ✓ Required                    specialty
licenseNumber: "MD123"               ✓ Required                    license_number
licenseState: "MI"                   ✓ Required                    license_state
yearsExperience: 15                  ✓ Optional                    years_experience
bio: "Board-cert..."                 ✓ Optional                    bio
hourlyRate: 150.00                   ✓ Optional                    hourly_rate

                                     Auto-set defaults:
                                     ├─ is_active: true
                                     ├─ telehealth_enabled: true
                                     ├─ is_available: false
                                     ├─ availability_mode: 'immediate'
                                     ├─ total_consultations: 0
                                     ├─ average_rating: 0.00
                                     └─ created_at: NOW()

                                                        ────────►  INSERT INTO
                                                                   physicians

                                     Response:
                                     {
                                       success: true,
                                       doctor: { ... }
                                     }
                                              │
                                              ▼
                                     Frontend receives
                                     Shows success toast
                                     Redirects to login
```

---

## Session Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SESSION MANAGEMENT                               │
└─────────────────────────────────────────────────────────────────────────┘

Login Success
     │
     ▼
┌──────────────────────────────────────┐
│  API Returns User Data               │
│  {                                   │
│    id: "uuid",                       │
│    name: "Dr. John Smith",           │
│    email: "doctor@example.com",      │
│    accountType: "doctor",            │
│    isAvailable: false,               │
│    ...                               │
│  }                                   │
└─────┬────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────┐
│  Frontend Saves to localStorage      │
│  localStorage.setItem(               │
│    'currentUser',                    │
│    JSON.stringify(userData)          │
│  )                                   │
└─────┬────────────────────────────────┘
      │
      ├──────────────────────────────────────────┐
      │                                          │
      ▼                                          ▼
┌──────────────────────┐              ┌──────────────────────┐
│  Page Load/Refresh   │              │  User Clicks Logout  │
│                      │              │                      │
│  useEffect(() => {   │              │  handleLogout() {    │
│    const user =      │              │    localStorage      │
│    localStorage      │              │    .removeItem(      │
│    .getItem(...)     │              │    'currentUser')    │
│                      │              │    setIsAuth(false)  │
│    if (user &&       │              │  }                   │
│    user.accountType  │              │                      │
│    === 'doctor') {   │              └──────────────────────┘
│      setIsAuth(true) │
│      setDoctorId(..) │
│      setDoctorName() │
│    }                 │
│  }, [])              │
│                      │
└──────────────────────┘

Session Persistence:
├─ Survives page refresh ✓
├─ Survives new tabs ✓ (same browser)
└─ Survives browser restart ✗ (localStorage cleared)
```

---

## Security Layers (Current vs Production)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SECURITY ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────┘

Current (Development)                  Production (Required)
─────────────────────                  ─────────────────────

Password Storage:                      Password Storage:
├─ Plain text ⚠️                       ├─ bcrypt hashing ✓
└─ password_hash column                └─ bcrypt.hash(password, 10)

Session Management:                    Session Management:
├─ localStorage ⚠️                     ├─ JWT tokens ✓
└─ JSON.stringify(user)                ├─ httpOnly cookies ✓
                                       └─ Refresh token rotation ✓

Email Verification:                    Email Verification:
├─ None ⚠️                             ├─ Send verification email ✓
└─ Immediate access                    ├─ Verify token ✓
                                       └─ Activate account ✓

Rate Limiting:                         Rate Limiting:
├─ None ⚠️                             ├─ 5 attempts per 15 min ✓
└─ Unlimited attempts                  └─ IP-based blocking ✓

Two-Factor Auth:                       Two-Factor Auth:
├─ None ⚠️                             ├─ TOTP (Google Auth) ✓
└─ Password only                       └─ SMS backup ✓

CAPTCHA:                               CAPTCHA:
├─ None ⚠️                             ├─ reCAPTCHA v3 ✓
└─ Bot vulnerable                      └─ On registration/login ✓

Credential Verification:               Credential Verification:
├─ Manual ⚠️                           ├─ NPI Registry API ✓
└─ Admin approval                      ├─ DEA verification ✓
                                       └─ License verification ✓

Audit Logging:                         Audit Logging:
├─ Basic (last_login) ⚠️               ├─ All auth events ✓
└─ No detailed logs                    ├─ IP tracking ✓
                                       └─ Failed attempts ✓
```

---

## Integration Points

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SYSTEM INTEGRATION DIAGRAM                            │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  Doctor Portal       │
│  (Authentication)    │
└─────────┬────────────┘
          │
          ├──────────────────────────────────────────────┐
          │                                              │
          ▼                                              ▼
┌──────────────────────┐                    ┌──────────────────────┐
│  Telehealth System   │                    │  Video Call System   │
│  - Consultations     │◄───────────────────│  - Vonage API        │
│  - Find doctors      │                    │  - Session creation  │
│  - Assign requests   │                    │  - Token generation  │
└─────────┬────────────┘                    └──────────────────────┘
          │
          ▼
┌──────────────────────┐
│  Nurse Interface     │
│  - Track page        │
│  - Request consult   │
│  - Video call        │
└──────────────────────┘

Data Flow:
1. Doctor registers/logs in
2. Sets availability to ON
3. Nurse requests consultation
4. System finds available doctor
5. Consultation appears in doctor portal
6. Doctor accepts → Video session created
7. Video call connects doctor & nurse
8. Consultation completed → Stats updated
```

---

This visual documentation provides a comprehensive overview of the doctor authentication system architecture, flows, and integration points.

