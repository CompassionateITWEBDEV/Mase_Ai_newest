import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // Check if request has a body
    const contentType = request.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          error: "Content-Type must be application/json",
        },
        { status: 400 }
      )
    }

    // Get request body with error handling
    let body
    try {
      const text = await request.text()
      if (!text || text.trim() === "") {
        return NextResponse.json(
          {
            success: false,
            error: "Request body is required",
          },
          { status: 400 }
        )
      }
      body = JSON.parse(text)
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 }
      )
    }

    // Validate that body is an object
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          error: "Request body must be a valid JSON object",
        },
        { status: 400 }
      )
    }

    const {
      patientId,
      patientName,
      patientAddress,
      staffId,
      scheduledTime,
      visitType,
      location,
      notes,
    } = body

    // Validate required fields
    if (!patientName || !scheduledTime || !visitType) {
      return NextResponse.json(
        { success: false, error: "Patient name, scheduled time, and visit type are required" },
        { status: 400 }
      )
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledTime)
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { success: false, error: "Scheduled time must be in the future" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // If staffId is provided, verify staff exists
    if (staffId && staffId !== "unassigned") {
      const { data: staff, error: staffError } = await supabase
        .from("staff")
        .select("id, name")
        .eq("id", staffId)
        .single()

      if (staffError || !staff) {
        return NextResponse.json(
          { success: false, error: "Selected provider not found" },
          { status: 400 }
        )
      }
    }

    // Get staff_id - required for staff_visits table
    let finalStaffId = staffId && staffId !== "unassigned" ? staffId : null
    
    // If no staff selected, try to get assigned staff from patient record
    if (!finalStaffId && patientId) {
      const { data: patient } = await supabase
        .from("patients")
        .select("assigned_staff_id")
        .eq("id", patientId)
        .single()

      if (patient?.assigned_staff_id) {
        finalStaffId = patient.assigned_staff_id
      }
    }

    // Validate that we have a staff_id (required by staff_visits table)
    if (!finalStaffId) {
      return NextResponse.json(
        { success: false, error: "Staff/provider is required to schedule an appointment" },
        { status: 400 }
      )
    }

    // Geocode address to get GPS coordinates for route optimization
    let visitLocation = null
    const addressToGeocode = patientAddress || location || null
    if (addressToGeocode && addressToGeocode !== "Home Visit") {
      try {
        // Use OpenStreetMap Nominatim (free geocoding service)
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressToGeocode)}&limit=1`
        const geocodeRes = await fetch(geocodeUrl, {
          headers: {
            'User-Agent': 'MASE-AI-Healthcare-System/1.0'
          }
        })
        
        if (geocodeRes.ok) {
          const geocodeData = await geocodeRes.json()
          if (geocodeData && geocodeData.length > 0) {
            visitLocation = {
              lat: parseFloat(geocodeData[0].lat),
              lng: parseFloat(geocodeData[0].lon),
              address: addressToGeocode
            }
            console.log(`✅ Geocoded address: ${addressToGeocode} → ${visitLocation.lat}, ${visitLocation.lng}`)
          }
        }
      } catch (geocodeError) {
        console.warn("Geocoding failed (non-critical):", geocodeError)
        // Continue without geocoding - appointment will still be created
      }
    }

    // Create appointment in staff_visits table
    const visitData: any = {
      staff_id: finalStaffId,
      patient_name: patientName,
      patient_address: patientAddress || location || "Home Visit",
      visit_type: visitType,
      scheduled_time: scheduledTime,
      start_time: null, // Will be set when visit actually starts
      status: "scheduled",
      visit_location: visitLocation, // GPS coordinates for route optimization
      notes: notes || null,
    }

    const { data: newVisit, error: visitError } = await supabase
      .from("staff_visits")
      .insert(visitData)
      .select()
      .single()

    if (visitError) {
      console.error("Error creating appointment:", visitError)
      return NextResponse.json(
        { success: false, error: visitError.message || "Failed to schedule appointment" },
        { status: 500 }
      )
    }

    // Also create in visits table if patient_id is available
    if (patientId) {
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("id", patientId)
        .single()

      if (patient) {
        const visitDate = scheduledDate.toISOString().split("T")[0]
        
        await supabase.from("visits").insert({
          patient_id: patientId,
          staff_id: visitData.staff_id || null,
          visit_date: visitDate,
          discipline: visitType,
          status: "scheduled",
          notes: notes || null,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Appointment scheduled successfully",
      appointment: {
        id: newVisit.id,
        scheduledTime: newVisit.scheduled_time,
        visitType: newVisit.visit_type,
        status: newVisit.status,
      },
    })
  } catch (error: any) {
    console.error("Error scheduling appointment:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to schedule appointment" },
      { status: 500 }
    )
  }
}

