import { type NextRequest, NextResponse } from "next/server"

interface BarcodeImageResponse {
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
  detectedBarcodes?: Array<{
    format: string
    text: string
    confidence: number
  }>
}

export async function POST(request: NextRequest): Promise<NextResponse<BarcodeImageResponse>> {
  const startTime = Date.now()

  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File
    const patientId = formData.get("patientId") as string

    if (!imageFile) {
      return NextResponse.json(
        {
          success: false,
          message: "No image file provided",
          processingTime: Date.now() - startTime,
        },
        { status: 400 },
      )
    }

    console.log(`Processing barcode image: ${imageFile.name} (${imageFile.size} bytes) for patient: ${patientId}`)

    // Simulate image processing time
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock barcode detection from image
    const detectedBarcodes = await detectBarcodesFromImage(imageFile)

    if (detectedBarcodes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No barcodes detected in image. Please ensure barcode is clearly visible and try again.",
          processingTime: Date.now() - startTime,
          detectedBarcodes: [],
        },
        { status: 404 },
      )
    }

    // Use the barcode with highest confidence
    const bestBarcode = detectedBarcodes.reduce((prev, current) =>
      current.confidence > prev.confidence ? current : prev,
    )

    console.log(
      `Best barcode detected: ${bestBarcode.text} (${bestBarcode.format}, ${bestBarcode.confidence}% confidence)`,
    )

    // Look up medication data
    const medicationData = await lookupMedicationByBarcode(bestBarcode.text, bestBarcode.format)

    if (!medicationData) {
      return NextResponse.json(
        {
          success: false,
          message: "Barcode detected but medication not found in database. Please verify or enter manually.",
          processingTime: Date.now() - startTime,
          detectedBarcodes: detectedBarcodes,
        },
        { status: 404 },
      )
    }

    const result: BarcodeImageResponse = {
      success: true,
      medication: {
        ...medicationData,
        id: `IMG-BARCODE-${Date.now()}`,
        confidence: Math.min(bestBarcode.confidence, 95), // Cap at 95% for image-based scans
        scanTimestamp: new Date().toISOString(),
        scanMethod: bestBarcode.format.includes("qr") ? "qr" : "barcode",
        barcodeData: bestBarcode.text,
      },
      message: "Medication successfully identified from barcode in image",
      processingTime: Date.now() - startTime,
      detectedBarcodes: detectedBarcodes,
    }

    console.log(`Image barcode scan completed: ${medicationData.name} (${bestBarcode.confidence}% confidence)`)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Image barcode scan error:", error)

    const errorResult: BarcodeImageResponse = {
      success: false,
      message: "Failed to process image for barcode detection. Please try again or use live camera scanning.",
      processingTime: Date.now() - startTime,
    }

    return NextResponse.json(errorResult, { status: 500 })
  }
}

// Mock barcode detection from image
async function detectBarcodesFromImage(imageFile: File): Promise<
  Array<{
    format: string
    text: string
    confidence: number
  }>
> {
  // In a real implementation, this would use:
  // - Google Vision API
  // - AWS Textract
  // - ZXing library
  // - OpenCV with barcode detection

  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Mock detected barcodes based on image characteristics
  const mockBarcodes = [
    {
      format: "ean_13",
      text: "0071022223",
      confidence: 92,
    },
    {
      format: "code_128",
      text: "0093107401",
      confidence: 88,
    },
    {
      format: "upc_a",
      text: "0071015523",
      confidence: 95,
    },
    {
      format: "qr_code",
      text: '{"name":"Aspirin","dosage":"81mg","ndc":"0363-0554-01","manufacturer":"Walgreens"}',
      confidence: 97,
    },
  ]

  // Randomly return 0-2 barcodes to simulate real-world scenarios
  const numBarcodes = Math.floor(Math.random() * 3)

  if (numBarcodes === 0) {
    return []
  }

  // Return random subset of mock barcodes
  const shuffled = mockBarcodes.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, numBarcodes)
}

// Look up medication by barcode data
async function lookupMedicationByBarcode(barcodeData: string, format: string) {
  if (format === "qr_code") {
    return parseQRCodeData(barcodeData)
  } else {
    return await lookupByNDC(barcodeData)
  }
}

// Parse QR code data
function parseQRCodeData(qrData: string) {
  try {
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
    return null
  } catch (error) {
    console.error("Error parsing QR code data:", error)
    return null
  }
}

// Lookup medication by NDC
async function lookupByNDC(ndcCode: string) {
  const cleanNDC = ndcCode.replace(/[^0-9]/g, "")

  const medicationDatabase: Record<string, any> = {
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
  }

  if (medicationDatabase[cleanNDC]) {
    return medicationDatabase[cleanNDC]
  }

  // Try partial matches
  for (const [ndc, data] of Object.entries(medicationDatabase)) {
    if (ndc.includes(cleanNDC.substring(0, 8)) || cleanNDC.includes(ndc.substring(0, 8))) {
      return data
    }
  }

  return null
}
