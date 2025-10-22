import { type NextRequest, NextResponse } from "next/server"

interface MedicationSheetRequest {
  patient: {
    id: string
    name: string
    dob: string
    mrn: string
    allergies: string[]
    currentMedications: string[]
    conditions: string[]
    axxessId: string
  }
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
}

interface MedicationSheetResponse {
  success: boolean
  message: string
  downloadUrl?: string
  sheetId?: string
  processingTime: number
}

export async function POST(request: NextRequest): Promise<NextResponse<MedicationSheetResponse>> {
  const startTime = Date.now()

  try {
    const body: MedicationSheetRequest = await request.json()
    const { patient, medication, nurseId } = body

    if (!patient || !medication || !nurseId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: patient, medication, or nurseId",
          processingTime: Date.now() - startTime,
        },
        { status: 400 },
      )
    }

    console.log(`Generating medication sheet for patient: ${patient.name}`)
    console.log(`Medication: ${medication.name} (${medication.dosage})`)

    // Simulate PDF generation time
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Generate medication administration record (MAR) sheet
    const sheetData = {
      sheetId: `MAR-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      patient: {
        name: patient.name,
        dob: patient.dob,
        mrn: patient.mrn,
        axxessId: patient.axxessId,
        allergies: patient.allergies,
        conditions: patient.conditions,
      },
      medication: {
        name: medication.name,
        genericName: medication.genericName,
        dosage: medication.dosage,
        strength: medication.strength,
        ndc: medication.ndc,
        manufacturer: medication.manufacturer,
        instructions: medication.instructions,
        route: extractRoute(medication.instructions),
        frequency: extractFrequency(medication.instructions),
        category: medication.category,
        lotNumber: medication.lotNumber,
        expirationDate: medication.expirationDate,
        scanMethod: medication.scanMethod,
        scanConfidence: medication.confidence,
        scanTimestamp: medication.scanTimestamp,
      },
      nurseInfo: {
        nurseId: nurseId,
        nurseName: "Sarah Johnson, RN", // In real app, lookup from nurseId
        licenseNumber: "RN123456",
        generatedBy: nurseId,
      },
      administrationSchedule: generateAdministrationSchedule(medication.instructions),
      safetyChecks: generateSafetyChecklist(medication, patient),
      signatures: {
        nurseSignature: null,
        witnessSignature: null,
        patientSignature: null,
      },
    }

    // In a real application, this would generate an actual PDF
    // For now, we'll create a mock download URL
    const mockDownloadUrl = `/api/nurse-scanner/download-sheet/${sheetData.sheetId}`

    // Store the sheet data (in real app, this would go to database)
    await storeMedicationSheet(sheetData)

    console.log(`Medication sheet generated: ${sheetData.sheetId}`)

    const response: MedicationSheetResponse = {
      success: true,
      message: "Medication administration sheet generated successfully",
      downloadUrl: mockDownloadUrl,
      sheetId: sheetData.sheetId,
      processingTime: Date.now() - startTime,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Medication sheet generation error:", error)

    const errorResponse: MedicationSheetResponse = {
      success: false,
      message: "Failed to generate medication sheet. Please try again.",
      processingTime: Date.now() - startTime,
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// Helper function to extract route from instructions
function extractRoute(instructions: string): string {
  const routes = {
    "by mouth": "PO",
    orally: "PO",
    "under the tongue": "SL",
    injection: "INJ",
    topically: "TOP",
    inhale: "INH",
    rectally: "PR",
  }

  const lowerInstructions = instructions.toLowerCase()

  for (const [phrase, route] of Object.entries(routes)) {
    if (lowerInstructions.includes(phrase)) {
      return route
    }
  }

  return "PO" // Default to oral
}

// Helper function to extract frequency from instructions
function extractFrequency(instructions: string): string {
  const frequencies = {
    "once daily": "Daily",
    "twice daily": "BID",
    "three times daily": "TID",
    "four times daily": "QID",
    "every 4 hours": "Q4H",
    "every 6 hours": "Q6H",
    "every 8 hours": "Q8H",
    "every 12 hours": "Q12H",
    "as needed": "PRN",
    weekly: "Weekly",
    monthly: "Monthly",
  }

  const lowerInstructions = instructions.toLowerCase()

  for (const [phrase, frequency] of Object.entries(frequencies)) {
    if (lowerInstructions.includes(phrase)) {
      return frequency
    }
  }

  return "Daily" // Default frequency
}

// Generate administration schedule for the next 7 days
function generateAdministrationSchedule(instructions: string): Array<{
  date: string
  times: string[]
  administered: boolean[]
  notes: string[]
}> {
  const schedule = []
  const frequency = extractFrequency(instructions)

  // Generate times based on frequency
  let adminTimes: string[] = []
  switch (frequency) {
    case "Daily":
      adminTimes = ["09:00"]
      break
    case "BID":
      adminTimes = ["09:00", "21:00"]
      break
    case "TID":
      adminTimes = ["09:00", "13:00", "21:00"]
      break
    case "QID":
      adminTimes = ["09:00", "13:00", "17:00", "21:00"]
      break
    case "Q4H":
      adminTimes = ["06:00", "10:00", "14:00", "18:00", "22:00", "02:00"]
      break
    case "Q6H":
      adminTimes = ["06:00", "12:00", "18:00", "00:00"]
      break
    case "Q8H":
      adminTimes = ["06:00", "14:00", "22:00"]
      break
    case "Q12H":
      adminTimes = ["09:00", "21:00"]
      break
    case "PRN":
      adminTimes = ["As needed"]
      break
    default:
      adminTimes = ["09:00"]
  }

  // Generate schedule for next 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)

    schedule.push({
      date: date.toISOString().split("T")[0],
      times: adminTimes,
      administered: new Array(adminTimes.length).fill(false),
      notes: new Array(adminTimes.length).fill(""),
    })
  }

  return schedule
}

// Generate safety checklist based on medication and patient
function generateSafetyChecklist(
  medication: any,
  patient: any,
): Array<{
  check: string
  required: boolean
  completed: boolean
  notes: string
}> {
  const checks = [
    {
      check: "Verify patient identity using two identifiers",
      required: true,
      completed: false,
      notes: "",
    },
    {
      check: "Check medication name against order",
      required: true,
      completed: false,
      notes: "",
    },
    {
      check: "Verify dosage and strength",
      required: true,
      completed: false,
      notes: "",
    },
    {
      check: "Check expiration date",
      required: true,
      completed: false,
      notes: "",
    },
    {
      check: "Review patient allergies",
      required: true,
      completed: false,
      notes: `Patient allergies: ${patient.allergies.join(", ") || "None documented"}`,
    },
    {
      check: "Assess for drug interactions",
      required: true,
      completed: false,
      notes: `Current medications: ${patient.currentMedications.join(", ") || "None documented"}`,
    },
  ]

  // Add medication-specific checks
  if (medication.category.toLowerCase().includes("anticoagulant")) {
    checks.push({
      check: "Check recent INR/PT values",
      required: true,
      completed: false,
      notes: "Required for anticoagulant therapy",
    })
  }

  if (medication.category.toLowerCase().includes("diabetes") || medication.name.toLowerCase().includes("insulin")) {
    checks.push({
      check: "Check blood glucose level",
      required: true,
      completed: false,
      notes: "Required before diabetes medication administration",
    })
  }

  if (medication.category.toLowerCase().includes("cardiac") || medication.name.toLowerCase().includes("digoxin")) {
    checks.push({
      check: "Check heart rate and rhythm",
      required: true,
      completed: false,
      notes: "Required for cardiac medications",
    })
  }

  return checks
}

// Store medication sheet data
async function storeMedicationSheet(sheetData: any): Promise<void> {
  try {
    // In a real application, this would store in database
    console.log("Storing medication sheet:", sheetData.sheetId)

    // Could also integrate with document management system
    // await documentService.store(sheetData)
  } catch (error) {
    console.error("Failed to store medication sheet:", error)
    throw error
  }
}

// Handle GET requests for sheet templates
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const template = searchParams.get("template")

    const templates = {
      mar: {
        name: "Medication Administration Record (MAR)",
        description: "Standard MAR template for medication tracking",
        fields: ["Patient Info", "Medication Details", "Administration Schedule", "Nurse Signatures"],
      },
      prn: {
        name: "PRN Medication Log",
        description: "Template for as-needed medication administration",
        fields: ["Patient Info", "PRN Medication", "Administration Times", "Effectiveness Assessment"],
      },
      controlled: {
        name: "Controlled Substance Log",
        description: "Special template for controlled substance tracking",
        fields: ["Patient Info", "Controlled Substance Details", "Witness Signatures", "DEA Compliance"],
      },
      error: {
        name: "Medication Error Report",
        description: "Template for documenting medication errors",
        fields: ["Incident Details", "Error Type", "Patient Impact", "Corrective Actions"],
      },
    }

    if (template && templates[template as keyof typeof templates]) {
      return NextResponse.json({
        success: true,
        template: templates[template as keyof typeof templates],
      })
    }

    return NextResponse.json({
      success: true,
      templates: templates,
    })
  } catch (error) {
    console.error("Template lookup error:", error)
    return NextResponse.json({ success: false, message: "Failed to retrieve templates" }, { status: 500 })
  }
}
