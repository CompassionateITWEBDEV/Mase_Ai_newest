"use client"

/**
 * Referral Management Page
 * 
 * This page manages incoming referrals from various sources including:
 * - ExtendedCare Network
 * - Fax uploads
 * - Email referrals
 * - Hospital/clinic referrals
 * 
 * Features:
 * - AI-powered referral recommendations
 * - Eligibility verification
 * - Insurance monitoring
 * - Financial protection alerts
 * - Authorization tracking
 * - ExtendedCare integration
 * 
 * Recent fixes:
 * - Fixed TypeScript error handling for error messages
 * - Fixed React hooks dependency warnings
 */

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  ArrowLeft,
  Upload,
  FileText,
  Check,
  X,
  Clock,
  Brain,
  UserPlus,
  Inbox,
  Send,
  Shield,
  RefreshCw,
  Zap,
  Building2,
  Search,
  Filter,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { AuthorizationTracker } from "@/components/authorization-tracker"
import { getCurrentUser, hasPermission } from "@/lib/auth"
import type { Referral } from "@/lib/extendedcare-api"
import { extendedCareApi } from "@/lib/extendedcare-api"

// Database referral type - matches the database schema
interface DatabaseReferral {
  id: string
  patient_name: string
  referral_date: string
  referral_source: string
  diagnosis: string
  insurance_provider: string
  insurance_id: string
  status: string
  ai_recommendation?: string
  ai_reason?: string
  soc_due_date?: string
  extendedcare_data?: any
  eligibility_status?: any
  insurance_monitoring?: any
  created_at: string
  updated_at: string
}

// Financial alert type
interface FinancialAlert {
  id: string
  type: string
  severity: string
  patientId: string
  patientName: string
  message: string
  timestamp: string
  actionRequired: boolean
  recommendations?: string[]
  changes?: {
    previous: { plan: string; group: string }
    current: { plan: string; group: string }
  }
}

// Convert database referral to frontend Referral type
const convertDbReferralToReferral = (dbRef: DatabaseReferral): Referral => ({
  id: dbRef.id,
  patientName: dbRef.patient_name,
  referralDate: dbRef.referral_date,
  referralSource: dbRef.referral_source,
  diagnosis: dbRef.diagnosis,
  insuranceProvider: dbRef.insurance_provider,
  insuranceId: dbRef.insurance_id,
  status: dbRef.status as any,
  aiRecommendation: dbRef.ai_recommendation as any,
  aiReason: dbRef.ai_reason,
  socDueDate: dbRef.soc_due_date,
  extendedCareData: dbRef.extendedcare_data,
})

const initialReferrals: Referral[] = []

export default function ReferralManagementPage() {
  const [referrals, setReferrals] = useState<Referral[]>(initialReferrals)
  const [activeTab, setActiveTab] = useState("referrals")
  const [referralTab, setReferralTab] = useState("new")
  const [isLoadingExtendedCare, setIsLoadingExtendedCare] = useState(false)
  const [extendedCareStatus, setExtendedCareStatus] = useState<"connected" | "disconnected" | "syncing">("connected")
  const [lastSyncTime, setLastSyncTime] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSource, setFilterSource] = useState("all")
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false)

  const [eligibilityChecks, setEligibilityChecks] = useState<Record<string, any>>({})
  const [insuranceMonitoring, setInsuranceMonitoring] = useState<Record<string, any>>({})
  const [financialAlerts, setFinancialAlerts] = useState<FinancialAlert[]>([])

  // Manual referral entry state
  const [manualEntry, setManualEntry] = useState({
    patientName: "",
    insuranceProvider: "",
    insuranceId: "",
    diagnosis: "",
    referralDate: new Date().toISOString().split("T")[0],
  })
  const [isSubmittingManual, setIsSubmittingManual] = useState(false)
  const [manualEntryError, setManualEntryError] = useState("")
  const [manualEntrySuccess, setManualEntrySuccess] = useState(false)

  // Get current user and check permissions
  const currentUser = getCurrentUser()
  const canViewAuthorizations =
    hasPermission(currentUser, "authorization", "read") || hasPermission(currentUser, "authorization", "track")
  const canManageAuthorizations = hasPermission(currentUser, "authorization", "write")

  // Fetch referrals from database
  const fetchReferrals = async () => {
    setIsLoadingReferrals(true)
    console.log("🔄 Fetching referrals from database...")
    
    try {
      const response = await fetch("/api/referrals")
      console.log("Response status:", response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Fetched data:", data)
      
      if (data && data.referrals) {
        console.log(`✅ Found ${data.referrals.length} referrals`)
        console.log("Raw referrals:", data.referrals)
        
        const convertedReferrals = data.referrals.map((dbRef: DatabaseReferral) => {
          console.log("Converting referral:", dbRef)
          return convertDbReferralToReferral(dbRef)
        })
        
        console.log("Converted referrals:", convertedReferrals)
        setReferrals(convertedReferrals)
        
        // Load eligibility and insurance monitoring from database
        const newEligibilityChecks: Record<string, any> = {}
        const newInsuranceMonitoring: Record<string, any> = {}
        
        data.referrals.forEach((dbRef: DatabaseReferral) => {
          if (dbRef.eligibility_status) {
            newEligibilityChecks[dbRef.id] = dbRef.eligibility_status
          }
          if (dbRef.insurance_monitoring) {
            newInsuranceMonitoring[dbRef.id] = dbRef.insurance_monitoring
          }
        })
        
        setEligibilityChecks(newEligibilityChecks)
        setInsuranceMonitoring(newInsuranceMonitoring)
      } else {
        console.warn("⚠️ No referrals data in response")
      }
    } catch (error) {
      console.error("❌ Failed to fetch referrals:", error)
      if (error instanceof Error) {
        console.error("Error details:", error.message)
      }
    } finally {
      setIsLoadingReferrals(false)
    }
  }

  // Load referrals on mount
  useEffect(() => {
    fetchReferrals()
    // Set initial sync time on client-side only to avoid hydration mismatch
    setLastSyncTime(new Date().toLocaleString())
  }, [])

  // Filter referrals based on status and search
  const filteredReferrals = useMemo(() => {
    let filtered = referrals

    // Filter by status for referral tabs
    if (activeTab === "referrals") {
      const statusMap = {
        new: "New",
        pending: "Pending Auth",
        approved: "Approved",
        denied: "Denied",
      }
      filtered = referrals.filter((r) => r.status === statusMap[referralTab as keyof typeof statusMap])
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.insuranceProvider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.referralSource?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply source filter
    if (filterSource !== "all") {
      filtered = filtered.filter((r) => {
        if (filterSource === "extendedcare") {
          return r.referralSource === "ExtendedCare Network"
        }
        if (filterSource === "fax") {
          return r.referralSource === "Fax Upload"
        }
        if (filterSource === "email") {
          return r.referralSource.startsWith("Email from")
        }
        if (filterSource === "hospital") {
          return r.referralSource.includes("Hospital") || r.referralSource.includes("Clinic")
        }
        return true
      })
    }

    return filtered
  }, [referrals, activeTab, referralTab, searchTerm, filterSource])

  // ExtendedCare referrals count
  const extendedCareReferrals = referrals.filter((r) => r.referralSource === "ExtendedCare Network")

  const syncWithExtendedCare = async () => {
    setIsLoadingExtendedCare(true)
    setExtendedCareStatus("syncing")

    try {
      // Fetch new referrals from ExtendedCare
      const newReferrals = await extendedCareApi.fetchPendingReferrals()

      // Convert ExtendedCare referrals to our format
      const convertedReferrals: Referral[] = newReferrals.map((ecReferral) => ({
        id: `REF-EC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        patientName: ecReferral.patientName,
        referralDate: new Date().toISOString().split("T")[0],
        referralSource: "ExtendedCare Network",
        diagnosis: ecReferral.diagnosis,
        insuranceProvider: ecReferral.insuranceProvider,
        insuranceId: ecReferral.insuranceId,
        status: "New",
        aiRecommendation: ecReferral.urgencyLevel === "stat" ? "Review" : "Approve",
        aiReason:
          ecReferral.urgencyLevel === "stat"
            ? "STAT referral requires immediate review"
            : "Standard ExtendedCare referral with good coverage",
        extendedCareData: {
          networkId: `EC-${Date.now()}`,
          referralType: "network",
          reimbursementRate: 0.92,
          contractedServices: ecReferral.requestedServices,
          priorityLevel: ecReferral.urgencyLevel === "routine" ? "standard" : ecReferral.urgencyLevel,
        },
      }))

      // Save to database
      for (const convertedReferral of convertedReferrals) {
        await fetch("/api/referrals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(convertedReferral),
        })
      }
      
      // Refetch all referrals from database
      await fetchReferrals()
      setExtendedCareStatus("connected")
      setLastSyncTime(new Date().toLocaleString())
    } catch (error) {
      setExtendedCareStatus("disconnected")
      console.error("Failed to sync with ExtendedCare:", error)
    } finally {
      setIsLoadingExtendedCare(false)
    }
  }

  const processExtendedCareReferral = async (referralId: string) => {
    const referral = referrals.find((r) => r.id === referralId)
    if (!referral) return

    try {
      // Check eligibility through ExtendedCare
      const eligibilityResult = await extendedCareApi.checkEligibility(referralId, referral.insuranceId)

      if (eligibilityResult.isEligible) {
        // Auto-approve if meets criteria
        if (referral.aiRecommendation === "Approve") {
          handleApprove(referralId)
        } else {
          // Request prior auth if needed
          const priorAuthResult = await extendedCareApi.submitPriorAuth(referralId, ["skilled_nursing"])
          if (priorAuthResult.success) {
            handleRequestAuth(referralId)
          }
        }
      } else {
        handleDeny(referralId)
      }
    } catch (error) {
      console.error("Failed to process ExtendedCare referral:", error)
    }
  }

  const handleApprove = async (id: string) => {
    console.log("✅ Approving referral:", id)
    
    try {
      const socDueDate = new Date()
      socDueDate.setDate(socDueDate.getDate() + 5) // Set SOC due in 5 days
      
      const requestBody = { 
        status: "Approved", 
        socDueDate: socDueDate.toISOString().split("T")[0] 
      }
      
      console.log("Request body:", requestBody)
      
      const response = await fetch(`/api/referrals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error("Failed to approve:", error)
        throw new Error(error.error || "Failed to approve referral")
      }

      const result = await response.json()
      console.log("Approved successfully:", result)

      // Refresh the list
      await fetchReferrals()
      
      // Show success feedback (you can add a toast notification here)
      alert("✅ Referral approved successfully!")
    } catch (error) {
      console.error("❌ Failed to approve referral:", error)
      alert("Failed to approve referral: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const handleDeny = async (id: string) => {
    console.log("❌ Denying referral:", id)
    
    try {
      const response = await fetch(`/api/referrals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Denied" }),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error("Failed to deny:", error)
        throw new Error(error.error || "Failed to deny referral")
      }

      const result = await response.json()
      console.log("Denied successfully:", result)

      // Refresh the list
      await fetchReferrals()
      
      // Show success feedback
      alert("❌ Referral denied")
    } catch (error) {
      console.error("❌ Failed to deny referral:", error)
      alert("Failed to deny referral: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const handleRequestAuth = async (id: string) => {
    console.log("⏳ Requesting prior auth for referral:", id)
    
    try {
      // Find the referral to get its details
      const referral = referrals.find(r => r.id === id)
      if (!referral) {
        throw new Error("Referral not found")
      }

      // Create authorization record
      const authorizationData = {
        patientName: referral.patientName,
        patientId: `PAT-${Date.now()}`, // Generate patient ID
        insuranceProvider: referral.insuranceProvider || "Not specified",
        insuranceId: referral.insuranceId || "Not provided",
        authorizationType: "initial",
        requestedServices: ["skilled_nursing"], // Default service
        diagnosisCode: "", // Could be extracted from diagnosis if available
        diagnosis: referral.diagnosis || "Not specified",
        priority: referral.extendedCareData?.priorityLevel === "stat" ? "urgent" : 
                  referral.extendedCareData?.priorityLevel === "urgent" ? "high" : "medium",
        estimatedReimbursement: 0,
        referralId: id,
        reviewerNotes: `Authorization requested for ${referral.referralSource} referral`
      }

      console.log("Creating authorization:", authorizationData)

      const authResponse = await fetch("/api/authorizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authorizationData),
      })

      if (!authResponse.ok) {
        let authError
        try {
          authError = await authResponse.json()
        } catch (e) {
          authError = { error: `HTTP ${authResponse.status}: ${authResponse.statusText}` }
        }
        console.error("Failed to create authorization:", authError)
        console.error("Response status:", authResponse.status)
        console.error("Response statusText:", authResponse.statusText)
        throw new Error(authError.error || `Failed to create authorization (${authResponse.status})`)
      }

      const authResult = await authResponse.json()
      console.log("Authorization created:", authResult)

      // Update referral status to Pending Auth
      const response = await fetch(`/api/referrals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Pending Auth" }),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error("Failed to update referral status:", error)
        throw new Error(error.error || "Failed to update referral status")
      }

      const result = await response.json()
      console.log("Referral status updated successfully:", result)

      // Refresh the list
      await fetchReferrals()
      
      // Show success feedback
      alert("⏳ Prior authorization requested successfully! Check the Authorization Tracking tab to monitor progress.")
    } catch (error) {
      console.error("❌ Failed to request auth:", error)
      alert("Failed to request authorization: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-800"
      case "Pending Auth":
        return "bg-yellow-100 text-yellow-800"
      case "Approved":
        return "bg-green-100 text-green-800"
      case "Denied":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getReferralSourceBadge = (source: string) => {
    if (source === "ExtendedCare Network") {
      return <Badge className="bg-purple-100 text-purple-800 ml-2">ExtendedCare</Badge>
    }
    if (source === "Fax Upload") {
      return <Badge className="bg-gray-100 text-gray-800 ml-2">Fax</Badge>
    }
    if (source.startsWith("Email from")) {
      return <Badge className="bg-teal-100 text-teal-800 ml-2">Email</Badge>
    }
    return null
  }

  const checkEligibilityForReferral = async (referral: Referral) => {
    try {
      setEligibilityChecks((prev) => ({
        ...prev,
        [referral.id]: { status: "checking", timestamp: new Date().toISOString() },
      }))

      const eligibilityResult = await extendedCareApi.checkEligibility(referral.id, referral.insuranceId)

      setEligibilityChecks((prev) => ({
        ...prev,
        [referral.id]: {
          status: "completed",
          result: eligibilityResult,
          timestamp: new Date().toISOString(),
          nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Check again in 24 hours
        },
      }))

      // Start continuous monitoring for this patient
      startInsuranceMonitoring(referral)

      return eligibilityResult
    } catch (error) {
      setEligibilityChecks((prev) => ({
        ...prev,
        [referral.id]: { 
          status: "error", 
          error: error instanceof Error ? error.message : "Unknown error occurred", 
          timestamp: new Date().toISOString() 
        },
      }))
      throw error
    }
  }

  const startInsuranceMonitoring = (referral: Referral) => {
    setInsuranceMonitoring((prev) => ({
      ...prev,
      [referral.id]: {
        patientName: referral.patientName,
        originalInsurance: {
          provider: referral.insuranceProvider,
          id: referral.insuranceId,
        },
        lastChecked: new Date().toISOString(),
        status: "active",
        checkFrequency: "daily", // Can be 'daily', 'weekly', 'monthly'
      },
    }))
  }

  const performContinuousEligibilityCheck = async (referralId: string) => {
    const referral = referrals.find((r) => r.id === referralId)
    if (!referral || referral.status === "Denied") return

    try {
      const currentEligibility = await extendedCareApi.checkEligibility(referralId, referral.insuranceId)
      const previousCheck = eligibilityChecks[referralId]

      // Compare with previous eligibility status
      if (previousCheck?.result && !currentEligibility.isEligible && previousCheck.result.isEligible) {
        // Patient lost eligibility - create financial alert
        const alert = {
          id: `ALERT-${Date.now()}`,
          type: "eligibility_lost",
          severity: "high",
          patientId: referralId,
          patientName: referral.patientName,
          message: `Patient ${referral.patientName} has lost insurance eligibility. Immediate action required to prevent financial loss.`,
          timestamp: new Date().toISOString(),
          actionRequired: true,
          recommendations: [
            "Contact patient to verify insurance status",
            "Request updated insurance information",
            "Consider discharge if eligibility cannot be restored",
            "Document all attempts to resolve eligibility issues",
          ],
        }

        setFinancialAlerts((prev) => [alert, ...prev])

        // Send immediate notification
        await fetch("/api/notifications/financial-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(alert),
        })
      }

      // Check for insurance changes
      if (previousCheck?.result?.planDetails && currentEligibility.planDetails) {
        const previousPlan = previousCheck.result.planDetails
        const currentPlan = currentEligibility.planDetails

        if (previousPlan.planName !== currentPlan.planName || previousPlan.groupNumber !== currentPlan.groupNumber) {
          const alert = {
            id: `ALERT-${Date.now()}`,
            type: "insurance_changed",
            severity: "medium",
            patientId: referralId,
            patientName: referral.patientName,
            message: `Insurance plan changed for ${referral.patientName}. Review coverage and reimbursement rates.`,
            timestamp: new Date().toISOString(),
            actionRequired: true,
            changes: {
              previous: { plan: previousPlan.planName, group: previousPlan.groupNumber },
              current: { plan: currentPlan.planName, group: currentPlan.groupNumber },
            },
            recommendations: [
              "Verify new plan covers current services",
              "Check if prior authorization is still valid",
              "Update billing information",
              "Confirm copay and deductible amounts",
            ],
          }

          setFinancialAlerts((prev) => [alert, ...prev])
        }
      }

      setEligibilityChecks((prev) => ({
        ...prev,
        [referralId]: {
          ...prev[referralId],
          result: currentEligibility,
          lastChecked: new Date().toISOString(),
          nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      }))
    } catch (error) {
      console.error(`Failed to check eligibility for ${referralId}:`, error)
    }
  }

  const dismissAlert = (alertId: string) => {
    setFinancialAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
  }

  const resolveAlert = async (alertId: string, resolution: string) => {
    const alert = financialAlerts.find((a) => a.id === alertId)
    if (alert) {
      await fetch("/api/notifications/resolve-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, resolution, timestamp: new Date().toISOString() }),
      })
      dismissAlert(alertId)
    }
  }

  const handleManualReferralSubmit = async () => {
    // Validate required fields
    if (!manualEntry.patientName.trim()) {
      setManualEntryError("Patient name is required")
      return
    }
    if (!manualEntry.insuranceProvider.trim()) {
      setManualEntryError("Insurance provider is required")
      return
    }
    if (!manualEntry.insuranceId.trim()) {
      setManualEntryError("Insurance ID is required")
      return
    }
    if (!manualEntry.diagnosis.trim()) {
      setManualEntryError("Primary diagnosis is required")
      return
    }

    setIsSubmittingManual(true)
    setManualEntryError("")
    setManualEntrySuccess(false)

    try {
      const requestBody: any = {
        patientName: manualEntry.patientName.trim(),
        referralDate: manualEntry.referralDate,
        referralSource: "Manual Entry",
        diagnosis: manualEntry.diagnosis.trim(),
        insuranceProvider: manualEntry.insuranceProvider.trim(),
        insuranceId: manualEntry.insuranceId.trim(),
      }
      
      // Optional: Add AI fields if you want AI recommendations
      // These fields require the ai_reason and ai_recommendation columns in the database
      // If columns don't exist, comment these out or run the migration in scripts/074-add-ai-reason-column.sql
      // requestBody.aiRecommendation = "Review"
      // requestBody.aiReason = "Manually entered referral requires review"

      console.log("Submitting referral:", requestBody)

      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        let errorMessage = "Failed to create referral"
        let detailedError = null
        try {
          const error = await response.json()
          console.error("API error response:", error)
          errorMessage = error.error || errorMessage
          detailedError = error
          
          // If it's a configuration error, show setup instructions
          if (error.setupInstructions) {
            console.error("⚠️ SETUP REQUIRED:", error.setupInstructions)
            console.error("📖 See ENV_SETUP_REFERRALS.md for detailed instructions")
            errorMessage = `${errorMessage}\n\nSetup needed: ${error.details || 'Missing configuration'}`
          }
          
          if (error.details) {
            console.error("Error details:", error.details)
          }
        } catch (e) {
          console.error("Could not parse error response:", e)
          errorMessage = `Server error (${response.status}): ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("Referral created successfully:", result)

      // Show success message
      setManualEntrySuccess(true)

      // Reset form
      setManualEntry({
        patientName: "",
        insuranceProvider: "",
        insuranceId: "",
        diagnosis: "",
        referralDate: new Date().toISOString().split("T")[0],
      })

      // Refresh referrals list
      await fetchReferrals()

      // Hide success message after 5 seconds
      setTimeout(() => {
        setManualEntrySuccess(false)
      }, 5000)
    } catch (error) {
      console.error("Error submitting manual referral:", error)
      setManualEntryError(error instanceof Error ? error.message : "Failed to submit referral. Please try again.")
    } finally {
      setIsSubmittingManual(false)
    }
  }

  // Auto-sync every 5 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        if (extendedCareStatus === "connected") {
          syncWithExtendedCare()
        }
      },
      5 * 60 * 1000,
    ) // 5 minutes

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extendedCareStatus])

  // Auto-check eligibility for new referrals
  useEffect(() => {
    const newReferrals = referrals.filter((r) => r.status === "New" && !eligibilityChecks[r.id])

    newReferrals.forEach((referral) => {
      checkEligibilityForReferral(referral)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referrals])

  // Continuous eligibility monitoring
  useEffect(() => {
    const interval = setInterval(
      () => {
        Object.keys(eligibilityChecks).forEach((referralId) => {
          const check = eligibilityChecks[referralId]
          if (check.nextCheck && new Date(check.nextCheck) <= new Date()) {
            performContinuousEligibilityCheck(referralId)
          }
        })
      },
      60 * 60 * 1000,
    ) // Check every hour

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligibilityChecks, referrals])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/patient-tracking">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Patient Tracking
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Referral Management Center</h1>
              <p className="text-gray-600">
                Process incoming referrals with AI-powered decision support and authorization tracking.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {currentUser.role.name}
            </Badge>
            {canViewAuthorizations && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Shield className="h-3 w-3 mr-1" />
                Authorization Access
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`${extendedCareStatus === "connected" ? "bg-green-50 text-green-700" : extendedCareStatus === "syncing" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}
            >
              <Building2 className="h-3 w-3 mr-1" />
              ExtendedCare{" "}
              {extendedCareStatus === "connected"
                ? "Connected"
                : extendedCareStatus === "syncing"
                  ? "Syncing..."
                  : "Disconnected"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ExtendedCare Integration Status */}
        <div className="mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">ExtendedCare Integration</CardTitle>
                    <CardDescription>
                      {extendedCareReferrals.length} referrals from ExtendedCare Network • Last sync: {lastSyncTime || "Loading..."}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={syncWithExtendedCare} disabled={isLoadingExtendedCare}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingExtendedCare ? "animate-spin" : ""}`} />
                    {isLoadingExtendedCare ? "Syncing..." : "Sync Now"}
                  </Button>
                  <Link href="/integrations/extendedcare-setup">
                    <Button variant="ghost" size="sm">
                      Configure
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Financial Protection Alerts */}
        {financialAlerts.length > 0 && (
          <div className="mb-6">
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-red-800">Financial Protection Alerts</CardTitle>
                      <CardDescription className="text-red-600">
                        {financialAlerts.length} alert{financialAlerts.length !== 1 ? "s" : ""} requiring immediate
                        attention
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-red-600 text-white">
                    {financialAlerts.filter((a) => a.severity === "high").length} High Priority
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {financialAlerts.map((alert) => (
                    <Alert
                      key={alert.id}
                      className={`${
                        alert.severity === "high" ? "border-red-300 bg-red-50" : "border-yellow-300 bg-yellow-50"
                      }`}
                    >
                      <Shield className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>
                          {alert.patientName} - {alert.type.replace("_", " ").toUpperCase()}
                        </span>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => dismissAlert(alert.id)}>
                            Dismiss
                          </Button>
                          <Button size="sm" onClick={() => resolveAlert(alert.id, "manual_resolution")}>
                            Resolve
                          </Button>
                        </div>
                      </AlertTitle>
                      <AlertDescription>
                        <p className="mb-2">{alert.message}</p>
                        {alert.recommendations && (
                          <div className="text-xs">
                            <strong>Recommended Actions:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {alert.recommendations.map((rec: string, idx: number) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {alert.changes && (
                          <div className="text-xs mt-2 p-2 bg-white rounded">
                            <strong>Changes Detected:</strong>
                            <p>
                              Previous: {alert.changes.previous.plan} ({alert.changes.previous.group})
                            </p>
                            <p>
                              Current: {alert.changes.current.plan} ({alert.changes.current.group})
                            </p>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Search & Filter</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchReferrals}
                  disabled={isLoadingReferrals}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingReferrals ? "animate-spin" : ""}`} />
                  {isLoadingReferrals ? "Loading..." : "Refresh"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search patients, diagnosis, insurance..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Sources</option>
                  <option value="extendedcare">ExtendedCare Network</option>
                  <option value="hospital">Hospitals & Clinics</option>
                  <option value="fax">Fax Uploads</option>
                  <option value="email">Email Referrals</option>
                </select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setFilterSource("all")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
              {isLoadingReferrals && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  <RefreshCw className="h-4 w-4 animate-spin inline mr-2" />
                  Loading referrals...
                </div>
              )}
              {!isLoadingReferrals && referrals.length === 0 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  No referrals found. Create one using the form below!
                </div>
              )}
              {!isLoadingReferrals && referrals.length > 0 && (
                <div className="mt-4 text-center text-sm text-green-600">
                  ✅ {referrals.length} referral{referrals.length !== 1 ? 's' : ''} loaded
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${canViewAuthorizations ? "grid-cols-2" : "grid-cols-1"}`}>
            <TabsTrigger value="referrals">Referral Processing</TabsTrigger>
            {canViewAuthorizations && (
              <TabsTrigger value="authorizations">
                Authorization Tracking
                {canManageAuthorizations && <Badge className="ml-2 bg-blue-500 text-white text-xs">Manage</Badge>}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="referrals" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Tabs value={referralTab} onValueChange={setReferralTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="new">
                      New Referrals ({referrals.filter((r) => r.status === "New").length})
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                      Pending Auth ({referrals.filter((r) => r.status === "Pending Auth").length})
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                      Approved ({referrals.filter((r) => r.status === "Approved").length})
                    </TabsTrigger>
                    <TabsTrigger value="denied">
                      Denied ({referrals.filter((r) => r.status === "Denied").length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value={referralTab} className="mt-6">
                    <div className="space-y-4">
                      {filteredReferrals.length > 0 ? (
                        filteredReferrals.map((referral) => (
                          <Card key={referral.id}>
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="flex items-center">
                                    {referral.patientName}
                                    {getReferralSourceBadge(referral.referralSource)}
                                  </CardTitle>
                                  <CardDescription>
                                    Referred from: {referral.referralSource} on {referral.referralDate}
                                  </CardDescription>
                                </div>
                                <Badge className={getStatusColor(referral.status)}>{referral.status}</Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                  <span className="font-medium">Diagnosis:</span> {referral.diagnosis || "Not specified"}
                                </div>
                                <div>
                                  <span className="font-medium">Insurance:</span> {referral.insuranceProvider || "N/A"} (
                                  {referral.insuranceId || "N/A"})
                                </div>
                              </div>

                              {/* Eligibility Status */}
                              {eligibilityChecks[referral.id] && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                  <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                                    <Shield className="h-4 w-4 mr-2" />
                                    Eligibility Status
                                    {eligibilityChecks[referral.id].status === "checking" && (
                                      <RefreshCw className="h-3 w-3 ml-2 animate-spin" />
                                    )}
                                  </h4>
                                  {eligibilityChecks[referral.id].status === "completed" &&
                                    eligibilityChecks[referral.id].result && (
                                      <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                          <span>Eligibility:</span>
                                          <Badge
                                            className={
                                              eligibilityChecks[referral.id].result.isEligible
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                            }
                                          >
                                            {eligibilityChecks[referral.id].result.isEligible
                                              ? "Eligible"
                                              : "Not Eligible"}
                                          </Badge>
                                        </div>
                                        {eligibilityChecks[referral.id].result.planDetails && (
                                          <>
                                            <div className="grid grid-cols-2 gap-2">
                                              <div>
                                                <span className="text-blue-600">Plan:</span>{" "}
                                                {eligibilityChecks[referral.id].result.planDetails.planName}
                                              </div>
                                              <div>
                                                <span className="text-blue-600">Copay:</span> $
                                                {eligibilityChecks[referral.id].result.planDetails.copay.inNetwork}
                                              </div>
                                              <div>
                                                <span className="text-blue-600">Deductible Remaining:</span> $
                                                {eligibilityChecks[referral.id].result.planDetails.deductible.remaining}
                                              </div>
                                              <div>
                                                <span className="text-blue-600">Out-of-Pocket Remaining:</span> $
                                                {
                                                  eligibilityChecks[referral.id].result.planDetails.outOfPocketMax
                                                    .remaining
                                                }
                                              </div>
                                            </div>
                                            <div className="text-xs text-blue-600 mt-2">
                                              Last checked:{" "}
                                              {new Date(eligibilityChecks[referral.id].timestamp).toLocaleString()}
                                              {eligibilityChecks[referral.id].nextCheck && (
                                                <span className="ml-2">
                                                  • Next check:{" "}
                                                  {new Date(eligibilityChecks[referral.id].nextCheck).toLocaleString()}
                                                </span>
                                              )}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  {eligibilityChecks[referral.id].status === "error" && (
                                    <div className="text-red-600 text-sm">
                                      Error checking eligibility: {eligibilityChecks[referral.id].error}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="ml-2 bg-transparent"
                                        onClick={() => checkEligibilityForReferral(referral)}
                                      >
                                        Retry
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Insurance Monitoring Status */}
                              {insuranceMonitoring[referral.id] && (
                                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                                  <h4 className="font-medium text-green-800 mb-2 flex items-center">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Insurance Monitoring Active
                                  </h4>
                                  <div className="text-sm text-green-700">
                                    <p>Continuous monitoring enabled for insurance changes</p>
                                    <p className="text-xs mt-1">
                                      Last checked:{" "}
                                      {new Date(insuranceMonitoring[referral.id].lastChecked).toLocaleString()}•
                                      Frequency: {insuranceMonitoring[referral.id].checkFrequency}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* ExtendedCare specific info */}
                              {referral.extendedCareData && (
                                <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                                  <h4 className="font-medium text-purple-800 mb-2">ExtendedCare Network Details</h4>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-purple-600">Network ID:</span>{" "}
                                      {referral.extendedCareData.networkId}
                                    </div>
                                    <div>
                                      <span className="text-purple-600">Reimbursement Rate:</span>{" "}
                                      {(referral.extendedCareData.reimbursementRate * 100).toFixed(0)}%
                                    </div>
                                    <div>
                                      <span className="text-purple-600">Priority:</span>{" "}
                                      {referral.extendedCareData.priorityLevel}
                                    </div>
                                    <div>
                                      <span className="text-purple-600">Services:</span>{" "}
                                      {referral.extendedCareData.contractedServices.join(", ")}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {referral.aiRecommendation && (
                                <Alert
                                  className={`mb-4 ${referral.aiRecommendation === "Approve" ? "bg-green-50 border-green-200" : referral.aiRecommendation === "Deny" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}
                                >
                                  <Brain className="h-4 w-4" />
                                  <AlertTitle className="flex items-center gap-2">
                                    AI Recommendation:
                                    <span
                                      className={`font-bold ${referral.aiRecommendation === "Approve" ? "text-green-700" : referral.aiRecommendation === "Deny" ? "text-red-700" : "text-yellow-700"}`}
                                    >
                                      {referral.aiRecommendation}
                                    </span>
                                  </AlertTitle>
                                  <AlertDescription>{referral.aiReason}</AlertDescription>
                                </Alert>
                              )}

                              {referral.status === "New" && (
                                <div className="flex space-x-2">
                                  <Button size="sm" onClick={() => handleApprove(referral.id)}>
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleDeny(referral.id)}>
                                    <X className="h-4 w-4 mr-2" />
                                    Deny
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleRequestAuth(referral.id)}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Request Prior Auth
                                  </Button>
                                  {referral.referralSource === "ExtendedCare Network" && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => processExtendedCareReferral(referral.id)}
                                    >
                                      <Zap className="h-4 w-4 mr-2" />
                                      Auto-Process
                                    </Button>
                                  )}
                                </div>
                              )}

                              {referral.status === "Pending Auth" && (
                                <div className="flex items-center text-yellow-700 text-sm">
                                  <Clock className="h-4 w-4 mr-2" />
                                  Prior authorization submitted. Awaiting response from payer.
                                </div>
                              )}

                              {referral.status === "Approved" && (
                                <div className="flex items-center text-green-700 text-sm">
                                  <Check className="h-4 w-4 mr-2" />
                                  Patient admitted. SOC due by {referral.socDueDate}.
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <Inbox className="h-12 w-12 mx-auto mb-4" />
                          <p>No referrals found matching your criteria.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Upload className="h-5 w-5 mr-2" /> Process Faxed Referral
                    </CardTitle>
                    <CardDescription>Upload a referral document to process it automatically.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                        <FileText className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                        <Label htmlFor="fax-upload" className="text-blue-600 font-medium cursor-pointer">
                          Choose a file
                          <Input id="fax-upload" type="file" className="sr-only" />
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">or drag and drop PDF, PNG, or JPG</p>
                      </div>
                      <Button className="w-full">
                        <Brain className="h-4 w-4 mr-2" />
                        Process with AI-OCR
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <UserPlus className="h-5 w-5 mr-2" /> Manual Referral Entry
                    </CardTitle>
                    <CardDescription>Enter referral details manually.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {manualEntrySuccess && (
                      <Alert className="bg-green-50 border-green-200">
                        <Check className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Success!</AlertTitle>
                        <AlertDescription className="text-green-700">
                          Referral submitted successfully and added to New Referrals.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {manualEntryError && (
                      <Alert className="bg-red-50 border-red-200">
                        <X className="h-4 w-4 text-red-600" />
                        <AlertTitle className="text-red-800">Error</AlertTitle>
                        <AlertDescription className="text-red-700 whitespace-pre-line">
                          {manualEntryError}
                          {manualEntryError.includes("SUPABASE_SERVICE_ROLE_KEY") && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                              <div className="flex items-start">
                                <Shield className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                  <strong className="text-yellow-900">Administrator Setup Required</strong>
                                  <p className="mt-1 text-yellow-800">
                                    The Supabase Service Role Key is missing. This is a one-time setup needed by the system administrator.
                                  </p>
                                  <div className="mt-2 text-xs text-yellow-700">
                                    📖 Quick Fix Guide: <code className="bg-yellow-100 px-1 py-0.5 rounded font-mono">QUICK_FIX_REFERRAL_ERROR.md</code>
                                    <br />
                                    📚 Detailed Guide: <code className="bg-yellow-100 px-1 py-0.5 rounded font-mono">ENV_SETUP_REFERRALS.md</code>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <Label htmlFor="manual-name">
                        Patient Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="manual-name"
                        placeholder="John Smith"
                        value={manualEntry.patientName}
                        onChange={(e) => setManualEntry({ ...manualEntry, patientName: e.target.value })}
                        disabled={isSubmittingManual}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="manual-date">
                        Referral Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="manual-date"
                        type="date"
                        value={manualEntry.referralDate}
                        onChange={(e) => setManualEntry({ ...manualEntry, referralDate: e.target.value })}
                        disabled={isSubmittingManual}
                      />
                    </div>

                    <div>
                      <Label htmlFor="manual-insurance">
                        Insurance Provider <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="manual-insurance"
                        placeholder="Medicare"
                        value={manualEntry.insuranceProvider}
                        onChange={(e) => setManualEntry({ ...manualEntry, insuranceProvider: e.target.value })}
                        disabled={isSubmittingManual}
                      />
                    </div>

                    <div>
                      <Label htmlFor="manual-insurance-id">
                        Insurance ID <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="manual-insurance-id"
                        placeholder="1234567890"
                        value={manualEntry.insuranceId}
                        onChange={(e) => setManualEntry({ ...manualEntry, insuranceId: e.target.value })}
                        disabled={isSubmittingManual}
                      />
                    </div>

                    <div>
                      <Label htmlFor="manual-diagnosis">
                        Primary Diagnosis <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="manual-diagnosis"
                        placeholder="Post-operative care"
                        value={manualEntry.diagnosis}
                        onChange={(e) => setManualEntry({ ...manualEntry, diagnosis: e.target.value })}
                        disabled={isSubmittingManual}
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleManualReferralSubmit}
                      disabled={isSubmittingManual}
                    >
                      {isSubmittingManual ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Submit Referral
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* ExtendedCare Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="h-5 w-5 mr-2" /> ExtendedCare Stats
                    </CardTitle>
                    <CardDescription>Today's referral activity from ExtendedCare Network</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">New Referrals</span>
                      <Badge variant="secondary">
                        {extendedCareReferrals.filter((r) => r.status === "New").length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Auto-Approved</span>
                      <Badge className="bg-green-100 text-green-800">
                        {extendedCareReferrals.filter((r) => r.status === "Approved").length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pending Review</span>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {extendedCareReferrals.filter((r) => r.aiRecommendation === "Review").length}
                      </Badge>
                    </div>
                    <div className="pt-2 border-t">
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        View ExtendedCare Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {canViewAuthorizations && (
            <TabsContent value="authorizations" className="space-y-6">
              <div className="mb-6">
                <Alert className="border-blue-200 bg-blue-50">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Authorization Access</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    You have {canManageAuthorizations ? "full management" : "view-only"} access to authorization
                    tracking.
                    {canManageAuthorizations
                      ? " You can view, update, and manage all authorization requests."
                      : " You can view authorization status and history but cannot make changes."}
                  </AlertDescription>
                </Alert>
              </div>

              <AuthorizationTracker
                showAllPatients={true}
                readOnly={!canManageAuthorizations}
                userRole={currentUser.role.name}
              />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}
