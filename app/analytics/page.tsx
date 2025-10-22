"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  BarChart3,
  Download,
  RefreshCw,
  Eye,
  Target,
  Award,
  Shield,
  Brain,
  Stethoscope,
  Calculator,
  ChevronDown,
  ChevronUp,
  Search,
  Zap,
  PieChartIcon,
  TrendingUpIcon,
  UserCheck,
  Building,
  CreditCard,
  Briefcase,
} from "lucide-react"

interface AnalyticsData {
  overview: {
    totalApplications: number
    activeStaff: number
    monthlyRevenue: number
    completionRate: number
    avgProcessingTime: number
    qualityScore: number
  }
  trends: {
    applications: Array<{ month: string; count: number; approved: number; rejected: number }>
    revenue: Array<{ month: string; amount: number; forecast: number }>
    quality: Array<{ month: string; score: number; target: number }>
    staffing: Array<{ month: string; active: number; new: number; turnover: number }>
  }
  demographics: {
    ageGroups: Array<{ range: string; count: number; percentage: number }>
    experience: Array<{ level: string; count: number; color: string }>
    specialties: Array<{ specialty: string; count: number; demand: number }>
    locations: Array<{ state: string; count: number; growth: number }>
  }
  performance: {
    departments: Array<{ name: string; efficiency: number; quality: number; satisfaction: number }>
    oasisQuality: Array<{ category: string; score: number; target: number; improvement: number }>
    financialMetrics: Array<{ metric: string; current: number; target: number; trend: string }>
  }
  profitability: {
    perPatientMetrics: Array<{
      patientId: string
      patientName: string
      insuranceType: string
      visitType: string
      staffType: string
      trueCostPerVisit: number
      avgReimbursementPerVisit: number
      profitPerVisit: number
      episodeProfit: number
      totalVisits: number
      suggestedStaffMix: string
      profitabilityRating: "excellent" | "good" | "fair" | "poor"
      lastVisitDate: string
    }>
    costBreakdown: {
      laborCosts: { rn: number; lpn: number; aide: number }
      supplyCosts: number
      overheadCosts: number
      totalCosts: number
    }
    reimbursementByPayer: Array<{
      payerType: string
      avgReimbursement: number
      visitCount: number
      totalReimbursement: number
      profitMargin: number
    }>
    staffingRecommendations: Array<{
      visitType: string
      currentMix: string
      recommendedMix: string
      potentialSavings: number
      qualityImpact: string
    }>
  }
}

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState("6_months")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [profitabilityExpanded, setProfitabilityExpanded] = useState(false)
  const [profitabilityFilter, setProfitabilityFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Mock comprehensive analytics data
    const mockData: AnalyticsData = {
      overview: {
        totalApplications: 1247,
        activeStaff: 342,
        monthlyRevenue: 2850000,
        completionRate: 87.3,
        avgProcessingTime: 4.2,
        qualityScore: 94.1,
      },
      trends: {
        applications: [
          { month: "Jul", count: 89, approved: 67, rejected: 22 },
          { month: "Aug", count: 112, approved: 89, rejected: 23 },
          { month: "Sep", count: 134, approved: 108, rejected: 26 },
          { month: "Oct", count: 156, approved: 128, rejected: 28 },
          { month: "Nov", count: 178, approved: 145, rejected: 33 },
          { month: "Dec", count: 203, approved: 167, rejected: 36 },
        ],
        revenue: [
          { month: "Jul", amount: 2450000, forecast: 2400000 },
          { month: "Aug", amount: 2580000, forecast: 2550000 },
          { month: "Sep", amount: 2720000, forecast: 2680000 },
          { month: "Oct", amount: 2890000, forecast: 2820000 },
          { month: "Nov", amount: 2950000, forecast: 2900000 },
          { month: "Dec", amount: 3120000, forecast: 3050000 },
        ],
        quality: [
          { month: "Jul", score: 89.2, target: 90 },
          { month: "Aug", score: 91.1, target: 90 },
          { month: "Sep", score: 92.8, target: 90 },
          { month: "Oct", score: 93.5, target: 90 },
          { month: "Nov", score: 94.1, target: 90 },
          { month: "Dec", score: 94.7, target: 90 },
        ],
        staffing: [
          { month: "Jul", active: 298, new: 23, turnover: 8 },
          { month: "Aug", active: 312, new: 28, turnover: 14 },
          { month: "Sep", active: 325, new: 31, turnover: 18 },
          { month: "Oct", active: 334, new: 19, turnover: 10 },
          { month: "Nov", active: 341, new: 15, turnover: 8 },
          { month: "Dec", active: 342, new: 12, turnover: 11 },
        ],
      },
      demographics: {
        ageGroups: [
          { range: "22-30", count: 89, percentage: 26 },
          { range: "31-40", count: 124, percentage: 36 },
          { range: "41-50", count: 87, percentage: 25 },
          { range: "51-60", count: 35, percentage: 10 },
          { range: "60+", count: 7, percentage: 3 },
        ],
        experience: [
          { level: "Entry Level (0-2 years)", count: 78, color: "#3B82F6" },
          { level: "Mid Level (3-7 years)", count: 156, color: "#10B981" },
          { level: "Senior Level (8-15 years)", count: 89, color: "#F59E0B" },
          { level: "Expert Level (15+ years)", count: 19, color: "#EF4444" },
        ],
        specialties: [
          { specialty: "Home Health", count: 145, demand: 92 },
          { specialty: "Hospice Care", count: 89, demand: 87 },
          { specialty: "Physical Therapy", count: 67, demand: 95 },
          { specialty: "Occupational Therapy", count: 41, demand: 89 },
          { specialty: "Speech Therapy", count: 28, demand: 91 },
          { specialty: "Social Work", count: 34, demand: 85 },
        ],
        locations: [
          { state: "Michigan", count: 156, growth: 12.3 },
          { state: "Ohio", count: 89, growth: 8.7 },
          { state: "Indiana", count: 67, growth: 15.2 },
          { state: "Illinois", count: 30, growth: 22.1 },
        ],
      },
      performance: {
        departments: [
          { name: "OASIS QA", efficiency: 94.2, quality: 96.8, satisfaction: 92.1 },
          { name: "Training", efficiency: 87.5, quality: 91.3, satisfaction: 89.7 },
          { name: "HR", efficiency: 82.1, quality: 88.9, satisfaction: 85.4 },
          { name: "Compliance", efficiency: 91.7, quality: 94.2, satisfaction: 90.8 },
          { name: "Finance", efficiency: 89.3, quality: 92.6, satisfaction: 88.2 },
        ],
        oasisQuality: [
          { category: "Documentation Accuracy", score: 96.2, target: 95, improvement: 2.1 },
          { category: "Coding Precision", score: 94.8, target: 93, improvement: 3.2 },
          { category: "Compliance Rate", score: 97.1, target: 96, improvement: 1.8 },
          { category: "Timeliness", score: 92.4, target: 90, improvement: 4.7 },
          { category: "Clinical Accuracy", score: 95.6, target: 94, improvement: 2.9 },
        ],
        financialMetrics: [
          { metric: "Revenue per Episode", current: 3247, target: 3200, trend: "up" },
          { metric: "Cost per Visit", current: 89, target: 95, trend: "down" },
          { metric: "Profit Margin", current: 18.7, target: 18, trend: "up" },
          { metric: "Collection Rate", current: 96.2, target: 95, trend: "up" },
          { metric: "Days in AR", current: 32, target: 35, trend: "down" },
        ],
      },
      profitability: {
        perPatientMetrics: [
          {
            patientId: "P001",
            patientName: "Sarah Johnson",
            insuranceType: "Medicare Part A",
            visitType: "Skilled Nursing",
            staffType: "RN",
            trueCostPerVisit: 125.5,
            avgReimbursementPerVisit: 165.0,
            profitPerVisit: 39.5,
            episodeProfit: 1185.0,
            totalVisits: 30,
            suggestedStaffMix: "Current RN optimal",
            profitabilityRating: "excellent",
            lastVisitDate: "2024-01-10",
          },
          {
            patientId: "P002",
            patientName: "Robert Chen",
            insuranceType: "Medicaid",
            visitType: "Physical Therapy",
            staffType: "PT",
            trueCostPerVisit: 95.75,
            avgReimbursementPerVisit: 110.0,
            profitPerVisit: 14.25,
            episodeProfit: 342.0,
            totalVisits: 24,
            suggestedStaffMix: "Consider PTA for routine visits",
            profitabilityRating: "good",
            lastVisitDate: "2024-01-09",
          },
          {
            patientId: "P003",
            patientName: "Maria Rodriguez",
            insuranceType: "Blue Cross",
            visitType: "Wound Care",
            staffType: "RN",
            trueCostPerVisit: 135.25,
            avgReimbursementPerVisit: 185.0,
            profitPerVisit: 49.75,
            episodeProfit: 1492.5,
            totalVisits: 30,
            suggestedStaffMix: "Current RN optimal",
            profitabilityRating: "excellent",
            lastVisitDate: "2024-01-11",
          },
          {
            patientId: "P004",
            patientName: "James Wilson",
            insuranceType: "Aetna",
            visitType: "Medication Management",
            staffType: "LPN",
            trueCostPerVisit: 75.0,
            avgReimbursementPerVisit: 85.0,
            profitPerVisit: 10.0,
            episodeProfit: 200.0,
            totalVisits: 20,
            suggestedStaffMix: "LPN appropriate",
            profitabilityRating: "fair",
            lastVisitDate: "2024-01-08",
          },
          {
            patientId: "P005",
            patientName: "Linda Davis",
            insuranceType: "Humana",
            visitType: "Complex Care",
            staffType: "RN",
            trueCostPerVisit: 145.0,
            avgReimbursementPerVisit: 140.0,
            profitPerVisit: -5.0,
            episodeProfit: -150.0,
            totalVisits: 30,
            suggestedStaffMix: "Review care plan - consider LPN for routine tasks",
            profitabilityRating: "poor",
            lastVisitDate: "2024-01-07",
          },
        ],
        costBreakdown: {
          laborCosts: { rn: 65.0, lpn: 45.0, aide: 25.0 },
          supplyCosts: 15.5,
          overheadCosts: 18.75,
          totalCosts: 169.25,
        },
        reimbursementByPayer: [
          {
            payerType: "Medicare Part A",
            avgReimbursement: 165.0,
            visitCount: 450,
            totalReimbursement: 74250,
            profitMargin: 24.2,
          },
          {
            payerType: "Medicaid",
            avgReimbursement: 110.0,
            visitCount: 320,
            totalReimbursement: 35200,
            profitMargin: 12.8,
          },
          {
            payerType: "Blue Cross",
            avgReimbursement: 185.0,
            visitCount: 280,
            totalReimbursement: 51800,
            profitMargin: 31.5,
          },
          {
            payerType: "Aetna",
            avgReimbursement: 155.0,
            visitCount: 190,
            totalReimbursement: 29450,
            profitMargin: 22.1,
          },
          {
            payerType: "Humana",
            avgReimbursement: 140.0,
            visitCount: 160,
            totalReimbursement: 22400,
            profitMargin: 15.3,
          },
        ],
        staffingRecommendations: [
          {
            visitType: "Routine Medication Management",
            currentMix: "80% RN, 20% LPN",
            recommendedMix: "40% RN, 60% LPN",
            potentialSavings: 12500,
            qualityImpact: "Minimal - LPN qualified for routine med management",
          },
          {
            visitType: "Post-Surgical Wound Care",
            currentMix: "100% RN",
            recommendedMix: "100% RN",
            potentialSavings: 0,
            qualityImpact: "RN expertise required for complex wound assessment",
          },
          {
            visitType: "Physical Therapy",
            currentMix: "70% PT, 30% PTA",
            recommendedMix: "50% PT, 50% PTA",
            potentialSavings: 8750,
            qualityImpact: "Good - PTA can handle routine therapy sessions",
          },
        ],
      },
    }

    setTimeout(() => {
      setAnalyticsData(mockData)
      setLoading(false)
    }, 1000)
  }, [selectedTimeframe, selectedDepartment])

  const getProfitabilityColor = (rating: string) => {
    switch (rating) {
      case "excellent":
        return "bg-green-100 text-green-800"
      case "good":
        return "bg-blue-100 text-blue-800"
      case "fair":
        return "bg-yellow-100 text-yellow-800"
      case "poor":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredPatients = analyticsData?.profitability.perPatientMetrics.filter((patient) => {
    const matchesSearch =
      patient.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.insuranceType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = profitabilityFilter === "all" || patient.profitabilityRating === profitabilityFilter
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading Analytics Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) return null

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">Comprehensive insights across all healthcare operations</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1_month">1 Month</SelectItem>
              <SelectItem value="3_months">3 Months</SelectItem>
              <SelectItem value="6_months">6 Months</SelectItem>
              <SelectItem value="1_year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="oasis">OASIS QA</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="hr">HR</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.totalApplications.toLocaleString()}</div>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.3% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.activeStaff}</div>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2.8% growth
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(analyticsData.overview.monthlyRevenue / 1000000).toFixed(1)}M
                </div>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8.7% vs target
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.completionRate}%</div>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Above target
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.avgProcessingTime} days</div>
                <div className="flex items-center text-xs text-red-600">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -15% faster
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analyticsData.overview.qualityScore}%</div>
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Excellent
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Department Performance Overview
              </CardTitle>
              <CardDescription>Efficiency, quality, and satisfaction metrics across all departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analyticsData.performance.departments.map((dept) => (
                  <div key={dept.name} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-lg">{dept.name}</h3>
                      <div className="flex space-x-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          {Math.round((dept.efficiency + dept.quality + dept.satisfaction) / 3)}% Overall
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <Label className="text-sm">Efficiency</Label>
                          <span className="text-sm font-medium">{dept.efficiency}%</span>
                        </div>
                        <Progress value={dept.efficiency} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <Label className="text-sm">Quality</Label>
                          <span className="text-sm font-medium">{dept.quality}%</span>
                        </div>
                        <Progress value={dept.quality} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <Label className="text-sm">Satisfaction</Label>
                          <span className="text-sm font-medium">{dept.satisfaction}%</span>
                        </div>
                        <Progress value={dept.satisfaction} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-600" />
                Quick Insights & Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-800">Top Performer</h4>
                  </div>
                  <p className="text-sm text-green-700">OASIS QA department exceeding all targets</p>
                  <Button size="sm" className="mt-2 bg-green-600 hover:bg-green-700">
                    View Details
                  </Button>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-blue-800">Growth Opportunity</h4>
                  </div>
                  <p className="text-sm text-blue-700">Physical Therapy demand up 15%</p>
                  <Button size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700">
                    Expand Program
                  </Button>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <h4 className="font-medium text-orange-800">Attention Needed</h4>
                  </div>
                  <p className="text-sm text-orange-700">HR processing time above target</p>
                  <Button size="sm" className="mt-2 bg-orange-600 hover:bg-orange-700">
                    Optimize Process
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applications Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Application Trends
                </CardTitle>
                <CardDescription>Monthly application volume and approval rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.trends.applications}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                      name="Total Applications"
                    />
                    <Area
                      type="monotone"
                      dataKey="approved"
                      stackId="2"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.8}
                      name="Approved"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Revenue Performance
                </CardTitle>
                <CardDescription>Actual vs forecasted revenue trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.trends.revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${(Number(value) / 1000000).toFixed(1)}M`, ""]} />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} name="Actual Revenue" />
                    <Line type="monotone" dataKey="forecast" stroke="#6B7280" strokeDasharray="5 5" name="Forecast" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quality Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Quality Score Trends
                </CardTitle>
                <CardDescription>Quality performance vs targets over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.trends.quality}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[85, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={3} name="Quality Score" />
                    <Line type="monotone" dataKey="target" stroke="#EF4444" strokeDasharray="5 5" name="Target" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Staffing Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-600" />
                  Staffing Metrics
                </CardTitle>
                <CardDescription>Active staff, new hires, and turnover trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.trends.staffing}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="active" fill="#3B82F6" name="Active Staff" />
                    <Bar dataKey="new" fill="#10B981" name="New Hires" />
                    <Bar dataKey="turnover" fill="#EF4444" name="Turnover" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Age Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Age Distribution
                </CardTitle>
                <CardDescription>Staff age demographics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.demographics.ageGroups}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Experience Levels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  Experience Distribution
                </CardTitle>
                <CardDescription>Staff experience levels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.demographics.experience}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ level, percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.demographics.experience.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Specialties Demand */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-purple-600" />
                  Specialty Areas
                </CardTitle>
                <CardDescription>Staff count vs market demand by specialty</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.demographics.specialties.map((specialty) => (
                    <div key={specialty.specialty} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{specialty.specialty}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{specialty.count} staff</span>
                          <Badge
                            className={
                              specialty.demand > 90
                                ? "bg-green-100 text-green-800"
                                : specialty.demand > 85
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {specialty.demand}% demand
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Staff Count</Label>
                          <Progress value={(specialty.count / 150) * 100} className="h-2" />
                        </div>
                        <div>
                          <Label className="text-xs">Market Demand</Label>
                          <Progress value={specialty.demand} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  Geographic Distribution
                </CardTitle>
                <CardDescription>Staff distribution and growth by state</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.demographics.locations.map((location) => (
                    <div key={location.state} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium">{location.state}</span>
                        <p className="text-sm text-gray-600">{location.count} staff members</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={
                            location.growth > 15
                              ? "bg-green-100 text-green-800"
                              : location.growth > 10
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }
                        >
                          +{location.growth}% growth
                        </Badge>
                        <div className="w-20">
                          <Progress value={(location.count / 156) * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Department Performance Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Department Performance Comparison
              </CardTitle>
              <CardDescription>Detailed performance metrics across all departments</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.performance.departments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="efficiency" fill="#3B82F6" name="Efficiency %" />
                  <Bar dataKey="quality" fill="#10B981" name="Quality %" />
                  <Bar dataKey="satisfaction" fill="#F59E0B" name="Satisfaction %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Improvement Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Performance Improvement Tracking
              </CardTitle>
              <CardDescription>Month-over-month improvement in key performance areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { metric: "Application Processing Speed", current: 4.2, previous: 5.1, unit: "days", trend: "down" },
                  { metric: "Quality Score", current: 94.1, previous: 91.8, unit: "%", trend: "up" },
                  { metric: "Staff Satisfaction", current: 89.2, previous: 86.7, unit: "%", trend: "up" },
                  { metric: "Revenue per Episode", current: 3247, previous: 3156, unit: "$", trend: "up" },
                  { metric: "Compliance Rate", current: 97.1, previous: 95.8, unit: "%", trend: "up" },
                  { metric: "Training Completion", current: 92.4, previous: 88.9, unit: "%", trend: "up" },
                ].map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{item.metric}</h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">
                        {item.unit === "$" ? "$" : ""}
                        {item.current}
                        {item.unit !== "$" ? item.unit : ""}
                      </span>
                      <div
                        className={`flex items-center text-sm ${item.trend === "up" ? "text-green-600" : "text-red-600"}`}
                      >
                        {item.trend === "up" ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {Math.abs(((item.current - item.previous) / item.previous) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      Previous: {item.unit === "$" ? "$" : ""}
                      {item.previous}
                      {item.unit !== "$" ? item.unit : ""}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          {/* OASIS Quality Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                OASIS Quality Assessment
              </CardTitle>
              <CardDescription>AI-powered quality metrics and improvement tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analyticsData.performance.oasisQuality.map((item) => (
                  <div key={item.category} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{item.category}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={
                            item.score >= item.target ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                          }
                        >
                          {item.score}% (Target: {item.target}%)
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800">+{item.improvement}% improvement</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Current Performance</Label>
                        <Progress value={item.score} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm">Target Achievement</Label>
                        <Progress value={(item.score / item.target) * 100} className="mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quality Improvement Initiatives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Quality Improvement Initiatives
              </CardTitle>
              <CardDescription>Active quality improvement programs and their impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Active Initiatives</h4>
                  {[
                    { name: "AI-Powered Documentation Review", status: "In Progress", impact: "High", completion: 75 },
                    { name: "Staff Training Enhancement", status: "Completed", impact: "Medium", completion: 100 },
                    { name: "Compliance Automation", status: "Planning", impact: "High", completion: 25 },
                    { name: "Quality Metrics Dashboard", status: "In Progress", impact: "Medium", completion: 60 },
                  ].map((initiative, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{initiative.name}</span>
                        <Badge
                          className={
                            initiative.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : initiative.status === "In Progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }
                        >
                          {initiative.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs">Progress</span>
                        <span className="text-xs">{initiative.completion}%</span>
                      </div>
                      <Progress value={initiative.completion} className="h-2" />
                      <p className="text-xs text-gray-600 mt-1">Impact: {initiative.impact}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Quality Trends</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analyticsData.trends.quality}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[85, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={3} />
                      <Line type="monotone" dataKey="target" stroke="#EF4444" strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {/* Key Financial Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Key Financial Metrics
              </CardTitle>
              <CardDescription>Current performance vs targets across financial KPIs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {analyticsData.performance.financialMetrics.map((metric) => (
                  <div key={metric.metric} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{metric.metric}</h4>
                      <div
                        className={`flex items-center text-sm ${metric.trend === "up" ? "text-green-600" : "text-red-600"}`}
                      >
                        {metric.trend === "up" ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                      </div>
                    </div>
                    <div className="text-2xl font-bold mb-1">
                      {metric.metric.includes("$") ||
                      metric.metric.includes("Revenue") ||
                      metric.metric.includes("Cost")
                        ? "$"
                        : ""}
                      {metric.current}
                      {metric.metric.includes("%") || metric.metric.includes("Rate") || metric.metric.includes("Margin")
                        ? "%"
                        : ""}
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Target: {metric.target}</span>
                      <span className={metric.current >= metric.target ? "text-green-600" : "text-red-600"}>
                        {metric.current >= metric.target ? "✓ Met" : "⚠ Below"}
                      </span>
                    </div>
                    <Progress
                      value={
                        metric.trend === "down"
                          ? Math.max(0, 100 - (metric.current / metric.target) * 100)
                          : (metric.current / metric.target) * 100
                      }
                      className="mt-2 h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* True Profitability Per Patient Section */}
          <Collapsible open={profitabilityExpanded} onOpenChange={setProfitabilityExpanded}>
            <Card className="border-l-4 border-l-blue-500">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-blue-600" />📊 True Profitability Per Patient (Beta)
                        <Badge className="bg-blue-100 text-blue-800 ml-2">New</Badge>
                      </CardTitle>
                      <CardDescription>
                        Detailed financial performance per visit, per patient, by insurance type and staffing level
                      </CardDescription>
                    </div>
                    {profitabilityExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {/* Cost Breakdown Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <UserCheck className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium text-blue-800">Labor Costs</h4>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>RN Rate:</span>
                          <span className="font-medium">
                            ${analyticsData.profitability.costBreakdown.laborCosts.rn}/hr
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>LPN Rate:</span>
                          <span className="font-medium">
                            ${analyticsData.profitability.costBreakdown.laborCosts.lpn}/hr
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Aide Rate:</span>
                          <span className="font-medium">
                            ${analyticsData.profitability.costBreakdown.laborCosts.aide}/hr
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium text-green-800">Supply Costs</h4>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        ${analyticsData.profitability.costBreakdown.supplyCosts}
                      </div>
                      <p className="text-sm text-green-700">Per visit average</p>
                    </div>

                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="h-5 w-5 text-orange-600" />
                        <h4 className="font-medium text-orange-800">Overhead</h4>
                      </div>
                      <div className="text-2xl font-bold text-orange-600">
                        ${analyticsData.profitability.costBreakdown.overheadCosts}
                      </div>
                      <p className="text-sm text-orange-700">Per visit allocation</p>
                    </div>

                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="h-5 w-5 text-purple-600" />
                        <h4 className="font-medium text-purple-800">Total Cost</h4>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">
                        ${analyticsData.profitability.costBreakdown.totalCosts}
                      </div>
                      <p className="text-sm text-purple-700">Average per visit</p>
                    </div>
                  </div>

                  {/* Reimbursement by Payer */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-green-600" />
                        Reimbursement by Payer Type
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData.profitability.reimbursementByPayer.map((payer) => (
                          <div key={payer.payerType} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">{payer.payerType}</h4>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  className={
                                    payer.profitMargin > 25
                                      ? "bg-green-100 text-green-800"
                                      : payer.profitMargin > 15
                                        ? "bg-blue-100 text-blue-800"
                                        : payer.profitMargin > 10
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                  }
                                >
                                  {payer.profitMargin}% margin
                                </Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Avg Reimbursement:</span>
                                <div className="font-bold text-green-600">${payer.avgReimbursement}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Visit Count:</span>
                                <div className="font-bold">{payer.visitCount}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Total Revenue:</span>
                                <div className="font-bold">${payer.totalReimbursement.toLocaleString()}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Profit Margin:</span>
                                <div className="font-bold text-blue-600">{payer.profitMargin}%</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Patient-Level Profitability */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          Patient-Level Profitability Analysis
                        </CardTitle>
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
                          <Select value={profitabilityFilter} onValueChange={setProfitabilityFilter}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Filter" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Ratings</SelectItem>
                              <SelectItem value="excellent">Excellent</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="fair">Fair</SelectItem>
                              <SelectItem value="poor">Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {filteredPatients?.map((patient) => (
                          <div key={patient.patientId} className="p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <h4 className="font-medium">{patient.patientName}</h4>
                                  <p className="text-sm text-gray-600">
                                    {patient.insuranceType} • {patient.visitType} • {patient.staffType}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge className={getProfitabilityColor(patient.profitabilityRating)}>
                                  {patient.profitabilityRating}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {patient.totalVisits} visits
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">True Cost/Visit:</span>
                                <div className="font-bold text-red-600">${patient.trueCostPerVisit}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Reimbursement/Visit:</span>
                                <div className="font-bold text-green-600">${patient.avgReimbursementPerVisit}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Profit/Visit:</span>
                                <div
                                  className={`font-bold ${patient.profitPerVisit >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  ${patient.profitPerVisit}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">Episode Profit:</span>
                                <div
                                  className={`font-bold ${patient.episodeProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  ${patient.episodeProfit}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">Last Visit:</span>
                                <div className="font-medium">
                                  {new Date(patient.lastVisitDate).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 p-3 bg-blue-50 rounded">
                              <div className="flex items-center gap-2 mb-1">
                                <Zap className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-800">Staffing Recommendation:</span>
                              </div>
                              <p className="text-sm text-blue-700">{patient.suggestedStaffMix}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Staffing Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-600" />
                        Staffing Mix Optimization Recommendations
                      </CardTitle>
                      <CardDescription>
                        AI-powered recommendations to optimize staffing costs while maintaining quality
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData.profitability.staffingRecommendations.map((recommendation, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">{recommendation.visitType}</h4>
                              <Badge className="bg-green-100 text-green-800">
                                ${recommendation.potentialSavings.toLocaleString()} potential savings
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Current Mix:</span>
                                <div className="font-medium">{recommendation.currentMix}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Recommended Mix:</span>
                                <div className="font-medium text-blue-600">{recommendation.recommendedMix}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Quality Impact:</span>
                                <div className="font-medium">{recommendation.qualityImpact}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Profitability Visualization */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PieChartIcon className="h-5 w-5 text-purple-600" />
                          Profit Distribution by Insurance Type
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={analyticsData.profitability.reimbursementByPayer}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ payerType, profitMargin }) => `${payerType}: ${profitMargin}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="profitMargin"
                            >
                              {analyticsData.profitability.reimbursementByPayer.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`hsl(${index * 72}, 70%, 50%)`} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUpIcon className="h-5 w-5 text-green-600" />
                          Cost vs Reimbursement Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <ScatterChart
                            data={analyticsData.profitability.perPatientMetrics}
                            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                          >
                            <CartesianGrid />
                            <XAxis type="number" dataKey="trueCostPerVisit" name="True Cost" unit="$" />
                            <YAxis type="number" dataKey="avgReimbursementPerVisit" name="Reimbursement" unit="$" />
                            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                            <Scatter name="Patients" dataKey="avgReimbursementPerVisit" fill="#8884d8" />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Action Items */}
                  <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        Recommended Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="font-medium text-red-800">Immediate Attention Required:</h4>
                          <div className="space-y-2">
                            {filteredPatients
                              ?.filter((p) => p.profitabilityRating === "poor")
                              .map((patient) => (
                                <div
                                  key={patient.patientId}
                                  className="p-2 bg-red-50 border border-red-200 rounded text-sm"
                                >
                                  <span className="font-medium">{patient.patientName}</span> - Review care plan and
                                  staffing
                                </div>
                              ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-medium text-green-800">Optimization Opportunities:</h4>
                          <div className="space-y-2">
                            <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                              Implement LPN utilization for routine medication management
                            </div>
                            <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                              Increase PTA utilization for standard physical therapy sessions
                            </div>
                            <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                              Review supply costs for wound care patients
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Revenue Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Revenue Analysis
              </CardTitle>
              <CardDescription>Detailed revenue breakdown and forecasting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Revenue Trend</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.trends.revenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${(Number(value) / 1000000).toFixed(1)}M`, ""]} />
                      <Area type="monotone" dataKey="amount" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Revenue Breakdown</h4>
                  <div className="space-y-4">
                    {[
                      { source: "Home Health Services", amount: 1850000, percentage: 65 },
                      { source: "Hospice Care", amount: 680000, percentage: 24 },
                      { source: "Therapy Services", amount: 320000, percentage: 11 },
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{item.source}</span>
                          <span className="text-sm">
                            ${(item.amount / 1000000).toFixed(1)}M ({item.percentage}%)
                          </span>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  )
}
