import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const includeAnalytics = searchParams.get("analytics") === "true"

    // Mock patient usage data
    const patientUsageData = [
      {
        id: "USAGE-001",
        patientId: "P001",
        patientName: "Margaret Anderson",
        room: "101A",
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
        shift: "Day",
      },
      {
        id: "USAGE-002",
        patientId: "P002",
        patientName: "Dorothy Williams",
        room: "102B",
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
        shift: "Day",
      },
      {
        id: "USAGE-003",
        patientId: "P003",
        patientName: "James Patterson",
        room: "103A",
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
        shift: "Day",
      },
      {
        id: "USAGE-004",
        patientId: "P001",
        patientName: "Margaret Anderson",
        room: "101A",
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
        shift: "Day",
      },
      {
        id: "USAGE-005",
        patientId: "P002",
        patientName: "Dorothy Williams",
        room: "102B",
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
        shift: "Day",
      },
      {
        id: "USAGE-006",
        patientId: "P001",
        patientName: "Margaret Anderson",
        room: "101A",
        supplyId: "SUP008",
        supplyName: "Wound Gel with Lidocaine 1oz",
        category: "Topical",
        unitCost: 22.4,
        quantity: 1,
        totalCost: 22.4,
        woundLocation: "Right heel",
        treatmentType: "assessment",
        notes: "Applied for pain management during assessment",
        nurseId: "NURSE003",
        nurseName: "Michael Chen, RN",
        timestamp: "2024-01-19T22:15:00Z",
        shift: "Night",
      },
      {
        id: "USAGE-007",
        patientId: "P003",
        patientName: "James Patterson",
        room: "103A",
        supplyId: "SUP004",
        supplyName: "Transparent Film Dressing 6x8",
        category: "Protective",
        unitCost: 8.9,
        quantity: 1,
        totalCost: 8.9,
        woundLocation: "Surgical incision",
        treatmentType: "dressing-change",
        notes: "Protective covering over healing incision",
        nurseId: "NURSE001",
        nurseName: "Jennifer Adams, RN",
        timestamp: "2024-01-19T14:20:00Z",
        shift: "Day",
      },
      {
        id: "USAGE-008",
        patientId: "P002",
        patientName: "Dorothy Williams",
        room: "102B",
        supplyId: "SUP003",
        supplyName: "Calcium Alginate Rope 12in",
        category: "Hemostatic",
        unitCost: 15.25,
        quantity: 1,
        totalCost: 15.25,
        woundLocation: "Sacral area",
        treatmentType: "debridement",
        notes: "Packing for deep tissue area after debridement",
        nurseId: "NURSE004",
        nurseName: "Lisa Rodriguez, RN",
        timestamp: "2024-01-19T09:30:00Z",
        shift: "Day",
      },
    ]

    let filteredUsage = patientUsageData

    // Filter by patient if specified
    if (patientId) {
      filteredUsage = filteredUsage.filter((usage) => usage.patientId === patientId)
    }

    // Sort by timestamp (most recent first) and limit
    filteredUsage = filteredUsage
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    let analytics = {}

    if (includeAnalytics) {
      // Calculate analytics
      const totalCost = patientUsageData.reduce((sum, usage) => sum + usage.totalCost, 0)
      const totalItems = patientUsageData.reduce((sum, usage) => sum + usage.quantity, 0)

      // Cost by category
      const costByCategory = patientUsageData.reduce((acc: Record<string, number>, usage) => {
        acc[usage.category] = (acc[usage.category] || 0) + usage.totalCost
        return acc
      }, {})

      // Cost by patient
      const costByPatient = patientUsageData.reduce((acc: Record<string, any>, usage) => {
        if (!acc[usage.patientId]) {
          acc[usage.patientId] = {
            patientName: usage.patientName,
            room: usage.room,
            totalCost: 0,
            itemCount: 0,
          }
        }
        acc[usage.patientId].totalCost += usage.totalCost
        acc[usage.patientId].itemCount += usage.quantity
        return acc
      }, {})

      // Daily costs for trending
      const dailyCosts = patientUsageData.reduce((acc: Record<string, number>, usage) => {
        const date = new Date(usage.timestamp).toISOString().split("T")[0]
        acc[date] = (acc[date] || 0) + usage.totalCost
        return acc
      }, {})

      // Convert daily costs to array format for charting
      const dailyCostsArray = Object.entries(dailyCosts)
        .map(([date, cost]) => ({ date, cost }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // Usage by shift
      const usageByShift = patientUsageData.reduce((acc: Record<string, any>, usage) => {
        if (!acc[usage.shift]) {
          acc[usage.shift] = { count: 0, cost: 0 }
        }
        acc[usage.shift].count += usage.quantity
        acc[usage.shift].cost += usage.totalCost
        return acc
      }, {})

      // Most used supplies
      const supplyUsage = patientUsageData.reduce((acc: Record<string, any>, usage) => {
        if (!acc[usage.supplyId]) {
          acc[usage.supplyId] = {
            supplyName: usage.supplyName,
            category: usage.category,
            count: 0,
            cost: 0,
          }
        }
        acc[usage.supplyId].count += usage.quantity
        acc[usage.supplyId].cost += usage.totalCost
        return acc
      }, {})

      const mostUsedSupplies = Object.values(supplyUsage)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5)

      const highestCostSupplies = Object.values(supplyUsage)
        .sort((a: any, b: any) => b.cost - a.cost)
        .slice(0, 5)

      // Treatment type analysis
      const treatmentTypeAnalysis = patientUsageData.reduce((acc: Record<string, any>, usage) => {
        if (!acc[usage.treatmentType]) {
          acc[usage.treatmentType] = { count: 0, cost: 0 }
        }
        acc[usage.treatmentType].count += usage.quantity
        acc[usage.treatmentType].cost += usage.totalCost
        return acc
      }, {})

      analytics = {
        summary: {
          totalCost: totalCost.toFixed(2),
          totalItems,
          uniquePatients: Object.keys(costByPatient).length,
          uniqueSupplies: Object.keys(supplyUsage).length,
          averageCostPerItem: totalItems > 0 ? (totalCost / totalItems).toFixed(2) : "0.00",
          averageCostPerPatient:
            Object.keys(costByPatient).length > 0 ? (totalCost / Object.keys(costByPatient).length).toFixed(2) : "0.00",
        },
        costBreakdown: {
          byCategory: costByCategory,
          byPatient: costByPatient,
          byShift: usageByShift,
          byTreatmentType: treatmentTypeAnalysis,
        },
        trends: {
          dailyCosts: dailyCostsArray,
        },
        topUsage: {
          mostUsedSupplies,
          highestCostSupplies,
        },
        efficiency: {
          costPerDressingChange: treatmentTypeAnalysis["dressing-change"]
            ? (treatmentTypeAnalysis["dressing-change"].cost / treatmentTypeAnalysis["dressing-change"].count).toFixed(
                2,
              )
            : "0.00",
          costPerWoundCleaning: treatmentTypeAnalysis["wound-cleaning"]
            ? (treatmentTypeAnalysis["wound-cleaning"].cost / treatmentTypeAnalysis["wound-cleaning"].count).toFixed(2)
            : "0.00",
          costPerAssessment: treatmentTypeAnalysis["assessment"]
            ? (treatmentTypeAnalysis["assessment"].cost / treatmentTypeAnalysis["assessment"].count).toFixed(2)
            : "0.00",
        },
      }
    }

    return NextResponse.json({
      success: true,
      usage: filteredUsage,
      analytics: includeAnalytics ? analytics : undefined,
      pagination: {
        limit,
        total: patientUsageData.length,
        filtered: filteredUsage.length,
      },
    })
  } catch (error) {
    console.error("Error fetching patient usage data:", error)
    return NextResponse.json({ success: false, message: "Error fetching patient usage data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, dateRange, analysisType } = body

    // Generate detailed cost analysis report
    const reportData = {
      reportId: `RPT-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      patientId,
      dateRange,
      analysisType,
      // This would contain detailed analysis results
      results: {
        totalCost: 245.67,
        itemCount: 15,
        averageCostPerDay: 35.1,
        costTrend: "increasing",
        recommendations: [
          "Consider bulk purchasing for frequently used items",
          "Review high-cost supply usage patterns",
          "Implement standardized wound care protocols",
        ],
      },
    }

    return NextResponse.json({
      success: true,
      report: reportData,
      message: "Cost analysis report generated successfully",
    })
  } catch (error) {
    console.error("Error generating cost analysis:", error)
    return NextResponse.json({ success: false, message: "Error generating cost analysis" }, { status: 500 })
  }
}
