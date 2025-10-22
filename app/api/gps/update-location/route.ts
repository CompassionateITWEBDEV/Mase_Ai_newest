import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { staffId, latitude, longitude, accuracy, speed, heading } = await request.json()

    if (!staffId || !latitude || !longitude) {
      return NextResponse.json({ error: "Staff ID, latitude, and longitude are required" }, { status: 400 })
    }

    // In a real app, you would save this to your database
    const locationUpdate = {
      staffId,
      location: {
        latitude: Number.parseFloat(latitude),
        longitude: Number.parseFloat(longitude),
        accuracy: accuracy || 0,
        speed: speed || 0,
        heading: heading || 0,
        timestamp: new Date().toISOString(),
      },
    }

    // Here you would typically:
    // 1. Save to database
    // 2. Update real-time tracking system
    // 3. Calculate route efficiency
    // 4. Send notifications if needed

    console.log("Location update received:", locationUpdate)

    // Mock response
    return NextResponse.json({
      success: true,
      message: "Location updated successfully",
      data: locationUpdate,
    })
  } catch (error) {
    console.error("Error updating location:", error)
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
  }
}
