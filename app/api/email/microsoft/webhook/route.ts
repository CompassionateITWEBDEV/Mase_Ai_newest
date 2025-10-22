import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("Microsoft 365 webhook received")

    const emailData = await request.json()

    // Transform Microsoft Graph format to our standard format
    const standardEmailData = {
      from: emailData.from?.emailAddress?.address || emailData.sender?.emailAddress?.address,
      to: emailData.toRecipients?.[0]?.emailAddress?.address || emailData.to,
      subject: emailData.subject,
      text: emailData.body?.content || emailData.bodyPreview,
      html: emailData.body?.contentType === "html" ? emailData.body?.content : undefined,
      timestamp: emailData.receivedDateTime || emailData.sentDateTime || new Date().toISOString(),
      messageId: emailData.id || emailData.internetMessageId,
      provider: "microsoft",
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
    console.error("Microsoft webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

// async function processMicrosoftEmail(notification: any) {
//   try {
//     // In a real implementation, you would:
//     // 1. Use the notification.resource to fetch the actual email via Microsoft Graph API
//     // 2. Extract the email content and metadata
//     // 3. Process the referral data

//     console.log("Processing Microsoft email notification:", notification.resource)

//     // For demo purposes, simulate email processing
//     const mockEmailData = {
//       subject: "New Patient Referral - Microsoft 365",
//       from: "hospital@example.com",
//       body: `
//         Patient: Jane Smith
//         Diagnosis: Post-operative care
//         Insurance Provider: Blue Cross Blue Shield
//         Services Requested: Skilled Nursing, Physical Therapy
//         Urgency: Routine
//       `,
//     }

//     const referralData = await extractReferralFromMicrosoftEmail(mockEmailData)

//     if (!referralData) {
//       console.log("No referral data found in Microsoft email")
//       return
//     }

//     // Run referral automation
//     const result = await runReferralAutomation(referralData)

//     if (result.success) {
//       console.log(`Microsoft referral processed: ${result.referralId}, Decision: ${result.decision?.action}`)
//     } else {
//       console.error("Microsoft referral automation failed:", result.message)
//     }
//   } catch (error) {
//     console.error("Error processing Microsoft email:", error)
//   }
// }

// async function extractReferralFromMicrosoftEmail(emailData: any): Promise<ReferralData | null> {
//   const subject = emailData.subject || ""
//   const content = emailData.body || ""

//   // Check for referral indicators
//   const referralKeywords = ["patient", "referral", "admission", "discharge", "home health"]
//   const hasReferralKeywords = referralKeywords.some(
//     (keyword) => subject.toLowerCase().includes(keyword) || content.toLowerCase().includes(keyword),
//   )

//   if (!hasReferralKeywords) {
//     return null
//   }

//   // Extract patient information
//   const patientNameMatch = content.match(/(?:patient|name):?\s*([A-Za-z\s]+)/i)
//   const diagnosisMatch = content.match(/(?:diagnosis|condition):?\s*([A-Za-z\s,.-]+)/i)
//   const insuranceMatch = content.match(/(?:insurance|payer):?\s*([A-Za-z\s&]+)/i)

//   if (!patientNameMatch) {
//     return null
//   }

//   // Determine urgency
//   let urgency: "routine" | "urgent" | "stat" = "routine"
//   if (subject.toLowerCase().includes("urgent") || content.toLowerCase().includes("urgent")) {
//     urgency = "urgent"
//   }
//   if (subject.toLowerCase().includes("stat") || subject.toLowerCase().includes("emergency")) {
//     urgency = "stat"
//   }

//   // Extract services
//   const services = []
//   if (content.toLowerCase().includes("skilled nursing")) services.push("skilled_nursing")
//   if (content.toLowerCase().includes("physical therapy")) services.push("physical_therapy")
//   if (content.toLowerCase().includes("occupational therapy")) services.push("occupational_therapy")
//   if (content.toLowerCase().includes("speech therapy")) services.push("speech_therapy")

//   return {
//     patientName: patientNameMatch[1].trim(),
//     diagnosis: diagnosisMatch ? diagnosisMatch[1].trim() : "Not specified",
//     insuranceProvider: insuranceMatch ? insuranceMatch[1].trim() : "Unknown",
//     insuranceId: `MS-${Date.now()}`,
//     referralSource: `Microsoft 365 Email from ${emailData.from}`,
//     serviceRequested: services.length > 0 ? services : ["skilled_nursing"],
//     urgency,
//     estimatedEpisodeLength: 60,
//     geographicLocation: {
//       address: "Not provided",
//       zipCode: "00000",
//       distance: Math.floor(Math.random() * 30) + 5,
//     },
//     hospitalRating: 4,
//     physicianOrders:
//       content.toLowerCase().includes("physician order") || content.toLowerCase().includes("doctor order"),
//   }
// }
