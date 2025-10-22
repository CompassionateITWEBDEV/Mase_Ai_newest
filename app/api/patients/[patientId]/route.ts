import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { patientId: string } }) {
  try {
    const { patientId } = params

    // Mock patient data - in production, this would come from your database
    const mockPatients = {
      "PAT-001": {
        id: "PAT-001",
        name: "Margaret Anderson",
        phone: "(555) 123-4567",
        address: "123 Main St, City, ST 12345",
        dateOfBirth: "1945-03-15",
        emergencyContact: "John Anderson (Son)",
        emergencyPhone: "(555) 987-6543",
        firstVisitScheduled: "2024-07-10 10:00 AM",
        assignedNurse: "Sarah Johnson, RN",
        services: ["Wound Care", "Medication Management", "Vital Signs"],
        priority: "high",
        insuranceProvider: "Medicare",
        insuranceId: "123456789A",
        primaryDiagnosis: "Diabetic foot ulcer, CHF",
        status: "pending_onboarding",
        acceptedDate: "2024-07-09",
        insuranceVerified: true,
      },
      "PAT-002": {
        id: "PAT-002",
        name: "Robert Thompson",
        phone: "(555) 234-5678",
        address: "456 Oak Ave, City, ST 12345",
        dateOfBirth: "1958-11-22",
        emergencyContact: "Mary Thompson (Wife)",
        emergencyPhone: "(555) 876-5432",
        firstVisitScheduled: "2024-07-10 2:00 PM",
        assignedNurse: "Jennifer Martinez, RN",
        services: ["Physical Therapy", "Occupational Therapy"],
        priority: "medium",
        insuranceProvider: "Blue Cross Blue Shield",
        insuranceId: "987654321B",
        primaryDiagnosis: "Post-surgical rehabilitation",
        status: "pending_onboarding",
        acceptedDate: "2024-07-09",
        insuranceVerified: true,
      },
      "PAT-003": {
        id: "PAT-003",
        name: "Dorothy Williams",
        phone: "(555) 345-6789",
        address: "789 Pine St, City, ST 12345",
        dateOfBirth: "1951-07-08",
        emergencyContact: "James Williams (Brother)",
        emergencyPhone: "(555) 765-4321",
        firstVisitScheduled: "2024-07-10 11:30 AM",
        assignedNurse: "Patricia Wilson, RN",
        services: ["Skilled Nursing", "Patient Education"],
        priority: "high",
        insuranceProvider: "Medicaid",
        insuranceId: "456789123C",
        primaryDiagnosis: "Stroke recovery, occupational therapy",
        status: "pending_onboarding",
        acceptedDate: "2024-07-08",
        insuranceVerified: false,
      },
    }

    const patient = mockPatients[patientId as keyof typeof mockPatients]

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      patient,
    })
  } catch (error) {
    console.error("Error fetching patient:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
