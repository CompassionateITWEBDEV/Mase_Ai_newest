import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, phoneNumber, dateOfBirth, password, loginMethod } = body

    // Validate required fields
    if (!dateOfBirth || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Date of birth and password are required",
        },
        { status: 400 }
      )
    }

    if (loginMethod === "patient-id" && !patientId) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient ID is required",
        },
        { status: 400 }
      )
    }

    if (loginMethod === "phone" && !phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number is required",
        },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Build query based on login method
    let patients: any[] | null = null
    let queryError: any = null

    if (loginMethod === "patient-id") {
      // Normalize patient ID (trim whitespace, uppercase)
      const normalizedPatientId = patientId.trim().toUpperCase()
      
      // Search by patient_id first (PT-2024-001 format), then medical_record_number, then axxess_id
      const { data: byPatientId, error: patientIdError } = await supabase
        .from("patients")
        .select("*")
        .eq("patient_id", normalizedPatientId)
        .limit(1)
      
      if (!patientIdError && byPatientId && byPatientId.length > 0) {
        patients = byPatientId
      } else {
        // Try medical_record_number if patient_id not found
        const { data: byMrn, error: mrnError } = await supabase
          .from("patients")
          .select("*")
          .eq("medical_record_number", normalizedPatientId)
          .limit(1)
        
        if (!mrnError && byMrn && byMrn.length > 0) {
          patients = byMrn
        } else {
          // Try axxess_id as last resort
          const { data: byAxxess, error: axxessError } = await supabase
            .from("patients")
            .select("*")
            .eq("axxess_id", normalizedPatientId)
            .limit(1)
          
          patients = byAxxess
          queryError = axxessError
        }
      }
    } else {
      // Search by phone number (normalize phone number for comparison)
      const normalizedPhone = phoneNumber.replace(/\D/g, "")
      
      // Try exact match first
      const { data: exactMatch, error: exactError } = await supabase
        .from("patients")
        .select("*")
        .eq("phone_number", phoneNumber)
        .limit(1)
      
      if (!exactError && exactMatch && exactMatch.length > 0) {
        patients = exactMatch
      } else {
        // Try with normalized phone (digits only)
        const { data: normalizedMatch, error: normalizedError } = await supabase
          .from("patients")
          .select("*")
          .or(`phone_number.ilike.%${normalizedPhone}%,phone_number.ilike.%${phoneNumber}%`)
        
        patients = normalizedMatch
        queryError = normalizedError
      }
    }

    if (queryError) {
      console.error("Error querying patients:", queryError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to query patient database",
        },
        { status: 500 }
      )
    }

    if (!patients || patients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient not found. Please check your credentials.",
        },
        { status: 401 }
      )
    }

    // Find patient matching date of birth
    // Normalize dates to YYYY-MM-DD format for reliable comparison
    const normalizeDate = (dateValue: any): string | null => {
      if (!dateValue) return null
      
      // If it's already a string in YYYY-MM-DD format, return it
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue
      }
      
      // If it's a Date object or date string, convert to YYYY-MM-DD
      try {
        const date = new Date(dateValue)
        if (isNaN(date.getTime())) return null
        
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      } catch (e) {
        return null
      }
    }
    
    const normalizedInputDob = normalizeDate(dateOfBirth)
    if (!normalizedInputDob) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date of birth format. Please use YYYY-MM-DD format.",
        },
        { status: 400 }
      )
    }
    
    // Debug: Log date comparison attempts
    console.log("Date of Birth Comparison:", {
      inputDate: dateOfBirth,
      normalizedInput: normalizedInputDob,
      patientsFound: patients.length,
      patientDobs: patients.map((p: any) => ({
        id: p.id,
        name: p.name,
        rawDob: p.date_of_birth,
        normalizedDob: normalizeDate(p.date_of_birth)
      }))
    })
    
    const patient = patients.find((p: any) => {
      if (!p.date_of_birth) return false
      
      const normalizedDbDob = normalizeDate(p.date_of_birth)
      if (!normalizedDbDob) return false
      
      // Direct string comparison (most reliable)
      const matches = normalizedDbDob === normalizedInputDob
      
      if (matches) {
        console.log("Date match found:", {
          patientId: p.id,
          patientName: p.name,
          dbDob: normalizedDbDob,
          inputDob: normalizedInputDob
        })
      }
      
      return matches
    })

    if (!patient) {
      console.log("No patient found with matching date of birth")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date of birth. Please check your credentials.",
        },
        { status: 401 }
      )
    }

    // Check password
    // TEMPORARY: Allow "patient123" as universal password for all patients
    // If patient doesn't have a password set, allow first-time login with any password >= 6 chars
    // In production, you should require password setup during onboarding
    let passwordValid = false
    
    // TEMPORARY: Accept "patient123" as universal password
    if (password === "patient123") {
      passwordValid = true
      // If patient doesn't have password set, save it
      if (!patient.password_hash) {
        await supabase
          .from("patients")
          .update({ password_hash: `hash_${password}` })
          .eq("id", patient.id)
      }
    } else if (patient.password_hash) {
      // Check if password_hash starts with "hash_" prefix (our simple hash format)
      if (patient.password_hash.startsWith("hash_")) {
        // Extract the actual password from hash_prefix format
        const storedPassword = patient.password_hash.replace("hash_", "")
        passwordValid = storedPassword === password
      } else {
        // Direct comparison (for plain text passwords - not recommended for production)
        passwordValid = patient.password_hash === password
      }
    } else {
      // For patients without password, allow first-time login with any password >= 6 chars
      // This sets up their password for future logins
      if (password.length >= 6) {
        passwordValid = true
        // Save the password with hash_ prefix
        await supabase
          .from("patients")
          .update({ password_hash: `hash_${password}` })
          .eq("id", patient.id)
      }
    }

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid password. Please check your credentials.",
        },
        { status: 401 }
      )
    }

    // Update last login (if column exists)
    try {
      await supabase
        .from("patients")
        .update({ last_login: new Date().toISOString() })
        .eq("id", patient.id)
    } catch (err) {
      // Ignore if last_login column doesn't exist
      console.log("Could not update last_login:", err)
    }

    // Return patient data (exclude sensitive fields)
    const patientData = {
      id: patient.id,
      name: patient.name,
      firstName: patient.first_name,
      lastName: patient.last_name,
      medicalRecordNumber: patient.patient_id || patient.medical_record_number || patient.axxess_id,
      axxessId: patient.axxess_id,
      dateOfBirth: patient.date_of_birth,
      phoneNumber: patient.phone_number,
      email: patient.email || null,
      address: patient.address || null,
      insurance: patient.insurance || null,
      currentStatus: patient.current_status,
      assignedStaffId: patient.assigned_staff_id,
    }

    return NextResponse.json({
      success: true,
      message: "Login successful!",
      patient: patientData,
      redirectTo: "/patient-portal",
    })
  } catch (error: any) {
    console.error("Error in patient login:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred during login",
      },
      { status: 500 }
    )
  }
}

