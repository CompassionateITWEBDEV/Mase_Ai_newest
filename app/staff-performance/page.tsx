"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Route, Users, Timer, Search, Filter, Download, MapPin, ExternalLink, RefreshCw, AlertCircle } from "lucide-react"

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
    costPerMile: number
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
  
  // Staff location tracking state
  const [staffLocation, setStaffLocation] = useState<{
    latitude: number
    longitude: number
    accuracy: number | null
    timestamp: string
    address: string | null
    status: string
    isRecent?: boolean
    ageMinutes?: number | null
    isIPGeolocation?: boolean
    heading?: number | null
    speed?: number | null
    routePoints?: Array<{lat: number, lng: number, timestamp: string}> | null
  } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    const loadStaffPerformance = async () => {
      try {
        // Get all staff
        const staffRes = await fetch('/api/staff/list', { cache: 'no-store' })
        const staffData = await staffRes.json()
        const staffList = staffData.success ? staffData.staff : []

        // Get performance stats for each staff
        const performanceData: StaffPerformance[] = await Promise.all(
          staffList.map(async (staff: any) => {
            try {
              const statsRes = await fetch(`/api/staff-performance/stats?staff_id=${staff.id}&period=day`, { cache: 'no-store' })
              const stats = await statsRes.json()
              
              if (stats.success) {
                return {
                  id: staff.id,
                  name: staff.name,
                  role: staff.department || 'Staff',
                  avatar: '/placeholder.svg?height=40&width=40',
                  status: stats.status || 'active',
                  todayStats: {
                    totalDriveTime: stats.todayStats.totalDriveTime,
                    totalVisits: stats.todayStats.totalVisits,
                    totalMiles: stats.todayStats.totalMiles,
                    totalVisitTime: stats.todayStats.totalVisitTime,
                    avgVisitDuration: stats.todayStats.avgVisitDuration,
                    efficiencyScore: stats.todayStats.efficiencyScore,
                    costPerMile: stats.todayStats.costPerMile,
                    totalCost: stats.todayStats.totalCost
                  },
                  weekStats: {
                    totalDriveTime: stats.weekStats.totalDriveTime,
                    totalVisits: stats.weekStats.totalVisits,
                    totalMiles: stats.weekStats.totalMiles,
                    totalVisitTime: stats.weekStats.totalVisitTime,
                    avgVisitDuration: stats.weekStats.avgVisitDuration,
                    efficiencyScore: stats.weekStats.efficiencyScore,
                    costPerMile: stats.weekStats.costPerMile || 0.67,
                    totalCost: stats.weekStats.totalCost
                  },
                  visits: stats.visits || []
                }
              }
            } catch (e) {
              console.error(`Failed to load stats for ${staff.name}:`, e)
            }
            
            // Return empty stats if failed
            return {
              id: staff.id,
              name: staff.name,
              role: staff.department || 'Staff',
              avatar: '/placeholder.svg?height=40&width=40',
              status: 'offline' as const,
              todayStats: {
                totalDriveTime: 0,
                totalVisits: 0,
                totalMiles: 0,
                totalVisitTime: 0,
                avgVisitDuration: 0,
                efficiencyScore: 0,
                costPerMile: 0.67,
                totalCost: 0
              },
              weekStats: {
                totalDriveTime: 0,
                totalVisits: 0,
                totalMiles: 0,
                totalVisitTime: 0,
                avgVisitDuration: 0,
                efficiencyScore: 0,
                costPerMile: 0.67,
                totalCost: 0
              },
              visits: []
            }
          })
        )

        setStaffData(performanceData.filter(Boolean))
        if (performanceData.length > 0) {
          setSelectedStaff(performanceData[0])
        } else {
          // No staff data available - set empty state
          setStaffData([])
          setSelectedStaff(null)
        }
      } catch (e) {
        console.error('Failed to load staff performance:', e)
        // No fallback data - just set empty state
        setStaffData([])
        setSelectedStaff(null)
      }
    }
    loadStaffPerformance()
  }, [])

  // Auto-refresh stats every 30 seconds to show updated visit/drive times
  useEffect(() => {
    if (!selectedStaff?.id) return

    const reloadStats = async () => {
      try {
        const statsRes = await fetch(`/api/staff-performance/stats?staff_id=${selectedStaff.id}&period=day`, { cache: 'no-store' })
        const stats = await statsRes.json()
        
        if (stats.success) {
          // Update selected staff with new stats
          setSelectedStaff(prev => prev ? {
            ...prev,
            todayStats: {
              totalDriveTime: stats.todayStats.totalDriveTime,
              totalVisits: stats.todayStats.totalVisits,
              totalMiles: stats.todayStats.totalMiles,
              totalVisitTime: stats.todayStats.totalVisitTime,
              avgVisitDuration: stats.todayStats.avgVisitDuration,
              efficiencyScore: stats.todayStats.efficiencyScore,
              costPerMile: stats.todayStats.costPerMile,
              totalCost: stats.todayStats.totalCost
            },
            visits: stats.visits || []
          } : null)
        }
      } catch (e) {
        console.error('Failed to reload stats:', e)
      }
    }

    const interval = setInterval(reloadStats, 30000) // Refresh every 30 seconds to show updated visit and drive times

    return () => clearInterval(interval)
  }, [selectedStaff?.id])

  // Load staff location when staff is selected
  useEffect(() => {
    const loadStaffLocation = async () => {
      if (!selectedStaff?.id) {
        setStaffLocation(null)
        return
      }
      
      try {
        setLocationLoading(true)
        setLocationError(null)
        
        const res = await fetch(`/api/gps/staff-location?staff_id=${encodeURIComponent(selectedStaff.id)}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.currentLocation) {
            setStaffLocation({
              latitude: data.currentLocation.latitude,
              longitude: data.currentLocation.longitude,
              accuracy: data.currentLocation.accuracy,
              timestamp: data.currentLocation.timestamp,
              address: data.currentLocation.address,
              status: data.status || 'offline',
              isRecent: data.currentLocation.isRecent,
              ageMinutes: data.currentLocation.ageMinutes,
              isIPGeolocation: data.currentLocation.isIPGeolocation,
              heading: data.currentLocation.heading || null,
              speed: data.currentLocation.speed || null,
              routePoints: data.activeTrip?.routePoints || null
            })
          } else {
            setStaffLocation(null)
          }
        } else {
          setLocationError("Failed to load location")
          setStaffLocation(null)
        }
      } catch (e: any) {
        console.error("Error loading staff location:", e)
        setLocationError(e.message || "Failed to load location")
        setStaffLocation(null)
      } finally {
        setLocationLoading(false)
      }
    }
    
    loadStaffLocation()
    
    // Refresh location every 5 seconds if staff is selected (real-time tracking for moving vehicle)
    const interval = setInterval(() => {
      if (selectedStaff?.id) {
        loadStaffLocation()
      }
    }, 5000) // 5 seconds - very frequent updates to show vehicle moving in real-time
    
    return () => clearInterval(interval)
  }, [selectedStaff?.id])

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
                        <TableHead>Status</TableHead>
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
                              {visit.startTime} {visit.endTime ? `- ${visit.endTime}` : visit.endTime === 'In Progress' ? '- In Progress' : ''}
                            </div>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const status = (visit as any).status || 'in_progress'
                              if (status === 'completed') {
                                return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
                              } else if (status === 'cancelled') {
                                return (
                                  <div className="flex flex-col gap-1">
                                    <Badge variant="destructive">Cancelled</Badge>
                                    {(visit as any).cancelReason && (
                                      <div className="text-xs text-gray-600 italic mt-1 max-w-[200px]">
                                        Reason: {(visit as any).cancelReason}
                                      </div>
                                    )}
                                  </div>
                                )
                              } else {
                                return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>
                              }
                            })()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={(visit as any).status === 'in_progress' ? 'default' : 'outline'}>
                              {formatTime(visit.duration)} {(visit as any).status === 'in_progress' && !visit.endTime && '(ongoing)'}
                            </Badge>
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
