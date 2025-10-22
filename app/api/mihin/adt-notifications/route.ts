import { type NextRequest, NextResponse } from "next/server"

interface ADTNotification {
  id: string
  patientId: string
  patientName: string
  mrn: string
  eventType: "admission" | "discharge" | "transfer"
  facility: string
  facilityId: string
  department: string
  diagnosis: string[]
  primaryDiagnosis: string
  insurance: string
  insuranceId: string
  age: number
  gender: string
  address: string
  zipCode: string
  admissionDate: string
  dischargeDate?: string
  transferDate?: string
  physicianName: string
  physicianNPI: string
  estimatedLOS: number
  acuityLevel: "low" | "medium" | "high"
  homeHealthEligible: boolean
  riskScore: number
  potentialValue: number
  timestamp: string
  status: "new" | "reviewed" | "contacted" | "converted" | "dismissed"
  assignedTo?: string
  notes?: string
  contactAttempts: number
  lastContactDate?: string
}

interface MiHINStats {
  totalNotifications: number
  todayNotifications: number
  dischargeNotifications: number
  eligiblePatients: number
  contactedPatients: number
  convertedReferrals: number
  averageResponseTime: number
  conversionRate: number
  potentialRevenue: number
  facilityBreakdown: { facility: string; count: number; converted: number }[]
  diagnosisBreakdown: { diagnosis: string; count: number; eligibility: number }[]
  hourlyActivity: { hour: number; count: number }[]
}

// Mock ADT notifications database
let adtNotifications: ADTNotification[] = [
  {
    id: "adt-001",
    patientId: "PT-12345",
    patientName: "Robert Johnson",
    mrn: "MRN-789456",
    eventType: "discharge",
    facility: "Henry Ford Health System",
    facilityId: "HF-001",
    department: "Cardiology",
    diagnosis: ["I50.9 - Heart failure, unspecified", "E11.9 - Type 2 diabetes mellitus"],
    primaryDiagnosis: "I50.9 - Heart failure, unspecified",
    insurance: "Priority Health",
    insuranceId: "PH-456789",
    age: 72,
    gender: "Male",
    address: "1234 Main St, Detroit, MI 48201",
    zipCode: "48201",
    admissionDate: "2024-01-10T08:30:00Z",
    dischargeDate: "2024-01-15T14:20:00Z",
    physicianName: "Dr. Sarah Mitchell",
    physicianNPI: "1234567890",
    estimatedLOS: 5,
    acuityLevel: "high",
    homeHealthEligible: true,
    riskScore: 85,
    potentialValue: 4500,
    timestamp: "2024-01-15T14:25:00Z",
    status: "new",
    contactAttempts: 0,
  },
  {
    id: "adt-002",
    patientId: "PT-12346",
    patientName: "Mary Williams",
    mrn: "MRN-789457",
    eventType: "discharge",
    facility: "Corewell Health (Beaumont)",
    facilityId: "CW-001",
    department: "Orthopedics",
    diagnosis: ["S72.001A - Fracture of unspecified part of neck of right femur"],
    primaryDiagnosis: "S72.001A - Fracture of unspecified part of neck of right femur",
    insurance: "Medicare",
    insuranceId: "MC-123456",
    age: 78,
    gender: "Female",
    address: "5678 Oak Ave, Royal Oak, MI 48067",
    zipCode: "48067",
    admissionDate: "2024-01-12T10:15:00Z",
    dischargeDate: "2024-01-15T16:45:00Z",
    physicianName: "Dr. Michael Chen",
    physicianNPI: "2345678901",
    estimatedLOS: 3,
    acuityLevel: "medium",
    homeHealthEligible: true,
    riskScore: 78,
    potentialValue: 3200,
    timestamp: "2024-01-15T16:50:00Z",
    status: "reviewed",
    contactAttempts: 1,
    lastContactDate: "2024-01-15T17:30:00Z",
    assignedTo: "Jennifer Martinez, RN",
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get("eventType")
    const status = searchParams.get("status")
    const facility = searchParams.get("facility")
    const search = searchParams.get("search")

    let filteredNotifications = [...adtNotifications]

    // Apply filters
    if (eventType && eventType !== "all") {
      filteredNotifications = filteredNotifications.filter((n) => n.eventType === eventType)
    }

    if (status && status !== "all") {
      filteredNotifications = filteredNotifications.filter((n) => n.status === status)
    }

    if (facility && facility !== "all") {
      filteredNotifications = filteredNotifications.filter((n) =>
        n.facility.toLowerCase().includes(facility.toLowerCase()),
      )
    }

    if (search) {
      filteredNotifications = filteredNotifications.filter(
        (n) =>
          n.patientName.toLowerCase().includes(search.toLowerCase()) ||
          n.facility.toLowerCase().includes(search.toLowerCase()) ||
          n.primaryDiagnosis.toLowerCase().includes(search.toLowerCase()),
      )
    }

    // Calculate stats
    const stats: MiHINStats = {
      totalNotifications: adtNotifications.length,
      todayNotifications: adtNotifications.filter((n) => {
        const today = new Date().toDateString()
        return new Date(n.timestamp).toDateString() === today
      }).length,
      dischargeNotifications: adtNotifications.filter((n) => n.eventType === "discharge").length,
      eligiblePatients: adtNotifications.filter((n) => n.homeHealthEligible).length,
      contactedPatients: adtNotifications.filter((n) => n.contactAttempts > 0).length,
      convertedReferrals: adtNotifications.filter((n) => n.status === "converted").length,
      averageResponseTime: 18,
      conversionRate: 53.3,
      potentialRevenue: adtNotifications.reduce((sum, n) => sum + (n.homeHealthEligible ? n.potentialValue : 0), 0),
      facilityBreakdown: [
        { facility: "Henry Ford Health System", count: 8, converted: 5 },
        { facility: "Corewell Health (Beaumont)", count: 6, converted: 3 },
        { facility: "University of Michigan Health", count: 4, converted: 2 },
        { facility: "Ascension Michigan", count: 5, converted: 1 },
      ],
      diagnosisBreakdown: [
        { diagnosis: "Heart Failure", count: 6, eligibility: 95 },
        { diagnosis: "Hip Fracture", count: 4, eligibility: 88 },
        { diagnosis: "COPD", count: 5, eligibility: 92 },
        { diagnosis: "Stroke", count: 3, eligibility: 85 },
      ],
      hourlyActivity: [
        { hour: 8, count: 2 },
        { hour: 9, count: 4 },
        { hour: 10, count: 3 },
        { hour: 11, count: 5 },
        { hour: 12, count: 2 },
        { hour: 13, count: 1 },
        { hour: 14, count: 3 },
        { hour: 15, count: 2 },
        { hour: 16, count: 4 },
        { hour: 17, count: 1 },
      ],
    }

    return NextResponse.json({
      success: true,
      data: {
        notifications: filteredNotifications,
        stats,
        total: filteredNotifications.length,
      },
    })
  } catch (error) {
    console.error("Error fetching ADT notifications:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch ADT notifications" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, notificationId, data } = body

    switch (action) {
      case "contact":
        // Update notification status to contacted
        adtNotifications = adtNotifications.map((n) =>
          n.id === notificationId
            ? {
                ...n,
                status: "contacted",
                contactAttempts: n.contactAttempts + 1,
                lastContactDate: new Date().toISOString(),
                assignedTo: data?.assignedTo || "Current User",
                notes: data?.notes || n.notes,
              }
            : n,
        )
        break

      case "convert":
        // Mark as converted referral
        adtNotifications = adtNotifications.map((n) =>
          n.id === notificationId
            ? {
                ...n,
                status: "converted",
                notes: data?.notes || n.notes,
              }
            : n,
        )
        break

      case "dismiss":
        // Dismiss notification
        adtNotifications = adtNotifications.map((n) =>
          n.id === notificationId
            ? {
                ...n,
                status: "dismissed",
                notes: data?.notes || n.notes,
              }
            : n,
        )
        break

      case "assign":
        // Assign to user
        adtNotifications = adtNotifications.map((n) =>
          n.id === notificationId
            ? {
                ...n,
                assignedTo: data?.assignedTo,
                status: "reviewed",
              }
            : n,
        )
        break

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Notification ${action} successful`,
    })
  } catch (error) {
    console.error("Error updating ADT notification:", error)
    return NextResponse.json({ success: false, error: "Failed to update notification" }, { status: 500 })
  }
}
