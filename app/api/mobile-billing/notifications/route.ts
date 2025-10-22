import { type NextRequest, NextResponse } from "next/server"

interface PushNotification {
  id: string
  title: string
  body: string
  data: Record<string, any>
  priority: "high" | "normal" | "low"
  category: "alert" | "update" | "reminder" | "achievement"
  targetDevices: string[]
  scheduledFor?: string
  expiresAt?: string
  actionButtons?: Array<{
    id: string
    title: string
    action: string
  }>
}

interface NotificationTemplate {
  id: string
  name: string
  title: string
  body: string
  category: string
  triggers: string[]
  conditions: Record<string, any>
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get("deviceId")
    const category = searchParams.get("category")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    console.log(`Fetching notifications for device: ${deviceId}`)

    // Simulate fetching notifications
    await new Promise((resolve) => setTimeout(resolve, 300))

    const notifications: PushNotification[] = [
      {
        id: "notif_1",
        title: "🚨 Critical Alert",
        body: "Payment processing delayed - $85K affected",
        data: {
          alertId: "alert_payment_delay",
          impact: 85000,
          actionRequired: true,
          deepLink: "/mobile-billing?tab=alerts&alert=alert_payment_delay",
        },
        priority: "high",
        category: "alert",
        targetDevices: [deviceId || "all"],
        actionButtons: [
          { id: "view", title: "View Details", action: "open_alert" },
          { id: "resolve", title: "Mark Resolved", action: "resolve_alert" },
        ],
      },
      {
        id: "notif_2",
        title: "📈 Daily Target Achieved",
        body: "Congratulations! Today's collection target of $120K reached",
        data: {
          achievement: "daily_target",
          amount: 125000,
          target: 120000,
          deepLink: "/mobile-billing?tab=dashboard",
        },
        priority: "normal",
        category: "achievement",
        targetDevices: [deviceId || "all"],
        actionButtons: [{ id: "view", title: "View Dashboard", action: "open_dashboard" }],
      },
      {
        id: "notif_3",
        title: "⏰ Authorization Reminder",
        body: "8 patient authorizations expire in 3 days",
        data: {
          reminder: "authorization_expiry",
          count: 8,
          daysUntilExpiry: 3,
          deepLink: "/mobile-billing?tab=actions&action=authorizations",
        },
        priority: "normal",
        category: "reminder",
        targetDevices: [deviceId || "all"],
        actionButtons: [
          { id: "view", title: "Review", action: "open_authorizations" },
          { id: "snooze", title: "Remind Tomorrow", action: "snooze_reminder" },
        ],
      },
      {
        id: "notif_4",
        title: "📊 Weekly Report Ready",
        body: "Your billing performance report for this week is available",
        data: {
          report: "weekly_performance",
          weekEnding: new Date().toISOString(),
          deepLink: "/mobile-billing?tab=analytics&report=weekly",
        },
        priority: "low",
        category: "update",
        targetDevices: [deviceId || "all"],
        actionButtons: [{ id: "view", title: "View Report", action: "open_report" }],
      },
      {
        id: "notif_5",
        title: "🔄 Sync Complete",
        body: "Latest billing data synchronized successfully",
        data: {
          sync: "completed",
          itemsSynced: 47,
          lastSync: new Date().toISOString(),
        },
        priority: "low",
        category: "update",
        targetDevices: [deviceId || "all"],
      },
    ]

    const filteredNotifications = category ? notifications.filter((n) => n.category === category) : notifications

    return NextResponse.json({
      success: true,
      notifications: filteredNotifications.slice(0, limit),
      total: filteredNotifications.length,
      unreadCount: filteredNotifications.filter((n) => n.priority === "high").length,
    })
  } catch (error) {
    console.error("Fetch notifications error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    console.log(`Notification action: ${action}`)

    switch (action) {
      case "send_notification":
        // Send immediate push notification
        const notification: PushNotification = {
          id: `notif_${Date.now()}`,
          title: data.title,
          body: data.body,
          data: data.data || {},
          priority: data.priority || "normal",
          category: data.category || "update",
          targetDevices: data.targetDevices || ["all"],
          actionButtons: data.actionButtons,
        }

        // Simulate sending push notification
        await new Promise((resolve) => setTimeout(resolve, 500))

        return NextResponse.json({
          success: true,
          message: "Notification sent successfully",
          notificationId: notification.id,
          targetDevices: notification.targetDevices.length,
        })

      case "schedule_notification":
        // Schedule notification for later
        const scheduledNotification: PushNotification = {
          id: `scheduled_${Date.now()}`,
          title: data.title,
          body: data.body,
          data: data.data || {},
          priority: data.priority || "normal",
          category: data.category || "reminder",
          targetDevices: data.targetDevices || ["all"],
          scheduledFor: data.scheduledFor,
          expiresAt: data.expiresAt,
          actionButtons: data.actionButtons,
        }

        await new Promise((resolve) => setTimeout(resolve, 300))

        return NextResponse.json({
          success: true,
          message: "Notification scheduled successfully",
          notificationId: scheduledNotification.id,
          scheduledFor: scheduledNotification.scheduledFor,
        })

      case "mark_read":
        // Mark notifications as read
        const notificationIds = data.notificationIds || []
        await new Promise((resolve) => setTimeout(resolve, 200))

        return NextResponse.json({
          success: true,
          message: `Marked ${notificationIds.length} notifications as read`,
          markedIds: notificationIds,
        })

      case "update_preferences":
        // Update notification preferences
        const preferences = {
          enabled: data.enabled ?? true,
          categories: data.categories || ["alert", "reminder", "achievement"],
          quietHours: data.quietHours || { start: "22:00", end: "07:00" },
          sound: data.sound ?? true,
          vibration: data.vibration ?? true,
          badge: data.badge ?? true,
        }

        await new Promise((resolve) => setTimeout(resolve, 300))

        return NextResponse.json({
          success: true,
          message: "Notification preferences updated",
          preferences,
        })

      case "register_token":
        // Register device push token
        const deviceToken = data.token
        const deviceId = data.deviceId
        const platform = data.platform || "web"

        await new Promise((resolve) => setTimeout(resolve, 400))

        return NextResponse.json({
          success: true,
          message: "Push token registered successfully",
          deviceId,
          platform,
          tokenRegistered: true,
        })

      case "test_notification":
        // Send test notification
        const testNotification = {
          title: "🧪 Test Notification",
          body: "This is a test notification from your billing mobile app",
          data: { test: true, timestamp: new Date().toISOString() },
          priority: "normal" as const,
          category: "update" as const,
        }

        await new Promise((resolve) => setTimeout(resolve, 200))

        return NextResponse.json({
          success: true,
          message: "Test notification sent",
          notification: testNotification,
        })

      case "bulk_send":
        // Send bulk notifications
        const notifications = data.notifications || []
        const results = []

        for (const notif of notifications) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          results.push({
            id: `bulk_${Date.now()}_${Math.random()}`,
            status: "sent",
            targetDevices: notif.targetDevices?.length || 1,
          })
        }

        return NextResponse.json({
          success: true,
          message: `Sent ${results.length} bulk notifications`,
          results,
          totalDevicesReached: results.reduce((sum, r) => sum + r.targetDevices, 0),
        })

      default:
        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Notification action error:", error)
    return NextResponse.json({ success: false, error: "Action failed" }, { status: 500 })
  }
}
