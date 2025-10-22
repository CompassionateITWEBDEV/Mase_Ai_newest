"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Timeline, TimelineItem } from "@/components/ui/timeline"
import { CheckCircle, XCircle, FileText, RefreshCw, Search } from "lucide-react"

interface Authorization {
  id: string
  patientName: string
  patientId: string
  insuranceProvider: string
  insuranceId: string
  authorizationType: "initial" | "recertification" | "additional_services"
  requestedServices: string[]
  diagnosisCode: string
  diagnosis: string
  status: "pending" | "approved" | "denied" | "expired" | "in_review"
  submittedDate: string
  responseDate?: string
  expirationDate?: string
  authorizationNumber?: string
  approvedVisits?: number
  approvedServices?: string[]
  denialReason?: string
  reviewerNotes?: string
  assignedTo: string
  priority: "low" | "medium" | "high" | "urgent"
  estimatedReimbursement: number
  actualReimbursement?: number
  lastUpdated: string
  timeline: {
    date: string
    action: string
    user: string
    notes?: string
  }[]
}

interface AuthorizationTrackerProps {
  showAllPatients?: boolean
  patientId?: string
  readOnly?: boolean
  userRole?: string
}

const mockAuthorizations: Authorization[] = [
  {
    id: "AUTH-001",
    patientName: "Sarah Johnson",
    patientId: "PAT-001",
    insuranceProvider: "Medicare Advantage",
    insuranceId: "MA-78901",
    authorizationType: "initial",
    requestedServices: ["skilled_nursing", "physical_therapy", "occupational_therapy"],
    diagnosisCode: "M79.3",
    diagnosis: "Post-surgical wound care and mobility training",
    status: "approved",
    submittedDate: "2024-07-08",
    responseDate: "2024-07-09",
    expirationDate: "2024-09-08",
    authorizationNumber: "AUTH-MA-2024-001",
    approvedVisits: 20,
    approvedServices: ["skilled_nursing", "physical_therapy"],
    assignedTo: "Jennifer Martinez, RN",
    priority: "medium",
    estimatedReimbursement: 3200,
    actualReimbursement: 3200,
    lastUpdated: "2024-07-09 14:30",
    timeline: [
      { date: "2024-07-08 09:00", action: "Authorization request submitted", user: "System" },
      { date: "2024-07-08 09:15", action: "Request received by payer", user: "Medicare Advantage" },
      {
        date: "2024-07-09 14:30",
        action: "Authorization approved",
        user: "Medicare Advantage",
        notes: "Approved for 20 visits over 60 days",
      },
    ],
  },
  {
    id: "AUTH-002",
    patientName: "Robert Davis",
    patientId: "PAT-002",
    insuranceProvider: "Humana",
    insuranceId: "HUM-45678",
    authorizationType: "initial",
    requestedServices: ["skilled_nursing", "medical_social_work"],
    diagnosisCode: "E11.9",
    diagnosis: "Diabetes management and education",
    status: "pending",
    submittedDate: "2024-07-09",
    assignedTo: "Michael Chen, RN",
    priority: "high",
    estimatedReimbursement: 2800,
    lastUpdated: "2024-07-09 16:45",
    timeline: [
      { date: "2024-07-09 16:45", action: "Authorization request submitted", user: "System" },
      { date: "2024-07-09 17:00", action: "Request received by payer", user: "Humana" },
    ],
  },
  {
    id: "AUTH-003",
    patientName: "Maria Rodriguez",
    patientId: "PAT-003",
    insuranceProvider: "Medicare",
    insuranceId: "MCR-99887",
    authorizationType: "recertification",
    requestedServices: ["skilled_nursing", "physical_therapy", "speech_therapy"],
    diagnosisCode: "I63.9",
    diagnosis: "Post-stroke rehabilitation",
    status: "in_review",
    submittedDate: "2024-07-07",
    assignedTo: "Lisa Thompson, RN",
    priority: "urgent",
    estimatedReimbursement: 4500,
    lastUpdated: "2024-07-10 08:30",
    timeline: [
      { date: "2024-07-07 10:00", action: "Recertification request submitted", user: "System" },
      { date: "2024-07-07 10:30", action: "Request received by Medicare", user: "Medicare" },
      {
        date: "2024-07-10 08:30",
        action: "Additional documentation requested",
        user: "Medicare",
        notes: "Need updated physician orders",
      },
    ],
  },
  {
    id: "AUTH-004",
    patientName: "James Wilson",
    patientId: "PAT-004",
    insuranceProvider: "Aetna",
    insuranceId: "AET-67890",
    authorizationType: "additional_services",
    requestedServices: ["occupational_therapy"],
    diagnosisCode: "S72.001A",
    diagnosis: "Hip fracture recovery",
    status: "denied",
    submittedDate: "2024-07-05",
    responseDate: "2024-07-08",
    denialReason: "Medical necessity not established for occupational therapy",
    assignedTo: "Patricia Lee, RN",
    priority: "low",
    estimatedReimbursement: 1200,
    lastUpdated: "2024-07-08 11:15",
    timeline: [
      { date: "2024-07-05 14:00", action: "Additional services request submitted", user: "System" },
      { date: "2024-07-05 14:30", action: "Request received by payer", user: "Aetna" },
      {
        date: "2024-07-08 11:15",
        action: "Authorization denied",
        user: "Aetna",
        notes: "Medical necessity not established",
      },
    ],
  },
]

export function AuthorizationTracker({
  showAllPatients = false,
  patientId,
  readOnly = false,
  userRole = "Staff Nurse",
}: AuthorizationTrackerProps) {
  const [authorizations, setAuthorizations] = useState<Authorization[]>(mockAuthorizations)
  const [selectedAuth, setSelectedAuth] = useState<Authorization | null>(null)
  const [activeTab, setActiveTab] = useState("pending")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [isUpdating, setIsUpdating] = useState(false)

  // Filter authorizations based on patient ID if provided
  const filteredAuths = authorizations.filter((auth) => {
    if (patientId && auth.patientId !== patientId) return false
    if (searchTerm && !auth.patientName.toLowerCase().includes(searchTerm.toLowerCase())) return false
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setAuthorizations((prev) =>
        prev.map((auth) => {
          if (auth.id === authId) {
            const updatedAuth = {
              ...auth,
              status: newStatus as Authorization["status"],
              lastUpdated: new Date().toLocaleString(),
              reviewerNotes: notes,
              timeline: [
                ...auth.timeline,
                {
                  date: new Date().toLocaleString(),
                  action: `Status updated to ${newStatus}`,
                  user: userRole,
                  notes: notes,
                },
              ],
            }

            if (newStatus === "approved") {
              updatedAuth.responseDate = new Date().toISOString().split("T")[0]
              updatedAuth.authorizationNumber = `AUTH-${Date.now()}`
            }

            return updatedAuth
          }
          return auth
        }),
      )
    } catch (error) {
      console.error("Failed to update authorization:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const currentAuths = authsByStatus[activeTab as keyof typeof authsByStatus] || []

  return (
    <div className="space-y-6">
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
            {auths.length > 0 ? (
              auths.map((auth) => (
                <Card key={auth.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {auth.patientName}
                          <Badge className={getPriorityColor(auth.priority)}>{auth.priority}</Badge>
                        </CardTitle>
                        <CardDescription>
                          {auth.insuranceProvider} • {auth.diagnosis} • Submitted {auth.submittedDate}
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
                                <span className="capitalize">{auth.authorizationType.replace("_", " ")}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Diagnosis Code:</span>
                                <span className="font-mono">{auth.diagnosisCode}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Assigned To:</span>
                                <span>{auth.assignedTo}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Est. Reimbursement:</span>
                                <span className="font-semibold">${auth.estimatedReimbursement.toLocaleString()}</span>
                              </div>
                              {auth.actualReimbursement && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Actual Reimbursement:</span>
                                  <span className="font-semibold text-green-600">
                                    ${auth.actualReimbursement.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Requested Services */}
                          <div>
                            <h4 className="font-semibold mb-2">Requested Services</h4>
                            <div className="flex flex-wrap gap-2">
                              {auth.requestedServices.map((service) => (
                                <Badge key={service} variant="outline">
                                  {service.replace("_", " ")}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Approved Services (if approved) */}
                          {auth.approvedServices && (
                            <div>
                              <h4 className="font-semibold mb-2">Approved Services</h4>
                              <div className="flex flex-wrap gap-2">
                                {auth.approvedServices.map((service) => (
                                  <Badge key={service} className="bg-green-100 text-green-800">
                                    {service.replace("_", " ")}
                                  </Badge>
                                ))}
                              </div>
                              {auth.approvedVisits && (
                                <p className="text-sm text-gray-600 mt-2">Approved for {auth.approvedVisits} visits</p>
                              )}
                            </div>
                          )}

                          {/* Denial Reason (if denied) */}
                          {auth.denialReason && (
                            <Alert className="border-red-200 bg-red-50">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <AlertTitle className="text-red-800">Denial Reason</AlertTitle>
                              <AlertDescription className="text-red-700">{auth.denialReason}</AlertDescription>
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
