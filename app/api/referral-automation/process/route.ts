import { type NextRequest, NextResponse } from "next/server"
import { runReferralAutomation, type ReferralData } from "@/lib/referral-automation"

export async function POST(request: NextRequest) {
  try {
    const referralData: ReferralData = await request.json()
    const result = await runReferralAutomation(referralData)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 500 })
    }
  } catch (error) {
    console.error("Referral automation endpoint error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process referral automation request",
      },
      { status: 500 },
    )
  }
}
