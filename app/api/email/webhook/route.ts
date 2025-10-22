import { type NextRequest, NextResponse } from "next/server"
import { runReferralAutomation } from "@/lib/referral-automation"
import type { ReferralData } from "@/lib/referral-automation"

interface EmailWebhookPayload {
  from: string
  to: string
  subject: string
  text?: string
  html?: string
  timestamp: string
  messageId: string
  provider: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("Generic email webhook received")

    // Get the provider from the URL path or headers
    const url = new URL(request.url)
    const provider = url.searchParams.get("provider") || "generic"

    const payload: EmailWebhookPayload = await request.json()

    console.log(`Processing email from ${payload.from} via ${provider}`)

    // Process the email
    const result = await processInboundEmail(payload)

    return NextResponse.json({
      success: true,
      processed: result.processed,
      referralId: result.referralId,
      decision: result.decision,
    })
  } catch (error) {
    console.error("Email webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function processInboundEmail(emailData: EmailWebhookPayload) {
  try {
    // Extract referral data from email content
    const referralData = await extractReferralFromEmail(emailData)

    if (!referralData) {
      console.log("No referral data found in email")
      return { processed: false, referralId: null, decision: null }
    }

    console.log(`Extracted referral data for patient: ${referralData.patientName}`)

    // Run the referral automation system
    const automationResult = await runReferralAutomation(referralData)

    if (automationResult.success) {
      console.log(`Referral processed successfully: ${automationResult.referralId}`)
      console.log(`AI Decision: ${automationResult.decision?.action}`)

      // Send confirmation email back to sender
      await sendConfirmationEmail(emailData.from, referralData, automationResult.decision)

      return {
        processed: true,
        referralId: automationResult.referralId,
        decision: automationResult.decision,
      }
    } else {
      console.error("Referral automation failed:", automationResult.message)
      return { processed: false, referralId: null, decision: null }
    }
  } catch (error) {
    console.error("Error processing email:", error)
    return { processed: false, referralId: null, decision: null }
  }
}

async function extractReferralFromEmail(emailData: EmailWebhookPayload): Promise<ReferralData | null> {
  const subject = emailData.subject || ""
  const content = emailData.text || stripHtml(emailData.html || "")

  console.log(`Analyzing email: Subject="${subject}", Content length=${content.length}`)

  // Check if this looks like a referral email
  const referralKeywords = [
    "patient",
    "referral",
    "admission",
    "discharge",
    "home health",
    "skilled nursing",
    "therapy",
    "medical",
    "healthcare",
    "treatment",
  ]

  const hasReferralKeywords = referralKeywords.some(
    (keyword) => subject.toLowerCase().includes(keyword) || content.toLowerCase().includes(keyword),
  )

  if (!hasReferralKeywords) {
    console.log("Email does not contain referral keywords")
    return null
  }

  // Extract patient information using comprehensive regex patterns
  const extractionPatterns = {
    patientName: [
      /(?:patient|name|pt):\s*([A-Za-z\s,.-]+?)(?:\n|$|,|\s{2,})/i,
      /(?:patient|name|pt)\s+(?:is\s+)?([A-Za-z\s,.-]+?)(?:\n|$|,|\s{2,})/i,
      /([A-Za-z]+\s+[A-Za-z]+)(?:\s+is\s+(?:a\s+)?(?:\d+|patient))/i,
    ],
    diagnosis: [
      /(?:diagnosis|condition|dx):\s*([A-Za-z\s,.-]+?)(?:\n|$|insurance|services)/i,
      /(?:diagnosed\s+with|condition\s+is)\s+([A-Za-z\s,.-]+?)(?:\n|$|insurance|services)/i,
      /(?:primary\s+diagnosis):\s*([A-Za-z\s,.-]+?)(?:\n|$)/i,
    ],
    insurance: [
      /(?:insurance|payer|coverage):\s*([A-Za-z\s&.-]+?)(?:\n|$|id|number)/i,
      /(?:insured\s+by|covered\s+by)\s+([A-Za-z\s&.-]+?)(?:\n|$)/i,
      /(?:medicare|medicaid|blue\s+cross|aetna|humana|united|cigna)/i,
    ],
    address: [
      /(?:address|location|home):\s*([A-Za-z0-9\s,.-]+?)(?:\n|$|phone|zip)/i,
      /(?:lives\s+at|residing\s+at)\s+([A-Za-z0-9\s,.-]+?)(?:\n|$)/i,
    ],
    zipCode: [/(?:zip|postal)(?:\s+code)?:\s*(\d{5})/i, /\b(\d{5})\b/g],
    phone: [/(?:phone|tel|contact):\s*([\d\s\-$$$$.]+)/i, /($$\d{3}$$\s*\d{3}-\d{4}|\d{3}-\d{3}-\d{4}|\d{10})/],
  }

  // Extract patient name
  let patientName = ""
  for (const pattern of extractionPatterns.patientName) {
    const match = content.match(pattern)
    if (match && match[1]) {
      patientName = match[1].trim().replace(/[,.]$/, "")
      break
    }
  }

  if (!patientName) {
    console.log("Could not extract patient name from email")
    return null
  }

  // Extract diagnosis
  let diagnosis = "Not specified"
  for (const pattern of extractionPatterns.diagnosis) {
    const match = content.match(pattern)
    if (match && match[1]) {
      diagnosis = match[1].trim().replace(/[,.]$/, "")
      break
    }
  }

  // Extract insurance
  let insuranceProvider = "Unknown"
  for (const pattern of extractionPatterns.insurance) {
    const match = content.match(pattern)
    if (match && match[1]) {
      insuranceProvider = match[1].trim().replace(/[,.]$/, "")
      break
    } else if (pattern.test(content)) {
      const insuranceMatch = content.match(pattern)
      if (insuranceMatch) {
        insuranceProvider = insuranceMatch[0]
        break
      }
    }
  }

  // Extract address and zip code
  let address = "Not provided"
  let zipCode = "00000"

  for (const pattern of extractionPatterns.address) {
    const match = content.match(pattern)
    if (match && match[1]) {
      address = match[1].trim().replace(/[,.]$/, "")
      break
    }
  }

  const zipMatches = content.match(/\b(\d{5})\b/g)
  if (zipMatches && zipMatches.length > 0) {
    zipCode = zipMatches[zipMatches.length - 1] // Take the last zip code found
  }

  // Determine urgency from subject and content
  let urgency: "routine" | "urgent" | "stat" = "routine"
  const urgentKeywords = ["urgent", "priority", "asap", "rush"]
  const statKeywords = ["stat", "emergency", "immediate", "critical"]

  const textToCheck = (subject + " " + content).toLowerCase()

  if (statKeywords.some((keyword) => textToCheck.includes(keyword))) {
    urgency = "stat"
  } else if (urgentKeywords.some((keyword) => textToCheck.includes(keyword))) {
    urgency = "urgent"
  }

  // Extract requested services
  const serviceKeywords = {
    skilled_nursing: ["skilled nursing", "rn", "registered nurse", "nursing care"],
    physical_therapy: ["physical therapy", "pt", "physiotherapy", "mobility"],
    occupational_therapy: ["occupational therapy", "ot", "daily living", "adl"],
    speech_therapy: ["speech therapy", "st", "speech pathology", "swallowing"],
    wound_care: ["wound care", "wound management", "dressing changes"],
    medication_management: ["medication", "med management", "drug administration"],
    iv_therapy: ["iv therapy", "intravenous", "infusion"],
    catheter_care: ["catheter", "foley", "urinary catheter"],
  }

  const services: string[] = []
  Object.entries(serviceKeywords).forEach(([service, keywords]) => {
    if (keywords.some((keyword) => textToCheck.includes(keyword))) {
      services.push(service)
    }
  })

  // Default to skilled nursing if no services detected
  if (services.length === 0) {
    services.push("skilled_nursing")
  }

  // Check for physician orders
  const physicianOrders =
    textToCheck.includes("physician order") ||
    textToCheck.includes("doctor order") ||
    textToCheck.includes("md order") ||
    textToCheck.includes("orders")

  // Estimate episode length based on diagnosis and services
  let estimatedEpisodeLength = 60 // Default 60 days
  if (textToCheck.includes("short term") || textToCheck.includes("acute")) {
    estimatedEpisodeLength = 30
  } else if (textToCheck.includes("long term") || textToCheck.includes("chronic")) {
    estimatedEpisodeLength = 90
  }

  const referralData: ReferralData = {
    patientName,
    diagnosis,
    insuranceProvider,
    insuranceId: `EMAIL-${Date.now()}`,
    referralSource: `Email from ${emailData.from}`,
    serviceRequested: services,
    urgency,
    estimatedEpisodeLength,
    geographicLocation: {
      address,
      zipCode,
      distance: Math.floor(Math.random() * 30) + 5, // Simulated distance
    },
    hospitalRating: 4, // Default rating
    physicianOrders,
  }

  console.log("Successfully extracted referral data:", {
    patient: referralData.patientName,
    diagnosis: referralData.diagnosis,
    insurance: referralData.insuranceProvider,
    services: referralData.serviceRequested,
    urgency: referralData.urgency,
  })

  return referralData
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

async function sendConfirmationEmail(toEmail: string, referralData: ReferralData, decision: any) {
  console.log(`Sending confirmation email to ${toEmail}`)
  console.log(`Referral for ${referralData.patientName}: ${decision?.action}`)

  // In a real implementation, you would use your email service to send a confirmation
  // This would include:
  // - Referral ID
  // - Decision (Accept/Review/Reject)
  // - Next steps
  // - Contact information
  // - Timeline expectations

  const confirmationData = {
    to: toEmail,
    subject: `Referral Confirmation - ${referralData.patientName}`,
    body: `
Dear Healthcare Partner,

Thank you for your referral. Here are the details:

Patient: ${referralData.patientName}
Diagnosis: ${referralData.diagnosis}
Services: ${referralData.serviceRequested.join(", ")}
Decision: ${decision?.action?.toUpperCase()}
Confidence: ${Math.round((decision?.confidence || 0) * 100)}%

${
  decision?.action === "accept"
    ? "We have accepted this referral and will contact you within 24 hours to coordinate care."
    : decision?.action === "review"
      ? "This referral requires manual review. Our team will respond within 4 hours."
      : "We are unable to accept this referral at this time. Please see attached explanation."
}

Next Steps:
${
  decision?.recommendedNextSteps?.map((step: string, index: number) => `${index + 1}. ${step}`).join("\n") ||
  "Our team will contact you with next steps."
}

Best regards,
Healthcare Staffing Team
    `.trim(),
  }

  // Log the confirmation for demo purposes
  console.log("Confirmation email content:", confirmationData)
}
