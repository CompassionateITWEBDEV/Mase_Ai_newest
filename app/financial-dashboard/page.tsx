"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Activity,
  RefreshCw,
  Search,
  Bell,
  Mail,
  Eye,
  Target,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react"

interface FinancialMetrics {
  totalEpisodeValue: number
  projectedReimbursement: number
  atRiskAmount: number
  reimbursementRate: number
  eligiblePatients: number
  ineligiblePatients: number
  pendingPatients: number
  totalPatients: number
  criticalAlerts: number
  highPriorityAlerts: number
  mediumPriorityAlerts: number
  lowPriorityAlerts: number
}

interface PatientFinancial {
  id: string
  name: string
  mrn: string
  insurancePlan: string
  eligibilityStatus: "eligible" | "ineligible" | "pending" | "expired"
  episodeValue: number
  projectedReimbursement: number
  patientResponsibility: number
  deductibleMet: number
  deductibleTotal: number
  authorizationStatus: "active" | "expiring" | "expired" | "pending"
  authorizationExpiry: string
  riskLevel: "low" | "medium" | "high" | "critical"
  daysInCare: number
  totalVisits: number
  lastEligibilityCheck: string
}

interface FinancialAlert {
  id: string
  patientId: string
  patientName: string
  type: "eligibility_lost" | "authorization_expiring" | "insurance_change" | "deductible_change" | "high_risk"
  priority: "critical" | "high" | "medium" | "low"
  message: string
  estimatedImpact: number
  createdAt: string
  resolved: boolean
  actionRequired: boolean
}

export default function FinancialDashboard() {
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalEpisodeValue: 2450000,
    projectedReimbursement: 2205000,
    atRiskAmount: 245000,
    reimbursementRate: 90,
    eligiblePatients: 156,
    ineligiblePatients: 12,
    pendingPatients: 8,
    totalPatients: 176,
    criticalAlerts: 3,
    highPriorityAlerts: 7,
    mediumPriorityAlerts: 15,
    lowPriorityAlerts: 23,
  })

  const [patients, setPatients] = useState<PatientFinancial[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      mrn: "MRN001234",
      insurancePlan: "Medicare Part A",
      eligibilityStatus: "eligible",
      episodeValue: 15000,
      projectedReimbursement: 13500,
      patientResponsibility: 1500,
      deductibleMet: 1200,
      deductibleTotal: 1500,
      authorizationStatus: "active",
      authorizationExpiry: "2024-02-15",
      riskLevel: "low",
      daysInCare: 45,
      totalVisits: 12,
      lastEligibilityCheck: "2024-01-11T10:30:00Z",
    },
    {
      id: "2",
      name: "Robert Chen",
      mrn: "MRN001235",
      insurancePlan: "Aetna Better Health",
      eligibilityStatus: "ineligible",
      episodeValue: 18000,
      projectedReimbursement: 0,
      patientResponsibility: 18000,
      deductibleMet: 0,
      deductibleTotal: 2500,
      authorizationStatus: "expired",
      authorizationExpiry: "2024-01-05",
      riskLevel: "critical",
      daysInCare: 32,
      totalVisits: 8,
      lastEligibilityCheck: "2024-01-11T10:25:00Z",
    },
    {
      id: "3",
      name: "Maria Rodriguez",
      mrn: "MRN001236",
      insurancePlan: "Humana Gold Plus",
      eligibilityStatus: "pending",
      episodeValue: 12500,
      projectedReimbursement: 11250,
      patientResponsibility: 1250,
      deductibleMet: 800,
      deductibleTotal: 1000,
      authorizationStatus: "expiring",
      authorizationExpiry: "2024-01-18",
      riskLevel: "high",
      daysInCare: 28,
      totalVisits: 6,
      lastEligibilityCheck: "2024-01-11T10:28:00Z",
    },
  ])

  const [alerts, setAlerts] = useState<FinancialAlert[]>([
    {
      id: "1",
      patientId: "2",
      patientName: "Robert Chen",
      type: "eligibility_lost",
      priority: "critical",
      message: "Patient eligibility lost - Authorization expired",
      estimatedImpact: 18000,
      createdAt: "2024-01-11T09:15:00Z",
      resolved: false,
      actionRequired: true,
    },
    {
      id: "2",
      patientId: "3",
      patientName: "Maria Rodriguez",
      type: "authorization_expiring",
      priority: "high",
      message: "Authorization expires in 7 days",
      estimatedImpact: 12500,
      createdAt: "2024-01-11T08:30:00Z",
      resolved: false,
      actionRequired: true,
    },
    {
      id: "3",
      patientId: "1",
      patientName: "Sarah Johnson",
      type: "deductible_change",
      priority: "low",
      message: "Deductible 80% met - Reduced patient responsibility",
      estimatedImpact: -300,
      createdAt: "2024-01-11T07:45:00Z",
      resolved: false,
      actionRequired: false,
    },
  ])

  const [isLiveMonitoring, setIsLiveMonitoring] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [riskFilter, setRiskFilter] = useState("all")

  // Simulate live updates
  useEffect(() => {
    if (!isLiveMonitoring) return

    const interval = setInterval(() => {
      // Simulate random metric updates
      setMetrics((prev) => ({
        ...prev,
        atRiskAmount: prev.atRiskAmount + (Math.random() - 0.5) * 5000,
        reimbursementRate: Math.max(85, Math.min(95, prev.reimbursementRate + (Math.random() - 0.5) * 2)),
      }))
      setLastUpdate(new Date())
    }, 3000)

    return () => clearInterval(interval)
  }, [isLiveMonitoring])

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.mrn.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || patient.eligibilityStatus === statusFilter
    const matchesRisk = riskFilter === "all" || patient.riskLevel === riskFilter
    return matchesSearch && matchesStatus && matchesRisk
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "eligible":
        return "bg-green-100 text-green-800"
      case "ineligible":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "expired":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
            <p className="text-gray-600 mt-1">Real-time financial monitoring and eligibility tracking</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="live-monitoring">Live Monitoring</Label>
              <Switch id="live-monitoring" checked={isLiveMonitoring} onCheckedChange={setIsLiveMonitoring} />
              {isLiveMonitoring && (
                <div className="flex items-center space-x-1 text-green-600">
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">Live</span>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500">Last updated: {lastUpdate.toLocaleTimeString()}</div>

            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Episode Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalEpisodeValue)}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projected Reimbursement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.projectedReimbursement)}</div>
              <div className="flex items-center space-x-2 mt-1">
                <Progress value={metrics.reimbursementRate} className="flex-1" />
                <span className="text-sm font-medium">{metrics.reimbursementRate}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At-Risk Amount</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.atRiskAmount)}</div>
              <p className="text-xs text-muted-foreground">
                {((metrics.atRiskAmount / metrics.totalEpisodeValue) * 100).toFixed(1)}% of total value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patient Eligibility</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.eligiblePatients}/{metrics.totalPatients}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex space-x-1">
                  <Badge variant="secondary" className="text-xs">
                    {metrics.ineligiblePatients} ineligible
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {metrics.pendingPatients} pending
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Active Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{metrics.criticalAlerts}</div>
                  <div className="text-sm text-red-700">Critical</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{metrics.highPriorityAlerts}</div>
                  <div className="text-sm text-orange-700">High Priority</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Eye className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{metrics.mediumPriorityAlerts}</div>
                  <div className="text-sm text-yellow-700">Medium</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{metrics.lowPriorityAlerts}</div>
                  <div className="text-sm text-blue-700">Low Priority</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="patients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="patients">Patient Status</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          {/* Patient Status Tab */}
          <TabsContent value="patients" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Patient Financial Status</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search patients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="eligible">Eligible</SelectItem>
                        <SelectItem value="ineligible">Ineligible</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={riskFilter} onValueChange={setRiskFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Risk" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Risk</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {filteredPatients.map((patient) => (
                      <div key={patient.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h3 className="font-semibold">{patient.name}</h3>
                              <p className="text-sm text-gray-600">
                                {patient.mrn} • {patient.insurancePlan}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(patient.eligibilityStatus)}>
                              {patient.eligibilityStatus}
                            </Badge>
                            <Badge className={getRiskColor(patient.riskLevel)}>{patient.riskLevel} risk</Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Financial Summary</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Episode Value:</span>
                                <span className="font-medium">{formatCurrency(patient.episodeValue)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Projected Reimbursement:</span>
                                <span className="font-medium text-green-600">
                                  {formatCurrency(patient.projectedReimbursement)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Patient Responsibility:</span>
                                <span className="font-medium text-orange-600">
                                  {formatCurrency(patient.patientResponsibility)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Insurance Details</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Deductible Met:</span>
                                <span className="font-medium">
                                  {formatCurrency(patient.deductibleMet)} / {formatCurrency(patient.deductibleTotal)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Authorization:</span>
                                <Badge
                                  variant={patient.authorizationStatus === "active" ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {patient.authorizationStatus}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>Expires:</span>
                                <span className="font-medium">{formatDate(patient.authorizationExpiry)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Care Summary</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Days in Care:</span>
                                <span className="font-medium">{patient.daysInCare}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Visits:</span>
                                <span className="font-medium">{patient.totalVisits}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Last Check:</span>
                                <span className="font-medium">{formatTime(patient.lastEligibilityCheck)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>Eligibility Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Eligible</span>
                      </div>
                      <span className="font-medium">
                        {metrics.eligiblePatients} (
                        {((metrics.eligiblePatients / metrics.totalPatients) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Ineligible</span>
                      </div>
                      <span className="font-medium">
                        {metrics.ineligiblePatients} (
                        {((metrics.ineligiblePatients / metrics.totalPatients) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>Pending</span>
                      </div>
                      <span className="font-medium">
                        {metrics.pendingPatients} (
                        {((metrics.pendingPatients / metrics.totalPatients) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Risk Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {["low", "medium", "high", "critical"].map((risk) => {
                      const count = patients.filter((p) => p.riskLevel === risk).length
                      const percentage = (count / patients.length) * 100
                      return (
                        <div key={risk} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="capitalize">{risk} Risk</span>
                            <span className="font-medium">
                              {count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Active Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Financial Alerts</CardTitle>
                <CardDescription>Monitor and manage financial alerts requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <Alert key={alert.id} className={getPriorityColor(alert.priority)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <AlertTitle className="flex items-center space-x-2">
                              <span>{alert.patientName}</span>
                              <Badge variant="outline" className="text-xs">
                                {alert.priority}
                              </Badge>
                              {alert.actionRequired && (
                                <Badge variant="destructive" className="text-xs">
                                  Action Required
                                </Badge>
                              )}
                            </AlertTitle>
                            <AlertDescription className="mt-2">
                              <div className="space-y-1">
                                <p>{alert.message}</p>
                                <div className="flex items-center space-x-4 text-sm">
                                  <span>
                                    Impact:{" "}
                                    <span className="font-medium">
                                      {formatCurrency(Math.abs(alert.estimatedImpact))}
                                    </span>
                                  </span>
                                  <span>
                                    Created: {formatDate(alert.createdAt)} at {formatTime(alert.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </AlertDescription>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline">
                              <Mail className="h-4 w-4 mr-1" />
                              Notify
                            </Button>
                            <Button size="sm">Resolve</Button>
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LineChart className="h-5 w-5" />
                    <span>Reimbursement Trends</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <div className="text-sm text-green-700">This Month</div>
                        <div className="text-2xl font-bold text-green-600">{metrics.reimbursementRate}%</div>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <div className="text-sm text-blue-700">Last Month</div>
                        <div className="text-2xl font-bold text-blue-600">88%</div>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm text-gray-700">3 Months Ago</div>
                        <div className="text-2xl font-bold text-gray-600">85%</div>
                      </div>
                      <TrendingDown className="h-8 w-8 text-gray-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Financial Forecasting</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Projected Monthly Revenue</span>
                        <span className="font-bold">{formatCurrency(850000)}</span>
                      </div>
                      <Progress value={75} className="h-2" />
                      <div className="text-xs text-gray-500">75% of monthly target</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Risk Mitigation Potential</span>
                        <span className="font-bold text-green-600">{formatCurrency(180000)}</span>
                      </div>
                      <Progress value={60} className="h-2" />
                      <div className="text-xs text-gray-500">60% recoverable with action</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Eligibility Improvement</span>
                        <span className="font-bold text-blue-600">+5.2%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                      <div className="text-xs text-gray-500">Expected improvement this quarter</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
