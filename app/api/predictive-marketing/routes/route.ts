import { type NextRequest, NextResponse } from "next/server"

interface MarketingRoute {
  id: string
  marketerId: string
  marketerName: string
  date: string
  patients: string[]
  facilities: string[]
  estimatedDriveTime: number
  totalMiles: number
  priority: "high" | "medium" | "low"
  status: "planned" | "active" | "completed"
  completedContacts: number
  successfulContacts: number
  securedReferrals: number
  optimizationScore: number
  waypoints: {
    facilityId: string
    facilityName: string
    address: string
    estimatedArrival: string
    estimatedDuration: number
    patientIds: string[]
  }[]
}

// Mock routes database
let marketingRoutes: MarketingRoute[] = [
  {
    id: "route-001",
    marketerId: "MKT-001",
    marketerName: "Sarah Johnson",
    date: "2024-01-16",
    patients: ["pred-001"],
    facilities: ["Henry Ford Health System"],
    estimatedDriveTime: 45,
    totalMiles: 25,
    priority: "high",
    status: "planned",
    completedContacts: 0,
    successfulContacts: 0,
    securedReferrals: 0,
    optimizationScore: 92,
    waypoints: [
      {
        facilityId: "HF-001",
        facilityName: "Henry Ford Health System",
        address: "2799 W Grand Blvd, Detroit, MI 48202",
        estimatedArrival: "10:00 AM",
        estimatedDuration: 45,
        patientIds: ["pred-001"],
      },
    ],
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const marketerId = searchParams.get("marketerId")
    const date = searchParams.get("date")
    const status = searchParams.get("status")

    let filteredRoutes = [...marketingRoutes]

    if (marketerId) {
      filteredRoutes = filteredRoutes.filter((r) => r.marketerId === marketerId)
    }

    if (date) {
      filteredRoutes = filteredRoutes.filter((r) => r.date === date)
    }

    if (status) {
      filteredRoutes = filteredRoutes.filter((r) => r.status === status)
    }

    return NextResponse.json({
      success: true,
      data: {
        routes: filteredRoutes,
        total: filteredRoutes.length,
      },
    })
  } catch (error) {
    console.error("Error fetching marketing routes:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch routes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, routeId, data } = body

    switch (action) {
      case "optimize":
        // Generate optimized route
        const optimizedRoute: MarketingRoute = {
          id: `route-${Date.now()}`,
          marketerId: data.marketerId,
          marketerName: data.marketerName,
          date: data.date,
          patients: data.patientIds || [],
          facilities: data.facilities || [],
          estimatedDriveTime: Math.floor(Math.random() * 120) + 30, // Mock calculation
          totalMiles: Math.floor(Math.random() * 50) + 10, // Mock calculation
          priority: data.priority || "medium",
          status: "planned",
          completedContacts: 0,
          successfulContacts: 0,
          securedReferrals: 0,
          optimizationScore: Math.floor(Math.random() * 20) + 80, // Mock score
          waypoints: data.waypoints || [],
        }

        marketingRoutes.push(optimizedRoute)

        return NextResponse.json({
          success: true,
          route: optimizedRoute,
          message: "Route optimized successfully",
        })

      case "start":
        // Start route execution
        marketingRoutes = marketingRoutes.map((r) =>
          r.id === routeId
            ? {
                ...r,
                status: "active",
              }
            : r,
        )
        break

      case "complete":
        // Complete route
        marketingRoutes = marketingRoutes.map((r) =>
          r.id === routeId
            ? {
                ...r,
                status: "completed",
                completedContacts: data?.completedContacts || r.completedContacts,
                successfulContacts: data?.successfulContacts || r.successfulContacts,
                securedReferrals: data?.securedReferrals || r.securedReferrals,
              }
            : r,
        )
        break

      case "update_progress":
        // Update route progress
        marketingRoutes = marketingRoutes.map((r) =>
          r.id === routeId
            ? {
                ...r,
                completedContacts: data?.completedContacts || r.completedContacts,
                successfulContacts: data?.successfulContacts || r.successfulContacts,
                securedReferrals: data?.securedReferrals || r.securedReferrals,
              }
            : r,
        )
        break

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Route ${action} successful`,
    })
  } catch (error) {
    console.error("Error processing route action:", error)
    return NextResponse.json({ success: false, error: "Failed to process route action" }, { status: 500 })
  }
}
