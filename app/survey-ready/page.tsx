"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
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
  Download,
  FileText,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Package,
  Building,
  Heart,
  Phone,
  DollarSign,
  FileCheck,
  Calendar,
  BarChart3,
  Lock,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Archive,
  Scale,
} from "lucide-react"
import Link from "next/link"

export default function SurveyReadyDashboard() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Mock data for survey sections
  const surveyData = {
    censusReports: {
      lastUpdated: "2024-01-15",
      totalPatients: 247,
      duplicatedCount: 247,
      unduplicated: 189,
      weeklyReports: [
        { week: "Week 1 - Jan 2024", duplicated: 245, unduplicated: 187, status: "complete" },
        { week: "Week 2 - Jan 2024", duplicated: 247, unduplicated: 189, status: "complete" },
        { week: "Week 3 - Jan 2024", duplicated: 249, unduplicated: 191, status: "complete" },
        { week: "Week 4 - Jan 2024", duplicated: 251, unduplicated: 193, status: "pending" },
      ],
    },
    hrFiles: {
      totalEmployees: 156,
      activeEmployees: 152,
      complianceRate: 94.2,
      lastAudit: "2024-01-10",
      categories: [
        { name: "Full-time Staff", count: 124, compliance: 96 },
        { name: "Part-time Staff", count: 28, compliance: 89 },
        { name: "Contract Staff", count: 4, compliance: 100 },
      ],
    },
    inServiceEducation: {
      totalHours: 2847,
      completionRate: 87.3,
      requiredHours: 20,
      lastUpdated: "2024-01-14",
      upcomingDue: 23,
      modules: [
        { name: "HIPAA Privacy & Security", completion: 98, required: true },
        { name: "Infection Control", completion: 94, required: true },
        { name: "Emergency Procedures", completion: 89, required: true },
        { name: "Medication Safety", completion: 92, required: true },
        { name: "Documentation Standards", completion: 85, required: false },
      ],
    },
    policies: {
      totalPolicies: 127,
      lastReview: "2024-01-01",
      categories: [
        { name: "Clinical Policies", count: 45, lastUpdate: "2024-01-01" },
        { name: "HR Policies", count: 32, lastUpdate: "2023-12-15" },
        { name: "Safety Policies", count: 28, lastUpdate: "2024-01-05" },
        { name: "Administrative Policies", count: 22, lastUpdate: "2023-11-20" },
      ],
    },
    patientPacket: {
      forms: [
        { name: "Consent for Treatment", status: "current", lastUpdate: "2024-01-01" },
        { name: "HIPAA Authorization", status: "current", lastUpdate: "2024-01-01" },
        { name: "Financial Disclosure", status: "current", lastUpdate: "2023-12-01" },
        { name: "Patient Handbook", status: "current", lastUpdate: "2024-01-01" },
        { name: "Rights & Responsibilities", status: "current", lastUpdate: "2024-01-01" },
      ],
    },
    qapiReports: {
      lastQuarter: "Q4 2023",
      nextDue: "2024-04-01",
      meetingMinutes: 4,
      pipPlans: 3,
      performanceMetrics: {
        patientSatisfaction: 4.6,
        careQuality: 92,
        incidentRate: 0.8,
        complianceScore: 96,
      },
    },
    incidentLog: {
      totalIncidents: 12,
      resolved: 9,
      pending: 3,
      lastIncident: "2024-01-12",
      categories: [
        { type: "Medication Error", count: 4, severity: "Low" },
        { type: "Fall Risk", count: 3, severity: "Medium" },
        { type: "Documentation", count: 3, severity: "Low" },
        { type: "Equipment", count: 2, severity: "Medium" },
      ],
    },
    emergencyPreparedness: {
      lastDrill: "2023-12-15",
      nextDrill: "2024-03-15",
      planLastUpdated: "2024-01-01",
      drillsCompleted: 4,
      staffTrained: 98,
    },
  }

  const surveySections = [
    {
      id: "census",
      title: "Census Reports",
      description: "Weekly patient census data (duplicated/unduplicated)",
      icon: BarChart3,
      status: "complete",
      lastUpdated: surveyData.censusReports.lastUpdated,
      color: "bg-blue-500",
      data: surveyData.censusReports,
    },
    {
      id: "hr-files",
      title: "HR Files",
      description: "Employee records and compliance documentation",
      icon: Users,
      status: "complete",
      lastUpdated: surveyData.hrFiles.lastAudit,
      color: "bg-green-500",
      data: surveyData.hrFiles,
    },
    {
      id: "education",
      title: "In-Service Education",
      description: "Training completion and certification records",
      icon: FileCheck,
      status: "complete",
      lastUpdated: surveyData.inServiceEducation.lastUpdated,
      color: "bg-purple-500",
      data: surveyData.inServiceEducation,
    },
    {
      id: "policies",
      title: "Policy & Procedure Manual",
      description: "Clinical, HR, safety, and administrative policies",
      icon: FileText,
      status: "complete",
      lastUpdated: surveyData.policies.lastReview,
      color: "bg-orange-500",
      data: surveyData.policies,
    },
    {
      id: "patient-packet",
      title: "Patient Opening Packet",
      description: "Consent forms, HIPAA, financial disclosure, handbook",
      icon: Heart,
      status: "complete",
      lastUpdated: "2024-01-01",
      color: "bg-red-500",
      data: surveyData.patientPacket,
    },
    {
      id: "qapi",
      title: "QAPI / QA Reports",
      description: "Quality assurance and performance improvement",
      icon: Shield,
      status: "complete",
      lastUpdated: "2024-01-01",
      color: "bg-indigo-500",
      data: surveyData.qapiReports,
    },
    {
      id: "incidents",
      title: "Incident Log",
      description: "Incident reporting and resolution tracking",
      icon: AlertTriangle,
      status: "complete",
      lastUpdated: surveyData.incidentLog.lastIncident,
      color: "bg-yellow-500",
      data: surveyData.incidentLog,
    },
    {
      id: "emergency",
      title: "Emergency Preparedness",
      description: "Emergency plans, drills, and staff training",
      icon: Phone,
      status: "complete",
      lastUpdated: surveyData.emergencyPreparedness.planLastUpdated,
      color: "bg-teal-500",
      data: surveyData.emergencyPreparedness,
    },
    {
      id: "emergency-binder",
      title: "Emergency Binder",
      description: "Code charts, floor plans, contact tree",
      icon: Archive,
      status: "complete",
      lastUpdated: "2024-01-01",
      color: "bg-cyan-500",
    },
    {
      id: "corporate",
      title: "Corporate Binder",
      description: "Licenses, org chart, insurance, board minutes",
      icon: Building,
      status: "complete",
      lastUpdated: "2023-12-01",
      color: "bg-gray-500",
    },
    {
      id: "ethical",
      title: "Ethical Binder",
      description: "Code of ethics, COI forms, grievance log",
      icon: Scale,
      status: "complete",
      lastUpdated: "2024-01-01",
      color: "bg-pink-500",
    },
    {
      id: "contracts",
      title: "Contracts Binder",
      description: "Staffing/vendor contracts, BAAs",
      icon: FileText,
      status: "complete",
      lastUpdated: "2023-11-15",
      color: "bg-violet-500",
    },
    {
      id: "tax",
      title: "IRS / Tax Binder",
      description: "EIN, W-2/W-3, 941s, CPA files, IRS letters",
      icon: DollarSign,
      status: "complete",
      lastUpdated: "2023-12-31",
      color: "bg-emerald-500",
    },
    {
      id: "insurance",
      title: "Insurance / ADR Binder",
      description: "ADR requests, appeal letters, audit logs",
      icon: Shield,
      status: "complete",
      lastUpdated: "2024-01-05",
      color: "bg-rose-500",
    },
    {
      id: "homecare-orders",
      title: "Home Care Orders",
      description: "POC compliance, order tracking, and corrective actions",
      icon: FileCheck,
      status: "complete",
      lastUpdated: "2024-01-16",
      color: "bg-indigo-600",
      data: {
        totalOrders: 1247,
        pocSigned: 1189,
        lateOrders: 23,
        complianceRate: 95.3,
        pendingSignatures: 35,
        correctiveActions: 12,
        lastOrderDate: "2024-01-16",
        averageSigningTime: "2.3 days",
        ordersByType: [
          { type: "Initial POC", count: 156, compliance: 97.4 },
          { type: "Recertification", count: 234, compliance: 94.8 },
          { type: "Significant Change", count: 89, compliance: 92.1 },
          { type: "Discharge Summary", count: 67, compliance: 98.5 },
        ],
        recentCorrectiveActions: [
          {
            id: "CA-001",
            date: "2024-01-15",
            issue: "Late POC Signature - Dr. Martinez",
            action: "Contacted physician office, implemented reminder system",
            status: "Resolved",
            daysToResolve: 2,
          },
          {
            id: "CA-002",
            date: "2024-01-12",
            issue: "Missing medication list on POC",
            action: "Updated template, staff re-training completed",
            status: "Resolved",
            daysToResolve: 3,
          },
          {
            id: "CA-003",
            date: "2024-01-10",
            issue: "Incomplete discharge summary",
            action: "Revised documentation process, quality check added",
            status: "In Progress",
            daysToResolve: null,
          },
        ],
      },
    },
  ]

  const generateSurveyBundle = async () => {
    setIsExporting(true)

    // Simulate export process
    try {
      // In a real implementation, this would call an API to generate the bundle
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Create a mock download
      const element = document.createElement("a")
      element.href = "data:text/plain;charset=utf-8," + encodeURIComponent("Survey Bundle Generated")
      element.download = `Survey_Bundle_${new Date().toISOString().split("T")[0]}.zip`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return <Badge className="bg-green-100 text-green-800">Complete</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const filteredSections = surveySections.filter(
    (section) =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Lock className="h-6 w-6 mr-2 text-blue-600" />
                  Survey Ready Dashboard
                </h1>
                <p className="text-gray-600">Homecare Accreditation & Licensing - Secure State Surveyor Access</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button onClick={generateSurveyBundle} disabled={isExporting} className="bg-blue-600 hover:bg-blue-700">
                {isExporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Generate Survey Bundle
                  </>
                )}
              </Button>
              <Button variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print Summary
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Survey Overview</TabsTrigger>
            <TabsTrigger value="sections">All Sections</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Summary</TabsTrigger>
            <TabsTrigger value="audit-log">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Survey Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">14</p>
                      <p className="text-gray-600 text-sm">Complete Sections</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">156</p>
                      <p className="text-gray-600 text-sm">Total Employees</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Heart className="h-8 w-8 text-red-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">247</p>
                      <p className="text-gray-600 text-sm">Active Patients</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Shield className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">94.2%</p>
                      <p className="text-gray-600 text-sm">Compliance Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileCheck className="h-8 w-8 text-indigo-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">95.3%</p>
                      <p className="text-gray-600 text-sm">POC Compliance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Access to Key Sections */}
            <Card>
              <CardHeader>
                <CardTitle>Key Survey Sections</CardTitle>
                <CardDescription>Quick access to most frequently reviewed sections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {surveySections.slice(0, 6).map((section) => (
                    <div
                      key={section.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedSection(section.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 ${section.color} rounded-lg flex items-center justify-center`}>
                            <section.icon className="h-4 w-4 text-white" />
                          </div>
                          <h3 className="font-medium">{section.title}</h3>
                        </div>
                        {getStatusBadge(section.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{section.description}</p>
                      <p className="text-xs text-gray-500">Last updated: {section.lastUpdated}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compliance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Status</CardTitle>
                  <CardDescription>Current compliance across all areas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>HR Documentation</span>
                        <span>94.2%</span>
                      </div>
                      <Progress value={94.2} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Training Completion</span>
                        <span>87.3%</span>
                      </div>
                      <Progress value={87.3} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Policy Updates</span>
                        <span>98.4%</span>
                      </div>
                      <Progress value={98.4} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Quality Metrics</span>
                        <span>92.0%</span>
                      </div>
                      <Progress value={92.0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Updates</CardTitle>
                  <CardDescription>Latest changes and additions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Census Report Updated</p>
                        <p className="text-xs text-gray-600">Week 2 - January 2024</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Policy Manual Reviewed</p>
                        <p className="text-xs text-gray-600">Clinical policies updated</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <Users className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">Training Completed</p>
                        <p className="text-xs text-gray-600">15 staff members - HIPAA</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sections" className="space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search sections..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* All Survey Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSections.map((section) => (
                <Card key={section.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${section.color} rounded-lg flex items-center justify-center`}>
                          <section.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">{section.title}</h3>
                          {getStatusBadge(section.status)}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{section.description}</p>

                    <div className="space-y-2 text-xs text-gray-500 mb-4">
                      <p>Last updated: {section.lastUpdated}</p>
                    </div>

                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center">
                              <section.icon className="h-5 w-5 mr-2" />
                              {section.title}
                            </DialogTitle>
                            <DialogDescription>{section.description}</DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            {section.id === "census" && section.data && (
                              <div>
                                <h4 className="font-medium mb-3">Census Data Summary</h4>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="p-3 bg-blue-50 rounded">
                                    <p className="text-sm font-medium">Total Patients</p>
                                    <p className="text-2xl font-bold text-blue-600">{section.data.totalPatients}</p>
                                  </div>
                                  <div className="p-3 bg-green-50 rounded">
                                    <p className="text-sm font-medium">Unduplicated</p>
                                    <p className="text-2xl font-bold text-green-600">{section.data.unduplicated}</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h5 className="font-medium">Weekly Reports</h5>
                                  {section.data.weeklyReports.map((report: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                    >
                                      <span className="text-sm">{report.week}</span>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs">
                                          D: {report.duplicated} | U: {report.unduplicated}
                                        </span>
                                        <Badge variant={report.status === "complete" ? "default" : "secondary"}>
                                          {report.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {section.id === "hr-files" && section.data && (
                              <div>
                                <h4 className="font-medium mb-3">HR Files Summary</h4>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                  <div className="p-3 bg-blue-50 rounded text-center">
                                    <p className="text-2xl font-bold text-blue-600">{section.data.totalEmployees}</p>
                                    <p className="text-sm">Total Employees</p>
                                  </div>
                                  <div className="p-3 bg-green-50 rounded text-center">
                                    <p className="text-2xl font-bold text-green-600">{section.data.activeEmployees}</p>
                                    <p className="text-sm">Active</p>
                                  </div>
                                  <div className="p-3 bg-purple-50 rounded text-center">
                                    <p className="text-2xl font-bold text-purple-600">{section.data.complianceRate}%</p>
                                    <p className="text-sm">Compliance</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h5 className="font-medium">Staff Categories</h5>
                                  {section.data.categories.map((category: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                    >
                                      <span className="text-sm">{category.name}</span>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs">{category.count} staff</span>
                                        <Badge variant="outline">{category.compliance}% compliant</Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {section.id === "education" && section.data && (
                              <div>
                                <h4 className="font-medium mb-3">Training Summary</h4>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="p-3 bg-purple-50 rounded">
                                    <p className="text-sm font-medium">Completion Rate</p>
                                    <p className="text-2xl font-bold text-purple-600">{section.data.completionRate}%</p>
                                  </div>
                                  <div className="p-3 bg-orange-50 rounded">
                                    <p className="text-sm font-medium">Total Hours</p>
                                    <p className="text-2xl font-bold text-orange-600">{section.data.totalHours}</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h5 className="font-medium">Training Modules</h5>
                                  {section.data.modules.map((module: any, index: number) => (
                                    <div key={index} className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm">{module.name}</span>
                                        <div className="flex items-center space-x-2">
                                          <span className="text-xs">{module.completion}%</span>
                                          {module.required && (
                                            <Badge variant="destructive" className="text-xs">
                                              Required
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <Progress value={module.completion} className="h-1" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {section.id === "homecare-orders" && section.data && (
                              <div>
                                <h4 className="font-medium mb-3">Home Care Orders Summary</h4>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="p-3 bg-indigo-50 rounded">
                                    <p className="text-sm font-medium">Total Orders</p>
                                    <p className="text-2xl font-bold text-indigo-600">{section.data.totalOrders}</p>
                                  </div>
                                  <div className="p-3 bg-green-50 rounded">
                                    <p className="text-sm font-medium">POC Signed</p>
                                    <p className="text-2xl font-bold text-green-600">{section.data.pocSigned}</p>
                                  </div>
                                  <div className="p-3 bg-red-50 rounded">
                                    <p className="text-sm font-medium">Late Orders</p>
                                    <p className="text-2xl font-bold text-red-600">{section.data.lateOrders}</p>
                                  </div>
                                  <div className="p-3 bg-purple-50 rounded">
                                    <p className="text-sm font-medium">Compliance Rate</p>
                                    <p className="text-2xl font-bold text-purple-600">{section.data.complianceRate}%</p>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <h5 className="font-medium mb-2">Orders by Type</h5>
                                    {section.data.ordersByType.map((orderType: any, index: number) => (
                                      <div key={index} className="space-y-1 mb-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm">{orderType.type}</span>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-xs">{orderType.count} orders</span>
                                            <Badge variant="outline">{orderType.compliance}%</Badge>
                                          </div>
                                        </div>
                                        <Progress value={orderType.compliance} className="h-1" />
                                      </div>
                                    ))}
                                  </div>

                                  <div>
                                    <h5 className="font-medium mb-2">Recent Corrective Actions</h5>
                                    {section.data.recentCorrectiveActions.map((action: any, index: number) => (
                                      <div key={index} className="p-3 border rounded-lg mb-2">
                                        <div className="flex justify-between items-start mb-2">
                                          <div>
                                            <p className="text-sm font-medium">{action.id}</p>
                                            <p className="text-xs text-gray-600">{action.date}</p>
                                          </div>
                                          <Badge variant={action.status === "Resolved" ? "default" : "secondary"}>
                                            {action.status}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-gray-700 mb-1">
                                          <strong>Issue:</strong> {action.issue}
                                        </p>
                                        <p className="text-sm text-gray-700 mb-1">
                                          <strong>Action:</strong> {action.action}
                                        </p>
                                        {action.daysToResolve && (
                                          <p className="text-xs text-gray-500">
                                            Resolved in {action.daysToResolve} days
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end space-x-2 pt-4 border-t">
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export Section
                              </Button>
                              <Button variant="outline" size="sm">
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            {/* Compliance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Compliance Summary</CardTitle>
                <CardDescription>Comprehensive compliance status across all survey areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">94.2%</p>
                    <p className="text-sm text-gray-600">Overall Compliance</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">152</p>
                    <p className="text-sm text-gray-600">Compliant Staff</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <FileCheck className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">127</p>
                    <p className="text-sm text-gray-600">Current Policies</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Calendar className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-600">87.3%</p>
                    <p className="text-sm text-gray-600">Training Complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Compliance Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { category: "HR Documentation", score: 94.2, color: "bg-green-500" },
                      { category: "Training & Education", score: 87.3, color: "bg-blue-500" },
                      { category: "Policy Compliance", score: 98.4, color: "bg-purple-500" },
                      { category: "Quality Metrics", score: 92.0, color: "bg-orange-500" },
                      { category: "Emergency Preparedness", score: 89.7, color: "bg-teal-500" },
                      { category: "Patient Documentation", score: 96.1, color: "bg-red-500" },
                      { category: "Home Care Orders", score: 95.3, color: "bg-indigo-500" },
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{item.category}</span>
                          <span className="text-sm font-bold">{item.score}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.score}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Action Items</CardTitle>
                  <CardDescription>Items requiring attention for full compliance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Training Overdue</p>
                        <p className="text-xs text-gray-600">23 staff members have training due</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Policy Review Due</p>
                        <p className="text-xs text-gray-600">Administrative policies need quarterly review</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Emergency Drill Scheduled</p>
                        <p className="text-xs text-gray-600">Next drill scheduled for March 15, 2024</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audit-log" className="space-y-6">
            {/* Audit Log */}
            <Card>
              <CardHeader>
                <CardTitle>Survey Access Audit Log</CardTitle>
                <CardDescription>Read-only access log with timestamps and user details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      timestamp: "2024-01-15 14:30:22",
                      user: "State Surveyor - J. Smith",
                      action: "Viewed HR Files Section",
                      ip: "192.168.1.100",
                      duration: "15 minutes",
                    },
                    {
                      timestamp: "2024-01-15 14:15:10",
                      user: "State Surveyor - J. Smith",
                      action: "Generated Survey Bundle",
                      ip: "192.168.1.100",
                      duration: "2 minutes",
                    },
                    {
                      timestamp: "2024-01-15 14:00:05",
                      user: "State Surveyor - J. Smith",
                      action: "Logged into Survey Dashboard",
                      ip: "192.168.1.100",
                      duration: "Active",
                    },
                    {
                      timestamp: "2024-01-14 10:45:33",
                      user: "Accreditation Reviewer - M. Johnson",
                      action: "Exported Census Reports",
                      ip: "10.0.0.50",
                      duration: "8 minutes",
                    },
                    {
                      timestamp: "2024-01-14 10:30:15",
                      user: "Accreditation Reviewer - M. Johnson",
                      action: "Reviewed QAPI Documentation",
                      ip: "10.0.0.50",
                      duration: "25 minutes",
                    },
                  ].map((log, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-sm">{log.action}</p>
                          <p className="text-xs text-gray-600">{log.user}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{log.timestamp}</p>
                        <p className="text-xs text-gray-600">
                          IP: {log.ip} • {log.duration}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Access Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Eye className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">47</p>
                  <p className="text-sm text-gray-600">Total Views Today</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Download className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-gray-600">Downloads Today</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-sm text-gray-600">Active Surveyors</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
