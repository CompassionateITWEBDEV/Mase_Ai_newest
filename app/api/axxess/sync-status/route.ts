import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const axxessStatus = {
      connected: true,
      lastSync: new Date().toISOString(),
      syncInProgress: false,
      modules: {
        billing: { status: "active", lastSync: new Date().toISOString() },
        orders: { status: "active", lastSync: new Date().toISOString() },
        patients: { status: "active", lastSync: new Date().toISOString() },
        referrals: { status: "active", lastSync: new Date().toISOString() },
        authorization: { status: "active", lastSync: new Date().toISOString() },
      },
    }

    return NextResponse.json(axxessStatus)
  } catch (error) {
    console.error("Error checking Axxess sync status:", error)
    return NextResponse.json({ error: "Failed to check sync status" }, { status: 500 })
  }
}
