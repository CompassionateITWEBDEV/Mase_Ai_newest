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
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleString())
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSource, setFilterSource] = useState("all")
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false)

  const [eligibilityChecks, setEligibilityChecks] = useState<Record<string, any>>({})
  const [insuranceMonitoring, setInsuranceMonitoring] = useState<Record<string, any>>({})
  const [financialAlerts, setFinancialAlerts] = useState<any[]>([])

  // Get current user and check permissions
  const currentUser = getCurrentUser()
  const canViewAuthorizations =
    hasPermission(currentUser, "authorization", "read") || hasPermission(currentUser, "authorization", "track")
  const canManageAuthorizations = hasPermission(currentUser, "authorization", "write")

  // Fetch referrals from database
  const fetchReferrals = async () => {
    setIsLoadingReferrals(true)
    try {
      const response = await fetch("/api/referrals")
      const data = await response.json()
      
      if (data && data.referrals) {
        const convertedReferrals = data.referrals.map((dbRef: DatabaseReferral) => convertDbReferralToReferral(dbRef))
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
      }
    } catch (error) {
      console.error("Failed to fetch referrals:", error)
    } finally {
      setIsLoadingReferrals(false)
    }
  }

  // Load referrals on mount
  useEffect(() => {
    fetchReferrals()
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
          r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.insuranceProvider.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.referralSource.toLowerCase().includes(searchTerm.toLowerCase()),
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
          priorityLevel: ecReferral.urgencyLevel,
        },
      }))

      setReferrals((prev) => [...convertedReferrals, ...prev])
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

  const handleApprove = (id: string) => {
    setReferrals((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const socDueDate = new Date()
          socDueDate.setDate(socDueDate.getDate() + 5) // Set SOC due in 5 days
          return { ...r, status: "Approved", socDueDate: socDueDate.toISOString().split("T")[0] }
        }
        return r
      }),
    )
  }

  const handleDeny = (id: string) => {
    setReferrals((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Denied" } : r)))
  }

  const handleRequestAuth = (id: string) => {
    setReferrals((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Pending Auth" } : r)))
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
                      {extendedCareReferrals.length} referrals from ExtendedCare Network • Last sync: {lastSyncTime}
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
                              {alert.recommendations.map((rec, idx) => (
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
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Search & Filter</span>
              </CardTitle>
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
                                  <span className="font-medium">Diagnosis:</span> {referral.diagnosis}
                                </div>
                                <div>
                                  <span className="font-medium">Insurance:</span> {referral.insuranceProvider} (
                                  {referral.insuranceId})
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
                    <div>
                      <Label htmlFor="manual-name">Patient Name</Label>
                      <Input id="manual-name" placeholder="John Smith" />
                    </div>
                    <div>
                      <Label htmlFor="manual-insurance">Insurance Provider</Label>
                      <Input id="manual-insurance" placeholder="Medicare" />
                    </div>
                    <div>
                      <Label htmlFor="manual-diagnosis">Primary Diagnosis</Label>
                      <Input id="manual-diagnosis" placeholder="Post-operative care" />
                    </div>
                    <Button className="w-full">Submit Referral</Button>
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
