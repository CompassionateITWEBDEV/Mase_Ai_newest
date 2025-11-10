# Pending Patient Onboarding - System Connections

Kini ang complete list sa tanan nga connections sa "Pending Patient Onboarding" feature sa system para makabalo ka asa mag sugod buhat.

## 📍 Main Location

### 1. **Staff Dashboard Page** (Frontend)
**File:** `app/staff-dashboard/page.tsx`
- **Line 1444-1629**: Pending Patient Onboarding Tab Content
- **Line 51-68**: `PendingOnboardingPatient` interface definition
- **Line 121-176**: Mock data (hardcoded array - **KINAHANGLAN I-CONNECT SA DATABASE**)
- **Line 1175**: `filteredPatients` - filtering logic for search
- **Line 651**: Auto-update simulation (mock functionality)

**Current Status:** 
- ❌ Using **MOCK DATA** (hardcoded array)
- ❌ **WALA PA CONNECTED SA DATABASE**
- ✅ UI is complete and functional
- ✅ Search functionality works
- ✅ Links to patient onboarding page

---

## 🔗 Connected Pages & Components

### 2. **Patient Onboarding Detail Page**
**File:** `app/patient-onboarding/[patientId]/page.tsx`
- **Purpose:** Detailed onboarding process for individual patient
- **Connection:** Linked from "View Details" button in staff dashboard
- **Line 1582** in staff-dashboard: `<Link href={`/patient-onboarding/${patient.id}`}>`
- **Status:** ✅ Functional but uses mock API

**Features:**
- Patient identity verification
- Consent forms
- HIPAA authorization
- Insurance verification
- Document signing
- Nurse witness requirements

---

### 3. **Patient Portal Onboarding**
**File:** `app/patient-portal/onboarding/page.tsx`
- **Purpose:** Nurse-guided patient onboarding session
- **Connection:** Separate onboarding flow for patient portal
- **Status:** ✅ Has API endpoint

---

## 🔌 API Endpoints

### 4. **Patient Data API** (Mock)
**File:** `app/api/patients/[patientId]/route.ts`
- **Line 24, 43, 62**: Returns mock patient data with `status: "pending_onboarding"`
- **Status:** ❌ **MOCK DATA ONLY** - needs database connection
- **Method:** GET
- **Returns:** Mock patient object

### 5. **Patient Status Update API** (Mock)
**File:** `app/api/patients/[patientId]/status/route.ts`
- **Purpose:** Update patient onboarding status
- **Line 7**: Accepts `status`, `onboardingCompletedBy`, `onboardingCompletedAt`, `sessionNotes`
- **Status:** ❌ **MOCK IMPLEMENTATION** - needs database update
- **Method:** PATCH
- **Note:** Line 29-34 has TODO comments for production implementation

### 6. **Patient Portal Onboarding API**
**File:** `app/api/patient-portal/onboarding/route.ts`
- **Line 3-95**: POST endpoint for completing onboarding
- **Line 97-155**: GET endpoint for onboarding status
- **Status:** ✅ Functional but uses mock data
- **Connection:** Used by patient portal onboarding page

---

## 🗄️ Database Tables

### 7. **Patients Table** (Database Schema)
**File:** `scripts/003-init-core-tables.sql`
- **Line 2-34**: `patients` table definition
- **Key Fields:**
  - `id` (UUID)
  - `axxess_id` (TEXT)
  - `name` (TEXT)
  - `current_status` (TEXT) - **KINAHANGLAN I-UPDATE PARA SA "pending_onboarding"**
  - `assigned_staff_id` (UUID) - Links to staff table
  - `referral_accepted` (BOOLEAN)
  - `soc_due_date` (DATE)
  - `phone_number` (TEXT)
  - `address` (TEXT)
  - `insurance` (TEXT)
  - `priority` (TEXT)

**Status:** ✅ Table exists
**Issue:** ❌ **WALA PA CONNECTED** - staff dashboard still uses mock data

### 8. **Staff Table** (Database Schema)
**File:** `scripts/003-init-core-tables.sql`
- **Line 37-53**: `staff` table definition
- **Connection:** Patients have `assigned_staff_id` that references this table
- **Status:** ✅ Table exists and is used elsewhere

---

## 🔄 Data Flow (Current vs Needed)

### **CURRENT FLOW (Mock):**
```
Staff Dashboard → Hardcoded Array → Display → Link to Detail Page → Mock API
```

### **NEEDED FLOW (Production):**
```
Staff Dashboard → API Call → Database Query → Filter by Status → Display → Link to Detail Page → Real API → Database Update
```

---

## 🚀 Asa Mag Sugod Buhat (Where to Start)

### **Priority 1: Connect to Database** ⚠️ **CRITICAL**

#### Step 1: Create API Endpoint for Pending Onboarding Patients
**New File:** `app/api/patients/pending-onboarding/route.ts`

**Functionality:**
- Query `patients` table where:
  - `current_status = 'pending_onboarding'` OR `status = 'pending_onboarding'`
  - `assigned_staff_id` matches current logged-in staff member
- Return list of patients with all required fields
- Include eligibility and authorization status (may need new fields or separate tables)

**Required Fields to Return:**
```typescript
{
  id: string
  name: string
  phone: string (from phone_number)
  address: string
  firstVisitScheduled: string (calculate from soc_due_date or episode_start_date)
  assignedNurse: string (join with staff table)
  services: string[] (may need separate table or JSONB field)
  priority: "high" | "medium" | "low"
  status: "pending_onboarding"
  acceptedDate: string (from referral_date or created_at)
  eligibilityStatus: "verified" | "checking" | "requires_auth" | "denied" | "pending_auth"
  authorizationStatus: "not_required" | "pending" | "approved" | "denied" | "submitted"
  insuranceProvider: string (from insurance field)
  estimatedAuthDays: number
  socRequired: boolean
  authRequiredBefore: boolean
}
```

#### Step 2: Update Staff Dashboard to Fetch from API
**File:** `app/staff-dashboard/page.tsx`

**Changes Needed:**
- **Line 121**: Replace hardcoded array with `useState<PendingOnboardingPatient[]>([])`
- **Add useEffect** to fetch from `/api/patients/pending-onboarding` on mount
- **Add loading state** while fetching
- **Add error handling** for API failures
- **Filter by current staff member** (use `currentUser` or `matchedStaff`)

**Example Code:**
```typescript
useEffect(() => {
  const loadPendingPatients = async () => {
    try {
      setIsLoadingPatients(true)
      const res = await fetch('/api/patients/pending-onboarding?staffId=' + (matchedStaff?.id || ''))
      const data = await res.json()
      if (data.success && data.patients) {
        setPendingOnboardingPatients(data.patients)
      }
    } catch (error) {
      console.error('Error loading pending patients:', error)
      toast({ title: "Error", description: "Failed to load pending patients", variant: "destructive" })
    } finally {
      setIsLoadingPatients(false)
    }
  }
  
  if (matchedStaff?.id) {
    loadPendingPatients()
  }
}, [matchedStaff?.id])
```

---

### **Priority 2: Add Missing Database Fields** ⚠️ **IMPORTANT**

#### Check if these fields exist in `patients` table:
- ❓ `eligibility_status` - for eligibility verification status
- ❓ `authorization_status` - for authorization tracking
- ❓ `estimated_auth_days` - for authorization timeline
- ❓ `auth_required_before` - boolean flag
- ❓ `services` - array of services (may need JSONB or separate table)
- ❓ `first_visit_scheduled` - specific date/time for first visit

**If missing, create migration:**
**New File:** `scripts/XXX-add-patient-onboarding-fields.sql`

```sql
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS eligibility_status TEXT DEFAULT 'checking',
ADD COLUMN IF NOT EXISTS authorization_status TEXT DEFAULT 'not_required',
ADD COLUMN IF NOT EXISTS estimated_auth_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auth_required_before BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS first_visit_scheduled TIMESTAMP WITH TIME ZONE;
```

---

### **Priority 3: Update Patient Status API** ⚠️ **IMPORTANT**

#### Update Status Update Endpoint
**File:** `app/api/patients/[patientId]/status/route.ts`

**Changes Needed:**
- **Line 9-16**: Replace console.log with actual database update
- Update `patients` table:
  - Set `current_status = 'onboarded'` or new status
  - Store `onboardingCompletedBy` (staff ID)
  - Store `onboardingCompletedAt` (timestamp)
  - Store `sessionNotes` (may need new field or notes table)

**Example Implementation:**
```typescript
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const { data, error } = await supabase
  .from('patients')
  .update({
    current_status: status,
    onboarding_completed_by: onboardingCompletedBy,
    onboarding_completed_at: onboardingCompletedAt,
    updated_at: new Date().toISOString()
  })
  .eq('id', patientId)
  .select()
  .single()
```

---

### **Priority 4: Patient Detail Page Connection** ⚠️ **IMPORTANT**

#### Update Patient Onboarding Detail Page
**File:** `app/patient-onboarding/[patientId]/page.tsx`

**Changes Needed:**
- **Line 65-73**: Replace mock patient fetch with real API call
- Fetch from `/api/patients/[patientId]` (update to use database)
- Update completion to call `/api/patients/[patientId]/status` (already exists, just needs DB connection)

---

## 📋 Summary Checklist

### Database & API
- [ ] Create `/api/patients/pending-onboarding/route.ts` endpoint
- [ ] Add missing fields to `patients` table (eligibility_status, authorization_status, etc.)
- [ ] Update `/api/patients/[patientId]/route.ts` to use database
- [ ] Update `/api/patients/[patientId]/status/route.ts` to update database
- [ ] Test database queries with actual data

### Frontend Updates
- [ ] Update `app/staff-dashboard/page.tsx` to fetch from API instead of mock data
- [ ] Add loading states and error handling
- [ ] Update `app/patient-onboarding/[patientId]/page.tsx` to use real API
- [ ] Test end-to-end flow

### Data Migration
- [ ] Migrate existing patient data to include new fields
- [ ] Set default values for new fields
- [ ] Verify data integrity

---

## 🔍 Related Files Reference

1. **Staff Dashboard:** `app/staff-dashboard/page.tsx` (Line 1444-1629)
2. **Patient Onboarding Page:** `app/patient-onboarding/[patientId]/page.tsx`
3. **Patient API (Mock):** `app/api/patients/[patientId]/route.ts`
4. **Status API (Mock):** `app/api/patients/[patientId]/status/route.ts`
5. **Database Schema:** `scripts/003-init-core-tables.sql`
6. **Patient Portal Onboarding:** `app/patient-portal/onboarding/page.tsx`
7. **Patient Portal API:** `app/api/patient-portal/onboarding/route.ts`

---

## 💡 Notes

- **Current Implementation:** Uses 100% mock data - no database connection
- **Main Issue:** Staff dashboard hardcodes patient array instead of fetching from database
- **Key Connection Point:** `assigned_staff_id` in patients table links to staff table
- **Status Field:** Need to ensure `current_status` or new `status` field supports "pending_onboarding"
- **Eligibility/Auth:** May need separate tables for tracking eligibility and authorization workflows

---

**Last Updated:** 2024
**Status:** ⚠️ Needs Database Connection Implementation

