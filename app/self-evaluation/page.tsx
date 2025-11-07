"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, PenTool, Save, Send, Clock, User, Target, Star, BookOpen, Award, TrendingUp } from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

interface PerformanceQuestion {
  id: string
  category: string
  question: string
  type: "rating" | "checkbox" | "text" | "select"
  options?: string[]
  required: boolean
  weight: number
  evaluationType: "performance" | "competency"
}

interface SelfEvaluationData {
  id: string
  staffId: string
  evaluationType: "performance" | "competency"
  assessmentType: "annual" | "mid-year" | "probationary" | "initial" | "skills-validation"
  status: "draft" | "submitted" | "approved"
  completionPercentage: number
  responses: Record<string, any>
  submittedAt?: string
  lastModified: string
  dueDate: string
}

export default function SelfEvaluationPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [currentUser] = useState(getCurrentUser())
  
  // Read URL parameters
  const urlStaffId = searchParams?.get("staffId") || null
  const urlType = searchParams?.get("type") || null
  const urlEvaluationType = searchParams?.get("evaluationType") || null
  
  const [activeTab, setActiveTab] = useState("performance")
  const [currentEvaluation, setCurrentEvaluation] = useState<SelfEvaluationData | null>(null)
  const [questions, setQuestions] = useState<PerformanceQuestion[]>([])
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [evaluationType, setEvaluationType] = useState<"performance" | "competency">(
    (urlEvaluationType as "performance" | "competency") || "performance"
  )
  const [historyRecords, setHistoryRecords] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [pipData, setPipData] = useState<any[]>([]) // Performance Improvement Plans
  const [performanceGoals, setPerformanceGoals] = useState<any[]>([]) // Performance goals only
  const [competencyGoals, setCompetencyGoals] = useState<any[]>([]) // Competency-specific goals
  const [pipLoading, setPipLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [selectedEvaluationDetails, setSelectedEvaluationDetails] = useState<any>(null)
  const submissionInProgressRef = useRef(false) // Prevent duplicate submissions

  // Mock evaluation history removed - now using real data from database via historyRecords

  // Performance evaluation questions (focus on how well they're doing the job)
  const getPerformanceQuestions = (role: string): PerformanceQuestion[] => {
    const basePerformanceQuestions: PerformanceQuestion[] = [
      {
        id: "job-performance",
        category: "Job Performance",
        question: "How would you rate your overall job performance this evaluation period?",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 25,
        evaluationType: "performance",
      },
      {
        id: "productivity",
        category: "Productivity",
        question: "How effectively do you manage your workload and meet deadlines?",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 20,
        evaluationType: "performance",
      },
      {
        id: "quality-of-work",
        category: "Quality of Work",
        question: "Rate the quality and accuracy of your work output",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 20,
        evaluationType: "performance",
      },
      {
        id: "communication-performance",
        category: "Communication",
        question: "How effectively do you communicate with patients, families, and team members?",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 15,
        evaluationType: "performance",
      },
      {
        id: "teamwork-performance",
        category: "Teamwork",
        question: "How well do you collaborate and work as part of the healthcare team?",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 10,
        evaluationType: "performance",
      },
      {
        id: "achievements",
        category: "Achievements",
        question: "Describe your key accomplishments and contributions this evaluation period",
        type: "text",
        required: true,
        weight: 5,
        evaluationType: "performance",
      },
      {
        id: "challenges",
        category: "Challenges",
        question: "What challenges did you face and how did you overcome them?",
        type: "text",
        required: false,
        weight: 3,
        evaluationType: "performance",
      },
      {
        id: "goals",
        category: "Goals",
        question: "What are your performance goals for the next evaluation period?",
        type: "text",
        required: true,
        weight: 2,
        evaluationType: "performance",
      },
    ]

    return basePerformanceQuestions
  }

  // Competency evaluation questions (focus on whether they can do the job)
  const getCompetencyQuestions = (role: string): PerformanceQuestion[] => {
    const baseCompetencyQuestions: PerformanceQuestion[] = [
      {
        id: "safety-knowledge",
        category: "Safety & Compliance",
        question: "Rate your knowledge and application of safety protocols and infection control measures",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 25,
        evaluationType: "competency",
      },
      {
        id: "clinical-skills-self",
        category: "Clinical Skills",
        question: "How confident are you in your clinical assessment and intervention skills?",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 25,
        evaluationType: "competency",
      },
      {
        id: "technical-competency",
        category: "Technical Skills",
        question: "Rate your proficiency with required equipment and technology",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 20,
        evaluationType: "competency",
      },
      {
        id: "knowledge-base",
        category: "Professional Knowledge",
        question: "How would you rate your understanding of policies, procedures, and best practices?",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 15,
        evaluationType: "competency",
      },
      {
        id: "skills-demonstration",
        category: "Skills Application",
        question: "Which skills do you feel most confident demonstrating?",
        type: "checkbox",
        options: [
          "Patient assessment",
          "Medication administration",
          "Wound care",
          "Documentation",
          "Emergency procedures",
          "Equipment operation",
          "Infection control",
          "Patient education",
        ],
        required: true,
        weight: 10,
        evaluationType: "competency",
      },
      {
        id: "learning-needs",
        category: "Development Needs",
        question: "What areas do you feel you need additional training or skill development?",
        type: "text",
        required: true,
        weight: 5,
        evaluationType: "competency",
      },
    ]

    // Add role-specific competency questions
    const roleSpecificQuestions: Record<string, PerformanceQuestion[]> = {
      RN: [
        {
          id: "rn-supervision",
          category: "Supervision & Leadership",
          question: "How confident are you in supervising and delegating to LPNs and HHAs?",
          type: "rating",
          options: ["1", "2", "3", "4", "5"],
          required: true,
          weight: 15,
          evaluationType: "competency",
        },
        {
          id: "rn-clinical-judgment",
          category: "Clinical Judgment",
          question: "Rate your ability to make independent clinical decisions and assessments",
          type: "rating",
          options: ["1", "2", "3", "4", "5"],
          required: true,
          weight: 20,
          evaluationType: "competency",
        },
      ],
      LPN: [
        {
          id: "lpn-scope",
          category: "Scope of Practice",
          question: "How well do you understand and work within your LPN scope of practice?",
          type: "rating",
          options: ["1", "2", "3", "4", "5"],
          required: true,
          weight: 20,
          evaluationType: "competency",
        },
      ],
      HHA: [
        {
          id: "hha-personal-care",
          category: "Personal Care Skills",
          question: "Rate your competency in providing activities of daily living assistance",
          type: "rating",
          options: ["1", "2", "3", "4", "5"],
          required: true,
          weight: 25,
          evaluationType: "competency",
        },
      ],
      PT: [
        {
          id: "pt-assessment",
          category: "Physical Therapy Assessment",
          question: "How confident are you in conducting comprehensive PT evaluations?",
          type: "rating",
          options: ["1", "2", "3", "4", "5"],
          required: true,
          weight: 25,
          evaluationType: "competency",
        },
      ],
      OT: [
        {
          id: "ot-functional",
          category: "Functional Assessment",
          question: "Rate your competency in functional and occupational assessments",
          type: "rating",
          options: ["1", "2", "3", "4", "5"],
          required: true,
          weight: 25,
          evaluationType: "competency",
        },
      ],
    }

    return [...baseCompetencyQuestions, ...(roleSpecificQuestions[role] || [])]
  }

  useEffect(() => {
    // Load questions based on evaluation type and user role
    const questionsToLoad =
      evaluationType === "performance"
        ? getPerformanceQuestions(currentUser.role.id)
        : getCompetencyQuestions(currentUser.role.id)
    setQuestions(questionsToLoad)

    // Load current evaluation from API or create one if none exists
    const loadEvaluation = async () => {
      try {
        // Use URL staffId if provided, otherwise use currentUser.id
        const staffIdToUse = urlStaffId || currentUser.id
        // Use URL type if provided, otherwise use default based on evaluationType
        const assessmentTypeToUse = urlType || (evaluationType === "performance" ? "annual" : "skills-validation")
        
        const params = new URLSearchParams({
          staffId: staffIdToUse,
          evaluationType,
          status: "draft",
        })
        const res = await fetch(`/api/self-evaluations?${params.toString()}`)
        let record: any | null = null
        if (res.ok) {
          const json = await res.json()
          if (json?.evaluations?.length) {
            // Filter by assessment type if URL type is provided
            const filtered = urlType 
              ? json.evaluations.filter((e: any) => e.assessment_type === urlType)
              : json.evaluations
            record = filtered[0] || json.evaluations[0]
          }
        }
        // DO NOT auto-create draft - only create when user clicks "Save Draft" button
        // This ensures no data is saved to database unless explicitly requested
        if (!record) {
          // Just use fallback client-side state - no database write
          console.log('ℹ️ [Load] No existing draft found - using local state only. Data will not be saved until user clicks "Save Draft" or "Submit".')
        }

        if (record) {
          const evalData: SelfEvaluationData = {
            id: record.id,
            staffId: record.staff_id,
            evaluationType: record.evaluation_type,
            assessmentType: record.assessment_type,
            status: record.status,
            completionPercentage: record.completion_percentage || 0,
            responses: record.responses || {},
            submittedAt: record.submitted_at || undefined,
            lastModified: record.last_modified || new Date().toISOString(),
            dueDate: record.due_date || new Date().toISOString().slice(0, 10),
          }
          setCurrentEvaluation(evalData)
          setResponses(evalData.responses || {})
          
          // Reset isSubmitted state - only set to true if already submitted (read-only mode)
          // Don't auto-submit on page load
          setIsSubmitted(record.status === "submitted" || record.status === "approved")
          
          // Reset submission lock if evaluation is already submitted
          if (record.status === "submitted" || record.status === "approved") {
            submissionInProgressRef.current = false
          }
        } else {
          // No existing draft - create local-only state (NOT saved to database)
          // Data will only be saved when user clicks "Save Draft" or "Submit"
          const defaultDueDate = new Date()
          defaultDueDate.setDate(defaultDueDate.getDate() + 14)
          
          const fallback: SelfEvaluationData = {
            id: `local-${evaluationType}-${Date.now()}`, // Local-only ID (not a database ID)
            staffId: staffIdToUse,
            evaluationType,
            assessmentType: assessmentTypeToUse as any,
            status: "draft",
            completionPercentage: 0,
            responses: {},
            lastModified: new Date().toISOString(),
            dueDate: defaultDueDate.toISOString().slice(0, 10),
          }
          setCurrentEvaluation(fallback)
          setResponses({})
          setIsSubmitted(false)
          
          console.log('ℹ️ [Load] Created local-only draft (not saved to database). User must click "Save Draft" or "Submit" to save.')
        }
      } catch (e) {
        console.error("Failed to load evaluation", e)
        setIsSubmitted(false) // Reset on error
      }
    }

    loadEvaluation()
  }, [currentUser, evaluationType, urlStaffId, urlType])

  // Load submitted history for the current user (both types)
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setHistoryLoading(true)
        setHistoryError(null)
        
        console.log('🔵 [History] Loading evaluation history for user:', currentUser.id)
        
        // Resolve current user ID to staff UUID if needed
        let staffIdForQuery = currentUser.id
        
        // If currentUser.id is not a UUID, we need to resolve it
        const isValidUUID = (str: string) => {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          return uuidRegex.test(str)
        }
        
        // Try to resolve staff_id if currentUser.id is not a UUID
        if (!isValidUUID(currentUser.id)) {
          console.log('🔵 [History] Resolving staff_id from user_id:', currentUser.id)
          try {
            const staffRes = await fetch(`/api/staff/list`)
            if (staffRes.ok) {
              const staffJson = await staffRes.json()
              const staffList = Array.isArray(staffJson?.staff) ? staffJson.staff : []
              // Try to find by user_id or email
              const matchingStaff = staffList.find((s: any) => 
                s.user_id === currentUser.id || s.email === currentUser.email
              )
              if (matchingStaff?.id && isValidUUID(matchingStaff.id)) {
                staffIdForQuery = matchingStaff.id
                console.log('✅ [History] Resolved staff_id:', staffIdForQuery)
              } else {
                console.warn('⚠️ [History] Could not find matching staff member')
                // Try first staff member as fallback (for testing)
                if (staffList.length > 0 && isValidUUID(staffList[0].id)) {
                  staffIdForQuery = staffList[0].id
                  console.warn('⚠️ [History] Using first staff member as fallback:', staffIdForQuery)
                }
              }
            }
          } catch (resolveError) {
            console.error('❌ [History] Error resolving staff_id:', resolveError)
          }
        }
        
        console.log('🔵 [History] Fetching evaluations with staffId:', staffIdForQuery)
        // Fetch all evaluations (submitted and approved) - don't filter by status in URL
        const res = await fetch(`/api/self-evaluations?staffId=${encodeURIComponent(staffIdForQuery)}`, {
          headers: { "x-user-id": currentUser.id, "x-staff-id": staffIdForQuery },
        })
        
        if (!res.ok) {
          const errorText = await res.text()
          console.error('❌ [History] API error:', res.status, errorText)
          throw new Error(`Failed to load history: ${res.status} ${errorText}`)
        }
        
        const json = await res.json()
        console.log('🔵 [History] API response:', json)
        
        let records = Array.isArray(json?.evaluations) ? json.evaluations : []
        
        // Filter to only show submitted or approved evaluations (exclude drafts)
        records = records.filter((r: any) => 
          r.status === 'submitted' || r.status === 'approved'
        )
        
        console.log('✅ [History] Loaded', records.length, 'evaluation records (submitted or approved)')
        
        if (records.length > 0) {
          console.log('✅ [History] Sample record:', {
            id: records[0].id,
            type: records[0].evaluation_type,
            status: records[0].status,
            submitted: records[0].submitted_at,
            approved: records[0].approved_at,
            overall_score: records[0].overall_score
          })
        } else {
          console.warn('⚠️ [History] No submitted or approved evaluations found. All records:', json?.evaluations)
        }
        
        setHistoryRecords(records)
      } catch (e: any) {
        console.error('❌ [History] Error loading:', e)
        console.error('❌ [History] Error stack:', e.stack)
        setHistoryError(e?.message || "Failed to load evaluation history")
        setHistoryRecords([])
      } finally {
        setHistoryLoading(false)
      }
    }
    loadHistory()
  }, [currentUser.id, currentUser.email])

  // Load Performance Improvement Plans (PIP) for development goals
  useEffect(() => {
    const loadPipData = async () => {
      try {
        setPipLoading(true)
        
        // Resolve staff_id
        let staffIdForQuery = currentUser.id
        const isValidUUID = (str: string) => {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          return uuidRegex.test(str)
        }
        
        if (!isValidUUID(currentUser.id)) {
          try {
            const staffRes = await fetch(`/api/staff/list`)
            if (staffRes.ok) {
              const staffJson = await staffRes.json()
              const staffList = Array.isArray(staffJson?.staff) ? staffJson.staff : []
              const matchingStaff = staffList.find((s: any) => 
                s.user_id === currentUser.id || s.email === currentUser.email
              )
              if (matchingStaff?.id && isValidUUID(matchingStaff.id)) {
                staffIdForQuery = matchingStaff.id
              } else if (staffList.length > 0 && isValidUUID(staffList[0].id)) {
                staffIdForQuery = staffList[0].id // Fallback
              }
            }
          } catch (resolveError) {
            console.error('Error resolving staff_id for PIP:', resolveError)
          }
        }
        
        // Load ALL PIP goals directly from database (most accurate source)
        const pipGoalsRes = await fetch(`/api/staff-performance/pip-goals?staffId=${encodeURIComponent(staffIdForQuery)}`)
        let performanceGoals: any[] = []
        let compGoals: any[] = []
        
        if (pipGoalsRes.ok) {
          const pipGoalsJson = await pipGoalsRes.json()
          if (pipGoalsJson.success) {
            // Ensure arrays and parse actions if they're strings
            performanceGoals = (Array.isArray(pipGoalsJson.performanceGoals) ? pipGoalsJson.performanceGoals : []).map((goal: any) => ({
              ...goal,
              actions: typeof goal.actions === 'string' ? JSON.parse(goal.actions || '[]') : (Array.isArray(goal.actions) ? goal.actions : []),
              targetDate: goal.targetDate || goal.target_date || null,
              progress: typeof goal.progress === 'number' ? goal.progress : (parseFloat(goal.progress) || 0)
            }))
            compGoals = (Array.isArray(pipGoalsJson.competencyGoals) ? pipGoalsJson.competencyGoals : []).map((goal: any) => ({
              ...goal,
              actions: typeof goal.actions === 'string' ? JSON.parse(goal.actions || '[]') : (Array.isArray(goal.actions) ? goal.actions : []),
              targetDate: goal.targetDate || goal.target_date || null,
              progress: typeof goal.progress === 'number' ? goal.progress : (parseFloat(goal.progress) || 0)
            }))
            console.log('✅ [PIP Goals API] Loaded', pipGoalsJson.totalPips || 0, 'PIPs with', performanceGoals.length, 'performance goals and', compGoals.length, 'competency goals')
          } else {
            console.warn('⚠️ [PIP Goals API] Response not successful:', pipGoalsJson)
          }
        } else {
          const errorText = await pipGoalsRes.text()
          console.error('❌ [PIP Goals API] Failed to load:', pipGoalsRes.status, errorText)
        }
        
        // Also get additional goals from performance evaluations with low scores (as supplementary)
        const performanceRes = await fetch(`/api/self-evaluations?staffId=${encodeURIComponent(staffIdForQuery)}&evaluationType=performance`)
        if (performanceRes.ok) {
          const performanceJson = await performanceRes.json()
          let performanceRecords = Array.isArray(performanceJson?.evaluations) ? performanceJson.evaluations : []
          
          // Filter to only submitted or approved evaluations
          performanceRecords = performanceRecords.filter((e: any) => 
            e.status === 'submitted' || e.status === 'approved'
          )
          
          // Add performance goals from evaluations with low scores (only if not already in PIP goals)
          performanceRecords.forEach((evaluation: any) => {
            const score = evaluation.overall_score || evaluation.completion_percentage / 20 || 0
            if (score < 4.0) {
              const responses = evaluation.responses || {}
              Object.keys(responses).forEach((key: string) => {
                const responseValue = responses[key]
                const numericValue = typeof responseValue === 'string' ? parseInt(responseValue) : responseValue
                if (numericValue && numericValue < 4) {
                  const goalDescription = `Improve ${key.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}`
                  // Only add if not already in PIP goals
                  const exists = performanceGoals.some((g: any) => g.description.toLowerCase() === goalDescription.toLowerCase())
                  if (!exists) {
                    performanceGoals.push({
                      id: `perf-${evaluation.id}-${key}`,
                      description: goalDescription,
                      targetDate: evaluation.due_date || null,
                      completed: false,
                      progress: Math.round((numericValue / 5) * 100),
                      actions: [],
                      source: 'performance-evaluation'
                    })
                  }
                }
              })
            }
          })
        }
        
        // Also get competency skills that need improvement (as supplementary)
        const competencyRes = await fetch(`/api/staff-performance/competency?staffId=${encodeURIComponent(staffIdForQuery)}`)
        if (competencyRes.ok) {
          const competencyJson = await competencyRes.json()
          const records = Array.isArray(competencyJson?.records) ? competencyJson.records : []
          
          // Extract PIP data for reference
          const allPips = records
            .filter((r: any) => r.performanceImprovementPlan)
            .map((r: any) => r.performanceImprovementPlan)
          
          setPipData(allPips)
          
          // Add competency goals from skills that need improvement (only if not already in PIP goals)
          records.forEach((record: any) => {
            if (record.competencyAreas && Array.isArray(record.competencyAreas)) {
              record.competencyAreas.forEach((area: any) => {
                if (area.items && Array.isArray(area.items)) {
                  area.items.forEach((skill: any) => {
                    if (skill.status === 'needs-improvement' || skill.status === 'not-competent') {
                      const goalDescription = `Improve ${skill.description || skill.skill_name || area.category || 'Competency'}`
                      // Only add if not already in PIP goals
                      const exists = compGoals.some((g: any) => g.description.toLowerCase() === goalDescription.toLowerCase())
                      if (!exists) {
                        compGoals.push({
                          id: `comp-${skill.id || area.category}`,
                          description: goalDescription,
                          targetDate: skill.next_due || null,
                          completed: false,
                          progress: skill.score >= 3 ? Math.round((skill.score / 5) * 100) : 0,
                          actions: [],
                          source: 'competency-skill'
                        })
                      }
                    }
                  })
                }
              })
            }
          })
        } else {
          setPipData([])
        }
        
        setPerformanceGoals(performanceGoals)
        setCompetencyGoals(compGoals)
        
        // Log detailed information about goals
        console.log('✅ [Performance Goals] Total:', performanceGoals.length, 'goals')
        const perfFromPip = performanceGoals.filter((g: any) => g.source === 'performance-pip').length
        const perfFromEval = performanceGoals.filter((g: any) => g.source === 'performance-evaluation').length
        console.log('  📊 Breakdown:', perfFromPip, 'from PIP,', perfFromEval, 'from evaluations')
        if (performanceGoals.length > 0) {
          console.log('📋 [Performance Goals] Details:', performanceGoals.map((g: any) => ({
            id: g.id,
            description: g.description,
            source: g.source,
            progress: g.progress,
            completed: g.completed
          })))
        }
        
        console.log('✅ [Competency Goals] Total:', compGoals.length, 'goals')
        const compFromPip = compGoals.filter((g: any) => g.source === 'competency-pip').length
        const compFromSkill = compGoals.filter((g: any) => g.source === 'competency-skill').length
        console.log('  📊 Breakdown:', compFromPip, 'from PIP,', compFromSkill, 'from skills')
        if (compGoals.length > 0) {
          console.log('📋 [Competency Goals] Details:', compGoals.map((g: any) => ({
            id: g.id,
            description: g.description,
            source: g.source,
            progress: g.progress,
            completed: g.completed
          })))
        }
        
        // Log where data comes from
        console.log('🔍 [Data Sources]:')
        console.log('  - Primary: /api/staff-performance/pip-goals (direct PIP goals from database)')
        console.log('  - Supplementary Performance: /api/self-evaluations?evaluationType=performance (low scores)')
        console.log('  - Supplementary Competency: /api/staff-performance/competency (skills needing improvement)')
        console.log('  - Database Tables: staff_pip → staff_pip_goals (created from Staff Competency Review page)')
      } catch (e: any) {
        console.error('Error loading PIP data:', e)
        setPipData([])
        setPerformanceGoals([])
        setCompetencyGoals([])
      } finally {
        setPipLoading(false)
      }
    }
    loadPipData()
  }, [currentUser.id, currentUser.email])

  useEffect(() => {
    // Calculate completion percentage
    const totalQuestions = questions.filter((q) => q.required).length
    const answeredQuestions = questions.filter((q) => q.required && responses[q.id]).length
    const percentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
    setCompletionPercentage(percentage)
    
    // Clear validation errors when responses change
    setValidationErrors({})
  }, [responses, questions])

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleSaveDraft = async () => {
    try {
      setIsSubmitting(true)
      
      // Only save if user explicitly clicks the button
      // If id starts with "local-", it's a local-only draft, so don't pass id (create new)
      const evaluationId = currentEvaluation?.id?.startsWith("local-") || 
                          currentEvaluation?.id?.startsWith("PERF") || 
                          currentEvaluation?.id?.startsWith("COMP") 
                        ? undefined 
                        : currentEvaluation?.id
      
      const res = await fetch("/api/self-evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": currentUser.id },
        body: JSON.stringify({
          action: "save-draft",
          id: evaluationId,
          evaluationType,
          assessmentType: currentEvaluation?.assessmentType,
          responses,
          completionPercentage,
          dueDate: currentEvaluation?.dueDate,
        }),
      })
      if (!res.ok) throw new Error("Failed to save draft")
      const data = await res.json()
      if (data?.evaluation?.id) {
        setCurrentEvaluation((prev) =>
          prev
            ? {
                ...prev,
                id: data.evaluation.id,
                status: data.evaluation.status,
                lastModified: new Date().toISOString(),
              }
            : prev,
        )
      }
    } catch (e) {
      console.error(e)
      alert("Failed to save draft. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const validateResponses = (): boolean => {
    const errors: Record<string, string> = {}
    
    questions.forEach((question) => {
      if (question.required) {
        const value = responses[question.id]
        
        if (!value || value === "" || (Array.isArray(value) && value.length === 0)) {
          errors[question.id] = "This field is required"
        } else if (question.type === "text" && typeof value === "string" && value.trim().length < 10) {
          errors[question.id] = "Please provide a more detailed response (at least 10 characters)"
        } else if (question.type === "checkbox" && (!Array.isArray(value) || value.length === 0)) {
          errors[question.id] = "Please select at least one option"
        }
      }
    })
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitEvaluation = async () => {
    // Prevent double submission - check multiple conditions
    if (isSubmitting || isSubmitted || submissionInProgressRef.current) {
      console.warn('⚠️ [Submit] Submission blocked - already in progress or submitted')
      return
    }

    // Check if already submitted (from current state)
    if (currentEvaluation?.status === "submitted" || currentEvaluation?.status === "approved") {
      alert("This evaluation has already been submitted and cannot be modified.")
      return
    }

    // Validate all required fields
    if (!validateResponses()) {
      alert("Please complete all required questions correctly before submitting.")
      return
    }

    if (completionPercentage < 100) {
      alert("Please complete all required questions before submitting.")
      return
    }

    // Set submission lock immediately
    submissionInProgressRef.current = true
    
    try {
      setIsSubmitting(true)
      
      // Double-check with server before submitting
      if (currentEvaluation?.id && !currentEvaluation.id.startsWith("PERF") && !currentEvaluation.id.startsWith("COMP")) {
        const checkRes = await fetch(`/api/self-evaluations?staffId=${encodeURIComponent(currentUser.id)}&evaluationType=${evaluationType}`)
        if (checkRes.ok) {
          const checkData = await checkRes.json()
          const existing = Array.isArray(checkData?.evaluations) 
            ? checkData.evaluations.find((e: any) => e.id === currentEvaluation.id)
            : null
          
          if (existing && (existing.status === "submitted" || existing.status === "approved")) {
            alert("This evaluation has already been submitted. Please refresh the page.")
            setCurrentEvaluation(prev => prev ? { ...prev, status: existing.status } : prev)
            setIsSubmitted(true)
            submissionInProgressRef.current = false
            setIsSubmitting(false)
            return
          }
        }
      }
      // Only save if user explicitly clicks the button
      // If id starts with "local-", it's a local-only draft, so don't pass id (create new)
      const evaluationId = currentEvaluation?.id?.startsWith("local-") || 
                          currentEvaluation?.id?.startsWith("PERF") || 
                          currentEvaluation?.id?.startsWith("COMP") 
                        ? undefined 
                        : currentEvaluation?.id
      
      const res = await fetch("/api/self-evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": currentUser.id },
        body: JSON.stringify({
          action: "submit",
          id: evaluationId,
          evaluationType,
          assessmentType: currentEvaluation?.assessmentType,
          responses,
          completionPercentage,
          dueDate: currentEvaluation?.dueDate,
        }),
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        const errorMessage = errorData.error || "Failed to submit evaluation"
        
        // Check if error is because it's already submitted
        if (errorMessage.toLowerCase().includes("already submitted") || 
            errorMessage.toLowerCase().includes("submitted")) {
          alert("This evaluation has already been submitted. The page will refresh.")
          // Reload the evaluation to get updated status
          window.location.reload()
          return
        }
        
        throw new Error(errorMessage)
      }
      
      const data = await res.json()
      
      // Check response - if already submitted, handle gracefully
      if (data.evaluation?.status === "submitted" || data.evaluation?.status === "approved") {
        // Update evaluation status
        setCurrentEvaluation((prev) =>
          prev
            ? {
                ...prev,
                id: data.evaluation?.id || prev.id,
                status: data.evaluation.status,
                submittedAt: data.evaluation.submitted_at || new Date().toISOString(),
                lastModified: new Date().toISOString(),
              }
            : prev,
        )
        
        // Reset form values after successful submission
        setResponses({})
        setIsSubmitted(true)
        setValidationErrors({})
        setCompletionPercentage(0)
        
        alert("Evaluation submitted successfully.")
      } else {
        // If status is not updated, something went wrong
        console.warn('⚠️ [Submit] Response did not confirm submission status:', data)
        alert("Submission may have failed. Please check your history or refresh the page.")
      }
      
      // Release submission lock
      submissionInProgressRef.current = false
      
      // Reload history to show the new submission
      // Resolve staff_id for history reload
      let staffIdForHistory = currentUser.id
      const isValidUUID = (str: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        return uuidRegex.test(str)
      }
      
      if (!isValidUUID(currentUser.id)) {
        try {
          const staffRes = await fetch(`/api/staff/list`)
          if (staffRes.ok) {
            const staffJson = await staffRes.json()
            const staffList = Array.isArray(staffJson?.staff) ? staffJson.staff : []
            const matchingStaff = staffList.find((s: any) => 
              s.user_id === currentUser.id || s.email === currentUser.email
            )
            if (matchingStaff?.id && isValidUUID(matchingStaff.id)) {
              staffIdForHistory = matchingStaff.id
            }
          }
        } catch (resolveError) {
          console.error('Error resolving staff_id for history reload:', resolveError)
        }
      }
      
      const historyRes = await fetch(`/api/self-evaluations?status=submitted&staffId=${encodeURIComponent(staffIdForHistory)}`, {
        headers: { "x-user-id": currentUser.id },
      })
      if (historyRes.ok) {
        const historyJson = await historyRes.json()
        const records = Array.isArray(historyJson?.evaluations) ? historyJson.evaluations : []
        setHistoryRecords(records)
        console.log('✅ [History] Reloaded after submission:', records.length, 'records')
      }
    } catch (e: any) {
      console.error("Failed to submit evaluation:", e)
      
      // Check if error is about already submitted
      const errorMessage = e?.message || ""
      if (errorMessage.toLowerCase().includes("already submitted") ||
          errorMessage.toLowerCase().includes("submitted")) {
        alert("This evaluation has already been submitted. The page will refresh.")
        window.location.reload()
        return
      }
      
      alert(`Failed to submit evaluation: ${errorMessage || "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
      submissionInProgressRef.current = false // Always release lock
    }
  }

  const renderQuestion = (question: PerformanceQuestion) => {
    switch (question.type) {
      case "rating":
        return (
          <RadioGroup
            value={responses[question.id] || ""}
            onValueChange={(value) => handleResponseChange(question.id, value)}
            className="flex space-x-4"
          >
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                <Label htmlFor={`${question.id}-${option}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "text":
        return (
          <Textarea
            value={responses[question.id] || ""}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter your response..."
            className="min-h-[100px]"
          />
        )

      case "select":
        return (
          <Select
            value={responses[question.id] || ""}
            onValueChange={(value) => handleResponseChange(question.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "checkbox":
        return (
          <div className="grid grid-cols-2 gap-2">
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  checked={responses[question.id]?.includes(option) || false}
                  onCheckedChange={(checked) => {
                    const currentValues = responses[question.id] || []
                    if (checked) {
                      handleResponseChange(question.id, [...currentValues, option])
                    } else {
                      handleResponseChange(
                        question.id,
                        currentValues.filter((v: string) => v !== option),
                      )
                    }
                  }}
                />
                <Label className="text-sm">{option}</Label>
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getEvaluationTypeIcon = (type: "performance" | "competency") => {
    return type === "competency" ? (
      <Target className="h-4 w-4 text-blue-600" />
    ) : (
      <TrendingUp className="h-4 w-4 text-green-600" />
    )
  }

  // Handle URL parameters on page load
  useEffect(() => {
    if (urlEvaluationType) {
      setEvaluationType(urlEvaluationType as "performance" | "competency")
      setActiveTab(urlEvaluationType === "competency" ? "competency" : "performance")
    }
    
    if (urlStaffId && urlType) {
      toast({
        title: "Starting New Evaluation",
        description: `Creating ${urlType} evaluation for selected staff member`,
      })
    }
  }, [urlStaffId, urlType, urlEvaluationType, toast])

  // Sync active tab with evaluation type so competency is immediately functional
  useEffect(() => {
    if (activeTab === "competency" && evaluationType !== "competency") {
      setEvaluationType("competency")
      setIsSubmitted(false) // Reset submission state when switching tabs
    } else if (activeTab === "performance" && evaluationType !== "performance") {
      setEvaluationType("performance")
      setIsSubmitted(false) // Reset submission state when switching tabs
    }
  }, [activeTab])

  const groupedQuestions = questions.reduce(
    (acc, question) => {
      if (!acc[question.category]) {
        acc[question.category] = []
      }
      acc[question.category].push(question)
      return acc
    },
    {} as Record<string, PerformanceQuestion[]>,
  )

  // Filter history records by evaluation type (using real data)
  // Show all records that are submitted or approved (exclude drafts)
  const performanceHistory = historyRecords.filter((e: any) => 
    e.evaluation_type === "performance" && (e.status === "submitted" || e.status === "approved")
  )
  const competencyHistory = historyRecords.filter((e: any) => 
    e.evaluation_type === "competency" && (e.status === "submitted" || e.status === "approved")
  )
  
  // Sort by submitted date (newest first)
  performanceHistory.sort((a: any, b: any) => {
    const dateA = new Date(a.submitted_at || a.submittedAt || a.created_at || 0).getTime()
    const dateB = new Date(b.submitted_at || b.submittedAt || b.created_at || 0).getTime()
    return dateB - dateA
  })
  
  competencyHistory.sort((a: any, b: any) => {
    const dateA = new Date(a.submitted_at || a.submittedAt || a.created_at || 0).getTime()
    const dateB = new Date(b.submitted_at || b.submittedAt || b.created_at || 0).getTime()
    return dateB - dateA
  })

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
                  <PenTool className="h-6 w-6 mr-3 text-indigo-600" />
                  Self Evaluation
                </h1>
                <p className="text-gray-600">Complete your performance and competency self-assessments</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-indigo-100 text-indigo-800">
                <User className="h-3 w-3 mr-1" />
                {currentUser.role.name}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="performance">Performance Evaluation</TabsTrigger>
            <TabsTrigger value="competency">Competency Assessment</TabsTrigger>
            <TabsTrigger value="history">Evaluation History</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            {/* Performance Evaluation Explanation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Performance Evaluation
                </CardTitle>
                <CardDescription>
                  <strong>Focus:</strong> How well are you performing your job responsibilities?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Purpose</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Assess how well you actually perform your assigned job responsibilities and tasks over time,
                    including productivity, quality of care, and adherence to organizational policies.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                    <div>
                      <h5 className="font-medium mb-1">Evaluation Areas:</h5>
                      <ul className="space-y-1">
                        <li>• Job performance and productivity</li>
                        <li>• Quality of work output</li>
                        <li>• Communication effectiveness</li>
                        <li>• Teamwork and collaboration</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-1">Assessment Focus:</h5>
                      <ul className="space-y-1">
                        <li>• Actual execution of duties</li>
                        <li>• Achievement of goals and metrics</li>
                        <li>• Professional behavior</li>
                        <li>• Continuous improvement</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Evaluation Form */}
            {currentEvaluation && (
              <>
                {/* Progress Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Performance Evaluation Progress</span>
                      {getStatusBadge(currentEvaluation.status)}
                    </CardTitle>
                    <CardDescription>
                      {currentEvaluation.assessmentType.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/-/g, " ")}
                      {" "}• Due: {new Date(currentEvaluation.dueDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Completion Progress</span>
                        <span className="text-sm text-gray-600">{Math.round(completionPercentage)}%</span>
                      </div>
                      <Progress value={completionPercentage} className="h-3" />
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Last modified: {new Date(currentEvaluation.lastModified).toLocaleString()}</span>
                        <span>
                          {questions.filter((q) => q.required && responses[q.id]).length} of{" "}
                          {questions.filter((q) => q.required).length} required questions completed
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Questions */}
                <div className="space-y-6">
                  {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className="text-lg">{category}</CardTitle>
                        <CardDescription>
                          {categoryQuestions.length} question{categoryQuestions.length !== 1 ? "s" : ""} in this
                          category
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {categoryQuestions.map((question) => (
                          <div key={question.id} className="space-y-3">
                            <div className="flex items-start justify-between">
                              <Label className="text-sm font-medium leading-relaxed">{question.question}</Label>
                              {question.required && <span className="text-red-500 text-sm ml-1">*</span>}
                            </div>
                            {renderQuestion(question)}
                            {validationErrors[question.id] && (
                              <p className="text-sm text-red-600 mt-1">{validationErrors[question.id]}</p>
                            )}
                            {question.type === "rating" && (
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Poor</span>
                                <span>Excellent</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Action Buttons */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Auto-saved {new Date().toLocaleTimeString()}
                      </div>
                      <div className="flex space-x-3">
                        <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Draft
                        </Button>
                        <Button
                          onClick={handleSubmitEvaluation}
                          disabled={completionPercentage < 100 || isSubmitting || isSubmitted || currentEvaluation?.status === "submitted" || currentEvaluation?.status === "approved" || submissionInProgressRef.current}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {isSubmitting ? "Submitting..." : currentEvaluation?.status === "submitted" || currentEvaluation?.status === "approved" ? "Already Submitted" : "Submit Performance Evaluation"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="competency" className="space-y-6">
            {/* Competency Assessment Explanation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                  Competency Assessment
                </CardTitle>
                <CardDescription>
                  <strong>Focus:</strong> Do you have the skills and knowledge to do your job safely?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Purpose</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Evaluate whether you have the necessary skills, knowledge, and abilities to perform your assigned
                    job duties safely and effectively. This determines if you possess the required competencies for your
                    role.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                    <div>
                      <h5 className="font-medium mb-1">Assessment Areas:</h5>
                      <ul className="space-y-1">
                        <li>• Clinical skills and knowledge</li>
                        <li>• Safety protocols and compliance</li>
                        <li>• Technical proficiency</li>
                        <li>• Professional standards</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-1">Assessment Methods:</h5>
                      <ul className="space-y-1">
                        <li>• Skills demonstrations</li>
                        <li>• Knowledge assessments</li>
                        <li>• Competency checklists</li>
                        <li>• Self-evaluation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competency Assessment Form */}
            {currentEvaluation && evaluationType === "competency" && (
              <>
                {/* Progress Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Competency Assessment Progress</span>
                      {getStatusBadge(currentEvaluation.status)}
                    </CardTitle>
                    <CardDescription>
                      {currentEvaluation.assessmentType.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/-/g, " ")}
                      {" "}• Due: {new Date(currentEvaluation.dueDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Completion Progress</span>
                        <span className="text-sm text-gray-600">{Math.round(completionPercentage)}%</span>
                      </div>
                      <Progress value={completionPercentage} className="h-3" />
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Last modified: {new Date(currentEvaluation.lastModified).toLocaleString()}</span>
                        <span>
                          {questions.filter((q) => q.required && responses[q.id]).length} of{" "}
                          {questions.filter((q) => q.required).length} required questions completed
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Competency Questions */}
                <div className="space-y-6">
                  {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className="text-lg">{category}</CardTitle>
                        <CardDescription>
                          {categoryQuestions.length} question{categoryQuestions.length !== 1 ? "s" : ""} in this
                          category
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {categoryQuestions.map((question) => (
                          <div key={question.id} className="space-y-3">
                            <div className="flex items-start justify-between">
                              <Label className="text-sm font-medium leading-relaxed">{question.question}</Label>
                              {question.required && <span className="text-red-500 text-sm ml-1">*</span>}
                            </div>
                            {renderQuestion(question)}
                            {validationErrors[question.id] && (
                              <p className="text-sm text-red-600 mt-1">{validationErrors[question.id]}</p>
                            )}
                            {question.type === "rating" && (
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Not Competent</span>
                                <span>Highly Competent</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Action Buttons */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Auto-saved {new Date().toLocaleTimeString()}
                      </div>
                      <div className="flex space-x-3">
                        <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Draft
                        </Button>
                        <Button
                          onClick={handleSubmitEvaluation}
                          disabled={completionPercentage < 100 || isSubmitting || isSubmitted || currentEvaluation?.status === "submitted" || currentEvaluation?.status === "approved" || submissionInProgressRef.current}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {isSubmitting ? "Submitting..." : currentEvaluation?.status === "submitted" || currentEvaluation?.status === "approved" ? "Already Submitted" : "Submit Competency Assessment"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    Performance Evaluation History
                  </CardTitle>
                  <CardDescription>Your completed performance evaluations and feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {historyLoading && (
                      <div className="text-sm text-gray-600 p-4">Loading evaluation history...</div>
                    )}
                    {historyError && (
                      <div className="text-sm text-red-600 p-4 bg-red-50 border border-red-200 rounded-lg">
                        Error: {historyError}
                        <br />
                        <span className="text-xs">Check browser console for details.</span>
                      </div>
                    )}
                    {!historyLoading && !historyError && performanceHistory.length === 0 && (
                      <div className="text-sm text-gray-600 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        No submitted performance evaluations yet.
                        <br />
                        <span className="text-xs text-gray-500 mt-1 block">
                          Complete and submit a performance evaluation to see it here.
                        </span>
                      </div>
                    )}
                    {!historyLoading && !historyError && performanceHistory.map((evaluation: any) => (
                      <div key={evaluation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">
                              {String(evaluation.assessment_type || "Performance Evaluation").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/-/g, " ")}
                            </h3>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-600">
                                Submitted: {evaluation.submitted_at ? new Date(evaluation.submitted_at).toLocaleDateString() : evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString() : "—"}
                              </p>
                              {evaluation.approved_at && (
                                <p className="text-sm text-gray-600">
                                  Approved: {new Date(evaluation.approved_at).toLocaleDateString()}
                                  {evaluation.approved_by_name && ` by ${evaluation.approved_by_name}`}
                                </p>
                              )}
                              {evaluation.status === 'approved' && evaluation.overall_score !== undefined && (
                                <div className="flex items-center space-x-2 mt-2">
                                  <span className="text-sm font-medium text-gray-700">Overall Score:</span>
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  <span className="text-lg font-bold text-gray-900">{evaluation.overall_score?.toFixed(1) || 'N/A'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          {getStatusBadge(evaluation.status || 'submitted')}
                          {evaluation.status === 'approved' && evaluation.overall_score && (
                            <div className="text-center">
                              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 mx-auto" />
                              <span className="text-xl font-bold">{evaluation.overall_score?.toFixed(1)}</span>
                            </div>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedEvaluationDetails(evaluation)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Competency History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-blue-600" />
                    Competency Assessment History
                  </CardTitle>
                  <CardDescription>Your completed competency assessments and validations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {historyLoading && (
                      <div className="text-sm text-gray-600 p-4">Loading evaluation history...</div>
                    )}
                    {historyError && (
                      <div className="text-sm text-red-600 p-4 bg-red-50 border border-red-200 rounded-lg">
                        Error: {historyError}
                        <br />
                        <span className="text-xs">Check browser console for details.</span>
                      </div>
                    )}
                    {!historyLoading && !historyError && competencyHistory.length === 0 && (
                      <div className="text-sm text-gray-600 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        No submitted competency assessments yet.
                        <br />
                        <span className="text-xs text-gray-500 mt-1 block">
                          Complete and submit a competency assessment to see it here.
                        </span>
                      </div>
                    )}
                    {!historyLoading && !historyError && competencyHistory.map((evaluation: any) => (
                      <div key={evaluation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Target className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">
                              {String(evaluation.assessment_type || "Competency Assessment").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/-/g, " ")}
                            </h3>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-600">
                                Submitted: {evaluation.submitted_at ? new Date(evaluation.submitted_at).toLocaleDateString() : evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString() : "—"}
                              </p>
                              {evaluation.approved_at && (
                                <p className="text-sm text-gray-600">
                                  Approved: {new Date(evaluation.approved_at).toLocaleDateString()}
                                  {evaluation.approved_by_name && ` by ${evaluation.approved_by_name}`}
                                </p>
                              )}
                              {evaluation.status === 'approved' && evaluation.overall_score !== undefined && (
                                <div className="flex items-center space-x-2 mt-2">
                                  <span className="text-sm font-medium text-gray-700">Overall Score:</span>
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  <span className="text-lg font-bold text-gray-900">{evaluation.overall_score?.toFixed(1) || 'N/A'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          {getStatusBadge(evaluation.status || 'submitted')}
                          {evaluation.status === 'approved' && evaluation.overall_score && (
                            <div className="text-center">
                              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 mx-auto" />
                              <span className="text-xl font-bold">{evaluation.overall_score?.toFixed(1)}</span>
                            </div>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedEvaluationDetails(evaluation)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Evaluation Details Dialog */}
            {selectedEvaluationDetails && (
              <Dialog open={!!selectedEvaluationDetails} onOpenChange={(open) => {
                if (!open) setSelectedEvaluationDetails(null)
              }}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      {selectedEvaluationDetails.evaluation_type === 'performance' ? (
                        <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                      ) : (
                        <Target className="h-5 w-5 mr-2 text-blue-600" />
                      )}
                      {String(selectedEvaluationDetails.assessment_type || 'Evaluation').replace(/\b\w/g, (c) => c.toUpperCase()).replace(/-/g, ' ')}
                    </DialogTitle>
                    <DialogDescription>
                      Complete details for this evaluation
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Evaluation Type</Label>
                        <p className="text-sm font-medium mt-1">
                          {String(selectedEvaluationDetails.evaluation_type || 'N/A').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Status</Label>
                        <div className="mt-1">
                          {getStatusBadge(selectedEvaluationDetails.status || 'submitted')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Submitted Date</Label>
                        <p className="text-sm mt-1">
                          {selectedEvaluationDetails.submitted_at 
                            ? new Date(selectedEvaluationDetails.submitted_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })
                            : selectedEvaluationDetails.created_at
                            ? new Date(selectedEvaluationDetails.created_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })
                            : '—'}
                        </p>
                      </div>
                      {selectedEvaluationDetails.approved_at && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Approved Date</Label>
                          <p className="text-sm mt-1">
                            {new Date(selectedEvaluationDetails.approved_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                            {selectedEvaluationDetails.approved_by_name && (
                              <span className="text-gray-500 ml-2">by {selectedEvaluationDetails.approved_by_name}</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {(selectedEvaluationDetails.overall_score !== undefined || selectedEvaluationDetails.completion_percentage !== undefined) && (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedEvaluationDetails.overall_score !== undefined && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Overall Score</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                              <span className="text-2xl font-bold">{selectedEvaluationDetails.overall_score.toFixed(1)}</span>
                              <span className="text-sm text-gray-500">/ 5.0</span>
                            </div>
                          </div>
                        )}
                        {selectedEvaluationDetails.completion_percentage !== undefined && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Completion Percentage</Label>
                            <div className="mt-1">
                              <Progress value={selectedEvaluationDetails.completion_percentage} className="h-2" />
                              <p className="text-sm text-gray-600 mt-1">{selectedEvaluationDetails.completion_percentage}%</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedEvaluationDetails.reviewer_notes && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Supervisor Notes</Label>
                        <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {selectedEvaluationDetails.reviewer_notes}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedEvaluationDetails.responses && Object.keys(selectedEvaluationDetails.responses).length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Your Responses</Label>
                        <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                          {Object.entries(selectedEvaluationDetails.responses).map(([key, value]: [string, any]) => (
                            <div key={key} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <h4 className="font-medium text-sm capitalize mb-1">
                                {key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                              </h4>
                              <p className="text-sm text-gray-700">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button variant="outline" onClick={() => setSelectedEvaluationDetails(null)}>
                      Close
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Development Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Professional Development Plan
                </CardTitle>
                <CardDescription>Set goals and track your professional growth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Award className="h-4 w-4 mr-2" />
                        Performance Goals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {pipLoading && <div className="text-sm text-gray-600">Loading goals...</div>}
                        {!pipLoading && performanceGoals.length > 0 && performanceGoals.map((goal: any, idx: number) => (
                            <div key={goal.id || idx} className={`p-3 border rounded-lg ${
                              goal.completed ? 'bg-green-50 border-green-200' :
                              goal.progress >= 75 ? 'bg-blue-50 border-blue-200' :
                              goal.progress >= 50 ? 'bg-yellow-50 border-yellow-200' :
                              'bg-gray-50 border-gray-200'
                            }`}>
                              <h4 className="font-medium text-sm">{goal.description || 'Performance Goal'}</h4>
                              <p className="text-xs text-gray-600 mt-1">
                                {goal.targetDate ? (() => {
                                  try {
                                    const date = new Date(goal.targetDate)
                                    if (!isNaN(date.getTime())) {
                                      return (
                                        <>
                                          Target completion: {date.toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric' 
                                          })}
                                        </>
                                      )
                                    }
                                  } catch (e) {
                                    // Invalid date
                                  }
                                  return <>Target completion: {String(goal.targetDate)}</>
                                })() : goal.target ? (
                                  <>Target: {goal.target}</>
                                ) : (
                                  <>Target: Set completion date</>
                                )}
                                {goal.completed && <span className="ml-2 text-green-600 font-medium">✓ Completed</span>}
                              </p>
                              <div className="mt-2">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                  <span>Progress</span>
                                  <span>{goal.progress || 0}%</span>
                                </div>
                                <Progress value={goal.progress || 0} className="h-2" />
                              </div>
                              {goal.actions && Array.isArray(goal.actions) && goal.actions.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-700 mb-1">Action Items:</p>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {goal.actions.slice(0, 3).map((action: string, actionIdx: number) => (
                                      <li key={actionIdx} className="flex items-start">
                                        <span className="mr-1">•</span>
                                        <span>{action}</span>
                                      </li>
                                    ))}
                                    {goal.actions.length > 3 && (
                                      <li className="text-gray-500 italic">+ {goal.actions.length - 3} more</li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        {!pipLoading && performanceGoals.length === 0 && (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-xs text-gray-600">
                              No active performance improvement goals at this time.
                              <br />
                              <span className="text-gray-500 mt-1 block">
                              Performance improvement plans will appear here when assigned by your supervisor.
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Competency Goals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {pipLoading && <div className="text-sm text-gray-600">Loading goals...</div>}
                        {!pipLoading && competencyGoals.length > 0 && competencyGoals.map((goal: any, idx: number) => (
                          <div key={goal.id || idx} className={`p-3 border rounded-lg ${
                            goal.completed ? 'bg-green-50 border-green-200' :
                            goal.progress >= 75 ? 'bg-blue-50 border-blue-200' :
                            goal.progress >= 50 ? 'bg-yellow-50 border-yellow-200' :
                              'bg-gray-50 border-gray-200'
                            }`}>
                            <h4 className="font-medium text-sm">{goal.description || 'Competency Goal'}</h4>
                            <p className="text-xs text-gray-600 mt-1">
                              {goal.targetDate ? (() => {
                                try {
                                  const date = new Date(goal.targetDate)
                                  if (!isNaN(date.getTime())) {
                                    return (
                                      <>
                                        Target completion: {date.toLocaleDateString('en-US', { 
                                          year: 'numeric', 
                                          month: 'short', 
                                          day: 'numeric' 
                                        })}
                                      </>
                                    )
                                  }
                                } catch (e) {
                                  // Invalid date
                                }
                                return <>Target completion: {String(goal.targetDate)}</>
                              })() : goal.target ? (
                                <>Target: {goal.target}</>
                              ) : (
                                <>Target completion: Not set</>
                              )}
                              {goal.completed && <span className="ml-2 text-green-600 font-medium">✓ Completed</span>}
                            </p>
                              <div className="mt-2">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{goal.progress || 0}%</span>
                                </div>
                              <Progress value={goal.progress || 0} className="h-2" />
                              </div>
                            {goal.actions && Array.isArray(goal.actions) && goal.actions.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700 mb-1">Action Items:</p>
                                <ul className="text-xs text-gray-600 space-y-1">
                                  {goal.actions.slice(0, 3).map((action: string, actionIdx: number) => (
                                    <li key={actionIdx} className="flex items-start">
                                      <span className="mr-1">•</span>
                                      <span>{action}</span>
                                    </li>
                                  ))}
                                  {goal.actions.length > 3 && (
                                    <li className="text-gray-500 italic">+ {goal.actions.length - 3} more</li>
                                  )}
                                </ul>
                            </div>
                            )}
                          </div>
                        ))}
                        {!pipLoading && competencyGoals.length === 0 && (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                            <Target className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-gray-600 font-medium mb-1">
                              No active competency goals
                            </p>
                            <p className="text-xs text-gray-500">
                              Competency improvement goals will appear here based on your assessment results and improvement plans.
                            </p>
                          </div>
                        )}
                      </div>
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
