"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
  Search,
  Mail,
  Phone,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Send,
  LinkIcon,
  Copy,
  CheckCircle,
  Upload,
  GraduationCap,
  Briefcase,
  Shield,
  AlertTriangle,
  Heart,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ApplicationTracking() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [positionFilter, setPositionFilter] = useState("all")
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [candidateEmail, setCandidateEmail] = useState("")
  const [candidateName, setCandidateName] = useState("")
  const [personalMessage, setPersonalMessage] = useState("")
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const [applications, setApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [isSavingNote, setIsSavingNote] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [])

  // Reset selected status and note when application changes
  useEffect(() => {
    if (selectedApplication) {
      setSelectedStatus("")
      setNoteText(selectedApplication.notes || "")
    }
  }, [selectedApplication])

  const handleSaveNote = async () => {
    if (!selectedApplication || !selectedApplication.id) {
      alert('No application selected')
      return
    }

    setIsSavingNote(true)

    try {
      const response = await fetch('/api/applications/update-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: selectedApplication.id,
          status: selectedApplication.status, // Keep current status
          notes: noteText.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save note')
      }

      alert('Note saved successfully!')
      
      // Refresh applications list to get updated notes
      await loadApplications()
      
      // Update the selected application with new notes
      const updatedApplicationsResponse = await fetch('/api/applications')
      if (updatedApplicationsResponse.ok) {
        const updatedApplications = await updatedApplicationsResponse.json()
        if (updatedApplications.success) {
          const updatedApp = updatedApplications.applications.find((app: any) => app.id === selectedApplication.id)
          if (updatedApp) {
            setSelectedApplication(updatedApp)
          }
        }
      }
    } catch (error: any) {
      console.error('Error saving note:', error)
      alert(`Failed to save note: ${error.message || 'Unknown error'}`)
    } finally {
      setIsSavingNote(false)
    }
  }

  // Map database statuses to display categories for pipeline
  const getStatusCategory = (status: string): string => {
    switch (status) {
      case "pending":
        return "new"
      case "reviewing":
        return "screening"
      case "interview_scheduled":
        return "interview"
      case "offer_received":
      case "offer_accepted":
        return "background"
      case "accepted":
        return "hired"
      case "rejected":
      case "offer_declined":
        return "rejected"
      default:
        return status // Return as-is if not mapped
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "new":
        return "bg-blue-100 text-blue-800"
      case "reviewing":
      case "screening":
        return "bg-yellow-100 text-yellow-800"
      case "interview_scheduled":
      case "interview":
        return "bg-purple-100 text-purple-800"
      case "offer_received":
      case "offer_accepted":
      case "background":
        return "bg-orange-100 text-orange-800"
      case "accepted":
      case "hired":
        return "bg-green-100 text-green-800"
      case "rejected":
      case "offer_declined":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDocumentStatus = (status: string) => {
    switch (status) {
      case "uploaded":
        return <Badge className="bg-blue-100 text-blue-800">Uploaded</Badge>
      case "verified":
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "in_progress":
        return <Badge className="bg-orange-100 text-orange-800">In Progress</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      default:
        return <Badge variant="secondary">Not Started</Badge>
    }
  }

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    const matchesPosition = positionFilter === "all" || app.position.includes(positionFilter)
    return matchesSearch && matchesStatus && matchesPosition
  })

  const copyApplicationLink = () => {
    const link = `${window.location.origin}/application`
    navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const sendApplicationLink = async () => {
    if (!candidateEmail || !candidateEmail.trim()) {
      alert('Please enter a valid email address')
      return
    }

    setIsSendingEmail(true)
    setEmailSent(false)

    try {
      const response = await fetch('/api/applications/send-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: candidateEmail.trim(),
          candidateName: candidateName.trim() || undefined,
          personalMessage: personalMessage.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send email')
      }

      setEmailSent(true)
      alert('Application link sent successfully!')
      
      // Clear form after successful send
      setCandidateEmail("")
      setCandidateName("")
      setPersonalMessage("")
      
      // Reset sent state after 3 seconds
      setTimeout(() => setEmailSent(false), 3000)
    } catch (error: any) {
      console.error('Error sending application link:', error)
      alert(`Failed to send email: ${error.message || 'Unknown error'}`)
    } finally {
      setIsSendingEmail(false)
    }
  }


  const handleApplyClick = () => {
    // Navigate to application page
    router.push('/application')
  }

  const loadApplications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/applications')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setApplications(data.applications || [])
      } else {
        console.error('Failed to load applications:', data.error)
        setApplications([])
      }
    } catch (error: any) {
      console.error('Failed to load applications:', error?.message || error || 'Unknown error')
      setApplications([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedApplication) {
      alert('No application selected')
      return
    }

    if (!selectedApplication.id) {
      alert('Invalid application ID')
      return
    }

    if (!selectedStatus) {
      alert('Please select a status to update')
      return
    }

    setIsUpdatingStatus(true)

    try {
      // Map UI status values to API status values
      // API accepts: 'pending', 'accepted', 'rejected', 'reviewing', 'interview_scheduled', 'offer_received', 'offer_accepted', 'offer_declined'
      const statusMap: { [key: string]: string } = {
        'screening': 'reviewing', // Map screening to reviewing
        'interview': 'interview_scheduled',
        'background': 'reviewing',
        'hired': 'accepted',
        'rejected': 'rejected'
      }

      const apiStatus = statusMap[selectedStatus] || selectedStatus

      // Validate status against allowed values
      const allowedStatuses = ['pending', 'accepted', 'rejected', 'reviewing', 'interview_scheduled', 'offer_received', 'offer_accepted', 'offer_declined']
      
      if (!allowedStatuses.includes(apiStatus)) {
        alert(`Invalid status: ${apiStatus}. Please select a valid status.`)
        setIsUpdatingStatus(false)
        return
      }

      console.log('Updating status with:', {
        applicationId: selectedApplication.id,
        status: apiStatus,
        selectedStatus
      })

      let response: Response
      try {
        response = await fetch('/api/applications/update-status', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            applicationId: selectedApplication.id,
            status: apiStatus,
            notes: `Status updated to ${selectedStatus}`
          })
        })
        console.log('Response status:', response.status, response.statusText)
      } catch (fetchError: any) {
        console.error('Network error:', fetchError)
        throw new Error(`Network error: ${fetchError.message || 'Could not connect to server. Please check your internet connection and try again.'}`)
      }

      // Check if response is ok before parsing
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      let data: any
      try {
        data = await response.json()
      } catch (parseError: any) {
        console.error('Failed to parse response:', parseError)
        throw new Error('Invalid response from server. Please try again.')
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to update status')
      }

      alert('Application status updated successfully!')
      
      // Refresh applications list
      await loadApplications()
      
      // Clear selected status and close modal
      setSelectedStatus("")
      setSelectedApplication(null)
    } catch (error: any) {
      console.error('Error updating status:', error)
      alert(`Failed to update status: ${error.message || 'Unknown error'}`)
    } finally {
      setIsUpdatingStatus(false)
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
                <h1 className="text-2xl font-bold text-gray-900">Application Tracking</h1>
                <p className="text-gray-600">Manage and track job applications</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Share Application Link
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Job Application Link</DialogTitle>
                    <DialogDescription>Share the application link with potential candidates</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="app-link">Application Link</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="app-link"
                          value={`${typeof window !== "undefined" ? window.location.origin : ""}/application`}
                          readOnly
                        />
                        <Button onClick={copyApplicationLink} variant="outline">
                          {linkCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    {emailSent && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800">Email sent successfully!</span>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="candidate-name">Candidate Name (Optional)</Label>
                      <Input 
                        id="candidate-name" 
                        placeholder="John Doe"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        disabled={isSendingEmail}
                      />
                    </div>

                    <div>
                      <Label htmlFor="candidate-email">Email Address *</Label>
                      <Input 
                        id="candidate-email" 
                        type="email"
                        placeholder="candidate@email.com"
                        value={candidateEmail}
                        onChange={(e) => setCandidateEmail(e.target.value)}
                        disabled={isSendingEmail}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="personal-message">Personal Message (Optional)</Label>
                      <Textarea
                        id="personal-message"
                        placeholder="Add a personal note to the email..."
                        value={personalMessage}
                        onChange={(e) => setPersonalMessage(e.target.value)}
                        disabled={isSendingEmail}
                        rows={3}
                      />
                    </div>

                    <Button 
                      onClick={sendApplicationLink}
                      disabled={isSendingEmail || !candidateEmail.trim()}
                      className="w-full"
                    >
                      {isSendingEmail ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Application Link
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={handleApplyClick} disabled={isLoadingProfile}>
                {isLoadingProfile ? "Loading..." : "New Application"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pipeline">Application Pipeline</TabsTrigger>
            <TabsTrigger value="candidates">All Candidates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-6">
            {/* Pipeline Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                {
                  stage: "New",
                  category: "new",
                  statuses: ["pending"],
                  color: "bg-blue-500",
                },
                {
                  stage: "Screening",
                  category: "screening",
                  statuses: ["reviewing"],
                  color: "bg-yellow-500",
                },
                {
                  stage: "Interview",
                  category: "interview",
                  statuses: ["interview_scheduled"],
                  color: "bg-purple-500",
                },
                {
                  stage: "Background",
                  category: "background",
                  statuses: ["offer_received", "offer_accepted"],
                  color: "bg-orange-500",
                },
                {
                  stage: "Hired",
                  category: "hired",
                  statuses: ["accepted"],
                  color: "bg-green-500",
                },
              ].map((stage) => {
                const count = applications.filter((app) => 
                  stage.statuses.includes(app.status)
                ).length
                return {
                  ...stage,
                  count
                }
              }).map((stage) => (
                <Card key={stage.stage}>
                  <CardContent className="p-4 text-center">
                    <div
                      className={`w-12 h-12 rounded-full ${stage.color} mx-auto mb-2 flex items-center justify-center`}
                    >
                      <span className="text-white font-bold text-lg">{stage.count}</span>
                    </div>
                    <h3 className="font-medium">{stage.stage}</h3>
                    <p className="text-sm text-gray-600">Applications</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pipeline Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {[
                { category: "new", statuses: ["pending"], title: "New Applications" },
                { category: "screening", statuses: ["reviewing"], title: "Screening" },
                { category: "interview", statuses: ["interview_scheduled"], title: "Interview" },
                { category: "background", statuses: ["offer_received", "offer_accepted"], title: "Background Check" },
                { category: "hired", statuses: ["accepted"], title: "Hired" }
              ].map(({ category, statuses, title }) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      {title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {applications
                      .filter((app) => statuses.includes(app.status))
                      .map((app) => (
                        <div
                          key={app.id}
                          className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-sm">{app.name}</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{app.position}</p>
                          <p className="text-xs text-gray-500">Applied: {app.appliedDate}</p>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="candidates" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by name, email, or application ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewing">Reviewing/Screening</SelectItem>
                        <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                        <SelectItem value="offer_received">Offer Received</SelectItem>
                        <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
                        <SelectItem value="accepted">Hired</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={positionFilter} onValueChange={setPositionFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Positions</SelectItem>
                        <SelectItem value="RN">RN</SelectItem>
                        <SelectItem value="PT">PT</SelectItem>
                        <SelectItem value="OT">OT</SelectItem>
                        <SelectItem value="HHA">HHA</SelectItem>
                        <SelectItem value="MSW">MSW</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Applications List */}
            <div className="space-y-4">
              {filteredApplications.map((app) => (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{app.name}</h3>
                          <p className="text-sm text-gray-600">{app.position}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {app.email}
                            </span>
                            <span className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {app.phone}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Applied: {app.appliedDate}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(app.status)}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => setSelectedApplication(app)}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{applications.length}</p>
                      <p className="text-gray-600 text-sm">Total Applications</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">
                        {applications.filter((app) => app.status === "accepted").length}
                      </p>
                      <p className="text-gray-600 text-sm">Hired This Month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">
                        {(() => {
                          const acceptedApps = applications.filter((app) => app.status === "accepted")
                          if (acceptedApps.length === 0) return "0"
                          
                          const now = new Date()
                          const totalDays = acceptedApps.reduce((sum, app) => {
                            // Try to get the raw date from applicationData first, then fallback to parsing appliedDate
                            let appliedDate: Date
                            if (app.applicationData?.applied_date) {
                              appliedDate = new Date(app.applicationData.applied_date)
                            } else {
                              // Parse the formatted date string (MM/DD/YYYY)
                              const dateStr = app.appliedDate
                              if (dateStr && typeof dateStr === 'string') {
                                const [month, day, year] = dateStr.split('/')
                                appliedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                              } else {
                                return sum // Skip if no date available
                              }
                            }
                            
                            // Check if date is valid
                            if (isNaN(appliedDate.getTime())) {
                              return sum // Skip invalid dates
                            }
                            
                            const daysDiff = Math.floor((now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24))
                            return sum + Math.max(0, daysDiff) // Ensure non-negative
                          }, 0)
                          
                          const avgDays = acceptedApps.length > 0 ? Math.round(totalDays / acceptedApps.length) : 0
                          return avgDays.toString()
                        })()}
                      </p>
                      <p className="text-gray-600 text-sm">Avg. Days to Hire</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <User className="h-8 w-8 text-orange-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">
                        {(() => {
                          const total = applications.length
                          const accepted = applications.filter((app) => app.status === "accepted").length
                          if (total === 0) return "0%"
                          return Math.round((accepted / total) * 100) + "%"
                        })()}
                      </p>
                      <p className="text-gray-600 text-sm">Conversion Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Position Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Applications by Position</CardTitle>
                <CardDescription>Breakdown of applications by job position</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { code: "rn", label: "RN", name: "Registered Nurse" },
                    { code: "pt", label: "PT", name: "Physical Therapist" },
                    { code: "ot", label: "OT", name: "Occupational Therapist" },
                    { code: "st", label: "ST", name: "Speech Therapist" },
                    { code: "hha", label: "HHA", name: "Home Health Aide" },
                    { code: "msw", label: "MSW", name: "Master of Social Work" }
                  ].map((position) => {
                    // Match applications by checking multiple fields and formats
                    const positionApps = applications.filter((app) => {
                      const pos = (app.position || "").toLowerCase()
                      const desiredPos = (app.formData?.desired_position || "").toLowerCase()
                      const jobTitle = (app.applicationData?.job_title || "").toLowerCase()
                      
                      // Check if position code, label, or name appears in any of these fields
                      return (
                        pos.includes(position.code) ||
                        pos.includes(position.label.toLowerCase()) ||
                        pos.includes(position.name.toLowerCase()) ||
                        desiredPos.includes(position.code) ||
                        desiredPos.includes(position.label.toLowerCase()) ||
                        jobTitle.includes(position.code) ||
                        jobTitle.includes(position.label.toLowerCase()) ||
                        jobTitle.includes(position.name.toLowerCase())
                      )
                    })
                    
                    const hired = positionApps.filter((app) => app.status === "accepted").length
                    const total = positionApps.length
                    const rejected = positionApps.filter((app) => app.status === "rejected" || app.status === "offer_declined").length
                    
                    // Calculate percentages accurately
                    const hireRate = total > 0 ? Math.round((hired / total) * 100) : 0
                    const distributionPercentage = applications.length > 0 ? Math.round((total / applications.length) * 100) : 0
                    const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0
                    const pendingRate = total > 0 ? Math.round(((total - hired - rejected) / total) * 100) : 0

                    return (
                      <div key={position.code} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{position.label} ({position.name})</span>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-600 font-medium">{hired} hired</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">{total} total</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {/* Hire Rate Progress Bar */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-20">Hire Rate:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-green-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${hireRate}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-700 w-12 text-right">{hireRate}%</span>
                          </div>
                          {/* Distribution Progress Bar */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-20">Distribution:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${distributionPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-700 w-12 text-right">{distributionPercentage}%</span>
                          </div>
                        </div>
                        {/* Summary Stats */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            {hired} Hired ({hireRate}%)
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                            {total - hired - rejected} Pending ({pendingRate}%)
                          </span>
                          {rejected > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              {rejected} Rejected ({rejectionRate}%)
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Application Detail Modal */}
        {selectedApplication && (
          <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>
                    {selectedApplication.name} - {selectedApplication.id}
                  </span>
                  <Badge className={getStatusColor(selectedApplication.status)}>
                    {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                  </Badge>
                </DialogTitle>
                <DialogDescription>{selectedApplication.position}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Contact Information</h4>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {selectedApplication.email}
                      </p>
                      <p className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {selectedApplication.phone}
                      </p>
                      {selectedApplication.formData?.address && (
                        <p className="flex items-center">
                          <span className="h-4 w-4 mr-2 text-gray-400">📍</span>
                          {selectedApplication.formData.address}, {selectedApplication.formData.city}, {selectedApplication.formData.state} {selectedApplication.formData.zip_code}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Application Details</h4>
                    <div className="space-y-1 text-sm">
                      <p>Applied: {selectedApplication.appliedDate}</p>
                      <p>Position: {selectedApplication.formData?.desired_position || selectedApplication.position}</p>
                      <p>Experience: {selectedApplication.experience}</p>
                      <p>Education: {selectedApplication.education}</p>
                      {selectedApplication.formData?.employment_type && (
                        <p>Employment Type: {selectedApplication.formData.employment_type}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detailed Form Information */}
                {selectedApplication.formData && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Detailed Application Information</h4>
                    
                    {/* Personal Information */}
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-3">Personal Information</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Full Name:</strong> {selectedApplication.formData.first_name} {selectedApplication.formData.middle_initial} {selectedApplication.formData.last_name}</p>
                          <p><strong>Date of Birth:</strong> {selectedApplication.formData.date_of_birth || 'Not provided'}</p>
                          <p><strong>SSN:</strong> {selectedApplication.formData.ssn ? '***-**-' + selectedApplication.formData.ssn.slice(-4) : 'Not provided'}</p>
                        </div>
                        <div>
                          <p><strong>Email:</strong> {selectedApplication.formData.email}</p>
                          <p><strong>Phone:</strong> {selectedApplication.formData.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Education */}
                    {(selectedApplication.formData.high_school || selectedApplication.formData.college) && (
                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium mb-3">Education</h5>
                        <div className="text-sm space-y-2">
                          {selectedApplication.formData.high_school && (
                            <p><strong>High School:</strong> {selectedApplication.formData.high_school} {selectedApplication.formData.hs_grad_year && `(${selectedApplication.formData.hs_grad_year})`}</p>
                          )}
                          {selectedApplication.formData.college && (
                            <p><strong>College:</strong> {selectedApplication.formData.college}</p>
                          )}
                          {selectedApplication.formData.degree && (
                            <p><strong>Degree:</strong> {selectedApplication.formData.degree}</p>
                          )}
                          {selectedApplication.formData.major && (
                            <p><strong>Major:</strong> {selectedApplication.formData.major}</p>
                          )}
                          {selectedApplication.formData.college_grad_year && (
                            <p><strong>Graduation Year:</strong> {selectedApplication.formData.college_grad_year}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Work Experience */}
                    {(selectedApplication.formData.work_history || selectedApplication.formData.specialties) && (
                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium mb-3">Work Experience</h5>
                        <div className="text-sm space-y-2">
                          {selectedApplication.formData.years_experience && (
                            <p><strong>Years of Experience:</strong> {selectedApplication.formData.years_experience}</p>
                          )}
                          {selectedApplication.formData.work_history && (
                            <div>
                              <p><strong>Work History:</strong></p>
                              <p className="text-gray-600 mt-1">{selectedApplication.formData.work_history}</p>
                            </div>
                          )}
                          {selectedApplication.formData.specialties && (
                            <div>
                              <p><strong>Specialties:</strong></p>
                              <p className="text-gray-600 mt-1">{selectedApplication.formData.specialties}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Licenses & Certifications */}
                    {(selectedApplication.formData.license || selectedApplication.formData.cpr || selectedApplication.formData.other_certs) && (
                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium mb-3">Licenses & Certifications</h5>
                        <div className="text-sm space-y-2">
                          {selectedApplication.formData.license && (
                            <p><strong>Professional License:</strong> {selectedApplication.formData.license} {selectedApplication.formData.license_state && `(${selectedApplication.formData.license_state})`}</p>
                          )}
                          {selectedApplication.formData.license_expiry && (
                            <p><strong>License Expiry:</strong> {selectedApplication.formData.license_expiry}</p>
                          )}
                          {selectedApplication.formData.cpr && (
                            <p><strong>CPR Certification:</strong> {selectedApplication.formData.cpr}</p>
                          )}
                          {selectedApplication.formData.other_certs && (
                            <div>
                              <p><strong>Other Certifications:</strong></p>
                              <p className="text-gray-600 mt-1">{selectedApplication.formData.other_certs}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* References */}
                    {(selectedApplication.formData.reference_1_name || selectedApplication.formData.reference_2_name || selectedApplication.formData.reference_3_name) && (
                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium mb-3">Professional References</h5>
                        <div className="text-sm space-y-3">
                          {selectedApplication.formData.reference_1_name && (
                            <div className="border-l-2 border-blue-200 pl-3">
                              <p><strong>Reference 1:</strong> {selectedApplication.formData.reference_1_name}</p>
                              <p><strong>Relationship:</strong> {selectedApplication.formData.reference_1_relationship}</p>
                              <p><strong>Company:</strong> {selectedApplication.formData.reference_1_company}</p>
                              <p><strong>Phone:</strong> {selectedApplication.formData.reference_1_phone}</p>
                              {selectedApplication.formData.reference_1_email && (
                                <p><strong>Email:</strong> {selectedApplication.formData.reference_1_email}</p>
                              )}
                            </div>
                          )}
                          {selectedApplication.formData.reference_2_name && (
                            <div className="border-l-2 border-blue-200 pl-3">
                              <p><strong>Reference 2:</strong> {selectedApplication.formData.reference_2_name}</p>
                              <p><strong>Relationship:</strong> {selectedApplication.formData.reference_2_relationship}</p>
                              <p><strong>Company:</strong> {selectedApplication.formData.reference_2_company}</p>
                              <p><strong>Phone:</strong> {selectedApplication.formData.reference_2_phone}</p>
                              {selectedApplication.formData.reference_2_email && (
                                <p><strong>Email:</strong> {selectedApplication.formData.reference_2_email}</p>
                              )}
                            </div>
                          )}
                          {selectedApplication.formData.reference_3_name && (
                            <div className="border-l-2 border-blue-200 pl-3">
                              <p><strong>Reference 3:</strong> {selectedApplication.formData.reference_3_name}</p>
                              <p><strong>Relationship:</strong> {selectedApplication.formData.reference_3_relationship}</p>
                              <p><strong>Company:</strong> {selectedApplication.formData.reference_3_company}</p>
                              <p><strong>Phone:</strong> {selectedApplication.formData.reference_3_phone}</p>
                              {selectedApplication.formData.reference_3_email && (
                                <p><strong>Email:</strong> {selectedApplication.formData.reference_3_email}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Emergency Contact */}
                    {selectedApplication.formData.emergency_name && (
                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium mb-3">Emergency Contact</h5>
                        <div className="text-sm space-y-1">
                          <p><strong>Name:</strong> {selectedApplication.formData.emergency_name}</p>
                          <p><strong>Relationship:</strong> {selectedApplication.formData.emergency_relationship}</p>
                          <p><strong>Phone:</strong> {selectedApplication.formData.emergency_phone}</p>
                          {selectedApplication.formData.emergency_email && (
                            <p><strong>Email:</strong> {selectedApplication.formData.emergency_email}</p>
                          )}
                          {selectedApplication.formData.emergency_address && (
                            <p><strong>Address:</strong> {selectedApplication.formData.emergency_address}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Documents Status */}
                <div>
                  <h4 className="font-medium mb-3">Document Status</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {Object.entries(selectedApplication.documents).map(([doc, status]) => (
                      <div key={doc} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm capitalize">{doc.replace(/_/g, ' ')}</span>
                        {getDocumentStatus(status as string)}
                      </div>
                    ))}
                  </div>
                  
                  {/* Uploaded Documents List */}
                  {selectedApplication.uploadedDocuments && selectedApplication.uploadedDocuments.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2 text-sm">Uploaded Files</h5>
                      <div className="space-y-2">
                        {selectedApplication.uploadedDocuments.map((doc: any) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center space-x-3 flex-1">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {doc.document_type}
                                  </Badge>
                                  {getDocumentStatus(doc.status)}
                                  <span className="text-xs text-gray-500">
                                    {doc.file_size ? `${(doc.file_size / (1024 * 1024)).toFixed(2)} MB` : ''}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(doc.uploaded_date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {doc.file_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (doc.file_url.startsWith('http')) {
                                    window.open(doc.file_url, '_blank')
                                  } else {
                                    alert('File URL: ' + doc.file_url)
                                  }
                                }}
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="font-medium mb-3">Application Timeline</h4>
                  <div className="space-y-3">
                    {selectedApplication.timeline.map((event: any, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{event.action}</p>
                          <p className="text-xs text-gray-500">
                            {event.date} • {event.user}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  {selectedApplication.notes && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedApplication.notes}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Textarea 
                      placeholder="Add a note about this candidate..." 
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      disabled={isSavingNote}
                      rows={4}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNoteText(selectedApplication.notes || "")}
                        disabled={isSavingNote}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveNote}
                        disabled={isSavingNote || !noteText.trim()}
                      >
                        {isSavingNote ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Saving...
                          </>
                        ) : (
                          'Save Note'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Change Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="screening">Move to Screening</SelectItem>
                        <SelectItem value="interview">Schedule Interview</SelectItem>
                        <SelectItem value="background">Background Check</SelectItem>
                        <SelectItem value="hired">Mark as Hired</SelectItem>
                        <SelectItem value="rejected">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleStatusUpdate}
                      disabled={!selectedStatus || isUpdatingStatus}
                    >
                      {isUpdatingStatus ? "Updating..." : "Update Status"}
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
