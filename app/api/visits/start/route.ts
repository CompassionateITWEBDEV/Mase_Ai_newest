import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { staffId, tripId, patientName, patientAddress, visitType, scheduledTime, latitude, longitude, driveTimeFromLastTrip } = await request.json()

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get active trip if not provided (optional - visit can be independent)
    let activeTripId = tripId || null
    if (!activeTripId) {
      const { data: activeTrip } = await supabase
        .from('staff_trips')
        .select('id, start_time, start_location')
        .eq('staff_id', staffId)
        .eq('status', 'active')
        .maybeSingle()
      
      activeTripId = activeTrip?.id || null
    }

    // Calculate drive time to this visit
    // Priority: 1) Use driveTimeFromLastTrip (from End Trip), 2) Calculate from location
    let driveTimeToVisit = 0
    let distanceToVisit = 0

    // Priority 1: Use the trip duration from End Trip button (most accurate)
    if (driveTimeFromLastTrip && driveTimeFromLastTrip > 0) {
      driveTimeToVisit = driveTimeFromLastTrip
      // Calculate distance based on drive time (assuming 25 mph average)
      distanceToVisit = (driveTimeFromLastTrip / 60) * 25 // Convert minutes to hours, then multiply by speed
    } else if (latitude && longitude) {
      // Priority 2: Calculate from last completed trip's end_location
      const { data: lastCompletedTrip } = await supabase
        .from('staff_trips')
        .select('id, end_location, end_time, total_drive_time')
        .eq('staff_id', staffId)
        .eq('status', 'completed')
        .order('end_time', { ascending: false })
        .limit(1)
        .maybeSingle()

      // If we have a completed trip with drive time, use it
      if (lastCompletedTrip?.total_drive_time) {
        driveTimeToVisit = lastCompletedTrip.total_drive_time
        // Get distance from trip
        const { data: tripData } = await supabase
          .from('staff_trips')
          .select('total_distance')
          .eq('id', lastCompletedTrip.id)
          .single()
        distanceToVisit = parseFloat(tripData?.total_distance?.toString() || '0')
      } else if (lastCompletedTrip?.end_location) {
        // Calculate from end location if no drive time saved
        const endLocation = lastCompletedTrip.end_location as any
        if (endLocation && (endLocation.lat || endLocation[0])) {
          const fromLocation = {
            lat: endLocation.lat || endLocation[0],
            lng: endLocation.lng || endLocation[1]
          }
          
          const R = 3959 // miles
          const dLat = (parseFloat(latitude) - fromLocation.lat) * Math.PI / 180
          const dLon = (parseFloat(longitude) - fromLocation.lng) * Math.PI / 180
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(fromLocation.lat * Math.PI / 180) * Math.cos(parseFloat(latitude) * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          distanceToVisit = R * c
          driveTimeToVisit = Math.round((distanceToVisit / 25) * 60)
        }
      } else if (activeTripId) {
        // Priority 3: Use active trip's start_location
        const { data: activeTrip } = await supabase
          .from('staff_trips')
          .select('start_location')
          .eq('id', activeTripId)
          .maybeSingle()

        if (activeTrip?.start_location) {
          const startLocation = activeTrip.start_location as any
          if (startLocation && (startLocation.lat || startLocation[0])) {
            const fromLocation = {
              lat: startLocation.lat || startLocation[0],
              lng: startLocation.lng || startLocation[1]
            }
            
            const R = 3959 // miles
            const dLat = (parseFloat(latitude) - fromLocation.lat) * Math.PI / 180
            const dLon = (parseFloat(longitude) - fromLocation.lng) * Math.PI / 180
            const a = 
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(fromLocation.lat * Math.PI / 180) * Math.cos(parseFloat(latitude) * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            distanceToVisit = R * c
            driveTimeToVisit = Math.round((distanceToVisit / 25) * 60)
          }
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

