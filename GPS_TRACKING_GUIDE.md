# GPS Staff Performance Tracking - Complete Guide

## Overview
This system tracks staff performance using GPS tracking, recording trips, visits, drive time, distance, and efficiency metrics.

## How It Works

### 1. Database Setup
Run the SQL migration to create all necessary tables:
```sql
-- Run this in Supabase SQL Editor
scripts/055-create-gps-tracking-tables.sql
```

Tables created:
- `staff_trips` - Tracks each trip/journey
- `staff_visits` - Records patient visits
- `staff_location_updates` - Stores GPS pings
- `staff_performance_stats` - Daily/weekly aggregates

### 2. Staff Workflow

#### Step 1: Staff Starts Trip
Staff navigates to: `/track/[staffId]` (where staffId is their ID)

1. Page requests location permission
2. Click "Start Trip" button
3. System:
   - Creates a trip record in database
   - Starts GPS tracking
   - Records start location

**API Call:** `POST /api/gps/start-trip`
```json
{
  "staffId": "uuid",
  "latitude": 34.0522,
  "longitude": -118.2437
}
```

#### Step 2: GPS Location Updates (Automatic)
Every 30 seconds while trip is active:
- Browser sends location to server
- Server saves location update
- Updates trip route points

**API Call:** `POST /api/gps/update-location`
```json
{
  "staffId": "uuid",
  "tripId": "uuid",
  "latitude": 34.0522,
  "longitude": -118.2437,
  "accuracy": 10,
  "speed": 25,
  "heading": 90
}
```

#### Step 3: Start Patient Visit
When staff arrives at patient location:

1. Fill in visit form:
   - Patient Name
   - Patient Address
   - Visit Type (Wound Care, PT, OT, etc.)
2. Click "Start Visit"
3. System:
   - Creates visit record
   - Calculates drive time to visit
   - Calculates distance from trip start

**API Call:** `POST /api/visits/start`
```json
{
  "staffId": "uuid",
  "tripId": "uuid",
  "patientName": "John Doe",
  "patientAddress": "123 Main St",
  "visitType": "Wound Care",
  "latitude": 34.0522,
  "longitude": -118.2437
}
```

#### Step 4: End Patient Visit
When visit is complete:

1. Add optional notes
2. Click "End Visit"
3. System:
   - Calculates visit duration
   - Updates performance stats

**API Call:** `POST /api/visits/end`
```json
{
  "visitId": "uuid",
  "notes": "Patient doing well"
}
```

#### Step 5: End Trip
At end of workday:

1. Click "End Trip"
2. System:
   - Calculates total drive time
   - Calculates total distance from route points
   - Updates performance stats
   - Marks trip as completed

**API Call:** `POST /api/gps/end-trip`
```json
{
  "tripId": "uuid",
  "latitude": 34.0522,
  "longitude": -118.2437
}
```

### 3. Performance Dashboard

Admins/Managers view performance at: `/staff-performance`

**API Call:** `GET /api/staff-performance/stats?staff_id=uuid&period=day`

Returns:
- Today's stats (drive time, visits, miles, efficiency)
- Week's stats (aggregated)
- List of today's visits with details

### 4. Metrics Calculated

**Drive Time:** From trip start to trip end (minutes)

**Distance:** Sum of distances between GPS route points (miles)

**Visit Duration:** From visit start to visit end (minutes)

**Efficiency Score:** `(Visit Time / (Visit Time + Drive Time)) * 100`
- Higher = more time with patients vs driving
- Target: 70%+

**Cost per Mile:** Default $0.67/mile (IRS standard)
- Can be customized per staff/vehicle

**Total Cost:** `Distance * Cost per Mile`

### 5. Real-Time Features

- Location updates every 30 seconds during active trips
- Route points stored (last 1000 points per trip)
- Visit tracking with drive time calculation
- Automatic performance stat aggregation

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/gps/start-trip` | POST | Start a new trip |
| `/api/gps/update-location` | POST | Update GPS location |
| `/api/gps/end-trip` | POST | End trip, calculate stats |
| `/api/visits/start` | POST | Start patient visit |
| `/api/visits/end` | POST | End visit, record duration |
| `/api/staff-performance/stats` | GET | Get performance metrics |

## Security

- All endpoints use Supabase Service Role Key for database access
- RLS policies allow authenticated users to read their own data
- Service role can write all data (for API operations)

## Mobile Usage

The tracking page (`/track/[staffId]`) is mobile-optimized:
- Works on phones/tablets
- Uses browser Geolocation API
- Simple buttons for trip/visit control
- Real-time location display

## Testing the System

1. **Create a staff member** (if not exists)
2. **Get staff ID** from staff table
3. **Navigate to:** `/track/[staffId]`
4. **Start trip** → Location will be requested
5. **Start visit** → Fill patient info
6. **End visit** → Records duration
7. **End trip** → Calculates all stats
8. **View performance** → `/staff-performance`

## Performance Stats View

The performance dashboard shows:
- Real-time stats (updates on page refresh)
- Drive time breakdown
- Visit details table
- Efficiency scores
- Cost analysis

All data comes from database, not mock data!

## Troubleshooting

**Location not working:**
- Check browser permissions
- Make sure HTTPS is enabled (required for geolocation)
- Try refreshing location manually

**Stats not showing:**
- Verify SQL migration ran successfully
- Check staff ID is correct
- Look for errors in browser console

**Trip won't end:**
- Check if there are active visits (end those first)
- Verify trip exists in database

## Next Steps

Optional enhancements:
- Real-time map view with route display
- Push notifications for trip start/end
- Route optimization suggestions
- Integration with Google Maps for better distance calculation
- Email/SMS alerts for managers

