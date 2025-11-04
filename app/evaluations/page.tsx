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
  const [error, setError] = useState<string | null>(null)

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
  const notesInputRef = useRef<HTMLInputElement>(null)

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

        // Load performance evaluations
        try {
          const perfRes = await fetch('/api/self-evaluations')
          if (perfRes.ok) {
            const perfData = await perfRes.json()
            if (perfData.evaluations && Array.isArray(perfData.evaluations)) {
              // Get staff names
              const staffIds = [...new Set(perfData.evaluations.map((e: any) => e.staff_id).filter(Boolean))]
              const staffRes = await fetch('/api/staff/list')
              const staffData = await staffRes.json()
              const staffMap = new Map((staffData.staff || []).map((s: any) => [s.id, s]))

              perfData.evaluations.forEach((evalRecord: any) => {
                const staffMember = staffMap.get(evalRecord.staff_id) as any
                const staffName = staffMember?.name || "Unknown Staff"
                const staffRole = staffMember?.role_id || staffMember?.department || "Staff"
                
                const overallScore = evalRecord.overall_score 
                  ? parseFloat(evalRecord.overall_score.toString()) 
                  : evalRecord.completion_percentage 
                    ? evalRecord.completion_percentage / 20 * 100 
                    : undefined

                let status: any = "in-progress"
                if (evalRecord.status === "approved") status = "excellent"
                else if (evalRecord.status === "submitted" && overallScore) {
                  if (overallScore >= 90) status = "excellent"
                  else if (overallScore >= 80) status = "good"
                  else if (overallScore >= 70) status = "satisfactory"
                  else if (overallScore >= 60) status = "needs-improvement"
                  else status = "unsatisfactory"
                } else if (evalRecord.status === "submitted") status = "in-progress"
                else status = "in-progress"

                allEvaluations.push({
                  id: evalRecord.id,
                  staffName,
                  staffRole,
                  evaluationType: "performance",
                  assessmentType: evalRecord.assessment_type || "annual",
                  status,
                  overallScore,
                  evaluatorName: evalRecord.approved_by_name || evalRecord.reviewer_name || "Supervisor",
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
                const overallScore = record.overallScore ? record.overallScore * 20 : undefined
                
                let status: any = "in-progress"
                if (record.status === "competent" && overallScore) {
                  if (overallScore >= 90) status = "excellent"
                  else if (overallScore >= 80) status = "good"
                  else status = "satisfactory"
                } else if (record.status === "needs-improvement") status = "needs-improvement"
                else if (record.status === "not-competent") status = "unsatisfactory"
                else status = "in-progress"

                allEvaluations.push({
                  id: record.id,
                  staffName: record.staffName || "Unknown Staff",
                  staffRole: record.staffRole || "Staff",
                  evaluationType: "competency",
                  assessmentType: record.evaluationType || "annual",
                  status,
                  overallScore,
                  evaluatorName: record.evaluatorName || "Supervisor",
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
        return <Badge className="bg-gray-100 text-gray-800">In Progress</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
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
      if (!r.completedDate) return false
      const completedDate = new Date(r.completedDate)
      const now = new Date()
      return completedDate.getMonth() === now.getMonth() && completedDate.getFullYear() === now.getFullYear()
    }).length

    const scoresWithValues = evaluationHistory.filter(r => r.overallScore !== undefined)
    const averageScore = scoresWithValues.length > 0
      ? scoresWithValues.reduce((sum, record) => sum + (record.overallScore || 0), 0) / scoresWithValues.length
      : 0

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

  const handleStartEvaluation = () => {
    if (!selectedStaffMember || !selectedEvaluationType) {
      alert("Please select both staff member and evaluation type")
      return
    }

    const [evalType, assessmentType] = selectedEvaluationType.split("-")
    
    if (evalType === "competency") {
      router.push(`/staff-competency`)
    } else {
      router.push(`/self-evaluation?staffId=${selectedStaffMember}&type=${assessmentType}`)
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

      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        setTimeout(async () => {
          if (videoRef.current) {
            console.log('Setting video srcObject...')
            videoRef.current.srcObject = stream
            try {
              await videoRef.current.play()
              console.log('Video playing successfully')
              toast({
                title: "Camera active",
                description: "Video feed is now live. Click 'Start Recording' to begin evaluation."
              })
            } catch (playError) {
              console.error("Error playing video:", playError)
              toast({
                title: "Camera started",
                description: "Camera active but playback may need user interaction. Try clicking Start Recording.",
                variant: "default"
              })
            }
          } else {
            console.warn('Video ref not ready, will be set by useEffect')
            // The useEffect will handle it when ref is ready
            toast({
              title: "Camera started",
              description: "Video feed is initializing..."
            })
          }
        }, 100)
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
    toast({
      title: "Camera stopped",
      description: "Video recording has been stopped"
    })
  }

  // Start recording and analysis
  const startRecording = async () => {
    if (!isLiveCameraActive || !videoRef.current || !canvasRef.current) {
      toast({
        title: "Error",
        description: "Please start the camera first",
        variant: "destructive"
      })
      return
    }

    setIsRecording(true)
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setAnalysisPhase("Initializing evaluation...")
    setAiInsights([])
    setEvaluationResult(null)

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) {
      toast({
        title: "Error",
        description: "Failed to initialize canvas",
        variant: "destructive"
      })
      setIsRecording(false)
      return
    }

    // Wait for video to be ready
    if (video.readyState < 2) {
      toast({
        title: "Waiting for video",
        description: "Please wait for video to load..."
      })
      
      const waitForVideo = () => {
        return new Promise<void>((resolve) => {
          if (video.readyState >= 2) {
            resolve()
          } else {
            video.addEventListener('loadedmetadata', () => resolve(), { once: true })
            video.addEventListener('canplay', () => resolve(), { once: true })
          }
        })
      }
      
      await waitForVideo()
    }

    // Set canvas dimensions to match video
    const videoWidth = video.videoWidth || 1280
    const videoHeight = video.videoHeight || 720
    canvas.width = videoWidth
    canvas.height = videoHeight
    console.log('Canvas dimensions set:', canvas.width, 'x', canvas.height)

    let frameCount = 0
    const analysisDuration = 60000 // 60 seconds
    const frameInterval = 5000 // Capture every 5 seconds
    const startTime = Date.now()

    const captureAndAnalyzeFrame = async () => {
      if (Date.now() - startTime > analysisDuration || !isRecording) {
        // Stop recording
        setIsRecording(false)
        setIsAnalyzing(false)
        setAnalysisPhase("Evaluation complete!")
        setAnalysisProgress(100)
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current)
        }
        return
      }

      try {
        // Check if video is ready
        if (video.readyState < 2) {
          console.warn('Video not ready, skipping frame')
          return
        }

        // Capture frame
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob: Blob | null) => {
            if (blob) resolve(blob)
          }, 'image/jpeg', 0.8)
        })

        frameCount++
        const progress = Math.min(90, 10 + (frameCount * 15))
        setAnalysisProgress(progress)
        setAnalysisPhase(`Analyzing frame ${frameCount}...`)

        // Send to OpenAI API for analysis
        const formData = new FormData()
        formData.append('staffId', selectedStaffMember)
        formData.append('evaluatorId', currentUser?.id || '')
        formData.append('evaluationType', 'live')
        
        const [evalType, assessmentType] = selectedEvaluationType.split("-")
        const competencyArea = evalType === "competency" ? assessmentType : "performance"
        formData.append('competencyArea', competencyArea)
        formData.append('duration', '10')
        formData.append('notes', `Live video evaluation - Frame ${frameCount}`)
        formData.append('frameImage', blob, `frame_${frameCount}.jpg`)
        formData.append('isLiveFrame', 'true')
        formData.append('frameNumber', frameCount.toString())

        const res = await fetch('/api/ai-competency/evaluate', {
          method: 'POST',
          body: formData
        })

        const result = await res.json()
        if (result.success && result.data) {
          // Check if this is real AI or mock
          if (result.message?.toLowerCase().includes('mock') || 
              (result.data.aiConfidence >= 88 && result.data.aiConfidence <= 98 && 
               result.data.strengths?.[0]?.includes('rapport'))) {
            // Likely mock analysis - show warning
            if (aiStatus !== 'mock') {
              setAiStatus('mock')
              setAiInsights(prev => [
                '⚠️ Using simulated AI analysis. Configure OpenAI for real analysis.',
                ...prev.filter(i => !i.includes('simulated'))
              ].slice(0, 10))
            }
          } else {
            // Real AI analysis
            if (aiStatus !== 'ready') {
              setAiStatus('ready')
            }
          }
          
          // Update live insights
          const insights = result.data.competencyScores?.slice(0, 2).map((score: any) => 
            `✅ ${score.category}: ${score.score}% (Confidence: ${score.confidence}%)`
          ) || []
          
          if (result.data.strengths && result.data.strengths.length > 0) {
            result.data.strengths.slice(0, 2).forEach((strength: string) => {
              if (!aiInsights.some(i => i.includes(strength))) {
                setAiInsights(prev => [...prev, `✅ ${strength}`].slice(0, 10))
              }
            })
          }

          // Update result
          if (frameCount === 1) {
            setEvaluationResult(result.data)
          } else {
            // Merge results
            setEvaluationResult((prev: any) => ({
              ...result.data,
              overallScore: Math.round((prev?.overallScore || 0 + result.data.overallScore) / 2),
              competencyScores: result.data.competencyScores?.map((newScore: any, idx: number) => {
                const prevScore = prev?.competencyScores?.[idx]
                if (prevScore) {
                  return {
                    ...newScore,
                    score: Math.round((prevScore.score + newScore.score) / 2),
                    confidence: Math.round((prevScore.confidence + newScore.confidence) / 2)
                  }
                }
                return newScore
              }) || []
            }))
          }
        }
      } catch (error) {
        console.error('Error analyzing frame:', error)
        setAiInsights(prev => [...prev, "⚠️ Analysis error for this frame"].slice(0, 10))
      }
    }

    // Start capturing frames
    await captureAndAnalyzeFrame()
    const interval = setInterval(captureAndAnalyzeFrame, frameInterval)
    recordingIntervalRef.current = interval

    // Auto-stop after duration
    setTimeout(() => {
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
      setAnalysisPhase("Finalizing evaluation...")
      
      // Finalize assessment
      setTimeout(async () => {
        try {
          const finalizeRes = await fetch('/api/ai-competency/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              staffId: selectedStaffMember,
              evaluatorId: currentUser?.id || null,
              evaluationType: 'live',
              competencyArea: selectedEvaluationType.split("-")[1] || "general",
              duration: analysisDuration / 1000,
              notes: `Live video evaluation completed - ${frameCount} frames analyzed`,
              finalizeAssessment: true,
              assessmentId: evaluationResult?.evaluationId
            })
          })
          
          const finalizeData = await finalizeRes.json()
          if (finalizeData.success) {
            setEvaluationResult(finalizeData.data)
            toast({
              title: "Evaluation Complete",
              description: `Assessment saved! Overall Score: ${finalizeData.data.overallScore}%`
            })
          }
        } catch (error) {
          console.error('Error finalizing assessment:', error)
        }
        
        setIsAnalyzing(false)
        setAnalysisProgress(100)
        setAnalysisPhase("✅ Evaluation complete!")
      }, 1000)
    }, analysisDuration)
  }

  // Stop recording
  const stopRecording = () => {
    setIsRecording(false)
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
    setAnalysisPhase("Recording stopped")
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
      video.srcObject = liveVideoStream
      
      // Wait for video to be ready
      const handleLoadedMetadata = () => {
        console.log('Video stream loaded successfully')
        video.play().catch((error) => {
          console.log('Video play error (may need user interaction):', error)
        })
      }
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      
      // Try to play immediately
      video.play().catch((error) => {
        console.log('Initial play error (will retry on loadedmetadata):', error)
      })
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    } else if (!liveVideoStream && videoRef.current) {
      // Clear video source when stream is stopped
      videoRef.current.srcObject = null
    }
  }, [liveVideoStream])

  const handleGenerateReport = async (type: "competency" | "performance" | "analytics") => {
    // Filter evaluations by type
    const filtered = type === "analytics" 
      ? evaluationHistory 
      : evaluationHistory.filter(e => e.evaluationType === type)
    
    // Create CSV content
    const headers = ["ID", "Staff Name", "Role", "Type", "Assessment Type", "Status", "Score", "Evaluator", "Completed Date", "Next Due"]
    const rows = filtered.map(e => [
      e.id,
      e.staffName,
      e.staffRole,
      e.evaluationType,
      e.assessmentType,
      e.status,
      e.overallScore?.toString() || "N/A",
      e.evaluatorName,
      e.completedDate,
      e.nextDue || "N/A"
    ])
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${type}-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
                      <p className="text-2xl font-bold text-yellow-600">{isLoadingEvaluations ? "..." : `${stats.averageScore}%`}</p>
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
                  onClick={handleStartEvaluation}
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
                    <div className="bg-black rounded-lg aspect-video flex items-center justify-center border-2 border-dashed border-gray-700 relative overflow-hidden">
                      {isLiveCameraActive ? (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-contain"
                            onLoadedMetadata={() => {
                              console.log('Video metadata loaded')
                              if (videoRef.current) {
                                videoRef.current.play().catch(err => {
                                  console.log('Play error (may need user interaction):', err)
                                })
                              }
                            }}
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
                        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                          {evaluationNotes.map((note, idx) => (
                            <div key={idx} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              {note}
                            </div>
                          ))}
                        </div>
                      )}
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
                        {isAnalyzing ? (
                          <div className="space-y-2">
                            {aiInsights.length > 0 ? (
                              aiInsights.map((insight, idx) => (
                                <div 
                                  key={idx}
                                  className={`p-2 border rounded text-xs ${
                                    insight.includes('✅') ? 'bg-green-50 border-green-200' :
                                    insight.includes('⚠️') ? 'bg-yellow-50 border-yellow-200' :
                                    'bg-blue-50 border-blue-200'
                                  }`}
                                >
                                  <span className={`font-medium ${
                                    insight.includes('✅') ? 'text-green-800' :
                                    insight.includes('⚠️') ? 'text-yellow-800' :
                                    'text-blue-800'
                                  }`}>
                                    {insight}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Analyzing video feed...</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-600 mb-4">AI analysis will appear during recording</p>
                            {evaluationResult && (
                              <div className="space-y-2">
                                <div className="p-2 bg-green-50 border border-green-200 rounded">
                                  <p className="text-xs font-medium text-green-800">
                                    Overall Score: {evaluationResult.overallScore}%
                                  </p>
                                  <p className="text-xs text-green-700">
                                    AI Confidence: {evaluationResult.aiConfidence}%
                                  </p>
                                </div>
                              </div>
                            )}
                          </>
                        )}
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
                          <p className="text-xs text-gray-600">
                            Completed: {Object.values(checklistItems).filter(Boolean).length} / {Object.keys(checklistItems).length}
                          </p>
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
                      <Button variant="outline" className="w-full bg-transparent" onClick={() => handleGenerateReport("competency")}>
                        <Download className="h-4 w-4 mr-2" />
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
                      <Button variant="outline" className="w-full bg-transparent" onClick={() => handleGenerateReport("performance")}>
                        <Download className="h-4 w-4 mr-2" />
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
                      <Button variant="outline" className="w-full bg-transparent" onClick={() => handleGenerateReport("analytics")}>
                        <Download className="h-4 w-4 mr-2" />
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
                  handleStartEvaluation()
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
    </div>
  )
}
