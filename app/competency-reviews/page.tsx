"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  PenTool,
  Users,
  Search,
  Filter,
  Star,
  Award,
  Target,
  Shield,
  TrendingUp,
  Eye,
  FilePenLineIcon as Signature,
} from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"

interface EvaluationReview {
  id: string
  staffId: string
  staffName: string
  staffRole: string
  department: string
  evaluationType: "performance" | "competency"
  assessmentType: "annual" | "mid-year" | "probationary" | "initial" | "skills-validation"
  submittedAt: string
  dueDate: string
  priority: "high" | "medium" | "low"
  status: "pending" | "in-progress" | "completed" | "approved"
  selfAssessmentScore?: number
  supervisorScore?: number
  overallScore?: number
  supervisorNotes?: string
  staffResponses: Record<string, any>
  reviewerName?: string
  completedAt?: string
}

export default function CompetencyReviewsPage() {
  const [currentUser] = useState(getCurrentUser())
  const [activeTab, setActiveTab] = useState("pending")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [selectedReview, setSelectedReview] = useState<EvaluationReview | null>(null)
  const [supervisorNotes, setSupervisorNotes] = useState("")
  const [isReviewing, setIsReviewing] = useState(false)

  // Mock evaluation reviews data
  const evaluationReviews: EvaluationReview[] = [
    {
      id: "REV-2024-001",
      staffId: "STAFF-001",
      staffName: "Sarah Johnson",
      staffRole: "RN",
      department: "Clinical",
      evaluationType: "performance",
      assessmentType: "annual",
      submittedAt: "2024-01-15T10:30:00Z",
      dueDate: "2024-01-22T23:59:59Z",
      priority: "medium",
      status: "pending",
      selfAssessmentScore: 4.6,
      staffResponses: {
        "job-performance": "5",
        productivity: "4",
        achievements:
          "Led implementation of new patient care protocols, resulting in 15% improvement in patient satisfaction scores.",
      },
    },
    {
      id: "REV-2024-002",
      staffId: "STAFF-002",
      staffName: "Michael Chen",
      staffRole: "PT",
      department: "Therapy",
      evaluationType: "competency",
      assessmentType: "skills-validation",
      submittedAt: "2024-01-14T14:20:00Z",
      dueDate: "2024-01-21T23:59:59Z",
      priority: "high",
      status: "in-progress",
      selfAssessmentScore: 4.2,
      supervisorScore: 4.4,
      reviewerName: "Jane Smith",
      staffResponses: {
        "clinical-skills-self": "4",
        "safety-knowledge": "5",
        "learning-needs": "Would like additional training in advanced manual therapy techniques.",
      },
    },
    {
      id: "REV-2024-003",
      staffId: "STAFF-003",
      staffName: "Emily Davis",
      staffRole: "OT",
      department: "Therapy",
      evaluationType: "performance",
      assessmentType: "probationary",
      submittedAt: "2024-01-13T09:15:00Z",
      dueDate: "2024-01-20T23:59:59Z",
      priority: "high",
      status: "pending",
      selfAssessmentScore: 3.8,
      staffResponses: {
        "job-performance": "4",
        "communication-performance": "3",
        challenges: "Adjusting to new documentation system and building rapport with patients.",
      },
    },
    {
      id: "REV-2024-004",
      staffId: "STAFF-004",
      staffName: "Lisa Garcia",
      staffRole: "LPN",
      department: "Clinical",
      evaluationType: "competency",
      assessmentType: "annual",
      submittedAt: "2024-01-12T16:45:00Z",
      dueDate: "2024-01-19T23:59:59Z",
      priority: "medium",
      status: "completed",
      selfAssessmentScore: 4.3,
      supervisorScore: 4.5,
      overallScore: 4.4,
      reviewerName: "Sarah Johnson",
      completedAt: "2024-01-16T11:30:00Z",
      supervisorNotes:
        "Excellent clinical skills and patient care. Demonstrates strong competency in all required areas.",
      staffResponses: {
        "clinical-skills-self": "4",
        "safety-knowledge": "5",
        "technical-competency": "4",
      },
    },
    {
      id: "REV-2024-005",
      staffId: "STAFF-005",
      staffName: "Robert Thompson",
      staffRole: "HHA",
      department: "Personal Care",
      evaluationType: "performance",
      assessmentType: "mid-year",
      submittedAt: "2024-01-11T13:20:00Z",
      dueDate: "2024-01-18T23:59:59Z",
      priority: "low",
      status: "approved",
      selfAssessmentScore: 4.1,
      supervisorScore: 4.2,
      overallScore: 4.15,
      reviewerName: "Sarah Johnson",
      completedAt: "2024-01-15T14:45:00Z",
      supervisorNotes: "Good performance overall. Shows improvement in documentation and patient communication.",
      staffResponses: {
        "job-performance": "4",
        productivity: "4",
        "teamwork-performance": "5",
      },
    },
  ]

  // Check if current user can review evaluations for specific roles
  const canReviewRole = (staffRole: string): boolean => {
    const userRole = currentUser.role.id

    // RN Supervisors can review RN, LPN, and HHA evaluations
    if (userRole === "RN" && ["RN", "LPN", "HHA"].includes(staffRole)) {
      return true
    }

    // PT Supervisors can only review PT evaluations
    if (userRole === "PT" && staffRole === "PT") {
      return true
    }

    // OT Supervisors can only review OT evaluations
    if (userRole === "OT" && staffRole === "OT") {
      return true
    }

    // Clinical Directors can review all evaluations
    if (userRole === "Clinical Director") {
      return true
    }

    return false
  }

  // Filter reviews based on user permissions and search criteria
  const filteredReviews = evaluationReviews.filter((review) => {
    // Check role-based permissions
    if (!canReviewRole(review.staffRole)) {
      return false
    }

    // Apply search filter
    const matchesSearch =
      review.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.staffRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.department.toLowerCase().includes(searchTerm.toLowerCase())

    // Apply role filter
    const matchesRole = filterRole === "all" || review.staffRole === filterRole

    // Apply priority filter
    const matchesPriority = filterPriority === "all" || review.priority === filterPriority

    return matchesSearch && matchesRole && matchesPriority
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
      case "in-progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low Priority</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getEvaluationTypeIcon = (type: "performance" | "competency") => {
    return type === "competency" ? (
      <Shield className="h-4 w-4 text-blue-600" />
    ) : (
      <TrendingUp className="h-4 w-4 text-green-600" />
    )
  }

  const getDaysUntilDue = (dueDate: string): number => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const handleStartReview = (review: EvaluationReview) => {
    setSelectedReview(review)
    setSupervisorNotes(review.supervisorNotes || "")
    setIsReviewing(true)
  }

  const handleCompleteReview = async () => {
    if (!selectedReview) return

    setIsReviewing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Update the review status
    const updatedReviews = evaluationReviews.map((review) =>
      review.id === selectedReview.id
        ? {
            ...review,
            status: "completed" as const,
            supervisorScore: 4.5, // Mock supervisor score
            overallScore: ((review.selfAssessmentScore || 0) + 4.5) / 2,
            reviewerName: currentUser.name,
            completedAt: new Date().toISOString(),
            supervisorNotes,
          }
        : review,
    )

    setIsReviewing(false)
    setSelectedReview(null)
    // Show success message
  }

  const handleApproveReview = async (reviewId: string) => {
    setIsReviewing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsReviewing(false)
    // Show success message
  }

  // Separate reviews by status
  const pendingReviews = filteredReviews.filter((r) => r.status === "pending")
  const inProgressReviews = filteredReviews.filter((r) => r.status === "in-progress")
  const completedReviews = filteredReviews.filter((r) => r.status === "completed")
  const approvedReviews = filteredReviews.filter((r) => r.status === "approved")

  const getOverviewStats = () => {
    const totalReviews = filteredReviews.length
    const pendingCount = pendingReviews.length
    const overdueCount = pendingReviews.filter((r) => getDaysUntilDue(r.dueDate) < 0).length
    const completedThisWeek = completedReviews.filter((r) => {
      if (!r.completedAt) return false
      const completed = new Date(r.completedAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return completed >= weekAgo
    }).length

    return {
      totalReviews,
      pendingCount,
      overdueCount,
      completedThisWeek,
    }
  }

  const stats = getOverviewStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/evaluations">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Evaluations
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <CheckCircle className="h-6 w-6 mr-3 text-indigo-600" />
                  Competency Reviews
                </h1>
                <p className="text-gray-600">Review and approve staff performance and competency evaluations</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-indigo-100 text-indigo-800">
                <Users className="h-3 w-3 mr-1" />
                Supervisor
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">Pending Reviews ({pendingReviews.length})</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress ({inProgressReviews.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedReviews.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
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
                      <p className="text-sm font-medium text-gray-600">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">{stats.overdueCount}</p>
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
                      <p className="text-sm font-medium text-gray-600">Completed This Week</p>
                      <p className="text-2xl font-bold text-green-600">{stats.completedThisWeek}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalReviews}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Pending Evaluations
                </CardTitle>
                <CardDescription>Evaluations awaiting your review and approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search staff, role, or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role-filter">Role</Label>
                    <Select value={filterRole} onValueChange={setFilterRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="RN">Registered Nurse</SelectItem>
                        <SelectItem value="LPN">Licensed Practical Nurse</SelectItem>
                        <SelectItem value="HHA">Home Health Aide</SelectItem>
                        <SelectItem value="PT">Physical Therapist</SelectItem>
                        <SelectItem value="OT">Occupational Therapist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority-filter">Priority</Label>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="low">Low Priority</SelectItem>
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

                {/* Pending Reviews List */}
                <div className="space-y-4">
                  {pendingReviews.map((review) => {
                    const daysUntilDue = getDaysUntilDue(review.dueDate)
                    const isOverdue = daysUntilDue < 0

                    return (
                      <Card key={review.id} className={isOverdue ? "border-red-200 bg-red-50" : ""}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="p-3 bg-indigo-100 rounded-lg">
                                {getEvaluationTypeIcon(review.evaluationType)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{review.staffName}</h3>
                                <p className="text-gray-600">
                                  {review.staffRole} • {review.department}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {review.evaluationType === "competency"
                                    ? "Competency Assessment"
                                    : "Performance Evaluation"}{" "}
                                  - {review.assessmentType.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              {getPriorityBadge(review.priority)}
                              {getStatusBadge(review.status)}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <Label className="text-xs">Submitted</Label>
                              <p className="text-sm">{new Date(review.submittedAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <Label className="text-xs">Due Date</Label>
                              <p className={`text-sm ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                                {new Date(review.dueDate).toLocaleDateString()}
                                {isOverdue && " (Overdue)"}
                              </p>
                            </div>
                            <div>
                              <Label className="text-xs">Self Assessment Score</Label>
                              <div className="flex items-center space-x-2">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm font-medium">{review.selfAssessmentScore}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center">
                                    {getEvaluationTypeIcon(review.evaluationType)}
                                    <span className="ml-2">
                                      {review.staffName} -{" "}
                                      {review.evaluationType === "competency"
                                        ? "Competency Assessment"
                                        : "Performance Evaluation"}
                                    </span>
                                  </DialogTitle>
                                  <DialogDescription>
                                    Review the staff member's self-assessment responses and provide your evaluation
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Staff Information</Label>
                                      <div className="mt-1 text-sm text-gray-600">
                                        <p>{review.staffName}</p>
                                        <p>
                                          {review.staffRole} • {review.department}
                                        </p>
                                        <p>Submitted: {new Date(review.submittedAt).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Self Assessment Score</Label>
                                      <div className="mt-1 flex items-center space-x-2">
                                        <Star className="h-5 w-5 text-yellow-500" />
                                        <span className="text-lg font-medium">{review.selfAssessmentScore}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium">Staff Responses</Label>
                                    <div className="mt-2 space-y-3">
                                      {Object.entries(review.staffResponses).map(([key, value]) => (
                                        <div key={key} className="p-3 bg-gray-50 rounded-lg">
                                          <h4 className="font-medium text-sm capitalize mb-1">
                                            {key.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                          </h4>
                                          <p className="text-sm text-gray-700">{value}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700"
                              onClick={() => handleStartReview(review)}
                            >
                              <PenTool className="h-4 w-4 mr-2" />
                              Start Review
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                  {pendingReviews.length === 0 && (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Reviews</h3>
                      <p className="text-gray-600">All evaluations have been reviewed and processed.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  In Progress Reviews
                </CardTitle>
                <CardDescription>Evaluations currently being reviewed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inProgressReviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                              {getEvaluationTypeIcon(review.evaluationType)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{review.staffName}</h3>
                              <p className="text-gray-600">
                                {review.staffRole} • {review.department}
                              </p>
                              <p className="text-sm text-gray-500">Reviewer: {review.reviewerName}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            {review.selfAssessmentScore && review.supervisorScore && (
                              <div className="text-center">
                                <div className="text-sm text-gray-600">Self vs Supervisor</div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">{review.selfAssessmentScore}</span>
                                  <span className="text-gray-400">vs</span>
                                  <span className="text-sm font-medium">{review.supervisorScore}</span>
                                </div>
                              </div>
                            )}
                            {getStatusBadge(review.status)}
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Progress
                          </Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <PenTool className="h-4 w-4 mr-2" />
                            Continue Review
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {inProgressReviews.length === 0 && (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews In Progress</h3>
                      <p className="text-gray-600">Start reviewing pending evaluations to see them here.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Completed Reviews
                </CardTitle>
                <CardDescription>Evaluations that have been reviewed and are ready for approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...completedReviews, ...approvedReviews].map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                              {getEvaluationTypeIcon(review.evaluationType)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{review.staffName}</h3>
                              <p className="text-gray-600">
                                {review.staffRole} • {review.department}
                              </p>
                              <p className="text-sm text-gray-500">
                                Reviewed by: {review.reviewerName} • Completed:{" "}
                                {review.completedAt && new Date(review.completedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-sm text-gray-600">Overall Score</div>
                              <div className="flex items-center space-x-2">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-lg font-medium">{review.overallScore}</span>
                              </div>
                            </div>
                            {getStatusBadge(review.status)}
                          </div>
                        </div>

                        {review.supervisorNotes && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <Label className="text-sm font-medium">Supervisor Notes</Label>
                            <p className="text-sm text-gray-700 mt-1">{review.supervisorNotes}</p>
                          </div>
                        )}

                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            View Report
                          </Button>
                          {review.status === "completed" && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveReview(review.id)}
                              disabled={isReviewing}
                            >
                              <Signature className="h-4 w-4 mr-2" />
                              {isReviewing ? "Approving..." : "Approve & Sign"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {[...completedReviews, ...approvedReviews].length === 0 && (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Reviews</h3>
                      <p className="text-gray-600">Completed reviews will appear here once evaluations are finished.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Review Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Review Time</span>
                      <span className="font-bold">3.2 days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reviews This Month</span>
                      <span className="font-bold">12</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">On-Time Completion Rate</span>
                      <span className="font-bold text-green-600">94%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Overall Score</span>
                      <span className="font-bold text-blue-600">4.3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Evaluation Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Performance Evaluations</span>
                      <span className="font-bold">8</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Competency Assessments</span>
                      <span className="font-bold">7</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">High Priority Reviews</span>
                      <span className="font-bold text-red-600">2</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Staff Requiring Development</span>
                      <span className="font-bold text-yellow-600">3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Review Distribution by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Registered Nurses (RN)</span>
                      <span className="text-sm font-medium">40%</span>
                    </div>
                    <Progress value={40} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Licensed Practical Nurses (LPN)</span>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Home Health Aides (HHA)</span>
                      <span className="text-sm font-medium">20%</span>
                    </div>
                    <Progress value={20} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Physical Therapists (PT)</span>
                      <span className="text-sm font-medium">10%</span>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Occupational Therapists (OT)</span>
                      <span className="text-sm font-medium">5%</span>
                    </div>
                    <Progress value={5} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        {selectedReview && (
          <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  {getEvaluationTypeIcon(selectedReview.evaluationType)}
                  <span className="ml-2">
                    Review: {selectedReview.staffName} -{" "}
                    {selectedReview.evaluationType === "competency"
                      ? "Competency Assessment"
                      : "Performance Evaluation"}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  Provide your supervisor assessment and feedback for this evaluation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Staff Information</Label>
                    <div className="mt-1 text-sm text-gray-600">
                      <p>{selectedReview.staffName}</p>
                      <p>
                        {selectedReview.staffRole} • {selectedReview.department}
                      </p>
                      <p>Submitted: {new Date(selectedReview.submittedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Self Assessment Score</Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="text-lg font-medium">{selectedReview.selfAssessmentScore}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Staff Responses</Label>
                  <div className="mt-2 space-y-3 max-h-60 overflow-y-auto">
                    {Object.entries(selectedReview.staffResponses).map(([key, value]) => (
                      <div key={key} className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm capitalize mb-1">
                          {key.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </h4>
                        <p className="text-sm text-gray-700">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="supervisor-notes">Supervisor Notes and Feedback</Label>
                  <Textarea
                    id="supervisor-notes"
                    value={supervisorNotes}
                    onChange={(e) => setSupervisorNotes(e.target.value)}
                    placeholder="Provide your assessment, feedback, and recommendations..."
                    className="min-h-[120px] mt-1"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setSelectedReview(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCompleteReview}
                    disabled={isReviewing || !supervisorNotes.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isReviewing ? "Completing Review..." : "Complete Review"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  )
}
