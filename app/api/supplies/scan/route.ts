import { type NextRequest, NextResponse } from "next/server"

interface SupplyScanRequest {
  barcodeData: string
  format: string
  patientId: string
}

interface ScanRequest {
  barcode: string
}

interface WoundCareSupply {
  id: string
  name: string
  category: string
  manufacturer: string
  sku: string
  barcode: string
  unitCost: number
  unitSize: string
  description: string
  indications: string[]
  contraindications: string[]
  expirationDate?: string
  lotNumber?: string
  sterile: boolean
  singleUse: boolean
  confidence: number
  scanTimestamp: string
  scanMethod: "barcode" | "qr" | "manual"
}

interface ScanResponse {
  success: boolean
  supply?: any
  message?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<ScanResponse>> {
  const startTime = Date.now()

  try {
    const body: SupplyScanRequest | ScanRequest = await request.json()
    const { barcodeData, format, patientId, barcode } = body

    const barcodeToUse = barcodeData || barcode

    if (!barcodeToUse) {
      return NextResponse.json({ success: false, message: "Barcode is required" }, { status: 400 })
    }

    console.log(
      `Processing supply barcode: ${barcodeToUse} (${format || "barcode"}) for patient: ${patientId || "N/A"}`,
    )

    // Simulate barcode processing time
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Mock supply database - in production, this would query your actual database
    const supplyDatabase: Record<string, any> = {
      "123456789012": {
        id: "SUP001",
        barcode: "123456789012",
        name: "Hydrocolloid Dressing 4x4",
        category: "Dressings",
        manufacturer: "ConvaTec",
        unitCost: 12.5,
        description: "Advanced wound dressing for moderate exudate",
        indications: "Pressure ulcers, diabetic ulcers, minor burns",
        contraindications: "Infected wounds, arterial ulcers",
        expirationDate: "2025-06-15",
        lotNumber: "LOT2024A123",
        stockLevel: 45,
        reorderPoint: 10,
        lastRestocked: "2024-01-15",
      },
      "234567890123": {
        id: "SUP002",
        barcode: "234567890123",
        name: "Silver Antimicrobial Foam 6x6",
        category: "Antimicrobial",
        manufacturer: "Molnlycke",
        unitCost: 28.75,
        description: "Silver-infused foam dressing for infected wounds",
        indications: "Infected wounds, high bioburden wounds",
        contraindications: "Silver sensitivity",
        expirationDate: "2025-08-20",
        lotNumber: "LOT2024B456",
        stockLevel: 23,
        reorderPoint: 5,
        lastRestocked: "2024-01-10",
      },
      "345678901234": {
        id: "SUP003",
        barcode: "345678901234",
        name: "Calcium Alginate Rope 12in",
        category: "Hemostatic",
        manufacturer: "Hollister",
        unitCost: 15.25,
        description: "Calcium alginate for deep wound packing",
        indications: "Deep wounds, tunneling, heavy exudate",
        contraindications: "Dry wounds, third-degree burns",
        expirationDate: "2025-04-10",
        lotNumber: "LOT2024C789",
        stockLevel: 67,
        reorderPoint: 15,
        lastRestocked: "2024-01-18",
      },
      "456789012345": {
        id: "SUP004",
        barcode: "456789012345",
        name: "Transparent Film Dressing 6x8",
        category: "Protective",
        manufacturer: "3M Tegaderm",
        unitCost: 8.9,
        description: "Waterproof transparent film dressing",
        indications: "IV sites, minor wounds, protection",
        contraindications: "Heavy exudate wounds",
        expirationDate: "2025-12-31",
        lotNumber: "LOT2024D012",
        stockLevel: 89,
        reorderPoint: 20,
        lastRestocked: "2024-01-20",
      },
      "567890123456": {
        id: "SUP005",
        barcode: "567890123456",
        name: "Saline Wound Cleanser 8oz",
        category: "Cleansers",
        manufacturer: "Medline",
        unitCost: 6.75,
        description: "Sterile saline solution for wound irrigation",
        indications: "Wound cleansing, irrigation",
        contraindications: "None known",
        expirationDate: "2026-01-15",
        lotNumber: "LOT2024E345",
        stockLevel: 156,
        reorderPoint: 30,
        lastRestocked: "2024-01-19",
      },
      "678901234567": {
        id: "SUP006",
        barcode: "678901234567",
        name: "Gauze Pads 4x4 Sterile (10pk)",
        category: "Gauze",
        manufacturer: "Johnson & Johnson",
        unitCost: 4.25,
        description: "Sterile gauze pads for wound coverage",
        indications: "Primary or secondary dressing",
        contraindications: "None",
        expirationDate: "2027-03-20",
        lotNumber: "LOT2024F678",
        stockLevel: 234,
        reorderPoint: 50,
        lastRestocked: "2024-01-17",
      },
      "789012345678": {
        id: "SUP007",
        barcode: "789012345678",
        name: "Medical Tape 1in x 10yd",
        category: "Tape",
        manufacturer: "3M Micropore",
        unitCost: 3.5,
        description: "Hypoallergenic medical tape",
        indications: "Securing dressings",
        contraindications: "Tape sensitivity",
        expirationDate: "2026-09-30",
        lotNumber: "LOT2024G901",
        stockLevel: 178,
        reorderPoint: 40,
        lastRestocked: "2024-01-16",
      },
      "890123456789": {
        id: "SUP008",
        barcode: "890123456789",
        name: "Wound Gel with Lidocaine 1oz",
        category: "Topical",
        manufacturer: "Medihoney",
        unitCost: 22.4,
        description: "Antimicrobial gel with pain relief",
        indications: "Painful wounds, burns",
        contraindications: "Lidocaine allergy",
        expirationDate: "2025-07-25",
        lotNumber: "LOT2024H234",
        stockLevel: 34,
        reorderPoint: 8,
        lastRestocked: "2024-01-12",
      },
      "901234567890": {
        id: "SUP009",
        barcode: "901234567890",
        name: "Compression Bandage 4in",
        category: "Compression",
        manufacturer: "Covidien",
        unitCost: 11.8,
        description: "Elastic compression bandage",
        indications: "Venous ulcers, edema control",
        contraindications: "Arterial insufficiency",
        expirationDate: "2026-11-10",
        lotNumber: "LOT2024I567",
        stockLevel: 78,
        reorderPoint: 18,
        lastRestocked: "2024-01-14",
      },
      "012345678901": {
        id: "SUP010",
        barcode: "012345678901",
        name: "Collagen Matrix Dressing 2x2",
        category: "Advanced",
        manufacturer: "Integra",
        unitCost: 45.6,
        description: "Collagen-based wound matrix",
        indications: "Chronic wounds, diabetic ulcers",
        contraindications: "Sensitivity to bovine collagen",
        expirationDate: "2025-05-18",
        lotNumber: "LOT2024J890",
        stockLevel: 12,
        reorderPoint: 3,
        lastRestocked: "2024-01-08",
      },
    }

    // Look up supply by barcode
    const supply = supplyDatabase[barcodeToUse]

    if (!supply) {
      return NextResponse.json({
        success: false,
        message: "Supply not found in database. Please verify barcode or add manually.",
        processingTime: Date.now() - startTime,
      })
    }

    // Check if supply is expired
    const expirationDate = new Date(supply.expirationDate)
    const today = new Date()
    const isExpired = expirationDate < today
    const isExpiringSoon = (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 30

    // Check stock levels
    const isLowStock = supply.stockLevel <= supply.reorderPoint

    // Add alerts to supply data
    const alerts = []
    if (isExpired) {
      alerts.push({ type: "error", message: "This supply has expired and should not be used" })
    } else if (isExpiringSoon) {
      alerts.push({
        type: "warning",
        message: `This supply expires in ${Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days`,
      })
    }

    if (isLowStock) {
      alerts.push({
        type: "info",
        message: `Low stock: ${supply.stockLevel} remaining (reorder at ${supply.reorderPoint})`,
      })
    }

    const response: ScanResponse = {
      success: true,
      supply: {
        ...supply,
        alerts,
        isExpired,
        isExpiringSoon,
        isLowStock,
        scanTimestamp: new Date().toISOString(),
        scanMethod: format || "barcode",
      },
    }

    // Log the scan for audit purposes
    console.log(`Supply scanned: ${supply.name} (${barcodeToUse}) at ${new Date().toISOString()}`)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error processing barcode scan:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error while processing scan" },
      { status: 500 },
    )
  }
}

// Handle GET requests for supply lookup
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const lowStock = searchParams.get("lowStock")
    const expiring = searchParams.get("expiring")

    // Mock supply inventory data
    const allSupplies = [
      {
        id: "SUP001",
        barcode: "123456789012",
        name: "Hydrocolloid Dressing 4x4",
        category: "Dressings",
        manufacturer: "ConvaTec",
        unitCost: 12.5,
        stockLevel: 45,
        reorderPoint: 10,
        expirationDate: "2025-06-15",
        lastUsed: "2024-01-20",
        usageCount: 23,
      },
      {
        id: "SUP002",
        barcode: "234567890123",
        name: "Silver Antimicrobial Foam 6x6",
        category: "Antimicrobial",
        manufacturer: "Molnlycke",
        unitCost: 28.75,
        stockLevel: 23,
        reorderPoint: 5,
        expirationDate: "2025-08-20",
        lastUsed: "2024-01-19",
        usageCount: 15,
      },
      {
        id: "SUP003",
        barcode: "345678901234",
        name: "Calcium Alginate Rope 12in",
        category: "Hemostatic",
        manufacturer: "Hollister",
        unitCost: 15.25,
        stockLevel: 67,
        reorderPoint: 15,
        expirationDate: "2025-04-10",
        lastUsed: "2024-01-18",
        usageCount: 8,
      },
      // Add more supplies as needed
    ]

    let filteredSupplies = allSupplies

    // Apply filters
    if (category) {
      filteredSupplies = filteredSupplies.filter((supply) => supply.category.toLowerCase() === category.toLowerCase())
    }

    if (lowStock === "true") {
      filteredSupplies = filteredSupplies.filter((supply) => supply.stockLevel <= supply.reorderPoint)
    }

    if (expiring === "true") {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      filteredSupplies = filteredSupplies.filter((supply) => new Date(supply.expirationDate) <= thirtyDaysFromNow)
    }

    // Calculate summary statistics
    const totalValue = filteredSupplies.reduce((sum, supply) => sum + supply.unitCost * supply.stockLevel, 0)

    const lowStockCount = allSupplies.filter((supply) => supply.stockLevel <= supply.reorderPoint).length

    const expiringCount = allSupplies.filter((supply) => {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      return new Date(supply.expirationDate) <= thirtyDaysFromNow
    }).length

    return NextResponse.json({
      success: true,
      supplies: filteredSupplies,
      summary: {
        totalItems: allSupplies.length,
        filteredItems: filteredSupplies.length,
        totalValue: totalValue.toFixed(2),
        lowStockCount,
        expiringCount,
        categories: [...new Set(allSupplies.map((s) => s.category))],
      },
    })
  } catch (error) {
    console.error("Error fetching supply inventory:", error)
    return NextResponse.json({ success: false, message: "Error fetching supply inventory" }, { status: 500 })
  }
}

// Comprehensive wound care supply database
async function lookupSupplyByBarcode(barcodeData: string, format: string) {
  const cleanBarcode = barcodeData.replace(/[^0-9]/g, "")

  // Mock supply database with barcodes
  const supplyDatabase: Record<string, any> = {
    // Hydrocolloid Dressings
    "123456789012": {
      name: "Hydrocolloid Dressing 4x4",
      category: "Dressing",
      manufacturer: "ConvaTec",
      sku: "WC-HD-001",
      barcode: "123456789012",
      unitCost: 12.5,
      unitSize: "4x4 inches",
      description: "Advanced hydrocolloid dressing for moderate to heavy exuding wounds",
      indications: ["Pressure ulcers", "Diabetic foot ulcers", "Minor burns", "Surgical wounds"],
      contraindications: ["Infected wounds", "Third-degree burns", "Arterial ulcers"],
      expirationDate: "2025-12-31",
      lotNumber: "LOT123456",
      sterile: true,
      singleUse: true,
    },

    // Foam Dressings
    "234567890123": {
      name: "Foam Dressing with Border 6x6",
      category: "Dressing",
      manufacturer: "3M",
      sku: "WC-FD-002",
      barcode: "234567890123",
      unitCost: 18.75,
      unitSize: "6x6 inches",
      description: "Highly absorbent foam dressing with adhesive border for secure fixation",
      indications: ["Heavy exuding wounds", "Pressure ulcers", "Surgical wounds", "Traumatic wounds"],
      contraindications: ["Dry wounds", "Eschar-covered wounds", "Third-degree burns"],
      expirationDate: "2025-10-15",
      lotNumber: "LOT234567",
      sterile: true,
      singleUse: true,
    },

    // Antiseptic Solutions
    "345678901234": {
      name: "Antiseptic Solution 16oz",
      category: "Antiseptic",
      manufacturer: "Medline",
      sku: "WC-AS-003",
      barcode: "345678901234",
      unitCost: 8.25,
      unitSize: "16 fl oz",
      description: "Broad-spectrum antiseptic solution for wound cleansing and infection prevention",
      indications: ["Wound cleansing", "Pre-operative skin prep", "General antisepsis"],
      contraindications: ["Hypersensitivity to ingredients", "Deep puncture wounds"],
      expirationDate: "2025-08-20",
      lotNumber: "LOT345678",
      sterile: false,
      singleUse: false,
    },

    // Gauze Pads
    "456789012345": {
      name: "Sterile Gauze Pads 4x4 (10-pack)",
      category: "Gauze",
      manufacturer: "Johnson & Johnson",
      sku: "WC-GP-004",
      barcode: "456789012345",
      unitCost: 6.5,
      unitSize: "4x4 inches (10 pack)",
      description: "Sterile cotton gauze pads for wound dressing and absorption",
      indications: ["Primary wound dressing", "Absorption of exudate", "Wound packing"],
      contraindications: ["Adherent to wound bed", "Heavy bleeding"],
      expirationDate: "2026-03-15",
      lotNumber: "LOT456789",
      sterile: true,
      singleUse: true,
    },

    // Medical Tape
    "567890123456": {
      name: "Medical Tape 1-inch x 10 yards",
      category: "Tape",
      manufacturer: "3M Micropore",
      sku: "WC-MT-005",
      barcode: "567890123456",
      unitCost: 4.75,
      unitSize: "1 inch x 10 yards",
      description: "Hypoallergenic medical tape for securing dressings and devices",
      indications: ["Securing dressings", "Taping medical devices", "Skin-friendly applications"],
      contraindications: ["Fragile skin", "Known tape allergies"],
      sterile: false,
      singleUse: false,
    },

    // Wound Cleanser
    "678901234567": {
      name: "Wound Cleanser Spray 8oz",
      category: "Antiseptic",
      manufacturer: "Coloplast",
      sku: "WC-WC-006",
      barcode: "678901234567",
      unitCost: 11.25,
      unitSize: "8 fl oz spray",
      description: "Gentle wound cleanser for irrigation and debris removal",
      indications: ["Wound irrigation", "Debris removal", "Gentle cleansing"],
      contraindications: ["Pressure irrigation in deep wounds", "Closed wounds"],
      expirationDate: "2025-11-30",
      lotNumber: "LOT678901",
      sterile: true,
      singleUse: false,
    },

    // Transparent Film Dressing
    "789012345678": {
      name: "Transparent Film Dressing 6x8",
      category: "Dressing",
      manufacturer: "Smith & Nephew",
      sku: "WC-TF-007",
      barcode: "789012345678",
      unitCost: 9.5,
      unitSize: "6x8 inches",
      description: "Waterproof transparent film dressing for protection and monitoring",
      indications: ["IV sites", "Minor wounds", "Surgical incisions", "Pressure ulcer prevention"],
      contraindications: ["Infected wounds", "Heavy exuding wounds", "Fragile skin"],
      expirationDate: "2025-09-10",
      lotNumber: "LOT789012",
      sterile: true,
      singleUse: true,
    },

    // Alginate Dressing
    "890123456789": {
      name: "Calcium Alginate Dressing 4x4",
      category: "Dressing",
      manufacturer: "Hollister",
      sku: "WC-AD-008",
      barcode: "890123456789",
      unitCost: 15.75,
      unitSize: "4x4 inches",
      description: "Highly absorbent alginate dressing for moderate to heavy exuding wounds",
      indications: ["Diabetic ulcers", "Pressure ulcers", "Surgical wounds", "Traumatic wounds"],
      contraindications: ["Dry wounds", "Third-degree burns", "Exposed bone or tendon"],
      expirationDate: "2025-07-25",
      lotNumber: "LOT890123",
      sterile: true,
      singleUse: true,
    },

    // Wound Gel
    "901234567890": {
      name: "Hydrogel Wound Gel 3oz",
      category: "Ointment",
      manufacturer: "Medihoney",
      sku: "WC-HG-009",
      barcode: "901234567890",
      unitCost: 22.5,
      unitSize: "3 oz tube",
      description: "Antimicrobial hydrogel for wound healing and moisture management",
      indications: ["Dry wounds", "Necrotic tissue", "Burns", "Radiation dermatitis"],
      contraindications: ["Heavy exuding wounds", "Known honey allergies"],
      expirationDate: "2025-06-18",
      lotNumber: "LOT901234",
      sterile: true,
      singleUse: false,
    },

    // Compression Bandage
    "012345678901": {
      id: "SUP010",
      barcode: "012345678901",
      name: "Compression Bandage 4-inch",
      category: "Compression",
      manufacturer: "BSN Medical",
      unitCost: 13.25,
      stockLevel: 78,
      reorderPoint: 18,
      expirationDate: "2026-01-12",
      lastRestocked: "2024-01-14",
    },
  }

  // Try exact match first
  if (supplyDatabase[cleanBarcode]) {
    return supplyDatabase[cleanBarcode]
  }

  // Try partial matches for different barcode formats
  for (const [barcode, data] of Object.entries(supplyDatabase)) {
    if (barcode.includes(cleanBarcode.substring(0, 8)) || cleanBarcode.includes(barcode.substring(0, 8))) {
      return data
    }
  }

  return null
}
