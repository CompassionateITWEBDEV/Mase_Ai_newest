import { type NextRequest, NextResponse } from "next/server"

interface MobileSyncData {
  deviceId: string
  lastSync: string
  metrics: {
    totalRevenue: number
    pendingRevenue: number
    collectionRate: number
    denialRate: number
    averageDaysToPayment: number
    todayCollections: number
    alertsCount: number
  }
  alerts: Array<{
    id: string
    type: string
    title: string
    description: string
    impact: number
    timestamp: string
    actionRequired: boolean
  }>
  quickActions: Array<{
    id: string
    title: string
    count: number
    priority: "high" | "medium" | "low"
  }>
  networkStatus: {
    isOnline: boolean
    lastOnline: string
    syncStatus: "synced" | "pending" | "error"
  }
}

interface MobileDevice {
  deviceId: string
  deviceType: "ios" | "android" | "web"
  userId: string
  lastActive: string
  pushToken?: string
  preferences: {
    notifications: boolean
    autoSync: boolean
    offlineMode: boolean
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get("deviceId")
    const userId = searchParams.get("userId")
    const includeAlerts = searchParams.get("alerts") === "true"

    if (!deviceId) {
      return NextResponse.json({ success: false, error: "Device ID required" }, { status: 400 })
    }

    console.log(`Mobile sync request for device: ${deviceId}`)

    // Simulate device lookup and data fetching
    await new Promise((resolve) => setTimeout(resolve, 300))

    const syncData: MobileSyncData = {
      deviceId,
      lastSync: new Date().toISOString(),
      metrics: {
        totalRevenue: 2450000 + Math.random() * 50000,
        pendingRevenue: 485000 + Math.random() * 25000,
        collectionRate: 94.2 + Math.random() * 2,
        denialRate: 3.8 + Math.random() * 0.5,
        averageDaysToPayment: 28.5 + Math.random() * 2,
        todayCollections: 125000 + Math.random() * 10000,
        alertsCount: Math.floor(Math.random() * 8) + 2,
      },
      alerts: includeAlerts
        ? [
            {
              id: "mobile_alert_1",
              type: "critical",
              title: "Payment Processing Delay",
              description: "Medicare payments delayed by 7 days affecting $85K in revenue",
              impact: 85000,
              timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              actionRequired: true,
            },
            {
              id: "mobile_alert_2",
              type: "high",
              title: "Denial Rate Increase",
              description: "Denial rate spiked 15% over past week due to documentation issues",
              impact: 45000,
              timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
              actionRequired: true,
            },
            {
              id: "mobile_alert_3",
              type: "medium",
              title: "Authorization Renewals Due",
              description: "8 patient authorizations expire within 3 days",
              impact: 32000,
              timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              actionRequired: true,
            },
            {
              id: "mobile_alert_4",
              type: "low",
              title: "Weekly Target Progress",
              description: "78% of weekly collection target achieved",
              impact: 0,
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              actionRequired: false,
            },
          ]
        : [],
      quickActions: [
        { id: "denials", title: "Review Denials", count: 23, priority: "high" },
        { id: "collections", title: "Today's Collections", count: 125, priority: "medium" },
        { id: "aging", title: "AR Aging", count: 485, priority: "medium" },
        { id: "calls", title: "Payer Follow-ups", count: 5, priority: "high" },
      ],
      networkStatus: {
        isOnline: true,
        lastOnline: new Date().toISOString(),
        syncStatus: "synced",
      },
    }

    return NextResponse.json({
      success: true,
      data: syncData,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Mobile sync error:", error)
    return NextResponse.json({ success: false, error: "Sync failed" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, action, data } = body

    console.log(`Mobile action: ${action} from device: ${deviceId}`)

    switch (action) {
      case "register_device":
        // Register new mobile device
        const deviceInfo: MobileDevice = {
          deviceId: data.deviceId,
          deviceType: data.deviceType || "web",
          userId: data.userId,
          lastActive: new Date().toISOString(),
          pushToken: data.pushToken,
          preferences: {
            notifications: data.preferences?.notifications ?? true,
            autoSync: data.preferences?.autoSync ?? true,
            offlineMode: data.preferences?.offlineMode ?? false,
          },
        }

        // Simulate device registration
        await new Promise((resolve) => setTimeout(resolve, 500))

        return NextResponse.json({
          success: true,
          message: "Device registered successfully",
          deviceId: deviceInfo.deviceId,
          syncInterval: 30000, // 30 seconds
        })

      case "update_preferences":
        // Update device preferences
        await new Promise((resolve) => setTimeout(resolve, 300))

        return NextResponse.json({
          success: true,
          message: "Preferences updated",
          preferences: data.preferences,
        })

      case "resolve_alert":
        // Resolve mobile alert
        const alertId = data.alertId
        await new Promise((resolve) => setTimeout(resolve, 500))

        return NextResponse.json({
          success: true,
          message: `Alert ${alertId} resolved`,
          alertId,
        })

      case "trigger_sync":
        // Manual sync trigger
        await new Promise((resolve) => setTimeout(resolve, 1000))

        return NextResponse.json({
          success: true,
          message: "Sync completed",
          lastSync: new Date().toISOString(),
          itemsSynced: Math.floor(Math.random() * 50) + 10,
        })

      case "offline_queue":
        // Handle offline actions queue
        const queuedActions = data.actions || []
        const processedActions = []

        for (const queuedAction of queuedActions) {
          // Simulate processing each queued action
          await new Promise((resolve) => setTimeout(resolve, 100))
          processedActions.push({
            id: queuedAction.id,
            status: "processed",
            timestamp: new Date().toISOString(),
          })
        }

        return NextResponse.json({
          success: true,
          message: `Processed ${processedActions.length} offline actions`,
          processedActions,
        })

      case "push_notification":
        // Send push notification
        const notification = {
          title: data.title,
          body: data.body,
          data: data.data || {},
          deviceId,
        }

        // Simulate push notification sending
        await new Promise((resolve) => setTimeout(resolve, 200))

        return NextResponse.json({
          success: true,
          message: "Push notification sent",
          notificationId: `notif_${Date.now()}`,
        })

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Mobile action error:", error)
    return NextResponse.json({ success: false, error: "Action failed" }, { status: 500 })
  }
}
