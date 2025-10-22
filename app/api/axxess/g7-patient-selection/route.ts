import { type NextRequest, NextResponse } from "next/server"

interface PatientSelectionCriteria {
  dateRange?: {
    start: string
    end: string
  }
  diagnosisCode?: string
  insuranceType?: string
  episodeStatus?: "active" | "discharged" | "pending"
  riskLevel?: "low" | "medium" | "high"
  lupaStatus?: "safe" | "at_risk" | "over_threshold"
  assignedClinician?: string
  facilityLocation?: string
}

interface SelectedPatient {
  patientId: string
  axxessId: string
  name: string
  dateOfBirth: string
  diagnosisCode: string
  diagnosisDescription: string
  insuranceType: string
  episodeStartDate: string
  episodeEndDate?: string
  status: "active" | "discharged" | "pending"
  riskLevel: "low" | "medium" | "high"
  lupaStatus: "safe" | "at_risk" | "over_threshold"
  assignedClinician: string
  facilityLocation: string
  totalVisits: number
  lastVisitDate: string
  nextScheduledVisit?: string
  reimbursementAmount: number
  outstandingBalance: number
}

interface G7PatientSelectionResponse {
  success: boolean
  patients: SelectedPatient[]
  totalCount: number
  criteria: PatientSelectionCriteria
  timestamp: string
  message?: string
  errors?: string[]
}

export async function POST(request: NextRequest): Promise<NextResponse<G7PatientSelectionResponse>> {
  try {
    const criteria: PatientSelectionCriteria = await request.json()
    
    console.log("G7 Patient Selection Request:", criteria)
    
    // Simulate API call to Axxess G7 Patient Selection endpoint
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    // Mock patient selection data based on criteria
    const mockPatients: SelectedPatient[] = [
      {
        patientId: "PT-2024-001",
        axxessId: "AX-G7-12345",
        name: "David R Hallman",
        dateOfBirth: "1965-08-15",
        diagnosisCode: "M79.3",
        diagnosisDescription: "Panniculitis, unspecified",
        insuranceType: "Humana ADR",
        episodeStartDate: "2024-01-15",
        status: "active",
        riskLevel: "medium",
        lupaStatus: "safe",
        assignedClinician: "Sarah Johnson, RN",
        facilityLocation: "Downtown Clinic",
        totalVisits: 12,
        lastVisitDate: "2024-01-20",
        nextScheduledVisit: "2024-01-23",
        reimbursementAmount: 3250.00,
        outstandingBalance: 125.00
      },
      {
        patientId: "PT-2024-002",
        axxessId: "AX-G7-12346",
        name: "Margaret Anderson",
        dateOfBirth: "1972-03-22",
        diagnosisCode: "I10",
        diagnosisDescription: "Essential hypertension",
        insuranceType: "BCBS ADR",
        episodeStartDate: "2024-01-10",
        status: "active",
        riskLevel: "high",
        lupaStatus: "at_risk",
        assignedClinician: "Michael Chen, PT",
        facilityLocation: "North Campus",
        totalVisits: 18,
        lastVisitDate: "2024-01-21",
        nextScheduledVisit: "2024-01-24",
        reimbursementAmount: 4750.00,
        outstandingBalance: 0.00
      },
      {
        patientId: "PT-2024-003",
        axxessId: "AX-G7-12347",
        name: "Robert Thompson",
        dateOfBirth: "1958-11-08",
        diagnosisCode: "E11.9",
        diagnosisDescription: "Type 2 diabetes mellitus without complications",
        insuranceType: "UHC ADR",
        episodeStartDate: "2024-01-05",
        episodeEndDate: "2024-01-19",
        status: "discharged",
        riskLevel: "low",
        lupaStatus: "safe",
        assignedClinician: "Lisa Park, RN",
        facilityLocation: "West Branch",
        totalVisits: 8,
        lastVisitDate: "2024-01-19",
        reimbursementAmount: 2100.00,
        outstandingBalance: 0.00
      }
    ]
    
    // Filter patients based on criteria
    let filteredPatients = mockPatients
    
    if (criteria.insuranceType) {
      filteredPatients = filteredPatients.filter(p => 
        p.insuranceType.toLowerCase().includes(criteria.insuranceType!.toLowerCase())
      )
    }
    
    if (criteria.episodeStatus) {
      filteredPatients = filteredPatients.filter(p => p.status === criteria.episodeStatus)
    }
    
    if (criteria.riskLevel) {
      filteredPatients = filteredPatients.filter(p => p.riskLevel === criteria.riskLevel)
    }
    
    if (criteria.lupaStatus) {
      filteredPatients = filteredPatients.filter(p => p.lupaStatus === criteria.lupaStatus)
    }
    
    if (criteria.assignedClinician) {
      filteredPatients = filteredPatients.filter(p => 
        p.assignedClinician.toLowerCase().includes(criteria.assignedClinician!.toLowerCase())
      )
    }
    
    return NextResponse.json({
      success: true,
      patients: filteredPatients,
      totalCount: filteredPatients.length,
      criteria,
      timestamp: new Date().toISOString(),
      message: `Successfully retrieved ${filteredPatients.length} patients matching criteria`
    })
    
  } catch (error) {
    console.error("G7 Patient Selection error:", error)
    return NextResponse.json(
      {
        success: false,
        patients: [],
        totalCount: 0,
        criteria: {},
        timestamp: new Date().toISOString(),
        message: "Failed to retrieve patient selection data",
        errors: [error instanceof Error ? error.message : "Unknown error occurred"]
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    
    if (patientId) {
      // Return specific patient details
      const mockPatient = {
        patientId,
        axxessId: `AX-G7-${patientId.split('-').pop()}`,
        name: "Sample Patient",
        status: "active",
        selectionHistory: [
          {
            date: "2024-01-20",
            criteria: "Insurance Type: Medicare",
            selectedBy: "System Admin",
            reason: "Routine audit selection"
          }
        ]
      }
      
      return NextResponse.json({
        success: true,
        patient: mockPatient,
        timestamp: new Date().toISOString()
      })
    }
    
    // Return available selection criteria options
    return NextResponse.json({
      success: true,
      availableCriteria: {
        insuranceTypes: ["Medicare", "Medicaid", "Humana ADR", "BCBS ADR", "UHC ADR", "Private"],
        episodeStatuses: ["active", "discharged", "pending"],
        riskLevels: ["low", "medium", "high"],
        lupaStatuses: ["safe", "at_risk", "over_threshold"],
        facilityLocations: ["Downtown Clinic", "North Campus", "West Branch", "East Wing"]
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("G7 Patient Selection GET error:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to retrieve patient selection data",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
