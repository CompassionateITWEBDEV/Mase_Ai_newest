import { type NextRequest, NextResponse } from "next/server"

interface CompetencyRecord {
  id: string
  staffId: string
  staffName: string
  staffRole: "RN" | "LPN" | "HHA" | "PT" | "OT" | "MSW"
  evaluationDate: string
  evaluationType: "initial" | "annual" | "skills-validation" | "performance-improvement"
  overallScore: number
  competencyAreas: CompetencyArea[]
  evaluatorId: string
  evaluatorName: string
  status: "competent" | "needs-improvement" | "not-competent"
  nextEvaluationDue: string
  certifications: Certification[]
  performanceImprovementPlan?: PerformanceImprovementPlan
}

interface CompetencyArea {
  category: string
  items: CompetencyItem[]
  categoryScore: number
  weight: number
}

interface CompetencyItem {
  id: string
  description: string
  score: number
  maxScore: number
  notes?: string
  evidenceProvided: boolean
}

interface Certification {
  id: string
  name: string
  issuingOrganization: string
  issueDate: string
  expirationDate: string
  status: "active" | "expired" | "pending-renewal"
  renewalRequired: boolean
}

interface PerformanceImprovementPlan {
  id: string
  startDate: string
  targetCompletionDate: string
  goals: PIPGoal[]
  progress: number
  status: "active" | "completed" | "extended"
  reviewDates: string[]
  supervisor: string
}

interface PIPGoal {
  id: string
  description: string
  targetDate: string
  completed: boolean
  progress: number
  actions: string[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")
    const role = searchParams.get("role")
    const status = searchParams.get("status")

    // Mock competency data
    const competencyRecords: CompetencyRecord[] = [
      {
        id: "COMP-001",
        staffId: "STAFF-001",
        staffName: "Sarah Johnson",
        staffRole: "RN",
        evaluationDate: "2024-01-15",
        evaluationType: "annual",
        overallScore: 95,
        competencyAreas: [
          {
            category: "Clinical Skills",
            categoryScore: 96,
            weight: 0.4,
            items: [
              {
                id: "CS-001",
                description: "Medication Administration",
                score: 5,
                maxScore: 5,
                evidenceProvided: true,
                notes: "Excellent technique and safety protocols",
              },
              {
                id: "CS-002",
                description: "Patient Assessment",
                score: 5,
                maxScore: 5,
                evidenceProvided: true,
                notes: "Thorough and accurate assessments",
              },
              {
                id: "CS-003",
                description: "Wound Care",
                score: 4,
                maxScore: 5,
                evidenceProvided: true,
                notes: "Good technique, minor improvement in documentation",
              },
            ],
          },
          {
            category: "Communication",
            categoryScore: 94,
            weight: 0.2,
            items: [
              {
                id: "COM-001",
                description: "Patient Communication",
                score: 5,
                maxScore: 5,
                evidenceProvided: true,
                notes: "Excellent rapport with patients",
              },
              {
                id: "COM-002",
                description: "Team Communication",
                score: 4,
                maxScore: 5,
                evidenceProvided: true,
                notes: "Good collaboration, could improve written communication",
              },
            ],
          },
          {
            category: "Safety & Compliance",
            categoryScore: 95,
            weight: 0.3,
            items: [
              {
                id: "SAF-001",
                description: "Infection Control",
                score: 5,
                maxScore: 5,
                evidenceProvided: true,
                notes: "Consistently follows protocols",
              },
              {
                id: "SAF-002",
                description: "Emergency Procedures",
                score: 5,
                maxScore: 5,
                evidenceProvided: true,
                notes: "Quick response and appropriate actions",
              },
            ],
          },
          {
            category: "Documentation",
            categoryScore: 92,
            weight: 0.1,
            items: [
              {
                id: "DOC-001",
                description: "Clinical Documentation",
                score: 4,
                maxScore: 5,
                evidenceProvided: true,
                notes: "Accurate but could be more timely",
              },
            ],
          },
        ],
        evaluatorId: "EVAL-001",
        evaluatorName: "Dr. Martinez",
        status: "competent",
        nextEvaluationDue: "2025-01-15",
        certifications: [
          {
            id: "CERT-001",
            name: "RN License",
            issuingOrganization: "State Board of Nursing",
            issueDate: "2020-01-15",
            expirationDate: "2025-01-15",
            status: "active",
            renewalRequired: false,
          },
          {
            id: "CERT-002",
            name: "BLS Certification",
            issuingOrganization: "American Heart Association",
            issueDate: "2023-06-01",
            expirationDate: "2025-06-01",
            status: "active",
            renewalRequired: false,
          },
        ],
      },
      {
        id: "COMP-002",
        staffId: "STAFF-002",
        staffName: "Lisa Garcia",
        staffRole: "LPN",
        evaluationDate: "2024-01-10",
        evaluationType: "annual",
        overallScore: 85,
        competencyAreas: [
          {
            category: "Clinical Skills",
            categoryScore: 88,
            weight: 0.4,
            items: [
              {
                id: "CS-001",
                description: "Medication Administration (Supervised)",
                score: 4,
                maxScore: 5,
                evidenceProvided: true,
                notes: "Good technique, requires RN supervision for complex medications",
              },
              {
                id: "CS-002",
                description: "Basic Patient Assessment",
                score: 4,
                maxScore: 5,
                evidenceProvided: true,
                notes: "Accurate vital signs and basic observations",
              },
            ],
          },
          {
            category: "Communication",
            categoryScore: 82,
            weight: 0.2,
            items: [
              {
                id: "COM-001",
                description: "Patient Communication",
                score: 4,
                maxScore: 5,
                evidenceProvided: true,
                notes: "Good patient interaction, language barrier occasionally",
              },
              {
                id: "COM-002",
                description: "Reporting to RN",
                score: 4,
                maxScore: 5,
                evidenceProvided: true,
                notes: "Timely reporting, could provide more detail",
              },
            ],
          },
        ],
        evaluatorId: "EVAL-002",
        evaluatorName: "Sarah Johnson, RN",
        status: "competent",
        nextEvaluationDue: "2025-01-10",
        certifications: [
          {
            id: "CERT-003",
            name: "LPN License",
            issuingOrganization: "State Board of Nursing",
            issueDate: "2021-03-15",
            expirationDate: "2025-03-15",
            status: "active",
            renewalRequired: false,
          },
        ],
      },
      {
        id: "COMP-003",
        staffId: "STAFF-003",
        staffName: "Angela Davis",
        staffRole: "HHA",
        evaluationDate: "2024-01-08",
        evaluationType: "performance-improvement",
        overallScore: 75,
        competencyAreas: [
          {
            category: "Personal Care",
            categoryScore: 78,
            weight: 0.4,
            items: [
              {
                id: "PC-001",
                description: "Activities of Daily Living Assistance",
                score: 4,
                maxScore: 5,
                evidenceProvided: true,
                notes: "Good technique but needs to improve time management",
              },
              {
                id: "PC-002",
                description: "Mobility Assistance",
                score: 3,
                maxScore: 5,
                evidenceProvided: true,
                notes: "Needs improvement in transfer techniques",
              },
            ],
          },
          {
            category: "Communication",
            categoryScore: 70,
            weight: 0.2,
            items: [
              {
                id: "COM-001",
                description: "Patient Communication",
                score: 3,
                maxScore: 5,
                evidenceProvided: true,
                notes: "Needs to improve professional communication skills",
              },
            ],
          },
          {
            category: "Documentation",
            categoryScore: 72,
            weight: 0.2,
            items: [
              {
                id: "DOC-001",
                description: "Care Documentation",
                score: 3,
                maxScore: 5,
                evidenceProvided: true,
                notes: "Inconsistent documentation, needs improvement",
              },
            ],
          },
        ],
        evaluatorId: "EVAL-003",
        evaluatorName: "Patricia Wilson, RN",
        status: "needs-improvement",
        nextEvaluationDue: "2024-02-08",
        certifications: [
          {
            id: "CERT-004",
            name: "HHA Certification",
            issuingOrganization: "State Health Department",
            issueDate: "2022-05-01",
            expirationDate: "2024-05-01",
            status: "active",
            renewalRequired: true,
          },
        ],
        performanceImprovementPlan: {
          id: "PIP-001",
          startDate: "2024-01-08",
          targetCompletionDate: "2024-02-08",
          progress: 60,
          status: "active",
          reviewDates: ["2024-01-15", "2024-01-22", "2024-01-29"],
          supervisor: "Patricia Wilson, RN",
          goals: [
            {
              id: "GOAL-001",
              description: "Improve documentation accuracy and timeliness",
              targetDate: "2024-01-25",
              completed: false,
              progress: 70,
              actions: [
                "Complete documentation training module",
                "Practice with supervisor daily for one week",
                "Submit documentation within 2 hours of visit",
              ],
            },
            {
              id: "GOAL-002",
              description: "Enhance professional communication skills",
              targetDate: "2024-02-01",
              completed: false,
              progress: 50,
              actions: [
                "Attend communication workshop",
                "Role-play scenarios with supervisor",
                "Receive feedback from patients (when appropriate)",
              ],
            },
          ],
        },
      },
    ]

    let filteredRecords = competencyRecords

    if (staffId) {
      filteredRecords = filteredRecords.filter((record) => record.staffId === staffId)
    }

    if (role) {
      filteredRecords = filteredRecords.filter((record) => record.staffRole === role)
    }

    if (status) {
      filteredRecords = filteredRecords.filter((record) => record.status === status)
    }

    return NextResponse.json({
      success: true,
      records: filteredRecords,
      summary: {
        totalRecords: filteredRecords.length,
        competentStaff: filteredRecords.filter((r) => r.status === "competent").length,
        needsImprovement: filteredRecords.filter((r) => r.status === "needs-improvement").length,
        notCompetent: filteredRecords.filter((r) => r.status === "not-competent").length,
        averageScore: Math.round(
          filteredRecords.reduce((sum, record) => sum + record.overallScore, 0) / filteredRecords.length,
        ),
      },
    })
  } catch (error) {
    console.error("Error retrieving competency records:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    switch (action) {
      case "create-evaluation":
        return await createCompetencyEvaluation(data)
      case "update-pip":
        return await updatePerformanceImprovementPlan(data)
      case "schedule-evaluation":
        return await scheduleEvaluation(data)
      default:
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error processing competency request:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

async function createCompetencyEvaluation(data: any) {
  // Create new competency evaluation
  const newEvaluation: CompetencyRecord = {
    id: `COMP-${Date.now()}`,
    staffId: data.staffId,
    staffName: data.staffName,
    staffRole: data.staffRole,
    evaluationDate: new Date().toISOString().split("T")[0],
    evaluationType: data.evaluationType,
    overallScore: 0, // Will be calculated
    competencyAreas: data.competencyAreas || [],
    evaluatorId: data.evaluatorId,
    evaluatorName: data.evaluatorName,
    status: "competent", // Will be determined based on score
    nextEvaluationDue: data.nextEvaluationDue,
    certifications: data.certifications || [],
  }

  return NextResponse.json({
    success: true,
    evaluation: newEvaluation,
    message: "Competency evaluation created successfully",
  })
}

async function updatePerformanceImprovementPlan(data: any) {
  // Update PIP progress
  return NextResponse.json({
    success: true,
    message: "Performance improvement plan updated successfully",
    updatedAt: new Date().toISOString(),
  })
}

async function scheduleEvaluation(data: any) {
  // Schedule new evaluation
  return NextResponse.json({
    success: true,
    scheduledEvaluation: {
      id: `SCHED-${Date.now()}`,
      staffId: data.staffId,
      evaluationType: data.evaluationType,
      scheduledDate: data.scheduledDate,
      evaluatorId: data.evaluatorId,
      status: "scheduled",
    },
    message: "Evaluation scheduled successfully",
  })
}
