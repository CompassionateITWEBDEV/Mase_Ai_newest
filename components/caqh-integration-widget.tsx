"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Shield,
  TrendingUp,
  Calendar,
  Activity,
  AlertCircle,
} from "lucide-react"

interface CAQHStats {
  systemStatus: {
    caqhApiStatus: string
    responseTime: string
    uptime: string
    dailyQuota: {
      used: number
      limit: number
      remaining: number
    }
  }
  verificationStats: {
    today: {
      total: number
      successful: number
      failed: number
      pending: number
    }
  }
  expirationAlerts: {
    expiredLicenses: number
    expiringIn30Days: number
    expiringIn90Days: number
  }
  complianceMetrics: {
    overallCompliance: number
    licenseCompliance: number
    boardCertificationCompliance: number
    malpracticeCompliance: number
  }
}

export function CAQHIntegrationWidget() {
  const [stats, setStats] = useState<CAQHStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    fetchCAQHStats()
    const interval = setInterval(fetchCAQHStats, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchCAQHStats = async () => {
    try {
      const response = await fetch("/api/caqh/monitoring")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error("Failed to fetch CAQH stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "text-green-600"
      case "degraded":
        return "text-yellow-600"
      case "down":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "degraded":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "down":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            CAQH Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            CAQH Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Failed to load CAQH statistics</div>
        </CardContent>
      </Card>
    )
  }

  const quotaPercentage = (stats.systemStatus.dailyQuota.used / stats.systemStatus.dailyQuota.limit) * 100

  return (
    <div className="space-y-6">
      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              CAQH Integration Status
            </div>
            <Button variant="outline" size="sm" onClick={fetchCAQHStats}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>Last updated: {lastRefresh.toLocaleTimeString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {getStatusIcon(stats.systemStatus.caqhApiStatus)}
              </div>
              <div className={`font-medium ${getStatusColor(stats.systemStatus.caqhApiStatus)}`}>
                {stats.systemStatus.caqhApiStatus.toUpperCase()}
              </div>
              <div className="text-sm text-gray-500">API Status</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{stats.systemStatus.responseTime}</div>
              <div className="text-sm text-gray-500">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{stats.systemStatus.uptime}</div>
              <div className="text-sm text-gray-500">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{stats.systemStatus.dailyQuota.remaining}</div>
              <div className="text-sm text-gray-500">API Calls Left</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Daily API Usage</span>
              <span className="text-sm text-gray-500">
                {stats.systemStatus.dailyQuota.used} / {stats.systemStatus.dailyQuota.limit}
              </span>
            </div>
            <Progress value={quotaPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Today's Verifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Today's Verifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.verificationStats.today.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.verificationStats.today.successful}</div>
              <div className="text-sm text-gray-500">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.verificationStats.today.failed}</div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.verificationStats.today.pending}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Compliance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Compliance</span>
                <span className="text-sm font-bold">{stats.complianceMetrics.overallCompliance}%</span>
              </div>
              <Progress value={stats.complianceMetrics.overallCompliance} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">License Compliance</span>
                <span className="text-sm font-bold">{stats.complianceMetrics.licenseCompliance}%</span>
              </div>
              <Progress value={stats.complianceMetrics.licenseCompliance} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Board Certification</span>
                <span className="text-sm font-bold">{stats.complianceMetrics.boardCertificationCompliance}%</span>
              </div>
              <Progress value={stats.complianceMetrics.boardCertificationCompliance} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Malpractice Insurance</span>
                <span className="text-sm font-bold">{stats.complianceMetrics.malpracticeCompliance}%</span>
              </div>
              <Progress value={stats.complianceMetrics.malpracticeCompliance} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expiration Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Expiration Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.expirationAlerts.expiredLicenses > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="font-medium">Expired Licenses</span>
                </div>
                <Badge variant="destructive">{stats.expirationAlerts.expiredLicenses}</Badge>
              </div>
            )}
            {stats.expirationAlerts.expiringIn30Days > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-orange-500 mr-2" />
                  <span className="font-medium">Expiring in 30 Days</span>
                </div>
                <Badge className="bg-orange-100 text-orange-800">{stats.expirationAlerts.expiringIn30Days}</Badge>
              </div>
            )}
            {stats.expirationAlerts.expiringIn90Days > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="font-medium">Expiring in 90 Days</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">{stats.expirationAlerts.expiringIn90Days}</Badge>
              </div>
            )}
            {stats.expirationAlerts.expiredLicenses === 0 &&
              stats.expirationAlerts.expiringIn30Days === 0 &&
              stats.expirationAlerts.expiringIn90Days === 0 && (
                <div className="text-center py-4 text-green-600">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  <div className="font-medium">All licenses are current</div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
