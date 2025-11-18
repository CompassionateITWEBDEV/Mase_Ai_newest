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
  User,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
  GraduationCap,
  Shield,
  Heart,
  Phone,
  AlertTriangle,
  Building2,
  Download,
  Calendar,
  Send,
  UserCheck,
  Star,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target
} from "lucide-react"
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts"

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

// Helper to format position code to display name
const formatPositionName = (positionCode: string) => {
  const positionMap: { [key: string]: string } = {
    'rn': 'Registered Nurse (RN)',
    'pt': 'Physical Therapist (PT)',
    'ot': 'Occupational Therapist (OT)',
    'st': 'Speech Therapist (ST)',
    'hha': 'Home Health Aide (HHA)',
    'msw': 'Master of Social Work (MSW)'
  }
  return positionMap[positionCode?.toLowerCase()] || positionCode || 'Not specified'
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
  const [interviews, setInterviews] = useState<any[]>([])
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(false)
  const [rescheduleRequests, setRescheduleRequests] = useState<any[]>([])
  const [isLoadingRescheduleRequests, setIsLoadingRescheduleRequests] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false)
  const [selectedApplicantDocuments, setSelectedApplicantDocuments] = useState<any[]>([])
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false)
  const [selectedApplicantName, setSelectedApplicantName] = useState('')
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false)
  const [selectedInterview, setSelectedInterview] = useState<any>(null)
  const [isEditInterviewOpen, setIsEditInterviewOpen] = useState(false)
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false)
  const [selectedApplicationForAction, setSelectedApplicationForAction] = useState<any>(null)
  const [selectedApplicationForm, setSelectedApplicationForm] = useState<any>(null)
  const [isLoadingApplicationForm, setIsLoadingApplicationForm] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all")
  const [jobFilter, setJobFilter] = useState("all")
  const [filteredApplications, setFilteredApplications] = useState<any[]>([])

  // Employer info from login
  const [employerInfo, setEmployerInfo] = useState<any>(null)

  // Get employer ID from employer info
  const employerId = employerInfo?.id

  // Filter applications based on current filters
  const filterApplications = () => {
    let filtered = applications

    // Filter by status
    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        // Include pending, interview_scheduled, offer_received, and offer_accepted as pending
        filtered = filtered.filter(app => 
          app.status === 'pending' || 
          app.status === 'interview_scheduled' || 
          app.status === 'offer_received' ||
          app.status === 'offer_accepted'
        )
      } else {
        filtered = filtered.filter(app => app.status === statusFilter)
      }
    }

    // Filter by job
    if (jobFilter !== "all") {
      filtered = filtered.filter(app => app.job_posting_id === jobFilter)
    }

    setFilteredApplications(filtered)
  }

  // Update filtered applications when applications or filters change
  useEffect(() => {
    filterApplications()
  }, [applications, statusFilter, jobFilter])

  // Export applications to CSV
  const exportApplications = () => {
    const csvData = filteredApplications.map(app => ({
      'Applicant Name': app.applicant?.full_name || 'N/A',
      'Email': app.applicant?.email || 'N/A',
      'Phone': app.applicant?.phone || 'N/A',
      'Job Title': app.job_posting?.title || 'N/A',
      'Status': app.status,
      'Applied Date': new Date(app.applied_date).toLocaleDateString(),
      'Experience': app.applicant?.experience_level || 'N/A',
      'Education': app.applicant?.education_level || 'N/A',
      'Location': `${app.applicant?.city || ''}, ${app.applicant?.state || ''}`.replace(', ,', 'N/A'),
    }))

    // Convert to CSV
    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${(row as any)[header] || ''}"`).join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = window.document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `applications-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
  }

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

  // Load candidates when employer info is available (for overview tab candidate count)
  useEffect(() => {
    if (employerInfo?.id) {
      loadCandidates()
    }
  }, [employerInfo])

  // Load interviews when employer info is available
  useEffect(() => {
    if (employerInfo?.id) {
      loadInterviews()
    }
  }, [employerInfo])

  // Refresh candidates when candidate pool tab is active
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

  // Refresh interviews and reschedule requests when switching to interviews tab
  useEffect(() => {
    if (activeTab === 'interviews' && employerInfo?.id) {
      loadInterviews()
      loadRescheduleRequests()
    }
  }, [activeTab, employerInfo])

  // Auto-refresh applications every 30 seconds
  useEffect(() => {
    if (!employerInfo?.id) return
    
    const interval = setInterval(() => {
      console.log('Auto-refreshing applications...')
      loadApplications()
    }, 30000) // 30 seconds
    
    return () => clearInterval(interval)
  }, [employerInfo?.id])

  // Auto-refresh jobs every 45 seconds
  useEffect(() => {
    if (!employerInfo?.id) return
    
    const interval = setInterval(() => {
      console.log('Auto-refreshing jobs...')
      loadJobs()
    }, 45000) // 45 seconds
    
    return () => clearInterval(interval)
  }, [employerInfo?.id])

  // Auto-refresh candidates every 60 seconds
  useEffect(() => {
    if (!employerInfo?.id) return
    
    const interval = setInterval(() => {
      console.log('Auto-refreshing candidates...')
      loadCandidates()
    }, 60000) // 60 seconds
    
    return () => clearInterval(interval)
  }, [employerInfo?.id])

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

  const loadInterviews = async () => {
    if (!employerId) {
      console.log('❌ No employer ID available, skipping interviews load')
      return
    }
    
    try {
      setIsLoadingInterviews(true)
      console.log('🔄 Loading interviews for employer:', employerId)
      const response = await fetch(`/api/interviews/list?employer_id=${employerId}`)
      
      const data = await response.json()
      console.log('📋 Interviews API response:', data)
      
      if (!response.ok) {
        console.error('❌ Error response from API:', data)
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }
      
      if (data.success && data.interviews) {
        setInterviews(data.interviews)
        console.log(`✅ Loaded ${data.interviews.length} interviews`)
      } else {
        console.log('⚠️ No interviews found or API error:', data.error)
        setInterviews([])
      }
    } catch (error: any) {
      console.error('❌ Error loading interviews:', error)
      // Don't show alert, just log the error and set empty array
      setInterviews([])
    } finally {
      setIsLoadingInterviews(false)
    }
  }

  const loadRescheduleRequests = async () => {
    if (!employerId) {
      console.log('No employer ID, skipping reschedule requests load')
      return
    }
    
    try {
      setIsLoadingRescheduleRequests(true)
      console.log('🔍 Loading reschedule requests for employer:', employerId)
      
      const response = await fetch(`/api/interviews/reschedule-list?employer_id=${employerId}&status=pending`)
      const data = await response.json()
      
      console.log('📥 Reschedule requests response:', data)
      
      if (data.success && data.rescheduleRequests) {
        setRescheduleRequests(data.rescheduleRequests)
        console.log(`✅ Loaded ${data.rescheduleRequests.length} reschedule requests`)
      } else if (data.error) {
        console.error('❌ API returned error:', data.error)
        setRescheduleRequests([])
      } else {
        console.log('⚠️ No reschedule requests found or unknown response')
        setRescheduleRequests([])
      }
    } catch (error) {
      console.error('❌ Error loading reschedule requests:', error)
      setRescheduleRequests([])
    } finally {
      setIsLoadingRescheduleRequests(false)
    }
  }

  const loadApplicationForm = async (jobApplicationId: string) => {
    try {
      setIsLoadingApplicationForm(true)
      console.log('🔄 Loading application form for job application:', jobApplicationId)
      
      const response = await fetch(`/api/applications/form/${jobApplicationId}`)
      console.log('📡 Response status:', response.status)
      
      const data = await response.json()
      console.log('📋 Application form response:', data)
      
      if (data.success && data.applicationForm) {
        setSelectedApplicationForm(data.applicationForm)
        console.log('✅ Loaded application form data:', data.applicationForm)
      } else {
        console.log('⚠️ No application form found:', data.error)
        setSelectedApplicationForm(null)
      }
    } catch (error) {
      console.error('❌ Error loading application form:', error)
      setSelectedApplicationForm(null)
    } finally {
      setIsLoadingApplicationForm(false)
    }
  }

  const loadUploadedDocuments = async (applicantId: string) => {
    try {
      setIsLoadingDocuments(true)
      console.log('🔄 Loading documents for applicant:', applicantId)
      
      const response = await fetch(`/api/applicants/documents?applicant_id=${applicantId}`)
      const data = await response.json()
      
      console.log('📄 Documents response:', data)
      
      if (data.success && data.documents) {
        setUploadedDocuments(data.documents)
        console.log('✅ Loaded documents:', data.documents.length)
      } else {
        console.log('⚠️ No documents found')
        setUploadedDocuments([])
      }
    } catch (error) {
      console.error('❌ Error loading documents:', error)
      setUploadedDocuments([])
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  const respondToRescheduleRequest = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/interviews/reschedule-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action,
          employerId
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Reload reschedule requests and interviews
        await loadRescheduleRequests()
        await loadInterviews()
        alert(action === 'approved' ? '✅ Reschedule request approved!' : '❌ Reschedule request rejected')
      } else {
        alert('Failed to respond to request: ' + data.error)
      }
    } catch (error) {
      console.error('Error responding to reschedule request:', error)
      alert('Failed to respond to request')
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
        console.log(`✅ Application ${status} successfully`, { applicationId, status, notes })
        
        // Reload applications to ensure UI updates properly
        loadApplications()
      } else {
        throw new Error(data.error || 'Failed to update application')
      }
    } catch (error) {
      console.error('Error updating application status:', error)
      alert('Failed to update application status. Please try again.')
    }
  }

  const handleAcceptApplication = async (applicationId: string) => {
    try {
      const response = await fetch('/api/applications/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          status: 'pending',
          is_accepted: true,
          notes: 'Application accepted for interview scheduling'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        console.log('✅ Application accepted successfully')
        alert('Application accepted successfully!')
        loadApplications()
        // Close the modal
        setIsApplicationModalOpen(false)
      } else {
        throw new Error(data.error || 'Failed to accept application')
      }
    } catch (error) {
      console.error('Error accepting application:', error)
      alert('Failed to accept application. Please try again.')
    }
  }

  const viewApplicationDetails = async (application: any) => {
    setSelectedApplication(application)
    setIsApplicationModalOpen(true)
    
    // Load application form data
    if (application.id) {
      await loadApplicationForm(application.id)
    }
    
    // Load uploaded documents
    const applicantId = application.applicant?.id || application.applicant_id
    if (applicantId) {
      await loadUploadedDocuments(applicantId)
    }
    
    // Track the profile view
    try {
      const applicantId = application.applicant?.id || application.applicant_id
      if (applicantId && employerInfo) {
        await fetch('/api/candidates/view-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            candidateId: applicantId,
            employerId: employerInfo.id,
            employerName: employerInfo.companyName
          })
        })
        console.log('Profile view tracked for applicant:', applicantId)
      }
    } catch (error) {
      console.error('Error tracking profile view:', error)
    }
  }

  const viewCandidateProfile = async (candidateId: string) => {
    try {
      // Find the candidate in the candidates array
      const candidate = candidates.find(c => c.id === candidateId)
      if (candidate) {
        setSelectedCandidate(candidate)
        setIsCandidateModalOpen(true)
      }
      
      // Track the profile view
      if (employerInfo) {
        await fetch('/api/candidates/view-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            candidateId,
            employerId: employerInfo.id,
            employerName: employerInfo.companyName
          })
        })
      }
      
      console.log('View candidate profile:', candidateId)
    } catch (error) {
      console.error('Error tracking profile view:', error)
    }
  }

  const contactCandidate = async (candidate: any) => {
    try {
      // Create a contact message modal or redirect to email
      const subject = `Job Opportunity at ${employerInfo?.company_name || 'Our Company'}`
      const body = `Hello ${candidate.full_name},\n\nI hope this message finds you well. I came across your profile in our candidate pool and was impressed by your qualifications.\n\nWe have opportunities at ${employerInfo?.company_name || 'our company'} that might be a great fit for your skills and experience.\n\nWould you be interested in discussing potential opportunities?\n\nBest regards,\n${employerInfo?.first_name} ${employerInfo?.last_name}\n${employerInfo?.company_name}`
      
      // Open email client
      const mailtoLink = `mailto:${candidate.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.open(mailtoLink, '_blank')
      
      // Track the contact action
      await fetch('/api/candidates/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate_id: candidate.id,
          employer_id: employerInfo?.id,
          contact_type: 'email',
          timestamp: new Date().toISOString()
        })
      })
      
      console.log('Contact email opened for candidate:', candidate.id)
    } catch (error) {
      console.error('Error contacting candidate:', error)
    }
  }

  const sendOfferToCandidate = (candidate: any) => {
    // Create a mock application object for the offer modal
    const mockApplication = {
      id: candidate.id, // Use the actual candidate ID directly
      applicant_id: candidate.id,
      employer_id: employerId, // Add employer ID for candidate pool offers
      applicant: {
        full_name: candidate.full_name,
        email: candidate.email,
        phone: candidate.phone,
        profession: candidate.profession,
        experience_level: candidate.experience_level,
        education_level: candidate.education_level,
        city: candidate.city,
        state: candidate.state
      },
      job_posting: {
        title: 'Direct Offer',
        company_name: employerInfo?.company_name || 'Our Company'
      },
      status: 'pending',
      applied_date: new Date().toISOString(),
      is_candidate_pool: true // Flag to indicate this is from candidate pool
    }
    
    setSelectedApplicationForAction(mockApplication)
    setIsOfferModalOpen(true)
  }

  const saveCandidate = async (candidate: any) => {
    try {
      // Save candidate to employer's saved candidates list
      await fetch('/api/candidates/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate_id: candidate.id,
          employer_id: employerInfo?.id,
          saved_at: new Date().toISOString(),
          notes: `Saved from candidate pool - ${candidate.profession}`
        })
      })
      
      // Show success message
      alert(`Candidate ${candidate.full_name} has been saved to your saved candidates list!`)
      console.log('Candidate saved:', candidate.id)
    } catch (error) {
      console.error('Error saving candidate:', error)
      alert('Failed to save candidate. Please try again.')
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
    
    // If this was an offer to a candidate from candidate pool, refresh candidates too
    if (selectedApplicationForAction?.is_candidate_pool) {
      loadCandidates()
    }
    
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
    if (!confirm('Are you sure you want to close this job posting? This will stop accepting new applications.')) {
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
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to close job')
      }

      alert('Job posting closed successfully!')
      loadJobs() // Refresh the jobs list
    } catch (error) {
      console.error('Error closing job:', error)
      alert(`Failed to close job: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  const handleScheduleInterview = async (interviewData: any) => {
    try {
      console.log('🚀 Scheduling interview with data:', interviewData)
      
      const response = await fetch('/api/interviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewData)
      })

      const data = await response.json()
      
      if (!response.ok) {
        console.error('❌ API Error Response:', data)
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      if (data.success) {
        console.log('✅ Interview scheduled successfully:', data.interview)
        alert('Interview scheduled successfully!')
        loadApplications() // Refresh applications to update status
        loadInterviews() // Refresh the interviews list
      } else {
        throw new Error(data.error || 'Failed to schedule interview')
      }
    } catch (error: any) {
      console.error('❌ Error scheduling interview:', error)
      alert(error.message || 'Failed to schedule interview. Please try again.')
      throw error // Re-throw so modal can handle it
    }
  }

  const handleEditInterview = (interview: any) => {
    setSelectedInterview(interview)
    setIsEditInterviewOpen(true)
  }

  const handleUpdateInterview = async (interviewData: any) => {
    try {
      console.log('🚀 Updating interview with data:', interviewData)
      
      const response = await fetch('/api/interviews/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewData)
      })

      const data = await response.json()
      
      if (!response.ok) {
        console.error('❌ API Error Response:', data)
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      if (data.success) {
        console.log('✅ Interview updated successfully:', data.interview)
        alert('Interview updated successfully!')
        loadInterviews() // Refresh the interviews list
        setIsEditInterviewOpen(false)
        setSelectedInterview(null)
      } else {
        throw new Error(data.error || 'Failed to update interview')
      }
    } catch (error: any) {
      console.error('❌ Error updating interview:', error)
      alert(error.message || 'Failed to update interview. Please try again.')
      throw error
    }
  }

  const handleCancelInterview = async (interviewId: string) => {
    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to cancel this interview? This action cannot be undone.')
    
    if (!confirmed) {
      return
    }

    try {
      console.log('🚀 Canceling interview:', interviewId)
      
      const response = await fetch('/api/interviews/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_id: interviewId,
          status: 'cancelled'
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        console.error('❌ API Error Response:', data)
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      if (data.success) {
        console.log('✅ Interview cancelled successfully:', data.interview)
        alert('Interview cancelled successfully!')
        loadInterviews() // Refresh the interviews list
      } else {
        throw new Error(data.error || 'Failed to cancel interview')
      }
    } catch (error: any) {
      console.error('❌ Error cancelling interview:', error)
      alert(error.message || 'Failed to cancel interview. Please try again.')
    }
  }

  const stats = {
    total: jobs.length,
    active: jobs.filter(j => j.status === 'active').length,
    draft: jobs.filter(j => j.status === 'draft').length,
    closed: jobs.filter(j => j.status === 'closed').length,
    totalViews: jobs.reduce((sum, j) => sum + (j.views_count || 0), 0),
    totalApplications: applications.length,
    hiredApplicants: applications.filter(app => app.status === 'accepted' || app.status === 'hired').length,
    pendingApplications: applications.filter(app => 
      app.status === 'pending' || 
      app.status === 'interview_scheduled' || 
      app.status === 'offer_received' ||
      app.status === 'offer_accepted'
    ).length,
    rejectedApplications: applications.filter(app => app.status === 'rejected').length,
  }

  // Analytics data for charts
  const analyticsData = {
    // Monthly trends data (last 6 months) - calculated from actual data
    monthlyTrends: (() => {
      const months = []
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      
      // Get last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = date.toISOString().slice(0, 7) // YYYY-MM format
        const monthName = monthNames[date.getMonth()]
        
        // Count applications for this month
        const monthApps = applications.filter(app => {
          const appDate = new Date(app.applied_date || app.created_at)
          return appDate.toISOString().slice(0, 7) === monthKey
        })
        
        // Count views for this month (job views)
        const monthViews = jobs.reduce((sum, job) => {
          const jobDate = new Date(job.posted_date || job.created_at)
          if (jobDate.toISOString().slice(0, 7) === monthKey) {
            return sum + (job.views_count || 0)
          }
          return sum
        }, 0)
        
        // Count hired for this month
        const monthHired = monthApps.filter(app => app.status === 'accepted' || app.status === 'hired').length
        
        months.push({
          month: monthName,
          applications: monthApps.length,
          views: monthViews,
          hired: monthHired
        })
      }
      
      return months
    })(),
    
    // Application status distribution
    applicationStatusData: [
      { name: 'Hired', value: stats.hiredApplicants, color: '#10b981' },
      { name: 'Pending', value: stats.pendingApplications, color: '#f59e0b' },
      { name: 'Rejected', value: stats.rejectedApplications, color: '#ef4444' }
    ],
    
    // Job performance data
    jobPerformanceData: jobs.slice(0, 5).map(job => ({
      name: job.title.length > 20 ? job.title.substring(0, 20) + '...' : job.title,
      views: job.views_count || 0,
      applications: job.applications_count || 0,
      conversionRate: job.views_count > 0 ? ((job.applications_count || 0) / job.views_count * 100).toFixed(1) : 0
    })),
    
    // Weekly activity data - calculated from actual data
    weeklyActivity: (() => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const weekData = []
      
      // Get data for last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateKey = date.toISOString().slice(0, 10) // YYYY-MM-DD format
        const dayName = dayNames[date.getDay()]
        
        // Count applications for this day
        const dayApps = applications.filter(app => {
          const appDate = new Date(app.applied_date || app.created_at)
          return appDate.toISOString().slice(0, 10) === dateKey
        })
        
        // Count views for this day (approximate - using job posted date)
        // Note: This is an approximation since we don't have per-day view tracking
        const dayViews = jobs.reduce((sum, job) => {
          const jobDate = new Date(job.posted_date || job.created_at)
          if (jobDate.toISOString().slice(0, 10) === dateKey) {
            return sum + Math.floor((job.views_count || 0) / 30) // Average daily views
          }
          return sum
        }, 0)
        
        weekData.push({
          day: dayName,
          applications: dayApps.length,
          views: dayViews
        })
      }
      
      return weekData
    })(),
    
    // Department performance - more accurate calculation
    departmentPerformance: (() => {
      const deptStats: Record<string, { applications: number, views: number, hired: number }> = {}
      
      // First, initialize departments from jobs
      jobs.forEach(job => {
        const dept = job.department || 'Other'
        if (!deptStats[dept]) {
          deptStats[dept] = { applications: 0, views: 0, hired: 0 }
        }
        deptStats[dept].applications += job.applications_count || 0
        deptStats[dept].views += job.views_count || 0
      })
      
      // Then, count hired applicants by department from applications
      applications.forEach(app => {
        if (app.status === 'accepted' || app.status === 'hired') {
          const dept = app.job_posting?.department || 'Other'
          if (deptStats[dept]) {
            deptStats[dept].hired += 1
          } else {
            // Handle case where department exists in applications but not in jobs
            deptStats[dept] = { applications: 0, views: 0, hired: 1 }
          }
        }
      })
      
      return deptStats
    })()
  }

  // Calculate conversion rates
  const conversionRates = {
    viewToApplication: stats.totalViews > 0 ? ((stats.totalApplications / stats.totalViews) * 100).toFixed(1) : 0,
    applicationToHire: stats.totalApplications > 0 ? ((stats.hiredApplicants / stats.totalApplications) * 100).toFixed(1) : 0,
    overallConversion: stats.totalViews > 0 ? ((stats.hiredApplicants / stats.totalViews) * 100).toFixed(1) : 0
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Job Postings ({stats.total})</TabsTrigger>
            <TabsTrigger value="applications">Applications ({stats.totalApplications})</TabsTrigger>
            <TabsTrigger value="candidates">Candidate Pool ({candidates.length})</TabsTrigger>
            <TabsTrigger value="interviews">Interviews ({interviews.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                      <p className="text-sm text-gray-600">{stats.pendingApplications} pending review</p>
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

              <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" onClick={() => setActiveTab('analytics')}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-orange-600" />
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
                    <span className="text-yellow-600"> {stats.draft}</span> draft,
                    <span className="text-red-600"> {stats.closed}</span> closed
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
                  {applications
                    .filter(app => app.status !== 'accepted' && app.status !== 'hired')
                    .slice(0, 3)
                    .map((application, index) => (
                    <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg mb-2 hover:bg-gray-50 cursor-pointer"
                         onClick={() => viewApplicationDetails(application)}>
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
                            application.status === 'pending' || application.status === 'interview_scheduled' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                            application.status === 'accepted' || application.status === 'hired' ? 'border-green-300 text-green-700 bg-green-50' :
                            application.status === 'rejected' ? 'border-red-300 text-red-700 bg-red-50' :
                            'border-gray-300 text-gray-700 bg-gray-50'
                          }
                        >
                          {application.status === 'accepted' ? 'Hired' : 
                           application.status === 'interview_scheduled' ? 'Pending (Interview Scheduled)' :
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
                  {applications.filter(app => app.status !== 'accepted' && app.status !== 'hired').length === 0 && (
                    <p className="text-center text-gray-500 py-4">No recent applications</p>
                  )}
                  {applications.filter(app => app.status !== 'accepted' && app.status !== 'hired').length > 3 && (
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
            {/* Job Postings Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Job Postings</h2>
                <p className="text-gray-600">Manage your active job postings and create new ones</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select defaultValue="all" onValueChange={(value) => console.log('Filter by status:', value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="newest" onValueChange={(value) => console.log('Sort by:', value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="applications">Most Applications</SelectItem>
                    <SelectItem value="views">Most Views</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Job Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Jobs</p>
                      <p className="text-2xl font-bold text-blue-700">{jobs.length}</p>
                    </div>
                    <Briefcase className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Active Jobs</p>
                      <p className="text-2xl font-bold text-green-700">{jobs.filter(j => j.status === 'active').length}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Total Views</p>
                      <p className="text-2xl font-bold text-yellow-700">{jobs.reduce((sum, j) => sum + (j.views_count || 0), 0)}</p>
                    </div>
                    <Eye className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Total Applications</p>
                      <p className="text-2xl font-bold text-purple-700">{jobs.reduce((sum, j) => sum + (j.applications_count || 0), 0)}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {isLoadingJobs ? (
              <Card>
                <CardContent className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading job postings...</span>
                </CardContent>
              </Card>
            ) : jobs.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="text-center p-12 text-gray-500">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-700">No Job Postings Yet</h3>
                  <p className="mb-6 text-gray-500">Create your first job posting to start attracting qualified candidates!</p>
                  <Button onClick={() => setIsCreateJobOpen(true)} size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-5 w-5 mr-2" />
                    Post Your First Job
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div>
                {/* Featured Jobs Section */}
                {jobs.filter(job => job.is_featured).length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Star className="h-6 w-6 text-yellow-500 mr-2" />
                        Featured Job Postings
                      </h2>
                      <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">
                        {jobs.filter(job => job.is_featured).length} Featured
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {jobs.filter(job => job.is_featured).map((job) => (
                        <Card
                          key={job.id}
                          className="group relative overflow-hidden border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 hover:shadow-xl transition-all duration-300"
                        >
                          {/* Featured Badge */}
                          <div className="absolute top-4 right-4 z-10">
                            <div className="flex space-x-2">
                              <Badge className="bg-yellow-500 text-white shadow-lg">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                              {job.is_urgent && (
                                <Badge variant="destructive" className="shadow-lg">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Urgent
                                </Badge>
                              )}
                            </div>
                          </div>

                          <CardHeader className="pb-4">
                            <div className="flex items-start space-x-4">
                              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Building2 className="h-7 w-7 text-yellow-600" />
                              </div>
                              <div className="flex-1 pr-20">
                                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-yellow-700 transition-colors">
                                  {job.title}
                                </CardTitle>
                                <CardDescription className="text-gray-600 font-medium">
                                  {employerInfo?.companyName || 'Your Company'}
                                </CardDescription>
                                <div className="flex items-center mt-2">
                                  <Badge 
                                    variant={job.status === 'active' ? 'default' : 'secondary'}
                                    className={job.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                                  >
                                    {job.status === 'active' ? 'Active' : job.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-6">
                            <p className="text-gray-700 leading-relaxed line-clamp-3">
                              {job.description}
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center text-gray-600 bg-white/50 rounded-lg p-3">
                                <MapPin className="h-4 w-4 mr-2 text-yellow-600" />
                                <span className="text-sm font-medium">{job.city}, {job.state}</span>
                              </div>
                              <div className="flex items-center text-gray-600 bg-white/50 rounded-lg p-3">
                                <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                                <span className="text-sm font-medium">{job.job_type}</span>
                              </div>
                              <div className="flex items-center text-gray-600 bg-white/50 rounded-lg p-3">
                                <DollarSign className="h-4 w-4 mr-2 text-yellow-600" />
                                <span className="text-sm font-medium">${job.salary_min}-${job.salary_max}/{job.salary_type}</span>
                              </div>
                              <div className="flex items-center text-gray-600 bg-white/50 rounded-lg p-3">
                                <Briefcase className="h-4 w-4 mr-2 text-yellow-600" />
                                <span className="text-sm font-medium">{job.department}</span>
                              </div>
                            </div>

                            {job.requirements && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2 text-gray-700">Key Requirements:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {job.requirements.split(',').slice(0, 4).map((req, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs bg-white/70 text-gray-700">
                                      {req.trim()}
                                    </Badge>
                                  ))}
                                  {job.requirements.split(',').length > 4 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{job.requirements.split(',').length - 4} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-4 border-t border-yellow-200">
                              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Eye className="h-4 w-4 mr-1 text-yellow-600" />
                                  <span className="font-medium">{job.views_count || 0}</span>
                                  <span className="ml-1">views</span>
                                </div>
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1 text-yellow-600" />
                                  <span className="font-medium">{job.applications_count || 0}</span>
                                  <span className="ml-1">applications</span>
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1 text-yellow-600" />
                                  <span className="font-medium">{new Date(job.posted_date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-2">
                              {job.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCloseJob(job.id)}
                                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Close Job
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditJob(job)}
                                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-400 transition-colors"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteJob(job.id)}
                                className="border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Jobs Section */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">All Job Postings</h2>
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="px-3 py-1">
                        {jobs.filter(job => !job.is_featured).length} Total
                      </Badge>
                      <div className="text-sm text-gray-500">
                        {jobs.filter(job => job.status === 'active').length} Active
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {jobs.filter(job => !job.is_featured && job.status === 'active').map((job) => (
                      <Card 
                        key={job.id} 
                        className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300"
                      >
                        {/* Status Badge */}
                        <div className="absolute top-4 right-4 z-10">
                          <div className="flex space-x-2">
                            <Badge 
                              variant={job.status === 'active' ? 'default' : 'secondary'}
                              className={job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                            >
                              {job.status === 'active' ? 'Active' : job.status}
                            </Badge>
                            {job.is_urgent && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Urgent
                              </Badge>
                            )}
                          </div>
                        </div>

                        <CardHeader className="pb-4">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                              <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1 pr-20">
                              <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                                {job.title}
                              </CardTitle>
                              <CardDescription className="text-gray-600 font-medium">
                                {employerInfo?.companyName || 'Your Company'}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                            {job.description}
                          </p>

                          <div className="space-y-3">
                            <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-3">
                              <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                              <span className="text-sm font-medium">{job.city}, {job.state}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-3">
                                <Clock className="h-4 w-4 mr-2 text-blue-600" />
                                <span className="text-sm font-medium">{job.job_type}</span>
                              </div>
                              <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-3">
                                <Briefcase className="h-4 w-4 mr-2 text-blue-600" />
                                <span className="text-sm font-medium">{job.department}</span>
                              </div>
                            </div>
                            <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-3">
                              <DollarSign className="h-4 w-4 mr-2 text-blue-600" />
                              <span className="text-sm font-medium">${job.salary_min}-${job.salary_max}/{job.salary_type}</span>
                            </div>
                          </div>

                          {job.requirements && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2 text-gray-700">Requirements:</h4>
                              <div className="flex flex-wrap gap-1">
                                {job.requirements.split(',').slice(0, 3).map((req, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {req.trim()}
                                  </Badge>
                                ))}
                                {job.requirements.split(',').length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{job.requirements.split(',').length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div className="flex space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Eye className="h-4 w-4 mr-1" />
                                <span className="font-medium">{job.views_count || 0}</span>
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                <span className="font-medium">{job.applications_count || 0}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span className="font-medium">{new Date(job.posted_date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2 pt-2">
                            {job.status === 'active' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCloseJob(job.id)}
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Close Job
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditJob(job)}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteJob(job.id)}
                              className="border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending (Including Interviews)</SelectItem>
                    <SelectItem value="offer_received">Offer Received</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={jobFilter} onValueChange={setJobFilter}>
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
                <Button variant="outline" size="sm" onClick={exportApplications}>
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
                        {applications.filter(app => 
                          app.status === 'pending' || 
                          app.status === 'interview_scheduled' || 
                          app.status === 'offer_received' ||
                          app.status === 'offer_accepted'
                        ).length}
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
                ) : filteredApplications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No applications yet.</p>
                    <p className="text-sm mt-1">Applications will appear here when candidates apply to your jobs.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredApplications.map((application) => (
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
                                      application.status === 'interview_scheduled' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                      application.status === 'offer_received' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                      application.status === 'offer_accepted' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                      application.status === 'offer_declined' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                      (application.status === 'pending' && application.is_accepted) ? 'bg-green-50 text-green-700 border-green-300' :
                                      'bg-gray-100 text-gray-800 border-gray-300'
                                    }
                                  >
                                    {application.status === 'accepted' ? 'Hired' : 
                                     application.status === 'hired' ? 'Hired' :
                                     application.status === 'interview_scheduled' ? 'Interview Scheduled' :
                                     application.status === 'offer_received' ? 'Offer Received' :
                                     application.status === 'offer_accepted' ? 'Offer Accepted' :
                                     application.status === 'offer_declined' ? 'Offer Declined' :
                                     (application.status === 'pending' && application.is_accepted) ? 'Accepted' :
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
                                disabled={
                                  // Disable if pending and not accepted yet
                                  (application.status === 'pending' && !application.is_accepted) ||
                                  // Disable if already in these statuses
                                  application.status === 'interview_scheduled' ||
                                  application.status === 'offer_received' ||
                                  application.status === 'offer_accepted' ||
                                  application.status === 'accepted' ||
                                  application.status === 'hired'
                                }
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule Interview
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => sendJobOffer(application)}
                                disabled={
                                  // Disable if not accepted yet
                                  (application.status === 'pending' && !application.is_accepted) ||
                                  // Disable if already in these statuses
                                  application.status === 'offer_received' || 
                                  application.status === 'offer_accepted' || 
                                  application.status === 'offer_declined' || 
                                  application.status === 'accepted' || 
                                  application.status === 'hired'
                                }
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send Offer
                              </Button>
                              
                              {/* Accept Application - stays pending, disables reject */}
                              {application.status === 'pending' && !application.is_accepted && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const applicantName = `${application.applicant?.first_name || ''} ${application.applicant?.last_name || ''}`.trim() || 'this candidate'
                                    if (confirm(`Accept the application from ${applicantName}? This will allow you to schedule an interview.`)) {
                                      handleAcceptApplication(application.id)
                                    }
                                  }}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accept Application
                                </Button>
                              )}
                              
                              {/* Show accepted badge once accepted */}
                              {application.status === 'pending' && application.is_accepted && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled
                                  className="text-green-600 bg-green-50 border-green-300"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accepted
                                </Button>
                              )}
                              
                              {/* Hire Now - After Interview Date Passed (Fast Hire, No Offer Needed) */}
                              {application.status === 'interview_scheduled' && (() => {
                                // Find the interview for this application
                                const relatedInterview = interviews.find(int => 
                                  int.applicant_id === application.applicant_id && 
                                  int.job_posting_id === application.job_posting_id
                                )
                                
                                // Check if interview date/time has passed
                                const interviewHasPassed = relatedInterview?.interview_date 
                                  ? new Date(relatedInterview.interview_date) < new Date()
                                  : false
                                
                                // Show both Hire and Reject buttons if interview date has passed
                                return interviewHasPassed ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const applicantName = `${application.applicant?.first_name || ''} ${application.applicant?.last_name || ''}`.trim() || 'this candidate'
                                        if (confirm(`Are you sure you want to hire ${applicantName} after the interview? This will mark them as hired immediately.`)) {
                                          updateApplicationStatus(application.id, 'accepted')
                                        }
                                      }}
                                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-300"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Hire Now
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const applicantName = `${application.applicant?.first_name || ''} ${application.applicant?.last_name || ''}`.trim() || 'this candidate'
                                        if (confirm(`Are you sure you want to reject ${applicantName} after the interview? This action cannot be undone.`)) {
                                          updateApplicationStatus(application.id, 'rejected')
                                        }
                                      }}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </>
                                ) : null
                              })()}
                              
                              {/* Mark as Hired - Highest Status (Offer Accepted Phase) */}
                              {application.status === 'offer_accepted' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateApplicationStatus(application.id, 'accepted')}
                                  disabled={application.status === 'accepted'}
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 border-emerald-300"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Hired
                                </Button>
                              )}
                              
                              {/* Hide reject button if application is accepted */}
                              {(() => {
                                // Debug logging to console
                                console.log('🔍 Reject Button Check:', {
                                  id: application.id,
                                  status: application.status,
                                  is_accepted: application.is_accepted,
                                  name: application.applicant?.full_name
                                })
                                
                                const shouldHide = 
                                  application.is_accepted ||  // ← HIDE if accepted (for ANY status)
                                  application.status === 'rejected' ||
                                  application.status === 'accepted' ||
                                  application.status === 'hired'
                                
                                return !shouldHide ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateApplicationStatus(application.id, 'rejected')}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                ) : null
                              })()}
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
                                  onClick={() => contactCandidate(candidate)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Contact
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => sendOfferToCandidate(candidate)}
                                  className="text-purple-600 hover:text-purple-700"
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Send Offer
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => saveCandidate(candidate)}
                                  className="text-gray-600 hover:text-gray-700"
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

          {/* Interviews Tab */}
          <TabsContent value="interviews" className="space-y-6">
            {/* Reschedule Requests Section */}
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                  Reschedule Requests ({rescheduleRequests.length})
                </CardTitle>
                <CardDescription>
                  Review and respond to interview reschedule requests from applicants
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRescheduleRequests ? (
                  <div className="text-center py-4 text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto mb-2"></div>
                    Loading reschedule requests...
                  </div>
                ) : rescheduleRequests.length > 0 ? (
                  <div className="space-y-4">
                    {rescheduleRequests.map((request) => (
                      <Card key={request.id} className="border-orange-200 bg-orange-50">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h4 className="font-semibold text-lg">
                                  {request.applicant?.first_name} {request.applicant?.last_name}
                                </h4>
                                <Badge variant="outline" className="bg-white">
                                  {request.job_posting?.title || 'Job Position'}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                <div className="bg-white p-3 rounded border">
                                  <p className="text-sm text-gray-600 mb-1">Current Schedule:</p>
                                  <p className="font-medium text-gray-900">
                                    {request.original_date ? new Date(request.original_date).toLocaleDateString() : 'N/A'}
                                    {request.interview?.interview_time && ` ${request.interview.interview_time}`}
                                  </p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                  <p className="text-sm text-gray-600 mb-1">Proposed New Schedule:</p>
                                  <p className="font-medium text-blue-600">
                                    {request.proposed_date ? new Date(request.proposed_date).toLocaleDateString() : 'N/A'}
                                    {request.proposed_time && ` at ${request.proposed_time}`}
                                  </p>
                                </div>
                              </div>
                              
                              {request.reason && (
                                <div className="bg-white p-3 rounded border mb-3">
                                  <p className="text-sm text-gray-600 mb-1">Reason for Reschedule:</p>
                                  <p className="text-sm">{request.reason}</p>
                                </div>
                              )}
                              
                              <p className="text-xs text-gray-500">
                                Requested: {new Date(request.created_at).toLocaleString()}
                              </p>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <Button
                                onClick={() => respondToRescheduleRequest(request.id, 'approved')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => respondToRescheduleRequest(request.id, 'rejected')}
                                className="border-red-300 text-red-600 hover:bg-red-50"
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
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No pending reschedule requests</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Applicants can request to reschedule their interviews, and requests will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Interview Schedules ({interviews.length})</span>
                  <Button 
                    onClick={() => setIsInterviewModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                </CardTitle>
                <CardDescription>
                  Manage and track interview schedules with applicants
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingInterviews ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading interviews...</span>
                  </div>
                ) : interviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews scheduled</h3>
                    <p className="text-gray-500 mb-4">Start by scheduling interviews with qualified applicants</p>
                    <Button 
                      onClick={() => setIsInterviewModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule First Interview
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interviews.map((interview) => (
                      <Card key={interview.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-lg">{interview.applicant_name}</h3>
                                <Badge className={interview.status_badge.color}>
                                  {interview.status_badge.label}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                  <p><strong>Job:</strong> {interview.job_title}</p>
                                  <p><strong>Company:</strong> {interview.company_name}</p>
                                  <p><strong>Interviewer:</strong> {interview.interviewer_name || 'TBD'}</p>
                                </div>
                                <div>
                                  <p><strong>Date:</strong> {interview.interview_date_formatted}</p>
                                  <p><strong>Type:</strong> {interview.interview_type}</p>
                                  <p><strong>Duration:</strong> {interview.duration_formatted}</p>
                                </div>
                              </div>
                              {interview.interview_location && (
                                <p className="text-sm text-gray-600 mt-2">
                                  <strong>Location:</strong> {interview.interview_location}
                                </p>
                              )}
                              {interview.meeting_link && (
                                <p className="text-sm text-gray-600 mt-2">
                                  <strong>Meeting Link:</strong> 
                                  <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                    Join Meeting
                                  </a>
                                </p>
                              )}
                              {interview.interview_notes && (
                                <p className="text-sm text-gray-600 mt-2">
                                  <strong>Notes:</strong> {interview.interview_notes}
                                </p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              {interview.status === 'scheduled' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditInterview(interview)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCancelInterview(interview.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                </>
                              )}
                              {interview.status === 'cancelled' && (
                                <Badge className="bg-red-100 text-red-800">
                                  Cancelled
                                </Badge>
                              )}
                              {interview.status === 'completed' && (
                                <Badge className="bg-green-100 text-green-800">
                                  Completed
                                </Badge>
                              )}
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
                  <p className="text-blue-100">Comprehensive insights into your hiring performance and trends</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <BarChart3 className="h-8 w-8" />
                </div>
              </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
                  <Target className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{conversionRates.overallConversion}%</div>
                  <p className="text-xs text-gray-500">Views to Hires</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Application Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{conversionRates.viewToApplication}%</div>
                  <p className="text-xs text-gray-500">Views to Applications</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Hire Rate</CardTitle>
                  <UserCheck className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{conversionRates.applicationToHire}%</div>
                  <p className="text-xs text-gray-500">Applications to Hires</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Avg. Time to Hire</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">14</div>
                  <p className="text-xs text-gray-500">Days</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Monthly Trends
                  </CardTitle>
                  <CardDescription>Applications, views, and hires over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} name="Applications" />
                        <Line type="monotone" dataKey="views" stroke="#10b981" strokeWidth={2} name="Views" />
                        <Line type="monotone" dataKey="hired" stroke="#f59e0b" strokeWidth={2} name="Hired" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Application Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-green-600" />
                    Application Status
                  </CardTitle>
                  <CardDescription>Distribution of application statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.applicationStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.applicationStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Job Performance and Weekly Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Job Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Top Performing Jobs
                  </CardTitle>
                  <CardDescription>Views and applications by job posting</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.jobPerformanceData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="views" fill="#3b82f6" name="Views" />
                        <Bar dataKey="applications" fill="#10b981" name="Applications" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-600" />
                    Weekly Activity
                  </CardTitle>
                  <CardDescription>Daily applications and views this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.weeklyActivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="applications" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Applications" />
                        <Area type="monotone" dataKey="views" stackId="2" stroke="#10b981" fill="#10b981" name="Views" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Department Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  Department Performance
                </CardTitle>
                <CardDescription>Performance metrics by department with accurate hire tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Department</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Views</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Applications</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Hired</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">View→App Rate</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">App→Hire Rate</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Overall Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analyticsData.departmentPerformance)
                        .sort(([,a], [,b]) => b.hired - a.hired) // Sort by hired count descending
                        .map(([dept, data]) => {
                          const viewToAppRate = data.views > 0 ? ((data.applications / data.views) * 100).toFixed(1) : "0"
                          const appToHireRate = data.applications > 0 ? ((data.hired / data.applications) * 100).toFixed(1) : "0"
                          const overallRate = data.views > 0 ? ((data.hired / data.views) * 100).toFixed(1) : "0"
                          
                          return (
                            <tr key={dept} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">
                                <div className="flex items-center gap-2">
                                  <span>{dept}</span>
                                  {data.hired > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      {data.hired} hired
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-sm">{data.views.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right font-mono text-sm">{data.applications.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-mono text-sm font-semibold text-green-600">
                                  {data.hired.toLocaleString()}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-sm">
                                <span className={parseFloat(viewToAppRate) > 5 ? 'text-green-600' : 'text-gray-600'}>
                                  {viewToAppRate}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-sm">
                                <span className={parseFloat(appToHireRate) > 20 ? 'text-green-600' : 'text-gray-600'}>
                                  {appToHireRate}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-sm">
                                <span className={parseFloat(overallRate) > 2 ? 'text-green-600' : 'text-gray-600'}>
                                  {overallRate}%
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                  
                  {Object.keys(analyticsData.departmentPerformance).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No department performance data available</p>
                      <p className="text-sm mt-1">Data will appear as you post jobs and receive applications</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Department Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Department Performance Chart
                </CardTitle>
                <CardDescription>Visual comparison of hiring performance across departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={Object.entries(analyticsData.departmentPerformance)
                        .map(([dept, data]) => ({
                          department: dept.length > 15 ? dept.substring(0, 15) + '...' : dept,
                          hired: data.hired,
                          applications: data.applications,
                          views: data.views
                        }))
                        .sort((a, b) => b.hired - a.hired)
                    }
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="department" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [value.toLocaleString(), name]}
                        labelFormatter={(label) => `Department: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="hired" fill="#10b981" name="Hired" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="applications" fill="#3b82f6" name="Applications" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="views" fill="#f59e0b" name="Views" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Insights and Recommendations */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Star className="h-5 w-5" />
                  Key Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Performance Highlights</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Your overall conversion rate is {conversionRates.overallConversion}%, which is above industry average</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>You've successfully hired {stats.hiredApplicants} candidates from {stats.totalApplications} applications</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Your job postings have received {stats.totalViews} total views</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Consider optimizing job descriptions to improve view-to-application conversion</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Focus on departments with lower conversion rates for improvement</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Review and streamline your hiring process to reduce time-to-hire</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Application Details Modal */}
      {selectedApplication && (
        <Dialog open={isApplicationModalOpen} onOpenChange={setIsApplicationModalOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center">
                  <User className="h-6 w-6 mr-3" />
                  Application Details
                </DialogTitle>
                <DialogDescription className="text-blue-100 mt-2">
                  Review application from {selectedApplication.applicant?.full_name || (selectedApplicationForm ? selectedApplicationForm.first_name + ' ' + selectedApplicationForm.last_name : 'Applicant')} for {selectedApplication.job_posting?.title || 'Position'}
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="space-y-6 p-6">

              {/* Job Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200 shadow-sm">
                <div className="flex items-center mb-4 pb-3 border-b-2 border-blue-300">
                  <Briefcase className="h-6 w-6 mr-3 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">Job Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <p className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wide">Position</p>
                    <p className="text-lg font-bold text-gray-900">{selectedApplication.job_posting?.title || formatPositionName(selectedApplicationForm?.desired_position) || 'Not specified'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <p className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wide">Location</p>
                    <p className="text-lg font-medium text-gray-900">{selectedApplication.job_posting?.city && selectedApplication.job_posting?.state ? `${selectedApplication.job_posting.city}, ${selectedApplication.job_posting.state}` : selectedApplication.job_posting?.location || 'Not specified'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <p className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wide">Job Type</p>
                    <p className="text-lg font-medium text-gray-900 capitalize">{selectedApplication.job_posting?.job_type || selectedApplicationForm?.employment_type || 'Not specified'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <p className="text-xs font-semibold text-blue-600 mb-2 uppercase tracking-wide">Applied Date</p>
                    <p className="text-lg font-medium text-gray-900">{new Date(selectedApplication.applied_date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
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

              {/* Detailed Application Form */}
              {isLoadingApplicationForm ? (
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Detailed Application Form</h3>
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
                    <span className="ml-4 text-gray-600 font-medium">Loading application form...</span>
                  </div>
                </div>
              ) : selectedApplicationForm ? (
                <div className="bg-white rounded-lg shadow-md border-2 border-gray-200">
                  <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
                    <h3 className="text-2xl font-bold flex items-center">
                      <FileText className="h-6 w-6 mr-3" />
                      Complete Application Form Details
                    </h3>
                  </div>
                  
                  <div className="p-6 space-y-8">
                  {/* Step 1: Personal Information */}
                  <div className="mb-8 pb-8 border-b-2 border-gray-200">
                    <div className="flex items-center mb-6 pb-3 border-b-2 border-blue-200">
                      <div className="bg-blue-100 p-3 rounded-lg mr-4">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">Personal Information</h4>
                        <p className="text-sm text-gray-600">Basic personal details and contact information</p>
                      </div>
                    </div>
                    
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">First Name *</Label>
                          <div className="mt-1 p-4 border-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm">
                        <p className="font-semibold text-gray-900 text-lg">{selectedApplicationForm.first_name || 'Not provided'}</p>
                          </div>
                      </div>
                      <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">Middle Initial</Label>
                          <div className="mt-1 p-4 border-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm">
                        <p className="font-semibold text-gray-900 text-lg">{selectedApplicationForm.middle_initial || 'Not provided'}</p>
                          </div>
                      </div>
                      <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">Last Name *</Label>
                          <div className="mt-1 p-4 border-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm">
                        <p className="font-semibold text-gray-900 text-lg">{selectedApplicationForm.last_name || 'Not provided'}</p>
                      </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">Email Address *</Label>
                          <div className="mt-1 p-4 border-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm">
                        <p className="font-semibold text-gray-900 text-lg">{selectedApplicationForm.email || 'Not provided'}</p>
                          </div>
                      </div>
                      <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">Phone Number *</Label>
                          <div className="mt-1 p-4 border-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm">
                        <p className="font-semibold text-gray-900 text-lg">{selectedApplicationForm.phone || 'Not provided'}</p>
                      </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Address *</Label>
                        <div className="mt-1 p-4 border-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm">
                        <p className="font-semibold text-gray-900 text-lg">{selectedApplicationForm.address || 'Not provided'}</p>
                      </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">City *</Label>
                          <div className="mt-1 p-4 border-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm">
                        <p className="font-semibold text-gray-900 text-lg">{selectedApplicationForm.city || 'Not provided'}</p>
                          </div>
                      </div>
                      <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">State *</Label>
                          <div className="mt-1 p-4 border-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm">
                        <p className="font-semibold text-gray-900 text-lg">{selectedApplicationForm.state || 'Not provided'}</p>
                          </div>
                      </div>
                      <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">ZIP Code *</Label>
                          <div className="mt-1 p-4 border-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm">
                        <p className="font-semibold text-gray-900 text-lg">{selectedApplicationForm.zip_code || 'Not provided'}</p>
                      </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">Date of Birth</Label>
                          <div className="mt-1 p-4 border-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm">
                        <p className="font-semibold text-gray-900 text-lg">{selectedApplicationForm.date_of_birth ? new Date(selectedApplicationForm.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                          </div>
                      </div>
                      <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">Social Security Number</Label>
                          <div className="mt-1 p-4 border-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm">
                        <p className="font-semibold text-gray-900 text-lg">{selectedApplicationForm.ssn || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Position & Experience */}
                  <div className="mb-8 pb-8 border-b-2 border-gray-200">
                    <div className="flex items-center mb-6 pb-3 border-b-2 border-blue-200">
                      <div className="bg-blue-100 p-3 rounded-lg mr-4">
                        <Briefcase className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">Position & Experience</h4>
                        <p className="text-sm text-gray-600">Desired role and professional background</p>
                      </div>
                    </div>
                    
                    <div className="space-y-5">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Position Applying For *</Label>
                        <div className="mt-1 p-4 border-2 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
                          <p className="font-bold text-blue-900 text-lg">{formatPositionName(selectedApplicationForm.desired_position) || 'Not provided'}</p>
                      </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">Employment Type *</Label>
                          <div className="mt-1 p-4 border-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm">
                            <p className="font-semibold text-gray-900 text-lg capitalize">{selectedApplicationForm.employment_type || 'Not provided'}</p>
                        </div>
                        </div>

                        <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">Years of Experience *</Label>
                          <div className="mt-1 p-4 border-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm">
                            <p className="font-semibold text-gray-900 text-lg">{selectedApplicationForm.years_experience || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Availability *</Label>
                        <div className="mt-1 p-4 border-2 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm">
                          <p className="font-medium text-gray-900 whitespace-pre-wrap">{selectedApplicationForm.availability || 'Not provided'}</p>
                      </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Work History</Label>
                        <div className="mt-1 p-3 border rounded-md bg-gray-50">
                        <p className="font-medium whitespace-pre-wrap">{selectedApplicationForm.work_history || 'Not provided'}</p>
                      </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Specialties/Areas of Expertise</Label>
                        <div className="mt-1 p-3 border rounded-md bg-gray-50">
                          <p className="font-medium whitespace-pre-wrap">{selectedApplicationForm.specialties || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Education & Certifications */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
                      <h4 className="text-lg font-medium">Education & Certifications</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Share your educational background and certifications</p>
                    
                    <div className="space-y-6">
                      {/* Education Section */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Education</h3>
                        <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                              <Label className="text-sm font-medium">High School *</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                        <p className="font-medium">{selectedApplicationForm.high_school || 'Not provided'}</p>
                              </div>
                      </div>
                      <div>
                              <Label className="text-sm font-medium">Graduation Year</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                        <p className="font-medium">{selectedApplicationForm.hs_grad_year || 'Not provided'}</p>
                      </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                              <Label className="text-sm font-medium">College/University</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                        <p className="font-medium">{selectedApplicationForm.college || 'Not provided'}</p>
                              </div>
                      </div>
                      <div>
                              <Label className="text-sm font-medium">Degree</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                        <p className="font-medium">{selectedApplicationForm.degree || 'Not provided'}</p>
                      </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                              <Label className="text-sm font-medium">Major/Field of Study</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                        <p className="font-medium">{selectedApplicationForm.major || 'Not provided'}</p>
                              </div>
                      </div>
                      <div>
                              <Label className="text-sm font-medium">Graduation Year</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                        <p className="font-medium">{selectedApplicationForm.college_grad_year || 'Not provided'}</p>
                              </div>
                            </div>
                      </div>
                    </div>
                  </div>

                      {/* Professional Licenses & Certifications Section */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Professional Licenses & Certifications</h3>
                        <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                              <Label className="text-sm font-medium">Professional License Number</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                        <p className="font-medium">{selectedApplicationForm.license || 'Not provided'}</p>
                              </div>
                      </div>
                      <div>
                              <Label className="text-sm font-medium">License State</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                        <p className="font-medium">{selectedApplicationForm.license_state || 'Not provided'}</p>
                      </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                              <Label className="text-sm font-medium">License Expiration Date</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                        <p className="font-medium">{selectedApplicationForm.license_expiry ? new Date(selectedApplicationForm.license_expiry).toLocaleDateString() : 'Not provided'}</p>
                              </div>
                      </div>
                      <div>
                              <Label className="text-sm font-medium">CPR Certification</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                        <p className="font-medium">{selectedApplicationForm.cpr || 'Not provided'}</p>
                      </div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Other Certifications</Label>
                            <div className="mt-1 p-3 border rounded-md bg-gray-50">
                              <p className="font-medium whitespace-pre-wrap">{selectedApplicationForm.other_certs || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 5: Healthcare Compliance */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <Shield className="h-5 w-5 mr-2 text-blue-600" />
                      <h4 className="text-lg font-medium">Healthcare Compliance</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Complete healthcare compliance requirements</p>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                        <h3 className="font-medium text-red-900">Healthcare Compliance Requirements</h3>
                      </div>
                      <p className="text-sm text-red-800">
                        All healthcare positions require compliance with federal and state regulations. Please complete all
                        sections carefully.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* HIPAA Compliance */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3 flex items-center">
                          <Shield className="h-5 w-5 mr-2 text-blue-600" />
                          HIPAA Compliance & Privacy Training
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Have you completed HIPAA training in the past 12 months? *</Label>
                            <div className="mt-2 p-3 border rounded-md bg-gray-50">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${selectedApplicationForm.hipaa_training ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {selectedApplicationForm.hipaa_training ? 'Yes' : 'No'}
                        </span>
                      </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">HIPAA Certification Details</Label>
                            <div className="mt-1 p-3 border rounded-md bg-gray-50">
                              <p className="font-medium whitespace-pre-wrap">{selectedApplicationForm.hipaa_details || 'Not provided'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedApplicationForm.hipaa_training ? 'bg-green-500 border-green-500' : 'bg-gray-200 border-gray-300'}`}>
                              {selectedApplicationForm.hipaa_training && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                            </div>
                            <Label className="text-sm">
                              I understand and agree to comply with all HIPAA privacy and security requirements *
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Conflict of Interest */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Conflict of Interest Disclosure</h4>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">
                              Do you have any financial interests in healthcare facilities, suppliers, or related businesses? *
                            </Label>
                            <div className="mt-2 p-3 border rounded-md bg-gray-50">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${selectedApplicationForm.conflict_interest ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {selectedApplicationForm.conflict_interest ? 'Yes' : 'No'}
                        </span>
                      </div>
                          </div>
                          {selectedApplicationForm.conflict_details && (
                            <div>
                              <Label className="text-sm font-medium">If yes, please provide details</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                <p className="font-medium whitespace-pre-wrap">{selectedApplicationForm.conflict_details}</p>
                              </div>
                            </div>
                          )}
                          <div>
                            <Label className="text-sm font-medium">
                              Are you related to or have personal relationships with any Compassionate Home Health Services employees, patients, or board members? *
                            </Label>
                            <div className="mt-2 p-3 border rounded-md bg-gray-50">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${selectedApplicationForm.relationship_conflict ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {selectedApplicationForm.relationship_conflict ? 'Yes' : 'No'}
                        </span>
                      </div>
                          </div>
                          {selectedApplicationForm.relationship_details && (
                            <div>
                              <Label className="text-sm font-medium">If yes, please provide details</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                <p className="font-medium whitespace-pre-wrap">{selectedApplicationForm.relationship_details}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Background Check Consent */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Background Check Authorization</h4>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Have you ever been convicted of a felony or misdemeanor? *</Label>
                            <div className="mt-2 p-3 border rounded-md bg-gray-50">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${selectedApplicationForm.conviction_history ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {selectedApplicationForm.conviction_history ? 'Yes' : 'No'}
                        </span>
                      </div>
                          </div>
                          {selectedApplicationForm.conviction_details && (
                            <div>
                              <Label className="text-sm font-medium">If yes, please provide details</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                <p className="font-medium whitespace-pre-wrap">{selectedApplicationForm.conviction_details}</p>
                              </div>
                            </div>
                          )}
                          <div>
                            <Label className="text-sm font-medium">
                              Have you ever been listed on any state abuse registry or had professional sanctions? *
                            </Label>
                            <div className="mt-2 p-3 border rounded-md bg-gray-50">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${selectedApplicationForm.registry_history ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {selectedApplicationForm.registry_history ? 'Yes' : 'No'}
                        </span>
                      </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedApplicationForm.background_consent ? 'bg-green-500 border-green-500' : 'bg-gray-200 border-gray-300'}`}>
                              {selectedApplicationForm.background_consent && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                            </div>
                            <Label className="text-sm">
                              I authorize Compassionate Home Health Services to conduct a comprehensive background check including criminal
                              history, employment verification, and professional references *
                            </Label>
                          </div>
                        </div>
                      </div>
                      </div>
                    </div>
                    
                  {/* Step 6: Health & Safety Requirements */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <Heart className="h-5 w-5 mr-2 text-blue-600" />
                      <h4 className="text-lg font-medium">Health & Safety Requirements</h4>
                      </div>
                    <p className="text-sm text-gray-600 mb-4">Health screening and safety requirements</p>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center mb-2">
                        <Heart className="h-5 w-5 text-green-600 mr-2" />
                        <h3 className="font-medium text-green-900">Health & Safety Requirements</h3>
                      </div>
                      <p className="text-sm text-green-800">
                        Healthcare workers must meet specific health and safety requirements to protect patients and
                        colleagues.
                      </p>
                      </div>

                    <div className="space-y-6">
                      {/* TB Screening */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Tuberculosis (TB) Screening</h4>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">TB Test Status *</Label>
                            <div className="mt-1 p-3 border rounded-md bg-gray-50">
                              <p className="font-medium">{selectedApplicationForm.tb_test_status || 'Not provided'}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Date of Last TB Test</Label>
                            <div className="mt-1 p-3 border rounded-md bg-gray-50">
                              <p className="font-medium">{selectedApplicationForm.tb_test_date ? new Date(selectedApplicationForm.tb_test_date).toLocaleDateString() : 'Not provided'}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Additional TB History Details</Label>
                            <div className="mt-1 p-3 border rounded-md bg-gray-50">
                              <p className="font-medium whitespace-pre-wrap">{selectedApplicationForm.tb_history_details || 'Not provided'}</p>
                            </div>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                              <strong>Note:</strong> All healthcare workers must have a negative TB test within 12 months of
                              employment. If your test is older or you haven't been tested, you will need to complete testing
                              before starting work.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* HAPP Statement */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Healthcare Associated Prevention Program (HAPP) Statement</h4>
                        <div className="space-y-4">
                          <div className="bg-blue-50 p-4 rounded border border-blue-200">
                            <h5 className="font-medium text-blue-900 mb-2">HAPP Commitment Statement</h5>
                            <p className="text-sm text-blue-800 mb-3">
                              Compassionate Home Health Services is committed to preventing healthcare-associated infections and promoting patient
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
                          <div>
                            <Label className="text-sm font-medium">Have you received training in infection prevention and control? *</Label>
                            <div className="mt-2 p-3 border rounded-md bg-gray-50">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${selectedApplicationForm.infection_training ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {selectedApplicationForm.infection_training ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                          {selectedApplicationForm.infection_details && (
                            <div>
                              <Label className="text-sm font-medium">Training Details</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                <p className="font-medium whitespace-pre-wrap">{selectedApplicationForm.infection_details}</p>
                              </div>
                      </div>
                    )}
                          <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedApplicationForm.infection_training ? 'bg-green-500 border-green-500' : 'bg-gray-200 border-gray-300'}`}>
                              {selectedApplicationForm.infection_training && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                            </div>
                            <Label className="text-sm">
                              I commit to following all HAPP guidelines and infection prevention protocols *
                            </Label>
                          </div>
                        </div>
                  </div>

                      {/* Physical Requirements */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Physical Requirements & Accommodations</h4>
                        <div className="space-y-4">
                      <div>
                            <Label className="text-sm font-medium">
                              Can you perform the essential functions of the position with or without reasonable accommodation? *
                            </Label>
                            <div className="mt-2 p-3 border rounded-md bg-gray-50">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${selectedApplicationForm.physical_accommodation ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                {selectedApplicationForm.physical_accommodation ? 'Yes, with reasonable accommodation' : 'Yes'}
                              </span>
                            </div>
                          </div>
                          {selectedApplicationForm.physical_details && (
                            <div>
                              <Label className="text-sm font-medium">If accommodation is needed, please describe</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                <p className="font-medium whitespace-pre-wrap">{selectedApplicationForm.physical_details}</p>
                              </div>
                            </div>
                          )}
                          <div className="bg-gray-50 p-3 rounded">
                            <h5 className="font-medium text-gray-900 mb-2">Essential Physical Requirements Include:</h5>
                            <ul className="text-sm text-gray-700 space-y-1">
                              <li>• Lifting up to 50 pounds occasionally</li>
                              <li>• Standing and walking for extended periods</li>
                              <li>• Bending, stooping, and reaching</li>
                              <li>• Manual dexterity for patient care tasks</li>
                              <li>• Visual and auditory acuity for patient assessment</li>
                            </ul>
                      </div>
                    </div>
                  </div>

                      {/* Immunization Status */}
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Immunization Requirements</h4>
                        <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                              <Label className="text-sm font-medium">Hepatitis B Vaccination *</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                <p className="font-medium">{selectedApplicationForm.hep_b_vaccination || 'Not provided'}</p>
                              </div>
                      </div>
                      <div>
                              <Label className="text-sm font-medium">Influenza Vaccination (Current Season) *</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                <p className="font-medium">{selectedApplicationForm.flu_vaccination || 'Not provided'}</p>
                              </div>
                            </div>
                      </div>
                      <div>
                            <Label className="text-sm font-medium">Additional Immunization Information</Label>
                            <div className="mt-1 p-3 border rounded-md bg-gray-50">
                              <p className="font-medium whitespace-pre-wrap">{selectedApplicationForm.immunization_details || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 7: References & Contact */}
                  <div className="mb-6">
                    <div className="flex items-center mb-4">
                      <Phone className="h-5 w-5 mr-2 text-blue-600" />
                      <h4 className="text-lg font-medium">References & Contact</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Provide references and emergency contact information</p>
                    
                    <div className="space-y-6">
                      {/* Professional References */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Professional References</h3>
                    <div className="space-y-4">
                      {/* Reference 1 */}
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3">Reference 1</h4>
                            <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium">Full Name *</Label>
                                <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                  <p className="font-medium">{selectedApplicationForm.reference_1_name || 'Not provided'}</p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Relationship</Label>
                                <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                  <p className="font-medium">{selectedApplicationForm.reference_1_relationship || 'Not provided'}</p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Company/Organization</Label>
                                <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                  <p className="font-medium">{selectedApplicationForm.reference_1_company || 'Not provided'}</p>
                            </div>
                          </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Phone Number</Label>
                                  <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                    <p className="font-medium">{selectedApplicationForm.reference_1_phone || 'Not provided'}</p>
                        </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Email Address</Label>
                                  <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                    <p className="font-medium">{selectedApplicationForm.reference_1_email || 'Not provided'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                      {/* Reference 2 */}
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3">Reference 2</h4>
                            <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium">Full Name *</Label>
                                <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                  <p className="font-medium">{selectedApplicationForm.reference_2_name || 'Not provided'}</p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Relationship</Label>
                                <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                  <p className="font-medium">{selectedApplicationForm.reference_2_relationship || 'Not provided'}</p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Company/Organization</Label>
                                <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                  <p className="font-medium">{selectedApplicationForm.reference_2_company || 'Not provided'}</p>
                            </div>
                          </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Phone Number</Label>
                                  <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                    <p className="font-medium">{selectedApplicationForm.reference_2_phone || 'Not provided'}</p>
                        </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Email Address</Label>
                                  <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                    <p className="font-medium">{selectedApplicationForm.reference_2_email || 'Not provided'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                      {/* Reference 3 */}
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3">Reference 3</h4>
                            <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium">Full Name *</Label>
                                <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                  <p className="font-medium">{selectedApplicationForm.reference_3_name || 'Not provided'}</p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Relationship</Label>
                                <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                  <p className="font-medium">{selectedApplicationForm.reference_3_relationship || 'Not provided'}</p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Company/Organization</Label>
                                <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                  <p className="font-medium">{selectedApplicationForm.reference_3_company || 'Not provided'}</p>
                            </div>
                          </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Phone Number</Label>
                                  <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                    <p className="font-medium">{selectedApplicationForm.reference_3_phone || 'Not provided'}</p>
                        </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Email Address</Label>
                                  <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                    <p className="font-medium">{selectedApplicationForm.reference_3_email || 'Not provided'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
                        <div className="border rounded-lg p-4">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">Full Name *</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                <p className="font-medium">{selectedApplicationForm.emergency_name || 'Not provided'}</p>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Relationship</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                <p className="font-medium">{selectedApplicationForm.emergency_relationship || 'Not provided'}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Phone Number</Label>
                                <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                  <p className="font-medium">{selectedApplicationForm.emergency_phone || 'Not provided'}</p>
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Email Address</Label>
                                <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                  <p className="font-medium">{selectedApplicationForm.emergency_email || 'Not provided'}</p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Address</Label>
                              <div className="mt-1 p-3 border rounded-md bg-gray-50">
                                <p className="font-medium">{selectedApplicationForm.emergency_address || 'Not provided'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Application Review */}
                      <div className="border rounded-lg p-4">
                        <h3 className="text-lg font-medium mb-4">Application Review</h3>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-700">
                            By submitting this application, you certify that all information provided is accurate and complete. 
                            Compassionate Home Health Services will review your application and contact you within 2-3 business days.
                          </p>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedApplicationForm.terms_agreed ? 'bg-green-500 border-green-500' : 'bg-gray-200 border-gray-300'}`}>
                                {selectedApplicationForm.terms_agreed && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                              </div>
                              <Label className="text-sm">
                                I certify that all information provided is true and complete to the best of my knowledge.
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedApplicationForm.employment_at_will ? 'bg-green-500 border-green-500' : 'bg-gray-200 border-gray-300'}`}>
                                {selectedApplicationForm.employment_at_will && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                              </div>
                              <Label className="text-sm">
                                I understand that employment with Compassionate Home Health Services is at-will and may be terminated by either party at any time.
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedApplicationForm.drug_testing_consent ? 'bg-green-500 border-green-500' : 'bg-gray-200 border-gray-300'}`}>
                                {selectedApplicationForm.drug_testing_consent && <div className="w-2 h-2 bg-white rounded-sm"></div>}
                              </div>
                              <Label className="text-sm">
                                I consent to pre-employment drug testing and random drug testing as required.
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium mb-3 text-green-700">Additional Information</h4>
                    <div className="bg-white p-4 rounded border">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedApplicationForm.additional_info || 'No additional information provided'}</p>
                    </div>
                  </div>

                  {/* Form Submission Info */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium mb-3 text-green-700">Form Submission Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Submitted At:</p>
                        <p className="font-medium">{selectedApplicationForm.submitted_at ? new Date(selectedApplicationForm.submitted_at).toLocaleString() : 'Not available'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Last Updated:</p>
                        <p className="font-medium">{selectedApplicationForm.updated_at ? new Date(selectedApplicationForm.updated_at).toLocaleString() : 'Not available'}</p>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Detailed Application Form</h3>
                  <p className="text-gray-600">No detailed application form submitted yet.</p>
                </div>
              )}

              {/* Uploaded Documents */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-purple-800">Uploaded Documents</h3>
                {isLoadingDocuments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-2 text-gray-600">Loading documents...</span>
                  </div>
                ) : uploadedDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {uploadedDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium">{doc.document_type.charAt(0).toUpperCase() + doc.document_type.slice(1).replace('_', ' ')}</p>
                            <p className="text-sm text-gray-500">{doc.file_name} • {doc.file_size_mb} MB</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded font-medium ${
                            doc.status === 'verified' ? 'bg-green-100 text-green-800' : 
                            doc.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 italic text-center py-4">No documents uploaded yet</p>
                )}
              </div>

              {/* Application Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Status:</p>
                  <Badge 
                    variant="outline"
                    className={selectedApplication.status === 'accepted' ? 'bg-green-100 text-green-800 border-green-300' : 
                              selectedApplication.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                              selectedApplication.status === 'interview_scheduled' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              selectedApplication.status === 'offer_received' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                              selectedApplication.status === 'offer_accepted' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                              (selectedApplication.status === 'pending' && selectedApplication.is_accepted) ? 'bg-green-50 text-green-700 border-green-300' :
                              'bg-gray-100 text-gray-800 border-gray-300'}
                  >
                    {selectedApplication.status === 'accepted' ? 'Hired' : 
                     selectedApplication.status === 'hired' ? 'Hired' :
                     selectedApplication.status === 'interview_scheduled' ? 'Interview Scheduled' :
                     selectedApplication.status === 'offer_received' ? 'Offer Received' :
                     selectedApplication.status === 'offer_accepted' ? 'Offer Accepted' :
                     selectedApplication.status === 'offer_declined' ? 'Offer Declined' :
                     (selectedApplication.status === 'pending' && selectedApplication.is_accepted) ? 'Accepted' :
                     selectedApplication.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Badge>
                </div>
                
                <div className="flex space-x-2">
                  {/* Accept Application - stays pending with confirmation */}
                  {selectedApplication.status === 'pending' && !selectedApplication.is_accepted && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const applicantName = `${selectedApplication.applicant?.first_name || ''} ${selectedApplication.applicant?.last_name || ''}`.trim() || 'this candidate'
                        if (confirm(`Accept the application from ${applicantName}? This will allow you to schedule an interview.`)) {
                          handleAcceptApplication(selectedApplication.id)
                        }
                      }}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Accept Application
                    </Button>
                  )}
                  
                  {/* Show accepted badge */}
                  {selectedApplication.status === 'pending' && selectedApplication.is_accepted && (
                    <Button
                      variant="outline"
                      disabled
                      className="text-green-600 bg-green-50 border-green-300"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Accepted
                    </Button>
                  )}
                  
                  {/* Hire Now - After Interview Date Passed */}
                  {selectedApplication.status === 'interview_scheduled' && (() => {
                    // Find the interview for this application
                    const relatedInterview = interviews.find(int => 
                      int.applicant_id === selectedApplication.applicant_id && 
                      int.job_posting_id === selectedApplication.job_posting_id
                    )
                    
                    // Check if interview date/time has passed
                    const interviewHasPassed = relatedInterview?.interview_date 
                      ? new Date(relatedInterview.interview_date) < new Date()
                      : false
                    
                    // Show both Hire and Reject buttons if interview date has passed
                    return interviewHasPassed ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const applicantName = `${selectedApplication.applicant?.first_name || ''} ${selectedApplication.applicant?.last_name || ''}`.trim() || 'this candidate'
                            if (confirm(`Are you sure you want to hire ${applicantName} after the interview? This will mark them as hired immediately.`)) {
                              updateApplicationStatus(selectedApplication.id, 'accepted')
                            }
                          }}
                          className="text-indigo-600 hover:text-indigo-700 border-indigo-300"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Hire Now
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            const applicantName = `${selectedApplication.applicant?.first_name || ''} ${selectedApplication.applicant?.last_name || ''}`.trim() || 'this candidate'
                            if (confirm(`Are you sure you want to reject ${applicantName} after the interview? This action cannot be undone.`)) {
                              updateApplicationStatus(selectedApplication.id, 'rejected')
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    ) : null
                  })()}
                  
                  {/* Mark as Hired - Highest Status (Offer Accepted Phase) */}
                  {selectedApplication.status === 'offer_accepted' && (
                    <Button
                      variant="outline"
                      onClick={() => updateApplicationStatus(selectedApplication.id, 'accepted')}
                      disabled={selectedApplication.status === 'accepted' || selectedApplication.status === 'hired'}
                      className="text-emerald-600 hover:text-emerald-700 border-emerald-300"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark as Hired
                    </Button>
                  )}
                  
                  {/* Hide reject button if application is accepted */}
                  {!selectedApplication.is_accepted && 
                   selectedApplication.status !== 'rejected' && 
                   selectedApplication.status !== 'accepted' && 
                   selectedApplication.status !== 'hired' && (
                    <Button
                      variant="outline"
                      onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject Application
                    </Button>
                  )}
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
        onSchedule={handleScheduleInterview}
        applications={applications}
        jobs={jobs}
        employerId={employerId}
      />

      {/* Edit Interview Modal */}
      {selectedInterview && (
        <InterviewSchedulingModal
          isOpen={isEditInterviewOpen}
          onClose={() => {
            setIsEditInterviewOpen(false)
            setSelectedInterview(null)
          }}
          onSchedule={handleUpdateInterview}
          applications={applications}
          jobs={jobs}
          employerId={employerId}
          editMode={true}
          initialData={selectedInterview}
        />
      )}

      {/* Job Offer Modal */}
      <JobOfferModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        application={selectedApplicationForAction}
        onOfferSuccess={handleOfferSent}
      />

      {/* Candidate Profile Modal */}
      {selectedCandidate && (
        <Dialog open={isCandidateModalOpen} onOpenChange={setIsCandidateModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {selectedCandidate.full_name}
              </DialogTitle>
              <DialogDescription>
                Detailed profile information for {selectedCandidate.profession || 'Healthcare Professional'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                    {selectedCandidate.full_name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedCandidate.full_name}</h3>
                    <p className="text-gray-600">{selectedCandidate.profession || 'Healthcare Professional'}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">{selectedCandidate.experience_level || 'Experience not specified'}</Badge>
                      <Badge variant="secondary">{selectedCandidate.profile_completion}% Complete</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Profile Views</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedCandidate.profile_views || 0}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Email Address</p>
                      <p className="text-gray-900">{selectedCandidate.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Phone Number</p>
                      <p className="text-gray-900">{selectedCandidate.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Location</p>
                      <p className="text-gray-900">{selectedCandidate.location}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Professional Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Profession</p>
                      <p className="text-gray-900">{selectedCandidate.profession || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Experience Level</p>
                      <p className="text-gray-900">{selectedCandidate.experience_level || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Education Level</p>
                      <p className="text-gray-900">{selectedCandidate.education_level || 'Not specified'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Certifications */}
              {selectedCandidate.certifications && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Certifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedCandidate.certifications}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Profile Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profile Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedCandidate.profile_completion}%</p>
                      <p className="text-sm text-gray-600">Profile Complete</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedCandidate.profile_views || 0}</p>
                      <p className="text-sm text-gray-600">Profile Views</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {new Date(selectedCandidate.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">Member Since</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {new Date(selectedCandidate.updated_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">Last Updated</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => contactCandidate(selectedCandidate)}
                  className="text-green-600 hover:text-green-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Contact Candidate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sendOfferToCandidate(selectedCandidate)}
                  className="text-purple-600 hover:text-purple-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Offer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => saveCandidate(selectedCandidate)}
                  className="text-gray-600 hover:text-gray-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Save Candidate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadApplicantDocuments(selectedCandidate.id, selectedCandidate.full_name)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Documents
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
