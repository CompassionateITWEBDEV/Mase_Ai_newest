"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  Clock,
  DollarSign,
  Star,
  Award,
  BookOpen,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Heart,
  Package,
  AlertTriangle,
  TrendingUp,
  Phone,
  User,
  MapPin,
  UserPlus,
  CheckCircle,
  Eye,
  ClipboardCheck,
  Search,
  Shield,
  Loader2,
  Target,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { StaffSupplyAnalyzer } from "@/components/staff-supply-analyzer"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { TrainingDashboardCard } from "@/components/training/TrainingDashboardCard"

interface PendingOnboardingPatient {
  id: string
  name: string
  phone: string
  address: string
  firstVisitScheduled: string
  assignedNurse: string
  services: string[]
  priority: "high" | "medium" | "low"
  status: "pending_onboarding" | "scheduled" | "in_progress"
  acceptedDate: string
  eligibilityStatus: "verified" | "checking" | "requires_auth" | "denied" | "pending_auth"
  authorizationStatus: "not_required" | "pending" | "approved" | "denied" | "submitted"
  insuranceProvider: string
  estimatedAuthDays: number
  socRequired: boolean
  authRequiredBefore: boolean
}

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Load staff from database to make header info accurate
  const [staffList, setStaffList] = useState<any[]>([])
  const [isLoadingStaff, setIsLoadingStaff] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const staffIdFromQuery = searchParams?.get("staff_id") || undefined

  // Load upcoming shifts for selected staff from staff_shifts table
  const [upcomingShifts, setUpcomingShifts] = useState<Array<{ id: string; date: string; time: string; location: string; unit: string; day_of_week: number; start_time: string; end_time: string; shift_type: string; notes?: string }>>([])
  const [isLoadingShifts, setIsLoadingShifts] = useState<boolean>(false)
  const { toast } = useToast()
  const [pendingCancelShiftIds, setPendingCancelShiftIds] = useState<string[]>([])
  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false)
  const [cancelReason, setCancelReason] = useState<string>("")
  const [cancelTarget, setCancelTarget] = useState<any | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false)
  const [detailsShift, setDetailsShift] = useState<any | null>(null)
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false)
  const [editingShift, setEditingShift] = useState<any | null>(null)
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
  const [newShift, setNewShift] = useState({ day_of_week: 0, start_time: "08:00", end_time: "17:00", shift_type: "office", facility: "", unit: "", notes: "" })

  // Fetch real training data from in-service API
  const [realTrainingModules, setRealTrainingModules] = useState<Array<{
    id: string
    name: string
    progress: number
    completed: boolean
    dueDate: string
    trainingId?: string
    status?: string
    category?: string
    ceuHours?: number
  }>>([])
  const [isLoadingTrainings, setIsLoadingTrainings] = useState(false)

  // Load certifications/licenses from applicant documents by staff email
  const [certsFromDocs, setCertsFromDocs] = useState<Array<{ name: string; status: string; expires: string }>>([])
  const [isLoadingCerts, setIsLoadingCerts] = useState<boolean>(false)

  // GPS tracking miles from actual trips
  const [gpsMiles, setGpsMiles] = useState<{ today: number; week: number }>({ today: 0, week: 0 })
  const [isLoadingMiles, setIsLoadingMiles] = useState<boolean>(false)

  // Enhanced pending onboarding patients with automatic eligibility checking and auth management
  const [pendingOnboardingPatients, setPendingOnboardingPatients] = useState<PendingOnboardingPatient[]>([
    {
      id: "PAT-001",
      name: "Margaret Anderson",
      phone: "(248) 555-0123",
      address: "123 Oak Street, Detroit, MI 48201",
      firstVisitScheduled: "2024-07-06 10:00 AM",
      assignedNurse: "Sarah Johnson",
      services: ["SN", "PT"],
      priority: "high",
      status: "pending_onboarding",
      acceptedDate: "2024-07-05",
      eligibilityStatus: "verified",
      authorizationStatus: "approved",
      insuranceProvider: "Medicare Part A",
      estimatedAuthDays: 0,
      socRequired: true,
      authRequiredBefore: false,
    },
    {
      id: "PAT-002",
      name: "Robert Miller",
      phone: "(248) 555-0124",
      address: "456 Pine Avenue, Southfield, MI 48075",
      firstVisitScheduled: "2024-07-06 2:00 PM",
      assignedNurse: "Sarah Johnson",
      services: ["SN", "CHHA", "PT"],
      priority: "high",
      status: "pending_onboarding",
      acceptedDate: "2024-07-04",
      eligibilityStatus: "verified",
      authorizationStatus: "pending",
      insuranceProvider: "Aetna Better Health (Medicaid)",
      estimatedAuthDays: 3,
      socRequired: true,
      authRequiredBefore: true,
    },
    {
      id: "PAT-003",
      name: "Dorothy Williams",
      phone: "(248) 555-0125",
      address: "789 Elm Street, Troy, MI 48084",
      firstVisitScheduled: "2024-07-07 11:00 AM",
      assignedNurse: "Sarah Johnson",
      services: ["SN", "OT"],
      priority: "medium",
      status: "pending_onboarding",
      acceptedDate: "2024-07-05",
      eligibilityStatus: "checking",
      authorizationStatus: "not_required",
      insuranceProvider: "Blue Cross Blue Shield",
      estimatedAuthDays: 0,
      socRequired: true,
      authRequiredBefore: false,
    },
  ])

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('currentUser')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          // Verify it's a staff user
          if (user && user.accountType === 'staff') {
            setCurrentUser(user)
            setIsAuthenticated(true)
          } else {
            setIsAuthenticated(false)
          }
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        setIsAuthenticated(false)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    const loadStaff = async () => {
      try {
        setIsLoadingStaff(true)
        const res = await fetch('/api/staff/list')
        const data = await res.json()
        if (data.success && Array.isArray(data.staff)) {
          setStaffList(data.staff)
          
          // Match staff to logged-in user
          if (currentUser) {
            // Try to find staff by email match first
            let matchedStaff = data.staff.find((s: any) => 
              s.email?.toLowerCase() === currentUser.email?.toLowerCase()
            )
            
            // If no email match, try by ID or name
            if (!matchedStaff) {
              matchedStaff = data.staff.find((s: any) => 
                s.id === currentUser.id || 
                s.id === staffIdFromQuery ||
                s.name?.toLowerCase().includes(currentUser.name?.toLowerCase())
              )
            }
            
            // Set the matched staff or first one as fallback
            setSelectedStaff(matchedStaff || data.staff[0])
          } else if (staffIdFromQuery) {
            // If no current user but we have staff_id in URL
            const staffFromQuery = data.staff.find((s: any) => s.id === staffIdFromQuery)
            setSelectedStaff(staffFromQuery || data.staff[0])
          } else {
            // Default to first staff
            setSelectedStaff(data.staff[0])
          }
        }
      } catch (e) {
        console.error('Failed to load staff for dashboard', e)
      } finally {
        setIsLoadingStaff(false)
      }
    }
    
    // Only load staff after authentication is checked
    if (!isCheckingAuth) {
      loadStaff()
    }
  }, [currentUser, staffIdFromQuery, isCheckingAuth])

  // Helper functions (must be declared before conditional returns)
  const formatFacilityUnit = (locationValue?: string) => {
    const raw = String(locationValue || '')
    const beforeComma = raw.split(',')[0] || ''
    const [facility, unit] = beforeComma.split(' | ')
    return { facility: facility || '', unit: unit || '' }
  }

  const getNextDateForDow = (dow: number) => {
    // dow: 0=Mon .. 6=Sun in our API schema
    const now = new Date()
    const todayDow = (now.getDay() + 6) % 7 // convert Sun=0 to Mon=0
    const delta = (dow - todayDow + 7) % 7
    const dt = new Date(now)
    dt.setDate(now.getDate() + delta)
    return dt
  }

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('currentUser')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          // Verify it's a staff user
          if (user && user.accountType === 'staff') {
            setCurrentUser(user)
            setIsAuthenticated(true)
          } else {
            setIsAuthenticated(false)
          }
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        setIsAuthenticated(false)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    const loadStaff = async () => {
      try {
        setIsLoadingStaff(true)
        const res = await fetch('/api/staff/list')
        const data = await res.json()
        if (data.success && Array.isArray(data.staff)) {
          setStaffList(data.staff)
        }
      } catch (e) {
        console.error('Failed to load staff for dashboard', e)
      } finally {
        setIsLoadingStaff(false)
      }
    }
    loadStaff()
  }, [])

  useEffect(() => {
    const loadShifts = async () => {
      try {
        setIsLoadingShifts(true)
        setUpcomingShifts([])
        if (!selectedStaff?.id) return
        const r = await fetch(`/api/staff/shifts?staff_id=${encodeURIComponent(selectedStaff.id)}`, { cache: 'no-store' })
        const d = await r.json()
        if (d.success && Array.isArray(d.shifts)) {
          const mapped = d.shifts
            .filter((sh: any) => sh.day_of_week >= 0 && sh.day_of_week <= 6)
            .map((sh: any) => {
              const nextDate = getNextDateForDow(sh.day_of_week)
              const { facility, unit } = formatFacilityUnit(sh.location)
              return {
                id: sh.id,
                date: nextDate.toISOString().split('T')[0],
                time: `${sh.start_time} - ${sh.end_time}`,
                location: facility,
                unit: unit,
                day_of_week: sh.day_of_week,
                start_time: sh.start_time,
                end_time: sh.end_time,
                shift_type: sh.shift_type || 'office',
                notes: sh.notes || '',
              }
            })
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          setUpcomingShifts(mapped)
        }
        // load pending cancel requests for this staff
        try {
          const cr = await fetch(`/api/staff/cancel-requests?staff_id=${encodeURIComponent(selectedStaff.id)}&status=pending`, { cache: 'no-store' })
          if (cr.ok) {
            const cd = await cr.json()
            const ids = (cd.requests || []).map((x: any) => x.shift_id)
            setPendingCancelShiftIds(ids)
          } else {
            setPendingCancelShiftIds([])
          }
        } catch {
          setPendingCancelShiftIds([])
        }
      } finally {
        setIsLoadingShifts(false)
      }
    }
    loadShifts()
  }, [selectedStaff?.id])

  useEffect(() => {
    const loadTrainings = async () => {
      if (!selectedStaff?.id) {
        console.log("Staff Dashboard: ℹ️ No staff selected, skipping training load")
        setRealTrainingModules([])
        return
      }

      console.log("Staff Dashboard: 🔄 Loading trainings for staff ID:", selectedStaff.id)
      console.log("Staff Dashboard: 👤 Staff details:", {
        id: selectedStaff.id,
        name: selectedStaff.name,
        email: selectedStaff.email
      })
      
      try {
        setIsLoadingTrainings(true)
        // Fetch employee progress for this staff member
        const url = `/api/in-service/employee-progress?employeeId=${encodeURIComponent(selectedStaff.id)}`
        console.log("Staff Dashboard: 🌐 Fetching from:", url)
        
        const response = await fetch(url, {
          cache: "no-store",
        })
        
        console.log("Staff Dashboard: Response status:", response.status)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error("Staff Dashboard: Failed to fetch training data:", response.status, errorText)
          setRealTrainingModules([])
          return
        }

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error("Staff Dashboard: Invalid response format:", text.substring(0, 200))
          setRealTrainingModules([])
          return
        }

        const data = await response.json()
        console.log("Staff Dashboard: ✅ Training data received:", {
          success: data.success,
          employeeCount: data.employees?.length,
          hasEmployees: !!data.employees,
          employees: data.employees,
        })
        
        if (data.success && data.employees && data.employees.length > 0) {
          const employee = data.employees[0] // Should only be one employee
          
          console.log("Staff Dashboard: 📊 Employee training data:", {
            employeeId: employee.id,
            employeeName: employee.name,
            assignedCount: employee.assignedTrainings?.length || 0,
            inProgressCount: employee.inProgressTrainings?.length || 0,
            completedCount: employee.completedTrainings?.length || 0,
            upcomingCount: employee.upcomingDeadlines?.length || 0,
          })
          
          console.log("Staff Dashboard: 📝 Assigned trainings:", employee.assignedTrainings)
          console.log("Staff Dashboard: 🔄 In-progress trainings:", employee.inProgressTrainings)
          console.log("Staff Dashboard: ✅ Completed trainings:", employee.completedTrainings)
          console.log("Staff Dashboard: ⏰ Upcoming deadlines:", employee.upcomingDeadlines)
          
          // Combine all trainings: assigned, in-progress, and completed
          const allTrainings: Array<{
            id: string
            name: string
            progress: number
            completed: boolean
            dueDate: string
            completionDate?: string
            trainingId?: string
            status?: string
            category?: string
            ceuHours?: number
            score?: number
            certificateId?: string
          }> = []

          // Helper function to format due date with days until due
          const formatDueDate = (dueDateString: string | null | undefined): string => {
            if (!dueDateString) return "No deadline"
            
            try {
              const dueDate = new Date(dueDateString)
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              dueDate.setHours(0, 0, 0, 0)
              
              const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              const formattedDate = dueDate.toLocaleDateString()
              
              if (daysUntilDue < 0) {
                return `${formattedDate} (Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? "s" : ""})`
              } else if (daysUntilDue === 0) {
                return `${formattedDate} (Due today)`
              } else if (daysUntilDue === 1) {
                return `${formattedDate} (Due tomorrow)`
              } else if (daysUntilDue <= 7) {
                return `${formattedDate} (${daysUntilDue} days)`
              } else {
                return formattedDate
              }
            } catch (error) {
              return "Invalid date"
            }
          }

          // Add assigned trainings (not started)
          if (employee.assignedTrainings && Array.isArray(employee.assignedTrainings)) {
            console.log("Staff Dashboard: Processing assigned trainings:", employee.assignedTrainings.length)
            employee.assignedTrainings.forEach((training: any) => {
              console.log("Assigned training:", {
                title: training.title,
                dueDate: training.dueDate,
                trainingId: training.trainingId,
                enrollmentId: training.enrollmentId,
              })
              allTrainings.push({
                id: training.enrollmentId || training.id || `assigned-${training.trainingId}`,
                name: training.title || training.training || "Unknown Training",
                progress: 0,
                completed: false,
                dueDate: formatDueDate(training.dueDate),
                trainingId: training.trainingId || training.id,
                status: "assigned",
                category: training.category,
                ceuHours: training.ceuHours,
              })
            })
          }

          // Add in-progress trainings
          if (employee.inProgressTrainings && Array.isArray(employee.inProgressTrainings)) {
            console.log("Staff Dashboard: Processing in-progress trainings:", employee.inProgressTrainings.length)
            employee.inProgressTrainings.forEach((training: any) => {
              console.log("In-progress training:", {
                title: training.title,
                progress: training.progress,
                trainingId: training.trainingId,
              })
              allTrainings.push({
                id: training.enrollmentId || training.id || `inprogress-${training.trainingId}`,
                name: training.title || training.training || "Unknown Training",
                progress: training.progress || 0,
                completed: false,
                dueDate: formatDueDate(training.dueDate),
                trainingId: training.trainingId || training.id,
                status: "in_progress",
                category: training.category,
                ceuHours: training.ceuHours,
              })
            })
          }

          // Add completed trainings
          if (employee.completedTrainings && Array.isArray(employee.completedTrainings)) {
            console.log("Staff Dashboard: Processing completed trainings:", employee.completedTrainings.length)
            employee.completedTrainings.forEach((training: any) => {
              console.log("Completed training:", {
                title: training.title,
                completionDate: training.completionDate,
                score: training.score,
                trainingId: training.trainingId
              })
              allTrainings.push({
                id: training.enrollmentId || training.id || `completed-${training.trainingId}`,
                name: training.title || training.training || "Unknown Training",
                progress: 100,
                completed: true,
                dueDate: training.completionDate ? `Completed ${new Date(training.completionDate).toLocaleDateString()}` : "Completed",
                completionDate: training.completionDate || training.completed_at,
                trainingId: training.trainingId || training.id,
                status: "completed",
                category: training.category,
                ceuHours: training.ceuHours,
                score: training.score,
                // Backend returns 'certificate' not 'certificateId'
                certificateId: training.certificate || training.certificateId || training.certificate_id,
              })
            })
          }

          // Add upcoming deadlines (within 1 week)
          if (employee.upcomingDeadlines && Array.isArray(employee.upcomingDeadlines)) {
            employee.upcomingDeadlines.forEach((deadline: any) => {
              // Check if this training is already in the list
              const existing = allTrainings.find(t => t.trainingId === deadline.trainingId)
              if (!existing) {
                allTrainings.push({
                  id: deadline.assignmentId || deadline.enrollmentId || `deadline-${deadline.trainingId}`,
                  name: deadline.training || deadline.title || "Unknown Training",
                  progress: 0,
                  completed: false,
                  dueDate: formatDueDate(deadline.dueDate),
                  trainingId: deadline.trainingId,
                  status: "upcoming",
                  category: deadline.category,
                  ceuHours: deadline.ceuHours,
                })
              }
            })
          }

          console.log("Staff Dashboard: 🎯 Total trainings to display:", allTrainings.length)
          console.log("Staff Dashboard: 📋 All trainings array:", allTrainings)
          
          if (allTrainings.length === 0) {
            console.warn("Staff Dashboard: ⚠️ No trainings found for this employee!")
            console.warn("Staff Dashboard: This could mean:")
            console.warn("  1. No trainings assigned to this employee")
            console.warn("  2. Employee ID mismatch between staff and training tables")
            console.warn("  3. Training data not yet created in database")
          }
          
          setRealTrainingModules(allTrainings)
        } else {
          console.error("Staff Dashboard: ❌ No employee data found or empty response")
          console.error("Staff Dashboard: Response data:", data)
          setRealTrainingModules([])
        }
      } catch (error: any) {
        console.error("Staff Dashboard: ❌ ERROR loading trainings:", error)
        console.error("Staff Dashboard: Error details:", {
          message: error.message,
          stack: error.stack,
        })
        setRealTrainingModules([])
      } finally {
        setIsLoadingTrainings(false)
      }
    }

    // Load trainings when staff is selected AND training tab is active
    console.log("Staff Dashboard: 🔍 useEffect triggered - activeTab:", activeTab, "selectedStaff.id:", selectedStaff?.id)
    
    // Only load trainings if a staff member is selected
    if (selectedStaff?.id) {
      loadTrainings()
    } else {
      // Clear trainings if no staff selected
      setRealTrainingModules([])
    }
  }, [selectedStaff?.id, activeTab])

  useEffect(() => {
    const loadCerts = async () => {
      try {
        setIsLoadingCerts(true)
        setCertsFromDocs([])
        const email = selectedStaff?.email
        if (!email) return
        const res = await fetch(`/api/applicants/documents/by-email?email=${encodeURIComponent(email)}`)
        const data = await res.json()
        if (data.success && Array.isArray(data.documents)) {
          const mapped = data.documents
            .filter((d: any) => d.document_type === 'license' || d.document_type === 'certification')
            .map((d: any) => {
              const baseName = (d.file_name || d.document_type || '').replace(/\.[^/.]+$/, '')
              const name = d.document_type === 'license' ? (baseName || 'License') : (baseName || 'Certification')
              const status = d.status === 'verified' ? 'Active' : (d.status === 'pending' ? 'Pending' : 'Needs Review')
              const expires = d.expiration_date ? new Date(d.expiration_date).toISOString().split('T')[0] : '—'
              return { name, status, expires }
            })
          setCertsFromDocs(mapped)
        }
      } catch (e) {
        console.error('Failed to load certificates/licenses from documents', e)
      } finally {
        setIsLoadingCerts(false)
      }
    }
    loadCerts()
  }, [selectedStaff?.email])

  // Load GPS miles from actual tracking
  useEffect(() => {
    const loadGpsMiles = async () => {
      if (!selectedStaff?.id) {
        setGpsMiles({ today: 0, week: 0 })
        return
      }

      try {
        setIsLoadingMiles(true)
        const res = await fetch(`/api/staff-performance/stats?staff_id=${encodeURIComponent(selectedStaff.id)}&period=day`, {
          cache: 'no-store'
        })
        const data = await res.json()
        
        if (data.success) {
          setGpsMiles({
            today: data.todayStats?.totalMiles || 0,
            week: data.weekStats?.totalMiles || 0
          })
        }
      } catch (e) {
        console.error('Failed to load GPS miles:', e)
        setGpsMiles({ today: 0, week: 0 })
      } finally {
        setIsLoadingMiles(false)
      }
    }
    
    loadGpsMiles()
  }, [selectedStaff?.id])

  // Simulate real-time eligibility checking
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingOnboardingPatients((prev) =>
        prev.map((patient) => {
          if (patient.eligibilityStatus === "checking") {
            return {
              ...patient,
              eligibilityStatus: "verified" as const,
              authorizationStatus: patient.insuranceProvider.includes("Medicare")
                ? ("not_required" as const)
                : ("pending" as const),
            }
          }
          return patient
        }),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Load shifts - moved before conditional returns to maintain hooks order
  useEffect(() => {
    const loadShifts = async () => {
      try {
        setIsLoadingShifts(true)
        setUpcomingShifts([])
        if (!selectedStaff?.id) return
        const r = await fetch(`/api/staff/shifts?staff_id=${encodeURIComponent(selectedStaff.id)}`, { cache: 'no-store' })
        const d = await r.json()
        if (d.success && Array.isArray(d.shifts)) {
          const mapped = d.shifts
            .filter((sh: any) => sh.day_of_week >= 0 && sh.day_of_week <= 6)
            .map((sh: any) => {
              const nextDate = getNextDateForDow(sh.day_of_week)
              const { facility, unit } = formatFacilityUnit(sh.location)
              return {
                id: sh.id,
                date: nextDate.toISOString().split('T')[0],
                time: `${sh.start_time} - ${sh.end_time}`,
                location: facility,
                unit: unit,
                day_of_week: sh.day_of_week,
                start_time: sh.start_time,
                end_time: sh.end_time,
                shift_type: sh.shift_type || 'office',
                notes: sh.notes || '',
              }
            })
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          setUpcomingShifts(mapped)
        }
        // load pending cancel requests for this staff
        try {
          const cr = await fetch(`/api/staff/cancel-requests?staff_id=${encodeURIComponent(selectedStaff.id)}&status=pending`, { cache: 'no-store' })
          if (cr.ok) {
            const cd = await cr.json()
            const ids = (cd.requests || []).map((x: any) => x.shift_id)
            setPendingCancelShiftIds(ids)
          } else {
            setPendingCancelShiftIds([])
          }
        } catch {
          setPendingCancelShiftIds([])
        }
      } finally {
        setIsLoadingShifts(false)
      }
    }
    loadShifts()
  }, [selectedStaff?.id])

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show access denied if not authenticated
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You must be logged in to access the Staff Dashboard. Please log in to continue.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push('/login')} className="w-full">
                Go to Login
              </Button>
              <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const openEditShift = (sh: any) => {
    const idx = typeof sh.day_of_week === 'number' ? sh.day_of_week : 0
    setEditingShift(sh)
    setNewShift({
      day_of_week: idx,
      start_time: sh.start_time,
      end_time: sh.end_time,
      shift_type: sh.shift_type || 'office',
      facility: sh.location || '',
      unit: sh.unit || '',
      notes: sh.notes || ''
    })
    setIsEditOpen(true)
  }

  const composeLocation = (facility: string, unit: string) => [facility, unit].filter(Boolean).join(' | ')

  const updateShift = async () => {
    if (!editingShift) return
    const payload = {
      id: editingShift.id,
      day_of_week: newShift.day_of_week,
      start_time: newShift.start_time,
      end_time: newShift.end_time,
      shift_type: newShift.shift_type,
      location: composeLocation(newShift.facility, newShift.unit),
      notes: newShift.notes,
    }
    const res = await fetch('/api/staff/shifts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err.error || 'Failed to update shift')
      return
    }
    await refreshShifts()
    setIsEditOpen(false)
    setEditingShift(null)
  }

  const openCancelDialog = (shift: any) => {
    setCancelTarget(shift)
    setCancelReason("")
    setIsCancelOpen(true)
  }

  const submitCancelRequest = async () => {
    const shift = cancelTarget
    if (!selectedStaff?.id || !shift) return
    try {
      const res = await fetch('/api/staff/cancel-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shift_id: shift.id, staff_id: selectedStaff.id, reason: cancelReason || '' }) })
      const d = await res.json()
      if (!d.success) {
        console.error('Cancel request failed:', d)
        toast({ title: 'Request failed', description: d.error || 'Failed to request cancellation' })
        return
      }
      // mark this shift as requested so the button disables immediately
      setPendingCancelShiftIds((prev) => Array.from(new Set([...(prev || []), shift.id])))
      setIsCancelOpen(false)
      setCancelTarget(null)
      toast({ title: 'Cancellation requested', description: 'Pending approval by admin.' })
    } catch (e: any) {
      console.error('Cancel request error:', e)
      toast({ title: 'Network error', description: e?.message || 'Please try again.' })
    }
  }

  const openDetails = (shift: any) => {
    setDetailsShift(shift)
    setIsDetailsOpen(true)
  }

  const refreshShifts = async () => {
    if (!selectedStaff?.id) return
    setIsLoadingShifts(true)
    try {
      const r = await fetch(`/api/staff/shifts?staff_id=${encodeURIComponent(selectedStaff.id)}`, { cache: 'no-store' })
      const d = await r.json()
      if (d.success && Array.isArray(d.shifts)) {
        const mapped = d.shifts.map((sh: any) => {
          const nextDate = getNextDateForDow(sh.day_of_week)
          const { facility, unit } = formatFacilityUnit(sh.location)
          return {
            id: sh.id,
            date: nextDate.toISOString().split('T')[0],
            time: `${sh.start_time} - ${sh.end_time}`,
            location: facility,
            unit,
            day_of_week: sh.day_of_week,
            start_time: sh.start_time,
            end_time: sh.end_time,
            shift_type: sh.shift_type || 'office',
            notes: sh.notes || '',
          }
        }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setUpcomingShifts(mapped)
      }
    } finally {
      setIsLoadingShifts(false)
    }
  }

  // Generate display ID like RN-2025-123 (not using DB id)
  const getDeptCode = (dept?: string) => {
    const d = (dept || '').toLowerCase()
    if (d.includes('nurse') || d.includes('rn')) return 'RN'
    if (d.includes('therapy') || d.includes('pt')) return 'PT'
    if (d.includes('occupational') || d.includes('ot')) return 'OT'
    if (d.includes('speech') || d.includes('st')) return 'ST'
    if (d.includes('admin')) return 'ADM'
    return 'RN'
  }

  const simpleHash = (s: string) => {
    let h = 0
    for (let i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0
    }
    // Map to 3 digits 100-999 for a cleaner look
    return (h % 900) + 100
  }

  const generatedDisplayId = (() => {
    const year = new Date().getFullYear()
    const deptCode = getDeptCode(selectedStaff?.department)
    const basis = selectedStaff ? `${selectedStaff.name || ''}|${selectedStaff.email || ''}` : 'mock'
    const seq = simpleHash(basis)
    return `${deptCode}-${year}-${seq}`
  })()

  const staffData = {
    name: "Sarah Johnson",
    role: "Registered Nurse",
    id: "RN-2024-001",
    avatar: "/professional-woman-diverse.png",
    rating: 4.8,
    totalShifts: 156,
    hoursWorked: 1248,
    earnings: 62400,
    certifications: [
      { name: "RN License", status: "Active", expires: "2025-06-15" },
      { name: "BLS Certification", status: "Active", expires: "2024-12-01" },
      { name: "ACLS Certification", status: "Expiring Soon", expires: "2024-08-15" },
    ],
    upcomingShifts: [], // No mock data - only use real data from API
    recentPayStubs: [
      { period: "June 16-30, 2024", amount: 2850, hours: 72, status: "Paid" },
      { period: "June 1-15, 2024", amount: 2640, hours: 66, status: "Paid" },
      { period: "May 16-31, 2024", amount: 2920, hours: 73, status: "Paid" },
    ],
    trainingModules: [
      { name: "Infection Control Update", progress: 100, completed: true, dueDate: "Completed" },
      { name: "Patient Safety Protocols", progress: 75, completed: false, dueDate: "2024-07-10" },
      { name: "Emergency Response Training", progress: 0, completed: false, dueDate: "2024-07-20" },
    ],
    patientReviews: [
      {
        patient: "Anonymous",
        rating: 5,
        comment: "Sarah was incredibly caring and professional. Made my stay much more comfortable.",
        date: "2024-06-28",
      },
      {
        patient: "Anonymous",
        rating: 5,
        comment: "Excellent nurse! Very knowledgeable and compassionate.",
        date: "2024-06-25",
      },
    ],
    supplyTransactions: [
      {
        id: "ST001",
        type: "checkout",
        patientId: "P001",
        patientName: "Margaret Anderson",
        supplyId: "SUP001",
        supplyName: "Hydrocolloid Dressing 4x4",
        category: "Dressings",
        quantityCheckedOut: 3,
        quantityUsed: 2,
        quantityReturned: 1,
        unitCost: 12.5,
        totalCheckedOutCost: 37.5,
        totalUsedCost: 25.0,
        wastedCost: 12.5,
        checkedOutAt: "2024-07-04T09:00:00Z",
        usedAt: "2024-07-04T10:00:00Z",
        returnedAt: "2024-07-04T11:00:00Z",
        woundLocation: "Right heel",
        notes: "Patient wound healing well, only needed 2 dressings",
      },
      {
        id: "ST002",
        type: "checkout",
        patientId: "P003",
        patientName: "James Patterson",
        supplyId: "SUP005",
        supplyName: "Saline Wound Cleanser 8oz",
        category: "Cleansers",
        quantityCheckedOut: 2,
        quantityUsed: 2,
        quantityReturned: 0,
        unitCost: 6.75,
        totalCheckedOutCost: 13.5,
        totalUsedCost: 13.5,
        wastedCost: 0,
        checkedOutAt: "2024-07-03T14:30:00Z",
        usedAt: "2024-07-03T15:30:00Z",
        returnedAt: null,
        woundLocation: "Surgical incision",
        notes: "Used both bottles for thorough wound cleaning",
      },
      {
        id: "ST003",
        type: "checkout",
        patientId: "P001",
        patientName: "Margaret Anderson",
        supplyId: "SUP006",
        supplyName: "Gauze Pads 4x4 Sterile (10pk)",
        category: "Gauze",
        quantityCheckedOut: 2,
        quantityUsed: 1,
        quantityReturned: 1,
        unitCost: 4.25,
        totalCheckedOutCost: 8.5,
        totalUsedCost: 4.25,
        wastedCost: 4.25,
        checkedOutAt: "2024-07-02T10:00:00Z",
        usedAt: "2024-07-02T11:00:00Z",
        returnedAt: "2024-07-02T12:00:00Z",
        woundLocation: "Right heel",
        notes: "Only needed one pack, returned unused pack",
      },
      {
        id: "ST004",
        type: "checkout",
        patientId: "P004",
        patientName: "Robert Miller",
        supplyId: "SUP002",
        supplyName: "Silver Antimicrobial Foam 6x6",
        category: "Antimicrobial",
        quantityCheckedOut: 1,
        quantityUsed: 1,
        quantityReturned: 0,
        unitCost: 28.75,
        totalCheckedOutCost: 28.75,
        totalUsedCost: 28.75,
        wastedCost: 0,
        checkedOutAt: "2024-07-01T08:30:00Z",
        usedAt: "2024-07-01T09:00:00Z",
        returnedAt: null,
        woundLocation: "Sacral area",
        notes: "Full dressing used for infected pressure ulcer",
      },
      {
        id: "ST005",
        type: "checkout",
        patientId: "P001",
        patientName: "Margaret Anderson",
        supplyId: "SUP001",
        supplyName: "Hydrocolloid Dressing 4x4",
        category: "Dressings",
        quantityCheckedOut: 4,
        quantityUsed: 2,
        quantityReturned: 2,
        unitCost: 12.5,
        totalCheckedOutCost: 50.0,
        totalUsedCost: 25.0,
        wastedCost: 25.0,
        checkedOutAt: "2024-06-30T09:00:00Z",
        usedAt: "2024-06-30T10:00:00Z",
        returnedAt: "2024-06-30T11:30:00Z",
        woundLocation: "Right heel",
        notes: "Wound smaller than expected, returned extra dressings",
      },
      {
        id: "ST006",
        type: "checkout",
        patientId: "P005",
        patientName: "Linda White",
        supplyId: "SUP009",
        supplyName: "Compression Bandage 4in",
        category: "Compression",
        quantityCheckedOut: 2,
        quantityUsed: 1,
        quantityReturned: 0,
        unitCost: 11.8,
        totalCheckedOutCost: 23.6,
        totalUsedCost: 11.8,
        wastedCost: 11.8,
        checkedOutAt: "2024-06-29T13:00:00Z",
        usedAt: "2024-06-29T14:00:00Z",
        returnedAt: null,
        woundLocation: "Lower leg",
        notes: "Second bandage damaged during application, had to discard",
      },
    ],
  }

  // Overlay real staff info when available
  const displayStaff = {
    name: selectedStaff?.name || staffData.name,
    role: selectedStaff?.department || staffData.role,
    id: generatedDisplayId,
    avatar: staffData.avatar,
    rating: staffData.rating,
    totalShifts: staffData.totalShifts,
    hoursWorked: staffData.hoursWorked,
    earnings: staffData.earnings,
    certifications: staffData.certifications,
    upcomingShifts: upcomingShifts, // Only use real data from API, no mock data fallback
    recentPayStubs: staffData.recentPayStubs,
    trainingModules: realTrainingModules, // Only show real data from API, no mock data fallback
    patientReviews: staffData.patientReviews,
    supplyTransactions: staffData.supplyTransactions,
  }
  const certificationsToShow = certsFromDocs

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show access denied if not authenticated
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You must be logged in to access the Staff Dashboard. Please log in to continue.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push('/login')} className="w-full">
                Go to Login
              </Button>
              <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate supply analytics
  const supplyAnalytics = {
    totalCheckedOut: staffData.supplyTransactions.reduce((sum, t) => sum + t.totalCheckedOutCost, 0),
    totalUsed: staffData.supplyTransactions.reduce((sum, t) => sum + t.totalUsedCost, 0),
    totalWasted: staffData.supplyTransactions.reduce((sum, t) => sum + t.wastedCost, 0),
    totalItemsCheckedOut: staffData.supplyTransactions.reduce((sum, t) => sum + t.quantityCheckedOut, 0),
    totalItemsUsed: staffData.supplyTransactions.reduce((sum, t) => sum + t.quantityUsed, 0),
    totalItemsReturned: staffData.supplyTransactions.reduce((sum, t) => sum + (t.quantityReturned || 0), 0),
    wastePercentage: 0,
    returnRate: 0,
  }

  supplyAnalytics.wastePercentage = (supplyAnalytics.totalWasted / supplyAnalytics.totalCheckedOut) * 100
  supplyAnalytics.returnRate = (supplyAnalytics.totalItemsReturned / supplyAnalytics.totalItemsCheckedOut) * 100

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800"
      case "checking":
        return "bg-blue-100 text-blue-800"
      case "requires_auth":
        return "bg-yellow-100 text-yellow-800"
      case "denied":
        return "bg-red-100 text-red-800"
      case "pending_auth":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAuthStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "denied":
        return "bg-red-100 text-red-800"
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "not_required":
        return "bg-gray-100 text-gray-600"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredPatients = pendingOnboardingPatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.insuranceProvider.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Sign out handler
  const handleSignOut = () => {
    // Clear localStorage
    localStorage.removeItem('currentUser')
    
    // Clear any other auth-related data
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    
    // Clear session storage if used
    sessionStorage.clear()
    
    // Redirect to login page
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={displayStaff.avatar || "/placeholder.svg"} alt={displayStaff.name} />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Welcome back, {displayStaff.name}</h1>
                <p className="text-sm text-gray-600">
                  {displayStaff.role} • ID: {displayStaff.id}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {selectedStaff?.id && (
                <Link href={`/track/${selectedStaff.id}`}>
                  <Button variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100 border-blue-200">
                    <MapPin className="h-4 w-4 mr-2" />
                    GPS Tracking
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="onboarding">Patient Onboarding</TabsTrigger>
            <TabsTrigger value="supplies">Supply Management</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Star className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Rating</p>
                      <p className="text-2xl font-bold text-gray-900">{displayStaff.rating}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Hours Worked</p>
                      <p className="text-2xl font-bold text-gray-900">{displayStaff.hoursWorked}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Shifts</p>
                      <p className="text-2xl font-bold text-gray-900">{displayStaff.totalShifts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                      <p className="text-2xl font-bold text-gray-900">${displayStaff.earnings.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Navigation className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">GPS Miles (Today)</p>
                      {isLoadingMiles ? (
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">
                          {gpsMiles.today.toFixed(1)} mi
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {gpsMiles.week.toFixed(1)} mi this week
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Shifts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Upcoming Shifts
                </CardTitle>
                <CardDescription>Your scheduled shifts for the next week</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingShifts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                    <span className="text-gray-600">Loading shifts...</span>
                  </div>
                ) : displayStaff.upcomingShifts.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming shifts</h3>
                    <p className="text-gray-600">You don't have any shifts scheduled for the next week.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayStaff.upcomingShifts.map((shift: any, index: number) => (
                      <div key={shift.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {shift.date ? new Date(shift.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }) : 'Date TBD'}
                            </p>
                            <p className="text-sm text-gray-600">{shift.time || `${shift.start_time || ''} - ${shift.end_time || ''}`}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{shift.location || 'Location TBD'}</p>
                          <p className="text-sm text-gray-600">{shift.unit || shift.shift_type || ''}</p>
                        </div>
                        {shift.id && (
                          <Button variant="outline" size="sm" onClick={() => openDetails(shift)}>
                            View Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming shift details dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Shift Details</DialogTitle>
                  <DialogDescription>Review your upcoming shift information.</DialogDescription>
                </DialogHeader>
                {detailsShift && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Date</span>
                      <span className="font-medium">{detailsShift.date}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Time</span>
                      <span className="font-medium">{detailsShift.time}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Facility</span>
                      <span className="font-medium">{detailsShift.location || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Department</span>
                      <span className="font-medium">{detailsShift.unit || '—'}</span>
                    </div>
                    {detailsShift.notes && (
                      <div className="text-sm">
                        <div className="text-gray-600">Notes</div>
                        <div className="font-medium mt-1">{detailsShift.notes}</div>
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Certifications Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Certifications & Licenses
                </CardTitle>
                <CardDescription>Keep track of your professional certifications</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingCerts ? (
                  <div className="p-4 text-sm text-gray-500">Loading certifications...</div>
                ) : certificationsToShow.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No certifications or licenses on file.</div>
                ) : (
                  <div className="space-y-4">
                    {certificationsToShow.map((cert, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Shield className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{cert.name}</p>
                            <p className="text-sm text-gray-600">Expires: {cert.expires}</p>
                          </div>
                        </div>
                        <Badge
                          className={
                            cert.status === "Active" ? "bg-green-100 text-green-800" : cert.status === 'Pending' ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                          }
                        >
                          {cert.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="onboarding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Pending Patient Onboarding
                </CardTitle>
                <CardDescription>
                  Patients assigned to you requiring onboarding with automatic eligibility verification and
                  authorization tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search patients by name, phone, or insurance..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredPatients.map((patient) => (
                    <div key={patient.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{patient.name}</h3>
                            <p className="text-sm text-gray-600">{patient.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(patient.priority)}>{patient.priority.toUpperCase()}</Badge>
                          <Badge className={getStatusColor(patient.eligibilityStatus)}>
                            {patient.eligibilityStatus === "checking" && (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            )}
                            {patient.eligibilityStatus.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="flex items-center mb-1">
                            <MapPin className="h-4 w-4 text-gray-600 mr-1" />
                            <span className="text-sm font-medium">Address</span>
                          </div>
                          <p className="text-sm">{patient.address}</p>
                        </div>

                        <div className="p-3 bg-gray-50 rounded">
                          <div className="flex items-center mb-1">
                            <Calendar className="h-4 w-4 text-gray-600 mr-1" />
                            <span className="text-sm font-medium">First Visit</span>
                          </div>
                          <p className="text-sm">{patient.firstVisitScheduled}</p>
                        </div>

                        <div className="p-3 bg-gray-50 rounded">
                          <div className="flex items-center mb-1">
                            <Heart className="h-4 w-4 text-gray-600 mr-1" />
                            <span className="text-sm font-medium">Services</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {patient.services.map((service, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-blue-50 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Insurance Provider</span>
                            <Badge className={getStatusColor(patient.eligibilityStatus)}>
                              {patient.eligibilityStatus === "checking" && (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              )}
                              {patient.eligibilityStatus.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm">{patient.insuranceProvider}</p>
                          {patient.eligibilityStatus === "checking" && (
                            <p className="text-xs text-blue-600 mt-1">Verifying eligibility...</p>
                          )}
                        </div>

                        <div className="p-3 bg-yellow-50 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Authorization Status</span>
                            <Badge className={getAuthStatusColor(patient.authorizationStatus)}>
                              {patient.authorizationStatus.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          {patient.authorizationStatus === "pending" && (
                            <p className="text-xs text-yellow-600">
                              Est. {patient.estimatedAuthDays} days for approval
                            </p>
                          )}
                          {patient.authRequiredBefore && (
                            <p className="text-xs text-red-600 mt-1">⚠️ Auth required before first visit</p>
                          )}
                        </div>
                      </div>

                      {/* Alerts and Warnings */}
                      {patient.authRequiredBefore && patient.authorizationStatus !== "approved" && (
                        <Alert className="mb-3 border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700">
                            <strong>Authorization Required:</strong> This patient requires authorization approval before
                            the first visit can be conducted. First visit scheduled for {patient.firstVisitScheduled}.
                          </AlertDescription>
                        </Alert>
                      )}

                      {patient.eligibilityStatus === "denied" && (
                        <Alert className="mb-3 border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700">
                            <strong>Eligibility Denied:</strong> Patient's insurance eligibility has been denied.
                            Contact the insurance provider or patient to resolve.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex space-x-2">
                        <Link href={`/patient-onboarding/${patient.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </Link>

                        {patient.eligibilityStatus === "verified" &&
                          (patient.authorizationStatus === "approved" ||
                            patient.authorizationStatus === "not_required") && (
                            <Button size="sm">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Start Onboarding
                            </Button>
                          )}

                        {patient.authorizationStatus === "pending" && (
                          <Button size="sm" variant="outline" className="text-blue-600 bg-transparent">
                            <ClipboardCheck className="h-3 w-3 mr-1" />
                            Check Auth Status
                          </Button>
                        )}

                        {patient.eligibilityStatus === "denied" && (
                          <Button size="sm" variant="outline" className="text-red-600 bg-transparent">
                            <Phone className="h-3 w-3 mr-1" />
                            Contact Insurance
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {filteredPatients.length === 0 && (
                  <div className="text-center py-8">
                    <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No pending onboarding patients</h3>
                    <p className="text-gray-600">
                      {searchTerm
                        ? "No patients match your search criteria."
                        : "All assigned patients have been onboarded."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supplies" className="space-y-6">
            {/* Supply Analytics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Checked Out</p>
                      <p className="text-2xl font-bold text-gray-900">${supplyAnalytics.totalCheckedOut.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Used</p>
                      <p className="text-2xl font-bold text-gray-900">${supplyAnalytics.totalUsed.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Wasted</p>
                      <p className="text-2xl font-bold text-gray-900">${supplyAnalytics.totalWasted.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Waste Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{supplyAnalytics.wastePercentage.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Supply Analyzer Component */}
            <StaffSupplyAnalyzer 
              staffId={displayStaff.id}
              staffName={displayStaff.name}
              supplyUsage={displayStaff.supplyTransactions.map((t: any) => ({
                id: t.id,
                patientId: t.patientId,
                patientName: t.patientName,
                supplyId: t.supplyId,
                supplyName: t.supplyName,
                category: t.category,
                quantity: t.quantityUsed,
                unitCost: t.unitCost,
                totalCost: t.totalUsedCost,
                usedAt: t.usedAt,
              }))}
            />

            {/* Recent Supply Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Recent Supply Transactions
                </CardTitle>
                <CardDescription>Your recent wound care supply checkouts and usage</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Supply</TableHead>
                      <TableHead>Checked Out</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead>Returned</TableHead>
                      <TableHead>Cost Impact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayStaff.supplyTransactions.slice(0, 10).map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-sm">
                          {new Date(transaction.checkedOutAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{transaction.patientName}</p>
                            <p className="text-xs text-gray-600">{transaction.woundLocation}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{transaction.supplyName}</p>
                            <Badge variant="outline" className="text-xs">
                              {transaction.category}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{transaction.quantityCheckedOut}</TableCell>
                        <TableCell className="text-center">{transaction.quantityUsed}</TableCell>
                        <TableCell className="text-center">{transaction.quantityReturned || 0}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-green-600">${transaction.totalUsedCost.toFixed(2)} used</p>
                            {transaction.wastedCost > 0 && (
                              <p className="text-red-600">${transaction.wastedCost.toFixed(2)} wasted</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Schedule Management
                </CardTitle>
                <CardDescription>View and manage your work schedule</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingShifts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                    <span className="text-gray-600">Loading schedule...</span>
                  </div>
                ) : upcomingShifts.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No shifts scheduled</h3>
                    <p className="text-gray-600">You don't have any upcoming shifts scheduled at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingShifts.map((shift: any, index: number) => (
                      <div key={shift.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {shift.date ? new Date(shift.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }) : 'Date TBD'}
                            </p>
                            <p className="text-sm text-gray-600">{shift.time || `${shift.start_time || ''} - ${shift.end_time || ''}`}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{shift.location || 'Location TBD'}</p>
                          <p className="text-sm text-gray-600">{shift.unit || shift.shift_type || ''}</p>
                        </div>
                        <div className="flex space-x-2">
                          {shift.id ? (
                            <>
                              <Button variant="outline" size="sm" onClick={() => openEditShift(shift)}>Edit</Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={pendingCancelShiftIds.includes(shift.id)}
                                onClick={() => openCancelDialog(shift)}
                              >
                                {pendingCancelShiftIds.includes(shift.id) ? 'Requested' : 'Request Cancel'}
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit shift dialog for staff dashboard */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Shift</DialogTitle>
                  <DialogDescription>Update this shift</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Day</Label>
                    <Select value={String(newShift.day_of_week)} onValueChange={(v) => setNewShift({ ...newShift, day_of_week: Number.parseInt(v) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((d, i) => (
                          <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Facility</Label>
                      <Input value={newShift.facility} onChange={(e) => setNewShift({ ...newShift, facility: e.target.value })} placeholder="e.g., Sunrise Senior Living" />
                    </div>
                    <div>
                      <Label>Unit / Department</Label>
                      <Input value={newShift.unit} onChange={(e) => setNewShift({ ...newShift, unit: e.target.value })} placeholder="e.g., ICU" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Start Time</Label>
                      <Input type="time" value={newShift.start_time} onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })} />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input type="time" value={newShift.end_time} onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={newShift.shift_type} onValueChange={(v) => setNewShift({ ...newShift, shift_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="field">Field</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea rows={2} value={newShift.notes} onChange={(e) => setNewShift({ ...newShift, notes: e.target.value })} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                    <Button onClick={updateShift}>Save Changes</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  All Assigned Trainings
                </CardTitle>
                <CardDescription>
                  View all your training assignments - not started, in progress, and completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTrainings ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                    <span className="text-gray-600">Loading trainings...</span>
                  </div>
                ) : displayStaff.trainingModules.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No trainings assigned</h3>
                    <p className="text-gray-600">You don't have any training modules assigned at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Stats - Enhanced */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="text-center p-5 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3">
                          <Target className="h-6 w-6 text-yellow-600" />
                        </div>
                        <p className="text-3xl font-bold text-yellow-600 mb-1">
                          {displayStaff.trainingModules.filter((m: any) => m.status === "assigned" || !m.status).length}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">Not Started</p>
                      </div>
                      
                      <div className="text-center p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                          <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-blue-600 mb-1">
                          {displayStaff.trainingModules.filter((m: any) => m.status === "in_progress").length}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">In Progress</p>
                      </div>
                      
                      <div className="text-center p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-green-600 mb-1">
                          {displayStaff.trainingModules.filter((m: any) => m.status === "completed" || m.completed).length}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">Completed</p>
                      </div>
                      
                      <div className="text-center p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                          <BookOpen className="h-6 w-6 text-purple-600" />
                        </div>
                        <p className="text-3xl font-bold text-purple-600 mb-1">
                          {displayStaff.trainingModules.length}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">Total Assigned</p>
                      </div>
                      
                      <div className="text-center p-5 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                          <Award className="h-6 w-6 text-orange-600" />
                        </div>
                        <p className="text-3xl font-bold text-orange-600 mb-1">
                          {Math.round(displayStaff.trainingModules
                            .filter((m: any) => m.status === "completed" || m.completed)
                            .reduce((total: number, m: any) => total + (m.ceuHours || 0), 0) * 10) / 10}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">Total CEU Hours Earned</p>
                      </div>
                      
                      <div className="text-center p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                          <Star className="h-6 w-6 text-indigo-600" />
                        </div>
                        <p className="text-3xl font-bold text-indigo-600 mb-1">
                          {isLoadingTrainings ? (
                            "..."
                          ) : (() => {
                            // Filter completed trainings with valid scores
                            const completedTrainings = (displayStaff.trainingModules || []).filter((m: any) => {
                              const isCompleted = m.status === "completed" || m.completed === true
                              const hasScore = m.score !== undefined && m.score !== null
                              return isCompleted && hasScore
                            })
                            
                            if (completedTrainings.length === 0) {
                              return "N/A"
                            }
                            
                            // Calculate average from valid scores only
                            const validScores = completedTrainings
                              .map((m: any) => {
                                const score = typeof m.score === 'number' 
                                  ? m.score 
                                  : parseFloat(m.score?.toString() || "0")
                                return score
                              })
                              .filter((score: number) => 
                                !isNaN(score) && score >= 0 && score <= 100
                              )
                            
                            if (validScores.length === 0) {
                              return "N/A"
                            }
                            
                            const totalScore = validScores.reduce((sum: number, score: number) => sum + score, 0)
                            const average = totalScore / validScores.length
                            return `${Math.round(average * 10) / 10}%`
                          })()}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">Average Training Score</p>
                        {!isLoadingTrainings && (() => {
                          const completedWithScores = (displayStaff.trainingModules || []).filter((m: any) => 
                            (m.status === "completed" || m.completed === true) && 
                            m.score !== undefined && 
                            m.score !== null
                          ).length
                          return completedWithScores > 0 ? (
                            <p className="text-xs text-gray-500 mt-1">
                              Based on {completedWithScores} training{completedWithScores !== 1 ? 's' : ''}
                            </p>
                          ) : null
                        })()}
                      </div>
                    </div>

                    {/* All Trainings List - Wadhwani Style */}
                    <div className="space-y-6">
                      {displayStaff.trainingModules.map((module: any, index: number) => {
                        const handleContinueTraining = async () => {
                          if (!module.trainingId) {
                            toast({
                              title: "Error",
                              description: "Training ID not found. Please contact support.",
                              variant: "destructive",
                            })
                            return
                          }

                          if (!selectedStaff?.id) {
                            toast({
                              title: "Error",
                              description: "Staff ID not found. Please refresh the page.",
                              variant: "destructive",
                            })
                            return
                          }

                          try {
                            // If training is not started, start it first
                            if (module.status === "assigned" || !module.status) {
                              const startResponse = await fetch("/api/in-service/employee-progress", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  employeeId: selectedStaff.id,
                                  trainingId: module.trainingId,
                                  action: "start",
                                }),
                              })

                              if (!startResponse.ok) {
                                const errorData = await startResponse.text()
                                throw new Error(`Failed to start training: ${errorData}`)
                              }

                              toast({
                                title: "🚀 Training Started",
                                description: "Redirecting to training page...",
                              })
                            }

                            // Navigate to training detail page
                            window.location.href = `/staff-training/${module.trainingId}?staffId=${encodeURIComponent(selectedStaff.id)}`
                          } catch (error: any) {
                            console.error("Error starting training:", error)
                            toast({
                              title: "Error",
                              description: error.message || "Failed to start training",
                              variant: "destructive",
                            })
                          }
                        }

                        const handleViewCertificate = () => {
                          if (module.trainingId && selectedStaff?.id) {
                            // Navigate to training page which will show the certificate
                            window.location.href = `/staff-training/${module.trainingId}?staffId=${encodeURIComponent(selectedStaff.id)}&showCertificate=true&source=staff-dashboard`
                          }
                        }

                        return (
                          <TrainingDashboardCard
                            key={`training-${module.trainingId || module.id}-${index}`}
                            module={module}
                            onContinue={handleContinueTraining}
                            onViewCertificate={(module.status === "completed" || module.completed) ? handleViewCertificate : undefined}
                            staffId={selectedStaff?.id}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Patient Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Recent Patient Reviews
                </CardTitle>
                <CardDescription>Feedback from your recent patients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayStaff.patientReviews.map((review, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{review.patient}</span>
                        </div>
                        <span className="text-sm text-gray-600">{review.date}</span>
                      </div>
                      <p className="text-sm text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="payroll" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Payroll Information
                </CardTitle>
                <CardDescription>View your recent pay stubs and earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayStaff.recentPayStubs.map((payStub, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{payStub.period}</p>
                          <p className="text-sm text-gray-600">{payStub.hours} hours worked</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${payStub.amount.toLocaleString()}</p>
                        <Badge className="bg-green-100 text-green-800">{payStub.status}</Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        Download
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Cancel request reason dialog - Moved outside TabsContent so it's always available */}
        <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request Shift Cancellation</DialogTitle>
              <DialogDescription>Please provide a reason for cancellation.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Reason</Label>
                <Textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="e.g., Family emergency, schedule conflict" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsCancelOpen(false)
                  setCancelReason("")
                  setCancelTarget(null)
                }}>Close</Button>
                <Button onClick={submitCancelRequest} disabled={!cancelReason.trim()}>Submit Request</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
