# Appointment Integration Guide
## How Appointments Connect to Track Page, Route Optimization, and Fleet Management

---

## 📋 **Overview**

When a patient schedules an appointment from the **Patient Portal**, it creates a record in the `staff_visits` table with `status: 'scheduled'`. This appointment then flows through three key systems:

1. **Track Page** (`/track/[staffId]`) - Staff can see and start their scheduled appointments
2. **Route Optimization** (`/route-optimization`) - Scheduled appointments are included in route optimization
3. **Fleet Management** (`/fleet-management`) - Managers can see upcoming appointments for all staff

---

## 🔄 **Data Flow**

```
Patient Portal
    ↓
Creates appointment in staff_visits (status: 'scheduled')
    ↓
    ├─→ Track Page: Shows scheduled appointments to staff
    ├─→ Route Optimization: Includes scheduled visits in optimization
    └─→ Fleet Management: Displays upcoming appointments
```

---

## 1️⃣ **Track Page Integration** (`/track/[staffId]`)

### **Current Status:**
The track page currently shows **active visits** (status: `in_progress`) but does NOT show **scheduled appointments** (status: `scheduled`).

### **What Needs to be Implemented:**

#### **A. Display Scheduled Appointments**
- Fetch scheduled visits from `staff_visits` where `status = 'scheduled'` and `staff_id = [staffId]`
- Display them in a "Scheduled Appointments" section
- Show: Patient name, scheduled time, visit type, address

#### **B. Start Scheduled Appointment**
- When staff clicks "Start Visit" on a scheduled appointment:
  - Update `status` from `'scheduled'` to `'in_progress'`
  - Set `start_time` to current time
  - If GPS tracking is active, set `visit_location` from current GPS coordinates

#### **C. Code Implementation:**

**Add to `app/track/[staffId]/page.tsx`:**

```typescript
// State for scheduled appointments
const [scheduledAppointments, setScheduledAppointments] = useState<any[]>([])

// Fetch scheduled appointments
useEffect(() => {
  const fetchScheduledAppointments = async () => {
    if (!staffId) return
    
    try {
      const res = await fetch(`/api/visits/scheduled?staff_id=${staffId}`)
      const data = await res.json()
      if (data.success) {
        setScheduledAppointments(data.appointments || [])
      }
    } catch (e) {
      console.error('Error fetching scheduled appointments:', e)
    }
  }
  
  fetchScheduledAppointments()
  // Refresh every 30 seconds
  const interval = setInterval(fetchScheduledAppointments, 30000)
  return () => clearInterval(interval)
}, [staffId])

// Start scheduled appointment
const handleStartScheduledVisit = async (visitId: string) => {
  try {
    const res = await fetch('/api/visits/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        staffId,
        visitId, // Pass the scheduled visit ID
        // Other required fields from the scheduled visit
      })
    })
    
    const data = await res.json()
    if (data.success) {
      // Refresh appointments list
      // Update current visit state
    }
  } catch (e) {
    console.error('Error starting scheduled visit:', e)
  }
}
```

**Create API endpoint: `app/api/visits/scheduled/route.ts`:**

```typescript
import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staff_id")

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get scheduled appointments (status = 'scheduled' and scheduled_time >= now)
    const { data: appointments, error } = await supabase
      .from("staff_visits")
      .select(`
        id,
        patient_name,
        patient_address,
        visit_type,
        scheduled_time,
        notes
      `)
      .eq("staff_id", staffId)
      .eq("status", "scheduled")
      .gte("scheduled_time", new Date().toISOString())
      .order("scheduled_time", { ascending: true })

    if (error) {
      console.error("Error fetching scheduled appointments:", error)
      return NextResponse.json(
        { error: "Failed to fetch scheduled appointments" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      appointments: appointments || [],
      count: appointments?.length || 0,
    })
  } catch (error: any) {
    console.error("Error in GET /api/visits/scheduled:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch scheduled appointments" },
      { status: 500 }
    )
  }
}
```

---

## 2️⃣ **Route Optimization Integration** (`/route-optimization`)

### **Current Status:**
✅ **ALREADY IMPLEMENTED!** Route optimization already includes scheduled appointments.

### **How It Works:**

1. **API Endpoint:** `/api/route-optimization/routes`
2. **Query Logic:** Fetches visits from `staff_visits` where:
   - `status IN ('scheduled', 'in_progress', 'completed')` (excludes 'cancelled')
   - `scheduled_time >= [30 days ago]` OR `start_time >= [30 days ago]`
   - Has `visit_location` (GPS coordinates)

3. **Optimization:**
   - Scheduled appointments are included in the route optimization
   - Algorithm optimizes the order of ALL visits (scheduled + in-progress)
   - When route is applied, `scheduled_time` is updated for scheduled visits

### **Code Reference:**

**File:** `app/api/route-optimization/routes/route.ts` (lines 499-508)

```typescript
// Get all visits (including scheduled)
const { data: allVisitsRaw, error: visitsError } = await supabase
  .from('staff_visits')
  .select('id, patient_name, patient_address, visit_location, scheduled_time, start_time, status, trip_id')
  .eq('staff_id', staff.id)
  .neq('status', 'cancelled') // Only exclude cancelled visits
  .or(`status.eq.in_progress,status.eq.completed,start_time.gte.${thirtyDaysAgoISO},scheduled_time.gte.${thirtyDaysAgoISO},scheduled_time.is.null,start_time.is.null`)
  .order('status', { ascending: false }) // in_progress first, then completed
  .order('scheduled_time', { ascending: true, nullsFirst: true })
  .order('start_time', { ascending: true, nullsFirst: true })
```

**What This Means:**
- ✅ Scheduled appointments (`status = 'scheduled'`) are automatically included
- ✅ Route optimization considers `scheduled_time` when optimizing
- ✅ When route is applied, scheduled appointments get updated `scheduled_time` based on optimized order

### **What's Missing:**
- ⚠️ Scheduled appointments need `visit_location` (GPS coordinates) to be optimized
- ⚠️ If patient schedules appointment without address geocoding, it won't be included in optimization

**Solution:** When patient schedules appointment, geocode the address to get GPS coordinates:

**Update `app/api/patients/appointments/schedule/route.ts`:**

```typescript
// After getting patientAddress, geocode it
let visitLocation = null
if (patientAddress) {
  // Use geocoding service (OpenStreetMap Nominatim is free)
  const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(patientAddress)}`
  const geocodeRes = await fetch(geocodeUrl)
  const geocodeData = await geocodeRes.json()
  
  if (geocodeData && geocodeData.length > 0) {
    visitLocation = {
      lat: parseFloat(geocodeData[0].lat),
      lng: parseFloat(geocodeData[0].lon),
      address: patientAddress
    }
  }
}

// Include visit_location in visitData
const visitData: any = {
  staff_id: finalStaffId,
  patient_name: patientName,
  patient_address: patientAddress || location || "Home Visit",
  visit_type: visitType,
  scheduled_time: scheduledTime,
  start_time: null,
  status: "scheduled",
  visit_location: visitLocation, // ADD THIS
  notes: notes || null,
}
```

---

## 3️⃣ **Fleet Management Integration** (`/fleet-management`)

### **Current Status:**
⚠️ **PARTIALLY IMPLEMENTED** - Fleet management shows current visits but does NOT show upcoming scheduled appointments.

### **What Needs to be Implemented:**

#### **A. Display Upcoming Appointments**
- For each staff member, fetch scheduled appointments
- Show in a "Next Appointments" or "Upcoming Visits" section
- Display: Patient name, scheduled time, visit type

#### **B. Code Implementation:**

**Update `app/fleet-management/page.tsx`:**

```typescript
// Add to StaffFleetMember interface
interface StaffFleetMember {
  // ... existing fields ...
  upcomingAppointments?: Array<{
    id: string
    patientName: string
    scheduledTime: string
    visitType: string
    address: string
  }>
}

// In loadFleetData function, after fetching staff location:
// Get scheduled appointments for each staff
const appointmentsRes = await fetch(
  `/api/visits/scheduled?staff_id=${encodeURIComponent(staff.id)}`,
  { cache: 'no-store' }
)
const appointmentsData = await appointmentsRes.json()

const upcomingAppointments = (appointmentsData.success && appointmentsData.appointments) 
  ? appointmentsData.appointments.map((apt: any) => ({
      id: apt.id,
      patientName: apt.patient_name,
      scheduledTime: apt.scheduled_time,
      visitType: apt.visit_type,
      address: apt.patient_address,
    }))
  : []

// Add to fleet member data
fleetMember.upcomingAppointments = upcomingAppointments
```

**Display in UI:**

```typescript
// In the staff card/table row, add:
{staffMember.upcomingAppointments && staffMember.upcomingAppointments.length > 0 && (
  <div className="mt-2">
    <p className="text-xs font-semibold text-gray-600 mb-1">Upcoming Appointments:</p>
    {staffMember.upcomingAppointments.slice(0, 3).map((apt) => (
      <div key={apt.id} className="text-xs text-gray-500 mb-1">
        <Clock className="h-3 w-3 inline mr-1" />
        {new Date(apt.scheduledTime).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })} - {apt.patientName} ({apt.visitType})
      </div>
    ))}
    {staffMember.upcomingAppointments.length > 3 && (
      <p className="text-xs text-gray-400">
        +{staffMember.upcomingAppointments.length - 3} more
      </p>
    )}
  </div>
)}
```

---

## 📊 **Summary: What's Working vs What's Missing**

| Feature | Status | Notes |
|---------|--------|-------|
| **Patient Portal → Create Appointment** | ✅ Working | Creates `staff_visits` with `status: 'scheduled'` |
| **Route Optimization → Include Scheduled** | ✅ Working | Already includes scheduled appointments in optimization |
| **Track Page → Show Scheduled** | ❌ Missing | Need to add scheduled appointments display |
| **Track Page → Start Scheduled** | ❌ Missing | Need to add "Start Visit" button for scheduled appointments |
| **Fleet Management → Show Upcoming** | ❌ Missing | Need to add upcoming appointments display |
| **Geocoding → Address to GPS** | ⚠️ Partial | Need to geocode addresses when scheduling to enable route optimization |

---

## 🚀 **Implementation Priority**

1. **HIGH:** Add geocoding to appointment scheduling (so appointments can be optimized)
2. **HIGH:** Display scheduled appointments in Track Page
3. **MEDIUM:** Start scheduled appointment from Track Page
4. **MEDIUM:** Display upcoming appointments in Fleet Management

---

## 🔧 **Quick Implementation Checklist**

- [ ] Create `/api/visits/scheduled` endpoint
- [ ] Add geocoding to `/api/patients/appointments/schedule`
- [ ] Update Track Page to fetch and display scheduled appointments
- [ ] Add "Start Visit" functionality for scheduled appointments
- [ ] Update Fleet Management to show upcoming appointments
- [ ] Test end-to-end flow: Schedule → Track → Optimize → Fleet

---

## 📝 **Notes**

- All appointments are stored in `staff_visits` table
- Status values: `'scheduled'`, `'in_progress'`, `'completed'`, `'cancelled'`
- Scheduled appointments need `visit_location` (GPS coordinates) for route optimization
- Patient Portal appointments automatically assign to `assigned_staff_id` from patient record

