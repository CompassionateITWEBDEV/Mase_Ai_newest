import { type NextRequest, NextResponse } from "next/server"

interface AxxessMedicationRequest {
  patientId: string
  medication: {
    id: string
    name: string
    genericName?: string
    dosage: string
    strength: string
    ndc: string
    manufacturer: string
    lotNumber?: string
    expirationDate?: string
    instructions: string
    sideEffects: string[]
    interactions: string[]
    contraindications: string[]
    category: string
    schedule?: string
    confidence: number
    scanTimestamp: string
    scanMethod: "ocr" | "barcode" | "qr" | "manual"
    barcodeData?: string
  }
  nurseId: string
  nurseName: string
}

interface AxxessResponse {
  success: boolean
  message: string
  axxessOrderId?: string
  medicationId?: string
  warnings?: string[]
  processingTime: number
}

export async function POST(request: NextRequest): Promise<NextResponse<AxxessResponse>> {
  const startTime = Date.now()

  try {
    const body: AxxessMedicationRequest = await request.json()
    const { patientId, medication, nurseId, nurseName } = body

    if (!patientId || !medication || !nurseId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: patientId, medication, or nurseId",
          processingTime: Date.now() - startTime,
        },
        { status: 400 },
      )
    }

    console.log(`Adding medication to Axxess for patient: ${patientId}`)
    console.log(`Medication: ${medication.name} (${medication.dosage})`)
    console.log(`Nurse: ${nurseName} (${nurseId})`)
    console.log(`Scan method: ${medication.scanMethod}`)

    // Simulate Axxess API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock validation checks
    const warnings: string[] = []

    // Check for high-risk medications
    const highRiskMeds = ["warfarin", "insulin", "digoxin", "lithium"]
    if (highRiskMeds.some((med) => medication.name.toLowerCase().includes(med))) {
      warnings.push("High-risk medication - requires additional monitoring")
    }

    // Check scan confidence
    if (medication.confidence < 90 && medication.scanMethod !== "manual") {
      warnings.push("Low scan confidence - please verify medication details")
    }

    // Check for controlled substances
    if (medication.schedule && medication.schedule !== "N/A") {
      warnings.push(`Controlled substance (Schedule ${medication.schedule}) - DEA reporting required`)
    }

    // Prepare Axxess medication order
    const axxessOrder = {
      patientId: patientId,
      medicationName: medication.name,
      genericName: medication.genericName,
      dosage: medication.dosage,
      strength: medication.strength,
      ndc: medication.ndc,
      manufacturer: medication.manufacturer,
      instructions: medication.instructions,
      route: extractRoute(medication.instructions),
      frequency: extractFrequency(medication.instructions),
      startDate: new Date().toISOString().split("T")[0],
      prescriberId: "PROVIDER-001", // In real app, this would be determined by business logic
      orderedBy: nurseName,
      orderedById: nurseId,
      orderDate: new Date().toISOString(),
      scanData: {
        method: medication.scanMethod,
        confidence: medication.confidence,
        timestamp: medication.scanTimestamp,
        barcodeData: medication.barcodeData,
      },
      lotNumber: medication.lotNumber,
      expirationDate: medication.expirationDate,
      category: medication.category,
      sideEffects: medication.sideEffects,
      interactions: medication.interactions,
      contraindications: medication.contraindications,
    }

    // Mock Axxess API response
    const mockAxxessResponse = {
      success: true,
      orderId: `AX-ORD-${Date.now()}`,
      medicationId: `AX-MED-${Date.now()}`,
      status: "pending_physician_review",
      message: "Medication order created successfully",
    }

    console.log(`Axxess order created: ${mockAxxessResponse.orderId}`)

    // Log the medication addition for audit trail
    await logMedicationAddition({
      axxessOrderId: mockAxxessResponse.orderId,
      patientId,
      medication,
      nurseId,
      nurseName,
      timestamp: new Date().toISOString(),
    })

    const response: AxxessResponse = {
      success: true,
      message: "Medication successfully added to patient chart in Axxess",
      axxessOrderId: mockAxxessResponse.orderId,
      medicationId: mockAxxessResponse.medicationId,
      warnings: warnings.length > 0 ? warnings : undefined,
      processingTime: Date.now() - startTime,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Axxess medication addition error:", error)

    const errorResponse: AxxessResponse = {
      success: false,
      message: "Failed to add medication to Axxess. Please try again or contact support.",
      processingTime: Date.now() - startTime,
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// Helper function to extract route from instructions
function extractRoute(instructions: string): string {
  const routes = {
    "by mouth": "oral",
    orally: "oral",
    "under the tongue": "sublingual",
    injection: "injection",
    topically: "topical",
    inhale: "inhalation",
    rectally: "rectal",
  }

  const lowerInstructions = instructions.toLowerCase()

  for (const [phrase, route] of Object.entries(routes)) {
    if (lowerInstructions.includes(phrase)) {
      return route
    }
  }

  return "oral" // Default to oral
}

// Helper function to extract frequency from instructions
function extractFrequency(instructions: string): string {
  const frequencies = {
    "once daily": "daily",
    "twice daily": "bid",
    "three times daily": "tid",
    "four times daily": "qid",
    "every 4 hours": "q4h",
    "every 6 hours": "q6h",
    "every 8 hours": "q8h",
    "every 12 hours": "q12h",
    "as needed": "prn",
    weekly: "weekly",
    monthly: "monthly",
  }

  const lowerInstructions = instructions.toLowerCase()

  for (const [phrase, frequency] of Object.entries(frequencies)) {
    if (lowerInstructions.includes(phrase)) {
      return frequency
    }
  }

  return "daily" // Default frequency
}

// Helper function to log medication addition for audit trail
async function logMedicationAddition(logData: any): Promise<void> {
  try {
    // In a real application, this would write to a database or audit log
    console.log("Medication addition audit log:", JSON.stringify(logData, null, 2))

    // Could also send to external audit system
    // await fetch('/api/audit/medication-addition', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logData)
    // })
  } catch (error) {
    console.error("Failed to log medication addition:", error)
    // Don't throw error as this shouldn't block the main operation
  }
}

// Handle GET requests for medication status
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 })
    }

    // Mock order status lookup
    const mockOrderStatus = {
      orderId: orderId,
      status: "approved",
      approvedBy: "Dr. Smith",
      approvedAt: new Date().toISOString(),
      notes: "Medication order approved and ready for administration",
    }

    return NextResponse.json({
      success: true,
      order: mockOrderStatus,
    })
  } catch (error) {
    console.error("Order status lookup error:", error)
    return NextResponse.json({ success: false, message: "Failed to retrieve order status" }, { status: 500 })
  }
}
