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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Activity,
  Bell,
  BrainCircuit,
  Calendar,
  Clock,
  Eye,
  Filter,
  Heart,
  Hospital,
  MapPin,
  Phone,
  Route,
  Target,
  TrendingUp,
  Users,
  Zap,
  DollarSign,
  Building2,
  UserCheck,
  Timer,
  CheckCircle,
  Stethoscope,
  Car,
  MessageSquare,
} from "lucide-react"

interface PredictivePatient {
  id: string
  patientName: string
  mrn: string
  dob: string
  age: number
  gender: string
  address: string
  zipCode: string
  phone: string
  admissionDate: string
  predictedDischarge: string
  actualDischarge?: string
  facility: string
  facilityId: string
  unit: string
  admittingPhysician: string
  physicianNPI: string
  primaryDiagnosis: string
  icd10Codes: string[]
  comorbidities: string[]
  insurance: string
  insuranceId: string
  homeHealthEligible: boolean
  predictedLOS: number
  actualLOS?: number
  riskScore: number
  potentialValue: number
  acuityLevel: "low" | "medium" | "high"
  dischargeDestination: "home" | "snf" | "ltac" | "rehab" | "other"
  assignedMarketer?: string
  assignedNurse?: string
  caseManager?: string
  caseManagerPhone?: string
  contactAttempts: number
  lastContactDate?: string
  status: "admitted" | "contacted" | "secured" | "discharged" | "lost"
  notes?: string
  predictiveFlags: string[]
  marketingPriority: 1 | 2 | 3 | 4 | 5
  estimatedDischargeTime: string
}

interface MarketingRoute {
  id: string
  marketerId: string
  marketerName: string
  date: string
  patients: PredictivePatient[]
  facilities: string[]
  estimatedDriveTime: number
  totalMiles: number
  priority: "high" | "medium" | "low"
  status: "planned" | "active" | "completed"
  completedContacts: number
  successfulContacts: number
  securedReferrals: number
}

interface PredictiveAnalytics {
  totalAdmissions: number
  eligiblePatients: number
  predictedDischarges: number
  contactedPatients: number
  securedReferrals: number
  averageLOS: number
  conversionRate: number
  potentialRevenue: number
  topDiagnoses: { diagnosis: string; count: number; avgLOS: number; eligibility: number }[]
  facilityPerformance: { facility: string; admissions: number; conversions: number; avgLOS: number }[]
  zipCodeHotspots: { zipCode: string; patients: number; value: number; coverage: boolean }[]
  dischargeTimeline: { date: string; predicted: number; actual: number }[]
}

export default function PredictiveMarketingPage() {
  const [patients, setPatients] = useState<PredictivePatient[]>([])
  const [routes, setRoutes] = useState<MarketingRoute[]>([])
  const [analytics, setAnalytics] = useState<PredictiveAnalytics | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [filterFacility, setFilterFacility] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [autoRouting, setAutoRouting] = useState(true)
  const [loading, setLoading] = useState(true)

  // Mock data initialization
  useEffect(() => {
    const mockPatients: PredictivePatient[] = [
      {
        id: "pred-001",
        patientName: "Robert Johnson",
        mrn: "MRN-789456",
        dob: "1952-03-15",
        age: 72,
        gender: "Male",
        address: "1234 Main St, Detroit, MI 48201",
        zipCode: "48201",
        phone: "(313) 555-0123",
        admissionDate: "2024-01-13T08:30:00Z",
        predictedDischarge: "2024-01-18T14:00:00Z",
        facility: "Henry Ford Health System",
        facilityId: "HF-001",
        unit: "Cardiology ICU",
        admittingPhysician: "Dr. Sarah Mitchell",
        physicianNPI: "1234567890",
        primaryDiagnosis: "Acute heart failure with reduced ejection fraction",
        icd10Codes: ["I50.21", "I25.10", "E11.9"],
        comorbidities: ["Type 2 diabetes", "Coronary artery disease", "Hypertension"],
        insurance: "Priority Health",
        insuranceId: "PH-456789",
        homeHealthEligible: true,
        predictedLOS: 5,
        riskScore: 92,
        potentialValue: 5200,
        acuityLevel: "high",
        dischargeDestination: "home",
        assignedMarketer: "Sarah Johnson",
        assignedNurse: "Jennifer Martinez, RN",
        caseManager: "Lisa Thompson, MSW",
        caseManagerPhone: "(313) 555-0456",
        contactAttempts: 2,
        lastContactDate: "2024-01-14T10:30:00Z",
        status: "contacted",
        notes: "Spoke with case manager. Patient interested in home health. Family meeting scheduled for tomorrow.",
        predictiveFlags: ["High-value", "CHF Protocol", "Readmission Risk"],
        marketingPriority: 1,
        estimatedDischargeTime: "2:00 PM",
      },
      {
        id: "pred-002",
        patientName: "Mary Williams",
        mrn: "MRN-789457",
        dob: "1946-07-22",
        age: 78,
        gender: "Female",
        address: "5678 Oak Ave, Royal Oak, MI 48067",
        zipCode: "48067",
        phone: "(248) 555-0789",
        admissionDate: "2024-01-14T12:15:00Z",
        predictedDischarge: "2024-01-17T10:00:00Z",
        facility: "Corewell Health (Beaumont)",
        facilityId: "CW-001",
        unit: "Orthopedic Surgery",
        admittingPhysician: "Dr. Michael Chen",
        physicianNPI: "2345678901",
        primaryDiagnosis: "Right hip fracture with surgical repair",
        icd10Codes: ["S72.001A", "Z96.641"],
        comorbidities: ["Osteoporosis", "Mild cognitive impairment"],
        insurance: "Medicare",
        insuranceId: "MC-123456",
        homeHealthEligible: true,
        predictedLOS: 3,
        riskScore: 85,
        potentialValue: 4100,
        acuityLevel: "high",
        dischargeDestination: "home",
        assignedMarketer: "Mike Rodriguez",
        assignedNurse: "Robert Wilson, RN",
        caseManager: "David Park, MSW",
        caseManagerPhone: "(248) 555-0321",
        contactAttempts: 1,
        lastContactDate: "2024-01-14T16:45:00Z",
        status: "contacted",
        notes: "Initial contact made. PT/OT evaluation scheduled. Family wants home health services.",
        predictiveFlags: ["Hip Fracture Protocol", "Fall Risk", "High-value"],
        marketingPriority: 1,
        estimatedDischargeTime: "10:00 AM",
      },
      {
        id: "pred-003",
        patientName: "James Davis",
        mrn: "MRN-789458",
        dob: "1959-11-08",
        age: 65,
        gender: "Male",
        address: "9012 Pine St, Ann Arbor, MI 48104",
        zipCode: "48104",
        phone: "(734) 555-0654",
        admissionDate: "2024-01-15T06:00:00Z",
        predictedDischarge: "2024-01-17T16:00:00Z",
        facility: "University of Michigan Health",
        facilityId: "UM-001",
        unit: "Pulmonology",
        admittingPhysician: "Dr. Lisa Rodriguez",
        physicianNPI: "3456789012",
        primaryDiagnosis: "COPD exacerbation with respiratory failure",
        icd10Codes: ["J44.1", "J96.00"],
        comorbidities: ["Chronic bronchitis", "Former smoker"],
        insurance: "Blue Cross Blue Shield",
        insuranceId: "BC-789123",
        homeHealthEligible: true,
        predictedLOS: 2,
        riskScore: 88,
        potentialValue: 3800,
        acuityLevel: "high",
        dischargeDestination: "home",
        assignedMarketer: "Emily Chen",
        caseManager: "Amanda Foster, RN",
        caseManagerPhone: "(734) 555-0987",
        contactAttempts: 0,
        status: "admitted",
        notes: "New admission. High readmission risk. Needs oxygen therapy at home.",
        predictiveFlags: ["COPD Protocol", "Readmission Risk", "O2 Therapy"],
        marketingPriority: 2,
        estimatedDischargeTime: "4:00 PM",
      },
    ]

    const mockRoutes: MarketingRoute[] = [
      {
        id: "route-001",
        marketerId: "MKT-001",
        marketerName: "Sarah Johnson",
        date: "2024-01-16",
        patients: [mockPatients[0]],
        facilities: ["Henry Ford Health System"],
        estimatedDriveTime: 45,
        totalMiles: 25,
        priority: "high",
        status: "planned",
        completedContacts: 0,
        successfulContacts: 0,
        securedReferrals: 0,
      },
      {
        id: "route-002",
        marketerId: "MKT-002",
        marketerName: "Mike Rodriguez",
        date: "2024-01-16",
        patients: [mockPatients[1]],
        facilities: ["Corewell Health (Beaumont)"],
        estimatedDriveTime: 35,
        totalMiles: 18,
        priority: "high",
        status: "planned",
        completedContacts: 0,
        successfulContacts: 0,
        securedReferrals: 0,
      },
    ]

    const mockAnalytics: PredictiveAnalytics = {
      totalAdmissions: 156,
      eligiblePatients: 89,
      predictedDischarges: 23,
      contactedPatients: 18,
      securedReferrals: 12,
      averageLOS: 4.2,
      conversionRate: 66.7,
      potentialRevenue: 234500,
      topDiagnoses: [
        { diagnosis: "Heart Failure", count: 18, avgLOS: 5.2, eligibility: 94 },
        { diagnosis: "Hip Fracture", count: 12, avgLOS: 3.8, eligibility: 89 },
        { diagnosis: "COPD", count: 15, avgLOS: 2.9, eligibility: 91 },
        { diagnosis: "Stroke", count: 8, avgLOS: 6.1, eligibility: 87 },
        { diagnosis: "Pneumonia", count: 14, avgLOS: 4.5, eligibility: 76 },
      ],
      facilityPerformance: [
        { facility: "Henry Ford Health System", admissions: 45, conversions: 32, avgLOS: 4.8 },
        { facility: "Corewell Health (Beaumont)", admissions: 38, conversions: 25, avgLOS: 4.1 },
        { facility: "University of Michigan Health", admissions: 32, conversions: 19, avgLOS: 4.6 },
        { facility: "Ascension Michigan", admissions: 28, conversions: 15, avgLOS: 3.9 },
      ],
      zipCodeHotspots: [
        { zipCode: "48201", patients: 12, value: 52000, coverage: true },
        { zipCode: "48067", patients: 8, value: 38000, coverage: true },
        { zipCode: "48104", patients: 6, value: 28000, coverage: true },
        { zipCode: "48309", patients: 10, value: 45000, coverage: false },
      ],
      dischargeTimeline: [
        { date: "2024-01-16", predicted: 8, actual: 6 },
        { date: "2024-01-17", predicted: 12, actual: 0 },
        { date: "2024-01-18", predicted: 15, actual: 0 },
        { date: "2024-01-19", predicted: 9, actual: 0 },
      ],
    }

    setPatients(mockPatients)
    setRoutes(mockRoutes)
    setAnalytics(mockAnalytics)
    setLoading(false)
  }, [])

  // Filter patients
  const filteredPatients = patients.filter((patient) => {
    const matchesFacility = filterFacility === "all" || patient.facility.includes(filterFacility)
    const matchesStatus = filterStatus === "all" || patient.status === filterStatus
    const matchesPriority = filterPriority === "all" || patient.marketingPriority.toString() === filterPriority

    return matchesFacility && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "admitted":
        return "bg-blue-100 text-blue-800"
      case "contacted":
        return "bg-yellow-100 text-yellow-800"
      case "secured":
        return "bg-green-100 text-green-800"
      case "discharged":
        return "bg-purple-100 text-purple-800"
      case "lost":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return "bg-red-100 text-red-800"
      case 2:
        return "bg-orange-100 text-orange-800"
      case 3:
        return "bg-yellow-100 text-yellow-800"
      case 4:
        return "bg-blue-100 text-blue-800"
      case 5:
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const generateOptimizedRoute = async (marketerId: string) => {
    // In real implementation, this would call the route optimization API
    console.log(`Generating optimized route for marketer ${marketerId}`)
  }

  const contactCaseManager = async (patientId: string) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? {
              ...p,
              status: "contacted",
              contactAttempts: p.contactAttempts + 1,
              lastContactDate: new Date().toISOString(),
            }
          : p,
      ),
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BrainCircuit className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading Predictive Marketing Intelligence...</p>
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
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <BrainCircuit className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Predictive Marketing Intelligence</h1>
                <p className="text-gray-600">AI-Powered Admission Tracking & Route Optimization</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Switch checked={autoRouting} onCheckedChange={setAutoRouting} />
                <Label className="text-sm">Auto-Routing</Label>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Activity className="h-3 w-3 mr-1" />
                Live Tracking
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admissions</CardTitle>
                <Hospital className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalAdmissions}</div>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eligible</CardTitle>
                <Target className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{analytics.eligiblePatients}</div>
                <p className="text-xs text-muted-foreground">Home health eligible</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Predicted</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{analytics.predictedDischarges}</div>
                <p className="text-xs text-muted-foreground">Discharges today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contacted</CardTitle>
                <Phone className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{analytics.contactedPatients}</div>
                <p className="text-xs text-muted-foreground">Case managers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Secured</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analytics.securedReferrals}</div>
                <p className="text-xs text-muted-foreground">{analytics.conversionRate}% conversion</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(analytics.potentialRevenue / 1000).toFixed(0)}K</div>
                <p className="text-xs text-muted-foreground">Potential value</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="predictive-feed" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="predictive-feed">🔮 Predictive Feed</TabsTrigger>
            <TabsTrigger value="smart-routes">🛣️ Smart Routes</TabsTrigger>
            <TabsTrigger value="discharge-timeline">📅 Discharge Timeline</TabsTrigger>
            <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
            <TabsTrigger value="automation">🤖 Automation</TabsTrigger>
          </TabsList>

          {/* Predictive Feed Tab */}
          <TabsContent value="predictive-feed" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Predictive Patient Feed</span>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    AI-Powered
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Real-time admission tracking with discharge predictions and marketing automation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Select value={filterFacility} onValueChange={setFilterFacility}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by facility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Facilities</SelectItem>
                      <SelectItem value="Henry Ford">Henry Ford</SelectItem>
                      <SelectItem value="Beaumont">Beaumont</SelectItem>
                      <SelectItem value="Michigan">U of M</SelectItem>
                      <SelectItem value="Ascension">Ascension</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="admitted">Admitted</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="secured">Secured</SelectItem>
                      <SelectItem value="discharged">Discharged</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="1">Priority 1 (Urgent)</SelectItem>
                      <SelectItem value="2">Priority 2 (High)</SelectItem>
                      <SelectItem value="3">Priority 3 (Medium)</SelectItem>
                      <SelectItem value="4">Priority 4 (Low)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilterFacility("all")
                      setFilterStatus("all")
                      setFilterPriority("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>

                {/* Patient Cards */}
                <div className="space-y-4">
                  {filteredPatients.map((patient) => (
                    <Card key={patient.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                              <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="text-lg font-semibold">{patient.patientName}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {patient.age}y {patient.gender}
                                </Badge>
                                <Badge className={getPriorityColor(patient.marketingPriority)}>
                                  P{patient.marketingPriority}
                                </Badge>
                                <Badge className={getStatusColor(patient.status)}>{patient.status.toUpperCase()}</Badge>
                              </div>
                              <p className="text-sm text-gray-600">{patient.primaryDiagnosis}</p>
                              <p className="text-xs text-gray-500">
                                {patient.facility} • {patient.unit} • {patient.insurance}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-green-600 mb-2">
                              ${patient.potentialValue.toLocaleString()}
                            </Badge>
                            <div className="text-sm text-gray-600">
                              Risk Score: <span className="font-semibold">{patient.riskScore}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Predictive Flags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {patient.predictiveFlags.map((flag) => (
                            <Badge key={flag} variant="outline" className="text-xs bg-purple-50 text-purple-700">
                              {flag}
                            </Badge>
                          ))}
                        </div>

                        {/* Key Information Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <span className="text-xs text-gray-500">Admitted</span>
                            <p className="font-medium">{new Date(patient.admissionDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Predicted Discharge</span>
                            <p className="font-medium text-orange-600">
                              {new Date(patient.predictedDischarge).toLocaleDateString()} at{" "}
                              {patient.estimatedDischargeTime}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Length of Stay</span>
                            <p className="font-medium">{patient.predictedLOS} days (predicted)</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Discharge Destination</span>
                            <p className="font-medium capitalize">{patient.dischargeDestination}</p>
                          </div>
                        </div>

                        {/* Assignment Information */}
                        {(patient.assignedMarketer || patient.assignedNurse || patient.caseManager) && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <h4 className="font-medium text-sm mb-2">Team Assignment</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              {patient.assignedMarketer && (
                                <div className="flex items-center space-x-2">
                                  <UserCheck className="h-4 w-4 text-blue-500" />
                                  <span>
                                    <strong>Marketer:</strong> {patient.assignedMarketer}
                                  </span>
                                </div>
                              )}
                              {patient.assignedNurse && (
                                <div className="flex items-center space-x-2">
                                  <Stethoscope className="h-4 w-4 text-green-500" />
                                  <span>
                                    <strong>Nurse:</strong> {patient.assignedNurse}
                                  </span>
                                </div>
                              )}
                              {patient.caseManager && (
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-purple-500" />
                                  <span>
                                    <strong>Case Manager:</strong> {patient.caseManager}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button size="sm" onClick={() => contactCaseManager(patient.id)}>
                              <Phone className="h-3 w-3 mr-1" />
                              Contact Case Manager
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Add Note
                            </Button>
                          </div>
                          <div className="text-xs text-gray-500">
                            {patient.contactAttempts > 0 && <span>{patient.contactAttempts} contact attempts</span>}
                          </div>
                        </div>

                        {/* Notes */}
                        {patient.notes && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm">
                              <strong>Notes:</strong> {patient.notes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Smart Routes Tab */}
          <TabsContent value="smart-routes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Route Planning */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Route className="h-5 w-5" />
                      <span>AI-Optimized Marketing Routes</span>
                    </CardTitle>
                    <CardDescription>
                      Automatically generated routes based on predicted discharge times and patient priorities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {routes.map((route) => (
                        <Card key={route.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold">{route.marketerName}</h3>
                                <p className="text-sm text-gray-600">
                                  {new Date(route.date).toLocaleDateString()} • {route.facilities.length} facilities
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  className={
                                    route.priority === "high"
                                      ? "bg-red-100 text-red-800"
                                      : route.priority === "medium"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                  }
                                >
                                  {route.priority.toUpperCase()}
                                </Badge>
                                <Badge variant="outline">{route.status}</Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                              <div>
                                <span className="text-gray-500">Patients:</span>
                                <p className="font-semibold">{route.patients.length}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Drive Time:</span>
                                <p className="font-semibold">{route.estimatedDriveTime} min</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Distance:</span>
                                <p className="font-semibold">{route.totalMiles} miles</p>
                              </div>
                            </div>

                            {/* Patient List */}
                            <div className="space-y-2 mb-4">
                              {route.patients.map((patient, index) => (
                                <div key={patient.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-2">
                                    <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center">
                                      {index + 1}
                                    </span>
                                    <span>{patient.patientName}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {patient.facility.split(" ")[0]}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge className={getPriorityColor(patient.marketingPriority)} variant="outline">
                                      P{patient.marketingPriority}
                                    </Badge>
                                    <span className="text-gray-500">{patient.estimatedDischargeTime}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex space-x-2">
                                <Button size="sm">
                                  <Car className="h-3 w-3 mr-1" />
                                  Start Route
                                </Button>
                                <Button size="sm" variant="outline">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  View Map
                                </Button>
                              </div>
                              <div className="text-xs text-gray-500">
                                {route.completedContacts}/{route.patients.length} completed
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Route Optimization Settings */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Route Optimization</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Auto-Generate Routes</Label>
                      <Switch checked={autoRouting} onCheckedChange={setAutoRouting} />
                    </div>
                    <div className="space-y-2">
                      <Label>Optimization Factors</Label>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Patient Priority</span>
                          <Badge variant="outline">High Weight</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Discharge Time</span>
                          <Badge variant="outline">High Weight</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Drive Distance</span>
                          <Badge variant="outline">Medium Weight</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Potential Value</span>
                          <Badge variant="outline">Medium Weight</Badge>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full">
                      <Route className="h-4 w-4 mr-2" />
                      Regenerate All Routes
                    </Button>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Route Performance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Success Rate</span>
                        <span className="font-semibold">78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Avg Response Time</span>
                        <span className="font-semibold">24 min</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Miles Saved</span>
                        <span className="font-semibold text-green-600">156</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Discharge Timeline Tab */}
          <TabsContent value="discharge-timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Predictive Discharge Timeline</span>
                </CardTitle>
                <CardDescription>
                  AI-powered discharge predictions with confidence intervals and marketing readiness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <Label htmlFor="timeline-date">Select Date</Label>
                  <Input
                    id="timeline-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-48 mt-1"
                  />
                </div>

                {analytics && (
                  <div className="space-y-6">
                    {/* Timeline Chart */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-medium mb-4">Predicted vs Actual Discharges</h3>
                      <div className="grid grid-cols-4 gap-4">
                        {analytics.dischargeTimeline.map((day) => (
                          <div key={day.date} className="text-center">
                            <div className="text-xs text-gray-500 mb-2">
                              {new Date(day.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            <div className="space-y-1">
                              <div
                                className="bg-blue-500 rounded"
                                style={{ height: `${(day.predicted / 15) * 60}px`, minHeight: "4px" }}
                                title={`Predicted: ${day.predicted}`}
                              />
                              <div
                                className="bg-green-500 rounded"
                                style={{
                                  height: `${(day.actual / 15) * 60}px`,
                                  minHeight: day.actual > 0 ? "4px" : "0px",
                                }}
                                title={`Actual: ${day.actual}`}
                              />
                            </div>
                            <div className="text-xs mt-1">
                              <div className="text-blue-600">P: {day.predicted}</div>
                              <div className="text-green-600">A: {day.actual}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-blue-500 rounded" />
                          <span>Predicted</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-green-500 rounded" />
                          <span>Actual</span>
                        </div>
                      </div>
                    </div>

                    {/* Today's Predicted Discharges */}
                    <div>
                      <h3 className="font-medium mb-4">Today's Predicted Discharges</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {patients
                          .filter((p) => new Date(p.predictedDischarge).toDateString() === new Date().toDateString())
                          .map((patient) => (
                            <Card key={patient.id} className="border-l-4 border-l-orange-500">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">{patient.patientName}</h4>
                                  <Badge className={getPriorityColor(patient.marketingPriority)}>
                                    P{patient.marketingPriority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{patient.facility}</p>
                                <div className="flex items-center justify-between text-sm">
                                  <span>Est. Discharge:</span>
                                  <span className="font-semibold text-orange-600">
                                    {patient.estimatedDischargeTime}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span>Confidence:</span>
                                  <span className="font-semibold">{patient.riskScore}%</span>
                                </div>
                                <div className="mt-3">
                                  <Badge className={getStatusColor(patient.status)} variant="outline">
                                    {patient.status}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {analytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Diagnoses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Heart className="h-5 w-5" />
                      <span>Top Diagnoses</span>
                    </CardTitle>
                    <CardDescription>Most common diagnoses with eligibility rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.topDiagnoses.map((diagnosis) => (
                        <div key={diagnosis.diagnosis} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{diagnosis.diagnosis}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">{diagnosis.count} patients</span>
                              <span className="text-sm font-medium text-green-600">{diagnosis.eligibility}%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Avg LOS: {diagnosis.avgLOS} days</span>
                            <span>Eligibility: {diagnosis.eligibility}%</span>
                          </div>
                          <Progress value={diagnosis.eligibility} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Facility Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5" />
                      <span>Facility Performance</span>
                    </CardTitle>
                    <CardDescription>Admission volume and conversion rates by facility</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.facilityPerformance.map((facility, index) => (
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
                              <div className="text-sm text-gray-500">{facility.admissions} admissions</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">{facility.conversions} converted</div>
                            <div className="text-xs text-gray-500">
                              {Math.round((facility.conversions / facility.admissions) * 100)}% rate
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* ZIP Code Hotspots */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>ZIP Code Hotspots</span>
                    </CardTitle>
                    <CardDescription>High-value areas and coverage analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.zipCodeHotspots.map((area) => (
                        <div key={area.zipCode} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium">{area.zipCode}</div>
                              <div className="text-sm text-gray-600">{area.patients} patients</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">${area.value.toLocaleString()}</div>
                            <div className="flex items-center space-x-1">
                              {area.coverage ? (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  Covered
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-600 border-red-600">
                                  Uncovered
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Performance Metrics</span>
                    </CardTitle>
                    <CardDescription>Key performance indicators and trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{analytics.averageLOS}</div>
                        <div className="text-sm text-blue-800">Avg Length of Stay</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{analytics.conversionRate}%</div>
                        <div className="text-sm text-green-800">Conversion Rate</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          ${(analytics.potentialRevenue / analytics.eligiblePatients).toFixed(0)}
                        </div>
                        <div className="text-sm text-purple-800">Avg Patient Value</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {Math.round((analytics.eligiblePatients / analytics.totalAdmissions) * 100)}%
                        </div>
                        <div className="text-sm text-orange-800">Eligibility Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Automation Rules */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Automation Rules</span>
                  </CardTitle>
                  <CardDescription>AI-powered automation for patient processing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>High-Priority Assignment</AlertTitle>
                      <AlertDescription>
                        Patients with risk score ≥ 85% are automatically assigned to senior marketers and flagged for
                        immediate contact.
                      </AlertDescription>
                    </Alert>

                    <Alert className="border-blue-200 bg-blue-50">
                      <Zap className="h-4 w-4" />
                      <AlertTitle>Predictive Route Generation</AlertTitle>
                      <AlertDescription>
                        Marketing routes are automatically generated based on predicted discharge times and optimized
                        for drive time and patient priority.
                      </AlertDescription>
                    </Alert>

                    <Alert className="border-purple-200 bg-purple-50">
                      <BrainCircuit className="h-4 w-4" />
                      <AlertTitle>LOS Prediction Engine</AlertTitle>
                      <AlertDescription>
                        AI analyzes diagnosis, age, and comorbidities to predict length of stay with 87% accuracy,
                        enabling proactive planning.
                      </AlertDescription>
                    </Alert>

                    <Alert className="border-orange-200 bg-orange-50">
                      <Timer className="h-4 w-4" />
                      <AlertTitle>Discharge Time Alerts</AlertTitle>
                      <AlertDescription>
                        Automated alerts sent 24 hours before predicted discharge to ensure marketing team readiness.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>

              {/* Workflow Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Workflow Configuration</span>
                  </CardTitle>
                  <CardDescription>Customize automated workflows and triggers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Auto-Assignment</Label>
                        <p className="text-sm text-gray-600">Automatically assign patients to marketers by ZIP code</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Predictive Routing</Label>
                        <p className="text-sm text-gray-600">
                          Generate optimized routes based on discharge predictions
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Early Alerts</Label>
                        <p className="text-sm text-gray-600">Send alerts 24h before predicted discharge</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Case Manager Outreach</Label>
                        <p className="text-sm text-gray-600">Auto-contact case managers for high-priority patients</p>
                      </div>
                      <Switch />
                    </div>

                    <div className="space-y-2">
                      <Label>Priority Threshold</Label>
                      <Select defaultValue="85">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="80">80% Risk Score</SelectItem>
                          <SelectItem value="85">85% Risk Score</SelectItem>
                          <SelectItem value="90">90% Risk Score</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Monitoring */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Automation Performance</span>
                  </CardTitle>
                  <CardDescription>Real-time automation metrics and success rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">94%</div>
                      <div className="text-sm text-blue-800">Auto-Assignment Success</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">87%</div>
                      <div className="text-sm text-green-800">LOS Prediction Accuracy</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">156</div>
                      <div className="text-sm text-purple-800">Miles Saved This Week</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">23min</div>
                      <div className="text-sm text-orange-800">Avg Response Time</div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Recent Automation Events</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>High-priority patient auto-assigned to Sarah Johnson</span>
                        </div>
                        <span className="text-gray-500">2 min ago</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center space-x-2">
                          <Route className="h-4 w-4 text-blue-500" />
                          <span>Optimized route generated for Mike Rodriguez</span>
                        </div>
                        <span className="text-gray-500">5 min ago</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center space-x-2">
                          <Bell className="h-4 w-4 text-orange-500" />
                          <span>Discharge alert sent for Robert Johnson</span>
                        </div>
                        <span className="text-gray-500">12 min ago</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-purple-500" />
                          <span>LOS prediction updated for Mary Williams</span>
                        </div>
                        <span className="text-gray-500">18 min ago</span>
                      </div>
                    </div>
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
