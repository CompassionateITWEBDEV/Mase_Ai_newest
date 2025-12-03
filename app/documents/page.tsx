"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  XCircle,
  Shield,
  Users,
  Calendar,
  MoreHorizontal,
  Check,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface StaffMember {
  id: string
  name: string
  role: string
  department: string
  email?: string
}

interface StaffDocument {
  id: string
  staff_id: string
  staff_name: string
  document_type: string
  document_name: string
  file_url: string
  file_name: string
  file_size: number
  status: "pending" | "verified" | "rejected" | "expired"
  upload_date: string
  expiry_date: string | null
  verified_by: string | null
  verified_at: string | null
  rejection_reason: string | null
  category: string
  notes: string | null
  days_until_expiry?: number
}

interface DocumentStats {
  total: number
  verified: number
  pending: number
  expired: number
  rejected: number
}

  const requiredDocuments = [
  { name: "Professional License", description: "Current professional license for your role", category: "credentials", hasExpiry: true },
  { name: "Degree/Diploma", description: "Educational credentials", category: "education", hasExpiry: false },
  { name: "Resume/CV", description: "Current resume or curriculum vitae", category: "general", hasExpiry: false },
  { name: "CPR Certification", description: "Current CPR/ACLS certification", category: "certifications", hasExpiry: true },
  { name: "TB Test Results", description: "Tuberculosis screening results", category: "health", hasExpiry: true },
  { name: "Driver's License", description: "Valid driver's license", category: "identification", hasExpiry: true },
  { name: "Social Security Card", description: "Social Security Administration issued card", category: "identification", hasExpiry: false },
  { name: "Auto Insurance", description: "Current automobile insurance certificate", category: "insurance", hasExpiry: true },
  { name: "I-9 Form", description: "Employment eligibility verification", category: "employment", hasExpiry: false },
  { name: "W-4 Form", description: "Employee withholding certificate", category: "tax", hasExpiry: false },
  { name: "Background Check Consent", description: "Signed background check authorization", category: "background", hasExpiry: false },
  { name: "HIPAA Agreement", description: "Signed HIPAA privacy agreement", category: "compliance", hasExpiry: false },
  { name: "Confidentiality Agreement", description: "Signed confidentiality statement", category: "compliance", hasExpiry: false },
]

export default function DocumentVerification() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)

  // State
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [documents, setDocuments] = useState<StaffDocument[]>([])
  const [expiringDocuments, setExpiringDocuments] = useState<StaffDocument[]>([])
  const [stats, setStats] = useState<DocumentStats>({ total: 0, verified: 0, pending: 0, expired: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dataSource, setDataSource] = useState<string>("")
  const [setupMessage, setSetupMessage] = useState<string>("")

  // Filters
  const [selectedStaff, setSelectedStaff] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Upload form
  const [uploadStaffId, setUploadStaffId] = useState("")
  const [uploadDocType, setUploadDocType] = useState("")
  const [uploadExpiryDate, setUploadExpiryDate] = useState("")
  const [uploadNotes, setUploadNotes] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<StaffDocument | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    setMounted(true)
    fetchStaff()
    fetchDocuments()
    fetchExpiringDocuments()
  }, [])

  useEffect(() => {
    if (selectedStaff) {
      fetchDocuments(selectedStaff)
    }
  }, [selectedStaff])

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/documents/staff")
      const data = await response.json()
      if (data.success) {
        setStaffMembers(data.staff)
        setDataSource(data.source)
        if (data.message) {
          setSetupMessage(data.message)
        }
      }
    } catch (error) {
      console.error("Error fetching staff:", error)
    }
  }

  const fetchDocuments = async (staffId?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (staffId) params.append("staffId", staffId)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (categoryFilter !== "all") params.append("category", categoryFilter)

      const response = await fetch(`/api/documents?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setDocuments(data.documents)
        setStats(data.stats)
        setDataSource(data.source)
        if (data.message) {
          setSetupMessage(data.message)
        }
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchExpiringDocuments = async () => {
    try {
      const response = await fetch("/api/documents/expiring?days=30")
      const data = await response.json()
      if (data.success) {
        setExpiringDocuments(data.documents)
      }
    } catch (error) {
      console.error("Error fetching expiring documents:", error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 10MB",
          variant: "destructive",
        })
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!uploadStaffId || !uploadDocType || !selectedFile) {
      toast({
        title: "Missing Information",
        description: "Please select staff member, document type, and file",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const selectedStaffMember = staffMembers.find((s) => s.id === uploadStaffId)
      const formData = new FormData()
      formData.append("staffId", uploadStaffId)
      formData.append("staffName", selectedStaffMember?.name || "Unknown")
      formData.append("documentType", uploadDocType)
      formData.append("category", requiredDocuments.find((d) => d.name === uploadDocType)?.category || "general")
      if (uploadExpiryDate) formData.append("expiryDate", uploadExpiryDate)
      if (uploadNotes) formData.append("notes", uploadNotes)
      formData.append("file", selectedFile)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Upload Successful",
          description: `${uploadDocType} has been uploaded for review`,
        })
        // Reset form
        setUploadStaffId("")
        setUploadDocType("")
        setUploadExpiryDate("")
        setUploadNotes("")
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        // Refresh documents
        fetchDocuments(selectedStaff)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleVerify = async () => {
    if (!selectedDocument) return

    try {
      const response = await fetch("/api/documents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedDocument.id,
          action: "verify",
          verifiedBy: "Current User", // In production, get from auth
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Document Verified",
          description: `${selectedDocument.document_type} has been verified`,
        })
        setVerifyDialogOpen(false)
        fetchDocuments(selectedStaff)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify document",
        variant: "destructive",
      })
    }
  }

  const handleReject = async () => {
    if (!selectedDocument || !rejectionReason) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/documents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedDocument.id,
          action: "reject",
          verifiedBy: "Current User",
          rejectionReason,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Document Rejected",
          description: `${selectedDocument.document_type} has been rejected`,
        })
        setRejectDialogOpen(false)
        setRejectionReason("")
        fetchDocuments(selectedStaff)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject document",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (doc: StaffDocument) => {
    if (!confirm(`Are you sure you want to delete ${doc.document_type}?`)) return

    try {
      const response = await fetch(`/api/documents?id=${doc.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Document Deleted",
          description: `${doc.document_type} has been deleted`,
        })
        fetchDocuments(selectedStaff)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  // Download document function
  const handleDownload = async (doc: StaffDocument) => {
    try {
      if (!doc.file_url) {
        toast({
          title: "No File Available",
          description: "This document doesn't have a file attached.",
          variant: "destructive",
        })
        return
      }

      // Check if it's a placeholder URL
      if (doc.file_url.startsWith("local-storage/") || doc.file_url.startsWith("pending-upload/")) {
        toast({
          title: "File Not Available",
          description: "The file was not uploaded to storage. Please re-upload the document.",
          variant: "destructive",
        })
        return
      }

      // Get fresh download URL from API
      const response = await fetch(`/api/documents/download?id=${doc.id}`)
      const data = await response.json()

      if (data.success && data.downloadUrl) {
        // Create download link
        const link = document.createElement("a")
        link.href = data.downloadUrl
        link.target = "_blank"
        link.download = data.fileName || doc.file_name || `${doc.document_type}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Download Started",
          description: `Downloading ${doc.file_name || doc.document_type}...`,
        })
      } else {
        // Fallback to direct URL
        const link = document.createElement("a")
        link.href = doc.file_url
        link.target = "_blank"
        link.download = doc.file_name || `${doc.document_type}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Download Started",
          description: `Downloading ${doc.file_name || doc.document_type}...`,
        })
      }
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download Failed",
        description: "Could not download the file. Please try again.",
        variant: "destructive",
      })
    }
  }

  // View document function
  const handleViewFile = (doc: StaffDocument) => {
    if (!doc.file_url) {
      toast({
        title: "No File Available",
        description: "This document doesn't have a file attached.",
        variant: "destructive",
      })
      return
    }

    if (doc.file_url.startsWith("local-storage/") || doc.file_url.startsWith("pending-upload/")) {
      toast({
        title: "File Not Available",
        description: "The file was not uploaded to storage. Please re-upload the document.",
        variant: "destructive",
      })
      return
    }

    // Open file in new tab
    window.open(doc.file_url, "_blank")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "expired":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />
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
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">Not Uploaded</Badge>
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        doc.document_type.toLowerCase().includes(search) ||
        doc.staff_name.toLowerCase().includes(search) ||
        doc.category.toLowerCase().includes(search)
      )
    }
    return true
  })

  // Get staff documents map for verification tab
  const getStaffDocumentMap = () => {
    const docMap: Record<string, StaffDocument> = {}
    documents.forEach((doc) => {
      docMap[doc.document_type] = doc
    })
    return docMap
  }

  const staffDocuments = getStaffDocumentMap()

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
              </Button>
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
              <p className="text-gray-600">Manage and verify staff credentials and documents</p>
            </div>
            </div>
            <Button onClick={() => fetchDocuments(selectedStaff)} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Database Setup Alert */}
        {(dataSource === "empty" || setupMessage) && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800">Database Setup Required</h3>
                <p className="text-sm text-amber-700 mt-1">
                  {setupMessage || "The staff documents tables need to be created in Supabase."}
                </p>
                <p className="text-sm text-amber-600 mt-2">
                  Run the SQL script: <code className="bg-amber-100 px-1 rounded">scripts/setup-staff-documents-tables.sql</code> in your Supabase SQL Editor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Data Source Indicator */}
        {dataSource === "database" && stats.total > 0 && (
          <div className="mb-4 flex items-center text-sm text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            Connected to database - showing real data
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-gray-600 text-sm">Total Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.verified}</p>
                  <p className="text-gray-600 text-sm">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-gray-600 text-sm">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.expired}</p>
                  <p className="text-gray-600 text-sm">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                  <p className="text-gray-600 text-sm">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="verification" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="verification">Document Verification</TabsTrigger>
            <TabsTrigger value="upload">Upload Documents</TabsTrigger>
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Tracking</TabsTrigger>
          </TabsList>

          {/* Document Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
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

            {selectedStaff && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {requiredDocuments.map((doc) => {
                  const docStatus = staffDocuments[doc.name]

                  return (
                    <Card key={doc.name} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {docStatus ? getStatusIcon(docStatus.status) : <FileText className="h-5 w-5 text-gray-400" />}
                            <div>
                              <h3 className="font-medium">{doc.name}</h3>
                              <p className="text-sm text-gray-600">{doc.description}</p>
                            </div>
                          </div>
                            <Badge variant="outline" className="text-xs">
                              Required
                            </Badge>
                        </div>

                        <div className="space-y-2">
                          {docStatus ? getStatusBadge(docStatus.status) : <Badge variant="secondary">Not Uploaded</Badge>}

                          {docStatus?.upload_date && (
                            <p className="text-xs text-gray-500">
                              Uploaded: {new Date(docStatus.upload_date).toLocaleDateString()}
                            </p>
                          )}

                          {docStatus?.expiry_date && (
                            <p className="text-xs text-gray-500">
                              Expires: {new Date(docStatus.expiry_date).toLocaleDateString()}
                              {new Date(docStatus.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                                <span className="text-red-500 ml-2">(Expires Soon)</span>
                              )}
                            </p>
                          )}

                          {docStatus?.rejection_reason && (
                            <p className="text-xs text-red-500">Reason: {docStatus.rejection_reason}</p>
                          )}
                        </div>

                        {docStatus && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDocument(docStatus)
                                setViewDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownload(docStatus)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            {docStatus.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    setSelectedDocument(docStatus)
                                    setVerifyDialogOpen(true)
                                  }}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Verify
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedDocument(docStatus)
                                    setRejectDialogOpen(true)
                                  }}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Upload Documents Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>Upload required documents for verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="staff-select-upload">Select Staff Member *</Label>
                    <Select value={uploadStaffId} onValueChange={setUploadStaffId}>
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
                    <Label htmlFor="document-type">Document Type *</Label>
                    <Select value={uploadDocType} onValueChange={setUploadDocType}>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry-date">Expiry Date (if applicable)</Label>
                    <Input
                      type="date"
                      id="expiry-date"
                      value={uploadExpiryDate}
                      onChange={(e) => setUploadExpiryDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      placeholder="Optional notes..."
                      value={uploadNotes}
                      onChange={(e) => setUploadNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {selectedFile ? selectedFile.name : "Upload Document"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {selectedFile
                      ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                      : "Drag and drop your file here, or click to browse"}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileSelect}
                  />
                  {!selectedFile && (
                    <Button type="button" variant="outline">
                      Choose File
                    </Button>
                  )}
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                        if (fileInputRef.current) fileInputRef.current.value = ""
                      }}
                    >
                      Remove File
                    </Button>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)</p>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-center text-gray-600">Uploading... {uploadProgress}%</p>
                  </div>
                )}

                <Button className="w-full" onClick={handleUpload} disabled={uploading || !selectedFile}>
                  {uploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Documents Tab */}
          <TabsContent value="all" className="space-y-6">
              <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                    <CardTitle>All Documents</CardTitle>
                    <CardDescription>View and manage all uploaded documents</CardDescription>
                    </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search documents..."
                        className="pl-10 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>
                  </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No documents found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{doc.document_type}</span>
                            </div>
                          </TableCell>
                          <TableCell>{doc.staff_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {doc.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(doc.status)}</TableCell>
                          <TableCell>{new Date(doc.upload_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDocument(doc)
                                    setViewDialogOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                                {doc.status === "pending" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedDocument(doc)
                                        setVerifyDialogOpen(true)
                                      }}
                                      className="text-green-600"
                                    >
                                      <Check className="h-4 w-4 mr-2" />
                                      Verify
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedDocument(doc)
                                        setRejectDialogOpen(true)
                                      }}
                                      className="text-red-600"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDelete(doc)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                </CardContent>
              </Card>
          </TabsContent>

          {/* Compliance Tracking Tab */}
          <TabsContent value="compliance" className="space-y-6">
            {/* Expiring Documents Alert */}
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-800">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Documents Expiring Soon
                </CardTitle>
                <CardDescription>Documents that will expire within the next 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {expiringDocuments.length === 0 ? (
                  <p className="text-gray-600">No documents expiring soon</p>
                ) : (
                <div className="space-y-4">
                    {expiringDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                      <div className="flex items-center space-x-3">
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                        <div>
                            <p className="font-medium">{doc.staff_name}</p>
                            <p className="text-sm text-gray-600">{doc.document_type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                          <p className="text-sm font-medium text-orange-600">
                            Expires in {doc.days_until_expiry} days
                          </p>
                          <p className="text-xs text-gray-500">
                            {doc.expiry_date && new Date(doc.expiry_date).toLocaleDateString()}
                          </p>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compliance by Staff */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Staff Compliance Status
                </CardTitle>
                <CardDescription>Document compliance status by staff member</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffMembers.slice(0, 5).map((staff) => {
                    const staffDocs = documents.filter((d) => d.staff_id === staff.id)
                    const verified = staffDocs.filter((d) => d.status === "verified").length
                    const total = requiredDocuments.length
                    const percentage = total > 0 ? Math.round((verified / total) * 100) : 0

                    return (
                      <div key={staff.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{staff.name}</h4>
                            <p className="text-sm text-gray-500">
                              {staff.role} - {staff.department}
                            </p>
                          </div>
                          <span className="text-sm font-medium">
                            {verified}/{total} verified ({percentage}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Compliance by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Compliance by Category
                </CardTitle>
                <CardDescription>Document compliance status by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["credentials", "certifications", "health", "compliance", "identification"].map((category) => {
                    const categoryDocs = documents.filter((d) => d.category === category)
                    const verified = categoryDocs.filter((d) => d.status === "verified").length
                    const pending = categoryDocs.filter((d) => d.status === "pending").length
                    const expired = categoryDocs.filter((d) => d.status === "expired").length
                    const total = categoryDocs.length || 1
                    const percentage = Math.round((verified / total) * 100)

                    return (
                      <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                          <h4 className="font-medium capitalize">{category}</h4>
                        <span className="text-sm text-gray-600">
                            {verified}/{total} verified
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                          <span>{verified} verified</span>
                          <span>{pending} pending</span>
                          <span>{expired} expired</span>
                      </div>
                    </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* View Document Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription>View document information and status</DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Document Type</Label>
                  <p className="font-medium">{selectedDocument.document_type}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Staff Member</Label>
                  <p className="font-medium">{selectedDocument.staff_name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedDocument.status)}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Category</Label>
                  <p className="font-medium capitalize">{selectedDocument.category}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Upload Date</Label>
                  <p className="font-medium">{new Date(selectedDocument.upload_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Expiry Date</Label>
                  <p className="font-medium">
                    {selectedDocument.expiry_date
                      ? new Date(selectedDocument.expiry_date).toLocaleDateString()
                      : "No expiry"}
                  </p>
                </div>
                {selectedDocument.verified_by && (
                  <>
                    <div>
                      <Label className="text-gray-500">Verified By</Label>
                      <p className="font-medium">{selectedDocument.verified_by}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Verified At</Label>
                      <p className="font-medium">
                        {selectedDocument.verified_at
                          ? new Date(selectedDocument.verified_at).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                  </>
                )}
              </div>
              {selectedDocument.rejection_reason && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <Label className="text-red-700">Rejection Reason</Label>
                  <p className="text-red-600">{selectedDocument.rejection_reason}</p>
                </div>
              )}
              {selectedDocument.notes && (
                <div>
                  <Label className="text-gray-500">Notes</Label>
                  <p className="text-gray-700">{selectedDocument.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleDownload(selectedDocument)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Document
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleViewFile(selectedDocument)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View File
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify Document Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Document</DialogTitle>
            <DialogDescription>
              Confirm that you have reviewed and verified this document.
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedDocument.document_type}</p>
                <p className="text-sm text-gray-600">{selectedDocument.staff_name}</p>
              </div>
              <p className="text-sm text-gray-600">
                By verifying this document, you confirm that it meets all requirements and is authentic.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleVerify}>
              <Check className="h-4 w-4 mr-2" />
              Verify Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Document Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this document.</DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedDocument.document_type}</p>
                <p className="text-sm text-gray-600">{selectedDocument.staff_name}</p>
              </div>
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Please explain why this document is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              <X className="h-4 w-4 mr-2" />
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
