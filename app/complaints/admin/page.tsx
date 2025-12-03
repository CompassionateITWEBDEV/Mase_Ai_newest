"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Shield, AlertTriangle, Eye, Users, Lock, Clock, CheckCircle, UserCheck, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"

interface Complaint {
  id: string
  dbId: number
  type: string
  subject: string
  description: string
  location?: string
  dateOfIncident?: string
  urgency: string
  anonymous: boolean
  submittedBy: string
  submittedByRole?: string
  status: string
  assignedTo: string
  assignedToRole?: string
  submittedDate: string
  lastUpdated: string
  resolution?: string
  resolutionDate?: string
  trackingNumber: string
  investigationNotes: Array<{
    date: string
    note: string
    investigator: string
    actionType?: string
  }>
}

export default function ComplaintsAdmin() {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [activeTab, setActiveTab] = useState("pending")
  const [assignmentDialog, setAssignmentDialog] = useState<Complaint | null>(null)
  const [resolveDialog, setResolveDialog] = useState<Complaint | null>(null)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [resolutionText, setResolutionText] = useState("")
  const [noteText, setNoteText] = useState("")

  // Authorized personnel who can handle complaints
  const authorizedPersonnel = [
    {
      id: "sarah.mitchell",
      name: "Sarah Mitchell",
      role: "HR Director",
      email: "sarah.mitchell@irishtriplets.com",
      canHandle: ["harassment", "discrimination", "retaliation", "ethics"],
    },
    {
      id: "michael.rodriguez",
      name: "Michael Rodriguez",
      role: "HR Manager",
      email: "michael.rodriguez@irishtriplets.com",
      canHandle: ["discrimination", "policy-violation", "other"],
    },
    {
      id: "jennifer.davis",
      name: "Jennifer Davis",
      role: "Safety Officer",
      email: "jennifer.davis@irishtriplets.com",
      canHandle: ["safety"],
    },
    {
      id: "david.wilson",
      name: "David Wilson",
      role: "Compliance Officer",
      email: "david.wilson@irishtriplets.com",
      canHandle: ["ethics", "policy-violation"],
    },
  ]

  // Fetch complaints on mount
  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/complaints")
      const data = await response.json()
      
      if (data.success) {
        setComplaints(data.complaints || [])
      } else {
        console.error("Failed to fetch complaints:", data.message)
      }
    } catch (error) {
      console.error("Error fetching complaints:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>
      case "under-investigation":
        return <Badge className="bg-blue-100 text-blue-800">Under Investigation</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Assignment</Badge>
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High Priority</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low Priority</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{urgency}</Badge>
    }
  }

  const assignComplaint = async (complaintId: number, assigneeId: string) => {
    const assignee = authorizedPersonnel.find((p) => p.id === assigneeId)
    if (!assignee) return

    setIsUpdating(true)
    try {
      const response = await fetch("/api/complaints", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: complaintId,
          action: "assign",
          assignedToName: assignee.name,
          assignedToRole: assignee.role,
          authorName: "Admin",
          authorRole: "HR Admin",
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert(`Complaint assigned to ${assignee.name}`)
        setAssignmentDialog(null)
        fetchComplaints()
      } else {
        alert(`Failed to assign complaint: ${data.message}`)
      }
    } catch (error) {
      console.error("Error assigning complaint:", error)
      alert("Failed to assign complaint")
    } finally {
      setIsUpdating(false)
    }
  }

  const resolveComplaint = async (complaint: Complaint, resolution: string) => {
    if (!resolution.trim()) {
      alert("Please enter a resolution")
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch("/api/complaints", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: complaint.dbId,
          action: "resolve",
          resolution: resolution,
          authorName: "Admin",
          authorRole: "HR Admin",
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert("Complaint resolved successfully")
        setResolveDialog(null)
        setResolutionText("")
        fetchComplaints()
      } else {
        alert(`Failed to resolve complaint: ${data.message}`)
      }
    } catch (error) {
      console.error("Error resolving complaint:", error)
      alert("Failed to resolve complaint")
    } finally {
      setIsUpdating(false)
    }
  }

  const addNote = async (complaintId: number, note: string) => {
    if (!note.trim()) {
      alert("Please enter a note")
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch("/api/complaints", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: complaintId,
          action: "add-note",
          note: note,
          noteType: "investigation",
          authorName: "Admin",
          authorRole: "HR Admin",
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert("Note added successfully")
        setNoteText("")
        fetchComplaints()
      } else {
        alert(`Failed to add note: ${data.message}`)
      }
    } catch (error) {
      console.error("Error adding note:", error)
      alert("Failed to add note")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/complaints">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Complaints
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Complaint Administration</h1>
                <p className="text-gray-600">Manage and route HR complaints with proper access controls</p>
              </div>
            </div>
            <Badge className="bg-red-100 text-red-800">
              <Shield className="h-4 w-4 mr-1" />
              Confidential Access
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Access Control Notice */}
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Lock className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="text-lg font-medium text-red-900">Restricted Access - HR Personnel Only</h3>
                <p className="text-red-800">
                  This area contains confidential complaint information. Access is logged and monitored. Only authorized
                  HR personnel can view and manage complaints.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Refresh Button */}
          <div className="flex justify-between items-center">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="pending">
                Pending ({complaints.filter((c) => c.status === "pending").length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({complaints.filter((c) => c.status === "under-investigation").length})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved ({complaints.filter((c) => c.status === "resolved").length})
              </TabsTrigger>
              <TabsTrigger value="routing">Routing Rules</TabsTrigger>
              <TabsTrigger value="personnel">Authorized Personnel</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={fetchComplaints} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <TabsContent value="pending" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading complaints...</span>
              </div>
            ) : complaints.filter((c) => c.status === "pending").length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">No Pending Complaints</h3>
                  <p className="text-gray-500 mt-2">All complaints have been assigned.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {complaints
                  .filter((c) => c.status === "pending")
                  .map((complaint) => (
                    <Card key={complaint.id} className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                              <Clock className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                              <h3 className="font-medium">{complaint.subject}</h3>
                              <p className="text-sm text-gray-600 capitalize">{complaint.type}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <span>Case #{complaint.id}</span>
                                <span>Filed: {new Date(complaint.submittedDate).toLocaleDateString()}</span>
                                <span>By: {complaint.anonymous ? "Anonymous" : complaint.submittedBy}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getUrgencyBadge(complaint.urgency)}
                            <Button variant="outline" size="sm" onClick={() => setAssignmentDialog(complaint)} disabled={isUpdating}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Assign
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setSelectedComplaint(complaint)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading complaints...</span>
              </div>
            ) : complaints.filter((c) => c.status === "under-investigation").length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">No Active Investigations</h3>
                  <p className="text-gray-500 mt-2">There are no complaints under investigation.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {complaints
                  .filter((c) => c.status === "under-investigation")
                  .map((complaint) => (
                    <Card key={complaint.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <AlertTriangle className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-medium">{complaint.subject}</h3>
                              <p className="text-sm text-gray-600 capitalize">{complaint.type}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <span>Case #{complaint.id}</span>
                                <span>Assigned to: {complaint.assignedTo}</span>
                                <span>Updated: {new Date(complaint.lastUpdated).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getStatusBadge(complaint.status)}
                            {getUrgencyBadge(complaint.urgency)}
                            <Button variant="outline" size="sm" onClick={() => setResolveDialog(complaint)} disabled={isUpdating}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Resolve
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setSelectedComplaint(complaint)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading complaints...</span>
              </div>
            ) : complaints.filter((c) => c.status === "resolved").length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">No Resolved Complaints</h3>
                  <p className="text-gray-500 mt-2">There are no resolved complaints yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {complaints
                  .filter((c) => c.status === "resolved")
                  .map((complaint) => (
                    <Card key={complaint.id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-medium">{complaint.subject}</h3>
                              <p className="text-sm text-gray-600 capitalize">{complaint.type}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <span>Case #{complaint.id}</span>
                                <span>Resolved: {complaint.resolutionDate ? new Date(complaint.resolutionDate).toLocaleDateString() : 'N/A'}</span>
                                <span>By: {complaint.assignedTo}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getStatusBadge(complaint.status)}
                            <Button variant="outline" size="sm" onClick={() => setSelectedComplaint(complaint)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Resolution
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="routing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automatic Routing Rules</CardTitle>
                <CardDescription>
                  Configure how complaints are automatically routed to appropriate personnel based on type and urgency.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Harassment Complaints</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Auto-route to:</strong> HR Director
                      </p>
                      <p>
                        <strong>Notification:</strong> Immediate email + SMS
                      </p>
                      <p>
                        <strong>Escalation:</strong> If not acknowledged in 2 hours
                      </p>
                      <p>
                        <strong>Access Level:</strong> HR Director + Compliance Officer only
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Safety Concerns</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Auto-route to:</strong> Safety Officer
                      </p>
                      <p>
                        <strong>Notification:</strong> Email notification
                      </p>
                      <p>
                        <strong>Escalation:</strong> If high priority, notify HR Director
                      </p>
                      <p>
                        <strong>Access Level:</strong> Safety Officer + HR Manager
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Discrimination</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Auto-route to:</strong> HR Director
                      </p>
                      <p>
                        <strong>Notification:</strong> Immediate email
                      </p>
                      <p>
                        <strong>Escalation:</strong> Notify legal counsel if severe
                      </p>
                      <p>
                        <strong>Access Level:</strong> HR Director only
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Anonymous Complaints</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Auto-route to:</strong> Based on complaint type
                      </p>
                      <p>
                        <strong>Notification:</strong> Secure internal system only
                      </p>
                      <p>
                        <strong>Escalation:</strong> Standard escalation rules apply
                      </p>
                      <p>
                        <strong>Access Level:</strong> Assigned investigator only
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Routing Process</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Complaint submitted through portal or anonymous system</li>
                    <li>System automatically categorizes based on type and keywords</li>
                    <li>Routed to appropriate personnel based on rules above</li>
                    <li>Notifications sent via secure channels (encrypted email/SMS)</li>
                    <li>Acknowledgment required within specified timeframe</li>
                    <li>Escalation triggered if no response or high priority</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personnel" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Authorized Personnel</CardTitle>
                <CardDescription>
                  Personnel authorized to receive and handle complaints. Access is role-based and logged.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {authorizedPersonnel.map((person) => (
                    <div key={person.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{person.name}</h4>
                          <p className="text-sm text-gray-600">{person.role}</p>
                          <p className="text-xs text-gray-500">{person.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Can Handle:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {person.canHandle.map((type) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Access Control & Logging</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• All complaint access is logged with timestamp and user ID</li>
                    <li>• Personnel can only access complaints assigned to them or their role</li>
                    <li>• Anonymous complaints have additional access restrictions</li>
                    <li>• Audit trail maintained for all actions and status changes</li>
                    <li>• Automatic notifications sent for new assignments</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Assignment Dialog */}
        {assignmentDialog && (
          <Dialog open={!!assignmentDialog} onOpenChange={() => setAssignmentDialog(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Complaint</DialogTitle>
                <DialogDescription>Assign complaint {assignmentDialog.id} to authorized personnel</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm">
                    <strong>Type:</strong> <span className="capitalize">{assignmentDialog.type}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Subject:</strong> {assignmentDialog.subject}
                  </p>
                  <p className="text-sm">
                    <strong>Urgency:</strong> <span className="capitalize">{assignmentDialog.urgency}</span>
                  </p>
                </div>

                <div>
                  <Label>Assign to:</Label>
                  <Select onValueChange={(value) => assignComplaint(assignmentDialog.dbId, value)} disabled={isUpdating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select authorized personnel" />
                    </SelectTrigger>
                    <SelectContent>
                      {authorizedPersonnel
                        .filter(
                          (p) =>
                            p.canHandle.includes(assignmentDialog.type.toLowerCase()) || p.canHandle.includes("other"),
                        )
                        .map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name} - {person.role}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {isUpdating && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm">Assigning...</span>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Resolve Dialog */}
        {resolveDialog && (
          <Dialog open={!!resolveDialog} onOpenChange={() => { setResolveDialog(null); setResolutionText(""); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Resolve Complaint</DialogTitle>
                <DialogDescription>Enter the resolution for complaint {resolveDialog.id}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm">
                    <strong>Type:</strong> <span className="capitalize">{resolveDialog.type}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Subject:</strong> {resolveDialog.subject}
                  </p>
                </div>

                <div>
                  <Label htmlFor="resolution">Resolution Details *</Label>
                  <Textarea
                    id="resolution"
                    placeholder="Describe how the complaint was resolved..."
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => { setResolveDialog(null); setResolutionText(""); }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => resolveComplaint(resolveDialog, resolutionText)} 
                    disabled={isUpdating || !resolutionText.trim()}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Resolving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Resolved
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Complaint Detail Modal */}
        {selectedComplaint && (
          <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Complaint Details - {selectedComplaint.id}</span>
                  <div className="flex space-x-2">
                    {getStatusBadge(selectedComplaint.status)}
                    {getUrgencyBadge(selectedComplaint.urgency)}
                  </div>
                </DialogTitle>
                <DialogDescription>
                  <span className="capitalize">{selectedComplaint.type}</span> - Filed on {new Date(selectedComplaint.submittedDate).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Investigation Notes / History */}
                {selectedComplaint.investigationNotes && selectedComplaint.investigationNotes.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Investigation Timeline</h4>
                    <div className="space-y-3">
                      {selectedComplaint.investigationNotes.map((entry, index: number) => (
                        <div key={index} className="flex space-x-3 p-3 bg-gray-50 rounded border">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium">{entry.investigator}</p>
                              <p className="text-xs text-gray-500">{entry.date}</p>
                            </div>
                            <p className="text-sm text-gray-700">{entry.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Complaint Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Submitted By</Label>
                    <p className="text-sm">
                      {selectedComplaint.anonymous ? "Anonymous" : selectedComplaint.submittedBy}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Assigned To</Label>
                    <p className="text-sm">{selectedComplaint.assignedTo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <p className="text-sm">{selectedComplaint.location || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Confidentiality</Label>
                    <p className="text-sm">{selectedComplaint.anonymous ? "Anonymous" : "Confidential"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Complaint Description</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm">{selectedComplaint.description}</p>
                  </div>
                </div>

                {selectedComplaint.resolution && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Resolution</h4>
                    <p className="text-sm text-green-800">{selectedComplaint.resolution}</p>
                    <p className="text-xs text-green-700 mt-2">Resolved on: {selectedComplaint.resolutionDate ? new Date(selectedComplaint.resolutionDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                )}

                {/* Add Note Section */}
                {selectedComplaint.status === "under-investigation" && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Add Investigation Note</h4>
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Enter investigation note..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={3}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addNote(selectedComplaint.dbId, noteText)}
                          disabled={isUpdating || !noteText.trim()}
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Adding...
                            </>
                          ) : (
                            "Add Note"
                          )}
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => setResolveDialog(selectedComplaint)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolve Complaint
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  )
}
