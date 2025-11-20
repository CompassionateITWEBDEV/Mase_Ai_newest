"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import PatientETAView from "@/components/patient-eta-view"
import {
  Calendar,
  Pill,
  MessageSquare,
  CreditCard,
  TestTube,
  User,
  Phone,
  MapPin,
  Heart,
  Activity,
  Download,
  Eye,
  Plus,
  Bell,
  Settings,
  HelpCircle,
  Shield,
  Navigation,
  Users,
  BookOpen,
  Dumbbell,
  FileCheck,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Bot,
  Video,
  Mic,
  Volume2,
  Scan,
  RefreshCw,
  Zap,
  Camera,
  QrCode,
  BarChart3,
  Upload,
  X,
  Edit,
  VideoIcon,
  Loader2,
} from "lucide-react"
import { DrugInteractionAlert } from "@/components/drug-interaction-alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function PatientPortal() {
  const [activeTab, setActiveTab] = useState("overview")
  const [exerciseTimer, setExerciseTimer] = useState(0)
  const [isExerciseActive, setIsExerciseActive] = useState(false)
  const [scanMode, setScanMode] = useState<"ocr" | "barcode">("barcode")
  const [isScanning, setIsScanning] = useState(false)
  const [scannedMedication, setScannedMedication] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [patientData, setPatientData] = useState<any>(null)
  const [assignedStaffId, setAssignedStaffId] = useState<string | null>(null)
  const [loadingPatient, setLoadingPatient] = useState(true)
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [careTeam, setCareTeam] = useState<any[]>([])
  const [loadingCareTeam, setLoadingCareTeam] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [schedulingAppointment, setSchedulingAppointment] = useState(false)
  const [availableStaff, setAvailableStaff] = useState<any[]>([])
  const [patientLocation, setPatientLocation] = useState<{lat: number, lng: number, accuracy?: number} | null>(null)
  const [sharingLocation, setSharingLocation] = useState(false)
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null)
  const [exerciseProgram, setExerciseProgram] = useState<any>(null)
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [hasExerciseProgram, setHasExerciseProgram] = useState(false)
  const [weeklyGoals, setWeeklyGoals] = useState<any[]>([])
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>("")
  const [currentExerciseName, setCurrentExerciseName] = useState<string>("")
  const [showVoiceGuide, setShowVoiceGuide] = useState(false)
  const [voiceScript, setVoiceScript] = useState<string>("")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [loadingVoiceScript, setLoadingVoiceScript] = useState(false)
  const [aiCoachMessage, setAiCoachMessage] = useState<string>("Hi! I'm your AI Exercise Coach. Complete an exercise or ask me a question to get started!")
  const [showAskQuestion, setShowAskQuestion] = useState(false)
  const [aiQuestion, setAiQuestion] = useState<string>("")
  const [loadingAiResponse, setLoadingAiResponse] = useState(false)
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [voiceRecorder, setVoiceRecorder] = useState<MediaRecorder | null>(null)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [transcribingAudio, setTranscribingAudio] = useState(false)
  const [showFormCheck, setShowFormCheck] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progressData, setProgressData] = useState<any>(null)
  const [loadingProgress, setLoadingProgress] = useState(false)
  const [completingExercise, setCompletingExercise] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { toast} = useToast()
  const [scheduleForm, setScheduleForm] = useState({
    date: "",
    time: "",
    visitType: "",
    staffId: "",
    notes: "",
    location: "Home Visit",
  })
  const [manualEntry, setManualEntry] = useState({
    name: "",
    dosage: "",
    strength: "",
    instructions: "",
    frequency: "",
    route: "",
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load patient data from localStorage (from login)
  useEffect(() => {
    const loadPatientData = async () => {
      try {
        const storedPatient = localStorage.getItem("currentPatient")
        if (storedPatient) {
          const patient = JSON.parse(storedPatient)
          setPatientData(patient)
          
          // Fetch full patient data including assigned staff
          if (patient.id) {
            const response = await fetch(`/api/patients?id=${patient.id}`)
            if (response.ok) {
              const data = await response.json()
              if (data.patients && data.patients.length > 0) {
                const fullPatient = data.patients[0]
                
                // Fetch full staff details if assigned staff ID exists
                let assignedStaffDetails = null
                if (fullPatient.assignedStaffId) {
                  setAssignedStaffId(fullPatient.assignedStaffId)
                  
                  // Fetch full staff details
                  const staffResponse = await fetch(`/api/staff/list`)
                  if (staffResponse.ok) {
                    const staffData = await staffResponse.json()
                    if (staffData.staff && staffData.staff.length > 0) {
                      assignedStaffDetails = staffData.staff.find((s: any) => s.id === fullPatient.assignedStaffId)
                    }
                  }
                } else if (fullPatient.assignedStaff && fullPatient.assignedStaff !== "Unassigned") {
                  // Try to get staff by name
                  const staffResponse = await fetch(`/api/staff/list`)
                  if (staffResponse.ok) {
                    const staffData = await staffResponse.json()
                    if (staffData.staff && staffData.staff.length > 0) {
                      assignedStaffDetails = staffData.staff.find((s: any) => 
                        s.name.toLowerCase().includes(fullPatient.assignedStaff.toLowerCase())
                      )
                      if (assignedStaffDetails) {
                        setAssignedStaffId(assignedStaffDetails.id)
                      }
                    }
                  }
                }
                
                // Fetch primary provider details if available
                let primaryProviderDetails = null
                if (fullPatient.primaryProviderId) {
                  const providerResponse = await fetch(`/api/staff/list`)
                  if (providerResponse.ok) {
                    const providerData = await providerResponse.json()
                    if (providerData.staff) {
                      primaryProviderDetails = providerData.staff.find((s: any) => s.id === fullPatient.primaryProviderId)
                    }
                  }
                }
                
                // Update patient data with primary provider details
                if (primaryProviderDetails) {
                  fullPatient.primaryProvider = primaryProviderDetails.name
                  fullPatient.primaryProviderData = {
                    id: primaryProviderDetails.id,
                    name: primaryProviderDetails.name,
                    role: primaryProviderDetails.credentials || primaryProviderDetails.department || "Primary Care Provider",
                    phone: primaryProviderDetails.phone_number || "",
                    email: primaryProviderDetails.email || "",
                    avatar: "/placeholder.svg",
                  }
                } else if (fullPatient.primaryProvider) {
                  // If we have provider name but no details
                  fullPatient.primaryProviderData = {
                    id: null,
                    name: fullPatient.primaryProvider,
                    role: "Primary Care Provider",
                    phone: "",
                    email: "",
                    avatar: "/placeholder.svg",
                  }
                }
                
                // Update patient data with assigned staff details
                if (assignedStaffDetails) {
                  fullPatient.assignedStaff = {
                    id: assignedStaffDetails.id,
                    name: assignedStaffDetails.name,
                    role: assignedStaffDetails.credentials || assignedStaffDetails.department || "Healthcare Provider",
                    phone: assignedStaffDetails.phone_number || "",
                    email: assignedStaffDetails.email || "",
                    avatar: "/placeholder.svg",
                  }
                } else if (fullPatient.assignedStaff && fullPatient.assignedStaff !== "Unassigned") {
                  // If we have staff name but no details
                  fullPatient.assignedStaff = {
                    id: null,
                    name: fullPatient.assignedStaff,
                    role: "Healthcare Provider",
                    phone: "",
                    email: "",
                    avatar: "/placeholder.svg",
                  }
                }
                
                // For tracking, use assigned staff (nurse) who does home visits
                // Primary provider (doctor) typically doesn't do home visits
                if (fullPatient.assignedStaffId) {
                  setAssignedStaffId(fullPatient.assignedStaffId)
                }
                
                setPatientData(fullPatient)
              }
            }
          }
        } else {
          // Fallback to mock data if no patient in localStorage
          setPatientData({
            name: "Sarah Johnson",
            dateOfBirth: "March 15, 1985",
            mrn: "MRN-2024-001",
            phone: "(555) 123-4567",
            email: "sarah.johnson@email.com",
            address: "123 Main St, Anytown, ST 12345",
            insurance: "Medicare + Blue Cross Blue Shield",
            primaryProvider: "Dr. Michael Chen",
            nextAppointment: {
              date: "2024-01-15",
              time: "10:30 AM",
              provider: "Dr. Michael Chen",
              type: "Follow-up Visit",
              location: "Home Visit",
            },
            assignedStaff: {
              id: "RN-2024-001",
              name: "Jennifer Martinez",
              role: "Registered Nurse",
              phone: "(555) 987-6543",
              avatar: "/professional-woman-diverse.png",
            },
          })
        }
      } catch (error) {
        console.error("Error loading patient data:", error)
        // Use mock data as fallback
        setPatientData({
          name: "Sarah Johnson",
          dateOfBirth: "March 15, 1985",
          mrn: "MRN-2024-001",
          phone: "(555) 123-4567",
          email: "sarah.johnson@email.com",
          address: "123 Main St, Anytown, ST 12345",
          insurance: "Medicare + Blue Cross Blue Shield",
          primaryProvider: "Dr. Michael Chen",
          nextAppointment: {
            date: "2024-01-15",
            time: "10:30 AM",
            provider: "Dr. Michael Chen",
            type: "Follow-up Visit",
            location: "Home Visit",
          },
          assignedStaff: {
            id: "RN-2024-001",
            name: "Jennifer Martinez",
            role: "Registered Nurse",
            phone: "(555) 987-6543",
            avatar: "/professional-woman-diverse.png",
          },
        })
      } finally {
        setLoadingPatient(false)
      }
    }

    loadPatientData()
  }, [])

  // Default patient data structure (will be replaced by real data)
  const defaultPatientData = {
    name: "Sarah Johnson",
    dateOfBirth: "March 15, 1985",
    mrn: "MRN-2024-001",
    phone: "(555) 123-4567",
    email: "sarah.johnson@email.com",
    address: "123 Main St, Anytown, ST 12345",
    insurance: "Medicare + Blue Cross Blue Shield",
    primaryProvider: "Dr. Michael Chen",
    nextAppointment: {
      date: "2024-01-15",
      time: "10:30 AM",
      provider: "Dr. Michael Chen",
      type: "Follow-up Visit",
      location: "Home Visit",
    },
    assignedStaff: {
      id: "RN-2024-001",
      name: "Jennifer Martinez",
      role: "Registered Nurse",
      phone: "(555) 987-6543",
      avatar: "/professional-woman-diverse.png",
    },
  }

  // Use patientData or default - ensure it's never null
  const currentPatientData = patientData || defaultPatientData
  
  // Ensure all nested properties exist
  if (!currentPatientData.assignedStaff) {
    currentPatientData.assignedStaff = defaultPatientData.assignedStaff
  }
  if (!currentPatientData.nextAppointment) {
    currentPatientData.nextAppointment = defaultPatientData.nextAppointment
  }

  // Fetch care team from API
  useEffect(() => {
    const fetchCareTeam = async () => {
      const patient = patientData || defaultPatientData
      if (!patient?.id) {
        setCareTeam([])
        return
      }

      setLoadingCareTeam(true)
      try {
        const response = await fetch(`/api/patients/${patient.id}/care-team`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.careTeam) {
            // Transform API data to match UI format
            const formattedCareTeam = data.careTeam.map((member: any) => ({
              id: member.id,
              staffId: member.staffId || member.staff?.id,
              name: member.staff?.name || "Unknown",
              role: member.role,
              specialty: member.specialty || member.staff?.department || "",
              phone: member.staff?.phone || member.staff?.phone_number || "",
              email: member.staff?.email || "",
              avatar: "/placeholder.svg?height=40&width=40",
              status: "Available", // Can be enhanced with real-time status
              lastContact: member.addedDate ? new Date(member.addedDate).toLocaleDateString() : "N/A",
              isPrimary: member.isPrimary,
              isAssignedStaff: member.isAssignedStaff,
              credentials: member.staff?.credentials || "",
            }))
            setCareTeam(formattedCareTeam)
          } else {
            setCareTeam([])
          }
        } else {
          setCareTeam([])
        }
      } catch (error) {
        console.error("Error fetching care team:", error)
        setCareTeam([])
      } finally {
        setLoadingCareTeam(false)
      }
    }

    if (!loadingPatient && patientData?.id) {
      fetchCareTeam()
      // Refresh care team every 30 seconds
      const interval = setInterval(fetchCareTeam, 30000)
      return () => clearInterval(interval)
    }
  }, [loadingPatient, patientData?.id])

  // Medicare Non-Coverage Consents
  const medicareConsents = [
    {
      id: 1,
      title: "Advanced Beneficiary Notice (ABN) - Physical Therapy",
      description: "Medicare may not cover extended physical therapy sessions beyond the standard limit",
      status: "Pending Signature",
      dueDate: "2024-01-20",
      estimatedCost: "$150-300 per session",
      signed: false,
    },
    {
      id: 2,
      title: "ABN - Durable Medical Equipment",
      description: "Medicare may not cover the upgraded wheelchair model requested",
      status: "Signed",
      dueDate: "2024-01-15",
      estimatedCost: "$2,500-4,000",
      signed: true,
      signedDate: "2024-01-10",
    },
    {
      id: 3,
      title: "ABN - Home Health Aide Services",
      description: "Medicare may not cover personal care services beyond medical necessity",
      status: "Under Review",
      dueDate: "2024-01-25",
      estimatedCost: "$25-35 per hour",
      signed: false,
    },
  ]

  // Patient Handbook Sections
  const handbookSections = [
    {
      id: 1,
      title: "Welcome to Home Healthcare",
      icon: Heart,
      description: "Introduction to your home healthcare journey",
      pages: 8,
      lastUpdated: "2024-01-01",
    },
    {
      id: 2,
      title: "Your Rights and Responsibilities",
      icon: Shield,
      description: "Understanding your healthcare rights",
      pages: 12,
      lastUpdated: "2024-01-01",
    },
    {
      id: 3,
      title: "Emergency Procedures",
      icon: AlertCircle,
      description: "What to do in case of emergency",
      pages: 6,
      lastUpdated: "2024-01-01",
    },
    {
      id: 4,
      title: "Medication Management",
      icon: Pill,
      description: "Safe medication practices at home",
      pages: 10,
      lastUpdated: "2024-01-01",
    },
    {
      id: 5,
      title: "Infection Control",
      icon: Shield,
      description: "Preventing infections in your home",
      pages: 8,
      lastUpdated: "2024-01-01",
    },
    {
      id: 6,
      title: "Equipment and Supplies",
      icon: Settings,
      description: "Using and maintaining medical equipment",
      pages: 14,
      lastUpdated: "2024-01-01",
    },
  ]

  // Fetch appointments from API
  useEffect(() => {
    const fetchAppointments = async () => {
      const patient = patientData || defaultPatientData
      if (!patient?.id && !patient?.name) return

      setLoadingAppointments(true)
      try {
        const params = new URLSearchParams()
        if (patient.id) {
          params.append("patient_id", patient.id)
        }
        if (patient.name) {
          params.append("patient_name", patient.name)
        }

        const response = await fetch(`/api/patients/appointments?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.appointments) {
            setUpcomingAppointments(data.appointments)
          }
        }
      } catch (error) {
        console.error("Error fetching appointments:", error)
        // Keep empty array on error
        setUpcomingAppointments([])
      } finally {
        setLoadingAppointments(false)
      }
    }

    if (!loadingPatient) {
      fetchAppointments()
      // Refresh appointments every 30 seconds
      const interval = setInterval(fetchAppointments, 30000)
      return () => clearInterval(interval)
    }
  }, [loadingPatient, patientData?.id, patientData?.name])

  // Reset form when dialog closes
  useEffect(() => {
    if (!showScheduleDialog) {
      // Reset form but keep assigned staff as default
      const assignedId = assignedStaffId || currentPatientData?.assignedStaff?.id || ""
      setScheduleForm({
        date: "",
        time: "",
        visitType: "",
        staffId: assignedId,
        notes: "",
        location: "Home Visit",
      })
    }
  }, [showScheduleDialog, assignedStaffId, currentPatientData?.assignedStaff?.id])

  // Use care team members as available staff when dialog opens
  useEffect(() => {
    if (!showScheduleDialog) return

    // Use care team members as available staff
    if (careTeam.length > 0) {
      const careTeamStaff = careTeam.map((member) => ({
        id: member.staffId,
        name: member.name,
        credentials: member.credentials,
        department: member.specialty || member.credentials,
        email: member.email,
        phone_number: member.phone,
      }))
      setAvailableStaff(careTeamStaff)
      
      // Pre-select assigned staff if available
      const assignedStaff = careTeam.find((member) => member.isAssignedStaff)
      if (assignedStaff && assignedStaff.staffId) {
        setScheduleForm(prev => ({ ...prev, staffId: assignedStaff.staffId }))
      }
    } else {
      // Fallback to assigned staff if no care team
      const assignedId = assignedStaffId || currentPatientData?.assignedStaff?.id
      if (assignedId) {
        const fetchAssignedStaff = async () => {
          try {
            const response = await fetch("/api/staff/list")
            if (response.ok) {
              const data = await response.json()
              if (data.staff) {
                const assignedStaff = data.staff.find((s: any) => s.id === assignedId)
                if (assignedStaff) {
                  setAvailableStaff([assignedStaff])
                  setScheduleForm(prev => ({ ...prev, staffId: assignedId }))
                } else {
                  setAvailableStaff([])
                }
              }
            }
          } catch (error) {
            console.error("Error fetching assigned staff:", error)
            setAvailableStaff([])
          }
        }
        fetchAssignedStaff()
      } else {
        setAvailableStaff([])
      }
    }
  }, [showScheduleDialog, careTeam, assignedStaffId, currentPatientData?.assignedStaff?.id])

  // Fetch PT exercise program
  const fetchExerciseProgram = async (patientId: string) => {
    try {
      setLoadingExercises(true)
      console.log('Fetching exercise program for patient:', patientId)
      
      const response = await fetch(`/api/patient-portal/exercises?patientId=${patientId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Exercise API error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch exercise program')
      }
      
      const data = await response.json()
      console.log('Exercise program data:', data)
      
      setHasExerciseProgram(data.hasProgram)
      
      if (data.hasProgram) {
        // Transform exercises data to match component structure
        const transformedProgram = {
          ...data.program,
          exercises: data.exercises.map((ex: any) => ({
            id: ex.id,
            name: ex.name,
            description: ex.description,
            duration: ex.duration,
            repetitions: ex.repetitions,
            sets: ex.sets,
            difficulty: ex.difficulty,
            videoUrl: ex.video_url,
            completed: ex.completed,
            aiTips: ex.ai_tips
          }))
        }
        setExerciseProgram(transformedProgram)
        setWeeklyGoals(data.weeklyGoals)
      } else {
        setExerciseProgram(null)
        setWeeklyGoals([])
      }
    } catch (error) {
      console.error('Error fetching exercise program:', error)
      toast({
        title: "Error Loading Exercises",
        description: "Could not load your exercise program. Please try again later.",
        variant: "destructive"
      })
      setHasExerciseProgram(false)
      setExerciseProgram(null)
      setWeeklyGoals([])
    } finally {
      setLoadingExercises(false)
    }
  }

  // Load exercises when patient data is available
  useEffect(() => {
    if (patientData?.id) {
      fetchExerciseProgram(patientData.id)
    }
  }, [patientData?.id])

  // Complete exercise function
  const completeExercise = async (exerciseId: string, exerciseName?: string) => {
    if (!patientData?.id || !exerciseProgram?.id) return

    try {
      setCompletingExercise(exerciseId)
      
      const response = await fetch('/api/patient-portal/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId,
          patientId: patientData.id,
          programId: exerciseProgram.id,
          durationSeconds: exerciseTimer,
          painLevel: null,
          notes: null
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Complete exercise error:', errorData)
        
        // If exercise not found (program was updated), refresh and show message
        if (response.status === 404) {
          await fetchExerciseProgram(patientData.id)
          toast({
            title: "Exercise List Updated",
            description: "Your program was updated. Please try again with the refreshed list.",
            variant: "default"
          })
          return
        }
        
        throw new Error(errorData.error || 'Failed to mark exercise as complete')
      }

      // Refresh exercise data
      await fetchExerciseProgram(patientData.id)

      toast({
        title: "Exercise Completed! 🎉",
        description: "Great job! Keep up the good work.",
      })

      // Get AI feedback after completing exercise (if exercise name provided)
      if (exerciseName) {
        await getAiFeedback(exerciseName)
      }

      // Reset timer
      setExerciseTimer(0)
      setIsExerciseActive(false)
    } catch (error: any) {
      console.error('Error completing exercise:', error)
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      })
      toast({
        title: "Error",
        description: error?.message || "Could not mark exercise as complete. Please try again.",
        variant: "destructive"
      })
    } finally {
      setCompletingExercise(null)
    }
  }

  // Toggle goal completion
  const toggleGoalCompletion = async (goalId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/patient-portal/exercises/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          completed: !currentStatus
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update goal')
      }

      // Update local state
      setWeeklyGoals(prev => 
        prev.map(goal => 
          goal.id === goalId 
            ? { ...goal, completed: !currentStatus, completed_at: !currentStatus ? new Date().toISOString() : null }
            : goal
        )
      )

      toast({
        title: !currentStatus ? "Goal Completed! 🎯" : "Goal Unchecked",
        description: !currentStatus ? "You're making great progress!" : "Goal marked as incomplete.",
      })
    } catch (error) {
      console.error('Error toggling goal:', error)
      toast({
        title: "Error",
        description: "Could not update goal. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Start voice guide
  const startVoiceGuide = async (exercise: any) => {
    try {
      setLoadingVoiceScript(true)
      setShowVoiceGuide(true)
      
      // Fetch voice script from API
      const response = await fetch('/api/patient-portal/exercises/voice-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseName: exercise.name,
          description: exercise.description,
          duration: exercise.duration,
          repetitions: exercise.repetitions,
          sets: exercise.sets,
          aiTips: exercise.aiTips
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate voice guide')
      }

      const data = await response.json()
      setVoiceScript(data.script)
      
      toast({
        title: "Voice Guide Ready! 🎤",
        description: "Click 'Start Voice Guide' to begin",
      })
    } catch (error) {
      console.error('Error loading voice guide:', error)
      toast({
        title: "Error",
        description: "Could not load voice guide. Please try again.",
        variant: "destructive"
      })
      setShowVoiceGuide(false)
    } finally {
      setLoadingVoiceScript(false)
    }
  }

  // Speak the voice guide
  const speakVoiceGuide = () => {
    if (!('speechSynthesis' in window)) {
      toast({
        title: "Not Supported",
        description: "Your browser doesn't support text-to-speech. Try Chrome, Edge, or Safari.",
        variant: "destructive"
      })
      return
    }

    // Stop any existing speech
    window.speechSynthesis.cancel()

    if (isSpeaking) {
      setIsSpeaking(false)
      return
    }

    // Wait for voices to load (important!)
    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(voiceScript)
      utterance.rate = 0.9 // Slightly slower for clarity
      utterance.pitch = 1.0
      utterance.volume = 1.0
      utterance.lang = 'en-US' // Set language explicitly

      // Try to use a good voice
      const voices = window.speechSynthesis.getVoices()
      
      if (voices.length > 0) {
        // Try to find a good English voice
        const preferredVoice = voices.find(voice => 
          (voice.lang.includes('en-US') || voice.lang.includes('en-GB')) &&
          (voice.name.includes('Google') || 
           voice.name.includes('Female') ||
           voice.name.includes('Samantha') ||
           voice.name.includes('Microsoft'))
        ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0]
        
        if (preferredVoice) {
          utterance.voice = preferredVoice
          console.log('Using voice:', preferredVoice.name)
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true)
        console.log('Speech started')
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        console.log('Speech ended')
        toast({
          title: "Voice Guide Complete! 🎉",
          description: "Great job! You can replay or close the guide.",
        })
      }

      utterance.onerror = (event) => {
        console.log('Speech error details:', event.error)
        setIsSpeaking(false)
        
        // Don't show error for 'interrupted' or 'canceled' (user actions)
        if (event.error === 'interrupted' || event.error === 'canceled') {
          return
        }
        
        // For other errors, show helpful message
        if (event.error === 'not-allowed') {
          toast({
            title: "Permission Needed",
            description: "Please allow audio playback and try again.",
            variant: "default"
          })
        } else if (event.error === 'network') {
          toast({
            title: "Network Error",
            description: "Check your internet connection and try again.",
            variant: "default"
          })
        } else {
          toast({
            title: "Playback Issue",
            description: "Try clicking the Start button again, or try a different browser.",
            variant: "default"
          })
        }
      }

      try {
        window.speechSynthesis.speak(utterance)
      } catch (error) {
        console.error('Speech synthesis error:', error)
        setIsSpeaking(false)
        toast({
          title: "Cannot Play Audio",
          description: "Please try a different browser or reload the page.",
          variant: "destructive"
        })
      }
    }

    // Ensure voices are loaded before speaking
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      speak()
    } else {
      // Wait for voices to load
      window.speechSynthesis.onvoiceschanged = () => {
        speak()
      }
      // Fallback timeout
      setTimeout(() => {
        if (!isSpeaking) {
          speak()
        }
      }, 100)
    }
  }

  // Stop voice guide
  const stopVoiceGuide = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  // Close voice guide
  const closeVoiceGuide = () => {
    stopVoiceGuide()
    setShowVoiceGuide(false)
    setVoiceScript("")
  }

  // Get AI feedback after completing exercise
  const getAiFeedback = async (exerciseName?: string) => {
    try {
      setLoadingAiResponse(true)
      
      const response = await fetch('/api/patient-portal/exercises/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'feedback',
          exerciseName: exerciseName || 'your exercise'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI feedback')
      }

      const data = await response.json()
      setAiCoachMessage(data.response)
      
      toast({
        title: "AI Coach Feedback! 🤖",
        description: "Check the AI Exercise Coach section",
      })
    } catch (error) {
      console.error('Error getting AI feedback:', error)
      setAiCoachMessage("Great job! Keep up the excellent work. Remember to focus on proper form and listen to your body. 💪")
    } finally {
      setLoadingAiResponse(false)
    }
  }

  // Start voice recording for question
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      const chunks: BlobPart[] = []
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        setRecordedAudioUrl(audioUrl)
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop())
        
        // Transcribe audio to text
        await transcribeAudio(audioBlob)
      }
      
      recorder.start()
      setVoiceRecorder(recorder)
      setIsRecordingVoice(true)
      
      toast({
        title: "Recording... 🎤",
        description: "Speak your question clearly",
      })
      
      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          stopVoiceRecording()
        }
      }, 30000)
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to record voice questions.",
        variant: "destructive"
      })
    }
  }

  // Stop voice recording
  const stopVoiceRecording = () => {
    if (voiceRecorder && voiceRecorder.state === 'recording') {
      voiceRecorder.stop()
      setIsRecordingVoice(false)
    }
  }

  // Transcribe audio to text using OpenAI Whisper
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setTranscribingAudio(true)
      
      toast({
        title: "Transcribing... 📝",
        description: "Converting your voice to text...",
      })
      
      const formData = new FormData()
      formData.append('audio', audioBlob, 'question.webm')
      formData.append('exerciseName', exerciseProgram?.exercises?.[0]?.name || 'exercises')
      
      const response = await fetch('/api/patient-portal/exercises/transcribe-question', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Transcription API Error:', errorData)
        throw new Error(errorData.error || 'Failed to transcribe audio')
      }

      const data = await response.json()
      
      if (!data.transcription) {
        throw new Error('No transcription returned')
      }
      
      // Set transcribed text and get AI answer
      setAiQuestion(data.transcription)
      
      toast({
        title: "Question Received! 🎤",
        description: "Getting AI answer...",
      })
      
      // Automatically ask AI with transcribed question
      await askAiCoachWithText(data.transcription)
      
    } catch (error: any) {
      console.error('Error transcribing audio:', error)
      
      // Check if it's an API key issue
      if (error.message && error.message.includes('API key')) {
        toast({
          title: "Setup Required",
          description: "OpenAI API key not configured. Please add OPENAI_API_KEY to .env.local",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Transcription Failed",
          description: "Could not convert voice to text. Please try typing instead or check your microphone.",
          variant: "destructive"
        })
      }
      
      // Reset state
      setRecordedAudioUrl(null)
    } finally {
      setTranscribingAudio(false)
    }
  }

  // Ask AI Coach a question (with text)
  const askAiCoachWithText = async (questionText: string) => {
    if (!questionText.trim()) {
      toast({
        title: "Enter a Question",
        description: "Please type or record your question first",
        variant: "default"
      })
      return
    }

    try {
      setLoadingAiResponse(true)
      
      const response = await fetch('/api/patient-portal/exercises/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'question',
          question: questionText,
          exerciseName: exerciseProgram?.exercises?.[0]?.name || 'your exercises'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI answer')
      }

      const data = await response.json()
      setAiCoachMessage(data.response)
      setAiQuestion("")
      setShowAskQuestion(false)
      setRecordedAudioUrl(null)
      
      toast({
        title: "AI Coach Answered! 🤖",
        description: "Check the response above",
      })
    } catch (error) {
      console.error('Error asking AI coach:', error)
      toast({
        title: "Error",
        description: "Could not get AI response. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoadingAiResponse(false)
    }
  }

  // Ask with current text question
  const askAiCoach = () => askAiCoachWithText(aiQuestion)

  // Start form check recording
  const startFormCheck = async () => {
    try {
      setShowFormCheck(true)
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 1280, height: 720 }, 
        audio: false 
      })
      
      setRecordingStream(stream)
      
      // Show preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      toast({
        title: "Camera Ready! 📸",
        description: "Position yourself and click 'Start Recording'",
      })
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to use Form Check. Check your browser settings.",
        variant: "destructive"
      })
      setShowFormCheck(false)
    }
  }

  // Start recording
  const startRecording = () => {
    if (!recordingStream) return
    
    try {
      const recorder = new MediaRecorder(recordingStream, {
        mimeType: 'video/webm;codecs=vp9'
      })
      
      const chunks: BlobPart[] = []
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const videoUrl = URL.createObjectURL(blob)
        setRecordedVideo(videoUrl)
        setRecordedBlob(blob)
        setIsRecording(false)
        
        toast({
          title: "Recording Complete! ✅",
          description: "Analyzing your form...",
        })
        
        // Auto-analyze the form with the blob directly
        await analyzeFormWithBlob(blob)
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      
      toast({
        title: "Recording Started! 🎥",
        description: "Perform your exercise now. Recording will stop automatically after 15 seconds.",
      })
      
      // Auto-stop after 15 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          stopRecording()
        }
      }, 15000)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: "Recording Error",
        description: "Could not start recording. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
  }

  // Extract frames from recorded video
  const extractVideoFrames = async (videoBlob: Blob): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      video.src = URL.createObjectURL(videoBlob)
      video.muted = true
      
      const frames: string[] = []
      let frameCount = 0
      const maxFrames = 10 // Extract 10 frames evenly distributed
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        const duration = video.duration
        const interval = duration / maxFrames
        
        const captureFrame = (time: number) => {
          video.currentTime = time
        }
        
        video.onseeked = () => {
          if (ctx && frameCount < maxFrames) {
            // Draw current frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            
            // Convert to base64 (compress to reduce size)
            const frameData = canvas.toDataURL('image/jpeg', 0.7)
            frames.push(frameData)
            
            frameCount++
            
            if (frameCount < maxFrames) {
              captureFrame(frameCount * interval)
            } else {
              URL.revokeObjectURL(video.src)
              resolve(frames)
            }
          }
        }
        
        video.onerror = () => {
          reject(new Error('Failed to extract frames'))
        }
        
        // Start capturing frames
        captureFrame(0)
      }
    })
  }

  // Analyze form with AI (REAL video analysis)
  const analyzeFormWithBlob = async (videoBlob: Blob) => {
    try {
      setLoadingAiResponse(true)

      toast({
        title: "Analyzing Video... 🎥",
        description: "Extracting frames and analyzing your form. This may take 10-20 seconds.",
      })
      
      // Extract frames from video
      console.log('Extracting frames from video...')
      const frames = await extractVideoFrames(videoBlob)
      console.log(`Extracted ${frames.length} frames`)
      
      const firstExercise = exerciseProgram?.exercises?.[0]
      const exerciseName = firstExercise?.name || 'your exercise'
      const exerciseDescription = firstExercise?.description || ''
      const repetitions = firstExercise?.repetitions || ''
      const sets = firstExercise?.sets || 1
      
      // Send frames to AI for analysis
      console.log('Sending frames to AI for analysis...')
      const apiResponse = await fetch('/api/patient-portal/exercises/analyze-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoFrames: frames,
          exerciseName: exerciseName,
          exerciseDescription: exerciseDescription,
          expectedReps: repetitions,
          expectedSets: sets
        })
      })

      if (!apiResponse.ok) {
        throw new Error('Failed to analyze form')
      }

      const data = await apiResponse.json()
      
      // Format the analysis for better display
      const formattedAnalysis = `📹 **Video Form Analysis**\n\n${data.analysis}\n\n---\n${data.fallback ? '⚠️ Using basic analysis. For AI-powered video analysis, configure OpenAI API key.' : '✅ Analyzed ' + data.framesAnalyzed + ' video frames using AI Vision'}`
      
      setAiCoachMessage(formattedAnalysis)
      
      toast({
        title: "Form Analysis Complete! ✅",
        description: "Detailed feedback ready in AI Coach section",
      })
    } catch (error) {
      console.error('Error analyzing form:', error)
      setAiCoachMessage("❌ Video analysis failed. Please try recording again, or consult your PT for form feedback. Basic tips: Maintain proper alignment, control your movements, and breathe normally throughout.")
      
      toast({
        title: "Analysis Error",
        description: "Could not analyze video. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoadingAiResponse(false)
    }
  }

  // Close form check
  const closeFormCheck = () => {
    // Stop recording if active
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
    
    // Stop camera stream
    if (recordingStream) {
      recordingStream.getTracks().forEach(track => track.stop())
      setRecordingStream(null)
    }
    
    // Clean up
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo)
    }
    
    setShowFormCheck(false)
    setIsRecording(false)
    setRecordedVideo(null)
    setRecordedBlob(null)
    setMediaRecorder(null)
  }

  // Get progress feedback with real data
  const getProgressFeedback = async () => {
    if (!exerciseProgram) return
    
    try {
      setLoadingProgress(true)
      setShowProgressModal(true)
      
      // Fetch real progress data from API
      const response = await fetch(`/api/patient-portal/exercises/progress?patientId=${patientData.id}&programId=${exerciseProgram.id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch progress')
      }

      const data = await response.json()
      console.log('[Track Progress] Received data:', {
        totalExercises: data.statistics?.totalExercises,
        completedExercises: data.statistics?.completedExercises,
        completionRate: data.statistics?.completionRate,
        currentStreak: data.statistics?.currentStreak,
        totalTimeSpent: data.statistics?.totalTimeSpentFormatted,
        totalCompletions: data.totalCompletions
      })
      setProgressData(data)
      
      // Also get AI feedback
      setLoadingAiResponse(true)
      const aiResponse = await fetch('/api/patient-portal/exercises/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'progress',
          completedExercises: data.statistics.completedExercises,
          totalExercises: data.statistics.totalExercises,
          progressData: `Week ${data.program.currentWeek} of ${data.program.totalWeeks}. Completion rate: ${data.statistics.completionRate}%. Streak: ${data.statistics.currentStreak} days. Consistency: ${data.statistics.consistencyScore}%`
        })
      })

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        setAiCoachMessage(aiData.response)
      }
      
    } catch (error) {
      console.error('Error fetching progress:', error)
      toast({
        title: "Error",
        description: "Could not load progress data. Please try again.",
        variant: "destructive"
      })
      setShowProgressModal(false)
    } finally {
      setLoadingProgress(false)
      setLoadingAiResponse(false)
    }
  }

  // Share patient's live location
  const sharePatientLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser does not support location sharing. Please use a device with GPS.",
        variant: "destructive"
      })
      return
    }

    setSharingLocation(true)

    const getAndShareLocation = async (position: GeolocationPosition) => {
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      }
      
      setPatientLocation(location)

      try {
        const res = await fetch('/api/patients/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: currentPatientData?.id,
            patientName: currentPatientData?.name,
            latitude: location.lat,
            longitude: location.lng,
            accuracy: location.accuracy
          })
        })

        const data = await res.json()
        if (data.success) {
          // Only show toast on first share, not on every update
          if (!locationWatchId) {
            console.log('✅ Location shared successfully:', {
              lat: location.lat,
              lng: location.lng,
              accuracy: location.accuracy,
              visitId: data.visitId
            })
          }
        } else {
          throw new Error(data.error || "Failed to share location")
        }
      } catch (e: any) {
        console.error('❌ Error sharing location:', e)
        // Only show error toast if it's a critical error, not on every update
        if (!locationWatchId || e.message?.includes('No scheduled appointment')) {
          toast({
            title: "Failed to Share Location",
            description: e.message || "Please try again",
            variant: "destructive"
          })
        }
      }
    }

    // Get initial location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await getAndShareLocation(position)
        
        // Start continuous location sharing with more frequent updates
        const watchId = navigator.geolocation.watchPosition(
          async (pos) => {
            // Only share if location changed significantly (at least 10 meters) or every 10 seconds
            const newLocation = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            }
            
            // Always update and share for accuracy
            await getAndShareLocation(pos)
          },
          (err) => {
            console.error('Location watch error:', err)
            toast({
              title: "Location Error",
              description: "Failed to update location. Please check your location permissions.",
              variant: "destructive"
            })
            setSharingLocation(false)
            setLocationWatchId(null)
          },
          { 
            enableHighAccuracy: true, // Use GPS for best accuracy
            timeout: 15000, // Allow more time for GPS to acquire
            maximumAge: 0 // Always get fresh location, don't use cached
          }
        )
        
        setLocationWatchId(watchId)
        setSharingLocation(false)
        
        // Show success message
        toast({
          title: "Location Sharing Started",
          description: "Your live location is being shared. Updates every few seconds.",
        })
      },
      (error) => {
        let errorMessage = "Failed to get location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser settings."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Please check your device GPS settings."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again."
            break
        }
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive"
        })
        setSharingLocation(false)
      },
      { 
        enableHighAccuracy: true, // Force GPS, not WiFi/IP
        timeout: 15000, // Allow more time
        maximumAge: 0 // Don't use cached location
      }
    )
  }

  // Stop sharing location
  const stopSharingLocation = () => {
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId)
      setLocationWatchId(null)
    }
    setPatientLocation(null)
    toast({
      title: "Location Sharing Stopped",
      description: "Your location is no longer being shared.",
    })
  }

  // Cleanup location watch on unmount
  useEffect(() => {
    return () => {
      if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId)
      }
    }
  }, [locationWatchId])

  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!scheduleForm.date || !scheduleForm.time || !scheduleForm.visitType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Date, Time, and Visit Type).",
        variant: "destructive",
      })
      return
    }

    // Validate patient data exists
    if (!currentPatientData || !currentPatientData.id || !currentPatientData.name) {
      toast({
        title: "Error",
        description: "Patient information is missing. Please refresh the page and try again.",
        variant: "destructive",
      })
      return
    }

    // Validate staff ID is available
    const finalStaffId = scheduleForm.staffId || assignedStaffId || currentPatientData.assignedStaff?.id
    if (!finalStaffId) {
      toast({
        title: "Validation Error",
        description: "No healthcare provider assigned. Please contact your care coordinator to assign a provider.",
        variant: "destructive",
      })
      return
    }

    setSchedulingAppointment(true)

    try {
      // Create scheduled datetime
      const scheduledDateTime = new Date(`${scheduleForm.date}T${scheduleForm.time}`)
      
      // Validate date is in the future
      if (scheduledDateTime <= new Date()) {
        toast({
          title: "Validation Error",
          description: "Please select a date and time in the future.",
          variant: "destructive",
        })
        setSchedulingAppointment(false)
        return
      }

      // Prepare request body with ALL form fields
      const requestBody = {
        patientId: currentPatientData.id,
        patientName: currentPatientData.name,
        patientAddress: scheduleForm.location && scheduleForm.location !== "Home Visit" 
          ? scheduleForm.location 
          : (currentPatientData.address || currentPatientData.location || scheduleForm.location || "Home Visit"),
        staffId: finalStaffId,
        scheduledTime: scheduledDateTime.toISOString(),
        visitType: scheduleForm.visitType,
        location: scheduleForm.location || "Home Visit", // Location field from form
        notes: scheduleForm.notes || null, // Notes from form
        // Ensure all fields are included
        date: scheduleForm.date,
        time: scheduleForm.time,
      }

      const response = await fetch("/api/patients/appointments/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error("Error parsing response:", jsonError)
        throw new Error("Invalid response from server")
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to schedule appointment (${response.status})`)
      }

      if (data.success) {
        toast({
          title: "Appointment Scheduled!",
          description: `Your ${scheduleForm.visitType} appointment has been successfully scheduled for ${new Date(scheduledDateTime).toLocaleDateString()} at ${new Date(scheduledDateTime).toLocaleTimeString()}.`,
        })

        // Close dialog (form will be reset by useEffect when dialog closes)
        setShowScheduleDialog(false)

        // Refresh appointments list
        const params = new URLSearchParams()
        if (currentPatientData.id) {
          params.append("patient_id", currentPatientData.id)
        }
        if (currentPatientData.name) {
          params.append("patient_name", currentPatientData.name)
        }

        try {
          const refreshResponse = await fetch(`/api/patients/appointments?${params.toString()}`)
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json()
            if (refreshData.success && refreshData.appointments) {
              setUpcomingAppointments(refreshData.appointments)
            }
          }
        } catch (refreshError) {
          console.error("Error refreshing appointments:", refreshError)
          // Don't show error to user - appointment was already scheduled
        }
      } else {
        throw new Error(data.error || "Failed to schedule appointment")
      }
    } catch (error: any) {
      console.error("Error scheduling appointment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to schedule appointment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSchedulingAppointment(false)
    }
  }

  const medications = [
    {
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Once daily",
      prescriber: "Dr. Michael Chen",
      refillsLeft: 2,
      lastFilled: "2024-01-01",
      genericName: "lisinopril",
    },
    {
      name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily",
      prescriber: "Dr. Michael Chen",
      refillsLeft: 1,
      lastFilled: "2023-12-28",
      genericName: "metformin",
    },
    {
      name: "Atorvastatin",
      dosage: "20mg",
      frequency: "Once daily at bedtime",
      prescriber: "Dr. Michael Chen",
      refillsLeft: 3,
      lastFilled: "2024-01-05",
      genericName: "atorvastatin",
    },
  ]

  const testResults = [
    {
      test: "Complete Blood Count",
      date: "2024-01-10",
      status: "Normal",
      provider: "Dr. Michael Chen",
    },
    {
      test: "Lipid Panel",
      date: "2024-01-10",
      status: "Abnormal - Follow up needed",
      provider: "Dr. Michael Chen",
    },
    {
      test: "HbA1c",
      date: "2024-01-08",
      status: "Normal",
      provider: "Dr. Michael Chen",
    },
  ]

  const messages = [
    {
      id: 1,
      from: "Dr. Michael Chen",
      subject: "Lab Results Available",
      date: "2024-01-12",
      preview: "Your recent lab results are now available for review...",
      unread: true,
    },
    {
      id: 2,
      from: "Jennifer Martinez, RN",
      subject: "Appointment Reminder",
      date: "2024-01-11",
      preview: "This is a reminder about your upcoming appointment...",
      unread: false,
    },
    {
      id: 3,
      from: "Billing Department",
      subject: "Insurance Update",
      date: "2024-01-10",
      preview: "We have received an update from your insurance...",
      unread: false,
    },
  ]

  const vitalSigns = [
    { metric: "Blood Pressure", value: "128/82", date: "2024-01-12", status: "normal" },
    { metric: "Heart Rate", value: "72 bpm", date: "2024-01-12", status: "normal" },
    { metric: "Temperature", value: "98.6°F", date: "2024-01-12", status: "normal" },
    { metric: "Weight", value: "165 lbs", date: "2024-01-10", status: "normal" },
    { metric: "Blood Sugar", value: "95 mg/dL", date: "2024-01-12", status: "normal" },
  ]

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please check permissions.")
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (context) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)

      canvas.toBlob(async (blob) => {
        if (blob) {
          await processMedicationImage(blob)
        }
      }, "image/jpeg")
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await processMedicationImage(file)
    }
  }

  const processMedicationImage = async (imageBlob: Blob) => {
    setIsProcessing(true)
    setScanProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const formData = new FormData()
      formData.append("image", imageBlob)
      formData.append("patientId", "patient-001")

      const response = await fetch("/api/nurse-scanner/scan-medication", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setScanProgress(100)
        setScannedMedication(data.medication)
        stopCamera()
      } else {
        throw new Error(data.message || "Failed to scan medication")
      }
    } catch (error) {
      console.error("Error processing medication:", error)
      alert("Failed to process medication. Please try again or enter manually.")
    } finally {
      setIsProcessing(false)
      setScanProgress(0)
    }
  }

  const submitManualEntry = async () => {
    if (!manualEntry.name || !manualEntry.dosage) {
      alert("Please fill in medication name and dosage.")
      return
    }

    const manualMedication = {
      id: `MAN-${Date.now()}`,
      name: manualEntry.name,
      dosage: manualEntry.dosage,
      strength: manualEntry.strength,
      ndc: "Manual Entry",
      manufacturer: "Unknown",
      instructions: manualEntry.instructions,
      sideEffects: [],
      interactions: [],
      contraindications: [],
      category: "Manual Entry",
      confidence: 100,
      scanTimestamp: new Date().toISOString(),
      scanMethod: "manual",
    }

    setScannedMedication(manualMedication)
    setManualEntry({ name: "", dosage: "", strength: "", instructions: "", frequency: "", route: "" })
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined = undefined

    if (isExerciseActive) {
      intervalId = setInterval(() => {
        setExerciseTimer((prevTimer) => prevTimer + 1)
      }, 1000)
    }

    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId)
      }
    }
  }, [isExerciseActive])

  // Show loading state while patient data is being fetched
  if (loadingPatient && !patientData) {
    return (
      <>
        <Toaster />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading patient portal...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl blur-sm opacity-50"></div>
                  <div className="relative p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                    <Heart className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Patient Portal
                  </h1>
                  <p className="text-sm text-gray-600 mt-0.5">Welcome back, <span className="font-semibold text-gray-900">{currentPatientData.name}</span></p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="relative hover:bg-blue-50 hover:border-blue-300 transition-all">
                <Bell className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Notifications</span>
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
              </Button>
              <Button variant="outline" size="sm" className="hover:bg-purple-50 hover:border-purple-300 transition-all">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Avatar className="ring-2 ring-blue-200 hover:ring-blue-400 transition-all cursor-pointer">
                <AvatarImage src="/professional-woman-diverse.png" />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">SJ</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-11 lg:w-auto lg:grid-cols-none lg:flex bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-md rounded-xl p-1.5">
            <TabsTrigger value="overview" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="care-team" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Care Team</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Appointments</span>
            </TabsTrigger>
            <TabsTrigger value="medications" className="flex items-center space-x-2">
              <Pill className="h-4 w-4" />
              <span className="hidden sm:inline">Medications</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center space-x-2">
              <TestTube className="h-4 w-4" />
              <span className="hidden sm:inline">Test Results</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="consents" className="flex items-center space-x-2">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Consents</span>
            </TabsTrigger>
            <TabsTrigger value="handbook" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Handbook</span>
            </TabsTrigger>
            <TabsTrigger value="exercises" className="flex items-center space-x-2">
              <Dumbbell className="h-4 w-4" />
              <span className="hidden sm:inline">PT Exercises</span>
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center space-x-2">
              <Navigation className="h-4 w-4" />
              <span className="hidden sm:inline">Provider Tracking</span>
            </TabsTrigger>
            <TabsTrigger value="med-scanner" className="flex items-center space-x-2">
              <Scan className="h-4 w-4" />
              <span className="hidden sm:inline">Med Scanner</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient Info Card */}
              <Card className="lg:col-span-2 border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200/50">
                  <CardTitle className="flex items-center text-xl">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-3">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50/50 to-transparent hover:from-blue-100/50 transition-all">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Full Name</p>
                      <p className="text-lg font-semibold text-gray-900">{currentPatientData.name}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50/50 to-transparent hover:from-purple-100/50 transition-all">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Date of Birth</p>
                      <p className="text-lg font-semibold text-gray-900">{currentPatientData.dateOfBirth || currentPatientData.dateOfBirth}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50/50 to-transparent hover:from-indigo-100/50 transition-all">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Medical Record Number</p>
                      <p className="text-lg font-semibold text-gray-900 font-mono">{currentPatientData.medicalRecordNumber || currentPatientData.mrn}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-pink-50/50 to-transparent hover:from-pink-100/50 transition-all">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Primary Provider</p>
                      {(() => {
                        const primaryProvider = careTeam.find((member) => member.isPrimary)
                        return (
                          <>
                            <p className="text-lg font-semibold text-gray-900">
                              {primaryProvider?.name || currentPatientData.primaryProvider || currentPatientData.primaryProviderData?.name || "No Provider Assigned"}
                            </p>
                            {(primaryProvider?.role || currentPatientData.primaryProviderData?.role) && (
                              <p className="text-xs text-gray-500 mt-1">
                                {primaryProvider?.role || currentPatientData.primaryProviderData?.role}
                              </p>
                            )}
                          </>
                        )
                      })()}
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50/50 to-transparent hover:from-indigo-100/50 transition-all">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Assigned Staff</p>
                      {(() => {
                        const assignedStaff = careTeam.find((member) => member.isAssignedStaff)
                        return (
                          <>
                            <p className="text-lg font-semibold text-gray-900">
                              {assignedStaff?.name || currentPatientData.assignedStaff?.name || currentPatientData.assignedStaff || "No Staff Assigned"}
                            </p>
                            {(assignedStaff?.role || currentPatientData.assignedStaff?.role) && (
                              <p className="text-xs text-gray-500 mt-1">
                                {assignedStaff?.role || currentPatientData.assignedStaff?.role}
                              </p>
                            )}
                          </>
                        )
                      })()}
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-50/50 to-transparent hover:from-cyan-100/50 transition-all">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Phone</p>
                      <p className="text-lg font-semibold text-gray-900">{currentPatientData.phoneNumber || currentPatientData.phone}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-teal-50/50 to-transparent hover:from-teal-100/50 transition-all">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Insurance</p>
                      <p className="text-lg font-semibold text-gray-900">{currentPatientData.insurance || "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Appointment Card */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-xl text-white">
                    <Calendar className="h-5 w-5 mr-2" />
                    Next Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {(() => {
                    // Get the next upcoming appointment (first one in sorted array that is future or in-progress)
                    const now = new Date()
                    const nextAppointment = upcomingAppointments.length > 0 
                      ? upcomingAppointments.find((apt: any) => {
                          // Prioritize in-progress appointments
                          if (apt.status === 'In Progress') return true
                          
                          // Then get future appointments (scheduled, confirmed, or pending)
                          const aptDateTime = new Date(`${apt.date} ${apt.time}`)
                          // Include if scheduled in future or today
                          if (aptDateTime >= now || aptDateTime.toDateString() === now.toDateString()) {
                            return apt.status === 'Scheduled' || apt.status === 'Confirmed' || apt.status === 'Pending'
                          }
                          return false
                        }) || null
                      : null

                    if (!nextAppointment) {
                      return (
                        <div className="space-y-4">
                          <div className="p-4 bg-white/60 rounded-lg border border-blue-100 text-center">
                            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-lg font-semibold text-gray-700">No upcoming appointment</p>
                            <p className="text-sm text-gray-500 mt-1">Schedule a visit to see it here</p>
                          </div>
                          <Button 
                            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                            onClick={() => setShowScheduleDialog(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Schedule Appointment
                          </Button>
                        </div>
                      )
                    }

                    const appointmentDate = new Date(`${nextAppointment.date} ${nextAppointment.time}`)
                    const isToday = appointmentDate.toDateString() === new Date().toDateString()
                    const isInProgress = nextAppointment.status === 'In Progress'

                    return (
                      <div className="space-y-4">
                        <div className="p-4 bg-white/60 rounded-lg border border-blue-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Date & Time</p>
                          <p className="text-xl font-bold text-gray-900">
                            {isToday 
                              ? "Today" 
                              : appointmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                            }
                          </p>
                          <p className="text-lg font-semibold text-blue-600">{nextAppointment.time}</p>
                          {isInProgress && (
                            <Badge className="mt-2 bg-green-500 hover:bg-green-600 text-white">In Progress</Badge>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Provider (Home Visit)</p>
                            {(() => {
                              const assignedStaff = careTeam.find((member) => member.isAssignedStaff)
                              const providerName = nextAppointment.provider || assignedStaff?.name || currentPatientData.assignedStaff?.name || currentPatientData.assignedStaff || "No Staff Assigned"
                              return (
                                <>
                                  <p className="text-base font-medium text-gray-900">{providerName}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">Staff member who will perform the visit</p>
                                </>
                              )
                            })()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Type</p>
                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">{nextAppointment.type || "Home Visit"}</Badge>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</p>
                            <p className="text-base font-medium text-gray-900 flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-blue-500" />
                              {nextAppointment.location || currentPatientData.location || "Home Visit"}
                            </p>
                          </div>
                        </div>
                        <Button 
                          className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                          onClick={() => setActiveTab("tracking")}
                          disabled={!nextAppointment.staffId && !assignedStaffId && !currentPatientData.assignedStaff?.id}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Track Provider
                        </Button>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* Recent Vital Signs */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200/50">
                <CardTitle className="flex items-center text-xl">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  Recent Vital Signs
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {vitalSigns.map((vital, index) => (
                    <div key={index} className="text-center p-5 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200/50 hover:shadow-lg hover:border-blue-300 transition-all duration-300 hover:-translate-y-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{vital.metric}</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">{vital.value}</p>
                      <p className="text-xs text-gray-500 mb-3">{vital.date}</p>
                      <Badge 
                        variant={vital.status === "normal" ? "default" : "destructive"} 
                        className={`mt-2 ${vital.status === "normal" ? "bg-green-100 text-green-700 hover:bg-green-200" : ""}`}
                      >
                        {vital.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="cursor-pointer border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">Send Message</h3>
                  <p className="text-sm text-gray-600">Contact your provider</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Pill className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">Request Refill</h3>
                  <p className="text-sm text-gray-600">Refill medications</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">Schedule Visit</h3>
                  <p className="text-sm text-gray-600">Book appointment</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-100/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex p-4 bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <TestTube className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900">View Results</h3>
                  <p className="text-sm text-gray-600">Check lab results</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Care Team Tab */}
          <TabsContent value="care-team" className="space-y-8">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200/50">
                <CardTitle className="flex items-center text-2xl">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg mr-3">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  Your Healthcare Team
                </CardTitle>
                <CardDescription className="text-base mt-2">Meet the professionals dedicated to your care</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loadingCareTeam ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mr-3" />
                    <span className="text-gray-600">Loading care team...</span>
                  </div>
                ) : careTeam.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600 text-lg mb-2">No care team members assigned</p>
                    <p className="text-gray-500 text-sm">
                      Your care team will appear here once assigned
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {careTeam.map((member) => (
                      <Card key={member.id} className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4 mb-5">
                            <Avatar className="h-16 w-16 ring-4 ring-blue-100">
                              <AvatarImage src={member.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg">
                                {member.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg text-gray-900">{member.name}</h3>
                                {member.isPrimary && (
                                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-xs">
                                    Primary
                                  </Badge>
                                )}
                                {member.isAssignedStaff && (
                                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">
                                    Assigned
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm font-medium text-gray-700">{member.role}</p>
                              {member.specialty && (
                                <p className="text-xs text-gray-500 mt-0.5">{member.specialty}</p>
                              )}
                              {member.credentials && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {member.credentials}
                                </Badge>
                              )}
                            </div>
                            <Badge
                              variant={
                                member.status === "Available"
                                  ? "default"
                                  : member.status === "On Route"
                                    ? "secondary"
                                    : "outline"
                              }
                              className={`text-xs font-semibold ${
                                member.status === "Available"
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : member.status === "On Route"
                                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                    : ""
                              }`}
                            >
                              {member.status}
                            </Badge>
                          </div>

                          <div className="space-y-3 mb-5 p-4 bg-gray-50/50 rounded-lg">
                            {member.phone && (
                              <div className="flex items-center text-sm text-gray-700">
                                <div className="p-1.5 bg-blue-100 rounded-lg mr-3">
                                  <Phone className="h-3.5 w-3.5 text-blue-600" />
                                </div>
                                <a href={`tel:${member.phone}`} className="font-medium hover:text-blue-600">
                                  {member.phone}
                                </a>
                              </div>
                            )}
                            {member.email && (
                              <div className="flex items-center text-sm text-gray-700">
                                <div className="p-1.5 bg-purple-100 rounded-lg mr-3">
                                  <MessageSquare className="h-3.5 w-3.5 text-purple-600" />
                                </div>
                                <a href={`mailto:${member.email}`} className="font-medium truncate hover:text-purple-600">
                                  {member.email}
                                </a>
                              </div>
                            )}
                            <div className="flex items-center text-sm text-gray-600">
                              <div className="p-1.5 bg-gray-200 rounded-lg mr-3">
                                <Clock className="h-3.5 w-3.5 text-gray-600" />
                              </div>
                              <span>Added: {member.lastContact}</span>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={`flex-1 font-semibold transition-all ${
                                member.phone 
                                  ? "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800 hover:shadow-md" 
                                  : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                              }`}
                              onClick={() => {
                                if (member.phone) {
                                  window.location.href = `tel:${member.phone}`
                                }
                              }}
                              disabled={!member.phone}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              {member.phone ? "Call" : "No Phone"}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className={`flex-1 font-semibold transition-all ${
                                member.email 
                                  ? "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 hover:text-purple-800 hover:shadow-md" 
                                  : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                              }`}
                              onClick={() => {
                                if (member.email) {
                                  window.location.href = `mailto:${member.email}`
                                }
                              }}
                              disabled={!member.email}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {member.email ? "Message" : "No Email"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medicare Consents Tab */}
          <TabsContent value="consents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileCheck className="h-5 w-5 mr-2" />
                  Medicare Non-Coverage Consents
                </CardTitle>
                <CardDescription>
                  Review and sign Advanced Beneficiary Notices (ABN) for services that Medicare may not cover
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {medicareConsents.map((consent) => (
                    <Card
                      key={consent.id}
                      className={`border-l-4 ${
                        consent.status === "Pending Signature"
                          ? "border-l-orange-500 bg-orange-50"
                          : consent.status === "Signed"
                            ? "border-l-green-500 bg-green-50"
                            : "border-l-blue-500 bg-blue-50"
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="font-medium text-lg mb-2">{consent.title}</h3>
                            <p className="text-gray-600 mb-3">{consent.description}</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="font-medium text-gray-500">Status</p>
                                <Badge
                                  variant={
                                    consent.status === "Pending Signature"
                                      ? "destructive"
                                      : consent.status === "Signed"
                                        ? "default"
                                        : "secondary"
                                  }
                                >
                                  {consent.status}
                                </Badge>
                              </div>
                              <div>
                                <p className="font-medium text-gray-500">Due Date</p>
                                <p>{consent.dueDate}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-500">Estimated Cost</p>
                                <p className="font-medium text-red-600">{consent.estimatedCost}</p>
                              </div>
                            </div>
                            {consent.signed && consent.signedDate && (
                              <div className="mt-3 text-sm">
                                <p className="font-medium text-gray-500">Signed Date</p>
                                <p className="text-green-600">{consent.signedDate}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </Button>
                          {!consent.signed && (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <FileCheck className="h-4 w-4 mr-2" />
                              Sign Electronically
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patient Handbook Tab */}
          <TabsContent value="handbook" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Patient Handbook
                </CardTitle>
                <CardDescription>Your comprehensive guide to home healthcare services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {handbookSections.map((section) => (
                    <Card key={section.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <section.icon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{section.title}</h3>
                            <p className="text-sm text-gray-500">{section.pages} pages</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{section.description}</p>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-500">Updated: {section.lastUpdated}</p>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            Read
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PT Exercises Tab */}
          <TabsContent value="exercises" className="space-y-6">
            {loadingExercises ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your exercise program...</p>
                  </div>
                </CardContent>
              </Card>
            ) : !hasExerciseProgram ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Dumbbell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Exercise Program Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Your physical therapist hasn't assigned an exercise program yet.
                    </p>
                    <p className="text-sm text-gray-500">
                      Once your PT assigns exercises, they will appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Progress Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Dumbbell className="h-5 w-5 mr-2" />
                        {exerciseProgram.programName || 'Home Exercise Program Progress'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {exerciseProgram.currentWeek}/{exerciseProgram.totalWeeks}
                          </p>
                          <p className="text-sm text-gray-500">Weeks Completed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {exerciseProgram.completedSessions}/{exerciseProgram.totalSessions}
                          </p>
                          <p className="text-sm text-gray-500">Sessions Done</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {Math.round((exerciseProgram.completedSessions / exerciseProgram.totalSessions) * 100)}%
                          </p>
                          <p className="text-sm text-gray-500">Progress</p>
                        </div>
                      </div>
                      <Progress
                        value={(exerciseProgram.completedSessions / exerciseProgram.totalSessions) * 100}
                        className="mb-4"
                      />
                      <p className="text-sm text-gray-600">Next session scheduled: {exerciseProgram.nextSession}</p>
                    </CardContent>
                  </Card>

                  {/* Exercise List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Today's Exercises</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {exerciseProgram.exercises.map((exercise: any) => (
                        <Card
                          key={exercise.id}
                          className={`border-l-4 ${exercise.completed ? "border-l-green-500 bg-green-50" : "border-l-blue-500"}`}
                        >
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="font-medium text-lg">{exercise.name}</h3>
                                  {exercise.completed && <CheckCircle className="h-5 w-5 text-green-600" />}
                                  <Badge
                                    variant={
                                      exercise.difficulty === "Easy"
                                        ? "default"
                                        : exercise.difficulty === "Moderate"
                                          ? "secondary"
                                          : "destructive"
                                    }
                                  >
                                    {exercise.difficulty}
                                  </Badge>
                                </div>
                                <p className="text-gray-600 mb-3">{exercise.description}</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                                  <div>
                                    <p className="font-medium text-gray-500">Duration</p>
                                    <p>{exercise.duration}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-500">Repetitions</p>
                                    <p>{exercise.repetitions}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-500">Sets</p>
                                    <p>{exercise.sets}</p>
                                  </div>
                                </div>

                                {/* AI Tips */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                  <div className="flex items-start space-x-2">
                                    <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div>
                                      <p className="font-medium text-blue-800 text-sm">AI Coach Tips</p>
                                      <p className="text-blue-700 text-sm">{exercise.aiTips}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  if (exercise.videoUrl) {
                                    setCurrentVideoUrl(exercise.videoUrl)
                                    setCurrentExerciseName(exercise.name)
                                    setShowVideoModal(true)
                                  } else {
                                    toast({
                                      title: "Video Not Available",
                                      description: "No demonstration video has been uploaded for this exercise yet.",
                                      variant: "default"
                                    })
                                  }
                                }}
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Watch Video
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => startVoiceGuide(exercise)}
                              >
                                <Mic className="h-4 w-4 mr-2" />
                                Voice Guide
                              </Button>
                              {!exercise.completed && (
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => completeExercise(exercise.id, exercise.name)}
                                  disabled={completingExercise === exercise.id}
                                >
                                  {completingExercise === exercise.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Completing...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark Complete
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Assistant Sidebar */}
              <div className="space-y-6">
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-purple-800">
                      <Bot className="h-5 w-5 mr-2" />
                      AI Exercise Coach
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* AI Message */}
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        {loadingAiResponse ? (
                          <div className="flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                            <p className="text-sm text-gray-600">AI Coach is thinking...</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start space-x-3 mb-3">
                              <Bot className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                {aiCoachMessage}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Ask Question Interface */}
                      {showAskQuestion ? (
                        <div className="bg-white rounded-lg p-4 space-y-3">
                          <Label htmlFor="ai-question" className="text-sm font-medium">
                            Ask your AI Coach:
                          </Label>
                          
                          {/* Voice Recording Area */}
                          {isRecordingVoice || recordedAudioUrl ? (
                            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                              {isRecordingVoice ? (
                                <div className="flex items-center justify-center space-x-3">
                                  <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
                                  <span className="text-sm font-medium text-gray-700">Recording your question...</span>
                                  <Button size="sm" variant="outline" onClick={stopVoiceRecording}>
                                    Stop
                                  </Button>
                                </div>
                              ) : transcribingAudio ? (
                                <div className="flex items-center justify-center space-x-3">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                                  <span className="text-sm text-gray-700">Transcribing your voice...</span>
                                </div>
                              ) : recordedAudioUrl ? (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="text-sm font-medium text-gray-700">Voice recorded!</span>
                                  </div>
                                  {aiQuestion && (
                                    <div className="bg-white rounded p-2 text-sm text-gray-600">
                                      "{aiQuestion}"
                                    </div>
                                  )}
                                  <audio src={recordedAudioUrl} controls className="w-full" />
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <>
                              <Input
                                id="ai-question"
                                placeholder="e.g., How do I know if I'm doing the ankle pumps correctly?"
                                value={aiQuestion}
                                onChange={(e) => setAiQuestion(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    askAiCoach()
                                  }
                                }}
                                disabled={transcribingAudio || loadingAiResponse}
                              />
                              <div className="flex items-center space-x-2">
                                <div className="h-px flex-1 bg-gray-200"></div>
                                <span className="text-xs text-gray-500">or</span>
                                <div className="h-px flex-1 bg-gray-200"></div>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                                onClick={startVoiceRecording}
                                disabled={transcribingAudio || loadingAiResponse}
                              >
                                <Mic className="h-4 w-4 mr-2" />
                                Record Voice Question
                              </Button>
                            </>
                          )}
                          
                          <div className="flex space-x-2">
                            {!isRecordingVoice && !transcribingAudio && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                                  onClick={askAiCoach}
                                  disabled={loadingAiResponse || !aiQuestion.trim()}
                                >
                                  Send Question
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setShowAskQuestion(false)
                                    setAiQuestion("")
                                    setRecordedAudioUrl(null)
                                    setIsRecordingVoice(false)
                                  }}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full"
                          onClick={() => setShowAskQuestion(true)}
                        >
                          <Mic className="h-4 w-4 mr-2" />
                          Ask Voice Question
                        </Button>
                      )}

                      {/* AI Coach Actions */}
                      <div className="space-y-2">
                        <Button 
                          className="w-full bg-purple-600 hover:bg-purple-700" 
                          size="sm"
                          onClick={() => getAiFeedback(exerciseProgram?.exercises?.[0]?.name)}
                          disabled={loadingAiResponse}
                        >
                          <Bot className="h-4 w-4 mr-2" />
                          Get AI Feedback
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full bg-transparent" 
                          size="sm"
                          onClick={startFormCheck}
                          disabled={loadingAiResponse}
                        >
                          <VideoIcon className="h-4 w-4 mr-2" />
                          Form Check
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full bg-transparent" 
                          size="sm"
                          onClick={getProgressFeedback}
                          disabled={loadingAiResponse}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Track Progress
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Exercise Timer */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Exercise Timer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="text-4xl font-bold text-blue-600">
                        {Math.floor(exerciseTimer / 60)}:{(exerciseTimer % 60).toString().padStart(2, "0")}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant={isExerciseActive ? "destructive" : "default"}
                          onClick={() => setIsExerciseActive(!isExerciseActive)}
                        >
                          {isExerciseActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setExerciseTimer(0)
                            setIsExerciseActive(false)
                          }}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Weekly Goals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Star className="h-5 w-5 mr-2" />
                      Weekly Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {weeklyGoals.length > 0 ? (
                        weeklyGoals.map((goal: any) => (
                          <div key={goal.id} className="flex items-center space-x-2">
                            <Checkbox 
                              checked={goal.completed}
                              onCheckedChange={() => toggleGoalCompletion(goal.id, goal.completed)}
                            />
                            <span className={`text-sm ${goal.completed ? 'line-through text-gray-500' : ''}`}>
                              {goal.goal_text}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No goals set for this week</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Video Modal Dialog */}
          <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Video className="h-5 w-5 mr-2 text-blue-600" />
                  {currentExerciseName} - Video Demonstration
                </DialogTitle>
                <DialogDescription>
                  Watch the proper form and technique for this exercise
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  {currentVideoUrl && (
                    <video 
                      controls 
                      className="w-full h-full"
                      autoPlay
                      onError={(e) => {
                        console.error('Video load error:', e)
                        toast({
                          title: "Video Error",
                          description: "Could not load the video. The file may not exist or is in an unsupported format.",
                          variant: "destructive"
                        })
                      }}
                    >
                      <source src={currentVideoUrl} type="video/mp4" />
                      <source src={currentVideoUrl} type="video/webm" />
                      <source src={currentVideoUrl} type="video/ogg" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Safety Tips:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Stop if you feel sharp pain</li>
                        <li>Breathe normally throughout the exercise</li>
                        <li>Maintain proper form as demonstrated</li>
                        <li>Go at your own pace</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowVideoModal(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Voice Guide Modal */}
          <Dialog open={showVoiceGuide} onOpenChange={closeVoiceGuide}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Mic className="h-5 w-5 mr-2 text-purple-600" />
                  {currentExerciseName} - Voice Guide
                </DialogTitle>
                <DialogDescription>
                  Listen to step-by-step audio instructions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {loadingVoiceScript ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Generating voice guide...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Voice Control Buttons */}
                    <div className="flex justify-center space-x-4 py-6">
                      <Button
                        size="lg"
                        className={`${isSpeaking ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'} text-white`}
                        onClick={speakVoiceGuide}
                      >
                        {isSpeaking ? (
                          <>
                            <Pause className="h-5 w-5 mr-2" />
                            Stop Voice Guide
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            Start Voice Guide
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Voice Script Display */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 max-h-96 overflow-y-auto">
                      <div className="flex items-start space-x-3">
                        <Volume2 className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-purple-900 mb-3">Script:</h3>
                          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                            {voiceScript}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">How to use:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Click "Start Voice Guide" to hear instructions</li>
                            <li>Follow along at your own pace</li>
                            <li>Click "Stop" to pause at any time</li>
                            <li>You can replay as many times as needed</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={closeVoiceGuide}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Form Check Recording Modal */}
          <Dialog open={showFormCheck} onOpenChange={closeFormCheck}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <VideoIcon className="h-5 w-5 mr-2 text-red-600" />
                  Form Check - Record Your Exercise
                </DialogTitle>
                <DialogDescription>
                  Record yourself doing the exercise and get AI feedback on your form
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Video Preview/Playback */}
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    autoPlay
                    muted
                    playsInline
                    src={recordedVideo || undefined}
                  />
                  
                  {/* Recording Indicator */}
                  {isRecording && (
                    <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Recording</span>
                    </div>
                  )}
                  
                  {/* Instructions Overlay */}
                  {!isRecording && !recordedVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-center text-white p-6">
                        <VideoIcon className="h-16 w-16 mx-auto mb-4 opacity-75" />
                        <p className="text-lg font-medium mb-2">Position yourself in frame</p>
                        <p className="text-sm opacity-75">Make sure your full body is visible</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">How to use Form Check:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Position yourself so your full body is visible</li>
                        <li>Click "Start Recording" when ready</li>
                        <li>Perform the exercise (15 seconds max)</li>
                        <li>AI will analyze your form automatically</li>
                        <li>Check AI Coach section for feedback</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Recording Controls */}
                <div className="flex justify-center space-x-4">
                  {!recordedVideo ? (
                    <>
                      {!isRecording ? (
                        <Button
                          size="lg"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={startRecording}
                        >
                          <VideoIcon className="h-5 w-5 mr-2" />
                          Start Recording
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-red-600 text-red-600 hover:bg-red-50"
                          onClick={stopRecording}
                        >
                          <X className="h-5 w-5 mr-2" />
                          Stop Recording
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
                        <CheckCircle className="h-6 w-6" />
                        <span className="font-medium">Recording Complete!</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Check the AI Exercise Coach section for your form analysis
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setRecordedVideo(null)
                          setRecordedBlob(null)
                          if (videoRef.current && recordingStream) {
                            videoRef.current.srcObject = recordingStream
                            videoRef.current.play()
                          }
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Record Again
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={closeFormCheck}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Progress Tracking Modal */}
          <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  Exercise Progress Tracking
                </DialogTitle>
                <DialogDescription>
                  Your detailed exercise progress and statistics
                </DialogDescription>
              </DialogHeader>

              {loadingProgress ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your progress...</p>
                  </div>
                </div>
              ) : progressData ? (
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {progressData.statistics.completedExercises}/{progressData.statistics.totalExercises}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">Exercises Done</p>
                        <p className="text-lg font-semibold text-blue-700 mt-1">
                          {progressData.statistics.completionRate}%
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {progressData.statistics.currentStreak}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">Day Streak</p>
                        <p className="text-lg font-semibold text-green-700 mt-1">
                          🔥 {progressData.statistics.currentStreak > 0 ? 'Keep it up!' : 'Start today!'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-purple-200 bg-purple-50">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {progressData.statistics.totalTimeSpentFormatted}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">Total Time</p>
                        <p className="text-lg font-semibold text-purple-700 mt-1">
                          {progressData.totalCompletions} sessions
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-200 bg-orange-50">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-orange-600">
                          {progressData.statistics.consistencyScore}%
                        </p>
                        <p className="text-xs text-gray-600 mt-1">Consistency</p>
                        <p className="text-lg font-semibold text-orange-700 mt-1">
                          {progressData.statistics.consistencyScore >= 80 ? 'Excellent!' : progressData.statistics.consistencyScore >= 60 ? 'Good!' : 'Keep going!'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Week Progress */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Program Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Week {progressData.program.currentWeek} of {progressData.program.totalWeeks}</span>
                          <span className="font-medium">{Math.round((progressData.program.completedSessions / progressData.program.totalSessions) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(progressData.program.completedSessions / progressData.program.totalSessions) * 100}
                          className="h-3"
                        />
                        <p className="text-xs text-gray-600">
                          {progressData.program.completedSessions} of {progressData.program.totalSessions} sessions completed
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Last 7 Days Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Last 7 Days Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-end h-32">
                        {progressData.activityData.last7Days.map((day: any, index: number) => (
                          <div key={index} className="flex flex-col items-center flex-1">
                            <div className="w-full flex items-end justify-center" style={{ height: '100px' }}>
                              <div 
                                className={`w-full max-w-[40px] rounded-t ${day.completions > 0 ? 'bg-purple-500' : 'bg-gray-200'}`}
                                style={{ height: `${Math.max(10, (day.completions / Math.max(...progressData.activityData.last7Days.map((d: any) => d.completions), 1)) * 100)}%` }}
                                title={`${day.completions} exercises`}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-600 mt-2">{day.day}</p>
                            <p className="text-xs font-medium text-purple-600">{day.completions}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Exercise-Specific Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Exercise Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {progressData.exerciseStats.map((stat: any) => (
                          <div key={stat.exerciseId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{stat.exerciseName}</p>
                              <p className="text-xs text-gray-600">
                                {stat.totalCompletions} times completed
                                {stat.averageDuration > 0 && ` • Avg: ${Math.floor(stat.averageDuration / 60)}m ${stat.averageDuration % 60}s`}
                              </p>
                            </div>
                            {stat.completed && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Goals Progress */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Weekly Goals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>{progressData.statistics.completedGoals} of {progressData.statistics.totalGoals} goals completed</span>
                          <span className="font-medium">{progressData.statistics.goalCompletionRate}%</span>
                        </div>
                        <Progress 
                          value={progressData.statistics.goalCompletionRate}
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Motivational Message */}
                  {progressData.statistics.consistencyScore >= 80 && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Star className="h-6 w-6 text-yellow-500 mt-1" />
                        <div>
                          <p className="font-semibold text-gray-800">Outstanding Progress! 🌟</p>
                          <p className="text-sm text-gray-600 mt-1">
                            You're maintaining excellent consistency! Your dedication to recovery is impressive. Keep up this amazing work!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">No progress data available</p>
                </div>
              )}

              <DialogFooter>
                <Button onClick={() => setShowProgressModal(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-8">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200/50">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center text-2xl">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-3">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    Upcoming Appointments
                  </CardTitle>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                    onClick={() => setShowScheduleDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule New
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingAppointments ? (
                  <div className="flex items-center justify-center p-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading appointments...</span>
                  </div>
                ) : upcomingAppointments.length === 0 ? (
                  <div className="text-center p-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2">No upcoming appointments</p>
                    <p className="text-sm text-gray-500">Your scheduled visits will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-5 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 rounded-xl hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center space-x-5">
                        <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100 min-w-[60px]">
                          <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {new Date(appointment.date).getDate()}
                          </p>
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mt-1">
                            {new Date(appointment.date).toLocaleDateString("en-US", { month: "short" })}
                          </p>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">{appointment.type || "Home Visit"}</h3>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            <User className="h-3.5 w-3.5 inline mr-1.5 text-blue-500" />
                            {appointment.provider || "Healthcare Provider"}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1.5 text-purple-500" />
                            {appointment.time || "TBD"}
                            <span className="mx-2">•</span>
                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                            {appointment.location || "Home Visit"}
                          </p>
                          {appointment.notes && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-1 italic">{appointment.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge
                          className={                                                                                                                                                                                                                                                                
                            appointment.status === "Confirmed"
                              ? "bg-red-100 text-red-700 hover:bg-red-200 border-red-300"
                              : appointment.status === "Scheduled"
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300"
                                : appointment.status === "Pending"
                                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                                  : appointment.status === "In Progress"
                                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                          }
                        >
                          {appointment.status}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Show appointment details
                            // You can add a details dialog here if needed
                            console.log("Appointment details:", appointment)
                          }}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule Appointment Dialog */}
            <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center text-2xl">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-3">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    Schedule New Appointment
                  </DialogTitle>
                  <DialogDescription>
                    Request a new appointment with your healthcare provider
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleScheduleAppointment} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date */}
                    <div className="space-y-2">
                      <Label htmlFor="appointment-date">Date *</Label>
                      <Input
                        id="appointment-date"
                        type="date"
                        value={scheduleForm.date}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                        min={new Date().toISOString().split("T")[0]}
                        required
                        className="h-12"
                      />
                    </div>

                    {/* Time */}
                    <div className="space-y-2">
                      <Label htmlFor="appointment-time">Time *</Label>
                      <Input
                        id="appointment-time"
                        type="time"
                        value={scheduleForm.time}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                        required
                        className="h-12"
                      />
                    </div>
                  </div>

                  {/* Visit Type */}
                  <div className="space-y-2">
                    <Label htmlFor="visit-type">Visit Type *</Label>
                    <Select
                      value={scheduleForm.visitType}
                      onValueChange={(value) => setScheduleForm({ ...scheduleForm, visitType: value })}
                      required
                    >
                      <SelectTrigger id="visit-type" className="h-12">
                        <SelectValue placeholder="Select visit type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Home Visit">Home Visit</SelectItem>
                        <SelectItem value="Follow-up Visit">Follow-up Visit</SelectItem>
                        <SelectItem value="Physical Therapy">Physical Therapy</SelectItem>
                        <SelectItem value="Occupational Therapy">Occupational Therapy</SelectItem>
                        <SelectItem value="Skilled Nursing">Skilled Nursing</SelectItem>
                        <SelectItem value="Wound Care">Wound Care</SelectItem>
                        <SelectItem value="Medication Review">Medication Review</SelectItem>
                        <SelectItem value="Assessment">Assessment</SelectItem>
                        <SelectItem value="Telehealth">Telehealth</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Provider Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="provider-select">
                      Healthcare Provider
                    </Label>
                    <Select
                      value={scheduleForm.staffId || (assignedStaffId || currentPatientData.assignedStaff?.id) || ""}
                      onValueChange={(value) => setScheduleForm({ ...scheduleForm, staffId: value })}
                      disabled={availableStaff.length === 0}
                    >
                      <SelectTrigger id="provider-select" className="h-12">
                        <SelectValue placeholder={availableStaff.length > 0 ? "Select provider" : "No provider available"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStaff.length > 0 ? (
                          availableStaff.map((staff) => {
                            // Find care team member info for this staff
                            const careTeamMember = careTeam.find((member) => member.staffId === staff.id)
                            const displayName = staff.name
                            const displayRole = careTeamMember?.role || staff.credentials || staff.department || "Healthcare Provider"
                            return (
                              <SelectItem key={staff.id} value={staff.id}>
                                {displayName} - {displayRole}
                              </SelectItem>
                            )
                          })
                        ) : (
                          <SelectItem value="unassigned" disabled>
                            {careTeam.length === 0 
                              ? "No care team assigned"
                              : "No provider available"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {availableStaff.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Select a provider from your care team
                      </p>
                    )}
                    {availableStaff.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        {careTeam.length === 0 
                          ? "No care team assigned. Please contact your care coordinator to assign care team members."
                          : "No provider available. Please contact your care coordinator."}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      type="text"
                      value={scheduleForm.location}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                      placeholder="Home Visit"
                      className="h-12"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={scheduleForm.notes}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                      placeholder="Any special instructions or concerns..."
                      rows={4}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowScheduleDialog(false)}
                      disabled={schedulingAppointment}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      disabled={schedulingAppointment}
                    >
                      {schedulingAppointment ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Appointment
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Current Medications */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center">
                        <Pill className="h-5 w-5 mr-2" />
                        Current Medications
                      </CardTitle>
                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={() => setActiveTab("med-scanner")}>
                          <Scan className="h-4 w-4 mr-2" />
                          Scan New Med
                        </Button>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Request Refill
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {medications.map((medication, index) => (
                        <Card key={index} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                  <Pill className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg text-gray-900">{medication.name}</h3>
                                  <p className="text-blue-600 font-medium">
                                    {medication.dosage} • {medication.frequency}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">Prescribed by {medication.prescriber}</p>

                                  {/* Medication Details Grid */}
                                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                    <div>
                                      <span className="font-medium text-gray-500">Refills Left:</span>
                                      <span
                                        className={`ml-2 font-medium ${medication.refillsLeft <= 1 ? "text-red-600" : "text-green-600"}`}
                                      >
                                        {medication.refillsLeft}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-500">Last Filled:</span>
                                      <span className="ml-2">{medication.lastFilled}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col space-y-2">
                                <Button variant="outline" size="sm" className="bg-transparent">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Details
                                </Button>
                                <Button
                                  variant={medication.refillsLeft <= 1 ? "default" : "outline"}
                                  size="sm"
                                  className={
                                    medication.refillsLeft <= 1 ? "bg-red-600 hover:bg-red-700" : "bg-transparent"
                                  }
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Refill
                                </Button>
                              </div>
                            </div>

                            {/* Drug Interaction Alert */}
                            <DrugInteractionAlert
                              newMedication={{
                                name: medication.name,
                                genericName: medication.genericName,
                                dosage: medication.dosage,
                              }}
                              currentMedications={medications
                                .filter((_, i) => i !== index)
                                .map((med) => ({
                                  name: med.name,
                                  genericName: med.genericName,
                                  dosage: med.dosage,
                                }))}
                              patientId="patient-001"
                              autoCheck={true}
                            />

                            {/* Medication Education */}
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start space-x-3">
                                <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                  <h4 className="font-medium text-blue-900 mb-2">Medication Education</h4>
                                  <div className="space-y-2 text-sm text-blue-800">
                                    {medication.name.toLowerCase().includes("lisinopril") && (
                                      <>
                                        <p>
                                          <strong>Purpose:</strong> Controls high blood pressure and protects your heart
                                          and kidneys.
                                        </p>
                                        <p>
                                          <strong>Important:</strong> Take at the same time each day. May cause a dry
                                          cough - contact your doctor if persistent.
                                        </p>
                                        <p>
                                          <strong>Monitor:</strong> Blood pressure, kidney function, and potassium
                                          levels.
                                        </p>
                                      </>
                                    )}
                                    {medication.name.toLowerCase().includes("metformin") && (
                                      <>
                                        <p>
                                          <strong>Purpose:</strong> Controls blood sugar levels in diabetes by improving
                                          insulin sensitivity.
                                        </p>
                                        <p>
                                          <strong>Important:</strong> Take with meals to reduce stomach upset. Stay
                                          hydrated.
                                        </p>
                                        <p>
                                          <strong>Monitor:</strong> Blood sugar levels, kidney function, and vitamin B12
                                          levels.
                                        </p>
                                      </>
                                    )}
                                    {medication.name.toLowerCase().includes("atorvastatin") && (
                                      <>
                                        <p>
                                          <strong>Purpose:</strong> Lowers cholesterol to reduce risk of heart disease
                                          and stroke.
                                        </p>
                                        <p>
                                          <strong>Important:</strong> Take at bedtime. Avoid grapefruit juice. Report
                                          muscle pain immediately.
                                        </p>
                                        <p>
                                          <strong>Monitor:</strong> Cholesterol levels, liver function, and muscle
                                          symptoms.
                                        </p>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex space-x-2 mt-3">
                                    <Button variant="outline" size="sm" className="bg-transparent">
                                      <BookOpen className="h-4 w-4 mr-2" />
                                      Full Guide
                                    </Button>
                                    <Button variant="outline" size="sm" className="bg-transparent">
                                      <Video className="h-4 w-4 mr-2" />
                                      Video Guide
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Medication Management Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-purple-800">
                      <Zap className="h-5 w-5 mr-2" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => setActiveTab("med-scanner")}
                    >
                      <Scan className="h-4 w-4 mr-2" />
                      Scan New Medication
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Plus className="h-4 w-4 mr-2" />
                      Request Refill
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Calendar className="h-4 w-4 mr-2" />
                      Set Reminders
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Download className="h-4 w-4 mr-2" />
                      Medication List
                    </Button>
                  </CardContent>
                </Card>

                {/* Medication Reminders */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="h-5 w-5 mr-2" />
                      Today's Medications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <p className="font-medium text-green-800">Lisinopril 10mg</p>
                          <p className="text-sm text-green-600">Morning dose</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                          <p className="font-medium text-blue-800">Metformin 500mg</p>
                          <p className="text-sm text-blue-600">With lunch - Due in 2 hours</p>
                        </div>
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div>
                          <p className="font-medium text-orange-800">Atorvastatin 20mg</p>
                          <p className="text-sm text-orange-600">Bedtime dose</p>
                        </div>
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Medication Safety Tips */}
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-yellow-800">
                      <Shield className="h-5 w-5 mr-2" />
                      Safety Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-yellow-800">
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-600 mt-2 flex-shrink-0"></div>
                        <p>Always take medications as prescribed</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-600 mt-2 flex-shrink-0"></div>
                        <p>Check expiration dates regularly</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-600 mt-2 flex-shrink-0"></div>
                        <p>Store medications properly</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-600 mt-2 flex-shrink-0"></div>
                        <p>Report side effects to your provider</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Test Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <TestTube className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{result.test}</h3>
                          <p className="text-sm text-gray-600">Ordered by {result.provider}</p>
                          <p className="text-sm text-gray-500">{result.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={result.status.includes("Normal") ? "default" : "destructive"}>
                          {result.status}
                        </Badge>
                        <div className="mt-2">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Messages</CardTitle>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Message
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 border rounded-lg ${message.unread ? "bg-blue-50 border-blue-200" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{message.from}</h3>
                          {message.unread && (
                            <Badge variant="default" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{message.date}</p>
                      </div>
                      <h4 className="font-medium mb-1">{message.subject}</h4>
                      <p className="text-sm text-gray-600">{message.preview}</p>
                      <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                        <Eye className="h-4 w-4 mr-2" />
                        Read Message
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">$0.00</p>
                    <p className="text-sm text-gray-500">Current balance</p>
                    <Button className="mt-4 w-full">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Make Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Insurance Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Primary Insurance</p>
                      <p>{currentPatientData?.insurance || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Policy Number</p>
                      <p>BCBS-123456789</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Group Number</p>
                      <p>GRP-987654</p>
                    </div>
                    <Button variant="outline" className="w-full mt-4 bg-transparent">
                      Update Insurance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Provider Tracking Tab */}
          <TabsContent value="tracking" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          <Navigation className="h-5 w-5 mr-2" />
                          Track Your Healthcare Provider
                        </CardTitle>
                        <CardDescription>
                          Real-time location and estimated arrival time for your assigned staff member (home visit provider)
                        </CardDescription>
                      </div>
                      {upcomingAppointments.length > 0 && (
                        <div className="flex flex-col gap-2">
                          {!sharingLocation && locationWatchId === null ? (
                            <Button 
                              onClick={sharePatientLocation}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              Share My Location
                            </Button>
                          ) : (
                            <Button 
                              onClick={stopSharingLocation}
                              size="sm"
                              variant="destructive"
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              Stop Sharing
                            </Button>
                          )}
                          {patientLocation && (
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                              Location Active
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingPatient ? (
                      <div className="flex items-center justify-center p-8">
                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading provider information...</span>
                      </div>
                    ) : (() => {
                      const assignedStaff = careTeam.find((member) => member.isAssignedStaff)
                      const staffId = assignedStaff?.staffId || assignedStaffId || currentPatientData.assignedStaff?.id
                      return staffId ? (
                        <PatientETAView 
                          staffId={staffId} 
                          patientId={currentPatientData.id || currentPatientData.medicalRecordNumber || "patient-id"}
                          patientName={currentPatientData.name}
                          patientLocation={patientLocation}
                        />
                      ) : (
                        <div className="text-center p-8">
                          <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600 mb-2">No assigned provider</p>
                          <p className="text-sm text-gray-500">Please contact your care coordinator to assign a provider</p>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {/* Assigned Provider Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Your Provider</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const assignedStaff = careTeam.find((member) => member.isAssignedStaff)
                      const providerName = assignedStaff?.name || currentPatientData.assignedStaff?.name || currentPatientData.assignedStaff || "No Provider Assigned"
                      const providerRole = assignedStaff?.role || currentPatientData.assignedStaff?.role || "Provider"
                      const providerPhone = assignedStaff?.phone || currentPatientData.assignedStaff?.phone
                      const providerEmail = assignedStaff?.email || currentPatientData.assignedStaff?.email
                      
                      return (
                        <>
                          <div className="flex items-center space-x-3 mb-4">
                            <Avatar>
                              <AvatarImage src={assignedStaff?.avatar || currentPatientData.assignedStaff?.avatar || "/placeholder.svg"} />
                              <AvatarFallback>
                                {providerName !== "No Provider Assigned" 
                                  ? providerName.split(" ").map((n: string) => n[0]).join("") 
                                  : "P"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{providerName}</p>
                              <p className="text-sm text-gray-600">{providerRole}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Button 
                              variant="outline" 
                              className="w-full bg-transparent" 
                              size="sm"
                              onClick={() => {
                                if (providerPhone) window.location.href = `tel:${providerPhone}`
                              }}
                              disabled={!providerPhone}
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Call Provider
                            </Button>
                            <Button 
                              variant="outline" 
                              className="w-full bg-transparent" 
                              size="sm"
                              onClick={() => {
                                if (providerEmail) window.location.href = `mailto:${providerEmail}`
                              }}
                              disabled={!providerEmail}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Send Message
                            </Button>
                          </div>
                        </>
                      )
                    })()}
                  </CardContent>
                </Card>

                {/* Location Sharing Info */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800 mb-1">Live Location Sharing</p>
                        <p className="text-blue-700">
                          Share your live GPS location so your provider can navigate accurately to your location. 
                          This helps ensure accurate arrival time and route optimization.
                        </p>
                        {patientLocation && (
                          <p className="text-xs text-blue-600 mt-2">
                            Accuracy: ±{patientLocation.accuracy?.toFixed(0) || 'N/A'}m
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy Notice */}
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-800 mb-1">Privacy Protected</p>
                        <p className="text-green-700">
                          Location sharing is only active during your scheduled appointment and automatically stops when
                          complete.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Help */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <HelpCircle className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">Need Help?</p>
                        <p className="text-xs text-gray-600">Contact support for assistance</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Medication Scanner Tab */}
          <TabsContent value="med-scanner" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scan className="h-5 w-5 mr-2" />
                  Medication Scanner
                </CardTitle>
                <CardDescription>
                  Scan your medication bottles or labels to add them to your profile and check for interactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Scanner Mode Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={scanMode === "barcode" ? "default" : "outline"}
                    onClick={() => setScanMode("barcode")}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <QrCode className="h-6 w-6" />
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Barcode Scanner</div>
                      <div className="text-xs text-muted-foreground">Scan medication barcodes</div>
                    </div>
                  </Button>

                  <Button
                    variant={scanMode === "ocr" ? "default" : "outline"}
                    onClick={() => setScanMode("ocr")}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Scan className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">Label Scanner</div>
                      <div className="text-xs text-muted-foreground">Scan medication labels</div>
                    </div>
                  </Button>
                </div>

                {/* Camera Scanner */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Camera className="h-5 w-5 mr-2" />
                      {scanMode === "barcode" ? "Barcode Scanner" : "Label Scanner"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isScanning ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button onClick={startCamera} className="h-24 flex flex-col items-center justify-center">
                            <Camera className="h-8 w-8 mb-2" />
                            Start Camera
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-24 flex flex-col items-center justify-center"
                          >
                            <Upload className="h-8 w-8 mb-2" />
                            Upload Image
                          </Button>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full max-w-md mx-auto rounded-lg border"
                          />

                          {/* Scanner overlay */}
                          <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-20 border-2 border-white rounded-lg">
                              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white"></div>
                              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white"></div>
                              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white"></div>
                              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white"></div>
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                                Position {scanMode === "barcode" ? "barcode" : "label"} here
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-center space-x-4">
                          <Button onClick={captureImage} disabled={isProcessing}>
                            <Scan className="h-4 w-4 mr-2" />
                            Capture & Scan
                          </Button>
                          <Button variant="outline" onClick={stopCamera}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {isProcessing && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Processing medication...</span>
                          <span className="text-sm text-gray-500">{scanProgress}%</span>
                        </div>
                        <Progress value={scanProgress} className="w-full" />
                      </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />
                  </CardContent>
                </Card>

                {/* Scanned Medication Results */}
                {scannedMedication && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-green-800">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Medication Scanned Successfully
                      </CardTitle>
                      <CardDescription className="text-green-700">
                        Review the information below and add to your medication profile
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label className="font-medium">Medication Name</Label>
                            <p className="text-lg font-semibold text-blue-600">{scannedMedication.name}</p>
                            {scannedMedication.genericName && (
                              <p className="text-sm text-gray-600">Generic: {scannedMedication.genericName}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="font-medium">Dosage</Label>
                              <p>{scannedMedication.dosage}</p>
                            </div>
                            <div>
                              <Label className="font-medium">Strength</Label>
                              <p>{scannedMedication.strength}</p>
                            </div>
                          </div>

                          <div>
                            <Label className="font-medium">Instructions</Label>
                            <p className="text-sm">{scannedMedication.instructions}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label className="font-medium">Manufacturer</Label>
                            <p>{scannedMedication.manufacturer}</p>
                          </div>
                          <div>
                            <Label className="font-medium">NDC Number</Label>
                            <p className="font-mono text-sm">{scannedMedication.ndc}</p>
                          </div>
                          <div>
                            <Label className="font-medium">Scan Confidence</Label>
                            <div className="flex items-center space-x-2">
                              <Progress value={scannedMedication.confidence} className="flex-1" />
                              <span className="text-sm font-medium">{scannedMedication.confidence}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Drug Interaction Check */}
                      <DrugInteractionAlert
                        newMedication={{
                          name: scannedMedication.name,
                          genericName: scannedMedication.genericName,
                          dosage: scannedMedication.dosage,
                          ndc: scannedMedication.ndc,
                        }}
                        currentMedications={medications.map((med) => ({
                          name: med.name,
                          genericName: med.genericName,
                          dosage: med.dosage,
                        }))}
                        patientId="patient-001"
                        autoCheck={true}
                      />

                      {/* Actions */}
                      <div className="flex space-x-3 pt-4 border-t">
                        <Button className="bg-green-600 hover:bg-green-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Add to My Medications
                        </Button>
                        <Button variant="outline" className="bg-transparent">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Ask Provider
                        </Button>
                        <Button variant="outline" onClick={() => setScannedMedication(null)} className="bg-transparent">
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Manual Entry Option */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Edit className="h-5 w-5 mr-2" />
                      Can't Scan? Enter Manually
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="manual-med-name">Medication Name</Label>
                        <Input
                          id="manual-med-name"
                          placeholder="e.g., Lisinopril"
                          value={manualEntry.name}
                          onChange={(e) => setManualEntry({ ...manualEntry, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="manual-med-dosage">Dosage</Label>
                        <Input
                          id="manual-med-dosage"
                          placeholder="e.g., 10mg"
                          value={manualEntry.dosage}
                          onChange={(e) => setManualEntry({ ...manualEntry, dosage: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button className="mt-4" onClick={submitManualEntry}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Medication
                    </Button>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  )
}
