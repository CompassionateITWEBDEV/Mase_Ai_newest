import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    // Mock Sterling background check status
    const status = {
      connected: true,
      accountId: "sterling_****...****",
      plan: "Professional",
      creditsRemaining: 89,
      stats: {
        checksCompleted: 167,
        avgProcessingTime: "2.3 days",
        passRate: 91.7,
      },
      services: [
        { name: "Criminal Background Check", status: "active", cost: "$25.00" },
        { name: "Employment Verification", status: "active", cost: "$15.00" },
        { name: "Education Verification", status: "active", cost: "$20.00" },
        { name: "Professional License Check", status: "active", cost: "$12.00" },
      ],
    }

    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json({ error: "Failed to check Sterling status" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { enabled, action, data } = await request.json()

    if (action === "initiate_check") {
      // Mock background check initiation
      const result = {
        success: true,
        checkId: `bgc_${Date.now()}`,
        applicantId: data.applicantId,
        services: data.services,
        status: "in_progress",
        estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        cost: "$72.00",
      }

      return NextResponse.json(result)
    }

    // Toggle integration
    const result = {
      success: true,
      enabled,
      message: enabled ? "Sterling integration enabled" : "Sterling integration disabled",
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "Failed to process Sterling request" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { operation, checkId } = await request.json()

    switch (operation) {
      case "check_status":
        return NextResponse.json({
          success: true,
          checkId,
          status: "completed",
          result: "clear",
          completedDate: new Date().toISOString(),
          details: {
            criminal: "clear",
            employment: "verified",
            education: "verified",
            license: "active",
          },
        })

      case "download_report":
        return NextResponse.json({
          success: true,
          reportUrl: `https://reports.sterling.com/report/${checkId}`,
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })

      default:
        return NextResponse.json({ error: "Unknown operation" }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to execute Sterling operation" }, { status: 500 })
  }
}
