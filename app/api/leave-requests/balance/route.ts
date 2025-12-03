import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

// GET - Fetch leave balance for a staff member
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")

    if (!staffId) {
      return NextResponse.json(
        { success: false, error: "Staff ID is required" },
        { status: 400 }
      )
    }

    // Try to get existing balance
    let { data: balance, error } = await supabase
      .from("leave_balances")
      .select("*")
      .eq("staff_id", staffId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      // Table might not exist
      if (error.code === "42P01") {
        return NextResponse.json({
          success: true,
          balance: {
            vacation_days: 15,
            sick_days: 8,
            personal_days: 3,
            fmla_weeks: 12,
          },
          message: "Leave balances table not set up. Using defaults.",
        })
      }
      throw error
    }

    // If no balance found, create default
    if (!balance) {
      const { data: newBalance, error: createError } = await supabase
        .from("leave_balances")
        .insert({
          staff_id: staffId,
          vacation_days: 15,
          sick_days: 8,
          personal_days: 3,
          fmla_weeks: 12,
        })
        .select()
        .single()

      if (createError) {
        // Return defaults if can't create
        return NextResponse.json({
          success: true,
          balance: {
            vacation_days: 15,
            sick_days: 8,
            personal_days: 3,
            fmla_weeks: 12,
          },
        })
      }
      balance = newBalance
    }

    // Get used leave for current year
    const currentYear = new Date().getFullYear()
    const { data: usedLeave } = await supabase
      .from("leave_requests")
      .select("leave_type, total_days")
      .eq("staff_id", staffId)
      .eq("status", "approved")
      .gte("start_date", `${currentYear}-01-01`)
      .lte("start_date", `${currentYear}-12-31`)

    // Calculate used days by type
    const usedByType = {
      vacation: 0,
      sick: 0,
      personal: 0,
      fmla: 0,
    }

    ;(usedLeave || []).forEach((req: any) => {
      if (req.leave_type in usedByType) {
        usedByType[req.leave_type as keyof typeof usedByType] += req.total_days
      }
    })

    return NextResponse.json({
      success: true,
      balance: {
        ...balance,
        used: usedByType,
        available: {
          vacation: Math.max(0, (balance.vacation_days || 15) - usedByType.vacation),
          sick: Math.max(0, (balance.sick_days || 8) - usedByType.sick),
          personal: Math.max(0, (balance.personal_days || 3) - usedByType.personal),
          fmla_weeks: Math.max(0, (balance.fmla_weeks || 12) - usedByType.fmla / 5), // Convert days to weeks
        },
      },
    })
  } catch (error) {
    console.error("Error fetching leave balance:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch leave balance" },
      { status: 500 }
    )
  }
}

// PUT - Update leave balance
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { staffId, vacationDays, sickDays, personalDays, fmlaWeeks } = body

    if (!staffId) {
      return NextResponse.json(
        { success: false, error: "Staff ID is required" },
        { status: 400 }
      )
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (vacationDays !== undefined) updateData.vacation_days = vacationDays
    if (sickDays !== undefined) updateData.sick_days = sickDays
    if (personalDays !== undefined) updateData.personal_days = personalDays
    if (fmlaWeeks !== undefined) updateData.fmla_weeks = fmlaWeeks

    const { data, error } = await supabase
      .from("leave_balances")
      .upsert({
        staff_id: staffId,
        ...updateData,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      balance: data,
      message: "Leave balance updated",
    })
  } catch (error) {
    console.error("Error updating leave balance:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update leave balance" },
      { status: 500 }
    )
  }
}

