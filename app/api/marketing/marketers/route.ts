import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, fetch from your database
    const mockMarketers = [
      {
        id: "MKT-001",
        name: "Sarah Johnson",
        email: "sarah.johnson@masepro.com",
        phone: "(555) 123-4567",
        territory: "North Dallas",
        facilitiesAssigned: 15,
        facilitiesVisited: 15,
        referrals: 45,
        admissions: 32,
        conversionRate: 71,
        avgCostPerAdmission: 85,
        totalLunchSpend: 2720,
        lastActivity: "2024-01-10T14:30:00Z",
        status: "active",
      },
      {
        id: "MKT-002",
        name: "Mike Rodriguez",
        email: "mike.rodriguez@masepro.com",
        phone: "(555) 234-5678",
        territory: "South Dallas",
        facilitiesAssigned: 12,
        facilitiesVisited: 12,
        referrals: 28,
        admissions: 18,
        conversionRate: 64,
        avgCostPerAdmission: 92,
        totalLunchSpend: 1656,
        lastActivity: "2024-01-10T11:15:00Z",
        status: "active",
      },
      {
        id: "MKT-003",
        name: "Emily Chen",
        email: "emily.chen@masepro.com",
        phone: "(555) 345-6789",
        territory: "East Dallas",
        facilitiesAssigned: 18,
        facilitiesVisited: 18,
        referrals: 38,
        admissions: 25,
        conversionRate: 66,
        avgCostPerAdmission: 78,
        totalLunchSpend: 1950,
        lastActivity: "2024-01-09T16:45:00Z",
        status: "active",
      },
    ]

    return NextResponse.json({
      success: true,
      marketers: mockMarketers,
    })
  } catch (error) {
    console.error("Error fetching marketers:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch marketers" }, { status: 500 })
  }
}
