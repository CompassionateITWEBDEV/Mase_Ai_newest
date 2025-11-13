import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staff_id')

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get active trip first (if exists, use its route points for most accurate location)
    const { data: activeTrip } = await supabase
      .from('staff_trips')
      .select('id, start_time, start_location, route_points')
      .eq('staff_id', staffId)
      .eq('status', 'active')
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Get last known location from staff_location_updates (most recent only)
    const { data: lastLocation, error: locationError } = await supabase
      .from('staff_location_updates')
      .select('latitude, longitude, accuracy, speed, heading, timestamp, trip_id')
      .eq('staff_id', staffId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Prioritize active trip route points for most accurate current location
    let useLocation = lastLocation
    if (activeTrip?.route_points && Array.isArray(activeTrip.route_points) && activeTrip.route_points.length > 0) {
      // Get the most recent route point (last in array) - this is the most current GPS location
      const latestRoutePoint = activeTrip.route_points[activeTrip.route_points.length - 1]
      if (latestRoutePoint && latestRoutePoint.lat && latestRoutePoint.lng) {
        // Use route point from active trip - this is the most accurate current location
        useLocation = {
          latitude: latestRoutePoint.lat,
          longitude: latestRoutePoint.lng,
          accuracy: 10, // GPS route points have good accuracy
          speed: null,
          heading: null,
          timestamp: latestRoutePoint.timestamp || new Date().toISOString(),
          trip_id: activeTrip.id
        }
      }
    } else if (lastLocation && lastLocation.accuracy && parseFloat(lastLocation.accuracy.toString()) > 1000) {
      // If no active trip and location is IP-based, don't use it
      useLocation = null
    }

    // Validate location is recent (within last 30 minutes) - if older, it might be stale
    let isLocationRecent = false
    let locationAgeMinutes = null
    let isIPGeolocation = false
    if (useLocation?.timestamp) {
      const locationTime = new Date(useLocation.timestamp)
      const now = new Date()
      locationAgeMinutes = Math.round((now.getTime() - locationTime.getTime()) / 60000)
      isLocationRecent = locationAgeMinutes <= 30 // Consider recent if within 30 minutes
      
      // Check if location is IP-based (accuracy > 1000m)
      if (useLocation.accuracy && parseFloat(useLocation.accuracy.toString()) > 1000) {
        isIPGeolocation = true
      }
    }


    // Get current visit if exists
    const { data: currentVisit } = await supabase
      .from('staff_visits')
      .select('id, patient_name, patient_address, visit_location, start_time')
      .eq('staff_id', staffId)
      .eq('status', 'in_progress')
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Get staff info
    const { data: staff } = await supabase
      .from('staff')
      .select('id, name, department')
      .eq('id', staffId)
      .single()

    // Determine status - FIXED: More accurate status detection
    let status = 'offline'
    
    if (currentVisit) {
      // Has active visit - definitely on visit
      status = 'on_visit'
    } else if (activeTrip) {
      // Has active trip - check if actually moving
      if (useLocation?.speed && useLocation.speed > 5) {
        // Has speed > 5 mph - actually driving
        status = 'driving'
      } else if (isLocationRecent) {
        // Recent location but no speed - might be stationary
        status = 'active' // Active but not necessarily driving
      } else {
        // Active trip but no recent location - might be stale
        const tripAge = activeTrip.start_time 
          ? Math.round((new Date().getTime() - new Date(activeTrip.start_time).getTime()) / 60000)
          : null
        
        if (tripAge !== null && tripAge > 480) {
          // Trip older than 8 hours - likely stale
          status = 'offline'
        } else {
          status = 'active'
        }
      }
    } else if (useLocation && isLocationRecent) {
      // Recent location but no active trip
      status = 'active'
    }

    // Get address from coordinates (optional - can use reverse geocoding API)
    let address = null
    if (useLocation?.latitude && useLocation?.longitude) {
      // For now, we'll just return coordinates
      // In production, you could use Google Maps Geocoding API or similar
      address = `${useLocation.latitude.toFixed(6)}, ${useLocation.longitude.toFixed(6)}`
    }

    return NextResponse.json({
      success: true,
      staff: staff ? {
        id: staff.id,
        name: staff.name,
        department: staff.department
      } : null,
      currentLocation: useLocation ? {
        latitude: parseFloat(useLocation.latitude.toString()),
        longitude: parseFloat(useLocation.longitude.toString()),
        accuracy: useLocation.accuracy ? parseFloat(useLocation.accuracy.toString()) : null,
        speed: useLocation.speed ? parseFloat(useLocation.speed.toString()) : null,
        heading: useLocation.heading ? parseFloat(useLocation.heading.toString()) : null,
        timestamp: useLocation.timestamp,
        address: address,
        isRecent: isLocationRecent,
        ageMinutes: locationAgeMinutes,
        isIPGeolocation: isIPGeolocation
      } : null,
      activeTrip: activeTrip ? {
        id: activeTrip.id,
        startTime: activeTrip.start_time,
        startLocation: activeTrip.start_location,
        routePoints: activeTrip.route_points || []
      } : null,
      currentVisit: currentVisit ? {
        id: currentVisit.id,
        patientName: currentVisit.patient_name,
        patientAddress: currentVisit.patient_address,
        visitLocation: currentVisit.visit_location,
        startTime: currentVisit.start_time
      } : null,
      status: status,
      lastUpdateTime: useLocation?.timestamp || null,
      hasActiveTrip: !!activeTrip,
      locationSource: useLocation && lastLocation && useLocation !== lastLocation ? 'active_trip_route' : 'location_updates'
    })
  } catch (error: any) {
    console.error("Error fetching staff location:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch staff location" }, { status: 500 })
  }
}

