import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock OASIS data that would come from Axxess API
    const mockOasisData = [
      {
        id: "OASIS-2024-001",
        patientName: "Margaret Johnson",
        patientId: "PT-78901",
        dateOfAssessment: "2024-01-15",
        assessmentType: "Start of Care",
        qualityScore: 92,
        financialImpact: 3250,
        riskLevel: "Medium",
        assignedStaff: "Sarah Chen, RN",
        status: "completed",
        flagCount: 1,
        lastUpdated: "2024-01-15T14:30:00Z",
        diagnoses: ["I50.9 - Heart failure, unspecified", "E11.9 - Type 2 diabetes mellitus"],
        functionalStatus: {
          mobility: "Requires assistance",
          selfCare: "Independent with devices",
          cognition: "Alert and oriented x3",
        },
        careNeeds: ["Medication management", "Diabetic education", "Fall prevention"],
        nextAssessmentDue: "2024-02-15",
      },
      {
        id: "OASIS-2024-002",
        patientName: "Robert Chen",
        patientId: "PT-78902",
        dateOfAssessment: "2024-01-14",
        assessmentType: "Recertification",
        qualityScore: 78,
        financialImpact: 4100,
        riskLevel: "High",
        assignedStaff: "Jennifer Adams, RN",
        status: "pending_review",
        flagCount: 3,
        lastUpdated: "2024-01-14T16:45:00Z",
        diagnoses: ["J44.1 - COPD with acute exacerbation", "I10 - Essential hypertension"],
        functionalStatus: {
          mobility: "Wheelchair dependent",
          selfCare: "Requires moderate assistance",
          cognition: "Mild cognitive impairment",
        },
        careNeeds: ["Respiratory therapy", "Physical therapy", "Medication reconciliation"],
        nextAssessmentDue: "2024-02-14",
      },
      {
        id: "OASIS-2024-003",
        patientName: "Dorothy Williams",
        patientId: "PT-78903",
        dateOfAssessment: "2024-01-13",
        assessmentType: "Resumption of Care",
        qualityScore: 95,
        financialImpact: 2850,
        riskLevel: "Low",
        assignedStaff: "Michael Torres, PT",
        status: "completed",
        flagCount: 0,
        lastUpdated: "2024-01-13T11:20:00Z",
        diagnoses: ["Z96.641 - Presence of right artificial hip joint", "M25.551 - Pain in right hip"],
        functionalStatus: {
          mobility: "Ambulates with walker",
          selfCare: "Independent",
          cognition: "Alert and oriented x3",
        },
        careNeeds: ["Physical therapy", "Occupational therapy", "Pain management"],
        nextAssessmentDue: "2024-02-13",
      },
      {
        id: "OASIS-2024-004",
        patientName: "James Rodriguez",
        patientId: "PT-78904",
        dateOfAssessment: "2024-01-12",
        assessmentType: "Start of Care",
        qualityScore: 85,
        financialImpact: 1850,
        riskLevel: "Medium",
        assignedStaff: "Lisa Park, OT",
        status: "in_review",
        flagCount: 2,
        lastUpdated: "2024-01-12T09:15:00Z",
        diagnoses: ["N18.3 - Chronic kidney disease, stage 3", "E11.9 - Type 2 diabetes mellitus"],
        functionalStatus: {
          mobility: "Independent with supervision",
          selfCare: "Independent",
          cognition: "Alert and oriented x3",
        },
        careNeeds: ["Skilled nursing", "Diabetic education", "Renal diet counseling"],
        nextAssessmentDue: "2024-02-12",
      },
      {
        id: "OASIS-2024-005",
        patientName: "Helen Davis",
        patientId: "PT-78905",
        dateOfAssessment: "2024-01-11",
        assessmentType: "Discharge",
        qualityScore: 88,
        financialImpact: 3300,
        riskLevel: "Low",
        assignedStaff: "David Kim, RN",
        status: "completed",
        flagCount: 1,
        lastUpdated: "2024-01-11T13:45:00Z",
        diagnoses: ["I25.10 - Atherosclerotic heart disease", "F03.90 - Unspecified dementia"],
        functionalStatus: {
          mobility: "Requires minimal assistance",
          selfCare: "Requires supervision",
          cognition: "Mild dementia",
        },
        careNeeds: ["Medication management", "Safety assessment", "Caregiver education"],
        nextAssessmentDue: null,
      },
    ]

    // Calculate summary metrics
    const totalRecords = mockOasisData.length
    const totalFinancialImpact = mockOasisData.reduce((sum, record) => sum + record.financialImpact, 0)
    const averageQualityScore = Math.round(
      mockOasisData.reduce((sum, record) => sum + record.qualityScore, 0) / totalRecords,
    )
    const pendingReview = mockOasisData.filter(
      (record) => record.status === "pending_review" || record.status === "in_review",
    ).length
    const completedToday = mockOasisData.filter((record) => {
      const recordDate = new Date(record.dateOfAssessment)
      const today = new Date()
      return recordDate.toDateString() === today.toDateString() && record.status === "completed"
    }).length

    const summary = {
      totalRecords,
      totalFinancialImpact,
      averageQualityScore,
      pendingReview,
      completedToday,
      lastSyncTime: new Date().toISOString(),
      syncStatus: "success",
    }

    return NextResponse.json({
      success: true,
      data: mockOasisData,
      summary,
      message: `Successfully synced ${totalRecords} OASIS records from Axxess`,
    })
  } catch (error) {
    console.error("Axxess OASIS sync error:", error)
    return NextResponse.json(
      {
        error: "Failed to sync OASIS data from Axxess",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { patientId, assessmentType, forceSync } = await request.json()

    // Simulate individual patient OASIS sync
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const mockPatientOasis = {
      id: `OASIS-${Date.now()}`,
      patientName: "New Patient",
      patientId: patientId || `PT-${Math.floor(Math.random() * 90000) + 10000}`,
      dateOfAssessment: new Date().toISOString().split("T")[0],
      assessmentType: assessmentType || "Start of Care",
      qualityScore: Math.floor(Math.random() * 30) + 70,
      financialImpact: Math.floor(Math.random() * 3000) + 1500,
      riskLevel: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
      assignedStaff: "System Generated",
      status: "pending_review",
      flagCount: Math.floor(Math.random() * 4),
      lastUpdated: new Date().toISOString(),
      diagnoses: ["Pending clinical review"],
      functionalStatus: {
        mobility: "Assessment pending",
        selfCare: "Assessment pending",
        cognition: "Assessment pending",
      },
      careNeeds: ["Initial assessment required"],
      nextAssessmentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    }

    return NextResponse.json({
      success: true,
      data: mockPatientOasis,
      message: `OASIS assessment created for patient ${patientId}`,
    })
  } catch (error) {
    console.error("Axxess OASIS creation error:", error)
    return NextResponse.json(
      {
        error: "Failed to create OASIS assessment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
