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

    // Reject IP-based geolocation - require device GPS (accuracy should be < 1000m)
    // IP geolocation typically has accuracy > 1000m (often 5000m+)
    // Device GPS should have accuracy < 100m (usually 5-50m)
    if (accuracy && accuracy > 1000) {
      return NextResponse.json({ 
        success: false,
        error: "Location accuracy too low. Please enable device GPS (not IP geolocation). Current accuracy: " + accuracy.toFixed(0) + "m. Device GPS should be < 100m.",
        requiresDeviceGPS: true
      }, { status: 400 })
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
    if (activeTripId) {
      const routePoint = {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
        timestamp: new Date().toISOString()
      }

      // Get current route points and append new one
      const { data: trip } = await supabase
        .from('staff_trips')
        .select('route_points')
        .eq('id', activeTripId)
        .single()

      if (trip) {
        const routePoints = (trip.route_points || []) as any[]
        routePoints.push(routePoint)

        // Keep only last 1000 points to avoid bloating
        const trimmedPoints = routePoints.slice(-1000)

        await supabase
          .from('staff_trips')
          .update({ route_points: trimmedPoints })
          .eq('id', activeTripId)
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
