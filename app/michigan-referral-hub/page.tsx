"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Building2,
  Activity,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  VoicemailIcon as Fax,
  Database,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Zap,
  Globe,
  Shield,
  BarChart3,
  RefreshCw,
  Download,
  Settings,
  Eye,
  Edit,
  Search,
  Bell,
  Target,
  Star,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

interface MichiganHealthSystem {
  id: string
  name: string
  location: string
  type: "hospital" | "health_system" | "clinic" | "snf"
  beds: number
  referralsThisMonth: number
  referralsLastMonth: number
  acceptanceRate: number
  avgResponseTime: number
  integrationStatus: "active" | "pending" | "inactive"
  channels: string[]
  contactPerson: string
  phone: string
  email: string
  lastContact: string
  priority: "high" | "medium" | "low"
  estimatedMonthlyValue: number
}

interface ReferralMetrics {
  totalReferrals: number
  acceptedReferrals: number
  pendingReferrals: number
  rejectedReferrals: number
  totalValue: number
  avgProcessingTime: number
  topSources: { name: string; count: number; value: number }[]
  channelBreakdown: { channel: string; count: number; percentage: number }[]
  geographicDistribution: { region: string; count: number; systems: number }[]
}

const michiganHealthSystems: MichiganHealthSystem[] = [
  {
    id: "beaumont",
    name: "Corewell Health (Beaumont)",
    location: "Royal Oak, MI",
    type: "health_system",
    beds: 1200,
    referralsThisMonth: 45,
    referralsLastMonth: 38,
    acceptanceRate: 78,
    avgResponseTime: 2.3,
    integrationStatus: "active",
    channels: ["epic_integration", "email", "fax", "phone"],
    contactPerson: "Sarah Mitchell, RN",
    phone: "(248) 898-5000",
    email: "referrals@corewell.org",
    lastContact: "2024-01-15",
    priority: "high",
    estimatedMonthlyValue: 125000,
  },
  {
    id: "henry_ford",
    name: "Henry Ford Health System",
    location: "Detroit, MI",
    type: "health_system",
    beds: 2800,
    referralsThisMonth: 67,
    referralsLastMonth: 52,
    acceptanceRate: 82,
    avgResponseTime: 1.8,
    integrationStatus: "active",
    channels: ["epic_integration", "email", "secure_messaging", "phone"],
    contactPerson: "Dr. Michael Johnson",
    phone: "(313) 916-2600",
    email: "discharge.planning@henryford.com",
    lastContact: "2024-01-14",
    priority: "high",
    estimatedMonthlyValue: 185000,
  },
  {
    id: "umich",
    name: "University of Michigan Health",
    location: "Ann Arbor, MI",
    type: "health_system",
    beds: 1000,
    referralsThisMonth: 32,
    referralsLastMonth: 28,
    acceptanceRate: 85,
    avgResponseTime: 2.1,
    integrationStatus: "active",
    channels: ["epic_integration", "email", "fax"],
    contactPerson: "Lisa Chen, MSW",
    phone: "(734) 936-4000",
    email: "homecare.referrals@med.umich.edu",
    lastContact: "2024-01-13",
    priority: "high",
    estimatedMonthlyValue: 95000,
  },
  {
    id: "mclaren",
    name: "McLaren Health Care",
    location: "Flint, MI",
    type: "health_system",
    beds: 800,
    referralsThisMonth: 28,
    referralsLastMonth: 22,
    acceptanceRate: 75,
    avgResponseTime: 2.8,
    integrationStatus: "pending",
    channels: ["email", "fax", "phone"],
    contactPerson: "Jennifer Adams, RN",
    phone: "(810) 342-2000",
    email: "case.management@mclaren.org",
    lastContact: "2024-01-12",
    priority: "medium",
    estimatedMonthlyValue: 78000,
  },
  {
    id: "spectrum",
    name: "Corewell Health (Spectrum)",
    location: "Grand Rapids, MI",
    type: "health_system",
    beds: 900,
    referralsThisMonth: 38,
    referralsLastMonth: 31,
    acceptanceRate: 80,
    avgResponseTime: 2.2,
    integrationStatus: "active",
    channels: ["epic_integration", "email", "phone"],
    contactPerson: "Robert Wilson, MSW",
    phone: "(616) 391-1774",
    email: "referrals@spectrumhealth.org",
    lastContact: "2024-01-15",
    priority: "high",
    estimatedMonthlyValue: 105000,
  },
  {
    id: "ascension",
    name: "Ascension Michigan",
    location: "Warren, MI",
    type: "health_system",
    beds: 1500,
    referralsThisMonth: 41,
    referralsLastMonth: 35,
    acceptanceRate: 77,
    avgResponseTime: 2.5,
    integrationStatus: "active",
    channels: ["email", "fax", "phone", "secure_messaging"],
    contactPerson: "Maria Rodriguez, RN",
    phone: "(586) 573-5000",
    email: "homehealth@ascension.org",
    lastContact: "2024-01-14",
    priority: "high",
    estimatedMonthlyValue: 115000,
  },
  {
    id: "trinity",
    name: "Trinity Health Michigan",
    location: "Livonia, MI",
    type: "health_system",
    beds: 700,
    referralsThisMonth: 25,
    referralsLastMonth: 20,
    acceptanceRate: 73,
    avgResponseTime: 3.1,
    integrationStatus: "pending",
    channels: ["email", "fax", "phone"],
    contactPerson: "David Thompson, MSW",
    phone: "(734) 343-1000",
    email: "referrals@trinity-health.org",
    lastContact: "2024-01-11",
    priority: "medium",
    estimatedMonthlyValue: 68000,
  },
  {
    id: "munson",
    name: "Munson Healthcare",
    location: "Traverse City, MI",
    type: "health_system",
    beds: 400,
    referralsThisMonth: 18,
    referralsLastMonth: 15,
    acceptanceRate: 88,
    avgResponseTime: 1.9,
    integrationStatus: "active",
    channels: ["email", "phone", "fax"],
    contactPerson: "Amanda Foster, RN",
    phone: "(231) 935-5000",
    email: "discharge@munsonhealthcare.org",
    lastContact: "2024-01-13",
    priority: "medium",
    estimatedMonthlyValue: 52000,
  },
]

export default function MichiganReferralHub() {
  const [healthSystems, setHealthSystems] = useState<MichiganHealthSystem[]>(michiganHealthSystems)
  const [metrics, setMetrics] = useState<ReferralMetrics | null>(null)
  const [selectedSystem, setSelectedSystem] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString())

  // Calculate metrics
  useEffect(() => {
    const totalReferrals = healthSystems.reduce((sum, system) => sum + system.referralsThisMonth, 0)
    const totalValue = healthSystems.reduce((sum, system) => sum + system.estimatedMonthlyValue, 0)
    const avgProcessingTime =
      healthSystems.reduce((sum, system) => sum + system.avgResponseTime, 0) / healthSystems.length

    const channelBreakdown = [
      {
        channel: "Epic Integration",
        count: healthSystems.filter((s) => s.channels.includes("epic_integration")).length,
        percentage: 0,
      },
      { channel: "Email", count: healthSystems.filter((s) => s.channels.includes("email")).length, percentage: 0 },
      { channel: "Fax", count: healthSystems.filter((s) => s.channels.includes("fax")).length, percentage: 0 },
      { channel: "Phone", count: healthSystems.filter((s) => s.channels.includes("phone")).length, percentage: 0 },
      {
        channel: "Secure Messaging",
        count: healthSystems.filter((s) => s.channels.includes("secure_messaging")).length,
        percentage: 0,
      },
    ].map((item) => ({
      ...item,
      percentage: Math.round((item.count / healthSystems.length) * 100),
    }))

    const geographicDistribution = [
      { region: "Southeast Michigan", count: 156, systems: 3 },
      { region: "West Michigan", count: 89, systems: 2 },
      { region: "Central Michigan", count: 67, systems: 2 },
      { region: "Northern Michigan", count: 34, systems: 1 },
    ]

    setMetrics({
      totalReferrals,
      acceptedReferrals: Math.round(totalReferrals * 0.79),
      pendingReferrals: Math.round(totalReferrals * 0.12),
      rejectedReferrals: Math.round(totalReferrals * 0.09),
      totalValue,
      avgProcessingTime,
      topSources: healthSystems
        .sort((a, b) => b.referralsThisMonth - a.referralsThisMonth)
        .slice(0, 5)
        .map((system) => ({
          name: system.name,
          count: system.referralsThisMonth,
          value: system.estimatedMonthlyValue,
        })),
      channelBreakdown,
      geographicDistribution,
    })
  }, [healthSystems])

  // Live mode updates
  useEffect(() => {
    if (!isLiveMode) return

    const interval = setInterval(() => {
      setHealthSystems((prev) =>
        prev.map((system) => ({
          ...system,
          referralsThisMonth: system.referralsThisMonth + (Math.random() > 0.8 ? 1 : 0),
        })),
      )
      setLastUpdate(new Date().toISOString())
    }, 5000)

    return () => clearInterval(interval)
  }, [isLiveMode])

  // Filter health systems
  const filteredSystems = healthSystems.filter((system) => {
    const matchesSearch =
      system.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      system.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      system.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || system.type === filterType
    const matchesStatus = filterStatus === "all" || system.integrationStatus === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const exportData = async () => {
    const csvData = healthSystems.map((system) => ({
      Name: system.name,
      Location: system.location,
      Type: system.type,
      Beds: system.beds,
      "Referrals This Month": system.referralsThisMonth,
      "Acceptance Rate": `${system.acceptanceRate}%`,
      "Response Time": `${system.avgResponseTime}h`,
      Status: system.integrationStatus,
      "Monthly Value": `$${system.estimatedMonthlyValue.toLocaleString()}`,
      Contact: system.contactPerson,
      Phone: system.phone,
      Email: system.email,
    }))

    const csv = [Object.keys(csvData[0]).join(","), ...csvData.map((row) => Object.values(row).join(","))].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `michigan-health-systems-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Michigan Referral Hub</h1>
                <p className="text-gray-600">Multi-Pronged Automated Referral Capture System</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {healthSystems.length} Health Systems
              </Badge>
              <Button
                variant={isLiveMode ? "destructive" : "default"}
                onClick={() => setIsLiveMode(!isLiveMode)}
                className="flex items-center space-x-2"
              >
                {isLiveMode ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                <span>{isLiveMode ? "Live Mode" : "Go Live"}</span>
              </Button>
              <Button variant="outline" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalReferrals}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.acceptedReferrals}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((metrics.acceptedReferrals / metrics.totalReferrals) * 100)}% acceptance rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{metrics.pendingReferrals}</div>
                <p className="text-xs text-muted-foreground">Awaiting decision</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avgProcessingTime.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground">Processing time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(metrics.totalValue / 1000).toFixed(0)}K</div>
                <p className="text-xs text-muted-foreground">Estimated revenue</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="systems" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="systems">🏥 Health Systems</TabsTrigger>
            <TabsTrigger value="channels">📡 Integration Channels</TabsTrigger>
            <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
            <TabsTrigger value="automation">⚡ Automation</TabsTrigger>
            <TabsTrigger value="geographic">🗺️ Geographic View</TabsTrigger>
          </TabsList>

          {/* Health Systems Tab */}
          <TabsContent value="systems" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Search & Filter Health Systems</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search systems, locations, contacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="health_system">Health Systems</SelectItem>
                      <SelectItem value="hospital">Hospitals</SelectItem>
                      <SelectItem value="clinic">Clinics</SelectItem>
                      <SelectItem value="snf">SNF/Rehab</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setFilterType("all")
                      setFilterStatus("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Health Systems Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSystems.map((system) => (
                <Card key={system.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{system.name}</CardTitle>
                          <CardDescription className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3" />
                            <span>{system.location}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge className={getStatusColor(system.integrationStatus)}>
                          {system.integrationStatus.toUpperCase()}
                        </Badge>
                        <Badge className={getPriorityColor(system.priority)}>{system.priority.toUpperCase()}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{system.referralsThisMonth}</div>
                        <div className="text-xs text-gray-500">Referrals</div>
                        <div className="flex items-center justify-center text-xs">
                          {system.referralsThisMonth > system.referralsLastMonth ? (
                            <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                          )}
                          <span
                            className={
                              system.referralsThisMonth > system.referralsLastMonth ? "text-green-500" : "text-red-500"
                            }
                          >
                            {Math.abs(system.referralsThisMonth - system.referralsLastMonth)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{system.acceptanceRate}%</div>
                        <div className="text-xs text-gray-500">Acceptance</div>
                        <Progress value={system.acceptanceRate} className="h-1 mt-1" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{system.avgResponseTime}h</div>
                        <div className="text-xs text-gray-500">Response</div>
                        <div className="text-xs text-gray-400">avg time</div>
                      </div>
                    </div>

                    {/* Integration Channels */}
                    <div>
                      <Label className="text-sm font-medium">Integration Channels</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {system.channels.map((channel) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel === "epic_integration" && <Database className="h-3 w-3 mr-1" />}
                            {channel === "email" && <Mail className="h-3 w-3 mr-1" />}
                            {channel === "fax" && <Fax className="h-3 w-3 mr-1" />}
                            {channel === "phone" && <Phone className="h-3 w-3 mr-1" />}
                            {channel === "secure_messaging" && <Shield className="h-3 w-3 mr-1" />}
                            {channel.replace("_", " ").toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{system.contactPerson}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{system.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{system.email}</span>
                      </div>
                    </div>

                    {/* Financial Impact */}
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">Monthly Value</span>
                        <span className="text-lg font-bold text-green-600">
                          ${system.estimatedMonthlyValue.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Based on {system.referralsThisMonth} referrals @ {system.acceptanceRate}% acceptance
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Integration Channels Tab */}
          <TabsContent value="channels" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Epic Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <span>Epic Integration</span>
                  </CardTitle>
                  <CardDescription>Direct EHR integration for seamless referrals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Connected Systems</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {healthSystems.filter((s) => s.channels.includes("epic_integration")).length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Monthly Referrals</span>
                    <span className="font-semibold">
                      {healthSystems
                        .filter((s) => s.channels.includes("epic_integration"))
                        .reduce((sum, s) => sum + s.referralsThisMonth, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Avg Response Time</span>
                    <span className="font-semibold text-green-600">1.8h</span>
                  </div>
                  <Button className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Epic
                  </Button>
                </CardContent>
              </Card>

              {/* Email Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-green-600" />
                    <span>Email Integration</span>
                  </CardTitle>
                  <CardDescription>Automated email processing with AI extraction</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Connected Systems</span>
                    <Badge className="bg-green-100 text-green-800">
                      {healthSystems.filter((s) => s.channels.includes("email")).length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Processing Accuracy</span>
                    <span className="font-semibold text-green-600">94%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Avg Processing</span>
                    <span className="font-semibold">2.3 min</span>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Email Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Fax Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Fax className="h-5 w-5 text-purple-600" />
                    <span>Fax Integration</span>
                  </CardTitle>
                  <CardDescription>Digital fax processing with OCR technology</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Connected Systems</span>
                    <Badge className="bg-purple-100 text-purple-800">
                      {healthSystems.filter((s) => s.channels.includes("fax")).length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>OCR Accuracy</span>
                    <span className="font-semibold text-purple-600">91%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Daily Volume</span>
                    <span className="font-semibold">45 faxes</span>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Fax Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Phone Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="h-5 w-5 text-orange-600" />
                    <span>Phone Integration</span>
                  </CardTitle>
                  <CardDescription>Voice-to-text referral capture system</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Connected Lines</span>
                    <Badge className="bg-orange-100 text-orange-800">3</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Transcription Accuracy</span>
                    <span className="font-semibold text-orange-600">89%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Daily Calls</span>
                    <span className="font-semibold">28 calls</span>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Phone Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Secure Messaging */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-indigo-600" />
                    <span>Secure Messaging</span>
                  </CardTitle>
                  <CardDescription>HIPAA-compliant messaging platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Connected Systems</span>
                    <Badge className="bg-indigo-100 text-indigo-800">
                      {healthSystems.filter((s) => s.channels.includes("secure_messaging")).length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Encryption Level</span>
                    <span className="font-semibold text-indigo-600">AES-256</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Response Time</span>
                    <span className="font-semibold">1.2h</span>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Messaging Settings
                  </Button>
                </CardContent>
              </Card>

              {/* API Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-teal-600" />
                    <span>API Integration</span>
                  </CardTitle>
                  <CardDescription>RESTful API for custom integrations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>API Endpoints</span>
                    <Badge className="bg-teal-100 text-teal-800">12</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Uptime</span>
                    <span className="font-semibold text-teal-600">99.9%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rate Limit</span>
                    <span className="font-semibold">1000/hr</span>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    API Documentation
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {metrics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performing Systems */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="h-5 w-5" />
                      <span>Top Performing Systems</span>
                    </CardTitle>
                    <CardDescription>Highest referral volume this month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.topSources.map((source, index) => (
                        <div key={source.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                index === 0
                                  ? "bg-yellow-100 text-yellow-800"
                                  : index === 1
                                    ? "bg-gray-100 text-gray-800"
                                    : index === 2
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{source.name}</div>
                              <div className="text-sm text-gray-500">{source.count} referrals</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">${(source.value / 1000).toFixed(0)}K</div>
                            <div className="text-xs text-gray-500">monthly value</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Channel Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Channel Performance</span>
                    </CardTitle>
                    <CardDescription>Integration channel adoption rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.channelBreakdown.map((channel) => (
                        <div key={channel.channel} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{channel.channel}</span>
                            <span className="text-sm text-gray-500">{channel.percentage}%</span>
                          </div>
                          <Progress value={channel.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Geographic Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Geographic Distribution</span>
                    </CardTitle>
                    <CardDescription>Referrals by Michigan region</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.geographicDistribution.map((region) => (
                        <div
                          key={region.region}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{region.region}</div>
                            <div className="text-sm text-gray-500">{region.systems} health systems</div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">{region.count}</div>
                            <div className="text-xs text-gray-500">referrals</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Performance Trends</span>
                    </CardTitle>
                    <CardDescription>Key metrics over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">+18%</div>
                          <div className="text-sm text-green-800">Referral Growth</div>
                          <div className="text-xs text-gray-500">vs last month</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">-0.3h</div>
                          <div className="text-sm text-blue-800">Response Time</div>
                          <div className="text-xs text-gray-500">improvement</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">+5%</div>
                          <div className="text-sm text-purple-800">Acceptance Rate</div>
                          <div className="text-xs text-gray-500">vs last month</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">+$125K</div>
                          <div className="text-sm text-orange-800">Monthly Value</div>
                          <div className="text-xs text-gray-500">increase</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Processing Rules */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>AI Processing Rules</span>
                  </CardTitle>
                  <CardDescription>Automated decision-making configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Auto-Accept High Confidence</div>
                        <div className="text-sm text-gray-500">Confidence ≥ 85%</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">ACTIVE</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Route for Review</div>
                        <div className="text-sm text-gray-500">Confidence 60-84%</div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">ACTIVE</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Auto-Reject Low Confidence</div>
                        <div className="text-sm text-gray-500">Confidence &lt; 60%</div>
                      </div>
                      <Badge className="bg-red-100 text-red-800">ACTIVE</Badge>
                    </div>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Rules
                  </Button>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Smart Notifications</span>
                  </CardTitle>
                  <CardDescription>Automated alert configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">STAT Referral Alert</div>
                        <div className="text-sm text-gray-500">Immediate notification</div>
                      </div>
                      <Badge className="bg-red-100 text-red-800">ENABLED</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">High-Value Referral</div>
                        <div className="text-sm text-gray-500">Value &gt; $5,000</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">ENABLED</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">System Integration Down</div>
                        <div className="text-sm text-gray-500">Connection failures</div>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">ENABLED</Badge>
                    </div>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Notification Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Workflow Automation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Workflow Automation</span>
                  </CardTitle>
                  <CardDescription>Automated process flows</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-2">New Referral Workflow</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>1. Receive & Parse Referral</div>
                        <div>2. AI Confidence Scoring</div>
                        <div>3. Auto-Route Decision</div>
                        <div>4. Notify Stakeholders</div>
                        <div>5. Update EHR Systems</div>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-2">Follow-up Workflow</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>1. Schedule Follow-up</div>
                        <div>2. Send Confirmation</div>
                        <div>3. Update Status</div>
                        <div>4. Generate Reports</div>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Workflows
                  </Button>
                </CardContent>
              </Card>

              {/* Performance Monitoring */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Performance Monitoring</span>
                  </CardTitle>
                  <CardDescription>Real-time system health</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>System Uptime</span>
                      <Badge className="bg-green-100 text-green-800">99.9%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Processing Speed</span>
                      <Badge className="bg-blue-100 text-blue-800">1.2s avg</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Error Rate</span>
                      <Badge className="bg-green-100 text-green-800">0.1%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Queue Length</span>
                      <Badge className="bg-yellow-100 text-yellow-800">3 pending</Badge>
                    </div>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Detailed Metrics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Geographic View Tab */}
          <TabsContent value="geographic" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map Placeholder */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Michigan Health Systems Map</span>
                  </CardTitle>
                  <CardDescription>Geographic distribution of integrated health systems</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Interactive Michigan Map</p>
                      <p className="text-sm text-gray-400">Showing health system locations and referral volumes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Regional Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Regional Performance</CardTitle>
                  <CardDescription>Referral metrics by region</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics?.geographicDistribution.map((region) => (
                      <div key={region.region} className="p-3 border rounded-lg">
                        <div className="font-medium mb-2">{region.region}</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-gray-500">Systems</div>
                            <div className="font-semibold">{region.systems}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Referrals</div>
                            <div className="font-semibold text-blue-600">{region.count}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coverage Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Coverage Analysis</span>
                </CardTitle>
                <CardDescription>Market penetration and expansion opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">78%</div>
                    <div className="text-sm text-green-800">Market Coverage</div>
                    <div className="text-xs text-gray-500">of major health systems</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-blue-800">Expansion Targets</div>
                    <div className="text-xs text-gray-500">identified opportunities</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">$2.1M</div>
                    <div className="text-sm text-purple-800">Potential Value</div>
                    <div className="text-xs text-gray-500">from expansion</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
