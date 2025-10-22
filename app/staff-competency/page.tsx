"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  BookOpen,
  FileText,
  Plus,
  Search,
  Filter,
  Star,
  Users,
  Activity,
  Brain,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"

interface CompetencyArea {
  id: string
  name: string
  description: string
  weight: number
  skills: CompetencySkill[]
}

interface CompetencySkill {
  id: string
  name: string
  description: string
  required: boolean
  assessmentMethod: "demonstration" | "written" | "observation" | "simulation"
  passingScore: number
  selfAssessment?: number
  supervisorAssessment?: number
  status: "not-assessed" | "competent" | "needs-improvement" | "not-competent"
  lastAssessed?: string
  nextDue?: string
  evidence?: string[]
}

interface StaffCompetencyRecord {
  id: string
  staffId: string
  staffName: string
  staffRole: string
  department: string
  overallCompetencyScore: number
  competencyAreas: CompetencyArea[]
  lastAssessment: string
  nextAssessment: string
  status: "competent" | "developing" | "needs-improvement" | "not-competent"
  assessorName: string
}

export default function StaffCompetencyPage() {
  const [currentUser] = useState(getCurrentUser())
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedStaff, setSelectedStaff] = useState<string>("")
  const [selectedCompetencyArea, setSelectedCompetencyArea] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAssessing, setIsAssessing] = useState(false)

  // Role-specific competency areas
  const getCompetencyAreasForRole = (role: string): CompetencyArea[] => {
    const baseAreas: CompetencyArea[] = [
      {
        id: "safety-compliance",
        name: "Safety & Compliance",
        description: "Infection control, safety protocols, and regulatory compliance",
        weight: 25,
        skills: [
          {
            id: "hand-hygiene",
            name: "Hand Hygiene",
            description: "Proper hand washing and sanitization techniques",
            required: true,
            assessmentMethod: "demonstration",
            passingScore: 90,
            selfAssessment: 95,
            supervisorAssessment: 92,
            status: "competent",
            lastAssessed: "2024-01-15",
            nextDue: "2024-07-15",
            evidence: ["Direct observation", "Skills checklist"],
          },
          {
            id: "ppe-usage",
            name: "Personal Protective Equipment",
            description: "Proper donning, doffing, and disposal of PPE",
            required: true,
            assessmentMethod: "demonstration",
            passingScore: 85,
            selfAssessment: 88,
            supervisorAssessment: 90,
            status: "competent",
            lastAssessed: "2024-01-15",
            nextDue: "2024-07-15",
            evidence: ["Skills demonstration", "Written test"],
          },
          {
            id: "infection-control",
            name: "Infection Control Protocols",
            description: "Understanding and implementation of infection prevention measures",
            required: true,
            assessmentMethod: "written",
            passingScore: 80,
            selfAssessment: 85,
            supervisorAssessment: 87,
            status: "competent",
            lastAssessed: "2024-01-10",
            nextDue: "2025-01-10",
            evidence: ["Written examination", "Policy review"],
          },
        ],
      },
      {
        id: "communication",
        name: "Communication Skills",
        description: "Patient, family, and team communication competencies",
        weight: 20,
        skills: [
          {
            id: "patient-communication",
            name: "Patient Communication",
            description: "Effective communication with patients and families",
            required: true,
            assessmentMethod: "observation",
            passingScore: 85,
            selfAssessment: 90,
            supervisorAssessment: 88,
            status: "competent",
            lastAssessed: "2024-01-12",
            nextDue: "2024-07-12",
            evidence: ["Direct observation", "Patient feedback"],
          },
          {
            id: "team-communication",
            name: "Interdisciplinary Communication",
            description: "Effective communication with healthcare team members",
            required: true,
            assessmentMethod: "observation",
            passingScore: 80,
            selfAssessment: 85,
            supervisorAssessment: 83,
            status: "competent",
            lastAssessed: "2024-01-12",
            nextDue: "2024-07-12",
            evidence: ["Peer feedback", "Team meetings"],
          },
        ],
      },
      {
        id: "documentation",
        name: "Documentation",
        description: "Accurate and timely documentation of care and services",
        weight: 15,
        skills: [
          {
            id: "clinical-documentation",
            name: "Clinical Documentation",
            description: "Accurate documentation of patient care and assessments",
            required: true,
            assessmentMethod: "observation",
            passingScore: 85,
            selfAssessment: 80,
            supervisorAssessment: 82,
            status: "competent",
            lastAssessed: "2024-01-08",
            nextDue: "2024-07-08",
            evidence: ["Chart review", "Documentation audit"],
          },
        ],
      },
    ]

    // Add role-specific competency areas
    const roleSpecificAreas: Record<string, CompetencyArea[]> = {
      RN: [
        {
          id: "clinical-assessment",
          name: "Clinical Assessment",
          description: "Comprehensive patient assessment and clinical decision-making",
          weight: 30,
          skills: [
            {
              id: "patient-assessment",
              name: "Comprehensive Patient Assessment",
              description: "Systematic head-to-toe assessment and vital signs",
              required: true,
              assessmentMethod: "demonstration",
              passingScore: 90,
              selfAssessment: 92,
              supervisorAssessment: 90,
              status: "competent",
              lastAssessed: "2024-01-15",
              nextDue: "2024-07-15",
              evidence: ["Skills demonstration", "Competency checklist"],
            },
            {
              id: "medication-administration",
              name: "Medication Administration",
              description: "Safe medication preparation, administration, and monitoring",
              required: true,
              assessmentMethod: "demonstration",
              passingScore: 95,
              selfAssessment: 94,
              supervisorAssessment: 96,
              status: "competent",
              lastAssessed: "2024-01-15",
              nextDue: "2024-07-15",
              evidence: ["Direct observation", "Medication test"],
            },
            {
              id: "wound-care",
              name: "Wound Assessment and Care",
              description: "Wound assessment, dressing changes, and healing monitoring",
              required: true,
              assessmentMethod: "demonstration",
              passingScore: 85,
              selfAssessment: 88,
              supervisorAssessment: 87,
              status: "competent",
              lastAssessed: "2024-01-10",
              nextDue: "2024-07-10",
              evidence: ["Skills demonstration", "Photo documentation"],
            },
          ],
        },
        {
          id: "supervision-delegation",
          name: "Supervision & Delegation",
          description: "Supervision of LPNs and HHAs, appropriate delegation",
          weight: 10,
          skills: [
            {
              id: "delegation-skills",
              name: "Appropriate Delegation",
              description: "Delegation of tasks within scope of practice",
              required: true,
              assessmentMethod: "observation",
              passingScore: 85,
              selfAssessment: 87,
              supervisorAssessment: 85,
              status: "competent",
              lastAssessed: "2024-01-12",
              nextDue: "2024-07-12",
              evidence: ["Supervision observation", "Staff feedback"],
            },
          ],
        },
      ],
      LPN: [
        {
          id: "clinical-skills",
          name: "Clinical Skills",
          description: "LPN-specific clinical competencies under RN supervision",
          weight: 30,
          skills: [
            {
              id: "basic-assessment",
              name: "Basic Patient Assessment",
              description: "Vital signs, basic observations, and data collection",
              required: true,
              assessmentMethod: "demonstration",
              passingScore: 85,
              selfAssessment: 88,
              supervisorAssessment: 86,
              status: "competent",
              lastAssessed: "2024-01-14",
              nextDue: "2024-07-14",
              evidence: ["Skills demonstration", "Competency checklist"],
            },
            {
              id: "medication-assistance",
              name: "Medication Administration (Supervised)",
              description: "Medication administration under RN supervision",
              required: true,
              assessmentMethod: "demonstration",
              passingScore: 90,
              selfAssessment: 85,
              supervisorAssessment: 87,
              status: "competent",
              lastAssessed: "2024-01-14",
              nextDue: "2024-07-14",
              evidence: ["Direct observation", "Medication competency"],
            },
          ],
        },
      ],
      HHA: [
        {
          id: "personal-care",
          name: "Personal Care",
          description: "Activities of daily living and personal care assistance",
          weight: 35,
          skills: [
            {
              id: "adl-assistance",
              name: "Activities of Daily Living",
              description: "Assistance with bathing, dressing, grooming, and mobility",
              required: true,
              assessmentMethod: "demonstration",
              passingScore: 80,
              selfAssessment: 85,
              supervisorAssessment: 83,
              status: "competent",
              lastAssessed: "2024-01-16",
              nextDue: "2024-07-16",
              evidence: ["Skills demonstration", "Patient feedback"],
            },
            {
              id: "transfer-techniques",
              name: "Safe Transfer Techniques",
              description: "Safe patient transfers and mobility assistance",
              required: true,
              assessmentMethod: "demonstration",
              passingScore: 85,
              selfAssessment: 80,
              supervisorAssessment: 82,
              status: "needs-improvement",
              lastAssessed: "2024-01-16",
              nextDue: "2024-02-16",
              evidence: ["Skills demonstration", "Safety checklist"],
            },
          ],
        },
      ],
      PT: [
        {
          id: "therapy-assessment",
          name: "Therapy Assessment",
          description: "Physical therapy evaluation and treatment planning",
          weight: 35,
          skills: [
            {
              id: "physical-assessment",
              name: "Physical Therapy Assessment",
              description: "Comprehensive PT evaluation and functional assessment",
              required: true,
              assessmentMethod: "demonstration",
              passingScore: 90,
              selfAssessment: 92,
              supervisorAssessment: 91,
              status: "competent",
              lastAssessed: "2024-01-18",
              nextDue: "2024-07-18",
              evidence: ["Assessment documentation", "Skills demonstration"],
            },
            {
              id: "treatment-planning",
              name: "Treatment Plan Development",
              description: "Development of individualized PT treatment plans",
              required: true,
              assessmentMethod: "written",
              passingScore: 85,
              selfAssessment: 88,
              supervisorAssessment: 87,
              status: "competent",
              lastAssessed: "2024-01-18",
              nextDue: "2024-07-18",
              evidence: ["Treatment plans", "Case studies"],
            },
          ],
        },
      ],
      OT: [
        {
          id: "occupational-assessment",
          name: "Occupational Assessment",
          description: "Occupational therapy evaluation and intervention",
          weight: 35,
          skills: [
            {
              id: "functional-assessment",
              name: "Functional Assessment",
              description: "Assessment of daily living skills and functional capacity",
              required: true,
              assessmentMethod: "demonstration",
              passingScore: 90,
              selfAssessment: 89,
              supervisorAssessment: 88,
              status: "competent",
              lastAssessed: "2024-01-20",
              nextDue: "2024-07-20",
              evidence: ["Assessment tools", "Skills demonstration"],
            },
            {
              id: "adaptive-equipment",
              name: "Adaptive Equipment Training",
              description: "Training patients in use of adaptive equipment",
              required: true,
              assessmentMethod: "demonstration",
              passingScore: 85,
              selfAssessment: 87,
              supervisorAssessment: 86,
              status: "competent",
              lastAssessed: "2024-01-20",
              nextDue: "2024-07-20",
              evidence: ["Equipment training", "Patient outcomes"],
            },
          ],
        },
      ],
    }

    return [...baseAreas, ...(roleSpecificAreas[role] || [])]
  }

  // Mock staff competency records
  const staffCompetencyRecords: StaffCompetencyRecord[] = [
    {
      id: "COMP-REC-001",
      staffId: "STAFF-001",
      staffName: "Sarah Johnson",
      staffRole: "RN",
      department: "Clinical",
      overallCompetencyScore: 91,
      competencyAreas: getCompetencyAreasForRole("RN"),
      lastAssessment: "2024-01-15",
      nextAssessment: "2024-07-15",
      status: "competent",
      assessorName: "Dr. Martinez",
    },
    {
      id: "COMP-REC-002",
      staffId: "STAFF-002",
      staffName: "Lisa Garcia",
      staffRole: "LPN",
      department: "Clinical",
      overallCompetencyScore: 86,
      competencyAreas: getCompetencyAreasForRole("LPN"),
      lastAssessment: "2024-01-14",
      nextAssessment: "2024-07-14",
      status: "competent",
      assessorName: "Sarah Johnson",
    },
    {
      id: "COMP-REC-003",
      staffId: "STAFF-003",
      staffName: "Robert Thompson",
      staffRole: "HHA",
      department: "Personal Care",
      overallCompetencyScore: 78,
      competencyAreas: getCompetencyAreasForRole("HHA"),
      lastAssessment: "2024-01-16",
      nextAssessment: "2024-02-16",
      status: "needs-improvement",
      assessorName: "Sarah Johnson",
    },
    {
      id: "COMP-REC-004",
      staffId: "STAFF-004",
      staffName: "Michael Chen",
      staffRole: "PT",
      department: "Therapy",
      overallCompetencyScore: 89,
      competencyAreas: getCompetencyAreasForRole("PT"),
      lastAssessment: "2024-01-18",
      nextAssessment: "2024-07-18",
      status: "competent",
      assessorName: "Jane Smith",
    },
    {
      id: "COMP-REC-005",
      staffId: "STAFF-005",
      staffName: "Emily Davis",
      staffRole: "OT",
      department: "Therapy",
      overallCompetencyScore: 87,
      competencyAreas: getCompetencyAreasForRole("OT"),
      lastAssessment: "2024-01-20",
      nextAssessment: "2024-07-20",
      status: "competent",
      assessorName: "Patricia Wilson",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "competent":
        return <Badge className="bg-green-100 text-green-800">Competent</Badge>
      case "developing":
        return <Badge className="bg-blue-100 text-blue-800">Developing</Badge>
      case "needs-improvement":
        return <Badge className="bg-yellow-100 text-yellow-800">Needs Improvement</Badge>
      case "not-competent":
        return <Badge className="bg-red-100 text-red-800">Not Competent</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getSkillStatusBadge = (status: string) => {
    switch (status) {
      case "competent":
        return <Badge className="bg-green-100 text-green-800">Competent</Badge>
      case "needs-improvement":
        return <Badge className="bg-yellow-100 text-yellow-800">Needs Improvement</Badge>
      case "not-competent":
        return <Badge className="bg-red-100 text-red-800">Not Competent</Badge>
      case "not-assessed":
        return <Badge className="bg-gray-100 text-gray-800">Not Assessed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const filteredRecords = staffCompetencyRecords.filter((record) => {
    const matchesSearch =
      record.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.staffRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || record.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getOverviewStats = () => {
    const totalStaff = staffCompetencyRecords.length
    const competentStaff = staffCompetencyRecords.filter((r) => r.status === "competent").length
    const needsImprovement = staffCompetencyRecords.filter((r) => r.status === "needs-improvement").length
    const averageScore =
      staffCompetencyRecords.reduce((sum, record) => sum + record.overallCompetencyScore, 0) / totalStaff

    return {
      totalStaff,
      competentStaff,
      needsImprovement,
      averageScore: Math.round(averageScore),
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
                  <Shield className="h-6 w-6 mr-3 text-blue-600" />
                  Competency Assessment
                </h1>
                <p className="text-gray-600">
                  Evaluate skills, knowledge, and abilities required for safe and effective job performance
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Assessment
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assessments">Staff Assessments</TabsTrigger>
            <TabsTrigger value="skills-matrix">Skills Matrix</TabsTrigger>
            <TabsTrigger value="ai-assessment">AI Assessment</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Staff</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalStaff}</p>
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
                      <p className="text-sm font-medium text-gray-600">Competent</p>
                      <p className="text-2xl font-bold text-green-600">{stats.competentStaff}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Needs Improvement</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.needsImprovement}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Star className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Average Score</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.averageScore}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Competency vs Performance Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                    Competency Assessment
                  </CardTitle>
                  <CardDescription>Focus: Can they do the job?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Purpose</h4>
                      <p className="text-sm text-blue-700">
                        Evaluates whether a homecare worker has the necessary skills, knowledge, and abilities to
                        perform their assigned job duties safely and effectively.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Assessment Methods:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Skills demonstrations</li>
                        <li>• Written examinations</li>
                        <li>• Direct observation</li>
                        <li>• Simulation exercises</li>
                        <li>• Competency checklists</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Timing:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Initial assessment (hiring/onboarding)</li>
                        <li>• Annual competency validation</li>
                        <li>• Skills-specific assessments</li>
                        <li>• After training or policy changes</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-green-600" />
                    Performance Evaluation
                  </CardTitle>
                  <CardDescription>Focus: How well are they doing the job?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Purpose</h4>
                      <p className="text-sm text-green-700">
                        Assesses how well a homecare worker actually performs their assigned job responsibilities and
                        tasks over time, including productivity and quality of care.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Assessment Methods:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Performance metrics and goals</li>
                        <li>• Behavioral observations</li>
                        <li>• Patient/family feedback</li>
                        <li>• Peer evaluations</li>
                        <li>• Self-assessment reviews</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Timing:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Annual performance reviews</li>
                        <li>• Mid-year check-ins</li>
                        <li>• Probationary evaluations</li>
                        <li>• Performance improvement plans</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Assessments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Competency Assessments</CardTitle>
                <CardDescription>Latest competency evaluations and their outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffCompetencyRecords.slice(0, 3).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{record.staffName}</h3>
                          <p className="text-sm text-gray-600">
                            {record.staffRole} • {record.department}
                          </p>
                          <p className="text-xs text-gray-500">
                            Last assessed: {record.lastAssessment} by {record.assessorName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{record.overallCompetencyScore}%</div>
                          <p className="text-xs text-gray-500">Overall Score</p>
                        </div>
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

          <TabsContent value="assessments" className="space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Staff Competency Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <Label htmlFor="search">Search Staff</Label>
                    <Input
                      id="search"
                      placeholder="Search by name, role, or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status-filter">Competency Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="competent">Competent</SelectItem>
                        <SelectItem value="developing">Developing</SelectItem>
                        <SelectItem value="needs-improvement">Needs Improvement</SelectItem>
                        <SelectItem value="not-competent">Not Competent</SelectItem>
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

                {/* Staff Competency Records */}
                <div className="space-y-4">
                  {filteredRecords.map((record) => (
                    <Card key={record.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                              <Shield className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{record.staffName}</h3>
                              <p className="text-gray-600">
                                {record.staffRole} • {record.department}
                              </p>
                              <p className="text-sm text-gray-500">
                                Assessed by: {record.assessorName} • Next due: {record.nextAssessment}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{record.overallCompetencyScore}%</div>
                              <p className="text-xs text-gray-500">Overall Score</p>
                            </div>
                            {getStatusBadge(record.status)}
                          </div>
                        </div>

                        {/* Competency Areas Progress */}
                        <div className="space-y-3">
                          {record.competencyAreas.map((area) => {
                            const competentSkills = area.skills.filter((skill) => skill.status === "competent").length
                            const totalSkills = area.skills.length
                            const progressPercentage = (competentSkills / totalSkills) * 100

                            return (
                              <div key={area.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">{area.name}</h4>
                                  <Badge variant="outline">Weight: {area.weight}%</Badge>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-gray-600">
                                    {competentSkills} of {totalSkills} skills competent
                                  </span>
                                  <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
                                </div>
                                <Progress value={progressPercentage} className="h-2" />
                              </div>
                            )
                          })}
                        </div>

                        <div className="flex justify-end space-x-2 mt-4">
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            View Report
                          </Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Target className="h-4 w-4 mr-2" />
                            Assess Skills
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills-matrix" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Skills Competency Matrix
                </CardTitle>
                <CardDescription>Detailed breakdown of individual skills and competencies by role</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Role Selection */}
                <div className="mb-6">
                  <Label htmlFor="role-select">Select Role to View Skills Matrix</Label>
                  <Select defaultValue="RN">
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder="Choose role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RN">Registered Nurse (RN)</SelectItem>
                      <SelectItem value="LPN">Licensed Practical Nurse (LPN)</SelectItem>
                      <SelectItem value="HHA">Home Health Aide (HHA)</SelectItem>
                      <SelectItem value="PT">Physical Therapist (PT)</SelectItem>
                      <SelectItem value="OT">Occupational Therapist (OT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Skills Matrix for RN */}
                <div className="space-y-6">
                  {getCompetencyAreasForRole("RN").map((area) => (
                    <Card key={area.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{area.name}</CardTitle>
                        <CardDescription>{area.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {area.skills.map((skill) => (
                            <div key={skill.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex-1">
                                  <h4 className="font-medium">{skill.name}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {skill.required && <Badge variant="outline">Required</Badge>}
                                  {getSkillStatusBadge(skill.status)}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label className="text-xs">Assessment Method</Label>
                                  <p className="text-sm capitalize">{skill.assessmentMethod.replace("-", " ")}</p>
                                </div>
                                <div>
                                  <Label className="text-xs">Passing Score</Label>
                                  <p className="text-sm">{skill.passingScore}%</p>
                                </div>
                                <div>
                                  <Label className="text-xs">Last Assessed</Label>
                                  <p className="text-sm">{skill.lastAssessed || "Not assessed"}</p>
                                </div>
                              </div>

                              {skill.selfAssessment && skill.supervisorAssessment && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                  <div>
                                    <Label className="text-xs">Self Assessment</Label>
                                    <div className="flex items-center space-x-2">
                                      <Progress value={skill.selfAssessment} className="flex-1" />
                                      <span className="text-sm font-medium">{skill.selfAssessment}%</span>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Supervisor Assessment</Label>
                                    <div className="flex items-center space-x-2">
                                      <Progress value={skill.supervisorAssessment} className="flex-1" />
                                      <span className="text-sm font-medium">{skill.supervisorAssessment}%</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {skill.evidence && skill.evidence.length > 0 && (
                                <div className="mt-4">
                                  <Label className="text-xs">Evidence of Competency</Label>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {skill.evidence.map((evidence, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {evidence}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-assessment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-600" />
                  AI-Powered Competency Assessment
                </CardTitle>
                <CardDescription>
                  Advanced AI analysis for real-time competency evaluation and skills validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center mb-4">
                        <Zap className="h-6 w-6 text-purple-600 mr-3" />
                        <h3 className="font-semibold text-purple-800">AI Assessment Features</h3>
                      </div>
                      <ul className="space-y-2 text-sm text-purple-700">
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Real-time video analysis of clinical skills
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Automated competency scoring and feedback
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Pattern recognition for safety protocols
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Objective assessment with bias reduction
                        </li>
                        <li className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Instant documentation and reporting
                        </li>
                      </ul>
                    </div>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Start AI Assessment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="ai-staff">Select Staff Member</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose staff member" />
                              </SelectTrigger>
                              <SelectContent>
                                {staffCompetencyRecords.map((record) => (
                                  <SelectItem key={record.id} value={record.staffId}>
                                    {record.staffName} - {record.staffRole}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="ai-competency">Competency Area</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select competency to assess" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="clinical-assessment">Clinical Assessment</SelectItem>
                                <SelectItem value="medication-admin">Medication Administration</SelectItem>
                                <SelectItem value="wound-care">Wound Care</SelectItem>
                                <SelectItem value="safety-protocols">Safety Protocols</SelectItem>
                                <SelectItem value="patient-communication">Patient Communication</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Link href="/ai-competency-evaluator">
                            <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                              <Brain className="h-4 w-4 mr-2" />
                              Start AI Assessment
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Recent AI Assessments</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Sarah Johnson - Medication Administration</h4>
                              <Badge className="bg-green-100 text-green-800">95% Competent</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">AI Confidence: 94% • Duration: 12 minutes</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              Completed 2 hours ago
                            </div>
                          </div>

                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Michael Chen - Patient Assessment</h4>
                              <Badge className="bg-blue-100 text-blue-800">88% Competent</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">AI Confidence: 91% • Duration: 15 minutes</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              Completed 1 day ago
                            </div>
                          </div>

                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Emily Davis - Safety Protocols</h4>
                              <Badge className="bg-yellow-100 text-yellow-800">76% Needs Improvement</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">AI Confidence: 89% • Duration: 10 minutes</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              Completed 2 days ago
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">AI Assessment Analytics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Total AI Assessments</span>
                            <span className="font-bold">47</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Average AI Confidence</span>
                            <span className="font-bold text-purple-600">92%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Time Saved vs Manual</span>
                            <span className="font-bold text-green-600">68%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Assessment Accuracy</span>
                            <span className="font-bold text-blue-600">94%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
