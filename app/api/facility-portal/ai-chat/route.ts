import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    let response = ""
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("refer") || lowerMessage.includes("referral")) {
      response =
        "To submit a referral, go to the 'Submit Referral' tab and fill out the patient information. We accept referrals for skilled nursing, physical therapy, occupational therapy, and wound care services. Most Medicare referrals are auto-approved within minutes!"
    } else if (lowerMessage.includes("insurance") || lowerMessage.includes("coverage")) {
      response =
        "We accept Medicare, Medicaid, and most major commercial insurances including Humana, United Healthcare, Aetna, and Cigna. Medicare patients typically have immediate approval, while commercial insurance may require prior authorization."
    } else if (lowerMessage.includes("dme") || lowerMessage.includes("supplies")) {
      response =
        "We can arrange DME supplies through our partnerships with Parachute Health and Verse Medical. Common items include wound care supplies, mobility aids, diabetic supplies, and respiratory equipment. Orders are typically approved within 2 hours and delivered within 2-3 business days."
    } else if (lowerMessage.includes("status") || lowerMessage.includes("track")) {
      response =
        "You can track all your referrals in the 'Referral Tracker' tab. Status updates are provided in real-time, and you'll receive notifications for any changes. Accepted referrals show green, pending show yellow, and any issues show red."
    } else if (lowerMessage.includes("contact") || lowerMessage.includes("phone")) {
      response =
        "You can reach our intake team at (555) 123-4567 or use the secure messaging system in this portal. Our team is available 24/7 for urgent matters. For DME orders, contact our supply team at (555) 123-4568."
    } else if (lowerMessage.includes("urgent") || lowerMessage.includes("stat")) {
      response =
        "For STAT referrals, mark the urgency as 'STAT' in the referral form. These are reviewed immediately by our clinical team. You can also call our urgent line at (555) 123-4567 and press 1 for immediate assistance."
    } else if (
      lowerMessage.includes("genesee") ||
      lowerMessage.includes("county") ||
      lowerMessage.includes("coverage area")
    ) {
      response =
        "Yes, we provide services throughout Genesee County and surrounding areas including Flint, Burton, Grand Blanc, Fenton, and Davison. Our coverage area extends to most of mid-Michigan."
    } else {
      response =
        "I'm here to help with referrals, insurance questions, DME supplies, coverage areas, and general information about our services. You can ask me about:\n\n• How to submit referrals\n• Insurance coverage\n• DME supply ordering\n• Service areas\n• Contact information\n• Urgent referral procedures\n\nWhat specific question can I assist you with?"
    }

    return NextResponse.json({ response })
  } catch (error) {
    return NextResponse.json({ error: "Failed to process AI request" }, { status: 500 })
  }
}
