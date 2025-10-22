"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  Clock,
  DollarSign,
  Star,
  Award,
  BookOpen,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Heart,
  Package,
  AlertTriangle,
  TrendingUp,
  Phone,
  User,
  MapPin,
  UserPlus,
  CheckCircle,
  Eye,
  ClipboardCheck,
  Search,
  Shield,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { StaffSupplyAnalyzer } from "@/components/staff-supply-analyzer"

interface PendingOnboardingPatient {
  id: string
  name: string
  phone: string
  address: string
  firstVisitScheduled: string
  assignedNurse: string
  services: string[]
  priority: "high" | "medium" | "low"
  status: "pending_onboarding" | "scheduled" | "in_progress"
  acceptedDate: string
  eligibilityStatus: "verified" | "checking" | "requires_auth" | "denied" | "pending_auth"
  authorizationStatus: "not_required" | "pending" | "approved" | "denied" | "submitted"
  insuranceProvider: string
  estimatedAuthDays: number
  socRequired: boolean
  authRequiredBefore: boolean
}

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")

  const staffData = {
    name: "Sarah Johnson",
    role: "Registered Nurse",
    id: "RN-2024-001",
    avatar: "/professional-woman-diverse.png",
    rating: 4.8,
    totalShifts: 156,
    hoursWorked: 1248,
    earnings: 62400,
    certifications: [
      { name: "RN License", status: "Active", expires: "2025-06-15" },
      { name: "BLS Certification", status: "Active", expires: "2024-12-01" },
      { name: "ACLS Certification", status: "Expiring Soon", expires: "2024-08-15" },
    ],
    upcomingShifts: [
      { date: "2024-07-05", time: "7:00 AM - 7:00 PM", location: "Sunrise Senior Living", unit: "ICU" },
      { date: "2024-07-06", time: "7:00 AM - 7:00 PM", location: "Memorial Hospital", unit: "Emergency" },
      { date: "2024-07-08", time: "11:00 PM - 7:00 AM", location: "City Medical Center", unit: "Med-Surg" },
    ],
    recentPayStubs: [
      { period: "June 16-30, 2024", amount: 2850, hours: 72, status: "Paid" },
      { period: "June 1-15, 2024", amount: 2640, hours: 66, status: "Paid" },
      { period: "May 16-31, 2024", amount: 2920, hours: 73, status: "Paid" },
    ],
    trainingModules: [
      { name: "Infection Control Update", progress: 100, completed: true, dueDate: "Completed" },
      { name: "Patient Safety Protocols", progress: 75, completed: false, dueDate: "2024-07-10" },
      { name: "Emergency Response Training", progress: 0, completed: false, dueDate: "2024-07-20" },
    ],
    patientReviews: [
      {
        patient: "Anonymous",
        rating: 5,
        comment: "Sarah was incredibly caring and professional. Made my stay much more comfortable.",
        date: "2024-06-28",
      },
      {
        patient: "Anonymous",
        rating: 5,
        comment: "Excellent nurse! Very knowledgeable and compassionate.",
        date: "2024-06-25",
      },
    ],
    supplyTransactions: [
      {
        id: "ST001",
        type: "checkout",
        patientId: "P001",
        patientName: "Margaret Anderson",
        supplyId: "SUP001",
        supplyName: "Hydrocolloid Dressing 4x4",
        category: "Dressings",
        quantityCheckedOut: 3,
        quantityUsed: 2,
        quantityReturned: 1,
        unitCost: 12.5,
        totalCheckedOutCost: 37.5,
        totalUsedCost: 25.0,
        wastedCost: 12.5,
        checkedOutAt: "2024-07-04T09:00:00Z",
        usedAt: "2024-07-04T10:00:00Z",
        returnedAt: "2024-07-04T11:00:00Z",
        woundLocation: "Right heel",
        notes: "Patient wound healing well, only needed 2 dressings",
      },
      {
        id: "ST002",
        type: "checkout",
        patientId: "P003",
        patientName: "James Patterson",
        supplyId: "SUP005",
        supplyName: "Saline Wound Cleanser 8oz",
        category: "Cleansers",
        quantityCheckedOut: 2,
        quantityUsed: 2,
        quantityReturned: 0,
        unitCost: 6.75,
        totalCheckedOutCost: 13.5,
        totalUsedCost: 13.5,
        wastedCost: 0,
        checkedOutAt: "2024-07-03T14:30:00Z",
        usedAt: "2024-07-03T15:30:00Z",
        returnedAt: null,
        woundLocation: "Surgical incision",
        notes: "Used both bottles for thorough wound cleaning",
      },
      {
        id: "ST003",
        type: "checkout",
        patientId: "P001",
        patientName: "Margaret Anderson",
        supplyId: "SUP006",
        supplyName: "Gauze Pads 4x4 Sterile (10pk)",
        category: "Gauze",
        quantityCheckedOut: 2,
        quantityUsed: 1,
        quantityReturned: 1,
        unitCost: 4.25,
        totalCheckedOutCost: 8.5,
        totalUsedCost: 4.25,
        wastedCost: 4.25,
        checkedOutAt: "2024-07-02T10:00:00Z",
        usedAt: "2024-07-02T11:00:00Z",
        returnedAt: "2024-07-02T12:00:00Z",
        woundLocation: "Right heel",
        notes: "Only needed one pack, returned unused pack",
      },
      {
        id: "ST004",
        type: "checkout",
        patientId: "P004",
        patientName: "Robert Miller",
        supplyId: "SUP002",
        supplyName: "Silver Antimicrobial Foam 6x6",
        category: "Antimicrobial",
        quantityCheckedOut: 1,
        quantityUsed: 1,
        quantityReturned: 0,
        unitCost: 28.75,
        totalCheckedOutCost: 28.75,
        totalUsedCost: 28.75,
        wastedCost: 0,
        checkedOutAt: "2024-07-01T08:30:00Z",
        usedAt: "2024-07-01T09:00:00Z",
        returnedAt: null,
        woundLocation: "Sacral area",
        notes: "Full dressing used for infected pressure ulcer",
      },
      {
        id: "ST005",
        type: "checkout",
        patientId: "P001",
        patientName: "Margaret Anderson",
        supplyId: "SUP001",
        supplyName: "Hydrocolloid Dressing 4x4",
        category: "Dressings",
        quantityCheckedOut: 4,
        quantityUsed: 2,
        quantityReturned: 2,
        unitCost: 12.5,
        totalCheckedOutCost: 50.0,
        totalUsedCost: 25.0,
        wastedCost: 25.0,
        checkedOutAt: "2024-06-30T09:00:00Z",
        usedAt: "2024-06-30T10:00:00Z",
        returnedAt: "2024-06-30T11:30:00Z",
        woundLocation: "Right heel",
        notes: "Wound smaller than expected, returned extra dressings",
      },
      {
        id: "ST006",
        type: "checkout",
        patientId: "P005",
        patientName: "Linda White",
        supplyId: "SUP009",
        supplyName: "Compression Bandage 4in",
        category: "Compression",
        quantityCheckedOut: 2,
        quantityUsed: 1,
        quantityReturned: 0,
        unitCost: 11.8,
        totalCheckedOutCost: 23.6,
        totalUsedCost: 11.8,
        wastedCost: 11.8,
        checkedOutAt: "2024-06-29T13:00:00Z",
        usedAt: "2024-06-29T14:00:00Z",
        returnedAt: null,
        woundLocation: "Lower leg",
        notes: "Second bandage damaged during application, had to discard",
      },
    ],
  }

  // Enhanced pending onboarding patients with automatic eligibility checking and auth management
  const [pendingOnboardingPatients, setPendingOnboardingPatients] = useState<PendingOnboardingPatient[]>([
    {
      id: "PAT-001",
      name: "Margaret Anderson",
      phone: "(248) 555-0123",
      address: "123 Oak Street, Detroit, MI 48201",
      firstVisitScheduled: "2024-07-06 10:00 AM",
      assignedNurse: "Sarah Johnson",
      services: ["SN", "PT"],
      priority: "high",
      status: "pending_onboarding",
      acceptedDate: "2024-07-05",
      eligibilityStatus: "verified",
      authorizationStatus: "approved",
      insuranceProvider: "Medicare Part A",
      estimatedAuthDays: 0,
      socRequired: true,
      authRequiredBefore: false,
    },
    {
      id: "PAT-002",
      name: "Robert Miller",
      phone: "(248) 555-0124",
      address: "456 Pine Avenue, Southfield, MI 48075",
      firstVisitScheduled: "2024-07-06 2:00 PM",
      assignedNurse: "Sarah Johnson",
      services: ["SN", "CHHA", "PT"],
      priority: "high",
      status: "pending_onboarding",
      acceptedDate: "2024-07-04",
      eligibilityStatus: "verified",
      authorizationStatus: "pending",
      insuranceProvider: "Aetna Better Health (Medicaid)",
      estimatedAuthDays: 3,
      socRequired: true,
      authRequiredBefore: true,
    },
    {
      id: "PAT-003",
      name: "Dorothy Williams",
      phone: "(248) 555-0125",
      address: "789 Elm Street, Troy, MI 48084",
      firstVisitScheduled: "2024-07-07 11:00 AM",
      assignedNurse: "Sarah Johnson",
      services: ["SN", "OT"],
      priority: "medium",
      status: "pending_onboarding",
      acceptedDate: "2024-07-05",
      eligibilityStatus: "checking",
      authorizationStatus: "not_required",
      insuranceProvider: "Blue Cross Blue Shield",
      estimatedAuthDays: 0,
      socRequired: true,
      authRequiredBefore: false,
    },
  ])

  // Simulate real-time eligibility checking
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingOnboardingPatients((prev) =>
        prev.map((patient) => {
          if (patient.eligibilityStatus === "checking") {
            return {
              ...patient,
              eligibilityStatus: "verified" as const,
              authorizationStatus: patient.insuranceProvider.includes("Medicare")
                ? ("not_required" as const)
                : ("pending" as const),
            }
          }
          return patient
        }),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Calculate supply analytics
  const supplyAnalytics = {
    totalCheckedOut: staffData.supplyTransactions.reduce((sum, t) => sum + t.totalCheckedOutCost, 0),
    totalUsed: staffData.supplyTransactions.reduce((sum, t) => sum + t.totalUsedCost, 0),
    totalWasted: staffData.supplyTransactions.reduce((sum, t) => sum + t.wastedCost, 0),
    totalItemsCheckedOut: staffData.supplyTransactions.reduce((sum, t) => sum + t.quantityCheckedOut, 0),
    totalItemsUsed: staffData.supplyTransactions.reduce((sum, t) => sum + t.quantityUsed, 0),
    totalItemsReturned: staffData.supplyTransactions.reduce((sum, t) => sum + (t.quantityReturned || 0), 0),
    wastePercentage: 0,
    returnRate: 0,
  }

  supplyAnalytics.wastePercentage = (supplyAnalytics.totalWasted / supplyAnalytics.totalCheckedOut) * 100
  supplyAnalytics.returnRate = (supplyAnalytics.totalItemsReturned / supplyAnalytics.totalItemsCheckedOut) * 100

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800"
      case "checking":
        return "bg-blue-100 text-blue-800"
      case "requires_auth":
        return "bg-yellow-100 text-yellow-800"
      case "denied":
        return "bg-red-100 text-red-800"
      case "pending_auth":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAuthStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "denied":
        return "bg-red-100 text-red-800"
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "not_required":
        return "bg-gray-100 text-gray-600"
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
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredPatients = pendingOnboardingPatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.insuranceProvider.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={staffData.avatar || "/placeholder.svg"} alt={staffData.name} />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Welcome back, {staffData.name}</h1>
                <p className="text-sm text-gray-600">
                  {staffData.role} • ID: {staffData.id}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="onboarding">Patient Onboarding</TabsTrigger>
            <TabsTrigger value="supplies">Supply Management</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Star className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Rating</p>
                      <p className="text-2xl font-bold text-gray-900">{staffData.rating}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Hours Worked</p>
                      <p className="text-2xl font-bold text-gray-900">{staffData.hoursWorked}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Shifts</p>
                      <p className="text-2xl font-bold text-gray-900">{staffData.totalShifts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                      <p className="text-2xl font-bold text-gray-900">${staffData.earnings.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Shifts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Upcoming Shifts
                </CardTitle>
                <CardDescription>Your scheduled shifts for the next week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffData.upcomingShifts.map((shift, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{shift.date}</p>
                          <p className="text-sm text-gray-600">{shift.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{shift.location}</p>
                        <p className="text-sm text-gray-600">{shift.unit}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Certifications Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Certifications & Licenses
                </CardTitle>
                <CardDescription>Keep track of your professional certifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffData.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Shield className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{cert.name}</p>
                          <p className="text-sm text-gray-600">Expires: {cert.expires}</p>
                        </div>
                      </div>
                      <Badge
                        className={
                          cert.status === "Active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {cert.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="onboarding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Pending Patient Onboarding
                </CardTitle>
                <CardDescription>
                  Patients assigned to you requiring onboarding with automatic eligibility verification and
                  authorization tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search patients by name, phone, or insurance..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredPatients.map((patient) => (
                    <div key={patient.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{patient.name}</h3>
                            <p className="text-sm text-gray-600">{patient.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(patient.priority)}>{patient.priority.toUpperCase()}</Badge>
                          <Badge className={getStatusColor(patient.eligibilityStatus)}>
                            {patient.eligibilityStatus === "checking" && (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            )}
                            {patient.eligibilityStatus.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="flex items-center mb-1">
                            <MapPin className="h-4 w-4 text-gray-600 mr-1" />
                            <span className="text-sm font-medium">Address</span>
                          </div>
                          <p className="text-sm">{patient.address}</p>
                        </div>

                        <div className="p-3 bg-gray-50 rounded">
                          <div className="flex items-center mb-1">
                            <Calendar className="h-4 w-4 text-gray-600 mr-1" />
                            <span className="text-sm font-medium">First Visit</span>
                          </div>
                          <p className="text-sm">{patient.firstVisitScheduled}</p>
                        </div>

                        <div className="p-3 bg-gray-50 rounded">
                          <div className="flex items-center mb-1">
                            <Heart className="h-4 w-4 text-gray-600 mr-1" />
                            <span className="text-sm font-medium">Services</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {patient.services.map((service, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-blue-50 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Insurance Provider</span>
                            <Badge className={getStatusColor(patient.eligibilityStatus)}>
                              {patient.eligibilityStatus === "checking" && (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              )}
                              {patient.eligibilityStatus.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm">{patient.insuranceProvider}</p>
                          {patient.eligibilityStatus === "checking" && (
                            <p className="text-xs text-blue-600 mt-1">Verifying eligibility...</p>
                          )}
                        </div>

                        <div className="p-3 bg-yellow-50 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Authorization Status</span>
                            <Badge className={getAuthStatusColor(patient.authorizationStatus)}>
                              {patient.authorizationStatus.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          {patient.authorizationStatus === "pending" && (
                            <p className="text-xs text-yellow-600">
                              Est. {patient.estimatedAuthDays} days for approval
                            </p>
                          )}
                          {patient.authRequiredBefore && (
                            <p className="text-xs text-red-600 mt-1">⚠️ Auth required before first visit</p>
                          )}
                        </div>
                      </div>

                      {/* Alerts and Warnings */}
                      {patient.authRequiredBefore && patient.authorizationStatus !== "approved" && (
                        <Alert className="mb-3 border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700">
                            <strong>Authorization Required:</strong> This patient requires authorization approval before
                            the first visit can be conducted. First visit scheduled for {patient.firstVisitScheduled}.
                          </AlertDescription>
                        </Alert>
                      )}

                      {patient.eligibilityStatus === "denied" && (
                        <Alert className="mb-3 border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700">
                            <strong>Eligibility Denied:</strong> Patient's insurance eligibility has been denied.
                            Contact the insurance provider or patient to resolve.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex space-x-2">
                        <Link href={`/patient-onboarding/${patient.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </Link>

                        {patient.eligibilityStatus === "verified" &&
                          (patient.authorizationStatus === "approved" ||
                            patient.authorizationStatus === "not_required") && (
                            <Button size="sm">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Start Onboarding
                            </Button>
                          )}

                        {patient.authorizationStatus === "pending" && (
                          <Button size="sm" variant="outline" className="text-blue-600 bg-transparent">
                            <ClipboardCheck className="h-3 w-3 mr-1" />
                            Check Auth Status
                          </Button>
                        )}

                        {patient.eligibilityStatus === "denied" && (
                          <Button size="sm" variant="outline" className="text-red-600 bg-transparent">
                            <Phone className="h-3 w-3 mr-1" />
                            Contact Insurance
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {filteredPatients.length === 0 && (
                  <div className="text-center py-8">
                    <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No pending onboarding patients</h3>
                    <p className="text-gray-600">
                      {searchTerm
                        ? "No patients match your search criteria."
                        : "All assigned patients have been onboarded."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supplies" className="space-y-6">
            {/* Supply Analytics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Checked Out</p>
                      <p className="text-2xl font-bold text-gray-900">${supplyAnalytics.totalCheckedOut.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Used</p>
                      <p className="text-2xl font-bold text-gray-900">${supplyAnalytics.totalUsed.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Wasted</p>
                      <p className="text-2xl font-bold text-gray-900">${supplyAnalytics.totalWasted.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Waste Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{supplyAnalytics.wastePercentage.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Supply Analyzer Component */}
            <StaffSupplyAnalyzer staffId="RN-2024-001" />

            {/* Recent Supply Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Recent Supply Transactions
                </CardTitle>
                <CardDescription>Your recent wound care supply checkouts and usage</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Supply</TableHead>
                      <TableHead>Checked Out</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead>Returned</TableHead>
                      <TableHead>Cost Impact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffData.supplyTransactions.slice(0, 10).map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-sm">
                          {new Date(transaction.checkedOutAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{transaction.patientName}</p>
                            <p className="text-xs text-gray-600">{transaction.woundLocation}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{transaction.supplyName}</p>
                            <Badge variant="outline" className="text-xs">
                              {transaction.category}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{transaction.quantityCheckedOut}</TableCell>
                        <TableCell className="text-center">{transaction.quantityUsed}</TableCell>
                        <TableCell className="text-center">{transaction.quantityReturned || 0}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-green-600">${transaction.totalUsedCost.toFixed(2)} used</p>
                            {transaction.wastedCost > 0 && (
                              <p className="text-red-600">${transaction.wastedCost.toFixed(2)} wasted</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Schedule Management
                </CardTitle>
                <CardDescription>View and manage your work schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffData.upcomingShifts.map((shift, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{shift.date}</p>
                          <p className="text-sm text-gray-600">{shift.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{shift.location}</p>
                        <p className="text-sm text-gray-600">{shift.unit}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Training Modules
                </CardTitle>
                <CardDescription>Complete required training and continuing education</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffData.trainingModules.map((module, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{module.name}</h3>
                          <p className="text-sm text-gray-600">Due: {module.dueDate}</p>
                        </div>
                        <Badge
                          className={module.completed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                        >
                          {module.completed ? "Completed" : "In Progress"}
                        </Badge>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{module.progress}%</span>
                        </div>
                        <Progress value={module.progress} className="h-2" />
                      </div>
                      {!module.completed && (
                        <Button size="sm">
                          Continue Training
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Patient Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Recent Patient Reviews
                </CardTitle>
                <CardDescription>Feedback from your recent patients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffData.patientReviews.map((review, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{review.patient}</span>
                        </div>
                        <span className="text-sm text-gray-600">{review.date}</span>
                      </div>
                      <p className="text-sm text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Payroll Information
                </CardTitle>
                <CardDescription>View your recent pay stubs and earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffData.recentPayStubs.map((payStub, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{payStub.period}</p>
                          <p className="text-sm text-gray-600">{payStub.hours} hours worked</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${payStub.amount.toLocaleString()}</p>
                        <Badge className="bg-green-100 text-green-800">{payStub.status}</Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        Download
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
