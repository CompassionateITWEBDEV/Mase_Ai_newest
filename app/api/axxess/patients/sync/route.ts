import { type NextRequest, NextResponse } from "next/server"

interface AxxessPatient {
  id: string
  axxessId: string
  name: string
  referralDate: string
  currentStatus: "Active" | "Pending" | "Discharged" | "On Hold"
  dischargeStatus: string
  referralAccepted: boolean
  assignedStaff: string
  socDueDate: string
  location: string
  referralType: "Hospital" | "Facility" | "Clinic"
  priority: "High" | "Medium" | "Low"
  diagnosis: string
  age: number
  insurance: string
  phoneNumber: string
  address: string
  emergencyContact: string
  episodeStartDate: string
  episodeEndDate: string
  nextReEvalDate: string
  lupaStatus: "Safe" | "At Risk" | "Over Threshold"
  totalEpisodeCost: number
  projectedCost: number
  visitFrequencies: any[]
  patientGoals: any[]
}

interface SyncResponse {
  success: boolean
  patients: any[] // Updated to any[] to accommodate referralData
  message: string
  syncTimestamp: string
  recordsProcessed: number
  errors?: string[]
}

export async function POST(request: NextRequest): Promise<NextResponse<SyncResponse>> {
  try {
    const { lastSync, includeVisitData, includeLupaData } = await request.json()

    console.log(`Starting Axxess patient sync - Last Sync: ${lastSync}`)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock Axxess patient data with enhanced visit frequency and LUPA information
    const mockAxxessPatients: AxxessPatient[] = [
      {
        id: "PT-2024-004",
        axxessId: "AX-12348",
        name: "Helen Rodriguez",
        referralDate: "2024-01-22",
        currentStatus: "Active",
        dischargeStatus: "N/A",
        referralAccepted: true,
        assignedStaff: "Patricia Wilson, RN",
        socDueDate: "2024-01-29",
        location: "East Wing",
        referralType: "Hospital",
        priority: "High",
        diagnosis: "Post-stroke rehabilitation, dysphagia",
        age: 68,
        insurance: "Medicare",
        phoneNumber: "(555) 789-0123",
        address: "456 Elm Street, City, ST 12345",
        emergencyContact: "Carlos Rodriguez (Husband) - (555) 321-0987",
        episodeStartDate: "2024-01-22",
        episodeEndDate: "2024-03-22",
        nextReEvalDate: "2024-02-21",
        lupaStatus: "At Risk",
        totalEpisodeCost: 2650.0,
        projectedCost: 3100.0,
        visitFrequencies: [
          {
            discipline: "RN",
            authorized: 16,
            used: 6,
            remaining: 10,
            weeklyFrequency: "2x/week",
            lastVisit: "2024-01-21",
            nextScheduled: "2024-01-23",
            lupaThreshold: 10,
            isOverThreshold: false,
            costPerVisit: 125.0,
            totalCost: 750.0,
          },
          {
            discipline: "PT",
            authorized: 14,
            used: 8,
            remaining: 6,
            weeklyFrequency: "2x/week",
            lastVisit: "2024-01-21",
            nextScheduled: "2024-01-23",
            lupaThreshold: 10,
            isOverThreshold: false,
            costPerVisit: 150.0,
            totalCost: 1200.0,
          },
          {
            discipline: "OT",
            authorized: 12,
            used: 5,
            remaining: 7,
            weeklyFrequency: "2x/week",
            lastVisit: "2024-01-20",
            nextScheduled: "2024-01-22",
            lupaThreshold: 10,
            isOverThreshold: false,
            costPerVisit: 140.0,
            totalCost: 700.0,
          },
        ],
        patientGoals: [
          {
            id: "G006",
            discipline: "PT",
            goal: "Improve balance and reduce fall risk",
            targetDate: "2024-02-28",
            status: "In Progress",
            progress: 45,
            notes: "Patient showing steady improvement in balance exercises",
          },
          {
            id: "G007",
            discipline: "OT",
            goal: "Safe swallowing with modified diet",
            targetDate: "2024-02-15",
            status: "In Progress",
            progress: 60,
            notes: "Progressing well with swallowing exercises",
          },
        ],
      },
      {
        id: "PT-2024-005",
        axxessId: "AX-12349",
        name: "William Chen",
        referralDate: "2024-01-23",
        currentStatus: "Active",
        dischargeStatus: "N/A",
        referralAccepted: true,
        assignedStaff: "David Rodriguez, RN",
        socDueDate: "2024-01-30",
        location: "North Branch",
        referralType: "Facility",
        priority: "Medium",
        diagnosis: "COPD exacerbation, medication management",
        age: 71,
        insurance: "Medicare Advantage",
        phoneNumber: "(555) 890-1234",
        address: "789 Oak Drive, City, ST 12345",
        emergencyContact: "Linda Chen (Daughter) - (555) 432-1098",
        episodeStartDate: "2024-01-23",
        episodeEndDate: "2024-03-23",
        nextReEvalDate: "2024-02-22",
        lupaStatus: "Over Threshold",
        totalEpisodeCost: 3450.0,
        projectedCost: 4200.0,
        visitFrequencies: [
          {
            discipline: "RN",
            authorized: 18,
            used: 14,
            remaining: 4,
            weeklyFrequency: "3x/week",
            lastVisit: "2024-01-22",
            nextScheduled: "2024-01-24",
            lupaThreshold: 10,
            isOverThreshold: true,
            costPerVisit: 125.0,
            totalCost: 1750.0,
          },
          {
            discipline: "PT",
            authorized: 10,
            used: 8,
            remaining: 2,
            weeklyFrequency: "2x/week",
            lastVisit: "2024-01-21",
            nextScheduled: "2024-01-23",
            lupaThreshold: 10,
            isOverThreshold: false,
            costPerVisit: 150.0,
            totalCost: 1200.0,
          },
          {
            discipline: "HHA",
            authorized: 25,
            used: 15,
            remaining: 10,
            weeklyFrequency: "3x/week",
            lastVisit: "2024-01-22",
            nextScheduled: "2024-01-24",
            lupaThreshold: 15,
            isOverThreshold: false,
            costPerVisit: 65.0,
            totalCost: 975.0,
          },
        ],
        patientGoals: [
          {
            id: "G008",
            discipline: "RN",
            goal: "Stabilize COPD symptoms and improve medication compliance",
            targetDate: "2024-03-01",
            status: "In Progress",
            progress: 70,
            notes: "Patient responding well to medication adjustments",
          },
          {
            id: "G009",
            discipline: "PT",
            goal: "Improve exercise tolerance and breathing techniques",
            targetDate: "2024-02-20",
            status: "In Progress",
            progress: 55,
            notes: "Good progress with pulmonary rehabilitation exercises",
          },
        ],
      },
    ]

    // Filter records based on last sync date if provided
    let filteredPatients = mockAxxessPatients
    if (lastSync) {
      const lastSyncDate = new Date(lastSync)
      // In real implementation, filter based on last modified date
      console.log(`Filtering records modified after ${lastSyncDate}`)
    }

    // Calculate LUPA status based on visit utilization
    filteredPatients = filteredPatients.map((patient) => {
      const overThresholdCount = patient.visitFrequencies.filter((v) => v.isOverThreshold).length
      const atRiskCount = patient.visitFrequencies.filter(
        (v) => v.used / v.authorized > 0.8 && !v.isOverThreshold,
      ).length

      let lupaStatus: "Safe" | "At Risk" | "Over Threshold" = "Safe"
      if (overThresholdCount > 0) {
        lupaStatus = "Over Threshold"
      } else if (atRiskCount > 0) {
        lupaStatus = "At Risk"
      }

      return {
        ...patient,
        lupaStatus,
      }
    })

    // Update the response format to match referral dashboard expectations
    const response: SyncResponse = {
      success: true,
      patients: filteredPatients.map((patient) => ({
        ...patient,
        // Convert to referral format for dashboard integration
        referralData: {
          id: patient.id,
          patientName: patient.name,
          diagnosis: patient.diagnosis,
          source: "axxess" as const,
          insurance: patient.insurance,
          urgency: patient.priority === "High" ? "Urgent" : ("Routine" as const),
          status: patient.currentStatus === "Active" ? "accepted" : ("processing" as const),
          confidence: 95,
          estimatedValue: patient.totalEpisodeCost,
          receivedAt: patient.referralDate,
          axxessId: patient.axxessId,
          assignedTo: patient.assignedStaff,
        },
      })),
      message: `Successfully synced ${filteredPatients.length} patients from Axxess`,
      syncTimestamp: new Date().toISOString(),
      recordsProcessed: filteredPatients.length,
      errors: [],
    }

    console.log(`Axxess patient sync completed: ${filteredPatients.length} records processed`)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Axxess patient sync error:", error)

    const errorResponse: SyncResponse = {
      success: false,
      patients: [],
      message: "Failed to sync patients from Axxess",
      syncTimestamp: new Date().toISOString(),
      recordsProcessed: 0,
      errors: [error instanceof Error ? error.message : "Unknown error occurred"],
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const axxessId = searchParams.get("axxessId")

    if (!patientId && !axxessId) {
      return NextResponse.json(
        {
          success: false,
          message: "Patient ID or Axxess ID is required",
        },
        { status: 400 },
      )
    }

    // Mock individual patient lookup
    const patientData = {
      success: true,
      patient: {
        id: patientId || "PT-2024-001",
        axxessId: axxessId || "AX-12345",
        lastUpdated: new Date().toISOString(),
        visitHistory: [
          {
            date: "2024-01-20",
            discipline: "RN",
            duration: 45,
            notes: "Wound assessment and dressing change",
            cost: 125.0,
          },
          {
            date: "2024-01-19",
            discipline: "PT",
            duration: 60,
            notes: "Gait training and strengthening exercises",
            cost: 150.0,
          },
        ],
        lupaAnalysis: {
          currentStatus: "At Risk",
          thresholdAnalysis: {
            RN: { used: 8, threshold: 10, status: "Safe" },
            PT: { used: 7, threshold: 10, status: "Safe" },
            HHA: { used: 12, threshold: 15, status: "Safe" },
          },
          recommendations: [
            "Monitor RN visit frequency to stay within LUPA threshold",
            "Consider combining PT/OT visits to optimize therapy outcomes",
            "Schedule re-evaluation in 2 weeks for potential authorization increase",
          ],
        },
      },
    }

    return NextResponse.json(patientData)
  } catch (error) {
    console.error("Error retrieving patient data:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
