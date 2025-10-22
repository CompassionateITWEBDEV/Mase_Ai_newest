"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Target,
  Bell,
  RefreshCw,
  Eye,
  Smartphone,
  Wifi,
  Battery,
} from "lucide-react"

interface MobileBillingWidgetProps {
  isCompact?: boolean
  showNotifications?: boolean
  autoRefresh?: boolean
}

interface QuickMetric {
  label: string
  value: string
  change: string
  positive: boolean
  icon: any
  color: string
}

export function MobileBillingWidget({
  isCompact = false,
  showNotifications = true,
  autoRefresh = true,
}: MobileBillingWidgetProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [lastSync, setLastSync] = useState(new Date())
  const [batteryLevel, setBatteryLevel] = useState(85)
  const [notifications, setNotifications] = useState(3)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const quickMetrics: QuickMetric[] = [
    {
      label: "Today's Collections",
      value: "$125K",
      change: "+8.2%",
      positive: true,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      label: "Pending Claims",
      value: "47",
      change: "+12%",
      positive: false,
      icon: Clock,
      color: "text-blue-600",
    },
    {
      label: "Denial Rate",
      value: "3.8%",
      change: "+0.5%",
      positive: false,
      icon: AlertTriangle,
      color: "text-orange-600",
    },
    {
      label: "Collection Rate",
      value: "94.2%",
      change: "+2.1%",
      positive: true,
      icon: Target,
      color: "text-purple-600",
    },
  ]

  const criticalAlerts = [
    {
      id: "1",
      title: "Payment Delay",
      description: "Medicare payments delayed by 7 days",
      impact: "$85K",
      severity: "critical",
    },
    {
      id: "2",
      title: "Denial Spike",
      description: "Denial rate increased 15%",
      impact: "$45K",
      severity: "high",
    },
    {
      id: "3",
      title: "Authorization Expiring",
      description: "8 authorizations expire in 3 days",
      impact: "$32K",
      severity: "medium",
    },
  ]

  useEffect(() => {
    // Simulate network status monitoring
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Auto-refresh if enabled
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(() => {
        setLastSync(new Date())
        // Simulate battery drain
        setBatteryLevel((prev) => Math.max(0, prev - Math.random() * 2))
      }, 30000)
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setLastSync(new Date())
    setIsRefreshing(false)
  }

  const getBatteryColor = () => {
    if (batteryLevel > 50) return "text-green-600"
    if (batteryLevel > 20) return "text-yellow-600"
    return "text-red-600"
  }

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 border-red-200 text-red-800"
      case "high":
        return "bg-orange-100 border-orange-200 text-orange-800"
      case "medium":
        return "bg-yellow-100 border-yellow-200 text-yellow-800"
      default:
        return "bg-blue-100 border-blue-200 text-blue-800"
    }
  }

  if (isCompact) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center">
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile Billing
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Wifi className={`h-3 w-3 ${isOnline ? "text-green-600" : "text-red-600"}`} />
                <Battery className={`h-3 w-3 ${getBatteryColor()}`} />
                <span className="text-xs text-gray-500">{batteryLevel}%</span>
              </div>
              {showNotifications && notifications > 0 && (
                <Badge
                  variant="destructive"
                  className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {notifications}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {quickMetrics.slice(0, 2).map((metric, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-1 mb-1">
                  <metric.icon className={`h-3 w-3 ${metric.color}`} />
                  <span className="text-xs text-gray-600">{metric.label}</span>
                </div>
                <p className="text-sm font-bold">{metric.value}</p>
                <div className="flex items-center">
                  {metric.positive ? (
                    <TrendingUp className="h-2 w-2 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-2 w-2 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${metric.positive ? "text-green-600" : "text-red-600"}`}>
                    {metric.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Last sync: {lastSync.toLocaleTimeString()}</span>
            <Button size="sm" variant="ghost" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mobile Status Bar */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Mobile Dashboard</span>
              </div>
              <div className="flex items-center space-x-2">
                <Wifi className={`h-4 w-4 ${isOnline ? "text-green-600" : "text-red-600"}`} />
                <span className="text-xs">{isOnline ? "Online" : "Offline"}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Battery className={`h-4 w-4 ${getBatteryColor()}`} />
                <span className="text-xs">{batteryLevel}%</span>
              </div>
              <Button size="sm" variant="ghost" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.label}</p>
                  <p className="text-xl font-bold">{metric.value}</p>
                  <div className="flex items-center mt-1">
                    {metric.positive ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={`text-xs ${metric.positive ? "text-green-600" : "text-red-600"}`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Critical Alerts */}
      {showNotifications && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Critical Alerts
              </CardTitle>
              <Badge variant="destructive">{criticalAlerts.length} Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${getAlertSeverityColor(alert.severity)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{alert.description}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-sm font-bold">{alert.impact}</p>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Optimization Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Mobile Optimization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Touch Interface</span>
              <Badge className="bg-green-100 text-green-800">Optimized</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Offline Capability</span>
              <Badge className="bg-blue-100 text-blue-800">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Push Notifications</span>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Data Sync</span>
              <div className="flex items-center space-x-2">
                <Progress value={85} className="w-16 h-2" />
                <span className="text-xs">85%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
