"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Search,
  Mail,
  Phone,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Send,
  LinkIcon,
  Copy,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"

export default function ApplicationTracking() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [positionFilter, setPositionFilter] = useState("all")
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  const [applications, setApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setIsLoading(true)
        // In a real app, this would fetch from an API endpoint
        // const response = await fetch('/api/applications')
        // const data = await response.json()
        // setApplications(data.applications || [])
        
        // For now, just show empty state
        setApplications([])
      } catch (error) {
        console.error('Failed to load applications:', error)
        setApplications([])
      } finally {
        setIsLoading(false)
      }
    }

    loadApplications()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800"
      case "screening":
        return "bg-yellow-100 text-yellow-800"
      case "interview":
        return "bg-purple-100 text-purple-800"
      case "background":
        return "bg-orange-100 text-orange-800"
      case "hired":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDocumentStatus = (status: string) => {
    switch (status) {
      case "uploaded":
        return <Badge className="bg-blue-100 text-blue-800">Uploaded</Badge>
      case "verified":
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "in_progress":
        return <Badge className="bg-orange-100 text-orange-800">In Progress</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      default:
        return <Badge variant="secondary">Not Started</Badge>
    }
  }

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    const matchesPosition = positionFilter === "all" || app.position.includes(positionFilter)
    return matchesSearch && matchesStatus && matchesPosition
  })

  const copyApplicationLink = () => {
    const link = `${window.location.origin}/application`
    navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const sendApplicationLink = (email: string) => {
    // In a real app, this would send an email
    console.log(`Sending application link to ${email}`)
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
                <h1 className="text-2xl font-bold text-gray-900">Application Tracking</h1>
                <p className="text-gray-600">Manage and track job applications</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Share Application Link
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Job Application Link</DialogTitle>
                    <DialogDescription>Share the application link with potential candidates</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="app-link">Application Link</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="app-link"
                          value={`${typeof window !== "undefined" ? window.location.origin : ""}/application`}
                          readOnly
                        />
                        <Button onClick={copyApplicationLink} variant="outline">
                          {linkCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="candidate-email">Send to Email</Label>
                      <div className="flex space-x-2">
                        <Input id="candidate-email" placeholder="candidate@email.com" />
                        <Button>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Link href="/application">
                <Button>New Application</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pipeline">Application Pipeline</TabsTrigger>
            <TabsTrigger value="candidates">All Candidates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-6">
            {/* Pipeline Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                {
                  stage: "New",
                  count: applications.filter((app) => app.status === "new").length,
                  color: "bg-blue-500",
                },
                {
                  stage: "Screening",
                  count: applications.filter((app) => app.status === "screening").length,
                  color: "bg-yellow-500",
                },
                {
                  stage: "Interview",
                  count: applications.filter((app) => app.status === "interview").length,
                  color: "bg-purple-500",
                },
                {
                  stage: "Background",
                  count: applications.filter((app) => app.status === "background").length,
                  color: "bg-orange-500",
                },
                {
                  stage: "Hired",
                  count: applications.filter((app) => app.status === "hired").length,
                  color: "bg-green-500",
                },
              ].map((stage) => (
                <Card key={stage.stage}>
                  <CardContent className="p-4 text-center">
                    <div
                      className={`w-12 h-12 rounded-full ${stage.color} mx-auto mb-2 flex items-center justify-center`}
                    >
                      <span className="text-white font-bold text-lg">{stage.count}</span>
                    </div>
                    <h3 className="font-medium">{stage.stage}</h3>
                    <p className="text-sm text-gray-600">Applications</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pipeline Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {["new", "screening", "interview", "background", "hired"].map((status) => (
                <Card key={status}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium capitalize">
                      {status === "new"
                        ? "New Applications"
                        : status === "screening"
                          ? "Screening"
                          : status === "interview"
                            ? "Interview"
                            : status === "background"
                              ? "Background Check"
                              : "Hired"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {applications
                      .filter((app) => app.status === status)
                      .map((app) => (
                        <div
                          key={app.id}
                          className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-sm">{app.name}</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{app.position}</p>
                          <p className="text-xs text-gray-500">Applied: {app.appliedDate}</p>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="candidates" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by name, email, or application ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="screening">Screening</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="background">Background</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={positionFilter} onValueChange={setPositionFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Positions</SelectItem>
                        <SelectItem value="RN">RN</SelectItem>
                        <SelectItem value="PT">PT</SelectItem>
                        <SelectItem value="OT">OT</SelectItem>
                        <SelectItem value="HHA">HHA</SelectItem>
                        <SelectItem value="MSW">MSW</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Applications List */}
            <div className="space-y-4">
              {filteredApplications.map((app) => (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{app.name}</h3>
                          <p className="text-sm text-gray-600">{app.position}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {app.email}
                            </span>
                            <span className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {app.phone}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Applied: {app.appliedDate}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(app.status)}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => setSelectedApplication(app)}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{applications.length}</p>
                      <p className="text-gray-600 text-sm">Total Applications</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">
                        {applications.filter((app) => app.status === "hired").length}
                      </p>
                      <p className="text-gray-600 text-sm">Hired This Month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">12</p>
                      <p className="text-gray-600 text-sm">Avg. Days to Hire</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <User className="h-8 w-8 text-orange-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">68%</p>
                      <p className="text-gray-600 text-sm">Conversion Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Position Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Applications by Position</CardTitle>
                <CardDescription>Breakdown of applications by job position</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["RN", "PT", "OT", "HHA", "MSW"].map((position) => {
                    const positionApps = applications.filter((app) => app.position.includes(position))
                    const hired = positionApps.filter((app) => app.status === "hired").length
                    const total = positionApps.length
                    const percentage = total > 0 ? Math.round((hired / total) * 100) : 0

                    return (
                      <div key={position} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{position}</span>
                          <span className="text-sm text-gray-600">
                            {hired}/{total} hired ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${total > 0 ? (total / applications.length) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Application Detail Modal */}
        {selectedApplication && (
          <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>
                    {selectedApplication.name} - {selectedApplication.id}
                  </span>
                  <Badge className={getStatusColor(selectedApplication.status)}>
                    {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                  </Badge>
                </DialogTitle>
                <DialogDescription>{selectedApplication.position}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Contact Information</h4>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {selectedApplication.email}
                      </p>
                      <p className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {selectedApplication.phone}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Application Details</h4>
                    <div className="space-y-1 text-sm">
                      <p>Applied: {selectedApplication.appliedDate}</p>
                      <p>Experience: {selectedApplication.experience}</p>
                      <p>Education: {selectedApplication.education}</p>
                    </div>
                  </div>
                </div>

                {/* Documents Status */}
                <div>
                  <h4 className="font-medium mb-3">Document Status</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(selectedApplication.documents).map(([doc, status]) => (
                      <div key={doc} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm capitalize">{doc}</span>
                        {getDocumentStatus(status as string)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="font-medium mb-3">Application Timeline</h4>
                  <div className="space-y-3">
                    {selectedApplication.timeline.map((event: any, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{event.action}</p>
                          <p className="text-xs text-gray-500">
                            {event.date} • {event.user}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 mb-3">{selectedApplication.notes}</p>
                  <Textarea placeholder="Add a note..." />
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Select>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Change Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="screening">Move to Screening</SelectItem>
                        <SelectItem value="interview">Schedule Interview</SelectItem>
                        <SelectItem value="background">Background Check</SelectItem>
                        <SelectItem value="hired">Mark as Hired</SelectItem>
                        <SelectItem value="rejected">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button>Update Status</Button>
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
