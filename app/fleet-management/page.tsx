"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Map, Clock, DollarSign, Users, TrendingUp, ListFilter, RefreshCw, Route, Car, Timer } from "lucide-react"
import StaffGpsTracker from "@/components/staff-gps-tracker"

// Mock data for staff fleet with detailed metrics
const mockStaffFleet = [
  {
    id: "RN-2024-001",
    name: "Sarah Johnson",
    role: "Registered Nurse",
    status: "En Route",
    currentSpeed: 45, // mph
    etaToNext: "12:35 PM",
    nextPatient: "Margaret Anderson",
    totalDistanceToday: 28.5, // miles
    totalDriveTimeToday: 55, // minutes
    totalVisitTimeToday: 120, // minutes
    numberOfVisits: 4,
    averageVisitDuration: 30, // minutes
    efficiencyScore: 92, // percentage
    location: { lat: 34.0522, lng: -118.2437 },
    visitDetails: [
      { patient: "John Smith", duration: 35, startTime: "8:00 AM", endTime: "8:35 AM", address: "123 Oak St" },
      { patient: "Mary Wilson", duration: 28, startTime: "9:15 AM", endTime: "9:43 AM", address: "456 Pine Ave" },
      { patient: "Robert Davis", duration: 32, startTime: "10:30 AM", endTime: "11:02 AM", address: "789 Elm Dr" },
      { patient: "Linda Brown", duration: 25, startTime: "11:45 AM", endTime: "12:10 PM", address: "321 Maple St" },
    ],
    drivingCost: 19.1, // $0.67 per mile
  },
  {
    id: "PT-2024-001",
    name: "Michael Chen",
    role: "Physical Therapist",
    status: "On Visit",
    currentSpeed: 0,
    etaToNext: "N/A",
    nextPatient: "Robert Thompson",
    totalDistanceToday: 15.2,
    totalDriveTimeToday: 35,
    totalVisitTimeToday: 90,
    numberOfVisits: 2,
    averageVisitDuration: 45,
    efficiencyScore: 88,
    location: { lat: 34.0622, lng: -118.2537 },
    visitDetails: [
      { patient: "Alice Johnson", duration: 45, startTime: "9:00 AM", endTime: "9:45 AM", address: "567 Cedar Ln" },
      { patient: "Robert Thompson", duration: 45, startTime: "11:00 AM", endTime: "11:45 AM", address: "890 Birch Rd" },
    ],
    drivingCost: 10.18,
  },
  {
    id: "OT-2024-001",
    name: "Emily Davis",
    role: "Occupational Therapist",
    status: "Idle",
    currentSpeed: 0,
    etaToNext: "1:15 PM",
    nextPatient: "Dorothy Williams",
    totalDistanceToday: 8.1,
    totalDriveTimeToday: 20,
    totalVisitTimeToday: 60,
    numberOfVisits: 2,
    averageVisitDuration: 30,
    efficiencyScore: 95,
    location: { lat: 34.0422, lng: -118.2637 },
    visitDetails: [
      { patient: "George Miller", duration: 30, startTime: "8:30 AM", endTime: "9:00 AM", address: "234 Spruce St" },
      { patient: "Helen Garcia", duration: 30, startTime: "10:00 AM", endTime: "10:30 AM", address: "678 Willow Ave" },
    ],
    drivingCost: 5.43,
  },
  {
    id: "LPN-2024-001",
    name: "Lisa Garcia",
    role: "LPN",
    status: "Driving",
    currentSpeed: 30,
    etaToNext: "12:50 PM",
    nextPatient: "James Patterson",
    totalDistanceToday: 35.7,
    totalDriveTimeToday: 75,
    totalVisitTimeToday: 150,
    numberOfVisits: 5,
    averageVisitDuration: 30,
    efficiencyScore: 85,
    location: { lat: 34.0722, lng: -118.2337 },
    visitDetails: [
      { patient: "Tom Anderson", duration: 25, startTime: "7:30 AM", endTime: "7:55 AM", address: "345 Ash St" },
      { patient: "Betty White", duration: 35, startTime: "8:30 AM", endTime: "9:05 AM", address: "789 Oak Ave" },
      { patient: "Frank Wilson", duration: 30, startTime: "9:45 AM", endTime: "10:15 AM", address: "123 Pine Dr" },
      { patient: "Grace Lee", duration: 28, startTime: "11:00 AM", endTime: "11:28 AM", address: "456 Elm St" },
      { patient: "Henry Davis", duration: 32, startTime: "12:00 PM", endTime: "12:32 PM", address: "678 Maple Ave" },
    ],
    drivingCost: 23.92,
  },
]

export default function FleetManagementDashboard() {
  const [filter, setFilter] = useState("All")
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const summaryStats = useMemo(() => {
    const totalStaff = mockStaffFleet.length
    const enRoute = mockStaffFleet.filter((s) => s.status === "En Route" || s.status === "Driving").length
    const onVisit = mockStaffFleet.filter((s) => s.status === "On Visit").length
    const idle = mockStaffFleet.filter((s) => s.status === "Idle").length
    const totalDistance = mockStaffFleet.reduce((sum, s) => sum + s.totalDistanceToday, 0)
    const totalDriveTime = mockStaffFleet.reduce((sum, s) => sum + s.totalDriveTimeToday, 0)
    const totalVisitTime = mockStaffFleet.reduce((sum, s) => sum + s.totalVisitTimeToday, 0)
    const totalVisits = mockStaffFleet.reduce((sum, s) => sum + s.numberOfVisits, 0)
    const avgEfficiency = mockStaffFleet.reduce((sum, s) => sum + s.efficiencyScore, 0) / (totalStaff || 1)
    const totalDrivingCost = mockStaffFleet.reduce((sum, s) => sum + s.drivingCost, 0)

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
  }, [mockStaffFleet])

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1500)
  }

  const selectedStaffData = selectedStaff ? mockStaffFleet.find((s) => s.id === selectedStaff) : null

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fleet Management & Route Optimization</h1>
            <p className="text-gray-600">Real-time GPS tracking and performance analytics for field staff.</p>
          </div>
          <Button onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
      </header>

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
            <p className="text-xs text-muted-foreground">vs. optimized routes</p>
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
              <StaffGpsTracker staffFleet={mockStaffFleet} filter={filter} />
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
                    {mockStaffFleet.map((staff) => (
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
                        <span className="ml-2 font-medium">{selectedStaffData.averageVisitDuration} min</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Today's Visits</h4>
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
                      {(summaryStats.totalDistance / summaryStats.totalStaff).toFixed(1)}
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
                      {(
                        (summaryStats.totalVisitTime / (summaryStats.totalVisitTime + summaryStats.totalDriveTime)) *
                        100
                      ).toFixed(1)}
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
                      {(
                        (summaryStats.totalVisits / (summaryStats.totalDriveTime + summaryStats.totalVisitTime)) *
                        60
                      ).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Miles per Visit</span>
                    <span className="font-bold">
                      {(summaryStats.totalDistance / summaryStats.totalVisits).toFixed(1)}
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
