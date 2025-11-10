# Staff Performance Page - Giunsa Molihok (How It Works)

Kini ang complete explanation sa Staff Performance page feature - giunsa sya molihok ug asa sya gigamit.

---

## 📍 Asa Sya Located

**File:** `app/staff-performance/page.tsx`
**URL:** `/staff-performance`
**Purpose:** Dashboard para makita ang performance metrics sa tanan staff members
**User Type:** **ADMIN/MANAGER SIDE** - Para sa admin/manager para makita ang performance sa different staff members

---

## 🔑 Important: Staff ID Parameter Explanation

### **Para sa Staff (Users):**
- Ang `/track/[staffId]` page naggamit sa `staffId` parameter para ma-identify kinsa ang staff na nag-track
- **Para sa staff mismo:** Ang system **automatic** makakuha sa ilang staff ID gikan sa logged-in user
- **Wala na nila kinahanglan mag-type sa ilang staff ID**
- Ang staff-dashboard nag-match sa `currentUser` (from localStorage) sa staff database
- Ang matched staff record (`selectedStaff.id`) mao ang gamiton para sa tracking link

### **Para sa Admin/Manager:**
- Ang `/staff-performance` page is **ADMIN SIDE**
- Admin can select different staff members gikan sa sidebar
- When admin clicks "View GPS Tracking", ma-redirect sa `/track/[selected-staff-id]`
- Ang `staffId` parameter gikan sa selected staff sa sidebar

### **How Staff ID Matching Works:**

1. **Staff logs in** → `currentUser` saved sa localStorage
2. **Staff Dashboard loads** → Fetches all staff from `/api/staff/list`
3. **System matches** `currentUser` sa staff database:
   - Priority 1: Email match (`currentUser.email === staff.email`)
   - Priority 2: ID match (`currentUser.id === staff.id`)
   - Priority 3: Name match (partial string match)
4. **Matched staff** → `selectedStaff` state set
5. **GPS Tracking link** → Uses `selectedStaff.id` (actual UUID from database)

---

---

## 🎯 Unsa ang Purpose sa Feature

Ang Staff Performance page nag-track ug nag-display sa:
- **Drive Time** - Pila ka oras nag-drive ang staff
- **Total Visits** - Pila ka patient visits ang nahuman
- **Total Miles** - Pila ka miles ang na-drive
- **Visit Time** - Pila ka oras nag-spend sa patient visits
- **Efficiency Score** - Percentage sa time spent sa patients vs driving
- **Cost Analysis** - Pila ang total cost sa driving (miles × cost per mile)
- **Professional Development Plans** - PIP goals ug competency goals

---

## 🔄 Giunsa Molihok (How It Works)

### **Step 1: Data Collection (GPS Tracking)**

Ang data gikan sa GPS tracking system:

1. **Staff mag-start ug trip:**
   - Location: `/track/[staffId]`
   - Click "Start Trip" button
   - System nag-create ug record sa `staff_trips` table
   - GPS tracking mag-start

2. **Automatic location updates:**
   - Every 30 seconds, ang browser mag-send sa location
   - Location saved sa `staff_location_updates` table
   - Route points updated sa `staff_trips` table

3. **Staff mag-start ug visit:**
   - Fill in patient info (name, address, visit type)
   - Click "Start Visit"
   - System nag-create ug record sa `staff_visits` table
   - Calculates drive time gikan trip start

4. **Staff mag-end visit:**
   - Click "End Visit"
   - System calculates visit duration
   - Updates performance stats

5. **Staff mag-end trip:**
   - Click "End Trip"
   - System calculates:
     - Total drive time
     - Total distance gikan route points
     - Updates `staff_performance_stats` table

### **Step 2: Data Display (Performance Dashboard)**

Ang `/staff-performance` page:

1. **Loads all staff members:**
   - Calls `/api/staff/list` para sa tanan staff
   - Para sa each staff, calls `/api/staff-performance/stats?staff_id=xxx&period=day`

2. **Displays metrics:**
   - Today's stats (drive time, visits, miles, efficiency)
   - Week's stats (aggregated from last 7 days)
   - List of today's visits with details
   - Professional Development Plan (PIP goals)

3. **Two tabs:**
   - **Performance Metrics** - Shows drive time, visits, efficiency scores
   - **Professional Development Plan** - Shows PIP goals and competency goals

---

## 📊 Metrics Giunsa Ma-Calculate

### **Drive Time:**
- Gikan sa trip start time hangtod trip end time
- Measured in minutes
- Stored sa `staff_trips.total_drive_time`

### **Distance:**
- Sum sa distances between GPS route points
- Measured in miles
- Calculated gikan sa `staff_trips.route_points` array

### **Visit Duration:**
- Gikan sa visit start time hangtod visit end time
- Measured in minutes
- Stored sa `staff_visits.duration`

### **Efficiency Score:**
```
Efficiency = (Visit Time / (Visit Time + Drive Time)) × 100
```
- Higher score = mas daghan time sa patients vs driving
- Target: 70%+
- Example: 60 minutes visit time + 40 minutes drive = 60% efficiency

### **Cost per Mile:**
- Default: $0.67/mile (IRS standard)
- Can be customized per staff/vehicle
- Stored sa `staff_performance_stats.cost_per_mile`

### **Total Cost:**
```
Total Cost = Distance × Cost per Mile
```

---

## 🗄️ Database Tables Used

### **1. `staff_trips`**
- Tracks each trip/journey
- Fields: `id`, `staff_id`, `start_time`, `end_time`, `start_location`, `end_location`, `total_distance`, `total_drive_time`, `status`, `route_points`

### **2. `staff_visits`**
- Records patient visits
- Fields: `id`, `staff_id`, `trip_id`, `patient_name`, `patient_address`, `visit_type`, `start_time`, `end_time`, `duration`, `drive_time_to_visit`, `distance_to_visit`

### **3. `staff_location_updates`**
- Stores GPS pings
- Fields: `id`, `staff_id`, `trip_id`, `latitude`, `longitude`, `accuracy`, `speed`, `heading`, `timestamp`

### **4. `staff_performance_stats`**
- Daily/weekly aggregates
- Fields: `id`, `staff_id`, `date`, `period`, `total_drive_time`, `total_visits`, `total_miles`, `total_visit_time`, `avg_visit_duration`, `efficiency_score`, `cost_per_mile`, `total_cost`

---

## 🔌 API Endpoints Used

### **1. GET `/api/staff/list`**
- Gets all staff members
- Used to populate staff list sa sidebar

### **2. GET `/api/staff-performance/stats?staff_id=xxx&period=day`**
- Gets performance stats for specific staff
- Returns:
  - `todayStats` - Today's metrics
  - `weekStats` - Last 7 days aggregated
  - `visits` - List of today's visits
  - `status` - Current status (active, on_visit, driving, offline)

### **3. GET `/api/staff-performance/pip-goals?staffId=xxx`**
- Gets Professional Development Plan goals
- Returns:
  - `performanceGoals` - Performance improvement goals
  - `competencyGoals` - Competency improvement goals
  - `totalPips` - Total active PIPs

---

## 🎨 UI Components

### **Left Sidebar:**
- Staff list with search and filter
- Shows staff name, role, and status badge
- Click staff para ma-select ug makita ang details

### **Main Content Area:**

#### **Tab 1: Performance Metrics**
- **Staff Header Card:**
  - Staff name, role, status
  - Efficiency score (large number)

- **Key Metrics Cards (4 cards):**
  - Total Drive Time (with clock icon)
  - Total Visits (with users icon)
  - Total Miles (with route icon)
  - Visit Time (with timer icon)

- **Performance Breakdown Card:**
  - Average Visit Duration
  - Cost per Mile
  - Total Driving Cost
  - Miles per Visit

- **Time Distribution Card:**
  - Progress bars showing Visit Time vs Drive Time
  - Total Active Time

- **Today's Visits Table:**
  - Patient name and address
  - Time range (start - end)
  - Duration badge
  - Drive time badge
  - Distance
  - Visit type badge

#### **Tab 2: Professional Development Plan**
- **Performance Goals Section:**
  - Shows active performance improvement goals
  - Progress bars for each goal
  - Target dates
  - Action items
  - Supervisor name

- **Competency Goals Section:**
  - Shows active competency improvement goals
  - Progress bars for each goal
  - Target dates
  - Action items
  - Supervisor name

- **Summary Stats:**
  - Total active PIPs
  - Number of performance goals
  - Number of competency goals

---

## 🔗 Connected Features

### **1. GPS Tracking Page**
**Location:** `app/track/[staffId]/page.tsx`
**URL:** `/track/[staffId]`
**Connection:** Staff mag-use ani para mag-track sa ilang trips ug visits

**Features:**
- Start/End Trip buttons
- Start/End Visit form
- Real-time location display
- Automatic GPS updates every 30 seconds

### **2. Staff Competency Page**
**Location:** `app/staff-competency/page.tsx`
**URL:** `/staff-competency`
**Connection:** Shares same API endpoint `/api/staff-performance/competency` para sa competency data

### **3. Competency Reviews Page**
**Location:** `app/competency-reviews/page.tsx`
**URL:** `/competency-reviews`
**Connection:** Uses `/api/staff-performance/competency` para sa reviews

---

## 📋 Data Flow Diagram

```
Staff Action (Mobile/Desktop)
    ↓
/track/[staffId] page
    ↓
GPS Tracking APIs:
  - POST /api/gps/start-trip
  - POST /api/gps/update-location (every 30s)
  - POST /api/visits/start
  - POST /api/visits/end
  - POST /api/gps/end-trip
    ↓
Database Tables:
  - staff_trips
  - staff_visits
  - staff_location_updates
  - staff_performance_stats
    ↓
/staff-performance page
    ↓
GET /api/staff-performance/stats
    ↓
Display Metrics in Dashboard
```

---

## 🚀 Asa Mag Sugod (Where to Start)

### **Para sa Staff (Users):**

1. **Access GPS Tracking Page:**
   - **Option 1:** Go to `/staff-dashboard` → Click "GPS Tracking" button sa header
     - Ang system automatically makakuha sa imong staff ID gikan sa logged-in user
     - Wala na nimo kinahanglan mag-type sa imong staff ID
   - **Option 2:** Direct URL: `/track/[your-staff-id]` (replace `[your-staff-id]` with your actual staff UUID from database)
   - **Note:** Ang `/staff-performance` page is for ADMIN side - para makita ang performance sa different staff members

2. **How Staff ID is Identified:**
   - Ang system nag-match sa logged-in user (`currentUser`) sa staff database
   - Matching priority:
     1. Email match (most reliable)
     2. ID match
     3. Name match
   - Ang matched staff record (`selectedStaff`) mao ang gamiton para sa tracking

3. **Start Tracking:**
   - Allow location permission when prompted
   - Click "Start Trip" button

3. **Track Visits:**
   - When arriving at patient location
   - Fill in visit form
   - Click "Start Visit"
   - When done, click "End Visit"

4. **End Trip:**
   - At end of workday
   - Click "End Trip"
   - Stats automatically calculated

### **Para sa Admin/Manager:**

1. **View Performance:**
   - Go to: `/staff-performance` (ADMIN SIDE - para makita ang performance sa different staff)
   - Select staff gikan sa sidebar
   - View metrics sa "Performance Metrics" tab
   - Click "View GPS Tracking" button para makita ang tracking page sa selected staff

2. **View Development Plans:**
   - Select staff
   - Click "Professional Development Plan" tab
   - See active PIP goals and progress

3. **Filter and Search:**
   - Use search box para maghanap sa staff
   - Use role filter para mag-filter by role
   - Switch between "Today" and "This Week" views

4. **Access Staff GPS Tracking:**
   - Select staff gikan sa sidebar
   - Click "View GPS Tracking" button sa header
   - Ma-redirect sa `/track/[selected-staff-id]` with the selected staff's ID

---

## 📊 Sample Data Structure

### **Staff Performance Object:**
```typescript
{
  id: "uuid",
  name: "John Doe",
  role: "RN",
  status: "active" | "on_visit" | "driving" | "offline",
  todayStats: {
    totalDriveTime: 120, // minutes
    totalVisits: 5,
    totalMiles: 45.5,
    totalVisitTime: 300, // minutes
    avgVisitDuration: 60, // minutes
    efficiencyScore: 71, // percentage
    costPerMile: 0.67,
    totalCost: 30.49
  },
  weekStats: {
    // Same structure, aggregated for week
  },
  visits: [
    {
      id: "uuid",
      patientName: "Jane Smith",
      address: "123 Main St",
      startTime: "9:00 AM",
      endTime: "10:00 AM",
      duration: 60, // minutes
      driveTime: 15, // minutes
      distance: 5.2, // miles
      visitType: "Wound Care"
    }
  ]
}
```

---

## ⚠️ Important Notes

1. **GPS Tracking Required:**
   - Staff must use `/track/[staffId]` page para mag-track
   - Without tracking, walay data ma-display

2. **Location Permission:**
   - Browser must allow location access
   - HTTPS required para sa geolocation API

3. **Database Setup:**
   - Must run SQL migration: `scripts/055-create-gps-tracking-tables.sql`
   - Creates all necessary tables

4. **Real-time Updates:**
   - Stats update kada mag-refresh sa page
   - Not real-time (needs page refresh)
   - Location updates every 30 seconds during active trips

5. **Efficiency Score:**
   - Calculated as: `(Visit Time / Total Time) × 100`
   - Higher = better (more time with patients)
   - Target: 70%+ efficiency

---

## 🔍 Related Files

1. **Main Page:** `app/staff-performance/page.tsx`
2. **GPS Tracking Page:** `app/track/[staffId]/page.tsx`
3. **Stats API:** `app/api/staff-performance/stats/route.ts`
4. **PIP Goals API:** `app/api/staff-performance/pip-goals/route.ts`
5. **Start Trip API:** `app/api/gps/start-trip/route.ts`
6. **Update Location API:** `app/api/gps/update-location/route.ts`
7. **End Trip API:** `app/api/gps/end-trip/route.ts`
8. **Start Visit API:** `app/api/visits/start/route.ts`
9. **End Visit API:** `app/api/visits/end/route.ts`
10. **Database Schema:** `scripts/055-create-gps-tracking-tables.sql`
11. **Guide:** `GPS_TRACKING_GUIDE.md`

---

## 💡 Use Cases

### **1. Manager Monitoring:**
- Check efficiency sa staff
- See drive time vs visit time
- Identify staff na masyado daghan drive time
- Monitor cost per staff

### **2. Performance Review:**
- Review weekly stats
- Compare staff performance
- Identify improvement areas
- Track progress sa PIP goals

### **3. Route Optimization:**
- See distance per visit
- Identify inefficient routes
- Plan better visit schedules
- Reduce driving costs

### **4. Compliance:**
- Track visit durations
- Verify staff locations
- Document patient visits
- Audit trail for billing

---

## 🎯 Summary

**Staff Performance Page** is a comprehensive dashboard that:
- ✅ Tracks staff GPS location and trips
- ✅ Records patient visits with timing
- ✅ Calculates efficiency metrics
- ✅ Shows cost analysis
- ✅ Displays Professional Development Plans
- ✅ Provides detailed visit breakdowns
- ✅ Supports today and weekly views

**Main Purpose:** Monitor and analyze staff performance, especially drive time, visit efficiency, and costs.

**Key Feature:** Real-time GPS tracking integrated with performance analytics.

---

**Last Updated:** 2024
**Status:** ✅ Fully Functional (requires GPS tracking data)

