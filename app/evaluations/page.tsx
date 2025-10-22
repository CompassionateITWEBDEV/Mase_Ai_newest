"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Target,
  Award,
  Video,
  FileText,
  Plus,
  Filter,
  CheckCircle,
  AlertTriangle,
  Star,
  Users,
  TrendingUp,
  Shield,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"

interface EvaluationRecord {
  id: string
  staffName: string
  staffRole: string
  evaluationType: "competency" | "performance"
  assessmentType: "initial" | "annual" | "skills-validation" | "performance-improvement" | "mid-year" | "probationary"
  status: "excellent" | "good" | "satisfactory" | "needs-improvement" | "unsatisfactory" | "in-progress"
  overallScore?: number
  evaluatorName: string
  completedDate: string
  nextDue?: string
  priority: "high" | "medium" | "low"
}

interface StaffMember {
  id: string
  name: string
  role: string
  department: string
  hireDate: string
  avatar: string
}

export default function EvaluationsPage() {
  const [currentUser] = useState(getCurrentUser())
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedStaffMember, setSelectedStaffMember] = useState("")
  const [selectedEvaluationType, setSelectedEvaluationType] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // Mock data for evaluation history
  const evaluationHistory: EvaluationRecord[] = [
    {
      id: "EVAL-001",
      staffName: "Sarah Johnson",
      staffRole: "RN",
      evaluationType: "performance",
      assessmentType: "annual",
      status: "excellent",
      overallScore: 95,
      evaluatorName: "Dr. Martinez",
      completedDate: "2024-01-15",
      nextDue: "2025-01-15",
      priority: "low",
    },
    {
      id: "COMP-001",
      staffName: "Sarah Johnson",
      staffRole: "RN",
      evaluationType: "competency",
      assessmentType: "skills-validation",
      status: "excellent",
      overallScore: 92,
      evaluatorName: "Dr. Martinez",
      completedDate: "2024-01-10",
      nextDue: "2024-07-10",
      priority: "medium",
    },
    {
      id: "EVAL-002",
      staffName: "Michael Chen",
      staffRole: "PT",
      evaluationType: "performance",
      assessmentType: "mid-year",
      status: "good",
      overallScore: 88,
      evaluatorName: "Jane Smith",
      completedDate: "2024-01-14",
      nextDue: "2024-07-14",
      priority: "low",
    },
    {
      id: "COMP-002",
      staffName: "Michael Chen",
      staffRole: "PT",
      evaluationType: "competency",
      assessmentType: "annual",
      status: "good",
      overallScore: 85,
      evaluatorName: "Jane Smith",
      completedDate: "2024-01-12",
      nextDue: "2025-01-12",
      priority: "medium",
    },
    {
      id: "EVAL-003",
      staffName: "Emily Davis",
      staffRole: "OT",
      evaluationType: "performance",
      assessmentType: "probationary",
      status: "satisfactory",
      overallScore: 78,
      evaluatorName: "Patricia Wilson",
      completedDate: "2024-01-08",
      nextDue: "2024-04-08",
      priority: "high",
    },
    {
      id: "COMP-003",
      staffName: "Emily Davis",
      staffRole: "OT",
      evaluationType: "competency",
      assessmentType: "initial",
      status: "needs-improvement",
      overallScore: 72,
      evaluatorName: "Patricia Wilson",
      completedDate: "2024-01-05",
      nextDue: "2024-02-05",
      priority: "high",
    },
    {
      id: "EVAL-004",
      staffName: "Lisa Garcia",
      staffRole: "LPN",
      evaluationType: "performance",
      assessmentType: "annual",
      status: "good",
      overallScore: 84,
      evaluatorName: "Sarah Johnson",
      completedDate: "2024-01-03",
      nextDue: "2025-01-03",
      priority: "low",
    },
    {
      id: "COMP-004",
      staffName: "Lisa Garcia",
      staffRole: "LPN",
      evaluationType: "competency",
      assessmentType: "skills-validation",
      status: "good",
      overallScore: 86,
      evaluatorName: "Sarah Johnson",
      completedDate: "2024-01-01",
      nextDue: "2024-07-01",
      priority: "medium",
    },
  ]

  // Mock staff members
  const staffMembers: StaffMember[] = [
    {
      id: "staff-001",
      name: "Sarah Johnson",
      role: "RN",
      department: "Clinical",
      hireDate: "2020-01-15",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "staff-002",
      name: "Michael Chen",
      role: "PT",
      department: "Therapy",
      hireDate: "2021-03-20",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "staff-003",
      name: "Emily Davis",
      role: "OT",
      department: "Therapy",
      hireDate: "2023-11-10",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "staff-004",
      name: "Lisa Garcia",
      role: "LPN",
      department: "Clinical",
      hireDate: "2022-06-01",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "staff-005",
      name: "Robert Thompson",
      role: "HHA",
      department: "Personal Care",
      hireDate: "2023-08-15",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "excellent":
        return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
      case "good":
        return <Badge className="bg-blue-100 text-blue-800">Good</Badge>
      case "satisfactory":
        return <Badge className="bg-yellow-100 text-yellow-800">Satisfactory</Badge>
      case "needs-improvement":
        return <Badge className="bg-orange-100 text-orange-800">Needs Improvement</Badge>
      case "unsatisfactory":
        return <Badge className="bg-red-100 text-red-800">Unsatisfactory</Badge>
      case "in-progress":
        return <Badge className="bg-gray-100 text-gray-800">In Progress</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getEvaluationTypeIcon = (type: string) => {
    return type === "competency" ? (
      <Shield className="h-4 w-4 text-blue-600" />
    ) : (
      <TrendingUp className="h-4 w-4 text-green-600" />
    )
  }

  const filteredHistory = evaluationHistory.filter((record) => {
    const matchesSearch =
      record.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.evaluationType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.assessmentType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || record.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const competencyRecords = filteredHistory.filter((r) => r.evaluationType === "competency")
  const performanceRecords = filteredHistory.filter((r) => r.evaluationType === "performance")

  const getOverviewStats = () => {
    const totalEvaluations = evaluationHistory.length
    const completedThisMonth = evaluationHistory.filter((r) => {
      const completedDate = new Date(r.completedDate)
      const now = new Date()
      return completedDate.getMonth() === now.getMonth() && completedDate.getFullYear() === now.getFullYear()
    }).length

    const averageScore =
      evaluationHistory.reduce((sum, record) => sum + (record.overallScore || 0), 0) / totalEvaluations

    const needsAttention = evaluationHistory.filter((r) =>
      ["needs-improvement", "unsatisfactory"].includes(r.status),
    ).length

    return {
      totalEvaluations,
      completedThisMonth,
      averageScore: Math.round(averageScore),
      needsAttention,
    }
  }

  const stats = getOverviewStats()

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
                <h1 className="text-2xl font-bold text-gray-900">Performance Evaluations</h1>
                <p className="text-gray-600">Comprehensive staff performance assessment and development</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                New Evaluation
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
            <TabsTrigger value="video-evaluations">Video Evaluations</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Evaluations</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalEvaluations}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">This Month</p>
                      <p className="text-2xl font-bold text-green-600">{stats.completedThisMonth}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <Star className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Average Score</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.averageScore}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Needs Attention</p>
                      <p className="text-2xl font-bold text-red-600">{stats.needsAttention}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                    Competency Assessments
                  </CardTitle>
                  <CardDescription>Evaluate skills, knowledge, and abilities required for job duties</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Initial Assessments</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {competencyRecords.filter((r) => r.assessmentType === "initial").length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Skills Validations</span>
                      <Badge className="bg-green-100 text-green-800">
                        {competencyRecords.filter((r) => r.assessmentType === "skills-validation").length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Annual Reviews</span>
                      <Badge className="bg-purple-100 text-purple-800">
                        {competencyRecords.filter((r) => r.assessmentType === "annual").length}
                      </Badge>
                    </div>
                    <Link href="/staff-competency">
                      <Button className="w-full mt-4 bg-transparent" variant="outline">
                        <Target className="h-4 w-4 mr-2" />
                        Manage Competency Assessments
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    Performance Evaluations
                  </CardTitle>
                  <CardDescription>Assess actual job performance and productivity over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Annual Reviews</span>
                      <Badge className="bg-green-100 text-green-800">
                        {performanceRecords.filter((r) => r.assessmentType === "annual").length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mid-Year Reviews</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {performanceRecords.filter((r) => r.assessmentType === "mid-year").length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Probationary Reviews</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {performanceRecords.filter((r) => r.assessmentType === "probationary").length}
                      </Badge>
                    </div>
                    <Link href="/self-evaluation">
                      <Button className="w-full mt-4 bg-transparent" variant="outline">
                        <Award className="h-4 w-4 mr-2" />
                        Manage Performance Evaluations
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="evaluations" className="space-y-6">
            {/* Standard Evaluations */}
            <Card>
              <CardHeader>
                <CardTitle>Standard Evaluations</CardTitle>
                <CardDescription>Traditional form-based performance evaluations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label htmlFor="staff-select">Select Staff Member</Label>
                    <Select value={selectedStaffMember} onValueChange={setSelectedStaffMember}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffMembers.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name} - {staff.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="evaluation-type">Evaluation Type</Label>
                    <Select value={selectedEvaluationType} onValueChange={setSelectedEvaluationType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose evaluation type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="competency-initial">Competency - Initial Assessment</SelectItem>
                        <SelectItem value="competency-annual">Competency - Annual Review</SelectItem>
                        <SelectItem value="competency-skills">Competency - Skills Validation</SelectItem>
                        <SelectItem value="performance-annual">Performance - Annual Review</SelectItem>
                        <SelectItem value="performance-midyear">Performance - Mid-Year Review</SelectItem>
                        <SelectItem value="performance-probationary">Performance - Probationary Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  disabled={!selectedStaffMember || !selectedEvaluationType}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Start Standard Evaluation
                </Button>
              </CardContent>
            </Card>

            {/* Evaluation History */}
            <Card>
              <CardHeader>
                <CardTitle>Evaluation History</CardTitle>
                <CardDescription>Complete evaluation records and performance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search staff, type, or assessment..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status-filter">Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="satisfactory">Satisfactory</SelectItem>
                        <SelectItem value="needs-improvement">Needs Improvement</SelectItem>
                        <SelectItem value="unsatisfactory">Unsatisfactory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" className="w-full bg-transparent">
                      <Filter className="h-4 w-4 mr-2" />
                      Apply Filters
                    </Button>
                  </div>
                </div>

                {/* Evaluation Records */}
                <div className="space-y-4">
                  {filteredHistory.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gray-100 rounded-lg">{getEvaluationTypeIcon(record.evaluationType)}</div>
                        <div>
                          <h3 className="font-semibold">{record.staffName}</h3>
                          <p className="text-sm text-gray-600">
                            {record.evaluationType === "competency"
                              ? "Competency Assessment"
                              : "Performance Evaluation"}{" "}
                            - {record.assessmentType.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                          <p className="text-xs text-gray-500">
                            Evaluator: {record.evaluatorName} • Completed: {record.completedDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {record.overallScore && (
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{record.overallScore}%</div>
                            <p className="text-xs text-gray-500">Score</p>
                          </div>
                        )}
                        {getStatusBadge(record.status)}
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="video-evaluations" className="space-y-6">
            {/* Video Evaluation Center */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Video className="h-5 w-5 mr-2" />
                  Video Evaluation Center
                </CardTitle>
                <CardDescription>
                  Conduct live video evaluations with AI-powered analysis and real-time feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Video Setup */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="video-staff">Staff Member</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select staff member" />
                          </SelectTrigger>
                          <SelectContent>
                            {staffMembers.map((staff) => (
                              <SelectItem key={staff.id} value={staff.id}>
                                {staff.name} - {staff.role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="video-type">Evaluation Type</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="competency-skills">Competency - Skills Demonstration</SelectItem>
                            <SelectItem value="competency-clinical">Competency - Clinical Assessment</SelectItem>
                            <SelectItem value="performance-observation">Performance - Direct Observation</SelectItem>
                            <SelectItem value="performance-interaction">Performance - Patient Interaction</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Video Feed Area */}
                    <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                      <div className="text-center text-white">
                        <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Video feed will appear here</p>
                        <p className="text-sm opacity-75">Click "Start Camera" to begin evaluation</p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <Video className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                    </div>

                    {/* Quick Notes */}
                    <div>
                      <Label htmlFor="quick-notes">Quick Notes</Label>
                      <div className="flex space-x-2 mt-1">
                        <Input placeholder="Add timestamped note..." className="flex-1" />
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* AI Insights Panel */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center">
                          <Activity className="h-4 w-4 mr-2 text-purple-600" />
                          AI Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4">AI analysis will appear during recording</p>
                        <div className="space-y-2">
                          <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                            <span className="font-medium text-green-800">✓ Proper hand hygiene observed</span>
                          </div>
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <span className="font-medium text-blue-800">ℹ Patient communication excellent</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Evaluation Checklist
                        </CardTitle>
                        <CardDescription className="text-xs">0/8</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">Proper hand hygiene demonstrated</span>
                            <Badge variant="outline" className="text-xs">
                              Safety
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">Patient identification verified</span>
                            <Badge variant="outline" className="text-xs">
                              Safety
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">Clear communication with patient</span>
                            <Badge variant="outline" className="text-xs">
                              Communication
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">Documentation completed accurately</span>
                            <Badge variant="outline" className="text-xs">
                              Documentation
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">Equipment used properly</span>
                            <Badge variant="outline" className="text-xs">
                              Clinical Skills
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Video Evaluation Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Video className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                      <h3 className="font-semibold mb-2">Live Recording</h3>
                      <p className="text-sm text-gray-600">Real-time video capture with HD quality</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Activity className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                      <h3 className="font-semibold mb-2">AI Analysis</h3>
                      <p className="text-sm text-gray-600">Automated competency and performance analysis</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-3 text-green-600" />
                      <h3 className="font-semibold mb-2">Auto Documentation</h3>
                      <p className="text-sm text-gray-600">Automatic evaluation report generation</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Evaluation Reports
                </CardTitle>
                <CardDescription>Generate comprehensive evaluation reports and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <Shield className="h-6 w-6 text-blue-600 mr-3" />
                        <h3 className="font-semibold">Competency Reports</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Skills assessment and competency validation reports</p>
                      <Button variant="outline" className="w-full bg-transparent">
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <TrendingUp className="h-6 w-6 text-green-600 mr-3" />
                        <h3 className="font-semibold">Performance Reports</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Performance evaluation and productivity analysis</p>
                      <Button variant="outline" className="w-full bg-transparent">
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <Users className="h-6 w-6 text-purple-600 mr-3" />
                        <h3 className="font-semibold">Staff Analytics</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Department and role-based performance analytics</p>
                      <Button variant="outline" className="w-full bg-transparent">
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
