"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Map, Clock, DollarSign, Users, TrendingUp, ListFilter, RefreshCw, Route, Car, Timer, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import StaffGpsTracker from "@/components/staff-gps-tracker"

interface StaffFleetMember {
  id: string
  name: string
  role: string
  status: "En Route" | "On Visit" | "Idle" | "Offline"
  currentSpeed: number
  etaToNext: string
  nextPatient: string
  totalDistanceToday: number
  totalDriveTimeToday: number
  totalVisitTimeToday: number
  numberOfVisits: number
  averageVisitDuration: number
  efficiencyScore: number
  location: { lat: number; lng: number } | null
  visitDetails: Array<{
    patient: string
    duration: number
    startTime: string
    endTime: string
    address: string
  }>
  drivingCost: number
}

export default function FleetManagementDashboard() {
  const [filter, setFilter] = useState("All")
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [staffFleet, setStaffFleet] = useState<StaffFleetMember[]>([])
  const [error, setError] = useState<string | null>(null)

  // Load real staff fleet data
  useEffect(() => {
    let isMounted = true
    
    const loadData = async () => {
      await loadFleetData()
    }
    
    loadData()
    
    // Auto-refresh every 30 seconds for real-time updates (without loading spinner)
    const interval = setInterval(() => {
      if (isMounted) {
        loadFleetData(false) // Don't show loading spinner on auto-refresh
      }
    }, 30000) // 30 seconds
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadFleetData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      setError(null)

      // Get all active staff
      const staffRes = await fetch('/api/staff/list', { cache: 'no-store' })
      const staffData = await staffRes.json()
      
      if (!staffData.success || !Array.isArray(staffData.staff)) {
        throw new Error('Failed to load staff list')
      }

      const activeStaff = staffData.staff.filter((s: any) => s.is_active !== false)

      // Load performance stats and GPS location for each staff
      const fleetData = await Promise.all(
        activeStaff.map(async (staff: any) => {
          try {
            // Get performance stats
            const statsRes = await fetch(
              `/api/staff-performance/stats?staff_id=${encodeURIComponent(staff.id)}&period=day`,
              { cache: 'no-store' }
            )
            const statsData = await statsRes.json()

            // Get GPS location
            const locationRes = await fetch(
              `/api/gps/staff-location?staff_id=${encodeURIComponent(staff.id)}`,
              { cache: 'no-store' }
            )
            const locationData = await locationRes.json()

            // Determine status
            let status: "En Route" | "On Visit" | "Idle" | "Offline" = "Offline"
            let currentSpeed = 0
            let nextPatient = "N/A"
            let etaToNext = "N/A"

            if (locationData.success && locationData.currentLocation) {
              currentSpeed = locationData.currentLocation.speed || 0
              
              if (locationData.status === 'on_visit') {
                status = "On Visit"
              } else if (currentSpeed > 5) {
                status = "En Route"
              } else if (locationData.status === 'active') {
                status = "Idle"
              } else {
                status = "Offline"
              }
            }

            // Get next visit from today's visits
            const visits = statsData.visits || []
            const inProgressVisit = visits.find((v: any) => v.status === 'in_progress')
            const nextVisit = visits.find((v: any) => !v.endTime)

            if (inProgressVisit) {
              nextPatient = inProgressVisit.patientName || "Current Patient"
            } else if (nextVisit) {
              nextPatient = nextVisit.patientName || "N/A"
              if (nextVisit.startTime) {
                const visitTime = new Date(nextVisit.startTime)
                etaToNext = visitTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              }
            }

            // Calculate efficiency score
            const todayStats = statsData.todayStats || {}
            const totalTime = (todayStats.totalDriveTime || 0) + (todayStats.totalVisitTime || 0)
            const efficiencyScore = totalTime > 0
              ? Math.round((todayStats.totalVisitTime / totalTime) * 100)
              : 0

            // Format visit details
            const visitDetails = visits.map((v: any) => ({
              patient: v.patientName || "Unknown",
              duration: v.duration || 0,
              startTime: v.startTime || "N/A",
              endTime: v.endTime || (v.status === 'in_progress' ? 'In Progress' : 'N/A'),
              address: v.address || "N/A"
            }))

            // Get location
            const location = locationData.success && locationData.currentLocation
              ? {
                  lat: locationData.currentLocation.latitude,
                  lng: locationData.currentLocation.longitude
                }
              : null

            return {
              id: staff.id,
              name: staff.name || "Unknown",
              role: staff.department || "Staff",
              status,
              currentSpeed: Math.round(currentSpeed),
              etaToNext,
              nextPatient,
              totalDistanceToday: todayStats.totalMiles || 0,
              totalDriveTimeToday: todayStats.totalDriveTime || 0,
              totalVisitTimeToday: todayStats.totalVisitTime || 0,
              numberOfVisits: todayStats.totalVisits || 0,
              averageVisitDuration: todayStats.avgVisitDuration || 0,
              efficiencyScore,
              location,
              visitDetails,
              drivingCost: todayStats.totalCost || 0
            }
          } catch (e: any) {
            console.error(`Error loading data for staff ${staff.id}:`, e)
            // Return minimal data if API fails
            return {
              id: staff.id,
              name: staff.name || "Unknown",
              role: staff.department || "Staff",
              status: "Offline" as const,
              currentSpeed: 0,
              etaToNext: "N/A",
              nextPatient: "N/A",
              totalDistanceToday: 0,
              totalDriveTimeToday: 0,
              totalVisitTimeToday: 0,
              numberOfVisits: 0,
              averageVisitDuration: 0,
              efficiencyScore: 0,
              location: null,
              visitDetails: [],
              drivingCost: 0
            }
          }
        })
      )

      setStaffFleet(fleetData)
    } catch (e: any) {
      console.error('Error loading fleet data:', e)
      setError(e.message || 'Failed to load fleet data')
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  const handleRefresh = () => {
    loadFleetData()
  }

  const summaryStats = useMemo(() => {
    const totalStaff = staffFleet.length
    const enRoute = staffFleet.filter((s) => s.status === "En Route" || s.status === "Driving").length
    const onVisit = staffFleet.filter((s) => s.status === "On Visit").length
    const idle = staffFleet.filter((s) => s.status === "Idle").length
    const totalDistance = staffFleet.reduce((sum, s) => sum + s.totalDistanceToday, 0)
    const totalDriveTime = staffFleet.reduce((sum, s) => sum + s.totalDriveTimeToday, 0)
    const totalVisitTime = staffFleet.reduce((sum, s) => sum + s.totalVisitTimeToday, 0)
    const totalVisits = staffFleet.reduce((sum, s) => sum + s.numberOfVisits, 0)
    const avgEfficiency = totalStaff > 0
      ? staffFleet.reduce((sum, s) => sum + s.efficiencyScore, 0) / totalStaff
      : 0
    const totalDrivingCost = staffFleet.reduce((sum, s) => sum + s.drivingCost, 0)

    return {
      totalStaff,
      enRoute,
      onVisit,
      idle,
      totalDistance,
      totalDriveTime,
      totalVisitTime,
      totalVisits,
      avgEfficiency,
      totalDrivingCost,
    }
  }, [staffFleet])

  const selectedStaffData = selectedStaff ? staffFleet.find((s) => s.id === selectedStaff) : null

  // Filter staff based on status
  const filteredFleet = useMemo(() => {
    if (filter === "All") return staffFleet
    if (filter === "En Route") return staffFleet.filter((s) => s.status === "En Route" || s.status === "Driving")
    return staffFleet.filter((s) => s.status === filter)
  }, [staffFleet, filter])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading fleet data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fleet Management & Route Optimization</h1>
            <p className="text-gray-600">Real-time GPS tracking and performance analytics for field staff.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              Auto-refresh: 30s
            </Badge>
            <Button onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Driving Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryStats.totalDrivingCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{summaryStats.totalDistance.toFixed(1)} miles driven</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drive vs Visit Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summaryStats.totalDriveTime / 60).toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">{(summaryStats.totalVisitTime / 60).toFixed(1)}h on visits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalVisits}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.enRoute} en route, {summaryStats.onVisit} on visit
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Route Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summaryStats.avgEfficiency.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Time with patients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">{summaryStats.idle} idle</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="map" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map">Live Map</TabsTrigger>
          <TabsTrigger value="performance">Staff Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Map className="h-6 w-6 mr-3 text-blue-600" />
                  <div>
                    <CardTitle>Live Staff Locations</CardTitle>
                    <CardDescription>Real-time map view of all active field staff</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <ListFilter className="h-4 w-4" />
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Staff</SelectItem>
                      <SelectItem value="En Route">En Route</SelectItem>
                      <SelectItem value="On Visit">On Visit</SelectItem>
                      <SelectItem value="Idle">Idle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredFleet.length === 0 ? (
                <div className="text-center py-12">
                  <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No staff found with selected filter.</p>
                </div>
              ) : (
                <StaffGpsTracker staffFleet={filteredFleet} filter={filter} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Staff Performance Overview</CardTitle>
                <CardDescription>Detailed metrics for each staff member</CardDescription>
              </CardHeader>
              <CardContent>
                {staffFleet.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No staff data available.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Visits</TableHead>
                        <TableHead>Drive Time</TableHead>
                        <TableHead>Visit Time</TableHead>
                        <TableHead>Miles</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Efficiency</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffFleet.map((staff) => (
                        <TableRow
                          key={staff.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedStaff(staff.id)}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{staff.name}</div>
                              <div className="text-sm text-gray-500">{staff.role}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{staff.numberOfVisits}</Badge>
                          </TableCell>
                          <TableCell>
                            {Math.floor(staff.totalDriveTimeToday / 60)}h {staff.totalDriveTimeToday % 60}m
                          </TableCell>
                          <TableCell>
                            {Math.floor(staff.totalVisitTimeToday / 60)}h {staff.totalVisitTimeToday % 60}m
                          </TableCell>
                          <TableCell>{staff.totalDistanceToday.toFixed(1)} mi</TableCell>
                          <TableCell>${staff.drivingCost.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                staff.efficiencyScore >= 90
                                  ? "default"
                                  : staff.efficiencyScore >= 80
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {staff.efficiencyScore}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {selectedStaffData && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedStaffData.name}</CardTitle>
                  <CardDescription>Detailed visit breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <Badge className="ml-2" variant="outline">
                          {selectedStaffData.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-500">Avg Visit:</span>
                        <span className="ml-2 font-medium">{selectedStaffData.averageVisitDuration.toFixed(0)} min</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Today's Visits</h4>
                      {selectedStaffData.visitDetails.length === 0 ? (
                        <p className="text-sm text-gray-500">No visits today</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedStaffData.visitDetails.map((visit, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{visit.patient}</span>
                                <Badge variant="secondary">{visit.duration} min</Badge>
                              </div>
                              <div className="text-xs text-gray-500">
                                <div>
                                  {visit.startTime} - {visit.endTime}
                                </div>
                                <div>{visit.address}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Route className="h-5 w-5 mr-2" />
                  Distance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Miles Today</span>
                    <span className="font-bold">{summaryStats.totalDistance.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average per Staff</span>
                    <span className="font-bold">
                      {summaryStats.totalStaff > 0
                        ? (summaryStats.totalDistance / summaryStats.totalStaff).toFixed(1)
                        : "0.0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cost per Mile</span>
                    <span className="font-bold">$0.67</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Timer className="h-5 w-5 mr-2" />
                  Time Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Drive Time</span>
                    <span className="font-bold">
                      {Math.floor(summaryStats.totalDriveTime / 60)}h {summaryStats.totalDriveTime % 60}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Visit Time</span>
                    <span className="font-bold">
                      {Math.floor(summaryStats.totalVisitTime / 60)}h {summaryStats.totalVisitTime % 60}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Productivity Ratio</span>
                    <span className="font-bold">
                      {summaryStats.totalDriveTime + summaryStats.totalVisitTime > 0
                        ? (
                            (summaryStats.totalVisitTime / (summaryStats.totalVisitTime + summaryStats.totalDriveTime)) *
                            100
                          ).toFixed(1)
                        : "0.0"}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Efficiency Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Average Efficiency</span>
                    <span className="font-bold text-green-600">{summaryStats.avgEfficiency.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Visits per Hour</span>
                    <span className="font-bold">
                      {summaryStats.totalDriveTime + summaryStats.totalVisitTime > 0
                        ? (
                            (summaryStats.totalVisits / (summaryStats.totalDriveTime + summaryStats.totalVisitTime)) *
                            60
                          ).toFixed(1)
                        : "0.0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Miles per Visit</span>
                    <span className="font-bold">
                      {summaryStats.totalVisits > 0
                        ? (summaryStats.totalDistance / summaryStats.totalVisits).toFixed(1)
                        : "0.0"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
