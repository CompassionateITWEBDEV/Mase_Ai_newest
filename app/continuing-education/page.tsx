"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  FileText,
  Award,
  Users,
  TrendingUp,
  Shield,
  Bell,
  Lock,
  Unlock,
  Eye,
  Edit,
} from "lucide-react"
import Link from "next/link"

export default function ContinuingEducation() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [complianceFilter, setComplianceFilter] = useState("all")
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  // State-specific CEU requirements
  const stateRequirements = {
    michigan: {
      RN: { hours: 25, period: "biennial", description: "25 hours every 2 years" },
      LPN: { hours: 20, period: "biennial", description: "20 hours every 2 years" },
      CNA: { hours: 12, period: "annual", description: "12 hours annually" },
      PT: { hours: 30, period: "biennial", description: "30 hours every 2 years" },
      PTA: { hours: 20, period: "biennial", description: "20 hours every 2 years" },
      OT: { hours: 24, period: "biennial", description: "24 hours every 2 years" },
      HHA: { hours: 12, period: "annual", description: "12 hours annually" },
    },
  }

  // Mock employee data with CEU tracking
  const employees = [
    {
      id: "EMP-001",
      name: "Sarah Johnson",
      role: "RN",
      hireDate: "2023-03-15",
      licenseExpiry: "2025-06-30",
      currentPeriodStart: "2023-07-01",
      currentPeriodEnd: "2025-06-30",
      requiredHours: 25,
      completedHours: 18.5,
      status: "compliant",
      daysUntilDue: 245,
      avatar: "/placeholder.svg?height=40&width=40&text=SJ",
      certificates: [
        {
          id: "CERT-001",
          title: "Advanced Wound Care Management",
          provider: "American Nurses Association",
          completionDate: "2024-03-15",
          hoursEarned: 8.0,
          certificateNumber: "ANA-2024-001",
          status: "verified",
        },
        {
          id: "CERT-002",
          title: "Infection Control in Healthcare",
          provider: "CDC Training Institute",
          completionDate: "2024-01-20",
          hoursEarned: 6.0,
          certificateNumber: "CDC-2024-002",
          status: "verified",
        },
        {
          id: "CERT-003",
          title: "Pain Management Strategies",
          provider: "Michigan Nurses Association",
          completionDate: "2023-11-10",
          hoursEarned: 4.5,
          certificateNumber: "MNA-2023-003",
          status: "verified",
        },
      ],
      onboardingStatus: {
        completed: true,
        completionDate: "2023-03-22",
        totalModules: 9,
        completedModules: 9,
      },
      workRestrictions: [],
    },
    {
      id: "EMP-002",
      name: "Michael Chen",
      role: "PT",
      hireDate: "2023-01-20",
      licenseExpiry: "2025-08-31",
      currentPeriodStart: "2023-08-01",
      currentPeriodEnd: "2025-07-31",
      requiredHours: 30,
      completedHours: 12.0,
      status: "at_risk",
      daysUntilDue: 89,
      avatar: "/placeholder.svg?height=40&width=40&text=MC",
      certificates: [
        {
          id: "CERT-004",
          title: "Manual Therapy Techniques",
          provider: "American Physical Therapy Association",
          completionDate: "2024-02-10",
          hoursEarned: 12.0,
          certificateNumber: "APTA-2024-004",
          status: "verified",
        },
      ],
      onboardingStatus: {
        completed: true,
        completionDate: "2023-01-27",
        totalModules: 8,
        completedModules: 8,
      },
      workRestrictions: [],
    },
    {
      id: "EMP-003",
      name: "Emily Davis",
      role: "CNA",
      hireDate: "2024-01-10",
      licenseExpiry: "2024-12-31",
      currentPeriodStart: "2024-01-01",
      currentPeriodEnd: "2024-12-31",
      requiredHours: 12,
      completedHours: 4.0,
      status: "due_soon",
      daysUntilDue: 28,
      avatar: "/placeholder.svg?height=40&width=40&text=ED",
      certificates: [
        {
          id: "CERT-005",
          title: "Basic Life Support",
          provider: "American Heart Association",
          completionDate: "2024-02-15",
          hoursEarned: 4.0,
          certificateNumber: "AHA-2024-005",
          status: "verified",
        },
      ],
      onboardingStatus: {
        completed: false,
        completionDate: null,
        totalModules: 7,
        completedModules: 5,
      },
      workRestrictions: ["patient_assignments"],
    },
    {
      id: "EMP-004",
      name: "Robert Wilson",
      role: "LPN",
      hireDate: "2022-11-05",
      licenseExpiry: "2024-11-30",
      currentPeriodStart: "2022-11-01",
      currentPeriodEnd: "2024-10-31",
      requiredHours: 20,
      completedHours: 8.0,
      status: "non_compliant",
      daysUntilDue: -15,
      avatar: "/placeholder.svg?height=40&width=40&text=RW",
      certificates: [
        {
          id: "CERT-006",
          title: "Medication Administration",
          provider: "National Association for Practical Nurse Education",
          completionDate: "2023-06-20",
          hoursEarned: 8.0,
          certificateNumber: "NAPNE-2023-006",
          status: "verified",
        },
      ],
      onboardingStatus: {
        completed: true,
        completionDate: "2022-11-12",
        totalModules: 9,
        completedModules: 9,
      },
      workRestrictions: ["scheduling", "payroll", "patient_assignments"],
    },
  ]

  // Mandatory onboarding modules
  const onboardingModules = [
    {
      id: "MOD-001",
      title: "Bloodborne Pathogens",
      description: "OSHA-required training on bloodborne pathogen exposure control",
      dueWithin: 7,
      category: "Safety",
      estimatedTime: 45,
      required: true,
    },
    {
      id: "MOD-002",
      title: "Infection Control & Hand Hygiene",
      description: "CDC guidelines for infection prevention in healthcare settings",
      dueWithin: 7,
      category: "Safety",
      estimatedTime: 30,
      required: true,
    },
    {
      id: "MOD-003",
      title: "HIPAA & Confidentiality",
      description: "Patient privacy and confidentiality requirements",
      dueWithin: 3,
      category: "Compliance",
      estimatedTime: 60,
      required: true,
    },
    {
      id: "MOD-004",
      title: "Emergency Preparedness",
      description: "Emergency response procedures and protocols",
      dueWithin: 14,
      category: "Safety",
      estimatedTime: 45,
      required: true,
    },
    {
      id: "MOD-005",
      title: "Patient Rights & Ethics",
      description: "Patient rights, ethical considerations, and professional conduct",
      dueWithin: 14,
      category: "Ethics",
      estimatedTime: 40,
      required: true,
    },
    {
      id: "MOD-006",
      title: "Abuse, Neglect, and Exploitation Reporting",
      description: "Mandatory reporting requirements and procedures",
      dueWithin: 7,
      category: "Compliance",
      estimatedTime: 35,
      required: true,
    },
    {
      id: "MOD-007",
      title: "Safety & Fire Procedures",
      description: "Workplace safety and fire prevention protocols",
      dueWithin: 14,
      category: "Safety",
      estimatedTime: 30,
      required: true,
    },
    {
      id: "MOD-008",
      title: "Equipment Use & Maintenance",
      description: "Proper use and maintenance of medical equipment",
      dueWithin: 21,
      category: "Clinical",
      estimatedTime: 50,
      required: false,
      roles: ["HHA", "PT", "PTA"],
    },
    {
      id: "MOD-009",
      title: "Wound Documentation Standards",
      description: "Proper wound assessment and documentation procedures",
      dueWithin: 14,
      category: "Clinical",
      estimatedTime: 45,
      required: false,
      roles: ["RN", "LPN"],
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-100 text-green-800"
      case "at_risk":
        return "bg-yellow-100 text-yellow-800"
      case "due_soon":
        return "bg-orange-100 text-orange-800"
      case "non_compliant":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "at_risk":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "due_soon":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "non_compliant":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || emp.role === roleFilter
    const matchesCompliance = complianceFilter === "all" || emp.status === complianceFilter
    return matchesSearch && matchesRole && matchesCompliance
  })

  const complianceStats = {
    total: employees.length,
    compliant: employees.filter((e) => e.status === "compliant").length,
    atRisk: employees.filter((e) => e.status === "at_risk").length,
    dueSoon: employees.filter((e) => e.status === "due_soon").length,
    nonCompliant: employees.filter((e) => e.status === "non_compliant").length,
    lockedOut: employees.filter((e) => e.workRestrictions.length > 0).length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Continuing Education & Compliance</h1>
                <p className="text-gray-600">State-compliant CEU tracking and mandatory training management</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Certificate
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload CEU Certificate</DialogTitle>
                    <DialogDescription>Upload a continuing education certificate for verification</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="employee">Employee</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.name} ({emp.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="title">Course Title</Label>
                      <Input id="title" placeholder="Enter course title" />
                    </div>
                    <div>
                      <Label htmlFor="provider">Provider</Label>
                      <Input id="provider" placeholder="Training provider name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="completion-date">Completion Date</Label>
                        <Input id="completion-date" type="date" />
                      </div>
                      <div>
                        <Label htmlFor="hours">Hours Earned</Label>
                        <Input id="hours" type="number" step="0.5" placeholder="0.0" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="certificate">Certificate File</Label>
                      <Input id="certificate" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setUploadDialogOpen(false)}>Upload Certificate</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employees">Employee Tracking</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            <TabsTrigger value="requirements">State Requirements</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Compliance Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{complianceStats.total}</div>
                  <div className="text-sm text-gray-600">Total Staff</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{complianceStats.compliant}</div>
                  <div className="text-sm text-gray-600">Compliant</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{complianceStats.atRisk}</div>
                  <div className="text-sm text-gray-600">At Risk</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{complianceStats.dueSoon}</div>
                  <div className="text-sm text-gray-600">Due Soon</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{complianceStats.nonCompliant}</div>
                  <div className="text-sm text-gray-600">Non-Compliant</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{complianceStats.lockedOut}</div>
                  <div className="text-sm text-gray-600">Locked Out</div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts and Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                    Urgent Actions Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {employees
                    .filter((emp) => emp.status === "non_compliant" || emp.workRestrictions.length > 0)
                    .map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-red-800">{emp.name}</p>
                          <p className="text-sm text-red-600">
                            {emp.status === "non_compliant" && "CEU requirements overdue"}
                            {emp.workRestrictions.length > 0 && " • Work restrictions active"}
                          </p>
                        </div>
                        <Badge className="bg-red-100 text-red-800">
                          {emp.status === "non_compliant" ? "Overdue" : "Restricted"}
                        </Badge>
                      </div>
                    ))}
                  {employees.filter((emp) => emp.status === "non_compliant" || emp.workRestrictions.length > 0)
                    .length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      No urgent actions required
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-orange-500" />
                    Due Soon (Next 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {employees
                    .filter((emp) => emp.status === "due_soon" && emp.daysUntilDue <= 30)
                    .map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div>
                          <p className="font-medium text-orange-800">{emp.name}</p>
                          <p className="text-sm text-orange-600">
                            {emp.requiredHours - emp.completedHours} hours needed in {emp.daysUntilDue} days
                          </p>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800">{emp.daysUntilDue} days</Badge>
                      </div>
                    ))}
                  {employees.filter((emp) => emp.status === "due_soon" && emp.daysUntilDue <= 30).length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      No CEUs due in next 30 days
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Compliance Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Compliance Rate</CardTitle>
                <CardDescription>Percentage of staff meeting CEU requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">
                      {Math.round((complianceStats.compliant / complianceStats.total) * 100)}% Compliant
                    </span>
                    <span className="text-sm text-gray-600">
                      {complianceStats.compliant} of {complianceStats.total} employees
                    </span>
                  </div>
                  <Progress value={(complianceStats.compliant / complianceStats.total) * 100} className="h-3" />
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-green-600 font-medium">{complianceStats.compliant}</div>
                      <div className="text-gray-500">Compliant</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-600 font-medium">{complianceStats.atRisk}</div>
                      <div className="text-gray-500">At Risk</div>
                    </div>
                    <div className="text-center">
                      <div className="text-orange-600 font-medium">{complianceStats.dueSoon}</div>
                      <div className="text-gray-500">Due Soon</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-600 font-medium">{complianceStats.nonCompliant}</div>
                      <div className="text-gray-500">Overdue</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="RN">RN</SelectItem>
                        <SelectItem value="LPN">LPN</SelectItem>
                        <SelectItem value="CNA">CNA</SelectItem>
                        <SelectItem value="PT">PT</SelectItem>
                        <SelectItem value="PTA">PTA</SelectItem>
                        <SelectItem value="OT">OT</SelectItem>
                        <SelectItem value="HHA">HHA</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Compliance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="compliant">Compliant</SelectItem>
                        <SelectItem value="at_risk">At Risk</SelectItem>
                        <SelectItem value="due_soon">Due Soon</SelectItem>
                        <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee List */}
            <div className="space-y-4">
              {filteredEmployees.map((employee) => (
                <Card key={employee.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{employee.name}</h3>
                            <Badge variant="outline">{employee.role}</Badge>
                            {employee.workRestrictions.length > 0 && (
                              <Badge className="bg-red-100 text-red-800">
                                <Lock className="h-3 w-3 mr-1" />
                                Restricted
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>
                              {employee.completedHours} / {employee.requiredHours} hours completed
                            </span>
                            <span>•</span>
                            <span>
                              {employee.daysUntilDue > 0
                                ? `${employee.daysUntilDue} days remaining`
                                : `${Math.abs(employee.daysUntilDue)} days overdue`}
                            </span>
                          </div>
                          <div className="mt-2">
                            <Progress
                              value={(employee.completedHours / employee.requiredHours) * 100}
                              className="h-2 w-64"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(employee.status)}
                          <Badge className={getStatusColor(employee.status)}>
                            {employee.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSelectedEmployee(employee)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="onboarding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mandatory Onboarding Modules</CardTitle>
                <CardDescription>Required training for all new employees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {onboardingModules.map((module) => (
                    <div key={module.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{module.title}</h3>
                            {module.required && <Badge className="bg-red-100 text-red-800">Required</Badge>}
                            {module.roles && <Badge variant="outline">{module.roles.join(", ")} only</Badge>}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {module.estimatedTime} minutes
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Due within {module.dueWithin} days
                            </span>
                            <span className="flex items-center">
                              <BookOpen className="h-3 w-3 mr-1" />
                              {module.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Onboarding Progress by Employee */}
            <Card>
              <CardHeader>
                <CardTitle>Employee Onboarding Progress</CardTitle>
                <CardDescription>Track completion of mandatory training modules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.map((employee) => (
                    <div key={employee.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{employee.name}</h3>
                              <Badge variant="outline">{employee.role}</Badge>
                              {employee.onboardingStatus.completed ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Complete
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  <Clock className="h-3 w-3 mr-1" />
                                  In Progress
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {employee.onboardingStatus.completedModules} of {employee.onboardingStatus.totalModules}{" "}
                              modules completed
                              {employee.onboardingStatus.completionDate &&
                                ` • Completed ${employee.onboardingStatus.completionDate}`}
                            </div>
                            <div className="mt-2">
                              <Progress
                                value={
                                  (employee.onboardingStatus.completedModules /
                                    employee.onboardingStatus.totalModules) *
                                  100
                                }
                                className="h-2 w-64"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!employee.onboardingStatus.completed && employee.workRestrictions.length > 0 && (
                            <Badge className="bg-red-100 text-red-800">
                              <Lock className="h-3 w-3 mr-1" />
                              Work Restricted
                            </Badge>
                          )}
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Progress
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Michigan State CEU Requirements</CardTitle>
                <CardDescription>Continuing education requirements by professional role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(stateRequirements.michigan).map(([role, req]) => (
                    <div key={role} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-lg">{role}</h3>
                        <Badge variant="outline">{req.period}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Required Hours:</span>
                          <span className="font-medium">{req.hours}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Period:</span>
                          <span className="font-medium">{req.period}</span>
                        </div>
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <p className="text-sm">{req.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Enforcement Rules</CardTitle>
                <CardDescription>Automatic restrictions and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <h3 className="font-medium">30 Days Before Due Date</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      System flags employee as "Due Soon" and sends email reminder to complete CEU requirements.
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <h3 className="font-medium">Past Due Date</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Employee marked as "Non-Compliant" and automatically restricted from:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 mt-2 ml-4">
                      <li>New patient assignments</li>
                      <li>Shift scheduling</li>
                      <li>Payroll processing</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Unlock className="h-5 w-5 text-green-500" />
                      <h3 className="font-medium">Compliance Restoration</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Once CEU requirements are met and certificates verified, all restrictions are automatically lifted
                      and employee returns to active status.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Reports</CardTitle>
                  <CardDescription>Generate reports for audits and surveys</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    CEU Compliance Summary
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Users className="h-4 w-4 mr-2" />
                    Employee Training Records
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Calendar className="h-4 w-4 mr-2" />
                    Upcoming Expiration Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Shield className="h-4 w-4 mr-2" />
                    State Audit Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Award className="h-4 w-4 mr-2" />
                    Certificate Verification Log
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analytics Dashboard</CardTitle>
                  <CardDescription>Training and compliance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Compliance Rate</span>
                      <span className="text-2xl font-bold text-green-600">87%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Certificates Uploaded This Month</span>
                      <span className="text-2xl font-bold text-blue-600">24</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Hours Per Employee</span>
                      <span className="text-2xl font-bold text-purple-600">18.3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Onboarding Completion Rate</span>
                      <span className="text-2xl font-bold text-orange-600">92%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>Download reports in various formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex-col bg-transparent">
                    <Download className="h-6 w-6 mb-2" />
                    <span>Excel Report</span>
                    <span className="text-xs text-gray-500">Detailed spreadsheet</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col bg-transparent">
                    <FileText className="h-6 w-6 mb-2" />
                    <span>PDF Summary</span>
                    <span className="text-xs text-gray-500">Executive overview</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col bg-transparent">
                    <TrendingUp className="h-6 w-6 mb-2" />
                    <span>Analytics Dashboard</span>
                    <span className="text-xs text-gray-500">Interactive charts</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Employee Detail Modal */}
        {selectedEmployee && (
          <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedEmployee.name} - CEU Details</span>
                  <Badge className={getStatusColor(selectedEmployee.status)}>
                    {selectedEmployee.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedEmployee.role} • Hired {selectedEmployee.hireDate}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* CEU Progress */}
                <div>
                  <h4 className="font-medium mb-3">CEU Progress</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Required Hours</Label>
                      <p className="text-2xl font-bold">{selectedEmployee.requiredHours}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Completed Hours</Label>
                      <p className="text-2xl font-bold text-green-600">{selectedEmployee.completedHours}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Remaining Hours</Label>
                      <p className="text-2xl font-bold text-blue-600">
                        {Math.max(0, selectedEmployee.requiredHours - selectedEmployee.completedHours)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>
                        {Math.round((selectedEmployee.completedHours / selectedEmployee.requiredHours) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(selectedEmployee.completedHours / selectedEmployee.requiredHours) * 100}
                      className="h-3"
                    />
                  </div>
                </div>

                {/* Work Restrictions */}
                {selectedEmployee.workRestrictions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 text-red-700">Active Work Restrictions</h4>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Lock className="h-5 w-5 text-red-500" />
                        <span className="font-medium text-red-800">Employee is restricted from:</span>
                      </div>
                      <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                        {selectedEmployee.workRestrictions.map((restriction: string) => (
                          <li key={restriction}>
                            {restriction === "scheduling" && "New shift scheduling"}
                            {restriction === "payroll" && "Payroll processing"}
                            {restriction === "patient_assignments" && "New patient assignments"}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-red-600 mt-2">
                        Complete CEU requirements to lift restrictions automatically.
                      </p>
                    </div>
                  </div>
                )}

                {/* Certificates */}
                <div>
                  <h4 className="font-medium mb-3">Completed Certificates</h4>
                  <div className="space-y-3">
                    {selectedEmployee.certificates.map((cert: any) => (
                      <div key={cert.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">{cert.title}</h5>
                            <p className="text-sm text-gray-600">{cert.provider}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span>Completed: {cert.completionDate}</span>
                              <span>Hours: {cert.hoursEarned}</span>
                              <span>Cert #: {cert.certificateNumber}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {cert.status}
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Onboarding Status */}
                <div>
                  <h4 className="font-medium mb-3">Onboarding Status</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">
                        {selectedEmployee.onboardingStatus.completedModules} of{" "}
                        {selectedEmployee.onboardingStatus.totalModules} modules completed
                      </span>
                      {selectedEmployee.onboardingStatus.completed ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <Progress
                      value={
                        (selectedEmployee.onboardingStatus.completedModules /
                          selectedEmployee.onboardingStatus.totalModules) *
                        100
                      }
                      className="h-2"
                    />
                    {selectedEmployee.onboardingStatus.completionDate && (
                      <p className="text-sm text-gray-600 mt-2">
                        Completed on {selectedEmployee.onboardingStatus.completionDate}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Certificate
                    </Button>
                    <Button variant="outline" size="sm">
                      <Bell className="h-4 w-4 mr-2" />
                      Send Reminder
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Record
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Print Summary
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  )
}
