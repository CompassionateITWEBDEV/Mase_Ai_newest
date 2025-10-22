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
import { Textarea } from "@/components/ui/textarea"
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
  Calendar,
  Clock,
  Download,
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
  Eye,
  Edit,
  Plus,
  PlayCircle,
  GraduationCap,
  Target,
  Zap,
} from "lucide-react"
import Link from "next/link"

export default function InServiceEducation() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [selectedTraining, setSelectedTraining] = useState<any>(null)
  const [createTrainingOpen, setCreateTrainingOpen] = useState(false)

  // In-Service Training Library
  const inServiceTrainings = [
    {
      id: "IS-001",
      title: "Advanced Wound Care Management",
      category: "Clinical Skills",
      type: "video_course",
      duration: 120, // minutes
      ceuHours: 2.0,
      description:
        "Comprehensive training on advanced wound assessment, treatment protocols, and documentation requirements",
      targetRoles: ["RN", "LPN"],
      difficulty: "Advanced",
      prerequisites: ["Basic Wound Care"],
      modules: [
        { id: "M1", title: "Wound Assessment Techniques", duration: 30, completed: false },
        { id: "M2", title: "Treatment Protocols", duration: 45, completed: false },
        { id: "M3", title: "Documentation Standards", duration: 25, completed: false },
        { id: "M4", title: "Infection Prevention", duration: 20, completed: false },
      ],
      quiz: {
        questions: 25,
        passingScore: 80,
        attempts: 3,
      },
      accreditation: "ANCC",
      expiryMonths: 24,
      mandatory: true,
      dueDate: "2024-12-31",
      status: "active",
      enrolledCount: 45,
      completedCount: 32,
    },
    {
      id: "IS-002",
      title: "Medication Administration Safety",
      category: "Patient Safety",
      type: "interactive_course",
      duration: 90,
      ceuHours: 1.5,
      description: "Essential training on safe medication practices, error prevention, and documentation",
      targetRoles: ["RN", "LPN", "CNA"],
      difficulty: "Intermediate",
      prerequisites: [],
      modules: [
        { id: "M1", title: "Five Rights of Medication", duration: 20, completed: false },
        { id: "M2", title: "Error Prevention Strategies", duration: 30, completed: false },
        { id: "M3", title: "High-Risk Medications", duration: 25, completed: false },
        { id: "M4", title: "Documentation Requirements", duration: 15, completed: false },
      ],
      quiz: {
        questions: 20,
        passingScore: 85,
        attempts: 3,
      },
      accreditation: "Joint Commission",
      expiryMonths: 12,
      mandatory: true,
      dueDate: "2024-06-30",
      status: "active",
      enrolledCount: 78,
      completedCount: 65,
    },
    {
      id: "IS-003",
      title: "Infection Control & Prevention",
      category: "Safety & Compliance",
      type: "blended_learning",
      duration: 75,
      ceuHours: 1.25,
      description: "Updated CDC guidelines for infection prevention in healthcare settings",
      targetRoles: ["All"],
      difficulty: "Basic",
      prerequisites: [],
      modules: [
        { id: "M1", title: "Standard Precautions", duration: 20, completed: false },
        { id: "M2", title: "Hand Hygiene Protocols", duration: 15, completed: false },
        { id: "M3", title: "PPE Usage", duration: 25, completed: false },
        { id: "M4", title: "Environmental Cleaning", duration: 15, completed: false },
      ],
      quiz: {
        questions: 15,
        passingScore: 80,
        attempts: 5,
      },
      accreditation: "CDC",
      expiryMonths: 12,
      mandatory: true,
      dueDate: "2024-03-31",
      status: "active",
      enrolledCount: 156,
      completedCount: 142,
    },
    {
      id: "IS-004",
      title: "HIPAA Privacy & Security Update",
      category: "Compliance",
      type: "online_course",
      duration: 60,
      ceuHours: 1.0,
      description: "Annual HIPAA training with latest privacy and security requirements",
      targetRoles: ["All"],
      difficulty: "Basic",
      prerequisites: [],
      modules: [
        { id: "M1", title: "Privacy Rule Updates", duration: 20, completed: false },
        { id: "M2", title: "Security Requirements", duration: 20, completed: false },
        { id: "M3", title: "Breach Notification", duration: 20, completed: false },
      ],
      quiz: {
        questions: 20,
        passingScore: 90,
        attempts: 3,
      },
      accreditation: "HHS",
      expiryMonths: 12,
      mandatory: true,
      dueDate: "2024-12-31",
      status: "active",
      enrolledCount: 156,
      completedCount: 156,
    },
    {
      id: "IS-005",
      title: "Physical Therapy Techniques",
      category: "Clinical Skills",
      type: "hands_on_workshop",
      duration: 180,
      ceuHours: 3.0,
      description: "Advanced physical therapy techniques and patient mobility training",
      targetRoles: ["PT", "PTA"],
      difficulty: "Advanced",
      prerequisites: ["Basic PT Principles"],
      modules: [
        { id: "M1", title: "Assessment Techniques", duration: 45, completed: false },
        { id: "M2", title: "Treatment Planning", duration: 60, completed: false },
        { id: "M3", title: "Mobility Training", duration: 45, completed: false },
        { id: "M4", title: "Progress Documentation", duration: 30, completed: false },
      ],
      quiz: {
        questions: 30,
        passingScore: 85,
        attempts: 2,
      },
      accreditation: "APTA",
      expiryMonths: 24,
      mandatory: false,
      dueDate: null,
      status: "active",
      enrolledCount: 12,
      completedCount: 8,
    },
  ]

  // Employee In-Service Progress
  const employeeProgress = [
    {
      id: "EMP-001",
      name: "Sarah Johnson",
      role: "RN",
      department: "Home Health",
      hireDate: "2023-03-15",
      avatar: "/placeholder.svg?height=40&width=40&text=SJ",
      annualRequirement: 20, // hours
      completedHours: 14.5,
      inProgressHours: 3.0,
      remainingHours: 2.5,
      complianceStatus: "on_track",
      lastTrainingDate: "2024-01-15",
      upcomingDeadlines: [
        { training: "Medication Safety", dueDate: "2024-06-30", priority: "high" },
        { training: "Wound Care Update", dueDate: "2024-12-31", priority: "medium" },
      ],
      completedTrainings: [
        {
          id: "IS-003",
          title: "Infection Control & Prevention",
          completionDate: "2024-01-15",
          score: 95,
          ceuHours: 1.25,
          certificate: "CERT-2024-001",
        },
        {
          id: "IS-004",
          title: "HIPAA Privacy & Security Update",
          completionDate: "2024-01-10",
          score: 98,
          ceuHours: 1.0,
          certificate: "CERT-2024-002",
        },
      ],
      inProgressTrainings: [
        {
          id: "IS-001",
          title: "Advanced Wound Care Management",
          startDate: "2024-01-20",
          progress: 75,
          estimatedCompletion: "2024-02-05",
          ceuHours: 2.0,
        },
      ],
    },
    {
      id: "EMP-002",
      name: "Michael Chen",
      role: "PT",
      department: "Rehabilitation",
      hireDate: "2023-01-20",
      avatar: "/placeholder.svg?height=40&width=40&text=MC",
      annualRequirement: 24,
      completedHours: 18.0,
      inProgressHours: 3.0,
      remainingHours: 3.0,
      complianceStatus: "on_track",
      lastTrainingDate: "2024-01-12",
      upcomingDeadlines: [{ training: "PT Techniques Advanced", dueDate: "2024-08-15", priority: "medium" }],
      completedTrainings: [
        {
          id: "IS-003",
          title: "Infection Control & Prevention",
          completionDate: "2024-01-12",
          score: 88,
          ceuHours: 1.25,
          certificate: "CERT-2024-003",
        },
        {
          id: "IS-004",
          title: "HIPAA Privacy & Security Update",
          completionDate: "2024-01-08",
          score: 92,
          ceuHours: 1.0,
          certificate: "CERT-2024-004",
        },
      ],
      inProgressTrainings: [
        {
          id: "IS-005",
          title: "Physical Therapy Techniques",
          startDate: "2024-01-18",
          progress: 40,
          estimatedCompletion: "2024-02-15",
          ceuHours: 3.0,
        },
      ],
    },
    {
      id: "EMP-003",
      name: "Emily Davis",
      role: "CNA",
      department: "Home Health",
      hireDate: "2024-01-10",
      avatar: "/placeholder.svg?height=40&width=40&text=ED",
      annualRequirement: 12,
      completedHours: 3.25,
      inProgressHours: 1.5,
      remainingHours: 7.25,
      complianceStatus: "behind",
      lastTrainingDate: "2024-01-10",
      upcomingDeadlines: [
        { training: "Medication Safety", dueDate: "2024-06-30", priority: "high" },
        { training: "Infection Control", dueDate: "2024-03-31", priority: "urgent" },
      ],
      completedTrainings: [
        {
          id: "IS-004",
          title: "HIPAA Privacy & Security Update",
          completionDate: "2024-01-10",
          score: 85,
          ceuHours: 1.0,
          certificate: "CERT-2024-005",
        },
      ],
      inProgressTrainings: [
        {
          id: "IS-002",
          title: "Medication Administration Safety",
          startDate: "2024-01-22",
          progress: 25,
          estimatedCompletion: "2024-02-10",
          ceuHours: 1.5,
        },
      ],
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_track":
        return "bg-green-100 text-green-800"
      case "behind":
        return "bg-yellow-100 text-yellow-800"
      case "at_risk":
        return "bg-orange-100 text-orange-800"
      case "non_compliant":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "on_track":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "behind":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "at_risk":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "non_compliant":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredEmployees = employeeProgress.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || emp.role === roleFilter
    const matchesStatus = statusFilter === "all" || emp.complianceStatus === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const overallStats = {
    totalEmployees: employeeProgress.length,
    onTrack: employeeProgress.filter((e) => e.complianceStatus === "on_track").length,
    behind: employeeProgress.filter((e) => e.complianceStatus === "behind").length,
    atRisk: employeeProgress.filter((e) => e.complianceStatus === "at_risk").length,
    nonCompliant: employeeProgress.filter((e) => e.complianceStatus === "non_compliant").length,
    totalHoursCompleted: employeeProgress.reduce((sum, emp) => sum + emp.completedHours, 0),
    averageCompletion:
      Math.round(
        (employeeProgress.reduce((sum, emp) => sum + (emp.completedHours / emp.annualRequirement) * 100, 0) /
          employeeProgress.length) *
          10,
      ) / 10,
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
                <h1 className="text-2xl font-bold text-gray-900">In-Service Education</h1>
                <p className="text-gray-600">Mandatory continuing education and professional development</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Dialog open={createTrainingOpen} onOpenChange={setCreateTrainingOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Training
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New In-Service Training</DialogTitle>
                    <DialogDescription>Design a new training module for staff education</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Training Title</Label>
                        <Input id="title" placeholder="Enter training title" />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="clinical">Clinical Skills</SelectItem>
                            <SelectItem value="safety">Patient Safety</SelectItem>
                            <SelectItem value="compliance">Safety & Compliance</SelectItem>
                            <SelectItem value="professional">Professional Development</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" placeholder="Describe the training content and objectives" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input id="duration" type="number" placeholder="90" />
                      </div>
                      <div>
                        <Label htmlFor="ceu-hours">CEU Hours</Label>
                        <Input id="ceu-hours" type="number" step="0.25" placeholder="1.5" />
                      </div>
                      <div>
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="target-roles">Target Roles</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select roles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Roles</SelectItem>
                          <SelectItem value="rn">RN</SelectItem>
                          <SelectItem value="lpn">LPN</SelectItem>
                          <SelectItem value="cna">CNA</SelectItem>
                          <SelectItem value="pt">PT</SelectItem>
                          <SelectItem value="pta">PTA</SelectItem>
                          <SelectItem value="ot">OT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setCreateTrainingOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setCreateTrainingOpen(false)}>Create Training</Button>
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
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="trainings">Training Library</TabsTrigger>
            <TabsTrigger value="employees">Employee Progress</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Overview Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{overallStats.totalEmployees}</div>
                  <div className="text-sm text-gray-600">Total Staff</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{overallStats.onTrack}</div>
                  <div className="text-sm text-gray-600">On Track</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{overallStats.behind}</div>
                  <div className="text-sm text-gray-600">Behind</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{overallStats.atRisk}</div>
                  <div className="text-sm text-gray-600">At Risk</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{overallStats.nonCompliant}</div>
                  <div className="text-sm text-gray-600">Non-Compliant</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{overallStats.averageCompletion}%</div>
                  <div className="text-sm text-gray-600">Avg Completion</div>
                </CardContent>
              </Card>
            </div>

            {/* Urgent Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                    Urgent Training Due
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {employeeProgress
                    .filter((emp) => emp.upcomingDeadlines.some((d) => d.priority === "urgent"))
                    .map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-red-800">{emp.name}</p>
                          <p className="text-sm text-red-600">
                            {emp.upcomingDeadlines.find((d) => d.priority === "urgent")?.training} - Due{" "}
                            {emp.upcomingDeadlines.find((d) => d.priority === "urgent")?.dueDate}
                          </p>
                        </div>
                        <Badge className="bg-red-100 text-red-800">URGENT</Badge>
                      </div>
                    ))}
                  {employeeProgress.filter((emp) => emp.upcomingDeadlines.some((d) => d.priority === "urgent"))
                    .length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      No urgent training due
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                    Training Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Trainings Completed This Month</span>
                      <span className="text-2xl font-bold text-green-600">47</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">In Progress</span>
                      <span className="text-2xl font-bold text-blue-600">23</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total CEU Hours Earned</span>
                      <span className="text-2xl font-bold text-purple-600">{overallStats.totalHoursCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Score</span>
                      <span className="text-2xl font-bold text-orange-600">91%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Popular Trainings */}
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Trainings</CardTitle>
                <CardDescription>Highest enrollment and completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inServiceTrainings
                    .sort((a, b) => b.enrolledCount - a.enrolledCount)
                    .slice(0, 5)
                    .map((training) => (
                      <div key={training.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{training.title}</h3>
                            <p className="text-sm text-gray-600">{training.category}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span>{training.ceuHours} CEU Hours</span>
                              <span>•</span>
                              <span>{training.duration} minutes</span>
                              <span>•</span>
                              <span>{training.difficulty}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {training.completedCount}/{training.enrolledCount} completed
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.round((training.completedCount / training.enrolledCount) * 100)}% completion rate
                          </div>
                          <Progress
                            value={(training.completedCount / training.enrolledCount) * 100}
                            className="h-2 w-32 mt-2"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trainings" className="space-y-6">
            {/* Training Library */}
            <Card>
              <CardHeader>
                <CardTitle>In-Service Training Library</CardTitle>
                <CardDescription>Available training modules and courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inServiceTrainings.map((training) => (
                    <Card key={training.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-medium">{training.title}</h3>
                              <Badge variant="outline">{training.category}</Badge>
                              {training.mandatory && <Badge className="bg-red-100 text-red-800">Mandatory</Badge>}
                              <Badge
                                className={`${training.difficulty === "Advanced" ? "bg-purple-100 text-purple-800" : training.difficulty === "Intermediate" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}
                              >
                                {training.difficulty}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-3">{training.description}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>{training.duration} minutes</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Award className="h-4 w-4 text-gray-400" />
                                <span>{training.ceuHours} CEU Hours</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span>{training.enrolledCount} enrolled</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Target className="h-4 w-4 text-gray-400" />
                                <span>{training.targetRoles.join(", ")}</span>
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Completion Rate</span>
                                <span>{Math.round((training.completedCount / training.enrolledCount) * 100)}%</span>
                              </div>
                              <Progress
                                value={(training.completedCount / training.enrolledCount) * 100}
                                className="h-2"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2 ml-4">
                            <Button variant="outline" size="sm" onClick={() => setSelectedTraining(training)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              <Users className="h-4 w-4 mr-2" />
                              Assign
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="on_track">On Track</SelectItem>
                        <SelectItem value="behind">Behind</SelectItem>
                        <SelectItem value="at_risk">At Risk</SelectItem>
                        <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee Progress List */}
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
                            <Badge className={getStatusColor(employee.complianceStatus)}>
                              {employee.complianceStatus.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>
                              {employee.completedHours} / {employee.annualRequirement} hours completed
                            </span>
                            <span>•</span>
                            <span>{employee.remainingHours} hours remaining</span>
                            <span>•</span>
                            <span>Last training: {employee.lastTrainingDate}</span>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Annual Progress</span>
                              <span>{Math.round((employee.completedHours / employee.annualRequirement) * 100)}%</span>
                            </div>
                            <Progress
                              value={(employee.completedHours / employee.annualRequirement) * 100}
                              className="h-2 w-64"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-sm font-medium">Upcoming Deadlines</div>
                          <div className="space-y-1">
                            {employee.upcomingDeadlines.slice(0, 2).map((deadline, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Badge className={getPriorityColor(deadline.priority)} size="sm">
                                  {deadline.priority}
                                </Badge>
                                <span className="text-xs text-gray-600">{deadline.training}</span>
                              </div>
                            ))}
                          </div>
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

          <TabsContent value="assignments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Training Assignments</CardTitle>
                <CardDescription>Assign mandatory and optional trainings to employees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="select-training">Select Training</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose training" />
                        </SelectTrigger>
                        <SelectContent>
                          {inServiceTrainings.map((training) => (
                            <SelectItem key={training.id} value={training.id}>
                              {training.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="select-employees">Assign To</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employees" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Employees</SelectItem>
                          <SelectItem value="role-rn">All RNs</SelectItem>
                          <SelectItem value="role-lpn">All LPNs</SelectItem>
                          <SelectItem value="role-cna">All CNAs</SelectItem>
                          <SelectItem value="individual">Individual Selection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="due-date">Due Date</Label>
                      <Input id="due-date" type="date" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="assignment-notes">Assignment Notes</Label>
                    <Textarea
                      id="assignment-notes"
                      placeholder="Add any special instructions or notes for this assignment"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Preview Assignment</Button>
                    <Button>
                      <Zap className="h-4 w-4 mr-2" />
                      Assign Training
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Assignments</CardTitle>
                <CardDescription>Latest training assignments and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Medication Administration Safety</h3>
                        <p className="text-sm text-gray-600">Assigned to All RNs and LPNs • Due: June 30, 2024</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>Assigned: January 15, 2024</span>
                          <span>•</span>
                          <span>78 employees</span>
                          <span>•</span>
                          <span>65 completed</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">83% Complete</Badge>
                        <div className="mt-2">
                          <Progress value={83} className="h-2 w-32" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Advanced Wound Care Management</h3>
                        <p className="text-sm text-gray-600">Assigned to All RNs • Due: December 31, 2024</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>Assigned: January 10, 2024</span>
                          <span>•</span>
                          <span>45 employees</span>
                          <span>•</span>
                          <span>32 completed</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-yellow-100 text-yellow-800">71% Complete</Badge>
                        <div className="mt-2">
                          <Progress value={71} className="h-2 w-32" />
                        </div>
                      </div>
                    </div>
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
                  <CardDescription>Generate reports for regulatory compliance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Annual Training Summary
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Users className="h-4 w-4 mr-2" />
                    Employee Training Records
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Calendar className="h-4 w-4 mr-2" />
                    Training Schedule Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Shield className="h-4 w-4 mr-2" />
                    Compliance Status Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Award className="h-4 w-4 mr-2" />
                    CEU Hours Summary
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Training Analytics</CardTitle>
                  <CardDescription>Performance metrics and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total CEU Hours This Year</span>
                      <span className="text-2xl font-bold text-green-600">{overallStats.totalHoursCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Training Score</span>
                      <span className="text-2xl font-bold text-blue-600">91%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Completion Rate</span>
                      <span className="text-2xl font-bold text-purple-600">{overallStats.averageCompletion}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Training Modules Available</span>
                      <span className="text-2xl font-bold text-orange-600">{inServiceTrainings.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>Download detailed reports and analytics</CardDescription>
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
                  <span>{selectedEmployee.name} - Training Progress</span>
                  <Badge className={getStatusColor(selectedEmployee.complianceStatus)}>
                    {selectedEmployee.complianceStatus.replace("_", " ").toUpperCase()}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedEmployee.role} • {selectedEmployee.department} • Hired {selectedEmployee.hireDate}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Annual Progress */}
                <div>
                  <h4 className="font-medium mb-3">Annual Training Progress</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Required Hours</Label>
                      <p className="text-2xl font-bold">{selectedEmployee.annualRequirement}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Completed Hours</Label>
                      <p className="text-2xl font-bold text-green-600">{selectedEmployee.completedHours}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">In Progress</Label>
                      <p className="text-2xl font-bold text-blue-600">{selectedEmployee.inProgressHours}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Remaining</Label>
                      <p className="text-2xl font-bold text-orange-600">{selectedEmployee.remainingHours}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>
                        {Math.round((selectedEmployee.completedHours / selectedEmployee.annualRequirement) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(selectedEmployee.completedHours / selectedEmployee.annualRequirement) * 100}
                      className="h-3"
                    />
                  </div>
                </div>

                {/* Upcoming Deadlines */}
                <div>
                  <h4 className="font-medium mb-3">Upcoming Deadlines</h4>
                  <div className="space-y-3">
                    {selectedEmployee.upcomingDeadlines.map((deadline: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{deadline.training}</p>
                          <p className="text-sm text-gray-600">Due: {deadline.dueDate}</p>
                        </div>
                        <Badge className={getPriorityColor(deadline.priority)}>{deadline.priority.toUpperCase()}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Completed Trainings */}
                <div>
                  <h4 className="font-medium mb-3">Completed Trainings</h4>
                  <div className="space-y-3">
                    {selectedEmployee.completedTrainings.map((training: any) => (
                      <div key={training.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">{training.title}</h5>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span>Completed: {training.completionDate}</span>
                              <span>Score: {training.score}%</span>
                              <span>CEU Hours: {training.ceuHours}</span>
                              <span>Cert: {training.certificate}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Certificate
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* In Progress Trainings */}
                <div>
                  <h4 className="font-medium mb-3">In Progress Trainings</h4>
                  <div className="space-y-3">
                    {selectedEmployee.inProgressTrainings.map((training: any) => (
                      <div key={training.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">{training.title}</h5>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span>Started: {training.startDate}</span>
                              <span>Est. Completion: {training.estimatedCompletion}</span>
                              <span>CEU Hours: {training.ceuHours}</span>
                            </div>
                            <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Progress</span>
                                <span>{training.progress}%</span>
                              </div>
                              <Progress value={training.progress} className="h-2 w-64" />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-blue-100 text-blue-800">
                              <PlayCircle className="h-3 w-3 mr-1" />
                              In Progress
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Continue
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Training
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

        {/* Training Detail Modal */}
        {selectedTraining && (
          <Dialog open={!!selectedTraining} onOpenChange={() => setSelectedTraining(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedTraining.title}</span>
                  <div className="flex space-x-2">
                    <Badge variant="outline">{selectedTraining.category}</Badge>
                    {selectedTraining.mandatory && <Badge className="bg-red-100 text-red-800">Mandatory</Badge>}
                  </div>
                </DialogTitle>
                <DialogDescription>{selectedTraining.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Training Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Duration</Label>
                    <p className="text-lg font-bold">{selectedTraining.duration} min</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">CEU Hours</Label>
                    <p className="text-lg font-bold">{selectedTraining.ceuHours}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Enrolled</Label>
                    <p className="text-lg font-bold">{selectedTraining.enrolledCount}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Completed</Label>
                    <p className="text-lg font-bold text-green-600">{selectedTraining.completedCount}</p>
                  </div>
                </div>

                {/* Training Modules */}
                <div>
                  <h4 className="font-medium mb-3">Training Modules</h4>
                  <div className="space-y-3">
                    {selectedTraining.modules.map((module: any, index: number) => (
                      <div key={module.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{module.title}</p>
                            <p className="text-sm text-gray-600">{module.duration} minutes</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {module.completed ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
                          )}
                          <Button variant="outline" size="sm">
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quiz Information */}
                <div>
                  <h4 className="font-medium mb-3">Assessment Details</h4>
                  <div className="p-4 border rounded-lg">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Questions</Label>
                        <p className="text-lg font-bold">{selectedTraining.quiz.questions}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Passing Score</Label>
                        <p className="text-lg font-bold">{selectedTraining.quiz.passingScore}%</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Max Attempts</Label>
                        <p className="text-lg font-bold">{selectedTraining.quiz.attempts}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accreditation & Requirements */}
                <div>
                  <h4 className="font-medium mb-3">Accreditation & Requirements</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <Label className="text-sm font-medium">Accredited By</Label>
                      <p className="text-lg font-bold">{selectedTraining.accreditation}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <Label className="text-sm font-medium">Target Roles</Label>
                      <p className="text-lg font-bold">{selectedTraining.targetRoles.join(", ")}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <Label className="text-sm font-medium">Difficulty Level</Label>
                      <p className="text-lg font-bold">{selectedTraining.difficulty}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <Label className="text-sm font-medium">Certificate Validity</Label>
                      <p className="text-lg font-bold">{selectedTraining.expiryMonths} months</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Training
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Assign to Employees
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Analytics
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
