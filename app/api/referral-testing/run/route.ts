import { type NextRequest, NextResponse } from "next/server"
import { runReferralAutomation } from "@/lib/referral-automation"

export async function POST(request: NextRequest) {
  try {
    const { referralData, configName } = await request.json()

    if (!referralData) {
      return NextResponse.json({ error: "Referral data is required" }, { status: 400 })
    }

    // Validate required fields
    const requiredFields = ["patientName", "diagnosis", "insuranceProvider", "referralSource", "urgency"]
    for (const field of requiredFields) {
      if (!referralData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Run the referral automation
    const result = await runReferralAutomation(referralData)

    if (!result.success) {
      return NextResponse.json({ error: result.message || "Automation failed" }, { status: 500 })
    }

    // Log the test for analytics
    console.log(`Test completed for ${configName}:`, {
      patient: referralData.patientName,
      decision: result.decision?.action,
      confidence: result.decision?.confidence,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      decision: result.decision,
      referralId: result.referralId,
      timestamp: result.automationTimestamp,
      configName,
    })
  } catch (error) {
    console.error("Referral testing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
