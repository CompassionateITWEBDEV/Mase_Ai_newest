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
  Download,
  Eye,
  XCircle,
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
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null)

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
      case "background_check":
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
      case "background_check":
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
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case "in_progress":
        return <Badge className="bg-orange-100 text-orange-800">In Progress</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      default:
        return <Badge variant="secondary">{status || "Not Started"}</Badge>
    }
  }

  // Get proper document type label for document status keys (used in Document Status section)
  const getDocumentStatusLabel = (docKey: string) => {
    const key = docKey.toLowerCase()
    
    // Map document status keys to proper labels
    switch (key) {
      case 'resume':
        return 'Resume/CV'
      case 'license':
      case 'professional_license':
        return 'Professional License'
      case 'cpr':
      case 'cpr_certification':
        return 'CPR Certification'
      case 'tb_test':
      case 'tb_test_results':
        return 'TB Test Results'
      case 'degree_diploma':
        return 'Degree/Diploma'
      case 'drivers_license':
      case 'drivers license':
        return "Driver's License"
      case 'social_security_card':
      case 'social security card':
        return 'Social Security Card'
      case 'car_insurance':
      case 'car insurance':
        return 'Car Insurance'
      case 'background_check':
      case 'background check':
        return 'Background Check'
      case 'certifications':
        return 'Certifications'
      case 'reference':
      case 'references':
        return 'Reference Letter'
      default:
        // Capitalize and replace underscores
        return docKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  // Get proper document type label for uploaded documents (used in Uploaded Files section)
  const getDocumentTypeLabel = (doc: any) => {
    const docType = doc.document_type || ''
    const docName = doc.notes || doc.file_name || ''
    const lowerDocName = docName.toLowerCase()
    
    // Check notes for specific document names
    if (lowerDocName.includes('cpr') || lowerDocName.includes('acls') || lowerDocName.includes('bls')) {
      return 'CPR Certification'
    }
    if (lowerDocName.includes('tb') || lowerDocName.includes('tuberculosis')) {
      return 'TB Test Results'
    }
    if (lowerDocName.includes('degree') || lowerDocName.includes('diploma')) {
      return 'Degree/Diploma'
    }
    if (lowerDocName.includes('driver') || lowerDocName.includes('drivers_license')) {
      return "Driver's License"
    }
    if (lowerDocName.includes('social security')) {
      return 'Social Security Card'
    }
    if (lowerDocName.includes('car insurance') || lowerDocName.includes('auto insurance')) {
      return 'Car Insurance'
    }
    
    // Map document types to labels
    switch (docType) {
      case 'resume':
        return 'Resume/CV'
      case 'license':
        return 'Professional License'
      case 'certification':
        return 'Certification'
      case 'background_check':
        return 'Background Check'
      case 'reference':
        return 'Reference Letter'
      case 'other':
        // Try to extract from notes or file name
        if (docName && docName !== 'other') {
          return docName.replace('Uploaded: ', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }
        return 'Other Document'
      default:
        return docType.charAt(0).toUpperCase() + docType.slice(1) || 'Document'
    }
  }

  // Handle document verification
  const handleDocumentVerification = async (documentId: string, action: 'verified' | 'rejected', notes?: string) => {
    try {
      setVerifyingDocId(documentId)
      
      let response: Response
      try {
        const requestBody = {
          document_id: documentId,
          status: action,
          notes: notes || `Document ${action} by admin`
        }
        console.log('🔄 Verifying document:', { documentId, action, requestBody })
        
        response = await fetch('/api/applications/documents/verify', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })
        
        console.log('📡 Response received:', { status: response.status, statusText: response.statusText, ok: response.ok })
      } catch (fetchError: any) {
        console.error('❌ Network error during document verification:', fetchError)
        console.error('Error details:', {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack
        })
        throw new Error(`Network error: ${fetchError.message || 'Failed to connect to server. Please check your internet connection.'}`)
      }

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch (parseError) {
          // If response is not JSON, use status text
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      let data: any
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error('Invalid response from server. Please try again.')
      }

      if (data.success) {
        // Refresh applications to get updated document status
        try {
          await loadApplications()
        } catch (loadError) {
          console.error('Error loading applications after verification:', loadError)
        }

        // Update selected application if it's open - fetch fresh data from API
        if (selectedApplication) {
          try {
            const refreshResponse = await fetch('/api/applications')
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json()
              if (refreshData.success) {
                const updatedApp = refreshData.applications.find((app: any) => app.id === selectedApplication.id)
                if (updatedApp) {
                  setSelectedApplication(updatedApp)
                  console.log('✅ Updated selected application with fresh data after document verification')
                }
              }
            }
          } catch (refreshError) {
            console.error('Error refreshing selected application:', refreshError)
            // Fallback to finding from current applications list
            const updatedApp = applications.find(app => app.id === selectedApplication.id)
            if (updatedApp) {
              setSelectedApplication(updatedApp)
            }
          }
        }
        alert(`Document ${action} successfully!`)
      } else {
        throw new Error(data.error || 'Verification failed')
      }
    } catch (error: any) {
      console.error('Error updating document verification:', error)
      const errorMessage = error.message || 'Please try again.'
      alert(`Failed to ${action} document: ${errorMessage}`)
    } finally {
      setVerifyingDocId(null)
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
      // API accepts: 'pending', 'accepted', 'rejected', 'reviewing', 'interview_scheduled', 'background_check', 'offer_received', 'offer_accepted', 'offer_declined'
      const statusMap: { [key: string]: string } = {
        'screening': 'reviewing', // Map screening to reviewing
        'interview': 'interview_scheduled',
        'background': 'background_check', // Background check stage uses background_check status
        'hired': 'accepted',
        'rejected': 'rejected'
      }

      const apiStatus = statusMap[selectedStatus] || selectedStatus

      // Validate status against allowed values
      const allowedStatuses = ['pending', 'accepted', 'rejected', 'reviewing', 'interview_scheduled', 'background_check', 'offer_received', 'offer_accepted', 'offer_declined']
      
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

      // If status is "background", also update the background_consent to true and verify background check documents
      if (selectedStatus === 'background') {
        try {
          console.log('Updating background_consent to true for application:', selectedApplication.id)
          const formResponse = await fetch('/api/applications/form', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              job_application_id: selectedApplication.id,
              background_consent: true
            })
          })
          
          if (formResponse.ok) {
            const formData = await formResponse.json()
            if (formData.success) {
              console.log('Background check consent updated successfully')
            } else {
              console.error('Form update failed:', formData.error)
            }
          }
          
          // Also verify all background_check documents for this application
          if (selectedApplication.uploadedDocuments) {
            const backgroundDocs = selectedApplication.uploadedDocuments.filter((doc: any) => 
              doc.document_type === 'background_check' && doc.status === 'pending'
            )
            
            if (backgroundDocs.length > 0) {
              console.log(`Verifying ${backgroundDocs.length} background check document(s)...`)
              
              // Verify all background check documents in parallel
              const verifyPromises = backgroundDocs.map(async (bgDoc: any) => {
                try {
                  const verifyResponse = await fetch('/api/applications/documents/verify', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      document_id: bgDoc.id,
                      status: 'verified',
                      notes: 'Background check completed - status changed to background check stage'
                    })
                  })
                  
                  if (verifyResponse.ok) {
                    const verifyData = await verifyResponse.json()
                    if (verifyData.success) {
                      console.log('✅ Background check document verified:', bgDoc.id, bgDoc.file_name)
                      return { success: true, docId: bgDoc.id }
                    } else {
                      console.error('❌ Verification failed:', verifyData.error)
                      return { success: false, docId: bgDoc.id, error: verifyData.error }
                    }
                  } else {
                    const errorData = await verifyResponse.json().catch(() => ({}))
                    console.error('❌ Verification HTTP error:', verifyResponse.status, errorData)
                    return { success: false, docId: bgDoc.id, error: `HTTP ${verifyResponse.status}` }
                  }
                } catch (verifyError: any) {
                  console.error('❌ Error verifying background document:', verifyError)
                  return { success: false, docId: bgDoc.id, error: verifyError.message }
                }
              })
              
              // Wait for all verifications to complete
              const verifyResults = await Promise.all(verifyPromises)
              const successful = verifyResults.filter(r => r.success).length
              const failed = verifyResults.filter(r => !r.success).length
              
              if (successful > 0) {
                console.log(`✅ Successfully verified ${successful} background check document(s)`)
              }
              if (failed > 0) {
                console.warn(`⚠️ Failed to verify ${failed} background check document(s)`)
              }
            }
          }
        } catch (formError: any) {
          console.error('Error updating background consent:', formError)
        }
      }

      // Refresh applications list to get updated data (including background_consent and verified documents)
      await loadApplications()
      
      // Update selected application if modal is still open - fetch fresh data from API
      if (selectedApplication) {
        try {
          const refreshResponse = await fetch('/api/applications')
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json()
            if (refreshData.success) {
              const updatedApp = refreshData.applications.find((app: any) => app.id === selectedApplication.id)
              if (updatedApp) {
                setSelectedApplication(updatedApp)
              }
            }
          }
        } catch (refreshError) {
          console.error('Error refreshing selected application:', refreshError)
          // Fallback to finding from current applications list
          const updatedApp = applications.find(app => app.id === selectedApplication.id)
          if (updatedApp) {
            setSelectedApplication(updatedApp)
          }
        }
      }
      
      alert('Application status updated successfully!')
      setSelectedStatus("")
      
      // Close modal after a short delay to allow user to see the update
      setTimeout(() => {
        setSelectedApplication(null)
      }, 500)
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
                  statuses: ["background_check", "offer_received", "offer_accepted"],
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
                { category: "background", statuses: ["background_check", "offer_received", "offer_accepted"], title: "Background Check" },
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

                    {/* Healthcare Compliance */}
                    {(selectedApplication.formData.hipaa_training !== undefined || 
                      selectedApplication.formData.conflict_interest !== undefined || 
                      selectedApplication.formData.background_consent !== undefined) && (
                      <div className="space-y-4">
                        <h4 className="font-medium">Healthcare Compliance</h4>
                        
                        {/* HIPAA Compliance & Privacy Training */}
                        {(selectedApplication.formData.hipaa_training !== undefined || selectedApplication.formData.hipaa_details) && (
                          <div className="border rounded-lg p-4">
                            <h5 className="font-medium mb-3">HIPAA Compliance & Privacy Training</h5>
                            <div className="text-sm space-y-2">
                              <div>
                                <strong>Completed Training:</strong>{' '}
                                {selectedApplication.formData.hipaa_training ? (
                                  <Badge className="bg-green-100 text-green-800">Yes</Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800">No</Badge>
                                )}
                              </div>
                              {selectedApplication.formData.hipaa_details && (
                                <div>
                                  <p><strong>Details:</strong></p>
                                  <p className="text-gray-600 mt-1">{selectedApplication.formData.hipaa_details}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Conflict of Interest Disclosure */}
                        {(selectedApplication.formData.conflict_interest !== undefined || 
                          selectedApplication.formData.conflict_details ||
                          selectedApplication.formData.relationship_conflict !== undefined) && (
                          <div className="border rounded-lg p-4">
                            <h5 className="font-medium mb-3">Conflict of Interest Disclosure</h5>
                            <div className="text-sm space-y-2">
                              <div>
                                <strong>Has Conflict of Interest:</strong>{' '}
                                {selectedApplication.formData.conflict_interest ? (
                                  <Badge className="bg-yellow-100 text-yellow-800">Yes</Badge>
                                ) : (
                                  <Badge className="bg-green-100 text-green-800">No</Badge>
                                )}
                              </div>
                              {selectedApplication.formData.conflict_details && (
                                <div>
                                  <p><strong>Conflict Details:</strong></p>
                                  <p className="text-gray-600 mt-1">{selectedApplication.formData.conflict_details}</p>
                                </div>
                              )}
                              {selectedApplication.formData.relationship_conflict !== undefined && (
                                <div>
                                  <strong>Relationship Conflict:</strong>{' '}
                                  {selectedApplication.formData.relationship_conflict ? (
                                    <Badge className="bg-yellow-100 text-yellow-800">Yes</Badge>
                                  ) : (
                                    <Badge className="bg-green-100 text-green-800">No</Badge>
                                  )}
                                </div>
                              )}
                              {selectedApplication.formData.relationship_details && (
                                <div>
                                  <p><strong>Relationship Details:</strong></p>
                                  <p className="text-gray-600 mt-1">{selectedApplication.formData.relationship_details}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Background Check Authorization */}
                        {(selectedApplication.formData.background_consent !== undefined ||
                          selectedApplication.formData.conviction_history !== undefined ||
                          selectedApplication.formData.registry_history !== undefined) && (
                          <div className="border rounded-lg p-4">
                            <h5 className="font-medium mb-3">Background Check Authorization</h5>
                            <div className="text-sm space-y-2">
                              <div>
                                <strong>Authorization Consent:</strong>{' '}
                                {selectedApplication.formData.background_consent ? (
                                  <Badge className="bg-green-100 text-green-800">Authorized</Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800">Not Authorized</Badge>
                                )}
                              </div>
                              {selectedApplication.formData.conviction_history !== undefined && (
                                <div>
                                  <strong>Conviction History:</strong>{' '}
                                  {selectedApplication.formData.conviction_history ? (
                                    <Badge className="bg-yellow-100 text-yellow-800">Yes</Badge>
                                  ) : (
                                    <Badge className="bg-green-100 text-green-800">No</Badge>
                                  )}
                                </div>
                              )}
                              {selectedApplication.formData.conviction_details && (
                                <div>
                                  <p><strong>Conviction Details:</strong></p>
                                  <p className="text-gray-600 mt-1">{selectedApplication.formData.conviction_details}</p>
                                </div>
                              )}
                              {selectedApplication.formData.registry_history !== undefined && (
                                <div>
                                  <strong>Registry History:</strong>{' '}
                                  {selectedApplication.formData.registry_history ? (
                                    <Badge className="bg-yellow-100 text-yellow-800">Yes</Badge>
                                  ) : (
                                    <Badge className="bg-green-100 text-green-800">No</Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Healthcare Associated Prevention Program (HAPP) Statement */}
                    {(selectedApplication.formData.infection_training !== undefined || 
                      selectedApplication.formData.infection_details) && (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Healthcare Associated Prevention Program (HAPP) Statement</h4>
                        <div className="space-y-4">
                          <div className="bg-blue-50 p-4 rounded border border-blue-200">
                            <h5 className="font-medium text-blue-900 mb-2">HAPP Commitment Statement</h5>
                            <p className="text-sm text-blue-800 mb-3">
                              IrishTriplets is committed to preventing healthcare-associated infections and promoting patient
                              safety. All employees must adhere to evidence-based infection prevention practices.
                            </p>
                            <ul className="text-sm text-blue-800 space-y-1">
                              <li>• Follow proper hand hygiene protocols</li>
                              <li>• Use personal protective equipment (PPE) appropriately</li>
                              <li>• Adhere to isolation precautions</li>
                              <li>• Report potential infections or safety concerns immediately</li>
                              <li>• Participate in ongoing infection prevention training</li>
                            </ul>
                          </div>
                          <div className="text-sm space-y-2">
                            <div>
                              <strong>Infection Prevention Training:</strong>{' '}
                              {selectedApplication.formData.infection_training ? (
                                <Badge className="bg-green-100 text-green-800">Completed</Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800">Not Completed</Badge>
                              )}
                            </div>
                            {selectedApplication.formData.infection_details && (
                              <div>
                                <p><strong>Training Details:</strong></p>
                                <p className="text-gray-600 mt-1">{selectedApplication.formData.infection_details}</p>
                              </div>
                            )}
                          </div>
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
                        <span className="text-sm font-medium">{getDocumentStatusLabel(doc)}</span>
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
                                    {getDocumentTypeLabel(doc)}
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
                            <div className="flex items-center space-x-2">
                              {doc.status === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDocumentVerification(doc.id, 'verified')}
                                    disabled={verifyingDocId === doc.id}
                                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verify
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const notes = prompt('Enter rejection reason (optional):')
                                      if (notes !== null) {
                                        handleDocumentVerification(doc.id, 'rejected', notes || undefined)
                                      }
                                    }}
                                    disabled={verifyingDocId === doc.id}
                                    className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    if (!doc.file_url) {
                                      alert('File URL not available')
                                      return
                                    }

                                    // Check if it's a base64 data URL (same method as in-service training)
                                    if (doc.file_url.startsWith('data:')) {
                                      console.log("Opening base64 file...")
                                      // Create a blob URL from base64 data
                                      const base64Data = doc.file_url.split(',')[1]
                                      const mimeType = doc.file_url.split(',')[0].split(':')[1].split(';')[0]
                                      
                                      // Decode base64
                                      const byteCharacters = atob(base64Data)
                                      const byteNumbers = new Array(byteCharacters.length)
                                      for (let i = 0; i < byteCharacters.length; i++) {
                                        byteNumbers[i] = byteCharacters.charCodeAt(i)
                                      }
                                      const byteArray = new Uint8Array(byteNumbers)
                                      const blob = new Blob([byteArray], { type: mimeType })
                                      const blobUrl = URL.createObjectURL(blob)
                                      
                                      // Open blob URL in new tab
                                      const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer')
                                      if (newWindow) {
                                        // Clean up blob URL after a delay
                                        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
                                        console.log("Base64 file opened successfully")
                                      } else {
                                        alert('Please allow pop-ups to view the file.')
                                      }
                                    } else if (doc.file_url.includes('supabase.co/storage') || doc.file_url.startsWith('http://') || doc.file_url.startsWith('https://')) {
                                      // Supabase storage URL or regular HTTP URL
                                      console.log("Opening URL:", doc.file_url)
                                      const newWindow = window.open(doc.file_url, '_blank', 'noopener,noreferrer')
                                      if (!newWindow) {
                                        alert('Please allow pop-ups to view the file.')
                                      }
                                    } else {
                                      // Old placeholder path or unknown format
                                      alert('File was uploaded with old format and is not available. Please re-upload the file.')
                                    }
                                  } catch (error: any) {
                                    console.error('Error viewing file:', error)
                                    alert(`Error viewing file: ${error.message || 'Unknown error'}`)
                                  }
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    if (!doc.file_url) {
                                      alert('File URL not available')
                                      return
                                    }

                                    // Check if it's a base64 data URL (same method as in-service training)
                                    if (doc.file_url.startsWith('data:')) {
                                      console.log("Downloading base64 file...")
                                      // Create a blob URL from base64 data
                                      const base64Data = doc.file_url.split(',')[1]
                                      const mimeType = doc.file_url.split(',')[0].split(':')[1].split(';')[0]
                                      
                                      // Decode base64
                                      const byteCharacters = atob(base64Data)
                                      const byteNumbers = new Array(byteCharacters.length)
                                      for (let i = 0; i < byteCharacters.length; i++) {
                                        byteNumbers[i] = byteCharacters.charCodeAt(i)
                                      }
                                      const byteArray = new Uint8Array(byteNumbers)
                                      const blob = new Blob([byteArray], { type: mimeType })
                                      const blobUrl = URL.createObjectURL(blob)
                                      
                                      // Create download link
                                      const a = document.createElement('a')
                                      a.href = blobUrl
                                      a.download = doc.file_name || 'document'
                                      a.style.display = 'none'
                                      document.body.appendChild(a)
                                      a.click()
                                      
                                      // Clean up
                                      setTimeout(() => {
                                        document.body.removeChild(a)
                                        URL.revokeObjectURL(blobUrl)
                                      }, 100)
                                    } else if (doc.file_url.includes('supabase.co/storage') || doc.file_url.startsWith('http://') || doc.file_url.startsWith('https://')) {
                                      // Supabase storage URL or regular HTTP URL
                                      const a = document.createElement('a')
                                      a.href = doc.file_url
                                      a.download = doc.file_name || 'document'
                                      a.target = '_blank'
                                      a.style.display = 'none'
                                      document.body.appendChild(a)
                                      a.click()
                                      setTimeout(() => document.body.removeChild(a), 100)
                                    } else {
                                      // Old placeholder path or unknown format
                                      alert('File was uploaded with old format and is not available. Please re-upload the file.')
                                    }
                                  } catch (error: any) {
                                    console.error('Error downloading file:', error)
                                    alert(`Error downloading file: ${error.message || 'Unknown error'}`)
                                  }
                                }}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            </div>
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
                  {/* Email, Call, and Message buttons - commented out until functionality is implemented */}
                  {/* <div className="flex space-x-2">
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
                  </div> */}
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
