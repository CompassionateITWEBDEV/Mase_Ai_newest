import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const alert = await request.json()

    // Log the financial alert
    console.log("FINANCIAL ALERT:", alert)

    // In a real implementation, you would:
    // 1. Store the alert in the database
    // 2. Send notifications via email/SMS to relevant staff
    // 3. Create tasks in the workflow system
    // 4. Update patient records with alert status

    // Send immediate email notification for high-severity alerts
    if (alert.severity === "high") {
      await sendUrgentNotification(alert)
    }

    // Send SMS for eligibility loss
    if (alert.type === "eligibility_lost") {
      await sendSMSAlert(alert)
    }

    return NextResponse.json({
      success: true,
      message: "Financial alert processed successfully",
      alertId: alert.id,
    })
  } catch (error) {
    console.error("Error processing financial alert:", error)
    return NextResponse.json({ success: false, error: "Failed to process financial alert" }, { status: 500 })
  }
}

async function sendUrgentNotification(alert: any) {
  // Send email to billing manager, clinical director, and admissions
  const recipients = ["billing@agency.com", "clinical.director@agency.com", "admissions@agency.com"]

  const emailData = {
    to: recipients,
    subject: `URGENT: Financial Alert - ${alert.patientName}`,
    html: `
      <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
        <h2 style="color: #dc2626; margin-top: 0;">🚨 URGENT FINANCIAL ALERT</h2>
        <p><strong>Patient:</strong> ${alert.patientName}</p>
        <p><strong>Alert Type:</strong> ${alert.type.replace("_", " ").toUpperCase()}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
        
        <h3 style="color: #dc2626;">Immediate Actions Required:</h3>
        <ul>
          ${alert.recommendations.map((rec: string) => `<li>${rec}</li>`).join("")}
        </ul>
        
        <p style="margin-top: 20px; padding: 10px; background-color: #fef3c7; border-radius: 4px;">
          <strong>⚠️ This alert requires immediate attention to prevent financial loss.</strong>
        </p>
      </div>
    `,
  }

  try {
    await fetch("/api/integrations/sendgrid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailData),
    })
  } catch (error) {
    console.error("Failed to send urgent email notification:", error)
  }
}

async function sendSMSAlert(alert: any) {
  const smsData = {
    to: ["+1234567890"], // Replace with actual phone numbers
    message: `URGENT: ${alert.patientName} lost insurance eligibility. Immediate action required to prevent financial loss. Check referral management system for details.`,
  }

  try {
    await fetch("/api/integrations/twilio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(smsData),
    })
  } catch (error) {
    console.error("Failed to send SMS alert:", error)
  }
}
