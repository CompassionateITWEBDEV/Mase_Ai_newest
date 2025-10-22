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
  Scan,
  RefreshCw,
  Zap,
  Camera,
  QrCode,
  BarChart3,
  Upload,
  X,
  Edit,
} from "lucide-react"
import { DrugInteractionAlert } from "@/components/drug-interaction-alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function PatientPortal() {
  const [activeTab, setActiveTab] = useState("overview")
  const [exerciseTimer, setExerciseTimer] = useState(0)
  const [isExerciseActive, setIsExerciseActive] = useState(false)
  const [scanMode, setScanMode] = useState<"ocr" | "barcode">("barcode")
  const [isScanning, setIsScanning] = useState(false)
  const [scannedMedication, setScannedMedication] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [manualEntry, setManualEntry] = useState({
    name: "",
    dosage: "",
    strength: "",
    instructions: "",
    frequency: "",
    route: "",
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock patient data
  const patientData = {
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

  // Care Team Data
  const careTeam = [
    {
      id: 1,
      name: "Dr. Michael Chen",
      role: "Primary Care Physician",
      specialty: "Internal Medicine",
      phone: "(555) 123-4567",
      email: "mchen@healthcare.com",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "Available",
      lastContact: "2024-01-12",
    },
    {
      id: 2,
      name: "Jennifer Martinez",
      role: "Registered Nurse",
      specialty: "Home Health",
      phone: "(555) 987-6543",
      email: "jmartinez@healthcare.com",
      avatar: "/professional-woman-diverse.png",
      status: "On Route",
      lastContact: "2024-01-13",
    },
    {
      id: 3,
      name: "David Thompson",
      role: "Physical Therapist",
      specialty: "Orthopedic PT",
      phone: "(555) 456-7890",
      email: "dthompson@healthcare.com",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "Available",
      lastContact: "2024-01-10",
    },
    {
      id: 4,
      name: "Maria Rodriguez",
      role: "Social Worker",
      specialty: "Medical Social Work",
      phone: "(555) 321-0987",
      email: "mrodriguez@healthcare.com",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "Available",
      lastContact: "2024-01-08",
    },
    {
      id: 5,
      name: "Dr. Lisa Park",
      role: "Cardiologist",
      specialty: "Cardiology",
      phone: "(555) 654-3210",
      email: "lpark@cardiology.com",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "Available",
      lastContact: "2024-01-05",
    },
  ]

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

  // Exercise Program Data
  const exerciseProgram = {
    currentWeek: 3,
    totalWeeks: 8,
    completedSessions: 12,
    totalSessions: 24,
    nextSession: "2024-01-15",
    exercises: [
      {
        id: 1,
        name: "Ankle Pumps",
        description: "Flex and point your foot to improve circulation",
        duration: "2 minutes",
        repetitions: "10-15 reps",
        sets: 3,
        difficulty: "Easy",
        videoUrl: "/exercises/ankle-pumps.mp4",
        completed: true,
        aiTips: "Keep movements slow and controlled. Focus on full range of motion.",
      },
      {
        id: 2,
        name: "Seated Leg Extensions",
        description: "Strengthen quadriceps while seated",
        duration: "3 minutes",
        repetitions: "8-12 reps",
        sets: 2,
        difficulty: "Moderate",
        videoUrl: "/exercises/leg-extensions.mp4",
        completed: false,
        aiTips: "Hold for 2 seconds at the top of each extension. Breathe normally throughout.",
      },
      {
        id: 3,
        name: "Arm Circles",
        description: "Improve shoulder mobility and strength",
        duration: "2 minutes",
        repetitions: "10 forward, 10 backward",
        sets: 2,
        difficulty: "Easy",
        videoUrl: "/exercises/arm-circles.mp4",
        completed: false,
        aiTips: "Start with small circles and gradually increase size. Keep shoulders relaxed.",
      },
    ],
  }

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

  const upcomingAppointments = [
    {
      id: 1,
      date: "2024-01-15",
      time: "10:30 AM",
      provider: "Dr. Michael Chen",
      type: "Follow-up Visit",
      status: "Confirmed",
      location: "Home Visit",
    },
    {
      id: 2,
      date: "2024-01-22",
      time: "2:00 PM",
      provider: "Physical Therapist",
      type: "Physical Therapy",
      status: "Scheduled",
      location: "Home Visit",
    },
    {
      id: 3,
      date: "2024-01-29",
      time: "11:00 AM",
      provider: "Dr. Michael Chen",
      type: "Medication Review",
      status: "Pending",
      location: "Telehealth",
    },
  ]

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
    let intervalId

    if (isExerciseActive) {
      intervalId = setInterval(() => {
        setExerciseTimer((prevTimer) => prevTimer + 1)
      }, 1000)
    } else {
      clearInterval(intervalId)
    }

    return () => clearInterval(intervalId)
  }, [isExerciseActive])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px:8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Patient Portal
                  </h1>
                  <p className="text-sm text-gray-600">Welcome back, {patientData.name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Avatar>
                <AvatarImage src="/professional-woman-diverse.png" />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-11 lg:w-auto lg:grid-cols-none lg:flex">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
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
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient Info Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Full Name</p>
                      <p className="text-lg">{patientData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                      <p className="text-lg">{patientData.dateOfBirth}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Medical Record Number</p>
                      <p className="text-lg">{patientData.mrn}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Primary Provider</p>
                      <p className="text-lg">{patientData.primaryProvider}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-lg">{patientData.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Insurance</p>
                      <p className="text-lg">{patientData.insurance}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Appointment Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Next Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date & Time</p>
                      <p className="text-lg">{new Date(patientData.nextAppointment.date).toLocaleDateString()}</p>
                      <p className="text-lg">{patientData.nextAppointment.time}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Provider</p>
                      <p>{patientData.nextAppointment.provider}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Type</p>
                      <p>{patientData.nextAppointment.type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <p>{patientData.nextAppointment.location}</p>
                    </div>
                    <Button className="w-full mt-4">
                      <MapPin className="h-4 w-4 mr-2" />
                      Track Provider
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Vital Signs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Vital Signs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {vitalSigns.map((vital, index) => (
                    <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-1">{vital.metric}</p>
                      <p className="text-2xl font-bold text-gray-900">{vital.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{vital.date}</p>
                      <Badge variant={vital.status === "normal" ? "default" : "destructive"} className="mt-2">
                        {vital.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-medium">Send Message</h3>
                  <p className="text-sm text-gray-500">Contact your provider</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Pill className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-medium">Request Refill</h3>
                  <p className="text-sm text-gray-500">Refill medications</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h3 className="font-medium">Schedule Visit</h3>
                  <p className="text-sm text-gray-500">Book appointment</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <TestTube className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <h3 className="font-medium">View Results</h3>
                  <p className="text-sm text-gray-500">Check lab results</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Care Team Tab */}
          <TabsContent value="care-team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Your Healthcare Team
                </CardTitle>
                <CardDescription>Meet the professionals dedicated to your care</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {careTeam.map((member) => (
                    <Card key={member.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4 mb-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-medium text-lg">{member.name}</h3>
                            <p className="text-sm text-gray-600">{member.role}</p>
                            <p className="text-xs text-gray-500">{member.specialty}</p>
                          </div>
                          <Badge
                            variant={
                              member.status === "Available"
                                ? "default"
                                : member.status === "On Route"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {member.status}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {member.phone}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {member.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-2" />
                            Last contact: {member.lastContact}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Progress Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Dumbbell className="h-5 w-5 mr-2" />
                      Home Exercise Program Progress
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
                      {exerciseProgram.exercises.map((exercise) => (
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

                            <div className="flex space-x-3">
                              <Button variant="outline" size="sm">
                                <Video className="h-4 w-4 mr-2" />
                                Watch Video
                              </Button>
                              <Button variant="outline" size="sm">
                                <Mic className="h-4 w-4 mr-2" />
                                Voice Guide
                              </Button>
                              {!exercise.completed && (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Complete
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
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-700 mb-3">
                          "Great job on completing your ankle pumps! Remember to keep your movements slow and controlled
                          for maximum benefit."
                        </p>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Mic className="h-4 w-4 mr-2" />
                            Ask Question
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Button className="w-full bg-purple-600 hover:bg-purple-700" size="sm">
                          <Bot className="h-4 w-4 mr-2" />
                          Get AI Feedback
                        </Button>
                        <Button variant="outline" className="w-full bg-transparent" size="sm">
                          <Video className="h-4 w-4 mr-2" />
                          Form Check
                        </Button>
                        <Button variant="outline" className="w-full bg-transparent" size="sm">
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
                      <div className="flex items-center space-x-2">
                        <Checkbox checked />
                        <span className="text-sm">Complete 3 exercise sessions</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox />
                        <span className="text-sm">Practice balance exercises daily</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox />
                        <span className="text-sm">Log pain levels after exercises</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule New
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{new Date(appointment.date).getDate()}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.date).toLocaleDateString("en-US", { month: "short" })}
                          </p>
                        </div>
                        <div>
                          <h3 className="font-medium">{appointment.type}</h3>
                          <p className="text-sm text-gray-600">{appointment.provider}</p>
                          <p className="text-sm text-gray-500">
                            {appointment.time} • {appointment.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant={
                            appointment.status === "Confirmed"
                              ? "default"
                              : appointment.status === "Scheduled"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {appointment.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                      <p>{patientData.insurance}</p>
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
                    <CardTitle className="flex items-center">
                      <Navigation className="h-5 w-5 mr-2" />
                      Track Your Healthcare Provider
                    </CardTitle>
                    <CardDescription>
                      Real-time location and estimated arrival time for your assigned provider
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PatientETAView staffId={patientData.assignedStaff.id} patientId="mock-patient-id" />
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
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar>
                        <AvatarImage src={patientData.assignedStaff.avatar || "/placeholder.svg"} />
                        <AvatarFallback>JM</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{patientData.assignedStaff.name}</p>
                        <p className="text-sm text-gray-600">{patientData.assignedStaff.role}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full bg-transparent" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Provider
                      </Button>
                      <Button variant="outline" className="w-full bg-transparent" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
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
  )
}
