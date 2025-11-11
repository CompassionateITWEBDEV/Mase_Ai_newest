# Fleet Management - Live Staff Locations Setup Guide

## Overview
The Fleet Management page provides real-time GPS tracking and location visualization for field staff. This guide will help you set it up correctly.

## ✅ FREE MAP SOLUTION - No API Key Required!

**Good News!** The map now uses **OpenStreetMap with Leaflet.js** - completely **FREE** and open source! No API key needed, no payment required, no credit card needed!

### How It Works
- Uses OpenStreetMap tiles (free, community-maintained maps)
- Powered by Leaflet.js (open source mapping library)
- No API keys, no costs, no limits
- Works exactly like Google Maps but completely free!

## Optional: Google Maps API (If You Want to Use It)

If you prefer Google Maps (requires payment after free tier), you can configure it:

### Step 1: Get a Google Maps API Key (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API** (required for map display)
   - **Places API** (optional, for address autocomplete)
   - **Geocoding API** (optional, for address lookup)
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key
6. (Recommended) Restrict the API key:
   - Click on the API key to edit it
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain (e.g., `localhost:3000/*`, `yourdomain.com/*`)

### Step 2: Add to Environment Variables (Optional)

**Note:** This is only needed if you want to use Google Maps instead of the free OpenStreetMap.

**For Local Development:**
Create or update `.env.local` in your project root:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key-here
```

**For Production:**
Add the environment variable in your hosting platform's settings.

### Step 3: Restart Your Server

After adding the environment variable (if using Google Maps):

```bash
# Stop your dev server (Ctrl+C)
# Then restart it
npm run dev
# or
pnpm dev
```

**Note:** If you're using OpenStreetMap (default), you don't need to do anything - it works immediately!

### 2. GPS Tracking Setup

For staff to appear on the map, they need to:

1. **Start GPS Tracking:**
   - Staff should use the GPS tracking feature from their dashboard
   - They need to click "Start Trip" to begin tracking
   - Location updates are sent every 30 seconds during active trips

2. **Enable Location Services:**
   - Staff must allow location access in their browser
   - For best accuracy, use a mobile device with GPS
   - Desktop/laptop may use WiFi-based location (less accurate)

3. **Active Trips:**
   - Staff must have an active trip (`staff_trips` table with `status = 'active'`)
   - Or recent location updates (`staff_location_updates` table)

## How It Works

### Status Detection

The system determines staff status based on:

1. **GPS Location Data:**
   - Speed > 5 mph → "En Route"
   - Active trip with in-progress visit → "On Visit"
   - Active trip, no visit → "Idle" or "En Route"
   - No recent location → "Offline"

2. **Database Records:**
   - Active trips in `staff_trips` table
   - In-progress visits in `staff_visits` table
   - Recent location updates in `staff_location_updates` table

### Location Accuracy

- **GPS (Mobile):** < 100m accuracy - Best
- **WiFi (Desktop):** 100-1000m accuracy - Acceptable
- **IP Geolocation:** > 1000m accuracy - Rejected (not shown on map)

Locations older than 30 minutes are considered stale and may not be displayed.

## Troubleshooting

### Map Not Showing

**If using OpenStreetMap (default - FREE):**
1. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Look for any JavaScript errors
   - Check Network tab for failed tile requests

2. **Check Internet Connection:**
   - OpenStreetMap requires internet to load map tiles
   - Ensure you're connected to the internet

3. **Clear Browser Cache:**
   - Sometimes cached files can cause issues
   - Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

**If using Google Maps (optional):**
1. **Check API Key:**
   - Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env.local`
   - Restart your dev server after adding the key
   - Check browser console for API key errors

2. **Check API Restrictions:**
   - If you restricted the API key, ensure your domain is allowed
   - For localhost, add `localhost:3000/*` to allowed referrers

3. **Check API Quotas:**
   - Google Maps API has usage limits
   - Check your [Google Cloud Console](https://console.cloud.google.com/) for quota issues

### All Staff Showing as "Offline"

1. **Check GPS Tracking:**
   - Staff need to start a trip from their dashboard
   - Verify they have active trips in the database

2. **Check Location Updates:**
   - Staff location must be updated within the last 30 minutes
   - Check `staff_location_updates` table for recent entries

3. **Check Browser Permissions:**
   - Staff must allow location access in their browser
   - Check browser console for permission errors

### No Staff Locations on Map

1. **Verify Location Data:**
   - Staff must have valid GPS coordinates
   - Locations must be recent (within 30 minutes)
   - IP geolocation is rejected (accuracy > 2000m)

2. **Check Database:**
   - Verify `staff_trips` table has active trips
   - Verify `staff_location_updates` table has recent entries
   - Check that `route_points` in active trips contain valid coordinates

## Features

### Real-Time Updates
- Map refreshes every 30 seconds automatically
- Manual refresh button available
- Staff locations update in real-time

### Filtering
- Filter by status: All, En Route, On Visit, Idle
- Click on staff in the list to view details
- Click on map markers to see staff info

### Staff Details
- Current status and speed
- Next patient and ETA
- Efficiency score
- Today's performance metrics

## API Endpoints Used

1. **GET `/api/staff/list`** - Get all active staff
2. **GET `/api/staff-performance/stats?staff_id=xxx&period=day`** - Get performance stats
3. **GET `/api/gps/staff-location?staff_id=xxx`** - Get GPS location and status

## Database Tables

- `staff` - Staff member information
- `staff_trips` - Active/completed trips
- `staff_visits` - Patient visits
- `staff_location_updates` - GPS location pings
- `staff_performance_stats` - Daily performance metrics

## Next Steps

1. Set up Google Maps API key (see above)
2. Have staff start GPS tracking from their dashboard
3. View the map at `/fleet-management`
4. Monitor staff locations in real-time

For more information about GPS tracking, see `GPS_TRACKING_GUIDE.md`.

