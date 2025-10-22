"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Zap,
  Building2,
  Users,
} from "lucide-react"

interface ReferralAlert {
  id: string
  type: "new_referral" | "status_change" | "urgent_review" | "eligibility_issue" | "dme_order"
  severity: "low" | "medium" | "high" | "critical"
  title: string
  message: string
  timestamp: string
  source?: string
  patientName?: string
  actionRequired?: boolean
  autoResolve?: boolean
}

interface ReferralAlertSystemProps {
  onNewReferral?: (referral: any) => void
  onStatusChange?: (referralId: string, newStatus: string) => void
}

export function ReferralAlertSystem({ onNewReferral, onStatusChange }: ReferralAlertSystemProps) {
  const [alerts, setAlerts] = useState<ReferralAlert[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isConnected, setIsConnected] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString())

  // Simulate real-time alerts
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random alerts
      if (Math.random() > 0.7) {
        const alertTypes = [
          {
            type: "new_referral" as const,
            severity: "medium" as const,
            title: "New Referral Received",
            message: "New referral from Regional Medical Center requires review",
            source: "ExtendedCare Network",
            patientName: "Patient #" + Math.floor(Math.random() * 1000),
            actionRequired: true,
          },
          {
            type: "status_change" as const,
            severity: "low" as const,
            title: "Referral Status Updated",
            message: "Patient referral has been approved and SOC scheduled",
            actionRequired: false,
            autoResolve: true,
          },
          {
            type: "urgent_review" as const,
            severity: "high" as const,
            title: "Urgent Review Required",
            message: "STAT referral requires immediate attention",
            actionRequired: true,
          },
          {
            type: "dme_order" as const,
            severity: "medium" as const,
            title: "DME Order Processed",
            message: "Parachute Health order approved and shipped",
            actionRequired: false,
            autoResolve: true,
          },
        ]

        const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)]
        const newAlert: ReferralAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          ...randomAlert,
          timestamp: new Date().toISOString(),
        }

        setAlerts((prev) => [newAlert, ...prev.slice(0, 9)]) // Keep only 10 most recent
        setLastUpdate(new Date().toLocaleTimeString())

        // Show browser notification if supported
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(newAlert.title, {
            body: newAlert.message,
            icon: "/favicon.ico",
          })
        }

        // Auto-resolve certain alerts
        if (newAlert.autoResolve) {
          setTimeout(() => {
            setAlerts((prev) => prev.filter((alert) => alert.id !== newAlert.id))
          }, 5000)
        }
      }
    }, 8000) // Check every 8 seconds

    return () => clearInterval(interval)
  }, [])

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
  }

  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case "new_referral":
        return <Users className="h-4 w-4" />
      case "status_change":
        return <CheckCircle className="h-4 w-4" />
      case "urgent_review":
        return <AlertTriangle className="h-4 w-4" />
      case "dme_order":
        return <Building2 className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-500 bg-red-50"
      case "high":
        return "border-orange-500 bg-orange-50"
      case "medium":
        return "border-blue-500 bg-blue-50"
      case "low":
        return "border-green-500 bg-green-50"
      default:
        return "border-gray-500 bg-gray-50"
    }
  }

  const criticalAlerts = alerts.filter((a) => a.severity === "critical").length
  const highAlerts = alerts.filter((a) => a.severity === "high").length

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <BellRing className="h-6 w-6 text-blue-600" />
              {alerts.length > 0 && (
                <div className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{alerts.length}</span>
                </div>
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Live Referral Alerts</CardTitle>
              <CardDescription>Real-time notifications • Last update: {lastUpdate}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setSoundEnabled(!soundEnabled)} className="text-gray-500">
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-xs text-gray-500">{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
          </div>
        </div>

        {/* Alert Summary */}
        {alerts.length > 0 && (
          <div className="flex items-center space-x-4 mt-3 pt-3 border-t">
            {criticalAlerts > 0 && (
              <Badge className="bg-red-500 text-white">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {criticalAlerts} Critical
              </Badge>
            )}
            {highAlerts > 0 && (
              <Badge className="bg-orange-500 text-white">
                <Zap className="h-3 w-3 mr-1" />
                {highAlerts} High Priority
              </Badge>
            )}
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {alerts.filter((a) => a.actionRequired).length} Action Required
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active alerts</p>
              <p className="text-xs">System monitoring for new referrals...</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <Alert key={alert.id} className={`${getAlertColor(alert.severity)} transition-all duration-200`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">{getAlertIcon(alert.type, alert.severity)}</div>
                    <div className="flex-1">
                      <AlertTitle className="text-sm font-medium flex items-center space-x-2">
                        <span>{alert.title}</span>
                        {alert.patientName && (
                          <Badge variant="outline" className="text-xs">
                            {alert.patientName}
                          </Badge>
                        )}
                        {alert.source && (
                          <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
                            {alert.source}
                          </Badge>
                        )}
                      </AlertTitle>
                      <AlertDescription className="text-xs mt-1">{alert.message}</AlertDescription>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        {alert.actionRequired && (
                          <Badge className="bg-blue-500 text-white text-xs">Action Required</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => dismissAlert(alert.id)} className="text-gray-400">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </Alert>
            ))
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">24</div>
            <div className="text-xs text-gray-500">Today's Referrals</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">18</div>
            <div className="text-xs text-gray-500">Auto-Approved</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">6</div>
            <div className="text-xs text-gray-500">Pending Review</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
