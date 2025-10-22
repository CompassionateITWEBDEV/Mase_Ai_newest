import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would query your database for active alerts
    const mockAlerts = [
      {
        id: "ALERT-001",
        type: "no_referrals",
        severity: "high",
        facility: "Sunset Rehabilitation",
        facilityId: "FAC-003",
        marketer: "Emily Chen",
        marketerId: "MKT-003",
        message: "No referrals received in 45+ days",
        daysOverdue: 45,
        actionRequired: true,
        createdAt: "2024-01-10T08:00:00Z",
        status: "active",
      },
      {
        id: "ALERT-002",
        type: "high_cost",
        severity: "medium",
        facility: "Community Care Center",
        facilityId: "FAC-002",
        marketer: "Mike Rodriguez",
        marketerId: "MKT-002",
        message: "Cost per admission exceeds $90 threshold",
        costPerAdmission: 95,
        threshold: 90,
        actionRequired: true,
        createdAt: "2024-01-10T09:15:00Z",
        status: "active",
      },
      {
        id: "ALERT-003",
        type: "pending_referral",
        severity: "urgent",
        facility: "Mercy General Hospital",
        facilityId: "FAC-001",
        marketer: "Sarah Johnson",
        marketerId: "MKT-001",
        message: "New referral not acted upon in 18 hours",
        hoursOverdue: 18,
        referralId: "REF-12345",
        actionRequired: true,
        createdAt: "2024-01-09T20:00:00Z",
        status: "active",
      },
      {
        id: "ALERT-004",
        type: "conversion_drop",
        severity: "medium",
        facility: "Community Care Center",
        facilityId: "FAC-002",
        marketer: "Mike Rodriguez",
        marketerId: "MKT-002",
        message: "Conversion rate dropped below 40% this month",
        currentRate: 33,
        previousRate: 55,
        threshold: 40,
        actionRequired: true,
        createdAt: "2024-01-10T07:30:00Z",
        status: "active",
      },
    ]

    return NextResponse.json({
      success: true,
      alerts: mockAlerts,
      summary: {
        total: mockAlerts.length,
        urgent: mockAlerts.filter((a) => a.severity === "urgent").length,
        high: mockAlerts.filter((a) => a.severity === "high").length,
        medium: mockAlerts.filter((a) => a.severity === "medium").length,
      },
    })
  } catch (error) {
    console.error("Error fetching alerts:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch alerts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { alertId, action } = body

    if (!alertId || !action) {
      return NextResponse.json({ success: false, error: "Alert ID and action are required" }, { status: 400 })
    }

    // In a real implementation, update the alert status in your database
    const updatedAlert = {
      id: alertId,
      status: action === "resolve" ? "resolved" : "dismissed",
      updatedAt: new Date().toISOString(),
      updatedBy: "current_user_id", // Would come from authentication
    }

    return NextResponse.json({
      success: true,
      alert: updatedAlert,
      message: `Alert ${action}d successfully`,
    })
  } catch (error) {
    console.error("Error updating alert:", error)
    return NextResponse.json({ success: false, error: "Failed to update alert" }, { status: 500 })
  }
}
