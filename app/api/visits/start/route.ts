import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { staffId, tripId, patientName, patientAddress, visitType, scheduledTime, latitude, longitude } = await request.json()

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get active trip if not provided
    let activeTripId = tripId
    if (!activeTripId) {
      const { data: activeTrip } = await supabase
        .from('staff_trips')
        .select('id, start_time, start_location')
        .eq('staff_id', staffId)
        .eq('status', 'active')
        .single()
      
      if (!activeTrip) {
        return NextResponse.json({ error: "No active trip found. Please start a trip first." }, { status: 400 })
      }
      activeTripId = activeTrip.id
    }

    // Calculate drive time to this visit
    let driveTimeToVisit = 0
    let distanceToVisit = 0

    if (activeTripId) {
      const { data: trip } = await supabase
        .from('staff_trips')
        .select('start_time, start_location, route_points')
        .eq('id', activeTripId)
        .single()

      if (trip && latitude && longitude) {
        const startLocation = trip.start_location as any
        if (startLocation && (startLocation.lat || startLocation[0])) {
          const startLat = startLocation.lat || startLocation[0]
          const startLng = startLocation.lng || startLocation[1]
          
          // Calculate distance
          const R = 3959 // miles
          const dLat = (parseFloat(latitude) - startLat) * Math.PI / 180
          const dLon = (parseFloat(longitude) - startLng) * Math.PI / 180
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(startLat * Math.PI / 180) * Math.cos(parseFloat(latitude) * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          distanceToVisit = R * c

          // Estimate drive time (assuming average speed of 25 mph for city driving)
          driveTimeToVisit = Math.round((distanceToVisit / 25) * 60)
        }
      }
    }

    const visitLocation = latitude && longitude 
      ? { lat: parseFloat(latitude), lng: parseFloat(longitude), address: patientAddress || null }
      : null

    // Create visit
    const { data: visit, error } = await supabase
      .from('staff_visits')
      .insert({
        staff_id: staffId,
        trip_id: activeTripId,
        patient_name: patientName,
        patient_address: patientAddress,
        visit_type: visitType,
        scheduled_time: scheduledTime || null,
        visit_location: visitLocation,
        drive_time_to_visit: driveTimeToVisit,
        distance_to_visit: parseFloat(distanceToVisit.toFixed(2)),
        status: 'in_progress'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating visit:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Visit started successfully",
      visit: {
        id: visit.id,
        patientName: visit.patient_name,
        startTime: visit.start_time,
        driveTime: visit.drive_time_to_visit,
        distance: visit.distance_to_visit
      }
    })
  } catch (error: any) {
    console.error("Error starting visit:", error)
    return NextResponse.json({ error: error.message || "Failed to start visit" }, { status: 500 })
  }
}

