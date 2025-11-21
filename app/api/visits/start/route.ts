import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { geocodeAddress, isValidAddressFormat, reverseGeocode } from "@/lib/geocoding"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { staffId, tripId, patientName, patientAddress, visitType, scheduledTime, latitude, longitude, driveTimeFromLastTrip, scheduledVisitId } = await request.json()

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

    // AI-Powered Address Validation and Geocoding
    // Priority: Use provided coordinates > Geocode from address > Use GPS location
    let finalLatitude = latitude
    let finalLongitude = longitude
    let addressValidated = false
    
    // STRICT: Validate address format first (AI detection of fake addresses)
    if (patientAddress) {
      if (!isValidAddressFormat(patientAddress)) {
        return NextResponse.json({ 
          error: `Invalid address format: "${patientAddress}". Please provide a real address with street number and street name (e.g., "123 Main Street, City, State").`,
          requiresRealAddress: true
        }, { status: 400 })
      }
    }
    
    // If coordinates not provided but address is provided, geocode the address (FREE OpenStreetMap)
    if ((!finalLatitude || !finalLongitude) && patientAddress) {
      console.log(`🔍 Geocoding and validating address using FREE OpenStreetMap: ${patientAddress}`)
      try {
        const geocoded = await geocodeAddress(patientAddress)
        if (geocoded && geocoded.validated && geocoded.lat && geocoded.lng) {
          finalLatitude = geocoded.lat.toString()
          finalLongitude = geocoded.lng.toString()
          addressValidated = true
          console.log(`✅ Address validated and geocoded: ${patientAddress} -> ${finalLatitude}, ${finalLongitude}`)
        } else {
          return NextResponse.json({ 
            error: `Address not found: "${patientAddress}". This address does not exist. Please provide a real, valid address.`,
            requiresRealAddress: true
          }, { status: 400 })
        }
      } catch (error) {
        console.error('Error geocoding address:', error)
        return NextResponse.json({ 
          error: `Failed to validate address: "${patientAddress}". Please provide a real address.`,
          requiresRealAddress: true
        }, { status: 400 })
      }
    }
    
    // If address validation failed but we have GPS, use GPS with reverse geocoding
    let actualPatientAddress = patientAddress
    if (!addressValidated && (!finalLatitude || !finalLongitude)) {
      console.log('📍 Address validation failed, trying GPS location with reverse geocoding...')
      const { data: lastLocation } = await supabase
        .from('staff_location_updates')
        .select('latitude, longitude')
        .eq('staff_id', staffId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (lastLocation && lastLocation.latitude && lastLocation.longitude) {
        finalLatitude = lastLocation.latitude?.toString()
        finalLongitude = lastLocation.longitude?.toString()
        
        // Reverse geocode to get actual address from GPS
        try {
          const realAddress = await reverseGeocode(parseFloat(finalLatitude), parseFloat(finalLongitude))
          if (realAddress) {
            actualPatientAddress = realAddress
            addressValidated = true
            console.log(`✅ Got actual address from GPS reverse geocoding: "${realAddress}"`)
          } else {
            console.log(`Using GPS location: ${finalLatitude}, ${finalLongitude} (reverse geocoding failed)`)
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error)
        }
      }
    }
    
    // Validate that we have coordinates
    if (!finalLatitude || !finalLongitude || isNaN(parseFloat(finalLatitude)) || isNaN(parseFloat(finalLongitude))) {
      return NextResponse.json({ 
        error: "Valid address or GPS coordinates required. Please provide a real address or enable GPS tracking.",
        requiresAddress: true
      }, { status: 400 })
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
    } else if (finalLatitude && finalLongitude) {
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
          const dLat = (parseFloat(finalLatitude.toString()) - fromLocation.lat) * Math.PI / 180
          const dLon = (parseFloat(finalLongitude.toString()) - fromLocation.lng) * Math.PI / 180
            const a = 
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(fromLocation.lat * Math.PI / 180) * Math.cos(parseFloat(finalLatitude.toString()) * Math.PI / 180) *
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
            const dLat = (parseFloat(finalLatitude.toString()) - fromLocation.lat) * Math.PI / 180
            const dLon = (parseFloat(finalLongitude.toString()) - fromLocation.lng) * Math.PI / 180
            const a = 
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(fromLocation.lat * Math.PI / 180) * Math.cos(parseFloat(finalLatitude.toString()) * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            distanceToVisit = R * c
            driveTimeToVisit = Math.round((distanceToVisit / 25) * 60)
          }
        }
      }
    }

    // Create visit location from GPS coordinates (REQUIRED for route optimization)
    // Use provided coordinates or fallback to last known GPS location
    const visitLocation = (finalLatitude && finalLongitude)
      ? { 
          lat: parseFloat(finalLatitude.toString()), 
          lng: parseFloat(finalLongitude.toString()), 
          address: patientAddress || null,
          timestamp: new Date().toISOString()
        }
      : null

    // Warn if no location data (route optimization won't work)
    if (!visitLocation) {
      console.warn(`Visit created without GPS location for staff ${staffId}. Route optimization will not work for this visit.`)
    }

    // If scheduledVisitId is provided, update the existing scheduled visit
    if (scheduledVisitId) {
      const { data: visit, error } = await supabase
        .from('staff_visits')
        .update({
          trip_id: activeTripId,
          patient_address: actualPatientAddress || patientAddress,
          visit_location: visitLocation,
          drive_time_to_visit: driveTimeToVisit,
          distance_to_visit: parseFloat(distanceToVisit.toFixed(2)),
          start_time: new Date().toISOString(),
          status: 'in_progress'
        })
        .eq('id', scheduledVisitId)
        .eq('staff_id', staffId)
        .select()
        .single()

      if (error) {
        console.error('Error updating scheduled visit:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Scheduled appointment started successfully",
        addressValidated: addressValidated,
        visit: {
          id: visit.id,
          patient_id: visit.patient_id,
          patient_name: visit.patient_name,
          patientName: visit.patient_name,
          patientAddress: visit.patient_address,
          startTime: visit.start_time,
          driveTime: visit.drive_time_to_visit,
          distance: visit.distance_to_visit,
          hasLocation: !!visit.visit_location
        }
      })
    }

    // Otherwise, create a new visit
    const { data: visit, error } = await supabase
      .from('staff_visits')
      .insert({
        staff_id: staffId,
        trip_id: activeTripId,
        patient_name: patientName,
        patient_address: actualPatientAddress || patientAddress, // Use actual address from reverse geocoding if available
        visit_type: visitType,
        scheduled_time: scheduledTime || null,
        visit_location: visitLocation, // GPS coordinates (from geocoding or GPS)
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
      addressValidated: addressValidated,
      visit: {
        id: visit.id,
        patient_id: visit.patient_id,
        patient_name: visit.patient_name,
        patientName: visit.patient_name,
        patientAddress: visit.patient_address,
        startTime: visit.start_time,
        driveTime: visit.drive_time_to_visit,
        distance: visit.distance_to_visit,
        hasLocation: !!visit.visit_location
      }
    })
  } catch (error: any) {
    console.error("Error starting visit:", error)
    return NextResponse.json({ error: error.message || "Failed to start visit" }, { status: 500 })
  }
}

