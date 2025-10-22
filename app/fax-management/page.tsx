"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  FileText,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Building2,
  Users,
  Zap,
  RefreshCw,
} from "lucide-react"

interface FaxItem {
  id: string
  from: string
  to: string
  timestamp: string
  category: "referral" | "compliance" | "corporate" | "enrollment" | "credentialing" | "general"
  status: "processed" | "pending" | "failed" | "manual_review" | "auto_accepted" | "auto_denied"
  priority: "low" | "medium" | "high" | "urgent"
  pages: number
  fileSize: string
  assignedTo?: string
  department?: string
  ocrText?: string
  processingResult?: any
}

export default function FaxManagementPage() {
  const [faxes, setFaxes] = useState<FaxItem[]>([])
  const [filteredFaxes, setFilteredFaxes] = useState<FaxItem[]>([])
  const [selectedFax, setSelectedFax] = useState<FaxItem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFaxes()
  }, [])

  useEffect(() => {
    filterFaxes()
  }, [faxes, searchTerm, categoryFilter, statusFilter])

  const loadFaxes = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockFaxes: FaxItem[] = [
        {
          id: "FAX-001",
          from: "+1234567890",
          to: "+1987654321",
          timestamp: "2024-01-22T10:30:00Z",
          category: "referral",
          status: "auto_accepted",
          priority: "high",
          pages: 3,
          fileSize: "2.1 MB",
          ocrText: "Patient referral for John Smith, Medicare Part A, Skilled nursing required...",
          processingResult: {
            decision: "accept",
            reason: "Meets all acceptance criteria",
            patientCreated: true,
          },
        },
        {
          id: "FAX-002",
          from: "+1555123456",
          to: "+1987654321",
          timestamp: "2024-01-22T09:15:00Z",
          category: "compliance",
          status: "pending",
          priority: "medium",
          pages: 5,
          fileSize: "3.4 MB",
          department: "Compliance Team",
          assignedTo: "Jane Doe",
          ocrText: "Compliance audit notification scheduled for February 15, 2024...",
        },
        {
          id: "FAX-003",
          from: "+1444987654",
          to: "+1987654321",
          timestamp: "2024-01-22T08:45:00Z",
          category: "referral",
          status: "auto_denied",
          priority: "high",
          pages: 2,
          fileSize: "1.8 MB",
          ocrText: "Patient referral for palliative care services...",
          processingResult: {
            decision: "deny",
            reason: "Excluded diagnosis (palliative care)",
            denialFaxSent: true,
          },
        },
        {
          id: "FAX-004",
          from: "+1333456789",
          to: "+1987654321",
          timestamp: "2024-01-22T07:20:00Z",
          category: "corporate",
          status: "pending",
          priority: "medium",
          pages: 4,
          fileSize: "2.7 MB",
          department: "Corporate Office",
          assignedTo: "Mike Johnson",
          ocrText: "Corporate policy update regarding overtime compensation...",
        },
        {
          id: "FAX-005",
          from: "+1222789456",
          to: "+1987654321",
          timestamp: "2024-01-22T06:30:00Z",
          category: "credentialing",
          status: "manual_review",
          priority: "medium",
          pages: 6,
          fileSize: "4.2 MB",
          department: "HR/Credentialing",
          assignedTo: "Sarah Wilson",
          ocrText: "Physician credentialing documents for Dr. Smith...",
        },
        {
          id: "FAX-006",
          from: "+1111654321",
          to: "+1987654321",
          timestamp: "2024-01-22T05:45:00Z",
          category: "enrollment",
          status: "processed",
          priority: "high",
          pages: 3,
          fileSize: "2.3 MB",
          department: "Admissions",
          assignedTo: "Lisa Brown",
          ocrText: "Patient enrollment form for Mary Johnson...",
        },
      ]

      setFaxes(mockFaxes)
    } catch (error) {
      console.error("Failed to load faxes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterFaxes = () => {
    let filtered = faxes

    if (searchTerm) {
      filtered = filtered.filter(
        (fax) =>
          fax.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fax.from.includes(searchTerm) ||
          fax.ocrText?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((fax) => fax.category === categoryFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((fax) => fax.status === statusFilter)
    }

    setFilteredFaxes(filtered)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "auto_accepted":
      case "processed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "auto_denied":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "manual_review":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "auto_accepted":
        return <Badge className="bg-green-100 text-green-800">Auto Accepted</Badge>
      case "auto_denied":
        return <Badge className="bg-red-100 text-red-800">Auto Denied</Badge>
      case "processed":
        return <Badge className="bg-blue-100 text-blue-800">Processed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "manual_review":
        return <Badge className="bg-orange-100 text-orange-800">Manual Review</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "referral":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "compliance":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "corporate":
        return <Building2 className="h-4 w-4 text-purple-500" />
      case "enrollment":
        return <Users className="h-4 w-4 text-green-500" />
      case "credentialing":
        return <CheckCircle className="h-4 w-4 text-indigo-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const categorizedFaxes = {
    referral: filteredFaxes.filter((f) => f.category === "referral"),
    compliance: filteredFaxes.filter((f) => f.category === "compliance"),
    corporate: filteredFaxes.filter((f) => f.category === "corporate"),
    enrollment: filteredFaxes.filter((f) => f.category === "enrollment"),
    credentialing: filteredFaxes.filter((f) => f.category === "credentialing"),
    general: filteredFaxes.filter((f) => f.category === "general"),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Fax Management</h1>
                <p className="text-gray-600">Monitor and manage incoming fax processing</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={loadFaxes} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{faxes.length}</p>
                  <p className="text-gray-600 text-sm">Total Faxes</p>
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
                    {faxes.filter((f) => f.status === "auto_accepted" || f.status === "processed").length}
                  </p>
                  <p className="text-gray-600 text-sm">Processed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{faxes.filter((f) => f.status === "pending").length}</p>
                  <p className="text-gray-600 text-sm">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{faxes.filter((f) => f.status === "manual_review").length}</p>
                  <p className="text-gray-600 text-sm">Manual Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round(
                      (faxes.filter((f) => f.status === "auto_accepted" || f.status === "auto_denied").length /
                        faxes.length) *
                        100,
                    )}
                    %
                  </p>
                  <p className="text-gray-600 text-sm">Auto-Processed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search faxes by ID, phone number, or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="referral">Referrals</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="enrollment">Enrollment</SelectItem>
                  <SelectItem value="credentialing">Credentialing</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="auto_accepted">Auto Accepted</SelectItem>
                  <SelectItem value="auto_denied">Auto Denied</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="manual_review">Manual Review</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Fax Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">All ({filteredFaxes.length})</TabsTrigger>
            <TabsTrigger value="referral">Referrals ({categorizedFaxes.referral.length})</TabsTrigger>
            <TabsTrigger value="compliance">Compliance ({categorizedFaxes.compliance.length})</TabsTrigger>
            <TabsTrigger value="corporate">Corporate ({categorizedFaxes.corporate.length})</TabsTrigger>
            <TabsTrigger value="enrollment">Enrollment ({categorizedFaxes.enrollment.length})</TabsTrigger>
            <TabsTrigger value="credentialing">Credentialing ({categorizedFaxes.credentialing.length})</TabsTrigger>
            <TabsTrigger value="general">General ({categorizedFaxes.general.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Loading faxes...</p>
              </div>
            ) : filteredFaxes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No faxes found matching your criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFaxes.map((fax) => (
                  <Card key={fax.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {getCategoryIcon(fax.category)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold">{fax.id}</h3>
                              <Badge variant="outline" className="capitalize">
                                {fax.category}
                              </Badge>
                              {getStatusBadge(fax.status)}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>
                                From: {fax.from} • {formatTimestamp(fax.timestamp)}
                              </div>
                              <div>
                                {fax.pages} pages • {fax.fileSize}
                              </div>
                              {fax.assignedTo && (
                                <div>
                                  Assigned to: {fax.assignedTo} ({fax.department})
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedFax(fax)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Fax Details - {fax.id}</DialogTitle>
                                <DialogDescription>
                                  Received from {fax.from} on {formatTimestamp(fax.timestamp)}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Fax Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <div>ID: {fax.id}</div>
                                      <div>From: {fax.from}</div>
                                      <div>To: {fax.to}</div>
                                      <div>Pages: {fax.pages}</div>
                                      <div>File Size: {fax.fileSize}</div>
                                      <div>Category: {fax.category}</div>
                                      <div>Priority: {fax.priority}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Processing Status</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center space-x-2">
                                        {getStatusIcon(fax.status)}
                                        <span>{fax.status.replace("_", " ")}</span>
                                      </div>
                                      {fax.assignedTo && <div>Assigned: {fax.assignedTo}</div>}
                                      {fax.department && <div>Department: {fax.department}</div>}
                                      {fax.processingResult && (
                                        <div>
                                          <div>Decision: {fax.processingResult.decision}</div>
                                          <div>Reason: {fax.processingResult.reason}</div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {fax.ocrText && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Extracted Text (OCR)</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                                      {fax.ocrText}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Individual category tabs */}
          {Object.entries(categorizedFaxes).map(([category, faxList]) => (
            <TabsContent key={category} value={category} className="space-y-4">
              {faxList.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No {category} faxes found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {faxList.map((fax) => (
                    <Card key={fax.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              {getCategoryIcon(fax.category)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold">{fax.id}</h3>
                                {getStatusBadge(fax.status)}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div>
                                  From: {fax.from} • {formatTimestamp(fax.timestamp)}
                                </div>
                                <div>
                                  {fax.pages} pages • {fax.fileSize}
                                </div>
                                {fax.assignedTo && (
                                  <div>
                                    Assigned to: {fax.assignedTo} ({fax.department})
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedFax(fax)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Fax Details - {fax.id}</DialogTitle>
                                  <DialogDescription>
                                    Received from {fax.from} on {formatTimestamp(fax.timestamp)}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold mb-2">Fax Information</h4>
                                      <div className="space-y-2 text-sm">
                                        <div>ID: {fax.id}</div>
                                        <div>From: {fax.from}</div>
                                        <div>To: {fax.to}</div>
                                        <div>Pages: {fax.pages}</div>
                                        <div>File Size: {fax.fileSize}</div>
                                        <div>Category: {fax.category}</div>
                                        <div>Priority: {fax.priority}</div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2">Processing Status</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex items-center space-x-2">
                                          {getStatusIcon(fax.status)}
                                          <span>{fax.status.replace("_", " ")}</span>
                                        </div>
                                        {fax.assignedTo && <div>Assigned: {fax.assignedTo}</div>}
                                        {fax.department && <div>Department: {fax.department}</div>}
                                        {fax.processingResult && (
                                          <div>
                                            <div>Decision: {fax.processingResult.decision}</div>
                                            <div>Reason: {fax.processingResult.reason}</div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {fax.ocrText && (
                                    <div>
                                      <h4 className="font-semibold mb-2">Extracted Text (OCR)</h4>
                                      <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                                        {fax.ocrText}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  )
}
