"use client"

import { useState, useEffect } from 'react'
import { EnhancedDoctorSignup } from "@/components/doctor-portal/enhanced-doctor-signup"
import { EnhancedAvailabilityToggle } from "@/components/doctor-portal/enhanced-availability-toggle"
import { AIClinicalAssistant } from "@/components/doctor-portal/ai-clinical-assistant"
import { AIPatientSummary } from "@/components/doctor-portal/ai-patient-summary"
import { AIDashboardAnalytics } from "@/components/doctor-portal/ai-dashboard-analytics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Brain, Activity, Stethoscope, Clock, User, AlertTriangle, CheckCircle, X, Video, DollarSign, LogIn, Sparkles } from "lucide-react"
import { PeerJSVideoCall } from "@/components/telehealth/PeerJSVideoCall"
import { RatingDialog } from "@/components/telehealth/RatingDialog"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Helper function to format response time
const formatResponseTime = (seconds: number): string => {
  // Handle NaN, null, undefined, or invalid values
  if (!seconds || isNaN(seconds) || seconds === 0) return '0s'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

export default function DoctorPortalPage() {
  const { toast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(true)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [pendingConsultations, setPendingConsultations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [doctorId, setDoctorId] = useState<string>('')
  const [doctorName, setDoctorName] = useState<string>('')
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [videoSession, setVideoSession] = useState<any>(null)
  const [activeConsultation, setActiveConsultation] = useState<any>(null)
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [completedConsultation, setCompletedConsultation] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<string>('dashboard') // Tab state
  const [showAIAssistant, setShowAIAssistant] = useState<{[key: string]: boolean}>({}) // AI assistant per consultation
  const [todayStats, setTodayStats] = useState({
    consultations: 0,
    earnings: 0,
    avgRating: 0,
    avgResponseTime: 0 // in seconds
  })

  // Check if doctor is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      if (user.accountType === 'doctor') {
        setIsAuthenticated(true)
        setDoctorId(user.id)
        setDoctorName(user.name)
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          accountType: 'doctor',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if account is inactive/pending
        if (data.status === 'inactive' || data.accountStatus === 'pending' || data.accountStatus === 'inactive' || data.accountStatus === 'suspended') {
          // Show specific alert for inactive accounts
          toast({
            title: "Account Not Active",
            description: data.error || "Your account needs to be activated by an administrator before you can login.",
            variant: "destructive",
            duration: 8000, // Show longer for important message
          })
          
          // Also show browser alert for emphasis
          setTimeout(() => {
            alert(`⚠️ Account Status: ${data.accountStatus || 'Inactive'}\n\n${data.error || 'Your account needs to be activated by an administrator.'}\n\nPlease contact the administrator for assistance.`)
          }, 500)
          
          return
        }
        
        // For other errors, throw as usual
        throw new Error(data.error || 'Login failed')
      }

      // Save user to localStorage
      localStorage.setItem('currentUser', JSON.stringify(data.user))
      
      setIsAuthenticated(true)
      setDoctorId(data.user.id)
      setDoctorName(data.user.name)

      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.name}!`,
      })

    } catch (error: any) {
      console.error('Login error:', error)
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      })
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    setIsAuthenticated(false)
    setDoctorId('')
    setDoctorName('')
    setShowLoginForm(true)
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    })
  }

  // Fetch pending consultations
  useEffect(() => {
    if (!doctorId) return

    const fetchConsultations = async () => {
      try {
        const response = await fetch('/api/telehealth/consultation?status=pending')
        const data = await response.json()
        
        if (data.success) {
          setPendingConsultations(data.consultations || [])
        }
      } catch (error) {
        console.error('Error fetching consultations:', error)
      }
    }

    fetchConsultations()

    // Poll for new consultations every 5 seconds
    const interval = setInterval(fetchConsultations, 5000)
    return () => clearInterval(interval)
  }, [doctorId])

  // Fetch today's stats
  useEffect(() => {
    if (!doctorId) return

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/telehealth/consultation?doctorId=${doctorId}`)
        const data = await response.json()
        
        if (data.success) {
          // Get today's date at midnight (start of day)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          // Filter for completed consultations from today only
          const completed = data.consultations.filter((c: any) => {
            if (c.status !== 'completed') return false
            
            const completedDate = new Date(c.completed_at)
            return completedDate >= today
          })
          
          // Calculate today's earnings
          const totalEarnings = completed.reduce((sum: number, c: any) => sum + (c.compensation_amount || 0), 0)
          
          // Calculate average rating from nurses (how nurses rated the doctor)
          const ratedConsultations = completed.filter((c: any) => c.nurse_rating > 0)
          const avgRating = ratedConsultations.length > 0 
            ? ratedConsultations.reduce((sum: number, c: any) => sum + (c.nurse_rating || 0), 0) / ratedConsultations.length 
            : 0

          // Calculate average response time (time from request to acceptance)
          const consultationsWithResponseTime = completed.filter((c: any) => c.created_at && c.accepted_at)
          const avgResponseTime = consultationsWithResponseTime.length > 0
            ? consultationsWithResponseTime.reduce((sum: number, c: any) => {
                const created = new Date(c.created_at).getTime()
                const accepted = new Date(c.accepted_at).getTime()
                return sum + (accepted - created) / 1000 // Convert to seconds
              }, 0) / consultationsWithResponseTime.length
            : 0

          setTodayStats({
            consultations: completed.length,
            earnings: totalEarnings,
            avgRating: avgRating,
            avgResponseTime: avgResponseTime
          })
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [doctorId])

  const handleAcceptConsult = async (consultation: any) => {
    console.log('🩺 [DOCTOR] Accepting consultation:', consultation.id)
    setIsLoading(true)

    try {
      // Accept consultation
      console.log('📞 [DOCTOR] Step 1: Accepting consultation...')
      const response = await fetch('/api/telehealth/consultation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: consultation.id,
          action: 'accept',
          doctorId,
          doctorName
        })
      })

      const data = await response.json()
      console.log('📞 [DOCTOR] Accept response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept consultation')
      }

      if (data.success) {
        // With PeerJS, no need to create session via API
        // The peer connection will be established directly
        console.log('✅ [DOCTOR] Consultation accepted, starting PeerJS video call...')

        setActiveConsultation(consultation)
        setShowVideoCall(true)

        console.log('🎥 [DOCTOR] Opening PeerJS video call dialog')

        // Remove from pending list
        setPendingConsultations(prev => prev.filter(c => c.id !== consultation.id))

        toast({
          title: "Consultation Accepted",
          description: "Starting video call with nurse...",
        })
      } else {
        throw new Error('Consultation acceptance failed')
      }
    } catch (error: any) {
      console.error('❌ [DOCTOR] Accept error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to accept consultation",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectConsult = async (consultation: any) => {
    try {
      const response = await fetch('/api/telehealth/consultation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: consultation.id,
          action: 'reject',
          cancellationReason: 'Doctor unavailable'
        })
      })

      if (response.ok) {
        setPendingConsultations(prev => prev.filter(c => c.id !== consultation.id))
        toast({
          title: "Consultation Declined",
          description: "The consultation request has been declined",
        })
      }
    } catch (error) {
      console.error('Reject error:', error)
    }
  }

  const handleVideoCallEnd = async () => {
    setShowVideoCall(false)
    setVideoSession(null)

    // Mark consultation as completed
    if (activeConsultation) {
      await fetch('/api/telehealth/consultation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: activeConsultation.id,
          action: 'complete',
          doctorNotes: 'Consultation completed via video call'
        })
      })

      // Store consultation for rating
      setCompletedConsultation(activeConsultation)
      
      // Show rating dialog after a short delay
      setTimeout(() => {
        setShowRatingDialog(true)
      }, 1000)
    }

    setActiveConsultation(null)

    toast({
      title: "Consultation Completed",
      description: "Video call has ended",
    })
  }

  const handleRatingSubmitted = () => {
    // Refresh stats after rating is submitted
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/telehealth/consultation?doctorId=${doctorId}`)
        const data = await response.json()
        
        if (data.success) {
          // Get today's date at midnight (start of day)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          // Filter for completed consultations from today only
          const completed = data.consultations.filter((c: any) => {
            if (c.status !== 'completed') return false
            
            const completedDate = new Date(c.completed_at)
            return completedDate >= today
          })
          
          // Calculate today's earnings
          const totalEarnings = completed.reduce((sum: number, c: any) => sum + (c.compensation_amount || 0), 0)
          
          // Calculate average rating from nurses (how nurses rated the doctor)
          const ratedConsultations = completed.filter((c: any) => c.nurse_rating > 0)
          const avgRating = ratedConsultations.length > 0 
            ? ratedConsultations.reduce((sum: number, c: any) => sum + (c.nurse_rating || 0), 0) / ratedConsultations.length 
            : 0

          // Calculate average response time (time from request to acceptance)
          const consultationsWithResponseTime = completed.filter((c: any) => c.created_at && c.accepted_at)
          const avgResponseTime = consultationsWithResponseTime.length > 0
            ? consultationsWithResponseTime.reduce((sum: number, c: any) => {
                const created = new Date(c.created_at).getTime()
                const accepted = new Date(c.accepted_at).getTime()
                return sum + (accepted - created) / 1000 // Convert to seconds
              }, 0) / consultationsWithResponseTime.length
            : 0

          setTodayStats({
            consultations: completed.length,
            earnings: totalEarnings,
            avgRating: avgRating,
            avgResponseTime: avgResponseTime
          })
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    fetchStats()
    setCompletedConsultation(null)
  }

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  // Show login/signup if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Brain className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Doctor Portal
            </h1>
            <p className="text-gray-600">AI-Powered Telehealth Platform</p>
          </div>

          <Tabs value={showLoginForm ? "login" : "signup"} onValueChange={(val) => setShowLoginForm(val === "login")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LogIn className="h-5 w-5 mr-2" />
                    Doctor Login
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="doctor@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoggingIn}>
                      {isLoggingIn ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <EnhancedDoctorSignup />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mr-4">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Doctor Portal
                </h1>
                <p className="text-gray-600">AI-Powered Telehealth Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold text-gray-900">{doctorName}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consultations">
              Live Consultations
              {pendingConsultations.length > 0 && (
                <Badge className="ml-2 bg-red-500">{pendingConsultations.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          <TabsContent value="consultations">
            <div className="space-y-4">
              {pendingConsultations.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Active Consultations</h3>
                    <p className="text-gray-500">You'll see incoming consultation requests here when you're available.</p>
                  </CardContent>
                </Card>
              ) : (
                pendingConsultations.map((consultation) => (
                  <Card key={consultation.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                            <span>Incoming Consultation</span>
                          </div>
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(consultation.created_at)}
                          </Badge>
                          <Badge className={`${getUrgencyColor(consultation.urgency_level)} text-white`}>
                            {consultation.urgency_level.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Patient & Nurse Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            Patient Information
                          </h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium">{consultation.patient_initials || consultation.patient_name}</p>
                            {consultation.patient_age && <p className="text-sm text-gray-600">Age: {consultation.patient_age}</p>}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium flex items-center">
                            <Stethoscope className="h-4 w-4 mr-2" />
                            Attending Nurse
                          </h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {consultation.nurse_name.split(' ').map((n: string) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{consultation.nurse_name}</p>
                                <p className="text-xs text-gray-600">RN</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Chief Complaint */}
                      <div>
                        <h4 className="font-medium mb-2 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Reason for Consultation
                        </h4>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-blue-900">{consultation.reason_for_consult}</p>
                        </div>
                      </div>

                      {/* Symptoms */}
                      {consultation.symptoms && consultation.symptoms.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Reported Symptoms</h4>
                          <div className="flex flex-wrap gap-2">
                            {consultation.symptoms.map((symptom: string, index: number) => (
                              <Badge key={index} variant="secondary">
                                {symptom}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Vital Signs */}
                      {consultation.vital_signs && Object.keys(consultation.vital_signs).length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Vital Signs</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {consultation.vital_signs.bloodPressure && (
                              <div className="bg-gray-50 p-2 rounded text-center">
                                <p className="text-xs text-gray-600">Blood Pressure</p>
                                <p className="font-medium">{consultation.vital_signs.bloodPressure}</p>
                              </div>
                            )}
                            {consultation.vital_signs.heartRate && (
                              <div className="bg-gray-50 p-2 rounded text-center">
                                <p className="text-xs text-gray-600">Heart Rate</p>
                                <p className="font-medium">{consultation.vital_signs.heartRate} bpm</p>
                              </div>
                            )}
                            {consultation.vital_signs.temperature && (
                              <div className="bg-gray-50 p-2 rounded text-center">
                                <p className="text-xs text-gray-600">Temperature</p>
                                <p className="font-medium">{consultation.vital_signs.temperature}°F</p>
                              </div>
                            )}
                            {consultation.vital_signs.oxygenSaturation && (
                              <div className="bg-gray-50 p-2 rounded text-center">
                                <p className="text-xs text-gray-600">O2 Sat</p>
                                <p className="font-medium">{consultation.vital_signs.oxygenSaturation}%</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Consultation Details */}
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Est. {consultation.estimated_duration} min
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            ${consultation.compensation_amount}
                          </span>
                        </div>
                      </div>

                      {/* AI Assistant Toggle */}
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAIAssistant(prev => ({
                            ...prev,
                            [consultation.id]: !prev[consultation.id]
                          }))}
                          className="border-purple-200 text-purple-600 hover:bg-purple-50"
                        >
                          <Brain className="h-4 w-4 mr-2" />
                          {showAIAssistant[consultation.id] ? 'Hide' : 'Show'} AI Clinical Assistant
                          <Sparkles className="h-3 w-3 ml-2" />
                        </Button>
                      </div>

                      {/* AI Assistant Panel */}
                      {showAIAssistant[consultation.id] && (
                        <div className="border-t pt-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <AIPatientSummary
                                patientId={consultation.patient_id}
                                patientName={consultation.patient_name}
                                consultation={consultation}
                              />
                            </div>
                            <div>
                              <AIClinicalAssistant
                                consultation={consultation}
                                patientData={{
                                  age: consultation.patient_age,
                                  name: consultation.patient_name
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        <Button
                          onClick={() => handleAcceptConsult(consultation)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          disabled={isLoading}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept & Start Video Call
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRejectConsult(consultation)}
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Today's Consultations</p>
                        <p className="text-3xl font-bold text-blue-600">{todayStats.consultations}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <Stethoscope className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Today's Earnings</p>
                        <p className="text-3xl font-bold text-green-600">${todayStats.earnings.toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Average Rating</p>
                        <p className="text-3xl font-bold text-purple-600">{todayStats.avgRating.toFixed(1)}</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <Activity className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Pending Requests</p>
                        <p className="text-3xl font-bold text-orange-600">{pendingConsultations.length}</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-full">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Welcome Message */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Brain className="h-5 w-5 mr-2" />
                        Welcome, Dr. {doctorName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Welcome to the AI-powered telehealth platform. You can manage your availability, accept
                        consultations, and provide urgent care to patients in need.
                      </p>
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => setActiveTab('consultations')}
                          className="flex-1"
                        >
                          <Stethoscope className="h-4 w-4 mr-2" />
                          View Consultations
                        </Button>
                        <Button 
                          onClick={() => setActiveTab('availability')}
                          variant="outline"
                          className="flex-1"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Manage Availability
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Consultations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Activity className="h-5 w-5 mr-2" />
                          Recent Activity
                        </span>
                        {pendingConsultations.length > 0 && (
                          <Badge variant="destructive">{pendingConsultations.length} Pending</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pendingConsultations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No pending consultation requests</p>
                          <p className="text-sm mt-1">New requests will appear here</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pendingConsultations.slice(0, 3).map((consultation: any) => (
                            <div key={consultation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium">{consultation.patient_name || 'Patient'}</p>
                                <p className="text-sm text-gray-600">
                                  {consultation.reason || 'Consultation request'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Requested by: {consultation.nurse_name || 'Nurse'}
                                </p>
                              </div>
                              <Badge className={getUrgencyColor(consultation.urgency_level)}>
                                {consultation.urgency_level || 'medium'}
                              </Badge>
                            </div>
                          ))}
                          {pendingConsultations.length > 3 && (
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => setActiveTab('consultations')}
                            >
                              View All {pendingConsultations.length} Requests
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Availability & Quick Actions */}
                <div className="space-y-6">
                  {/* Availability Toggle */}
                  <EnhancedAvailabilityToggle />

                  {/* Today's Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        Today's Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Consultations */}
                        <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
                          <Stethoscope className="h-8 w-8 text-blue-600 mb-2" />
                          <div className="text-3xl font-bold text-blue-600">{todayStats.consultations}</div>
                          <div className="text-sm text-gray-600 mt-1">Consultations</div>
                        </div>

                        {/* Earnings */}
                        <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                          <DollarSign className="h-8 w-8 text-green-600 mb-2" />
                          <div className="text-3xl font-bold text-green-600">${todayStats.earnings.toFixed(0)}</div>
                          <div className="text-sm text-gray-600 mt-1">Earnings</div>
                        </div>

                        {/* Avg Response */}
                        <div className="flex flex-col items-center p-4 bg-purple-50 rounded-lg">
                          <Clock className="h-8 w-8 text-purple-600 mb-2" />
                          <div className="text-3xl font-bold text-purple-600">
                            {formatResponseTime(todayStats.avgResponseTime)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">Avg Response</div>
                        </div>

                        {/* Rating */}
                        <div className="flex flex-col items-center p-4 bg-orange-50 rounded-lg">
                          <Activity className="h-8 w-8 text-orange-600 mb-2" />
                          <div className="text-3xl font-bold text-orange-600">
                            {todayStats.avgRating > 0 ? todayStats.avgRating.toFixed(1) : '0.0'}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">Rating</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Performance Insights */}
                  <AIDashboardAnalytics doctorId={doctorId} stats={todayStats} />

                  {/* Quick Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Consultations</span>
                        <span className="font-bold">{todayStats.consultations}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pending Requests</span>
                        <Badge variant={pendingConsultations.length > 0 ? "destructive" : "secondary"}>
                          {pendingConsultations.length}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Today's Earnings</span>
                        <span className="font-bold text-green-600">${todayStats.earnings.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Average Rating</span>
                        <span className="font-bold text-purple-600">
                          {todayStats.avgRating > 0 ? `${todayStats.avgRating.toFixed(1)} ⭐` : 'N/A'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => setActiveTab('consultations')}
                      >
                        <Stethoscope className="h-4 w-4 mr-2" />
                        View All Consultations
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => setActiveTab('availability')}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Update Availability
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={handleLogout}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="availability">
            <EnhancedAvailabilityToggle />
          </TabsContent>
        </Tabs>
      </main>

      {/* Video Call Interface */}
      {showVideoCall && activeConsultation && (
        <Dialog open={showVideoCall} onOpenChange={(open) => !open && handleVideoCallEnd()}>
          <DialogContent className="max-w-full h-screen p-0 m-0">
            <VisuallyHidden>
              <DialogTitle>Video Consultation</DialogTitle>
            </VisuallyHidden>
            <PeerJSVideoCall
              consultationId={activeConsultation.id}
              participantName={doctorName}
              participantRole="doctor"
              onCallEnd={handleVideoCallEnd}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Rating Dialog */}
      {completedConsultation && (
        <RatingDialog
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
          consultationId={completedConsultation.id}
          doctorName={doctorName}
          ratedBy="doctor"
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </div>
  )
}
