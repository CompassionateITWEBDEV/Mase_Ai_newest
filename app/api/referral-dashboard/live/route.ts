import { type NextRequest, NextResponse } from "next/server"

interface Referral {
  id: string
  patientName: string
  diagnosis: string
  source: "email" | "fax" | "extendedcare" | "phone" | "axxess"
  insurance: string
  urgency: "STAT" | "Urgent" | "Routine"
  status: "processing" | "accepted" | "review" | "rejected"
  confidence: number
  estimatedValue: number
  receivedAt: string
  processedAt?: string
  assignedTo?: string
  reasonCode?: string
  axxessId?: string
}

// Enhanced mock data with Axxess integration
const mockReferrals: Referral[] = [
  {
    id: "REF-001",
    patientName: "Dorothy Martinez",
    diagnosis: "Wound Care - Stage 3 Pressure Ulcer",
    source: "email",
    insurance: "Medicare",
    urgency: "STAT",
    status: "processing",
    confidence: 0,
    estimatedValue: 3200,
    receivedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "REF-002",
    patientName: "Robert Williams",
    diagnosis: "Post-Surgical Care - Hip Replacement",
    source: "fax",
    insurance: "Medicaid",
    urgency: "Urgent",
    status: "accepted",
    confidence: 92,
    estimatedValue: 2800,
    receivedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    processedAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    assignedTo: "Sarah Johnson, RN",
  },
  {
    id: "REF-003",
    patientName: "Emily Chen",
    diagnosis: "Diabetes Management",
    source: "extendedcare",
    insurance: "Humana",
    urgency: "Routine",
    status: "review",
    confidence: 72,
    estimatedValue: 1900,
    receivedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    processedAt: new Date(Date.now() - 13 * 60 * 1000).toISOString(),
    reasonCode: "Distance verification needed",
  },
  {
    id: "REF-004",
    patientName: "James Rodriguez",
    diagnosis: "COPD Management",
    source: "phone",
    insurance: "Aetna",
    urgency: "Urgent",
    status: "rejected",
    confidence: 45,
    estimatedValue: 0,
    receivedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    processedAt: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
    reasonCode: "Outside service area",
  },
  {
    id: "REF-005",
    patientName: "Premium Care Patient",
    diagnosis: "Complex Wound Care with IV Therapy",
    source: "email",
    insurance: "Commercial",
    urgency: "Urgent",
    status: "accepted",
    confidence: 95,
    estimatedValue: 8500,
    receivedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    processedAt: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
    assignedTo: "Lisa Chen, RN",
  },
  // Axxess integrated referrals
  {
    id: "AX-PT-001",
    patientName: "Helen Rodriguez",
    diagnosis: "Post-stroke rehabilitation, dysphagia",
    source: "axxess",
    insurance: "Medicare",
    urgency: "Urgent",
    status: "accepted",
    confidence: 88,
    estimatedValue: 2650,
    receivedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    processedAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    assignedTo: "Patricia Wilson, RN",
    axxessId: "AX-12348",
  },
  {
    id: "AX-PT-002",
    patientName: "William Chen",
    diagnosis: "COPD exacerbation, medication management",
    source: "axxess",
    insurance: "Medicare Advantage",
    urgency: "Urgent",
    status: "review",
    confidence: 82,
    estimatedValue: 3450,
    receivedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    processedAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    axxessId: "AX-12349",
    reasonCode: "LUPA threshold verification needed",
  },
]

// Simulate live updates by updating statuses
let liveReferrals = [...mockReferrals]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get("source")
    const status = searchParams.get("status")
    const urgency = searchParams.get("urgency")
    const search = searchParams.get("search")

    // Simulate processing updates
    liveReferrals = liveReferrals.map((referral) => {
      if (referral.status === "processing" && Math.random() > 0.7) {
        const confidence = Math.floor(Math.random() * 40) + 60
        let newStatus: "accepted" | "review" | "rejected" = "accepted"

        if (confidence >= 85) {
          newStatus = "accepted"
          referral.assignedTo = ["Sarah Johnson, RN", "Mike Davis, LPN", "Lisa Chen, RN"][Math.floor(Math.random() * 3)]
        } else if (confidence >= 70) {
          newStatus = "review"
          referral.reasonCode = [
            "Insurance verification needed",
            "Distance check required",
            "Service availability review",
          ][Math.floor(Math.random() * 3)]
        } else {
          newStatus = "rejected"
          referral.estimatedValue = 0
          referral.reasonCode = ["Outside service area", "Insurance not accepted", "Capacity unavailable"][
            Math.floor(Math.random() * 3)
          ]
        }

        return {
          ...referral,
          status: newStatus,
          confidence,
          processedAt: new Date().toISOString(),
        }
      }
      return referral
    })

    let filteredReferrals = [...liveReferrals]

    // Apply filters
    if (source && source !== "all") {
      filteredReferrals = filteredReferrals.filter((r) => r.source === source)
    }

    if (status && status !== "all") {
      filteredReferrals = filteredReferrals.filter((r) => r.status === status)
    }

    if (urgency && urgency !== "all") {
      filteredReferrals = filteredReferrals.filter((r) => r.urgency === urgency)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredReferrals = filteredReferrals.filter(
        (r) =>
          r.patientName.toLowerCase().includes(searchLower) ||
          r.diagnosis.toLowerCase().includes(searchLower) ||
          r.insurance.toLowerCase().includes(searchLower) ||
          (r.axxessId && r.axxessId.toLowerCase().includes(searchLower)),
      )
    }

    // Sort by received time (newest first)
    filteredReferrals.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())

    // Calculate statistics
    const stats = {
      total: liveReferrals.length,
      accepted: liveReferrals.filter((r) => r.status === "accepted").length,
      review: liveReferrals.filter((r) => r.status === "review").length,
      rejected: liveReferrals.filter((r) => r.status === "rejected").length,
      processing: liveReferrals.filter((r) => r.status === "processing").length,
      totalValue: liveReferrals.filter((r) => r.status === "accepted").reduce((sum, r) => sum + r.estimatedValue, 0),
      acceptanceRate:
        liveReferrals.length > 0
          ? (liveReferrals.filter((r) => r.status === "accepted").length / liveReferrals.length) * 100
          : 0,
      avgProcessingTime: 1.3,
      sourceBreakdown: {
        email: liveReferrals.filter((r) => r.source === "email").length,
        fax: liveReferrals.filter((r) => r.source === "fax").length,
        extendedcare: liveReferrals.filter((r) => r.source === "extendedcare").length,
        phone: liveReferrals.filter((r) => r.source === "phone").length,
        axxess: liveReferrals.filter((r) => r.source === "axxess").length,
      },
    }

    return NextResponse.json({
      success: true,
      data: {
        referrals: filteredReferrals,
        stats,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error fetching live referrals:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch live referrals" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, referralId, data } = body

    // Find and update referral
    const referralIndex = liveReferrals.findIndex((r) => r.id === referralId)
    if (referralIndex === -1) {
      return NextResponse.json({ success: false, error: "Referral not found" }, { status: 404 })
    }

    const referral = liveReferrals[referralIndex]

    switch (action) {
      case "accept":
        liveReferrals[referralIndex] = {
          ...referral,
          status: "accepted",
          confidence: data?.confidence || 95,
          assignedTo: data?.assignedTo || "Auto-assigned",
          processedAt: new Date().toISOString(),
        }
        console.log(`Accepting referral ${referralId}`)
        break

      case "reject":
        liveReferrals[referralIndex] = {
          ...referral,
          status: "rejected",
          estimatedValue: 0,
          reasonCode: data?.reason || "Manual rejection",
          processedAt: new Date().toISOString(),
        }
        console.log(`Rejecting referral ${referralId}`)
        break

      case "review":
        liveReferrals[referralIndex] = {
          ...referral,
          status: "review",
          reasonCode: data?.reason || "Manual review requested",
          processedAt: new Date().toISOString(),
        }
        console.log(`Marking referral ${referralId} for review`)
        break

      case "assign":
        liveReferrals[referralIndex] = {
          ...referral,
          assignedTo: data?.staffMember,
          processedAt: new Date().toISOString(),
        }
        console.log(`Assigning referral ${referralId} to ${data?.staffMember}`)
        break

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Referral ${action} completed successfully`,
      referral: liveReferrals[referralIndex],
    })
  } catch (error) {
    console.error("Error processing referral action:", error)
    return NextResponse.json({ success: false, error: "Failed to process referral action" }, { status: 500 })
  }
}
