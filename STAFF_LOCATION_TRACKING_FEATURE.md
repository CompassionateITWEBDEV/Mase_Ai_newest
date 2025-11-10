# Staff Location Tracking Feature - Staff Performance Page

## ✅ Feature Implemented

Added a **real-time location tracking** feature to the Staff Performance page that displays the current location of selected staff members.

---

## 🎯 What It Does

1. **Displays Current Location:**
   - Shows GPS coordinates (latitude, longitude)
   - Displays location accuracy
   - Shows last update timestamp
   - Status indicator (driving, on_visit, active, offline)

2. **Auto-Refresh:**
   - Automatically refreshes location every 30 seconds
   - Manual refresh button available

3. **Google Maps Integration:**
   - "View on Google Maps" button opens location in Google Maps
   - Direct link to exact coordinates

---

## 📁 Files Modified/Created

### **1. New API Endpoint: `app/api/gps/staff-location/route.ts`**
- **Purpose:** Fetches the last known location of a staff member from the database
- **Method:** GET
- **Query Parameter:** `staff_id`
- **Returns:**
  - Current location (latitude, longitude, accuracy, timestamp)
  - Active trip information
  - Current visit information
  - Staff status (driving, on_visit, active, offline)

**Data Sources:**
- `staff_location_updates` table - Last GPS location update
- `staff_trips` table - Active trip information
- `staff_visits` table - Current visit information
- `staff` table - Staff member details

### **2. Updated: `app/staff-performance/page.tsx`**
- **Added State:**
  - `staffLocation` - Stores current location data
  - `locationLoading` - Loading state
  - `locationError` - Error state

- **Added Features:**
  - Location display card in Staff Header section
  - Auto-refresh every 30 seconds
  - Manual refresh button
  - Google Maps link button
  - Loading and error states

- **New Icons:**
  - `MapPin` - Location indicator
  - `ExternalLink` - External link indicator
  - `RefreshCw` - Refresh button

---

## 🔄 How It Works

### **1. Location Fetching:**
```
User selects staff member
    ↓
useEffect triggers
    ↓
Fetch: GET /api/gps/staff-location?staff_id={id}
    ↓
API queries database:
  - staff_location_updates (last location)
  - staff_trips (active trip)
  - staff_visits (current visit)
    ↓
Returns location data
    ↓
Display in UI
```

### **2. Auto-Refresh:**
```
Every 30 seconds:
    ↓
Check if staff is selected
    ↓
Fetch latest location
    ↓
Update UI
```

### **3. Status Determination:**
- **`driving`** - Has active trip, no active visit
- **`on_visit`** - Has active trip AND active visit
- **`active`** - Location updated within last 5 minutes, no active trip
- **`offline`** - No recent location updates

---

## 📊 UI Components

### **Location Display Card:**
Located in the Staff Header section, below the staff name and efficiency score.

**Features:**
- Blue background with border
- MapPin icon
- Refresh button (top right)
- Coordinates display
- Accuracy indicator
- Last update timestamp
- "View on Google Maps" button

**States:**
- **Loading:** Shows "Loading location..."
- **Error:** Shows error message
- **No Data:** Shows "No location data available"
- **Has Data:** Shows full location details

---

## 🔗 Integration Points

### **Database Tables:**
1. **`staff_location_updates`**
   - Stores GPS location pings
   - Updated every 30 seconds during active tracking
   - Fields: `latitude`, `longitude`, `accuracy`, `timestamp`

2. **`staff_trips`**
   - Tracks active trips
   - Used to determine if staff is driving
   - Fields: `id`, `status`, `start_time`

3. **`staff_visits`**
   - Tracks active visits
   - Used to determine if staff is on a visit
   - Fields: `id`, `status`, `start_time`

### **Related Features:**
- **GPS Tracking Page** (`/track/[staffId]`) - Where location updates originate
- **Staff Dashboard** - Can also show location (future enhancement)
- **Staff Performance Stats** - Location data used for distance calculations

---

## 🎨 UI Preview

```
┌─────────────────────────────────────────────────┐
│ [Staff Avatar]  Staff Name                     │
│                 Role                            │
│                 [Status Badge]                  │
│                                                 │
│ ┌───────────────────────────────────────────┐ │
│ │ 📍 Current Location          [🔄 Refresh] │ │
│ │                                             │ │
│ │ Coordinates: 34.052235, -118.243683        │ │
│ │ Accuracy: ±10m                              │ │
│ │ Last Update: 12/15/2024, 2:30:45 PM       │ │
│ │ ─────────────────────────────────────────  │ │
│ │ [📍 View on Google Maps 🔗]                │ │
│ └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## ✅ Features

- ✅ Real-time location display
- ✅ Auto-refresh every 30 seconds
- ✅ Manual refresh button
- ✅ Google Maps integration
- ✅ Location accuracy display
- ✅ Last update timestamp
- ✅ Status indicators
- ✅ Loading states
- ✅ Error handling
- ✅ No data fallback

---

## 🔧 Technical Details

### **API Endpoint:**
```
GET /api/gps/staff-location?staff_id={staffId}
```

### **Response Format:**
```json
{
  "success": true,
  "staff": {
    "id": "uuid",
    "name": "Staff Name",
    "department": "Department"
  },
  "currentLocation": {
    "latitude": 34.052235,
    "longitude": -118.243683,
    "accuracy": 10,
    "speed": null,
    "heading": null,
    "timestamp": "2024-12-15T14:30:45Z",
    "address": "34.052235, -118.243683"
  },
  "activeTrip": {
    "id": "trip-uuid",
    "startTime": "2024-12-15T14:00:00Z",
    "routePoints": [...]
  },
  "currentVisit": {
    "id": "visit-uuid",
    "patientName": "Patient Name",
    "patientAddress": "123 Main St",
    "visitLocation": {...},
    "startTime": "2024-12-15T14:15:00Z"
  },
  "status": "driving",
  "lastUpdateTime": "2024-12-15T14:30:45Z"
}
```

### **Location Update Frequency:**
- **Auto-refresh:** Every 30 seconds
- **Manual refresh:** On button click
- **GPS updates:** Every 30 seconds (from tracking page)

---

## 🚀 Usage

1. **Navigate to Staff Performance Page:**
   - Go to `/staff-performance`

2. **Select a Staff Member:**
   - Click on a staff member from the left sidebar

3. **View Location:**
   - Location card appears in the Staff Header section
   - Shows current coordinates, accuracy, and last update time

4. **Refresh Location:**
   - Click the "Refresh" button (top right of location card)
   - Or wait for auto-refresh (every 30 seconds)

5. **View on Google Maps:**
   - Click "View on Google Maps" button
   - Opens Google Maps in a new tab with exact coordinates

---

## 📝 Notes

- **Location Data Source:** 
  - Location comes from `staff_location_updates` table
  - Updated by the GPS tracking page (`/track/[staffId]`)
  - Only shows if staff has started tracking

- **Status Logic:**
  - Status is determined by active trips and visits
  - "offline" means no recent location updates (older than 5 minutes)

- **Google Maps:**
  - Opens in new tab
  - Uses coordinates format: `?q=lat,lng`
  - Shows exact location on map

- **Performance:**
  - Auto-refresh only runs when staff is selected
  - Cleans up interval on unmount
  - Uses `cache: 'no-store'` for fresh data

---

## 🔮 Future Enhancements

- [ ] Add map embed directly in the page
- [ ] Show route history on map
- [ ] Add distance calculation to office/patients
- [ ] Add ETA calculations
- [ ] Add location history timeline
- [ ] Add geofencing alerts
- [ ] Add location sharing with patients

---

**Last Updated:** 2024
**Status:** ✅ Fully Implemented and Working

