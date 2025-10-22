"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Target,
  Brain,
  BarChart3,
  Download,
  Star,
  Activity,
  MessageSquare,
} from "lucide-react"

interface PerformanceMetric {
  id: string
  name: string
  value: number
  change: number
  trend: "up" | "down" | "stable"
  category: string
}

interface StaffPerformance {
  name: string
  role: string
  overallScore: number
  clinicalSkills: number
  communication: number
  safety: number
  documentation: number
  professionalism: number
  trend: "improving" | "declining" | "stable"
}

export default function PerformanceAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("6months")
  const [selectedDepartment, setSelectedDepartment] = useState("all")

  const performanceMetrics: PerformanceMetric[] = [
    {
      id: "overall",
      name: "Overall Performance",
      value: 87.5,
      change: 3.2,
      trend: "up",
      category: "general",
    },
    {
      id: "clinical",
      name: "Clinical Excellence",
      value: 89.2,
      change: 2.8,
      trend: "up",
      category: "clinical",
    },
    {
      id: "safety",
      name: "Safety Compliance",
      value: 94.1,
      change: 1.5,
      trend: "up",
      category: "safety",
    },
    {
      id: "satisfaction",
      name: "Patient Satisfaction",
      value: 91.7,
      change: -0.8,
      trend: "down",
      category: "patient",
    },
    {
      id: "efficiency",
      name: "Operational Efficiency",
      value: 85.3,
      change: 4.1,
      trend: "up",
      category: "operations",
    },
    {
      id: "compliance",
      name: "Documentation Compliance",
      value: 82.9,
      change: -1.2,
      trend: "down",
      category: "compliance",
    },
  ]

  const monthlyTrends = [
    { month: "Jan", performance: 82, evaluations: 45, improvements: 12 },
    { month: "Feb", performance: 84, evaluations: 52, improvements: 15 },
    { month: "Mar", performance: 86, evaluations: 48, improvements: 18 },
    { month: "Apr", performance: 85, evaluations: 55, improvements: 14 },
    { month: "May", performance: 88, evaluations: 49, improvements: 22 },
    { month: "Jun", performance: 87, evaluations: 53, improvements: 19 },
  ]

  const departmentPerformance = [
    { department: "Clinical", score: 89, staff: 12, color: "#3B82F6" },
    { department: "Therapy", score: 86, staff: 8, color: "#10B981" },
    { department: "Personal Care", score: 84, staff: 15, color: "#F59E0B" },
    { department: "Administration", score: 91, staff: 6, color: "#8B5CF6" },
  ]

  const topPerformers: StaffPerformance[] = [
    {
      name: "Sarah Johnson",
      role: "RN",
      overallScore: 95,
      clinicalSkills: 96,
      communication: 94,
      safety: 98,
      documentation: 92,
      professionalism: 97,
      trend: "improving",
    },
    {
      name: "Michael Chen",
      role: "PT",
      overallScore: 92,
      clinicalSkills: 94,
      communication: 91,
      safety: 95,
      documentation: 88,
      professionalism: 92,
      trend: "stable",
    },
    {
      name: "Emily Davis",
      role: "OT",
      overallScore: 90,
      clinicalSkills: 89,
      communication: 93,
      safety: 92,
      documentation: 87,
      professionalism: 91,
      trend: "improving",
    },
  ]

  const competencyDistribution = [
    { level: "Excellent", count: 8, percentage: 32 },
    { level: "Competent", count: 14, percentage: 56 },
    { level: "Needs Improvement", count: 3, percentage: 12 },
  ]

  const aiInsights = [
    {
      category: "Performance Trend",
      insight: "Overall staff performance has improved by 5.2% over the last quarter",
      confidence: 94,
      impact: "High",
    },
    {
      category: "Risk Assessment",
      insight: "3 staff members show declining documentation scores - intervention recommended",
      confidence: 87,
      impact: "Medium",
    },
    {
      category: "Training Opportunity",
      insight: "Advanced wound care training could benefit 60% of clinical staff",
      confidence: 91,
      impact: "High",
    },
    {
      category: "Recognition",
      insight: "Sarah Johnson consistently exceeds performance benchmarks across all categories",
      confidence: 98,
      impact: "Low",
    },
  ]

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return "text-green-600 bg-green-100"
      case "declining":
        return "text-red-600 bg-red-100"
      default:
        return "text-blue-600 bg-blue-100"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    M.A.S.E Performance Analytics
                  </h1>
                  <p className="text-gray-600">AI-Driven Staff Performance Intelligence</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {performanceMetrics.map((metric) => (
            <Card key={metric.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                  {getTrendIcon(metric.trend)}
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-blue-600">{metric.value}%</span>
                  <span className={`text-sm font-medium ${metric.change > 0 ? "text-green-600" : "text-red-600"}`}>
                    {metric.change > 0 ? "+" : ""}
                    {metric.change}%
                  </span>
                </div>
                <Progress value={metric.value} className="mt-3 h-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="individuals">Individual Performance</TabsTrigger>
            <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Competency Distribution
                  </CardTitle>
                  <CardDescription>Current staff competency levels across the organization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {competencyDistribution.map((level) => (
                      <div key={level.level} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-4 h-4 rounded-full ${
                              level.level === "Excellent"
                                ? "bg-green-500"
                                : level.level === "Competent"
                                  ? "bg-blue-500"
                                  : "bg-red-500"
                            }`}
                          />
                          <span className="font-medium">{level.level}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold">{level.count}</span>
                          <span className="text-sm text-gray-600">({level.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={competencyDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                        >
                          {competencyDistribution.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.level === "Excellent"
                                  ? "#10B981"
                                  : entry.level === "Competent"
                                    ? "#3B82F6"
                                    : "#EF4444"
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Department Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Department Performance
                  </CardTitle>
                  <CardDescription>Average performance scores by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departmentPerformance.map((dept) => (
                      <div key={dept.department} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{dept.department}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold">{dept.score}%</span>
                            <Badge variant="outline">{dept.staff} staff</Badge>
                          </div>
                        </div>
                        <Progress value={dept.score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Performance Trends
                </CardTitle>
                <CardDescription>Monthly performance metrics and evaluation trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="performance"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      name="Performance Score"
                    />
                    <Line
                      type="monotone"
                      dataKey="evaluations"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Evaluations Completed"
                    />
                    <Line
                      type="monotone"
                      dataKey="improvements"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      name="Improvement Plans"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Department Comparison
                </CardTitle>
                <CardDescription>Detailed performance breakdown by department</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={departmentPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="individuals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Top Performers
                </CardTitle>
                <CardDescription>Individual staff performance analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {topPerformers.map((performer) => (
                    <div key={performer.name} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{performer.name}</h3>
                          <p className="text-gray-600">{performer.role}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{performer.overallScore}%</div>
                          <Badge className={getTrendColor(performer.trend)}>{performer.trend}</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-600">Clinical</div>
                          <div className="text-lg font-bold">{performer.clinicalSkills}%</div>
                          <Progress value={performer.clinicalSkills} className="h-1 mt-1" />
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-600">Communication</div>
                          <div className="text-lg font-bold">{performer.communication}%</div>
                          <Progress value={performer.communication} className="h-1 mt-1" />
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-600">Safety</div>
                          <div className="text-lg font-bold">{performer.safety}%</div>
                          <Progress value={performer.safety} className="h-1 mt-1" />
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-600">Documentation</div>
                          <div className="text-lg font-bold">{performer.documentation}%</div>
                          <Progress value={performer.documentation} className="h-1 mt-1" />
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-600">Professional</div>
                          <div className="text-lg font-bold">{performer.professionalism}%</div>
                          <Progress value={performer.professionalism} className="h-1 mt-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI-Generated Insights
                </CardTitle>
                <CardDescription>Intelligent analysis and recommendations from M.A.S.E AI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiInsights.map((insight, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline">{insight.category}</Badge>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={
                              insight.impact === "High"
                                ? "bg-red-100 text-red-600"
                                : insight.impact === "Medium"
                                  ? "bg-yellow-100 text-yellow-600"
                                  : "bg-green-100 text-green-600"
                            }
                          >
                            {insight.impact} Impact
                          </Badge>
                          <span className="text-sm text-gray-600">Confidence: {insight.confidence}%</span>
                        </div>
                      </div>
                      <p className="text-gray-800">{insight.insight}</p>
                      <div className="mt-3 flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Target className="h-3 w-3 mr-1" />
                          Create Action Plan
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Discuss
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
