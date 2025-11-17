import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// PATCH /api/referrals/[id] - Update referral status
export async function PATCH(
  request: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    console.log("=== Updating referral ===")
    console.log("Referral ID:", params.id)

    const supabase = createAdminClient()
    const body = await request.json()
    
    console.log("Update data:", body)

    const { status, socDueDate } = body

    if (!status) {
      console.error("❌ Missing status in request")
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Build update data
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString(),
    }

    if (socDueDate) {
      updateData.soc_due_date = socDueDate
    }

    console.log("Updating referral with data:", updateData)

    const { data, error } = await supabase
      .from("referrals")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("❌ Supabase error:", error)
      return NextResponse.json({ 
        error: `Database error: ${error.message}`,
        details: error.details,
        hint: error.hint
      }, { status: 500 })
    }

    if (!data) {
      console.error("❌ No data returned after update")
      return NextResponse.json({ error: "Referral not found" }, { status: 404 })
    }

    console.log("✅ Referral updated successfully:", data)

    // 🔗 AUTO-CREATE PATIENT RECORD when referral is approved/accepted
    if ((status === "Approved" || status === "Accepted") && data.patient_name) {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      console.log("🔗 [INTEGRATION] Referral accepted! Creating patient record...")
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
      
      try {
        // Check if patient already exists for this referral
        const { data: existingPatient } = await supabase
          .from("patients")
          .select("id")
          .eq("name", data.patient_name)
          .eq("referral_date", data.referral_date)
          .single()

        if (existingPatient) {
          console.log("ℹ️  Patient record already exists:", existingPatient.id)
        } else {
          // Calculate SOC due date (48 hours from now if not provided)
          const socDueDate = data.soc_due_date || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0]
          
          // Calculate episode dates
          const episodeStartDate = new Date().toISOString().split('T')[0]
          const episodeEndDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 60 days
          const nextReEvalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days

          // Split patient name into first and last name
          const nameParts = data.patient_name.trim().split(' ')
          const firstName = nameParts[0] || 'Unknown'
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown'

          // Use real data if available from referral, otherwise use defaults
          const dateOfBirth = data.date_of_birth 
            ? data.date_of_birth 
            : new Date('1950-01-01').toISOString().split('T')[0]
          
          const phoneNumber = data.phone_number || ""
          const patientAddress = data.address || ""
          const emergencyContactInfo = data.emergency_contact || ""
          const patientAge = data.age || 0

          // Create patient record
          const { data: newPatient, error: patientError } = await supabase
            .from("patients")
            .insert({
              name: data.patient_name,
              first_name: firstName,
              last_name: lastName,
              date_of_birth: dateOfBirth, // Real if available, default otherwise
              axxess_id: `AXS-${Date.now()}`,
              medical_record_number: `MRN-${Date.now()}`, // Auto-generate MRN
              referral_date: data.referral_date,
              current_status: "Active",
              discharge_status: "N/A",
              referral_accepted: true,
              assigned_staff_id: null, // Will be assigned by staff
              primary_provider_id: null,
              soc_due_date: socDueDate,
              location: data.referral_source || "Unknown",
              referral_type: data.referral_source?.includes("Hospital") ? "Hospital" : 
                            data.referral_source?.includes("Facility") ? "Facility" : "Clinic",
              priority: data.ai_recommendation === "Review" ? "High" : "Medium",
              diagnosis: data.diagnosis || "Pending assessment",
              age: patientAge, // Use real age if available
              insurance: data.insurance_provider || "Unknown",
              phone_number: phoneNumber, // Use real phone if available
              address: patientAddress, // Use real address if available
              emergency_contact: emergencyContactInfo, // Use real contact if available
              episode_start_date: episodeStartDate,
              episode_end_date: episodeEndDate,
              next_re_eval_date: nextReEvalDate,
              total_episode_cost: 0,
              projected_cost: 0,
              visit_frequencies: [],
              patient_goals: [],
              dme_orders: [],
              created_at: new Date().toISOString()
            })
            .select()
            .single()

          if (patientError) {
            console.error("❌ Error creating patient record:", patientError)
          } else {
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            console.log("✅ [INTEGRATION] Patient record created successfully!")
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            console.log("👤 Patient Name:", newPatient.name)
            console.log("   First Name:", newPatient.first_name)
            console.log("   Last Name:", newPatient.last_name)
            console.log("🎂 DOB:", newPatient.date_of_birth, 
              data.date_of_birth ? "✓ (from referral)" : "⚠ (default - to be updated)")
            console.log("🎂 Age:", newPatient.age || "Not provided")
            console.log("🆔 Patient ID:", newPatient.id)
            console.log("📋 Axxess ID:", newPatient.axxess_id)
            console.log("🏥 MRN:", newPatient.medical_record_number)
            console.log("📞 Phone:", newPatient.phone_number || "⚠ (not provided)")
            console.log("🏠 Address:", newPatient.address || "⚠ (not provided)")
            console.log("🚨 Emergency Contact:", newPatient.emergency_contact || "⚠ (not provided)")
            console.log("📅 SOC Due Date:", newPatient.soc_due_date)
            console.log("🏥 Location:", newPatient.location)
            console.log("⚕️  Diagnosis:", newPatient.diagnosis)
            console.log("💳 Insurance:", newPatient.insurance)
            console.log("📊 Status:", newPatient.current_status)
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            console.log("🎯 Patient now visible in Patient Tracking!")
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
          }
        }
      } catch (integrationError) {
        console.error("⚠️  Failed to create patient record:", integrationError)
        // Don't fail the referral update if patient creation fails
      }
    }

    return NextResponse.json({ referral: data, success: true })
  } catch (error) {
    console.error("❌ Error updating referral:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 })
  }
}

// GET /api/referrals/[id] - Get single referral
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from("referrals")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching referral:", error)
      return NextResponse.json({ error: "Referral not found" }, { status: 404 })
    }

    return NextResponse.json({ referral: data })
  } catch (error) {
    console.error("Error in referral GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/referrals/[id] - Delete referral
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = createAdminClient()

    const { error } = await supabase
      .from("referrals")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("Error deleting referral:", error)
      return NextResponse.json({ error: "Failed to delete referral" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in referral DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
