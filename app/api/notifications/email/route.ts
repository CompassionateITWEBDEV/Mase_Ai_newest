import { type NextRequest, NextResponse } from "next/server"

interface EmailAlert {
  recipients: string[]
  subject: string
  message: string
  priority: "low" | "medium" | "high" | "critical"
  alertId?: string
  referralId?: string
  patientName?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailAlert = await request.json()
    const { recipients, subject, message, priority, alertId, referralId, patientName } = body

    // In a real implementation, you would use your email service (SendGrid, etc.)
    console.log("Sending email alert:", {
      recipients,
      subject,
      priority,
      alertId,
      referralId,
      patientName,
      timestamp: new Date().toISOString(),
    })

    // Mock email sending with SendGrid
    const emailData = {
      personalizations: recipients.map((email) => ({ to: [{ email }] })),
      from: { email: "alerts@healthcareagency.com", name: "Healthcare Alert System" },
      subject,
      content: [
        {
          type: "text/html",
          value: generateEmailTemplate(message, priority, alertId, referralId, patientName),
        },
      ],
      categories: ["referral-alert", `priority-${priority}`],
      custom_args: {
        alert_id: alertId || "",
        referral_id: referralId || "",
        priority,
      },
    }

    // Simulate API call to SendGrid
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(emailData)
    // })

    // Log the alert for reporting
    await logAlertActivity({
      alertId: alertId || `email-${Date.now()}`,
      type: "email",
      priority,
      recipients: recipients.length,
      status: "sent",
      timestamp: new Date().toISOString(),
      referralId,
      patientName,
    })

    return NextResponse.json({
      success: true,
      message: "Email alert sent successfully",
      recipients: recipients.length,
      alertId,
    })
  } catch (error) {
    console.error("Failed to send email alert:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send email alert",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function generateEmailTemplate(
  message: string,
  priority: string,
  alertId?: string,
  referralId?: string,
  patientName?: string,
): string {
  const priorityColors = {
    critical: "#dc2626",
    high: "#ea580c",
    medium: "#ca8a04",
    low: "#2563eb",
  }

  const priorityColor = priorityColors[priority as keyof typeof priorityColors] || "#6b7280"

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Healthcare Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${priorityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">${priority.toUpperCase()} ALERT</h1>
        ${priority === "critical" ? '<p style="margin: 10px 0 0 0; font-size: 16px;">🚨 IMMEDIATE ACTION REQUIRED 🚨</p>' : ""}
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        ${patientName ? `<h2 style="color: ${priorityColor}; margin-top: 0;">Patient: ${patientName}</h2>` : ""}
        
        <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${priorityColor};">
          <p style="margin: 0; font-size: 16px; font-weight: 500;">${message}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
          ${referralId ? `<div><strong>Referral ID:</strong><br>${referralId}</div>` : ""}
          ${alertId ? `<div><strong>Alert ID:</strong><br>${alertId}</div>` : ""}
          <div><strong>Priority:</strong><br><span style="color: ${priorityColor}; font-weight: bold;">${priority.toUpperCase()}</span></div>
          <div><strong>Time:</strong><br>${new Date().toLocaleString()}</div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/referral-dashboard" 
             style="background: ${priorityColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
            View Dashboard
          </a>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 6px; font-size: 14px;">
          <strong>⚠️ Important:</strong> This is an automated alert from your Healthcare Management System. 
          ${priority === "critical" ? "Please respond immediately." : "Please review when convenient."}
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280;">
        <p>Healthcare Alert System | ${new Date().getFullYear()}</p>
        <p>This email was sent to: ${process.env.NEXT_PUBLIC_APP_URL}</p>
      </div>
    </body>
    </html>
  `
}

async function logAlertActivity(activity: {
  alertId: string
  type: string
  priority: string
  recipients: number
  status: string
  timestamp: string
  referralId?: string
  patientName?: string
}) {
  // In a real implementation, this would save to your database
  console.log("Logging alert activity:", activity)

  // Mock database save
  // await db.alertActivity.create({
  //   data: activity
  // })
}
