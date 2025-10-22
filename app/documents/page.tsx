"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Clock, Download, Eye } from "lucide-react"
import Link from "next/link"

export default function DocumentVerification() {
  const [selectedStaff, setSelectedStaff] = useState("")

  const staffMembers = [
    { id: "1", name: "Sarah Johnson", role: "RN", department: "Home Care" },
    { id: "2", name: "Michael Chen", role: "PT", department: "Rehabilitation" },
    { id: "3", name: "Emily Davis", role: "OT", department: "Rehabilitation" },
    { id: "4", name: "Robert Wilson", role: "HHA", department: "Home Care" },
    { id: "5", name: "Jennifer Smith", role: "RN", department: "Home Care" },
    { id: "6", name: "David Brown", role: "MSW", department: "Social Services" },
  ]

  const requiredDocuments = [
    {
      name: "Professional License",
      description: "Current professional license for your role",
      required: true,
      category: "credentials",
    },
    {
      name: "Degree/Diploma",
      description: "Educational credentials",
      required: true,
      category: "education",
    },
    {
      name: "Resume/CV",
      description: "Current resume or curriculum vitae",
      required: true,
      category: "general",
    },
    {
      name: "CPR Certification",
      description: "Current CPR/ACLS certification",
      required: true,
      category: "certifications",
    },
    {
      name: "TB Test Results",
      description: "Tuberculosis screening results",
      required: true,
      category: "health",
    },
    {
      name: "Driver's License",
      description: "Valid driver's license",
      required: true,
      category: "identification",
    },
    {
      name: "Social Security Card",
      description: "Social Security Administration issued card",
      required: true,
      category: "identification",
    },
    {
      name: "Car Insurance",
      description: "Current automobile insurance certificate",
      required: true,
      category: "insurance",
    },
    {
      name: "Auto Insurance",
      description: "Current auto insurance certificate",
      required: true,
      category: "insurance",
    },
    {
      name: "I-9 Form",
      description: "Employment eligibility verification",
      required: true,
      category: "employment",
    },
    {
      name: "W-4 Form",
      description: "Employee withholding certificate",
      required: true,
      category: "tax",
    },
    {
      name: "Background Check Consent",
      description: "Signed background check authorization",
      required: true,
      category: "background",
    },
    {
      name: "HIPAA Agreement",
      description: "Signed HIPAA privacy agreement",
      required: true,
      category: "compliance",
    },
    {
      name: "Confidentiality Agreement",
      description: "Signed confidentiality statement",
      required: true,
      category: "compliance",
    },
  ]

  const documentStatus = {
    "1": {
      // Sarah Johnson
      "Professional License": { status: "verified", uploadDate: "2024-01-10", expiryDate: "2025-06-15" },
      "Degree/Diploma": { status: "verified", uploadDate: "2024-01-10", expiryDate: null },
      "Resume/CV": { status: "verified", uploadDate: "2024-01-10", expiryDate: null },
      "CPR Certification": { status: "expired", uploadDate: "2024-01-10", expiryDate: "2024-01-15" },
      "TB Test Results": { status: "pending", uploadDate: "2024-01-12", expiryDate: "2025-01-12" },
      "Driver's License": { status: "verified", uploadDate: "2024-01-10", expiryDate: "2026-03-20" },
      "Social Security Card": { status: "verified", uploadDate: "2024-01-10", expiryDate: null },
      "Car Insurance": { status: "verified", uploadDate: "2024-01-10", expiryDate: "2024-12-31" },
      "Auto Insurance": { status: "verified", uploadDate: "2024-01-10", expiryDate: "2024-12-31" },
      "I-9 Form": { status: "verified", uploadDate: "2024-01-10", expiryDate: null },
      "W-4 Form": { status: "verified", uploadDate: "2024-01-10", expiryDate: null },
      "Background Check Consent": { status: "verified", uploadDate: "2024-01-10", expiryDate: null },
      "HIPAA Agreement": { status: "verified", uploadDate: "2024-01-10", expiryDate: null },
      "Confidentiality Agreement": { status: "verified", uploadDate: "2024-01-10", expiryDate: null },
    },
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "expired":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      default:
        return <Badge variant="secondary">Not Uploaded</Badge>
    }
  }

  const staffDocuments = selectedStaff ? documentStatus[selectedStaff as keyof typeof documentStatus] || {} : {}

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Document Verification</h1>
              <p className="text-gray-600">Manage and verify staff credentials and documents</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="verification" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="verification">Document Verification</TabsTrigger>
            <TabsTrigger value="upload">Upload Documents</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="verification" className="space-y-6">
            {/* Staff Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Staff Member</CardTitle>
                <CardDescription>Choose a staff member to view their document status</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger className="w-full md:w-1/2">
                    <SelectValue placeholder="Choose staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} - {staff.role} ({staff.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Document Status */}
            {selectedStaff && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {requiredDocuments.map((doc) => {
                  const docStatus = staffDocuments[doc.name] || { status: "missing" }

                  return (
                    <Card key={doc.name} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(docStatus.status)}
                            <div>
                              <h3 className="font-medium">{doc.name}</h3>
                              <p className="text-sm text-gray-600">{doc.description}</p>
                            </div>
                          </div>
                          {doc.required && (
                            <Badge variant="outline" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2">
                          {getStatusBadge(docStatus.status)}

                          {docStatus.uploadDate && (
                            <p className="text-xs text-gray-500">Uploaded: {docStatus.uploadDate}</p>
                          )}

                          {docStatus.expiryDate && (
                            <p className="text-xs text-gray-500">
                              Expires: {docStatus.expiryDate}
                              {new Date(docStatus.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                                <span className="text-red-500 ml-2">(Expires Soon)</span>
                              )}
                            </p>
                          )}
                        </div>

                        {docStatus.status !== "missing" && (
                          <div className="flex space-x-2 mt-4">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            {docStatus.status === "pending" && <Button size="sm">Verify</Button>}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            {/* Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>Upload required documents for verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="staff-select-upload">Select Staff Member</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} - {staff.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="document-type">Document Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {requiredDocuments.map((doc) => (
                        <SelectItem key={doc.name} value={doc.name}>
                          {doc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expiry-date">Expiry Date (if applicable)</Label>
                  <Input type="date" id="expiry-date" />
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Upload Document</h3>
                  <p className="text-gray-600 mb-4">Drag and drop your file here, or click to browse</p>
                  <Button>Choose File</Button>
                  <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, JPG, PNG (Max 10MB)</p>
                </div>

                <Button className="w-full">Upload Document</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            {/* Compliance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">142</p>
                      <p className="text-gray-600 text-sm">Verified Documents</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">8</p>
                      <p className="text-gray-600 text-sm">Pending Review</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">5</p>
                      <p className="text-gray-600 text-sm">Expired/Missing</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Expiring Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Documents Expiring Soon</CardTitle>
                <CardDescription>Documents that will expire within the next 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { staff: "Sarah Johnson", document: "CPR Certification", expiry: "2024-01-15", days: 2 },
                    { staff: "Michael Chen", document: "Professional License", expiry: "2024-02-01", days: 18 },
                    { staff: "Emily Davis", document: "Auto Insurance", expiry: "2024-02-10", days: 27 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium">{item.staff}</p>
                          <p className="text-sm text-gray-600">{item.document}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">Expires in {item.days} days</p>
                        <p className="text-xs text-gray-500">{item.expiry}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compliance by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance by Category</CardTitle>
                <CardDescription>Document compliance status by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { category: "Professional Credentials", total: 24, verified: 22, pending: 1, expired: 1 },
                    { category: "Health & Safety", total: 18, verified: 16, pending: 2, expired: 0 },
                    { category: "Employment Forms", total: 12, verified: 12, pending: 0, expired: 0 },
                    { category: "Compliance Agreements", total: 15, verified: 13, pending: 2, expired: 0 },
                  ].map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{category.category}</h4>
                        <span className="text-sm text-gray-600">
                          {category.verified}/{category.total} verified
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(category.verified / category.total) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{category.verified} verified</span>
                        <span>{category.pending} pending</span>
                        <span>{category.expired} expired</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
