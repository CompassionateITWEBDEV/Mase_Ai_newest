"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChartIcon,
  Activity,
  Download,
  RefreshCw,
} from "lucide-react"

interface SupplyUsage {
  id: string
  patientId: string
  patientName: string
  supplyId: string
  supplyName: string
  quantity: number
  unitCost: number
  totalCost: number
  usedBy: string
  usedAt: string
  notes?: string
  woundLocation?: string
  treatmentType?: string
}

interface SupplyCostAnalyzerProps {
  patientId: string
  patientName: string
  supplyUsage: SupplyUsage[]
}

interface CostAnalytics {
  totalCost: number
  totalItems: number
  averageCostPerDay: number
  mostExpensiveSupply: string
  mostUsedSupply: string
  costTrend: "increasing" | "decreasing" | "stable"
  categoryBreakdown: Array<{
    category: string
    cost: number
    percentage: number
    items: number
  }>
  dailyCosts: Array<{
    date: string
    cost: number
    items: number
  }>
  supplyEfficiency: Array<{
    supply: string
    costPerUse: number
    frequency: number
    totalCost: number
  }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658"]

export function SupplyCostAnalyzer({ patientId, patientName, supplyUsage }: SupplyCostAnalyzerProps) {
  const [analytics, setAnalytics] = useState<CostAnalytics | null>(null)
  const [timeRange, setTimeRange] = useState("30")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    generateAnalytics()
  }, [supplyUsage, timeRange])

  const generateAnalytics = () => {
    setIsLoading(true)

    try {
      if (!supplyUsage || supplyUsage.length === 0) {
        setAnalytics(null)
        setIsLoading(false)
        return
      }

      // Filter by time range
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - Number.parseInt(timeRange))

      const filteredUsage = supplyUsage.filter((usage) => new Date(usage.usedAt) >= cutoffDate)

      // Calculate basic metrics
      const totalCost = filteredUsage.reduce((sum, usage) => sum + usage.totalCost, 0)
      const totalItems = filteredUsage.reduce((sum, usage) => sum + usage.quantity, 0)
      const daysCovered = Math.max(1, Number.parseInt(timeRange))
      const averageCostPerDay = totalCost / daysCovered

      // Find most expensive and most used supplies
      const supplyCosts = filteredUsage.reduce(
        (acc, usage) => {
          acc[usage.supplyName] = (acc[usage.supplyName] || 0) + usage.totalCost
          return acc
        },
        {} as Record<string, number>,
      )

      const supplyQuantities = filteredUsage.reduce(
        (acc, usage) => {
          acc[usage.supplyName] = (acc[usage.supplyName] || 0) + usage.quantity
          return acc
        },
        {} as Record<string, number>,
      )

      const mostExpensiveSupply = Object.entries(supplyCosts).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
      const mostUsedSupply = Object.entries(supplyQuantities).reduce((a, b) => (a[1] > b[1] ? a : b))[0]

      // Calculate cost trend
      const sortedUsage = [...filteredUsage].sort((a, b) => new Date(a.usedAt).getTime() - new Date(b.usedAt).getTime())
      const midPoint = Math.floor(sortedUsage.length / 2)
      const firstHalfCost = sortedUsage.slice(0, midPoint).reduce((sum, usage) => sum + usage.totalCost, 0)
      const secondHalfCost = sortedUsage.slice(midPoint).reduce((sum, usage) => sum + usage.totalCost, 0)

      let costTrend: "increasing" | "decreasing" | "stable" = "stable"
      if (secondHalfCost > firstHalfCost * 1.1) costTrend = "increasing"
      else if (secondHalfCost < firstHalfCost * 0.9) costTrend = "decreasing"

      // Category breakdown
      const categoryMap: Record<string, string> = {
        "Hydrocolloid Dressing": "Dressing",
        "Foam Dressing": "Dressing",
        "Antiseptic Solution": "Antiseptic",
        "Sterile Gauze Pads": "Gauze",
        "Medical Tape": "Tape",
        "Wound Cleanser": "Antiseptic",
        "Transparent Film": "Dressing",
        "Calcium Alginate": "Dressing",
        Hydrogel: "Ointment",
        "Compression Bandage": "Bandage",
      }

      const categoryBreakdown = filteredUsage.reduce(
        (acc, usage) => {
          const category = categoryMap[usage.supplyName] || "Other"
          if (!acc[category]) {
            acc[category] = { cost: 0, items: 0 }
          }
          acc[category].cost += usage.totalCost
          acc[category].items += usage.quantity
          return acc
        },
        {} as Record<string, { cost: number; items: number }>,
      )

      const categoryArray = Object.entries(categoryBreakdown)
        .map(([category, data]) => ({
          category,
          cost: data.cost,
          percentage: (data.cost / totalCost) * 100,
          items: data.items,
        }))
        .sort((a, b) => b.cost - a.cost)

      // Daily costs
      const dailyCosts = filteredUsage.reduce(
        (acc, usage) => {
          const date = new Date(usage.usedAt).toISOString().split("T")[0]
          if (!acc[date]) {
            acc[date] = { cost: 0, items: 0 }
          }
          acc[date].cost += usage.totalCost
          acc[date].items += usage.quantity
          return acc
        },
        {} as Record<string, { cost: number; items: number }>,
      )

      const dailyCostArray = Object.entries(dailyCosts)
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString(),
          cost: data.cost,
          items: data.items,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      // Supply efficiency
      const supplyEfficiency = Object.entries(supplyCosts)
        .map(([supply, totalCost]) => {
          const frequency = supplyQuantities[supply] || 1
          return {
            supply,
            costPerUse: totalCost / frequency,
            frequency,
            totalCost,
          }
        })
        .sort((a, b) => b.totalCost - a.totalCost)

      const analyticsData: CostAnalytics = {
        totalCost,
        totalItems,
        averageCostPerDay,
        mostExpensiveSupply,
        mostUsedSupply,
        costTrend,
        categoryBreakdown: categoryArray,
        dailyCosts: dailyCostArray,
        supplyEfficiency,
      }

      setAnalytics(analyticsData)
    } catch (error) {
      console.error("Error generating analytics:", error)
      setAnalytics(null)
    } finally {
      setIsLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-red-600" />
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-green-600" />
      default:
        return <Activity className="h-4 w-4 text-blue-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "increasing":
        return "text-red-600"
      case "decreasing":
        return "text-green-600"
      default:
        return "text-blue-600"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Analyzing supply costs...</span>
            </div>
            <Progress value={75} className="w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No supply usage data available for analysis</p>
          <p className="text-sm text-gray-400">Start recording supply usage to see cost analytics</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Supply Cost Analysis</h3>
          <p className="text-sm text-gray-600">
            Patient: {patientName} • Last {timeRange} days
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-green-600">${analytics.totalCost.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Daily Average</p>
                <p className="text-2xl font-bold text-purple-600">${analytics.averageCostPerDay.toFixed(2)}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cost Trend</p>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(analytics.costTrend)}
                  <span className={`text-sm font-medium ${getTrendColor(analytics.costTrend)}`}>
                    {analytics.costTrend.charAt(0).toUpperCase() + analytics.costTrend.slice(1)}
                  </span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Supplies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Most Expensive Supply</h4>
                  <p className="text-sm">{analytics.mostExpensiveSupply}</p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Most Used Supply</h4>
                  <p className="text-sm">{analytics.mostUsedSupply}</p>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">Cost Efficiency</h4>
                  <p className="text-sm">
                    Average cost per item: ${(analytics.totalCost / analytics.totalItems).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Category Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="h-5 w-5 mr-2" />
                  Cost by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="cost"
                    >
                      {analytics.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Category Breakdown
              </CardTitle>
              <CardDescription>Supply costs and usage by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.categoryBreakdown.map((category, index) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="font-medium">{category.category}</span>
                        <Badge variant="outline">{category.items} items</Badge>
                      </div>
                      <span className="font-semibold">${category.cost.toFixed(2)}</span>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                    <div className="text-xs text-gray-500">{category.percentage.toFixed(1)}% of total cost</div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.categoryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]} />
                    <Legend />
                    <Bar dataKey="cost" fill="#8884d8" name="Cost ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Daily Cost Trends
              </CardTitle>
              <CardDescription>Supply costs and usage over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analytics.dailyCosts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === "cost" ? `$${value.toFixed(2)}` : value,
                      name === "cost" ? "Cost" : "Items",
                    ]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="cost" stackId="1" stroke="#8884d8" fill="#8884d8" name="Cost ($)" />
                  <Area type="monotone" dataKey="items" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Items Used" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Supply Efficiency Analysis
              </CardTitle>
              <CardDescription>Cost per use and frequency analysis for each supply</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.supplyEfficiency.map((supply, index) => (
                  <div key={supply.supply} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{supply.supply}</h4>
                      <Badge className="bg-green-100 text-green-800">${supply.totalCost.toFixed(2)} total</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Cost per use:</span>
                        <p className="font-semibold">${supply.costPerUse.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Frequency:</span>
                        <p className="font-semibold">{supply.frequency} times</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Efficiency:</span>
                        <div className="flex items-center space-x-1">
                          {supply.costPerUse < 10 ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : supply.costPerUse < 20 ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <span
                            className={
                              supply.costPerUse < 10
                                ? "text-green-600"
                                : supply.costPerUse < 20
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }
                          >
                            {supply.costPerUse < 10 ? "Efficient" : supply.costPerUse < 20 ? "Moderate" : "High Cost"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
