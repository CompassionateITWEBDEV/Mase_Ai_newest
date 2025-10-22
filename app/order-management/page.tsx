"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  ClipboardCheck,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  PenTool,
  Database,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Send,
} from "lucide-react"

interface Order {
  id: string
  patientName: string
  patientId: string
  orderType: string
  physician: string
  dateReceived: string
  status: "pending_qa" | "qa_approved" | "qa_rejected" | "pending_signature" | "signed" | "completed"
  priority: "routine" | "urgent" | "stat"
  qaReviewer?: string
  qaDate?: string
  qaComments?: string
  signatureStatus?: "pending" | "signed" | "expired"
  axxessOrderId: string
  services: string[]
  insuranceType: string
  estimatedValue: number
}

const mockOrders: Order[] = [
  {
    id: "ORD-2024-001",
    patientName: "Sarah Johnson",
    patientId: "PT-12345",
    orderType: "Initial Assessment",
    physician: "Dr. Michael Chen",
    dateReceived: "2024-01-15",
    status: "pending_qa",
    priority: "urgent",
    axxessOrderId: "AX-789123",
    services: ["Skilled Nursing", "Physical Therapy"],
    insuranceType: "Medicare",
    estimatedValue: 2500,
  },
  {
    id: "ORD-2024-002",
    patientName: "Robert Williams",
    patientId: "PT-12346",
    orderType: "Recertification",
    physician: "Dr. Lisa Rodriguez",
    dateReceived: "2024-01-14",
    status: "qa_approved",
    priority: "routine",
    qaReviewer: "Jane Smith, RN",
    qaDate: "2024-01-15",
    qaComments: "All documentation complete. Approved for services.",
    axxessOrderId: "AX-789124",
    services: ["Skilled Nursing", "Home Health Aide"],
    insuranceType: "Medicaid",
    estimatedValue: 1800,
  },
  {
    id: "ORD-2024-003",
    patientName: "Maria Garcia",
    patientId: "PT-12347",
    orderType: "Plan of Care Update",
    physician: "Dr. James Wilson",
    dateReceived: "2024-01-13",
    status: "pending_signature",
    priority: "routine",
    qaReviewer: "Mike Johnson, RN",
    qaDate: "2024-01-14",
    qaComments: "Approved with minor corrections noted.",
    signatureStatus: "pending",
    axxessOrderId: "AX-789125",
    services: ["Occupational Therapy", "Speech Therapy"],
    insuranceType: "Private Insurance",
    estimatedValue: 3200,
  },
  {
    id: "ORD-2024-004",
    patientName: "David Brown",
    patientId: "PT-12348",
    orderType: "Discharge Summary",
    physician: "Dr. Emily Davis",
    dateReceived: "2024-01-12",
    status: "signed",
    priority: "routine",
    qaReviewer: "Sarah Lee, RN",
    qaDate: "2024-01-13",
    qaComments: "Complete and accurate documentation.",
    signatureStatus: "signed",
    axxessOrderId: "AX-789126",
    services: ["Skilled Nursing"],
    insuranceType: "Medicare",
    estimatedValue: 1200,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending_qa":
      return "bg-yellow-100 text-yellow-800"
    case "qa_approved":
      return "bg-green-100 text-green-800"
    case "qa_rejected":
      return "bg-red-100 text-red-800"
    case "pending_signature":
      return "bg-blue-100 text-blue-800"
    case "signed":
      return "bg-purple-100 text-purple-800"
    case "completed":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "stat":
      return "bg-red-500 text-white"
    case "urgent":
      return "bg-orange-500 text-white"
    case "routine":
      return "bg-green-500 text-white"
    default:
      return "bg-gray-500 text-white"
  }
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(mockOrders)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Filter orders based on search and filters
  useEffect(() => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.physician.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((order) => order.priority === priorityFilter)
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter, priorityFilter])

  const handleAxxessSync = async () => {
    setIsLoading(true)
    setSyncProgress(0)

    // Simulate sync progress
    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsLoading(false)
          return 100
        }
        return prev + 10
      })
    }, 200)

    // Simulate API call
    try {
      const response = await fetch("/api/axxess/orders/sync", {
        method: "POST",
      })
      // Handle response
    } catch (error) {
      console.error("Sync failed:", error)
    }
  }

  const handleQAAction = async (orderId: string, action: "approve" | "reject", comments: string) => {
    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: action === "approve" ? ("qa_approved" as const) : ("qa_rejected" as const),
          qaReviewer: "Current User", // In real app, get from auth
          qaDate: new Date().toISOString().split("T")[0],
          qaComments: comments,
        }
      }
      return order
    })
    setOrders(updatedOrders)
  }

  const handleSendForSignature = async (orderId: string) => {
    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        return {
          ...order,
          status: "pending_signature" as const,
          signatureStatus: "pending" as const,
        }
      }
      return order
    })
    setOrders(updatedOrders)

    // Send to signature system
    try {
      const response = await fetch("/api/signatures/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          documentType: "healthcare_order",
          signerEmail: "physician@example.com", // Get from order
        }),
      })
    } catch (error) {
      console.error("Failed to send for signature:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_qa":
        return <Clock className="h-4 w-4" />
      case "qa_approved":
        return <CheckCircle className="h-4 w-4" />
      case "qa_rejected":
        return <AlertCircle className="h-4 w-4" />
      case "pending_signature":
        return <PenTool className="h-4 w-4" />
      case "signed":
        return <FileText className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const statusCounts = {
    pending_qa: orders.filter((o) => o.status === "pending_qa").length,
    qa_approved: orders.filter((o) => o.status === "qa_approved").length,
    pending_signature: orders.filter((o) => o.status === "pending_signature").length,
    signed: orders.filter((o) => o.status === "signed").length,
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">Manage healthcare orders from Axxess sync to digital signatures</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAxxessSync} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            <Database className="h-4 w-4 mr-2" />
            {isLoading ? "Syncing..." : "Sync with Axxess"}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Sync Progress */}
      {isLoading && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            <div className="space-y-2">
              <div>Syncing orders from Axxess...</div>
              <Progress value={syncProgress} className="w-full" />
              <div className="text-sm text-gray-500">{syncProgress}% complete</div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending QA</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending_qa}</div>
            <p className="text-xs text-gray-500">Awaiting quality review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QA Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.qa_approved}</div>
            <p className="text-xs text-gray-500">Ready for next step</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Signature</CardTitle>
            <PenTool className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.pending_signature}</div>
            <p className="text-xs text-gray-500">Awaiting physician signature</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{statusCounts.signed}</div>
            <p className="text-xs text-gray-500">Signed and processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Orders</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Patient name, ID, or physician..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status-filter">Status Filter</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Statuses</option>
                <option value="pending_qa">Pending QA</option>
                <option value="qa_approved">QA Approved</option>
                <option value="qa_rejected">QA Rejected</option>
                <option value="pending_signature">Pending Signature</option>
                <option value="signed">Signed</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <Label htmlFor="priority-filter">Priority Filter</Label>
              <select
                id="priority-filter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Priorities</option>
                <option value="stat">STAT</option>
                <option value="urgent">Urgent</option>
                <option value="routine">Routine</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setPriorityFilter("all")
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Healthcare Orders ({filteredOrders.length})
          </CardTitle>
          <CardDescription>Orders synced from Axxess with QA review and signature workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Physician</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Received</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.patientName}</div>
                        <div className="text-sm text-gray-500">{order.patientId}</div>
                      </div>
                    </TableCell>
                    <TableCell>{order.orderType}</TableCell>
                    <TableCell>{order.physician}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(order.priority)}>{order.priority.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{order.dateReceived}</TableCell>
                    <TableCell>${order.estimatedValue.toLocaleString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {order.status === "pending_qa" && (
                            <>
                              <DropdownMenuItem onClick={() => handleQAAction(order.id, "approve", "Approved")}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve QA
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQAAction(order.id, "reject", "Rejected")}>
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Reject QA
                              </DropdownMenuItem>
                            </>
                          )}
                          {order.status === "qa_approved" && (
                            <DropdownMenuItem onClick={() => handleSendForSignature(order.id)}>
                              <Send className="mr-2 h-4 w-4" />
                              Send for Signature
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Order Details - {selectedOrder.id}
              </DialogTitle>
              <DialogDescription>Complete order information and workflow status</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="qa">QA Review</TabsTrigger>
                <TabsTrigger value="signature">Signature</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Patient Information</Label>
                    <div className="mt-1">
                      <div className="font-medium">{selectedOrder.patientName}</div>
                      <div className="text-sm text-gray-500">ID: {selectedOrder.patientId}</div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Physician</Label>
                    <div className="mt-1 font-medium">{selectedOrder.physician}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Order Type</Label>
                    <div className="mt-1 font-medium">{selectedOrder.orderType}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Priority</Label>
                    <div className="mt-1">
                      <Badge className={getPriorityColor(selectedOrder.priority)}>
                        {selectedOrder.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Services</Label>
                    <div className="mt-1">
                      {selectedOrder.services.map((service, index) => (
                        <Badge key={index} variant="outline" className="mr-1 mb-1">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Insurance</Label>
                    <div className="mt-1 font-medium">{selectedOrder.insuranceType}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Estimated Value</Label>
                    <div className="mt-1 font-medium">${selectedOrder.estimatedValue.toLocaleString()}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Axxess Order ID</Label>
                    <div className="mt-1 font-medium">{selectedOrder.axxessOrderId}</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="qa" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">QA Status</Label>
                    <div className="mt-1 flex items-center gap-2">
                      {getStatusIcon(selectedOrder.status)}
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  {selectedOrder.qaReviewer && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">QA Reviewer</Label>
                      <div className="mt-1 font-medium">{selectedOrder.qaReviewer}</div>
                    </div>
                  )}
                  {selectedOrder.qaDate && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">QA Review Date</Label>
                      <div className="mt-1 font-medium">{selectedOrder.qaDate}</div>
                    </div>
                  )}
                  {selectedOrder.qaComments && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">QA Comments</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">{selectedOrder.qaComments}</div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="signature" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Signature Status</Label>
                    <div className="mt-1">
                      {selectedOrder.signatureStatus ? (
                        <Badge
                          className={
                            selectedOrder.signatureStatus === "signed"
                              ? "bg-green-100 text-green-800"
                              : selectedOrder.signatureStatus === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {selectedOrder.signatureStatus.toUpperCase()}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not Sent</Badge>
                      )}
                    </div>
                  </div>
                  {selectedOrder.status === "qa_approved" && !selectedOrder.signatureStatus && (
                    <Button onClick={() => handleSendForSignature(selectedOrder.id)} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Send for Digital Signature
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md">
                    <Database className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">Order Received from Axxess</div>
                      <div className="text-sm text-gray-500">{selectedOrder.dateReceived}</div>
                    </div>
                  </div>
                  {selectedOrder.qaDate && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-md">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-medium">QA Review Completed</div>
                        <div className="text-sm text-gray-500">
                          {selectedOrder.qaDate} by {selectedOrder.qaReviewer}
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedOrder.signatureStatus === "signed" && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-md">
                      <PenTool className="h-4 w-4 text-purple-600" />
                      <div>
                        <div className="font-medium">Document Signed</div>
                        <div className="text-sm text-gray-500">Digitally signed by physician</div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
