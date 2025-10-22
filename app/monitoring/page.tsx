"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
} from "lucide-react"

interface HealthStatus {
  service: string
  status: "healthy" | "warning" | "critical"
  responseTime: number
  uptime: number
  lastCheck: string
  message?: string
}

interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  network: number
  connections: number
  queue: number
}

interface AlertItem {
  id: string
  type: "critical" | "warning" | "info"
  title: string
  message: string
  timestamp: string
  resolved: boolean
  category: string
  severity: number
}

interface PerformanceMetric {
  timestamp: string
  responseTime: number
  requests: number
  errors: number
}

export default function MonitoringDashboard() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "overview"

  const [activeTab, setActiveTab] = useState(initialTab)
  const [liveMode, setLiveMode] = useState(false)
  const [timeRange, setTimeRange] = useState("1h")
  const [healthData, setHealthData] = useState<HealthStatus[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [overallHealth, setOverallHealth] = useState(0)

  const fetchHealthData = async () => {
    try {
      const response = await fetch("/api/monitoring/health")
      const data = await response.json()
      setHealthData(data.services)
      setSystemMetrics(data.systemMetrics)
      setOverallHealth(data.overallHealth)
    } catch (error) {
      console.error("Failed to fetch health data:", error)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/monitoring/metrics?timeRange=${timeRange}`)
      const data = await response.json()
      setPerformanceData(data.performance)
    } catch (error) {
      console.error("Failed to fetch metrics:", error)
    }
  }

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/monitoring/alerts")
      const data = await response.json()
      setAlerts(data.alerts)
    } catch (error) {
      console.error("Failed to fetch alerts:", error)
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch("/api/monitoring/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alertId, resolved: true }),
      })
      setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, resolved: true } : alert)))
    } catch (error) {
      console.error("Failed to resolve alert:", error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchHealthData(), fetchMetrics(), fetchAlerts()])
      setLoading(false)
    }

    loadData()
  }, [timeRange])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (liveMode) {
      interval = setInterval(() => {
        fetchHealthData()
        fetchMetrics()
        fetchAlerts()
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [liveMode, timeRange])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500"
      case "warning":
        return "bg-yellow-500"
      case "critical":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "info":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">Real-time monitoring and health dashboard</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch checked={liveMode} onCheckedChange={setLiveMode} id="live-mode" />
            <label htmlFor="live-mode" className="text-sm font-medium">
              Live Mode
            </label>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="12h">Last 12 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overall Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Overall System Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Progress value={overallHealth} className="h-3" />
            </div>
            <div className="text-2xl font-bold">{overallHealth}%</div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {overallHealth >= 90
              ? "All systems operational"
              : overallHealth >= 70
                ? "Some issues detected"
                : "Critical issues require attention"}
          </p>
        </CardContent>
      </Card>

      {/* System Resources */}
      {systemMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">CPU</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{systemMetrics.cpu}%</div>
                <Progress value={systemMetrics.cpu} className="h-2 mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MemoryStick className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{systemMetrics.memory}%</div>
                <Progress value={systemMetrics.memory} className="h-2 mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Disk</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{systemMetrics.disk}%</div>
                <Progress value={systemMetrics.disk} className="h-2 mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Network</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{systemMetrics.network}%</div>
                <Progress value={systemMetrics.network} className="h-2 mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Connections</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{systemMetrics.connections}</div>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-teal-500" />
                <span className="text-sm font-medium">Queue</span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{systemMetrics.queue}</div>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">API Endpoints</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {healthData.map((service) => (
              <Card key={service.service}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <h3 className="font-semibold">{service.service}</h3>
                        <p className="text-sm text-muted-foreground">
                          Last checked: {new Date(service.lastCheck).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{service.responseTime}ms</div>
                        <div className="text-xs text-muted-foreground">Response Time</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{service.uptime}%</div>
                        <div className="text-xs text-muted-foreground">Uptime</div>
                      </div>
                      <Badge
                        variant={service.status === "healthy" ? "default" : "destructive"}
                        className={`${getStatusColor(service.status)} text-white`}
                      >
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                  {service.message && <p className="text-sm text-muted-foreground mt-2">{service.message}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
                <CardDescription>Average response time over {timeRange}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mr-2" />
                  Response time chart would be rendered here
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Volume</CardTitle>
                <CardDescription>API requests over {timeRange}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mr-2" />
                  Request volume chart would be rendered here
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Rate</CardTitle>
                <CardDescription>Error percentage over {timeRange}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <TrendingDown className="h-8 w-8 mr-2" />
                  Error rate chart would be rendered here
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Key metrics for {timeRange}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Avg Response Time</span>
                  <span className="font-semibold">245ms</span>
                </div>
                <div className="flex justify-between">
                  <span>P95 Response Time</span>
                  <span className="font-semibold">890ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Requests</span>
                  <span className="font-semibold">12,847</span>
                </div>
                <div className="flex justify-between">
                  <span>Error Rate</span>
                  <span className="font-semibold text-red-500">0.3%</span>
                </div>
                <div className="flex justify-between">
                  <span>Availability</span>
                  <span className="font-semibold text-green-500">99.7%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Alerts</h3>
            <Badge variant="outline">{alerts.filter((a) => !a.resolved).length} unresolved</Badge>
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <Alert key={alert.id} className={alert.resolved ? "opacity-60" : ""}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <AlertTitle className="flex items-center space-x-2">
                        <span>{alert.title}</span>
                        <Badge variant={alert.type === "critical" ? "destructive" : "secondary"}>{alert.type}</Badge>
                        {alert.resolved && (
                          <Badge variant="outline" className="text-green-600">
                            Resolved
                          </Badge>
                        )}
                      </AlertTitle>
                      <AlertDescription className="mt-1">{alert.message}</AlertDescription>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>Category: {alert.category}</span>
                        <span>Severity: {alert.severity}/10</span>
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  {!alert.resolved && (
                    <Button size="sm" variant="outline" onClick={() => resolveAlert(alert.id)}>
                      Resolve
                    </Button>
                  )}
                </div>
              </Alert>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing APIs</CardTitle>
                <CardDescription>Best response times</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {healthData
                  .sort((a, b) => a.responseTime - b.responseTime)
                  .slice(0, 5)
                  .map((service) => (
                    <div key={service.service} className="flex justify-between items-center">
                      <span className="text-sm">{service.service}</span>
                      <Badge variant="outline">{service.responseTime}ms</Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Used APIs</CardTitle>
                <CardDescription>Highest request volume</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Patient Portal API</span>
                  <Badge variant="outline">3,247 req/h</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Billing API</span>
                  <Badge variant="outline">2,891 req/h</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Staff Management</span>
                  <Badge variant="outline">1,456 req/h</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Referral System</span>
                  <Badge variant="outline">987 req/h</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Analytics API</span>
                  <Badge variant="outline">654 req/h</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Insights</CardTitle>
                <CardDescription>Key observations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">System Stable</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">All critical services operational</p>
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">High Memory Usage</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Consider scaling resources</p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Traffic Increasing</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">15% increase from last week</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
