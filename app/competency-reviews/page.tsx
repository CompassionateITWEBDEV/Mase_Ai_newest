"use client"

import { useEffect, useState } from "react"
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
  const [supervisorScore, setSupervisorScore] = useState<number | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)

  // Loaded from API: submitted competency and performance evaluations pending review
  const [evaluationReviews, setEvaluationReviews] = useState<EvaluationReview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load real data from multiple sources
        const allReviews: EvaluationReview[] = []
        
        // 1. Load submitted self-evaluations and in-progress reviews (submitted with reviewer notes)
        try {
          // Load all evaluations (not just submitted) to get in-progress and completed ones too
          const selfEvalRes = await fetch(`/api/self-evaluations`)
          if (selfEvalRes.ok) {
            const selfEvalJson = await selfEvalRes.json()
            const allEvalRows = Array.isArray(selfEvalJson?.evaluations) ? selfEvalJson.evaluations : []
            // Filter to only include submitted, in-progress (has reviewer_notes), or approved evaluations
            const selfEvalRows = allEvalRows.filter((r: any) => 
              r.status === 'submitted' || r.status === 'approved' || (r.reviewer_notes && r.status !== 'draft')
            )
            
            // Lookup staff names/roles
            const uniqueIds = Array.from(new Set(selfEvalRows.map((r: any) => r.staff_id).filter(Boolean)))
            let idToStaff: Record<string, { name?: string; role_id?: string; department?: string }> = {}
            
            if (uniqueIds.length) {
              try {
                // Use staff/list API and filter by IDs
                const lookupRes = await fetch(`/api/staff/list`)
                if (lookupRes.ok) {
                  const lookupJson = await lookupRes.json()
                  const allStaff = Array.isArray(lookupJson?.staff) ? lookupJson.staff : []
                  const filteredStaff = allStaff.filter((s: any) => uniqueIds.includes(s.id))
                  idToStaff = filteredStaff.reduce((acc: any, s: any) => {
                    acc[s.id] = { name: s.name, role_id: s.role_id, department: s.department }
                    return acc
                  }, {})
                }
              } catch (lookupError) {
                console.error('Error looking up staff:', lookupError)
              }
            }

            const selfEvalMapped: EvaluationReview[] = selfEvalRows.map((r: any) => {
              // Determine status based on evaluation state:
              // - "pending": submitted but not yet viewed/started (no reviewer_notes)
              // - "in-progress": submitted and has reviewer_notes but not yet approved
              // - "approved": evaluation has been approved
              // - "completed": evaluation is completed
              let reviewStatus: "pending" | "in-progress" | "completed" | "approved" = "pending"
              
              if (r.status === 'approved') {
                // Already approved - show in completed tab
                reviewStatus = "approved"
              } else if (r.reviewer_notes && r.status === 'submitted') {
                // Has reviewer notes but not approved = in progress (na-start na pero wala pa na-complete)
                reviewStatus = "in-progress"
              } else if (r.status === 'submitted' && !r.reviewer_notes) {
                // Submitted but no reviewer notes = pending (wala pa nakita/na-view)
                reviewStatus = "pending"
              } else if (r.status === 'submitted') {
                // Fallback: submitted status
                reviewStatus = "pending"
              } else {
                reviewStatus = r.status as any
              }
              
              return {
                id: r.id,
                staffId: r.staff_id,
                staffName: idToStaff[r.staff_id]?.name || 'Unknown Staff',
                staffRole: idToStaff[r.staff_id]?.role_id || 'Staff',
                department: idToStaff[r.staff_id]?.department || 'Unknown',
                evaluationType: r.evaluation_type as "performance" | "competency",
                assessmentType: r.assessment_type as any,
                submittedAt: r.submitted_at || r.updated_at || r.created_at,
                dueDate: r.due_date || r.updated_at || r.created_at,
                priority: (r.due_date && new Date(r.due_date) < new Date()) ? "high" as const : "medium" as const,
                status: reviewStatus,
                selfAssessmentScore: r.completion_percentage ? r.completion_percentage / 20 : undefined,
                supervisorScore: r.overall_score ? r.overall_score : undefined,
                overallScore: r.overall_score ? parseFloat(r.overall_score.toString()) : undefined,
                supervisorNotes: r.reviewer_notes || undefined,
                staffResponses: r.responses || {},
                reviewerName: r.approved_by_name || undefined,
                completedAt: r.approved_at || (r.status === 'approved' ? r.updated_at : undefined),
              }
            })
            
            allReviews.push(...selfEvalMapped)
          }
        } catch (selfEvalError) {
          console.error('Error loading self-evaluations:', selfEvalError)
        }
        
        // 2. Load competency evaluations that need review (status: draft, in-progress, or with self_evaluation_status: submitted)
        try {
          const competencyRes = await fetch(`/api/staff-performance/competency`)
          if (competencyRes.ok) {
            const competencyJson = await competencyRes.json()
            const competencyRecords = Array.isArray(competencyJson?.records) ? competencyJson.records : []
            
            // Get unique staff IDs
            const competencyStaffIds = Array.from(new Set(competencyRecords.map((r: any) => r.staffId).filter(Boolean)))
            let competencyStaffMap: Record<string, { name?: string; role?: string; department?: string }> = {}
            
            if (competencyStaffIds.length) {
              try {
                const staffRes = await fetch(`/api/staff/list`)
                if (staffRes.ok) {
                  const staffJson = await staffRes.json()
                  const staffList = Array.isArray(staffJson?.staff) ? staffJson.staff : []
                  competencyStaffMap = staffList.reduce((acc: any, s: any) => {
                    if (competencyStaffIds.includes(s.id)) {
                      acc[s.id] = { name: s.name, role: s.role_id, department: s.department }
                    }
                    return acc
                  }, {})
                }
              } catch (staffError) {
                console.error('Error loading staff for competency:', staffError)
              }
            }
            
            // Map competency evaluations that need review
            const competencyReviews: EvaluationReview[] = competencyRecords
              .filter((r: any) => {
                // Include if status is draft/in-progress or if self_evaluation_status is submitted
                const status = r.status?.toLowerCase() || ''
                const selfEvalStatus = r.selfEvaluationStatus?.toLowerCase() || ''
                return status === 'draft' || status === 'in-progress' || selfEvalStatus === 'submitted' || status === 'competent' || status === 'not-competent' || status === 'needs-improvement'
              })
              .map((r: any) => {
                // Determine status for competency evaluations:
                // - "pending": submitted but no notes yet (wala pa nakita)
                // - "in-progress": has notes but not completed (na-start na pero wala pa na-complete)
                // - "completed": status is completed
                let reviewStatus: "pending" | "in-progress" | "completed" | "approved" = "pending"
                
                if (r.status === 'completed' || r.status === 'competent') {
                  reviewStatus = "completed"
                } else if (r.status === 'needs-improvement' || (r.notes && r.status !== 'completed')) {
                  // Has notes or marked as needs-improvement = in progress
                  reviewStatus = "in-progress"
                } else if (!r.notes && (r.status === 'draft' || r.selfEvaluationStatus === 'submitted')) {
                  // No notes and submitted = pending (wala pa nakita)
                  reviewStatus = "pending"
                } else {
                  reviewStatus = "pending"
                }
                
                return {
                  id: r.id,
                  staffId: r.staffId,
                  staffName: competencyStaffMap[r.staffId]?.name || r.staffName || 'Unknown Staff',
                  staffRole: competencyStaffMap[r.staffId]?.role || r.staffRole || 'Staff',
                  department: competencyStaffMap[r.staffId]?.department || r.department || 'Unknown',
                  evaluationType: "competency" as const,
                  assessmentType: (r.evaluationType || 'skills-validation') as any,
                  submittedAt: r.evaluationDate || r.createdAt || new Date().toISOString(),
                  dueDate: r.nextEvaluationDue || r.evaluationDate || new Date().toISOString(),
                  priority: (r.nextEvaluationDue && new Date(r.nextEvaluationDue) < new Date()) ? "high" as const : "medium" as const,
                  status: reviewStatus,
                  selfAssessmentScore: r.overallScore ? r.overallScore / 20 : undefined,
                  supervisorScore: r.overallScore,
                  overallScore: r.overallScore,
                  supervisorNotes: r.notes || undefined,
                  staffResponses: {},
                  reviewerName: r.evaluatorName || undefined,
                  completedAt: r.status === 'completed' ? r.evaluationDate : undefined,
                }
              })
            
            allReviews.push(...competencyReviews)
          }
        } catch (competencyError) {
          console.error('Error loading competency evaluations:', competencyError)
        }
        
        // Remove duplicates and sort by submitted date (newest first)
        // Use a Set to track unique combinations of id + evaluationType
        const seenKeys = new Set<string>()
        const uniqueReviews = allReviews.filter((review: EvaluationReview) => {
          const key = `${review.id}-${review.evaluationType}`
          if (seenKeys.has(key)) {
            console.warn('⚠️ [Duplicate Review] Skipping duplicate:', key, review)
            return false
          }
          seenKeys.add(key)
          return true
        })
        
        uniqueReviews.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        
        setEvaluationReviews(uniqueReviews)
      } catch (e: any) {
        console.error('Error loading reviews:', e)
        setError(e?.message || "Failed to load reviews")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentUser.id])

  // Mock evaluation reviews data (removed - using real data only)
  // Keeping structure for reference but not using
  const seedReviews: EvaluationReview[] = [] // Empty - no mock data
  /* Previous mock data removed - now using real data from database:
  const seedReviews: EvaluationReview[] = [
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
  */

  // Check if current user can review evaluations for specific roles
  const canReviewRole = (staffRole: string): boolean => {
    const userRole = (currentUser.role.id || '').toLowerCase()

    // Admins and directors can review everything
    const adminLike = [
      'super_admin',
      'admin',
      'hr_director',
      'clinical_director',
      'staff_admin',
      'staff_manage',
    ]
    if (adminLike.includes(userRole)) return true

    // Nurse managers can review nursing roles
    if (userRole === 'nurse_manager' && ['RN', 'LPN', 'HHA'].includes(staffRole)) return true

    // Role-specific supervisors
    if (userRole === 'rn' && ['RN', 'LPN', 'HHA'].includes(staffRole)) return true
    if (userRole === 'pt' && staffRole === 'PT') return true
    if (userRole === 'ot' && staffRole === 'OT') return true

    // Default: allow if role is unknown (fallback to show rather than hide)
    if (!staffRole) return true
    return false
  }

  // Filter reviews based on user permissions and search criteria
  // Use only real data - no fallback to mock data
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

  const handleStartReview = async (review: EvaluationReview) => {
    console.log('🔵 [Start Review] Opening review dialog for:', review.id)
    setSelectedReview(review)
    setSupervisorNotes(review.supervisorNotes || "")
    // Initialize supervisor score based on self-assessment score if available
    const initialScore = review.selfAssessmentScore 
      ? Math.min(5, Math.max(1, review.selfAssessmentScore + 0.3))
      : review.supervisorScore || 4.5
    setSupervisorScore(initialScore)
    setIsReviewing(false) // Reset reviewing state when opening
    
    // Update status to "in-progress" when starting review (only if currently pending)
    if (review.status === "pending") {
      try {
        // Update local state immediately
        const updatedReviews = evaluationReviews.map((r: EvaluationReview) =>
          r.id === review.id && r.evaluationType === review.evaluationType
            ? { ...r, status: "in-progress" as const, reviewerName: currentUser.name || 'Supervisor' }
            : r,
        )
        setEvaluationReviews(updatedReviews)
        
        // Optionally update in backend (add notes only, status update happens on completion)
        if (review.evaluationType === 'competency') {
          try {
            await fetch(`/api/staff-performance/competency`, {
              method: "PATCH",
              headers: { 
                "Content-Type": "application/json",
                "x-user-id": currentUser.id 
              },
              body: JSON.stringify({
                action: "update-review",
                evaluationId: review.id,
                status: "needs-improvement", // Map to in-progress equivalent
                reviewerId: currentUser.id,
                reviewerName: currentUser.name || 'Supervisor'
              }),
            })
          } catch (e) {
            console.warn('Could not update backend status:', e)
          }
        }
      } catch (e) {
        console.warn('Could not update review status:', e)
      }
    }
  }

  // Save notes automatically without completing the review (for in-progress reviews)
  const handleSaveNotes = async (notes: string, score: number | null) => {
    if (!selectedReview || !notes.trim()) {
      return // Don't save if no review selected or notes are empty
    }

    try {
      console.log('💾 [Save Notes] Saving reviewer notes for:', selectedReview.id)
      
      // Save notes to self-evaluation
      if (selectedReview.evaluationType === 'performance' || selectedReview.evaluationType === 'competency') {
        await fetch(`/api/self-evaluations`, {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json", 
            "x-user-id": currentUser.id,
            "x-staff-id": currentUser.id 
          },
          body: JSON.stringify({ 
            action: "add-notes", 
            id: selectedReview.id, 
            reviewerNotes: notes
          }),
        })
      }

      // Save notes to competency evaluation if applicable
      if (selectedReview.evaluationType === 'competency') {
        try {
          await fetch(`/api/staff-performance/competency`, {
            method: "PATCH",
            headers: { 
              "Content-Type": "application/json",
              "x-user-id": currentUser.id 
            },
            body: JSON.stringify({
              action: "update-review",
              evaluationId: selectedReview.id,
              supervisorNotes: notes,
              supervisorScore: score,
              reviewerId: currentUser.id,
              reviewerName: currentUser.name || 'Supervisor'
            }),
          })
        } catch (e) {
          console.warn('Could not update competency notes:', e)
        }
      }

      // Update local state
      const updatedReviews = evaluationReviews.map((r: EvaluationReview) =>
        r.id === selectedReview.id && r.evaluationType === selectedReview.evaluationType
          ? {
              ...r,
              supervisorNotes: notes,
              supervisorScore: score || r.supervisorScore,
              status: r.status === "pending" ? "in-progress" as const : r.status,
              reviewerName: currentUser.name || 'Supervisor'
            }
          : r,
      )
      setEvaluationReviews(updatedReviews)
      
      console.log('✅ [Save Notes] Notes saved successfully')
    } catch (e: any) {
      console.error('❌ [Save Notes] Error saving notes:', e)
    }
  }

  const handleCompleteReview = async () => {
    if (!selectedReview) {
      console.error('❌ [Complete Review] No review selected')
      return
    }

    if (!supervisorNotes.trim()) {
      alert('Please provide supervisor notes before completing the review.')
      return
    }

    try {
      setIsReviewing(true)
      console.log('🔵 [Complete Review] Starting review completion for:', selectedReview.id)

      // Use the supervisor score from the input field
      const finalSupervisorScore = supervisorScore !== null ? supervisorScore : 4.5
      
      if (!finalSupervisorScore || finalSupervisorScore < 1 || finalSupervisorScore > 5) {
        alert('Please enter a valid supervisor score between 1 and 5.')
        return
      }
      
      const overallScore = ((selectedReview.selfAssessmentScore || 4) + finalSupervisorScore) / 2

      // Update self-evaluation with supervisor notes, overall score, and approve it
      if (selectedReview.evaluationType === 'performance' || selectedReview.evaluationType === 'competency' || selectedReview.id.startsWith('PERF') || selectedReview.id.startsWith('COMP')) {
        console.log('🔵 [Complete Review] Approving self-evaluation with overall score')
        const selfEvalRes = await fetch(`/api/self-evaluations`, {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json", 
            "x-user-id": currentUser.id,
            "x-staff-id": currentUser.id 
          },
          body: JSON.stringify({ 
            action: "approve-with-score", 
            id: selectedReview.id, 
            reviewerNotes: supervisorNotes,
            overallScore: overallScore,
            supervisorScore: finalSupervisorScore
          }),
        })
        
        if (!selfEvalRes.ok) {
          const errorText = await selfEvalRes.text()
          console.error('❌ [Complete Review] Failed to approve self-evaluation:', errorText)
          throw new Error(`Failed to approve self-evaluation: ${errorText}`)
        }
        console.log('✅ [Complete Review] Self-evaluation approved with overall score:', overallScore)
      }

      // Update competency evaluation if this is a competency review
      if (selectedReview.evaluationType === 'competency') {
        console.log('🔵 [Complete Review] Updating competency evaluation')
        try {
          const competencyRes = await fetch(`/api/staff-performance/competency`, {
            method: "PATCH",
            headers: { 
              "Content-Type": "application/json",
              "x-user-id": currentUser.id 
            },
            body: JSON.stringify({
              action: "update-review",
              evaluationId: selectedReview.id,
              supervisorScore: finalSupervisorScore,
              overallScore: overallScore,
              supervisorNotes: supervisorNotes,
              status: "completed",
              reviewerId: currentUser.id,
              reviewerName: currentUser.name || 'Supervisor'
            }),
          })
          
          if (!competencyRes.ok) {
            const errorText = await competencyRes.text()
            console.warn('⚠️ [Complete Review] Failed to update competency evaluation:', errorText)
            // Continue anyway - we've updated the self-evaluation
          } else {
            console.log('✅ [Complete Review] Competency evaluation updated')
          }
        } catch (competencyError) {
          console.warn('⚠️ [Complete Review] Error updating competency evaluation:', competencyError)
          // Continue anyway
        }
      }

      // Update local state - change status to "approved" instead of "completed"
      const updatedReviews = evaluationReviews.map((review: EvaluationReview) =>
        review.id === selectedReview.id && review.evaluationType === selectedReview.evaluationType
          ? {
              ...review,
              status: "approved" as const,
              supervisorScore: finalSupervisorScore,
              overallScore: overallScore,
              reviewerName: currentUser.name || 'Supervisor',
              completedAt: new Date().toISOString(),
              supervisorNotes,
            }
          : review,
      )
      setEvaluationReviews(updatedReviews)
      
      console.log('✅ [Complete Review] Review approved successfully with overall score:', overallScore)
      alert(`Review approved successfully! Overall Score: ${overallScore.toFixed(1)}`)
      
    } catch (e: any) {
      console.error('❌ [Complete Review] Error:', e)
      alert(`Failed to complete review: ${e.message || 'Unknown error'}`)
    } finally {
      setIsReviewing(false)
      setSelectedReview(null)
    }
  }

  const handleApproveReview = async (reviewId: string) => {
    try {
      setIsReviewing(true)
      const res = await fetch(`/api/self-evaluations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": currentUser.id },
        body: JSON.stringify({ action: "approve", id: reviewId }),
      })
      if (!res.ok) throw new Error("Approval failed")
      const json = await res.json()
      const updated = json?.evaluation
      setEvaluationReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, status: "approved", reviewerName: currentUser.name } : r)),
      )
    } catch (e) {
      // Optionally show error toast
    } finally {
      setIsReviewing(false)
    }
  }

  // Separate reviews by status
  const pendingReviews = filteredReviews.filter((r: EvaluationReview) => r.status === "pending")
  const inProgressReviews = filteredReviews.filter((r: EvaluationReview) => r.status === "in-progress")
  const completedReviews = filteredReviews.filter((r: EvaluationReview) => r.status === "completed")
  const approvedReviews = filteredReviews.filter((r: EvaluationReview) => r.status === "approved")
  
  // Combine completed and approved for display (no duplicates)
  const completedAndApprovedReviews = [...completedReviews, ...approvedReviews]

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
                  {loading && <div className="text-sm text-gray-600">Loading...</div>}
                  {error && <div className="text-sm text-red-600">{error}</div>}
                  {!loading && !error && pendingReviews.map((review) => {
                    const daysUntilDue = getDaysUntilDue(review.dueDate)
                    const isOverdue = daysUntilDue < 0

                    return (
                      <Card key={`${review.id}-${review.evaluationType}-pending`} className={isOverdue ? "border-red-200 bg-red-50" : ""}>
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
                    <Card key={`${review.id}-${review.evaluationType}-in-progress`}>
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <Label className="text-xs">Started</Label>
                            <p className="text-sm">{review.submittedAt ? new Date(review.submittedAt).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div>
                            <Label className="text-xs">Reviewer</Label>
                            <p className="text-sm">{review.reviewerName || 'In Progress'}</p>
                          </div>
                          <div>
                            <Label className="text-xs">Progress</Label>
                            <div className="flex items-center space-x-2">
                              {review.supervisorScore ? (
                                <>
                                  <span className="text-sm font-medium">{review.supervisorScore.toFixed(1)}</span>
                                  <span className="text-gray-400">/ 5.0</span>
                                </>
                              ) : (
                                <span className="text-sm text-gray-500">Not scored yet</span>
                              )}
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
                                  Review the staff member's self-assessment responses and continue your evaluation
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Staff Information</Label>
                                    <div className="mt-1 text-sm text-gray-600">
                                      <p>{review.staffName}</p>
                                      <p>{review.staffRole} • {review.department}</p>
                                      <p>Submitted: {new Date(review.submittedAt).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Scores</Label>
                                    <div className="mt-1 space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm">Self Assessment:</span>
                                        <Star className="h-4 w-4 text-yellow-500" />
                                        <span className="text-sm font-medium">{review.selfAssessmentScore?.toFixed(1) || 'N/A'}</span>
                                      </div>
                                      {review.supervisorScore && (
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm">Supervisor Score:</span>
                                          <Star className="h-4 w-4 text-blue-500" />
                                          <span className="text-sm font-medium">{review.supervisorScore.toFixed(1)}</span>
                                        </div>
                                      )}
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

                                {review.supervisorNotes && (
                                  <div>
                                    <Label className="text-sm font-medium">Current Supervisor Notes</Label>
                                    <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                                      <p className="text-sm text-gray-700">{review.supervisorNotes}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleStartReview(review)}
                          >
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
                  {completedAndApprovedReviews.map((review) => (
                    <Card key={`${review.id}-${review.evaluationType}-${review.status}`}>
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

                  {completedAndApprovedReviews.length === 0 && (
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
            {(() => {
              // Calculate analytics from actual data
              const allReviews = evaluationReviews
              const completedAndApproved = allReviews.filter(r => r.status === "completed" || r.status === "approved")
              
              // Average Review Time (days between submitted and completed)
              const reviewTimes = completedAndApproved
                .filter(r => r.completedAt && r.submittedAt)
                .map(r => {
                  const submitted = new Date(r.submittedAt).getTime()
                  const completed = new Date(r.completedAt!).getTime()
                  return (completed - submitted) / (1000 * 60 * 60 * 24) // days
                })
              const avgReviewTime = reviewTimes.length > 0
                ? (reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length).toFixed(1)
                : "0.0"
              
              // Reviews this month
              const now = new Date()
              const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
              const reviewsThisMonth = allReviews.filter(r => {
                const reviewDate = r.completedAt ? new Date(r.completedAt) : new Date(r.submittedAt)
                return reviewDate >= firstDayOfMonth
              }).length
              
              // On-time completion rate (reviews completed before or on due date)
              const onTimeReviews = completedAndApproved.filter(r => {
                if (!r.completedAt) return false
                const completed = new Date(r.completedAt)
                const due = new Date(r.dueDate)
                return completed <= due
              })
              const onTimeRate = completedAndApproved.length > 0
                ? Math.round((onTimeReviews.length / completedAndApproved.length) * 100)
                : 0
              
              // Average overall score
              const scoresWithOverall = completedAndApproved
                .filter(r => r.overallScore !== undefined && r.overallScore !== null)
                .map(r => r.overallScore!)
              const avgOverallScore = scoresWithOverall.length > 0
                ? (scoresWithOverall.reduce((a, b) => a + b, 0) / scoresWithOverall.length).toFixed(1)
                : "0.0"
              
              // Evaluation type breakdown
              const performanceCount = allReviews.filter(r => r.evaluationType === "performance").length
              const competencyCount = allReviews.filter(r => r.evaluationType === "competency").length
              
              // High priority reviews
              const highPriorityCount = allReviews.filter(r => r.priority === "high").length
              
              // Staff requiring development (score < 3.5)
              const lowScoreReviews = completedAndApproved.filter(r => {
                const score = r.overallScore || r.supervisorScore || r.selfAssessmentScore || 5
                return score < 3.5
              })
              
              // Distribution by role - normalize role values first
              const roleCounts: Record<string, number> = {}
              
              // Function to normalize role ID to display role
              const normalizeRole = (roleId: string): string => {
                if (!roleId) return 'Other'
                const roleLower = roleId.toLowerCase().trim()
                
                // Map database role_id values to display roles
                const roleMapping: Record<string, string> = {
                  'rn': 'RN',
                  'registered_nurse': 'RN',
                  'staff_nurse': 'RN', // staff_nurse typically means RN
                  'nurse': 'RN',
                  'lpn': 'LPN',
                  'licensed_practical_nurse': 'LPN',
                  'practical_nurse': 'LPN',
                  'hha': 'HHA',
                  'home_health_aide': 'HHA',
                  'health_aide': 'HHA',
                  'aide': 'HHA',
                  'pt': 'PT',
                  'physical_therapist': 'PT',
                  'therapist_pt': 'PT',
                  'ot': 'OT',
                  'occupational_therapist': 'OT',
                  'therapist_ot': 'OT',
                  'msw': 'MSW',
                  'medical_social_worker': 'MSW',
                  'social_worker': 'MSW',
                  'st': 'ST',
                  'speech_therapist': 'ST',
                  'therapist_st': 'ST',
                }
                
                // Try exact match first
                if (roleMapping[roleLower]) {
                  return roleMapping[roleLower]
                }
                
                // Try partial match
                for (const [key, value] of Object.entries(roleMapping)) {
                  if (roleLower.includes(key) || key.includes(roleLower)) {
                    return value
                  }
                }
                
                // If it's already uppercase (RN, LPN, etc.), return as is
                if (roleId === roleId.toUpperCase() && roleId.length <= 5) {
                  return roleId
                }
                
                // Default fallback
                return roleId
              }
              
              // Count reviews by role - each review is counted once
              allReviews.forEach(r => {
                const normalizedRole = normalizeRole(r.staffRole)
                roleCounts[normalizedRole] = (roleCounts[normalizedRole] || 0) + 1
              })
              
              // Calculate total - should be sum of all role counts
              const totalByRole = Object.values(roleCounts).reduce((a, b) => a + b, 0)
              
              // Debug: Log the counts to verify
              console.log('📊 [Analytics] Role distribution:', {
                roleCounts,
                totalByRole,
                allReviewsCount: allReviews.length
              })
              
              return (
                <>
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
                            <span className="font-bold">{avgReviewTime} days</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Reviews This Month</span>
                            <span className="font-bold">{reviewsThisMonth}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">On-Time Completion Rate</span>
                            <span className={`font-bold ${onTimeRate >= 90 ? 'text-green-600' : onTimeRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {onTimeRate}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Average Overall Score</span>
                            <span className="font-bold text-blue-600">{avgOverallScore}</span>
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
                            <span className="font-bold">{performanceCount}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Competency Assessments</span>
                            <span className="font-bold">{competencyCount}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">High Priority Reviews</span>
                            <span className="font-bold text-red-600">{highPriorityCount}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Staff Requiring Development</span>
                            <span className="font-bold text-yellow-600">{lowScoreReviews.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Review Distribution by Role</CardTitle>
                      <CardDescription>Based on {totalByRole} total reviews</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {totalByRole > 0 ? (
                        <div className="space-y-4">
                          {Object.entries(roleCounts)
                            .sort((a, b) => b[1] - a[1])
                            .map(([role, count]) => {
                              // Calculate percentage correctly: (count for this role / total reviews) * 100
                              // Example: 2 RN reviews out of 4 total = 50%, not 100%
                              const percentage = totalByRole > 0 
                                ? Math.round((count / totalByRole) * 100) 
                                : 0
                              
                              // Get full role names for display (using the normalized role codes)
                              const roleDisplayNames: Record<string, string> = {
                                'RN': 'Registered Nurses (RN)',
                                'LPN': 'Licensed Practical Nurses (LPN)',
                                'HHA': 'Home Health Aides (HHA)',
                                'PT': 'Physical Therapists (PT)',
                                'OT': 'Occupational Therapists (OT)',
                                'MSW': 'Medical Social Workers (MSW)',
                                'ST': 'Speech Therapists (ST)',
                                'Other': 'Other Roles'
                              }
                              const roleDisplayName = roleDisplayNames[role] || role
                              
                              return (
                                <div key={role}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium">{roleDisplayName}</span>
                                      <span className="text-xs text-gray-500">({count} review{count !== 1 ? 's' : ''})</span>
                                    </div>
                                    <span className="text-sm font-medium">{percentage}%</span>
                                  </div>
                                  <Progress value={percentage} className="h-3" />
                                </div>
                              )
                            })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No review data available to display distribution</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Score Distribution Chart */}
                  {scoresWithOverall.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Score Distribution</CardTitle>
                        <CardDescription>Overall scores from completed reviews</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm">Excellent (4.5 - 5.0)</span>
                              <span className="text-sm font-medium">
                                {scoresWithOverall.filter(s => s >= 4.5).length} reviews
                              </span>
                            </div>
                            <Progress 
                              value={(scoresWithOverall.filter(s => s >= 4.5).length / scoresWithOverall.length) * 100} 
                              className="h-2" 
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm">Good (4.0 - 4.4)</span>
                              <span className="text-sm font-medium">
                                {scoresWithOverall.filter(s => s >= 4.0 && s < 4.5).length} reviews
                              </span>
                            </div>
                            <Progress 
                              value={(scoresWithOverall.filter(s => s >= 4.0 && s < 4.5).length / scoresWithOverall.length) * 100} 
                              className="h-2" 
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm">Satisfactory (3.0 - 3.9)</span>
                              <span className="text-sm font-medium">
                                {scoresWithOverall.filter(s => s >= 3.0 && s < 4.0).length} reviews
                              </span>
                            </div>
                            <Progress 
                              value={(scoresWithOverall.filter(s => s >= 3.0 && s < 4.0).length / scoresWithOverall.length) * 100} 
                              className="h-2" 
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm">Needs Improvement (&lt; 3.0)</span>
                              <span className="text-sm font-medium text-red-600">
                                {scoresWithOverall.filter(s => s < 3.0).length} reviews
                              </span>
                            </div>
                            <Progress 
                              value={(scoresWithOverall.filter(s => s < 3.0).length / scoresWithOverall.length) * 100} 
                              className="h-2" 
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )
            })()}
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        {selectedReview && (
          <Dialog open={!!selectedReview && !isReviewing} onOpenChange={async (open) => {
            if (!open && !isReviewing) {
              // Save notes before closing if notes were entered
              if (supervisorNotes.trim()) {
                await handleSaveNotes(supervisorNotes, supervisorScore)
              }
              setSelectedReview(null)
              setSupervisorNotes("")
              setSupervisorScore(null)
            }
          }}>
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
                      <span className="text-lg font-medium">{selectedReview.selfAssessmentScore?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supervisor-score" className="text-sm font-medium">
                      Supervisor Score <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="supervisor-score"
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={supervisorScore !== null ? supervisorScore : ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        if (!isNaN(value)) {
                          setSupervisorScore(Math.min(5, Math.max(1, value)))
                        } else if (e.target.value === '') {
                          setSupervisorScore(null)
                        }
                      }}
                      placeholder="Enter score (1-5)"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Rate from 1 (Poor) to 5 (Excellent)
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Calculated Overall Score</Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <Star className="h-5 w-5 text-blue-500" />
                      <span className="text-lg font-bold text-blue-600">
                        {supervisorScore !== null && selectedReview.selfAssessmentScore
                          ? (((selectedReview.selfAssessmentScore || 4) + supervisorScore) / 2).toFixed(1)
                          : '—'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Average of self-assessment and supervisor score
                    </p>
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
                    onChange={(e) => {
                      setSupervisorNotes(e.target.value)
                      // Auto-save notes after user stops typing (debounced)
                      // This ensures notes are saved even if user closes modal without completing
                    }}
                    onBlur={() => {
                      // Save notes when user leaves the textarea
                      if (supervisorNotes.trim()) {
                        handleSaveNotes(supervisorNotes, supervisorScore)
                      }
                    }}
                    placeholder="Provide your assessment, feedback, and recommendations..."
                    className="min-h-[120px] mt-1"
                  />
                  <div className="space-y-1">
                    {supervisorNotes.trim() && (
                      <p className="text-xs text-gray-500">💾 Notes will be saved automatically when you close this dialog</p>
                    )}
                    {!supervisorNotes.trim() && (
                      <p className="text-xs text-red-600">Supervisor notes are required to complete the review.</p>
                    )}
                    {(supervisorScore === null || supervisorScore < 1 || supervisorScore > 5) && (
                      <p className="text-xs text-red-600">Supervisor score (1-5) is required to complete the review.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-end space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={async () => {
                          if (!isReviewing) {
                            // Save notes before closing
                            if (supervisorNotes.trim()) {
                              await handleSaveNotes(supervisorNotes, supervisorScore)
                            }
                            setSelectedReview(null)
                            setSupervisorNotes("")
                            setSupervisorScore(null)
                          }
                      }}
                      disabled={isReviewing}
                    >
                      {supervisorNotes.trim() ? "Save & Close" : "Cancel"}
                    </Button>
                    <Button
                      onClick={handleCompleteReview}
                      disabled={isReviewing || !supervisorNotes.trim() || supervisorScore === null || supervisorScore < 1 || supervisorScore > 5}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isReviewing ? "Completing Review..." : "Complete Review"}
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
