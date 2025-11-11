"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Navigation, Clock, DollarSign, TrendingUp, MapPin, Zap, BarChart3, Loader2, AlertCircle, RefreshCw, Map, Eye, EyeOff, Calendar } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { RouteSummaryStats } from "@/components/route-summary-stats"
import { ApplyRouteModal } from "@/components/apply-route-modal"
import RouteOptimizationMap from "@/components/route-optimization-map"

interface RouteData {
  staffId: string
  staffName: string
  staffDepartment: string
  costPerMile: number
  currentRoute: string[]
  optimizedRoute: string[]
  currentOrder: string[]
  optimizedOrder: string[]
  currentDistance: number
  optimizedDistance: number
  distanceSaved: number
  timeSaved: number
  costSaved: number
  waypoints: Array<{ id: string, name: string, address: string, lat: number, lng: number }>
  visitStatuses?: Array<{ id: string, status: string, patientName: string }>
  selectedAlgorithm?: string
  algorithmComparison?: { nearestNeighbor: number, twoOpt: number, simulatedAnnealing: number }
  improvementPercent?: string
}

interface SummaryData {
  totalSavings: number
  totalTimeSaved: number
  totalDistanceSaved: number
  avgEfficiencyGain: number
  routesOptimized: number
}

export default function RouteOptimizationPage() {
  const [optimizing, setOptimizing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [routeData, setRouteData] = useState<RouteData[]>([])
  const [summary, setSummary] = useState<SummaryData>({
    totalSavings: 0,
    totalTimeSaved: 0,
    totalDistanceSaved: 0,
    avgEfficiencyGain: 0,
    routesOptimized: 0
  })
  const [error, setError] = useState<string | null>(null)
  const [applyingRoute, setApplyingRoute] = useState<string | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(true)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleData, setScheduleData] = useState<any>(null)
  const [optimizingSchedule, setOptimizingSchedule] = useState(false)
  
  // Optimization Settings State
  const [optimizationSettings, setOptimizationSettings] = useState({
    prioritizeTimeSavings: true,
    considerTrafficPatterns: true,
    respectAppointmentWindows: true,
    minimizeFuelCosts: false
  })

  const loadRoutes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading routes from API...', optimizationSettings)
      
      // Build query params with optimization settings
      const params = new URLSearchParams()
      params.append('prioritizeTimeSavings', optimizationSettings.prioritizeTimeSavings.toString())
      params.append('considerTrafficPatterns', optimizationSettings.considerTrafficPatterns.toString())
      params.append('respectAppointmentWindows', optimizationSettings.respectAppointmentWindows.toString())
      params.append('minimizeFuelCosts', optimizationSettings.minimizeFuelCosts.toString())
      
      const res = await fetch(`/api/route-optimization/routes?${params.toString()}`, { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('API Error Response:', errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: `HTTP ${res.status}: ${errorText.slice(0, 200)}` }
        }
        throw new Error(errorData.error || `Failed to load routes: ${res.status}`)
      }
      
      const data = await res.json()
      console.log('Route Optimization API Response:', {
        success: data.success,
        routesCount: data.routes?.length || 0,
        summary: data.summary,
        routes: data.routes?.map((r: RouteData) => ({
          staffName: r.staffName,
          visitCount: r.waypoints?.length || 0,
          selectedAlgorithm: r.selectedAlgorithm,
          improvementPercent: r.improvementPercent,
          hasWaypoints: r.waypoints && r.waypoints.length > 0,
          waypointCoords: r.waypoints?.slice(0, 2).map(w => ({ lat: w.lat, lng: w.lng }))
        }))
      })
      
      // Validate route data has waypoints
      if (data.routes) {
        data.routes.forEach((route: RouteData) => {
          if (!route.waypoints || route.waypoints.length === 0) {
            console.warn(`⚠️ Route for ${route.staffName} has no waypoints!`)
          } else {
            console.log(`✅ Route for ${route.staffName}: ${route.waypoints.length} waypoints, Algorithm: ${route.selectedAlgorithm || 'N/A'}`)
          }
        })
      }
      
      // If no routes, try to debug
      if (!data.routes || data.routes.length === 0) {
        console.warn('⚠️ No routes found. Check server console for detailed visit information.')
        console.log('💡 Tip: Visit /api/route-optimization/debug-visits?staff_name=Jane to see visit details')
      }
      
      if (data.success) {
        setRouteData(data.routes || [])
        setSummary(data.summary || {
          totalSavings: 0,
          totalTimeSaved: 0,
          totalDistanceSaved: 0,
          avgEfficiencyGain: 0,
          routesOptimized: 0
        })
        
        if (!data.routes || data.routes.length === 0) {
          console.log('No routes found - this is normal if no staff have visits with GPS location data')
        }
      } else {
        const errorMsg = data.error || "Failed to load routes"
        console.error('API returned success=false:', errorMsg)
        setError(errorMsg)
      }
    } catch (e: any) {
      console.error("Error loading routes:", e)
      setError(e.message || "Failed to load routes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoutes()
  }, [optimizationSettings]) // Reload when settings change

  const handleOptimizeAll = async () => {
    setOptimizing(true)
    setError(null)
    try {
      // Build query params with optimization settings
      const params = new URLSearchParams()
      params.append('prioritizeTimeSavings', optimizationSettings.prioritizeTimeSavings.toString())
      params.append('considerTrafficPatterns', optimizationSettings.considerTrafficPatterns.toString())
      params.append('respectAppointmentWindows', optimizationSettings.respectAppointmentWindows.toString())
      params.append('minimizeFuelCosts', optimizationSettings.minimizeFuelCosts.toString())
      
      const res = await fetch(`/api/route-optimization/routes?${params.toString()}`, { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(errorData.error || `Failed to optimize routes: ${res.status}`)
      }
      
      const data = await res.json()
      
      if (data.success) {
        setRouteData(data.routes || [])
        setSummary(data.summary || {
          totalSavings: 0,
          totalTimeSaved: 0,
          totalDistanceSaved: 0,
          avgEfficiencyGain: 0,
          routesOptimized: 0
        })
        
        if (data.routes && data.routes.length > 0) {
        toast({
          title: "Routes Optimized",
            description: `Optimized ${data.routes.length} routes. Potential savings: $${data.summary?.totalSavings?.toFixed(2) || '0.00'}`,
          })
        } else {
          toast({
            title: "No Routes Found",
            description: "No routes available for optimization. Staff need active trips with visits that have GPS location data.",
            variant: "default"
          })
        }
      } else {
        setError(data.error || "Failed to optimize routes")
        toast({
          title: "Optimization Failed",
          description: data.error || "Failed to optimize routes",
          variant: "destructive"
        })
      }
    } catch (e: any) {
      const errorMessage = e.message || "Failed to optimize routes"
      setError(errorMessage)
      toast({
        title: "Optimization Failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setOptimizing(false)
    }
  }

  const handleApplyRouteClick = (route: RouteData) => {
    setSelectedRoute(route)
    setShowApplyModal(true)
  }

  const handleConfirmApplyRoute = async () => {
    if (!selectedRoute) return

    setApplyingRoute(selectedRoute.staffId)
    try {
      const res = await fetch('/api/route-optimization/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          staffId: selectedRoute.staffId, 
          optimizedOrder: selectedRoute.optimizedOrder 
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(errorData.error || `Failed to apply route: ${res.status}`)
      }
      
      const data = await res.json()
      if (data.success) {
        toast({
          title: "Route Applied",
          description: `Optimized route has been applied for ${selectedRoute.staffName}`,
        })
        setShowApplyModal(false)
        setSelectedRoute(null)
        await loadRoutes() // Reload to show updated data
      } else {
        toast({
          title: "Failed to Apply Route",
          description: data.error || "Failed to apply optimized route",
          variant: "destructive"
        })
      }
    } catch (e: any) {
      console.error("Error applying route:", e)
      toast({
        title: "Error",
        description: e.message || "Failed to apply route",
        variant: "destructive"
      })
    } finally {
      setApplyingRoute(null)
    }
  }

  const handleScheduleOptimization = async () => {
    if (routeData.length === 0) {
      toast({
        title: "No Routes Available",
        description: "Please optimize routes first before scheduling",
        variant: "destructive"
      })
      return
    }

    setOptimizingSchedule(true)
    setError(null)
    
    try {
      // Optimize schedule for all staff with routes
      const schedulePromises = routeData.map(async (route) => {
        const res = await fetch('/api/route-optimization/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffId: route.staffId,
            optimizedOrder: route.optimizedOrder,
            considerTraffic: optimizationSettings.considerTrafficPatterns
          })
        })
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
          throw new Error(errorData.error || `Failed to optimize schedule for ${route.staffName}`)
        }
        
        return res.json()
      })

      const schedules = await Promise.all(schedulePromises)
      
      // Combine all schedules
      const allSchedules = schedules.map((schedule, index) => ({
        staffId: routeData[index].staffId,
        staffName: routeData[index].staffName,
        schedule: schedule.schedule,
        metrics: schedule.metrics
      }))

      setScheduleData(allSchedules)
      setShowScheduleModal(true)
      
      toast({
        title: "Schedule Optimized",
        description: `Optimized schedules generated for ${allSchedules.length} staff members`,
      })
    } catch (e: any) {
      console.error("Error optimizing schedule:", e)
      toast({
        title: "Error",
        description: e.message || "Failed to optimize schedule",
        variant: "destructive"
      })
    } finally {
      setOptimizingSchedule(false)
    }
  }

  const handleApplySchedule = async (staffId: string, schedule: any[]) => {
    try {
      // Update scheduled_time for each visit
      const updates = schedule.map(item => ({
        visitId: item.visitId,
        scheduledTime: item.suggestedTime
      }))

      const res = await fetch('/api/route-optimization/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          optimizedOrder: schedule.map(s => s.visitId),
          scheduledTimes: updates
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(errorData.error || `Failed to apply schedule: ${res.status}`)
      }

      toast({
        title: "Schedule Applied",
        description: "Optimized schedule has been applied successfully",
      })
      
      setShowScheduleModal(false)
      await loadRoutes() // Reload to show updated data
    } catch (e: any) {
      console.error("Error applying schedule:", e)
      toast({
        title: "Error",
        description: e.message || "Failed to apply schedule",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 pb-4 sm:pb-6 lg:pb-8 ml-0 lg:ml-0">
      <header className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-2 sm:mb-1">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Route Optimization</h1>
          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs sm:text-sm w-fit">
            <Zap className="h-3 w-3 mr-1" />
            Advanced AI
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-gray-600">AI-powered multi-algorithm route optimization with interactive maps</p>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${summary.totalSavings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per day across all routes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Savings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.totalTimeSaved} min</div>
            <p className="text-xs text-muted-foreground">Total time saved daily</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distance Reduced</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{summary.totalDistanceSaved.toFixed(1)} mi</div>
            <p className="text-xs text-muted-foreground">Less driving per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Gain</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.avgEfficiencyGain.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Route Analysis Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Route Analysis</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Compare current vs optimized routes for each staff member</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button onClick={handleOptimizeAll} disabled={optimizing} size="sm" className="bg-red-500 hover:bg-red-600 w-full sm:w-auto">
                  <Zap className={`h-4 w-4 mr-2 ${optimizing ? "animate-spin" : ""}`} />
                  {optimizing ? "Optimizing..." : "Optimize All"}
                </Button>
                <Button 
                  onClick={handleScheduleOptimization} 
                  disabled={optimizingSchedule || routeData.length === 0 || optimizing}
                  size="sm" 
                  className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto"
                  title={routeData.length === 0 ? "Please optimize routes first" : "Optimize appointment schedules"}
                >
                  {optimizingSchedule ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Optimizing Schedule...
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Schedule Optimization
                    </>
                  )}
                </Button>
              </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Loading routes...</span>
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : routeData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Navigation className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="font-medium mb-2">No routes available for optimization.</p>
                  <p className="text-sm mb-4">To see routes, staff need to:</p>
                  <ul className="text-sm text-left max-w-md mx-auto space-y-2 mb-6 bg-gray-50 p-4 rounded-lg">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Go to <code className="bg-gray-200 px-1 rounded">/track/[staffId]</code> and start a trip</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Start at least 2 visits (visits automatically get GPS location)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>Visits must have GPS location data (from GPS tracking)</span>
                    </li>
                  </ul>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={loadRoutes}
                      disabled={loading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <div className="text-xs text-gray-500 mt-2">
                      Check browser console for detailed logs
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* AI-Powered Header with Map Toggle */}
                  <div className="p-4 bg-gradient-to-r from-purple-50 via-blue-50 to-green-50 rounded-lg border-2 border-purple-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                          <Zap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">AI-Powered Route Optimization</h3>
                          <p className="text-xs text-gray-600">Multi-algorithm optimization with intelligent route selection</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMap(!showMap)}
                        className="bg-white hover:bg-gray-50"
                      >
                        {showMap ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {showMap ? "Hide Maps" : "Show Maps"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-2">
                      <div className="flex items-center gap-2 p-2 bg-white rounded border-2 border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">Nearest Neighbor</span>
                        <span className="text-gray-500 ml-auto text-[10px]">Active</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded border-2 border-blue-200">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">2-Opt</span>
                        <span className="text-gray-500 ml-auto text-[10px]">Active</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded border-2 border-purple-200">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">Simulated Annealing</span>
                        <span className="text-gray-500 ml-auto text-[10px]">Active</span>
                      </div>
                    </div>
                    <div className="mt-2 p-2 bg-white rounded border border-purple-200">
                      <div className="text-xs text-gray-700 flex items-center gap-2">
                        <Zap className="h-3 w-3 text-purple-600" />
                        <span className="font-semibold">AI Decision Engine:</span>
                        <span className="text-gray-600">Compares all 3 algorithms in real-time and selects the shortest route</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {routeData.map((route) => (
                      <Card key={route.staffId} className="overflow-hidden">
                        <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-lg">{route.staffName}</CardTitle>
                                {route.selectedAlgorithm && (
                                  <Badge className={`text-xs ${
                                    route.selectedAlgorithm === '2_opt' ? 'bg-blue-500' :
                                    route.selectedAlgorithm === 'simulated_annealing' ? 'bg-purple-500' :
                                    'bg-green-500'
                                  } text-white`}>
                                    <Zap className="h-3 w-3 mr-1" />
                                    {route.selectedAlgorithm === '2_opt' ? '2-Opt Selected' :
                                     route.selectedAlgorithm === 'simulated_annealing' ? 'Simulated Annealing Selected' :
                                     'Nearest Neighbor Selected'}
                                  </Badge>
                                )}
                                {route.improvementPercent && (
                                  <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                                    {route.improvementPercent}% Improvement
                                  </Badge>
                                )}
                              </div>
                              <CardDescription>{route.staffDepartment} • {route.waypoints.length} waypoints</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedRoute(expandedRoute === route.staffId ? null : route.staffId)}
                              >
                                {expandedRoute === route.staffId ? "Collapse" : "Expand"}
                              </Button>
                          <Button 
                                variant="default" 
                            size="sm"
                            onClick={() => handleApplyRouteClick(route)}
                            disabled={applyingRoute === route.staffId}
                                className="bg-green-600 hover:bg-green-700"
                          >
                            {applyingRoute === route.staffId ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Applying...
                              </>
                            ) : (
                                  <>
                                    <MapPin className="h-3 w-3 mr-1" />
                                    Apply Route
                                  </>
                            )}
                          </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">Current Distance</div>
                              <div className="text-lg font-bold text-blue-600">{route.currentDistance} mi</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">Optimized Distance</div>
                              <div className="text-lg font-bold text-green-600">{route.optimizedDistance} mi</div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">Time Saved</div>
                              <div className="text-lg font-bold text-purple-600">{route.timeSaved} min</div>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg">
                              <div className="text-xs text-gray-600 mb-1">Cost Saved</div>
                              <div className="text-lg font-bold text-orange-600">${route.costSaved.toFixed(2)}</div>
                            </div>
                          </div>
                          
                          {expandedRoute === route.staffId && (
                            <div className="mt-4 space-y-4 border-t pt-4">
                              {showMap && route.waypoints && route.waypoints.length > 0 && (
                                <div className="h-[300px] sm:h-[350px] lg:h-[400px] rounded-lg overflow-hidden border-2 border-gray-200 shadow-md">
                                  <RouteOptimizationMap
                                    waypoints={route.waypoints}
                                    currentOrder={route.currentOrder || []}
                                    optimizedOrder={route.optimizedOrder || []}
                                    currentDistance={route.currentDistance || 0}
                                    optimizedDistance={route.optimizedDistance || 0}
                                    staffName={route.staffName}
                                  />
                                </div>
                              )}
                              {showMap && (!route.waypoints || route.waypoints.length === 0) && (
                                <div className="h-[300px] sm:h-[350px] lg:h-[400px] rounded-lg border-2 border-gray-200 flex items-center justify-center bg-gray-50">
                                  <div className="text-center text-gray-500">
                                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No waypoints available for map display</p>
                                  </div>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2 text-sm text-gray-700">Current Route Order</h4>
                                  <div className="space-y-1">
                                    {route.currentOrder.map((id, index) => {
                                      const waypoint = route.waypoints.find(w => w.id === id)
                                      const visitStatus = route.visitStatuses?.find(v => v.id === id)
                                      const status = visitStatus?.status || 'in_progress'
                                      return waypoint ? (
                                        <div key={id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm border border-gray-200">
                                          <Badge variant="outline" className="bg-blue-100">{index + 1}</Badge>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <div className="font-medium">{waypoint.name}</div>
                                              {status === 'completed' && (
                                                <Badge className="bg-green-500 text-white text-xs">Completed</Badge>
                                              )}
                                              {status === 'in_progress' && (
                                                <Badge className="bg-blue-500 text-white text-xs">In Progress</Badge>
                                              )}
                                            </div>
                                            <div className="text-xs text-gray-500">{waypoint.address}</div>
                                          </div>
                                        </div>
                                      ) : null
                                    })}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2 text-sm text-gray-700">Optimized Route Order</h4>
                                  <div className="space-y-1">
                                    {route.optimizedOrder.map((id, index) => {
                                      const waypoint = route.waypoints.find(w => w.id === id)
                                      const visitStatus = route.visitStatuses?.find(v => v.id === id)
                                      const status = visitStatus?.status || 'in_progress'
                                      return waypoint ? (
                                        <div key={id} className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm border border-green-200">
                                          <Badge variant="outline" className="bg-green-100">{index + 1}</Badge>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <div className="font-medium">{waypoint.name}</div>
                                              {status === 'completed' && (
                                                <Badge className="bg-green-500 text-white text-xs">Completed</Badge>
                                              )}
                                              {status === 'in_progress' && (
                                                <Badge className="bg-blue-500 text-white text-xs">In Progress</Badge>
                                              )}
                                            </div>
                                            <div className="text-xs text-gray-500">{waypoint.address}</div>
                                          </div>
                                        </div>
                                      ) : null
                                    })}
                                  </div>
                                </div>
                              </div>
                              
                              {/* AI Algorithm Comparison */}
                              {route.algorithmComparison && (
                                <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                                  <h4 className="font-semibold mb-3 text-sm text-gray-700 flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-purple-600" />
                                    AI Algorithm Comparison
                                  </h4>
                                  <div className="grid grid-cols-3 gap-3 text-xs">
                                    <div className={`p-2 rounded border ${
                                      route.selectedAlgorithm === 'nearest_neighbor' 
                                        ? 'bg-green-100 border-green-300' 
                                        : 'bg-white border-gray-200'
                                    }`}>
                                      <div className="font-medium mb-1">Nearest Neighbor</div>
                                      <div className="text-gray-600">{route.algorithmComparison.nearestNeighbor.toFixed(2)} mi</div>
                                      {route.selectedAlgorithm === 'nearest_neighbor' && (
                                        <Badge className="mt-1 bg-green-500 text-white text-xs">Selected</Badge>
                                      )}
                                    </div>
                                    <div className={`p-2 rounded border ${
                                      route.selectedAlgorithm === '2_opt' 
                                        ? 'bg-blue-100 border-blue-300' 
                                        : 'bg-white border-gray-200'
                                    }`}>
                                      <div className="font-medium mb-1">2-Opt</div>
                                      <div className="text-gray-600">{route.algorithmComparison.twoOpt.toFixed(2)} mi</div>
                                      {route.selectedAlgorithm === '2_opt' && (
                                        <Badge className="mt-1 bg-blue-500 text-white text-xs">Selected</Badge>
                                      )}
                                    </div>
                                    <div className={`p-2 rounded border ${
                                      route.selectedAlgorithm === 'simulated_annealing' 
                                        ? 'bg-purple-100 border-purple-300' 
                                        : 'bg-white border-gray-200'
                                    }`}>
                                      <div className="font-medium mb-1">Simulated Annealing</div>
                                      <div className="text-gray-600">{route.algorithmComparison.simulatedAnnealing.toFixed(2)} mi</div>
                                      {route.selectedAlgorithm === 'simulated_annealing' && (
                                        <Badge className="mt-1 bg-purple-500 text-white text-xs">Selected</Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-3 text-xs text-gray-600 italic">
                                    AI selected <strong>{route.selectedAlgorithm === '2_opt' ? '2-Opt' : 
                                    route.selectedAlgorithm === 'simulated_annealing' ? 'Simulated Annealing' : 
                                    'Nearest Neighbor'}</strong> as the best algorithm for this route
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Optimization Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Optimization Settings</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Configure route optimization preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {/* Prioritize time savings - IMPLEMENTED: Algorithm selects shortest route which minimizes time */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-sm font-medium text-gray-900">Prioritize time savings</span>
                  <button
                    onClick={() => setOptimizationSettings(prev => ({ ...prev, prioritizeTimeSavings: !prev.prioritizeTimeSavings }))}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      optimizationSettings.prioritizeTimeSavings
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    }`}
                  >
                    {optimizationSettings.prioritizeTimeSavings ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                
                {/* Consider traffic patterns - NOT YET IMPLEMENTED: Would require traffic API integration */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-sm font-medium text-gray-900">Consider traffic patterns</span>
                  <button
                    onClick={() => setOptimizationSettings(prev => ({ ...prev, considerTrafficPatterns: !prev.considerTrafficPatterns }))}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      optimizationSettings.considerTrafficPatterns
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    }`}
                  >
                    {optimizationSettings.considerTrafficPatterns ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                
                {/* Respect appointment windows - IMPLEMENTED: Visits sorted by scheduled_time */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-sm font-medium text-gray-900">Respect appointment windows</span>
                  <button
                    onClick={() => setOptimizationSettings(prev => ({ ...prev, respectAppointmentWindows: !prev.respectAppointmentWindows }))}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      optimizationSettings.respectAppointmentWindows
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    }`}
                  >
                    {optimizationSettings.respectAppointmentWindows ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                
                {/* Minimize fuel costs - PARTIALLY IMPLEMENTED: Uses cost_per_mile but doesn't prioritize it */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-sm font-medium text-gray-900">Minimize fuel costs</span>
                  <button
                    onClick={() => setOptimizationSettings(prev => ({ ...prev, minimizeFuelCosts: !prev.minimizeFuelCosts }))}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      optimizationSettings.minimizeFuelCosts
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    }`}
                  >
                    {optimizationSettings.minimizeFuelCosts ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
              
              <div className="pt-3 border-t">
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Nearest Neighbor</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">✓ 2-Opt Improvement</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">✓ Simulated Annealing</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Best result selected automatically
                  </div>
                </div>
              </div>
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Features</span>
                </div>
                <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                    <span className="text-gray-600">Interactive Maps</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                    <span className="text-gray-600">Real-time Updates</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                    <span className="text-gray-600">Route Comparison</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Routes optimized today</span>
                <span className="font-bold">{summary.routesOptimized}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total savings this week</span>
                <span className="font-bold text-green-600">${(summary.totalSavings * 5).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average efficiency gain</span>
                <span className="font-bold text-blue-600">{summary.avgEfficiencyGain.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">CO2 reduction</span>
                <span className="font-bold text-green-600">{(summary.totalDistanceSaved * 0.404).toFixed(1)} lbs</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent hover:bg-gray-50">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent hover:bg-gray-50">
                <MapPin className="h-4 w-4 mr-2" />
                Export Routes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Apply Route Modal */}
      {selectedRoute && (
        <ApplyRouteModal
          open={showApplyModal}
          onOpenChange={setShowApplyModal}
          staffName={selectedRoute?.staffName || ''}
          currentOrder={selectedRoute?.currentOrder || []}
          optimizedOrder={selectedRoute?.optimizedOrder || []}
          waypoints={selectedRoute?.waypoints || []}
          currentDistance={selectedRoute?.currentDistance || 0}
          optimizedDistance={selectedRoute?.optimizedDistance || 0}
          distanceSaved={selectedRoute?.distanceSaved || 0}
          timeSaved={selectedRoute?.timeSaved || 0}
          costSaved={selectedRoute?.costSaved || 0}
          onConfirm={handleConfirmApplyRoute}
          isApplying={applyingRoute === selectedRoute?.staffId}
        />
      )}

      {/* Schedule Optimization Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Optimized Schedule
            </DialogTitle>
            <DialogDescription>
              Review and apply optimized appointment times based on travel time and working hours
            </DialogDescription>
          </DialogHeader>
          
          {scheduleData && scheduleData.length > 0 ? (
            <div className="space-y-6 mt-4">
              {scheduleData.map((staffSchedule: any) => (
                <Card key={staffSchedule.staffId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{staffSchedule.staffName}</CardTitle>
                      <Badge variant="secondary">
                        {staffSchedule.metrics.workingHours.start} - {staffSchedule.metrics.workingHours.end}
                      </Badge>
                    </div>
                    <CardDescription>
                      {staffSchedule.metrics.totalVisits} visits • {staffSchedule.metrics.utilizationRate} utilization • {staffSchedule.metrics.efficiency?.score || 'N/A'} efficiency
                      {staffSchedule.metrics.conflicts && (
                        <span className="text-red-600 ml-2">⚠️ {staffSchedule.metrics.conflicts.length} conflict(s)</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Patient</TableHead>
                            <TableHead>Currently Scheduled</TableHead>
                            <TableHead>AI Suggested Time</TableHead>
                            <TableHead>Travel</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {staffSchedule.schedule.map((item: any, idx: number) => {
                            const currentlyScheduled = item.currentTime 
                              ? new Date(item.currentTime).toLocaleString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true 
                                })
                              : 'Not scheduled'
                            const suggestedTime = new Date(item.suggestedTime).toLocaleString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })
                            
                            return (
                              <TableRow key={item.visitId}>
                                <TableCell className="font-medium">{item.patientName}</TableCell>
                                <TableCell className={item.currentTime ? 'text-gray-600' : 'text-gray-400 italic'}>
                                  {currentlyScheduled}
                                </TableCell>
                                <TableCell className="font-semibold text-blue-600">
                                  {suggestedTime}
                                </TableCell>
                                <TableCell>{item.travelTime} min</TableCell>
                                <TableCell>{item.visitDuration} min</TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <Badge 
                                      variant={item.efficiency === "Optimal" ? "default" : 
                                              item.efficiency === "Gap Detected" ? "secondary" : 
                                              "destructive"}
                                      className={
                                        item.efficiency === "Optimal" ? "bg-green-500" :
                                        item.efficiency === "Gap Detected" ? "bg-yellow-500" :
                                        "bg-red-500"
                                      }
                                    >
                                      {item.efficiency}
                                    </Badge>
                                    {item.aiPriority && (
                                      <div className="text-xs mt-1">
                                        <span className="text-gray-500">AI Priority: </span>
                                        <Badge 
                                          variant={item.aiPriority === "high" ? "destructive" : 
                                                  item.aiPriority === "medium" ? "secondary" : 
                                                  "outline"}
                                          className="text-xs"
                                        >
                                          {item.aiPriority}
                                        </Badge>
                                      </div>
                                    )}
                                    {item.aiEfficiencyScore !== undefined && (
                                      <div className="text-xs text-blue-600 mt-1">
                                        AI Score: {item.aiEfficiencyScore}%
                                      </div>
                                    )}
                                    {item.aiReasoning && (
                                      <div className="text-xs text-gray-500 mt-1 italic" title={item.aiReasoning}>
                                        💡 {item.aiReasoning.substring(0, 50)}...
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                      
                      {/* Existing Tasks/Workload */}
                      {staffSchedule.metrics?.existingTasks && staffSchedule.metrics.existingTasks.length > 0 && (
                        <div className="mt-4 p-3 rounded-lg border bg-purple-50 border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">📋</span>
                            <span className="text-sm font-semibold text-purple-700">Complete Workload (Existing Tasks)</span>
                            <Badge className="bg-purple-500 text-white">
                              {staffSchedule.metrics.existingTasks.length} task(s)
                            </Badge>
                          </div>
                          <div className="mt-2 text-xs space-y-1">
                            {staffSchedule.metrics.existingTasks.map((task: any, idx: number) => {
                              const start = new Date(task.startTime)
                              const end = new Date(task.endTime)
                              return (
                                <div key={idx} className="text-purple-600 flex items-center gap-2">
                                  <span className="font-semibold">{start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                                  <span>-</span>
                                  <span>{end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                                  <span className="text-purple-700 font-medium">{task.title}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {task.type === 'training' ? '🎓 Training' : '🏥 Visit'}
                                  </Badge>
                                </div>
                              )
                            })}
                          </div>
                          <div className="mt-2 text-xs text-purple-600 italic">
                            💡 AI optimized patient visits around these existing commitments
                          </div>
                        </div>
                      )}

                      {/* AI Optimization Status */}
                      {staffSchedule.metrics?.aiOptimization && (
                        <div className={`mt-4 p-3 rounded-lg border ${
                          staffSchedule.metrics.aiOptimization.enabled 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {staffSchedule.metrics.aiOptimization.enabled ? (
                              <>
                                <span className="text-lg">🤖</span>
                                <span className="text-sm font-semibold text-blue-700">AI-Powered Optimization Active</span>
                                {staffSchedule.metrics.aiOptimization.efficiencyGain > 0 && (
                                  <Badge className="bg-green-500 text-white">
                                    +{staffSchedule.metrics.aiOptimization.efficiencyGain.toFixed(1)}% efficiency
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="text-sm text-gray-600">⚠️ {staffSchedule.metrics.aiOptimization.message}</span>
                              </>
                            )}
                          </div>
                          {staffSchedule.metrics.aiOptimization.recommendations && 
                           staffSchedule.metrics.aiOptimization.recommendations.length > 0 && (
                            <div className="mt-2 text-xs">
                              <div className="font-semibold text-blue-700 mb-1">AI Recommendations:</div>
                              {staffSchedule.metrics.aiOptimization.recommendations.map((rec: string, idx: number) => (
                                <div key={idx} className="text-blue-600 mb-1">• {rec}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Efficiency Summary */}
                      {staffSchedule.metrics && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Schedule Efficiency Summary</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="text-gray-600">Total Travel:</span>
                              <div className="font-bold">{staffSchedule.metrics.totalTravelTime || 0} min</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Total Visit Time:</span>
                              <div className="font-bold">{staffSchedule.metrics.totalVisitTime || 0} min</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Utilization:</span>
                              <div className="font-bold text-blue-600">{staffSchedule.metrics.utilizationRate || '0%'}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Efficiency:</span>
                              <div className={`font-bold ${
                                staffSchedule.metrics.efficiency?.score === 'Excellent' ? 'text-green-600' :
                                staffSchedule.metrics.efficiency?.score === 'Good' ? 'text-blue-600' :
                                'text-yellow-600'
                              }`}>
                                {staffSchedule.metrics.efficiency?.score || 'N/A'}
                              </div>
                            </div>
                          </div>
                          {staffSchedule.metrics.conflicts && staffSchedule.metrics.conflicts.length > 0 && (
                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
                              <div className="font-semibold text-red-700 mb-1">⚠️ Conflicts Detected:</div>
                              {staffSchedule.metrics.conflicts.map((conflict: string, idx: number) => (
                                <div key={idx} className="text-red-600">• {conflict}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-end pt-4">
                        <Button
                          onClick={() => handleApplySchedule(staffSchedule.staffId, staffSchedule.schedule)}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={staffSchedule.metrics?.conflicts && staffSchedule.metrics.conflicts.length > 0}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Apply Schedule
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No schedule data available</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}