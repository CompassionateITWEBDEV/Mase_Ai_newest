import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

// GET - Fetch leave requests
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")
    const status = searchParams.get("status")
    const all = searchParams.get("all") === "true"

    let query = supabase
      .from("leave_requests")
      .select("*")
      .order("created_at", { ascending: false })

    // Filter by staff if not requesting all
    if (!all && staffId) {
      query = query.eq("staff_id", staffId)
    }

    // Filter by status if specified
    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data: requests, error } = await query

    if (error) {
      // Table might not exist
      if (error.code === "42P01") {
        return NextResponse.json({
          success: true,
          requests: [],
          message: "Leave requests table not set up. Run setup-leave-requests-table.sql",
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      requests: requests || [],
      count: (requests || []).length,
    })
  } catch (error) {
    console.error("Error fetching leave requests:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch leave requests" },
      { status: 500 }
    )
  }
}

// POST - Create a new leave request
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const {
      staffId,
      staffName,
      staffEmail,
      staffPosition,
      staffDepartment,
      leaveType,
      startDate,
      endDate,
      totalDays,
      returnDate,
      partialDays,
      reason,
      emergencyContact,
      workCoverage,
      medicalCertification,
    } = body

    if (!staffId || !leaveType || !startDate || !endDate || !totalDays) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Calculate performance impact based on leave type and days
    let performanceImpact = "Standard review process"
    if (totalDays <= 3) {
      performanceImpact = "Minimal impact - Short duration leave"
    } else if (totalDays <= 7) {
      performanceImpact = "Low impact - Standard leave duration"
    } else if (totalDays <= 14) {
      performanceImpact = "Moderate impact - Extended leave, coverage required"
    } else {
      performanceImpact = "Significant impact - Long-term coverage arrangements needed"
    }

    const { data, error } = await supabase
      .from("leave_requests")
      .insert({
        staff_id: staffId,
        staff_name: staffName,
        staff_email: staffEmail,
        staff_position: staffPosition,
        staff_department: staffDepartment,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        return_date: returnDate,
        partial_days: partialDays || false,
        reason,
        emergency_contact: emergencyContact,
        work_coverage: workCoverage,
        medical_certification: medicalCertification || false,
        performance_impact: performanceImpact,
        status: "pending",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      request: data,
      message: "Leave request submitted successfully",
    })
  } catch (error) {
    console.error("Error creating leave request:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create leave request" },
      { status: 500 }
    )
  }
}

// PUT - Update leave request (approve/deny/cancel)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { id, status, reviewedBy, denialReason } = body

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Request ID and status are required" },
        { status: 400 }
      )
    }

    const updateData: any = {
      status,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (reviewedBy) updateData.reviewed_by = reviewedBy
    if (denialReason) updateData.denial_reason = denialReason

    const { data, error } = await supabase
      .from("leave_requests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      request: data,
      message: `Leave request ${status}`,
    })
  } catch (error) {
    console.error("Error updating leave request:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update leave request" },
      { status: 500 }
    )
  }
}

// DELETE - Delete leave request
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Request ID is required" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("leave_requests")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Leave request deleted",
    })
  } catch (error) {
    console.error("Error deleting leave request:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete leave request" },
      { status: 500 }
    )
  }
}

