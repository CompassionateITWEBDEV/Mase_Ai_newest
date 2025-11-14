"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Timeline, TimelineItem } from "@/components/ui/timeline"
import { CheckCircle, XCircle, FileText, RefreshCw, Search, Loader2 } from "lucide-react"

interface Authorization {
  id: string
  patient_name: string
  patient_id?: string
  insurance_provider: string
  insurance_id: string
  authorization_type: "initial" | "recertification" | "additional_services"
  requested_services: string[]
  diagnosis_code?: string
  diagnosis: string
  status: "pending" | "approved" | "denied" | "expired" | "in_review"
  submitted_date: string
  response_date?: string
  expiration_date?: string
  authorization_number?: string
  approved_visits?: number
  approved_services?: string[]
  denial_reason?: string
  reviewer_notes?: string
  assigned_to?: string
  assigned_staff_id?: string
  priority: "low" | "medium" | "high" | "urgent"
  estimated_reimbursement: number
  actual_reimbursement?: number
  timeline: {
    date: string
    action: string
    user: string
    notes?: string
  }[]
  referral_id?: string
  created_at?: string
  updated_at?: string
}

interface AuthorizationTrackerProps {
  showAllPatients?: boolean
  patientId?: string
  readOnly?: boolean
  userRole?: string
}

export function AuthorizationTracker({
  showAllPatients = false,
  patientId,
  readOnly = false,
  userRole = "Staff Nurse",
}: AuthorizationTrackerProps) {
  const [authorizations, setAuthorizations] = useState<Authorization[]>([])
  const [selectedAuth, setSelectedAuth] = useState<Authorization | null>(null)
  const [activeTab, setActiveTab] = useState("pending")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch authorizations from database
  const fetchAuthorizations = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("Fetching authorizations...")

      const params = new URLSearchParams()
      if (patientId) params.append("patientId", patientId)

      const response = await fetch(`/api/authorizations?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch authorizations")
      }

      console.log("Fetched authorizations:", data.authorizations)
      setAuthorizations(data.authorizations || [])
    } catch (err) {
      console.error("Error fetching authorizations:", err)
      setError(err instanceof Error ? err.message : "Failed to load authorizations")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch authorizations on mount and when patientId changes
  useEffect(() => {
    fetchAuthorizations()
  }, [patientId])

  // Filter authorizations based on patient ID if provided
  const filteredAuths = authorizations.filter((auth) => {
    if (patientId && auth.patient_id !== patientId) return false
    if (searchTerm && !auth.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (filterPriority !== "all" && auth.priority !== filterPriority) return false
    return true
  })

  const authsByStatus = {
    pending: filteredAuths.filter((auth) => auth.status === "pending"),
    in_review: filteredAuths.filter((auth) => auth.status === "in_review"),
    approved: filteredAuths.filter((auth) => auth.status === "approved"),
    denied: filteredAuths.filter((auth) => auth.status === "denied"),
    expired: filteredAuths.filter((auth) => auth.status === "expired"),
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "denied":
        return "bg-red-100 text-red-800"
      case "expired":
        return "bg-gray-100 text-gray-800"
      case "in_review":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const updateAuthorizationStatus = async (authId: string, newStatus: string, notes?: string) => {
    if (readOnly) return

    setIsUpdating(true)
    try {
      console.log(`Updating authorization ${authId} to status: ${newStatus}`)

      const response = await fetch(`/api/authorizations/${authId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          reviewerNotes: notes,
          userRole: userRole,
          timelineEntry: {
            date: new Date().toISOString(),
            action: `Status updated to ${newStatus}`,
            user: userRole,
            notes: notes,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update authorization")
      }

      console.log("✅ Authorization updated successfully")
      
      // Refresh the authorizations list
      await fetchAuthorizations()
      
      alert(`Authorization ${newStatus} successfully!`)
    } catch (error) {
      console.error("Failed to update authorization:", error)
      alert(`Error: ${error instanceof Error ? error.message : "Failed to update authorization"}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const currentAuths = authsByStatus[activeTab as keyof typeof authsByStatus] || []

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Error</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchAuthorizations}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending">Pending ({authsByStatus.pending.length})</TabsTrigger>
          <TabsTrigger value="in_review">In Review ({authsByStatus.in_review.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({authsByStatus.approved.length})</TabsTrigger>
          <TabsTrigger value="denied">Denied ({authsByStatus.denied.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({authsByStatus.expired.length})</TabsTrigger>
        </TabsList>

        {Object.entries(authsByStatus).map(([status, auths]) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-gray-400" />
                <p className="text-gray-500">Loading authorizations...</p>
              </div>
            ) : auths.length > 0 ? (
              auths.map((auth) => (
                <Card key={auth.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {auth.patient_name}
                          <Badge className={getPriorityColor(auth.priority)}>{auth.priority}</Badge>
                        </CardTitle>
                        <CardDescription>
                          {auth.insurance_provider} • {auth.diagnosis} • Submitted {auth.submitted_date}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(auth.status)}>{auth.status.replace("_", " ")}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAuth(selectedAuth?.id === auth.id ? null : auth)}
                        >
                          {selectedAuth?.id === auth.id ? "Hide Details" : "View Details"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {selectedAuth?.id === auth.id && (
                    <CardContent className="border-t pt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Authorization Details */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Authorization Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Authorization ID:</span>
                                <span className="font-mono">{auth.id}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Type:</span>
                                <span className="capitalize">{auth.authorization_type.replace("_", " ")}</span>
                              </div>
                              {auth.diagnosis_code && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Diagnosis Code:</span>
                                  <span className="font-mono">{auth.diagnosis_code}</span>
                                </div>
                              )}
                              {auth.assigned_to && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Assigned To:</span>
                                  <span>{auth.assigned_to}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-600">Est. Reimbursement:</span>
                                <span className="font-semibold">${auth.estimated_reimbursement?.toLocaleString() || "0"}</span>
                              </div>
                              {auth.actual_reimbursement && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Actual Reimbursement:</span>
                                  <span className="font-semibold text-green-600">
                                    ${auth.actual_reimbursement.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Requested Services */}
                          <div>
                            <h4 className="font-semibold mb-2">Requested Services</h4>
                            <div className="flex flex-wrap gap-2">
                              {auth.requested_services && auth.requested_services.length > 0 ? (
                                auth.requested_services.map((service) => (
                                  <Badge key={service} variant="outline">
                                    {service.replace("_", " ")}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-gray-500">No services specified</span>
                              )}
                            </div>
                          </div>

                          {/* Approved Services (if approved) */}
                          {auth.approved_services && auth.approved_services.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Approved Services</h4>
                              <div className="flex flex-wrap gap-2">
                                {auth.approved_services.map((service) => (
                                  <Badge key={service} className="bg-green-100 text-green-800">
                                    {service.replace("_", " ")}
                                  </Badge>
                                ))}
                              </div>
                              {auth.approved_visits && (
                                <p className="text-sm text-gray-600 mt-2">Approved for {auth.approved_visits} visits</p>
                              )}
                            </div>
                          )}

                          {/* Denial Reason (if denied) */}
                          {auth.denial_reason && (
                            <Alert className="border-red-200 bg-red-50">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <AlertTitle className="text-red-800">Denial Reason</AlertTitle>
                              <AlertDescription className="text-red-700">{auth.denial_reason}</AlertDescription>
                            </Alert>
                          )}

                          {/* Action Buttons */}
                          {!readOnly && auth.status === "pending" && (
                            <div className="flex gap-2 pt-4">
                              <Button
                                size="sm"
                                onClick={() => updateAuthorizationStatus(auth.id, "approved")}
                                disabled={isUpdating}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Approved
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateAuthorizationStatus(auth.id, "denied", "Manual denial")}
                                disabled={isUpdating}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Mark Denied
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateAuthorizationStatus(auth.id, "in_review", "Under review")}
                                disabled={isUpdating}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Mark In Review
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Timeline */}
                        <div>
                          <h4 className="font-semibold mb-4">Authorization Timeline</h4>
                          <Timeline>
                            {auth.timeline.map((event, index) => (
                              <TimelineItem
                                key={index}
                                date={event.date}
                                title={event.action}
                                description={`${event.user}${event.notes ? ` - ${event.notes}` : ""}`}
                              />
                            ))}
                          </Timeline>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>No authorizations in this category.</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
