"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, Clock, DollarSign, Route, Users, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AnalyticsData {
  totalMiles: number
  totalCost: number
  avgEfficiency: number
  totalHours: number
  co2Reduction: number
  milesChange: number
  costChange: number
  dailyMileage: Array<{ date: string; miles: number }>
  dailyCosts: Array<{ date: string; cost: number }>
  staffPerformance: Array<{
    id: string
    name: string
    role: string
    miles: number
    efficiency: number
    cost: number
  }>
}

export default function GPSAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const res = await fetch(`/api/gps-analytics?timeRange=${timeRange}`, {
        cache: 'no-store'
      })
      
      if (!res.ok) {
        throw new Error(`Failed to load analytics: ${res.status}`)
      }
      
      const result = await res.json()
      
      if (result.success) {
        setAnalyticsData(result.data)
      } else {
        throw new Error(result.error || "Failed to load analytics")
      }
    } catch (e: any) {
      console.error("Error loading analytics:", e)
      setError(e.message || "Failed to load GPS analytics")
    } finally {
      setLoading(false)
    }
  }

  // Improved bar chart component with better layout and tooltips
  const SimpleBarChart = ({ data, labelKey, valueKey, color = "bg-blue-500", label = "Value" }: {
    data: Array<Record<string, any>>
    labelKey: string
    valueKey: string
    color?: string
    label?: string
  }) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No data available for this period</p>
          </div>
        </div>
      )
    }

    const maxValue = Math.max(...data.map(d => d[valueKey] || 0), 1) // Ensure at least 1 to avoid division by zero
    const chartHeight = 200 // Fixed height for bars
    const dataCount = data.length
    const minBarWidth = dataCount <= 7 ? '40px' : dataCount <= 14 ? '30px' : '20px'
    const barGap = dataCount <= 7 ? '8px' : dataCount <= 14 ? '4px' : '2px'
    
    return (
      <div className="w-full overflow-x-auto">
        {/* Chart Area */}
        <div className="relative min-w-full" style={{ height: `${chartHeight + 80}px` }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-16 flex flex-col justify-between text-xs text-gray-500 pr-2 w-10">
            <span className="font-medium">{maxValue > 0 ? maxValue.toFixed(1) : '0'}</span>
            <span>{maxValue > 0 ? (maxValue / 2).toFixed(1) : '0'}</span>
            <span className="font-medium">0</span>
          </div>

          {/* Bars Container */}
          <div 
            className="ml-12 h-full flex items-end pb-16"
            style={{ gap: barGap }}
          >
            {data.map((item, index) => {
              const value = item[valueKey] || 0
              const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0
              const barHeight = (chartHeight * heightPercent) / 100
              
              // Format date label
              const date = new Date(item[labelKey] + 'T00:00:00') // Add time to avoid timezone issues
              const isToday = date.toDateString() === new Date().toDateString()
              const dateLabel = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })
              
              return (
                <div 
                  key={index} 
                  className="flex flex-col items-center group relative"
                  style={{ 
                    minWidth: minBarWidth,
                    flex: dataCount <= 7 ? '0 0 auto' : '1 1 0'
                  }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-gray-900 text-white text-xs rounded py-1.5 px-2.5 whitespace-nowrap shadow-lg">
                    <div className="font-semibold mb-0.5">{dateLabel}</div>
                    <div className="text-gray-300">{label}: <span className="font-medium text-white">{value.toFixed(2)}</span></div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                  
                  {/* Bar */}
                  <div 
                    className={`w-full ${color} rounded-t transition-all hover:opacity-90 hover:shadow-md cursor-pointer relative`}
                    style={{ 
                      height: `${Math.max(barHeight, value > 0 ? 4 : 0)}px`,
                      minHeight: value > 0 ? '4px' : '0px'
                    }}
                    title={`${dateLabel}: ${value.toFixed(2)}`}
                  >
                    {/* Value label on bar (if bar is tall enough) */}
                    {barHeight > 25 && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700 whitespace-nowrap bg-white px-1 rounded">
                        {value.toFixed(1)}
                      </div>
                    )}
                  </div>
                  
                  {/* Date label */}
                  <div className="mt-2 text-xs text-gray-600 text-center w-full">
                    <div className={`${isToday ? "font-bold text-blue-600" : "font-medium"} truncate`} title={dateLabel}>
                      {dateLabel}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading GPS analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No analytics data available</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">GPS Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive analysis of fleet performance and route efficiency</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Miles Driven</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalMiles.toLocaleString()}</div>
            <p className={`text-xs ${analyticsData.milesChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {analyticsData.milesChange >= 0 ? '+' : ''}{analyticsData.milesChange.toFixed(1)}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Driving Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className={`text-xs ${analyticsData.costChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {analyticsData.costChange >= 0 ? '+' : ''}{analyticsData.costChange.toFixed(1)}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Route Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analyticsData.avgEfficiency}%</div>
            <p className="text-xs text-muted-foreground">Average across all staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drive Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalHours}h</div>
            <p className="text-xs text-muted-foreground">Total hours driven</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Daily Mileage Trends</CardTitle>
            <CardDescription>Miles driven per day over the selected period</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <SimpleBarChart 
              data={analyticsData.dailyMileage} 
              labelKey="date" 
              valueKey="miles"
              color="bg-blue-500"
              label="Miles"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Analysis</CardTitle>
            <CardDescription>Daily driving costs over the selected period</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <SimpleBarChart 
              data={analyticsData.dailyCosts} 
              labelKey="date" 
              valueKey="cost"
              color="bg-green-500"
              label="Cost ($)"
            />
          </CardContent>
        </Card>
      </div>

      {/* Staff Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Performance Metrics</CardTitle>
          <CardDescription>Individual performance analysis for each staff member</CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsData.staffPerformance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No staff performance data available for this period</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analyticsData.staffPerformance.map((staff) => (
                <div key={staff.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{staff.name}</div>
                      <div className="text-sm text-gray-500">{staff.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-8 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{staff.miles.toFixed(1)} mi</div>
                      <div className="text-gray-500">Distance</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-600">{staff.efficiency}%</div>
                      <div className="text-gray-500">Efficiency</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">${staff.cost.toFixed(2)}</div>
                      <div className="text-gray-500">Cost</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
