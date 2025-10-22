import { type NextRequest, NextResponse } from "next/server"

interface SMSAlert {
  recipients: string[]
  message: string
  priority: "low" | "medium" | "high" | "critical"
  alertId?: string
  referralId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SMSAlert = await request.json()
    const { recipients, message, priority, alertId, referralId } = body

    console.log("Sending SMS alert:", {
      recipients: recipients.length,
      priority,
      alertId,
      referralId,
      timestamp: new Date().toISOString(),
    })

    // Mock Twilio SMS sending
    const results = []
    for (const phoneNumber of recipients) {
      try {
        // In a real implementation, use Twilio SDK
        // const twilioMessage = await twilioClient.messages.create({
        //   body: formatSMSMessage(message, priority, alertId),
        //   from: process.env.TWILIO_PHONE_NUMBER,
        //   to: phoneNumber
        // })

        const mockResult = {
          to: phoneNumber,
          status: "sent",
          sid: `SM${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        }

        results.push(mockResult)

        // Log SMS activity
        await logSMSActivity({
          alertId: alertId || `sms-${Date.now()}`,
          phoneNumber,
          priority,
          status: "sent",
          timestamp: new Date().toISOString(),
          referralId,
        })
      } catch (error) {
        console.error(`Failed to send SMS to ${phoneNumber}:`, error)
        results.push({
          to: phoneNumber,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        })
      }
    }

    const successCount = results.filter((r) => r.status === "sent").length
    const failureCount = results.filter((r) => r.status === "failed").length

    return NextResponse.json({
      success: successCount > 0,
      message: `SMS alerts sent: ${successCount} successful, ${failureCount} failed`,
      results,
      alertId,
    })
  } catch (error) {
    console.error("Failed to send SMS alerts:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send SMS alerts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function formatSMSMessage(message: string, priority: string, alertId?: string): string {
  const priorityEmoji = {
    critical: "🚨",
    high: "⚠️",
    medium: "ℹ️",
    low: "📋",
  }

  const emoji = priorityEmoji[priority as keyof typeof priorityEmoji] || "📋"

  return `${emoji} ${priority.toUpperCase()} ALERT: ${message}${alertId ? ` (ID: ${alertId})` : ""} - View dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/referral-dashboard`
}

async function logSMSActivity(activity: {
  alertId: string
  phoneNumber: string
  priority: string
  status: string
  timestamp: string
  referralId?: string
}) {
  // In a real implementation, this would save to your database
  console.log("Logging SMS activity:", activity)

  // Mock database save
  // await db.smsActivity.create({
  //   data: activity
  // })
}
