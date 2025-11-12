import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
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
      currentStatus = "Pending",
      referralAccepted = false,
    } = body

    // Validate required fields
    if (!name || !axxessId) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient name and Axxess ID are required",
        },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Check if Axxess ID already exists
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("id, axxess_id")
      .eq("axxess_id", axxessId)
      .single()

    if (existingPatient) {
      return NextResponse.json(
        {
          success: false,
          error: `Patient with Axxess ID ${axxessId} already exists`,
        },
        { status: 400 }
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
      const dueDate = new Date(socDueDate)
      dueDate.setHours(0, 0, 0, 0)
      const timeDiff = dueDate.getTime() - today.getTime()
      const hoursDiff = timeDiff / (1000 * 3600)

      if (hoursDiff < 0) {
        socWindowStatus = "Overdue"
      } else if (hoursDiff < 24) {
        socWindowStatus = "Due Soon"
      }
    }

    // Determine priority based on referral type if not provided
    let finalPriority = priority
    if (!finalPriority) {
      if (referralType === "Hospital") {
        finalPriority = "High"
      } else if (referralType === "Facility") {
        finalPriority = "Medium"
      } else {
        finalPriority = "Low"
      }
    }

    // Generate medical record number in PT-YYYY-XXX format if not provided
    let medicalRecordNumber = patientId
    if (!medicalRecordNumber) {
      // Generate PT-YYYY-XXX format with sequential numbering
      const year = new Date().getFullYear()
      
      // Get the highest sequence number for this year from patient_id column
      const { data: existingPatients } = await supabase
        .from("patients")
        .select("patient_id")
        .like("patient_id", `PT-${year}-%`)
        .order("patient_id", { ascending: false })
        .limit(1)
      
      let nextSequence = 1
      if (existingPatients && existingPatients.length > 0) {
        const lastPatientId = existingPatients[0].patient_id
        if (lastPatientId) {
          // Extract sequence number from PT-YYYY-XXX format
          const match = lastPatientId.match(/PT-\d{4}-(\d+)/)
          if (match && match[1]) {
            nextSequence = parseInt(match[1], 10) + 1
          }
        }
      }
      
      // Also check medical_record_number as fallback
      if (nextSequence === 1) {
        const { data: fallbackPatients } = await supabase
          .from("patients")
          .select("medical_record_number")
          .like("medical_record_number", `PT-${year}-%`)
          .order("medical_record_number", { ascending: false })
          .limit(1)
        
        if (fallbackPatients && fallbackPatients.length > 0) {
          const lastMRN = fallbackPatients[0].medical_record_number
          if (lastMRN) {
            const match = lastMRN.match(/PT-\d{4}-(\d+)/)
            if (match && match[1]) {
              const fallbackSeq = parseInt(match[1], 10) + 1
              if (fallbackSeq > nextSequence) {
                nextSequence = fallbackSeq
              }
            }
          }
        }
      }
      
      // Format: PT-YYYY-XXX (3 digits, zero-padded)
      medicalRecordNumber = `PT-${year}-${String(nextSequence).padStart(3, '0')}`
    }

    // Parse name into first_name and last_name
    const nameParts = (name || "").trim().split(/\s+/)
    const firstName = nameParts[0] || name || "Unknown"
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""

    // Generate date_of_birth if not provided (use a default date - 70 years ago as placeholder)
    // In production, this should be required in the form
    const dateOfBirthValue = dateOfBirth || (() => {
      const defaultDate = new Date()
      defaultDate.setFullYear(defaultDate.getFullYear() - 70)
      return defaultDate.toISOString().split('T')[0]
    })()

    // Prepare patient data - only include fields that exist in schema
    const patientData: any = {
      axxess_id: axxessId,
      patient_id: medicalRecordNumber, // Store in patient_id column (PT-2024-001 format)
      medical_record_number: medicalRecordNumber, // Keep for backward compatibility
      name: name,
      first_name: firstName,
      last_name: lastName || firstName, // Use first_name as fallback if no last_name
      date_of_birth: dateOfBirthValue,
      referral_date: referralDate || null,
      current_status: currentStatus,
      discharge_status: null,
      referral_accepted: referralAccepted,
      primary_provider_id: primaryProviderId,
      assigned_staff_id: assignedStaffId,
      soc_due_date: socDueDate || null,
      soc_window_status: socWindowStatus,
      location: location || null,
      referral_type: referralType || "Clinic",
      priority: finalPriority,
      diagnosis: diagnosis || null,
      insurance: insurance || null,
      phone_number: phoneNumber || null,
      address: address || null,
      emergency_contact: emergencyContact || null,
      episode_start_date: episodeStartDate || null,
      episode_end_date: episodeEndDate || null,
      next_re_eval_date: nextReEvalDate || null,
      lupa_status: "Safe",
      total_episode_cost: 0,
      projected_cost: 0,
      visit_frequencies: [],
      patient_goals: [],
      dme_orders: [],
      wound_care: null,
      updated_at: new Date().toISOString(),
    }

    // Only add age if it's a valid number (check if column exists in schema)
    if (age !== null && age !== undefined && age !== "") {
      const ageNum = typeof age === "number" ? age : parseInt(String(age))
      if (!isNaN(ageNum) && ageNum > 0) {
        patientData.age = ageNum
      }
    }

    // Insert patient into database
    let { data: newPatient, error: insertError } = await supabase
      .from("patients")
      .insert(patientData)
      .select()
      .single()

    // If error is due to missing columns, try with minimal required fields only
    if (insertError && (insertError.message?.includes("column") || insertError.message?.includes("Could not find"))) {
      console.warn("Column error detected, trying with minimal fields:", insertError.message)
      
      // Parse name for minimal data too
      const namePartsMinimal = (name || "").trim().split(/\s+/)
      const firstNameMinimal = namePartsMinimal[0] || name || "Unknown"
      const lastNameMinimal = namePartsMinimal.length > 1 ? namePartsMinimal.slice(1).join(" ") : firstNameMinimal

      // Generate date_of_birth for minimal data too
      const dateOfBirthMinimal = dateOfBirth || (() => {
        const defaultDate = new Date()
        defaultDate.setFullYear(defaultDate.getFullYear() - 70)
        return defaultDate.toISOString().split('T')[0]
      })()

      // Try with only the most essential fields
      const minimalPatientData: any = {
        axxess_id: axxessId,
        patient_id: medicalRecordNumber, // Store in patient_id column
        medical_record_number: medicalRecordNumber, // Keep for backward compatibility
        name: name,
        first_name: firstNameMinimal,
        last_name: lastNameMinimal,
        date_of_birth: dateOfBirthMinimal,
        current_status: currentStatus,
        referral_accepted: referralAccepted,
        lupa_status: "Safe",
        total_episode_cost: 0,
        projected_cost: 0,
        visit_frequencies: [],
        patient_goals: [],
        dme_orders: [],
      }
      
      // Only add optional fields if they exist and have values
      if (referralDate) minimalPatientData.referral_date = referralDate
      if (assignedStaffId) minimalPatientData.assigned_staff_id = assignedStaffId
      if (socDueDate) minimalPatientData.soc_due_date = socDueDate
      if (socWindowStatus) minimalPatientData.soc_window_status = socWindowStatus
      if (location) minimalPatientData.location = location
      if (referralType) minimalPatientData.referral_type = referralType
      if (finalPriority) minimalPatientData.priority = finalPriority
      if (diagnosis) minimalPatientData.diagnosis = diagnosis
      if (insurance) minimalPatientData.insurance = insurance
      if (phoneNumber) minimalPatientData.phone_number = phoneNumber
      if (address) minimalPatientData.address = address
      if (emergencyContact) minimalPatientData.emergency_contact = emergencyContact
      if (episodeStartDate) minimalPatientData.episode_start_date = episodeStartDate
      if (episodeEndDate) minimalPatientData.episode_end_date = episodeEndDate
      if (nextReEvalDate) minimalPatientData.next_re_eval_date = nextReEvalDate
      
      const retryResult = await supabase
        .from("patients")
        .insert(minimalPatientData)
        .select()
        .single()
      
      newPatient = retryResult.data
      insertError = retryResult.error
    }

    if (insertError) {
      console.error("Error creating patient:", insertError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create patient: " + insertError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      patient: newPatient,
      message: "Patient created successfully",
    })
  } catch (error: any) {
    console.error("Error in POST /api/patients/create:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    )
  }
}

