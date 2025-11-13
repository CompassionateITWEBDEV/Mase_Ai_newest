import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

// GET - Fetch patient care team data
// Query params:
//   - staff_id: optional, filter by specific staff member
//   - active_only: optional, default true, only return active assignments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staff_id")
    const activeOnly = searchParams.get("active_only") !== "false"

    const supabase = createServiceClient()

    // Build query
    let query = supabase
      .from("patient_care_team")
      .select(`
        *,
        patient:patient_id (
          id,
          first_name,
          last_name,
          date_of_birth,
          phone_number,
          email
        ),
        staff:staff_id (
          id,
          name,
          email,
          phone_number,
          credentials,
          department
        )
      `)

    // Filter by staff_id if provided
    if (staffId) {
      query = query.eq("staff_id", staffId)
    }

    // Filter by active status if requested
    if (activeOnly) {
      query = query.eq("is_active", true)
    }

    // Order by patient name and role
    query = query
      .order("is_primary", { ascending: false })
      .order("is_assigned_staff", { ascending: false })
      .order("added_date", { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error("Error fetching care team data:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          careTeam: [],
        },
        { status: 500 }
      )
    }

    // Format the response
    const careTeam = (data || []).map((item: any) => ({
      id: item.id,
      patientId: item.patient_id,
      staffId: item.staff_id,
      role: item.role,
      specialty: item.specialty,
      isPrimary: item.is_primary,
      isAssignedStaff: item.is_assigned_staff,
      addedDate: item.added_date,
      removedDate: item.removed_date,
      isActive: item.is_active,
      notes: item.notes,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      patient: item.patient
        ? {
            id: item.patient.id,
            firstName: item.patient.first_name,
            lastName: item.patient.last_name,
            fullName: `${item.patient.first_name || ""} ${item.patient.last_name || ""}`.trim(),
            dateOfBirth: item.patient.date_of_birth,
            phone: item.patient.phone_number,
            email: item.patient.email,
          }
        : null,
      staff: item.staff
        ? {
            id: item.staff.id,
            name: item.staff.name,
            email: item.staff.email,
            phone: item.staff.phone_number,
            credentials: item.staff.credentials,
            department: item.staff.department,
          }
        : null,
    }))

    return NextResponse.json({
      success: true,
      careTeam,
      count: careTeam.length,
    })
  } catch (error: any) {
    console.error("Error in GET care team:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch care team data",
        careTeam: [],
      },
      { status: 500 }
    )
  }
}

