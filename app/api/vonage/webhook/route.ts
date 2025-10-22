import { type NextRequest, NextResponse } from "next/server"
import { runReferralAutomation } from "@/lib/referral-automation"
import type { ReferralData } from "@/lib/referral-automation"

export async function POST(request: NextRequest) {
  try {
    const faxData = await request.json()

    console.log("Processing fax referral:", faxData.message_id)

    // Extract referral information from fax using OCR and AI
    const referralData = await extractReferralFromFax(faxData)

    if (!referralData) {
      return NextResponse.json({ error: "Could not extract referral data from fax" }, { status: 400 })
    }

    // Run automated referral processing
    const automationResult = await runReferralAutomation(referralData)

    if (automationResult.success) {
      // Send confirmation fax back to sender
      await sendConfirmationFax(faxData.from, referralData, automationResult.decision)

      return NextResponse.json({
        success: true,
        message: "Fax referral processed successfully",
        referralId: automationResult.referralId,
        decision: automationResult.decision?.action,
        confidence: automationResult.decision?.confidence,
      })
    } else {
      return NextResponse.json({ error: automationResult.message }, { status: 500 })
    }
  } catch (error) {
    console.error("Fax webhook error:", error)
    return NextResponse.json({ error: "Failed to process fax referral" }, { status: 500 })
  }
}

async function extractReferralFromFax(faxData: any): Promise<ReferralData | null> {
  // Simulate OCR and AI extraction from fax
  await new Promise((resolve) => setTimeout(resolve, 2000))

  try {
    // In a real implementation, this would:
    // 1. Download the fax PDF/image from Vonage
    // 2. Run OCR to extract text
    // 3. Use AI to parse medical referral information

    // For demo purposes, simulate extracted data
    const mockExtractedText = `
      REFERRAL FORM
      Patient: John Smith
      DOB: 01/15/1950
      Diagnosis: Diabetes with complications, Hypertension
      Insurance: Medicare Part A & B
      Policy #: 123456789A
      Address: 123 Main St, Houston, TX 77001
      Physician: Dr. Sarah Johnson
      Services Requested: Skilled Nursing, Diabetic Management
      Urgency: Routine
      Estimated Length of Care: 45 days
    `

    // Parse the extracted text
    const patientNameMatch = mockExtractedText.match(/Patient:?\s*([A-Za-z\s]+)/i)
    const diagnosisMatch = mockExtractedText.match(/Diagnosis:?\s*([A-Za-z\s,]+)/i)
    const insuranceMatch = mockExtractedText.match(/Insurance:?\s*([A-Za-z\s&]+)/i)
    const addressMatch = mockExtractedText.match(/Address:?\s*([A-Za-z0-9\s,]+)/i)
    const zipMatch = mockExtractedText.match(/(\d{5})/i)
    const urgencyMatch = mockExtractedText.match(/Urgency:?\s*([A-Za-z]+)/i)
    const lengthMatch = mockExtractedText.match(/(?:Length of Care|Estimated):?\s*(\d+)\s*days/i)

    if (!patientNameMatch) {
      console.log("Could not extract patient name from fax")
      return null
    }

    // Determine urgency
    let urgency: "routine" | "urgent" | "stat" = "routine"
    if (urgencyMatch) {
      const urgencyText = urgencyMatch[1].toLowerCase()
      if (urgencyText.includes("urgent")) urgency = "urgent"
      if (urgencyText.includes("stat") || urgencyText.includes("emergency")) urgency = "stat"
    }

    // Extract services
    const services = []
    const servicesText = mockExtractedText.toLowerCase()
    if (servicesText.includes("skilled nursing")) services.push("skilled_nursing")
    if (servicesText.includes("physical therapy")) services.push("physical_therapy")
    if (servicesText.includes("occupational therapy")) services.push("occupational_therapy")
    if (servicesText.includes("speech therapy")) services.push("speech_therapy")
    if (servicesText.includes("diabetic")) services.push("diabetic_management")

    const referralData: ReferralData = {
      patientName: patientNameMatch[1].trim(),
      diagnosis: diagnosisMatch ? diagnosisMatch[1].trim() : "Not specified",
      insuranceProvider: insuranceMatch ? insuranceMatch[1].trim() : "Unknown",
      insuranceId: "FAX-" + Date.now(),
      referralSource: `Fax from ${faxData.from}`,
      serviceRequested: services.length > 0 ? services : ["skilled_nursing"],
      urgency,
      estimatedEpisodeLength: lengthMatch ? Number.parseInt(lengthMatch[1]) : 60,
      geographicLocation: {
        address: addressMatch ? addressMatch[1].trim() : "Not provided",
        zipCode: zipMatch ? zipMatch[1] : "77001",
        distance: Math.floor(Math.random() * 25) + 5, // Simulate distance calculation
      },
      hospitalRating: 4, // Would be looked up based on referral source
      physicianOrders:
        mockExtractedText.toLowerCase().includes("physician") || mockExtractedText.toLowerCase().includes("doctor"),
    }

    return referralData
  } catch (error) {
    console.error("Error extracting referral data from fax:", error)
    return null
  }
}

async function sendConfirmationFax(toFaxNumber: string, referralData: ReferralData, decision: any) {
  // Simulate sending confirmation fax
  console.log(`Sending confirmation fax to ${toFaxNumber}`)
  console.log(`Referral for ${referralData.patientName}: ${decision?.action}`)

  // In a real implementation, this would use Vonage API to send a confirmation fax
  await new Promise((resolve) => setTimeout(resolve, 1000))
}
