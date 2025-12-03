import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

// GET - Fetch all staff members for chat selection
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const excludeId = searchParams.get("exclude") // Exclude current user from list

    // First, try to get all columns to see what's available
    let query = supabase
      .from("staff")
      .select("*")
      .order("name", { ascending: true })

    if (excludeId) {
      query = query.neq("id", excludeId)
    }

    const { data: staff, error } = await query

    if (error) {
      console.error("Staff query error:", error)
      if (error.code === "42P01") {
        return NextResponse.json({
          success: false,
          staff: [],
          error: "Staff table not found. Please set up the database.",
        })
      }
      throw error
    }

    if (!staff || staff.length === 0) {
      return NextResponse.json({
        success: true,
        staff: [],
        message: "No staff members found in database",
      })
    }

    // Filter to only active staff
    const activeStaff = staff.filter((s: any) => {
      // Check is_active column (boolean) or status column (string)
      if (typeof s.is_active === "boolean") {
        return s.is_active === true
      }
      if (s.status) {
        return s.status === "active"
      }
      // Otherwise include all
      return true
    })

    // Map to consistent format - handle different column names
    const formattedStaff = activeStaff.map((s: any) => ({
      id: s.id,
      name: s.name || s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email,
      email: s.email,
      // role_id is the actual column, role may not exist
      role: s.role || s.role_id || s.position || s.job_title || s.credentials || "Staff",
      department: s.department || s.team || "",
      credentials: s.credentials || s.qualifications || "",
      status: s.is_active ? "active" : (s.status || "active"),
      phone: s.phone || s.phone_number || "",
    }))

    return NextResponse.json({
      success: true,
      staff: formattedStaff,
      count: formattedStaff.length,
    })
  } catch (error) {
    console.error("Error fetching staff:", error)
    return NextResponse.json({
      success: false,
      staff: [],
      error: error instanceof Error ? error.message : "Failed to fetch staff from database",
    })
  }
}


