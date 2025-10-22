import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    // Mock SendGrid status
    const status = {
      connected: true,
      apiKey: "SG.****...****",
      templates: [
        { id: "welcome", name: "Welcome Email", status: "active" },
        { id: "interview", name: "Interview Invitation", status: "active" },
        { id: "rejection", name: "Application Rejection", status: "active" },
        { id: "offer", name: "Job Offer", status: "active" },
      ],
      stats: {
        emailsSent: 1247,
        deliveryRate: 98.7,
        openRate: 24.3,
        clickRate: 3.2,
      },
    }

    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json({ error: "Failed to check SendGrid status" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { enabled, action, data } = await request.json()

    if (action === "send_email") {
      // Mock email sending
      const result = {
        success: true,
        messageId: `msg_${Date.now()}`,
        to: data.to,
        template: data.template,
        status: "queued",
      }

      return NextResponse.json(result)
    }

    // Toggle integration
    const result = {
      success: true,
      enabled,
      message: enabled ? "SendGrid integration enabled" : "SendGrid integration disabled",
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "Failed to process SendGrid request" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { operation, templateId, templateData } = await request.json()

    switch (operation) {
      case "update_template":
        return NextResponse.json({
          success: true,
          message: `Template ${templateId} updated successfully`,
          templateId,
        })

      case "test_email":
        return NextResponse.json({
          success: true,
          message: "Test email sent successfully",
          deliveryTime: "2.3s",
        })

      default:
        return NextResponse.json({ error: "Unknown operation" }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to execute SendGrid operation" }, { status: 500 })
  }
}
