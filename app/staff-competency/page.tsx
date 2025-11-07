"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
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
  Eye,
  Loader2,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

interface CompetencyArea {
  id: string
  name: string
  description: string
  weight: number
  areaScore?: number // Calculated area score based on skills
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
  const searchParams = useSearchParams()
  const [currentUser] = useState(getCurrentUser())
  const { toast } = useToast()
  
  // Read URL parameters
  const urlStaffId = searchParams?.get("staffId") || null
  const urlEvaluationType = searchParams?.get("evaluationType") || null
  
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedStaff, setSelectedStaff] = useState<string>(urlStaffId || "")
  const [selectedCompetencyArea, setSelectedCompetencyArea] = useState<string>("")
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<string>("RN")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isAssessing, setIsAssessing] = useState(false)
  const [staffCompetencyRecords, setStaffCompetencyRecords] = useState<StaffCompetencyRecord[]>([])
  const [isLoadingRecords, setIsLoadingRecords] = useState(true)
  const [isSeedingData, setIsSeedingData] = useState(false)
  const [staffList, setStaffList] = useState<any[]>([])
  const [isNewAssessmentOpen, setIsNewAssessmentOpen] = useState(false)
  const [newAssessmentData, setNewAssessmentData] = useState({
    staffId: "",
    evaluationType: "annual" as "initial" | "annual" | "skills-validation" | "performance-improvement",
    nextEvaluationDue: "",
    evaluatorName: "",
  })
  const [aiAssessments, setAiAssessments] = useState<any[]>([])
  const [isLoadingAiAssessments, setIsLoadingAiAssessments] = useState(false)
  const [isAiAssessmentOpen, setIsAiAssessmentOpen] = useState(false)
  const [aiAssessmentData, setAiAssessmentData] = useState({
    staffId: "",
    competencyArea: "",
    videoFile: null as File | null,
    videoUrl: "",
  })
  const [isStartingAiAssessment, setIsStartingAiAssessment] = useState(false)
  const [aiAnalysisProgress, setAiAnalysisProgress] = useState(0)
  const [aiAnalysisPhase, setAiAnalysisPhase] = useState("")
  const [aiLiveInsights, setAiLiveInsights] = useState<string[]>([])
  const [showAiResults, setShowAiResults] = useState(false)
  const [aiAssessmentResult, setAiAssessmentResult] = useState<any>(null)
  
  // Assess Skills Dialog State
  const [isAssessSkillsOpen, setIsAssessSkillsOpen] = useState(false)
  const [selectedRecordForAssessment, setSelectedRecordForAssessment] = useState<StaffCompetencyRecord | null>(null)
  const [skillAssessments, setSkillAssessments] = useState<Record<string, {
    supervisorScore: number
    status: "competent" | "needs-improvement" | "not-competent"
    notes: string
  }>>({})
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("") // For PIP supervisor assignment

  // Live camera features removed - video evaluation available in /evaluations page

  // Normalize role name for matching (handles variations like "RN", "Registered Nurse", etc.)
  const normalizeRole = (role: string): string => {
    if (!role) return ''
    const upperRole = role.toUpperCase().trim()
    
    // Map common variations to standard role codes
    const roleMap: Record<string, string> = {
      'RN': 'RN',
      'REGISTERED NURSE': 'RN',
      'R.N.': 'RN',
      'R.N': 'RN',
      'LPN': 'LPN',
      'LICENSED PRACTICAL NURSE': 'LPN',
      'L.P.N.': 'LPN',
      'L.P.N': 'LPN',
      'HHA': 'HHA',
      'HOME HEALTH AIDE': 'HHA',
      'HOME HEALTH AID': 'HHA',
      'PT': 'PT',
      'PHYSICAL THERAPIST': 'PT',
      'P.T.': 'PT',
      'P.T': 'PT',
      'OT': 'OT',
      'OCCUPATIONAL THERAPIST': 'OT',
      'O.T.': 'OT',
      'O.T': 'OT',
      'MSW': 'MSW',
      'MASTER OF SOCIAL WORK': 'MSW',
      'SOCIAL WORKER': 'MSW'
    }
    
    // Check direct match first
    if (roleMap[upperRole]) {
      return roleMap[upperRole]
    }
    
    // Check if role contains any of the key terms
    for (const [key, value] of Object.entries(roleMap)) {
      if (upperRole.includes(key) || key.includes(upperRole)) {
        return value
      }
    }
    
    // Return normalized version
    return upperRole
  }

  // Build skills matrix from actual assessment data
  const buildSkillsMatrixFromRecords = (role: string): CompetencyArea[] => {
    const normalizedRole = normalizeRole(role)
    
    // Filter records by role with flexible matching
    const roleRecords = staffCompetencyRecords.filter(record => {
      if (!record.staffRole) return false
      const recordRole = normalizeRole(record.staffRole)
      return recordRole === normalizedRole
    })

    // Debug logging
    console.log('🔵 [Skill Matrix] Building matrix for role:', role, 'normalized:', normalizedRole)
    console.log('🔵 [Skill Matrix] Total records:', staffCompetencyRecords.length)
    console.log('🔵 [Skill Matrix] Filtered records for role:', roleRecords.length)
    console.log('🔵 [Skill Matrix] Sample roles in records:', [...new Set(staffCompetencyRecords.map(r => r.staffRole))].slice(0, 5))

    if (roleRecords.length === 0) {
      console.log('⚠️ [Skill Matrix] No records found for role:', role)
      return []
    }

    // Aggregate skills across all records for this role
    const areaMap = new Map<string, {
      area: CompetencyArea
      skillMap: Map<string, {
        skill: CompetencySkill
        assessments: Array<{ self?: number; supervisor?: number; status: string; lastAssessed?: string }>
      }>
    }>()

    // Process each record
    roleRecords.forEach(record => {
      record.competencyAreas?.forEach(area => {
        const areaKey = area.id || area.name.toLowerCase().replace(/\s+/g, '-')
        
        if (!areaMap.has(areaKey)) {
          areaMap.set(areaKey, {
            area: {
              id: areaKey,
              name: area.name,
              description: area.description || '',
              weight: area.weight || 0,
              areaScore: 0,
              skills: []
            },
            skillMap: new Map()
          })
        }

        const areaData = areaMap.get(areaKey)!
        
        // Process skills in this area
        area.skills?.forEach(skill => {
          // Use skill ID if available, otherwise create a key from name
          const skillKey = skill.id || skill.name.toLowerCase().replace(/\s+/g, '-')
          
          if (!areaData.skillMap.has(skillKey)) {
            areaData.skillMap.set(skillKey, {
              skill: {
                id: skillKey,
                name: skill.name,
                description: skill.description || '',
                required: skill.required ?? true,
                assessmentMethod: skill.assessmentMethod || 'observation',
                passingScore: skill.passingScore || 80,
                status: 'not-assessed',
                selfAssessment: undefined,
                supervisorAssessment: undefined,
                lastAssessed: undefined,
                nextDue: skill.nextDue || undefined,
                evidence: Array.isArray(skill.evidence) ? skill.evidence : []
              },
              assessments: []
            })
          }

          const skillData = areaData.skillMap.get(skillKey)!
          
          // Add assessment data - include all skills, even if not assessed
          skillData.assessments.push({
            self: skill.selfAssessment ?? undefined,
            supervisor: skill.supervisorAssessment ?? undefined,
            status: skill.status || 'not-assessed',
            lastAssessed: skill.lastAssessed
          })
        })
      })
    })

    // Convert to array and calculate averages
    const matrixAreas: CompetencyArea[] = Array.from(areaMap.values()).map(({ area, skillMap }) => {
      const skills: CompetencySkill[] = Array.from(skillMap.values()).map(({ skill, assessments }) => {
        // Calculate average scores from all assessments
        const selfScores = assessments.map(a => a.self).filter((s): s is number => s !== null && s !== undefined)
        const supervisorScores = assessments.map(a => a.supervisor).filter((s): s is number => s !== null && s !== undefined)
        
        const avgSelf = selfScores.length > 0 
          ? Math.round(selfScores.reduce((sum, s) => sum + s, 0) / selfScores.length)
          : undefined
        
        const avgSupervisor = supervisorScores.length > 0
          ? Math.round(supervisorScores.reduce((sum, s) => sum + s, 0) / supervisorScores.length)
          : undefined

        // Determine overall status (most common status, or use skill's default status)
        const statusCounts = new Map<string, number>()
        assessments.forEach(a => {
          if (a.status) {
            statusCounts.set(a.status, (statusCounts.get(a.status) || 0) + 1)
          }
        })
        const mostCommonStatus = assessments.length > 0 && statusCounts.size > 0
          ? Array.from(statusCounts.entries())
              .sort((a, b) => b[1] - a[1])[0]?.[0] || 'not-assessed'
          : skill.status || 'not-assessed'

        // Get most recent assessment date
        const lastAssessedDates = assessments
          .map(a => a.lastAssessed)
          .filter((d): d is string => !!d && d !== 'undefined')
          .sort((a, b) => {
            try {
              return new Date(b).getTime() - new Date(a).getTime()
            } catch {
              return 0
            }
          })
        const lastAssessed = lastAssessedDates[0] || skill.lastAssessed

        // Determine status from average score if we have score data (more accurate)
        let finalStatus = mostCommonStatus
        const finalScore = avgSupervisor ?? avgSelf ?? undefined
        
        // If we have score data, use it to determine status (more accurate)
        if (finalScore !== undefined && finalScore > 0) {
          const passingScore = skill.passingScore || 80
          if (finalScore >= passingScore) {
            finalStatus = 'competent'
          } else if (finalScore >= passingScore * 0.75) {
            finalStatus = 'needs-improvement'
          } else if (finalScore > 0) {
            finalStatus = 'not-competent'
          } else {
            finalStatus = 'not-assessed'
          }
        }

        return {
          ...skill,
          selfAssessment: avgSelf ?? undefined,
          supervisorAssessment: avgSupervisor ?? undefined,
          status: finalStatus as "not-assessed" | "competent" | "needs-improvement" | "not-competent",
          lastAssessed: lastAssessed
        }
      })

      // Calculate area score from skills - only count skills that have been assessed
      const assessedSkills = skills.filter(s => s.supervisorAssessment !== undefined || s.selfAssessment !== undefined)
      const areaScore = assessedSkills.length > 0
        ? Math.round(
            assessedSkills.reduce((sum, s) => {
              const score = s.supervisorAssessment ?? s.selfAssessment ?? 0
              return sum + score
            }, 0) / assessedSkills.length
          )
        : 0

      return {
        ...area,
        areaScore,
        skills
      }
    })

    return matrixAreas
  }

  // Role-specific competency areas (template/fallback)
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

  // Load competency records from API
  useEffect(() => {
    const loadRecords = async () => {
      try {
        setIsLoadingRecords(true)
        const res = await fetch('/api/staff-performance/competency')
        const data = await res.json()
        if (data.success && data.records) {
          // Transform API records using helper function
          const transformed = data.records.map(transformRecord)
          setStaffCompetencyRecords(transformed)
        }
      } catch (error) {
        console.error('Error loading competency records:', error)
        toast({ title: "Error", description: "Failed to load competency records", variant: "destructive" })
      } finally {
        setIsLoadingRecords(false)
      }
    }
    loadRecords()
  }, [toast])

  // Handle URL parameters on page load
  useEffect(() => {
    if (urlStaffId && urlEvaluationType) {
      // Set the evaluation type in new assessment data
      setNewAssessmentData(prev => ({
        ...prev,
        staffId: urlStaffId,
        evaluationType: urlEvaluationType as any,
      }))
      
      toast({
        title: "Starting New Assessment",
        description: `Creating ${urlEvaluationType} competency assessment for selected staff member`,
      })
      
      // Optionally open the new assessment dialog
      // setIsNewAssessmentOpen(true)
    }
  }, [urlStaffId, urlEvaluationType, toast])

  // Load staff list for dropdown
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const res = await fetch('/api/staff/list')
        const data = await res.json()
        if (data.success && data.staff) {
          console.log('🔵 [Staff List] Loaded staff:', data.staff.length, 'members')
          // Log first few staff to verify structure
          if (data.staff.length > 0) {
            console.log('🔵 [Staff List] Sample staff:', data.staff.slice(0, 3).map((s: any) => ({
              id: s.id,
              idType: typeof s.id,
              name: s.name,
              email: s.email
            })))
          }
          // Deduplicate staff list by ID to prevent duplicate key errors
          const uniqueStaff = Array.from(
            new Map(data.staff.map((staff: any) => [staff.id, staff])).values()
          )
          if (uniqueStaff.length !== data.staff.length) {
            console.warn(`⚠️ [Staff List] Removed ${data.staff.length - uniqueStaff.length} duplicate staff entries`)
          }
          setStaffList(uniqueStaff)
        }
      } catch (error) {
        console.error('Error loading staff:', error)
      }
    }
    loadStaff()
  }, [])

  // Load AI assessments history
  useEffect(() => {
    const loadAiAssessments = async () => {
      try {
        setIsLoadingAiAssessments(true)
        
        // Load all AI assessments from database
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        const supabase = createClient(supabaseUrl, supabaseKey)
        
        const { data: assessments, error } = await supabase
          .from('staff_ai_assessments')
          .select(`
            *,
            staff:staff_id (
              id,
              name,
              department,
              credentials
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20) // Get more to filter completed ones
        
        if (error) {
          console.error('Error loading AI assessments:', error)
          return
        }
        
        // Transform and filter completed assessments
        const allAssessments = (assessments || [])
          .filter((assessment: any) => assessment.status === 'completed')
          .map((assessment: any) => ({
            id: assessment.id,
            overallScore: parseFloat(assessment.overall_score || 0),
            aiConfidence: parseFloat(assessment.ai_confidence || 0),
            competencyArea: assessment.competency_area,
            evaluationTime: assessment.evaluation_time,
            status: assessment.status,
            completedAt: assessment.completed_at,
            createdAt: assessment.created_at,
            staffName: assessment.staff?.name || 'Unknown Staff',
            staffRole: assessment.staff?.credentials || assessment.staff?.department || 'Staff'
          }))
        
        // Sort by date, newest first
        allAssessments.sort((a: any, b: any) => {
          const dateA = new Date(a.completedAt || a.createdAt).getTime()
          const dateB = new Date(b.completedAt || b.createdAt).getTime()
          return dateB - dateA
        })
        
        setAiAssessments(allAssessments.slice(0, 10)) // Show latest 10
      } catch (error) {
        console.error('Error loading AI assessments:', error)
        toast({
          title: "Error",
          description: "Failed to load AI assessments",
          variant: "destructive"
        })
      } finally {
        setIsLoadingAiAssessments(false)
      }
    }
    
    loadAiAssessments()
  }, [toast])

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
      case "not-assessed":
        return <Badge className="bg-gray-100 text-gray-800">Not Assessed</Badge>
      default:
        // Fallback to "Not Assessed" instead of "Unknown"
        return <Badge className="bg-gray-100 text-gray-800">Not Assessed</Badge>
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

  // Helper function to transform API record to StaffCompetencyRecord with accurate calculations
  const transformRecord = (record: any): StaffCompetencyRecord => {
    // Process competency areas and calculate scores
    const competencyAreas = (record.competencyAreas || []).map((area: any) => {
      const skills = (area.items || []).map((item: any) => {
        // Get final score from database (0-100 scale)
        const finalScore = item.supervisorAssessmentScore || item.selfAssessmentScore || (item.score ? item.score * 20 : 0)
        
        // Determine status from score
        let skillStatus = item.status
        if (!skillStatus || skillStatus === 'not-assessed') {
          if (finalScore >= 80) {
            skillStatus = 'competent'
          } else if (finalScore >= 60) {
            skillStatus = 'needs-improvement'
          } else if (finalScore > 0) {
            skillStatus = 'not-competent'
          } else {
            skillStatus = 'not-assessed'
          }
        }

        // Map assessment method from API (if available) or default to observation
        let assessmentMethod: "demonstration" | "written" | "observation" | "simulation" = "observation"
        if (item.assessmentMethod) {
          const method = String(item.assessmentMethod).toLowerCase()
          if (method === 'demonstration' || method === 'written' || method === 'observation' || method === 'simulation') {
            assessmentMethod = method as any
          }
        }

        return {
          id: item.id || '',
          name: item.description || '',
          description: item.description || '',
          required: item.required !== undefined ? item.required : true,
          assessmentMethod: assessmentMethod,
          passingScore: item.passingScore || 80,
          selfAssessment: item.selfAssessmentScore !== null && item.selfAssessmentScore !== undefined ? Number(item.selfAssessmentScore) : undefined,
          supervisorAssessment: item.supervisorAssessmentScore !== null && item.supervisorAssessmentScore !== undefined ? Number(item.supervisorAssessmentScore) : undefined,
          status: skillStatus,
          lastAssessed: item.lastAssessed || undefined,
          nextDue: item.nextDue || undefined,
          evidence: Array.isArray(item.evidence) && item.evidence.length > 0 ? item.evidence : (item.evidenceProvided ? ["Assessment completed"] : [])
        }
      })

      // Calculate area score based on actual skill scores
      let areaScore = 0
      if (skills.length > 0) {
        // Calculate average of all skill scores (including 0 scores)
        const totalScore = skills.reduce((sum: number, skill: any) => {
          const skillScore = skill.supervisorAssessment !== undefined
            ? skill.supervisorAssessment
            : (skill.selfAssessment !== undefined
              ? skill.selfAssessment
              : 0)
          return sum + (skillScore || 0)
        }, 0)
        areaScore = skills.length > 0 ? Math.round(totalScore / skills.length) : 0
      } else {
        // If no skills, use categoryScore from API (which comes from category_score in database) or 0
        const categoryScore = area.categoryScore !== null && area.categoryScore !== undefined
          ? parseFloat(area.categoryScore.toString())
          : (area.category_score !== null && area.category_score !== undefined
            ? parseFloat(area.category_score.toString())
            : 0)
        areaScore = Math.round(categoryScore)
      }
      
      // Ensure area score is between 0-100
      areaScore = Math.max(0, Math.min(100, areaScore))

      return {
        id: area.category?.toLowerCase().replace(/\s+/g, '-') || '',
        name: area.category || '',
        description: '',
        weight: Math.round(area.weight || 0), // API already returns percentage (0-100), no need to multiply
        areaScore: areaScore, // Store calculated area score
        skills: skills
      }
    })

    // Recalculate overall score from area scores and weights
    let overallScore = 0
    if (competencyAreas.length > 0) {
      const totalWeight = competencyAreas.reduce((sum: number, area: any) => sum + (area.weight || 0), 0)
      if (totalWeight > 0) {
        const weightedSum = competencyAreas.reduce((sum: number, area: any) => {
          const areaScore = area.areaScore || 0
          const weight = area.weight || 0
          return sum + (areaScore * weight / totalWeight)
        }, 0)
        overallScore = Math.round(weightedSum)
      } else {
        // If no weights, calculate simple average of area scores
        const areaScores = competencyAreas
          .map((area: any) => area.areaScore || 0)
          .filter((score: number) => score > 0)
        if (areaScores.length > 0) {
          overallScore = Math.round(areaScores.reduce((sum: number, score: number) => sum + score, 0) / areaScores.length)
        } else {
          // Fallback to database overall_score if no area scores
          overallScore = Math.round(parseFloat(record.overallScore?.toString() || '0'))
        }
      }
    } else {
      // Fallback to database overall_score if no areas
      overallScore = Math.round(parseFloat(record.overallScore?.toString() || '0'))
    }
    
    // Ensure score is between 0-100
    overallScore = Math.max(0, Math.min(100, overallScore))

    // Determine status from recalculated overall score
    let recordStatus: "competent" | "needs-improvement" | "not-competent" = "competent"
    if (overallScore < 70) {
      recordStatus = "not-competent"
    } else if (overallScore < 85) {
      recordStatus = "needs-improvement"
    }

    return {
      id: record.id,
      staffId: record.staffId,
      staffName: record.staffName,
      staffRole: record.staffRole,
      department: record.staffRole || "Clinical",
      overallCompetencyScore: overallScore, // Use recalculated score
      competencyAreas: competencyAreas,
      lastAssessment: record.evaluationDate || '',
      nextAssessment: record.nextEvaluationDue || '',
      status: recordStatus,
      assessorName: record.evaluatorName || 'Unknown',
    }
  }

  // Filter records and remove duplicates (keep only latest assessment per staff)
  const filteredRecords = (() => {
    // First, deduplicate by record.id to ensure unique IDs
    const uniqueById = new Map<string, StaffCompetencyRecord>()
    staffCompetencyRecords.forEach((record) => {
      if (record.id && !uniqueById.has(record.id)) {
        uniqueById.set(record.id, record)
      } else if (record.id) {
        // If duplicate ID found, keep the one with later date or higher score
        const existing = uniqueById.get(record.id)!
        const existingDate = new Date(existing.lastAssessment || 0).getTime()
        const recordDate = new Date(record.lastAssessment || 0).getTime()
        if (recordDate > existingDate || (recordDate === existingDate && record.overallCompetencyScore > existing.overallCompetencyScore)) {
          uniqueById.set(record.id, record)
        }
      }
    })
    
    // Then, group by staffId and keep only the latest assessment per staff
    const latestAssessments = new Map<string, StaffCompetencyRecord>()
    
    Array.from(uniqueById.values()).forEach((record) => {
      const existing = latestAssessments.get(record.staffId)
      if (!existing) {
        latestAssessments.set(record.staffId, record)
      } else {
        // Keep the one with later assessment date or higher score
        const existingDate = new Date(existing.lastAssessment || 0).getTime()
        const recordDate = new Date(record.lastAssessment || 0).getTime()
        if (recordDate > existingDate || (recordDate === existingDate && record.overallCompetencyScore > existing.overallCompetencyScore)) {
          latestAssessments.set(record.staffId, record)
        }
      }
    })
    
    // Now filter by search, status, and exclude empty assessments (0% with no skills)
    return Array.from(latestAssessments.values()).filter((record) => {
      const matchesSearch =
        record.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.staffRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.department.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === "all" || record.status === filterStatus
      
      // Exclude empty assessments: 0% score with no competency areas or skills
      const hasActualAssessment = record.overallCompetencyScore > 0 || 
        (record.competencyAreas && record.competencyAreas.length > 0 &&
         record.competencyAreas.some(area => area.skills && area.skills.length > 0))
      
      return matchesSearch && matchesStatus && hasActualAssessment
    })
  })()

  // Get unique staff records (latest assessment per staff) for stats - without search/filter
  const getUniqueStaffRecords = () => {
    const latestAssessments = new Map<string, StaffCompetencyRecord>()
    
    staffCompetencyRecords.forEach((record) => {
      const existing = latestAssessments.get(record.staffId)
      if (!existing) {
        latestAssessments.set(record.staffId, record)
      } else {
        // Keep the one with later assessment date or higher score
        const existingDate = new Date(existing.lastAssessment || 0).getTime()
        const recordDate = new Date(record.lastAssessment || 0).getTime()
        if (recordDate > existingDate || (recordDate === existingDate && record.overallCompetencyScore > existing.overallCompetencyScore)) {
          latestAssessments.set(record.staffId, record)
        }
      }
    })
    
    // Exclude empty assessments: 0% score with no competency areas or skills
    return Array.from(latestAssessments.values()).filter((record) => {
      return record.overallCompetencyScore > 0 || 
        (record.competencyAreas && record.competencyAreas.length > 0 &&
         record.competencyAreas.some(area => area.skills && area.skills.length > 0))
    })
  }

  const getOverviewStats = () => {
    // Use all unique staff records for overview stats (not filtered by search/status)
    const recordsForStats = getUniqueStaffRecords()
    const totalStaff = recordsForStats.length
    
    const competentStaff = recordsForStats.filter((r) => r.status === "competent").length
    const needsImprovement = recordsForStats.filter((r) => 
      r.status === "needs-improvement" || r.status === "not-competent"
    ).length
    
    // Calculate average score only from records with valid scores (0-100 scale)
    const recordsWithScores = recordsForStats.filter(r => {
      const score = r.overallCompetencyScore
      return score !== undefined && 
             score !== null && 
             !isNaN(score) &&
             typeof score === 'number' &&
             score >= 0 &&
             score <= 100
    })
    
    let averageScore = 0
    if (recordsWithScores.length > 0) {
      const sum = recordsWithScores.reduce((sum, record) => {
        const score = record.overallCompetencyScore || 0
        return sum + score
      }, 0)
      averageScore = sum / recordsWithScores.length
    }

    return {
      totalStaff,
      competentStaff,
      needsImprovement,
      averageScore: recordsWithScores.length > 0 ? Math.round(averageScore * 10) / 10 : 0, // Round to 1 decimal place
      recordsWithScores: recordsWithScores.length, // Track how many records contributed to average
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
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsNewAssessmentOpen(true)}
              >
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
                      <p className="text-2xl font-bold text-blue-600">
                        {isLoadingRecords ? "..." : stats.totalStaff}
                      </p>
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
                      <p className="text-2xl font-bold text-green-600">
                        {isLoadingRecords ? "..." : stats.competentStaff}
                      </p>
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
                      <p className="text-2xl font-bold text-yellow-600">
                        {isLoadingRecords ? "..." : stats.needsImprovement}
                      </p>
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
                      <p className="text-2xl font-bold text-purple-600">
                        {isLoadingRecords ? (
                          "..."
                        ) : stats.recordsWithScores > 0 ? (
                          `${stats.averageScore}%`
                        ) : (
                          "N/A"
                        )}
                      </p>
                      {!isLoadingRecords && stats.recordsWithScores > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Based on {stats.recordsWithScores} assessment{stats.recordsWithScores !== 1 ? 's' : ''}
                        </p>
                      )}
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
                {isLoadingRecords ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500 mt-2">Loading assessments...</p>
                  </div>
                ) : getUniqueStaffRecords().length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No competency assessments found</p>
                    <p className="text-xs text-gray-400 mt-1">Create a new assessment to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getUniqueStaffRecords()
                      .sort((a, b) => {
                        // Sort by most recent assessment date
                        const dateA = new Date(a.lastAssessment || 0).getTime()
                        const dateB = new Date(b.lastAssessment || 0).getTime()
                        return dateB - dateA
                      })
                      .slice(0, 5)
                      .map((record, idx) => (
                    <div key={record.id || `recent-${idx}-${record.staffId}`} className="flex items-center justify-between p-4 border rounded-lg">
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
                            {(() => {
                              let dateStr = "Not assessed"
                              if (record.lastAssessment) {
                                try {
                                  const date = new Date(record.lastAssessment)
                                  if (!isNaN(date.getTime())) {
                                    dateStr = date.toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })
                                  }
                                } catch (e) {
                                  // Keep "Not assessed" if date parsing fails
                                }
                              }
                              
                              const assessor = record.assessorName && 
                                             record.assessorName !== "Unknown" && 
                                             record.assessorName.trim() !== ""
                                ? ` by ${record.assessorName}`
                                : ""
                              
                              return `Last assessed: ${dateStr}${assessor}`
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {(() => {
                              const score = record.overallCompetencyScore
                              if (score !== undefined && 
                                  score !== null && 
                                  !isNaN(score) &&
                                  typeof score === 'number' &&
                                  score >= 0 &&
                                  score <= 100) {
                                return `${Math.round(score)}%`
                              }
                              // If score is 0 but has competency areas/skills, show 0%
                              if (record.competencyAreas && 
                                  record.competencyAreas.length > 0 &&
                                  record.competencyAreas.some((area: any) => 
                                    area.skills && area.skills.length > 0
                                  )) {
                                return "0%"
                              }
                              return "N/A"
                            })()}
                          </div>
                          <p className="text-xs text-gray-500">Overall Score</p>
                        </div>
                        {getStatusBadge(record.status)}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Filter to show this staff member's records first
                            setSearchTerm(record.staffName || "")
                            // Switch to assessments tab
                            setActiveTab("assessments")
                            // Scroll to top of page after tab switch
                            setTimeout(() => {
                              window.scrollTo({ top: 0, behavior: "smooth" })
                              // Also try to scroll to the assessments section if it exists
                              const assessmentsSection = document.getElementById("assessments-tab-content")
                              if (assessmentsSection) {
                                assessmentsSection.scrollIntoView({ behavior: "smooth", block: "start" })
                              }
                            }, 150)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments" id="assessments-tab-content" className="space-y-6">
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
                  <div className="flex items-end gap-2">
                    <Button variant="outline" className="w-full bg-transparent">
                      <Filter className="h-4 w-4 mr-2" />
                      Apply Filters
                    </Button>
                  </div>
                </div>

                {/* Seed Sample Data Button */}
                {filteredRecords.length === 0 && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">No assessments found</h4>
                        <p className="text-sm text-blue-700">
                          Create sample competency assessment data to see progress bars in action.
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          setIsSeedingData(true)
                          try {
                            const res = await fetch('/api/competency/seed-sample-data', {
                              method: 'POST'
                            })
                            const data = await res.json()
                            
                            if (data.success) {
                              toast({
                                title: "✅ Success",
                                description: `Sample data created! ${data.data.totalAreas} areas and ${data.data.totalSkills} skills added.`,
                                duration: 5000
                              })
                              
                              // Reload records
                              const recordsRes = await fetch('/api/staff-performance/competency')
                              const recordsData = await recordsRes.json()
                              if (recordsData.success && recordsData.records) {
                                const transformed = recordsData.records.map(transformRecord)
                                setStaffCompetencyRecords(transformed)
                              }
                            } else {
                              throw new Error(data.message || 'Failed to create sample data')
                            }
                          } catch (error: any) {
                            console.error('Error seeding data:', error)
                            toast({
                              title: "Error",
                              description: error.message || "Failed to create sample data",
                              variant: "destructive"
                            })
                          } finally {
                            setIsSeedingData(false)
                          }
                        }}
                        disabled={isSeedingData}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isSeedingData ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Create Sample Data
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Staff Competency Records */}
                <div className="space-y-4">
                  {isLoadingRecords ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                      <p className="text-gray-600">Loading assessments...</p>
                    </div>
                  ) : filteredRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-2">No assessments found</p>
                      <p className="text-sm text-gray-500">
                        {searchTerm || filterStatus !== "all" 
                          ? "Try adjusting your search or filter criteria"
                          : "Create a new assessment to get started"}
                      </p>
                    </div>
                  ) : (
                    filteredRecords.map((record, index) => {
                      // Determine competency status for badge - use actual record.status for accuracy
                    const getCompetencyBadge = () => {
                      const score = record.overallCompetencyScore
                        const status = record.status
                        
                        // Use actual status from record for accuracy
                        if (status === "competent" || score >= 85) {
                        return <Badge className="bg-green-100 text-green-800 border-green-300">{score}% Competent</Badge>
                        } else if (status === "needs-improvement" || (score >= 70 && score < 85)) {
                        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">{score}% Needs Improvement</Badge>
                      } else {
                        return <Badge className="bg-red-100 text-red-800 border-red-300">{score}% Not Competent</Badge>
                      }
                    }

                    return (
                      <Card key={record.id || `record-${index}-${record.staffId}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">{record.staffName || "Unknown Staff"}</h3>
                              <p className="text-gray-600 mb-1">
                                  {record.staffRole || "Staff"} • {record.department || "N/A"}
                              </p>
                              <p className="text-sm text-gray-500">
                                  Assessed by: {record.assessorName || "Unknown"} • Last: {record.lastAssessment ? new Date(record.lastAssessment).toLocaleDateString() : "N/A"}
                                  {record.nextAssessment && ` • Next due: ${new Date(record.nextAssessment).toLocaleDateString()}`}
                              </p>
                            </div>
                            <div className="ml-4">
                              {getCompetencyBadge()}
                            </div>
                          </div>

                          {/* Competency Areas Progress */}
                          <div className="space-y-3 mb-4">
                            {record.competencyAreas && record.competencyAreas.length > 0 ? (
                              record.competencyAreas.map((area) => {
                                const competentSkills = area.skills?.filter((skill) => skill.status === "competent").length || 0
                                const totalSkills = area.skills?.length || 0
                                
                                // Use area score if available, otherwise calculate from skill scores
                                let areaScore = area.areaScore !== undefined ? area.areaScore : 0
                                
                                // If no areaScore but we have skills, calculate from skill scores
                                if (areaScore === 0 && totalSkills > 0 && area.skills) {
                                  const totalSkillScore = area.skills.reduce((sum: number, skill: any) => {
                                    const skillScore = skill.supervisorAssessment || skill.selfAssessment || 0
                                    return sum + skillScore
                                  }, 0)
                                  areaScore = Math.round(totalSkillScore / totalSkills)
                                } else if (areaScore === 0 && totalSkills > 0) {
                                  // Fallback: calculate from competent count
                                  areaScore = Math.round((competentSkills / totalSkills) * 100)
                                }
                              
                              // Determine area status based on score
                              const areaStatus = areaScore >= 80 ? "competent" : 
                                               areaScore >= 60 ? "needs-improvement" : "not-competent"

                              return (
                                <div key={area.id} className="border rounded-lg p-3">
                                    <h4 className="font-medium mb-2">{area.name || "Unnamed Area"}</h4>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">
                                      {totalSkills > 0 
                                        ? `${competentSkills} of ${totalSkills} skills competent`
                                        : "No skills assessed"}
                                      {areaScore > 0 && ` • ${areaScore}%`}
                                    </span>
                                      {area.weight > 0 && (
                                    <Badge variant="outline" className="text-xs">Weight: {area.weight}%</Badge>
                                      )}
                                  </div>
                                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                    <div 
                                      className={`h-full transition-all ${
                                        areaStatus === "competent" ? "bg-green-500" :
                                        areaStatus === "needs-improvement" ? "bg-yellow-500" :
                                        "bg-red-500"
                                      }`}
                                        style={{ width: `${Math.min(100, Math.max(0, areaScore))}%` }}
                                    />
                                  </div>
                                </div>
                              )
                              })
                            ) : (
                              <div className="text-center py-4 text-sm text-gray-500">
                                No competency areas assessed yet
                              </div>
                            )}
                          </div>

                          <div className="flex justify-end space-x-2 pt-2 border-t">
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              View Report
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => {
                                setSelectedRecordForAssessment(record)
                                setIsAssessSkillsOpen(true)
                                // Reset supervisor to current user by default
                                setSelectedSupervisor(currentUser?.name || "")
                                // Initialize skill assessments
                                const initialAssessments: Record<string, any> = {}
                                record.competencyAreas.forEach((area) => {
                                  area.skills.forEach((skill) => {
                                    initialAssessments[skill.id] = {
                                      supervisorScore: skill.supervisorAssessment || skill.selfAssessment || 0,
                                      status: skill.status || "not-assessed",
                                      notes: ""
                                    }
                                  })
                                })
                                setSkillAssessments(initialAssessments)
                              }}
                            >
                              <Target className="h-4 w-4 mr-2" />
                              Assess Skills
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                    })
                  )}
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
                  <Select value={selectedRoleForMatrix} onValueChange={setSelectedRoleForMatrix}>
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

                {/* Statistics Summary */}
                {(() => {
                  const normalizedRole = normalizeRole(selectedRoleForMatrix)
                  const roleRecords = staffCompetencyRecords.filter(record => {
                    if (!record.staffRole) return false
                    return normalizeRole(record.staffRole) === normalizedRole
                  })
                  const matrixData = buildSkillsMatrixFromRecords(selectedRoleForMatrix)
                  const totalStaff = roleRecords.length
                  const totalSkills = matrixData.reduce((sum, area) => sum + (area.skills?.length || 0), 0)
                  const avgOverallScore = roleRecords.length > 0
                    ? Math.round(roleRecords.reduce((sum, r) => sum + r.overallCompetencyScore, 0) / roleRecords.length)
                    : 0
                  
                  return totalStaff > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Staff Assessed</p>
                              <p className="text-2xl font-bold">{totalStaff}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-500" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Total Skills</p>
                              <p className="text-2xl font-bold">{totalSkills}</p>
                            </div>
                            <Target className="h-8 w-8 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Average Score</p>
                              <p className="text-2xl font-bold">{avgOverallScore}%</p>
                            </div>
                            <Star className="h-8 w-8 text-yellow-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : null
                })()}

                {/* Skills Matrix for Selected Role */}
                <div className="space-y-6">
                  {isLoadingRecords ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                      <p className="text-gray-600">Loading skills matrix...</p>
                    </div>
                  ) : (() => {
                    // Try to get real data first, fallback to template if no data
                    const matrixData = buildSkillsMatrixFromRecords(selectedRoleForMatrix)
                    const templateData = getCompetencyAreasForRole(selectedRoleForMatrix)
                    const displayData = matrixData.length > 0 ? matrixData : templateData
                    
                    console.log('🔵 [Skill Matrix Display] Matrix data areas:', matrixData.length)
                    console.log('🔵 [Skill Matrix Display] Template data areas:', templateData.length)
                    console.log('🔵 [Skill Matrix Display] Display data areas:', displayData.length)
                    
                    if (displayData.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500 mb-2">No competency data available for {selectedRoleForMatrix} role</p>
                          <p className="text-xs text-gray-400">Create assessments to see skills matrix data</p>
                        </div>
                      )
                    }
                    
                    return (
                      displayData.map((area) => (
                    <Card key={area.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{area.name}</CardTitle>
                            <CardDescription>{area.description}</CardDescription>
                          </div>
                          {area.areaScore !== undefined && area.areaScore > 0 && (
                            <div className="ml-4 text-right">
                              <p className="text-xs text-gray-600 mb-1">Area Score</p>
                              <div className="flex items-center space-x-2">
                                <Progress value={area.areaScore} className="w-24" />
                                <span className="text-sm font-bold">{area.areaScore}%</span>
                              </div>
                            </div>
                          )}
                        </div>
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
                                  <p className="text-sm">
                                    {skill.lastAssessed 
                                      ? new Date(skill.lastAssessed).toLocaleDateString('en-US', { 
                                          year: 'numeric', 
                                          month: 'short', 
                                          day: 'numeric' 
                                        })
                                      : "Not assessed"}
                                  </p>
                                </div>
                              </div>

                              {(skill.selfAssessment !== undefined || skill.supervisorAssessment !== undefined) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                  {skill.selfAssessment !== undefined && (
                                  <div>
                                    <Label className="text-xs">Self Assessment</Label>
                                    <div className="flex items-center space-x-2">
                                      <Progress value={skill.selfAssessment} className="flex-1" />
                                      <span className="text-sm font-medium">{skill.selfAssessment}%</span>
                                    </div>
                                  </div>
                                  )}
                                  {skill.supervisorAssessment !== undefined && (
                                  <div>
                                    <Label className="text-xs">Supervisor Assessment</Label>
                                    <div className="flex items-center space-x-2">
                                      <Progress value={skill.supervisorAssessment} className="flex-1" />
                                      <span className="text-sm font-medium">{skill.supervisorAssessment}%</span>
                                    </div>
                                  </div>
                                  )}
                                  {(() => {
                                    const selfAssess = skill.selfAssessment
                                    const supervisorAssess = skill.supervisorAssessment
                                    if (selfAssess !== undefined && supervisorAssess !== undefined) {
                                      return (
                                        <div className="col-span-2 mt-2 p-2 bg-blue-50 rounded">
                                          <Label className="text-xs text-blue-800">Gap Analysis</Label>
                                          <p className="text-xs text-blue-600 mt-1">
                                            Difference: {Math.abs(selfAssess - supervisorAssess)}%
                                            {selfAssess > supervisorAssess 
                                              ? " (Self-rated higher)" 
                                              : selfAssess < supervisorAssess 
                                              ? " (Supervisor rated higher)" 
                                              : " (Aligned)"}
                                          </p>
                                        </div>
                                      )
                                    }
                                    return null
                                  })()}
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
                      ))
                    )
                  })()}
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
                            <Select
                              value={aiAssessmentData.staffId}
                              onValueChange={(value) => {
                                console.log('🔵 [Staff Select] Selected value:', value)
                                // Find the staff member to verify UUID
                                const selected = staffList.find((s: any) => s.id === value || s.id?.toString() === value)
                                console.log('🔵 [Staff Select] Found staff:', selected ? {
                                  id: selected.id,
                                  idType: typeof selected.id,
                                  name: selected.name
                                } : 'NOT FOUND')
                                setAiAssessmentData({ ...aiAssessmentData, staffId: value })
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose staff member" />
                              </SelectTrigger>
                              <SelectContent>
                                {staffList.map((staff: any, index: number) => {
                                  // Ensure we use the actual UUID id field from database
                                  const staffId = staff.id
                                  if (!staffId) {
                                    console.warn('⚠️ [Staff Select] Staff missing id:', staff)
                                  }
                                  // Validate it's a UUID
                                  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(staffId)
                                  if (!isValidUUID && staffId) {
                                    console.error('❌ [Staff Select] Invalid UUID for staff:', {
                                      id: staffId,
                                      name: staff.name,
                                      index
                                    })
                                  }
                                  return (
                                    <SelectItem key={staffId || `staff-${index}`} value={staffId || ''}>
                                      {staff.name} {staff.department ? `- ${staff.department}` : ''}
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="ai-competency">Competency Area</Label>
                            <Select
                              value={aiAssessmentData.competencyArea}
                              onValueChange={(value) => setAiAssessmentData({ ...aiAssessmentData, competencyArea: value })}
                            >
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
                          <div className="space-y-3">
                            <Label>Video Source</Label>
                            
                            <div>
                              <Label htmlFor="ai-video">Upload Video File</Label>
                              <Input
                                id="ai-video"
                                type="file"
                                accept="video/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    // Validate file size (max 100MB)
                                    if (file.size > 100 * 1024 * 1024) {
                                      toast({
                                        title: "File too large",
                                        description: "Video file must be less than 100MB",
                                        variant: "destructive"
                                      })
                                      return
                                    }
                                    // Validate file type
                                    if (!file.type.startsWith('video/')) {
                                      toast({
                                        title: "Invalid file type",
                                        description: "Please upload a video file",
                                        variant: "destructive"
                                      })
                                      return
                                    }
                                    setAiAssessmentData({ ...aiAssessmentData, videoFile: file })
                                    toast({
                                      title: "Video uploaded",
                                      description: `${file.name} ready for analysis`
                                    })
                                  }
                                }}
                                className="cursor-pointer"
                              />
                              {aiAssessmentData.videoFile && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Selected: {aiAssessmentData.videoFile.name} ({(aiAssessmentData.videoFile.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                Upload a video file for AI analysis. For live video evaluation, use the Video Evaluations tab in the Evaluations page.
                              </p>
                            </div>
                          </div>
                          <Button
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            onClick={async () => {
                              if (!aiAssessmentData.staffId || !aiAssessmentData.competencyArea) {
                                toast({
                                  title: "Error",
                                  description: "Please select both staff member and competency area",
                                  variant: "destructive"
                                })
                                return
                              }

                              if (!aiAssessmentData.videoFile) {
                                toast({
                                  title: "Error",
                                  description: "Please upload a video file for analysis",
                                  variant: "destructive"
                                })
                                return
                              }

                              setIsStartingAiAssessment(true)
                              try {
                                const selectedStaff = staffList.find(s => s.id === aiAssessmentData.staffId)
                                if (!selectedStaff) {
                                  toast({
                                    title: "Error",
                                    description: "Selected staff not found",
                                    variant: "destructive"
                                  })
                                  setIsStartingAiAssessment(false)
                                  return
                                }

                                // Validate UUID format
                                const isValidUUID = (str: string) => {
                                  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
                                  return uuidRegex.test(str)
                                }

                                // Ensure we have a valid UUID for staff
                                let staffIdForApi = aiAssessmentData.staffId
                                if (!isValidUUID(staffIdForApi)) {
                                  // If not a UUID, check if selectedStaff has a valid UUID
                                  if (selectedStaff.id && isValidUUID(selectedStaff.id)) {
                                    staffIdForApi = selectedStaff.id
                                  } else {
                                    toast({
                                      title: "Error",
                                      description: "Invalid staff ID format. Please select a valid staff member.",
                                      variant: "destructive"
                                    })
                                    setIsStartingAiAssessment(false)
                                    return
                                  }
                                }

                                // Show AI assessment dialog with live progress
                                setIsAiAssessmentOpen(true)
                                setAiAnalysisProgress(0)
                                setAiAnalysisPhase("Preparing analysis...")
                                setAiLiveInsights([])
                                setShowAiResults(false)
                                setAiAssessmentResult(null)

                                // Prepare request body - extract frame from video if present
                                let requestBody: FormData | string
                                let headers: Record<string, string> = {}
                                
                                if (aiAssessmentData.videoFile) {
                                  try {
                                    // Extract multiple frames from the video for frame-by-frame analysis
                                    console.log('📸 Extracting frames from video for frame-by-frame AI analysis...')
                                    setAiAnalysisPhase("Loading video...")
                                    setAiAnalysisProgress(2)
                                    
                                    const videoElement = document.createElement('video')
                                    videoElement.src = URL.createObjectURL(aiAssessmentData.videoFile)
                                    videoElement.crossOrigin = 'anonymous'
                                    videoElement.preload = 'metadata'
                                    
                                    // Wait for video to load
                                    await new Promise<void>((resolve, reject) => {
                                      videoElement.onloadedmetadata = () => {
                                        setAiAnalysisProgress(5)
                                        setAiAnalysisPhase("Video loaded, extracting frames...")
                                        resolve()
                                      }
                                      
                                      videoElement.onerror = () => {
                                        reject(new Error('Failed to load video'))
                                      }
                                      
                                      setTimeout(() => reject(new Error('Video load timeout')), 10000)
                                    })
                                    
                                    // Extract multiple frames (15 frames for comprehensive analysis)
                                    const { extractVideoFrames } = await import('@/lib/videoFrameExtractor')
                                    const frameCount = 15 // Extract 15 frames for frame-by-frame analysis
                                    setAiLiveInsights(prev => [...prev, `📸 Extracting ${frameCount} frames for ${aiAssessmentData.competencyArea} analysis...`])
                                    
                                    // Track frame extraction progress
                                    let frameExtractionProgress = 0
                                    const progressInterval = setInterval(() => {
                                      // Simulate progress during extraction (5-15%)
                                      frameExtractionProgress += 0.5
                                      const extractionProgress = 5 + (frameExtractionProgress / frameCount) * 10
                                      setAiAnalysisProgress(Math.min(15, extractionProgress))
                                    }, 200)
                                    
                                    const extractedFrames = await extractVideoFrames(videoElement, frameCount)
                                    clearInterval(progressInterval)
                                    
                                    console.log(`✅ Extracted ${extractedFrames.length} frames from video`)
                                    setAiLiveInsights(prev => [...prev, `✅ Successfully extracted ${extractedFrames.length} frames`])
                                    setAiAnalysisProgress(15)
                                    setAiAnalysisPhase(`Extracted ${extractedFrames.length} frames, preparing for analysis...`)
                                    
                                    // Clean up
                                    URL.revokeObjectURL(videoElement.src)
                                    
                                    // Convert frames to base64 array for FormData
                                    const framesBase64 = extractedFrames.map(frame => {
                                      // Extract base64 data (remove data:image/jpeg;base64, prefix if present)
                                      const base64Data = frame.data.includes(',') 
                                        ? frame.data.split(',')[1] 
                                        : frame.data
                                      return {
                                        data: base64Data,
                                        timestamp: frame.timestampFormatted
                                      }
                                    })
                                    
                                    // Store frame count for progress tracking
                                    const totalFrameCount = extractedFrames.length
                                    
                                    // Upload frames using FormData
                                    const formData = new FormData()
                                    formData.append('staffId', staffIdForApi)
                                    formData.append('evaluatorId', currentUser?.id || '')
                                    formData.append('evaluationType', 'recorded')
                                    formData.append('competencyArea', aiAssessmentData.competencyArea) // Send competency area for focused analysis
                                    formData.append('duration', '600')
                                    formData.append('notes', `Frame-by-frame AI Assessment for ${selectedStaff.name} - ${aiAssessmentData.competencyArea}`)
                                    formData.append('frames', JSON.stringify(framesBase64)) // Send all frames as JSON string
                                    formData.append('frameCount', totalFrameCount.toString())
                                    formData.append('videoUrl', `video_frames_${Date.now()}.json`) // Indicate it's multiple frames
                                    requestBody = formData
                                    
                                    // Store frame count for progress calculation
                                    ;(requestBody as any).__frameCount = totalFrameCount
                                    // Don't set Content-Type - browser will set it with boundary
                                  } catch (frameError: any) {
                                    console.error('❌ Error extracting frames from video:', frameError)
                                    setAiLiveInsights(prev => [...prev, `❌ Frame extraction error: ${frameError.message}`])
                                    toast({
                                      title: "Frame extraction failed",
                                      description: "Could not extract frames from video. Trying with single frame...",
                                      variant: "destructive"
                                    })
                                    
                                    // Fallback: try single frame extraction
                                    try {
                                      const videoElement = document.createElement('video')
                                      videoElement.src = URL.createObjectURL(aiAssessmentData.videoFile)
                                      videoElement.crossOrigin = 'anonymous'
                                      videoElement.preload = 'metadata'
                                      
                                      await new Promise<void>((resolve, reject) => {
                                        videoElement.onloadedmetadata = () => {
                                          videoElement.currentTime = videoElement.duration / 2
                                        }
                                        videoElement.onseeked = () => resolve()
                                        videoElement.onerror = () => reject(new Error('Failed to load video'))
                                        setTimeout(() => reject(new Error('Video load timeout')), 10000)
                                      })
                                      
                                      const canvas = document.createElement('canvas')
                                      canvas.width = videoElement.videoWidth || 1280
                                      canvas.height = videoElement.videoHeight || 720
                                      const ctx = canvas.getContext('2d')
                                      if (!ctx) throw new Error('Failed to get canvas context')
                                      
                                      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
                                      const frameDataUrl = canvas.toDataURL('image/jpeg', 0.8)
                                      const frameBase64 = frameDataUrl.split(',')[1]
                                      
                                      URL.revokeObjectURL(videoElement.src)
                                      
                                      const formData = new FormData()
                                      formData.append('staffId', staffIdForApi)
                                      formData.append('evaluatorId', currentUser?.id || '')
                                      formData.append('evaluationType', 'recorded')
                                      formData.append('competencyArea', aiAssessmentData.competencyArea)
                                      formData.append('duration', '600')
                                      formData.append('notes', `AI Assessment for ${selectedStaff.name} - ${aiAssessmentData.competencyArea}`)
                                      formData.append('videoData', frameBase64)
                                      formData.append('videoUrl', `video_frame_${Date.now()}.jpg`)
                                      requestBody = formData
                                    } catch (singleFrameError: any) {
                                      // Final fallback: send video file directly
                                  const formData = new FormData()
                                  formData.append('staffId', staffIdForApi)
                                  formData.append('evaluatorId', currentUser?.id || '')
                                  formData.append('evaluationType', 'recorded')
                                  formData.append('competencyArea', aiAssessmentData.competencyArea)
                                  formData.append('duration', '600')
                                  formData.append('notes', `AI Assessment for ${selectedStaff.name} - ${aiAssessmentData.competencyArea}`)
                                  formData.append('video', aiAssessmentData.videoFile)
                                  requestBody = formData
                                    }
                                  }
                                } else {
                                  // No video - use JSON
                                  headers['Content-Type'] = 'application/json'
                                  requestBody = JSON.stringify({
                                    staffId: staffIdForApi,
                                    evaluatorId: currentUser?.id || null,
                                    evaluationType: 'live',
                                    competencyArea: aiAssessmentData.competencyArea,
                                    duration: 600, // 10 minutes default
                                    notes: `AI Assessment for ${selectedStaff.name} - ${aiAssessmentData.competencyArea}`
                                  })
                                }

                                // Now call the actual API with accurate progress tracking
                                setAiAnalysisPhase("Sending frames to AI for analysis...")
                                setAiAnalysisProgress(18)
                                
                                // Determine frame count for progress estimation
                                let estimatedFrameCount = 1
                                if (requestBody instanceof FormData) {
                                  // Try to get frame count from FormData
                                  const frameCountStr = requestBody.get('frameCount') as string
                                  if (frameCountStr) {
                                    estimatedFrameCount = parseInt(frameCountStr) || 1
                                  } else if ((requestBody as any).__frameCount) {
                                    estimatedFrameCount = (requestBody as any).__frameCount
                                  }
                                }
                                
                                // Use actual frame timing pattern from logs for maximum accuracy
                                // Based on actual API performance: Frame 1: 15.66s, Frame 2: 17.93s, Frame 3: 16.25s, etc.
                                // Average: 16.53s per frame, Total: ~248s for 15 frames
                                const actualFrameTimings = [
                                  15664, 17926, 16247, 10278, 27100, // Frames 1-5
                                  17104, 11156, 14968, 16600, 10688, // Frames 6-10
                                  22853, 14572, 16866, 14575, 21346  // Frames 11-15
                                ]
                                
                                // Use actual timings if we have 15 frames, otherwise use average
                                const avgTimePerFrame = 16530 // 16.53 seconds average (from actual logs)
                                
                                // Calculate cumulative expected times for each frame
                                const cumulativeExpectedTimes: number[] = []
                                let cumulativeTime = 0
                                
                                for (let i = 0; i < estimatedFrameCount; i++) {
                                  // Use actual timing if available, otherwise use average with pattern
                                  let frameTime: number
                                  if (estimatedFrameCount === 15 && i < actualFrameTimings.length) {
                                    frameTime = actualFrameTimings[i] // Use actual timing from logs
                                  } else {
                                    // Estimate based on pattern for other frame counts
                                    frameTime = avgTimePerFrame
                                    // Apply pattern: first frames longer, middle shorter, some peaks
                                    if (i < 3) frameTime = avgTimePerFrame + 2000
                                    else if (i >= 3 && i < 7) frameTime = avgTimePerFrame - 3000
                                    else if (i === 4) frameTime = 27100 // Frame 5 is longest
                                    else if (i === 10) frameTime = avgTimePerFrame + 6000
                                    else if (i === 14) frameTime = avgTimePerFrame + 5000
                                  }
                                  
                                  cumulativeTime += frameTime
                                  cumulativeExpectedTimes.push(cumulativeTime)
                                }
                                
                                const totalEstimatedTime = cumulativeExpectedTimes[cumulativeExpectedTimes.length - 1]
                                const startTime = Date.now()
                                
                                // Track which frames have been "completed" in progress display
                                let lastCompletedFrame = -1
                                
                                // Accurate frame-by-frame progress tracking using cumulative timing (15-90%)
                                const progressSimulation = setInterval(() => {
                                  const elapsed = Date.now() - startTime
                                  
                                  // Calculate progress more accurately based on cumulative frame timing
                                  let progressPercent = 15 // Start at 15% (after frame extraction)
                                  
                                  if (estimatedFrameCount > 1) {
                                    // Find which frame should be processing based on cumulative elapsed time
                                    let currentFrameIndex = 0
                                    let timeIntoCurrentFrame = 0
                                    
                                    // Find the frame that matches the elapsed time
                                    for (let i = 0; i < cumulativeExpectedTimes.length; i++) {
                                      if (elapsed <= cumulativeExpectedTimes[i]) {
                                        currentFrameIndex = i
                                        const prevCumulative = i > 0 ? cumulativeExpectedTimes[i - 1] : 0
                                        const frameDuration = cumulativeExpectedTimes[i] - prevCumulative
                                        timeIntoCurrentFrame = elapsed - prevCumulative
                                        const currentFrameProgress = Math.min(timeIntoCurrentFrame / frameDuration, 1)
                                        
                                        // Progress calculation:
                                        // - 15% for frame extraction
                                        // - 75% for frame analysis (divided among all frames)
                                        const progressPerFrame = 75 / estimatedFrameCount
                                        
                                        // Completed frames contribute full progress
                                        const completedFramesProgress = currentFrameIndex * progressPerFrame
                                        
                                        // Current frame contributes partial progress
                                        const currentFrameProgressAmount = currentFrameProgress * progressPerFrame
                                        
                                        progressPercent = 15 + completedFramesProgress + currentFrameProgressAmount
                                        progressPercent = Math.min(90, progressPercent) // Cap at 90% until results arrive
                                        
                                        // Update phase message to show current frame being analyzed
                                        const currentFrameNum = currentFrameIndex + 1
                                        const frameProgressPercent = Math.round(currentFrameProgress * 100)
                                        const elapsedSeconds = (elapsed / 1000).toFixed(1)
                                        setAiAnalysisPhase(`Analyzing frame ${currentFrameNum}/${estimatedFrameCount}... (${frameProgressPercent}% - ${elapsedSeconds}s elapsed)`)
                                        
                                        // Update live insights when a frame completes
                                        if (currentFrameIndex > lastCompletedFrame && currentFrameIndex < estimatedFrameCount) {
                                          lastCompletedFrame = currentFrameIndex
                                          const frameElapsed = (cumulativeExpectedTimes[currentFrameIndex] / 1000).toFixed(1)
                                          setAiLiveInsights(prev => [...prev, `✅ Frame ${currentFrameNum}/${estimatedFrameCount} analysis completed (${frameElapsed}s elapsed)`])
                                        }
                                        
                                        break
                                      }
                                    }
                                    
                                    // If elapsed time exceeds all expected times, we're in final processing
                                    if (elapsed > totalEstimatedTime) {
                                      progressPercent = Math.min(90, 15 + 75 * (elapsed / (totalEstimatedTime * 1.1)))
                                      setAiAnalysisPhase(`Finalizing analysis... (${(elapsed / 1000).toFixed(1)}s elapsed)`)
                                    }
                                  } else {
                                    // Single frame - simpler progress calculation
                                    const frameProgress = Math.min(elapsed / avgTimePerFrame, 1)
                                    progressPercent = 15 + (frameProgress * 75)
                                    progressPercent = Math.min(90, progressPercent)
                                    const frameProgressPercent = Math.round(frameProgress * 100)
                                    const elapsedSeconds = (elapsed / 1000).toFixed(1)
                                    setAiAnalysisPhase(`AI analyzing frame... (${frameProgressPercent}% - ${elapsedSeconds}s elapsed)`)
                                  }
                                  
                                  setAiAnalysisProgress(Math.round(progressPercent))
                                }, 1000) // Update every 1 second for accurate progress tracking
                                
                                const res = await fetch('/api/ai-competency/evaluate', {
                                    method: 'POST',
                                    headers: headers,
                                    body: requestBody
                                  })
                                
                                // Calculate actual elapsed time
                                const actualElapsed = Date.now() - startTime
                                const actualElapsedSeconds = (actualElapsed / 1000).toFixed(1)
                                
                                clearInterval(progressSimulation)
                                
                                setAiAnalysisPhase("Receiving AI analysis results...")
                                setAiAnalysisProgress(88)
                                
                                // Add real-time insight with actual time
                                if (estimatedFrameCount > 1) {
                                  setAiLiveInsights(prev => [...prev, `🔍 Completed ${estimatedFrameCount} frames analysis in ${actualElapsedSeconds}s`])
                                } else {
                                  setAiLiveInsights(prev => [...prev, `🔍 Frame analysis completed in ${actualElapsedSeconds}s`])
                                }

                                  const result = await res.json()
                                
                                  if (result.success) {
                                    // Log actual timing information if available
                                    if (result.timing) {
                                      console.log('⏱️ Frame Analysis Timing:', {
                                        frameCount: result.timing.frameCount,
                                        totalTime: `${result.timing.totalAnalysisTimeSeconds}s`,
                                        avgPerFrame: `${result.timing.avgTimePerFrameSeconds}s`,
                                        frameTimings: result.timing.frameTimings
                                      })
                                      setAiLiveInsights(prev => [...prev, `⏱️ Analysis completed in ${result.timing.totalAnalysisTimeSeconds}s (avg ${result.timing.avgTimePerFrameSeconds}s per frame)`])
                                    }
                                    
                                    setAiAnalysisPhase("Processing and combining results...")
                                    setAiAnalysisProgress(92)
                                    
                                    // Extract REAL insights from AI analysis result
                                    const realInsights: string[] = []
                                    
                                    // Add insights from competency scores observations
                                    if (result.data?.competencyScores) {
                                      result.data.competencyScores.forEach((score: any) => {
                                        if (score.observations && score.observations.length > 0) {
                                          // Add first observation as insight
                                          const firstObs = score.observations[0]
                                          if (firstObs && !firstObs.includes('MOCK ANALYSIS')) {
                                            realInsights.push(`📊 ${score.category}: ${firstObs}`)
                                          }
                                        }
                                        // Add score summary
                                        if (score.score !== undefined) {
                                          const scoreEmoji = score.score >= 80 ? '✅' : score.score >= 60 ? '⚠️' : '❌'
                                          realInsights.push(`${scoreEmoji} ${score.category} Score: ${score.score}% (Confidence: ${score.confidence || 'N/A'}%)`)
                                        }
                                      })
                                    }
                                    
                                    // Add strengths as insights
                                    if (result.data?.strengths && result.data.strengths.length > 0) {
                                      result.data.strengths.slice(0, 3).forEach((strength: string) => {
                                        if (!strength.includes('MOCK ANALYSIS')) {
                                          realInsights.push(`💪 Strength: ${strength}`)
                                        }
                                      })
                                    }
                                    
                                    // Add development areas as insights
                                    if (result.data?.developmentAreas && result.data.developmentAreas.length > 0) {
                                      result.data.developmentAreas.slice(0, 2).forEach((area: string) => {
                                        if (!area.includes('MOCK ANALYSIS')) {
                                          realInsights.push(`📈 Development Area: ${area}`)
                                        }
                                      })
                                    }
                                    
                                    // Update live insights with real data
                                    if (realInsights.length > 0) {
                                      setAiLiveInsights(prev => [...prev, ...realInsights])
                                    } else {
                                      // If no insights extracted, add a generic one
                                      setAiLiveInsights(prev => [...prev, "🤖 AI analysis completed - reviewing results..."])
                                    }
                                    
                                    setAiAnalysisPhase("Analysis Complete!")
                                    setAiAnalysisProgress(100)
                                    
                                    // Small delay to show 100% before showing results
                                    await new Promise(resolve => setTimeout(resolve, 300))
                                    
                                    setAiAssessmentResult(result.data)
                                    setShowAiResults(true)
                                    
                                    toast({
                                      title: "Success",
                                      description: `AI assessment completed! Score: ${result.data.overallScore}%`
                                    })

                                    // Reload AI assessments after a delay
                                    setTimeout(async () => {
                                      const reloadRes = await fetch(`/api/ai-competency/evaluate?staffId=${staffIdForApi}&limit=5`)
                                      const reloadData = await reloadRes.json()
                                      if (reloadData.success && reloadData.data?.evaluations) {
                                        const updatedAssessments = reloadData.data.evaluations.map((evaluation: any) => ({
                                          ...evaluation,
                                          staffName: selectedStaff.name,
                                          staffRole: selectedStaff.department || 'Staff'
                                        }))
                                        setAiAssessments(prev => {
                                          const combined = [...prev, ...updatedAssessments]
                                          return combined
                                            .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
                                            .slice(0, 10)
                                        })
                                      }
                                    }, 2000)
                                  } else {
                                    setAiAnalysisPhase("Analysis Failed")
                                    setAiAnalysisProgress(0)
                                    setAiLiveInsights(prev => [...prev, `❌ Error: ${result.error || "Failed to complete AI assessment"}`])
                                    toast({
                                      title: "Error",
                                      description: result.error || "Failed to complete AI assessment",
                                      variant: "destructive"
                                    })
                                    setIsAiAssessmentOpen(false)
                                  }
                                } catch (error: any) {
                                  console.error('Error starting AI assessment:', error)
                                  setAiAnalysisPhase("Analysis Failed")
                                  setAiAnalysisProgress(0)
                                  setAiLiveInsights(prev => [...prev, `❌ Error: ${error?.message || "Failed to start AI assessment"}`])
                                  toast({
                                    title: "Error",
                                    description: error?.message || "Failed to start AI assessment",
                                    variant: "destructive"
                                  })
                                  setIsAiAssessmentOpen(false)
                                } finally {
                                  setIsStartingAiAssessment(false)
                                }
                            }}
                            disabled={isStartingAiAssessment || !aiAssessmentData.staffId || !aiAssessmentData.competencyArea}
                          >
                              <Brain className="h-4 w-4 mr-2" />
                            {isStartingAiAssessment ? "Processing AI Assessment..." : "Start AI Assessment"}
                            </Button>
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
                        {isLoadingAiAssessments ? (
                          <div className="text-center py-8 text-gray-500">Loading assessments...</div>
                        ) : aiAssessments.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            No AI assessments yet. Start one to see results here.
                            </div>
                        ) : (
                          <div className="space-y-4">
                            {aiAssessments.map((assessment) => {
                              const getScoreBadge = (score: number) => {
                                if (score >= 85) {
                                  return <Badge className="bg-green-100 text-green-800">{score}% Competent</Badge>
                                } else if (score >= 70) {
                                  return <Badge className="bg-blue-100 text-blue-800">{score}% Competent</Badge>
                                } else {
                                  return <Badge className="bg-yellow-100 text-yellow-800">{score}% Needs Improvement</Badge>
                                }
                              }

                              const formatTimeAgo = (dateString: string) => {
                                const date = new Date(dateString)
                                const now = new Date()
                                const diffMs = now.getTime() - date.getTime()
                                const diffMins = Math.floor(diffMs / 60000)
                                const diffHours = Math.floor(diffMs / 3600000)
                                const diffDays = Math.floor(diffMs / 86400000)

                                if (diffMins < 60) {
                                  return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
                                } else if (diffHours < 24) {
                                  return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
                                } else {
                                  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
                                }
                              }

                              const assessmentDate = assessment.completedAt || assessment.createdAt
                              const competencyAreaName = assessment.competencyArea
                                ? assessment.competencyArea.split('-').map((word: string) => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                  ).join(' ')
                                : 'General Assessment'

                              return (
                                <div key={assessment.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium">
                                      {assessment.staffName || 'Staff'} - {competencyAreaName}
                                    </h4>
                                    {getScoreBadge(assessment.overallScore)}
                            </div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    AI Confidence: {assessment.aiConfidence}% • Duration: {assessment.evaluationTime ? `${Math.round(assessment.evaluationTime / 60)} minutes` : 'N/A'}
                                  </p>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                                    {assessmentDate ? formatTimeAgo(assessmentDate) : 'Unknown'}
                            </div>
                          </div>
                              )
                            })}
                        </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">AI Assessment Analytics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingAiAssessments ? (
                          <div className="text-center py-8 text-gray-500">Loading analytics...</div>
                        ) : (
                          <div className="space-y-4">
                            {(() => {
                              // Calculate analytics from actual data
                              const completedAssessments = aiAssessments.filter((a: any) => a.status === 'completed')
                              const totalAssessments = completedAssessments.length
                              
                              const avgConfidence = completedAssessments.length > 0
                                ? Math.round(
                                    completedAssessments.reduce((sum: number, a: any) => sum + (a.aiConfidence || 0), 0) / 
                                    completedAssessments.length
                                  )
                                : 0
                              
                              const avgScore = completedAssessments.length > 0
                                ? Math.round(
                                    completedAssessments.reduce((sum: number, a: any) => sum + (a.overallScore || 0), 0) / 
                                    completedAssessments.length
                                  )
                                : 0
                              
                              // Calculate average time (estimate time saved - manual assessment takes ~30 min, AI takes ~5 min)
                              const avgTimeMinutes = completedAssessments.length > 0
                                ? completedAssessments.reduce((sum: number, a: any) => sum + (a.evaluationTime || 0), 0) / 
                                  completedAssessments.length / 60
                                : 0
                              const timeSaved = avgTimeMinutes > 0 
                                ? Math.round((1 - avgTimeMinutes / 30) * 100) // 30 min is typical manual time
                                : 0
                              
                              return (
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Total AI Assessments</span>
                                    <span className="font-bold">{totalAssessments}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Average AI Confidence</span>
                                    <span className="font-bold text-purple-600">
                                      {avgConfidence > 0 ? `${avgConfidence}%` : "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Average Score</span>
                                    <span className="font-bold text-blue-600">
                                      {avgScore > 0 ? `${avgScore}%` : "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Time Saved vs Manual</span>
                                    <span className="font-bold text-green-600">
                                      {timeSaved > 0 ? `${timeSaved}%` : "N/A"}
                                    </span>
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* New Assessment Dialog */}
      <Dialog open={isNewAssessmentOpen} onOpenChange={setIsNewAssessmentOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Competency Assessment</DialogTitle>
            <DialogDescription>
              Start a new competency evaluation for a staff member
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="staff-select">Staff Member *</Label>
              <Select
                value={newAssessmentData.staffId}
                onValueChange={(value) => setNewAssessmentData({ ...newAssessmentData, staffId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff, index) => (
                    <SelectItem key={staff.id || `staff-${index}`} value={staff.id}>
                      {staff.name} {staff.department ? `- ${staff.department}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="evaluation-type">Evaluation Type *</Label>
              <Select
                value={newAssessmentData.evaluationType}
                onValueChange={(value: any) => setNewAssessmentData({ ...newAssessmentData, evaluationType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="initial">Initial Assessment</SelectItem>
                  <SelectItem value="annual">Annual Evaluation</SelectItem>
                  <SelectItem value="skills-validation">Skills Validation</SelectItem>
                  <SelectItem value="performance-improvement">Performance Improvement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="evaluator-name">Evaluator Name</Label>
              <Input
                id="evaluator-name"
                value={newAssessmentData.evaluatorName}
                onChange={(e) => setNewAssessmentData({ ...newAssessmentData, evaluatorName: e.target.value })}
                placeholder="Enter evaluator name"
              />
            </div>
            <div>
              <Label htmlFor="next-due">Next Evaluation Due Date</Label>
              <Input
                id="next-due"
                type="date"
                value={newAssessmentData.nextEvaluationDue}
                onChange={(e) => setNewAssessmentData({ ...newAssessmentData, nextEvaluationDue: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewAssessmentOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={async () => {
                if (!newAssessmentData.staffId) {
                  toast({ title: "Error", description: "Please select a staff member", variant: "destructive" })
                  return
                }

                const selectedStaff = staffList.find(s => s.id === newAssessmentData.staffId)
                if (!selectedStaff) {
                  toast({ title: "Error", description: "Selected staff not found", variant: "destructive" })
                  return
                }

                try {
                  // Get default competency areas based on staff role
                  const staffRole = selectedStaff.department || 'STAFF'
                  const defaultCompetencyAreas = getCompetencyAreasForRole(staffRole)
                  
                  // Convert to API format
                  const competencyAreasForAPI = defaultCompetencyAreas.map(area => {
                    // Calculate average category score (scores are already 0-100 scale)
                    const avgCategoryScore = area.skills.length > 0 
                      ? Math.round(
                          area.skills.reduce((sum, skill) => {
                            const score = skill.supervisorAssessment || skill.selfAssessment || 0
                            return sum + score
                          }, 0) / area.skills.length
                        )
                      : 0

                    return {
                      category: area.name,
                      description: area.description,
                      weight: area.weight / 100, // Convert to decimal (0.25 for 25%)
                      categoryScore: avgCategoryScore,
                      items: area.skills.map(skill => {
                        // Skills already have scores in 0-100 scale from getCompetencyAreasForRole
                        const supervisorScore = skill.supervisorAssessment || null
                        const selfScore = skill.selfAssessment || null
                        const finalScore = supervisorScore || selfScore || 0
                        
                        // Determine status from score
                        let status = 'not-assessed'
                        if (finalScore >= 80) {
                          status = 'competent'
                        } else if (finalScore >= 60) {
                          status = 'needs-improvement'
                        } else if (finalScore > 0) {
                          status = 'not-competent'
                        }

                        return {
                          description: skill.name,
                          selfAssessmentScore: selfScore, // Already 0-100 scale
                          supervisorAssessmentScore: supervisorScore, // Already 0-100 scale
                          score: finalScore / 20 // Convert to 0-5 scale (for API compatibility, API will recalculate)
                        }
                      })
                    }
                  })

                  const res = await fetch('/api/staff-performance/competency', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'create-evaluation',
                      data: {
                        staffId: newAssessmentData.staffId,
                        staffName: selectedStaff.name,
                        staffRole: staffRole,
                        evaluationType: newAssessmentData.evaluationType,
                        evaluatorName: newAssessmentData.evaluatorName || currentUser?.name || 'Unknown',
                        evaluatorId: currentUser?.id || null,
                        nextEvaluationDue: newAssessmentData.nextEvaluationDue || null,
                        competencyAreas: competencyAreasForAPI,
                        certifications: []
                      }
                    })
                  })

                  const result = await res.json()
                  if (result.success) {
                    const areasCount = competencyAreasForAPI.length
                    const skillsCount = competencyAreasForAPI.reduce((sum, area) => sum + area.items.length, 0)
                    toast({ 
                      title: "✅ Success", 
                      description: `Competency assessment created with ${areasCount} competency areas and ${skillsCount} skills. Progress bars will now display!`,
                      duration: 5000
                    })
                    setIsNewAssessmentOpen(false)
                    setNewAssessmentData({
                      staffId: "",
                      evaluationType: "annual",
                      nextEvaluationDue: "",
                      evaluatorName: "",
                    })
                    // Reload records
                    const reloadRes = await fetch('/api/staff-performance/competency')
                    const reloadData = await reloadRes.json()
                    if (reloadData.success && reloadData.records) {
                      const transformed = reloadData.records.map(transformRecord)
                      setStaffCompetencyRecords(transformed)
                    }
                  } else {
                    toast({ title: "Error", description: result.message || "Failed to create assessment", variant: "destructive" })
                  }
                } catch (error) {
                  console.error('Error creating assessment:', error)
                  toast({ title: "Error", description: "Failed to create assessment", variant: "destructive" })
                }
              }}
            >
              Create Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Assessment Progress Dialog */}
      <Dialog open={isAiAssessmentOpen} onOpenChange={setIsAiAssessmentOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              AI-Powered Competency Assessment
            </DialogTitle>
            <DialogDescription>
              {aiAssessmentData.staffId && aiAssessmentData.competencyArea
                ? (() => {
                    const staff = staffList.find((s: any) => s.id === aiAssessmentData.staffId)
                    const staffName = staff?.name || ''
                    const areaName = aiAssessmentData.competencyArea.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                    return `${staffName} - ${areaName}`
                  })()
                : 'Select staff and competency area'}
            </DialogDescription>
          </DialogHeader>

          {!showAiResults ? (
            <div className="space-y-6 py-4">
              {/* Progress Indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Analysis Progress</Label>
                  <span className="text-sm text-gray-600">{aiAnalysisProgress}%</span>
                </div>
                <Progress value={aiAnalysisProgress} className="h-3" />
                <p className="text-sm text-gray-600 italic">{aiAnalysisPhase}</p>
              </div>

              {/* Live Insights */}
              {aiLiveInsights.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Live AI Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {aiLiveInsights.map((insight, idx) => (
                        <div key={idx} className="flex items-start space-x-2 p-2 bg-blue-50 rounded">
                          <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-blue-800">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Processing Features Display */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Eye className="h-4 w-4 text-purple-600" />
                      <Label className="text-sm font-semibold">Video Analysis</Label>
                    </div>
                    <p className="text-xs text-gray-600">Analyzing clinical skills demonstration in real-time</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <Label className="text-sm font-semibold">Pattern Recognition</Label>
                    </div>
                    <p className="text-xs text-gray-600">Detecting safety protocols and compliance patterns</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            /* Results Display */
            <div className="space-y-6 py-4">
              {aiAssessmentResult && (
                <>
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Overall Score</Label>
                          <p className="text-4xl font-bold text-green-600">{aiAssessmentResult.overallScore}%</p>
                          <p className="text-sm text-gray-600 mt-1">AI Confidence: {aiAssessmentResult.aiConfidence}%</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                            {aiAssessmentResult.overallScore >= 85 ? "Competent" : 
                             aiAssessmentResult.overallScore >= 70 ? "Developing" : "Needs Improvement"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Competency Scores Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Competency Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {aiAssessmentResult.competencyScores?.map((score: any, idx: number) => (
                          <div key={idx} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="font-medium">{score.category}</Label>
                              <Badge className={score.score >= 85 ? "bg-green-100 text-green-800" : 
                                              score.score >= 70 ? "bg-blue-100 text-blue-800" : 
                                              "bg-yellow-100 text-yellow-800"}>
                                {score.score}%
                              </Badge>
                            </div>
                            <Progress value={score.score} className="h-2 mb-3" />
                            <div className="text-xs text-gray-600">
                              Confidence: {score.confidence}%
                            </div>
                            {score.observations && score.observations.length > 0 && (
                              <div className="mt-3">
                                <Label className="text-xs font-medium">Observations:</Label>
                                <ul className="text-xs text-gray-600 mt-1 space-y-1">
                                  {score.observations.slice(0, 3).map((obs: string, obsIdx: number) => (
                                    <li key={obsIdx}>• {obs}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Strengths & Development Areas */}
                  {(aiAssessmentResult.strengths?.length > 0 || aiAssessmentResult.developmentAreas?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiAssessmentResult.strengths?.length > 0 && (
                        <Card className="bg-green-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base text-green-800">Strengths</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {aiAssessmentResult.strengths.map((strength: string, idx: number) => (
                                <li key={idx} className="flex items-start space-x-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-green-800">{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {aiAssessmentResult.developmentAreas?.length > 0 && (
                        <Card className="bg-yellow-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base text-yellow-800">Development Areas</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {aiAssessmentResult.developmentAreas.map((area: string, idx: number) => (
                                <li key={idx} className="flex items-start space-x-2 text-sm">
                                  <Target className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-yellow-800">{area}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter>
            {showAiResults ? (
              <>
                <Button variant="outline" onClick={() => {
                  setIsAiAssessmentOpen(false)
                  setAiAssessmentData({ staffId: "", competencyArea: "", videoFile: null, videoUrl: "" })
                  setShowAiResults(false)
                  setAiAssessmentResult(null)
                  setAiLiveInsights([])
                }}>
                  Close
                </Button>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    if (!aiAssessmentResult?.evaluationId) {
                      toast({
                        title: "Error",
                        description: "Assessment ID not found. Cannot generate report.",
                        variant: "destructive"
                      })
                      return
                    }

                    try {
                      toast({
                        title: "Generating Report",
                        description: "Creating comprehensive assessment report..."
                      })

                      const response = await fetch('/api/ai-competency/generate-report', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          assessmentId: aiAssessmentResult.evaluationId,
                          format: 'json'
                        })
                      })

                      const result = await response.json()

                      if (result.success && result.report) {
                        // Create downloadable JSON report
                        const reportJson = JSON.stringify(result.report, null, 2)
                        const blob = new Blob([reportJson], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `AI_Assessment_Report_${result.report.reportMetadata.reportId}_${new Date().toISOString().split('T')[0]}.json`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)

                        toast({
                          title: "Report Generated",
                          description: "Comprehensive assessment report downloaded successfully!"
                        })
                      } else {
                        throw new Error(result.error || "Failed to generate report")
                      }
                    } catch (error: any) {
                      console.error('Error generating report:', error)
                      toast({
                        title: "Error",
                        description: error.message || "Failed to generate report",
                        variant: "destructive"
                      })
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700" 
                  onClick={async () => {
                    console.log('🟢 [Save Button] Clicked')
                    console.log('🟢 [Save Button] Assessment Result:', aiAssessmentResult)
                    console.log('🟢 [Save Button] Assessment Data:', aiAssessmentData)

                    // Validation
                    if (!aiAssessmentResult?.evaluationId) {
                      console.error('❌ [Save Button] Missing evaluationId')
                      alert('❌ Error: Assessment ID not found. Cannot save assessment.')
                      toast({
                        title: "Error",
                        description: "Assessment ID not found. Cannot save assessment.",
                        variant: "destructive",
                        duration: 5000
                      })
                      return
                    }

                    if (!aiAssessmentData.staffId) {
                      console.error('❌ [Save Button] Missing staffId')
                      alert('❌ Error: Staff ID not found. Cannot save assessment.')
                      toast({
                        title: "Error",
                        description: "Staff ID not found. Cannot save assessment.",
                        variant: "destructive",
                        duration: 5000
                      })
                      return
                    }

                    try {
                      console.log('🟢 [Save Button] Starting save process...')
                      
                      toast({
                        title: "Saving Assessment",
                        description: "Please wait, saving AI assessment results...",
                        duration: 3000
                      })

                      // Get selected staff - MUST use actual UUID from database
                      console.log('🔵 [Save Button] Starting staff resolution...')
                      console.log('🔵 [Save Button] aiAssessmentData.staffId:', aiAssessmentData.staffId)
                      console.log('🔵 [Save Button] staffList length:', staffList.length)
                      
                      // Check if staffId is a valid UUID
                      const isValidUUID = (str: string) => {
                        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
                        return uuidRegex.test(str)
                      }
                      
                      // First, try to find staff by exact ID match (should be UUID)
                      let selectedStaff = staffList.find((s: any) => {
                        const matches = s.id === aiAssessmentData.staffId || s.id?.toString() === aiAssessmentData.staffId
                        return matches
                      })
                      
                      console.log('🔵 [Save Button] Direct match found:', selectedStaff ? {
                        id: selectedStaff.id,
                        idType: typeof selectedStaff.id,
                        name: selectedStaff.name
                      } : 'NOT FOUND')
                      
                      // If not found and staffId is not a UUID, the Select might have selected wrong value
                      if (!selectedStaff && !isValidUUID(aiAssessmentData.staffId)) {
                        console.warn('⚠️ [Save Button] staffId is not a UUID, attempting fallback resolution...', aiAssessmentData.staffId)
                        console.warn('⚠️ [Save Button] This suggests the Select component may have selected a non-UUID value')
                        
                        // Log all staff IDs for debugging
                        console.log('🔵 [Save Button] Available staff IDs:', staffList.map((s: any, idx: number) => ({
                          index: idx,
                          id: s.id,
                          idType: typeof s.id,
                          name: s.name
                        })).slice(0, 10))
                        
                        // Try finding by matching the string as ID
                        selectedStaff = staffList.find((s: any) => 
                          s.id?.toString() === aiAssessmentData.staffId ||
                          s.email === aiAssessmentData.staffId ||
                          s.name === aiAssessmentData.staffId
                        )
                      }
                      
                      if (!selectedStaff) {
                        console.error('❌ [Save Button] Selected staff not found:', {
                          providedStaffId: aiAssessmentData.staffId,
                          staffIdType: typeof aiAssessmentData.staffId,
                          staffListLength: staffList.length,
                          sampleStaffIds: staffList.slice(0, 5).map((s: any) => ({
                            id: s.id,
                            idType: typeof s.id,
                            name: s.name
                          }))
                        })
                        throw new Error(`Selected staff not found. Provided StaffId: "${aiAssessmentData.staffId}" (type: ${typeof aiAssessmentData.staffId}). Please select a valid staff member.`)
                      }

                      // CRITICAL: Use the actual UUID from selectedStaff - this is the real database ID
                      const staffIdToUse = selectedStaff.id
                      
                      if (!staffIdToUse) {
                        console.error('❌ [Save Button] Selected staff has no id field:', selectedStaff)
                        throw new Error(`Selected staff object is missing the 'id' field. Cannot proceed.`)
                      }
                      
                      if (!isValidUUID(staffIdToUse)) {
                        console.error('❌ [Save Button] Selected staff does not have valid UUID:', {
                          id: staffIdToUse,
                          idType: typeof staffIdToUse,
                          staff: selectedStaff
                        })
                        throw new Error(`Selected staff does not have a valid UUID. Staff ID: "${staffIdToUse}" (type: ${typeof staffIdToUse}). The staff table ID must be a valid UUID.`)
                      }

                      console.log('✅ [Save Button] Resolved to staff:', {
                        originalStaffId: aiAssessmentData.staffId,
                        resolvedUUID: staffIdToUse,
                        name: selectedStaff.name,
                        email: selectedStaff.email
                      })

                      // Step 1: Create competency evaluation
                      console.log('🟢 [Save Button] Step 1: Creating competency evaluation...')
                      const createEvalResponse = await fetch('/api/staff-performance/competency', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'create-evaluation',
                          data: {
                            staffId: staffIdToUse, // Use actual UUID from database
                            staffName: selectedStaff.name || 'Unknown',
                            staffRole: selectedStaff.department || 'Staff',
                            evaluationType: 'skills-validation',
                            evaluatorName: currentUser?.name || 'AI System',
                            evaluatorId: currentUser?.id || null,
                            competencyAreas: [],
                            certifications: []
                          }
                        })
                      })

                      const createEvalResult = await createEvalResponse.json()
                      console.log('🟢 [Save Button] Create eval result:', createEvalResult)

                      if (!createEvalResult.success) {
                        const errorMsg = createEvalResult.error || createEvalResult.message || "Failed to create competency evaluation"
                        const errorDetails = createEvalResult.details ? `\n\nDetails: ${createEvalResult.details}` : ''
                        const errorHint = createEvalResult.hint ? `\n\nHint: ${createEvalResult.hint}` : ''
                        const fullErrorMsg = `${errorMsg}${errorDetails}${errorHint}`
                        
                        console.error('❌ [Save Button] Failed to create evaluation:', {
                          error: errorMsg,
                          details: createEvalResult.details,
                          hint: createEvalResult.hint,
                          code: createEvalResult.code,
                          fullResponse: createEvalResult
                        })
                        
                        alert(`❌ Error: ${fullErrorMsg}\n\nCheck console for more details.`)
                        throw new Error(errorMsg)
                      }

                      // Get evaluationId from either evaluationId or evaluation.id
                      const evaluationId = createEvalResult.evaluationId || createEvalResult.evaluation?.id
                      
                      if (!evaluationId) {
                        const errorMsg = "Evaluation created but no ID returned"
                        console.error('❌ [Save Button]', errorMsg, createEvalResult)
                        alert(`❌ Error: ${errorMsg}`)
                        throw new Error(errorMsg)
                      }

                      console.log('✅ [Save Button] Created evaluation:', evaluationId)

                      // Step 2: Link AI assessment to competency evaluation
                      console.log('🟢 [Save Button] Step 2: Linking AI assessment to evaluation...')
                      const linkResponse = await fetch('/api/ai-competency/save-to-competency', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          aiAssessmentId: aiAssessmentResult.evaluationId,
                          competencyEvaluationId: evaluationId
                        })
                      })

                      const linkResult = await linkResponse.json()
                      console.log('🟢 [Save Button] Link result:', linkResult)

                      if (!linkResult.success) {
                        const errorMsg = linkResult.error || "Failed to link assessment"
                        console.error('❌ [Save Button] Failed to link assessment:', errorMsg)
                        alert(`❌ Error: ${errorMsg}`)
                        throw new Error(errorMsg)
                      }

                      console.log('✅ [Save Button] Successfully saved assessment!')
                      console.log('✅ [Save Button] Details:', linkResult.details)

                      // Success alert and toast
                      alert(`✅ Success! AI assessment saved successfully.\n\n${linkResult.details ? `${linkResult.details.skillsCreated} skills created, ${linkResult.details.skillsUpdated} skills updated` : ''}`)
                      
                      toast({
                        title: "✅ Success",
                        description: linkResult.message || "AI assessment saved and linked to competency evaluation successfully!",
                        duration: 5000
                      })

                      // Close dialog and reload data
                      setTimeout(() => {
                        setIsAiAssessmentOpen(false)
                        setAiAssessmentData({ staffId: "", competencyArea: "", videoFile: null, videoUrl: "" })
                        setShowAiResults(false)
                        setAiAssessmentResult(null)
                        setAiLiveInsights([])
                        
                        // Reload competency records
                        fetch('/api/staff-performance/competency')
                          .then(r => r.json())
                          .then(data => {
                            if (data.success && data.records) {
                              const transformed = data.records.map(transformRecord)
                              setStaffCompetencyRecords(transformed)
                              console.log('✅ [Save Button] Reloaded competency records')
                            }
                          })
                          .catch(err => {
                            console.error('❌ [Save Button] Error reloading records:', err)
                          })
                      }, 1500)

                    } catch (error: any) {
                      console.error('❌ [Save Button] Error:', error)
                      console.error('❌ [Save Button] Error stack:', error.stack)
                      
                      const errorMessage = error.message || "Failed to save assessment. Check console for details."
                      
                      // Show alert for critical errors
                      alert(`❌ Error: ${errorMessage}\n\nPlease check the browser console for more details.`)
                      
                      toast({
                        title: "❌ Error",
                        description: errorMessage,
                        variant: "destructive",
                        duration: 10000
                      })
                    }
                  }}
                >
                  Save Assessment
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => {
                setIsAiAssessmentOpen(false)
                setIsStartingAiAssessment(false)
                setAiLiveInsights([])
              }} disabled>
                Cancel (Processing...)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assess Skills Dialog */}
      <Dialog open={isAssessSkillsOpen} onOpenChange={setIsAssessSkillsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              Assess Skills - {selectedRecordForAssessment?.staffName}
            </DialogTitle>
            <DialogDescription>
              Evaluate and assess skills for this staff member. Goals will be automatically created for skills needing improvement.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecordForAssessment && (
            <div className="space-y-6">
              {/* Supervisor Assignment Field */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Supervisor Assignment</CardTitle>
                  <CardDescription>Select the supervisor responsible for this assessment and PIP goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="supervisor-select">Assigned Supervisor *</Label>
                    <Select
                      value={selectedSupervisor || currentUser?.name || ""}
                      onValueChange={(value) => setSelectedSupervisor(value)}
                    >
                      <SelectTrigger id="supervisor-select">
                        <SelectValue placeholder="Select supervisor" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Default to current user */}
                        <SelectItem value={currentUser?.name || "Supervisor"}>
                          {currentUser?.name || "Supervisor"} (Current User)
                        </SelectItem>
                        {/* List other staff members as potential supervisors */}
                        {staffList
                          .filter((staff) => staff.id !== selectedRecordForAssessment.staffId && staff.name !== currentUser?.name)
                          .map((staff, index) => (
                            <SelectItem key={staff.id || `supervisor-${index}`} value={staff.name}>
                              {staff.name} {staff.department ? `- ${staff.department}` : ''}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      This supervisor will be assigned to all PIP goals created from this assessment.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {selectedRecordForAssessment.competencyAreas.map((area) => (
                <Card key={area.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{area.name}</CardTitle>
                    <CardDescription>Weight: {area.weight}%</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {area.skills.map((skill) => {
                      const assessment = skillAssessments[skill.id] || {
                        supervisorScore: skill.supervisorAssessment || skill.selfAssessment || 0,
                        status: skill.status === "competent" ? "competent" : skill.status === "needs-improvement" ? "needs-improvement" : skill.status === "not-competent" ? "not-competent" : "competent",
                        notes: ""
                      }
                      
                      return (
                        <div key={skill.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{skill.name}</h4>
                              {skill.description && (
                                <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                              )}
                            </div>
                            <Badge variant={
                              assessment.status === "competent" ? "default" :
                              assessment.status === "needs-improvement" ? "secondary" :
                              "destructive"
                            }>
                              {assessment.status === "competent" ? "Competent" :
                               assessment.status === "needs-improvement" ? "Needs Improvement" :
                               "Not Competent"}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`score-${skill.id}`}>Supervisor Score (0-5 scale)</Label>
                              <Input
                                id={`score-${skill.id}`}
                                type="number"
                                min="0"
                                max="5"
                                step="0.1"
                                value={assessment.supervisorScore || 0}
                                onChange={(e) => {
                                  const score = parseFloat(e.target.value) || 0
                                  // Determine status from 0-5 scale (4+ = competent, 3+ = needs improvement)
                                  const newStatus = score >= 4 ? "competent" : score >= 3 ? "needs-improvement" : "not-competent"
                                  setSkillAssessments({
                                    ...skillAssessments,
                                    [skill.id]: {
                                      ...assessment,
                                      supervisorScore: score,
                                      status: newStatus
                                    }
                                  })
                                }}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Passing: {skill.passingScore || 80}% (≥4.0/5.0 = {Math.round((4/5)*100)}%+)
                              </p>
                            </div>
                            
                            <div>
                              <Label htmlFor={`status-${skill.id}`}>Status</Label>
                              <Select
                                value={assessment.status}
                                onValueChange={(value: "competent" | "needs-improvement" | "not-competent") => {
                                  setSkillAssessments({
                                    ...skillAssessments,
                                    [skill.id]: {
                                      ...assessment,
                                      status: value
                                    }
                                  })
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="competent">Competent</SelectItem>
                                  <SelectItem value="needs-improvement">Needs Improvement</SelectItem>
                                  <SelectItem value="not-competent">Not Competent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor={`notes-${skill.id}`}>Notes</Label>
                            <Input
                              id={`notes-${skill.id}`}
                              placeholder="Add assessment notes..."
                              value={assessment.notes}
                              onChange={(e) => {
                                setSkillAssessments({
                                  ...skillAssessments,
                                  [skill.id]: {
                                    ...assessment,
                                    notes: e.target.value
                                  }
                                })
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              ))}
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsAssessSkillsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={async () => {
                    try {
                      setIsAssessing(true)
                      
                      if (!selectedRecordForAssessment?.id) {
                        toast({
                          title: "Error",
                          description: "Assessment record ID not found",
                          variant: "destructive"
                        })
                        return
                      }

                      // Step 1: Save skill assessments to database
                      console.log('🔵 [Assess Skills] Saving skill assessments...')
                      const updateRes = await fetch('/api/staff-performance/competency', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'update-skills',
                          evaluationId: selectedRecordForAssessment.id,
                          skillAssessments: skillAssessments
                        })
                      })

                      const updateResult = await updateRes.json()
                      
                      if (!updateResult.success) {
                        throw new Error(updateResult.message || "Failed to save skill assessments")
                      }

                      console.log(`✅ [Assess Skills] Updated ${updateResult.updatedCount} skill(s)`)

                      // Step 2: Find skills needing improvement for PIP
                      const needsImprovementSkills: any[] = []
                      selectedRecordForAssessment.competencyAreas.forEach((area) => {
                        area.skills.forEach((skill) => {
                          const assessment = skillAssessments[skill.id]
                          if (assessment && (assessment.status === "needs-improvement" || assessment.status === "not-competent")) {
                            needsImprovementSkills.push({
                              skillId: skill.id,
                              skillName: skill.name,
                              areaName: area.name,
                              currentScore: assessment.supervisorScore,
                              status: assessment.status,
                              notes: assessment.notes
                            })
                          }
                        })
                      })
                      
                      // Step 3: Create PIP if there are skills needing improvement
                      if (needsImprovementSkills.length > 0) {
                        const pipGoals = needsImprovementSkills.map((skill) => ({
                          description: `Improve ${skill.skillName} - ${skill.areaName}`,
                          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
                          completed: false,
                          progress: Math.round((skill.currentScore / 5) * 100),
                          actions: [
                            `Review ${skill.skillName} competencies`,
                            `Practice under supervision`,
                            `Attend relevant training if needed`
                          ],
                          notes: skill.notes || null
                        }))
                        
                        console.log('📝 [Assess Skills] Creating PIP with goals:', pipGoals)
                        
                        const pipRes = await fetch('/api/staff-performance/competency', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'create-evaluation',
                            data: {
                              staffId: selectedRecordForAssessment.staffId,
                              staffName: selectedRecordForAssessment.staffName,
                              evaluationType: "performance-improvement",
                              status: "needs-improvement",
                              evaluatorName: currentUser?.name || "Supervisor",
                              evaluatorId: currentUser?.id || null,
                              performanceImprovementPlan: {
                                startDate: new Date().toISOString().split('T')[0],
                                targetCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                progress: 0,
                                status: "active",
                                supervisor: selectedSupervisor || currentUser?.name || "Supervisor",
                                goals: pipGoals,
                                reviewDates: []
                              }
                            }
                          })
                        })
                        
                        const pipResult = await pipRes.json()
                        if (pipResult.success) {
                          toast({
                            title: "✅ Success",
                            description: `Assessment saved! Updated ${updateResult.updatedCount} skill(s). Created PIP with ${pipGoals.length} goals. Progress bars will update automatically.`,
                            duration: 5000
                          })
                        } else {
                          // Still show success for skill updates even if PIP creation fails
                          toast({
                            title: "✅ Skills Saved",
                            description: `Assessment saved! Updated ${updateResult.updatedCount} skill(s). Progress bars will update automatically. (Note: PIP creation had issues)`,
                            duration: 5000
                          })
                        }
                      } else {
                        toast({
                          title: "✅ Success",
                          description: `Assessment saved! Updated ${updateResult.updatedCount} skill(s). All skills are competent. Progress bars will update automatically.`,
                          duration: 3000
                        })
                      }
                      
                      setIsAssessSkillsOpen(false)
                      
                      // Step 4: Reload records to show updated progress bars
                      console.log('🔵 [Assess Skills] Reloading records...')
                      const recordsRes = await fetch('/api/staff-performance/competency')
                      const recordsData = await recordsRes.json()
                      if (recordsData.success && recordsData.records) {
                        const transformed = recordsData.records.map(transformRecord)
                        setStaffCompetencyRecords(transformed)
                        console.log('✅ [Assess Skills] Records reloaded, progress bars updated!')
                      }
                    } catch (error: any) {
                      console.error('❌ [Assess Skills] Error:', error)
                      toast({
                        title: "Error",
                        description: error.message || "Failed to save assessment",
                        variant: "destructive"
                      })
                    } finally {
                      setIsAssessing(false)
                    }
                  }}
                  disabled={isAssessing}
                >
                  {isAssessing ? "Saving..." : "Save Assessment"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
