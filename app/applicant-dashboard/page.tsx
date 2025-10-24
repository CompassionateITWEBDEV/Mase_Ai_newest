"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import DocumentUploadModal from "@/components/document-upload-modal"
import DocumentVerificationStatus from "@/components/document-verification-status"
import ApplicantNotificationSystem from "@/components/applicant-notification-system"
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Heart,
  Bell,
  Settings,
  LogOut,
  Search,
  MapPin,
  DollarSign,
  Calendar,
  Star,
  Building2,
  Eye,
  Edit,
  Plus,
  Download,
  Users,
  Upload,
  XCircle,
  Trash2,
  X,
  RefreshCw,
  Key,
  ChevronDown,
  Target,
} from "lucide-react"
import Link from "next/link"

interface ApplicantInfo {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  profession: string
  experience: string
  education: string
  certifications: string
  address: string
  city: string
  state: string
  zipCode: string
  profileCompletion: number
  memberSince: string
  profileViews: number
}

interface JobApplication {
  id: string
  job_posting_id: string
  applicant_id: string
  status: string
  applied_date: string
  cover_letter?: string
  resume_url?: string
  // Interview details
  interview_date?: string
  interview_time?: string
  interview_location?: string
  interviewer?: string
  interview_notes?: string
  // Offer details
  offer_deadline?: string
  offer_details?: string
  offer_salary_min?: number
  offer_salary_max?: number
  offer_salary_type?: string
  job_posting?: {
    title: string
    company_name: string
    location: string
    salary_min: number
    salary_max: number
    salary_type: string
    job_type: string
  }
}

export default function ApplicantDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [applicantInfo, setApplicantInfo] = useState<ApplicantInfo | null>(null)
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)
  const [savedJobs, setSavedJobs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileData, setProfileData] = useState<Partial<ApplicantInfo>>({})
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false)

  // Handle document verification
  const handleDocumentVerification = async (documentId: string, action: 'verified' | 'rejected', notes?: string) => {
    try {
      const response = await fetch('/api/documents/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          action,
          verifiedBy: applicantInfo?.id,
          notes
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        // Refresh documents list
        loadDocuments()
        // Refresh recent activities
        loadRecentActivities()
        alert(`Document ${action} successfully!`)
      }
    } catch (error) {
      console.error('Error updating document verification:', error)
      alert('Failed to update document verification. Please try again.')
    }
  }

  // Handle document download
  const handleDocumentDownload = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/download?document_id=${documentId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Get the filename from the response headers or use a default
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : `document-${documentId}.pdf`
      
      // Create a blob from the response
      const blob = await response.blob()
      
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download document. Please try again.')
    }
  }

  // Handle download all documents
  const handleDownloadAllDocuments = async () => {
    if (!applicantInfo?.id || documents.length === 0) return
    
    try {
      const response = await fetch(`/api/documents/download?applicant_id=${applicantInfo.id}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : `${applicantInfo.firstName}-${applicantInfo.lastName}-documents.zip`
      
      // Create a blob from the response
      const blob = await response.blob()
      
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Bulk download error:', error)
      alert('Failed to download documents. Please try again.')
    }
  }

  // Handle document deletion
  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    if (!confirm(`Are you sure you want to delete "${documentName}"? This action cannot be undone.`)) {
      return
    }

    try {
      console.log('Deleting document - ID:', documentId, 'Name:', documentName)
      console.log('Request payload:', { documentId })
      
      const response = await fetch('/api/documents/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId })
      })

      console.log('Delete response status:', response.status)
      
      const data = await response.json()
      console.log('Delete response data:', data)

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      if (data.success) {
        console.log('Document deleted successfully:', data)
        
        // Immediately update local state to reflect deletion
        setDocuments(prevDocs => {
          const filtered = prevDocs.filter(doc => doc.id !== documentId)
          console.log('Filtered documents after deletion:', filtered)
          return filtered
        })
        
        // Wait a moment for the database to process
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Reload documents from server to ensure sync
        console.log('Reloading documents from server...')
        await loadDocuments()
        
        // Reload recent activities to update the activity log
        loadRecentActivities()
        
        alert('✅ Document deleted successfully!')
      } else {
        throw new Error(data.error || 'Failed to delete document')
      }
    } catch (error: any) {
      console.error('Error deleting document:', error)
      alert('❌ Failed to delete document: ' + (error.message || 'Unknown error'))
    }
  }

  // Handle manual verification of all documents
  const handleVerifyAllDocuments = async () => {
    try {
      const pendingDocs = documents.filter(doc => doc.status === 'pending')
      if (pendingDocs.length === 0) {
        alert('No pending documents to verify.')
        return
      }

      // Verify each pending document
      for (const doc of pendingDocs) {
        await handleDocumentVerification(doc.id, 'verified', 'Auto-verified by user request')
      }
      
      alert(`Successfully verified ${pendingDocs.length} document(s)!`)
      loadDocuments() // Refresh the documents list
      
    } catch (error) {
      console.error('Error verifying documents:', error)
      alert('Failed to verify documents. Please try again.')
    }
  }

  // Load recent activities function
  const loadRecentActivities = async () => {
    if (!applicantInfo?.id) return
    
    try {
      setIsLoadingActivities(true)
      const response = await fetch(`/api/activities/recent?applicant_id=${applicantInfo.id}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success && data.activities) {
        setRecentActivities(data.activities)
      }
    } catch (error) {
      console.error('Error loading recent activities:', error)
    } finally {
      setIsLoadingActivities(false)
    }
  }
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadDocumentType, setUploadDocumentType] = useState('resume')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false)
  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)
  const [isApplicationDetailsOpen, setIsApplicationDetailsOpen] = useState(false)
  const [isApplyConfirmOpen, setIsApplyConfirmOpen] = useState(false)
  const [jobToApply, setJobToApply] = useState<any>(null)
  const [documentRequirements, setDocumentRequirements] = useState<any>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Load applicant data from localStorage
  useEffect(() => {
    const loadApplicantData = async () => {
      try {
        const storedUser = localStorage.getItem('currentUser')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          console.log('Loaded user from localStorage:', user)
          if (user.accountType === 'applicant') {
            console.log('Setting applicant info with ID:', user.id)
            
            // First, verify the user exists in the database
            try {
              const response = await fetch(`/api/debug-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
              })
              
              if (response.ok) {
                const data = await response.json()
                if (data.success && data.applicant) {
                  console.log('User verified in database:', data.applicant)
                  setApplicantInfo({
                    id: data.applicant.id,
                    firstName: data.applicant.first_name,
                    lastName: data.applicant.last_name,
                    email: data.applicant.email,
                    phone: data.applicant.phone || '',
                    profession: data.applicant.profession || '',
                    experience: data.applicant.experience_level || '',
                    education: data.applicant.education_level || '',
                    certifications: data.applicant.certifications || '',
                    address: data.applicant.address || '',
                    city: data.applicant.city || '',
                    state: data.applicant.state || '',
                    zipCode: data.applicant.zip_code || '',
                    profileCompletion: calculateProfileCompletion(data.applicant),
                    memberSince: new Date().toISOString().split('T')[0],
                    profileViews: data.applicant.profile_views || 0,
                  })
                  
                  // Update localStorage with correct data
                  const updatedUser = {
                    ...user,
                    id: data.applicant.id,
                    firstName: data.applicant.first_name,
                    lastName: data.applicant.last_name,
                    phone: data.applicant.phone,
                    profession: data.applicant.profession,
                    experience: data.applicant.experience_level,
                    education: data.applicant.education_level,
                    certifications: data.applicant.certifications,
                    address: data.applicant.address,
                    city: data.applicant.city,
                    state: data.applicant.state,
                    zipCode: data.applicant.zip_code,
                  }
                  localStorage.setItem('currentUser', JSON.stringify(updatedUser))
                  return
                }
              }
              
              // If user not found, try to get a working user from the database
              console.log('User not found in database, trying to get a working user...')
              const fixResponse = await fetch('/api/force-fix-user')
              if (fixResponse.ok) {
                const fixData = await fixResponse.json()
                if (fixData.success && fixData.user) {
                  console.log('Using working user from database:', fixData.user)
                  setApplicantInfo({
                    id: fixData.user.id,
                    firstName: fixData.user.firstName,
                    lastName: fixData.user.lastName,
                    email: fixData.user.email,
                    phone: fixData.user.phone || '',
                    profession: fixData.user.profession || '',
                    experience: fixData.user.experience || '',
                    education: fixData.user.education || '',
                    certifications: fixData.user.certifications || '',
                    address: fixData.user.address || '',
                    city: fixData.user.city || '',
                    state: fixData.user.state || '',
                    zipCode: fixData.user.zipCode || '',
                    profileCompletion: calculateProfileCompletion(fixData.user),
                    memberSince: new Date().toISOString().split('T')[0],
                    profileViews: 0,
                  })
                  
                  // Update localStorage with working user data
                  localStorage.setItem('currentUser', JSON.stringify(fixData.user))
                  return
                }
              }
            } catch (dbError) {
              console.error('Database verification failed:', dbError)
            }
            
            // Fallback to localStorage data if database verification fails
            setApplicantInfo({
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone || '',
              profession: user.profession || '',
              experience: user.experience || '',
              education: user.education || '',
              certifications: user.certifications || '',
              address: user.address || '',
              city: user.city || '',
              state: user.state || '',
              zipCode: user.zipCode || '',
              profileCompletion: calculateProfileCompletion(user),
              memberSince: new Date().toISOString().split('T')[0],
              profileViews: user.profileViews || 0,
            })
          }
        }
      } catch (error) {
        console.error('Error loading applicant data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadApplicantData()
  }, [])

  // Calculate profile completion percentage
  const calculateProfileCompletion = (user: any) => {
    let completed = 0
    const total = 13 // 9 profile fields + 4 required documents

    // Basic information (4 points)
    if (user.firstName) completed++
    if (user.lastName) completed++
    if (user.email) completed++
    if (user.phone) completed++
    
    // Professional information (3 points)
    if (user.profession) completed++
    if (user.experience) completed++
    if (user.education) completed++
    
    // Location information (2 points)
    if (user.city) completed++
    if (user.state) completed++
    
    // Certifications & Licenses (3 points) - requires text field + 2 document uploads
    const hasLicense = documents.some(doc => doc.document_type === 'license' && doc.status !== 'rejected')
    const hasCertification = documents.some(doc => doc.document_type === 'certification' && doc.status !== 'rejected')
    if (user.certifications) completed++ // Text field
    if (hasLicense) completed++ // License document
    if (hasCertification) completed++ // Certification document
    
    // Required documents (2 points total) - uploaded and not rejected
    const requiredDocs = [
      { type: 'resume', uploaded: documents.some(doc => doc.document_type === 'resume' && doc.status !== 'rejected') },
      { type: 'background_check', uploaded: documents.some(doc => doc.document_type === 'background_check' && doc.status !== 'rejected') }
    ]
    
    requiredDocs.forEach(doc => {
      if (doc.uploaded) completed++
    })

    return Math.round((completed / total) * 100)
  }

  // Load applications when applicant info is available
  // Load applications function
  const loadApplications = async () => {
    if (applicantInfo?.id) {
      try {
        const response = await fetch(`/api/applications/list?applicant_id=${applicantInfo.id}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (data.success && data.applications) {
          setApplications(data.applications)
        }
      } catch (error) {
        console.error('Error loading applications:', error)
      }
    }
  }

  // Load recommended jobs function
  const loadRecommendedJobs = async () => {
    try {
      const response = await fetch('/api/jobs/recommended')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success && data.jobs) {
        setRecommendedJobs(data.jobs)
      }
    } catch (error) {
      console.error('Error loading recommended jobs:', error)
      // Fallback to regular jobs if recommended jobs fail
      loadJobs('')
    }
  }

  useEffect(() => {
    if (applicantInfo?.id) {
      loadApplications()
    }
  }, [applicantInfo?.id])

  // Load documents when applicant info is available
  useEffect(() => {
    if (applicantInfo?.id) {
      loadDocuments()
    }
  }, [applicantInfo?.id])

  // Load documents when documents tab is active
  useEffect(() => {
    if (activeTab === 'documents' && applicantInfo?.id) {
      console.log('Loading documents for documents tab')
      loadDocuments()
    }
  }, [activeTab, applicantInfo])

  // Force reload documents when switching to documents tab
  useEffect(() => {
    if (activeTab === 'documents') {
      console.log('Documents tab activated, reloading documents')
      setTimeout(() => {
        loadDocuments()
      }, 100)
    }
  }, [activeTab])

  // Load applications when jobs tab is active
  useEffect(() => {
    if (activeTab === 'jobs' && applicantInfo?.id) {
      loadApplications()
      // Load recommended jobs when jobs tab is active
      loadRecommendedJobs()
    }
  }, [activeTab, applicantInfo])

  // Load saved jobs when applicant info is available
  useEffect(() => {
    const loadSavedJobs = async () => {
      if (applicantInfo?.id) {
        try {
          const response = await fetch(`/api/saved-jobs/list?applicant_id=${applicantInfo.id}`)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const data = await response.json()
          if (data.success && data.savedJobs) {
            // Extract job IDs from saved jobs
            const jobIds = data.savedJobs.map((savedJob: any) => savedJob.job_posting_id)
            setSavedJobs(jobIds)
          }
        } catch (error) {
          console.error('Error loading saved jobs:', error)
        }
      }
    }

    if (applicantInfo?.id) {
      loadSavedJobs()
    }
  }, [applicantInfo?.id])

  // Load jobs for job search
  const loadJobs = async (searchTerm = '') => {
    try {
      setIsLoadingJobs(true)
      const response = await fetch(`/api/jobs/list?status=active&limit=50${searchTerm ? `&search=${searchTerm}` : ''}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.success && data.jobs) {
        // Ensure all jobs have match scores
        const jobsWithScores = ensureJobsHaveMatchScores(data.jobs)
        setJobs(jobsWithScores)
        // Generate recommended jobs based on profile
        if (applicantInfo) {
          generateRecommendedJobs(data.jobs)
        }
        // Track views for all loaded jobs
        trackJobViews(data.jobs)
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setIsLoadingJobs(false)
    }
  }

  // Track job views
  const trackJobViews = async (jobs: any[]) => {
    if (!applicantInfo?.id) return

    try {
      // Track views for all jobs in parallel
      const viewPromises = jobs.map(job => 
        fetch('/api/jobs/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_posting_id: job.id,
            user_type: 'applicant',
            user_id: applicantInfo.id
          })
        }).catch(error => {
          console.error('Error tracking view for job:', job.id, error)
          return null
        })
      )

      await Promise.all(viewPromises)
    } catch (error) {
      console.error('Error tracking job views:', error)
    }
  }

  // Calculate match score for a single job
  const calculateJobMatchScore = (job: any) => {
    if (!applicantInfo) return { matchScore: 0, matchReasons: [] }

    let score = 0
    let reasons: string[] = []

    // 1. Match profession (highest priority - 35 points)
    if (applicantInfo.profession && job.title) {
      const profession = applicantInfo.profession.toLowerCase()
      const jobTitle = job.title.toLowerCase()
      const jobDescription = (job.description || '').toLowerCase()
      
      // Check for exact profession match in title
      if (jobTitle.includes(profession)) {
        score += 35
      reasons.push('Matches your profession')
      } else if (jobDescription.includes(profession)) {
        score += 20
        reasons.push('Related to your profession')
      }

      // Healthcare role-specific matches
      const healthcareRoles = {
        'nurse': ['rn', 'lpn', 'nursing', 'registered nurse'],
        'doctor': ['physician', 'md', 'medical doctor'],
        'therapist': ['therapy', 'pt', 'ot', 'speech'],
        'aide': ['cna', 'assistant', 'caregiver'],
        'technician': ['tech', 'technologist', 'lab'],
      }

      for (const [key, variants] of Object.entries(healthcareRoles)) {
        if (profession.includes(key)) {
          for (const variant of variants) {
            if (jobTitle.includes(variant) && score < 35) {
              score += 30
              reasons.push('Matches your healthcare role')
              break
            }
          }
        }
      }
    }

    // 2. Match location (25 points)
    if (applicantInfo.city && applicantInfo.state) {
      const userCity = applicantInfo.city.toLowerCase()
      const userState = applicantInfo.state.toLowerCase()
      const jobCity = (job.city || '').toLowerCase()
      const jobState = (job.state || '').toLowerCase()
      
      if (jobCity === userCity && jobState === userState) {
        score += 25
        reasons.push('Same city as you')
      } else if (jobState === userState) {
      score += 15
      reasons.push('Same state')
      } else if (jobCity.includes(userCity) || userCity.includes(jobCity)) {
        score += 10
        reasons.push('Nearby location')
      }
    }

    // 3. Match experience level (20 points)
    if (applicantInfo.experience) {
      const experienceLevel = applicantInfo.experience.toLowerCase()
      const jobTitle = (job.title || '').toLowerCase()
      const jobDescription = (job.description || '').toLowerCase()
      const jobRequirements = (job.requirements || '').toLowerCase()
      
      const experienceYears = parseInt(experienceLevel.match(/\d+/)?.[0] || '0')
      
      if (experienceLevel.includes('senior') || experienceYears >= 5) {
        if (jobTitle.includes('senior') || jobTitle.includes('lead') || jobTitle.includes('manager')) {
        score += 20
          reasons.push('Senior level position')
        } else if (jobRequirements.includes('5+ years') || jobRequirements.includes('experienced')) {
        score += 15
          reasons.push('Matches experience level')
        }
      } else if (experienceLevel.includes('junior') || experienceYears >= 1) {
        if (jobTitle.includes('junior') || jobRequirements.includes('1-3 years')) {
          score += 20
          reasons.push('Junior level position')
        }
      } else if (experienceLevel.includes('entry') || experienceYears === 0) {
        if (jobTitle.includes('entry') || jobTitle.includes('new grad') || jobRequirements.includes('no experience')) {
          score += 20
          reasons.push('Entry level position')
        }
      }
    }

    // 4. Match education (15 points)
    if (applicantInfo.education) {
      const education = applicantInfo.education.toLowerCase()
      const jobRequirements = (job.requirements || '').toLowerCase()
      
      if (education.includes('bachelor') && jobRequirements.includes('bsn')) {
        score += 15
        reasons.push('Education requirement met')
      } else if (education.includes('master') && (jobRequirements.includes('msn') || jobRequirements.includes('master'))) {
        score += 15
        reasons.push('Advanced degree match')
      } else if (education.includes('associate') && jobRequirements.includes('associate')) {
        score += 15
        reasons.push('Education requirement met')
      }
    }

    // 5. Match certifications (20 points total)
    if (applicantInfo.certifications) {
      const userCerts = applicantInfo.certifications.toLowerCase()
      const jobReqs = (job.requirements || '').toLowerCase()
      const jobTitle = (job.title || '').toLowerCase()
      
      const certMatches = [
        { cert: 'rn', keywords: ['rn', 'registered nurse'], points: 8, label: 'RN license' },
        { cert: 'lpn', keywords: ['lpn', 'licensed practical'], points: 8, label: 'LPN license' },
        { cert: 'cna', keywords: ['cna', 'certified nursing assistant'], points: 8, label: 'CNA certification' },
        { cert: 'bls', keywords: ['bls', 'basic life support'], points: 6, label: 'BLS certified' },
        { cert: 'cpr', keywords: ['cpr'], points: 6, label: 'CPR certified' },
        { cert: 'acls', keywords: ['acls', 'advanced cardiac'], points: 8, label: 'ACLS certified' },
        { cert: 'pals', keywords: ['pals', 'pediatric advanced'], points: 8, label: 'PALS certified' },
      ]

      for (const { cert, keywords, points, label } of certMatches) {
        if (userCerts.includes(cert)) {
          for (const keyword of keywords) {
            if (jobReqs.includes(keyword) || jobTitle.includes(keyword)) {
              score += points
              reasons.push(label)
              break
            }
          }
        }
      }
    }

    // 6. Match department/specialty (15 points)
    if (applicantInfo.profession) {
      const profession = applicantInfo.profession.toLowerCase()
      const jobTitle = (job.title || '').toLowerCase()
      const jobDepartment = (job.department || '').toLowerCase()
      const jobDescription = (job.description || '').toLowerCase()
      
      const specialtyMatches = [
        { specialty: 'icu', keywords: ['icu', 'intensive care', 'critical care'], label: 'ICU specialty' },
        { specialty: 'er', keywords: ['er', 'emergency', 'trauma'], label: 'Emergency specialty' },
        { specialty: 'pediatric', keywords: ['pediatric', 'peds', 'children'], label: 'Pediatric specialty' },
        { specialty: 'surgical', keywords: ['surgical', 'surgery', 'perioperative'], label: 'Surgical specialty' },
        { specialty: 'oncology', keywords: ['oncology', 'cancer'], label: 'Oncology specialty' },
        { specialty: 'cardiology', keywords: ['cardiology', 'cardiac', 'heart'], label: 'Cardiology specialty' },
        { specialty: 'home health', keywords: ['home health', 'home care'], label: 'Home health' },
      ]

      for (const { specialty, keywords, label } of specialtyMatches) {
        if (profession.includes(specialty)) {
          for (const keyword of keywords) {
            if (jobTitle.includes(keyword) || jobDepartment.includes(keyword) || jobDescription.includes(keyword)) {
              score += 15
              reasons.push(label)
              break
            }
          }
        }
      }
    }

    // 7. Recent posting (5 points)
    const daysSincePosted = Math.floor((new Date().getTime() - new Date(job.posted_date).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSincePosted <= 7) {
      score += 5
      reasons.push('Recently posted')
    } else if (daysSincePosted <= 14) {
      score += 3
      reasons.push('Posted recently')
    }

    // 8. Job activity indicators (5 points total)
    if (job.applications_count && job.applications_count > 0) {
      if (job.applications_count < 5) {
        score += 5
        reasons.push('Low competition')
      } else if (job.applications_count > 20) {
        score += 3
        reasons.push('Popular position')
      }
    }

    return {
      matchScore: Math.min(score, 100), // Cap at 100
      matchReasons: reasons.slice(0, 5) // Show top 5 reasons
    }
  }

  // Generate recommended jobs based on applicant profile
  const generateRecommendedJobs = (allJobs: any[]) => {
    if (!applicantInfo) {
      console.log('❌ No applicant info available for recommendations')
      return
    }

    console.log('🔍 Generating recommendations based on profile:')
    console.log('   - Profession:', applicantInfo.profession)
    console.log('   - Location:', `${applicantInfo.city}, ${applicantInfo.state}`)
    console.log('   - Experience:', applicantInfo.experience)
    console.log('   - Certifications:', applicantInfo.certifications)
    console.log('   - Education:', applicantInfo.education)

    const scoredJobs = allJobs.map(job => {
      const matchData = calculateJobMatchScore(job)
      return {
        ...job,
        ...matchData
      }
    })

    // Sort by score and take top 6
    const recommended = scoredJobs
      .filter(job => job.matchScore > 10) // Show jobs with at least 10% match
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6)

    console.log(`✅ Found ${recommended.length} recommended jobs:`)
    recommended.forEach((job, index) => {
      console.log(`   ${index + 1}. ${job.title} - ${job.matchScore}% match`)
      console.log(`      Reasons: ${job.matchReasons.join(', ')}`)
    })

    setRecommendedJobs(recommended)
    
    // Also update the main jobs list with match scores for consistency
    const jobsWithScores = allJobs.map(job => {
      const scoredJob = scoredJobs.find(scored => scored.id === job.id)
      return scoredJob || { ...job, matchScore: 0, matchReasons: [] }
    })
    setJobs(jobsWithScores)
  }

  // Ensure all jobs have match scores calculated
  const ensureJobsHaveMatchScores = (jobsList: any[]) => {
    return jobsList.map(job => {
      if (job.matchScore !== undefined) {
        return job // Already has match score
      }
      const matchData = calculateJobMatchScore(job)
      return {
        ...job,
        ...matchData
      }
    })
  }

  // Load jobs when switching to jobs tab
  useEffect(() => {
    if (activeTab === 'jobs') {
      loadJobs(searchQuery)
    }
  }, [activeTab, searchQuery])

  // Load recommended jobs when switching to overview tab
  useEffect(() => {
    if (activeTab === 'overview' && applicantInfo && jobs.length === 0) {
      loadJobs() // This will also generate recommended jobs
    }
  }, [activeTab, applicantInfo])

  // Initialize profile data when applicant info changes
  useEffect(() => {
    if (applicantInfo) {
      setProfileData({
        firstName: applicantInfo.firstName,
        lastName: applicantInfo.lastName,
        email: applicantInfo.email,
        phone: applicantInfo.phone,
        profession: applicantInfo.profession,
        experience: applicantInfo.experience,
        education: applicantInfo.education,
        certifications: applicantInfo.certifications,
        address: applicantInfo.address,
        city: applicantInfo.city,
        state: applicantInfo.state,
        zipCode: applicantInfo.zipCode,
      })
    }
  }, [applicantInfo])

  // Load recent activities when applicant info is available
  useEffect(() => {
    if (applicantInfo?.id) {
      loadRecentActivities()
    }
  }, [applicantInfo?.id])

  // Auto-refresh applications every 30 seconds
  useEffect(() => {
    if (!applicantInfo?.id) return
    
    const interval = setInterval(() => {
      console.log('Auto-refreshing applications...')
      loadApplications()
    }, 30000) // 30 seconds
    
    return () => clearInterval(interval)
  }, [applicantInfo?.id])

  // Auto-refresh documents every 45 seconds
  useEffect(() => {
    if (!applicantInfo?.id) return
    
    const interval = setInterval(() => {
      console.log('Auto-refreshing documents...')
      loadDocuments()
    }, 45000) // 45 seconds
    
    return () => clearInterval(interval)
  }, [applicantInfo?.id])

  // Auto-refresh profile views and recent activities every 60 seconds
  useEffect(() => {
    if (!applicantInfo?.id) return
    
    const interval = setInterval(async () => {
      console.log('Auto-refreshing profile data...')
      
      // Refresh profile views count
      try {
        const response = await fetch(`/api/debug-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: applicantInfo.id })
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.applicant) {
            setApplicantInfo(prev => prev ? {
              ...prev,
              profileViews: data.applicant.profile_views || 0
            } : null)
          }
        }
      } catch (error) {
        console.error('Error refreshing profile views:', error)
      }
      
      // Refresh recent activities
      loadRecentActivities()
    }, 60000) // 60 seconds
    
    return () => clearInterval(interval)
  }, [applicantInfo?.id])

  // Recalculate job match scores when applicant info changes
  useEffect(() => {
    if (applicantInfo && jobs.length > 0) {
      const jobsWithScores = ensureJobsHaveMatchScores(jobs)
      setJobs(jobsWithScores)
      generateRecommendedJobs(jobs)
    }
  }, [applicantInfo?.profession, applicantInfo?.experience, applicantInfo?.city, applicantInfo?.state, applicantInfo?.certifications])

  // Apply for a job - show confirmation dialog
  const applyForJob = async (jobId: string) => {
    if (!applicantInfo?.id) return

    // Check if profile is complete (at least 80% complete)
    const profileCompletion = calculateProfileCompletion(applicantInfo)
    if (profileCompletion < 80) {
      alert(`Please complete your profile before applying for jobs. Your profile is ${profileCompletion}% complete. Complete your profile in the Profile tab.`)
      setActiveTab('profile')
      return
    }

    // Find the job details
    const job = jobs.find(j => j.id === jobId) || recommendedJobs.find(j => j.id === jobId)
    if (job) {
      setJobToApply(job)
      setIsApplyConfirmOpen(true)
    }
  }

  // Confirm and apply for job
  const confirmApply = async () => {
    if (!applicantInfo?.id || !jobToApply) return

    try {
      const response = await fetch('/api/applications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_posting_id: jobToApply.id,
          applicant_id: applicantInfo.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Check if it's a document requirement error
        if (errorData.error === 'Missing required documents') {
          setIsApplyConfirmOpen(false)
          setDocumentRequirements(errorData)
          setIsDocumentUploadOpen(true)
          return
        }
        
        console.error('API Error:', errorData)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setIsApplyConfirmOpen(false)
        alert('Application submitted successfully!')
        
        // Increment job posting application count
        try {
          await fetch('/api/jobs/increment-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jobId: jobToApply.id,
              statType: 'applications'
            })
          })
        } catch (error) {
          console.error('Error tracking application count:', error)
        }
        
        // Reload applications
        const appsResponse = await fetch(`/api/applications/list?applicant_id=${applicantInfo.id}`)
        if (!appsResponse.ok) {
          throw new Error(`HTTP error! status: ${appsResponse.status}`)
        }
        const appsData = await appsResponse.json()
        if (appsData.success && appsData.applications) {
          setApplications(appsData.applications)
        }
        
        // Refresh job data to update counts
        refreshJobData()
        
        // Refresh recent activities
        loadRecentActivities()
      } else {
        alert('Failed to apply: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error applying for job:', error)
      alert('Failed to apply for job. Please try again.')
    }
  }

  // Handle logout
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('applicantInfo')
    // Redirect to login
    window.location.href = '/login'
  }

  // Handle change password
  const handleChangePassword = async () => {
    if (!applicantInfo?.id) {
      alert('Please log in to change your password.')
      return
    }

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields.')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters long.')
      return
    }

    try {
      setIsChangingPassword(true)

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: applicantInfo.id,
          currentPassword,
          newPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('✅ Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setIsSettingsOpen(false)
      } else {
        alert('❌ ' + (data.error || 'Failed to change password'))
      }
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Failed to change password. Please try again.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Update profile
  const updateProfile = async () => {
    if (!applicantInfo?.id) {
      console.error('No applicant ID found')
      alert('No applicant ID found. Please log in again.')
      return
    }

    try {
      setIsUpdatingProfile(true)
      console.log('Updating profile with data:', { id: applicantInfo.id, ...profileData })
      console.log('Applicant info:', applicantInfo)
      
      const response = await fetch('/api/applicants/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: applicantInfo.id,
          ...profileData,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Update response:', data)
      
      if (data.success) {
        alert('Profile updated successfully!')
        // Update local state
        setApplicantInfo(prev => prev ? { ...prev, ...profileData } : null)
        // Update localStorage
        const updatedUser = { ...JSON.parse(localStorage.getItem('currentUser') || '{}'), ...profileData }
        localStorage.setItem('currentUser', JSON.stringify(updatedUser))
      } else {
        alert('Failed to update profile: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Track job view
  const trackJobView = async (jobId: string) => {
    if (!applicantInfo?.id) return

    try {
      // Track in job_views table (this now also handles view count increment)
      await fetch('/api/jobs/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_posting_id: jobId,
          user_type: 'applicant',
          user_id: applicantInfo.id
        })
      })
    } catch (error) {
      console.error('Error tracking job view:', error)
    }
  }

  // Refresh job data
  const refreshJobData = async () => {
    try {
      const response = await fetch('/api/jobs/list?limit=50')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.jobs) {
          setJobs(data.jobs)
        }
      }
    } catch (error) {
      console.error('Error refreshing job data:', error)
    }
  }

  // View job details
  const viewJobDetails = async (job: any) => {
    setSelectedJob(job)
    setIsJobDetailsOpen(true)
    // Track the view
    await trackJobView(job.id)
  }

  // Handle document upload success
  const handleDocumentUploadSuccess = () => {
    // Refresh job data to update apply button states
    refreshJobData()
    // Load documents to refresh the list
    loadDocuments()
    // Refresh recent activities
    loadRecentActivities()
    // Close the modal
    setIsDocumentUploadOpen(false)
    // Show success message
    alert('Resume uploaded successfully! You can now apply for jobs.')
  }

  // Add interview to calendar
  const addToCalendar = (application: JobApplication) => {
    if (!application.interview_date || !application.interview_time) {
      alert('No interview date/time available')
      return
    }

    try {
      // Parse the interview date and time
      const interviewDate = new Date(application.interview_date)
      const [hours, minutes] = application.interview_time.split(':')
      interviewDate.setHours(parseInt(hours), parseInt(minutes), 0)

      // End time (1 hour after start)
      const endDate = new Date(interviewDate)
      endDate.setHours(endDate.getHours() + 1)

      // Format dates for ICS file
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      }

      // Create ICS file content
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//MASE Healthcare//Interview Scheduler//EN',
        'BEGIN:VEVENT',
        `UID:${application.id}@mase-healthcare.com`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(interviewDate)}`,
        `DTEND:${formatDate(endDate)}`,
        `SUMMARY:Interview - ${application.job_posting?.title || 'Job Position'}`,
        `DESCRIPTION:Interview for ${application.job_posting?.title || 'position'} at ${application.job_posting?.company_name || 'company'}${application.interviewer ? `\\nInterviewer: ${application.interviewer}` : ''}${application.interview_notes ? `\\nNotes: ${application.interview_notes}` : ''}`,
        `LOCATION:${application.interview_location || 'TBD'}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT30M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Interview reminder - 30 minutes before',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n')

      // Create blob and download
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `interview-${application.job_posting?.title?.replace(/\s+/g, '-') || 'job'}.ics`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      alert('✅ Calendar invite downloaded! Open the file to add it to your calendar.')
    } catch (error) {
      console.error('Error creating calendar event:', error)
      alert('❌ Failed to create calendar event')
    }
  }

  // Load documents from database
  const loadDocuments = async () => {
    if (!applicantInfo?.id) {
      console.log('No applicant ID available for loading documents')
      return
    }
    
    console.log('Loading documents for applicant:', applicantInfo.id)
    
    try {
      const response = await fetch(`/api/applicants/documents?applicant_id=${applicantInfo.id}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Documents API response:', data)
      
      if (data.success && data.documents) {
        console.log(`Setting ${data.documents.length} documents:`, data.documents)
        setDocuments(data.documents)
      } else {
        console.log('No documents found or API error:', data)
        setDocuments([])
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
    }
  }

  // Save/unsave job functionality
  const toggleSaveJob = async (jobId: string) => {
    if (!applicantInfo?.id) return

    try {
      const isCurrentlySaved = savedJobs.includes(jobId)
      
      const response = await fetch('/api/saved-jobs/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: applicantInfo.id,
          jobId: jobId,
          action: isCurrentlySaved ? 'unsave' : 'save'
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        // Update local state
        if (isCurrentlySaved) {
          setSavedJobs(prev => prev.filter(id => id !== jobId))
        } else {
          setSavedJobs(prev => [...prev, jobId])
        }
        
        // Track save/unsave count
        try {
          await fetch('/api/jobs/increment-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jobId: jobId,
              statType: 'saves'
            })
          })
        } catch (error) {
          console.error('Error tracking save count:', error)
        }
        
        // Refresh job data to update counts
        refreshJobData()
        
        // Refresh recent activities
        loadRecentActivities()
      } else {
        alert('Failed to save job: ' + data.error)
      }
    } catch (error) {
      console.error('Error saving job:', error)
      alert('Failed to save job. Please try again.')
    }
  }

  // Handle complete profile button click
  const handleCompleteProfile = () => {
    setActiveTab('profile')
  }

  // Handle preview profile button click
  const handlePreviewProfile = () => {
    setIsPreviewOpen(true)
  }

  // Upload document function
  const uploadDocument = async () => {
    if (!uploadFile || !applicantInfo?.id) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('applicant_id', applicantInfo.id)
      formData.append('document_type', uploadDocumentType)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload Error:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        alert('Document uploaded successfully!')
        // Reload documents
        const docsResponse = await fetch(`/api/documents/list?applicant_id=${applicantInfo.id}`)
        if (docsResponse.ok) {
          const docsData = await docsResponse.json()
          if (docsData.success && docsData.documents) {
            setDocuments(docsData.documents)
          }
        }
        // Reset upload form
        setUploadFile(null)
        setUploadDocumentType('resume')
      } else {
        alert('Failed to upload document: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Failed to upload document. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  // Check if interview is past
  const isInterviewPast = (interviewDate: string, interviewTime: string) => {
    if (!interviewDate || !interviewTime) return false
    
    const now = new Date()
    const interviewDateTime = new Date(interviewDate)
    const [hours, minutes] = interviewTime.split(':')
    interviewDateTime.setHours(parseInt(hours), parseInt(minutes), 0)
    
    return now > interviewDateTime
  }

  // Calculate application stats from real data
  const applicationStats = {
    totalApplications: applications.length,
    pendingApplications: applications.filter(app => app.status === 'pending' || app.status === 'under_review').length,
    interviewsScheduled: applications.filter(app => 
      app.status === 'interview_scheduled' && 
      !isInterviewPast(app.interview_date || '', app.interview_time || '')
    ).length,
    offersReceived: applications.filter(app => app.status === 'offer_received').length,
    profileViews: applicantInfo?.profileViews || 0,
    savedJobs: savedJobs.length,
  }

  // Transform applications data for display
  const myApplications = applications.map(app => ({
    id: app.id,
    jobTitle: app.job_posting?.title || 'Job Title',
    company: app.job_posting?.company_name || 'Company',
    location: app.job_posting?.location || 'Location',
    appliedDate: new Date(app.applied_date).toLocaleDateString(),
    status: app.status,
    salary: app.job_posting ? `$${app.job_posting.salary_min}-${app.job_posting.salary_max}/${app.job_posting.salary_type}` : 'Salary not specified',
    type: app.job_posting?.job_type || 'Type not specified',
    interviewDate: app.interview_date || undefined,
    interviewTime: app.interview_time || undefined,
    interviewLocation: app.interview_location || undefined,
    interviewer: app.interviewer || undefined,
    interviewNotes: app.interview_notes || undefined,
    offerDeadline: app.offer_deadline || undefined,
    offerDetails: app.offer_details || undefined,
  }))

  // Transform recommended jobs for display
  const displayRecommendedJobs = recommendedJobs.map(job => ({
    id: job.id,
    title: job.title,
    company: job.employer?.company_name || 'Healthcare Facility',
    location: `${job.city}, ${job.state}`,
    salary: `$${job.salary_min}-${job.salary_max}/${job.salary_type}`,
    type: job.job_type,
    posted: Math.floor((new Date().getTime() - new Date(job.posted_date).getTime()) / (1000 * 60 * 60 * 24)) + ' days ago',
    match: job.matchScore,
    matchReasons: job.matchReasons || [],
  }))


  // Generate recent activity from applications
  const recentActivity = applications.slice(0, 4).map((app, index) => ({
    id: `activity_${index}`,
    type: "application_submitted",
    message: `Applied for ${app.job_posting?.title || 'job'} at ${app.job_posting?.company_name || 'company'}`,
    time: `${Math.floor((new Date().getTime() - new Date(app.applied_date).getTime()) / (1000 * 60 * 60 * 24))} days ago`,
  }))

  const getStatusColor = (status: string) => {
    switch (status) {
      case "interview_scheduled":
        return "bg-blue-100 text-blue-800"
      case "under_review":
        return "bg-yellow-100 text-yellow-800"
      case "offer_received":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "withdrawn":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "application_submitted":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "interview_scheduled":
        return <Calendar className="h-4 w-4 text-green-500" />
      case "profile_viewed":
        return <Eye className="h-4 w-4 text-purple-500" />
      case "job_saved":
        return <Star className="h-4 w-4 text-yellow-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getMatchColor = (match: number) => {
    if (match >= 90) return "text-green-600 bg-green-100"
    if (match >= 80) return "text-blue-600 bg-blue-100"
    if (match >= 70) return "text-yellow-600 bg-yellow-100"
    return "text-gray-600 bg-gray-100"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!applicantInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Please log in as an applicant to access this dashboard.</p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">IrishTriplets Job Portal</h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {applicantInfo ? `${applicantInfo.firstName} ${applicantInfo.lastName}` : 'Loading...'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              {/* Notification System */}
              {applicantInfo?.id && (
                <ApplicantNotificationSystem applicantId={applicantInfo.id} />
              )}
              
              {/* Settings Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
                    <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Account Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">My Applications</TabsTrigger>
            <TabsTrigger value="jobs">Job Search</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Profile Completion */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Completion</CardTitle>
                <CardDescription>Complete your profile to increase your chances of getting hired</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Progress value={applicantInfo ? calculateProfileCompletion(applicantInfo) : 0} className="h-2" />
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-2xl font-bold text-blue-600">{applicantInfo ? calculateProfileCompletion(applicantInfo) : 0}%</div>
                      <div className="text-sm text-gray-600">complete</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={handleCompleteProfile}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Complete Profile
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handlePreviewProfile}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{applicationStats.totalApplications}</p>
                      <p className="text-sm text-gray-600">Total Applications</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{applicationStats.interviewsScheduled}</p>
                      <p className="text-sm text-gray-600">Interview Scheduled</p>
                    </div>
                    <Calendar className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{applicationStats.profileViews}</p>
                      <p className="text-sm text-gray-600">Profile Views</p>
                    </div>
                    <Eye className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{savedJobs.length}</p>
                      <p className="text-sm text-gray-600">Saved Jobs</p>
                    </div>
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Applications */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Applications</CardTitle>
                      <CardDescription>Your latest job applications</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab('applications')}
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {applications.slice(0, 3).map((application) => (
                      <div key={application.id} className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{application.job_posting?.title || 'Unknown Position'}</h3>
                            <p className="text-sm text-gray-600">{application.job_posting?.company_name || 'Healthcare Facility'}</p>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              <span>{application.job_posting?.location || 'Unknown Location'}</span>
                              <span>${application.job_posting?.salary_min?.toLocaleString()}-${application.job_posting?.salary_max?.toLocaleString()}</span>
                              <span>Applied: {new Date(application.applied_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={
                              application.status === 'interview_scheduled' ? 'bg-blue-100 text-blue-800' :
                              application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              application.status === 'offer_received' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {application.status === 'interview_scheduled' ? 'Interview Scheduled' :
                               application.status === 'pending' ? 'Under Review' :
                               application.status === 'offer_received' ? 'Offer Received' :
                               application.status}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedApplication(application)
                                setIsApplicationDetailsOpen(true)
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                        
                        {application.status === 'interview_scheduled' && (
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                Interview scheduled for {application.interview_date ? new Date(application.interview_date).toLocaleDateString() : 'TBD'}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {application.status === 'offer_received' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">
                                  Offer expires on {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white flex-1">
                                Accept Offer
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 border-green-300 text-green-700">
                                Decline Offer
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Saved Jobs */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        Saved Jobs
                      </CardTitle>
                      <CardDescription>Jobs you've bookmarked for later</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab('jobs')}
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {savedJobs.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-2">No saved jobs yet</p>
                      <p className="text-sm text-gray-500">Browse jobs and save the ones you're interested in</p>
                      <Button 
                        size="sm" 
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                        onClick={() => setActiveTab('jobs')}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Browse Jobs
                      </Button>
                    </div>
                  ) : (
                  <div className="space-y-4">
                      {jobs.filter(job => savedJobs.includes(job.id)).slice(0, 3).map((job) => (
                        <div key={job.id} className="p-4 border rounded-lg bg-yellow-50 border-yellow-200 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{job.title}</h3>
                            <p className="text-sm text-gray-600">{job.employer?.company_name || 'Healthcare Facility'}</p>
                              <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {job.city}, {job.state}
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ${job.salary_min?.toLocaleString()}-${job.salary_max?.toLocaleString()}
                              </span>
                            </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => toggleSaveJob(job.id)}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              <Star className="h-4 w-4 fill-yellow-500" />
                            </Button>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                            onClick={() => applyForJob(job.id)}
                            disabled={applications.some(app => app.job_posting_id === job.id)}
                          >
                            {applications.some(app => app.job_posting_id === job.id) ? 'Applied' : 'Apply Now'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Interview Schedule */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      Upcoming Interviews
                    </CardTitle>
                    <CardDescription>Your scheduled interviews</CardDescription>
                        </div>
                        <Button 
                    variant="outline" 
                          size="sm" 
                    onClick={() => setActiveTab('applications')}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const interviewApplications = applications.filter(app => 
                    app.status === 'interview_scheduled' && 
                    (app.interview_date || app.interview_time) &&
                    !isInterviewPast(app.interview_date || '', app.interview_time || '')
                  )
                  
                  if (interviewApplications.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-2">No upcoming interviews</p>
                        <p className="text-sm text-gray-500">Interviews will appear here once scheduled</p>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="space-y-4">
                      {interviewApplications.slice(0, 3).map((application) => (
                        <div key={application.id} className="p-4 border rounded-lg bg-blue-50 border-blue-200 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{application.job_posting?.title || 'Unknown Position'}</h3>
                              <p className="text-sm text-gray-600">{application.job_posting?.company_name || 'Healthcare Facility'}</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">Interview Scheduled</Badge>
                          </div>
                          
                          <div className="space-y-2">
                            {application.interview_date && (
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Date:</span>
                                <span>{new Date(application.interview_date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}</span>
                              </div>
                            )}
                            {application.interview_time && (
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Time:</span>
                                <span>{application.interview_time}</span>
                              </div>
                            )}
                            {application.interview_location && (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Location:</span>
                                <span>{application.interview_location}</span>
                              </div>
                            )}
                            {application.interviewer && (
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Interviewer:</span>
                                <span>{application.interviewer}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2 mt-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setSelectedApplication(application)
                                setIsApplicationDetailsOpen(true)
                              }}
                            >
                              View Details
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                              onClick={() => addToCalendar(application)}
                            >
                              Add to Calendar
                        </Button>
                          </div>
                      </div>
                    ))}
                  </div>
                  )
                })()}
                </CardContent>
              </Card>

            {/* Past Interviews (History) */}
            {(() => {
              const pastInterviewApplications = applications.filter(app => 
                app.status === 'interview_scheduled' && 
                (app.interview_date || app.interview_time) &&
                isInterviewPast(app.interview_date || '', app.interview_time || '')
              )
              
              if (pastInterviewApplications.length > 0) {
                return (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-gray-500" />
                            Past Interviews
                          </CardTitle>
                          <CardDescription>Interview history</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-gray-600">
                          {pastInterviewApplications.length} past
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {pastInterviewApplications.slice(0, 3).map((application) => (
                          <div key={application.id} className="p-4 border rounded-lg bg-gray-50 border-gray-200 opacity-75">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-700">{application.job_posting?.title || 'Unknown Position'}</h3>
                                <p className="text-sm text-gray-600">{application.job_posting?.company_name || 'Healthcare Facility'}</p>
                              </div>
                              <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                                Past
                              </Badge>
            </div>
                            
                            <div className="space-y-2">
                              {application.interview_date && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  <span className="font-medium">Date:</span>
                                  <span>{new Date(application.interview_date).toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}</span>
                                </div>
                              )}
                              {application.interview_time && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock className="h-4 w-4" />
                                  <span className="font-medium">Time:</span>
                                  <span>{new Date(`2000-01-01T${application.interview_time}`).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2 mt-4">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  setSelectedApplication(application)
                                  setIsApplicationDetailsOpen(true)
                                }}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {pastInterviewApplications.length > 3 && (
                        <div className="text-center mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setActiveTab('applications')}
                          >
                            View All Past Interviews ({pastInterviewApplications.length})
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              }
              return null
            })()}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest job search activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingActivities ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Loading activities...</p>
                    </div>
                  ) : recentActivities.length > 0 ? (
                    recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No recent activities found.</p>
                      <p className="text-xs mt-1">Start applying to jobs to see your activity here.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used functions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    onClick={() => setActiveTab('jobs')}
                  >
                    <Search className="h-6 w-6 text-blue-500" />
                    <span className="text-sm font-medium">Search Jobs</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent hover:bg-green-50 hover:border-green-200 transition-colors"
                    onClick={() => setActiveTab('applications')}
                  >
                    <FileText className="h-6 w-6 text-green-500" />
                    <span className="text-sm font-medium">My Applications</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent hover:bg-purple-50 hover:border-purple-200 transition-colors"
                    onClick={() => setActiveTab('profile')}
                  >
                    <Edit className="h-6 w-6 text-purple-500" />
                    <span className="text-sm font-medium">Edit Profile</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 bg-transparent hover:bg-yellow-50 hover:border-yellow-200 transition-colors"
                    onClick={() => setActiveTab('jobs')}
                  >
                    <Star className="h-6 w-6 text-yellow-500" />
                    <span className="text-sm font-medium">Saved Jobs</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            {/* Application Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6 text-center">
                  <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{applicationStats.totalApplications}</p>
                  <p className="text-sm text-gray-600">Total Applications</p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">{applicationStats.pendingApplications}</p>
                  <p className="text-sm text-gray-600">Pending Review</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{applicationStats.interviewsScheduled}</p>
                  <p className="text-sm text-gray-600">Interviews Scheduled</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{applicationStats.offersReceived}</p>
                  <p className="text-sm text-gray-600">Offers Received</p>
                </CardContent>
              </Card>
            </div>

            {/* Applications List */}
            <Card>
              <CardHeader>
                <CardTitle>All Applications</CardTitle>
                <CardDescription>Track the status of your job applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No applications yet.</p>
                      <p className="text-sm mt-1">Start applying to jobs to see them here.</p>
                    </div>
                  ) : (
                    applications.map((application) => (
                      <div key={application.id} className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {application.job_posting?.title || 'Unknown Position'}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {application.job_posting?.company_name || 'Healthcare Facility'}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                              <span>Applied: {new Date(application.applied_date).toLocaleDateString()}</span>
                              <span>{application.job_posting?.location || 'Unknown Location'}</span>
                              <span>{application.job_posting?.job_type || 'Unknown Type'}</span>
                              <span>
                                ${application.job_posting?.salary_min?.toLocaleString()}-${application.job_posting?.salary_max?.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                        
                        {/* Status-specific content */}
                        {application.status === 'pending' && (
                          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-800">Under Review</span>
                            </div>
                          </div>
                        )}
                        
                        {application.status === 'interview_scheduled' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Interview Scheduled</span>
                              </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-blue-200">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                Interview Details
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-600 font-medium">Date:</span>
                                  <span className="ml-2 text-gray-900">
                                    {application.interview_date ? new Date(application.interview_date).toLocaleDateString('en-US', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    }) : 'Not specified'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600 font-medium">Time:</span>
                                  <span className="ml-2 text-gray-900">
                                    {application.interview_time ? new Date(`2000-01-01T${application.interview_time}`).toLocaleTimeString('en-US', { 
                                      hour: 'numeric', 
                                      minute: '2-digit',
                                      hour12: true 
                                    }) : 'Not specified'}
                                  </span>
                                </div>
                                <div className="md:col-span-2">
                                  <span className="text-gray-600 font-medium">Location:</span>
                                  <span className="ml-2 text-gray-900">
                                    {application.interview_location || 'Not specified'}
                                  </span>
                                </div>
                                {application.interviewer && (
                                  <div className="md:col-span-2">
                                    <span className="text-gray-600 font-medium">Interviewer:</span>
                                    <span className="ml-2 text-gray-900">{application.interviewer}</span>
                                  </div>
                                )}
                                {application.interview_notes && (
                                  <div className="md:col-span-2">
                                    <span className="text-gray-600 font-medium">Notes:</span>
                                    <p className="mt-1 text-gray-900 text-sm bg-gray-50 p-2 rounded">
                                      {application.interview_notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {application.status === 'accepted' && (
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">Application Accepted</span>
                            </div>
                            <Button size="sm" variant="outline" className="text-green-600 border-green-300">
                              View Details
                            </Button>
                          </div>
                        )}
                        
                        {application.status === 'offer_received' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">Job Offer Received</span>
                              </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-green-200">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Offer Details
                              </h4>
                              <div className="space-y-2 text-sm">
                                {application.offer_deadline && (
                                  <div>
                                    <span className="text-gray-600 font-medium">Offer Deadline:</span>
                                    <span className="ml-2 text-gray-900">
                                      {new Date(application.offer_deadline).toLocaleDateString('en-US', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })}
                                    </span>
                                  </div>
                                )}
                                {application.offer_details && (
                                  <div>
                                    <span className="text-gray-600 font-medium">Offer Details:</span>
                                    <p className="mt-1 text-gray-900 text-sm bg-gray-50 p-2 rounded">
                                      {application.offer_details}
                                    </p>
                                  </div>
                                )}
                                <div className="pt-2">
                                  <span className="text-gray-600 font-medium">Salary:</span>
                                  <span className="ml-2 text-gray-900">
                                    ${application.job_posting?.salary_min?.toLocaleString()}-${application.job_posting?.salary_max?.toLocaleString()}/{application.job_posting?.salary_type}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white flex-1">
                                Accept Offer
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1">
                                Decline Offer
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {application.status === 'rejected' && (
                          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center space-x-2">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-medium text-red-800">Rejected</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            {/* Job Search Section */}
            <Card>
              <CardHeader>
                <CardTitle>Job Search</CardTitle>
                <CardDescription>Find your next healthcare opportunity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search jobs by title, company, or keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && loadJobs(searchQuery)}
                    />
                  </div>
                  <Button onClick={() => loadJobs(searchQuery)} className="bg-red-600 hover:bg-red-700">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>

                {isLoadingJobs ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading jobs...</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Search for Jobs</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Use the search bar above to find healthcare jobs that match your skills and preferences.
                    </p>
                    <Button 
                      onClick={() => loadJobs('')} 
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Browse All Jobs
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div key={job.id} className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => viewJobDetails(job)}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{job.title}</h3>
                            <p className="text-sm text-gray-600">{job.employer?.company_name || 'Healthcare Facility'}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{job.city}, {job.state}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">${job.salary_min}-${job.salary_max}/{job.salary_type}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{job.job_type}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{job.description}</p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge className="text-xs">Active</Badge>
                            <div className="text-xs text-gray-500">
                              Posted {new Date(job.posted_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Eye className="h-3 w-3" />
                            <span>{job.views_count || 0} views</span>
                            <Users className="h-3 w-3 ml-2" />
                            <span>{job.applications_count || 0} applications</span>
                            {job.matchScore > 0 && (
                              <>
                                <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                                <span className="text-xs font-medium text-green-600">{job.matchScore}% match</span>
                              </>
                            )}
                            <span className="text-xs text-blue-500 ml-2">Click to view details</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant={savedJobs.includes(job.id) ? "default" : "outline"}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleSaveJob(job.id)
                              }}
                            >
                              <Star className={`h-3 w-3 mr-1 ${savedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                              {savedJobs.includes(job.id) ? 'Saved' : 'Save'}
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation()
                                applyForJob(job.id)
                              }}
                              disabled={applications.some(app => app.job_posting_id === job.id) || (applicantInfo && calculateProfileCompletion(applicantInfo) < 80)}
                              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
                            >
                              {applications.some(app => app.job_posting_id === job.id) 
                                ? 'Applied' 
                                : (applicantInfo && calculateProfileCompletion(applicantInfo) < 80)
                                  ? 'Complete Profile First'
                                  : 'Apply Now'
                              }
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommended Jobs Section */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended for You</CardTitle>
                <CardDescription>Jobs that match your profile and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingJobs ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading recommendations...</p>
                  </div>
                ) : recommendedJobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No recommendations available.</p>
                    <p className="text-sm mt-1">Complete your profile to get personalized job recommendations.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendedJobs.slice(0, 6).map((job) => (
                      <div key={job.id} className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => viewJobDetails(job)}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-lg">{job.title}</h3>
                              {job.matchScore && job.matchScore > 0 && (
                                <Badge className={`text-xs ${getMatchColor(job.matchScore)}`}>
                                  {job.matchScore}% Match
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{job.employer?.company_name || 'Healthcare Facility'}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{job.city}, {job.state}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">${job.salary_min}-${job.salary_max}/{job.salary_type}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{job.job_type}</span>
                              </div>
                              </div>
                            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{job.description}</p>
                            {job.matchReasons && job.matchReasons.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {job.matchReasons.slice(0, 3).map((reason: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    {reason}
                                  </Badge>
                                ))}
                            </div>
                            )}
                              </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge className="text-xs bg-green-100 text-green-800">Recommended</Badge>
                            <div className="text-xs text-gray-500">
                              Posted {new Date(job.posted_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Eye className="h-3 w-3" />
                            <span>{job.views_count || 0} views</span>
                            <Users className="h-3 w-3 ml-2" />
                            <span>{job.applications_count || 0} applicants</span>
                          </div>
                          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleSaveJob(job.id)}
                          >
                            <Star className={`h-3 w-3 mr-1 ${savedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                            {savedJobs.includes(job.id) ? 'Saved' : 'Save'}
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => applyForJob(job.id)}
                            disabled={applications.some(app => app.job_posting_id === job.id) || (applicantInfo && calculateProfileCompletion(applicantInfo) < 80)}
                              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
                          >
                            {applications.some(app => app.job_posting_id === job.id) 
                              ? 'Applied' 
                              : (applicantInfo && calculateProfileCompletion(applicantInfo) < 80)
                                  ? 'Complete Profile'
                                : 'Apply Now'
                            }
                          </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            {/* Profile Management */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Keep your profile up to date to attract employers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        value={profileData.firstName || ''} 
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        value={profileData.lastName || ''} 
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={profileData.email || ''} 
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        value={profileData.phone || ''} 
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input 
                        id="address" 
                        value={profileData.address || ''} 
                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="profession">Profession</Label>
                      <Input 
                        id="profession" 
                        value={profileData.profession || ''} 
                        onChange={(e) => setProfileData({...profileData, profession: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="experience">Experience Level</Label>
                      <Input 
                        id="experience" 
                        value={profileData.experience || ''} 
                        onChange={(e) => setProfileData({...profileData, experience: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="education">Education Level</Label>
                      <Input 
                        id="education" 
                        value={profileData.education || ''} 
                        onChange={(e) => setProfileData({...profileData, education: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="certifications">Certifications</Label>
                      <Input 
                        id="certifications" 
                        value={profileData.certifications || ''} 
                        onChange={(e) => setProfileData({...profileData, certifications: e.target.value})}
                        placeholder="e.g., RN License, BLS Certification"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input 
                          id="city" 
                          value={profileData.city || ''} 
                          onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input 
                          id="state" 
                          value={profileData.state || ''} 
                          onChange={(e) => setProfileData({...profileData, state: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex space-x-4">
                  <Button 
                    onClick={updateProfile} 
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setProfileData({
                      firstName: applicantInfo?.firstName || '',
                      lastName: applicantInfo?.lastName || '',
                      email: applicantInfo?.email || '',
                      phone: applicantInfo?.phone || '',
                      profession: applicantInfo?.profession || '',
                      experience: applicantInfo?.experience || '',
                      education: applicantInfo?.education || '',
                      certifications: applicantInfo?.certifications || '',
                      address: applicantInfo?.address || '',
                      city: applicantInfo?.city || '',
                      state: applicantInfo?.state || '',
                      zipCode: applicantInfo?.zipCode || '',
                    })}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Profile Completion */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Completion</CardTitle>
                <CardDescription>Complete these sections to improve your profile visibility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Overall Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {applicantInfo ? calculateProfileCompletion(applicantInfo) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={applicantInfo ? calculateProfileCompletion(applicantInfo) : 0} 
                      className="h-3"
                    />
                  </div>

                  {/* Basic Information */}
                  <div className={`flex items-center justify-between p-3 border rounded-lg ${
                    applicantInfo?.firstName && applicantInfo?.lastName && applicantInfo?.email && applicantInfo?.phone
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      {applicantInfo?.firstName && applicantInfo?.lastName && applicantInfo?.email && applicantInfo?.phone ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      )}
                      <div>
                        <span className="font-medium">Basic Information</span>
                        <p className="text-xs text-gray-600">Name, Email, Phone</p>
                    </div>
                  </div>
                    {applicantInfo?.firstName && applicantInfo?.lastName && applicantInfo?.email && applicantInfo?.phone ? (
                      <Badge className="bg-green-600">Complete</Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-700 border-yellow-700">
                        {4 - [applicantInfo?.firstName, applicantInfo?.lastName, applicantInfo?.email, applicantInfo?.phone]
                          .filter(Boolean).length} missing
                      </Badge>
                    )}
                  </div>

                  {/* Professional Experience */}
                  <div className={`flex items-center justify-between p-3 border rounded-lg ${
                    applicantInfo?.profession && applicantInfo?.experience && applicantInfo?.education
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      {applicantInfo?.profession && applicantInfo?.experience && applicantInfo?.education ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      )}
                      <div>
                        <span className="font-medium">Professional Information</span>
                        <p className="text-xs text-gray-600">Profession, Experience, Education</p>
                    </div>
                  </div>
                    {applicantInfo?.profession && applicantInfo?.experience && applicantInfo?.education ? (
                      <Badge className="bg-green-600">Complete</Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-700 border-yellow-700">
                        {3 - [applicantInfo?.profession, applicantInfo?.experience, applicantInfo?.education]
                          .filter(Boolean).length} missing
                      </Badge>
                    )}
                  </div>

                  {/* Location */}
                  <div className={`flex items-center justify-between p-3 border rounded-lg ${
                    applicantInfo?.city && applicantInfo?.state
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      {applicantInfo?.city && applicantInfo?.state ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      )}
                      <div>
                        <span className="font-medium">Location</span>
                        <p className="text-xs text-gray-600">City & State</p>
                    </div>
                  </div>
                    {applicantInfo?.city && applicantInfo?.state ? (
                      <Badge className="bg-green-600">Complete</Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-700 border-yellow-700">Incomplete</Badge>
                    )}
                  </div>

                  {/* Certifications & Licenses */}
                  {(() => {
                    const hasLicense = documents.some(doc => doc.document_type === 'license' && doc.status !== 'rejected')
                    const hasCertification = documents.some(doc => doc.document_type === 'certification' && doc.status !== 'rejected')
                    const hasTextField = applicantInfo?.certifications
                    const isComplete = hasTextField && hasLicense && hasCertification
                    
                    // Debug: Log the actual documents
                    console.log('Documents:', documents)
                    console.log('License docs:', documents.filter(doc => doc.document_type === 'license'))
                    console.log('Certification docs:', documents.filter(doc => doc.document_type === 'certification'))
                    console.log('hasLicense:', hasLicense, 'hasCertification:', hasCertification, 'hasTextField:', hasTextField)
                    
                    return (
                      <div className={`flex items-center justify-between p-3 border rounded-lg ${
                        isComplete
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-yellow-50 border-yellow-200'
                      }`}>
                    <div className="flex items-center space-x-3">
                          {isComplete ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          )}
                          <div>
                            <span className="font-medium">Certifications & Licenses</span>
                            <p className="text-xs text-gray-600">
                              {isComplete 
                                ? 'Text field filled • License uploaded • Certification uploaded'
                                : hasTextField && hasLicense && !hasCertification
                                ? 'Text field ✓ • License ✓ • Certification needed'
                                : hasTextField && !hasLicense && hasCertification
                                ? 'Text field ✓ • License needed • Certification ✓'
                                : hasTextField && !hasLicense && !hasCertification
                                ? 'Text field ✓ • License needed • Certification needed'
                                : !hasTextField && hasLicense && hasCertification
                                ? 'Text field needed • License ✓ • Certification ✓'
                                : !hasTextField && hasLicense
                                ? 'Text field needed • License ✓ • Certification needed'
                                : !hasTextField && hasCertification
                                ? 'Text field needed • License needed • Certification ✓'
                                : 'Text field needed • License needed • Certification needed'}
                            </p>
                    </div>
                  </div>
                        {isComplete ? (
                          <Badge className="bg-green-600">Complete</Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-700 border-yellow-700">
                            Incomplete
                          </Badge>
                        )}
                      </div>
                    )
                  })()}

                  {/* Required Documents */}
                  {[
                    { name: "Resume", required: true, type: "resume", description: "Professional resume or CV" },
                    { name: "Background Check", required: true, type: "background_check", description: "Criminal background check" },
                  ].map((req, index) => {
                    const uploadedDoc = documents.find(doc => doc.document_type === req.type)
                    const isUploaded = !!uploadedDoc
                    const isVerified = uploadedDoc?.status === 'verified'
                    const isPending = uploadedDoc?.status === 'pending'
                    
                    return (
                      <div key={index} className={`flex items-center justify-between p-3 border rounded-lg ${
                        isVerified 
                          ? 'bg-green-50 border-green-200'
                          : isPending
                          ? 'bg-blue-50 border-blue-200'
                          : req.required
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          {isVerified ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : isPending ? (
                            <Clock className="h-5 w-5 text-blue-600" />
                          ) : req.required ? (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{req.name}</span>
                              <Badge variant="secondary" className={`text-xs ${
                                req.required 
                                  ? 'bg-red-100 text-red-700 border-red-300' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {req.required ? 'Required' : 'Optional'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{req.description}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {isVerified 
                                ? '✓ Verified and ready' 
                                : isPending 
                                ? '⏳ Uploaded, pending verification' 
                                : req.required
                                ? '⚠️ Required to complete profile'
                                : 'Optional document'}
                            </p>
                          </div>
                        </div>
                        {isVerified ? (
                          <Badge className="bg-green-600">Verified</Badge>
                        ) : isPending ? (
                          <Badge className="bg-blue-600">Pending</Badge>
                        ) : (
                          <Badge variant="outline" className={`text-xs ${
                            req.required ? 'text-red-700 border-red-300' : 'text-gray-600'
                          }`}>
                            Not Uploaded
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            {/* Document Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{documents.length}</p>
                      <p className="text-sm text-gray-600">Total Documents</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {documents.filter(doc => doc.status === 'verified').length}
                      </p>
                      <p className="text-sm text-gray-600">Verified</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">
                        {documents.filter(doc => doc.status === 'pending').length}
                      </p>
                      <p className="text-sm text-gray-600">Pending Review</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Document Tracking Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-purple-500" />
                  Document Tracking
                </CardTitle>
                <CardDescription>Track your required documents for profile completion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Resume", required: true, type: "resume", description: "Professional resume or CV" },
                    { name: "License", required: true, type: "license", description: "Professional/Nursing license" },
                    { name: "Certification", required: true, type: "certification", description: "CPR, BLS, ACLS, etc." },
                    { name: "Background Check", required: true, type: "background_check", description: "Criminal background check" },
                  ].map((req, index) => {
                    const uploadedDoc = documents.find(doc => doc.document_type === req.type)
                    const isUploaded = !!uploadedDoc
                    const isVerified = uploadedDoc?.status === 'verified'
                    const isPending = uploadedDoc?.status === 'pending'
                    
                    return (
                      <div key={index} className={`flex items-center justify-between p-4 border rounded-lg ${
                        isVerified 
                          ? 'bg-green-50 border-green-200'
                          : isPending
                          ? 'bg-blue-50 border-blue-200'
                          : req.required
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-4">
                          {isVerified ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : isPending ? (
                            <Clock className="h-6 w-6 text-blue-600" />
                          ) : req.required ? (
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                          ) : (
                            <FileText className="h-6 w-6 text-gray-400" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{req.name}</span>
                              <Badge variant="secondary" className={`text-xs ${
                                req.required 
                                  ? 'bg-red-100 text-red-700 border-red-300' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {req.required ? 'Required' : 'Optional'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{req.description}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {isVerified 
                                ? '✓ Verified and ready' 
                                : isPending 
                                ? '⏳ Uploaded, pending verification' 
                                : req.required
                                ? '⚠️ Required to complete profile'
                                : 'Optional document'}
                            </p>
                          </div>
                        </div>
                        {!isUploaded ? (
                          <Button 
                            size="sm" 
                            className={req.required ? 'bg-red-600 hover:bg-red-700' : ''}
                            variant={req.required ? 'default' : 'outline'}
                            onClick={() => setIsDocumentUploadOpen(true)}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            {isVerified ? (
                              <Badge className="bg-green-600">Verified</Badge>
                            ) : isPending ? (
                              <Badge className="bg-blue-600">Pending</Badge>
                            ) : (
                              <Badge className="bg-yellow-600">Under Review</Badge>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedDocument(uploadedDoc)
                                setIsDocumentViewerOpen(true)
                              }}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* My Documents Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      My Uploaded Documents
                    </CardTitle>
                    <CardDescription>View, download, and manage your uploaded documents</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => loadDocuments()}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  <Button 
                    onClick={() => setIsDocumentUploadOpen(true)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                  >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New
                  </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Documents Uploaded Yet</h3>
                    <p className="text-gray-600 mb-6">Upload your resume and other documents to apply for jobs</p>
                    <Button
                      onClick={() => setIsDocumentUploadOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Your First Document
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate text-lg">
                                {doc.file_name}
                              </h4>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(doc.uploaded_date).toLocaleDateString()}
                </div>
                                <div>
                                  Size: {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'Unknown'}
                                </div>
                                <div className="capitalize">
                                  Type: {doc.document_type}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                            <div className="flex items-center gap-2">
                              {doc.status === 'verified' ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : doc.status === 'pending' ? (
                                <Clock className="h-5 w-5 text-yellow-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                doc.status === 'verified' 
                                  ? 'bg-green-100 text-green-800' 
                                  : doc.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                              </span>
                          </div>
                            
                            <div className="flex gap-2">
                          <Button 
                                variant="outline"
                            size="sm" 
                                onClick={() => {
                                  setSelectedDocument(doc)
                                  setIsDocumentViewerOpen(true)
                                }}
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                            variant="outline"
                                size="sm"
                                onClick={() => handleDocumentDownload(doc.id)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                          </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteDocument(doc.id, doc.file_name)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
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

      {/* Profile Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-t-lg">
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">Profile Preview</DialogTitle>
              <DialogDescription className="text-gray-600">
                This is how your profile appears to employers
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {applicantInfo && (
            <div className="p-6 space-y-8">
              {/* Profile Header */}
              <div className="text-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-2xl"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <span className="text-3xl font-bold text-white">
                      {applicantInfo.firstName?.charAt(0)}{applicantInfo.lastName?.charAt(0)}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {applicantInfo.firstName} {applicantInfo.lastName}
                  </h2>
                  <p className="text-xl text-gray-600 mb-2">{applicantInfo.profession}</p>
                  <p className="text-gray-500 mb-6">
                    {applicantInfo.city && applicantInfo.state && `${applicantInfo.city}, ${applicantInfo.state}`}
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 text-sm font-semibold">
                      {applicantInfo.profileCompletion}% Complete
                    </Badge>
                    <Badge variant="outline" className="px-4 py-2 text-sm">
                      Active Profile
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Contact Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 text-sm">@</span>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                        <p className="text-gray-900 font-medium">{applicantInfo.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 text-sm">📞</span>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                        <p className="text-gray-900 font-medium">{applicantInfo.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Location</Label>
                        <p className="text-gray-900 font-medium">
                          {applicantInfo.address ? `${applicantInfo.address}, ${applicantInfo.city}, ${applicantInfo.state} ${applicantInfo.zipCode}` : 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Professional Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 text-sm">💼</span>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Profession</Label>
                        <p className="text-gray-900 font-medium">{applicantInfo.profession || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 text-sm">⭐</span>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Experience Level</Label>
                        <p className="text-gray-900 font-medium">{applicantInfo.experience || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 text-sm">🎓</span>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Education Level</Label>
                        <p className="text-gray-900 font-medium">{applicantInfo.education || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-yellow-600 text-sm">🏆</span>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Certifications</Label>
                        <p className="text-gray-900 font-medium">{applicantInfo.certifications || 'None listed'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* My Documents Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">My Documents</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        console.log('Manual refresh clicked')
                        loadDocuments()
                      }}
                      variant="outline"
                      className="text-gray-600 hover:text-gray-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button
                      onClick={() => {
                        console.log('Force load documents')
                        setDocuments([])
                        setTimeout(() => loadDocuments(), 100)
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      🔄 Force Load
                    </Button>
                    {documents.length > 0 && (
                      <Button
                        onClick={() => handleDownloadAllDocuments()}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download All
                      </Button>
                    )}
                  </div>
                </div>

                {/* Debug Info - Always Show */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">📊 Document Status:</h4>
                  <p className="text-sm text-blue-700">Documents loaded: <strong>{documents.length}</strong></p>
                  <p className="text-sm text-blue-700">Applicant ID: <strong>{applicantInfo?.id}</strong></p>
                  {documents.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-blue-700">Your documents:</p>
                      <ul className="text-xs text-blue-600 ml-4">
                        {documents.map((doc, index) => (
                          <li key={index}>• {doc.file_name} ({doc.status})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
                    <p className="text-gray-600 mb-4">You haven't uploaded any documents yet.</p>
                    <Button
                      onClick={() => setIsDocumentUploadOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="h-8 w-8 text-blue-500" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {doc.file_name}
                              </h4>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(doc.uploaded_date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>Size: {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : 'Unknown'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="capitalize">{doc.document_type}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <div className="flex items-center gap-1">
                              {doc.status === 'verified' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : doc.status === 'pending' ? (
                                <Clock className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                doc.status === 'verified' 
                                  ? 'bg-green-100 text-green-800' 
                                  : doc.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedDocument(doc)
                                  setIsDocumentViewerOpen(true)
                                }}
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDocumentDownload(doc.id)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                              {doc.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDocumentVerification(doc.id, 'verified', 'Manually verified')}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Verify
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteDocument(doc.id, doc.file_name)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Document Status</h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => loadDocuments()}
                      variant="outline"
                      className="text-gray-600 hover:text-gray-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    {documents.length > 0 && (
                      <Button
                        onClick={() => handleDownloadAllDocuments()}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download All
                      </Button>
                    )}
                    {documents.some(doc => doc.status === 'pending') && (
                      <Button
                        onClick={() => handleVerifyAllDocuments()}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify All
                      </Button>
                    )}
                  </div>
                </div>
                {/* Debug Info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Debug Info:</h4>
                    <p className="text-sm text-yellow-700">Documents loaded: {documents.length}</p>
                    <p className="text-sm text-yellow-700">Applicant ID: {applicantInfo?.id}</p>
                    <pre className="text-xs text-yellow-600 mt-2 overflow-auto">
                      {JSON.stringify(documents, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: "Resume", type: "resume", icon: "📄" },
                    { name: "Professional License", type: "license", icon: "📜" },
                    { name: "Certifications", type: "certification", icon: "🏆" },
                    { name: "Background Check", type: "background_check", icon: "🔍" },
                  ].map((doc) => {
                    const uploadedDoc = documents.find(d => d.document_type === doc.type)
                    const isUploaded = !!uploadedDoc
                    const isVerified = uploadedDoc?.status === 'verified'
                    
                    return (
                      <div key={doc.type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-lg">{doc.icon}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                            {isUploaded && (
                              <p className="text-xs text-gray-500">
                                Uploaded {new Date(uploadedDoc.uploaded_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isUploaded ? (
                            <>
                              {isVerified ? (
                                <Badge className="bg-green-100 text-green-800 text-xs px-3 py-1">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedDocument(uploadedDoc)
                                    setIsDocumentViewerOpen(true)
                                  }}
                                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDocumentDownload(uploadedDoc.id)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                                {uploadedDoc.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDocumentVerification(uploadedDoc.id, 'verified', 'Manually verified')}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verify
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteDocument(uploadedDoc.id, uploadedDoc.file_name)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 text-xs px-3 py-1">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Missing
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Application Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                    <Users className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Application Activity</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-blue-600 mb-1">{applicationStats.totalApplications}</p>
                    <p className="text-sm font-medium text-blue-700">Total Applications</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                    <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-yellow-600 mb-1">{applicationStats.pendingApplications}</p>
                    <p className="text-sm font-medium text-yellow-700">Pending Review</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-green-600 mb-1">{applicationStats.interviewsScheduled}</p>
                    <p className="text-sm font-medium text-green-700">Interviews</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-purple-600 mb-1">{applicationStats.offersReceived}</p>
                    <p className="text-sm font-medium text-purple-700">Job Offers</p>
                  </div>
                </div>
              </div>

              {/* Profile Views */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <Eye className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Profile Visibility</h3>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-4xl font-bold text-indigo-600 mb-2">{applicantInfo.profileViews}</p>
                  <p className="text-lg font-medium text-gray-700 mb-2">Profile Views</p>
                  <p className="text-sm text-gray-500">
                    {applicantInfo.profileViews > 0 
                      ? `Your profile has been viewed by ${applicantInfo.profileViews} employer${applicantInfo.profileViews === 1 ? '' : 's'}`
                      : 'No profile views yet'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload your professional documents and certifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="document-type">Document Type</Label>
              <select
                id="document-type"
                value={uploadDocumentType}
                onChange={(e) => setUploadDocumentType(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="resume">Professional Resume</option>
                <option value="license">Professional License</option>
                <option value="certification">CPR Certification</option>
                <option value="background_check">Background Check</option>
                <option value="reference">References</option>
              </select>
            </div>
            <div>
              <Label htmlFor="file-upload">Select File</Label>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full p-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={uploadDocument} 
                disabled={!uploadFile || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Details Modal */}
      {selectedJob && (
        <Dialog open={isJobDetailsOpen} onOpenChange={setIsJobDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{selectedJob.title}</DialogTitle>
              <DialogDescription className="text-lg">
                {selectedJob.employer?.company_name || 'Healthcare Facility'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Job Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedJob.city}, {selectedJob.state}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">${selectedJob.salary_min?.toLocaleString()}-${selectedJob.salary_max?.toLocaleString()}/{selectedJob.salary_type}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedJob.job_type}</span>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Job Description</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
              </div>

              {/* Requirements */}
              {selectedJob.requirements && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.requirements}</p>
                  </div>
                </div>
              )}

              {/* Benefits */}
              {selectedJob.benefits && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Benefits</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.benefits}</p>
                  </div>
                </div>
              )}

              {/* Job Stats */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{selectedJob.applications_count || 0}</div>
                    <div className="text-sm text-gray-600">Applications</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{selectedJob.views_count || 0}</div>
                    <div className="text-sm text-gray-600">Views</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{selectedJob.saved_count || 0}</div>
                    <div className="text-sm text-gray-600">Saved</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.ceil((Date.now() - new Date(selectedJob.posted_date).getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <div className="text-sm text-gray-600">Days Ago</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4 border-t">
                <Button 
                  onClick={async () => {
                    await applyForJob(selectedJob.id)
                    // Refresh the selected job data
                    const updatedJobs = jobs.find(job => job.id === selectedJob.id)
                    if (updatedJobs) {
                      setSelectedJob(updatedJobs)
                    }
                  }}
                  disabled={applications.some(app => app.job_posting_id === selectedJob.id) || (applicantInfo && calculateProfileCompletion(applicantInfo) < 80)}
                  className="flex-1"
                >
                  {applications.some(app => app.job_posting_id === selectedJob.id) 
                    ? 'Already Applied' 
                    : (applicantInfo && calculateProfileCompletion(applicantInfo) < 80)
                      ? 'Complete Profile First'
                      : 'Apply Now'
                  }
                </Button>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    await toggleSaveJob(selectedJob.id)
                    // Refresh the selected job data
                    const updatedJobs = jobs.find(job => job.id === selectedJob.id)
                    if (updatedJobs) {
                      setSelectedJob(updatedJobs)
                    }
                  }}
                  className="flex-1"
                >
                  <Star className={`h-4 w-4 mr-2 ${savedJobs.includes(selectedJob.id) ? 'fill-current' : ''}`} />
                  {savedJobs.includes(selectedJob.id) ? 'Saved' : 'Save Job'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Document Upload Modal */}
      {applicantInfo && (
        <DocumentUploadModal
          isOpen={isDocumentUploadOpen}
          onClose={() => setIsDocumentUploadOpen(false)}
          applicantId={applicantInfo.id}
          onUploadSuccess={handleDocumentUploadSuccess}
        />
      )}

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Settings</DialogTitle>
            <DialogDescription>
              Manage your account settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Change Password</h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    disabled={isChangingPassword}
                  />
                </div>
                
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    disabled={isChangingPassword}
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={isChangingPassword}
                  />
                </div>
              </div>
              
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isChangingPassword ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsSettingsOpen(false)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Application Confirmation Dialog */}
      <Dialog open={isApplyConfirmOpen} onOpenChange={setIsApplyConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Confirm Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to apply for this position?
            </DialogDescription>
          </DialogHeader>
          {jobToApply && (
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{jobToApply.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{jobToApply.employer?.company_name || 'Healthcare Facility'}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{jobToApply.city}, {jobToApply.state}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">${jobToApply.salary_min?.toLocaleString()} - ${jobToApply.salary_max?.toLocaleString()}/{jobToApply.salary_type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{jobToApply.job_type}</span>
                  </div>
                </div>
              </div>
              
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm text-gray-700">
                  By clicking "Confirm Application", your profile and documents will be submitted to the employer.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsApplyConfirmOpen(false)
                setJobToApply(null)
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmApply}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      {isDocumentViewerOpen && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Document Details</h3>
              <button
                onClick={() => setIsDocumentViewerOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedDocument.file_name}</h4>
                    <p className="text-sm text-gray-600">
                      {selectedDocument.document_type.charAt(0).toUpperCase() + selectedDocument.document_type.slice(1)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">File Size:</span>
                    <span className="ml-2 text-gray-600">
                      {selectedDocument.file_size ? `${(selectedDocument.file_size / 1024).toFixed(1)} KB` : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Upload Date:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(selectedDocument.uploaded_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      selectedDocument.status === 'verified' 
                        ? 'bg-green-100 text-green-800' 
                        : selectedDocument.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedDocument.status.charAt(0).toUpperCase() + selectedDocument.status.slice(1)}
                    </span>
                  </div>
                  {selectedDocument.verified_date && (
                    <div>
                      <span className="font-medium text-gray-700">Verified Date:</span>
                      <span className="ml-2 text-gray-600">
                        {new Date(selectedDocument.verified_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                
                {selectedDocument.notes && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-700">Notes:</span>
                    <p className="text-sm text-gray-600 mt-1">{selectedDocument.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleDocumentDownload(selectedDocument.id)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${selectedDocument.file_name}"?`)) {
                      handleDeleteDocument(selectedDocument.id, selectedDocument.file_name)
                      setIsDocumentViewerOpen(false)
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  onClick={() => setIsDocumentViewerOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {isApplicationDetailsOpen && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedApplication.job_posting?.title || 'Unknown Position'}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsApplicationDetailsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Job Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Job Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Position</label>
                    <p className="text-gray-900">{selectedApplication.job_posting?.title || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Company</label>
                    <p className="text-gray-900">{selectedApplication.job_posting?.company_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <p className="text-gray-900">{selectedApplication.job_posting?.location || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Salary Range</label>
                    <p className="text-gray-900">
                      ${selectedApplication.job_posting?.salary_min?.toLocaleString()} - ${selectedApplication.job_posting?.salary_max?.toLocaleString()} / {selectedApplication.job_posting?.salary_type || 'year'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Job Type</label>
                    <p className="text-gray-900 capitalize">{selectedApplication.job_posting?.job_type || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Application Status */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Application Status
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <Badge className={
                      selectedApplication.status === 'interview_scheduled' ? 'bg-blue-100 text-blue-800' :
                      selectedApplication.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedApplication.status === 'offer_received' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {selectedApplication.status === 'interview_scheduled' ? 'Interview Scheduled' :
                       selectedApplication.status === 'pending' ? 'Under Review' :
                       selectedApplication.status === 'offer_received' ? 'Offer Received' :
                       selectedApplication.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Applied Date</label>
                    <p className="text-gray-900">{new Date(selectedApplication.applied_date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                </div>
              </div>

              {/* Interview Details */}
              {selectedApplication.status === 'interview_scheduled' && (selectedApplication.interview_date || selectedApplication.interview_time) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Interview Details
                  </h3>
                  <div className="bg-purple-50 rounded-lg p-4 space-y-3 border border-purple-200">
                    {selectedApplication.interview_date && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Interview Date</label>
                        <p className="text-gray-900">{new Date(selectedApplication.interview_date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</p>
                      </div>
                    )}
                    {selectedApplication.interview_time && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Time</label>
                        <p className="text-gray-900">{selectedApplication.interview_time}</p>
                      </div>
                    )}
                    {selectedApplication.interview_location && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Location</label>
                        <p className="text-gray-900">{selectedApplication.interview_location}</p>
                      </div>
                    )}
                    {selectedApplication.interviewer && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Interviewer</label>
                        <p className="text-gray-900">{selectedApplication.interviewer}</p>
                      </div>
                    )}
                    {selectedApplication.interview_notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Notes</label>
                        <p className="text-gray-900">{selectedApplication.interview_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Offer Details */}
              {selectedApplication.status === 'offer_received' && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Offer Details
                  </h3>
                  <div className="bg-green-50 rounded-lg p-4 space-y-3 border border-green-200">
                    {selectedApplication.offer_deadline && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Offer Deadline</label>
                        <p className="text-gray-900">{new Date(selectedApplication.offer_deadline).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</p>
                      </div>
                    )}
                    {(selectedApplication.offer_salary_min || selectedApplication.offer_salary_max) && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Offered Salary</label>
                        <p className="text-gray-900">
                          ${selectedApplication.offer_salary_min?.toLocaleString()} - ${selectedApplication.offer_salary_max?.toLocaleString()} / {selectedApplication.offer_salary_type || 'year'}
                        </p>
                      </div>
                    )}
                    {selectedApplication.offer_details && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Details</label>
                        <p className="text-gray-900">{selectedApplication.offer_details}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {selectedApplication.cover_letter && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Cover Letter
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                  </div>
                </div>
              )}

              {/* Resume */}
              {selectedApplication.resume_url && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Resume
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <a 
                      href={selectedApplication.resume_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      View Resume
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsApplicationDetailsOpen(false)}
              >
                Close
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setIsApplicationDetailsOpen(false)
                  setActiveTab('applications')
                }}
              >
                View All Applications
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
