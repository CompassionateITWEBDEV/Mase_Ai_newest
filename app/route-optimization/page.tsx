"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navigation, Clock, DollarSign, TrendingUp, MapPin, Zap, BarChart3, Loader2, AlertCircle, RefreshCw, Map, Eye, EyeOff } from "lucide-react"
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

  useEffect(() => {
    loadRoutes()
  }, [])

  const loadRoutes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading routes from API...')
      const res = await fetch('/api/route-optimization/routes', { 
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

  const handleOptimizeAll = async () => {
    setOptimizing(true)
    setError(null)
    try {
      const res = await fetch('/api/route-optimization/routes', { 
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

  return (
    <div className="min-h-screen bg-white p-6">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-semibold text-gray-900">Route Optimization</h1>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">AI-powered multi-algorithm route optimization with interactive maps</p>
          <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <Zap className="h-3 w-3 mr-1" />
            Advanced AI
          </Badge>
        </div>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Analysis Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Route Analysis</CardTitle>
                  <CardDescription>Compare current vs optimized routes for each staff member</CardDescription>
                </div>
                <Button onClick={handleOptimizeAll} disabled={optimizing} size="sm" className="bg-red-500 hover:bg-red-600">
                  <Zap className={`h-4 w-4 mr-2 ${optimizing ? "animate-spin" : ""}`} />
                  {optimizing ? "Optimizing..." : "Optimize All"}
                </Button>
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
                    <div className="grid grid-cols-3 gap-2 text-xs mb-2">
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
                                <div className="h-[400px] rounded-lg overflow-hidden border-2 border-gray-200 shadow-md">
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
                                <div className="h-[400px] rounded-lg border-2 border-gray-200 flex items-center justify-center bg-gray-50">
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
              <CardTitle>Optimization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Optimization Algorithms</span>
                  </div>
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
              <Button variant="outline" className="w-full justify-start bg-transparent hover:bg-gray-50">
                <Clock className="h-4 w-4 mr-2" />
                Schedule Optimization
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
          staffName={selectedRoute.staffName}
          currentOrder={selectedRoute.currentOrder}
          optimizedOrder={selectedRoute.optimizedOrder}
          waypoints={selectedRoute.waypoints}
          currentDistance={selectedRoute.currentDistance}
          optimizedDistance={selectedRoute.optimizedDistance}
          distanceSaved={selectedRoute.distanceSaved}
          timeSaved={selectedRoute.timeSaved}
          costSaved={selectedRoute.costSaved}
          onConfirm={handleConfirmApplyRoute}
          isApplying={applyingRoute === selectedRoute.staffId}
        />
      )}
    </div>
  )
}