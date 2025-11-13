import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { patientId, patientName, latitude, longitude, accuracy, visitId } = await request.json()

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Find active scheduled visit for this patient
    let targetVisitId = visitId

    if (!targetVisitId) {
      // Find scheduled visit by patient name or ID - check both scheduled and in_progress visits
      let query = supabase
        .from('staff_visits')
        .select('id, patient_name, scheduled_time, status')
        .in('status', ['scheduled', 'in_progress']) // Also allow in_progress visits
        .order('scheduled_time', { ascending: true })
        .limit(5) // Get multiple to find best match

      if (patientName) {
        query = query.ilike('patient_name', `%${patientName}%`)
      }

      const { data: activeVisits } = await query
      
      // Find the most recent or upcoming visit
      if (activeVisits && activeVisits.length > 0) {
        // Prefer scheduled visits, then in_progress
        const scheduledVisit = activeVisits.find(v => v.status === 'scheduled')
        const inProgressVisit = activeVisits.find(v => v.status === 'in_progress')
        targetVisitId = scheduledVisit?.id || inProgressVisit?.id || activeVisits[0]?.id || null
      }
    }

    if (!targetVisitId) {
      console.warn('⚠️ No scheduled appointment found for patient:', { patientId, patientName })
      return NextResponse.json(
        { 
          error: "No scheduled appointment found for this patient. Please schedule an appointment first.",
          success: false
        },
        { status: 404 }
      )
    }

    // Update visit_location with live patient location
    const liveLocation = {
      lat: parseFloat(latitude),
      lng: parseFloat(longitude),
      accuracy: accuracy ? parseFloat(accuracy) : null,
      address: null, // Will be reverse geocoded if needed
      timestamp: new Date().toISOString(),
      source: 'patient_live_location' // Mark as live location from patient device
    }

    const { data: updatedVisit, error: updateError } = await supabase
      .from('staff_visits')
      .update({
        visit_location: liveLocation,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetVisitId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating patient location:', updateError)
      return NextResponse.json(
        { 
          success: false,
          error: updateError.message || "Failed to update patient location" 
        },
        { status: 500 }
      )
    }

    console.log('✅ Patient location updated successfully:', {
      visitId: targetVisitId,
      patientName: patientName,
      location: {
        lat: liveLocation.lat,
        lng: liveLocation.lng,
        accuracy: liveLocation.accuracy,
        timestamp: liveLocation.timestamp
      }
    })

    return NextResponse.json({
      success: true,
      message: "Patient location shared successfully",
      visitId: targetVisitId,
      location: liveLocation
    })
  } catch (error: any) {
    console.error("Error in patient location sharing:", error)
    return NextResponse.json(
      { error: error.message || "Failed to share patient location" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const visitId = searchParams.get("visit_id")
    const patientName = searchParams.get("patient_name")

    if (!visitId && !patientName) {
      return NextResponse.json(
        { error: "Visit ID or patient name is required" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    let query = supabase
      .from('staff_visits')
      .select('id, visit_location, patient_name, scheduled_time, status')
      .in('status', ['scheduled', 'in_progress']) // Also check in_progress visits
      .order('scheduled_time', { ascending: true })
      .limit(5) // Get multiple to find the best match

    if (visitId) {
      query = query.eq('id', visitId)
    } else if (patientName) {
      query = query.ilike('patient_name', `%${patientName}%`)
    }
    
    const { data: visits, error } = await query
    
    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch patient location" },
        { status: 500 }
      )
    }
    
    // Find the visit with the most recent location
    let visit = null
    if (visits && visits.length > 0) {
      // Prefer visits with live location
      const withLiveLocation = visits.filter(v => 
        v.visit_location && 
        v.visit_location.source === 'patient_live_location'
      )
      
      if (withLiveLocation.length > 0) {
        visit = withLiveLocation[0]
      } else {
        // Use the first visit with any location
        visit = visits.find(v => v.visit_location && v.visit_location.lat && v.visit_location.lng) || visits[0]
      }
    }

    if (!visit || !visit.visit_location) {
      console.log('⚠️ No visit or visit_location found for:', { visitId, patientName, visitsFound: visits?.length })
      return NextResponse.json({
        success: true,
        location: null,
        message: "No location shared yet"
      })
    }

    console.log('✅ Found patient location:', {
      visitId: visit.id,
      patientName: visit.patient_name,
      hasLocation: !!visit.visit_location,
      location: visit.visit_location
    })

    return NextResponse.json({
      success: true,
      location: visit.visit_location,
      visitId: visit.id
    })
  } catch (error: any) {
    console.error("Error fetching patient location:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch patient location" },
      { status: 500 }
    )
  }
}

