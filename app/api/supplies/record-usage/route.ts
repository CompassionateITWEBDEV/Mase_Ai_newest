import { type NextRequest, NextResponse } from "next/server"

interface UsageRequest {
  patientId: string
  supplyId: string
  quantity: number
  woundLocation?: string
  treatmentType?: string
  notes?: string
  nurseId: string
  timestamp: string
}

interface UsageResponse {
  success: boolean
  usageId?: string
  message?: string
  costImpact?: {
    unitCost: number
    totalCost: number
    patientTotalCost: number
  }
}

interface SupplyUsageRequest {
  patientId: string
  supplyId: string
  quantity: number
  notes?: string
  woundLocation?: string
  treatmentType?: string
  nurseId: string
  nurseName: string
}

interface SupplyUsageResponse {
  success: boolean
  message: string
  usageId?: string
  totalCost?: number
  processingTime: number
}

export async function POST(request: NextRequest): Promise<NextResponse<UsageResponse>> {
  try {
    const body: UsageRequest = await request.json()
    const { patientId, supplyId, quantity, woundLocation, treatmentType, notes, nurseId, timestamp } = body

    // Validate required fields
    if (!patientId || !supplyId || !quantity || !nurseId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: patientId, supplyId, quantity, nurseId" },
        { status: 400 },
      )
    }

    if (quantity <= 0) {
      return NextResponse.json({ success: false, message: "Quantity must be greater than 0" }, { status: 400 })
    }

    // Mock supply database lookup
    const supplyDatabase: Record<string, any> = {
      SUP001: {
        id: "SUP001",
        name: "Hydrocolloid Dressing 4x4",
        category: "Dressings",
        manufacturer: "ConvaTec",
        unitCost: 12.5,
        stockLevel: 45,
        reorderPoint: 10,
      },
      SUP002: {
        id: "SUP002",
        name: "Silver Antimicrobial Foam 6x6",
        category: "Antimicrobial",
        manufacturer: "Molnlycke",
        unitCost: 28.75,
        stockLevel: 23,
        reorderPoint: 5,
      },
      SUP003: {
        id: "SUP003",
        name: "Calcium Alginate Rope 12in",
        category: "Hemostatic",
        manufacturer: "Hollister",
        unitCost: 15.25,
        stockLevel: 67,
        reorderPoint: 15,
      },
      SUP004: {
        id: "SUP004",
        name: "Transparent Film Dressing 6x8",
        category: "Protective",
        manufacturer: "3M Tegaderm",
        unitCost: 8.9,
        stockLevel: 89,
        reorderPoint: 20,
      },
      SUP005: {
        id: "SUP005",
        name: "Saline Wound Cleanser 8oz",
        category: "Cleansers",
        manufacturer: "Medline",
        unitCost: 6.75,
        stockLevel: 156,
        reorderPoint: 30,
      },
      SUP006: {
        id: "SUP006",
        name: "Gauze Pads 4x4 Sterile (10pk)",
        category: "Gauze",
        manufacturer: "Johnson & Johnson",
        unitCost: 4.25,
        stockLevel: 234,
        reorderPoint: 50,
      },
      SUP007: {
        id: "SUP007",
        name: "Medical Tape 1in x 10yd",
        category: "Tape",
        manufacturer: "3M Micropore",
        unitCost: 3.5,
        stockLevel: 178,
        reorderPoint: 40,
      },
      SUP008: {
        id: "SUP008",
        name: "Wound Gel with Lidocaine 1oz",
        category: "Topical",
        manufacturer: "Medihoney",
        unitCost: 22.4,
        stockLevel: 34,
        reorderPoint: 8,
      },
      SUP009: {
        id: "SUP009",
        name: "Compression Bandage 4in",
        category: "Compression",
        manufacturer: "Covidien",
        unitCost: 11.8,
        stockLevel: 78,
        reorderPoint: 18,
      },
      SUP010: {
        id: "SUP010",
        name: "Collagen Matrix Dressing 2x2",
        category: "Advanced",
        manufacturer: "Integra",
        unitCost: 45.6,
        stockLevel: 12,
        reorderPoint: 3,
      },
    }

    // Mock patient database lookup
    const patientDatabase: Record<string, any> = {
      P001: {
        id: "P001",
        name: "Margaret Anderson",
        room: "101A",
        mrn: "MRN-2024-001",
        diagnosis: "Diabetic foot ulcer",
        admissionDate: "2024-01-15",
      },
      P002: {
        id: "P002",
        name: "Dorothy Williams",
        room: "102B",
        mrn: "MRN-2024-002",
        diagnosis: "Pressure ulcer stage 3",
        admissionDate: "2024-01-18",
      },
      P003: {
        id: "P003",
        name: "James Patterson",
        room: "103A",
        mrn: "MRN-2024-003",
        diagnosis: "Post-surgical wound",
        admissionDate: "2024-01-20",
      },
    }

    const supply = supplyDatabase[supplyId]
    const patient = patientDatabase[patientId]

    if (!supply) {
      return NextResponse.json({ success: false, message: "Supply not found" }, { status: 404 })
    }

    if (!patient) {
      return NextResponse.json({ success: false, message: "Patient not found" }, { status: 404 })
    }

    // Check if sufficient stock is available
    if (supply.stockLevel < quantity) {
      return NextResponse.json(
        { success: false, message: `Insufficient stock. Only ${supply.stockLevel} units available.` },
        { status: 400 },
      )
    }

    // Generate usage record ID
    const usageId = `USAGE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Calculate costs
    const totalCost = supply.unitCost * quantity

    // Create usage record
    const usageRecord = {
      id: usageId,
      patientId,
      patientName: patient.name,
      patientRoom: patient.room,
      supplyId,
      supplyName: supply.name,
      category: supply.category,
      manufacturer: supply.manufacturer,
      unitCost: supply.unitCost,
      quantity,
      totalCost,
      woundLocation: woundLocation || "",
      treatmentType: treatmentType || "",
      notes: notes || "",
      nurseId,
      timestamp,
      recordedAt: new Date().toISOString(),
    }

    // In a real application, you would:
    // 1. Save the usage record to the database
    // 2. Update the supply stock level
    // 3. Update patient cost tracking
    // 4. Send notifications if stock is low
    // 5. Log the transaction for audit purposes

    console.log("Supply usage recorded:", usageRecord)

    // Mock: Update stock level (in real app, this would be in database)
    supply.stockLevel -= quantity

    // Check if stock is now low and needs reordering
    const needsReorder = supply.stockLevel <= supply.reorderPoint
    const alerts = []

    if (needsReorder) {
      alerts.push({
        type: "warning",
        message: `${supply.name} is now low in stock (${supply.stockLevel} remaining). Reorder recommended.`,
      })
    }

    // Mock: Calculate patient's total supply cost (in real app, query from database)
    const mockPatientTotalCost = 245.67 + totalCost // Previous costs + this usage

    const response: UsageResponse = {
      success: true,
      usageId,
      message: "Supply usage recorded successfully",
      costImpact: {
        unitCost: supply.unitCost,
        totalCost,
        patientTotalCost: mockPatientTotalCost,
      },
    }

    // Add alerts if any
    if (alerts.length > 0) {
      ;(response as any).alerts = alerts
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error recording supply usage:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error while recording usage" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const nurseId = searchParams.get("nurseId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    // Mock usage records
    const allUsageRecords = [
      {
        id: "USAGE-001",
        patientId: "P001",
        patientName: "Margaret Anderson",
        patientRoom: "101A",
        supplyId: "SUP001",
        supplyName: "Hydrocolloid Dressing 4x4",
        category: "Dressings",
        unitCost: 12.5,
        quantity: 2,
        totalCost: 25.0,
        woundLocation: "Right heel",
        treatmentType: "dressing-change",
        notes: "Wound showing improvement, minimal drainage",
        nurseId: "NURSE001",
        nurseName: "Jennifer Adams, RN",
        timestamp: "2024-01-20T14:30:00Z",
        recordedAt: "2024-01-20T14:32:00Z",
      },
      {
        id: "USAGE-002",
        patientId: "P002",
        patientName: "Dorothy Williams",
        patientRoom: "102B",
        supplyId: "SUP002",
        supplyName: "Silver Antimicrobial Foam 6x6",
        category: "Antimicrobial",
        unitCost: 28.75,
        quantity: 1,
        totalCost: 28.75,
        woundLocation: "Sacral area",
        treatmentType: "initial-dressing",
        notes: "Stage 3 pressure ulcer, signs of infection",
        nurseId: "NURSE002",
        nurseName: "Patricia Wilson, RN",
        timestamp: "2024-01-20T16:15:00Z",
        recordedAt: "2024-01-20T16:17:00Z",
      },
      {
        id: "USAGE-003",
        patientId: "P003",
        patientName: "James Patterson",
        patientRoom: "103A",
        supplyId: "SUP005",
        supplyName: "Saline Wound Cleanser 8oz",
        category: "Cleansers",
        unitCost: 6.75,
        quantity: 1,
        totalCost: 6.75,
        woundLocation: "Surgical incision",
        treatmentType: "wound-cleaning",
        notes: "Post-operative day 3, cleaning incision site",
        nurseId: "NURSE001",
        nurseName: "Jennifer Adams, RN",
        timestamp: "2024-01-20T10:45:00Z",
        recordedAt: "2024-01-20T10:47:00Z",
      },
      {
        id: "USAGE-004",
        patientId: "P001",
        patientName: "Margaret Anderson",
        patientRoom: "101A",
        supplyId: "SUP006",
        supplyName: "Gauze Pads 4x4 Sterile (10pk)",
        category: "Gauze",
        unitCost: 4.25,
        quantity: 1,
        totalCost: 4.25,
        woundLocation: "Right heel",
        treatmentType: "dressing-change",
        notes: "Secondary dressing application",
        nurseId: "NURSE001",
        nurseName: "Jennifer Adams, RN",
        timestamp: "2024-01-20T14:35:00Z",
        recordedAt: "2024-01-20T14:37:00Z",
      },
      {
        id: "USAGE-005",
        patientId: "P002",
        patientName: "Dorothy Williams",
        patientRoom: "102B",
        supplyId: "SUP007",
        supplyName: "Medical Tape 1in x 10yd",
        category: "Tape",
        unitCost: 3.5,
        quantity: 1,
        totalCost: 3.5,
        woundLocation: "Sacral area",
        treatmentType: "initial-dressing",
        notes: "Securing antimicrobial foam dressing",
        nurseId: "NURSE002",
        nurseName: "Patricia Wilson, RN",
        timestamp: "2024-01-20T16:20:00Z",
        recordedAt: "2024-01-20T16:22:00Z",
      },
    ]

    let filteredRecords = allUsageRecords

    // Apply filters
    if (patientId) {
      filteredRecords = filteredRecords.filter((record) => record.patientId === patientId)
    }

    if (nurseId) {
      filteredRecords = filteredRecords.filter((record) => record.nurseId === nurseId)
    }

    if (startDate) {
      filteredRecords = filteredRecords.filter((record) => new Date(record.timestamp) >= new Date(startDate))
    }

    if (endDate) {
      filteredRecords = filteredRecords.filter((record) => new Date(record.timestamp) <= new Date(endDate))
    }

    // Sort by timestamp (most recent first) and limit results
    filteredRecords = filteredRecords
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    // Calculate summary statistics
    const totalCost = filteredRecords.reduce((sum, record) => sum + record.totalCost, 0)
    const totalItems = filteredRecords.reduce((sum, record) => sum + record.quantity, 0)
    const uniquePatients = new Set(filteredRecords.map((record) => record.patientId)).size
    const uniqueSupplies = new Set(filteredRecords.map((record) => record.supplyId)).size

    // Calculate cost by category
    const costByCategory = filteredRecords.reduce((acc: Record<string, number>, record) => {
      acc[record.category] = (acc[record.category] || 0) + record.totalCost
      return acc
    }, {})

    // Calculate daily costs for trending
    const dailyCosts = filteredRecords.reduce((acc: Record<string, number>, record) => {
      const date = new Date(record.timestamp).toISOString().split("T")[0]
      acc[date] = (acc[date] || 0) + record.totalCost
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      usage: filteredRecords,
      summary: {
        totalRecords: filteredRecords.length,
        totalCost: totalCost.toFixed(2),
        totalItems,
        uniquePatients,
        uniqueSupplies,
        averageCostPerItem: totalItems > 0 ? (totalCost / totalItems).toFixed(2) : "0.00",
        costByCategory,
        dailyCosts,
      },
    })
  } catch (error) {
    console.error("Error fetching usage records:", error)
    return NextResponse.json({ success: false, message: "Error fetching usage records" }, { status: 500 })
  }
}
