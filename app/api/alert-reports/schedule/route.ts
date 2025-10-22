import { type NextRequest, NextResponse } from "next/server"

interface ScheduleRequest {
  schedule: string
  recipients: string[]
  reportType: string
  enabled: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: ScheduleRequest = await request.json()
    const { schedule, recipients, reportType, enabled } = body

    console.log("Scheduling alert reports:", {
      schedule,
      recipients: recipients.length,
      reportType,
      enabled,
      timestamp: new Date().toISOString(),
    })

    // In a real implementation, you would:
    // 1. Save the schedule configuration to your database
    // 2. Set up a c ron job (e.g., using Vercel Cron Jobs, AWS Lambda, etc.)
    //    that triggers based on the schedule.
    // 3. The cron job would call the /api/alert-reports/generate endpoint
    //    and then email the resulting HTML to the recipients.

    // Mock saving to database
    // await db.reportSchedule.upsert({
    //   where: { reportType },
    //   update: { schedule, recipients, enabled },
    //   create: { reportType, schedule, recipients, enabled }
    // })

    return NextResponse.json({
      success: true,
      message: `Report schedule for '${reportType}' has been ${enabled ? "enabled" : "disabled"} and updated.`,
      schedule,
      recipients,
      reportType,
      enabled,
    })
  } catch (error) {
    console.error("Error scheduling alert reports:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to schedule alert reports",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
