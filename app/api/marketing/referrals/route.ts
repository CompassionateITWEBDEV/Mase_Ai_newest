import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["facilityName", "contactName", "patientName", "serviceNeeded", "referredBy"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const referralData = {
      id: `REF-${Date.now()}`,
      facilityName: body.facilityName,
      contactName: body.contactName,
      contactPhone: body.contactPhone || "",
      contactEmail: body.contactEmail || "",
      patientName: body.patientName,
      patientAge: body.patientAge || "",
      serviceNeeded: body.serviceNeeded,
      urgencyLevel: body.urgencyLevel || "routine",
      referralDate: body.referralDate,
      referredBy: body.referredBy,
      insuranceType: body.insuranceType || "",
      notes: body.notes || "",
      status: "new",
      createdAt: new Date().toISOString(),
    }

    // Enhanced routing logic
    let routingDestination = "general"
    let organizationName = "M.A.S.E. Pro"

    if (
      body.serviceNeeded === "behavioral" ||
      body.serviceNeeded === "detox" ||
      body.serviceNeeded === "mental-health"
    ) {
      routingDestination = "serenity"
      organizationName = "Serenity"
    } else if (["home-health", "skilled-nursing", "therapy", "hospice"].includes(body.serviceNeeded)) {
      routingDestination = "chhs"
      organizationName = "CHHS"
    }

    // Send webhook notification with enhanced data
    if (process.env.WEBHOOK_URL) {
      await fetch(process.env.WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "new_referral",
          data: referralData,
          routing: {
            destination: routingDestination,
            organization: organizationName,
          },
          urgency: body.urgencyLevel,
          timestamp: new Date().toISOString(),
        }),
      })
    }

    // Send email notifications based on urgency
    if (body.urgencyLevel === "urgent" || body.urgencyLevel === "stat") {
      // In real implementation, send urgent notifications
      console.log(`URGENT REFERRAL: ${referralData.id} - ${body.urgencyLevel}`)
    }

    return NextResponse.json({
      success: true,
      referral: referralData,
      routing: {
        destination: routingDestination,
        organization: organizationName,
      },
      message: `Referral successfully submitted and routed to ${organizationName}`,
    })
  } catch (error) {
    console.error("Error processing referral:", error)
    return NextResponse.json({ success: false, error: "Failed to process referral" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, fetch from your database
    // This would include filtering, pagination, etc.

    const mockReferrals = [
      {
        id: "REF-001",
        facilityName: "Mercy General Hospital",
        patientName: "J.S.",
        serviceNeeded: "home-health",
        status: "new",
        referredBy: "Sarah Johnson",
        createdAt: "2024-01-10T10:00:00Z",
      },
      // Add more mock data as needed
    ]

    return NextResponse.json({
      success: true,
      referrals: mockReferrals,
    })
  } catch (error) {
    console.error("Error fetching referrals:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch referrals" }, { status: 500 })
  }
}
