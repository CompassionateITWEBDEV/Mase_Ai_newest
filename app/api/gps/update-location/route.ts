import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { staffId, tripId, latitude, longitude, accuracy, speed, heading } = await request.json()

    if (!staffId || !latitude || !longitude) {
      return NextResponse.json({ error: "Staff ID, latitude, and longitude are required" }, { status: 400 })
    }

    // Accept different accuracy levels based on device type
    // PC/Laptop: WiFi-based location (100-1000m accuracy) - acceptable
    // Mobile: Device GPS (< 100m accuracy) - preferred
    // IP geolocation: (> 1000m accuracy) - reject
    // Note: We allow up to 2000m to accommodate PC WiFi location which can be 500-1500m
    if (accuracy && accuracy > 2000) {
      return NextResponse.json({ 
        success: false,
        error: "Location accuracy too low. Current accuracy: " + accuracy.toFixed(0) + "m. Please ensure location services are enabled. For best accuracy, use a mobile device with GPS.",
        requiresDeviceGPS: true
      }, { status: 400 })
    }
    
    // Log warning if accuracy is high (but still accept it for PC compatibility)
    if (accuracy && accuracy > 1000) {
      console.warn(`Location accuracy is high (${accuracy.toFixed(0)}m) - may be using WiFi-based location on PC. For better accuracy, use mobile device with GPS.`)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get active trip if tripId not provided
    let activeTripId = tripId
    if (!activeTripId) {
      const { data: activeTrip } = await supabase
        .from('staff_trips')
        .select('id')
        .eq('staff_id', staffId)
        .eq('status', 'active')
        .single()
      
      activeTripId = activeTrip?.id
    }

    // Save location update
    const { data: locationUpdate, error: locationError } = await supabase
      .from('staff_location_updates')
      .insert({
        staff_id: staffId,
        trip_id: activeTripId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseFloat(heading) : null
      })
      .select()
      .single()

    if (locationError) {
      console.error('Error saving location:', locationError)
      return NextResponse.json({ error: locationError.message }, { status: 500 })
    }

    // Update trip route points if we have an active trip
    // Only add route points when staff is actually driving (speed > 5 mph or significant movement)
    if (activeTripId) {
      // Get current route points to check distance moved
      const { data: trip } = await supabase
        .from('staff_trips')
        .select('route_points')
        .eq('id', activeTripId)
        .single()

      if (trip) {
        const routePoints = (trip.route_points || []) as any[]
        const currentLat = parseFloat(latitude)
        const currentLng = parseFloat(longitude)
        
        // Check if staff is actually moving
        let isMoving = false
        
        // Method 1: Use speed if available (must be > 5 mph to be considered driving)
        if (speed && speed > 5) {
          isMoving = true
        }
        // Method 2: If no speed data, check if moved significant distance (> 0.01 miles = ~16 meters)
        else if (routePoints.length > 0) {
          const lastPoint = routePoints[routePoints.length - 1]
          if (lastPoint.lat && lastPoint.lng) {
            // Calculate distance using Haversine formula
            const R = 3959 // Earth radius in miles
            const dLat = (currentLat - lastPoint.lat) * Math.PI / 180
            const dLon = (currentLng - lastPoint.lng) * Math.PI / 180
            const a = 
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lastPoint.lat * Math.PI / 180) * Math.cos(currentLat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            const distance = R * c
            
            // Only consider moving if moved more than 0.01 miles (~16 meters) since last point
            if (distance > 0.01) {
              isMoving = true
            }
          }
        } else {
          // First point - always add it
          isMoving = true
        }
        
        // Only add route point if actually moving (driving)
        if (isMoving) {
          const routePoint = {
            lat: currentLat,
            lng: currentLng,
            timestamp: new Date().toISOString(),
            speed: speed || null // Store speed for reference
          }
          
          routePoints.push(routePoint)

          // Keep only last 1000 points to avoid bloating
          const trimmedPoints = routePoints.slice(-1000)

          await supabase
            .from('staff_trips')
            .update({ route_points: trimmedPoints })
            .eq('id', activeTripId)
        }
        // If not moving (idle), don't add route point - this prevents counting idle time as miles
      }
    }

    return NextResponse.json({
      success: true,
      message: "Location updated successfully",
      location: {
        id: locationUpdate.id,
        latitude: locationUpdate.latitude,
        longitude: locationUpdate.longitude,
        timestamp: locationUpdate.timestamp
      }
    })
  } catch (error: any) {
    console.error("Error updating location:", error)
    return NextResponse.json({ error: error.message || "Failed to update location" }, { status: 500 })
  }
}
