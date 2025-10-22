import { type NextRequest, NextResponse } from "next/server"

interface PredictivePatient {
  id: string
  patientName: string
  mrn: string
  dob: string
  age: number
  gender: string
  address: string
  zipCode: string
  phone: string
  admissionDate: string
  predictedDischarge: string
  actualDischarge?: string
  facility: string
  facilityId: string
  unit: string
  admittingPhysician: string
  physicianNPI: string
  primaryDiagnosis: string
  icd10Codes: string[]
  comorbidities: string[]
  insurance: string
  insuranceId: string
  homeHealthEligible: boolean
  predictedLOS: number
  actualLOS?: number
  riskScore: number
  potentialValue: number
  acuityLevel: "low" | "medium" | "high"
  dischargeDestination: "home" | "snf" | "ltac" | "rehab" | "other"
  assignedMarketer?: string
  assignedNurse?: string
  caseManager?: string
  caseManagerPhone?: string
  contactAttempts: number
  lastContactDate?: string
  status: "admitted" | "contacted" | "secured" | "discharged" | "lost"
  notes?: string
  predictiveFlags: string[]
  marketingPriority: 1 | 2 | 3 | 4 | 5
  estimatedDischargeTime: string
}

// Mock database
let predictivePatients: PredictivePatient[] = [
  {
    id: "pred-001",
    patientName: "Robert Johnson",
    mrn: "MRN-789456",
    dob: "1952-03-15",
    age: 72,
    gender: "Male",
    address: "1234 Main St, Detroit, MI 48201",
    zipCode: "48201",
    phone: "(313) 555-0123",
    admissionDate: "2024-01-13T08:30:00Z",
    predictedDischarge: "2024-01-18T14:00:00Z",
    facility: "Henry Ford Health System",
    facilityId: "HF-001",
    unit: "Cardiology ICU",
    admittingPhysician: "Dr. Sarah Mitchell",
    physicianNPI: "1234567890",
    primaryDiagnosis: "Acute heart failure with reduced ejection fraction",
    icd10Codes: ["I50.21", "I25.10", "E11.9"],
    comorbidities: ["Type 2 diabetes", "Coronary artery disease", "Hypertension"],
    insurance: "Priority Health",
    insuranceId: "PH-456789",
    homeHealthEligible: true,
    predictedLOS: 5,
    riskScore: 92,
    potentialValue: 5200,
    acuityLevel: "high",
    dischargeDestination: "home",
    assignedMarketer: "Sarah Johnson",
    assignedNurse: "Jennifer Martinez, RN",
    caseManager: "Lisa Thompson, MSW",
    caseManagerPhone: "(313) 555-0456",
    contactAttempts: 2,
    lastContactDate: "2024-01-14T10:30:00Z",
    status: "contacted",
    notes: "Spoke with case manager. Patient interested in home health. Family meeting scheduled for tomorrow.",
    predictiveFlags: ["High-value", "CHF Protocol", "Readmission Risk"],
    marketingPriority: 1,
    estimatedDischargeTime: "2:00 PM",
  },
  // Add more mock patients as needed
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const facility = searchParams.get("facility")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const date = searchParams.get("date")

    let filteredPatients = [...predictivePatients]

    // Apply filters
    if (facility && facility !== "all") {
      filteredPatients = filteredPatients.filter((p) => p.facility.toLowerCase().includes(facility.toLowerCase()))
    }

    if (status && status !== "all") {
      filteredPatients = filteredPatients.filter((p) => p.status === status)
    }

    if (priority && priority !== "all") {
      filteredPatients = filteredPatients.filter((p) => p.marketingPriority.toString() === priority)
    }

    if (date) {
      filteredPatients = filteredPatients.filter((p) => {
        const dischargeDate = new Date(p.predictedDischarge).toDateString()
        const filterDate = new Date(date).toDateString()
        return dischargeDate === filterDate
      })
    }

    // Calculate analytics
    const analytics = {
      totalAdmissions: predictivePatients.length,
      eligiblePatients: predictivePatients.filter((p) => p.homeHealthEligible).length,
      predictedDischarges: predictivePatients.filter((p) => {
        const today = new Date().toDateString()
        return new Date(p.predictedDischarge).toDateString() === today
      }).length,
      contactedPatients: predictivePatients.filter((p) => p.contactAttempts > 0).length,
      securedReferrals: predictivePatients.filter((p) => p.status === "secured").length,
      averageLOS: 4.2,
      conversionRate: 66.7,
      potentialRevenue: predictivePatients.reduce((sum, p) => sum + (p.homeHealthEligible ? p.potentialValue : 0), 0),
    }

    return NextResponse.json({
      success: true,
      data: {
        patients: filteredPatients,
        analytics,
        total: filteredPatients.length,
      },
    })
  } catch (error) {
    console.error("Error fetching predictive patients:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch patients" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, patientId, data } = body

    switch (action) {
      case "contact":
        // Update patient contact status
        predictivePatients = predictivePatients.map((p) =>
          p.id === patientId
            ? {
                ...p,
                status: "contacted",
                contactAttempts: p.contactAttempts + 1,
                lastContactDate: new Date().toISOString(),
                notes: data?.notes || p.notes,
              }
            : p,
        )
        break

      case "secure":
        // Mark as secured referral
        predictivePatients = predictivePatients.map((p) =>
          p.id === patientId
            ? {
                ...p,
                status: "secured",
                notes: data?.notes || p.notes,
              }
            : p,
        )
        break

      case "assign":
        // Assign to marketer/nurse
        predictivePatients = predictivePatients.map((p) =>
          p.id === patientId
            ? {
                ...p,
                assignedMarketer: data?.marketer || p.assignedMarketer,
                assignedNurse: data?.nurse || p.assignedNurse,
              }
            : p,
        )
        break

      case "update_prediction":
        // Update discharge prediction
        predictivePatients = predictivePatients.map((p) =>
          p.id === patientId
            ? {
                ...p,
                predictedDischarge: data?.predictedDischarge || p.predictedDischarge,
                predictedLOS: data?.predictedLOS || p.predictedLOS,
                riskScore: data?.riskScore || p.riskScore,
              }
            : p,
        )
        break

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Patient ${action} successful`,
    })
  } catch (error) {
    console.error("Error updating predictive patient:", error)
    return NextResponse.json({ success: false, error: "Failed to update patient" }, { status: 500 })
  }
}
