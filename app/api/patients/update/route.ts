import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

export async function PUT(request: NextRequest) {
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
      id,
      name,
      axxessId,
      patientId,
      referralDate,
      referralType,
      priority,
      location,
      diagnosis,
      age,
      insurance,
      phoneNumber,
      address,
      emergencyContact,
      primaryProvider,
      assignedStaff,
      socDueDate,
      episodeStartDate,
      episodeEndDate,
      nextReEvalDate,
      dateOfBirth,
      currentStatus,
      referralAccepted,
    } = body

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient ID is required",
        },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Check if patient exists
    const { data: existingPatient, error: checkError } = await supabase
      .from("patients")
      .select("id")
      .eq("id", id)
      .single()

    if (checkError || !existingPatient) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient not found",
        },
        { status: 404 }
      )
    }

    // Get primary provider ID (doctor) from name if assigned
    let primaryProviderId = null
    if (primaryProvider && primaryProvider !== "Unassigned") {
      const { data: providerData } = await supabase
        .from("staff")
        .select("id")
        .ilike("name", `%${primaryProvider}%`)
        .limit(1)

      if (providerData && providerData.length > 0) {
        primaryProviderId = providerData[0].id
      }
    }

    // Get assigned staff ID (nurse/staff) from name if assigned
    let assignedStaffId = null
    if (assignedStaff && assignedStaff !== "Unassigned") {
      const { data: staffData } = await supabase
        .from("staff")
        .select("id")
        .ilike("name", `%${assignedStaff}%`)
        .limit(1)

      if (staffData && staffData.length > 0) {
        assignedStaffId = staffData[0].id
      }
    }

    // Calculate SOC window status
    let socWindowStatus = "On Track"
    if (socDueDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const socDate = new Date(socDueDate)
      socDate.setHours(0, 0, 0, 0)
      const daysDiff = Math.ceil((socDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

      if (daysDiff < 0) {
        socWindowStatus = "Overdue"
      } else if (daysDiff <= 7) {
        socWindowStatus = "Due Soon"
      }
    }

    // Calculate priority based on referral type if not explicitly provided
    let finalPriority = priority
    if (!finalPriority && referralType) {
      switch (referralType) {
        case "Hospital":
          finalPriority = "High"
          break
        case "Facility":
          finalPriority = "Medium"
          break
        case "Clinic":
          finalPriority = "Low"
          break
        default:
          finalPriority = "Low"
      }
    }

    // Parse name into first_name and last_name
    const nameParts = (name || "").trim().split(/\s+/)
    const firstName = nameParts[0] || name || "Unknown"
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""

    // Prepare update data - only include fields that are provided
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Only update fields that are provided (not null/undefined)
    if (name !== undefined) {
      updateData.name = name
      updateData.first_name = firstName
      updateData.last_name = lastName || firstName
    }
    if (axxessId !== undefined) updateData.axxess_id = axxessId
    if (patientId !== undefined) {
      updateData.patient_id = patientId
      updateData.medical_record_number = patientId
    }
    if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth
    if (referralDate !== undefined) updateData.referral_date = referralDate || null
    if (currentStatus !== undefined) updateData.current_status = currentStatus
    if (referralAccepted !== undefined) updateData.referral_accepted = referralAccepted
    if (primaryProviderId !== null || primaryProvider === "Unassigned" || primaryProvider === "") {
      updateData.primary_provider_id = primaryProviderId
    }
    if (assignedStaffId !== null || assignedStaff === "Unassigned" || assignedStaff === "") {
      updateData.assigned_staff_id = assignedStaffId
    }
    if (socDueDate !== undefined) {
      updateData.soc_due_date = socDueDate || null
      updateData.soc_window_status = socWindowStatus
    }
    if (location !== undefined) updateData.location = location || null
    if (referralType !== undefined) updateData.referral_type = referralType || "Clinic"
    if (finalPriority !== undefined) updateData.priority = finalPriority
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis || null
    if (age !== undefined && age !== null && age !== "") {
      updateData.age = parseInt(age.toString())
    }
    if (insurance !== undefined) updateData.insurance = insurance || null
    if (phoneNumber !== undefined) updateData.phone_number = phoneNumber || null
    if (address !== undefined) updateData.address = address || null
    if (emergencyContact !== undefined) updateData.emergency_contact = emergencyContact || null
    if (episodeStartDate !== undefined) updateData.episode_start_date = episodeStartDate || null
    if (episodeEndDate !== undefined) updateData.episode_end_date = episodeEndDate || null
    if (nextReEvalDate !== undefined) updateData.next_re_eval_date = nextReEvalDate || null

    // Update patient in database
    const { data: updatedPatient, error: updateError } = await supabase
      .from("patients")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating patient:", updateError)
      return NextResponse.json(
        {
          success: false,
          error: updateError.message || "Failed to update patient",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Patient updated successfully",
      patient: updatedPatient,
    })
  } catch (error: any) {
    console.error("Error in PUT /api/patients/update:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update patient",
      },
      { status: 500 }
    )
  }
}

