import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { staffId: string } }) {
  try {
    const staffId = params.staffId

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }

    // In a real app, fetch from database
    // This would get the latest location data for the staff member
    const mockStaffLocation = {
      staffId,
      name: getStaffName(staffId),
      currentLocation: {
        latitude: 34.0522 + (Math.random() - 0.5) * 0.02,
        longitude: -118.2437 + (Math.random() - 0.5) * 0.02,
        accuracy: 5,
        timestamp: new Date().toISOString(),
      },
      status: getRandomStatus(),
      currentSpeed: Math.floor(Math.random() * 60),
      heading: Math.floor(Math.random() * 360),
      nextAppointment: {
        patientName: "Margaret Anderson",
        address: "123 Main St, Los Angeles, CA",
        scheduledTime: new Date(Date.now() + 30 * 60000).toISOString(), // 30 minutes from now
        estimatedArrival: new Date(Date.now() + 25 * 60000).toISOString(), // 25 minutes from now
      },
      todayStats: {
        totalMiles: Math.floor(Math.random() * 50) + 10,
        totalDriveTime: Math.floor(Math.random() * 120) + 30, // minutes
        totalVisits: Math.floor(Math.random() * 8) + 2,
        efficiencyScore: Math.floor(Math.random() * 20) + 80,
      },
    }

    return NextResponse.json({
      success: true,
      data: mockStaffLocation,
    })
  } catch (error) {
    console.error("Error fetching staff location:", error)
    return NextResponse.json({ error: "Failed to fetch staff location" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { staffId: string } }) {
  try {
    const staffId = params.staffId
    const { action, data } = await request.json()

    switch (action) {
      case "send_eta_update":
        await sendETAUpdateToPatient(staffId, data.patientId, data.newETA)
        break
      case "request_location_share":
        await requestLocationShare(staffId, data.patientId)
        break
      case "optimize_route":
        const optimizedRoute = await optimizeRoute(staffId, data.destinations)
        return NextResponse.json({
          success: true,
          data: optimizedRoute,
        })
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Action ${action} completed successfully`,
    })
  } catch (error) {
    console.error("Error processing staff location action:", error)
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 })
  }
}

function getStaffName(staffId: string): string {
  const names = {
    "RN-2024-001": "Sarah Johnson",
    "PT-2024-001": "Michael Chen",
    "OT-2024-001": "Emily Davis",
    "LPN-2024-001": "Lisa Garcia",
  }
  return names[staffId as keyof typeof names] || "Unknown Staff"
}

function getRandomStatus(): string {
  const statuses = ["En Route", "On Visit", "Idle", "Driving"]
  return statuses[Math.floor(Math.random() * statuses.length)]
}

async function sendETAUpdateToPatient(staffId: string, patientId: string, newETA: string) {
  // Send SMS via Twilio or push notification
  console.log(`Sending ETA update to patient ${patientId}: Staff ${staffId} will arrive at ${newETA}`)
}

async function requestLocationShare(staffId: string, patientId: string) {
  // Send location sharing link to patient
  const locationLink = `${process.env.NEXT_PUBLIC_APP_URL}/track/${staffId}`
  console.log(`Sending location link to patient ${patientId}: ${locationLink}`)
}

async function optimizeRoute(staffId: string, destinations: any[]) {
  // Use routing algorithm to optimize the order of visits
  return {
    optimizedOrder: destinations.sort(() => Math.random() - 0.5),
    estimatedTimeSaved: Math.floor(Math.random() * 30) + 10,
    estimatedMilesSaved: Math.floor(Math.random() * 10) + 2,
  }
}
