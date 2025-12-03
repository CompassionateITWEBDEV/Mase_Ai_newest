import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

// GET - Fetch all staff members from the existing 'staff' table
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    // Get real staff data from the existing 'staff' table
    const { data: staffMembers, error } = await supabase
      .from("staff")
      .select("id, name, email, role_id, department, credentials, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) {
      console.error("Staff table error:", error)
      return NextResponse.json({
        success: false,
        staff: [],
        source: "error",
        error: error.message,
        message: "Could not fetch staff from database. Make sure the 'staff' table exists.",
      })
    }

    // If no staff found, return empty
    if (!staffMembers || staffMembers.length === 0) {
      return NextResponse.json({
        success: true,
        staff: [],
        source: "database",
        message: "No active staff members found in the database.",
      })
    }

    // Map to expected format (role from credentials or role_id)
    const formattedStaff = staffMembers.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: s.credentials || s.role_id || "Staff", // Use credentials (RN, PT) or role_id
      department: s.department || "General",
    }))

    return NextResponse.json({
      success: true,
      staff: formattedStaff,
      source: "database",
      count: formattedStaff.length,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// Note: Staff creation is handled through the existing staff management system
// This endpoint only reads from the existing 'staff' table

