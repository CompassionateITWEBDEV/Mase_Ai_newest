"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  LineChart,
  Line,
} from "recharts"
import {
  DollarSign,
  Package,
  User,
  Activity,
  Download,
  RefreshCw,
  BarChart3,
  PieChartIcon,
  TrendingUp,
} from "lucide-react"

interface SupplyUsage {
  id: string
  patientId: string
  patientName: string
  supplyId: string
  supplyName: string
  category: string
  quantity: number
  unitCost: number
  totalCost: number
  usedAt: string
}

interface StaffSupplyAnalyzerProps {
  staffId: string
  staffName: string
  supplyUsage: SupplyUsage[]
}

interface CostAnalytics {
  totalCost: number
  totalItems: number
  averageCostPerDay: number
  costTrend: "increasing" | "decreasing" | "stable"
  costByPatient: Array<{
    name: string
    cost: number
    items: number
  }>
  costByCategory: Array<{
    name: string
    cost: number
    items: number
  }>
  dailyCosts: Array<{
    date: string
    cost: number
    items: number
  }>
  mostUsedSupply: string
  highestCostPatient: string
  averageCostPerPatient: number
  averageCostPerItem: number
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658", "#FF7C7C"]

export function StaffSupplyAnalyzer({ staffId, staffName, supplyUsage }: StaffSupplyAnalyzerProps) {
  const [analytics, setAnalytics] = useState<CostAnalytics | null>(null)
  const [timeRange, setTimeRange] = useState("30")
  const [isLoading, setIsLoading] = useState(true)

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

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - Number.parseInt(timeRange))
      const filteredUsage = supplyUsage.filter((usage) => new Date(usage.usedAt) >= cutoffDate)

      if (filteredUsage.length === 0) {
        setAnalytics(null)
        setIsLoading(false)
        return
      }

      const totalCost = filteredUsage.reduce((sum, usage) => sum + usage.totalCost, 0)
      const totalItems = filteredUsage.reduce((sum, usage) => sum + usage.quantity, 0)
      const daysCovered = Math.max(1, Number.parseInt(timeRange))
      const averageCostPerDay = totalCost / daysCovered

      const costByPatient = filteredUsage.reduce(
        (acc, usage) => {
          if (!acc[usage.patientName]) {
            acc[usage.patientName] = { cost: 0, items: 0 }
          }
          acc[usage.patientName].cost += usage.totalCost
          acc[usage.patientName].items += usage.quantity
          return acc
        },
        {} as Record<string, { cost: number; items: number }>,
      )

      const costByCategory = filteredUsage.reduce(
        (acc, usage) => {
          if (!acc[usage.category]) {
            acc[usage.category] = { cost: 0, items: 0 }
          }
          acc[usage.category].cost += usage.totalCost
          acc[usage.category].items += usage.quantity
          return acc
        },
        {} as Record<string, { cost: number; items: number }>,
      )

      const supplyQuantities = filteredUsage.reduce(
        (acc, usage) => {
          acc[usage.supplyName] = (acc[usage.supplyName] || 0) + usage.quantity
          return acc
        },
        {} as Record<string, number>,
      )

      const mostUsedSupply = Object.entries(supplyQuantities).reduce((a, b) => (a[1] > b[1] ? a : b), ["", 0])[0]
      const highestCostPatient = Object.entries(costByPatient).reduce(
        (a, b) => (a[1].cost > b[1].cost ? a : b),
        ["", { cost: 0, items: 0 }],
      )[0]

      const sortedUsage = [...filteredUsage].sort((a, b) => new Date(a.usedAt).getTime() - new Date(b.usedAt).getTime())
      const midPoint = Math.floor(sortedUsage.length / 2)
      const firstHalfCost = sortedUsage.slice(0, midPoint).reduce((sum, usage) => sum + usage.totalCost, 0)
      const secondHalfCost = sortedUsage.slice(midPoint).reduce((sum, usage) => sum + usage.totalCost, 0)
      let costTrend: "increasing" | "decreasing" | "stable" = "stable"
      if (secondHalfCost > firstHalfCost * 1.1) costTrend = "increasing"
      else if (secondHalfCost < firstHalfCost * 0.9) costTrend = "decreasing"

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

      const uniquePatients = new Set(filteredUsage.map((u) => u.patientName)).size
      const averageCostPerPatient = uniquePatients > 0 ? totalCost / uniquePatients : 0
      const averageCostPerItem = totalItems > 0 ? totalCost / totalItems : 0

      setAnalytics({
        totalCost,
        totalItems,
        averageCostPerDay,
        costTrend,
        costByPatient: Object.entries(costByPatient)
          .map(([name, data]) => ({ name, cost: data.cost, items: data.items }))
          .sort((a, b) => b.cost - a.cost),
        costByCategory: Object.entries(costByCategory)
          .map(([name, data]) => ({ name, cost: data.cost, items: data.items }))
          .sort((a, b) => b.cost - a.cost),
        dailyCosts: Object.entries(dailyCosts)
          .map(([date, data]) => ({ date, cost: data.cost, items: data.items }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        mostUsedSupply,
        highestCostPatient,
        averageCostPerPatient,
        averageCostPerItem,
      })
    } catch (error) {
      console.error("Error generating analytics:", error)
      setAnalytics(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center h-64">
          <div className="flex items-center space-x-2 text-gray-500">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Analyzing your supply usage...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="text-center py-16">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-800">No Supply Data Available</h3>
          <p className="text-gray-500 mt-1">There is no supply usage data for the selected time range.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <CardTitle>Advanced Supply Analytics</CardTitle>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supply Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">${analytics.averageCostPerDay.toFixed(2)} per day average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items Used</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalItems}</div>
            <p className="text-xs text-muted-foreground">${analytics.averageCostPerItem.toFixed(2)} per item average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Trend</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold capitalize ${
                analytics.costTrend === "increasing"
                  ? "text-red-500"
                  : analytics.costTrend === "decreasing"
                    ? "text-green-500"
                    : "text-blue-500"
              }`}
            >
              {analytics.costTrend}
            </div>
            <p className="text-xs text-muted-foreground">Compared to previous period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Patient</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.averageCostPerPatient.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per patient served</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Daily Cost Trend
            </CardTitle>
            <CardDescription>Your daily supply costs over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.dailyCosts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number, name: string) => [
                    name === "cost" ? `$${value.toFixed(2)}` : value,
                    name === "cost" ? "Cost" : "Items",
                  ]}
                />
                <Legend />
                <Line type="monotone" dataKey="cost" stroke="#8884d8" strokeWidth={2} name="Daily Cost" />
                <Line type="monotone" dataKey="items" stroke="#82ca9d" strokeWidth={2} name="Items Used" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2" />
              Cost by Patient
            </CardTitle>
            <CardDescription>Supply costs per patient</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.costByPatient.slice(0, 6)}
                  dataKey="cost"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                >
                  {analytics.costByPatient.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Cost by Category
            </CardTitle>
            <CardDescription>Supply costs breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.costByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="cost" name="Total Cost" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Performance Insights</CardTitle>
            <CardDescription>Analysis of your supply usage patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <Package className="h-5 w-5 mt-1 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Most Used Supply</p>
                <p className="text-sm text-blue-700">{analytics.mostUsedSupply || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <User className="h-5 w-5 mt-1 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Highest Cost Patient</p>
                <p className="text-sm text-green-700">{analytics.highestCostPatient || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
              <DollarSign className="h-5 w-5 mt-1 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Average Cost Per Item</p>
                <p className="text-sm text-purple-700">${analytics.averageCostPerItem.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
              <TrendingUp className="h-5 w-5 mt-1 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">Cost Trend</p>
                <p className="text-sm text-orange-700">
                  Your costs are {analytics.costTrend} compared to the previous period
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Patient Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Patient-Specific Supply Usage</CardTitle>
          <CardDescription>Detailed breakdown of supply costs per patient</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.costByPatient.map((patient, index) => (
              <div key={patient.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-gray-600">{patient.items} items used</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">${patient.cost.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">${(patient.cost / patient.items).toFixed(2)} per item</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
