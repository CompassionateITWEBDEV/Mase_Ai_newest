import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staff_id")

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get scheduled appointments (status = 'scheduled' and scheduled_time >= now)
    const { data: appointments, error } = await supabase
      .from("staff_visits")
      .select(`
        id,
        patient_name,
        patient_address,
        visit_type,
        scheduled_time,
        notes,
        visit_location
      `)
      .eq("staff_id", staffId)
      .eq("status", "scheduled")
      .gte("scheduled_time", new Date().toISOString())
      .order("scheduled_time", { ascending: true })

    if (error) {
      console.error("Error fetching scheduled appointments:", error)
      return NextResponse.json(
        { error: "Failed to fetch scheduled appointments" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      appointments: appointments || [],
      count: appointments?.length || 0,
    })
  } catch (error: any) {
    console.error("Error in GET /api/visits/scheduled:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch scheduled appointments" },
      { status: 500 }
    )
  }
}

