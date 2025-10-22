"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Brain,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  Download,
  Eye,
  Bell,
  Calculator,
  LineChart,
} from "lucide-react"
import Link from "next/link"

interface BillingMetrics {
  totalRevenue: number
  pendingRevenue: number
  deniedClaims: number
  averageDaysToPayment: number
  collectionRate: number
  denialRate: number
  resubmissionRate: number
  netCollectionRate: number
  arDays: number
  cleanClaimRate: number
  firstPassResolutionRate: number
  costToCollect: number
}

interface RevenueAnalytics {
  monthlyTrend: Array<{ month: string; revenue: number; target: number }>
  payerMix: Array<{ payer: string; percentage: number; revenue: number }>
  serviceLineMix: Array<{ service: string; revenue: number; margin: number }>
  denialReasons: Array<{ reason: string; count: number; impact: number }>
  agingBuckets: Array<{ bucket: string; amount: number; percentage: number }>
}

interface PredictiveInsights {
  cashFlowForecast: Array<{ date: string; predicted: number; confidence: number }>
  denialPredictions: Array<{ claimId: string; riskScore: number; reasons: string[] }>
  reimbursementOptimization: Array<{ opportunity: string; impact: number; effort: string }>
  seasonalTrends: Array<{ period: string; factor: number; recommendation: string }>
}

interface SmartAlert {
  id: string
  type: "revenue_drop" | "denial_spike" | "payment_delay" | "compliance_issue" | "opportunity"
  severity: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  impact: number
  actionRequired: boolean
  recommendations: string[]
  createdAt: string
}

export default function AdvancedBillingPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState<BillingMetrics>({
    totalRevenue: 2450000,
    pendingRevenue: 485000,
    deniedClaims: 23,
    averageDaysToPayment: 28.5,
    collectionRate: 94.2,
    denialRate: 3.8,
    resubmissionRate: 89.5,
    netCollectionRate: 91.7,
    arDays: 32.1,
    cleanClaimRate: 87.3,
    firstPassResolutionRate: 82.6,
    costToCollect: 4.2,
  })

  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics>({
    monthlyTrend: [
      { month: "Jan", revenue: 420000, target: 400000 },
      { month: "Feb", revenue: 385000, target: 400000 },
      { month: "Mar", revenue: 445000, target: 420000 },
      { month: "Apr", revenue: 465000, target: 430000 },
      { month: "May", revenue: 425000, target: 440000 },
      { month: "Jun", revenue: 485000, target: 450000 },
    ],
    payerMix: [
      { payer: "Medicare", percentage: 45.2, revenue: 1107600 },
      { payer: "Medicare Advantage", percentage: 28.7, revenue: 703150 },
      { payer: "Medicaid", percentage: 15.1, revenue: 369950 },
      { payer: "Commercial", percentage: 8.3, revenue: 203350 },
      { payer: "Private Pay", percentage: 2.7, revenue: 66150 },
    ],
    serviceLineMix: [
      { service: "Skilled Nursing", revenue: 1225000, margin: 32.5 },
      { service: "Physical Therapy", revenue: 735000, margin: 28.7 },
      { service: "Occupational Therapy", revenue: 294000, margin: 31.2 },
      { service: "Speech Therapy", revenue: 147000, margin: 29.8 },
      { service: "Medical Social Work", revenue: 49000, margin: 35.1 },
    ],
    denialReasons: [
      { reason: "Missing Documentation", count: 12, impact: 45000 },
      { reason: "Authorization Expired", count: 8, impact: 32000 },
      { reason: "Coding Error", count: 6, impact: 18000 },
      { reason: "Eligibility Issue", count: 4, impact: 15000 },
      { reason: "Duplicate Claim", count: 3, impact: 8000 },
    ],
    agingBuckets: [
      { bucket: "0-30 days", amount: 195000, percentage: 40.2 },
      { bucket: "31-60 days", amount: 145500, percentage: 30.0 },
      { bucket: "61-90 days", amount: 87300, percentage: 18.0 },
      { bucket: "91-120 days", amount: 38850, percentage: 8.0 },
      { bucket: "120+ days", amount: 18350, percentage: 3.8 },
    ],
  })

  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsights>({
    cashFlowForecast: [
      { date: "Week 1", predicted: 125000, confidence: 92 },
      { date: "Week 2", predicted: 145000, confidence: 89 },
      { date: "Week 3", predicted: 135000, confidence: 85 },
      { date: "Week 4", predicted: 155000, confidence: 82 },
    ],
    denialPredictions: [
      { claimId: "CLM-2024-001", riskScore: 85, reasons: ["Missing POC signature", "Authorization expires soon"] },
      { claimId: "CLM-2024-002", riskScore: 72, reasons: ["High visit frequency", "Diagnosis mismatch"] },
      { claimId: "CLM-2024-003", riskScore: 68, reasons: ["Incomplete documentation"] },
    ],
    reimbursementOptimization: [
      { opportunity: "Optimize therapy visit timing", impact: 45000, effort: "Medium" },
      { opportunity: "Improve coding accuracy", impact: 32000, effort: "Low" },
      { opportunity: "Reduce claim processing time", impact: 28000, effort: "High" },
    ],
    seasonalTrends: [
      { period: "Q4", factor: 1.15, recommendation: "Increase staffing for holiday surge" },
      { period: "Q1", factor: 0.92, recommendation: "Focus on denial management" },
      { period: "Q2", factor: 1.08, recommendation: "Optimize discharge planning" },
    ],
  })

  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([
    {
      id: "alert_1",
      type: "denial_spike",
      severity: "high",
      title: "Denial Rate Increase Detected",
      description: "Denial rate has increased 15% over the past week, primarily due to missing documentation",
      impact: 25000,
      actionRequired: true,
      recommendations: [
        "Review documentation workflows with clinical staff",
        "Implement pre-submission compliance checks",
        "Schedule training on common denial reasons",
      ],
      createdAt: "2024-07-11T09:15:00Z",
    },
    {
      id: "alert_2",
      type: "opportunity",
      severity: "medium",
      title: "Revenue Optimization Opportunity",
      description: "Medicare Advantage claims showing 12% higher reimbursement rates this quarter",
      impact: 35000,
      actionRequired: false,
      recommendations: [
        "Focus marketing efforts on Medicare Advantage patients",
        "Analyze service mix for optimal reimbursement",
        "Review payer contracts for rate improvements",
      ],
      createdAt: "2024-07-11T08:30:00Z",
    },
    {
      id: "alert_3",
      type: "payment_delay",
      severity: "critical",
      title: "Payment Processing Delay",
      description: "Average days to payment has increased to 35 days, exceeding target by 7 days",
      impact: 85000,
      actionRequired: true,
      recommendations: [
        "Contact top 3 payers about processing delays",
        "Review and resubmit aged claims",
        "Implement automated follow-up workflows",
      ],
      createdAt: "2024-07-11T07:45:00Z",
    },
  ])

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000)

    // Set up real-time updates
    const interval = setInterval(() => {
      // Simulate real-time metric updates
      setMetrics((prev) => ({
        ...prev,
        totalRevenue: prev.totalRevenue + Math.random() * 1000 - 500,
        pendingRevenue: prev.pendingRevenue + Math.random() * 500 - 250,
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-200 bg-red-50"
      case "high":
        return "border-orange-200 bg-orange-50"
      case "medium":
        return "border-yellow-200 bg-yellow-50"
      case "low":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "revenue_drop":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "denial_spike":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case "payment_delay":
        return <Clock className="h-4 w-4 text-red-600" />
      case "compliance_issue":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "opportunity":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading advanced billing analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/billing-center">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Billing Center
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Advanced Billing Intelligence</h1>
              <p className="text-gray-600">AI-powered revenue optimization and predictive analytics</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <Activity className="h-3 w-3 mr-1" />
              Live Analytics
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <Brain className="h-3 w-3 mr-1" />
              AI Insights
            </Badge>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${metrics.totalRevenue.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+8.2% vs last month</span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.collectionRate}%</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+2.1% vs target</span>
                  </div>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Days to Payment</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.averageDaysToPayment}</p>
                  <div className="flex items-center mt-1">
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600">+3.5 days vs target</span>
                  </div>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Denial Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.denialRate}%</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600">+0.8% vs last month</span>
                  </div>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Smart Alerts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              AI-Powered Smart Alerts
            </CardTitle>
            <CardDescription>Intelligent notifications and recommendations based on billing patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {smartAlerts.map((alert) => (
                <Alert key={alert.id} className={getAlertColor(alert.severity)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <AlertTitle className="flex items-center space-x-2">
                          <span>{alert.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {alert.severity.toUpperCase()}
                          </Badge>
                          {alert.actionRequired && (
                            <Badge variant="destructive" className="text-xs">
                              Action Required
                            </Badge>
                          )}
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                          <p className="mb-2">{alert.description}</p>
                          <p className="text-sm font-medium">Financial Impact: ${alert.impact.toLocaleString()}</p>
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-1">Recommendations:</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              {alert.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        </AlertDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button size="sm">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Revenue Overview</TabsTrigger>
            <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
            <TabsTrigger value="predictive">Predictive Insights</TabsTrigger>
            <TabsTrigger value="denials">Denial Management</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
          </TabsList>

          {/* Revenue Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LineChart className="h-5 w-5 mr-2" />
                    Monthly Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {revenueAnalytics.monthlyTrend.map((month, index) => (
                      <div key={month.month} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{month.month}</span>
                          <div className="text-right">
                            <span className="text-sm font-bold">${month.revenue.toLocaleString()}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              (Target: ${month.target.toLocaleString()})
                            </span>
                          </div>
                        </div>
                        <Progress value={(month.revenue / month.target) * 100} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Target Achievement</span>
                          <span>{((month.revenue / month.target) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Payer Mix Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {revenueAnalytics.payerMix.map((payer) => (
                      <div key={payer.payer} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{payer.payer}</span>
                          <div className="text-right">
                            <span className="text-sm font-bold">{payer.percentage}%</span>
                            <span className="text-xs text-gray-500 ml-2">${payer.revenue.toLocaleString()}</span>
                          </div>
                        </div>
                        <Progress value={payer.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Service Line Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {revenueAnalytics.serviceLineMix.map((service) => (
                    <div key={service.service} className="p-4 border rounded-lg">
                      <h4 className="font-medium text-sm mb-2">{service.service}</h4>
                      <p className="text-2xl font-bold text-blue-600 mb-1">${(service.revenue / 1000).toFixed(0)}K</p>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600">Margin: </span>
                        <span className="text-sm font-medium text-green-600 ml-1">{service.margin}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Accounts Receivable Aging</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {revenueAnalytics.agingBuckets.map((bucket) => (
                      <div key={bucket.bucket} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{bucket.bucket}</span>
                          <div className="text-right">
                            <span className="text-sm font-bold">${bucket.amount.toLocaleString()}</span>
                            <span className="text-xs text-gray-500 ml-2">({bucket.percentage}%)</span>
                          </div>
                        </div>
                        <Progress value={bucket.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700 font-medium">Clean Claim Rate</p>
                      <p className="text-2xl font-bold text-blue-600">{metrics.cleanClaimRate}%</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700 font-medium">First Pass Resolution</p>
                      <p className="text-2xl font-bold text-green-600">{metrics.firstPassResolutionRate}%</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-700 font-medium">AR Days</p>
                      <p className="text-2xl font-bold text-purple-600">{metrics.arDays}</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-700 font-medium">Cost to Collect</p>
                      <p className="text-2xl font-bold text-orange-600">{metrics.costToCollect}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Predictive Insights Tab */}
          <TabsContent value="predictive" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-purple-600" />
                    Cash Flow Forecast
                  </CardTitle>
                  <CardDescription>AI-powered 4-week cash flow prediction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {predictiveInsights.cashFlowForecast.map((forecast) => (
                      <div key={forecast.date} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{forecast.date}</p>
                          <p className="text-sm text-gray-600">Confidence: {forecast.confidence}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">${forecast.predicted.toLocaleString()}</p>
                          <Progress value={forecast.confidence} className="w-20 h-1 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                    Denial Risk Predictions
                  </CardTitle>
                  <CardDescription>Claims at risk of denial</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {predictiveInsights.denialPredictions.map((prediction) => (
                      <div key={prediction.claimId} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{prediction.claimId}</span>
                          <Badge
                            variant={
                              prediction.riskScore > 80
                                ? "destructive"
                                : prediction.riskScore > 60
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {prediction.riskScore}% Risk
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {prediction.reasons.map((reason, index) => (
                            <p key={index} className="text-sm text-gray-600">
                              • {reason}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Revenue Optimization Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {predictiveInsights.reimbursementOptimization.map((opportunity, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">{opportunity.opportunity}</h4>
                      <p className="text-2xl font-bold text-green-600 mb-2">+${opportunity.impact.toLocaleString()}</p>
                      <Badge variant="outline">{opportunity.effort} Effort</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Denial Management Tab */}
          <TabsContent value="denials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                  Top Denial Reasons
                </CardTitle>
                <CardDescription>Analysis of denial patterns and financial impact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueAnalytics.denialReasons.map((denial, index) => (
                    <div key={denial.reason} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-orange-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{denial.reason}</p>
                          <p className="text-sm text-gray-600">{denial.count} claims affected</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">${denial.impact.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Financial Impact</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Denial Resolution Workflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">1</span>
                      </div>
                      <span className="text-sm">Auto-identify denial patterns</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">2</span>
                      </div>
                      <span className="text-sm">Generate corrective action plans</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">3</span>
                      </div>
                      <span className="text-sm">Auto-resubmit corrected claims</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">4</span>
                      </div>
                      <span className="text-sm">Track resolution outcomes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Automated Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Auto-appeal eligible denials</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Generate missing documentation alerts</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Schedule follow-up calls</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Update authorization status</span>
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                    Revenue Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700 font-medium">Potential Monthly Increase</p>
                      <p className="text-2xl font-bold text-green-600">$125,000</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Top Opportunities:</p>
                      <ul className="text-sm space-y-1">
                        <li>• Optimize therapy visit timing (+$45K)</li>
                        <li>• Improve coding accuracy (+$32K)</li>
                        <li>• Reduce processing time (+$28K)</li>
                        <li>• Enhanced documentation (+$20K)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-purple-600" />
                    Automation Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Claims Processing</span>
                        <span className="text-sm font-medium">87%</span>
                      </div>
                      <Progress value={87} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Denial Management</span>
                        <span className="text-sm font-medium">72%</span>
                      </div>
                      <Progress value={72} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Payment Posting</span>
                        <span className="text-sm font-medium">94%</span>
                      </div>
                      <Progress value={94} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Follow-up Workflows</span>
                        <span className="text-sm font-medium">65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-orange-600" />
                    Performance Targets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Collection Rate</span>
                        <span className="text-sm">94.2% / 95%</span>
                      </div>
                      <Progress value={94.2} className="h-2" />
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Days to Payment</span>
                        <span className="text-sm">28.5 / 25 days</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Clean Claim Rate</span>
                        <span className="text-sm">87.3% / 90%</span>
                      </div>
                      <Progress value={87.3} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recommended Actions</CardTitle>
                <CardDescription>AI-generated recommendations to optimize billing performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Implement Real-time Eligibility Checks</h4>
                      <Badge className="bg-green-100 text-green-800">High Impact</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Reduce denials by 25% and improve clean claim rate to 92%
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-600 font-medium">+$35K/month</span>
                      <Button size="sm">Implement</Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Automate Prior Authorization Tracking</h4>
                      <Badge className="bg-blue-100 text-blue-800">Medium Impact</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Prevent authorization lapses and reduce payment delays</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-600 font-medium">+$22K/month</span>
                      <Button size="sm" variant="outline">
                        Schedule
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Enhanced Coding Review Process</h4>
                      <Badge className="bg-purple-100 text-purple-800">Quick Win</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">AI-powered coding validation to improve accuracy</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-600 font-medium">+$18K/month</span>
                      <Button size="sm">Enable</Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Predictive Denial Prevention</h4>
                      <Badge className="bg-orange-100 text-orange-800">Long-term</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Machine learning to predict and prevent claim denials</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-600 font-medium">+$45K/month</span>
                      <Button size="sm" variant="outline">
                        Plan
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
