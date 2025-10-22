"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  Bell,
  BellRing,
  Building2,
  CheckCircle,
  Clock,
  Database,
  Filter,
  Globe,
  Heart,
  Hospital,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Settings,
  Target,
  Users,
  Zap,
  DollarSign,
  Eye,
  Play,
  Pause,
  Download,
  MessageSquare,
} from "lucide-react"

interface ADTNotification {
  id: string
  patientId: string
  patientName: string
  mrn: string
  eventType: "admission" | "discharge" | "transfer"
  facility: string
  facilityId: string
  department: string
  diagnosis: string[]
  primaryDiagnosis: string
  insurance: string
  insuranceId: string
  age: number
  gender: string
  address: string
  zipCode: string
  admissionDate: string
  dischargeDate?: string
  transferDate?: string
  physicianName: string
  physicianNPI: string
  estimatedLOS: number
  acuityLevel: "low" | "medium" | "high"
  homeHealthEligible: boolean
  riskScore: number
  potentialValue: number
  timestamp: string
  status: "new" | "reviewed" | "contacted" | "converted" | "dismissed"
  assignedTo?: string
  notes?: string
  contactAttempts: number
  lastContactDate?: string
}

interface MiHINConfig {
  enabled: boolean
  apiEndpoint: string
  credentials: {
    clientId: string
    clientSecret: string
    organizationId: string
  }
  filters: {
    eventTypes: string[]
    facilities: string[]
    diagnoses: string[]
    insuranceTypes: string[]
    ageRange: { min: number; max: number }
    zipCodes: string[]
    minimumRiskScore: number
  }
  notifications: {
    realTimeAlerts: boolean
    emailNotifications: boolean
    smsNotifications: boolean
    webhookUrl: string
  }
  automation: {
    autoAssignment: boolean
    autoContactAttempts: boolean
    priorityScoring: boolean
    duplicateDetection: boolean
  }
}

interface MiHINStats {
  totalNotifications: number
  todayNotifications: number
  dischargeNotifications: number
  eligiblePatients: number
  contactedPatients: number
  convertedReferrals: number
  averageResponseTime: number
  conversionRate: number
  potentialRevenue: number
  facilityBreakdown: { facility: string; count: number; converted: number }[]
  diagnosisBreakdown: { diagnosis: string; count: number; eligibility: number }[]
  hourlyActivity: { hour: number; count: number }[]
}

export default function MiHINIntegration() {
  const [notifications, setNotifications] = useState<ADTNotification[]>([])
  const [config, setConfig] = useState<MiHINConfig | null>(null)
  const [stats, setStats] = useState<MiHINStats | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLiveMode, setIsLiveMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [eventFilter, setEventFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [facilityFilter, setFacilityFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState<string | null>(null)

  // Mock data for demonstration
  useEffect(() => {
    const mockNotifications: ADTNotification[] = [
      {
        id: "adt-001",
        patientId: "PT-12345",
        patientName: "Robert Johnson",
        mrn: "MRN-789456",
        eventType: "discharge",
        facility: "Henry Ford Health System",
        facilityId: "HF-001",
        department: "Cardiology",
        diagnosis: ["I50.9 - Heart failure, unspecified", "E11.9 - Type 2 diabetes mellitus"],
        primaryDiagnosis: "I50.9 - Heart failure, unspecified",
        insurance: "Priority Health",
        insuranceId: "PH-456789",
        age: 72,
        gender: "Male",
        address: "1234 Main St, Detroit, MI 48201",
        zipCode: "48201",
        admissionDate: "2024-01-10T08:30:00Z",
        dischargeDate: "2024-01-15T14:20:00Z",
        physicianName: "Dr. Sarah Mitchell",
        physicianNPI: "1234567890",
        estimatedLOS: 5,
        acuityLevel: "high",
        homeHealthEligible: true,
        riskScore: 85,
        potentialValue: 4500,
        timestamp: "2024-01-15T14:25:00Z",
        status: "new",
        contactAttempts: 0,
      },
      {
        id: "adt-002",
        patientId: "PT-12346",
        patientName: "Mary Williams",
        mrn: "MRN-789457",
        eventType: "discharge",
        facility: "Corewell Health (Beaumont)",
        facilityId: "CW-001",
        department: "Orthopedics",
        diagnosis: ["S72.001A - Fracture of unspecified part of neck of right femur"],
        primaryDiagnosis: "S72.001A - Fracture of unspecified part of neck of right femur",
        insurance: "Medicare",
        insuranceId: "MC-123456",
        age: 78,
        gender: "Female",
        address: "5678 Oak Ave, Royal Oak, MI 48067",
        zipCode: "48067",
        admissionDate: "2024-01-12T10:15:00Z",
        dischargeDate: "2024-01-15T16:45:00Z",
        physicianName: "Dr. Michael Chen",
        physicianNPI: "2345678901",
        estimatedLOS: 3,
        acuityLevel: "medium",
        homeHealthEligible: true,
        riskScore: 78,
        potentialValue: 3200,
        timestamp: "2024-01-15T16:50:00Z",
        status: "reviewed",
        contactAttempts: 1,
        lastContactDate: "2024-01-15T17:30:00Z",
        assignedTo: "Jennifer Martinez, RN",
      },
      {
        id: "adt-003",
        patientId: "PT-12347",
        patientName: "James Davis",
        mrn: "MRN-789458",
        eventType: "discharge",
        facility: "University of Michigan Health",
        facilityId: "UM-001",
        department: "Pulmonology",
        diagnosis: ["J44.1 - Chronic obstructive pulmonary disease with acute exacerbation"],
        primaryDiagnosis: "J44.1 - Chronic obstructive pulmonary disease with acute exacerbation",
        insurance: "Blue Cross Blue Shield",
        insuranceId: "BC-789123",
        age: 65,
        gender: "Male",
        address: "9012 Pine St, Ann Arbor, MI 48104",
        zipCode: "48104",
        admissionDate: "2024-01-13T12:00:00Z",
        dischargeDate: "2024-01-15T18:30:00Z",
        physicianName: "Dr. Lisa Rodriguez",
        physicianNPI: "3456789012",
        estimatedLOS: 2,
        acuityLevel: "high",
        homeHealthEligible: true,
        riskScore: 92,
        potentialValue: 5100,
        timestamp: "2024-01-15T18:35:00Z",
        status: "contacted",
        contactAttempts: 2,
        lastContactDate: "2024-01-15T19:15:00Z",
        assignedTo: "Robert Wilson, MSW",
        notes: "Spoke with discharge planner. Referral being processed.",
      },
    ]

    const mockStats: MiHINStats = {
      totalNotifications: 1247,
      todayNotifications: 23,
      dischargeNotifications: 18,
      eligiblePatients: 15,
      contactedPatients: 12,
      convertedReferrals: 8,
      averageResponseTime: 18, // minutes
      conversionRate: 53.3,
      potentialRevenue: 67800,
      facilityBreakdown: [
        { facility: "Henry Ford Health System", count: 8, converted: 5 },
        { facility: "Corewell Health (Beaumont)", count: 6, converted: 3 },
        { facility: "University of Michigan Health", count: 4, converted: 2 },
        { facility: "Ascension Michigan", count: 5, converted: 1 },
      ],
      diagnosisBreakdown: [
        { diagnosis: "Heart Failure", count: 6, eligibility: 95 },
        { diagnosis: "Hip Fracture", count: 4, eligibility: 88 },
        { diagnosis: "COPD", count: 5, eligibility: 92 },
        { diagnosis: "Stroke", count: 3, eligibility: 85 },
      ],
      hourlyActivity: [
        { hour: 8, count: 2 },
        { hour: 9, count: 4 },
        { hour: 10, count: 3 },
        { hour: 11, count: 5 },
        { hour: 12, count: 2 },
        { hour: 13, count: 1 },
        { hour: 14, count: 3 },
        { hour: 15, count: 2 },
        { hour: 16, count: 4 },
        { hour: 17, count: 1 },
      ],
    }

    const mockConfig: MiHINConfig = {
      enabled: true,
      apiEndpoint: "https://api.mihin.org/v2/adt",
      credentials: {
        clientId: "MASE_CLIENT_001",
        clientSecret: "••••••••••••••••",
        organizationId: "ORG_MASE_001",
      },
      filters: {
        eventTypes: ["discharge", "transfer"],
        facilities: ["henry_ford", "beaumont", "umich", "ascension"],
        diagnoses: ["heart_failure", "hip_fracture", "copd", "stroke", "diabetes"],
        insuranceTypes: ["medicare", "medicaid", "priority_health", "bcbs"],
        ageRange: { min: 18, max: 100 },
        zipCodes: ["48201", "48067", "48104", "48309", "48334"],
        minimumRiskScore: 70,
      },
      notifications: {
        realTimeAlerts: true,
        emailNotifications: true,
        smsNotifications: true,
        webhookUrl: "https://api.masepro.com/webhooks/mihin",
      },
      automation: {
        autoAssignment: true,
        autoContactAttempts: true,
        priorityScoring: true,
        duplicateDetection: true,
      },
    }

    setNotifications(mockNotifications)
    setStats(mockStats)
    setConfig(mockConfig)
    setIsConnected(true)
    setLoading(false)
    setLastSync(new Date().toISOString())
  }, [])

  // Live mode simulation
  useEffect(() => {
    if (!isLiveMode) return

    const interval = setInterval(() => {
      // Simulate new ADT notifications
      if (Math.random() > 0.7) {
        const newNotification: ADTNotification = {
          id: `adt-${Date.now()}`,
          patientId: `PT-${Math.floor(Math.random() * 100000)}`,
          patientName: `Patient ${Math.floor(Math.random() * 1000)}`,
          mrn: `MRN-${Math.floor(Math.random() * 1000000)}`,
          eventType: Math.random() > 0.3 ? "discharge" : "transfer",
          facility: ["Henry Ford Health System", "Corewell Health", "University of Michigan"][
            Math.floor(Math.random() * 3)
          ],
          facilityId: `FAC-${Math.floor(Math.random() * 100)}`,
          department: ["Cardiology", "Orthopedics", "Pulmonology", "Neurology"][Math.floor(Math.random() * 4)],
          diagnosis: ["Heart failure", "Hip fracture", "COPD", "Stroke"][Math.floor(Math.random() * 4)],
          primaryDiagnosis: "Primary diagnosis",
          insurance: ["Medicare", "Priority Health", "BCBS"][Math.floor(Math.random() * 3)],
          insuranceId: `INS-${Math.floor(Math.random() * 1000000)}`,
          age: Math.floor(Math.random() * 40) + 50,
          gender: Math.random() > 0.5 ? "Male" : "Female",
          address: "123 Main St, Detroit, MI",
          zipCode: "48201",
          admissionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          dischargeDate: new Date().toISOString(),
          physicianName: "Dr. Smith",
          physicianNPI: "1234567890",
          estimatedLOS: Math.floor(Math.random() * 10) + 1,
          acuityLevel: ["low", "medium", "high"][Math.floor(Math.random() * 3)] as "low" | "medium" | "high",
          homeHealthEligible: Math.random() > 0.2,
          riskScore: Math.floor(Math.random() * 40) + 60,
          potentialValue: Math.floor(Math.random() * 5000) + 2000,
          timestamp: new Date().toISOString(),
          status: "new",
          contactAttempts: 0,
        }

        setNotifications((prev) => [newNotification, ...prev.slice(0, 19)])
        setLastSync(new Date().toISOString())
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isLiveMode])

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.facility.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.primaryDiagnosis.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesEvent = eventFilter === "all" || notification.eventType === eventFilter
    const matchesStatus = statusFilter === "all" || notification.status === statusFilter
    const matchesFacility = facilityFilter === "all" || notification.facility.includes(facilityFilter)

    return matchesSearch && matchesEvent && matchesStatus && matchesFacility
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800"
      case "reviewed":
        return "bg-yellow-100 text-yellow-800"
      case "contacted":
        return "bg-purple-100 text-purple-800"
      case "converted":
        return "bg-green-100 text-green-800"
      case "dismissed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAcuityColor = (acuity: string) => {
    switch (acuity) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleContactPatient = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId
          ? {
              ...n,
              status: "contacted",
              contactAttempts: n.contactAttempts + 1,
              lastContactDate: new Date().toISOString(),
              assignedTo: "Current User",
            }
          : n,
      ),
    )
  }

  const exportData = async () => {
    const csvData = filteredNotifications.map((n) => ({
      "Patient Name": n.patientName,
      MRN: n.mrn,
      Event: n.eventType,
      Facility: n.facility,
      Diagnosis: n.primaryDiagnosis,
      Insurance: n.insurance,
      Age: n.age,
      "Risk Score": n.riskScore,
      "Potential Value": `$${n.potentialValue}`,
      Status: n.status,
      "Contact Attempts": n.contactAttempts,
      Timestamp: new Date(n.timestamp).toLocaleString(),
    }))

    const csv = [Object.keys(csvData[0]).join(","), ...csvData.map((row) => Object.values(row).join(","))].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `mihin-adt-notifications-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading MiHIN Integration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">MiHIN Integration</h1>
                <p className="text-gray-600">Michigan Health Information Network - Real-time ADT Monitoring</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-sm text-gray-600">{isConnected ? "Connected" : "Disconnected"}</span>
              </div>
              <Button
                variant={isLiveMode ? "destructive" : "default"}
                onClick={() => setIsLiveMode(!isLiveMode)}
                className="flex items-center space-x-2"
              >
                {isLiveMode ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span>{isLiveMode ? "Pause Live" : "Go Live"}</span>
              </Button>
              <Button variant="outline" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's ADT</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayNotifications}</div>
                <p className="text-xs text-muted-foreground">{stats.dischargeNotifications} discharges</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eligible Patients</CardTitle>
                <Target className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.eligiblePatients}</div>
                <p className="text-xs text-muted-foreground">Home health eligible</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contacted</CardTitle>
                <Phone className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.contactedPatients}</div>
                <p className="text-xs text-muted-foreground">Avg response: {stats.averageResponseTime}min</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Converted</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.convertedReferrals}</div>
                <p className="text-xs text-muted-foreground">{stats.conversionRate}% conversion rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(stats.potentialRevenue / 1000).toFixed(0)}K</div>
                <p className="text-xs text-muted-foreground">From eligible patients</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="live-feed" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="live-feed">🔴 Live Feed</TabsTrigger>
            <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
            <TabsTrigger value="configuration">⚙️ Configuration</TabsTrigger>
            <TabsTrigger value="automation">🤖 Automation</TabsTrigger>
            <TabsTrigger value="facilities">🏥 Facilities</TabsTrigger>
          </TabsList>

          {/* Live Feed Tab */}
          <TabsContent value="live-feed" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Filter ADT Notifications</span>
                  {isLiveMode && (
                    <Badge variant="destructive" className="animate-pulse">
                      LIVE
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search patients, facilities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={eventFilter} onValueChange={setEventFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Event Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="discharge">Discharges</SelectItem>
                      <SelectItem value="transfer">Transfers</SelectItem>
                      <SelectItem value="admission">Admissions</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={facilityFilter} onValueChange={setFacilityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Facility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Facilities</SelectItem>
                      <SelectItem value="Henry Ford">Henry Ford</SelectItem>
                      <SelectItem value="Beaumont">Beaumont</SelectItem>
                      <SelectItem value="Michigan">U of M</SelectItem>
                      <SelectItem value="Ascension">Ascension</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setEventFilter("all")
                      setStatusFilter("all")
                      setFacilityFilter("all")
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live ADT Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BellRing className="h-5 w-5" />
                  <span>Real-time ADT Notifications</span>
                  <Badge variant="outline">{filteredNotifications.length} notifications</Badge>
                </CardTitle>
                <CardDescription>
                  Monitor hospital discharges statewide • Last update:{" "}
                  {lastSync && new Date(lastSync).toLocaleTimeString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {notification.eventType === "discharge" && <Hospital className="h-4 w-4 text-red-500" />}
                          {notification.eventType === "transfer" && <RefreshCw className="h-4 w-4 text-blue-500" />}
                          {notification.eventType === "admission" && <Users className="h-4 w-4 text-green-500" />}
                          <Badge className={getStatusColor(notification.status)}>
                            {notification.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{notification.patientName}</span>
                            <Badge variant="outline" className="text-xs">
                              {notification.age}y {notification.gender}
                            </Badge>
                            <Badge className={getAcuityColor(notification.acuityLevel)}>
                              {notification.acuityLevel.toUpperCase()}
                            </Badge>
                            {notification.homeHealthEligible && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                HH ELIGIBLE
                              </Badge>
                            )}
                            {notification.potentialValue >= 4000 && (
                              <Badge variant="outline" className="text-purple-600 border-purple-600">
                                HIGH VALUE
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.primaryDiagnosis}</p>
                          <p className="text-xs text-muted-foreground">
                            {notification.facility} • {notification.insurance} • Risk: {notification.riskScore}%
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="text-green-600">
                            ${notification.potentialValue.toLocaleString()}
                          </Badge>
                          {notification.assignedTo && (
                            <Badge variant="outline" className="text-xs">
                              {notification.assignedTo}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button size="sm" onClick={() => handleContactPatient(notification.id)}>
                            <Phone className="h-3 w-3 mr-1" />
                            Contact
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                        {notification.contactAttempts > 0 && (
                          <p className="text-xs text-purple-600">{notification.contactAttempts} contact attempts</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredNotifications.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No ADT notifications match the current filters.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Facility Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5" />
                      <span>Top Referring Facilities</span>
                    </CardTitle>
                    <CardDescription>ADT notifications and conversion rates by facility</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.facilityBreakdown.map((facility, index) => (
                        <div key={facility.facility} className="flex items-center justify-between">
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
                              <div className="font-medium">{facility.facility}</div>
                              <div className="text-sm text-gray-500">{facility.count} notifications</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">{facility.converted} converted</div>
                            <div className="text-xs text-gray-500">
                              {Math.round((facility.converted / facility.count) * 100)}% rate
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Diagnosis Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Heart className="h-5 w-5" />
                      <span>Top Diagnoses</span>
                    </CardTitle>
                    <CardDescription>Most common diagnoses and eligibility rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.diagnosisBreakdown.map((diagnosis) => (
                        <div key={diagnosis.diagnosis} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{diagnosis.diagnosis}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">{diagnosis.count} patients</span>
                              <span className="text-sm font-medium text-green-600">{diagnosis.eligibility}%</span>
                            </div>
                          </div>
                          <Progress value={diagnosis.eligibility} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Hourly Activity */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Discharge Activity by Hour</span>
                    </CardTitle>
                    <CardDescription>Peak discharge times for optimal response planning</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-12 gap-2">
                      {stats.hourlyActivity.map((hour) => (
                        <div key={hour.hour} className="text-center">
                          <div
                            className="bg-blue-500 rounded-t"
                            style={{ height: `${(hour.count / 5) * 60}px`, minHeight: "4px" }}
                          />
                          <div className="text-xs text-gray-500 mt-1">{hour.hour}:00</div>
                          <div className="text-xs font-medium">{hour.count}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="configuration" className="space-y-6">
            {config && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Connection Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="h-5 w-5" />
                      <span>MiHIN Connection</span>
                    </CardTitle>
                    <CardDescription>Configure your MiHIN API connection</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="api-endpoint">API Endpoint</Label>
                      <Input id="api-endpoint" value={config.apiEndpoint} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client-id">Client ID</Label>
                      <Input id="client-id" value={config.credentials.clientId} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-id">Organization ID</Label>
                      <Input id="org-id" value={config.credentials.organizationId} readOnly />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={config.enabled} />
                      <Label>Enable MiHIN Integration</Label>
                    </div>
                    <Button className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Update Connection
                    </Button>
                  </CardContent>
                </Card>

                {/* Filter Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Filter className="h-5 w-5" />
                      <span>ADT Filters</span>
                    </CardTitle>
                    <CardDescription>Configure which notifications to receive</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Event Types</Label>
                      <div className="flex flex-wrap gap-2">
                        {["discharge", "transfer", "admission"].map((event) => (
                          <Badge
                            key={event}
                            variant={config.filters.eventTypes.includes(event) ? "default" : "outline"}
                            className="cursor-pointer"
                          >
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Age Range</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={config.filters.ageRange.min}
                          className="w-20"
                          readOnly
                        />
                        <span>to</span>
                        <Input
                          type="number"
                          placeholder="Max"
                          value={config.filters.ageRange.max}
                          className="w-20"
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Risk Score</Label>
                      <Input type="number" value={config.filters.minimumRiskScore} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>Target ZIP Codes</Label>
                      <Input value={config.filters.zipCodes.join(", ")} readOnly />
                    </div>
                    <Button className="w-full bg-transparent" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Update Filters
                    </Button>
                  </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="h-5 w-5" />
                      <span>Notification Settings</span>
                    </CardTitle>
                    <CardDescription>Configure how you receive alerts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Real-time Alerts</Label>
                      <Switch checked={config.notifications.realTimeAlerts} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Email Notifications</Label>
                      <Switch checked={config.notifications.emailNotifications} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>SMS Notifications</Label>
                      <Switch checked={config.notifications.smsNotifications} />
                    </div>
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <Input value={config.notifications.webhookUrl} readOnly />
                    </div>
                    <Button className="w-full bg-transparent" variant="outline">
                      <Bell className="h-4 w-4 mr-2" />
                      Update Notifications
                    </Button>
                  </CardContent>
                </Card>

                {/* Automation Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Automation Settings</span>
                    </CardTitle>
                    <CardDescription>Configure automated processing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Auto-Assignment</Label>
                      <Switch checked={config.automation.autoAssignment} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Auto Contact Attempts</Label>
                      <Switch checked={config.automation.autoContactAttempts} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Priority Scoring</Label>
                      <Switch checked={config.automation.priorityScoring} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Duplicate Detection</Label>
                      <Switch checked={config.automation.duplicateDetection} />
                    </div>
                    <Button className="w-full bg-transparent" variant="outline">
                      <Zap className="h-4 w-4 mr-2" />
                      Update Automation
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Auto-Response Rules */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Auto-Response Rules</span>
                  </CardTitle>
                  <CardDescription>Automated actions for ADT notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">High-Risk Discharge Alert</div>
                        <div className="text-sm text-gray-500">Risk score ≥ 85%</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">ACTIVE</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Auto-Assign by ZIP</div>
                        <div className="text-sm text-gray-500">Route by service area</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">ACTIVE</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Immediate Contact</div>
                        <div className="text-sm text-gray-500">High-value patients</div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">PENDING</Badge>
                    </div>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure Rules
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Workflows */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>Contact Workflows</span>
                  </CardTitle>
                  <CardDescription>Automated outreach sequences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-2">Discharge Follow-up</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>1. Immediate facility contact</div>
                        <div>2. Patient/family outreach</div>
                        <div>3. Physician notification</div>
                        <div>4. Insurance verification</div>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-2">High-Risk Protocol</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>1. Priority assignment</div>
                        <div>2. Manager notification</div>
                        <div>3. Same-day contact</div>
                        <div>4. Expedited processing</div>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Edit Workflows
                  </Button>
                </CardContent>
              </Card>

              {/* Performance Monitoring */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Automation Performance</span>
                  </CardTitle>
                  <CardDescription>Real-time automation metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">94%</div>
                      <div className="text-sm text-blue-800">Auto-Assignment Rate</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">12min</div>
                      <div className="text-sm text-green-800">Avg Response Time</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">87%</div>
                      <div className="text-sm text-purple-800">Contact Success Rate</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">23</div>
                      <div className="text-sm text-orange-800">Rules Triggered Today</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Facilities Tab */}
          <TabsContent value="facilities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Connected Facilities</span>
                </CardTitle>
                <CardDescription>Hospitals and health systems sending ADT notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Henry Ford Health System",
                      location: "Detroit, MI",
                      status: "active",
                      notifications: 156,
                      lastUpdate: "2 min ago",
                    },
                    {
                      name: "Corewell Health (Beaumont)",
                      location: "Royal Oak, MI",
                      status: "active",
                      notifications: 134,
                      lastUpdate: "5 min ago",
                    },
                    {
                      name: "University of Michigan Health",
                      location: "Ann Arbor, MI",
                      status: "active",
                      notifications: 98,
                      lastUpdate: "1 min ago",
                    },
                    {
                      name: "Ascension Michigan",
                      location: "Warren, MI",
                      status: "active",
                      notifications: 87,
                      lastUpdate: "3 min ago",
                    },
                    {
                      name: "McLaren Health Care",
                      location: "Flint, MI",
                      status: "pending",
                      notifications: 45,
                      lastUpdate: "15 min ago",
                    },
                    {
                      name: "Sparrow Health System",
                      location: "Lansing, MI",
                      status: "active",
                      notifications: 67,
                      lastUpdate: "7 min ago",
                    },
                  ].map((facility) => (
                    <Card key={facility.name} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{facility.name}</CardTitle>
                          <Badge
                            className={
                              facility.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {facility.status.toUpperCase()}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{facility.location}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Notifications Today</span>
                            <span className="font-semibold">{facility.notifications}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Last Update</span>
                            <span className="text-sm text-gray-500">{facility.lastUpdate}</span>
                          </div>
                          <Button size="sm" className="w-full mt-3 bg-transparent" variant="outline">
                            <Eye className="h-3 w-3 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
