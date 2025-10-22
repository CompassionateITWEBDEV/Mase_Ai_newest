"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, FileText, Send, Eye, Download, Clock, CheckCircle, AlertCircle, PenTool, Plus } from "lucide-react"
import Link from "next/link"

export default function DigitalSignatures() {
  const [signatureRequests] = useState([
    {
      id: "SIG-001",
      documentName: "Employment Agreement - Sarah Johnson",
      recipient: "sarah.johnson@email.com",
      status: "completed",
      sentDate: "2024-01-15",
      completedDate: "2024-01-15",
      template: "Employment Agreement",
      signers: [
        { name: "Sarah Johnson", email: "sarah.johnson@email.com", status: "signed" },
        { name: "HR Manager", email: "hr@serenityrehab.com", status: "signed" },
      ],
    },
    {
      id: "SIG-002",
      documentName: "Confidentiality Agreement - Michael Chen",
      recipient: "michael.chen@email.com",
      status: "pending",
      sentDate: "2024-01-14",
      template: "Confidentiality Agreement",
      signers: [
        { name: "Michael Chen", email: "michael.chen@email.com", status: "pending" },
        { name: "HR Manager", email: "hr@serenityrehab.com", status: "waiting" },
      ],
    },
    {
      id: "SIG-003",
      documentName: "HIPAA Agreement - Emily Davis",
      recipient: "emily.davis@email.com",
      status: "viewed",
      sentDate: "2024-01-13",
      template: "HIPAA Agreement",
      signers: [
        { name: "Emily Davis", email: "emily.davis@email.com", status: "viewed" },
        { name: "HR Manager", email: "hr@serenityrehab.com", status: "waiting" },
      ],
    },
  ])

  const documentTemplates = [
    {
      id: "TEMP-001",
      name: "Employment Agreement",
      description: "Standard employment contract template",
      fields: ["Employee Name", "Position", "Start Date", "Salary", "Department"],
      lastModified: "2024-01-10",
    },
    {
      id: "TEMP-002",
      name: "Confidentiality Agreement",
      description: "Non-disclosure and confidentiality agreement",
      fields: ["Employee Name", "Department", "Effective Date"],
      lastModified: "2024-01-08",
    },
    {
      id: "TEMP-003",
      name: "HIPAA Agreement",
      description: "HIPAA privacy and security agreement",
      fields: ["Employee Name", "Position", "Training Date"],
      lastModified: "2024-01-05",
    },
    {
      id: "TEMP-004",
      name: "Performance Evaluation",
      description: "Annual performance review document",
      fields: ["Employee Name", "Supervisor", "Review Period", "Goals"],
      lastModified: "2024-01-03",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "viewed":
        return "bg-blue-100 text-blue-800"
      case "expired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSignerStatusIcon = (status: string) => {
    switch (status) {
      case "signed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "viewed":
        return <Eye className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
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
                <h1 className="text-2xl font-bold text-gray-900">Digital Signatures</h1>
                <p className="text-gray-600">Manage document signatures and approvals</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Send for Signature
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="signature-requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="signature-requests">Signature Requests</TabsTrigger>
            <TabsTrigger value="templates">Document Templates</TabsTrigger>
            <TabsTrigger value="create-request">Create Request</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="signature-requests" className="space-y-6">
            {/* Signature Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <PenTool className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{signatureRequests.length}</p>
                      <p className="text-gray-600 text-sm">Total Requests</p>
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
                        {signatureRequests.filter((req) => req.status === "completed").length}
                      </p>
                      <p className="text-gray-600 text-sm">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">
                        {signatureRequests.filter((req) => req.status === "pending").length}
                      </p>
                      <p className="text-gray-600 text-sm">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Eye className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">
                        {signatureRequests.filter((req) => req.status === "viewed").length}
                      </p>
                      <p className="text-gray-600 text-sm">Viewed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Signature Requests List */}
            <div className="space-y-4">
              {signatureRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{request.documentName}</h3>
                          <p className="text-sm text-gray-600">Template: {request.template}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span>Sent: {request.sentDate}</span>
                            {request.completedDate && <span>Completed: {request.completedDate}</span>}
                            <span>To: {request.recipient}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Signers Status */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Signers:</h4>
                      <div className="space-y-2">
                        {request.signers.map((signer, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getSignerStatusIcon(signer.status)}
                              <span className="text-sm">{signer.name}</span>
                              <span className="text-xs text-gray-500">({signer.email})</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {signer.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            {/* Document Templates */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Document Templates</CardTitle>
                    <CardDescription>Manage reusable document templates for signatures</CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documentTemplates.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{template.name}</h4>
                            <Button variant="outline" size="sm">
                              Use Template
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600">{template.description}</p>
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Fields:</p>
                            <div className="flex flex-wrap gap-1">
                              {template.fields.map((field, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">Last modified: {template.lastModified}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-request" className="space-y-6">
            {/* Create Signature Request */}
            <Card>
              <CardHeader>
                <CardTitle>Create Signature Request</CardTitle>
                <CardDescription>Send a document for digital signature</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="document-title">Document Title</Label>
                    <Input id="document-title" placeholder="Enter document title" />
                  </div>
                  <div>
                    <Label htmlFor="template-select">Template</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Message to Recipients</Label>
                  <Textarea id="message" placeholder="Add a personal message for the signers..." rows={3} />
                </div>

                {/* Signers Section */}
                <div>
                  <Label className="text-base font-medium">Signers</Label>
                  <div className="space-y-3 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded-lg">
                      <Input placeholder="Signer name" />
                      <Input placeholder="Email address" type="email" />
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          <SelectItem value="hr">HR Manager</SelectItem>
                          <SelectItem value="witness">Witness</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Signer
                    </Button>
                  </div>
                </div>

                {/* Document Fields */}
                <div>
                  <Label className="text-base font-medium">Document Fields</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <div>
                      <Label htmlFor="employee-name">Employee Name</Label>
                      <Input id="employee-name" placeholder="Auto-filled from signer info" />
                    </div>
                    <div>
                      <Label htmlFor="position">Position</Label>
                      <Input id="position" placeholder="Enter position" />
                    </div>
                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input id="start-date" type="date" />
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home-health">Home Health</SelectItem>
                          <SelectItem value="rehabilitation">Rehabilitation Services</SelectItem>
                          <SelectItem value="administration">Administration</SelectItem>
                          <SelectItem value="hr">Human Resources</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">Request Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry-days">Expires in (days)</Label>
                      <Select defaultValue="30">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="reminder-frequency">Reminder Frequency</Label>
                      <Select defaultValue="3">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Daily</SelectItem>
                          <SelectItem value="3">Every 3 days</SelectItem>
                          <SelectItem value="7">Weekly</SelectItem>
                          <SelectItem value="0">No reminders</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button>
                    <Send className="h-4 w-4 mr-2" />
                    Send for Signature
                  </Button>
                  <Button variant="outline">Save as Draft</Button>
                  <Button variant="outline">Preview Document</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Signature Completion Rate</CardTitle>
                  <CardDescription>Percentage of documents signed successfully</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-green-600">87%</p>
                    <p className="text-gray-600 mt-2">Average completion rate</p>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Employment Agreements:</span>
                      <span className="font-medium">95%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Confidentiality Agreements:</span>
                      <span className="font-medium">92%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>HIPAA Agreements:</span>
                      <span className="font-medium">78%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Signing Time</CardTitle>
                  <CardDescription>Time from send to completion</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-blue-600">2.3</p>
                    <p className="text-gray-600 mt-2">Days average</p>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Fastest completion:</span>
                      <span className="font-medium">4 hours</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Most common:</span>
                      <span className="font-medium">1-2 days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Longest completion:</span>
                      <span className="font-medium">14 days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Statistics</CardTitle>
                <CardDescription>Signature request activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">24</p>
                    <p className="text-sm text-gray-600">Requests Sent</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">21</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">2</p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">1</p>
                    <p className="text-sm text-gray-600">Expired</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
