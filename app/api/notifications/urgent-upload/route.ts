import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { uploadType, patientName, fileCount, uploadedBy } = await request.json()

    // In a real app, you would:
    // 1. Send email notifications using SendGrid
    // 2. Send SMS alerts using Twilio
    // 3. Create in-app notifications
    // 4. Log to audit trail

    console.log("Sending urgent upload notification:", {
      uploadType,
      patientName,
      fileCount,
      uploadedBy,
    })

    // Simulate SendGrid email notification
    if (process.env.SENDGRID_API_KEY) {
      const emailData = {
        to: "qa-team@healthcare-agency.com",
        from: "noreply@healthcare-agency.com",
        subject: `URGENT: ${uploadType.toUpperCase()} Upload Requires Immediate Attention`,
        html: `
          <h2>Urgent Upload Notification</h2>
          <p><strong>Upload Type:</strong> ${uploadType.replace("_", " ").toUpperCase()}</p>
          <p><strong>Patient:</strong> ${patientName || "Not specified"}</p>
          <p><strong>Files:</strong> ${fileCount}</p>
          <p><strong>Uploaded By:</strong> ${uploadedBy}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p>Please review this upload as soon as possible.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/oasis-upload?tab=queue" 
             style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Review Now
          </a>
        `,
      }

      // In production, actually send the email:
      // await sendGridClient.send(emailData)
    }

    // Simulate Twilio SMS notification for urgent cases
    if (process.env.TWILIO_ACCOUNT_SID && uploadType === "urgent") {
      const smsData = {
        to: "+1234567890", // QA Manager phone
        from: process.env.TWILIO_PHONE_NUMBER,
        body: `URGENT OASIS Upload: ${patientName || "Unknown patient"} - ${fileCount} file(s) uploaded by ${uploadedBy}. Review immediately.`,
      }

      // In production, actually send the SMS:
      // await twilioClient.messages.create(smsData)
    }

    // Create in-app notification record
    const notification = {
      id: `NOTIF-${Date.now()}`,
      type: "urgent_upload",
      title: "Urgent Upload Requires Review",
      message: `${uploadType.replace("_", " ").toUpperCase()} upload for ${patientName || "unknown patient"} needs immediate attention`,
      priority: "urgent",
      createdAt: new Date().toISOString(),
      readAt: null,
      actionUrl: "/oasis-upload?tab=queue",
      metadata: {
        uploadType,
        patientName,
        fileCount,
        uploadedBy,
      },
    }

    return NextResponse.json({
      success: true,
      message: "Urgent notification sent",
      notification,
    })
  } catch (error) {
    console.error("Urgent notification error:", error)
    return NextResponse.json({ error: "Failed to send urgent notification" }, { status: 500 })
  }
}
