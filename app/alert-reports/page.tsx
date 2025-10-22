"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Download,
  Mail,
  MessageSquare,
  Bell,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Zap,
  Settings,
  Send,
  FileText,
  BarChart3,
} from "lucide-react"

interface AlertMetrics {
  totalAlerts: number
  criticalAlerts: number
  highAlerts: number
  mediumAlerts: number
  lowAlerts: number
  avgResponseTime: number
  acknowledgedAlerts: number
  unacknowledgedAlerts: number
  emailsSent: number
  smsSent: number
  desktopNotifications: number
}

interface DailyAlertData {
  date: string
  total: number
  critical: number
  high: number
  medium: number
  low: number
  avgResponseTime: number
  acknowledged: number
}

interface AlertTypeBreakdown {
  type: string
  count: number
  avgResponseTime: number
  acknowledgedRate: number
}

interface StaffResponseMetrics {
  staffMember: string
  alertsReceived: number
  avgResponseTime: number
  acknowledgedCount: number
  missedCount: number
}

const mockDailyData: DailyAlertData[] = [
  { date: "2024-01-01", total: 12, critical: 2, high: 4, medium: 4, low: 2, avgResponseTime: 145, acknowledged: 10 },
  { date: "2024-01-02", total: 8, critical: 1, high: 2, medium: 3, low: 2, avgResponseTime: 132, acknowledged: 7 },
  { date: "2024-01-03", total: 15, critical: 3, high: 5, medium: 5, low: 2, avgResponseTime: 178, acknowledged: 13 },
  { date: "2024-01-04", total: 6, critical: 0, high: 2, medium: 2, low: 2, avgResponseTime: 98, acknowledged: 6 },
  { date: "2024-01-05", total: 11, critical: 2, high: 3, medium: 4, low: 2, avgResponseTime: 156, acknowledged: 9 },
  { date: "2024-01-06", total: 9, critical: 1, high: 3, medium: 3, low: 2, avgResponseTime: 143, acknowledged: 8 },
  { date: "2024-01-07", total: 13, critical: 2, high: 4, medium: 5, low: 2, avgResponseTime: 167, acknowledged: 11 },
]

const mockAlertTypes: AlertTypeBreakdown[] = [
  { type: "STAT Referrals", count: 45, avgResponseTime: 89, acknowledgedRate: 95.6 },
  { type: "High Value Cases", count: 32, avgResponseTime: 156, acknowledgedRate: 87.5 },
  { type: "Urgent Review", count: 28, avgResponseTime: 234, acknowledgedRate: 82.1 },
  { type: "Processing Delays", count: 19, avgResponseTime: 312, acknowledgedRate: 73.7 },
  { type: "Insurance Issues", count: 15, avgResponseTime: 445, acknowledgedRate: 66.7 },
]

const mockStaffMetrics: StaffResponseMetrics[] = [
  { staffMember: "Sarah Johnson, RN", alertsReceived: 34, avgResponseTime: 98, acknowledgedCount: 32, missedCount: 2 },
  { staffMember: "Mike Davis, LPN", alertsReceived: 28, avgResponseTime: 145, acknowledgedCount: 25, missedCount: 3 },
  { staffMember: "Lisa Chen, RN", alertsReceived: 31, avgResponseTime: 112, acknowledgedCount: 29, missedCount: 2 },
  { staffMember: "Admin Team", alertsReceived: 67, avgResponseTime: 156, acknowledgedCount: 61, missedCount: 6 },
  { staffMember: "Billing Team", alertsReceived: 23, avgResponseTime: 234, acknowledgedCount: 19, missedCount: 4 },
]

export default function AlertReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("7d")
  const [reportType, setReportType] = useState("daily")
  const [autoReportsEnabled, setAutoReportsEnabled] = useState(true)
  const [emailRecipients, setEmailRecipients] = useState("admin@agency.com, supervisor@agency.com")
  const [reportSchedule, setReportSchedule] = useState("daily")
  const [loading, setLoading] = useState(false)

  // Calculate current metrics
  const currentMetrics: AlertMetrics = {
    totalAlerts: mockDailyData.reduce((sum, day) => sum + day.total, 0),
    criticalAlerts: mockDailyData.reduce((sum, day) => sum + day.critical, 0),
    highAlerts: mockDailyData.reduce((sum, day) => sum + day.high, 0),
    mediumAlerts: mockDailyData.reduce((sum, day) => sum + day.medium, 0),
    lowAlerts: mockDailyData.reduce((sum, day) => sum + day.low, 0),
    avgResponseTime: Math.round(
      mockDailyData.reduce((sum, day) => sum + day.avgResponseTime, 0) / mockDailyData.length,
    ),
    acknowledgedAlerts: mockDailyData.reduce((sum, day) => sum + day.acknowledged, 0),
    unacknowledgedAlerts: mockDailyData.reduce((sum, day) => sum + (day.total - day.acknowledged), 0),
    emailsSent: 156,
    smsSent: 23,
    desktopNotifications: 89,
  }

  const acknowledgedRate = (currentMetrics.acknowledgedAlerts / currentMetrics.totalAlerts) * 100

  const generateReport = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/alert-reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period: selectedPeriod,
          type: reportType,
          includeCharts: true,
          includeStaffMetrics: true,
        }),
      })

      const result = await response.json()
      if (result.success) {
        // Trigger download
        const blob = new Blob([result.reportData], { type: "text/html" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `alert-report-${reportType}-${selectedPeriod}-${new Date().toISOString().split("T")[0]}.html`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Failed to generate report:", error)
    }
    setLoading(false)
  }

  const scheduleReport = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/alert-reports/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule: reportSchedule,
          recipients: emailRecipients.split(",").map((email) => email.trim()),
          reportType,
          enabled: autoReportsEnabled,
        }),
      })

      const result = await response.json()
      if (result.success) {
        alert("Report schedule updated successfully!")
      }
    } catch (error) {
      console.error("Failed to schedule report:", error)
    }
    setLoading(false)
  }

  const COLORS = ["#dc2626", "#ea580c", "#ca8a04", "#2563eb"]

  const pieData = [
    { name: "Critical", value: currentMetrics.criticalAlerts, color: "#dc2626" },
    { name: "High", value: currentMetrics.highAlerts, color: "#ea580c" },
    { name: "Medium", value: currentMetrics.mediumAlerts, color: "#ca8a04" },
    { name: "Low", value: currentMetrics.lowAlerts, color: "#2563eb" },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alert Activity Reports</h1>
          <p className="text-muted-foreground">Daily and weekly reports on alert activity and response times</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={generateReport} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            {loading ? "Generating..." : "Generate Report"}
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="schedule">Schedule Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentMetrics.totalAlerts}</div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                <Zap className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{currentMetrics.criticalAlerts}</div>
                <p className="text-xs text-muted-foreground">
                  {((currentMetrics.criticalAlerts / currentMetrics.totalAlerts) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentMetrics.avgResponseTime}s</div>
                <p className="text-xs text-muted-foreground">
                  {currentMetrics.avgResponseTime < 120 ? (
                    <span className="text-green-600 flex items-center">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Excellent
                    </span>
                  ) : (
                    <span className="text-yellow-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Needs improvement
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Acknowledged Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{acknowledgedRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {currentMetrics.acknowledgedAlerts} of {currentMetrics.totalAlerts} alerts
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Alert Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Alert Priority Distribution</CardTitle>
                <CardDescription>Breakdown of alerts by priority level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>Distribution of notification methods used</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span>Email Notifications</span>
                    </div>
                    <span className="font-medium">{currentMetrics.emailsSent}</span>
                  </div>
                  <Progress value={(currentMetrics.emailsSent / 200) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      <span>SMS Alerts</span>
                    </div>
                    <span className="font-medium">{currentMetrics.smsSent}</span>
                  </div>
                  <Progress value={(currentMetrics.smsSent / 50) * 100} className="h-2" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-purple-500" />
                      <span>Desktop Notifications</span>
                    </div>
                    <span className="font-medium">{currentMetrics.desktopNotifications}</span>
                  </div>
                  <Progress value={(currentMetrics.desktopNotifications / 100) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alert Type Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Type Performance</CardTitle>
              <CardDescription>Response times and acknowledgment rates by alert type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAlertTypes.map((alertType) => (
                  <div key={alertType.type} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{alertType.type}</h4>
                      <Badge variant="outline">{alertType.count} alerts</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Avg Response Time:</span>
                        <div className="font-medium">{alertType.avgResponseTime}s</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Acknowledgment Rate:</span>
                        <div className="font-medium text-green-600">{alertType.acknowledgedRate}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Performance:</span>
                        <div className="font-medium">
                          {alertType.acknowledgedRate > 90 ? (
                            <span className="text-green-600">Excellent</span>
                          ) : alertType.acknowledgedRate > 80 ? (
                            <span className="text-yellow-600">Good</span>
                          ) : (
                            <span className="text-red-600">Needs Improvement</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Progress value={alertType.acknowledgedRate} className="h-2 mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Alert Volume</CardTitle>
              <CardDescription>Alert volume trends over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockDailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <Bar dataKey="critical" stackId="a" fill="#dc2626" name="Critical" />
                    <Bar dataKey="high" stackId="a" fill="#ea580c" name="High" />
                    <Bar dataKey="medium" stackId="a" fill="#ca8a04" name="Medium" />
                    <Bar dataKey="low" stackId="a" fill="#2563eb" name="Low" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Time Trends</CardTitle>
              <CardDescription>Average response times over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockDailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value) => [`${value}s`, "Avg Response Time"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgResponseTime"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: "#2563eb" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Staff Response Performance</CardTitle>
              <CardDescription>Individual staff member alert response metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockStaffMetrics.map((staff) => (
                  <div key={staff.staffMember} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{staff.staffMember}</h4>
                      <Badge variant="outline">{staff.alertsReceived} alerts received</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Avg Response:</span>
                        <div className="font-medium">{staff.avgResponseTime}s</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Acknowledged:</span>
                        <div className="font-medium text-green-600">{staff.acknowledgedCount}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Missed:</span>
                        <div className="font-medium text-red-600">{staff.missedCount}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Success Rate:</span>
                        <div className="font-medium">
                          {((staff.acknowledgedCount / staff.alertsReceived) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <Progress value={(staff.acknowledgedCount / staff.alertsReceived) * 100} className="h-2 mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>Key performance indicators and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Excellent:</strong> Critical alert response time averages 89 seconds, well below the
                    2-minute target.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Attention:</strong> Insurance issue alerts have a 66.7% acknowledgment rate. Consider
                    additional training.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Improvement:</strong> Overall alert volume decreased 15% compared to last week.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Suggested improvements based on data analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900">Staff Training</h5>
                  <p className="text-sm text-blue-700">
                    Provide additional training for insurance verification alerts to improve response rates.
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <h5 className="font-medium text-green-900">Process Optimization</h5>
                  <p className="text-sm text-green-700">
                    Consider automating routine insurance checks to reduce manual alert volume.
                  </p>
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg">
                  <h5 className="font-medium text-yellow-900">Alert Tuning</h5>
                  <p className="text-sm text-yellow-700">
                    Review processing delay thresholds - current 5-minute limit may be too aggressive.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Schedule Reports Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Automated Report Settings</span>
              </CardTitle>
              <CardDescription>Configure automatic daily and weekly alert reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Enable Automated Reports</Label>
                  <p className="text-sm text-muted-foreground">Automatically generate and email reports</p>
                </div>
                <Switch checked={autoReportsEnabled} onCheckedChange={setAutoReportsEnabled} />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily Summary</SelectItem>
                        <SelectItem value="weekly">Weekly Analysis</SelectItem>
                        <SelectItem value="monthly">Monthly Overview</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="schedule">Schedule</Label>
                    <Select value={reportSchedule} onValueChange={setReportSchedule}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily at 8:00 AM</SelectItem>
                        <SelectItem value="weekly">Weekly on Monday</SelectItem>
                        <SelectItem value="monthly">Monthly on 1st</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recipients">Email Recipients</Label>
                    <Input
                      id="recipients"
                      value={emailRecipients}
                      onChange={(e) => setEmailRecipients(e.target.value)}
                      placeholder="admin@agency.com, supervisor@agency.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Separate multiple emails with commas</p>
                  </div>

                  <div>
                    <Label htmlFor="period">Report Period</Label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1d">Last 24 hours</SelectItem>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button onClick={scheduleReport} disabled={loading}>
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save Schedule"}
                </Button>
                <Button variant="outline" onClick={generateReport} disabled={loading}>
                  <FileText className="h-4 w-4 mr-2" />
                  Preview Report
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>Previously generated and scheduled reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Daily Alert Report - January 10, 2024</h4>
                    <p className="text-sm text-muted-foreground">Generated at 8:00 AM • Sent to 3 recipients</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Weekly Alert Analysis - January 8, 2024</h4>
                    <p className="text-sm text-muted-foreground">Generated at 9:00 AM • Sent to 5 recipients</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Monthly Alert Overview - January 1, 2024</h4>
                    <p className="text-sm text-muted-foreground">Generated at 10:00 AM • Sent to 7 recipients</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
