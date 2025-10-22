"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  MapPin,
  QrCode,
  Building2,
  TrendingUp,
  DollarSign,
  Phone,
  AlertTriangle,
  Trophy,
  Route,
  UtensilsCrossed,
  Bell,
  Download,
  Eye,
  Edit,
  Plus,
  Search,
  BarChart3,
  Target,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Flame,
  Snowflake,
} from "lucide-react"
import { getCurrentUser, hasPermission } from "@/lib/auth"

// Sample data - in real implementation, this would come from your database
const sampleFacilities = [
  {
    id: "FAC-001",
    name: "Mercy General Hospital",
    assignedMarketer: "Sarah Johnson",
    lastVisitDate: "2024-01-08",
    referralsThisMonth: 12,
    referralsAdmitted: 8,
    status: "hot",
    address: "123 Medical Center Dr, Dallas, TX 75201",
    phone: "(214) 555-0123",
    contactPerson: "Dr. Michael Smith",
    notes: "High-volume referrer, excellent relationship",
    zipCode: "75201",
    lunchCosts: 450,
    conversionRate: 67,
  },
  {
    id: "FAC-002",
    name: "Community Care Center",
    assignedMarketer: "Mike Rodriguez",
    lastVisitDate: "2024-01-05",
    referralsThisMonth: 6,
    referralsAdmitted: 2,
    status: "warning",
    address: "456 Healthcare Blvd, Dallas, TX 75202",
    phone: "(214) 555-0456",
    contactPerson: "Nurse Manager Lisa Brown",
    notes: "Conversion rate declining, needs attention",
    zipCode: "75202",
    lunchCosts: 280,
    conversionRate: 33,
  },
  {
    id: "FAC-003",
    name: "Sunset Rehabilitation",
    assignedMarketer: "Emily Chen",
    lastVisitDate: "2023-12-20",
    referralsThisMonth: 2,
    referralsAdmitted: 0,
    status: "cold",
    address: "789 Recovery Way, Dallas, TX 75203",
    phone: "(214) 555-0789",
    contactPerson: "Administrator John Davis",
    notes: "No recent activity, needs re-engagement",
    zipCode: "75203",
    lunchCosts: 150,
    conversionRate: 0,
  },
]

const sampleMarketers = [
  {
    id: "MKT-001",
    name: "Sarah Johnson",
    facilitiesVisited: 15,
    referrals: 45,
    admissions: 32,
    conversionRate: 71,
    avgCostPerAdmission: 85,
    territory: "North Dallas",
  },
  {
    id: "MKT-002",
    name: "Mike Rodriguez",
    facilitiesVisited: 12,
    referrals: 28,
    admissions: 18,
    conversionRate: 64,
    avgCostPerAdmission: 92,
    territory: "South Dallas",
  },
  {
    id: "MKT-003",
    name: "Emily Chen",
    facilitiesVisited: 18,
    referrals: 38,
    admissions: 25,
    conversionRate: 66,
    avgCostPerAdmission: 78,
    territory: "East Dallas",
  },
]

const sampleLunchROI = [
  {
    id: "LUNCH-001",
    facility: "Mercy General Hospital",
    marketer: "Sarah Johnson",
    lunchDate: "2024-01-08",
    lunchCost: 125,
    referralsIn30Days: 8,
    admissionsIn30Days: 6,
    costPerLead: 15.63,
    costPerAdmission: 20.83,
  },
  {
    id: "LUNCH-002",
    facility: "Community Care Center",
    marketer: "Mike Rodriguez",
    lunchDate: "2024-01-05",
    lunchCost: 95,
    referralsIn30Days: 3,
    admissionsIn30Days: 1,
    costPerLead: 31.67,
    costPerAdmission: 95.0,
  },
]

const sampleAlerts = [
  {
    id: "ALERT-001",
    type: "no_referrals",
    severity: "high",
    facility: "Sunset Rehabilitation",
    marketer: "Emily Chen",
    message: "No referrals received in 45+ days",
    daysOverdue: 45,
    actionRequired: true,
  },
  {
    id: "ALERT-002",
    type: "high_cost",
    severity: "medium",
    facility: "Community Care Center",
    marketer: "Mike Rodriguez",
    message: "Cost per admission exceeds $90 threshold",
    costPerAdmission: 95,
    actionRequired: true,
  },
  {
    id: "ALERT-003",
    type: "pending_referral",
    severity: "urgent",
    facility: "Mercy General Hospital",
    message: "New referral not acted upon in 18 hours",
    hoursOverdue: 18,
    actionRequired: true,
  },
]

export default function MarketingDashboardPage() {
  const [activeTab, setActiveTab] = useState("facilities")
  const [facilities, setFacilities] = useState(sampleFacilities)
  const [marketers, setMarketers] = useState(sampleMarketers)
  const [lunchROI, setLunchROI] = useState(sampleLunchROI)
  const [alerts, setAlerts] = useState(sampleAlerts)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedMarketer, setSelectedMarketer] = useState("all")
  const [showReferralForm, setShowReferralForm] = useState(false)
  const [showLunchForm, setShowLunchForm] = useState(false)
  const [showQRGenerator, setShowQRGenerator] = useState(false)
  const [selectedFacilityForQR, setSelectedFacilityForQR] = useState("")

  // Get current user and check permissions
  const currentUser = getCurrentUser()
  const canManageMarketing = hasPermission(currentUser, "marketing", "write")
  const canViewMarketing = hasPermission(currentUser, "marketing", "read")

  // Filter facilities based on search and filters
  const filteredFacilities = useMemo(() => {
    let filtered = facilities

    if (searchTerm) {
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.assignedMarketer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((f) => f.status === statusFilter)
    }

    if (selectedMarketer !== "all") {
      filtered = filtered.filter((f) => f.assignedMarketer === selectedMarketer)
    }

    return filtered
  }, [facilities, searchTerm, statusFilter, selectedMarketer])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "hot":
        return <Flame className="h-4 w-4 text-red-500" />
      case "cold":
        return <Snowflake className="h-4 w-4 text-blue-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      hot: "bg-red-100 text-red-800",
      cold: "bg-blue-100 text-blue-800",
      warning: "bg-yellow-100 text-yellow-800",
    }
    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    )
  }

  const generateQRCode = (facilityId: string) => {
    const facility = facilities.find((f) => f.id === facilityId)
    if (!facility) return

    // In real implementation, this would generate an actual QR code
    const referralUrl = `${window.location.origin}/referral-intake?facility=${facilityId}&marketer=${encodeURIComponent(facility.assignedMarketer)}`

    // For demo purposes, we'll show the URL
    alert(`QR Code generated for ${facility.name}\nReferral URL: ${referralUrl}`)
  }

  const handleReferralSubmit = (formData: any) => {
    // In real implementation, this would submit to your API
    console.log("New referral submitted:", formData)
    setShowReferralForm(false)
    // Add success notification
  }

  const handleLunchSubmit = (formData: any) => {
    // In real implementation, this would submit to your API
    console.log("Lunch ROI data submitted:", formData)
    setShowLunchForm(false)
    // Add success notification
  }

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
  }

  const resolveAlert = (alertId: string) => {
    // In real implementation, this would update the alert status in your database
    dismissAlert(alertId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Marketing Dashboard</h1>
              <p className="text-gray-600">Lead Generation, Routing, and ROI Tracking</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {currentUser.role.name}
            </Badge>
            {canManageMarketing && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Edit className="h-3 w-3 mr-1" />
                Marketing Manager
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{facilities.length}</div>
              <p className="text-xs text-muted-foreground">
                {facilities.filter((f) => f.status === "hot").length} hot leads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Referrals</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{facilities.reduce((sum, f) => sum + f.referralsThisMonth, 0)}</div>
              <p className="text-xs text-muted-foreground">
                {facilities.reduce((sum, f) => sum + f.referralsAdmitted, 0)} admitted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  (facilities.reduce((sum, f) => sum + f.referralsAdmitted, 0) /
                    facilities.reduce((sum, f) => sum + f.referralsThisMonth, 0)) *
                    100,
                )}
                %
              </div>
              <p className="text-xs text-muted-foreground">Above 65% target</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{alerts.length}</div>
              <p className="text-xs text-muted-foreground">
                {alerts.filter((a) => a.severity === "urgent").length} urgent
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Smart Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-red-800">Smart Marketing Alerts</CardTitle>
                      <CardDescription className="text-red-600">
                        {alerts.length} alert{alerts.length !== 1 ? "s" : ""} requiring attention
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-red-600 text-white">
                    {alerts.filter((a) => a.severity === "urgent").length} Urgent
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {alerts.map((alert) => (
                    <Alert
                      key={alert.id}
                      className={`${
                        alert.severity === "urgent"
                          ? "border-red-300 bg-red-50"
                          : alert.severity === "high"
                            ? "border-orange-300 bg-orange-50"
                            : "border-yellow-300 bg-yellow-50"
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>
                          {alert.facility || "System Alert"} - {alert.type.replace("_", " ").toUpperCase()}
                        </span>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => dismissAlert(alert.id)}>
                            Dismiss
                          </Button>
                          <Button size="sm" onClick={() => resolveAlert(alert.id)}>
                            Resolve
                          </Button>
                        </div>
                      </AlertTitle>
                      <AlertDescription>
                        <p className="mb-2">{alert.message}</p>
                        {alert.marketer && (
                          <p className="text-xs">
                            <strong>Assigned Marketer:</strong> {alert.marketer}
                          </p>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="facilities">🏥 Facilities CRM</TabsTrigger>
            <TabsTrigger value="routes">🛣️ Route Planner</TabsTrigger>
            <TabsTrigger value="lunch-roi">📈 Lunch ROI</TabsTrigger>
            <TabsTrigger value="leaderboard">🧑‍💼 Leaderboard</TabsTrigger>
            <TabsTrigger value="referrals">🔔 Referral Intake</TabsTrigger>
          </TabsList>

          {/* Facilities CRM Tab */}
          <TabsContent value="facilities" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <Building2 className="h-5 w-5" />
                          <span>Facility CRM & Heatmap</span>
                        </CardTitle>
                        <CardDescription>Track referral volume, visits, and lead status</CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowQRGenerator(true)}
                          disabled={!canManageMarketing}
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          Generate QR
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Search and Filter Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search facilities..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="hot">🔥 Hot</SelectItem>
                          <SelectItem value="warning">⚠️ Warning</SelectItem>
                          <SelectItem value="cold">💤 Cold</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={selectedMarketer} onValueChange={setSelectedMarketer}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by marketer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Marketers</SelectItem>
                          {marketers.map((marketer) => (
                            <SelectItem key={marketer.id} value={marketer.name}>
                              {marketer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("")
                          setStatusFilter("all")
                          setSelectedMarketer("all")
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>

                    {/* Facilities Table */}
                    <div className="space-y-4">
                      {filteredFacilities.map((facility) => (
                        <Card key={facility.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">{facility.name}</h3>
                                  <p className="text-sm text-gray-600">{facility.assignedMarketer}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getStatusBadge(facility.status)}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generateQRCode(facility.id)}
                                  disabled={!canManageMarketing}
                                >
                                  <QrCode className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                              <div>
                                <span className="font-medium text-gray-600">Last Visit:</span>
                                <p>{facility.lastVisitDate}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Referrals:</span>
                                <p className="font-semibold text-blue-600">{facility.referralsThisMonth}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Admitted:</span>
                                <p className="font-semibold text-green-600">{facility.referralsAdmitted}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Conversion:</span>
                                <p className="font-semibold">{facility.conversionRate}%</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center">
                                  <Phone className="h-4 w-4 mr-1 text-gray-400" />
                                  {facility.phone}
                                </span>
                                <span className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                                  {facility.zipCode}
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                {canManageMarketing && (
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                )}
                              </div>
                            </div>

                            {facility.notes && (
                              <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                                <strong>Notes:</strong> {facility.notes}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Heatmap Sidebar */}
              <div className="w-full lg:w-80">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Referral Heatmap</span>
                    </CardTitle>
                    <CardDescription>Activity by ZIP code</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Array.from(new Set(facilities.map((f) => f.zipCode)))
                        .map((zip) => {
                          const zipFacilities = facilities.filter((f) => f.zipCode === zip)
                          const totalReferrals = zipFacilities.reduce((sum, f) => sum + f.referralsThisMonth, 0)
                          const totalAdmitted = zipFacilities.reduce((sum, f) => sum + f.referralsAdmitted, 0)
                          return {
                            zip,
                            facilities: zipFacilities.length,
                            referrals: totalReferrals,
                            admitted: totalAdmitted,
                          }
                        })
                        .sort((a, b) => b.referrals - a.referrals)
                        .map((area) => (
                          <div key={area.zip} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium">{area.zip}</div>
                              <div className="text-xs text-gray-600">{area.facilities} facilities</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-blue-600">{area.referrals}</div>
                              <div className="text-xs text-green-600">{area.admitted} admitted</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Route Planner Tab */}
          <TabsContent value="routes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Route className="h-5 w-5" />
                  <span>Marketing Route Optimizer</span>
                </CardTitle>
                <CardDescription>Optimize visit routes based on facility productivity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {marketers.map((marketer) => (
                    <Card key={marketer.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{marketer.name}</CardTitle>
                        <CardDescription>{marketer.territory}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Conversion Rate:</span>
                            <span className="font-semibold">{marketer.conversionRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Facilities Visited:</span>
                            <span className="font-semibold">{marketer.facilitiesVisited}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Referrals:</span>
                            <span className="font-semibold text-blue-600">{marketer.referrals}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Admissions:</span>
                            <span className="font-semibold text-green-600">{marketer.admissions}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-2">Suggested Weekly Route:</h4>
                          <div className="space-y-2 text-sm">
                            {facilities
                              .filter((f) => f.assignedMarketer === marketer.name)
                              .sort((a, b) => b.conversionRate - a.conversionRate)
                              .slice(0, 3)
                              .map((facility, index) => (
                                <div key={facility.id} className="flex items-center justify-between">
                                  <span className="flex items-center">
                                    <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center mr-2">
                                      {index + 1}
                                    </span>
                                    {facility.name}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {facility.conversionRate}%
                                  </Badge>
                                </div>
                              ))}
                          </div>
                        </div>

                        <Button className="w-full mt-4 bg-transparent" variant="outline">
                          <MapPin className="h-4 w-4 mr-2" />
                          View Map Route
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lunch ROI Tab */}
          <TabsContent value="lunch-roi" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <UtensilsCrossed className="h-5 w-5" />
                          <span>Lunch ROI Calculator</span>
                        </CardTitle>
                        <CardDescription>Track lunch costs against referral production</CardDescription>
                      </div>
                      <Button onClick={() => setShowLunchForm(true)} disabled={!canManageMarketing}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lunch Entry
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {lunchROI.map((entry) => (
                        <Card key={entry.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold">{entry.facility}</h3>
                                <p className="text-sm text-gray-600">
                                  {entry.marketer} • {entry.lunchDate}
                                </p>
                              </div>
                              <Badge className="bg-green-100 text-green-800">${entry.lunchCost}</Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">Referrals (30d):</span>
                                <p className="font-semibold text-blue-600">{entry.referralsIn30Days}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Admissions (30d):</span>
                                <p className="font-semibold text-green-600">{entry.admissionsIn30Days}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Cost/Lead:</span>
                                <p className="font-semibold">${entry.costPerLead.toFixed(2)}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Cost/Admission:</span>
                                <p
                                  className={`font-semibold ${entry.costPerAdmission > 50 ? "text-red-600" : "text-green-600"}`}
                                >
                                  ${entry.costPerAdmission.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {entry.costPerAdmission > 50 && (
                              <Alert className="mt-3 border-yellow-200 bg-yellow-50">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-yellow-800">
                                  Cost per admission exceeds $50 threshold. Consider adjusting strategy.
                                </AlertDescription>
                              </Alert>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ROI Summary */}
              <div className="w-full lg:w-80">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5" />
                      <span>ROI Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 rounded">
                        <div className="text-sm text-blue-600">Total Lunch Spend</div>
                        <div className="text-2xl font-bold text-blue-800">
                          ${lunchROI.reduce((sum, entry) => sum + entry.lunchCost, 0)}
                        </div>
                      </div>

                      <div className="p-3 bg-green-50 rounded">
                        <div className="text-sm text-green-600">Total Admissions</div>
                        <div className="text-2xl font-bold text-green-800">
                          {lunchROI.reduce((sum, entry) => sum + entry.admissionsIn30Days, 0)}
                        </div>
                      </div>

                      <div className="p-3 bg-purple-50 rounded">
                        <div className="text-sm text-purple-600">Avg Cost/Admission</div>
                        <div className="text-2xl font-bold text-purple-800">
                          $
                          {(
                            lunchROI.reduce((sum, entry) => sum + entry.lunchCost, 0) /
                            lunchROI.reduce((sum, entry) => sum + entry.admissionsIn30Days, 0)
                          ).toFixed(2)}
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <h4 className="font-medium mb-2">Best Performing Facilities:</h4>
                        <div className="space-y-2">
                          {lunchROI
                            .sort((a, b) => a.costPerAdmission - b.costPerAdmission)
                            .slice(0, 3)
                            .map((entry, index) => (
                              <div key={entry.id} className="flex items-center justify-between text-sm">
                                <span className="flex items-center">
                                  <Trophy className="h-3 w-3 mr-1 text-yellow-500" />
                                  {entry.facility}
                                </span>
                                <span className="font-semibold">${entry.costPerAdmission.toFixed(0)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Marketer Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span>Marketer Leaderboard</span>
                </CardTitle>
                <CardDescription>Track marketing team performance and rankings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {marketers
                    .sort((a, b) => b.conversionRate - a.conversionRate)
                    .map((marketer, index) => (
                      <Card key={marketer.id} className={`${index === 0 ? "border-yellow-300 bg-yellow-50" : ""}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  index === 0
                                    ? "bg-yellow-500"
                                    : index === 1
                                      ? "bg-gray-400"
                                      : index === 2
                                        ? "bg-orange-400"
                                        : "bg-blue-500"
                                }`}
                              >
                                <span className="text-white font-bold">#{index + 1}</span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{marketer.name}</h3>
                                <p className="text-sm text-gray-600">{marketer.territory}</p>
                              </div>
                            </div>
                            {index === 0 && <Trophy className="h-6 w-6 text-yellow-500" />}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Facilities:</span>
                              <p className="font-semibold">{marketer.facilitiesVisited}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Referrals:</span>
                              <p className="font-semibold text-blue-600">{marketer.referrals}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Admissions:</span>
                              <p className="font-semibold text-green-600">{marketer.admissions}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Conversion:</span>
                              <p className="font-semibold">{marketer.conversionRate}%</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Avg Cost/Admit:</span>
                              <p className="font-semibold">${marketer.avgCostPerAdmission}</p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex space-x-2">
                              {marketer.conversionRate >= 70 && (
                                <Badge className="bg-green-100 text-green-800">Top Performer</Badge>
                              )}
                              {marketer.avgCostPerAdmission < 80 && (
                                <Badge className="bg-blue-100 text-blue-800">Cost Efficient</Badge>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              {marketer.conversionRate > 65 ? (
                                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                              ) : (
                                <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                              )}
                              vs last month
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referral Intake Tab */}
          <TabsContent value="referrals" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Referral Intake Form</span>
                  </CardTitle>
                  <CardDescription>Capture new patient referrals from facilities</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="facility-name">Facility Name</Label>
                        <Input id="facility-name" placeholder="Enter facility name" />
                      </div>
                      <div>
                        <Label htmlFor="contact-name">Referral Contact</Label>
                        <Input id="contact-name" placeholder="Contact person name" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="patient-name">Patient Name/Initials</Label>
                        <Input id="patient-name" placeholder="Patient identifier" />
                      </div>
                      <div>
                        <Label htmlFor="service-needed">Service Needed</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="home-health">Home Health</SelectItem>
                            <SelectItem value="behavioral">Behavioral Health</SelectItem>
                            <SelectItem value="detox">Detox Services</SelectItem>
                            <SelectItem value="skilled-nursing">Skilled Nursing</SelectItem>
                            <SelectItem value="therapy">Physical Therapy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="referral-date">Date of Referral</Label>
                        <Input id="referral-date" type="date" />
                      </div>
                      <div>
                        <Label htmlFor="referred-by">Referred By</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select marketer" />
                          </SelectTrigger>
                          <SelectContent>
                            {marketers.map((marketer) => (
                              <SelectItem key={marketer.id} value={marketer.name}>
                                {marketer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" placeholder="Additional information about the referral" rows={3} />
                    </div>

                    <Button type="submit" className="w-full" disabled={!canManageMarketing}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Referral
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <QrCode className="h-5 w-5" />
                    <span>QR Code Generator</span>
                  </CardTitle>
                  <CardDescription>Generate QR codes for facility self-referrals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="qr-facility">Select Facility</Label>
                      <Select value={selectedFacilityForQR} onValueChange={setSelectedFacilityForQR}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose facility for QR code" />
                        </SelectTrigger>
                        <SelectContent>
                          {facilities.map((facility) => (
                            <SelectItem key={facility.id} value={facility.id}>
                              {facility.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedFacilityForQR && (
                      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                        <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-gray-600 mb-4">
                          QR Code for {facilities.find((f) => f.id === selectedFacilityForQR)?.name}
                        </p>
                        <div className="flex space-x-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateQRCode(selectedFacilityForQR)}
                            disabled={!canManageMarketing}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button variant="outline" size="sm" disabled={!canManageMarketing}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    )}

                    <Alert className="border-blue-200 bg-blue-50">
                      <QrCode className="h-4 w-4" />
                      <AlertTitle>QR Code Usage</AlertTitle>
                      <AlertDescription>
                        Print or display QR codes at facilities. When scanned, they'll open a pre-filled referral form
                        with facility and marketer information.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
