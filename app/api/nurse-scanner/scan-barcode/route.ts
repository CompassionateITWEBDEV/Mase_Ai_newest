import { type NextRequest, NextResponse } from "next/server"

interface BarcodeRequest {
  barcodeData: string
  format: string
  patientId: string
}

interface BarcodeResponse {
  success: boolean
  medication?: {
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
    scanMethod: "barcode" | "qr"
    barcodeData: string
  }
  message: string
  processingTime: number
}

export async function POST(request: NextRequest): Promise<NextResponse<BarcodeResponse>> {
  const startTime = Date.now()

  try {
    const body: BarcodeRequest = await request.json()
    const { barcodeData, format, patientId } = body

    if (!barcodeData) {
      return NextResponse.json(
        {
          success: false,
          message: "No barcode data provided",
          processingTime: Date.now() - startTime,
        },
        { status: 400 },
      )
    }

    console.log(`Processing barcode: ${barcodeData} (${format}) for patient: ${patientId}`)

    // Simulate barcode processing time
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Parse barcode data based on format
    let medicationData = null

    if (format === "qr_code") {
      // QR codes might contain structured data
      medicationData = parseQRCodeData(barcodeData)
    } else {
      // Standard barcodes (UPC, EAN, etc.) - lookup by NDC
      medicationData = await lookupByNDC(barcodeData)
    }

    if (!medicationData) {
      return NextResponse.json(
        {
          success: false,
          message: "Medication not found in database. Please verify barcode or enter manually.",
          processingTime: Date.now() - startTime,
        },
        { status: 404 },
      )
    }

    const result: BarcodeResponse = {
      success: true,
      medication: {
        ...medicationData,
        id: `BARCODE-${Date.now()}`,
        confidence: 98, // Barcode scans are highly accurate
        scanTimestamp: new Date().toISOString(),
        scanMethod: format === "qr_code" ? "qr" : "barcode",
        barcodeData: barcodeData,
      },
      message: "Medication successfully identified from barcode",
      processingTime: Date.now() - startTime,
    }

    console.log(`Barcode scan completed: ${medicationData.name} (98% confidence)`)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Barcode scan error:", error)

    const errorResult: BarcodeResponse = {
      success: false,
      message: "Failed to process barcode. Please try again or use OCR scanning.",
      processingTime: Date.now() - startTime,
    }

    return NextResponse.json(errorResult, { status: 500 })
  }
}

// Parse QR code data (often contains structured medication information)
function parseQRCodeData(qrData: string) {
  try {
    // QR codes might contain JSON data or structured text
    if (qrData.startsWith("{")) {
      const parsed = JSON.parse(qrData)
      return {
        name: parsed.name || "Unknown Medication",
        genericName: parsed.generic,
        dosage: parsed.dosage || "Unknown",
        strength: parsed.strength || "Unknown",
        ndc: parsed.ndc || "QR-CODE",
        manufacturer: parsed.manufacturer || "Unknown",
        lotNumber: parsed.lot,
        expirationDate: parsed.expiry,
        instructions: parsed.instructions || "Follow prescriber instructions",
        sideEffects: parsed.sideEffects || [],
        interactions: parsed.interactions || [],
        contraindications: parsed.contraindications || [],
        category: parsed.category || "Unknown",
        schedule: parsed.schedule,
      }
    }

    // Handle structured text format (e.g., "NAME:Aspirin|DOSE:81mg|NDC:12345")
    const parts = qrData.split("|")
    const data: any = {}

    parts.forEach((part) => {
      const [key, value] = part.split(":")
      if (key && value) {
        data[key.toLowerCase()] = value
      }
    })

    return {
      name: data.name || data.medication || "Unknown Medication",
      genericName: data.generic,
      dosage: data.dose || data.dosage || "Unknown",
      strength: data.strength || "Unknown",
      ndc: data.ndc || "QR-CODE",
      manufacturer: data.manufacturer || data.mfg || "Unknown",
      lotNumber: data.lot || data.batch,
      expirationDate: data.exp || data.expiry,
      instructions: data.instructions || "Follow prescriber instructions",
      sideEffects: [],
      interactions: [],
      contraindications: [],
      category: data.category || "Unknown",
      schedule: data.schedule,
    }
  } catch (error) {
    console.error("Error parsing QR code data:", error)
    return null
  }
}

// Lookup medication by NDC (National Drug Code)
async function lookupByNDC(ndcCode: string) {
  // Clean and format NDC code
  const cleanNDC = ndcCode.replace(/[^0-9]/g, "")

  // Mock medication database with NDC codes
  const medicationDatabase: Record<string, any> = {
    // Lisinopril 10mg
    "0071022223": {
      name: "Lisinopril",
      genericName: "Lisinopril",
      dosage: "10mg",
      strength: "10mg per tablet",
      ndc: "0071-0222-23",
      manufacturer: "Pfizer Inc.",
      instructions: "Take once daily by mouth. May be taken with or without food.",
      sideEffects: ["Dizziness", "Dry cough", "Headache", "Fatigue", "Nausea"],
      interactions: ["Potassium supplements", "NSAIDs", "Lithium", "Digoxin"],
      contraindications: ["History of angioedema with ACE inhibitors", "Pregnancy", "Bilateral renal artery stenosis"],
      category: "ACE Inhibitor",
      schedule: "N/A",
    },
    // Metformin 500mg
    "0093107401": {
      name: "Metformin",
      genericName: "Metformin Hydrochloride",
      dosage: "500mg",
      strength: "500mg per tablet",
      ndc: "0093-1074-01",
      manufacturer: "Teva Pharmaceuticals",
      instructions: "Take twice daily with meals to reduce stomach upset.",
      sideEffects: ["Nausea", "Diarrhea", "Stomach upset", "Metallic taste", "Vitamin B12 deficiency"],
      interactions: ["Alcohol", "Contrast dye", "Cimetidine", "Furosemide"],
      contraindications: [
        "Severe kidney disease (eGFR < 30)",
        "Metabolic acidosis",
        "Diabetic ketoacidosis",
        "Severe liver disease",
      ],
      category: "Biguanide Antidiabetic",
      schedule: "N/A",
    },
    // Atorvastatin 20mg
    "0071015523": {
      name: "Atorvastatin",
      genericName: "Atorvastatin Calcium",
      dosage: "20mg",
      strength: "20mg per tablet",
      ndc: "0071-0155-23",
      manufacturer: "Pfizer Inc.",
      instructions: "Take once daily at bedtime. Avoid grapefruit juice.",
      sideEffects: ["Muscle pain", "Liver problems", "Memory problems", "Headache", "Nausea"],
      interactions: ["Warfarin", "Digoxin", "Cyclosporine", "Gemfibrozil", "Grapefruit juice"],
      contraindications: [
        "Active liver disease",
        "Pregnancy and breastfeeding",
        "Unexplained persistent elevations in liver enzymes",
      ],
      category: "HMG-CoA Reductase Inhibitor (Statin)",
      schedule: "N/A",
    },
    // Aspirin 81mg
    "0363055401": {
      name: "Aspirin",
      genericName: "Acetylsalicylic Acid",
      dosage: "81mg",
      strength: "81mg per tablet",
      ndc: "0363-0554-01",
      manufacturer: "Walgreens Co.",
      instructions: "Take once daily with food to reduce stomach irritation.",
      sideEffects: ["Stomach upset", "Heartburn", "Drowsiness", "Mild headache"],
      interactions: ["Warfarin", "Methotrexate", "ACE inhibitors", "Diuretics"],
      contraindications: ["Active bleeding", "Severe kidney disease", "Children under 16 with viral infections"],
      category: "Antiplatelet Agent",
      schedule: "N/A",
    },
    // Omeprazole 20mg
    "0093515601": {
      name: "Omeprazole",
      genericName: "Omeprazole",
      dosage: "20mg",
      strength: "20mg per capsule",
      ndc: "0093-5156-01",
      manufacturer: "Teva Pharmaceuticals",
      instructions: "Take once daily before breakfast. Swallow whole, do not crush.",
      sideEffects: ["Headache", "Nausea", "Diarrhea", "Stomach pain", "Gas"],
      interactions: ["Clopidogrel", "Warfarin", "Digoxin", "Iron supplements"],
      contraindications: ["Hypersensitivity to proton pump inhibitors", "Concurrent use with rilpivirine"],
      category: "Proton Pump Inhibitor",
      schedule: "N/A",
    },
  }

  // Try exact match first
  if (medicationDatabase[cleanNDC]) {
    return medicationDatabase[cleanNDC]
  }

  // Try partial matches (sometimes barcodes have check digits or formatting differences)
  for (const [ndc, data] of Object.entries(medicationDatabase)) {
    if (ndc.includes(cleanNDC.substring(0, 8)) || cleanNDC.includes(ndc.substring(0, 8))) {
      return data
    }
  }

  // If no match found, return null
  return null
}

// Handle GET requests for NDC lookup
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const ndc = searchParams.get("ndc")

    if (!ndc) {
      return NextResponse.json({ success: false, message: "NDC code is required" }, { status: 400 })
    }

    console.log(`Looking up NDC: ${ndc}`)

    const medicationData = await lookupByNDC(ndc)

    if (medicationData) {
      return NextResponse.json({
        success: true,
        medication: {
          ...medicationData,
          confidence: 98,
          source: "ndc_lookup",
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "NDC not found in database. Please verify code or enter manually.",
      })
    }
  } catch (error) {
    console.error("NDC lookup error:", error)
    return NextResponse.json({ success: false, message: "NDC lookup failed" }, { status: 500 })
  }
}
