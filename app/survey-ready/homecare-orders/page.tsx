"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  ArrowLeft,
  FileCheck,
  CheckCircle,
  Plus,
  Download,
  Eye,
  Activity,
  Send,
  FileText,
  Zap,
  RefreshCw,
  Settings,
  Database,
  Workflow,
  Star,
  Target,
  TrendingUp,
  UserCheck,
  ClipboardCheck,
  MessageSquare,
  Calendar,
  BookOpen,
  BarChart3,
  XCircle,
  RotateCcw,
  GraduationCap,
  Brain,
  Award,
  AlertTriangle,
  Lightbulb,
  BookMarked,
  User,
} from "lucide-react"
import Link from "next/link"

export default function HomeCareOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [showQAReview, setShowQAReview] = useState(false)
  const [showChartReview, setShowChartReview] = useState(false)
  const [showStaffEducation, setShowStaffEducation] = useState(false)
  const [showCorrectiveActionForm, setShowCorrectiveActionForm] = useState(false)
  const [showAxxessIntegration, setShowAxxessIntegration] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("All")
  const [qaComments, setQaComments] = useState("")
  const [selectedQAAction, setSelectedQAAction] = useState<"approve" | "reject" | "revision">("approve")
  const [automationEnabled, setAutomationEnabled] = useState(true)
  const [axxessConnected, setAxxessConnected] = useState(true)
  const [docusignConnected, setDocusignConnected] = useState(true)
  const [efaxConnected, setEfaxConnected] = useState(true)

  // Enhanced mock data with QA workflow and staff education
  const orderStats = {
    totalOrders: 1247,
    pendingQA: 89,
    qaApproved: 1098,
    needsRevision: 37,
    pocSigned: 1061,
    lateOrders: 23,
    complianceRate: 95.3,
    starRatingImpact: 4.2,
    goalCompletionRate: 87.5,
    chartComplianceScore: 92.1,
    visitMatchRate: 94.7,
    averageQATime: 1.8,
    monthlyTrend: "+2.1%",
    axxessSync: "2024-01-16 09:30 AM",
    automatedReminders: 156,
    docusignSent: 89,
    efaxReceived: 67,
    aiProcessed: 234,
    staffEducationSessions: 23,
    improvementPlansActive: 8,
    documentationQualityTrend: "+12.3%",
  }

  // Staff performance and education data
  const staffPerformanceData = [
    {
      id: "staff-001",
      name: "Sarah Johnson, RN",
      role: "Registered Nurse",
      totalOrders: 45,
      documentationScore: 89,
      improvementTrend: "+5.2%",
      commonIssues: [
        "Medication reconciliation incomplete",
        "Missing patient response documentation",
        "Inconsistent vital signs recording",
      ],
      strengths: [
        "Excellent clinical assessment documentation",
        "Thorough care plan updates",
        "Clear communication with physicians",
      ],
      educationNeeds: [
        "Medication Management Documentation",
        "Patient Response Recording Best Practices",
        "Vital Signs Documentation Standards",
      ],
      lastEducationSession: "2024-01-10",
      improvementPlan: {
        active: true,
        startDate: "2024-01-08",
        targetDate: "2024-02-08",
        goals: [
          "Achieve 95% medication reconciliation completion",
          "Improve patient response documentation to 90%",
          "Standardize vital signs recording format",
        ],
        progress: 67,
        completedModules: 3,
        totalModules: 5,
      },
      recentErrors: [
        {
          orderId: "POC-2024-001247",
          errorType: "Medication Documentation",
          description: "Missing dosage information for Lisinopril",
          severity: "Medium",
          educationProvided: false,
          date: "2024-01-16",
        },
        {
          orderId: "POC-2024-001240",
          errorType: "Patient Response",
          description: "No documentation of patient response to PT",
          severity: "Low",
          educationProvided: true,
          date: "2024-01-14",
        },
      ],
      documentationStyle: {
        averageNoteLength: 245,
        detailLevel: "Moderate",
        consistencyScore: 78,
        clinicalAccuracy: 92,
        timeliness: 85,
        completeness: 89,
        areas: {
          assessments: 95,
          interventions: 88,
          outcomes: 82,
          planning: 91,
        },
      },
    },
    {
      id: "staff-002",
      name: "Michael Chen, PT",
      role: "Physical Therapist",
      totalOrders: 32,
      documentationScore: 94,
      improvementTrend: "+2.1%",
      commonIssues: ["Functional assessment scoring inconsistencies", "Goal progress measurement gaps"],
      strengths: [
        "Detailed functional assessments",
        "Clear treatment progression notes",
        "Excellent goal setting documentation",
      ],
      educationNeeds: ["Functional Assessment Standardization", "Outcome Measurement Tools"],
      lastEducationSession: "2024-01-12",
      improvementPlan: {
        active: false,
        startDate: null,
        targetDate: null,
        goals: [],
        progress: 0,
        completedModules: 0,
        totalModules: 0,
      },
      recentErrors: [
        {
          orderId: "POC-2024-001235",
          errorType: "Functional Assessment",
          description: "Ambulation score inconsistent with narrative",
          severity: "Low",
          educationProvided: true,
          date: "2024-01-13",
        },
      ],
      documentationStyle: {
        averageNoteLength: 320,
        detailLevel: "High",
        consistencyScore: 91,
        clinicalAccuracy: 96,
        timeliness: 92,
        completeness: 94,
        areas: {
          assessments: 98,
          interventions: 94,
          outcomes: 89,
          planning: 96,
        },
      },
    },
    {
      id: "staff-003",
      name: "Emily Davis, OT",
      role: "Occupational Therapist",
      totalOrders: 28,
      documentationScore: 76,
      improvementTrend: "-3.1%",
      commonIssues: [
        "Incomplete functional assessments",
        "Missing physician orders documentation",
        "Inconsistent visit frequency recording",
      ],
      strengths: ["Good patient interaction documentation", "Clear safety recommendations"],
      educationNeeds: [
        "Comprehensive Assessment Documentation",
        "Physician Order Requirements",
        "Visit Documentation Standards",
        "Clinical Writing Best Practices",
      ],
      lastEducationSession: "2024-01-05",
      improvementPlan: {
        active: true,
        startDate: "2024-01-06",
        targetDate: "2024-02-15",
        goals: [
          "Complete all required assessment components",
          "Achieve 100% physician order documentation",
          "Improve overall documentation score to 85%",
        ],
        progress: 34,
        completedModules: 2,
        totalModules: 6,
      },
      recentErrors: [
        {
          orderId: "POC-2024-001245",
          errorType: "Critical Documentation",
          description: "Missing physician orders for new medications",
          severity: "High",
          educationProvided: false,
          date: "2024-01-16",
        },
        {
          orderId: "POC-2024-001245",
          errorType: "Assessment Incomplete",
          description: "Functional assessment missing key components",
          severity: "High",
          educationProvided: false,
          date: "2024-01-16",
        },
        {
          orderId: "POC-2024-001238",
          errorType: "Visit Documentation",
          description: "OT visits not matching POC frequency",
          severity: "Medium",
          educationProvided: true,
          date: "2024-01-12",
        },
      ],
      documentationStyle: {
        averageNoteLength: 180,
        detailLevel: "Low",
        consistencyScore: 65,
        clinicalAccuracy: 78,
        timeliness: 71,
        completeness: 76,
        areas: {
          assessments: 68,
          interventions: 82,
          outcomes: 71,
          planning: 79,
        },
      },
    },
  ]

  // Education modules and training content
  const educationModules = [
    {
      id: "med-doc-101",
      title: "Medication Documentation Mastery",
      description: "Complete guide to accurate medication reconciliation and documentation",
      duration: "45 minutes",
      difficulty: "Intermediate",
      topics: [
        "Medication reconciliation best practices",
        "Dosage and frequency documentation",
        "Drug interaction awareness",
        "Patient compliance tracking",
      ],
      completionRate: 87,
      starRatingImpact: "+0.3",
    },
    {
      id: "func-assess-201",
      title: "Functional Assessment Standardization",
      description: "Standardized approaches to functional assessment documentation",
      duration: "60 minutes",
      difficulty: "Advanced",
      topics: [
        "Standardized assessment tools",
        "Scoring consistency methods",
        "Narrative alignment techniques",
        "Progress measurement standards",
      ],
      completionRate: 72,
      starRatingImpact: "+0.4",
    },
    {
      id: "clinical-writing-101",
      title: "Clinical Writing Excellence",
      description: "Fundamentals of clear, complete, and compliant clinical documentation",
      duration: "30 minutes",
      difficulty: "Beginner",
      topics: [
        "SOAP note structure",
        "Objective vs subjective documentation",
        "Legal documentation requirements",
        "Clarity and conciseness",
      ],
      completionRate: 94,
      starRatingImpact: "+0.2",
    },
    {
      id: "patient-response-301",
      title: "Patient Response Documentation",
      description: "Advanced techniques for documenting patient responses and outcomes",
      duration: "40 minutes",
      difficulty: "Advanced",
      topics: [
        "Measurable outcome documentation",
        "Patient response indicators",
        "Progress tracking methods",
        "Goal achievement recording",
      ],
      completionRate: 68,
      starRatingImpact: "+0.5",
    },
  ]

  const integrationStatus = {
    axxess: { connected: true, lastSync: "2024-01-16 09:30 AM", status: "Active" },
    docusign: { connected: true, lastActivity: "2024-01-16 08:45 AM", status: "Active" },
    efax: { connected: true, lastReceived: "2024-01-16 07:15 AM", status: "Active" },
    ai: { enabled: true, processed: 234, accuracy: 97.8, status: "Learning" },
  }

  const qaWorkflowSteps = [
    {
      id: "chart-review",
      name: "Comprehensive Chart Review",
      description: "AI-powered review of all clinical notes, visits, and documentation",
      enabled: true,
      aiScore: 94.2,
      humanReviewRequired: true,
    },
    {
      id: "poc-verification",
      name: "POC-Visit Matching",
      description: "Verify all visits align with Plan of Care orders",
      enabled: true,
      matchRate: 94.7,
      flaggedVisits: 12,
    },
    {
      id: "goal-tracking",
      name: "Patient Goal Progress",
      description: "Monitor patient progress against established goals",
      enabled: true,
      goalsOnTrack: 87.5,
      goalsAtRisk: 8,
    },
    {
      id: "star-optimization",
      name: "Star Rating Optimization",
      description: "Identify opportunities to improve CMS star ratings",
      enabled: true,
      currentRating: 4.2,
      potentialRating: 4.6,
    },
    {
      id: "staff-education",
      name: "Staff Education & Training",
      description: "Automated education recommendations based on documentation patterns",
      enabled: true,
      educationSessions: 23,
      improvementPlans: 8,
    },
    {
      id: "qa-approval",
      name: "QA Clinical Approval",
      description: "Final QA review and approval before signature request",
      enabled: true,
      approvalRate: 89.3,
      averageTime: 1.8,
    },
  ]

  // Enhanced orders with QA workflow status and staff education tracking
  const recentOrders = [
    {
      id: "POC-2024-001247",
      axxessId: "AX-45789",
      patientName: "Margaret Anderson",
      orderType: "Initial POC",
      physician: "Dr. Sarah Johnson",
      physicianFax: "(555) 123-4567",
      dateOrdered: "2024-01-16",
      dueDate: "2024-01-18",
      status: "Pending QA Review",
      qaStatus: "chart_review",
      signedDate: null,
      priority: "Standard",
      automationStatus: "QA Queue",
      remindersSent: 0,
      docusignEnvelope: null,
      lastActivity: "2024-01-16 10:30 AM",
      clinician: "Sarah Johnson, RN",
      clinicianId: "staff-001",
      chartCompliance: 89,
      visitMatchRate: 92,
      goalProgress: 85,
      starRatingImpact: 4.1,
      qaFlags: [
        {
          type: "Documentation",
          severity: "Medium",
          description: "Missing medication reconciliation",
          educationRecommended: true,
          educationModule: "med-doc-101",
        },
        {
          type: "Visit Frequency",
          severity: "Low",
          description: "PT visits below recommended frequency",
          educationRecommended: false,
          educationModule: null,
        },
      ],
      chartNotes: {
        totalNotes: 15,
        reviewedNotes: 15,
        flaggedNotes: 2,
        complianceScore: 89,
      },
      visitAnalysis: {
        scheduledVisits: 12,
        completedVisits: 11,
        matchingPOC: 10,
        discrepancies: 1,
      },
      goalTracking: {
        totalGoals: 6,
        onTrackGoals: 5,
        atRiskGoals: 1,
        completedGoals: 0,
      },
      educationTriggered: false,
    },
    {
      id: "POC-2024-001246",
      axxessId: "AX-45788",
      patientName: "Robert Thompson",
      orderType: "Recertification",
      physician: "Dr. Michael Chen",
      physicianFax: "(555) 234-5678",
      dateOrdered: "2024-01-15",
      dueDate: "2024-01-17",
      status: "QA Approved - Ready for Signature",
      qaStatus: "approved",
      signedDate: null,
      priority: "High",
      automationStatus: "DocuSign Ready",
      remindersSent: 0,
      docusignEnvelope: "DS-789456122",
      lastActivity: "2024-01-16 09:15 AM",
      clinician: "Michael Chen, PT",
      clinicianId: "staff-002",
      chartCompliance: 96,
      visitMatchRate: 98,
      goalProgress: 92,
      starRatingImpact: 4.4,
      qaFlags: [],
      chartNotes: {
        totalNotes: 18,
        reviewedNotes: 18,
        flaggedNotes: 0,
        complianceScore: 96,
      },
      visitAnalysis: {
        scheduledVisits: 16,
        completedVisits: 16,
        matchingPOC: 16,
        discrepancies: 0,
      },
      goalTracking: {
        totalGoals: 5,
        onTrackGoals: 5,
        atRiskGoals: 0,
        completedGoals: 1,
      },
      educationTriggered: false,
    },
    {
      id: "POC-2024-001245",
      axxessId: "AX-45787",
      patientName: "Dorothy Davis",
      orderType: "Significant Change",
      physician: "Dr. Emily Rodriguez",
      physicianFax: "(555) 345-6789",
      dateOrdered: "2024-01-14",
      dueDate: "2024-01-16",
      status: "Needs Revision",
      qaStatus: "revision_needed",
      signedDate: null,
      priority: "Urgent",
      automationStatus: "Returned to Staff",
      remindersSent: 0,
      docusignEnvelope: null,
      lastActivity: "2024-01-16 08:00 AM",
      clinician: "Emily Davis, OT",
      clinicianId: "staff-003",
      chartCompliance: 76,
      visitMatchRate: 84,
      goalProgress: 71,
      starRatingImpact: 3.8,
      qaFlags: [
        {
          type: "Critical",
          severity: "High",
          description: "Missing physician orders for new medications",
          educationRecommended: true,
          educationModule: "clinical-writing-101",
        },
        {
          type: "Documentation",
          severity: "High",
          description: "Incomplete functional assessment",
          educationRecommended: true,
          educationModule: "func-assess-201",
        },
        {
          type: "Visit Compliance",
          severity: "Medium",
          description: "OT visits not matching frequency in POC",
          educationRecommended: true,
          educationModule: "clinical-writing-101",
        },
      ],
      chartNotes: {
        totalNotes: 12,
        reviewedNotes: 12,
        flaggedNotes: 4,
        complianceScore: 76,
      },
      visitAnalysis: {
        scheduledVisits: 10,
        completedVisits: 8,
        matchingPOC: 7,
        discrepancies: 3,
      },
      goalTracking: {
        totalGoals: 7,
        onTrackGoals: 4,
        atRiskGoals: 3,
        completedGoals: 0,
      },
      revisionNotes:
        "Critical documentation gaps identified. Please address physician orders and complete functional assessment before resubmission.",
      educationTriggered: true,
      educationPlan: {
        modules: ["clinical-writing-101", "func-assess-201"],
        priority: "High",
        estimatedTime: "90 minutes",
        dueDate: "2024-01-18",
      },
    },
    {
      id: "POC-2024-001244",
      axxessId: "AX-45786",
      patientName: "James Wilson",
      orderType: "Medication Changes",
      physician: "Dr. Lisa Garcia",
      physicianFax: "(555) 456-7890",
      dateOrdered: "2024-01-14",
      dueDate: "2024-01-16",
      status: "Signed & Processed",
      qaStatus: "completed",
      signedDate: "2024-01-15 14:30",
      priority: "Standard",
      automationStatus: "Completed",
      remindersSent: 0,
      docusignEnvelope: "DS-789456120",
      lastActivity: "2024-01-15 14:35 AM",
      clinician: "Robert Wilson, HHA",
      clinicianId: "staff-004",
      chartCompliance: 94,
      visitMatchRate: 96,
      goalProgress: 89,
      starRatingImpact: 4.3,
      qaFlags: [],
      chartNotes: {
        totalNotes: 8,
        reviewedNotes: 8,
        flaggedNotes: 0,
        complianceScore: 94,
      },
      visitAnalysis: {
        scheduledVisits: 6,
        completedVisits: 6,
        matchingPOC: 6,
        discrepancies: 0,
      },
      goalTracking: {
        totalGoals: 3,
        onTrackGoals: 3,
        atRiskGoals: 0,
        completedGoals: 1,
      },
      educationTriggered: false,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "signed & processed":
        return "bg-green-100 text-green-800"
      case "qa approved - ready for signature":
        return "bg-blue-100 text-blue-800"
      case "pending qa review":
        return "bg-yellow-100 text-yellow-800"
      case "needs revision":
        return "bg-red-100 text-red-800"
      case "docusign sent":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getQAStatusColor = (qaStatus: string) => {
    switch (qaStatus) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "chart_review":
        return "bg-blue-100 text-blue-800"
      case "revision_needed":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "standard":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getComplianceColor = (score: number) => {
    if (score >= 95) return "text-green-600"
    if (score >= 85) return "text-yellow-600"
    return "text-red-600"
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-yellow-600"
    return "text-red-600"
  }

  const filteredOrders = recentOrders.filter((order) => {
    const matchesSearch =
      order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.physician.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.axxessId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "All" || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleQAAction = async (orderId: string, action: "approve" | "reject" | "revision", comments: string) => {
    console.log(`QA Action: ${action} for order ${orderId}`, { comments })

    // Find the order and check if education should be triggered
    const order = recentOrders.find((o) => o.id === orderId)
    if (order && (action === "revision" || action === "reject")) {
      // Trigger education for staff member
      const educationNeeded = order.qaFlags.some((flag) => flag.educationRecommended)
      if (educationNeeded) {
        triggerStaffEducation(order.clinicianId, order.qaFlags)
      }
    }

    // Update order status based on action
    const updatedStatus =
      action === "approve"
        ? "QA Approved - Ready for Signature"
        : action === "revision"
          ? "Needs Revision"
          : "QA Rejected"

    // In real implementation, this would call API to update order status
    setShowQAReview(false)
    setQaComments("")
    setSelectedOrder(null)
  }

  const triggerStaffEducation = async (staffId: string, qaFlags: any[]) => {
    console.log(`Triggering education for staff ${staffId}`, { qaFlags })

    // Identify education modules needed based on QA flags
    const educationModules = qaFlags
      .filter((flag) => flag.educationRecommended && flag.educationModule)
      .map((flag) => flag.educationModule)

    // Create personalized education plan
    const educationPlan = {
      staffId,
      modules: educationModules,
      priority: qaFlags.some((flag) => flag.severity === "High") ? "High" : "Medium",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 days from now
      triggeredBy: "QA Review",
      timestamp: new Date().toISOString(),
    }

    // In real implementation, this would:
    // 1. Create education assignment in database
    // 2. Send notification to staff member
    // 3. Update staff improvement plan
    // 4. Track education completion
    console.log("Education plan created:", educationPlan)
  }

  const generateImprovementPlan = async (staffId: string) => {
    const staff = staffPerformanceData.find((s) => s.id === staffId)
    if (!staff) return

    console.log(`Generating improvement plan for ${staff.name}`)

    // Analyze documentation patterns and create personalized plan
    const improvementPlan = {
      staffId,
      analysisDate: new Date().toISOString(),
      currentScore: staff.documentationScore,
      targetScore: Math.min(95, staff.documentationScore + 10),
      weakAreas: staff.commonIssues,
      strengths: staff.strengths,
      recommendedModules: staff.educationNeeds,
      timeline: "30 days",
      milestones: [
        {
          week: 1,
          goal: "Complete foundational modules",
          modules: staff.educationNeeds.slice(0, 2),
        },
        {
          week: 2,
          goal: "Practice improved documentation techniques",
          modules: staff.educationNeeds.slice(2),
        },
        {
          week: 3,
          goal: "Apply learning to patient cases",
          modules: ["practical-application"],
        },
        {
          week: 4,
          goal: "Assessment and feedback",
          modules: ["assessment-review"],
        },
      ],
    }

    console.log("Improvement plan generated:", improvementPlan)
    // In real implementation, this would save to database and notify staff
  }

  const sendForSignature = async (orderId: string) => {
    console.log(`Sending order ${orderId} for DocuSign signature`)
    // In real implementation, this would trigger DocuSign workflow
  }

  const returnToStaff = async (orderId: string, revisionNotes: string) => {
    console.log(`Returning order ${orderId} to staff for revision`, { revisionNotes })
    // In real implementation, this would notify staff and update status
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/survey-ready">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Survey Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FileCheck className="h-6 w-6 mr-2 text-indigo-600" />
                  QA-Enhanced Home Care Orders
                </h1>
                <p className="text-gray-600">
                  Comprehensive QA workflow with chart scrubbing and staff education for star rating optimization
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => setShowAxxessIntegration(true)} variant="outline">
                <Database className="h-4 w-4 mr-2" />
                Axxess Integration
              </Button>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
              <Button onClick={() => setShowCorrectiveActionForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New QA Review
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="qa-queue">QA Queue</TabsTrigger>
            <TabsTrigger value="chart-review">Chart Review</TabsTrigger>
            <TabsTrigger value="staff-education">Staff Education</TabsTrigger>
            <TabsTrigger value="goal-tracking">Goal Tracking</TabsTrigger>
            <TabsTrigger value="star-rating">Star Rating</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced QA Status Banner with Education Metrics */}
            <Card className="border-l-4 border-l-blue-500 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">QA Workflow with Staff Education Active</p>
                      <p className="text-sm text-blue-600">
                        {orderStats.pendingQA} orders in QA queue • {orderStats.chartComplianceScore}% chart compliance
                        • {orderStats.starRatingImpact} star rating • {orderStats.staffEducationSessions} education
                        sessions this month
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-blue-600">
                    <p>Avg QA time: {orderStats.averageQATime} hours</p>
                    <p>Documentation quality: {orderStats.documentationQualityTrend}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Key Metrics with Education Focus */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <ClipboardCheck className="h-8 w-8 text-blue-500" />
                    <Badge className="bg-blue-100 text-blue-800">QA Active</Badge>
                  </div>
                  <p className="text-2xl font-bold">{orderStats.pendingQA}</p>
                  <p className="text-gray-600 text-sm">Pending QA Review</p>
                  <p className="text-xs text-gray-500 mt-1">Avg time: {orderStats.averageQATime}h</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <GraduationCap className="h-8 w-8 text-green-500" />
                    <Badge className="bg-green-100 text-green-800">{orderStats.documentationQualityTrend}</Badge>
                  </div>
                  <p className="text-2xl font-bold">{orderStats.staffEducationSessions}</p>
                  <p className="text-gray-600 text-sm">Education Sessions</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {orderStats.improvementPlansActive} active improvement plans
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Star className="h-8 w-8 text-yellow-500" />
                    <Badge className="bg-yellow-100 text-yellow-800">{orderStats.starRatingImpact}/5</Badge>
                  </div>
                  <p className="text-2xl font-bold">{orderStats.chartComplianceScore}%</p>
                  <p className="text-gray-600 text-sm">Chart Compliance</p>
                  <p className="text-xs text-gray-500 mt-1">Star rating impact: {orderStats.starRatingImpact}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="h-8 w-8 text-purple-500" />
                    <Badge className="bg-purple-100 text-purple-800">{orderStats.goalCompletionRate}%</Badge>
                  </div>
                  <p className="text-2xl font-bold">{orderStats.visitMatchRate}%</p>
                  <p className="text-gray-600 text-sm">Visit-POC Match</p>
                  <p className="text-xs text-gray-500 mt-1">Goal completion: {orderStats.goalCompletionRate}%</p>
                </CardContent>
              </Card>
            </div>

            {/* QA Workflow Status with Education Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Workflow className="h-5 w-5 mr-2 text-indigo-600" />
                  QA Workflow with Integrated Staff Education
                </CardTitle>
                <CardDescription>
                  Comprehensive quality assurance process with automated staff education and improvement plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {qaWorkflowSteps.map((step) => (
                    <div key={step.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{step.name}</h3>
                        <Badge variant={step.enabled ? "default" : "secondary"}>
                          {step.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                      <div className="space-y-2">
                        {step.aiScore && (
                          <div className="flex justify-between text-xs">
                            <span>AI Score</span>
                            <span className="font-medium">{step.aiScore}%</span>
                          </div>
                        )}
                        {step.matchRate && (
                          <div className="flex justify-between text-xs">
                            <span>Match Rate</span>
                            <span className="font-medium">{step.matchRate}%</span>
                          </div>
                        )}
                        {step.goalsOnTrack && (
                          <div className="flex justify-between text-xs">
                            <span>Goals On Track</span>
                            <span className="font-medium">{step.goalsOnTrack}%</span>
                          </div>
                        )}
                        {step.currentRating && (
                          <div className="flex justify-between text-xs">
                            <span>Current Rating</span>
                            <span className="font-medium">{step.currentRating}/5</span>
                          </div>
                        )}
                        {step.educationSessions && (
                          <div className="flex justify-between text-xs">
                            <span>Education Sessions</span>
                            <span className="font-medium">{step.educationSessions}</span>
                          </div>
                        )}
                        {step.approvalRate && (
                          <div className="flex justify-between text-xs">
                            <span>Approval Rate</span>
                            <span className="font-medium">{step.approvalRate}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders with Education Triggers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-indigo-600" />
                  Recent Orders with QA Status & Education Tracking
                </CardTitle>
                <CardDescription>Orders in various stages of the QA workflow with education triggers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.slice(0, 4).map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{order.patientName}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>{order.id}</span>
                            <span>•</span>
                            <span>{order.orderType}</span>
                            <span>•</span>
                            <span>{order.clinician}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge>
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                          <Badge className={getQAStatusColor(order.qaStatus)}>
                            {order.qaStatus.replace("_", " ").toUpperCase()}
                          </Badge>
                          {order.educationTriggered && (
                            <Badge className="bg-orange-100 text-orange-800">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              Education Triggered
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-600">Chart Compliance</p>
                          <p className={`font-medium ${getComplianceColor(order.chartCompliance)}`}>
                            {order.chartCompliance}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Visit Match</p>
                          <p className={`font-medium ${getComplianceColor(order.visitMatchRate)}`}>
                            {order.visitMatchRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Goal Progress</p>
                          <p className={`font-medium ${getComplianceColor(order.goalProgress)}`}>
                            {order.goalProgress}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Star Impact</p>
                          <p className="font-medium flex items-center">
                            <Star className="h-3 w-3 text-yellow-500 mr-1" />
                            {order.starRatingImpact}
                          </p>
                        </div>
                      </div>

                      {order.qaFlags.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-red-600 mb-1">QA Flags ({order.qaFlags.length})</p>
                          <div className="space-y-1">
                            {order.qaFlags.map((flag, index) => (
                              <div key={index} className="text-xs p-2 bg-red-50 rounded border-l-2 border-red-300">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{flag.type}:</span>
                                  <div className="flex items-center space-x-1">
                                    <Badge
                                      className={
                                        flag.severity === "High"
                                          ? "bg-red-100 text-red-800"
                                          : flag.severity === "Medium"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-blue-100 text-blue-800"
                                      }
                                    >
                                      {flag.severity}
                                    </Badge>
                                    {flag.educationRecommended && (
                                      <Badge className="bg-orange-100 text-orange-800">
                                        <GraduationCap className="h-2 w-2 mr-1" />
                                        Education
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="text-red-700 mt-1">{flag.description}</p>
                                {flag.educationModule && (
                                  <p className="text-orange-600 text-xs mt-1">
                                    Recommended module: {flag.educationModule}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {order.educationPlan && (
                        <div className="mb-3 p-3 bg-orange-50 rounded border-l-4 border-orange-400">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-orange-800 flex items-center">
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Education Plan Created
                            </h4>
                            <Badge className="bg-orange-100 text-orange-800">{order.educationPlan.priority}</Badge>
                          </div>
                          <div className="text-sm text-orange-700">
                            <p>Modules: {order.educationPlan.modules.join(", ")}</p>
                            <p>Estimated time: {order.educationPlan.estimatedTime}</p>
                            <p>Due date: {order.educationPlan.dueDate}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order.id)
                            setShowChartReview(true)
                          }}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Chart Review
                        </Button>

                        {order.status === "Pending QA Review" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order.id)
                              setShowQAReview(true)
                            }}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            QA Review
                          </Button>
                        )}

                        {order.status === "QA Approved - Ready for Signature" && (
                          <Button size="sm" onClick={() => sendForSignature(order.id)}>
                            <Send className="h-4 w-4 mr-2" />
                            Send for Signature
                          </Button>
                        )}

                        {order.status === "Needs Revision" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => returnToStaff(order.id, order.revisionNotes || "")}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Return to Staff
                          </Button>
                        )}

                        {order.clinicianId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStaff(order.clinicianId)
                              setShowStaffEducation(true)
                            }}
                          >
                            <GraduationCap className="h-4 w-4 mr-2" />
                            Staff Education
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qa-queue" className="space-y-6">
            {/* QA Queue Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClipboardCheck className="h-5 w-5 mr-2 text-blue-600" />
                  QA Review Queue with Education Tracking
                </CardTitle>
                <CardDescription>
                  Orders requiring quality assurance review and approval with automated education triggers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders
                    .filter((order) => order.status === "Pending QA Review" || order.status === "Needs Revision")
                    .map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium">{order.patientName}</h3>
                            <p className="text-sm text-gray-600">
                              {order.orderType} • {order.clinician}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge>
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                            {order.educationTriggered && (
                              <Badge className="bg-orange-100 text-orange-800">
                                <GraduationCap className="h-3 w-3 mr-1" />
                                Education Triggered
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-blue-50 rounded">
                            <div className="text-lg font-bold text-blue-600">{order.chartNotes.complianceScore}%</div>
                            <p className="text-xs text-blue-700">Chart Compliance</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded">
                            <div className="text-lg font-bold text-green-600">
                              {order.visitAnalysis.matchingPOC}/{order.visitAnalysis.scheduledVisits}
                            </div>
                            <p className="text-xs text-green-700">Visits Match POC</p>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 rounded">
                            <div className="text-lg font-bold text-yellow-600">
                              {order.goalTracking.onTrackGoals}/{order.goalTracking.totalGoals}
                            </div>
                            <p className="text-xs text-yellow-700">Goals On Track</p>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded">
                            <div className="text-lg font-bold text-purple-600 flex items-center justify-center">
                              <Star className="h-4 w-4 mr-1" />
                              {order.starRatingImpact}
                            </div>
                            <p className="text-xs text-purple-700">Star Rating</p>
                          </div>
                        </div>

                        {order.qaFlags.length > 0 && (
                          <div className="mb-4">
                            <p className="font-medium text-red-600 mb-2">Quality Issues ({order.qaFlags.length})</p>
                            <div className="space-y-2">
                              {order.qaFlags.map((flag, index) => (
                                <div
                                  key={index}
                                  className={`p-2 rounded border-l-4 ${
                                    flag.severity === "High"
                                      ? "bg-red-50 border-red-500"
                                      : flag.severity === "Medium"
                                        ? "bg-yellow-50 border-yellow-500"
                                        : "bg-blue-50 border-blue-500"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{flag.type}</span>
                                    <div className="flex items-center space-x-1">
                                      <Badge
                                        className={
                                          flag.severity === "High"
                                            ? "bg-red-100 text-red-800"
                                            : flag.severity === "Medium"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-blue-100 text-blue-800"
                                        }
                                      >
                                        {flag.severity}
                                      </Badge>
                                      {flag.educationRecommended && (
                                        <Badge className="bg-orange-100 text-orange-800">
                                          <GraduationCap className="h-3 w-3 mr-1" />
                                          Education
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                                  {flag.educationModule && (
                                    <p className="text-xs text-orange-600 mt-1">Recommended: {flag.educationModule}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order.id)
                              setShowQAReview(true)
                            }}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Start QA Review
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order.id)
                              setShowChartReview(true)
                            }}
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Full Chart Review
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStaff(order.clinicianId)
                              setShowStaffEducation(true)
                            }}
                          >
                            <GraduationCap className="h-4 w-4 mr-2" />
                            Staff Education
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View in Axxess
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chart-review" className="space-y-6">
            {/* Comprehensive Chart Review */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                  Comprehensive Chart Scrubbing with Education Integration
                </CardTitle>
                <CardDescription>
                  AI-powered review of all clinical notes, visits, and documentation with automated staff education
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium">{order.patientName}</h3>
                          <p className="text-sm text-gray-600">
                            {order.orderType} • {order.clinician}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={
                              getComplianceColor(order.chartCompliance) === "text-green-600"
                                ? "bg-green-100 text-green-800"
                                : getComplianceColor(order.chartCompliance) === "text-yellow-600"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {order.chartCompliance}% Compliant
                          </Badge>
                          {order.educationTriggered && (
                            <Badge className="bg-orange-100 text-orange-800">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              Education Triggered
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="p-3 bg-blue-50 rounded">
                          <h4 className="font-medium text-blue-800 mb-2">Clinical Notes Review</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Total Notes:</span>
                              <span className="font-medium">{order.chartNotes.totalNotes}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Reviewed:</span>
                              <span className="font-medium">{order.chartNotes.reviewedNotes}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Flagged:</span>
                              <span className="font-medium text-red-600">{order.chartNotes.flaggedNotes}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-green-50 rounded">
                          <h4 className="font-medium text-green-800 mb-2">Visit Analysis</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Scheduled:</span>
                              <span className="font-medium">{order.visitAnalysis.scheduledVisits}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Completed:</span>
                              <span className="font-medium">{order.visitAnalysis.completedVisits}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>POC Match:</span>
                              <span className="font-medium text-green-600">{order.visitAnalysis.matchingPOC}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Discrepancies:</span>
                              <span className="font-medium text-red-600">{order.visitAnalysis.discrepancies}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-yellow-50 rounded">
                          <h4 className="font-medium text-yellow-800 mb-2">Goal Tracking</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Total Goals:</span>
                              <span className="font-medium">{order.goalTracking.totalGoals}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>On Track:</span>
                              <span className="font-medium text-green-600">{order.goalTracking.onTrackGoals}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>At Risk:</span>
                              <span className="font-medium text-red-600">{order.goalTracking.atRiskGoals}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Completed:</span>
                              <span className="font-medium text-blue-600">{order.goalTracking.completedGoals}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {order.qaFlags.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 rounded border-l-4 border-red-400">
                          <h4 className="font-medium text-red-800 mb-2">Issues Found - Education Recommendations</h4>
                          <div className="space-y-2">
                            {order.qaFlags.map((flag, index) => (
                              <div key={index} className="text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-red-700">{flag.type}:</span>
                                  {flag.educationRecommended && (
                                    <Badge className="bg-orange-100 text-orange-800">
                                      <Lightbulb className="h-3 w-3 mr-1" />
                                      Education Recommended
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-red-600">{flag.description}</p>
                                {flag.educationModule && (
                                  <p className="text-orange-600 text-xs mt-1">
                                    📚 Recommended module: {flag.educationModule}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-2" />
                          View All Notes
                        </Button>
                        <Button size="sm" variant="outline">
                          <Calendar className="h-4 w-4 mr-2" />
                          Visit Schedule
                        </Button>
                        <Button size="sm" variant="outline">
                          <Target className="h-4 w-4 mr-2" />
                          Goal Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedStaff(order.clinicianId)
                            setShowStaffEducation(true)
                          }}
                        >
                          <GraduationCap className="h-4 w-4 mr-2" />
                          Staff Education
                        </Button>
                        <Button size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export Report
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff-education" className="space-y-6">
            {/* Staff Education Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-green-600" />
                  Staff Education & Documentation Improvement
                </CardTitle>
                <CardDescription>
                  Personalized education plans based on documentation patterns and QA findings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Education Overview Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{orderStats.staffEducationSessions}</div>
                      <p className="text-sm text-green-700">Education Sessions</p>
                      <p className="text-xs text-gray-500">This month</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{orderStats.improvementPlansActive}</div>
                      <p className="text-sm text-blue-700">Active Improvement Plans</p>
                      <p className="text-xs text-gray-500">In progress</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{orderStats.documentationQualityTrend}</div>
                      <p className="text-sm text-yellow-700">Quality Improvement</p>
                      <p className="text-xs text-gray-500">Last 30 days</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">94.2%</div>
                      <p className="text-sm text-purple-700">Module Completion</p>
                      <p className="text-xs text-gray-500">Average rate</p>
                    </div>
                  </div>

                  {/* Staff Performance Analysis */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Staff Documentation Performance & Education Plans</h3>
                    {staffPerformanceData.map((staff) => (
                      <div key={staff.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">{staff.name}</h4>
                              <p className="text-sm text-gray-600">{staff.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              className={
                                getPerformanceColor(staff.documentationScore) === "text-green-600"
                                  ? "bg-green-100 text-green-800"
                                  : getPerformanceColor(staff.documentationScore) === "text-yellow-600"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }
                            >
                              {staff.documentationScore}% Documentation Score
                            </Badge>
                            <Badge
                              className={
                                staff.improvementTrend.startsWith("+")
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {staff.improvementTrend}
                            </Badge>
                            {staff.improvementPlan.active && (
                              <Badge className="bg-orange-100 text-orange-800">
                                <Target className="h-3 w-3 mr-1" />
                                Improvement Plan Active
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Documentation Style Analysis */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="p-3 bg-gray-50 rounded">
                            <h5 className="font-medium text-gray-800 mb-2">Documentation Style Analysis</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Average Note Length:</span>
                                <span className="font-medium">{staff.documentationStyle.averageNoteLength} words</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Detail Level:</span>
                                <span className="font-medium">{staff.documentationStyle.detailLevel}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Consistency Score:</span>
                                <span
                                  className={`font-medium ${getPerformanceColor(staff.documentationStyle.consistencyScore)}`}
                                >
                                  {staff.documentationStyle.consistencyScore}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Clinical Accuracy:</span>
                                <span
                                  className={`font-medium ${getPerformanceColor(staff.documentationStyle.clinicalAccuracy)}`}
                                >
                                  {staff.documentationStyle.clinicalAccuracy}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Timeliness:</span>
                                <span
                                  className={`font-medium ${getPerformanceColor(staff.documentationStyle.timeliness)}`}
                                >
                                  {staff.documentationStyle.timeliness}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-gray-50 rounded">
                            <h5 className="font-medium text-gray-800 mb-2">Documentation Areas</h5>
                            <div className="space-y-2">
                              {Object.entries(staff.documentationStyle.areas).map(([area, score]) => (
                                <div key={area} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="capitalize">{area}:</span>
                                    <span className={`font-medium ${getPerformanceColor(score)}`}>{score}%</span>
                                  </div>
                                  <Progress value={score} className="h-1" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Common Issues and Strengths */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="p-3 bg-red-50 rounded">
                            <h5 className="font-medium text-red-800 mb-2">Common Issues</h5>
                            <ul className="text-sm text-red-700 space-y-1">
                              {staff.commonIssues.map((issue, index) => (
                                <li key={index} className="flex items-start">
                                  <AlertTriangle className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-3 bg-green-50 rounded">
                            <h5 className="font-medium text-green-800 mb-2">Strengths</h5>
                            <ul className="text-sm text-green-700 space-y-1">
                              {staff.strengths.map((strength, index) => (
                                <li key={index} className="flex items-start">
                                  <CheckCircle className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Recent Errors with Education Status */}
                        {staff.recentErrors.length > 0 && (
                          <div className="mb-4 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                            <h5 className="font-medium text-yellow-800 mb-2">Recent Documentation Errors</h5>
                            <div className="space-y-2">
                              {staff.recentErrors.map((error, index) => (
                                <div key={index} className="text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-yellow-700">
                                      {error.orderId} - {error.errorType}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <Badge
                                        className={
                                          error.severity === "High"
                                            ? "bg-red-100 text-red-800"
                                            : error.severity === "Medium"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-blue-100 text-blue-800"
                                        }
                                      >
                                        {error.severity}
                                      </Badge>
                                      <Badge
                                        className={
                                          error.educationProvided
                                            ? "bg-green-100 text-green-800"
                                            : "bg-orange-100 text-orange-800"
                                        }
                                      >
                                        {error.educationProvided ? "Education Provided" : "Education Pending"}
                                      </Badge>
                                    </div>
                                  </div>
                                  <p className="text-yellow-600 mt-1">{error.description}</p>
                                  <p className="text-xs text-gray-500">{error.date}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Education Needs and Recommendations */}
                        <div className="mb-4 p-3 bg-blue-50 rounded">
                          <h5 className="font-medium text-blue-800 mb-2">Recommended Education Modules</h5>
                          <div className="flex flex-wrap gap-2">
                            {staff.educationNeeds.map((need, index) => (
                              <Badge key={index} className="bg-blue-100 text-blue-800">
                                <BookMarked className="h-3 w-3 mr-1" />
                                {need}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-blue-600 mt-2">
                            Last education session: {staff.lastEducationSession}
                          </p>
                        </div>

                        {/* Active Improvement Plan */}
                        {staff.improvementPlan.active && (
                          <div className="mb-4 p-3 bg-orange-50 rounded border-l-4 border-orange-400">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-orange-800">Active Improvement Plan</h5>
                              <Badge className="bg-orange-100 text-orange-800">
                                {staff.improvementPlan.progress}% Complete
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm text-orange-700">
                              <div className="flex justify-between">
                                <span>Start Date:</span>
                                <span>{staff.improvementPlan.startDate}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Target Date:</span>
                                <span>{staff.improvementPlan.targetDate}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Modules Progress:</span>
                                <span>
                                  {staff.improvementPlan.completedModules}/{staff.improvementPlan.totalModules}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <Progress value={staff.improvementPlan.progress} className="h-2" />
                            </div>
                            <div className="mt-2">
                              <p className="text-sm font-medium text-orange-800">Goals:</p>
                              <ul className="text-xs text-orange-700 mt-1 space-y-1">
                                {staff.improvementPlan.goals.map((goal, index) => (
                                  <li key={index}>• {goal}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedStaff(staff.id)
                              setShowStaffEducation(true)
                            }}
                          >
                            <GraduationCap className="h-4 w-4 mr-2" />
                            View Education Plan
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => generateImprovementPlan(staff.id)}>
                            <Brain className="h-4 w-4 mr-2" />
                            Generate Improvement Plan
                          </Button>
                          <Button size="sm" variant="outline">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Performance Report
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Feedback
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Available Education Modules */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BookMarked className="h-5 w-5 mr-2 text-blue-600" />
                        Available Education Modules
                      </CardTitle>
                      <CardDescription>
                        Comprehensive training modules designed to improve documentation quality and star ratings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {educationModules.map((module) => (
                          <div key={module.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{module.title}</h4>
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-blue-100 text-blue-800">{module.difficulty}</Badge>
                                <Badge className="bg-green-100 text-green-800">
                                  <Star className="h-3 w-3 mr-1" />
                                  {module.starRatingImpact}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Duration:</span>
                                <span className="font-medium">{module.duration}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Completion Rate:</span>
                                <span className="font-medium">{module.completionRate}%</span>
                              </div>
                            </div>
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 mb-1">Topics Covered:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {module.topics.map((topic, index) => (
                                  <li key={index}>• {topic}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="mt-3">
                              <Progress value={module.completionRate} className="h-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goal-tracking" className="space-y-6">
            {/* Patient Goal Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-green-600" />
                  Patient Goal Progress Monitoring
                </CardTitle>
                <CardDescription>
                  Track patient progress against established goals for star rating optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium">{order.patientName}</h3>
                          <p className="text-sm text-gray-600">
                            {order.orderType} • Progress: {order.goalProgress}%
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">
                            {order.goalTracking.onTrackGoals}/{order.goalTracking.totalGoals} On Track
                          </Badge>
                          {order.goalTracking.atRiskGoals > 0 && (
                            <Badge className="bg-red-100 text-red-800">{order.goalTracking.atRiskGoals} At Risk</Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Overall Goal Progress</span>
                          <span className="text-sm text-gray-600">{order.goalProgress}%</span>
                        </div>
                        <Progress value={order.goalProgress} className="h-2" />
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center p-3 bg-green-50 rounded">
                          <div className="text-lg font-bold text-green-600">{order.goalTracking.onTrackGoals}</div>
                          <p className="text-xs text-green-700">Goals On Track</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded">
                          <div className="text-lg font-bold text-red-600">{order.goalTracking.atRiskGoals}</div>
                          <p className="text-xs text-red-700">Goals At Risk</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <div className="text-lg font-bold text-blue-600">{order.goalTracking.completedGoals}</div>
                          <p className="text-xs text-blue-700">Goals Completed</p>
                        </div>
                      </div>

                      <div className="flex space-x-2 mt-4">
                        <Button size="sm" variant="outline">
                          <Target className="h-4 w-4 mr-2" />
                          View Goal Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Progress Report
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Clinical Notes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="star-rating" className="space-y-6">
            {/* Star Rating Optimization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-600" />
                  CMS Star Rating Optimization
                </CardTitle>
                <CardDescription>Identify and address factors impacting star ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Star className="h-8 w-8 text-yellow-500" />
                    </div>
                    <div className="text-3xl font-bold text-yellow-600">{orderStats.starRatingImpact}</div>
                    <p className="text-sm text-yellow-700">Current Star Rating</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">4.6</div>
                    <p className="text-sm text-green-700">Target Rating</p>
                    <p className="text-xs text-gray-500">+0.4 improvement needed</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{orderStats.chartComplianceScore}%</div>
                    <p className="text-sm text-blue-700">Documentation Quality</p>
                    <p className="text-xs text-gray-500">Key rating factor</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Star Rating Impact by Order</h4>
                  {recentOrders.map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium">{order.patientName}</h5>
                          <p className="text-sm text-gray-600">{order.orderType}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="font-medium">{order.starRatingImpact}</span>
                          </div>
                          <Badge
                            className={
                              order.starRatingImpact >= 4.5
                                ? "bg-green-100 text-green-800"
                                : order.starRatingImpact >= 4.0
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {order.starRatingImpact >= 4.5
                              ? "Excellent"
                              : order.starRatingImpact >= 4.0
                                ? "Good"
                                : "Needs Improvement"}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Chart Quality</p>
                          <p className={`font-medium ${getComplianceColor(order.chartCompliance)}`}>
                            {order.chartCompliance}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Visit Compliance</p>
                          <p className={`font-medium ${getComplianceColor(order.visitMatchRate)}`}>
                            {order.visitMatchRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Goal Achievement</p>
                          <p className={`font-medium ${getComplianceColor(order.goalProgress)}`}>
                            {order.goalProgress}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">QA Flags</p>
                          <p
                            className={`font-medium ${order.qaFlags.length === 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {order.qaFlags.length}
                          </p>
                        </div>
                      </div>

                      {order.qaFlags.length > 0 && (
                        <div className="mt-3 p-3 bg-red-50 rounded">
                          <p className="text-sm font-medium text-red-800 mb-1">Star Rating Risk Factors:</p>
                          <ul className="text-xs text-red-700 space-y-1">
                            {order.qaFlags.map((flag, index) => (
                              <li key={index}>• {flag.description}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            {/* Automation Workflows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                  QA Automation Workflows with Education Integration
                </CardTitle>
                <CardDescription>
                  Automated quality assurance processes and AI-powered reviews with staff education triggers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {qaWorkflowSteps.map((workflow) => (
                    <div key={workflow.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium">{workflow.name}</h3>
                          <p className="text-sm text-gray-600">{workflow.description}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={workflow.enabled ? "default" : "secondary"}>
                            {workflow.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {workflow.aiScore && (
                          <div className="text-center p-3 bg-blue-50 rounded">
                            <div className="text-lg font-bold text-blue-600">{workflow.aiScore}%</div>
                            <p className="text-xs text-blue-700">AI Accuracy</p>
                          </div>
                        )}
                        {workflow.matchRate && (
                          <div className="text-center p-3 bg-green-50 rounded">
                            <div className="text-lg font-bold text-green-600">{workflow.matchRate}%</div>
                            <p className="text-xs text-green-700">Match Rate</p>
                          </div>
                        )}
                        {workflow.goalsOnTrack && (
                          <div className="text-center p-3 bg-yellow-50 rounded">
                            <div className="text-lg font-bold text-yellow-600">{workflow.goalsOnTrack}%</div>
                            <p className="text-xs text-yellow-700">Goals On Track</p>
                          </div>
                        )}
                        {workflow.educationSessions && (
                          <div className="text-center p-3 bg-orange-50 rounded">
                            <div className="text-lg font-bold text-orange-600">{workflow.educationSessions}</div>
                            <p className="text-xs text-orange-700">Education Sessions</p>
                          </div>
                        )}
                        {workflow.approvalRate && (
                          <div className="text-center p-3 bg-purple-50 rounded">
                            <div className="text-lg font-bold text-purple-600">{workflow.approvalRate}%</div>
                            <p className="text-xs text-purple-700">Approval Rate</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* QA Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    QA Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Approval Rate</span>
                        <span>89.3%</span>
                      </div>
                      <Progress value={89.3} className="mt-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Chart Compliance</span>
                        <span>{orderStats.chartComplianceScore}%</span>
                      </div>
                      <Progress value={orderStats.chartComplianceScore} className="mt-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Goal Achievement</span>
                        <span>{orderStats.goalCompletionRate}%</span>
                      </div>
                      <Progress value={orderStats.goalCompletionRate} className="mt-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Star Rating Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Current Rating</span>
                      <span className="text-sm font-medium">{orderStats.starRatingImpact}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Target Rating</span>
                      <span className="text-sm font-medium text-green-600">4.6/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Improvement Needed</span>
                      <span className="text-sm font-medium text-blue-600">+0.4</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Orders Above 4.5</span>
                      <span className="text-sm font-medium">67%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Education Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Education Sessions</span>
                      <span className="text-sm font-medium">{orderStats.staffEducationSessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Quality Improvement</span>
                      <span className="text-sm font-medium text-green-600">{orderStats.documentationQualityTrend}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Plans</span>
                      <span className="text-sm font-medium">{orderStats.improvementPlansActive}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Module Completion</span>
                      <span className="text-sm font-medium">94.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Staff Education Modal */}
        {showStaffEducation && selectedStaff && (
          <Dialog open={showStaffEducation} onOpenChange={setShowStaffEducation}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-green-600" />
                  Staff Education Plan -{" "}
                  {staffPerformanceData.find((s) => s.id === selectedStaff)?.name || "Unknown Staff"}
                </DialogTitle>
                <DialogDescription>
                  Personalized education plan based on documentation patterns and QA findings
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {selectedStaff &&
                  (() => {
                    const staff = staffPerformanceData.find((s) => s.id === selectedStaff)
                    if (!staff) return null

                    return (
                      <>
                        {/* Staff Overview */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Staff Performance Overview</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-blue-50 rounded">
                                <div className="text-xl font-bold text-blue-600">{staff.documentationScore}%</div>
                                <p className="text-sm text-blue-700">Documentation Score</p>
                              </div>
                              <div className="text-center p-3 bg-green-50 rounded">
                                <div className="text-xl font-bold text-green-600">{staff.improvementTrend}</div>
                                <p className="text-sm text-green-700">Improvement Trend</p>
                              </div>
                              <div className="text-center p-3 bg-yellow-50 rounded">
                                <div className="text-xl font-bold text-yellow-600">{staff.totalOrders}</div>
                                <p className="text-sm text-yellow-700">Total Orders</p>
                              </div>
                              <div className="text-center p-3 bg-purple-50 rounded">
                                <div className="text-xl font-bold text-purple-600">{staff.recentErrors.length}</div>
                                <p className="text-sm text-purple-700">Recent Errors</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Documentation Style Analysis */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Documentation Style Analysis</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-medium mb-3">Performance Metrics</h4>
                                <div className="space-y-3">
                                  {Object.entries(staff.documentationStyle.areas).map(([area, score]) => (
                                    <div key={area} className="space-y-1">
                                      <div className="flex justify-between text-sm">
                                        <span className="capitalize">{area}:</span>
                                        <span className={`font-medium ${getPerformanceColor(score)}`}>{score}%</span>
                                      </div>
                                      <Progress value={score} className="h-2" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-3">Style Characteristics</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span>Average Note Length:</span>
                                    <span className="font-medium">
                                      {staff.documentationStyle.averageNoteLength} words
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Detail Level:</span>
                                    <span className="font-medium">{staff.documentationStyle.detailLevel}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Consistency Score:</span>
                                    <span
                                      className={`font-medium ${getPerformanceColor(staff.documentationStyle.consistencyScore)}`}
                                    >
                                      {staff.documentationStyle.consistencyScore}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Clinical Accuracy:</span>
                                    <span
                                      className={`font-medium ${getPerformanceColor(staff.documentationStyle.clinicalAccuracy)}`}
                                    >
                                      {staff.documentationStyle.clinicalAccuracy}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Timeliness:</span>
                                    <span
                                      className={`font-medium ${getPerformanceColor(staff.documentationStyle.timeliness)}`}
                                    >
                                      {staff.documentationStyle.timeliness}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Personalized Education Plan */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Personalized Education Plan</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 bg-red-50 rounded">
                                  <h5 className="font-medium text-red-800 mb-2">Areas for Improvement</h5>
                                  <ul className="text-sm text-red-700 space-y-1">
                                    {staff.commonIssues.map((issue, index) => (
                                      <li key={index} className="flex items-start">
                                        <AlertTriangle className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                                        {issue}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="p-3 bg-green-50 rounded">
                                  <h5 className="font-medium text-green-800 mb-2">Strengths to Build On</h5>
                                  <ul className="text-sm text-green-700 space-y-1">
                                    {staff.strengths.map((strength, index) => (
                                      <li key={index} className="flex items-start">
                                        <CheckCircle className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                                        {strength}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              <div className="p-3 bg-blue-50 rounded">
                                <h5 className="font-medium text-blue-800 mb-2">Recommended Education Modules</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {staff.educationNeeds.map((need, index) => {
                                    const module = educationModules.find((m) => m.title.includes(need.split(" ")[0]))
                                    return (
                                      <div key={index} className="p-2 bg-white rounded border">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium text-sm">{need}</span>
                                          {module && (
                                            <Badge className="bg-green-100 text-green-800">
                                              <Star className="h-3 w-3 mr-1" />
                                              {module.starRatingImpact}
                                            </Badge>
                                          )}
                                        </div>
                                        {module && (
                                          <div className="text-xs text-gray-600">
                                            <p>Duration: {module.duration}</p>
                                            <p>Difficulty: {module.difficulty}</p>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>

                              {staff.improvementPlan.active && (
                                <div className="p-3 bg-orange-50 rounded border-l-4 border-orange-400">
                                  <h5 className="font-medium text-orange-800 mb-2">
                                    Current Improvement Plan Progress
                                  </h5>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span>Overall Progress:</span>
                                      <span className="font-medium">{staff.improvementPlan.progress}%</span>
                                    </div>
                                    <Progress value={staff.improvementPlan.progress} className="h-2" />
                                    <div className="text-sm text-orange-700">
                                      <p>
                                        Modules: {staff.improvementPlan.completedModules}/
                                        {staff.improvementPlan.totalModules} completed
                                      </p>
                                      <p>Target Date: {staff.improvementPlan.targetDate}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Recent Errors with Education */}
                        {staff.recentErrors.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Recent Documentation Errors & Education</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {staff.recentErrors.map((error, index) => (
                                  <div key={index} className="p-3 border rounded">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium">
                                        {error.orderId} - {error.errorType}
                                      </span>
                                      <div className="flex items-center space-x-2">
                                        <Badge
                                          className={
                                            error.severity === "High"
                                              ? "bg-red-100 text-red-800"
                                              : error.severity === "Medium"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-blue-100 text-blue-800"
                                          }
                                        >
                                          {error.severity}
                                        </Badge>
                                        <Badge
                                          className={
                                            error.educationProvided
                                              ? "bg-green-100 text-green-800"
                                              : "bg-orange-100 text-orange-800"
                                          }
                                        >
                                          {error.educationProvided ? "Education Provided" : "Education Pending"}
                                        </Badge>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{error.description}</p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500">{error.date}</span>
                                      {!error.educationProvided && (
                                        <Button size="sm" variant="outline">
                                          <GraduationCap className="h-3 w-3 mr-1" />
                                          Provide Education
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        <div className="flex space-x-3">
                          <Button onClick={() => generateImprovementPlan(staff.id)}>
                            <Brain className="h-4 w-4 mr-2" />
                            Generate New Improvement Plan
                          </Button>
                          <Button variant="outline">
                            <Award className="h-4 w-4 mr-2" />
                            Assign Education Modules
                          </Button>
                          <Button variant="outline" onClick={() => setShowStaffEducation(false)}>
                            Close
                          </Button>
                        </div>
                      </>
                    )
                  })()}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* QA Review Modal */}
        {showQAReview && (
          <Dialog open={showQAReview} onOpenChange={setShowQAReview}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                  QA Review with Education Triggers - {selectedOrder}
                </DialogTitle>
                <DialogDescription>
                  Comprehensive quality assurance review and approval workflow with automated staff education
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Order Details */}
                {selectedOrder &&
                  (() => {
                    const order = recentOrders.find((o) => o.id === selectedOrder)
                    if (!order) return null

                    return (
                      <>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Order Summary</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="font-medium">Patient</Label>
                                <p>{order.patientName}</p>
                              </div>
                              <div>
                                <Label className="font-medium">Order Type</Label>
                                <p>{order.orderType}</p>
                              </div>
                              <div>
                                <Label className="font-medium">Clinician</Label>
                                <p>{order.clinician}</p>
                              </div>
                              <div>
                                <Label className="font-medium">Physician</Label>
                                <p>{order.physician}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Quality Metrics */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Quality Metrics</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-blue-50 rounded">
                                <div className="text-xl font-bold text-blue-600">{order.chartCompliance}%</div>
                                <p className="text-sm text-blue-700">Chart Compliance</p>
                              </div>
                              <div className="text-center p-3 bg-green-50 rounded">
                                <div className="text-xl font-bold text-green-600">{order.visitMatchRate}%</div>
                                <p className="text-sm text-green-700">Visit Match</p>
                              </div>
                              <div className="text-center p-3 bg-yellow-50 rounded">
                                <div className="text-xl font-bold text-yellow-600">{order.goalProgress}%</div>
                                <p className="text-sm text-yellow-700">Goal Progress</p>
                              </div>
                              <div className="text-center p-3 bg-purple-50 rounded">
                                <div className="text-xl font-bold text-purple-600 flex items-center justify-center">
                                  <Star className="h-4 w-4 mr-1" />
                                  {order.starRatingImpact}
                                </div>
                                <p className="text-sm text-purple-700">Star Rating</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* QA Flags with Education Recommendations */}
                        {order.qaFlags.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg text-red-600">
                                Quality Issues Identified with Education Recommendations
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {order.qaFlags.map((flag, index) => (
                                  <div
                                    key={index}
                                    className={`p-3 rounded border-l-4 ${
                                      flag.severity === "High"
                                        ? "bg-red-50 border-red-500"
                                        : flag.severity === "Medium"
                                          ? "bg-yellow-50 border-yellow-500"
                                          : "bg-blue-50 border-blue-500"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium">{flag.type}</span>
                                      <div className="flex items-center space-x-2">
                                        <Badge
                                          className={
                                            flag.severity === "High"
                                              ? "bg-red-100 text-red-800"
                                              : flag.severity === "Medium"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-blue-100 text-blue-800"
                                          }
                                        >
                                          {flag.severity}
                                        </Badge>
                                        {flag.educationRecommended && (
                                          <Badge className="bg-orange-100 text-orange-800">
                                            <GraduationCap className="h-3 w-3 mr-1" />
                                            Education Recommended
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2">{flag.description}</p>
                                    {flag.educationModule && (
                                      <div className="p-2 bg-orange-100 rounded">
                                        <p className="text-xs text-orange-700">
                                          <Lightbulb className="h-3 w-3 inline mr-1" />
                                          Recommended education module: <strong>{flag.educationModule}</strong>
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* QA Decision with Education Trigger */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">QA Decision & Education Plan</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label htmlFor="qa-action">QA Action</Label>
                              <Select
                                value={selectedQAAction}
                                onValueChange={(value: "approve" | "reject" | "revision") => setSelectedQAAction(value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="approve">Approve for Signature</SelectItem>
                                  <SelectItem value="revision">Request Revision</SelectItem>
                                  <SelectItem value="reject">Reject Order</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="qa-comments">QA Comments & Recommendations</Label>
                              <Textarea
                                id="qa-comments"
                                placeholder="Enter your QA review comments, recommendations for improvement, or revision requirements..."
                                value={qaComments}
                                onChange={(e) => setQaComments(e.target.value)}
                                rows={4}
                              />
                            </div>

                            {(selectedQAAction === "revision" || selectedQAAction === "reject") &&
                              order.qaFlags.some((flag) => flag.educationRecommended) && (
                                <div className="p-3 bg-orange-50 rounded border-l-4 border-orange-400">
                                  <h4 className="font-medium text-orange-800 mb-2">
                                    <GraduationCap className="h-4 w-4 inline mr-2" />
                                    Education Plan Will Be Triggered
                                  </h4>
                                  <div className="text-sm text-orange-700">
                                    <p className="mb-2">
                                      The following education modules will be automatically assigned to{" "}
                                      <strong>{order.clinician}</strong>:
                                    </p>
                                    <ul className="space-y-1">
                                      {order.qaFlags
                                        .filter((flag) => flag.educationRecommended && flag.educationModule)
                                        .map((flag, index) => (
                                          <li key={index} className="flex items-center">
                                            <BookMarked className="h-3 w-3 mr-2" />
                                            {flag.educationModule} - {flag.type}
                                          </li>
                                        ))}
                                    </ul>
                                    <p className="mt-2 text-xs">
                                      Staff will be notified and education completion will be tracked.
                                    </p>
                                  </div>
                                </div>
                              )}

                            <div className="flex space-x-3">
                              <Button
                                className="flex-1"
                                onClick={() => handleQAAction(selectedOrder, selectedQAAction, qaComments)}
                              >
                                {selectedQAAction === "approve" && <CheckCircle className="h-4 w-4 mr-2" />}
                                {selectedQAAction === "revision" && <RotateCcw className="h-4 w-4 mr-2" />}
                                {selectedQAAction === "reject" && <XCircle className="h-4 w-4 mr-2" />}
                                {selectedQAAction === "approve"
                                  ? "Approve & Send for Signature"
                                  : selectedQAAction === "revision"
                                    ? "Return for Revision & Trigger Education"
                                    : "Reject Order & Trigger Education"}
                              </Button>
                              <Button variant="outline" onClick={() => setShowQAReview(false)}>
                                Cancel
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )
                  })()}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Chart Review Modal */}
        {showChartReview && (
          <Dialog open={showChartReview} onOpenChange={setShowChartReview}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                  Comprehensive Chart Review with Education Integration - {selectedOrder}
                </DialogTitle>
                <DialogDescription>
                  AI-powered analysis of all clinical notes, visits, and documentation with staff education
                  recommendations
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {selectedOrder &&
                  (() => {
                    const order = recentOrders.find((o) => o.id === selectedOrder)
                    if (!order) return null

                    return (
                      <>
                        {/* Chart Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Clinical Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Total Notes:</span>
                                  <span className="font-medium">{order.chartNotes.totalNotes}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Reviewed:</span>
                                  <span className="font-medium">{order.chartNotes.reviewedNotes}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Flagged:</span>
                                  <span className="font-medium text-red-600">{order.chartNotes.flaggedNotes}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Compliance:</span>
                                  <span
                                    className={`font-medium ${getComplianceColor(order.chartNotes.complianceScore)}`}
                                  >
                                    {order.chartNotes.complianceScore}%
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Visit Analysis</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Scheduled:</span>
                                  <span className="font-medium">{order.visitAnalysis.scheduledVisits}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Completed:</span>
                                  <span className="font-medium">{order.visitAnalysis.completedVisits}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">POC Match:</span>
                                  <span className="font-medium text-green-600">{order.visitAnalysis.matchingPOC}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Discrepancies:</span>
                                  <span className="font-medium text-red-600">{order.visitAnalysis.discrepancies}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Goal Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Total Goals:</span>
                                  <span className="font-medium">{order.goalTracking.totalGoals}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">On Track:</span>
                                  <span className="font-medium text-green-600">{order.goalTracking.onTrackGoals}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">At Risk:</span>
                                  <span className="font-medium text-red-600">{order.goalTracking.atRiskGoals}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Completed:</span>
                                  <span className="font-medium text-blue-600">{order.goalTracking.completedGoals}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Detailed Chart Analysis with Education Recommendations */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">
                              AI-Powered Chart Analysis & Education Recommendations
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Mock detailed analysis */}
                              <div className="p-4 bg-blue-50 rounded">
                                <h4 className="font-medium text-blue-800 mb-2">Documentation Quality Analysis</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="font-medium">Strengths Identified:</p>
                                    <ul className="text-blue-700 mt-1 space-y-1">
                                      <li>• Comprehensive initial assessment documented</li>
                                      <li>• Clear care plan objectives established</li>
                                      <li>• Regular progress notes maintained</li>
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="font-medium">Areas for Improvement:</p>
                                    <ul className="text-blue-700 mt-1 space-y-1">
                                      <li>• Medication reconciliation incomplete</li>
                                      <li>• Patient response documentation inconsistent</li>
                                      <li>• Vital signs recording format varies</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              {order.qaFlags.length > 0 && (
                                <div className="p-4 bg-red-50 rounded">
                                  <h4 className="font-medium text-red-800 mb-2">
                                    Critical Issues Found - Education Plan Triggered
                                  </h4>
                                  <div className="space-y-3">
                                    {order.qaFlags.map((flag, index) => (
                                      <div key={index} className="p-3 bg-white rounded border-l-4 border-red-400">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-medium text-red-700">{flag.type}</span>
                                          <div className="flex items-center space-x-2">
                                            <Badge
                                              className={
                                                flag.severity === "High"
                                                  ? "bg-red-100 text-red-800"
                                                  : flag.severity === "Medium"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-blue-100 text-blue-800"
                                              }
                                            >
                                              {flag.severity}
                                            </Badge>
                                            {flag.educationRecommended && (
                                              <Badge className="bg-orange-100 text-orange-800">
                                                <GraduationCap className="h-3 w-3 mr-1" />
                                                Education Required
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-sm text-red-600 mb-2">{flag.description}</p>
                                        {flag.educationModule && (
                                          <div className="p-2 bg-orange-100 rounded">
                                            <p className="text-xs text-orange-700">
                                              <BookMarked className="h-3 w-3 inline mr-1" />
                                              Recommended education: <strong>{flag.educationModule}</strong>
                                            </p>
                                            <p className="text-xs text-orange-600 mt-1">
                                              This module will be automatically assigned to {order.clinician} for
                                              completion.
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Staff Performance Context */}
                              <div className="p-4 bg-gray-50 rounded">
                                <h4 className="font-medium text-gray-800 mb-2">Staff Performance Context</h4>
                                <div className="text-sm text-gray-600">
                                  <p>
                                    <strong>{order.clinician}</strong> has a current documentation score of{" "}
                                    {staffPerformanceData.find((s) => s.id === order.clinicianId)?.documentationScore ||
                                      "N/A"}
                                    % with{" "}
                                    {staffPerformanceData.find((s) => s.id === order.clinicianId)?.improvementTrend ||
                                      "stable"}{" "}
                                    trend.
                                  </p>
                                  {order.qaFlags.some((flag) => flag.educationRecommended) && (
                                    <p className="mt-2 text-orange-600">
                                      <Lightbulb className="h-3 w-3 inline mr-1" />
                                      Based on the issues identified, personalized education modules will be assigned to
                                      improve documentation quality and prevent similar issues in future orders.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="flex space-x-3">
                          <Button
                            onClick={() => {
                              setShowChartReview(false)
                              setSelectedOrder(order.id)
                              setShowQAReview(true)
                            }}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Proceed to QA Review
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedStaff(order.clinicianId)
                              setShowStaffEducation(true)
                            }}
                          >
                            <GraduationCap className="h-4 w-4 mr-2" />
                            Staff Education Plan
                          </Button>
                          <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export Analysis
                          </Button>
                          <Button variant="outline" onClick={() => setShowChartReview(false)}>
                            Close
                          </Button>
                        </div>
                      </>
                    )
                  })()}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  )
}
