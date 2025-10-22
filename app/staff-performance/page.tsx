"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Clock, Route, Users, Timer, Search, Filter, Download } from "lucide-react"

interface StaffPerformance {
  id: string
  name: string
  role: string
  avatar: string
  status: "active" | "on_visit" | "driving" | "offline"
  todayStats: {
    totalDriveTime: number // minutes
    totalVisits: number
    totalMiles: number
    totalVisitTime: number // minutes
    avgVisitDuration: number // minutes
    efficiencyScore: number
    costPerMile: number
    totalCost: number
  }
  weekStats: {
    totalDriveTime: number
    totalVisits: number
    totalMiles: number
    totalVisitTime: number
    avgVisitDuration: number
    efficiencyScore: number
    totalCost: number
  }
  visits: Array<{
    id: string
    patientName: string
    address: string
    startTime: string
    endTime: string
    duration: number // minutes
    driveTime: number // minutes
    distance: number // miles
    visitType: string
    notes?: string
  }>
  currentLocation?: {
    lat: number
    lng: number
    lastUpdate: string
  }
}

export default function StaffPerformancePage() {
  const [staffData, setStaffData] = useState<StaffPerformance[]>([])
  const [selectedStaff, setSelectedStaff] = useState<StaffPerformance | null>(null)
  const [timeRange, setTimeRange] = useState("today")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  useEffect(() => {
    // Simulate fetching staff performance data
    const mockData: StaffPerformance[] = [
      {
        id: "RN-2024-001",
        name: "Sarah Johnson",
        role: "Registered Nurse",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "on_visit",
        todayStats: {
          totalDriveTime: 127, // 2h 7m
          totalVisits: 6,
          totalMiles: 47.3,
          totalVisitTime: 285, // 4h 45m
          avgVisitDuration: 47.5,
          efficiencyScore: 94,
          costPerMile: 0.67,
          totalCost: 31.69,
        },
        weekStats: {
          totalDriveTime: 642, // 10h 42m
          totalVisits: 28,
          totalMiles: 234.7,
          totalVisitTime: 1380, // 23h
          avgVisitDuration: 49.3,
          efficiencyScore: 91,
          totalCost: 157.25,
        },
        visits: [
          {
            id: "V001",
            patientName: "Margaret Anderson",
            address: "123 Oak St, Los Angeles, CA",
            startTime: "08:30",
            endTime: "09:15",
            duration: 45,
            driveTime: 18,
            distance: 5.2,
            visitType: "Wound Care",
          },
          {
            id: "V002",
            patientName: "Robert Chen",
            address: "456 Pine Ave, Beverly Hills, CA",
            startTime: "10:00",
            endTime: "10:50",
            duration: 50,
            driveTime: 22,
            distance: 7.8,
            visitType: "Medication Management",
          },
          {
            id: "V003",
            patientName: "Elena Rodriguez",
            address: "789 Maple Dr, Santa Monica, CA",
            startTime: "11:30",
            endTime: "12:20",
            duration: 50,
            driveTime: 25,
            distance: 9.1,
            visitType: "Physical Assessment",
          },
        ],
        currentLocation: {
          lat: 34.0522,
          lng: -118.2437,
          lastUpdate: new Date().toISOString(),
        },
      },
      {
        id: "PT-2024-001",
        name: "Michael Chen",
        role: "Physical Therapist",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "driving",
        todayStats: {
          totalDriveTime: 98,
          totalVisits: 4,
          totalMiles: 32.1,
          totalVisitTime: 240,
          avgVisitDuration: 60,
          efficiencyScore: 89,
          costPerMile: 0.67,
          totalCost: 21.51,
        },
        weekStats: {
          totalDriveTime: 520,
          totalVisits: 20,
          totalMiles: 178.4,
          totalVisitTime: 1200,
          avgVisitDuration: 60,
          efficiencyScore: 87,
          totalCost: 119.53,
        },
        visits: [
          {
            id: "V004",
            patientName: "James Wilson",
            address: "321 Cedar Blvd, Pasadena, CA",
            startTime: "09:00",
            endTime: "10:00",
            duration: 60,
            driveTime: 20,
            distance: 6.5,
            visitType: "Physical Therapy",
          },
          {
            id: "V005",
            patientName: "Mary Thompson",
            address: "654 Elm St, Glendale, CA",
            startTime: "10:45",
            endTime: "11:45",
            duration: 60,
            driveTime: 25,
            distance: 8.2,
            visitType: "Mobility Assessment",
          },
        ],
      },
      {
        id: "OT-2024-001",
        name: "Emily Davis",
        role: "Occupational Therapist",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "active",
        todayStats: {
          totalDriveTime: 85,
          totalVisits: 5,
          totalMiles: 28.7,
          totalVisitTime: 275,
          avgVisitDuration: 55,
          efficiencyScore: 96,
          costPerMile: 0.67,
          totalCost: 19.23,
        },
        weekStats: {
          totalDriveTime: 445,
          totalVisits: 23,
          totalMiles: 156.2,
          totalVisitTime: 1265,
          avgVisitDuration: 55,
          efficiencyScore: 93,
          totalCost: 104.65,
        },
        visits: [
          {
            id: "V006",
            patientName: "Dorothy Kim",
            address: "987 Birch Ave, Burbank, CA",
            startTime: "08:15",
            endTime: "09:10",
            duration: 55,
            driveTime: 15,
            distance: 4.3,
            visitType: "ADL Training",
          },
        ],
      },
      {
        id: "LPN-2024-001",
        name: "Lisa Garcia",
        role: "Licensed Practical Nurse",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "offline",
        todayStats: {
          totalDriveTime: 156,
          totalVisits: 8,
          totalMiles: 62.4,
          totalVisitTime: 320,
          avgVisitDuration: 40,
          efficiencyScore: 82,
          costPerMile: 0.67,
          totalCost: 41.81,
        },
        weekStats: {
          totalDriveTime: 780,
          totalVisits: 35,
          totalMiles: 287.6,
          totalVisitTime: 1400,
          avgVisitDuration: 40,
          efficiencyScore: 85,
          totalCost: 192.69,
        },
        visits: [],
      },
    ]

    setStaffData(mockData)
    setSelectedStaff(mockData[0])
  }, [])

  const filteredStaff = staffData.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || staff.role.toLowerCase().includes(roleFilter.toLowerCase())
    return matchesSearch && matchesRole
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "on_visit":
        return "bg-blue-500"
      case "driving":
        return "bg-yellow-500"
      case "offline":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Available"
      case "on_visit":
        return "On Visit"
      case "driving":
        return "En Route"
      case "offline":
        return "Offline"
      default:
        return "Unknown"
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const currentStats = timeRange === "today" ? selectedStaff?.todayStats : selectedStaff?.weekStats

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Performance Dashboard</h1>
            <p className="text-gray-600">Detailed analytics for drive time, visits, and efficiency metrics</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Staff List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Staff Members</CardTitle>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search staff..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[100px]">
                    <Filter className="h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="nurse">Nurses</SelectItem>
                    <SelectItem value="therapist">Therapists</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-2">
                {filteredStaff.map((staff) => (
                  <div
                    key={staff.id}
                    onClick={() => setSelectedStaff(staff)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 ${
                      selectedStaff?.id === staff.id ? "bg-blue-50 border-blue-500" : "border-transparent"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={staff.avatar || "/placeholder.svg"}
                          alt={staff.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(staff.status)}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{staff.name}</p>
                        <p className="text-xs text-gray-500 truncate">{staff.role}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {getStatusText(staff.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedStaff && (
            <div className="space-y-6">
              {/* Staff Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={selectedStaff.avatar || "/placeholder.svg"}
                        alt={selectedStaff.name}
                        className="w-16 h-16 rounded-full"
                      />
                      <div>
                        <h2 className="text-2xl font-bold">{selectedStaff.name}</h2>
                        <p className="text-gray-600">{selectedStaff.role}</p>
                        <Badge className={`${getStatusColor(selectedStaff.status)} text-white mt-2`}>
                          {getStatusText(selectedStaff.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Efficiency Score</p>
                      <p className="text-3xl font-bold text-green-600">{currentStats?.efficiencyScore}%</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Drive Time</p>
                        <p className="text-2xl font-bold">{formatTime(currentStats?.totalDriveTime || 0)}</p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Visits</p>
                        <p className="text-2xl font-bold">{currentStats?.totalVisits}</p>
                      </div>
                      <Users className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Miles</p>
                        <p className="text-2xl font-bold">{currentStats?.totalMiles}</p>
                      </div>
                      <Route className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Visit Time</p>
                        <p className="text-2xl font-bold">{formatTime(currentStats?.totalVisitTime || 0)}</p>
                      </div>
                      <Timer className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Average Visit Duration</span>
                        <span className="font-bold">{formatTime(currentStats?.avgVisitDuration || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Cost per Mile</span>
                        <span className="font-bold">${currentStats?.costPerMile?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Driving Cost</span>
                        <span className="font-bold">${currentStats?.totalCost?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Miles per Visit</span>
                        <span className="font-bold">
                          {((currentStats?.totalMiles || 0) / (currentStats?.totalVisits || 1)).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Time Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Visit Time</span>
                          <span>{formatTime(currentStats?.totalVisitTime || 0)}</span>
                        </div>
                        <Progress
                          value={
                            ((currentStats?.totalVisitTime || 0) /
                              ((currentStats?.totalVisitTime || 0) + (currentStats?.totalDriveTime || 0))) *
                            100
                          }
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Drive Time</span>
                          <span>{formatTime(currentStats?.totalDriveTime || 0)}</span>
                        </div>
                        <Progress
                          value={
                            ((currentStats?.totalDriveTime || 0) /
                              ((currentStats?.totalVisitTime || 0) + (currentStats?.totalDriveTime || 0))) *
                            100
                          }
                          className="h-2"
                        />
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total Active Time</span>
                          <span>
                            {formatTime((currentStats?.totalVisitTime || 0) + (currentStats?.totalDriveTime || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Visit Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Visits</CardTitle>
                  <CardDescription>Detailed breakdown of each visit</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Drive Time</TableHead>
                        <TableHead>Distance</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStaff.visits.map((visit) => (
                        <TableRow key={visit.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{visit.patientName}</div>
                              <div className="text-sm text-gray-500">{visit.address}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {visit.startTime} - {visit.endTime}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{formatTime(visit.duration)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{formatTime(visit.driveTime)}</Badge>
                          </TableCell>
                          <TableCell>{visit.distance} mi</TableCell>
                          <TableCell>
                            <Badge variant="outline">{visit.visitType}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
