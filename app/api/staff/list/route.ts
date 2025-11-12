import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role") // e.g., "RN", "PT", "nurse"
    const credentials = searchParams.get("credentials") // e.g., "RN"

    const supabase = createServiceClient()

    // Build query for active staff members
    let query = supabase
      .from("staff")
      .select("id, name, email, role_id, department, credentials, phone_number, is_active")
      .eq("is_active", true)

    // Filter by credentials (e.g., RN, PT, MD) if provided
    if (credentials) {
      query = query.ilike("credentials", `%${credentials}%`)
    }
    // Filter by role if provided (fallback to credentials if role matches common nurse terms)
    else if (role) {
      const roleLower = role.toLowerCase()
      if (roleLower === "nurse" || roleLower === "rn" || roleLower === "registered nurse") {
        query = query.or("credentials.ilike.%RN%,credentials.ilike.%Nurse%,role_id.ilike.%nurse%")
      } else {
        query = query.or(`credentials.ilike.%${role}%,role_id.ilike.%${role}%`)
      }
    }

    const { data: staffData, error } = await query.order("name", { ascending: true })

    if (error) {
      console.error("Error fetching staff:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch staff: " + error.message,
          staff: [],
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      staff: staffData || [],
      count: (staffData || []).length,
    })
  } catch (error: any) {
    console.error("Error in GET /api/staff/list:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred",
        staff: [],
      },
      { status: 500 }
    )
  }
}
