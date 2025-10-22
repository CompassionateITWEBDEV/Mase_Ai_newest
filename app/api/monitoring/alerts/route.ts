import { type NextRequest, NextResponse } from "next/server"

interface Alert {
  id: string
  type: "critical" | "warning" | "info"
  title: string
  message: string
  timestamp: string
  resolved: boolean
  category: string
  severity: number
  resolvedAt?: string
  resolvedBy?: string
}

// In-memory storage for demo purposes
// In production, this would be stored in a database
const alerts: Alert[] = [
  {
    id: "1",
    type: "critical",
    title: "Database Connection Timeout",
    message: "Primary database connection is experiencing timeouts. Response time exceeded 5 seconds.",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    resolved: false,
    category: "database",
    severity: 9,
  },
  {
    id: "2",
    type: "warning",
    title: "High Memory Usage",
    message: "System memory usage has exceeded 80% for the past 10 minutes.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    resolved: false,
    category: "system",
    severity: 6,
  },
  {
    id: "3",
    type: "info",
    title: "Scheduled Maintenance Complete",
    message: "Database maintenance window completed successfully. All services restored.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    resolved: true,
    category: "maintenance",
    severity: 2,
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
    resolvedBy: "system",
  },
  {
    id: "4",
    type: "warning",
    title: "API Rate Limit Approaching",
    message: "Axxess API integration is approaching rate limits. Current usage: 85% of daily quota.",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
    resolved: false,
    category: "integration",
    severity: 5,
  },
  {
    id: "5",
    type: "critical",
    title: "Email Service Down",
    message: "SendGrid email service is not responding. Patient notifications may be delayed.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    resolved: false,
    category: "email",
    severity: 8,
  },
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") // 'resolved', 'unresolved', or null for all
    const type = searchParams.get("type") // 'critical', 'warning', 'info', or null for all
    const category = searchParams.get("category") // filter by category
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let filteredAlerts = [...alerts]

    // Apply filters
    if (status === "resolved") {
      filteredAlerts = filteredAlerts.filter((alert) => alert.resolved)
    } else if (status === "unresolved") {
      filteredAlerts = filteredAlerts.filter((alert) => !alert.resolved)
    }

    if (type) {
      filteredAlerts = filteredAlerts.filter((alert) => alert.type === type)
    }

    if (category) {
      filteredAlerts = filteredAlerts.filter((alert) => alert.category === category)
    }

    // Sort by timestamp (newest first)
    filteredAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply limit
    filteredAlerts = filteredAlerts.slice(0, limit)

    // Calculate summary statistics
    const summary = {
      total: alerts.length,
      unresolved: alerts.filter((a) => !a.resolved).length,
      critical: alerts.filter((a) => a.type === "critical" && !a.resolved).length,
      warning: alerts.filter((a) => a.type === "warning" && !a.resolved).length,
      info: alerts.filter((a) => a.type === "info" && !a.resolved).length,
      categories: {
        system: alerts.filter((a) => a.category === "system" && !a.resolved).length,
        database: alerts.filter((a) => a.category === "database" && !a.resolved).length,
        integration: alerts.filter((a) => a.category === "integration" && !a.resolved).length,
        email: alerts.filter((a) => a.category === "email" && !a.resolved).length,
        maintenance: alerts.filter((a) => a.category === "maintenance" && !a.resolved).length,
      },
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      alerts: filteredAlerts,
      summary,
      filters: {
        status,
        type,
        category,
        limit,
      },
    })
  } catch (error) {
    console.error("Failed to fetch alerts:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch alerts",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, message, category, severity } = body

    // Validate required fields
    if (!type || !title || !message || !category) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: type, title, message, category" },
        { status: 400 },
      )
    }

    // Validate type
    if (!["critical", "warning", "info"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid alert type. Must be: critical, warning, or info" },
        { status: 400 },
      )
    }

    // Create new alert
    const newAlert: Alert = {
      id: (alerts.length + 1).toString(),
      type,
      title,
      message,
      category,
      severity: severity || 5,
      timestamp: new Date().toISOString(),
      resolved: false,
    }

    alerts.unshift(newAlert) // Add to beginning of array

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      alert: newAlert,
      message: "Alert created successfully",
    })
  } catch (error) {
    console.error("Failed to create alert:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create alert",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, resolved, resolvedBy } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Alert ID is required" }, { status: 400 })
    }

    // Find alert
    const alertIndex = alerts.findIndex((alert) => alert.id === id)
    if (alertIndex === -1) {
      return NextResponse.json({ success: false, error: "Alert not found" }, { status: 404 })
    }

    // Update alert
    if (resolved !== undefined) {
      alerts[alertIndex].resolved = resolved
      if (resolved) {
        alerts[alertIndex].resolvedAt = new Date().toISOString()
        alerts[alertIndex].resolvedBy = resolvedBy || "user"
      } else {
        delete alerts[alertIndex].resolvedAt
        delete alerts[alertIndex].resolvedBy
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      alert: alerts[alertIndex],
      message: resolved ? "Alert resolved successfully" : "Alert updated successfully",
    })
  } catch (error) {
    console.error("Failed to update alert:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update alert",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Alert ID is required" }, { status: 400 })
    }

    // Find and remove alert
    const alertIndex = alerts.findIndex((alert) => alert.id === id)
    if (alertIndex === -1) {
      return NextResponse.json({ success: false, error: "Alert not found" }, { status: 404 })
    }

    const deletedAlert = alerts.splice(alertIndex, 1)[0]

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      alert: deletedAlert,
      message: "Alert deleted successfully",
    })
  } catch (error) {
    console.error("Failed to delete alert:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete alert",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
