"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Shield, AlertTriangle, Eye, Plus, FileText, Lock, Users, MessageSquare, Phone, Loader2, RefreshCw, CheckCircle } from "lucide-react"
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
  witnessesPresent?: boolean
  witnessDetails?: string
  actionsTaken?: string
  desiredOutcome?: string
  investigationNotes: Array<{
    date: string
    note: string
    investigator: string
    actionType?: string
  }>
}

export default function HRComplaints() {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [showNewComplaintForm, setShowNewComplaintForm] = useState(false)
  const [activeTab, setActiveTab] = useState("my-complaints")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState<{ trackingNumber: string; complaintId: string } | null>(null)
  const [trackingInput, setTrackingInput] = useState("")
  const [trackingResult, setTrackingResult] = useState<Complaint | null>(null)
  const [trackingError, setTrackingError] = useState("")
  const [formData, setFormData] = useState({
    type: "",
    subject: "",
    description: "",
    location: "",
    dateOfIncident: "",
    witnessesPresent: false,
    witnessDetails: "",
    actionsTaken: "",
    desiredOutcome: "",
    urgency: "medium",
    anonymous: false,
  })

  const complaintTypes = [
    { value: "harassment", label: "Harassment", description: "Sexual, verbal, or physical harassment" },
    { value: "discrimination", label: "Discrimination", description: "Based on protected characteristics" },
    { value: "safety", label: "Safety Concern", description: "Workplace safety or health hazards" },
    { value: "policy-violation", label: "Policy Violation", description: "Violation of company policies" },
    { value: "retaliation", label: "Retaliation", description: "Retaliation for previous complaints" },
    { value: "ethics", label: "Ethics Violation", description: "Ethical concerns or misconduct" },
    { value: "other", label: "Other", description: "Other workplace concerns" },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitSuccess(null)
    
    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.type,
          subject: formData.subject,
          description: formData.description,
          location: formData.location || undefined,
          dateOfIncident: formData.dateOfIncident || undefined,
          urgency: formData.urgency,
          anonymous: formData.anonymous,
          witnessesPresent: formData.witnessesPresent,
          witnessDetails: formData.witnessDetails || undefined,
          actionsTaken: formData.actionsTaken || undefined,
          desiredOutcome: formData.desiredOutcome || undefined,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSubmitSuccess({
          trackingNumber: data.trackingNumber,
          complaintId: data.complaintId,
        })
        // Reset form
        setFormData({
          type: "",
          subject: "",
          description: "",
          location: "",
          dateOfIncident: "",
          witnessesPresent: false,
          witnessDetails: "",
          actionsTaken: "",
          desiredOutcome: "",
          urgency: "medium",
          anonymous: false,
        })
        setIsAnonymous(false)
        // Refresh complaints list
        fetchComplaints()
      } else {
        alert(`Failed to submit complaint: ${data.message}`)
      }
    } catch (error) {
      console.error("Error submitting complaint:", error)
      alert("Failed to submit complaint. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const trackComplaint = async () => {
    if (!trackingInput.trim()) {
      setTrackingError("Please enter a tracking number")
      return
    }
    
    setTrackingError("")
    setTrackingResult(null)
    
    try {
      const response = await fetch(`/api/complaints?trackingNumber=${encodeURIComponent(trackingInput.trim())}`)
      const data = await response.json()
      
      if (data.success && data.complaints && data.complaints.length > 0) {
        setTrackingResult(data.complaints[0])
      } else {
        setTrackingError("No complaint found with this tracking number")
      }
    } catch (error) {
      console.error("Error tracking complaint:", error)
      setTrackingError("Failed to track complaint. Please try again.")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>
      case "under-investigation":
        return <Badge className="bg-blue-100 text-blue-800">Under Investigation</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
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
                <h1 className="text-2xl font-bold text-gray-900">HR Complaints</h1>
                <p className="text-gray-600">Confidential reporting and complaint management</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setShowNewComplaintForm(true)
                setActiveTab("file-complaint")
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              File Complaint
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Confidentiality Notice */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-lg font-medium text-blue-900">Confidential & Safe Reporting</h3>
                <p className="text-blue-800">
                  All complaints are handled with strict confidentiality. Compassionate Home Health Services prohibits retaliation against
                  anyone who files a complaint in good faith.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="file-complaint">File Complaint</TabsTrigger>
            <TabsTrigger value="my-complaints">My Complaints</TabsTrigger>
            <TabsTrigger value="anonymous-portal">Anonymous Portal</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="file-complaint" className="space-y-6">
            {/* Success Message */}
            {submitSuccess && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Complaint submitted successfully!</strong>
                  <br />
                  Your complaint ID: <strong>{submitSuccess.complaintId}</strong>
                  <br />
                  Tracking Number: <strong>{submitSuccess.trackingNumber}</strong>
                  <br />
                  <span className="text-sm">Save this tracking number to check the status of your complaint.</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Complaint Types Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {complaintTypes.map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    formData.type === type.value ? "ring-2 ring-blue-500 bg-blue-50" : ""
                  }`}
                  onClick={() => setFormData({ ...formData, type: type.value })}
                >
                  <CardContent className="p-4">
                    <div>
                      <h3 className="font-medium">{type.label}</h3>
                      <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Complaint Form */}
            <Card>
              <CardHeader>
                <CardTitle>File a Complaint</CardTitle>
                <CardDescription>
                  Please provide detailed information about your complaint. All information will be kept confidential.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Anonymous Option */}
                  <div className="flex items-center space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Checkbox
                      id="anonymous"
                      checked={formData.anonymous}
                      onCheckedChange={(checked) => {
                        setFormData({ ...formData, anonymous: checked as boolean })
                        setIsAnonymous(checked as boolean)
                      }}
                    />
                    <Label htmlFor="anonymous" className="text-sm">
                      Submit this complaint anonymously
                    </Label>
                    <Lock className="h-4 w-4 text-yellow-600 ml-2" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="subject">Subject/Title *</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Brief description of the issue"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="urgency">Priority Level *</Label>
                      <Select
                        value={formData.urgency}
                        onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Non-urgent matter</SelectItem>
                          <SelectItem value="medium">Medium - Needs attention</SelectItem>
                          <SelectItem value="high">High - Urgent/Safety concern</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Detailed Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Provide a detailed description of the incident or concern. Include specific dates, times, and people involved."
                      rows={5}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="location">Location of Incident</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Where did this occur?"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dateOfIncident">Date of Incident</Label>
                      <Input
                        id="dateOfIncident"
                        type="date"
                        value={formData.dateOfIncident}
                        onChange={(e) => setFormData({ ...formData, dateOfIncident: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="witnesses"
                        checked={formData.witnessesPresent}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, witnessesPresent: checked as boolean })
                        }
                      />
                      <Label htmlFor="witnesses">Were there witnesses present?</Label>
                    </div>

                    {formData.witnessesPresent && (
                      <div>
                        <Label htmlFor="witnessDetails">Witness Information</Label>
                        <Textarea
                          id="witnessDetails"
                          value={formData.witnessDetails}
                          onChange={(e) => setFormData({ ...formData, witnessDetails: e.target.value })}
                          placeholder="Please provide names and contact information of witnesses (if comfortable sharing)"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="actionsTaken">Actions Already Taken</Label>
                    <Textarea
                      id="actionsTaken"
                      value={formData.actionsTaken}
                      onChange={(e) => setFormData({ ...formData, actionsTaken: e.target.value })}
                      placeholder="Have you already tried to address this issue? If so, how?"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="desiredOutcome">Desired Outcome</Label>
                    <Textarea
                      id="desiredOutcome"
                      value={formData.desiredOutcome}
                      onChange={(e) => setFormData({ ...formData, desiredOutcome: e.target.value })}
                      placeholder="What would you like to see happen as a result of this complaint?"
                      rows={3}
                    />
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                      <h4 className="font-medium text-red-900">Important Notice</h4>
                    </div>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>• Filing false complaints may result in disciplinary action</li>
                      <li>• Retaliation against complainants is strictly prohibited</li>
                      <li>• All complaints will be investigated promptly and fairly</li>
                      <li>• You may be contacted for additional information during the investigation</li>
                    </ul>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={() => {
                      setFormData({
                        type: "",
                        subject: "",
                        description: "",
                        location: "",
                        dateOfIncident: "",
                        witnessesPresent: false,
                        witnessDetails: "",
                        actionsTaken: "",
                        desiredOutcome: "",
                        urgency: "medium",
                        anonymous: false,
                      })
                      setSubmitSuccess(null)
                    }}>
                      Clear Form
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !formData.type || !formData.subject || !formData.description}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Complaint"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-complaints" className="space-y-6">
            {/* Refresh Button */}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={fetchComplaints} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* My Complaints */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading complaints...</span>
              </div>
            ) : complaints.filter((c) => !c.anonymous).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">No Complaints Found</h3>
                  <p className="text-gray-500 mt-2">You haven't filed any complaints yet.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setActiveTab("file-complaint")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    File a Complaint
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {complaints
                  .filter((c) => !c.anonymous)
                  .map((complaint) => (
                    <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                              <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                              <h3 className="font-medium">{complaint.subject}</h3>
                              <p className="text-sm text-gray-600 capitalize">{complaint.type}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <span>Case #{complaint.id}</span>
                                <span>Filed: {new Date(complaint.submittedDate).toLocaleDateString()}</span>
                                <span>Updated: {new Date(complaint.lastUpdated).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getStatusBadge(complaint.status)}
                            {getUrgencyBadge(complaint.urgency)}
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

          <TabsContent value="anonymous-portal" className="space-y-6">
            {/* Anonymous Portal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Anonymous Complaint Portal
                </CardTitle>
                <CardDescription>
                  Submit complaints completely anonymously. You will receive a tracking number to check status.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Anonymous Submission Guidelines</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Your identity will not be recorded or tracked</li>
                    <li>• You will receive a unique tracking number</li>
                    <li>• Follow-up communication will be through this portal only</li>
                    <li>• Investigation may be limited without ability to contact you</li>
                  </ul>
                </div>

                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={() => {
                      setIsAnonymous(true)
                      setFormData({ ...formData, anonymous: true })
                      setActiveTab("file-complaint")
                    }}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    File Anonymous Complaint
                  </Button>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-3">Track Anonymous Complaint</h4>
                  <div className="flex space-x-3">
                    <Input 
                      placeholder="Enter your tracking number (e.g., TRK-XXXXXXXX)" 
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                    />
                    <Button variant="outline" onClick={trackComplaint}>
                      Check Status
                    </Button>
                  </div>
                  
                  {trackingError && (
                    <p className="text-red-600 text-sm mt-2">{trackingError}</p>
                  )}
                  
                  {trackingResult && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-2">Complaint Status</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Case ID:</span>
                          <span className="ml-2 font-medium">{trackingResult.id}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className="ml-2">{getStatusBadge(trackingResult.status)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <span className="ml-2 capitalize">{trackingResult.type}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Assigned To:</span>
                          <span className="ml-2">{trackingResult.assignedTo}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">Last Updated:</span>
                          <span className="ml-2">{new Date(trackingResult.lastUpdated).toLocaleString()}</span>
                        </div>
                        {trackingResult.resolution && (
                          <div className="col-span-2 mt-2 p-2 bg-green-50 rounded">
                            <span className="text-green-800 font-medium">Resolution:</span>
                            <p className="text-green-700 mt-1">{trackingResult.resolution}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            {/* Resources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Policies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Anti-Harassment Policy
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Non-Discrimination Policy
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Workplace Safety Guidelines
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Code of Conduct
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>External Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <h4 className="font-medium text-blue-900">EEOC</h4>
                    <p className="text-sm text-blue-800">Equal Employment Opportunity Commission</p>
                    <p className="text-xs text-blue-700">1-800-669-4000</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <h4 className="font-medium text-green-900">OSHA</h4>
                    <p className="text-sm text-green-800">Occupational Safety and Health Administration</p>
                    <p className="text-xs text-green-700">1-800-321-6742</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded border border-purple-200">
                    <h4 className="font-medium text-purple-900">Employee Assistance Program</h4>
                    <p className="text-sm text-purple-800">Confidential counseling and support</p>
                    <p className="text-xs text-purple-700">1-800-555-0199</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">What happens after I file a complaint?</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Your complaint will be reviewed within 24 hours and assigned to an appropriate investigator. You
                    will be contacted to discuss next steps and timeline.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Will my complaint remain confidential?</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    We maintain confidentiality to the extent possible while conducting a thorough investigation.
                    Information is only shared with those who need to know to resolve the issue.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">What if I face retaliation?</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Retaliation is strictly prohibited and will result in disciplinary action. Report any retaliation
                    immediately to HR or use the anonymous portal.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    HR Department
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium">Sarah Mitchell</h4>
                    <p className="text-sm text-gray-600">HR Director</p>
                    <p className="text-sm">sarah.mitchell@irishtriplets.com</p>
                    <p className="text-sm">(248) 555-0101</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Michael Rodriguez</h4>
                    <p className="text-sm text-gray-600">HR Manager</p>
                    <p className="text-sm">michael.rodriguez@irishtriplets.com</p>
                    <p className="text-sm">(248) 555-0102</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="h-5 w-5 mr-2" />
                    Emergency Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-red-50 rounded border border-red-200">
                    <h4 className="font-medium text-red-900">24/7 Hotline</h4>
                    <p className="text-sm text-red-800">For urgent safety concerns</p>
                    <p className="text-lg font-bold text-red-900">(248) 555-HELP</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <h4 className="font-medium text-blue-900">Anonymous Tip Line</h4>
                    <p className="text-sm text-blue-800">24/7 anonymous reporting</p>
                    <p className="text-lg font-bold text-blue-900">(248) 555-TIPS</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Office Hours & Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Business Hours</h4>
                    <div className="space-y-1 text-sm">
                      <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                      <p>Saturday: 9:00 AM - 1:00 PM</p>
                      <p>Sunday: Closed</p>
                      <p className="text-gray-600 mt-2">Emergency line available 24/7</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Location</h4>
                    <div className="space-y-1 text-sm">
                      <p>Compassionate Home Health Services</p>
                      <p>123 Healthcare Drive</p>
                      <p>Suite 200</p>
                      <p>Detroit, MI 48201</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Complaint Type</Label>
                    <p className="text-sm capitalize">{selectedComplaint.type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Assigned To</Label>
                    <p className="text-sm">{selectedComplaint.assignedTo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Date of Incident</Label>
                    <p className="text-sm">{selectedComplaint.dateOfIncident ? new Date(selectedComplaint.dateOfIncident).toLocaleDateString() : "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <p className="text-sm">{selectedComplaint.location || "Not specified"}</p>
                  </div>
                  {selectedComplaint.trackingNumber && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium">Tracking Number</Label>
                      <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded inline-block">{selectedComplaint.trackingNumber}</p>
                    </div>
                  )}
                </div>

                {/* Complaint Details */}
                <div>
                  <h4 className="font-medium mb-3">Complaint Description</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm">{selectedComplaint.description}</p>
                  </div>
                </div>

                {/* Actions Taken */}
                {selectedComplaint.actionsTaken && (
                  <div>
                    <h4 className="font-medium mb-3">Actions Already Taken</h4>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm">{selectedComplaint.actionsTaken}</p>
                    </div>
                  </div>
                )}

                {/* Desired Outcome */}
                {selectedComplaint.desiredOutcome && (
                  <div>
                    <h4 className="font-medium mb-3">Desired Outcome</h4>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm">{selectedComplaint.desiredOutcome}</p>
                    </div>
                  </div>
                )}

                {/* Investigation Timeline */}
                {selectedComplaint.investigationNotes && selectedComplaint.investigationNotes.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Investigation Timeline</h4>
                    <div className="space-y-3">
                      {selectedComplaint.investigationNotes.map((note, index: number) => (
                        <div key={index} className="flex space-x-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium">{note.investigator}</p>
                              <p className="text-xs text-gray-500">{note.date}</p>
                            </div>
                            <p className="text-sm text-gray-700">{note.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution */}
                {selectedComplaint.status === "resolved" && selectedComplaint.resolution && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Resolution</h4>
                    <p className="text-sm text-green-800">{selectedComplaint.resolution}</p>
                    <p className="text-xs text-green-700 mt-2">Resolved on: {selectedComplaint.resolutionDate ? new Date(selectedComplaint.resolutionDate).toLocaleDateString() : "N/A"}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    {selectedComplaint.status === "pending" && (
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Add Comment
                      </Button>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                      <FileText className="h-4 w-4 mr-2" />
                      Print Details
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
