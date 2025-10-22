import { type NextRequest, NextResponse } from "next/server"

interface ReportRequest {
  period: string
  type: string
  includeCharts: boolean
  includeStaffMetrics: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: ReportRequest = await request.json()
    const { period, type, includeCharts, includeStaffMetrics } = body

    console.log("Generating alert report:", {
      period,
      type,
      includeCharts,
      includeStaffMetrics,
      timestamp: new Date().toISOString(),
    })

    // Mock data - in real implementation, query your database
    const reportData = await generateReportData(period, type)
    const htmlReport = generateHTMLReport(reportData, type, includeCharts, includeStaffMetrics)

    return NextResponse.json({
      success: true,
      reportData: htmlReport,
      metadata: {
        period,
        type,
        generatedAt: new Date().toISOString(),
        recordCount: reportData.totalAlerts,
      },
    })
  } catch (error) {
    console.error("Error generating alert report:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate alert report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function generateReportData(period: string, type: string) {
  // Mock data generation - replace with actual database queries
  const mockData = {
    totalAlerts: 74,
    criticalAlerts: 11,
    highAlerts: 23,
    mediumAlerts: 27,
    lowAlerts: 13,
    avgResponseTime: 147,
    acknowledgedAlerts: 68,
    unacknowledgedAlerts: 6,
    emailsSent: 156,
    smsSent: 23,
    desktopNotifications: 89,
    dailyBreakdown: [
      { date: "2024-01-01", total: 12, critical: 2, high: 4, medium: 4, low: 2, avgResponseTime: 145 },
      { date: "2024-01-02", total: 8, critical: 1, high: 2, medium: 3, low: 2, avgResponseTime: 132 },
      { date: "2024-01-03", total: 15, critical: 3, high: 5, medium: 5, low: 2, avgResponseTime: 178 },
      { date: "2024-01-04", total: 6, critical: 0, high: 2, medium: 2, low: 2, avgResponseTime: 98 },
      { date: "2024-01-05", total: 11, critical: 2, high: 3, medium: 4, low: 2, avgResponseTime: 156 },
      { date: "2024-01-06", total: 9, critical: 1, high: 3, medium: 3, low: 2, avgResponseTime: 143 },
      { date: "2024-01-07", total: 13, critical: 2, high: 4, medium: 5, low: 2, avgResponseTime: 167 },
    ],
    alertTypes: [
      { type: "STAT Referrals", count: 45, avgResponseTime: 89, acknowledgedRate: 95.6 },
      { type: "High Value Cases", count: 32, avgResponseTime: 156, acknowledgedRate: 87.5 },
      { type: "Urgent Review", count: 28, avgResponseTime: 234, acknowledgedRate: 82.1 },
      { type: "Processing Delays", count: 19, avgResponseTime: 312, acknowledgedRate: 73.7 },
      { type: "Insurance Issues", count: 15, avgResponseTime: 445, acknowledgedRate: 66.7 },
    ],
    staffMetrics: [
      { name: "Sarah Johnson, RN", alerts: 34, avgResponse: 98, acknowledged: 32, missed: 2 },
      { name: "Mike Davis, LPN", alerts: 28, avgResponse: 145, acknowledged: 25, missed: 3 },
      { name: "Lisa Chen, RN", alerts: 31, avgResponse: 112, acknowledged: 29, missed: 2 },
      { name: "Admin Team", alerts: 67, avgResponse: 156, acknowledged: 61, missed: 6 },
      { name: "Billing Team", alerts: 23, avgResponse: 234, acknowledged: 19, missed: 4 },
    ],
  }

  return mockData
}

function generateHTMLReport(data: any, type: string, includeCharts: boolean, includeStaffMetrics: boolean): string {
  const acknowledgedRate = (data.acknowledgedAlerts / data.totalAlerts) * 100

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alert Activity Report - ${type.charAt(0).toUpperCase() + type.slice(1)}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #667eea;
        }
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
            margin: 0;
        }
        .metric-label {
            color: #6b7280;
            font-size: 0.9em;
            margin: 5px 0 0 0;
        }
        .section {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .section h2 {
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .alert-type-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 10px;
        }
        .alert-type-name {
            font-weight: 600;
            color: #374151;
        }
        .alert-type-stats {
            display: flex;
            gap: 20px;
            font-size: 0.9em;
            color: #6b7280;
        }
        .staff-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
            gap: 15px;
            padding: 15px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 10px;
            align-items: center;
        }
        .staff-name {
            font-weight: 600;
            color: #374151;
        }
        .performance-excellent { color: #059669; }
        .performance-good { color: #d97706; }
        .performance-poor { color: #dc2626; }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 0.9em;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        .priority-critical { color: #dc2626; font-weight: bold; }
        .priority-high { color: #ea580c; font-weight: bold; }
        .priority-medium { color: #ca8a04; font-weight: bold; }
        .priority-low { color: #2563eb; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Alert Activity Report</h1>
        <p>${type.charAt(0).toUpperCase() + type.slice(1)} Report • Generated ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-value">${data.totalAlerts}</div>
            <div class="metric-label">Total Alerts</div>
        </div>
        <div class="metric-card">
            <div class="metric-value priority-critical">${data.criticalAlerts}</div>
            <div class="metric-label">Critical Alerts</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${data.avgResponseTime}s</div>
            <div class="metric-label">Avg Response Time</div>
        </div>
        <div class="metric-card">
            <div class="metric-value performance-excellent">${acknowledgedRate.toFixed(1)}%</div>
            <div class="metric-label">Acknowledged Rate</div>
        </div>
    </div>

    <div class="section">
        <h2>Alert Priority Breakdown</h2>
        <div class="alert-type-row">
            <div class="alert-type-name priority-critical">Critical Alerts</div>
            <div class="alert-type-stats">
                <span>${data.criticalAlerts} alerts</span>
                <span>${((data.criticalAlerts / data.totalAlerts) * 100).toFixed(1)}% of total</span>
            </div>
        </div>
        <div class="alert-type-row">
            <div class="alert-type-name priority-high">High Priority</div>
            <div class="alert-type-stats">
                <span>${data.highAlerts} alerts</span>
                <span>${((data.highAlerts / data.totalAlerts) * 100).toFixed(1)}% of total</span>
            </div>
        </div>
        <div class="alert-type-row">
            <div class="alert-type-name priority-medium">Medium Priority</div>
            <div class="alert-type-stats">
                <span>${data.mediumAlerts} alerts</span>
                <span>${((data.mediumAlerts / data.totalAlerts) * 100).toFixed(1)}% of total</span>
            </div>
        </div>
        <div class="alert-type-row">
            <div class="alert-type-name priority-low">Low Priority</div>
            <div class="alert-type-stats">
                <span>${data.lowAlerts} alerts</span>
                <span>${((data.lowAlerts / data.totalAlerts) * 100).toFixed(1)}% of total</span>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Alert Type Performance</h2>
        ${data.alertTypes
          .map(
            (alertType: any) => `
        <div class="alert-type-row">
            <div class="alert-type-name">${alertType.type}</div>
            <div class="alert-type-stats">
                <span>${alertType.count} alerts</span>
                <span>${alertType.avgResponseTime}s avg response</span>
                <span class="${alertType.acknowledgedRate > 90 ? "performance-excellent" : alertType.acknowledgedRate > 80 ? "performance-good" : "performance-poor"}">${alertType.acknowledgedRate}% acknowledged</span>
            </div>
        </div>
        `,
          )
          .join("")}
    </div>

    <div class="section">
        <h2>Notification Channels</h2>
        <div class="alert-type-row">
            <div class="alert-type-name">📧 Email Notifications</div>
            <div class="alert-type-stats">
                <span>${data.emailsSent} sent</span>
                <span>${((data.emailsSent / (data.emailsSent + data.smsSent + data.desktopNotifications)) * 100).toFixed(1)}% of total</span>
            </div>
        </div>
        <div class="alert-type-row">
            <div class="alert-type-name">📱 SMS Alerts</div>
            <div class="alert-type-stats">
                <span>${data.smsSent} sent</span>
                <span>${((data.smsSent / (data.emailsSent + data.smsSent + data.desktopNotifications)) * 100).toFixed(1)}% of total</span>
            </div>
        </div>
        <div class="alert-type-row">
            <div class="alert-type-name">🔔 Desktop Notifications</div>
            <div class="alert-type-stats">
                <span>${data.desktopNotifications} sent</span>
                <span>${((data.desktopNotifications / (data.emailsSent + data.smsSent + data.desktopNotifications)) * 100).toFixed(1)}% of total</span>
            </div>
        </div>
    </div>

    ${
      includeStaffMetrics
        ? `
    <div class="section">
        <h2>Staff Performance Metrics</h2>
        <div class="staff-row" style="font-weight: bold; background-color: #f3f4f6;">
            <div>Staff Member</div>
            <div>Alerts Received</div>
            <div>Avg Response</div>
            <div>Acknowledged</div>
            <div>Success Rate</div>
        </div>
        ${data.staffMetrics
          .map(
            (staff: any) => `
        <div class="staff-row">
            <div class="staff-name">${staff.name}</div>
            <div>${staff.alerts}</div>
            <div>${staff.avgResponse}s</div>
            <div>${staff.acknowledged}</div>
            <div class="${((staff.acknowledged / staff.alerts) * 100) > 90 ? "performance-excellent" : (staff.acknowledged / staff.alerts) * 100 > 80 ? "performance-good" : "performance-poor"}">${((staff.acknowledged / staff.alerts) * 100).toFixed(1)}%</div>
        </div>
        `,
          )
          .join("")}
    </div>
    `
        : ""
    }

    <div class="section">
        <h2>Key Insights & Recommendations</h2>
        <div style="display: grid; gap: 15px;">
            ${
              data.avgResponseTime < 120
                ? '<div style="padding: 15px; background-color: #d1fae5; border-left: 4px solid #10b981; border-radius: 6px;"><strong>✅ Excellent Response Times:</strong> Average response time of ' +
                  data.avgResponseTime +
                  " seconds is well below the 2-minute target.</div>"
                : '<div style="padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;"><strong>⚠️ Response Time Attention:</strong> Average response time of ' +
                  data.avgResponseTime +
                  " seconds exceeds recommended thresholds.</div>"
            }
            ${
              acknowledgedRate > 90
                ? '<div style="padding: 15px; background-color: #d1fae5; border-left: 4px solid #10b981; border-radius: 6px;"><strong>✅ High Acknowledgment Rate:</strong> ' +
                  acknowledgedRate.toFixed(1) +
                  "% of alerts are being acknowledged promptly.</div>"
                : '<div style="padding: 15px; background-color: #fee2e2; border-left: 4px solid #ef4444; border-radius: 6px;"><strong>🚨 Low Acknowledgment Rate:</strong> Only ' +
                  acknowledgedRate.toFixed(1) +
                  "% of alerts are being acknowledged. Consider staff training.</div>"
            }
            <div style="padding: 15px; background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 6px;">
                <strong>📊 Alert Volume:</strong> ${data.totalAlerts} total alerts processed with ${data.criticalAlerts} critical cases requiring immediate attention.
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Healthcare Alert System Report • Generated on ${new Date().toLocaleString()}</p>
        <p>This report contains confidential healthcare operations data</p>
    </div>
</body>
</html>
  `
}
