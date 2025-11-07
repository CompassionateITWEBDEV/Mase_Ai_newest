"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Eye,
  Download,
  Square,
  Loader2,
  Lightbulb,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

interface EvaluationRecord {
  id: string
  staffName: string
  staffRole: string
  evaluationType: "competency" | "performance"
  assessmentType: "initial" | "annual" | "skills-validation" | "performance-improvement" | "mid-year" | "probationary"
  status: "excellent" | "good" | "satisfactory" | "needs-improvement" | "unsatisfactory" | "in-progress" | "submitted" | "approved"
  overallScore?: number
  evaluatorName: string
  completedDate: string
  nextDue?: string
  priority: "high" | "medium" | "low"
}

interface StaffMember {
  id: string
  name: string
  role?: string
  department?: string
  hireDate?: string
  avatar?: string
}

export default function EvaluationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser] = useState(getCurrentUser())
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedStaffMember, setSelectedStaffMember] = useState("")
  const [selectedEvaluationType, setSelectedEvaluationType] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  
  // Real data state
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [evaluationHistory, setEvaluationHistory] = useState<EvaluationRecord[]>([])
  const [isLoadingStaff, setIsLoadingStaff] = useState(true)
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(true)
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationRecord | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isNewEvaluationOpen, setIsNewEvaluationOpen] = useState(false)
  const [isStandardEvaluationOpen, setIsStandardEvaluationOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [showReportPreview, setShowReportPreview] = useState(false)

  // Video evaluation state
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false)
  const [liveVideoStream, setLiveVideoStream] = useState<MediaStream | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisPhase, setAnalysisPhase] = useState("")
  const [aiInsights, setAiInsights] = useState<string[]>([])
  const [evaluationNotes, setEvaluationNotes] = useState<string[]>([])
  const [checklistItems, setChecklistItems] = useState<Record<string, boolean>>({
    "hand-hygiene": false,
    "patient-identification": false,
    "communication": false,
    "documentation": false,
    "equipment": false,
  })
  const [evaluationResult, setEvaluationResult] = useState<any>(null)
  const [aiStatus, setAiStatus] = useState<'checking' | 'ready' | 'mock' | 'error'>('checking')
  
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const notesInputRef = useRef<HTMLInputElement>(null)
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null)

  // Check AI status on mount
  useEffect(() => {
    const checkAiStatus = async () => {
      try {
        // Check if OpenAI is configured by making a test call
        const testRes = await fetch('/api/ai-competency/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffId: 'test',
            evaluatorId: 'test',
            evaluationType: 'live',
            duration: 1,
            competencyArea: 'test'
          })
        })
        
        if (testRes.ok) {
          const data = await testRes.json()
          // Check if response indicates real AI or mock
          if (data.message?.includes('mock') || data.data?.aiConfidence >= 90) {
            // Mock typically has consistent high confidence
            setAiStatus('mock')
          } else {
            setAiStatus('ready')
          }
        } else {
          setAiStatus('mock') // Assume mock on error
        }
      } catch (e) {
        console.log('AI status check failed, assuming mock mode')
        setAiStatus('mock')
      }
    }
    checkAiStatus()
  }, [])

  // Load staff members
  useEffect(() => {
    const loadStaff = async () => {
      try {
        setIsLoadingStaff(true)
        setError(null)
        const res = await fetch('/api/staff/list')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.staff) {
            setStaffMembers(data.staff.map((s: any) => ({
              id: s.id,
              name: s.name,
              role: s.role_id || s.department || 'Staff',
              department: s.department || 'General',
              hireDate: s.created_at,
              avatar: s.avatar
            })))
          } else {
            setError('Failed to load staff members')
          }
        } else {
          setError('Failed to load staff members')
        }
      } catch (e) {
        console.error('Failed to load staff:', e)
        setError('Failed to load staff members. Please try again.')
      } finally {
        setIsLoadingStaff(false)
      }
    }
    loadStaff()
  }, [])

  // Load evaluation history
  useEffect(() => {
    const loadEvaluations = async () => {
      try {
        setIsLoadingEvaluations(true)
        setError(null)
        const allEvaluations: EvaluationRecord[] = []

        // Pre-fetch all staff members once for both evaluation types
        let staffMap = new Map()
        try {
          const staffRes = await fetch('/api/staff/list')
          if (staffRes.ok) {
            const staffData = await staffRes.json()
            if (staffData.staff && Array.isArray(staffData.staff)) {
              // Create map with multiple lookup keys (id, user_id, email)
              staffData.staff.forEach((s: any) => {
                if (s.id) staffMap.set(s.id, s)
                if (s.user_id) staffMap.set(s.user_id, s)
                if (s.email) staffMap.set(s.email, s)
              })
            }
          }
        } catch (e) {
          console.error('Failed to load staff list:', e)
        }

        // Helper function to get staff info
        const getStaffInfo = (staffId: string | null | undefined) => {
          if (!staffId) return { name: null, role: null }
          const staff = staffMap.get(staffId) || null
          if (!staff) return { name: null, role: null }
          
          const name = staff.name || null
          const role = staff.credentials || staff.role_id || staff.department || null
          return { name, role }
        }

        // Load performance evaluations
        try {
          const perfRes = await fetch('/api/self-evaluations')
          if (perfRes.ok) {
            const perfData = await perfRes.json()
            if (perfData.evaluations && Array.isArray(perfData.evaluations)) {
              perfData.evaluations.forEach((evalRecord: any) => {
                // Skip records without staff_id
                if (!evalRecord.staff_id) return
                
                const staffInfo = getStaffInfo(evalRecord.staff_id)
                // Only include records with valid staff names
                if (!staffInfo.name) {
                  console.warn('Skipping evaluation with missing staff name:', evalRecord.id)
                  return
                }
                
                const overallScore = evalRecord.overall_score 
                  ? parseFloat(evalRecord.overall_score.toString()) 
                  : evalRecord.completion_percentage 
                    ? evalRecord.completion_percentage / 20 * 100 
                    : undefined

                let status: any = "in-progress"
                if (evalRecord.status === "approved") {
                  status = overallScore && overallScore >= 90 ? "excellent" : 
                           overallScore && overallScore >= 80 ? "good" : 
                           overallScore && overallScore >= 70 ? "satisfactory" : "good"
                } else if (evalRecord.status === "submitted" && overallScore !== undefined) {
                  if (overallScore >= 90) status = "excellent"
                  else if (overallScore >= 80) status = "good"
                  else if (overallScore >= 70) status = "satisfactory"
                  else if (overallScore >= 60) status = "needs-improvement"
                  else status = "unsatisfactory"
                } else if (evalRecord.status === "submitted") {
                  status = "in-progress"
                } else if (evalRecord.status === "draft") {
                  status = "in-progress"
                }

                // Get evaluator name
                let evaluatorName = "Supervisor"
                if (evalRecord.approved_by_name) {
                  evaluatorName = evalRecord.approved_by_name
                } else if (evalRecord.reviewer_name) {
                  evaluatorName = evalRecord.reviewer_name
                } else if (evalRecord.approved_by) {
                  const evaluatorInfo = getStaffInfo(evalRecord.approved_by)
                  if (evaluatorInfo.name) evaluatorName = evaluatorInfo.name
                }

                allEvaluations.push({
                  id: evalRecord.id,
                  staffName: staffInfo.name,
                  staffRole: staffInfo.role || "Staff",
                  evaluationType: "performance",
                  assessmentType: evalRecord.assessment_type || "annual",
                  status,
                  overallScore,
                  evaluatorName,
                  completedDate: evalRecord.approved_at || evalRecord.submitted_at || evalRecord.created_at,
                  nextDue: evalRecord.due_date,
                  priority: status === "needs-improvement" || status === "unsatisfactory" ? "high" : 
                           status === "satisfactory" ? "medium" : "low"
                })
              })
            }
          }
        } catch (e) {
          console.error('Failed to load performance evaluations:', e)
        }

        // Load competency evaluations
        try {
          const compRes = await fetch('/api/staff-performance/competency')
          if (compRes.ok) {
            const compData = await compRes.json()
            if (compData.records && Array.isArray(compData.records)) {
              compData.records.forEach((record: any) => {
                // Skip records with missing staff info
                if (!record.staffName || record.staffName === "Unknown" || !record.staffId) {
                  console.warn('Skipping competency evaluation with missing staff info:', record.id)
                  return
                }
                
                const overallScore = record.overallScore ? Math.round(record.overallScore) : undefined
                
                let status: any = "in-progress"
                if (record.status === "competent") {
                  if (overallScore !== undefined) {
                    if (overallScore >= 90) status = "excellent"
                    else if (overallScore >= 80) status = "good"
                    else status = "satisfactory"
                  } else {
                    status = "satisfactory"
                  }
                } else if (record.status === "needs-improvement") {
                  status = "needs-improvement"
                } else if (record.status === "not-competent") {
                  status = "unsatisfactory"
                } else {
                  status = "in-progress"
                }

                // Get evaluator name - try to look up if missing
                let evaluatorName = record.evaluatorName
                if (!evaluatorName || evaluatorName === "Unknown") {
                  if (record.evaluatorId) {
                    const evaluatorInfo = getStaffInfo(record.evaluatorId)
                    evaluatorName = evaluatorInfo.name || "Supervisor"
                  } else {
                    evaluatorName = "Supervisor"
                  }
                }

                // Get staff role if missing
                let staffRole = record.staffRole
                if (!staffRole || staffRole === "STAFF") {
                  const staffInfo = getStaffInfo(record.staffId)
                  staffRole = staffInfo.role || "Staff"
                }

                allEvaluations.push({
                  id: record.id,
                  staffName: record.staffName,
                  staffRole: staffRole,
                  evaluationType: "competency",
                  assessmentType: record.evaluationType || "annual",
                  status,
                  overallScore,
                  evaluatorName,
                  completedDate: record.evaluationDate || record.created_at || new Date().toISOString(),
                  nextDue: record.nextEvaluationDue,
                  priority: status === "needs-improvement" || status === "unsatisfactory" ? "high" : 
                           status === "satisfactory" ? "medium" : "low"
                })
              })
            }
          }
        } catch (e) {
          console.error('Failed to load competency evaluations:', e)
        }

        // Sort by completed date (newest first)
        allEvaluations.sort((a, b) => {
          const dateA = a.completedDate ? new Date(a.completedDate).getTime() : 0
          const dateB = b.completedDate ? new Date(b.completedDate).getTime() : 0
          return dateB - dateA
        })

        setEvaluationHistory(allEvaluations)
      } catch (e) {
        console.error('Failed to load evaluations:', e)
        setError('Failed to load evaluations. Please try again.')
      } finally {
        setIsLoadingEvaluations(false)
      }
    }
    loadEvaluations()
  }, [])

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
      case "submitted":
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">In Progress</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "competent":
        return <Badge className="bg-green-100 text-green-800">Competent</Badge>
      case "not-competent":
        return <Badge className="bg-red-100 text-red-800">Not Competent</Badge>
      default:
        // Fallback to "In Progress" instead of "Unknown"
        return <Badge className="bg-gray-100 text-gray-800">In Progress</Badge>
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

  // Filter records by type - only show completed evaluations (exclude in-progress)
  const competencyRecords = evaluationHistory.filter((r) => 
    r.evaluationType === "competency" && 
    r.status !== "in-progress" &&
    r.completedDate
  )
  const performanceRecords = evaluationHistory.filter((r) => 
    r.evaluationType === "performance" && 
    r.status !== "in-progress" &&
    r.completedDate
  )

  const getOverviewStats = () => {
    // Only count evaluations that have been completed (submitted or approved, not in-progress)
    const completedEvaluations = evaluationHistory.filter((r) => 
      r.status !== "in-progress" && r.completedDate
    )
    
    const totalEvaluations = completedEvaluations.length
    
    // Calculate completed this month with proper date handling
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const completedThisMonth = completedEvaluations.filter((r) => {
      if (!r.completedDate) return false
      try {
        const completedDate = new Date(r.completedDate)
        // Check if date is valid
        if (isNaN(completedDate.getTime())) return false
        return completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear
      } catch (e) {
        return false
      }
    }).length

    // Calculate average score from completed evaluations with valid scores (0-100 scale)
    const scoresWithValues = completedEvaluations.filter(r => {
      const score = r.overallScore
      return score !== undefined && 
             score !== null && 
             !isNaN(score) &&
             typeof score === 'number' &&
             score >= 0 &&
             score <= 100
    })
    
    let averageScore = 0
    if (scoresWithValues.length > 0) {
      const sum = scoresWithValues.reduce((sum, record) => {
        const score = record.overallScore || 0
        return sum + score
      }, 0)
      averageScore = sum / scoresWithValues.length
    }

    // Count evaluations that need attention (needs improvement or unsatisfactory)
    const needsAttention = completedEvaluations.filter((r) =>
      ["needs-improvement", "unsatisfactory", "not-competent"].includes(r.status),
    ).length

    return {
      totalEvaluations,
      completedThisMonth,
      averageScore: scoresWithValues.length > 0 ? Math.round(averageScore * 10) / 10 : 0, // Round to 1 decimal place
      needsAttention,
      recordsWithScores: scoresWithValues.length, // Track how many records contributed to average
    }
  }

  const stats = getOverviewStats()

  const handleStartEvaluation = (skipDialog = false) => {
    if (!selectedStaffMember || !selectedEvaluationType) {
      toast({
        title: "Missing Information",
        description: "Please select both staff member and evaluation type",
        variant: "destructive"
      })
      return
    }

    // Parse evaluation type (format: "competency-initial" or "performance-annual")
    const parts = selectedEvaluationType.split("-")
    if (parts.length < 2) {
      toast({
        title: "Invalid Evaluation Type",
        description: "Please select a valid evaluation type",
        variant: "destructive"
      })
      return
    }

    const evalType = parts[0] // "competency" or "performance"
    const assessmentType = parts.slice(1).join("-") // "initial", "annual", "mid-year", etc.

    // If skipDialog is true (called from New Evaluation dialog), navigate directly
    // Otherwise, show confirmation dialog first
    if (skipDialog) {
      if (evalType === "competency") {
        // Navigate to staff-competency page with staffId parameter
        router.push(`/staff-competency?staffId=${encodeURIComponent(selectedStaffMember)}&evaluationType=${encodeURIComponent(assessmentType)}`)
      } else {
        // Navigate to self-evaluation page with staffId and type parameters
        router.push(`/self-evaluation?staffId=${encodeURIComponent(selectedStaffMember)}&type=${encodeURIComponent(assessmentType)}&evaluationType=performance`)
      }
    } else {
      // Open dialog for confirmation
      setIsStandardEvaluationOpen(true)
    }
  }

  const handleNewEvaluation = () => {
    setIsNewEvaluationOpen(true)
  }

  const handleViewDetails = (record: EvaluationRecord) => {
    setSelectedEvaluation(record)
    setIsDetailDialogOpen(true)
  }

  // Start live camera for video evaluation
  const startLiveCamera = async () => {
    if (!selectedStaffMember || !selectedEvaluationType) {
      toast({
        title: "Error",
        description: "Please select both staff member and evaluation type",
        variant: "destructive"
      })
      return
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Camera not available",
          description: "Your browser doesn't support camera access. Please use Chrome, Firefox, or Edge.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Requesting camera...",
        description: "Please allow camera access when prompted"
      })

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: true
      })

      setLiveVideoStream(stream)
      setIsLiveCameraActive(true)

              toast({
                title: "Camera active",
        description: "Video feed is initializing. Click 'Analyze Frame' or 'Start Recording' to begin evaluation."
      })
    } catch (error: any) {
      console.error("Error accessing camera:", error)
      let errorMessage = "Failed to access camera"
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera permission denied. Please allow camera access in browser settings."
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera found. Please connect a camera device."
      }
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  // Stop live camera
  const stopLiveCamera = () => {
    // Stop MediaRecorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    
    if (liveVideoStream) {
      liveVideoStream.getTracks().forEach(track => track.stop())
      setLiveVideoStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsLiveCameraActive(false)
    setIsRecording(false)
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
    mediaRecorderRef.current = null
    recordedChunksRef.current = []
    setRecordedVideoBlob(null)
    toast({
      title: "Camera stopped",
      description: "Video recording has been stopped"
    })
  }

  // Start recording video
  const startRecording = async () => {
    if (!isLiveCameraActive || !liveVideoStream) {
      toast({
        title: "Error",
        description: "Please start the camera first",
        variant: "destructive"
      })
      return
    }

    if (!selectedStaffMember || !selectedEvaluationType) {
      toast({
        title: "Error",
        description: "Please select both staff member and evaluation type",
        variant: "destructive"
      })
      return
    }

    try {
      // Reset recorded chunks
      recordedChunksRef.current = []
      setRecordedVideoBlob(null)

      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
      toast({
          title: "Not Supported",
          description: "MediaRecorder is not supported in this browser",
          variant: "destructive"
        })
        return
      }

      // Create MediaRecorder
      const options: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp9,opus'
      }

      // Try to find a supported mime type
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options.mimeType = 'video/webm;codecs=vp8,opus'
        if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
          options.mimeType = 'video/webm'
          if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
            options.mimeType = '' // Let browser choose
          }
        }
      }

      const mediaRecorder = new MediaRecorder(liveVideoStream, options)
      mediaRecorderRef.current = mediaRecorder

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
          console.log('Recorded chunk:', event.data.size, 'bytes')
        }
      }

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing video...')
        const videoBlob = new Blob(recordedChunksRef.current, { type: mediaRecorder.mimeType || 'video/webm' })
        setRecordedVideoBlob(videoBlob)
        console.log('Video blob created:', videoBlob.size, 'bytes', videoBlob.type)

        // Analyze the recorded video
        await analyzeRecordedVideo(videoBlob)
      }

      // Start recording
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setAnalysisPhase("Recording...")
      setAiInsights([])
      setEvaluationResult(null)

      toast({
        title: "Recording Started",
        description: "Video is being recorded. Click 'Stop Recording' when done."
      })
    } catch (error: any) {
      console.error('Error starting recording:', error)
      toast({
        title: "Recording Error",
        description: error.message || "Failed to start recording",
        variant: "destructive"
      })
    }
  }

  // Stop recording and analyze video
  const stopRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
        setIsRecording(false)
      setAnalysisPhase("Processing recorded video...")
      toast({
        title: "Recording Stopped",
        description: "Processing and analyzing video..."
      })
    } else {
      setIsRecording(false)
      setAnalysisPhase("Recording stopped")
    }
  }

  // Analyze recorded video
  const analyzeRecordedVideo = async (videoBlob: Blob) => {
    if (!selectedStaffMember || !selectedEvaluationType) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive"
      })
        return
      }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setAnalysisPhase("Extracting frame from video for AI analysis...")

    try {
      // VERIFY: Log video details to confirm it's being sent
      console.log('📹 VIDEO RECORDING VERIFICATION:')
      console.log('  - Video blob size:', videoBlob.size, 'bytes')
      console.log('  - Video blob type:', videoBlob.type)
      
      if (videoBlob.size < 1000) {
        console.warn('⚠️ WARNING: Video blob is very small (', videoBlob.size, 'bytes). Recording may not have captured video properly.')
        toast({
          title: "⚠️ Video Too Small",
          description: `Video recording is only ${videoBlob.size} bytes. Please ensure you actually recorded video content.`,
          variant: "destructive"
        })
        setIsAnalyzing(false)
          return
        }

      setAnalysisProgress(10)
      setAnalysisPhase("Extracting representative frame from video...")
      
      // Extract a frame from the video for OpenAI Vision API
      // OpenAI Vision API only supports images, not video files directly
      const videoUrl = URL.createObjectURL(videoBlob)
      const videoElement = document.createElement('video')
      videoElement.src = videoUrl
      videoElement.muted = true
      videoElement.playsInline = true
      videoElement.crossOrigin = 'anonymous'
      
      // Wait for video to load and extract a frame
      await new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          // Check if duration is valid before setting currentTime
          const duration = videoElement.duration
          if (!isFinite(duration) || isNaN(duration) || duration <= 0) {
            // If duration is invalid, just use the first frame (currentTime = 0)
            console.log('⚠️ Video duration is invalid, using first frame')
            videoElement.currentTime = 0
            // Wait a bit for frame to be ready
            setTimeout(() => resolve(true), 100)
            return
          }
          
          // Seek to middle of video for representative frame
          const seekTime = Math.max(0, Math.min(duration / 2, duration - 0.1))
          console.log(`📹 Seeking to ${seekTime.toFixed(2)}s (duration: ${duration.toFixed(2)}s)`)
          videoElement.currentTime = seekTime
        }
        videoElement.onseeked = () => {
          resolve(true)
        }
        videoElement.onerror = (error) => {
          console.error('Video element error:', error)
          reject(new Error('Failed to load video'))
        }
        videoElement.onloadeddata = () => {
          // Fallback: if seeked doesn't fire, use loadeddata
          if (videoElement.readyState >= 2) {
            resolve(true)
          }
        }
        setTimeout(() => reject(new Error('Video load timeout')), 10000)
      })
      
      // Extract frame using canvas
      const canvas = document.createElement('canvas')
      canvas.width = videoElement.videoWidth || 1280
      canvas.height = videoElement.videoHeight || 720
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }
      
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
      
      // Convert canvas to blob (image)
      const frameBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob)
          else reject(new Error('Failed to extract frame'))
        }, 'image/jpeg', 0.9)
      })
      
      console.log('✅ Frame extracted from video:', frameBlob.size, 'bytes')
      
      // Clean up
      URL.revokeObjectURL(videoUrl)
      
      setAnalysisProgress(30)
      setAnalysisPhase("Sending video frame to OpenAI Medical AI for analysis...")

      // Send frame image to API for analysis (OpenAI Vision API)
        const formData = new FormData()
        formData.append('staffId', selectedStaffMember)
        formData.append('evaluatorId', currentUser?.id || '')
      formData.append('evaluationType', 'recorded')
      
      // Send the full evaluation type (e.g., "competency-initial", "performance-annual")
      // so AI can tailor recommendations and score based on the specific evaluation type
      formData.append('competencyArea', selectedEvaluationType)
      
      // Estimate duration (approximate)
      const duration = Math.round(videoBlob.size / 10000) // Rough estimate
      formData.append('duration', duration.toString())
      formData.append('notes', `Recorded video evaluation - ${new Date().toLocaleString()}`)
      
      // Send the extracted frame as an image (OpenAI Vision API supports images)
      const frameFile = new File([frameBlob], `video_frame_${Date.now()}.jpg`, { type: 'image/jpeg' })
      formData.append('frameImage', frameFile)
      formData.append('isLiveFrame', 'false') // But we're sending a frame from recorded video
      
      // Also send the video file for reference (though Vision API will use the frame)
      const videoFile = new File([videoBlob], `evaluation_${Date.now()}.webm`, { type: videoBlob.type })
      formData.append('video', videoFile)

      console.log('📤 SENDING VIDEO TO API:', {
        staffId: selectedStaffMember,
        evaluationType: selectedEvaluationType,
        videoSize: videoFile.size,
        videoType: videoFile.type
      })

      setAnalysisProgress(40)

        const res = await fetch('/api/ai-competency/evaluate', {
          method: 'POST',
          body: formData
        })

        const result = await res.json()
      console.log('🔍 Video Analysis Response:', result)
      console.log('📋 Full result.data:', result.data)
      console.log('📋 Training Recommendations:', result.data?.trainingRecommendations)
      console.log('📋 Training Recommendations type:', typeof result.data?.trainingRecommendations)
      console.log('📋 Training Recommendations is array?', Array.isArray(result.data?.trainingRecommendations))
      console.log('📋 Competency Score Recommendations:', result.data?.competencyScores?.map((s: any) => ({ category: s.category, recommendations: s.recommendations, hasRecs: !!s.recommendations, recLength: s.recommendations?.length })))
        
        if (result.success && result.data) {
        setAnalysisProgress(100)
        setAnalysisPhase("Analysis complete!")

        // Check if this is real AI or mock - use isMockMode flag from API
        const isMockMode = result.isMockMode || 
                          result.message?.toLowerCase().includes('mock') ||
                          result.data.overallPerformanceJustification?.includes('MOCK ANALYSIS') ||
                          result.data.competencyScores?.[0]?.observations?.some((obs: string) => obs.includes('MOCK ANALYSIS'))
        
        if (isMockMode) {
              setAiStatus('mock')
          toast({
            title: "⚠️ Mock Analysis Mode",
            description: "OpenAI API key not configured. Configure OPENAI_API_KEY in .env.local for real AI analysis. Mock mode gives low scores (20-30) to ensure accuracy.",
            variant: "destructive"
          })
          } else {
            if (aiStatus !== 'ready') {
              setAiStatus('ready')
            }
          }
          
        // Build insights
          const newInsights: string[] = []
          
        console.log('🔍 Building insights from result data:', {
          hasCompetencyScores: !!result.data.competencyScores,
          competencyScoresLength: result.data.competencyScores?.length,
          hasTrainingRecommendations: !!result.data.trainingRecommendations,
          trainingRecommendationsLength: result.data.trainingRecommendations?.length,
          hasOverallScore: result.data.overallPerformanceScore !== undefined,
          hasJustification: !!result.data.overallPerformanceJustification
        })
        
        // Add competency scores
          if (result.data.competencyScores && result.data.competencyScores.length > 0) {
            result.data.competencyScores.slice(0, 4).forEach((score: any) => {
            newInsights.push(`✅ ${score.category}: ${score.score}% (AI Confidence: ${score.confidence}% - how confident AI is in this score)`)
            })
          }
          
        // Add observations and recommendations from competency scores
          if (result.data.competencyScores && result.data.competencyScores.length > 0) {
            result.data.competencyScores.forEach((score: any) => {
              if (score.observations && score.observations.length > 0) {
                const observation = score.observations[0]
                if (observation && observation.length > 0) {
                  newInsights.push(`📋 ${score.category}: ${observation}`)
              }
            }
            // Add recommendations from individual competency scores
            if (score.recommendations && Array.isArray(score.recommendations) && score.recommendations.length > 0) {
              console.log(`✅ Found ${score.recommendations.length} recommendations in ${score.category}`)
              score.recommendations.slice(0, 2).forEach((rec: string) => {
                if (rec && rec.trim().length > 0) {
                  newInsights.push(`💡 ${score.category}: ${rec.trim()}`)
                }
              })
            } else {
              console.log(`⚠️ No recommendations found in ${score.category}`)
            }
          })
        }
        
        // Add strengths
          if (result.data.strengths && result.data.strengths.length > 0) {
            result.data.strengths.slice(0, 2).forEach((strength: string) => {
              newInsights.push(`✨ ${strength}`)
            })
          }
          
        // Add development areas
          if (result.data.developmentAreas && result.data.developmentAreas.length > 0) {
            result.data.developmentAreas.slice(0, 1).forEach((area: string) => {
              newInsights.push(`⚠️ ${area}`)
          })
        }
        
        // Add training recommendations - CHECK MULTIPLE SOURCES
        console.log('🔍 Checking training recommendations from multiple sources:')
        console.log('  - result.data.trainingRecommendations:', result.data.trainingRecommendations)
        console.log('  - result.data.trainingRecommendations type:', typeof result.data.trainingRecommendations)
        console.log('  - result.data.trainingRecommendations is array?', Array.isArray(result.data.trainingRecommendations))
        
        // Try to get recommendations from multiple possible locations
        let recommendationsToAdd: string[] = []
        
        // Source 1: Main trainingRecommendations array
        if (result.data.trainingRecommendations && Array.isArray(result.data.trainingRecommendations) && result.data.trainingRecommendations.length > 0) {
          console.log('✅ Found trainingRecommendations in main array:', result.data.trainingRecommendations.length)
          recommendationsToAdd = [...recommendationsToAdd, ...result.data.trainingRecommendations]
        }
        
        // Source 2: From competency scores recommendations
        if (result.data.competencyScores && Array.isArray(result.data.competencyScores)) {
          result.data.competencyScores.forEach((score: any) => {
            if (score.recommendations && Array.isArray(score.recommendations) && score.recommendations.length > 0) {
              console.log(`✅ Found recommendations in ${score.category}:`, score.recommendations.length)
              recommendationsToAdd = [...recommendationsToAdd, ...score.recommendations]
            }
          })
        }
        
        // Add unique recommendations to insights
        if (recommendationsToAdd.length > 0) {
          console.log('✅ Adding', recommendationsToAdd.length, 'recommendations to insights')
          // Remove duplicates and add to insights
          const uniqueRecs = [...new Set(recommendationsToAdd)]
          uniqueRecs.slice(0, 5).forEach((recommendation: string) => {
            if (recommendation && recommendation.trim().length > 0) {
              newInsights.push(`💡 Recommendation: ${recommendation.trim()}`)
            }
          })
        } else {
          console.warn('⚠️ No training recommendations found in ANY source!')
          // Add a fallback message
          newInsights.push(`💡 Recommendation: Review evaluation results for specific improvement areas`)
        }
        
        // Add AI confidence (how confident AI is in analysis accuracy)
        if (result.data.aiConfidence !== undefined) {
          const confidenceEmoji = result.data.aiConfidence >= 80 ? '🎯' : result.data.aiConfidence >= 60 ? '📊' : '❓'
          newInsights.push(`${confidenceEmoji} AI Analysis Confidence: ${result.data.aiConfidence}% (How confident AI is in analysis accuracy)`)
        }
        
        // Add overall performance score and justification if available
        if (result.data.overallPerformanceScore !== undefined) {
          const scoreEmoji = result.data.overallPerformanceScore >= 4 ? '⭐' : result.data.overallPerformanceScore >= 3 ? '📊' : '📉'
          newInsights.push(`${scoreEmoji} Overall Performance: ${result.data.overallPerformanceScore}/5`)
        }
        
        if (result.data.overallPerformanceJustification) {
          // Truncate if too long, but show key points
          const justification = result.data.overallPerformanceJustification.length > 150 
            ? result.data.overallPerformanceJustification.substring(0, 150) + '...'
            : result.data.overallPerformanceJustification
          newInsights.push(`📝 ${justification}`)
        }

        // Update insights
        console.log('📊 Total new insights to add:', newInsights.length)
        console.log('📊 New insights content:', newInsights)
        
          if (newInsights.length > 0) {
            setAiInsights(prev => {
              const combined = [...prev, ...newInsights]
              const unique = combined.filter((item, index) => {
                const firstIndex = combined.findIndex(i => {
                const itemText = item.replace(/[✅📋✨⚠️💡⭐📊📉📝]/g, '').trim()
                const iText = i.replace(/[✅📋✨⚠️💡⭐📊📉📝]/g, '').trim()
                  return itemText === iText
                })
                return index === firstIndex
              })
            const finalInsights = unique.slice(-15) // Increased from 10 to 15 to show more recommendations
            console.log('✅ Final insights to display:', finalInsights.length, finalInsights)
            return finalInsights
            })
        } else {
          console.warn('⚠️ No insights to add!')
          }

          // Update result - store AI assessment ID for saving to competency
          const aiAssessmentId = result.evaluationId || result.data?.evaluationId || result.data?.id
          setEvaluationResult({
            ...result.data,
            evaluationId: aiAssessmentId,
            aiAssessmentId: aiAssessmentId
          })

        toast({
          title: "Analysis Complete",
          description: `Video analyzed! Overall Score: ${result.data.overallScore}%. Click "Save to Competency" to add to Staff Assessments.`
        })
          } else {
        throw new Error(result.error || 'Analysis failed')
      }
    } catch (error: any) {
      console.error('Error analyzing video:', error)
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to analyze video. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress(0)
      setAnalysisPhase("")
    }
  }

  // Manual analyze current frame
  const analyzeCurrentFrame = async () => {
    if (!isLiveCameraActive || !videoRef.current || !canvasRef.current) {
      toast({
        title: "Error",
        description: "Please start the camera first",
        variant: "destructive"
      })
      return
    }

    if (!selectedStaffMember || !selectedEvaluationType) {
      toast({
        title: "Error",
        description: "Please select both staff member and evaluation type",
        variant: "destructive"
      })
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) {
      toast({
        title: "Error",
        description: "Failed to initialize canvas",
        variant: "destructive"
      })
      return
    }

    // Wait for video to be ready
    if (video.readyState < 2) {
      toast({
        title: "Waiting for video",
        description: "Please wait for video to load..."
      })
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setAnalysisPhase("Capturing frame...")

    try {
      // Set canvas dimensions to match video
      const videoWidth = video.videoWidth || 1280
      const videoHeight = video.videoHeight || 720
      canvas.width = videoWidth
      canvas.height = videoHeight

      // Capture current frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob: Blob | null) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to capture frame'))
        }, 'image/jpeg', 0.8)
      })

      setAnalysisProgress(30)
      setAnalysisPhase("Analyzing frame with AI...")

      // Send to OpenAI API for analysis
      const formData = new FormData()
      formData.append('staffId', selectedStaffMember)
      formData.append('evaluatorId', currentUser?.id || '')
      formData.append('evaluationType', 'live')
      
      // Send the full evaluation type (e.g., "competency-initial", "performance-annual")
      // so AI can tailor recommendations and score based on the specific evaluation type
      formData.append('competencyArea', selectedEvaluationType)
      formData.append('duration', '10')
      formData.append('notes', `Manual frame analysis - ${new Date().toLocaleTimeString()}`)
      formData.append('frameImage', blob, `frame_${Date.now()}.jpg`)
      formData.append('isLiveFrame', 'true')
      formData.append('frameNumber', '1')

      setAnalysisProgress(50)

      const res = await fetch('/api/ai-competency/evaluate', {
            method: 'POST',
        body: formData
      })

      const result = await res.json()
      console.log('🔍 Manual AI Analysis Response:', result)

      if (result.success && result.data) {
        setAnalysisProgress(100)
        setAnalysisPhase("Analysis complete!")

        // Check if this is real AI or mock - use isMockMode flag from API
        const isMockMode = result.isMockMode || 
                          result.message?.toLowerCase().includes('mock') ||
                          result.data.overallPerformanceJustification?.includes('MOCK ANALYSIS') ||
                          result.data.competencyScores?.[0]?.observations?.some((obs: string) => obs.includes('MOCK ANALYSIS'))
        
        if (isMockMode) {
          setAiStatus('mock')
            toast({
            title: "⚠️ Mock Analysis Mode",
            description: "OpenAI API key not configured. Configure OPENAI_API_KEY in .env.local for real AI analysis.",
            variant: "destructive"
          })
        } else {
          if (aiStatus !== 'ready') {
            setAiStatus('ready')
          }
        }

        // Build insights
        const newInsights: string[] = []
        
        console.log('🔍 Building insights from result data:', {
          hasCompetencyScores: !!result.data.competencyScores,
          competencyScoresLength: result.data.competencyScores?.length,
          hasTrainingRecommendations: !!result.data.trainingRecommendations,
          trainingRecommendationsLength: result.data.trainingRecommendations?.length,
          hasOverallScore: result.data.overallPerformanceScore !== undefined,
          hasJustification: !!result.data.overallPerformanceJustification
        })
        
        // Add competency scores
        if (result.data.competencyScores && result.data.competencyScores.length > 0) {
          result.data.competencyScores.slice(0, 4).forEach((score: any) => {
            newInsights.push(`✅ ${score.category}: ${score.score}% (AI Confidence: ${score.confidence}% - how confident AI is in this score)`)
          })
        }
        
        // Add observations and recommendations from competency scores
        if (result.data.competencyScores && result.data.competencyScores.length > 0) {
          result.data.competencyScores.forEach((score: any) => {
            if (score.observations && score.observations.length > 0) {
              const observation = score.observations[0]
              if (observation && observation.length > 0) {
                newInsights.push(`📋 ${score.category}: ${observation}`)
              }
            }
            // Add recommendations from individual competency scores
            if (score.recommendations && Array.isArray(score.recommendations) && score.recommendations.length > 0) {
              console.log(`✅ Found ${score.recommendations.length} recommendations in ${score.category}`)
              score.recommendations.slice(0, 2).forEach((rec: string) => {
                if (rec && rec.trim().length > 0) {
                  newInsights.push(`💡 ${score.category}: ${rec.trim()}`)
                }
              })
            } else {
              console.log(`⚠️ No recommendations found in ${score.category}`)
            }
          })
        }
        
        // Add strengths
        if (result.data.strengths && result.data.strengths.length > 0) {
          result.data.strengths.slice(0, 2).forEach((strength: string) => {
            newInsights.push(`✨ ${strength}`)
          })
        }
        
        // Add development areas
        if (result.data.developmentAreas && result.data.developmentAreas.length > 0) {
          result.data.developmentAreas.slice(0, 1).forEach((area: string) => {
            newInsights.push(`⚠️ ${area}`)
          })
        }
        
        // Add training recommendations - CHECK MULTIPLE SOURCES
        console.log('🔍 Checking training recommendations from multiple sources:')
        console.log('  - result.data.trainingRecommendations:', result.data.trainingRecommendations)
        console.log('  - result.data.trainingRecommendations type:', typeof result.data.trainingRecommendations)
        console.log('  - result.data.trainingRecommendations is array?', Array.isArray(result.data.trainingRecommendations))
        
        // Try to get recommendations from multiple possible locations
        let recommendationsToAdd: string[] = []
        
        // Source 1: Main trainingRecommendations array
        if (result.data.trainingRecommendations && Array.isArray(result.data.trainingRecommendations) && result.data.trainingRecommendations.length > 0) {
          console.log('✅ Found trainingRecommendations in main array:', result.data.trainingRecommendations.length)
          recommendationsToAdd = [...recommendationsToAdd, ...result.data.trainingRecommendations]
        }
        
        // Source 2: From competency scores recommendations
        if (result.data.competencyScores && Array.isArray(result.data.competencyScores)) {
          result.data.competencyScores.forEach((score: any) => {
            if (score.recommendations && Array.isArray(score.recommendations) && score.recommendations.length > 0) {
              console.log(`✅ Found recommendations in ${score.category}:`, score.recommendations.length)
              recommendationsToAdd = [...recommendationsToAdd, ...score.recommendations]
            }
          })
        }
        
        // Add unique recommendations to insights
        if (recommendationsToAdd.length > 0) {
          console.log('✅ Adding', recommendationsToAdd.length, 'recommendations to insights')
          // Remove duplicates and add to insights
          const uniqueRecs = [...new Set(recommendationsToAdd)]
          uniqueRecs.slice(0, 5).forEach((recommendation: string) => {
            if (recommendation && recommendation.trim().length > 0) {
              newInsights.push(`💡 Recommendation: ${recommendation.trim()}`)
            }
          })
        } else {
          console.warn('⚠️ No training recommendations found in ANY source!')
          // Add a fallback message
          newInsights.push(`💡 Recommendation: Review evaluation results for specific improvement areas`)
        }
        
        // Add AI confidence (how confident AI is in analysis accuracy)
        if (result.data.aiConfidence !== undefined) {
          const confidenceEmoji = result.data.aiConfidence >= 80 ? '🎯' : result.data.aiConfidence >= 60 ? '📊' : '❓'
          newInsights.push(`${confidenceEmoji} AI Analysis Confidence: ${result.data.aiConfidence}% (How confident AI is in analysis accuracy)`)
        }
        
        // Add overall performance score and justification if available
        if (result.data.overallPerformanceScore !== undefined) {
          const scoreEmoji = result.data.overallPerformanceScore >= 4 ? '⭐' : result.data.overallPerformanceScore >= 3 ? '📊' : '📉'
          newInsights.push(`${scoreEmoji} Overall Performance: ${result.data.overallPerformanceScore}/5`)
        }
        
        if (result.data.overallPerformanceJustification) {
          // Truncate if too long, but show key points
          const justification = result.data.overallPerformanceJustification.length > 150 
            ? result.data.overallPerformanceJustification.substring(0, 150) + '...'
            : result.data.overallPerformanceJustification
          newInsights.push(`📝 ${justification}`)
        }

        // Update insights
        console.log('📊 Total new insights to add:', newInsights.length)
        console.log('📊 New insights content:', newInsights)
        
        if (newInsights.length > 0) {
          setAiInsights(prev => {
            const combined = [...prev, ...newInsights]
            const unique = combined.filter((item, index) => {
              const firstIndex = combined.findIndex(i => {
                const itemText = item.replace(/[✅📋✨⚠️💡⭐📊📉📝]/g, '').trim()
                const iText = i.replace(/[✅📋✨⚠️💡⭐📊📉📝]/g, '').trim()
                return itemText === iText
              })
              return index === firstIndex
            })
            const finalInsights = unique.slice(-15) // Increased from 10 to 15 to show more recommendations
            console.log('✅ Final insights to display:', finalInsights.length, finalInsights)
            return finalInsights
          })
        } else {
          console.warn('⚠️ No insights to add!')
        }

        // Update result
        setEvaluationResult(result.data)

        toast({
          title: "Analysis Complete",
          description: `Frame analyzed! Overall Score: ${result.data.overallScore}%`
        })
      } else {
        throw new Error(result.error || 'Analysis failed')
      }
    } catch (error: any) {
      console.error('Error analyzing frame:', error)
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to analyze frame. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress(0)
      setAnalysisPhase("")
    }
  }

  // Add note
  const addNote = () => {
    const noteInput = notesInputRef.current
    if (noteInput && noteInput.value.trim()) {
      const timestamp = new Date().toLocaleTimeString()
      setEvaluationNotes(prev => [...prev, `[${timestamp}] ${noteInput.value.trim()}`])
      noteInput.value = ""
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (liveVideoStream) {
        liveVideoStream.getTracks().forEach(track => track.stop())
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [liveVideoStream])

  // Effect to handle video stream
  useEffect(() => {
    if (liveVideoStream && videoRef.current) {
      const video = videoRef.current
      
      // Only set srcObject if it's different to avoid interrupting play
      if (video.srcObject !== liveVideoStream) {
      video.srcObject = liveVideoStream
      }
      
      // Wait for video to be ready before playing
      let playAttempted = false
      const handleCanPlay = async () => {
        if (!playAttempted && video.paused) {
          playAttempted = true
          try {
            await video.play()
            console.log('Video playing successfully')
          } catch (error: any) {
            // Ignore "interrupted" errors - they're harmless
            if (error.name !== 'AbortError' && error.message && !error.message.includes('interrupted')) {
          console.log('Video play error (may need user interaction):', error)
            }
          }
        }
      }
      
      // Use canplay event which fires when video is ready to play
      video.addEventListener('canplay', handleCanPlay, { once: true })
      video.addEventListener('loadedmetadata', handleCanPlay, { once: true })
      
      // If video is already ready, try to play
      if (video.readyState >= 3) {
        handleCanPlay()
      }
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay)
        video.removeEventListener('loadedmetadata', handleCanPlay)
      }
    } else if (!liveVideoStream && videoRef.current) {
      // Clear video source when stream is stopped
      videoRef.current.srcObject = null
    }
  }, [liveVideoStream])

  const handleGenerateReport = async (type: "competency" | "performance" | "analytics") => {
    try {
      setIsGeneratingReport(true)
      
      // Filter evaluations by type - only include completed evaluations
      const filtered = type === "analytics" 
        ? evaluationHistory.filter(e => e.status !== "in-progress" && e.completedDate)
        : evaluationHistory.filter(e => 
            e.evaluationType === type && 
            e.status !== "in-progress" && 
            e.completedDate
          )
      
      if (filtered.length === 0) {
        toast({
          title: "No Data Available",
          description: `No completed ${type} evaluations found to generate a report.`,
          variant: "destructive"
        })
        setIsGeneratingReport(false)
        return
      }

      // Calculate statistics
      const stats = {
        total: filtered.length,
        withScores: filtered.filter(e => e.overallScore !== undefined && e.overallScore !== null).length,
        averageScore: filtered
          .filter(e => e.overallScore !== undefined && e.overallScore !== null)
          .reduce((sum, e) => sum + (e.overallScore || 0), 0) / 
          filtered.filter(e => e.overallScore !== undefined && e.overallScore !== null).length || 0,
        byStatus: filtered.reduce((acc, e) => {
          acc[e.status] = (acc[e.status] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byAssessmentType: filtered.reduce((acc, e) => {
          acc[e.assessmentType] = (acc[e.assessmentType] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        needsAttention: filtered.filter(e => 
          ["needs-improvement", "unsatisfactory", "not-competent"].includes(e.status)
        ).length,
        completedThisMonth: filtered.filter(e => {
          if (!e.completedDate) return false
          try {
            const date = new Date(e.completedDate)
            const now = new Date()
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
          } catch {
            return false
          }
        }).length
      }

      // Prepare report data
      const report = {
        type,
        generatedAt: new Date().toISOString(),
        generatedBy: currentUser.name || "System",
        statistics: stats,
        evaluations: filtered.map(e => ({
          id: e.id,
          staffName: e.staffName,
          staffRole: e.staffRole,
          evaluationType: e.evaluationType,
          assessmentType: e.assessmentType,
          status: e.status,
          overallScore: e.overallScore,
          evaluatorName: e.evaluatorName,
          completedDate: e.completedDate ? new Date(e.completedDate).toLocaleDateString() : "N/A",
          nextDue: e.nextDue ? new Date(e.nextDue).toLocaleDateString() : "N/A",
          priority: e.priority
        })),
        summary: {
          totalEvaluations: stats.total,
          averageScore: Math.round(stats.averageScore * 10) / 10,
          needsAttention: stats.needsAttention,
          completedThisMonth: stats.completedThisMonth
        }
      }

      setReportData(report)
      setShowReportPreview(true)

      toast({
        title: "Report Generated",
        description: `Successfully generated ${type} report with ${filtered.length} evaluation(s)`,
      })
    } catch (error: any) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate report. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleExportReport = (format: "csv" | "json") => {
    if (!reportData) return

    try {
      if (format === "csv") {
        // Create CSV content with proper escaping
        const escapeCSV = (value: any) => {
          if (value === null || value === undefined) return ""
          const str = String(value)
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        }

        const headers = ["ID", "Staff Name", "Role", "Type", "Assessment Type", "Status", "Score", "Evaluator", "Completed Date", "Next Due", "Priority"]
        const rows = reportData.evaluations.map((e: any) => [
          e.id,
          e.staffName,
          e.staffRole,
          e.evaluationType,
          e.assessmentType,
          e.status,
          e.overallScore?.toString() || "N/A",
          e.evaluatorName,
          e.completedDate,
          e.nextDue,
          e.priority
        ])
        
        const csv = [
          headers.map(escapeCSV).join(","),
          ...rows.map((row: any[]) => row.map(escapeCSV).join(","))
        ].join("\n")
        
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${reportData.type}-report-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
          title: "Export Successful",
          description: "CSV file downloaded successfully",
        })
      } else if (format === "json") {
        const json = JSON.stringify(reportData, null, 2)
        const blob = new Blob([json], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${reportData.type}-report-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
          title: "Export Successful",
          description: "JSON file downloaded successfully",
        })
      }
    } catch (error: any) {
      console.error("Error exporting report:", error)
      toast({
        title: "Export Error",
        description: error.message || "Failed to export report",
        variant: "destructive"
      })
    }
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
                <h1 className="text-2xl font-bold text-gray-900">Performance Evaluations</h1>
                <p className="text-gray-600">Comprehensive staff performance assessment and development</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleNewEvaluation}>
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
                      <p className="text-2xl font-bold text-blue-600">{isLoadingEvaluations ? "..." : stats.totalEvaluations}</p>
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
                      <p className="text-2xl font-bold text-green-600">{isLoadingEvaluations ? "..." : stats.completedThisMonth}</p>
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
                      <p className="text-2xl font-bold text-yellow-600">
                        {isLoadingEvaluations ? (
                          "..."
                        ) : stats.recordsWithScores > 0 ? (
                          `${stats.averageScore}%`
                        ) : (
                          "N/A"
                        )}
                      </p>
                      {!isLoadingEvaluations && stats.recordsWithScores > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Based on {stats.recordsWithScores} evaluation{stats.recordsWithScores !== 1 ? 's' : ''}
                        </p>
                      )}
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
                      <p className="text-2xl font-bold text-red-600">{isLoadingEvaluations ? "..." : stats.needsAttention}</p>
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
                      <span className="text-sm">Total Competency Assessments</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {isLoadingEvaluations ? "..." : competencyRecords.length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Initial Assessments</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {isLoadingEvaluations ? "..." : competencyRecords.filter((r) => r.assessmentType === "initial").length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Skills Validations</span>
                      <Badge className="bg-green-100 text-green-800">
                        {isLoadingEvaluations ? "..." : competencyRecords.filter((r) => r.assessmentType === "skills-validation").length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Annual Reviews</span>
                      <Badge className="bg-purple-100 text-purple-800">
                        {isLoadingEvaluations ? "..." : competencyRecords.filter((r) => r.assessmentType === "annual").length}
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
                      <span className="text-sm">Total Performance Evaluations</span>
                      <Badge className="bg-green-100 text-green-800">
                        {isLoadingEvaluations ? "..." : performanceRecords.length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Annual Reviews</span>
                      <Badge className="bg-green-100 text-green-800">
                        {isLoadingEvaluations ? "..." : performanceRecords.filter((r) => r.assessmentType === "annual").length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mid-Year Reviews</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {isLoadingEvaluations ? "..." : performanceRecords.filter((r) => r.assessmentType === "mid-year").length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Probationary Reviews</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {isLoadingEvaluations ? "..." : performanceRecords.filter((r) => r.assessmentType === "probationary").length}
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
                    <Select value={selectedStaffMember} onValueChange={setSelectedStaffMember} disabled={isLoadingStaff}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingStaff ? "Loading..." : "Choose staff member"} />
                      </SelectTrigger>
                      <SelectContent>
                        {staffMembers.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name} - {staff.role || staff.department || "Staff"}
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
                  disabled={!selectedStaffMember || !selectedEvaluationType || isLoadingStaff}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => handleStartEvaluation()}
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
                        <SelectItem value="in-progress">In Progress</SelectItem>
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
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                {isLoadingEvaluations ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading evaluations...</p>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No evaluations found</p>
                    {searchTerm || filterStatus !== "all" ? (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          setSearchTerm("")
                          setFilterStatus("all")
                        }}
                      >
                        Clear Filters
                      </Button>
                    ) : null}
                  </div>
                ) : (
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
                              Evaluator: {record.evaluatorName} • Completed: {record.completedDate ? new Date(record.completedDate).toLocaleDateString() : "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {record.overallScore !== undefined && (
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">{record.overallScore}%</div>
                              <p className="text-xs text-gray-500">Score</p>
                            </div>
                          )}
                          {getStatusBadge(record.status)}
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(record)}>
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

          <TabsContent value="video-evaluations" className="space-y-6">
            {/* AI Status Banner */}
            {aiStatus === 'mock' && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-yellow-900">Using Simulated AI Analysis</h3>
                      <p className="text-sm text-yellow-800 mt-1">
                        The system is currently using mock/simulated AI analysis. For accurate, real-time video analysis:
                      </p>
                      <ol className="text-sm text-yellow-800 mt-2 ml-4 list-decimal space-y-1">
                        <li>Get an OpenAI API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline font-medium">platform.openai.com</a></li>
                        <li>Add <code className="bg-yellow-100 px-1 py-0.5 rounded">OPENAI_API_KEY=sk-your-key</code> to your <code className="bg-yellow-100 px-1 py-0.5 rounded">.env.local</code> file</li>
                        <li>Restart the development server</li>
                      </ol>
                      <p className="text-sm text-yellow-800 mt-2">
                        See <code className="bg-yellow-100 px-1 py-0.5 rounded">OPENAI_SETUP.md</code> for detailed instructions.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {aiStatus === 'ready' && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-900">AI Analysis Active</h3>
                      <p className="text-sm text-green-800">
                        OpenAI GPT-4o Vision is configured and ready for accurate, real-time video analysis.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Video Evaluation Center */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Video className="h-5 w-5 mr-2" />
                    Video Evaluation Center
                  </div>
                  {aiStatus === 'ready' && (
                    <Badge className="bg-green-100 text-green-800">
                      AI Active
                    </Badge>
                  )}
                  {aiStatus === 'mock' && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Mock Mode
                    </Badge>
                  )}
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
                        <Select value={selectedStaffMember} onValueChange={setSelectedStaffMember} disabled={isLoadingStaff}>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingStaff ? "Loading..." : "Select staff member"} />
                          </SelectTrigger>
                          <SelectContent>
                            {staffMembers.map((staff) => (
                              <SelectItem key={staff.id} value={staff.id}>
                                {staff.name} - {staff.role || staff.department || "Staff"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="video-type">Evaluation Type</Label>
                        <Select value={selectedEvaluationType} onValueChange={setSelectedEvaluationType}>
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
                    <div className="bg-black rounded-lg aspect-video flex items-center justify-center border-2 border-dashed border-gray-700 relative overflow-hidden min-h-[400px]">
                      {isLiveCameraActive ? (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-contain max-w-full max-h-full"
                            style={{ minHeight: '400px' }}
                            onPlay={() => {
                              console.log('Video is playing!')
                            }}
                            onError={(e) => {
                              console.error('Video error:', e)
                              toast({
                                title: "Video Error",
                                description: "There was an error with the video stream",
                                variant: "destructive"
                              })
                            }}
                          />
                          {isRecording && (
                            <div className="absolute top-2 left-2 bg-red-600 text-white px-3 py-1 rounded-full flex items-center space-x-2 z-10">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                              <span className="text-xs font-medium">REC</span>
                            </div>
                          )}
                          <canvas ref={canvasRef} className="hidden" width="1280" height="720" />
                          {!liveVideoStream && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                              <div className="text-center text-white">
                                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                                <p className="text-sm">Initializing camera...</p>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center text-white">
                          <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">Video feed will appear here</p>
                          <p className="text-sm opacity-75 mt-2">Start camera to begin evaluation</p>
                          <Button 
                            className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                            onClick={startLiveCamera}
                            disabled={!selectedStaffMember || !selectedEvaluationType}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Start Camera
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Recording Controls */}
                    {isLiveCameraActive && (
                      <div className="flex space-x-2">
                        {!isRecording ? (
                          <Button
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            onClick={startRecording}
                            disabled={isAnalyzing || !selectedStaffMember || !selectedEvaluationType}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Start Recording
                          </Button>
                        ) : (
                          <Button
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            onClick={stopRecording}
                          >
                            <Square className="h-4 w-4 mr-2" />
                            Stop Recording
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={stopLiveCamera}
                          disabled={isAnalyzing}
                        >
                          Stop Camera
                        </Button>
                      </div>
                    )}

                    {/* Analysis Progress */}
                    {isAnalyzing && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{analysisPhase}</span>
                              <span className="text-sm text-gray-600">{analysisProgress}%</span>
                            </div>
                            <Progress value={analysisProgress} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Quick Notes */}
                    <div>
                      <Label htmlFor="quick-notes">Quick Notes</Label>
                      <div className="flex space-x-2 mt-1">
                        <Input 
                          ref={notesInputRef}
                          placeholder="Add timestamped note..." 
                          className="flex-1" 
                          id="quick-notes"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addNote()
                            }
                          }}
                        />
                        <Button variant="outline" size="sm" onClick={addNote}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {evaluationNotes.length > 0 && (
                        <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                          {evaluationNotes.map((note, idx) => (
                            <div key={idx} className="flex items-start justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded group">
                              <span className="flex-1">{note}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  setEvaluationNotes(prev => prev.filter((_, i) => i !== idx))
                                }}
                              >
                                <span className="text-red-500">×</span>
                              </Button>
                            </div>
                          ))}
                          {evaluationNotes.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2 text-xs"
                              onClick={() => {
                                if (confirm('Clear all notes?')) {
                                  setEvaluationNotes([])
                                }
                              }}
                            >
                              Clear All Notes
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Insights Panel */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          <div className="flex items-center">
                            <Activity className="h-4 w-4 mr-2 text-purple-600" />
                            AI Insights
                          </div>
                          {isAnalyzing && (
                            <Badge variant="outline" className="text-xs">
                              Live Analysis
                            </Badge>
                          )}
                        </CardTitle>
                        {isAnalyzing && aiInsights.length > 0 && (
                          <CardDescription className="text-xs">
                            {aiInsights.length} insights detected
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {isAnalyzing ? (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {aiInsights.length > 0 ? (
                              aiInsights.map((insight, idx) => (
                                <div 
                                  key={idx}
                                  className={`p-3 border rounded text-xs animate-in slide-in-from-top-2 ${
                                    insight.includes('✅') ? 'bg-green-50 border-green-200' :
                                    insight.includes('⚠️') ? 'bg-yellow-50 border-yellow-200' :
                                    insight.includes('📋') ? 'bg-blue-50 border-blue-200' :
                                    insight.includes('✨') ? 'bg-purple-50 border-purple-200' :
                                    insight.includes('💡') ? 'bg-amber-50 border-amber-200' :
                                    insight.includes('⭐') || insight.includes('📊') || insight.includes('📉') ? 'bg-indigo-50 border-indigo-200' :
                                    insight.includes('📝') ? 'bg-cyan-50 border-cyan-200' :
                                    insight.includes('🎯') || insight.includes('❓') ? 'bg-teal-50 border-teal-200' :
                                    'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <span className={`${
                                    insight.includes('✅') ? 'text-green-800' :
                                    insight.includes('⚠️') ? 'text-yellow-800' :
                                    insight.includes('📋') ? 'text-blue-800' :
                                    insight.includes('✨') ? 'text-purple-800' :
                                    insight.includes('💡') ? 'text-amber-800 font-medium' :
                                    insight.includes('⭐') || insight.includes('📊') || insight.includes('📉') ? 'text-indigo-800 font-semibold' :
                                    insight.includes('📝') ? 'text-cyan-800' :
                                    insight.includes('🎯') || insight.includes('❓') ? 'text-teal-800 font-medium' :
                                    'text-gray-800'
                                  }`}>
                                    {insight}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
                                <span className="text-sm font-medium text-gray-700">Analyzing video feed...</span>
                                <span className="text-xs text-gray-500 mt-1">AI insights will appear here</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="text-center py-6">
                              <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-sm text-gray-600 mb-2">AI analysis will appear during recording</p>
                              <p className="text-xs text-gray-500">Start recording to see real-time insights</p>
                            </div>
                            {evaluationResult && (
                              <div className="mt-4 space-y-2 border-t pt-4">
                                <div className="p-3 bg-green-50 border border-green-200 rounded">
                                  <p className="text-sm font-medium text-green-800 mb-1">
                                    Final Assessment Complete
                                  </p>
                                  <p className="text-xs text-green-700">
                                    Overall Score: {evaluationResult.overallScore}%
                                  </p>
                                  <p className="text-xs text-green-700">
                                    AI Analysis Confidence: {evaluationResult.aiConfidence}%
                                    <span className="text-gray-500 ml-1">(How confident AI is in analysis accuracy)</span>
                                  </p>
                                  <div className="mt-3 pt-3 border-t border-green-300">
                                    <Button
                                      size="sm"
                                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                      onClick={async () => {
                                        if (!evaluationResult?.aiAssessmentId || !selectedStaffMember) {
                                          toast({
                                            title: "Error",
                                            description: "Missing assessment ID or staff member. Please record and analyze again.",
                                            variant: "destructive"
                                          })
                                          return
                                        }

                                        try {
                                          toast({
                                            title: "Saving to Competency",
                                            description: "Creating competency evaluation and linking AI assessment..."
                                          })

                                          // Step 1: Create competency evaluation
                                          const evalRes = await fetch('/api/staff-performance/competency', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              action: 'create-evaluation',
                                              data: {
                                                staffId: selectedStaffMember,
                                                evaluationType: selectedEvaluationType?.includes('competency') 
                                                  ? selectedEvaluationType.replace('competency-', '') 
                                                  : 'annual',
                                                evaluatorName: currentUser?.name || 'Evaluator',
                                                evaluatorId: currentUser?.id || null,
                                                competencyAreas: [] // Will be populated from AI assessment
                                              }
                                            })
                                          })

                                          const evalResult = await evalRes.json()
                                          
                                          if (!evalResult.success || !evalResult.evaluationId) {
                                            throw new Error(evalResult.message || 'Failed to create competency evaluation')
                                          }

                                          // Step 2: Link AI assessment to competency evaluation
                                          const linkRes = await fetch('/api/ai-competency/save-to-competency', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              aiAssessmentId: evaluationResult.aiAssessmentId,
                                              competencyEvaluationId: evalResult.evaluationId
                                            })
                                          })

                                          const linkResult = await linkRes.json()

                                          if (!linkResult.success) {
                                            throw new Error(linkResult.error || 'Failed to link assessment')
                                          }

                                          toast({
                                            title: "✅ Success!",
                                            description: `Assessment saved! View results in Staff Competency → Staff Assessments tab.`,
                                            duration: 5000
                                          })

                                          // Option to navigate to staff competency page
                                          setTimeout(() => {
                                            if (confirm('Would you like to view the results in Staff Assessments tab?')) {
                                              router.push('/staff-competency')
                                            }
                                          }, 1000)

                                        } catch (error: any) {
                                          console.error('Error saving to competency:', error)
                                          toast({
                                            title: "Error",
                                            description: error.message || "Failed to save assessment to competency",
                                            variant: "destructive"
                                          })
                                        }
                                      }}
                                    >
                                      <Target className="h-4 w-4 mr-2" />
                                      Save to Competency Evaluations
                                    </Button>
                                    <p className="text-xs text-green-600 mt-2 text-center">
                                      Save this assessment to view in Staff Assessments tab
                                    </p>
                                  </div>
                                </div>
                                {evaluationResult.competencyScores && evaluationResult.competencyScores.length > 0 && (
                                  <div className="space-y-1">
                                    {evaluationResult.competencyScores.slice(0, 4).map((score: any, idx: number) => (
                                      <div key={idx} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                                        <span className="font-medium text-gray-700">{score.category}</span>
                                        <span className="text-gray-600">{score.score}%</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* AI Recommendations Section - PROMINENTLY DISPLAYED */}
                    {evaluationResult && (
                      <Card className="border-amber-200 bg-amber-50/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center">
                            <Lightbulb className="h-4 w-4 mr-2 text-amber-600" />
                            AI Recommendations
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Training and coaching suggestions based on AI analysis
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            // Collect all recommendations from multiple sources
                            const allRecommendations: string[] = []
                            
                            // Source 1: Main trainingRecommendations
                            if (evaluationResult.trainingRecommendations && Array.isArray(evaluationResult.trainingRecommendations)) {
                              evaluationResult.trainingRecommendations.forEach((rec: string) => {
                                if (rec && rec.trim().length > 0) {
                                  allRecommendations.push(rec.trim())
                                }
                              })
                            }
                            
                            // Source 2: From competency scores
                            if (evaluationResult.competencyScores && Array.isArray(evaluationResult.competencyScores)) {
                              evaluationResult.competencyScores.forEach((score: any) => {
                                if (score.recommendations && Array.isArray(score.recommendations)) {
                                  score.recommendations.forEach((rec: string) => {
                                    if (rec && rec.trim().length > 0) {
                                      allRecommendations.push(`${score.category}: ${rec.trim()}`)
                                    }
                                  })
                                }
                              })
                            }
                            
                            // Remove duplicates
                            const uniqueRecs = [...new Set(allRecommendations)]
                            
                            if (uniqueRecs.length > 0) {
                              return (
                                <div className="space-y-2">
                                  {uniqueRecs.slice(0, 8).map((recommendation, idx) => (
                                    <div 
                                      key={idx}
                                      className="p-3 bg-white border border-amber-200 rounded-lg shadow-sm"
                                    >
                                      <div className="flex items-start">
                                        <Lightbulb className="h-4 w-4 mr-2 mt-0.5 text-amber-600 flex-shrink-0" />
                                        <p className="text-sm text-gray-800 flex-1">{recommendation}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )
                            } else {
                              return (
                                <div className="text-center py-4">
                                  <p className="text-sm text-gray-500">No specific recommendations available</p>
                                  <p className="text-xs text-gray-400 mt-1">Review competency scores for improvement areas</p>
                                </div>
                              )
                            }
                          })()}
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Evaluation Checklist
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {Object.values(checklistItems).filter(Boolean).length} / {Object.keys(checklistItems).length} completed
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="rounded"
                              checked={checklistItems["hand-hygiene"]}
                              onChange={(e) => setChecklistItems({...checklistItems, "hand-hygiene": e.target.checked})}
                            />
                            <span className="text-sm">Proper hand hygiene demonstrated</span>
                            <Badge variant="outline" className="text-xs">
                              Safety
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="rounded"
                              checked={checklistItems["patient-identification"]}
                              onChange={(e) => setChecklistItems({...checklistItems, "patient-identification": e.target.checked})}
                            />
                            <span className="text-sm">Patient identification verified</span>
                            <Badge variant="outline" className="text-xs">
                              Safety
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="rounded"
                              checked={checklistItems["communication"]}
                              onChange={(e) => setChecklistItems({...checklistItems, "communication": e.target.checked})}
                            />
                            <span className="text-sm">Clear communication with patient</span>
                            <Badge variant="outline" className="text-xs">
                              Communication
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="rounded"
                              checked={checklistItems["documentation"]}
                              onChange={(e) => setChecklistItems({...checklistItems, "documentation": e.target.checked})}
                            />
                            <span className="text-sm">Documentation completed accurately</span>
                            <Badge variant="outline" className="text-xs">
                              Documentation
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              className="rounded"
                              checked={checklistItems["equipment"]}
                              onChange={(e) => setChecklistItems({...checklistItems, "equipment": e.target.checked})}
                            />
                            <span className="text-sm">Equipment used properly</span>
                            <Badge variant="outline" className="text-xs">
                              Clinical Skills
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600">
                            Completed: {Object.values(checklistItems).filter(Boolean).length} / {Object.keys(checklistItems).length}
                          </p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setChecklistItems({
                                  "hand-hygiene": false,
                                  "patient-identification": false,
                                  "communication": false,
                                  "documentation": false,
                                  "equipment": false,
                                })
                              }}
                              className="text-xs"
                            >
                              Reset
                            </Button>
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
                      <Button 
                        variant="outline" 
                        className="w-full bg-transparent" 
                        onClick={() => handleGenerateReport("competency")}
                        disabled={isGeneratingReport || isLoadingEvaluations}
                      >
                        {isGeneratingReport ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate Report
                          </>
                        )}
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
                      <Button 
                        variant="outline" 
                        className="w-full bg-transparent" 
                        onClick={() => handleGenerateReport("performance")}
                        disabled={isGeneratingReport || isLoadingEvaluations}
                      >
                        {isGeneratingReport ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate Report
                          </>
                        )}
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
                      <Button 
                        variant="outline" 
                        className="w-full bg-transparent" 
                        onClick={() => handleGenerateReport("analytics")}
                        disabled={isGeneratingReport || isLoadingEvaluations}
                      >
                        {isGeneratingReport ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate Report
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Evaluation Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Evaluation Details</DialogTitle>
            <DialogDescription>Complete information about this evaluation</DialogDescription>
          </DialogHeader>
          {selectedEvaluation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Staff Member</Label>
                  <p className="font-medium">{selectedEvaluation.staffName}</p>
                </div>
                <div>
                  <Label>Role</Label>
                  <p className="font-medium">{selectedEvaluation.staffRole}</p>
                </div>
                <div>
                  <Label>Evaluation Type</Label>
                  <p className="font-medium capitalize">{selectedEvaluation.evaluationType}</p>
                </div>
                <div>
                  <Label>Assessment Type</Label>
                  <p className="font-medium capitalize">{selectedEvaluation.assessmentType.replace("-", " ")}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedEvaluation.status)}</div>
                </div>
                {selectedEvaluation.overallScore !== undefined && (
                  <div>
                    <Label>Overall Score</Label>
                    <p className="font-medium text-lg">{selectedEvaluation.overallScore}%</p>
                  </div>
                )}
                <div>
                  <Label>Evaluator</Label>
                  <p className="font-medium">{selectedEvaluation.evaluatorName}</p>
                </div>
                <div>
                  <Label>Completed Date</Label>
                  <p className="font-medium">
                    {selectedEvaluation.completedDate 
                      ? new Date(selectedEvaluation.completedDate).toLocaleDateString() 
                      : "N/A"}
                  </p>
                </div>
                {selectedEvaluation.nextDue && (
                  <div>
                    <Label>Next Due</Label>
                    <p className="font-medium">{new Date(selectedEvaluation.nextDue).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Close
                </Button>
                {selectedEvaluation.evaluationType === "competency" ? (
                  <Button onClick={() => router.push(`/staff-competency`)}>
                    View Full Details
                  </Button>
                ) : (
                  <Button onClick={() => router.push(`/self-evaluation`)}>
                    View Full Details
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Evaluation Dialog */}
      <Dialog open={isNewEvaluationOpen} onOpenChange={setIsNewEvaluationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Evaluation</DialogTitle>
            <DialogDescription>Choose the type of evaluation you want to create</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Evaluation Type</Label>
              <Select value={selectedEvaluationType} onValueChange={setSelectedEvaluationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select evaluation type" />
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
            <div>
              <Label>Staff Member</Label>
              <Select value={selectedStaffMember} onValueChange={setSelectedStaffMember} disabled={isLoadingStaff}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingStaff ? "Loading..." : "Select staff member"} />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} - {staff.role || staff.department || "Staff"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsNewEvaluationOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => {
                  handleStartEvaluation(true) // Skip dialog, navigate directly
                  setIsNewEvaluationOpen(false)
                }}
                disabled={!selectedStaffMember || !selectedEvaluationType}
              >
                Start Evaluation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Preview Dialog */}
      <Dialog open={showReportPreview} onOpenChange={setShowReportPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                {reportData?.type ? `${reportData.type.charAt(0).toUpperCase() + reportData.type.slice(1)} Report` : "Evaluation Report"}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportReport("csv")}
                  disabled={!reportData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportReport("json")}
                  disabled={!reportData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              Generated on {reportData?.generatedAt ? new Date(reportData.generatedAt).toLocaleString() : "N/A"} by {reportData?.generatedBy || "System"}
            </DialogDescription>
          </DialogHeader>
          {reportData && (
            <div className="space-y-6 py-4">
              {/* Summary Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Total Evaluations</p>
                    <p className="text-2xl font-bold text-blue-600">{reportData.summary.totalEvaluations}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold text-green-600">
                      {reportData.summary.averageScore > 0 ? `${reportData.summary.averageScore}%` : "N/A"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Needs Attention</p>
                    <p className="text-2xl font-bold text-red-600">{reportData.summary.needsAttention}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-purple-600">{reportData.summary.completedThisMonth}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Status Breakdown */}
              {Object.keys(reportData.statistics.byStatus).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(reportData.statistics.byStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium capitalize">{status.replace("-", " ")}</span>
                          <Badge>{count as number}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assessment Type Breakdown */}
              {Object.keys(reportData.statistics.byAssessmentType).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Assessment Type Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(reportData.statistics.byAssessmentType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium capitalize">{type.replace("-", " ")}</span>
                          <Badge>{count as number}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Evaluations List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Evaluation Details</CardTitle>
                  <CardDescription>{reportData.evaluations.length} evaluation(s) included in this report</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Staff Name</th>
                          <th className="text-left p-2">Role</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-right p-2">Score</th>
                          <th className="text-left p-2">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.evaluations.slice(0, 20).map((evaluation: any) => (
                          <tr key={evaluation.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">{evaluation.staffName}</td>
                            <td className="p-2">{evaluation.staffRole}</td>
                            <td className="p-2 capitalize">{evaluation.assessmentType.replace("-", " ")}</td>
                            <td className="p-2">{getStatusBadge(evaluation.status)}</td>
                            <td className="p-2 text-right">
                              {evaluation.overallScore !== undefined ? `${evaluation.overallScore}%` : "N/A"}
                            </td>
                            <td className="p-2">{evaluation.completedDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {reportData.evaluations.length > 20 && (
                      <p className="text-sm text-gray-500 mt-4 text-center">
                        Showing first 20 of {reportData.evaluations.length} evaluations. Export to view all.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowReportPreview(false)}>
                  Close
                </Button>
                <Button onClick={() => handleExportReport("csv")}>
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
                <Button onClick={() => handleExportReport("json")}>
                  <Download className="h-4 w-4 mr-2" />
                  Download JSON
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Standard Evaluation Dialog */}
      <Dialog open={isStandardEvaluationOpen} onOpenChange={setIsStandardEvaluationOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Start Standard Evaluation</DialogTitle>
            <DialogDescription>
              {selectedStaffMember && staffMembers.find(s => s.id === selectedStaffMember) && (
                <>Evaluating: <strong>{staffMembers.find(s => s.id === selectedStaffMember)?.name}</strong></>
              )}
              {selectedEvaluationType && (
                <> • Type: <strong>{selectedEvaluationType.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Standard evaluations can be completed using the form-based evaluation system.
              </p>
              <p className="text-sm text-blue-800 mt-2">
                Would you like to navigate to the evaluation form, or would you prefer to use the video evaluation feature on this page?
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={() => {
                  if (!selectedStaffMember || !selectedEvaluationType) {
                    toast({
                      title: "Missing Information",
                      description: "Please select both staff member and evaluation type",
                      variant: "destructive"
                    })
                    return
                  }

                  // Parse evaluation type (format: "competency-initial" or "performance-annual")
                  const parts = selectedEvaluationType.split("-")
                  if (parts.length < 2) {
                    toast({
                      title: "Invalid Evaluation Type",
                      description: "Please select a valid evaluation type",
                      variant: "destructive"
                    })
                    return
                  }

                  const evalType = parts[0] // "competency" or "performance"
                  const assessmentType = parts.slice(1).join("-") // "initial", "annual", "mid-year", etc.

                  if (evalType === "competency") {
                    // Navigate to staff-competency page with staffId parameter
                    router.push(`/staff-competency?staffId=${encodeURIComponent(selectedStaffMember)}&evaluationType=${encodeURIComponent(assessmentType)}`)
                  } else {
                    // Navigate to self-evaluation page with staffId and type parameters
                    router.push(`/self-evaluation?staffId=${encodeURIComponent(selectedStaffMember)}&type=${encodeURIComponent(assessmentType)}&evaluationType=performance`)
                  }
                  setIsStandardEvaluationOpen(false)
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Go to Evaluation Form
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsStandardEvaluationOpen(false)
                  // Switch to video evaluation tab
                  setActiveTab("video-evaluations")
                  toast({
                    title: "Switched to Video Evaluation",
                    description: "You can now use the video evaluation feature on this page",
                  })
                }}
              >
                <Video className="h-4 w-4 mr-2" />
                Use Video Evaluation Instead
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setIsStandardEvaluationOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
