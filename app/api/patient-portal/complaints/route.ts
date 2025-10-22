import { type NextRequest, NextResponse } from "next/server"

interface PatientComplaint {
  id: string
  patientId: string
  patientName: string
  type: string
  staffMember?: string
  description: string
  anonymous: boolean
  submittedDate: string
  status: "pending" | "under_review" | "resolved"
  priority: "low" | "medium" | "high"
  assignedTo?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const complaintData = await request.json()

    // Generate complaint ID
    const complaintId = `PC-${Date.now()}`

    // Determine priority based on complaint type
    const priority =
      complaintData.type === "care-quality" ? "high" : complaintData.type === "communication" ? "medium" : "low"

    // Create complaint record
    const complaint: PatientComplaint = {
      id: complaintId,
      patientId: complaintData.patientId || "PT-12345",
      patientName: complaintData.anonymous ? "Anonymous" : "Margaret Anderson",
      type: complaintData.type,
      staffMember: complaintData.staffMember,
      description: complaintData.description,
      anonymous: complaintData.anonymous,
      submittedDate: new Date().toISOString(),
      status: "pending",
      priority: priority,
    }

    // In real implementation:
    // 1. Save to database
    // 2. Route to appropriate personnel based on type
    // 3. Send notifications to care team
    // 4. Create audit trail

    console.log("Patient complaint submitted:", complaint)

    // Auto-route based on complaint type
    let assignedTo = "Patient Care Coordinator"
    if (complaintData.type === "care-quality") {
      assignedTo = "Director of Nursing"
    } else if (complaintData.type === "billing") {
      assignedTo = "Billing Department"
    }

    // Simulate notification to assigned personnel
    console.log(`Complaint ${complaintId} routed to: ${assignedTo}`)

    return NextResponse.json({
      success: true,
      complaintId: complaintId,
      message: "Your feedback has been submitted successfully. We will follow up within 24-48 hours.",
      assignedTo: assignedTo,
      trackingNumber: complaintId,
    })
  } catch (error) {
    console.error("Patient complaint submission error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to submit complaint. Please try again." },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    // Mock patient complaints history
    const complaints: PatientComplaint[] = [
      {
        id: "PC-001",
        patientId: "PT-12345",
        patientName: "Margaret Anderson",
        type: "compliment",
        staffMember: "sarah-johnson",
        description: "Sarah was very professional and caring during my visit. She explained everything clearly.",
        anonymous: false,
        submittedDate: "2024-01-20T10:30:00Z",
        status: "resolved",
        priority: "low",
        assignedTo: "Patient Care Coordinator",
      },
      {
        id: "PC-002",
        patientId: "PT-12345",
        patientName: "Margaret Anderson",
        type: "scheduling",
        description: "Would like to request earlier appointment times if possible.",
        anonymous: false,
        submittedDate: "2024-01-18T14:15:00Z",
        status: "under_review",
        priority: "medium",
        assignedTo: "Scheduling Coordinator",
      },
    ]

    return NextResponse.json({
      success: true,
      complaints: complaints.filter((c) => c.patientId === patientId),
    })
  } catch (error) {
    console.error("Error fetching patient complaints:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch complaints" }, { status: 500 })
  }
}
