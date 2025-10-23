"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import EmployerDocumentViewer from "@/components/employer-document-viewer"
import InterviewSchedulingModal from "@/components/interview-scheduling-modal"
import JobOfferModal from "@/components/job-offer-modal"
import EmployerNotificationSystem from "@/components/employer-notification-system"
import { 
  Briefcase, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  DollarSign, 
  MapPin, 
  Clock, 
  Users,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
  Building2,
  Download,
  Calendar,
  Send,
  UserCheck,
  Star
} from "lucide-react"

interface JobPosting {
  id: string
  title: string
  description: string
  department: string
  job_type: string
  position_type: string
  experience_required: string
  education_required: string
  requirements: string
  benefits: string
  salary_min: number
  salary_max: number
  salary_type: string
  location_type: string
  city: string
  state: string
  zip_code: string
  status: string
  is_featured: boolean
  is_urgent: boolean
  views_count: number
  applications_count: number
  posted_date: string
  created_at: string
}

export default function EmployerDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false)
  const [isEditJobOpen, setIsEditJobOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  const [candidates, setCandidates] = useState<any[]>([])
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false)
  const [selectedApplicantDocuments, setSelectedApplicantDocuments] = useState<any[]>([])
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false)
  const [selectedApplicantName, setSelectedApplicantName] = useState('')
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false)
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false)
  const [selectedApplicationForAction, setSelectedApplicationForAction] = useState<any>(null)

  // Employer info from login
  const [employerInfo, setEmployerInfo] = useState<any>(null)

  // Get employer ID from employer info
  const employerId = employerInfo?.id

  // Load employer info from localStorage (set during login)
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        console.log('Stored user data:', user)
        
        if (user.accountType === 'employer') {
          setEmployerInfo(user)
          console.log('✅ Employer info loaded from localStorage:', user)
          console.log('Employer ID:', user.id)
        } else {
          console.log('❌ User is not an employer, redirecting...')
          window.location.href = user.accountType === 'applicant' ? '/applicant-dashboard' : '/staff-dashboard'
        }
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('currentUser')
        window.location.href = '/login'
      }
    } else {
      console.log('❌ No stored user data found, redirecting to login...')
      window.location.href = '/login'
    }
  }, [])

  // New job form data
  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    department: "",
    job_type: "full-time",
    position_type: "rn",
    experience_required: "mid",
    education_required: "",
    requirements: "",
    benefits: "",
    salary_min: "",
    salary_max: "",
    salary_type: "hourly",
    location_type: "on-site",
    city: "",
    state: "",
    zip_code: "",
    status: "draft",
  })

  // Load jobs when employer info is available
  useEffect(() => {
    if (employerInfo?.id) {
      loadJobs()
    }
  }, [employerInfo])

  // Load applications when employer info is available (for overview tab)
  useEffect(() => {
    if (employerInfo?.id) {
      loadApplications()
    }
  }, [employerInfo])

  // Load candidates when candidate pool tab is active
  useEffect(() => {
    if (activeTab === 'candidates' && employerInfo?.id) {
      loadCandidates()
    }
  }, [activeTab, employerInfo])

  // Refresh applications when switching to applications tab
  useEffect(() => {
    if (activeTab === 'applications' && employerInfo?.id) {
      loadApplications()
    }
  }, [activeTab, employerInfo])

  const loadJobs = async () => {
    try {
      setIsLoadingJobs(true)
      const response = await fetch(`/api/jobs/list?employer_id=${employerId}`)
      const data = await response.json()

      if (data.success && data.jobs) {
        setJobs(data.jobs)
        console.log(`Loaded ${data.jobs.length} job postings`)
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setIsLoadingJobs(false)
    }
  }

  const loadApplications = async () => {
    if (!employerId) {
      console.log('❌ No employer ID available, skipping applications load')
      return
    }
    
    console.log('🔄 Loading applications for employer ID:', employerId)
    console.log('🔄 Employer info:', employerInfo)
    console.log('🔄 Company name:', employerInfo?.company_name)
    
    try {
      setIsLoadingApplications(true)
      const response = await fetch(`/api/applications/employer?employer_id=${employerId}`)
      console.log('Applications API response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Applications API response data:', data)
      
      if (data.success && data.applications) {
        setApplications(data.applications)
        console.log(`✅ Loaded ${data.applications.length} applications for employer ${employerId}`)
        console.log('Applications data:', data.applications)
        
        // Log hired applications specifically
        const hiredApps = data.applications.filter((app: any) => app.status === 'accepted' || app.status === 'hired')
        console.log(`📊 Found ${hiredApps.length} hired applications:`, hiredApps)
      } else {
        console.log('❌ No applications found or API error:', data.error)
        setApplications([])
      }
    } catch (error) {
      console.error('❌ Error loading applications:', error)
      setApplications([])
    } finally {
      setIsLoadingApplications(false)
    }
  }

  const loadCandidates = async () => {
    try {
      setIsLoadingCandidates(true)
      const response = await fetch(`/api/candidates/pool?limit=50`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success && data.candidates) {
        setCandidates(data.candidates)
        console.log(`Loaded ${data.candidates.length} candidates`)
      }
    } catch (error) {
      console.error('Error loading candidates:', error)
    } finally {
      setIsLoadingCandidates(false)
    }
  }

  const loadApplicantDocuments = async (applicantId: string, applicantName: string) => {
    try {
      const response = await fetch(`/api/applicants/documents?applicant_id=${applicantId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success && data.documents) {
        setSelectedApplicantDocuments(data.documents)
        setSelectedApplicantName(applicantName)
        setIsDocumentViewerOpen(true)
        console.log(`Loaded ${data.documents.length} documents for ${applicantName}`)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      alert('Failed to load documents. Please try again.')
    }
  }

  const updateApplicationStatus = async (applicationId: string, status: string, notes?: string) => {
    try {
      const response = await fetch('/api/applications/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          status,
          notes
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        // Update the applications list
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId 
              ? { ...app, status, notes: notes || app.notes }
              : app
          )
        )
        console.log(`Application ${status} successfully`)
      } else {
        throw new Error(data.error || 'Failed to update application')
      }
    } catch (error) {
      console.error('Error updating application status:', error)
      alert('Failed to update application status. Please try again.')
    }
  }

  const viewApplicationDetails = (application: any) => {
    setSelectedApplication(application)
    setIsApplicationModalOpen(true)
  }

  const viewCandidateProfile = async (candidateId: string) => {
    try {
      // Track the profile view
      await fetch('/api/candidates/view-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId })
      })
      
      // TODO: Implement view full profile modal
      console.log('View candidate profile:', candidateId)
    } catch (error) {
      console.error('Error tracking profile view:', error)
    }
  }

  const scheduleInterview = (application: any) => {
    setSelectedApplicationForAction(application)
    setIsInterviewModalOpen(true)
  }

  const sendJobOffer = (application: any) => {
    setSelectedApplicationForAction(application)
    setIsOfferModalOpen(true)
  }

  const handleInterviewScheduled = () => {
    // Refresh applications to show updated status
    loadApplications()
    setIsInterviewModalOpen(false)
    setSelectedApplicationForAction(null)
  }

  const handleOfferSent = () => {
    // Refresh applications to show updated status
    loadApplications()
    setIsOfferModalOpen(false)
    setSelectedApplicationForAction(null)
  }

  const handleCreateJob = async () => {
    if (!newJob.title || !newJob.description) {
      alert('Please fill in title and description')
      return
    }

    try {
      const response = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employer_id: employerId,
          ...newJob,
          salary_min: parseFloat(newJob.salary_min) || null,
          salary_max: parseFloat(newJob.salary_max) || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create job posting')
      }

      alert('Job posting created successfully!')
      setIsCreateJobOpen(false)
      setNewJob({
        title: "",
        description: "",
        department: "",
        job_type: "full-time",
        position_type: "rn",
        experience_required: "mid",
        education_required: "",
        requirements: "",
        benefits: "",
        salary_min: "",
        salary_max: "",
        salary_type: "hourly",
        location_type: "on-site",
        city: "",
        state: "",
        zip_code: "",
        status: "draft",
      })
      loadJobs()
    } catch (error: any) {
      console.error('Error creating job:', error)
      alert('Failed to create job: ' + error.message)
    }
  }

  const handlePublishJob = async (jobId: string) => {
    try {
      const response = await fetch('/api/jobs/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: jobId,
          status: 'active',
          posted_date: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to publish job')
      }

      alert('Job published successfully!')
      loadJobs()
    } catch (error) {
      console.error('Error publishing job:', error)
      alert('Failed to publish job')
    }
  }

  const handleCloseJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to close this job posting?')) {
      return
    }

    try {
      const response = await fetch('/api/jobs/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: jobId,
          status: 'closed',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to close job')
      }

      alert('Job closed successfully!')
      loadJobs()
    } catch (error) {
      console.error('Error closing job:', error)
      alert('Failed to close job')
    }
  }

  const handleEditJob = (job: JobPosting) => {
    setSelectedJob(job)
    setNewJob({
      title: job.title,
      description: job.description,
      department: job.department || "",
      job_type: job.job_type,
      position_type: job.position_type || "rn",
      experience_required: job.experience_required || "mid",
      education_required: job.education_required || "",
      requirements: job.requirements || "",
      benefits: job.benefits || "",
      salary_min: job.salary_min?.toString() || "",
      salary_max: job.salary_max?.toString() || "",
      salary_type: job.salary_type || "hourly",
      location_type: job.location_type || "on-site",
      city: job.city || "",
      state: job.state || "",
      zip_code: job.zip_code || "",
      status: job.status,
    })
    setIsEditJobOpen(true)
  }

  const handleUpdateJob = async () => {
    if (!selectedJob) return

    if (!newJob.title || !newJob.description) {
      alert('Please fill in title and description')
      return
    }

    try {
      const response = await fetch('/api/jobs/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedJob.id,
          title: newJob.title,
          description: newJob.description,
          department: newJob.department,
          job_type: newJob.job_type,
          position_type: newJob.position_type,
          experience_required: newJob.experience_required,
          education_required: newJob.education_required,
          requirements: newJob.requirements,
          benefits: newJob.benefits,
          salary_min: parseFloat(newJob.salary_min) || null,
          salary_max: parseFloat(newJob.salary_max) || null,
          salary_type: newJob.salary_type,
          location_type: newJob.location_type,
          city: newJob.city,
          state: newJob.state,
          zip_code: newJob.zip_code,
          status: newJob.status,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update job posting')
      }

      alert('Job posting updated successfully!')
      setIsEditJobOpen(false)
      setSelectedJob(null)
      setNewJob({
        title: "",
        description: "",
        department: "",
        job_type: "full-time",
        position_type: "rn",
        experience_required: "mid",
        education_required: "",
        requirements: "",
        benefits: "",
        salary_min: "",
        salary_max: "",
        salary_type: "hourly",
        location_type: "on-site",
        city: "",
        state: "",
        zip_code: "",
        status: "draft",
      })
      loadJobs()
    } catch (error: any) {
      console.error('Error updating job:', error)
      alert('Failed to update job: ' + error.message)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/jobs/delete?id=${jobId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete job')
      }

      alert('Job deleted successfully!')
      loadJobs()
    } catch (error: any) {
      console.error('Error deleting job:', error)
      alert('Failed to delete job: ' + error.message)
    }
  }

  const stats = {
    total: jobs.length,
    active: jobs.filter(j => j.status === 'active').length,
    draft: jobs.filter(j => j.status === 'draft').length,
    totalViews: jobs.reduce((sum, j) => sum + (j.views_count || 0), 0),
    totalApplications: applications.length,
    hiredApplicants: applications.filter(app => app.status === 'accepted' || app.status === 'hired').length,
    pendingApplications: applications.filter(app => app.status === 'pending').length,
    rejectedApplications: applications.filter(app => app.status === 'rejected').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {employerInfo ? `${employerInfo.companyName || 'Employer'} Dashboard` : 'Employer Dashboard'}
              </h1>
              <p className="text-gray-600">
                {employerInfo 
                  ? `Welcome back, ${employerInfo.firstName}! Manage your job postings and applications.`
                  : 'Manage your job postings and applications'
                }
              </p>
              {employerInfo?.city && employerInfo?.state && (
                <p className="text-sm text-gray-500 mt-1">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {employerInfo.city}, {employerInfo.state}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {/* Notification System */}
              {employerId && (
                <EmployerNotificationSystem employerId={employerId} />
              )}
              
              {employerInfo && (
                <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg border">
                  <Briefcase className="h-5 w-5 text-gray-600" />
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{employerInfo.firstName} {employerInfo.lastName}</div>
                    <div className="text-gray-500">{employerInfo.email}</div>
                  </div>
                </div>
              )}
              <Dialog open={isCreateJobOpen} onOpenChange={setIsCreateJobOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Job Posting</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new job posting
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label>Job Title *</Label>
                    <Input
                      placeholder="e.g., Registered Nurse - Home Health"
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Job Description *</Label>
                    <Textarea
                      placeholder="Describe the role, responsibilities, and requirements..."
                      rows={4}
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Department *</Label>
                    <Select value={newJob.department} onValueChange={(v) => setNewJob({ ...newJob, department: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Intensive Care">Intensive Care</SelectItem>
                        <SelectItem value="Rehabilitation">Rehabilitation</SelectItem>
                        <SelectItem value="General Care">General Care</SelectItem>
                        <SelectItem value="Long-term Care">Long-term Care</SelectItem>
                        <SelectItem value="Primary Care">Primary Care</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                        <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="Surgical">Surgical</SelectItem>
                        <SelectItem value="Oncology">Oncology</SelectItem>
                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                        <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                        <SelectItem value="Mental Health">Mental Health</SelectItem>
                        <SelectItem value="Home Health">Home Health</SelectItem>
                        <SelectItem value="Hospice">Hospice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Job Type</Label>
                      <Select value={newJob.job_type} onValueChange={(v) => setNewJob({ ...newJob, job_type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-Time</SelectItem>
                          <SelectItem value="part-time">Part-Time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="per-diem">Per Diem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Position Type</Label>
                      <Select value={newJob.position_type} onValueChange={(v) => setNewJob({ ...newJob, position_type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rn">RN (Registered Nurse)</SelectItem>
                          <SelectItem value="lpn">LPN (Licensed Practical Nurse)</SelectItem>
                          <SelectItem value="cna">CNA (Certified Nursing Assistant)</SelectItem>
                          <SelectItem value="pt">PT (Physical Therapist)</SelectItem>
                          <SelectItem value="ot">OT (Occupational Therapist)</SelectItem>
                          <SelectItem value="st">ST (Speech Therapist)</SelectItem>
                          <SelectItem value="msw">MSW (Medical Social Worker)</SelectItem>
                          <SelectItem value="aide">Home Health Aide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Experience Required</Label>
                    <Select value={newJob.experience_required} onValueChange={(v) => setNewJob({ ...newJob, experience_required: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level (2-5 years)</SelectItem>
                        <SelectItem value="senior">Senior (5+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Requirements</Label>
                    <Textarea
                      placeholder="e.g., RN License, BLS Certification, 2+ years ICU experience"
                      rows={3}
                      value={newJob.requirements}
                      onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">List certifications, licenses, and required skills</p>
                  </div>

                  <div>
                    <Label>Benefits</Label>
                    <Textarea
                      placeholder="e.g., Health Insurance, 401k Match, Paid Time Off, Flexible Schedule"
                      rows={3}
                      value={newJob.benefits}
                      onChange={(e) => setNewJob({ ...newJob, benefits: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">List benefits and perks offered</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Min Salary</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 35"
                        value={newJob.salary_min}
                        onChange={(e) => setNewJob({ ...newJob, salary_min: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Max Salary</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 45"
                        value={newJob.salary_max}
                        onChange={(e) => setNewJob({ ...newJob, salary_max: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Salary Type</Label>
                      <Select value={newJob.salary_type} onValueChange={(v) => setNewJob({ ...newJob, salary_type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Per Hour</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                          <SelectItem value="per-visit">Per Visit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input
                        placeholder="City"
                        value={newJob.city}
                        onChange={(e) => setNewJob({ ...newJob, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input
                        placeholder="State"
                        value={newJob.state}
                        onChange={(e) => setNewJob({ ...newJob, state: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>ZIP Code</Label>
                      <Input
                        placeholder="ZIP"
                        value={newJob.zip_code}
                        onChange={(e) => setNewJob({ ...newJob, zip_code: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Location Type</Label>
                    <Select value={newJob.location_type} onValueChange={(v) => setNewJob({ ...newJob, location_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on-site">On-Site</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select value={newJob.status} onValueChange={(v) => setNewJob({ ...newJob, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Save as Draft</SelectItem>
                        <SelectItem value="active">Publish Now</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateJobOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateJob}>
                      Create Job Posting
                    </Button>
                  </div>
                </div>
              </DialogContent>
              </Dialog>

              {/* Edit Job Dialog */}
              <Dialog open={isEditJobOpen} onOpenChange={setIsEditJobOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Job Posting</DialogTitle>
                  <DialogDescription>
                    Update the details of your job posting
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label>Job Title *</Label>
                    <Input
                      placeholder="e.g., Registered Nurse - Home Health"
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Job Description *</Label>
                    <Textarea
                      placeholder="Describe the role, responsibilities, and requirements..."
                      rows={4}
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Department *</Label>
                    <Select value={newJob.department} onValueChange={(v) => setNewJob({ ...newJob, department: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Intensive Care">Intensive Care</SelectItem>
                        <SelectItem value="Rehabilitation">Rehabilitation</SelectItem>
                        <SelectItem value="General Care">General Care</SelectItem>
                        <SelectItem value="Long-term Care">Long-term Care</SelectItem>
                        <SelectItem value="Primary Care">Primary Care</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                        <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="Surgical">Surgical</SelectItem>
                        <SelectItem value="Oncology">Oncology</SelectItem>
                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                        <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                        <SelectItem value="Mental Health">Mental Health</SelectItem>
                        <SelectItem value="Home Health">Home Health</SelectItem>
                        <SelectItem value="Hospice">Hospice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Job Type</Label>
                      <Select value={newJob.job_type} onValueChange={(v) => setNewJob({ ...newJob, job_type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-Time</SelectItem>
                          <SelectItem value="part-time">Part-Time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="per-diem">Per Diem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Position Type</Label>
                      <Select value={newJob.position_type} onValueChange={(v) => setNewJob({ ...newJob, position_type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rn">RN (Registered Nurse)</SelectItem>
                          <SelectItem value="lpn">LPN (Licensed Practical Nurse)</SelectItem>
                          <SelectItem value="cna">CNA (Certified Nursing Assistant)</SelectItem>
                          <SelectItem value="pt">PT (Physical Therapist)</SelectItem>
                          <SelectItem value="ot">OT (Occupational Therapist)</SelectItem>
                          <SelectItem value="st">ST (Speech Therapist)</SelectItem>
                          <SelectItem value="msw">MSW (Medical Social Worker)</SelectItem>
                          <SelectItem value="aide">Home Health Aide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Experience Required</Label>
                    <Select value={newJob.experience_required} onValueChange={(v) => setNewJob({ ...newJob, experience_required: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level (2-5 years)</SelectItem>
                        <SelectItem value="senior">Senior (5+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Requirements</Label>
                    <Textarea
                      placeholder="e.g., RN License, BLS Certification, 2+ years ICU experience"
                      rows={3}
                      value={newJob.requirements}
                      onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">List certifications, licenses, and required skills</p>
                  </div>

                  <div>
                    <Label>Benefits</Label>
                    <Textarea
                      placeholder="e.g., Health Insurance, 401k Match, Paid Time Off, Flexible Schedule"
                      rows={3}
                      value={newJob.benefits}
                      onChange={(e) => setNewJob({ ...newJob, benefits: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">List benefits and perks offered</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Min Salary</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 35"
                        value={newJob.salary_min}
                        onChange={(e) => setNewJob({ ...newJob, salary_min: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Max Salary</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 45"
                        value={newJob.salary_max}
                        onChange={(e) => setNewJob({ ...newJob, salary_max: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Salary Type</Label>
                      <Select value={newJob.salary_type} onValueChange={(v) => setNewJob({ ...newJob, salary_type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Per Hour</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                          <SelectItem value="per-visit">Per Visit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input
                        placeholder="City"
                        value={newJob.city}
                        onChange={(e) => setNewJob({ ...newJob, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input
                        placeholder="State"
                        value={newJob.state}
                        onChange={(e) => setNewJob({ ...newJob, state: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>ZIP Code</Label>
                      <Input
                        placeholder="ZIP"
                        value={newJob.zip_code}
                        onChange={(e) => setNewJob({ ...newJob, zip_code: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Location Type</Label>
                    <Select value={newJob.location_type} onValueChange={(v) => setNewJob({ ...newJob, location_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on-site">On-Site</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select value={newJob.status} onValueChange={(v) => setNewJob({ ...newJob, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Save as Draft</SelectItem>
                        <SelectItem value="active">Publish (Active)</SelectItem>
                        <SelectItem value="closed">Close Position</SelectItem>
                        <SelectItem value="filled">Mark as Filled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsEditJobOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateJob}>
                      Update Job Posting
                    </Button>
                  </div>
                </div>
              </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Job Postings ({jobs.length})</TabsTrigger>
            <TabsTrigger value="applications">Applications ({stats.totalApplications})</TabsTrigger>
            <TabsTrigger value="candidates">Candidate Pool ({candidates.length})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    Welcome back, {employerInfo?.companyName || 'Healthcare Facility'}!
                  </h1>
                  <p className="text-blue-100">
                    Manage your job postings, review applications, and find the best healthcare professionals.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Today's Date</p>
                  <p className="text-lg font-semibold">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" onClick={() => setIsCreateJobOpen(true)}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Plus className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Post New Job</h3>
                      <p className="text-sm text-gray-600">Create and publish job openings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" onClick={() => setActiveTab('applications')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Review Applications</h3>
                      <p className="text-sm text-gray-600">{stats.totalApplications} pending review</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" onClick={() => setActiveTab('candidates')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Candidate Pool</h3>
                      <p className="text-sm text-gray-600">{candidates.length} qualified candidates</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Analytics</h3>
                      <p className="text-sm text-gray-600">View performance insights</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Jobs</CardTitle>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="text-green-600 font-medium">{stats.active}</span> active, 
                    <span className="text-gray-500"> {stats.draft}</span> draft
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Views</CardTitle>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Eye className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats.totalViews}</div>
                  <p className="text-sm text-gray-500 mt-1">
                    Across all postings
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Applications</CardTitle>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats.totalApplications}</div>
                  <p className="text-sm text-gray-500 mt-1">
                    Total received
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Hired Applicants</CardTitle>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserCheck className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats.hiredApplicants}</div>
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="text-green-600 font-medium">{stats.hiredApplicants}</span> hired, 
                    <span className="text-yellow-600"> {stats.pendingApplications}</span> pending
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity & Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Applications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Recent Applications
                  </CardTitle>
                  <CardDescription>Latest applications requiring your attention</CardDescription>
                </CardHeader>
                <CardContent>
                  {applications.slice(0, 3).map((application, index) => (
                    <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg mb-2 hover:bg-gray-50 cursor-pointer"
                         onClick={() => {
                           setSelectedApplication(application)
                           setIsApplicationModalOpen(true)
                         }}>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {application.applicant?.full_name?.charAt(0) || 'A'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{application.applicant?.full_name || 'Unknown Applicant'}</p>
                          <p className="text-xs text-gray-500">{application.job_posting?.title || 'Unknown Position'}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-400">
                              Applied: {new Date(application.applied_date).toLocaleDateString()}
                            </span>
                            {application.job_posting?.company_name && (
                              <span className="text-xs text-blue-600">
                                • {application.job_posting.company_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge 
                          variant="outline"
                          className={
                            application.status === 'pending' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                            application.status === 'accepted' || application.status === 'hired' ? 'border-green-300 text-green-700 bg-green-50' :
                            application.status === 'rejected' ? 'border-red-300 text-red-700 bg-red-50' :
                            application.status === 'interview_scheduled' ? 'border-purple-300 text-purple-700 bg-purple-50' :
                            'border-gray-300 text-gray-700 bg-gray-50'
                          }
                        >
                          {application.status === 'accepted' ? 'Hired' : 
                           application.status === 'interview_scheduled' ? 'Interview' :
                           application.status}
                        </Badge>
                        {application.status === 'accepted' || application.status === 'hired' ? (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ Hired by {employerInfo?.company_name || 'Your Company'}
                          </span>
                        ) : application.status === 'rejected' ? (
                          <span className="text-xs text-red-600">
                            ✗ Not selected
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Pending review
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {applications.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No recent applications</p>
                  )}
                  {applications.length > 3 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={() => setActiveTab('applications')}
                    >
                      View All Applications
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Job Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Job Performance
                  </CardTitle>
                  <CardDescription>Top performing job postings</CardDescription>
                </CardHeader>
                <CardContent>
                  {jobs.slice(0, 3).map((job, index) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{job.title}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">
                            <Eye className="h-3 w-3 inline mr-1" />
                            {job.views_count || 0} views
                          </span>
                          <span className="text-xs text-gray-500">
                            <FileText className="h-3 w-3 inline mr-1" />
                            {job.applications_count || 0} applications
                          </span>
                        </div>
                      </div>
                      <Badge 
                        variant={job.status === 'active' ? 'default' : 'secondary'}
                        className={job.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                  {jobs.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No job postings yet</p>
                  )}
                  {jobs.length > 3 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={() => setActiveTab('jobs')}
                    >
                      View All Jobs
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Hired/Accepted Applicants Section */}
            {applications.filter(app => app.status === 'accepted' || app.status === 'hired').length > 0 && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <UserCheck className="h-5 w-5" />
                    Recently Hired Applicants
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    Congratulations! These applicants have been accepted for positions at {employerInfo?.company_name || 'your company'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {applications
                      .filter(app => app.status === 'accepted' || app.status === 'hired')
                      .slice(0, 5)
                      .map((application) => (
                        <div key={application.id} className="flex items-center justify-between p-3 bg-white border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-900">{application.applicant?.full_name || 'Unknown Applicant'}</p>
                              <p className="text-xs text-gray-600">{application.job_posting?.title || 'Unknown Position'}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-green-600 font-medium">
                                  ✓ Hired on {new Date(application.updated_at).toLocaleDateString()}
                                </span>
                                <span className="text-xs text-gray-500">
                                  • Applied {new Date(application.applied_date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              {application.status === 'accepted' ? 'Hired' : 'Accepted'}
                            </Badge>
                            {application.job_posting?.company_name && (
                              <p className="text-xs text-gray-500 mt-1">
                                {application.job_posting.company_name}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                  {applications.filter(app => app.status === 'accepted' || app.status === 'hired').length > 5 && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-3 border-green-300 text-green-700 hover:bg-green-100"
                      onClick={() => setActiveTab('applications')}
                    >
                      View All Hired Applicants
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest job postings</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingJobs ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading jobs...</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No job postings yet.</p>
                    <p className="text-sm mt-1">Create your first job posting to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.slice(0, 5).map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium">{job.title}</h3>
                          <p className="text-sm text-gray-500">
                            {job.city}, {job.state} • {job.job_type}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold">{job.views_count || 0}</div>
                            <div className="text-xs text-gray-500">Views</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold">{job.applications_count || 0}</div>
                            <div className="text-xs text-gray-500">Apps</div>
                          </div>
                          <Badge variant={
                            job.status === 'active' ? 'default' : 
                            job.status === 'draft' ? 'secondary' : 
                            'outline'
                          }>
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Job Postings Tab */}
          <TabsContent value="jobs" className="space-y-6">
            {isLoadingJobs ? (
              <Card>
                <CardContent className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <span className="ml-3 text-gray-600">Loading job postings...</span>
                </CardContent>
              </Card>
            ) : jobs.length === 0 ? (
            <Card>
                <CardContent className="text-center p-8 text-gray-500">
                  <Briefcase className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Job Postings Yet</h3>
                  <p className="mb-4">Create your first job posting to start hiring!</p>
                  <Button onClick={() => setIsCreateJobOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Post Your First Job
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div>
                {/* Featured Jobs Section */}
                {jobs.filter(job => job.is_featured).length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <Star className="h-6 w-6 text-yellow-500 mr-2" />
                      Featured Job Postings
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {jobs.filter(job => job.is_featured).map((job) => (
                        <Card
                          key={job.id}
                          className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50"
                        >
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                  <Building2 className="h-6 w-6 text-gray-600" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">{job.title}</CardTitle>
                                  <CardDescription className="flex items-center space-x-2">
                                    <span>{employerInfo?.companyName || 'Your Company'}</span>
                                  </CardDescription>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                                {job.is_urgent && <Badge variant="destructive">Urgent</Badge>}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <p className="text-gray-700">{job.description}</p>

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center text-gray-600">
                                  <MapPin className="h-4 w-4 mr-2" />
                                  {job.city}, {job.state}
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <Clock className="h-4 w-4 mr-2" />
                                  {job.job_type}
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  ${job.salary_min}-${job.salary_max}/{job.salary_type}
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <Briefcase className="h-4 w-4 mr-2" />
                                  {job.department}
                                </div>
                              </div>

                              {job.requirements && (
                                <div>
                                  <h4 className="font-medium text-sm mb-1">Requirements:</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {job.requirements.split(',').slice(0, 3).map((req, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {req.trim()}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {job.benefits && (
                                <div>
                                  <h4 className="font-medium text-sm mb-1">Benefits:</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {job.benefits.split(',').slice(0, 3).map((benefit, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {benefit.trim()}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="flex justify-between items-center pt-4 border-t">
                                <div className="text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Eye className="h-4 w-4 mr-1" />
                                    {job.views_count || 0} views
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <Users className="h-4 w-4 mr-1" />
                                    {job.applications_count || 0} applications
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Posted {new Date(job.posted_date).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  {job.status === 'active' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCloseJob(job.id)}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Close
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditJob(job)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteJob(job.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Jobs Section */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">All Job Postings ({jobs.length})</h2>
                  <div className="space-y-4">
                    {jobs.filter(job => !job.is_featured).map((job) => (
                      <Card key={job.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                                  {job.is_urgent && (
                                    <Badge variant="destructive" className="text-xs">
                                      Urgent
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-gray-600">{employerInfo?.companyName || 'Your Company'}</span>
                                </div>
                                <p className="text-gray-700 mb-3">{job.description}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {job.city}, {job.state}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {job.job_type}
                                  </div>
                                  <div className="flex items-center">
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    ${job.salary_min}-${job.salary_max}/{job.salary_type}
                                  </div>
                                  <div className="flex items-center">
                                    <Briefcase className="h-4 w-4 mr-1" />
                                    {job.department}
                                  </div>
                                </div>

                                {job.requirements && (
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {job.requirements.split(',').slice(0, 4).map((req, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {req.trim()}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end space-y-2">
                              <div className="text-right">
                                <div className="text-sm text-gray-600">{job.applications_count || 0} applications</div>
                                <div className="text-sm text-gray-600">Posted {new Date(job.posted_date).toLocaleDateString()}</div>
                              </div>
                              <div className="flex space-x-2">
                                {job.status === 'active' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCloseJob(job.id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Close
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditJob(job)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteJob(job.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            {/* Applications Header with Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Applications</h2>
                <p className="text-gray-600">Review and manage job applications</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select defaultValue="all" onValueChange={(value) => console.log('Filter by status:', value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                    <SelectItem value="offer_received">Offer Received</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all" onValueChange={(value) => console.log('Filter by job:', value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Applications Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {applications.filter(app => app.status === 'pending').length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Interviews</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {applications.filter(app => app.status === 'interview_scheduled').length}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Offers</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {applications.filter(app => app.status === 'offer_received').length}
                      </p>
                    </div>
                    <Send className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Hired</p>
                      <p className="text-2xl font-bold text-green-600">
                        {applications.filter(app => app.status === 'accepted' || app.status === 'hired').length}
                      </p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Applications ({applications.length})</CardTitle>
                <CardDescription>Review applicants for your job postings</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingApplications ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading applications...</p>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No applications yet.</p>
                    <p className="text-sm mt-1">Applications will appear here when candidates apply to your jobs.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <Card key={application.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                        <CardContent className="p-6">
                          {/* Header Section */}
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-start space-x-4 flex-1">
                              {/* Applicant Avatar */}
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl flex-shrink-0">
                                {application.applicant?.full_name?.charAt(0) || 'A'}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                                      {application.applicant?.full_name || 'Unknown Applicant'}
                                    </h3>
                                    <p className="text-lg text-gray-600">
                                      Applied for <span className="font-semibold text-blue-600">{application.job_posting?.title || 'Unknown Position'}</span>
                                    </p>
                                  </div>
                                  <Badge 
                                    variant="outline"
                                    className={
                                      application.status === 'accepted' ? 'bg-green-100 text-green-800 border-green-300' : 
                                      application.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                                      application.status === 'interview_scheduled' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                      application.status === 'offer_received' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                      application.status === 'offer_accepted' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                      application.status === 'offer_declined' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                      'bg-gray-100 text-gray-800 border-gray-300'
                                    }
                                  >
                                    {application.status === 'accepted' ? 'Hired' : 
                                     application.status === 'hired' ? 'Hired' :
                                     application.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Information Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3 text-base">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Contact Information
                              </h4>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-sm text-gray-600 font-medium block">Email Address</span>
                                  <span className="text-gray-900 break-all">{application.applicant?.email || 'Not provided'}</span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600 font-medium block">Phone Number</span>
                                  <span className="text-gray-900">{application.applicant?.phone || 'Not provided'}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3 text-base">
                                <Briefcase className="h-5 w-5 text-green-600" />
                                Professional Details
                              </h4>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-sm text-gray-600 font-medium block">Profession</span>
                                  <span className="text-gray-900">{application.applicant?.profession || 'Not specified'}</span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600 font-medium block">Experience Level</span>
                                  <span className="text-gray-900">{application.applicant?.experience_level || 'Not specified'}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3 text-base">
                                <Clock className="h-5 w-5 text-purple-600" />
                                Application Details
                              </h4>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-sm text-gray-600 font-medium block">Application Date</span>
                                  <span className="text-gray-900">{new Date(application.applied_date).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}</span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-600 font-medium block">Location</span>
                                  <span className="text-gray-900">{application.applicant?.city}, {application.applicant?.state}</span>
                                </div>
                                {(application.status === 'accepted' || application.status === 'hired') && (
                                  <div>
                                    <span className="text-sm text-gray-600 font-medium block">Hired By</span>
                                    <span className="text-green-600 font-medium">{application.job_posting?.company_name || employerInfo?.company_name || 'Your Company'}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Cover Letter Section */}
                          {application.cover_letter && (
                            <div className="mb-6">
                              <h4 className="font-semibold text-gray-900 mb-3 text-base">Cover Letter</h4>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                  {application.cover_letter}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-gray-200">
                            <div className="text-sm text-gray-500">
                              Applied on {new Date(application.applied_date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </div>
                            
                            <div className="flex flex-wrap gap-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewApplicationDetails(application)}
                                className="hover:bg-blue-50 hover:border-blue-300"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadApplicantDocuments(
                                  application.applicant_id, 
                                  application.applicant?.full_name || 'Unknown Applicant'
                                )}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Documents
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => scheduleInterview(application)}
                                disabled={application.status === 'interview_scheduled' || application.status === 'offer_received' || application.status === 'offer_accepted'}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule Interview
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => sendJobOffer(application)}
                                disabled={application.status === 'offer_received' || application.status === 'offer_accepted' || application.status === 'offer_declined'}
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send Offer
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateApplicationStatus(application.id, 'accepted')}
                                disabled={application.status === 'accepted'}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 disabled:opacity-50"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Accept
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateApplicationStatus(application.id, 'rejected')}
                                disabled={application.status === 'rejected'}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          {/* Candidate Pool Tab */}
          <TabsContent value="candidates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Pool ({candidates.length})</CardTitle>
                <CardDescription>Discover and connect with qualified healthcare professionals</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCandidates ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading candidates...</p>
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No candidates found in the pool.</p>
                    <p className="text-sm mt-1">Healthcare professionals will appear here as they register and complete their profiles.</p>
                    <p className="text-xs mt-2 text-gray-400">
                      Encourage applicants to register at your job postings to build your candidate pool.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {candidates.map((candidate) => (
                      <div key={candidate.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                {candidate.full_name}
                              </h3>
                              <Badge variant="outline">
                                {candidate.profession || 'Healthcare Professional'}
                              </Badge>
                              <Badge variant="secondary">
                                {candidate.profile_completion}% Complete
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Contact Info:</p>
                                <p className="text-sm">
                                  <strong>Email:</strong> {candidate.email}
                                </p>
                                <p className="text-sm">
                                  <strong>Phone:</strong> {candidate.phone || 'Not provided'}
                                </p>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Professional Details:</p>
                                <p className="text-sm">
                                  <strong>Experience:</strong> {candidate.experience_level || 'Not specified'}
                                </p>
                                <p className="text-sm">
                                  <strong>Education:</strong> {candidate.education_level || 'Not specified'}
                                </p>
                                <p className="text-sm">
                                  <strong>Location:</strong> {candidate.location}
                                </p>
                              </div>

                              <div>
                                <p className="text-sm text-gray-600 mb-1">Profile Stats:</p>
                                <p className="text-sm">
                                  <strong>Profile Views:</strong> {candidate.profile_views || 0}
                                </p>
                                <p className="text-sm">
                                  <strong>Member Since:</strong> {new Date(candidate.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {candidate.certifications && (
                              <div className="mt-3">
                                <p className="text-sm text-gray-600 mb-1">Certifications:</p>
                                <p className="text-sm bg-gray-50 p-2 rounded border">
                                  {candidate.certifications}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-4">
                              <div className="text-xs text-gray-500">
                                Last updated: {new Date(candidate.updated_at).toLocaleDateString()}
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => viewCandidateProfile(candidate.id)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Profile
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => loadApplicantDocuments(candidate.id, candidate.full_name)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Documents
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // TODO: Implement contact candidate
                                    console.log('Contact candidate:', candidate.id)
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Contact
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // TODO: Implement save candidate
                                    console.log('Save candidate:', candidate.id)
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Save
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Application Details Modal */}
      {selectedApplication && (
        <Dialog open={isApplicationModalOpen} onOpenChange={setIsApplicationModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Application Details
              </DialogTitle>
              <DialogDescription>
                Review {selectedApplication.applicant?.full_name}'s application for {selectedApplication.job_posting?.title}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Applicant Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Applicant Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Name:</p>
                    <p className="font-medium">{selectedApplication.applicant?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email:</p>
                    <p className="font-medium">{selectedApplication.applicant?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone:</p>
                    <p className="font-medium">{selectedApplication.applicant?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location:</p>
                    <p className="font-medium">{selectedApplication.applicant?.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Profession:</p>
                    <p className="font-medium">{selectedApplication.applicant?.profession || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Experience Level:</p>
                    <p className="font-medium">{selectedApplication.applicant?.experience_level || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Job Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Job Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Position:</p>
                    <p className="font-medium">{selectedApplication.job_posting?.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Location:</p>
                    <p className="font-medium">{selectedApplication.job_posting?.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Job Type:</p>
                    <p className="font-medium">{selectedApplication.job_posting?.job_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Applied Date:</p>
                    <p className="font-medium">{new Date(selectedApplication.applied_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Cover Letter */}
              {selectedApplication.cover_letter && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Cover Letter</h3>
                  <div className="bg-white p-4 border rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                  </div>
                </div>
              )}

              {/* Application Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Status:</p>
                  <Badge 
                    variant={selectedApplication.status === 'pending' ? 'default' : 
                            selectedApplication.status === 'accepted' ? 'default' : 'secondary'}
                    className={selectedApplication.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                              selectedApplication.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                  >
                    {selectedApplication.status}
                  </Badge>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'accepted')}
                    disabled={selectedApplication.status === 'accepted'}
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accept Application
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                    disabled={selectedApplication.status === 'rejected'}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject Application
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Document Viewer Modal */}
      <EmployerDocumentViewer
        isOpen={isDocumentViewerOpen}
        onClose={() => setIsDocumentViewerOpen(false)}
        documents={selectedApplicantDocuments}
        applicantName={selectedApplicantName}
      />

      {/* Interview Scheduling Modal */}
      <InterviewSchedulingModal
        isOpen={isInterviewModalOpen}
        onClose={() => setIsInterviewModalOpen(false)}
        application={selectedApplicationForAction}
        onScheduleSuccess={handleInterviewScheduled}
      />

      {/* Job Offer Modal */}
      <JobOfferModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        application={selectedApplicationForAction}
        onOfferSuccess={handleOfferSent}
      />
    </div>
  )
}
