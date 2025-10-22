import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const referralData = await request.json()

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Auto-approve based on criteria
    const autoApprove =
      referralData.insuranceProvider === "Medicare" || referralData.services.includes("Skilled Nursing")

    const response = {
      id: `REF-${Date.now()}`,
      status: autoApprove ? "accepted" : "pending",
      message: autoApprove
        ? "Referral automatically approved! Patient can be admitted within 24 hours."
        : "Referral received and under review. You'll receive an update within 2 hours.",
      estimatedResponse: autoApprove ? "Immediate" : "2 hours",
      nextSteps: autoApprove
        ? ["Contact patient to schedule admission", "Prepare care plan", "Coordinate with clinical team"]
        : ["Insurance verification in progress", "Clinical review scheduled", "Will contact with decision"],
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({ error: "Failed to process referral" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Mock referral data
  const referrals = [
    {
      id: "REF-001",
      patientInitials: "J.S.",
      diagnosis: "Post-operative care for hip replacement",
      status: "accepted",
      submittedDate: "2024-01-15",
      services: ["Skilled Nursing", "Physical Therapy"],
      insuranceProvider: "Medicare",
      feedback: "Patient admitted successfully. Excellent documentation provided.",
    },
    {
      id: "REF-002",
      patientInitials: "M.J.",
      diagnosis: "Diabetes management and wound care",
      status: "pending",
      submittedDate: "2024-01-16",
      services: ["Skilled Nursing", "Wound Care"],
      insuranceProvider: "Humana",
    },
  ]

  return NextResponse.json(referrals)
}
