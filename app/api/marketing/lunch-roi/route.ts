import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ["facility", "marketer", "lunchDate", "lunchCost"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const lunchROIData = {
      id: `LUNCH-${Date.now()}`,
      facility: body.facility,
      marketer: body.marketer,
      lunchDate: body.lunchDate,
      lunchCost: Number.parseFloat(body.lunchCost),
      attendees: body.attendees || 1,
      lunchType: body.lunchType || "business",
      notes: body.notes || "",
      referralsIn30Days: 0, // Will be calculated based on actual referrals
      admissionsIn30Days: 0, // Will be calculated based on actual admissions
      costPerLead: 0,
      costPerAdmission: 0,
      createdAt: new Date().toISOString(),
    }

    // In a real implementation, you would:
    // 1. Save to database
    // 2. Calculate ROI metrics based on historical data
    // 3. Set up tracking for future referrals from this facility

    return NextResponse.json({
      success: true,
      lunchROI: lunchROIData,
      message: "Lunch ROI entry created successfully",
    })
  } catch (error) {
    console.error("Error creating lunch ROI entry:", error)
    return NextResponse.json({ success: false, error: "Failed to create lunch ROI entry" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, fetch from your database
    const mockLunchROI = [
      {
        id: "LUNCH-001",
        facility: "Mercy General Hospital",
        marketer: "Sarah Johnson",
        lunchDate: "2024-01-08",
        lunchCost: 125,
        attendees: 4,
        lunchType: "business",
        referralsIn30Days: 8,
        admissionsIn30Days: 6,
        costPerLead: 15.63,
        costPerAdmission: 20.83,
        notes: "Great meeting with discharge planning team",
        createdAt: "2024-01-08T12:00:00Z",
      },
      {
        id: "LUNCH-002",
        facility: "Community Care Center",
        marketer: "Mike Rodriguez",
        lunchDate: "2024-01-05",
        lunchCost: 95,
        attendees: 3,
        lunchType: "business",
        referralsIn30Days: 3,
        admissionsIn30Days: 1,
        costPerLead: 31.67,
        costPerAdmission: 95.0,
        notes: "Need to follow up on discharge criteria",
        createdAt: "2024-01-05T12:30:00Z",
      },
      {
        id: "LUNCH-003",
        facility: "Sunset Rehabilitation",
        marketer: "Emily Chen",
        lunchDate: "2023-12-15",
        lunchCost: 85,
        attendees: 2,
        lunchType: "relationship",
        referralsIn30Days: 1,
        admissionsIn30Days: 0,
        costPerLead: 85.0,
        costPerAdmission: 0,
        notes: "Relationship building lunch, no immediate referrals expected",
        createdAt: "2023-12-15T13:00:00Z",
      },
    ]

    return NextResponse.json({
      success: true,
      lunchROI: mockLunchROI,
    })
  } catch (error) {
    console.error("Error fetching lunch ROI data:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch lunch ROI data" }, { status: 500 })
  }
}
