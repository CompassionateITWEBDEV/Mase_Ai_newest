import { type NextRequest, NextResponse } from "next/server"
import { telehealthEngine } from "@/lib/telehealth-engine"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { doctorId, isAvailable, availabilityMode } = body

    // Update doctor availability in the system
    telehealthEngine.updateDoctorAvailability(doctorId, isAvailable)

    // In a real implementation, this would update the database
    console.log(`Doctor ${doctorId} availability updated:`, { isAvailable, availabilityMode })

    return NextResponse.json({
      success: true,
      message: "Availability updated successfully",
      doctorId,
      isAvailable,
      availabilityMode,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Update availability error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update availability",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get("doctorId")

    if (!doctorId) {
      return NextResponse.json(
        {
          success: false,
          message: "Doctor ID required",
        },
        { status: 400 },
      )
    }

    // In a real implementation, this would fetch from database
    return NextResponse.json({
      success: true,
      doctorId,
      isAvailable: true,
      availabilityMode: "immediate",
      lastUpdated: new Date().toISOString(),
      todayStats: {
        consultations: 12,
        earnings: 875,
        averageRating: 4.9,
        responseTime: "2.3m",
      },
    })
  } catch (error) {
    console.error("Get availability error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
