import { type NextRequest, NextResponse } from "next/server"
import { runReferralAutomation } from "@/lib/referral-automation"
import type { ReferralData } from "@/lib/referral-automation"
import { stripHtml } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    console.log("Postmark webhook received")

    const emailData = await request.json()

    // Transform Postmark format to our standard format
    const standardEmailData = {
      from: emailData.FromFull?.Email || emailData.From,
      to: emailData.ToFull?.[0]?.Email || emailData.To,
      subject: emailData.Subject,
      text: emailData.TextBody,
      html: emailData.HtmlBody,
      timestamp: emailData.Date || new Date().toISOString(),
      messageId: emailData.MessageID,
      provider: "postmark",
    }

    // Forward to the generic email webhook processor
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(standardEmailData),
    })

    const result = await response.json()
    return NextResponse.json(result, { status: response.status })
  } catch (error) {
    console.error("Postmark webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function processPostmarkEmail(emailData: any) {
  try {
    // Extract referral data
    const referralData = await extractReferralFromPostmarkEmail(emailData)

    if (!referralData) {
      console.log("No referral data found in Postmark email")
      return
    }

    // Run referral automation
    const result = await runReferralAutomation(referralData)

    if (result.success) {
      console.log(`Postmark referral processed: ${result.referralId}, Decision: ${result.decision?.action}`)

      // Send confirmation via Postmark API
      await sendPostmarkConfirmation(emailData.From, referralData, result.decision)
    } else {
      console.error("Postmark referral automation failed:", result.message)
    }
  } catch (error) {
    console.error("Error processing Postmark email:", error)
  }
}

async function extractReferralFromPostmarkEmail(emailData: any): Promise<ReferralData | null> {
  const subject = emailData.Subject || ""
  const content = emailData.TextBody || stripHtml(emailData.HtmlBody) || ""

  // Check for referral indicators
  const referralKeywords = ["patient", "referral", "admission", "discharge", "home health"]
  const hasReferralKeywords = referralKeywords.some(
    (keyword) => subject.toLowerCase().includes(keyword) || content.toLowerCase().includes(keyword),
  )

  if (!hasReferralKeywords) {
    return null
  }

  // Extract patient information
  const patientNameMatch = content.match(/(?:patient|name):?\s*([A-Za-z\s]+)/i)
  const diagnosisMatch = content.match(/(?:diagnosis|condition):?\s*([A-Za-z\s,.-]+)/i)
  const insuranceMatch = content.match(/(?:insurance|payer):?\s*([A-Za-z\s&]+)/i)
  const addressMatch = content.match(/(?:address):?\s*([A-Za-z0-9\s,.-]+)/i)
  const zipMatch = content.match(/(?:zip|postal):?\s*(\d{5})/i)

  if (!patientNameMatch) {
    return null
  }

  // Determine urgency
  let urgency: "routine" | "urgent" | "stat" = "routine"
  if (subject.toLowerCase().includes("urgent") || content.toLowerCase().includes("urgent")) {
    urgency = "urgent"
  }
  if (subject.toLowerCase().includes("stat") || subject.toLowerCase().includes("emergency")) {
    urgency = "stat"
  }

  // Extract services
  const services = []
  if (content.toLowerCase().includes("skilled nursing")) services.push("skilled_nursing")
  if (content.toLowerCase().includes("physical therapy")) services.push("physical_therapy")
  if (content.toLowerCase().includes("occupational therapy")) services.push("occupational_therapy")
  if (content.toLowerCase().includes("speech therapy")) services.push("speech_therapy")

  return {
    patientName: patientNameMatch[1].trim(),
    diagnosis: diagnosisMatch ? diagnosisMatch[1].trim() : "Not specified",
    insuranceProvider: insuranceMatch ? insuranceMatch[1].trim() : "Unknown",
    insuranceId: `PM-${Date.now()}`,
    referralSource: `Postmark Email from ${emailData.From}`,
    serviceRequested: services.length > 0 ? services : ["skilled_nursing"],
    urgency,
    estimatedEpisodeLength: 60,
    geographicLocation: {
      address: addressMatch ? addressMatch[1].trim() : "Not provided",
      zipCode: zipMatch ? zipMatch[1] : "00000",
      distance: Math.floor(Math.random() * 30) + 5,
    },
    hospitalRating: 4,
    physicianOrders:
      content.toLowerCase().includes("physician order") || content.toLowerCase().includes("doctor order"),
  }
}

async function sendPostmarkConfirmation(toEmail: string, referralData: ReferralData, decision: any) {
  console.log(`Sending Postmark confirmation to ${toEmail}`)
  console.log(`Referral for ${referralData.patientName}: ${decision?.action}`)

  // In a real implementation, use Postmark API to send confirmation email
}
