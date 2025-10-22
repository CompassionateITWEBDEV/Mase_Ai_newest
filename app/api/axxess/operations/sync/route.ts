import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const operationsData = {
      operations: {
        activeStaff: 89,
        scheduledVisits: 247,
        pendingOrders: 12,
        completedToday: 156,
      },
      syncStatus: {
        axxess: { connected: true, lastSync: new Date() },
        billing: { connected: true, lastSync: new Date() },
        orders: { connected: true, lastSync: new Date() },
      },
    }

    return NextResponse.json(operationsData)
  } catch (error) {
    console.error("Error syncing operations data:", error)
    return NextResponse.json({ error: "Failed to sync operations data" }, { status: 500 })
  }
}
