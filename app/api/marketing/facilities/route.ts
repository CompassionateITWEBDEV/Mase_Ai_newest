import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, fetch from your database
    const mockFacilities = [
      {
        id: "FAC-001",
        name: "Mercy General Hospital",
        assignedMarketer: "Sarah Johnson",
        lastVisitDate: "2024-01-08",
        referralsThisMonth: 12,
        referralsAdmitted: 8,
        status: "hot",
        address: "123 Medical Center Dr, Dallas, TX 75201",
        phone: "(214) 555-0123",
        contactPerson: "Dr. Michael Smith",
        notes: "High-volume referrer, excellent relationship",
        zipCode: "75201",
        lunchCosts: 450,
        conversionRate: 67,
        qrCodeGenerated: true,
        lastLunchDate: "2024-01-08",
      },
      {
        id: "FAC-002",
        name: "Community Care Center",
        assignedMarketer: "Mike Rodriguez",
        lastVisitDate: "2024-01-05",
        referralsThisMonth: 6,
        referralsAdmitted: 2,
        status: "warning",
        address: "456 Healthcare Blvd, Dallas, TX 75202",
        phone: "(214) 555-0456",
        contactPerson: "Nurse Manager Lisa Brown",
        notes: "Conversion rate declining, needs attention",
        zipCode: "75202",
        lunchCosts: 280,
        conversionRate: 33,
        qrCodeGenerated: false,
        lastLunchDate: "2024-01-02",
      },
      {
        id: "FAC-003",
        name: "Sunset Rehabilitation",
        assignedMarketer: "Emily Chen",
        lastVisitDate: "2023-12-20",
        referralsThisMonth: 2,
        referralsAdmitted: 0,
        status: "cold",
        address: "789 Recovery Way, Dallas, TX 75203",
        phone: "(214) 555-0789",
        contactPerson: "Administrator John Davis",
        notes: "No recent activity, needs re-engagement",
        zipCode: "75203",
        lunchCosts: 150,
        conversionRate: 0,
        qrCodeGenerated: true,
        lastLunchDate: "2023-12-15",
      },
    ]

    return NextResponse.json({
      success: true,
      facilities: mockFacilities,
    })
  } catch (error) {
    console.error("Error fetching facilities:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch facilities" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // In a real implementation, you would:
    // 1. Validate the facility data
    // 2. Save to your database
    // 3. Generate initial QR code if requested

    const facilityData = {
      id: `FAC-${Date.now()}`,
      name: body.name,
      assignedMarketer: body.assignedMarketer,
      address: body.address,
      phone: body.phone,
      contactPerson: body.contactPerson,
      notes: body.notes || "",
      zipCode: body.zipCode,
      status: "new",
      referralsThisMonth: 0,
      referralsAdmitted: 0,
      conversionRate: 0,
      lunchCosts: 0,
      qrCodeGenerated: false,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      facility: facilityData,
    })
  } catch (error) {
    console.error("Error creating facility:", error)
    return NextResponse.json({ success: false, error: "Failed to create facility" }, { status: 500 })
  }
}
