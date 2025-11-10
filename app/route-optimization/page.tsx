"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navigation, Clock, DollarSign, TrendingUp, MapPin, Zap, BarChart3, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

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

  useEffect(() => {
    loadRoutes()
  }, [])

  const loadRoutes = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/route-optimization/routes', { cache: 'no-store' })
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
      } else {
        setError(data.error || "Failed to load routes")
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
    try {
      await loadRoutes()
      toast({
        title: "Routes Optimized",
        description: `Optimized ${routeData.length} routes. Potential savings: $${summary.totalSavings.toFixed(2)}`,
      })
    } catch (e: any) {
      toast({
        title: "Optimization Failed",
        description: e.message || "Failed to optimize routes",
        variant: "destructive"
      })
    } finally {
      setOptimizing(false)
    }
  }

  const handleApplyRoute = async (staffId: string, optimizedOrder: string[]) => {
    setApplyingRoute(staffId)
    try {
      const res = await fetch('/api/route-optimization/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, optimizedOrder })
      })
      
      const data = await res.json()
      if (data.success) {
        toast({
          title: "Route Applied",
          description: "Optimized route has been applied successfully",
        })
        await loadRoutes() // Reload to show updated data
      } else {
        toast({
          title: "Failed to Apply Route",
          description: data.error || "Failed to apply optimized route",
          variant: "destructive"
        })
      }
    } catch (e: any) {
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
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Route Optimization</h1>
        <p className="text-gray-600">AI-powered route planning to minimize travel time and costs</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Route Optimization Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Route Analysis</CardTitle>
                  <CardDescription>Compare current vs optimized routes for each staff member</CardDescription>
                </div>
                <Button onClick={handleOptimizeAll} disabled={optimizing}>
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
                  <p>No routes available for optimization.</p>
                  <p className="text-sm mt-2">Routes require staff with active trips and scheduled visits with location data.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Current Distance</TableHead>
                      <TableHead>Optimized Distance</TableHead>
                      <TableHead>Savings</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routeData.map((route) => (
                      <TableRow key={route.staffId}>
                        <TableCell>
                          <div className="font-medium">{route.staffName}</div>
                          <div className="text-sm text-muted-foreground">{route.staffDepartment}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{route.currentDistance} mi</div>
                          <div className="text-sm text-muted-foreground">{route.currentRoute.length} stops</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-green-600">{route.optimizedDistance} mi</div>
                          <div className="text-sm text-muted-foreground">Optimized route</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-green-600">${route.costSaved.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">{route.timeSaved} min saved</div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleApplyRoute(route.staffId, route.optimizedOrder)}
                            disabled={applyingRoute === route.staffId}
                          >
                            {applyingRoute === route.staffId ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Applying...
                              </>
                            ) : (
                              "Apply Route"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
              <div className="flex items-center justify-between">
                <span className="text-sm">Prioritize time savings</span>
                <Badge variant="secondary">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Consider traffic patterns</span>
                <Badge variant="secondary">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Respect appointment windows</span>
                <Badge variant="secondary">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Minimize fuel costs</span>
                <Badge variant="outline">Disabled</Badge>
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
                <span className="text-sm">Routes optimized</span>
                <span className="font-bold">{summary.routesOptimized}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total potential savings</span>
                <span className="font-bold text-green-600">${summary.totalSavings.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average efficiency gain</span>
                <span className="font-bold text-blue-600">{summary.avgEfficiencyGain.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Distance saved</span>
                <span className="font-bold text-green-600">{summary.totalDistanceSaved.toFixed(1)} mi</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <MapPin className="h-4 w-4 mr-2" />
                Export Routes
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Clock className="h-4 w-4 mr-2" />
                Schedule Optimization
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
