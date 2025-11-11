"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Route, Users, Timer, Search, Filter, Download, Target, Award, BookOpen, Navigation, MapPin, ExternalLink, RefreshCw, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const [activeTab, setActiveTab] = useState("performance")
  
  // Professional Development Plan state
  const [pipGoals, setPipGoals] = useState<{
    performanceGoals: any[]
    competencyGoals: any[]
    totalPips: number
  }>({
    performanceGoals: [],
    competencyGoals: [],
    totalPips: 0
  })
  const [pipLoading, setPipLoading] = useState(false)
  const [pipError, setPipError] = useState<string | null>(null)
  
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
  
  // Load Professional Development Plan data when staff is selected
  useEffect(() => {
    const loadPipGoals = async () => {
      if (!selectedStaff?.id) {
        setPipGoals({ performanceGoals: [], competencyGoals: [], totalPips: 0 })
        return
      }
      
      try {
        setPipLoading(true)
        setPipError(null)
        
        const res = await fetch(`/api/staff-performance/pip-goals?staffId=${encodeURIComponent(selectedStaff.id)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setPipGoals({
              performanceGoals: data.performanceGoals || [],
              competencyGoals: data.competencyGoals || [],
              totalPips: data.totalPips || 0
            })
          } else {
            setPipError(data.message || "Failed to load development plan")
            setPipGoals({ performanceGoals: [], competencyGoals: [], totalPips: 0 })
          }
        } else {
          setPipError("Failed to load development plan")
          setPipGoals({ performanceGoals: [], competencyGoals: [], totalPips: 0 })
        }
      } catch (e: any) {
        console.error("Error loading PIP goals:", e)
        setPipError(e.message || "Failed to load development plan")
        setPipGoals({ performanceGoals: [], competencyGoals: [], totalPips: 0 })
      } finally {
        setPipLoading(false)
      }
    }
    
    loadPipGoals()
  }, [selectedStaff?.id])

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
            {selectedStaff?.id && (
              <Link href={`/track/${selectedStaff.id}`}>
                <Button variant="outline" className="bg-blue-50 hover:bg-blue-100 border-blue-200">
                  <Navigation className="h-4 w-4 mr-2" />
                  View GPS Tracking
                </Button>
              </Link>
            )}
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
                <TabsTrigger value="development">Professional Development Plan</TabsTrigger>
              </TabsList>
              
              <TabsContent value="performance" className="space-y-6">
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
                                return <Badge variant="destructive">Cancelled</Badge>
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
              </TabsContent>
              
              <TabsContent value="development" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2" />
                      Professional Development Plan
                    </CardTitle>
                    <CardDescription>
                      Performance Improvement Plans and development goals for {selectedStaff.name}
                      {pipGoals.totalPips > 0 && ` • ${pipGoals.totalPips} active PIP${pipGoals.totalPips !== 1 ? 's' : ''}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pipLoading && (
                      <div className="text-center py-8">
                        <div className="text-sm text-gray-600">Loading development plan...</div>
                      </div>
                    )}
                    
                    {pipError && (
                      <div className="text-center py-8">
                        <div className="text-sm text-red-600">{pipError}</div>
                      </div>
                    )}
                    
                    {!pipLoading && !pipError && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Performance Goals */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center">
                              <Award className="h-4 w-4 mr-2" />
                              Performance Goals
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {pipGoals.performanceGoals.length > 0 ? (
                                pipGoals.performanceGoals.map((goal: any, idx: number) => (
                                  <div 
                                    key={goal.id || idx} 
                                    className={`p-3 border rounded-lg ${
                                      goal.completed ? 'bg-green-50 border-green-200' :
                                      goal.progress >= 75 ? 'bg-blue-50 border-blue-200' :
                                      goal.progress >= 50 ? 'bg-yellow-50 border-yellow-200' :
                                      'bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <h4 className="font-medium text-sm">{goal.description || 'Performance Goal'}</h4>
                                    <p className="text-xs text-gray-600 mt-1">
                                      {goal.targetDate ? (
                                        <>Target: {new Date(goal.targetDate).toLocaleDateString()}</>
                                      ) : (
                                        <>Target: Not set</>
                                      )}
                                      {goal.completed && <span className="ml-2 text-green-600 font-medium">✓ Completed</span>}
                                    </p>
                                    <div className="mt-2">
                                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                                        <span>Progress</span>
                                        <span>{goal.progress || 0}%</span>
                                      </div>
                                      <Progress value={goal.progress || 0} className="h-2" />
                                    </div>
                                    {goal.actions && Array.isArray(goal.actions) && goal.actions.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Action Items:</p>
                                        <ul className="text-xs text-gray-600 space-y-1">
                                          {goal.actions.slice(0, 3).map((action: string, actionIdx: number) => (
                                            <li key={actionIdx} className="flex items-start">
                                              <span className="mr-1">•</span>
                                              <span>{action}</span>
                                            </li>
                                          ))}
                                          {goal.actions.length > 3 && (
                                            <li className="text-gray-500 italic">+ {goal.actions.length - 3} more</li>
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                    {goal.supervisor && (
                                      <div className="mt-2 flex items-center space-x-1">
                                        <span className="text-xs font-medium text-gray-700">Supervisor:</span>
                                        <span className="text-xs text-gray-600">{goal.supervisor}</span>
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                  <p className="text-xs text-gray-600">
                                    No active performance improvement goals at this time.
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Competency Goals */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center">
                              <Target className="h-4 w-4 mr-2" />
                              Competency Goals
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {pipGoals.competencyGoals.length > 0 ? (
                                pipGoals.competencyGoals.map((goal: any, idx: number) => (
                                  <div 
                                    key={goal.id || idx} 
                                    className={`p-3 border rounded-lg ${
                                      goal.completed ? 'bg-green-50 border-green-200' :
                                      goal.progress >= 75 ? 'bg-blue-50 border-blue-200' :
                                      goal.progress >= 50 ? 'bg-yellow-50 border-yellow-200' :
                                      'bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <h4 className="font-medium text-sm">{goal.description || 'Competency Goal'}</h4>
                                    <p className="text-xs text-gray-600 mt-1">
                                      {goal.targetDate ? (
                                        <>Target: {new Date(goal.targetDate).toLocaleDateString()}</>
                                      ) : (
                                        <>Target: Not set</>
                                      )}
                                      {goal.completed && <span className="ml-2 text-green-600 font-medium">✓ Completed</span>}
                                    </p>
                                    <div className="mt-2">
                                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                                        <span>Progress</span>
                                        <span>{goal.progress || 0}%</span>
                                      </div>
                                      <Progress value={goal.progress || 0} className="h-2" />
                                    </div>
                                    {goal.actions && Array.isArray(goal.actions) && goal.actions.length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Action Items:</p>
                                        <ul className="text-xs text-gray-600 space-y-1">
                                          {goal.actions.slice(0, 3).map((action: string, actionIdx: number) => (
                                            <li key={actionIdx} className="flex items-start">
                                              <span className="mr-1">•</span>
                                              <span>{action}</span>
                                            </li>
                                          ))}
                                          {goal.actions.length > 3 && (
                                            <li className="text-gray-500 italic">+ {goal.actions.length - 3} more</li>
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                    {goal.supervisor && (
                                      <div className="mt-2 flex items-center space-x-1">
                                        <span className="text-xs font-medium text-gray-700">Supervisor:</span>
                                        <span className="text-xs text-gray-600">{goal.supervisor}</span>
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                  <p className="text-xs text-gray-600">
                                    No active competency improvement goals at this time.
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
                    {/* Summary Stats */}
                    {!pipLoading && !pipError && (pipGoals.performanceGoals.length > 0 || pipGoals.competencyGoals.length > 0) && (
                      <Card className="mt-6">
                        <CardHeader>
                          <CardTitle className="text-base">Development Plan Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{pipGoals.totalPips}</div>
                              <div className="text-xs text-gray-600">Active PIPs</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">{pipGoals.performanceGoals.length}</div>
                              <div className="text-xs text-gray-600">Performance Goals</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{pipGoals.competencyGoals.length}</div>
                              <div className="text-xs text-gray-600">Competency Goals</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}
