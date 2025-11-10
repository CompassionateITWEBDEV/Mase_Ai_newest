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

    // Get last known location from staff_location_updates (most recent only)
    const { data: lastLocation, error: locationError } = await supabase
      .from('staff_location_updates')
      .select('latitude, longitude, accuracy, speed, heading, timestamp, trip_id')
      .eq('staff_id', staffId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Validate location is recent (within last 30 minutes) - if older, it might be stale
    let isLocationRecent = false
    let locationAgeMinutes = null
    let isIPGeolocation = false
    if (lastLocation?.timestamp) {
      const locationTime = new Date(lastLocation.timestamp)
      const now = new Date()
      locationAgeMinutes = Math.round((now.getTime() - locationTime.getTime()) / 60000)
      isLocationRecent = locationAgeMinutes <= 30 // Consider recent if within 30 minutes
      
      // Check if location is IP-based (accuracy > 1000m)
      if (lastLocation.accuracy && parseFloat(lastLocation.accuracy.toString()) > 1000) {
        isIPGeolocation = true
      }
    }

    // Get active trip if exists
    const { data: activeTrip } = await supabase
      .from('staff_trips')
      .select('id, start_time, start_location, route_points')
      .eq('staff_id', staffId)
      .eq('status', 'active')
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle()

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

    // Determine status
    let status = 'offline'
    if (activeTrip) {
      status = currentVisit ? 'on_visit' : 'driving'
    } else if (lastLocation) {
      // Check if location is recent (within last 5 minutes)
      const lastUpdateTime = new Date(lastLocation.timestamp)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      if (lastUpdateTime > fiveMinutesAgo) {
        status = 'active'
      }
    }

    // Get address from coordinates (optional - can use reverse geocoding API)
    let address = null
    if (lastLocation?.latitude && lastLocation?.longitude) {
      // For now, we'll just return coordinates
      // In production, you could use Google Maps Geocoding API or similar
      address = `${lastLocation.latitude.toFixed(6)}, ${lastLocation.longitude.toFixed(6)}`
    }

    return NextResponse.json({
      success: true,
      staff: staff ? {
        id: staff.id,
        name: staff.name,
        department: staff.department
      } : null,
      currentLocation: lastLocation ? {
        latitude: parseFloat(lastLocation.latitude.toString()),
        longitude: parseFloat(lastLocation.longitude.toString()),
        accuracy: lastLocation.accuracy ? parseFloat(lastLocation.accuracy.toString()) : null,
        speed: lastLocation.speed ? parseFloat(lastLocation.speed.toString()) : null,
        heading: lastLocation.heading ? parseFloat(lastLocation.heading.toString()) : null,
        timestamp: lastLocation.timestamp,
        address: address,
        isRecent: isLocationRecent,
        ageMinutes: locationAgeMinutes,
        isIPGeolocation: isIPGeolocation
      } : null,
      activeTrip: activeTrip ? {
        id: activeTrip.id,
        startTime: activeTrip.start_time,
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
      lastUpdateTime: lastLocation?.timestamp || null
    })
  } catch (error: any) {
    console.error("Error fetching staff location:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch staff location" }, { status: 500 })
  }
}

