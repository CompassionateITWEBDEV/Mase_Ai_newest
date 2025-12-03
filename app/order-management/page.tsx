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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
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
  X,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

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
  chartId?: string
  qaStatus?: "passed" | "needs_review" | "failed" | "pending"
  qualityScore?: number
  qaCompletedAt?: string
}

export default function OrderManagement() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [qaDialogOpen, setQaDialogOpen] = useState(false)
  const [qaAction, setQaAction] = useState<"approve" | "reject">("approve")
  const [qaComments, setQaComments] = useState("")
  const [qaReviewerName, setQaReviewerName] = useState("")
  const [currentOrderId, setCurrentOrderId] = useState<string>("")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  // Fetch orders from database
  const fetchOrdersFromDB = async () => {
    try {
      const response = await fetch("/api/healthcare-orders")
      const data = await response.json()
      
      if (data.success && data.data) {
        setOrders(data.data)
        return data.data
      }
      return []
    } catch (error) {
      console.error("Error fetching orders:", error)
      return []
    }
  }

  // Load real data on component mount
  useEffect(() => {
    const fetchInitialOrders = async () => {
      setInitialLoading(true)
      try {
        // First try to fetch from database
        const dbOrders = await fetchOrdersFromDB()
        
        if (dbOrders.length > 0) {
          setInitialLoading(false)
          return
        }

        // If no orders in DB, fetch from Axxess mock
        const response = await fetch("/api/axxess/orders/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            includeBillingData: true,
            includeFinancialData: true,
            includeComplianceData: true,
          }),
        })

        const data = await response.json()

        if (data.success && data.orders) {
          // Convert Axxess orders to app orders format
          const convertedOrders: Order[] = data.orders.map((axxessOrder: any) => ({
            id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            patientName: axxessOrder.patientName,
            patientId: axxessOrder.patientId,
            orderType: axxessOrder.orderType,
            physician: axxessOrder.physicianName,
            dateReceived: axxessOrder.dateReceived,
            status: "pending_qa" as const,
            priority: axxessOrder.priority,
            axxessOrderId: axxessOrder.orderId,
            services: axxessOrder.services,
            insuranceType: axxessOrder.insuranceType,
            estimatedValue: axxessOrder.estimatedValue,
          }))

          setOrders(convertedOrders)
        }
      } catch (error) {
        console.error("Failed to fetch initial orders:", error)
        toast({
          title: "Failed to Load Orders",
          description: "Could not fetch orders from Axxess. Please try syncing manually.",
          variant: "destructive",
        })
      } finally {
        setInitialLoading(false)
      }
    }

    fetchInitialOrders()
  }, [toast])

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
          return 100
        }
        return prev + 10
      })
    }, 200)

    try {
      const response = await fetch("/api/axxess/orders/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          includeBillingData: true,
          includeFinancialData: true,
          includeComplianceData: true,
        }),
      })
      
      const data = await response.json()
      
      if (data.success && data.orders) {
        // Convert Axxess orders to app orders format
        const convertedOrders: Order[] = data.orders.map((axxessOrder: any, index: number) => ({
          id: `ORD-${Date.now()}-${index}`,
          patientName: axxessOrder.patientName,
          patientId: axxessOrder.patientId,
          orderType: axxessOrder.orderType,
          physician: axxessOrder.physicianName,
          dateReceived: axxessOrder.dateReceived,
          status: "pending_qa" as const,
          priority: axxessOrder.priority,
          axxessOrderId: axxessOrder.orderId,
          services: axxessOrder.services,
          insuranceType: axxessOrder.insuranceType,
          estimatedValue: axxessOrder.estimatedValue,
        }))

        // Save to database
        try {
          const saveResponse = await fetch("/api/healthcare-orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orders: convertedOrders }),
          })
          const saveData = await saveResponse.json()
          
          if (saveData.success) {
            // Refresh from database
            await fetchOrdersFromDB()
            toast({
              title: "✓ Sync & Save Successful",
              description: `Synced ${data.ordersCount} orders and saved to database`,
            })
          } else {
            // Still show orders even if save failed
            setOrders([...convertedOrders, ...orders])
            toast({
              title: "Sync Successful (Local Only)",
              description: `Synced ${data.ordersCount} orders. Database save failed - run setup SQL.`,
              variant: "destructive",
            })
          }
        } catch (saveError) {
          // If save fails, still show orders locally
          setOrders([...convertedOrders, ...orders])
          toast({
            title: "Sync Successful (Local Only)",
            description: `Synced ${data.ordersCount} orders. Run setup-healthcare-orders-table.sql for persistence.`,
          })
        }
      } else {
        toast({
          title: "Sync Failed",
          description: data.message || "Failed to sync orders",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Sync failed:", error)
      toast({
        title: "Sync Error",
        description: "Failed to connect to Axxess API",
        variant: "destructive",
      })
    } finally {
      clearInterval(interval)
      setSyncProgress(100)
      setTimeout(() => {
        setIsLoading(false)
        setSyncProgress(0)
      }, 500)
    }
  }

  const handleQAAction = async (orderId: string, action: "approve" | "reject", comments: string) => {
    try {
      const newStatus = action === "approve" ? "qa_approved" : "qa_rejected"
      const qaDate = new Date().toISOString()
      
      // Update in database
      const response = await fetch("/api/healthcare-orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          qaReviewer: qaReviewerName || "QA Reviewer",
          qaDate,
          qaComments: comments,
        }),
      })

      const data = await response.json()

      // Update local state
      const updatedOrders = orders.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: newStatus as Order["status"],
            qaReviewer: qaReviewerName || "QA Reviewer",
            qaDate: qaDate.split("T")[0],
            qaComments: comments,
          }
        }
        return order
      })
      setOrders(updatedOrders)
      
      toast({
        title: action === "approve" ? "✓ Order Approved" : "Order Rejected",
        description: `Order ${orderId} has been ${action === "approve" ? "approved" : "rejected"}${data.success ? " and saved to database" : ""}`,
      })
      
      setQaDialogOpen(false)
      setQaComments("")
      setQaReviewerName("")
    } catch (error) {
      console.error("QA action failed:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  const openQADialog = (orderId: string, action: "approve" | "reject") => {
    setCurrentOrderId(orderId)
    setQaAction(action)
    setQaDialogOpen(true)
  }

  const openEditDialog = (order: Order) => {
    setEditingOrder({ ...order })
    setEditDialogOpen(true)
  }

  const handleUpdateOrder = () => {
    if (!editingOrder) return

    try {
      const updatedOrders = orders.map((order) => {
        if (order.id === editingOrder.id) {
          return editingOrder
        }
        return order
      })
      setOrders(updatedOrders)

      toast({
        title: "Order Updated",
        description: `Order ${editingOrder.id} has been updated successfully`,
      })

      setEditDialogOpen(false)
      setEditingOrder(null)
    } catch (error) {
      console.error("Update failed:", error)
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      })
    }
  }

  const handleSendForSignature = async (orderId: string) => {
    try {
      const order = orders.find((o) => o.id === orderId)
      if (!order) return

      // Generate physician email from name
      const physicianEmail = `${order.physician.toLowerCase().replace(/\s+/g, ".")}@serenityrehab.com`

      // Send to signature system with orderId for tracking
      const response = await fetch("/api/signatures/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentName: `Healthcare Order - ${order.id} - ${order.patientName}`,
          recipients: [
            {
              name: order.physician,
              email: physicianEmail,
              role: "signer",
            },
          ],
          templateId: "TEMP-003", // Healthcare Order template
          orderId: orderId, // Link signature to order
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Update order in database with signature request ID
        await fetch("/api/healthcare-orders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderId,
            status: "pending_signature",
            signatureStatus: "pending",
            signatureRequestId: data.data?.requestId,
          }),
        })

        // Update local state
        const updatedOrders = orders.map((o) => {
          if (o.id === orderId) {
            return {
              ...o,
              status: "pending_signature" as const,
              signatureStatus: "pending" as const,
            }
          }
          return o
        })
        setOrders(updatedOrders)

        toast({
          title: "✓ Sent for Signature",
          description: `Order ${orderId} sent to ${order.physician}. Go to Signatures page to sign.`,
        })
      } else {
        throw new Error(data.error || "Failed to send for signature")
      }
    } catch (error) {
      console.error("Failed to send for signature:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send order for signature",
        variant: "destructive",
      })
    }
  }

  const handleExportReport = async () => {
    try {
      const csvData = [
        ["Order ID", "Patient Name", "Patient ID", "Order Type", "Physician", "Priority", "Status", "Date Received", "Value"],
        ...filteredOrders.map((order) => [
          order.id,
          order.patientName,
          order.patientId,
          order.orderType,
          order.physician,
          order.priority,
          order.status,
          order.dateReceived,
          `$${order.estimatedValue}`,
        ]),
      ]

      const csvContent = csvData.map((row) => row.join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `order-report-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: `Exported ${filteredOrders.length} orders to CSV`,
      })
    } catch (error) {
      console.error("Export failed:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export report",
        variant: "destructive",
      })
    }
  }

  // Download single order as PDF with signature
  const handleDownloadOrderPDF = async (order: Order) => {
    try {
      // Fetch signature data if order has been signed
      let signatureData = null
      let signerName = null
      let signedAt = null

      if (order.status === "signed" || order.status === "pending_signature" || order.signatureStatus === "signed") {
        try {
          // Fetch signature from the dedicated API
          const response = await fetch(`/api/signatures/by-order?orderId=${order.id}`)
          const data = await response.json()
          
          if (data.success && data.data) {
            signatureData = data.data.signatureData
            signerName = data.data.signerName
            signedAt = data.data.signedAt
          }
        } catch (err) {
          console.log("Could not fetch signature data:", err)
        }
      }

      // Create HTML content for the PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Order ${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #1e40af; }
            .date { color: #6b7280; }
            .section { margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 8px; }
            .row { display: flex; margin-bottom: 10px; }
            .label { font-weight: bold; width: 180px; color: #374151; }
            .value { color: #111827; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-approved { background: #d1fae5; color: #065f46; }
            .status-rejected { background: #fee2e2; color: #991b1b; }
            .status-signed { background: #ddd6fe; color: #5b21b6; }
            .services { margin-top: 10px; }
            .service-item { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 4px; margin: 2px; font-size: 12px; }
            .signature-section { margin-top: 40px; padding: 20px; border: 2px solid #1e40af; border-radius: 8px; background: #f0f9ff; }
            .signature-title { color: #1e40af; font-size: 18px; font-weight: bold; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
            .signature-box { background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 15px; text-align: center; }
            .signature-image { max-height: 80px; max-width: 300px; }
            .signature-info { margin-top: 10px; font-size: 12px; color: #374151; }
            .signature-line { border-top: 1px solid #374151; margin-top: 60px; padding-top: 5px; text-align: center; font-size: 12px; color: #6b7280; }
            .not-signed { color: #9ca3af; font-style: italic; padding: 30px; }
            .verified-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin-left: 10px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; text-align: center; }
            @media print { body { padding: 20px; } .signature-section { break-inside: avoid; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🏥 Healthcare Order</div>
            <div class="date">Generated: ${new Date().toLocaleDateString()}</div>
          </div>
          
          <h1>Order Summary ${signatureData ? '<span class="verified-badge">✓ SIGNED</span>' : ''}</h1>
          
          <div class="section">
            <div class="row">
              <span class="label">Order ID:</span>
              <span class="value">${order.id}</span>
            </div>
            <div class="row">
              <span class="label">Axxess Order ID:</span>
              <span class="value">${order.axxessOrderId}</span>
            </div>
            <div class="row">
              <span class="label">Status:</span>
              <span class="value">
                <span class="status ${order.status === 'signed' ? 'status-signed' : order.status === 'qa_approved' ? 'status-approved' : order.status === 'qa_rejected' ? 'status-rejected' : 'status-pending'}">
                  ${order.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </span>
            </div>
            <div class="row">
              <span class="label">Priority:</span>
              <span class="value" style="text-transform: uppercase; font-weight: bold; color: ${order.priority === 'urgent' ? '#dc2626' : order.priority === 'stat' ? '#7c2d12' : '#059669'}">
                ${order.priority}
              </span>
            </div>
            <div class="row">
              <span class="label">Date Received:</span>
              <span class="value">${order.dateReceived}</span>
            </div>
          </div>

          <h2>Patient Information</h2>
          <div class="section">
            <div class="row">
              <span class="label">Patient Name:</span>
              <span class="value">${order.patientName}</span>
            </div>
            <div class="row">
              <span class="label">Patient ID:</span>
              <span class="value">${order.patientId}</span>
            </div>
            <div class="row">
              <span class="label">Insurance Type:</span>
              <span class="value">${order.insuranceType}</span>
            </div>
          </div>

          <h2>Order Details</h2>
          <div class="section">
            <div class="row">
              <span class="label">Order Type:</span>
              <span class="value">${order.orderType}</span>
            </div>
            <div class="row">
              <span class="label">Physician:</span>
              <span class="value">${order.physician}</span>
            </div>
            <div class="row">
              <span class="label">Estimated Value:</span>
              <span class="value" style="color: #059669; font-weight: bold;">$${order.estimatedValue.toLocaleString()}</span>
            </div>
            <div class="row">
              <span class="label">Services:</span>
            </div>
            <div class="services">
              ${order.services.map(s => `<span class="service-item">${s}</span>`).join('')}
            </div>
          </div>

          ${order.qaReviewer ? `
          <h2>QA Review</h2>
          <div class="section">
            <div class="row">
              <span class="label">QA Reviewer:</span>
              <span class="value">${order.qaReviewer}</span>
            </div>
            <div class="row">
              <span class="label">QA Date:</span>
              <span class="value">${order.qaDate || 'N/A'}</span>
            </div>
            ${order.qaComments ? `
            <div class="row">
              <span class="label">Comments:</span>
              <span class="value">${order.qaComments}</span>
            </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- Physician Signature Section -->
          <div class="signature-section">
            <div class="signature-title">
              ✍️ Physician Signature
            </div>
            ${signatureData ? `
              <div class="signature-box">
                <img src="${signatureData}" alt="Digital Signature" class="signature-image" />
                <div class="signature-info">
                  <strong>Digitally signed by: ${signerName || order.physician}</strong><br/>
                  ${signedAt ? `Date: ${new Date(signedAt).toLocaleString()}` : ''}
                </div>
              </div>
              <p style="font-size: 10px; color: #6b7280; margin-top: 10px; text-align: center;">
                This document has been electronically signed and is legally binding.
                Signature verified by Serenity Healthcare Digital Signature System.
              </p>
            ` : `
              <div class="signature-box">
                <div class="not-signed">Document not yet signed</div>
                <div class="signature-line">
                  ${order.physician}<br/>
                  <span style="font-size: 10px;">Physician Signature</span>
                </div>
              </div>
            `}
          </div>

          <div class="footer">
            <p>This document was generated from the Healthcare Order Management System</p>
            <p>Document ID: ${order.id} | Generated: ${new Date().toISOString()}</p>
            <p>© ${new Date().getFullYear()} Serenity Healthcare. All rights reserved.</p>
          </div>
        </body>
        </html>
      `

      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        
        // Wait for content to load then trigger print
        printWindow.onload = () => {
          printWindow.print()
        }
        
        // Fallback if onload doesn't fire
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }

      toast({
        title: signatureData ? "✓ Signed PDF Ready" : "PDF Ready",
        description: `Order ${order.id} is ready to print/save as PDF`,
      })
    } catch (error) {
      console.error("PDF generation failed:", error)
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
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
      {/* Initial Loading State */}
      {initialLoading && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <div className="text-xl font-semibold text-gray-700">Loading Orders from Axxess...</div>
            <p className="text-gray-500">Fetching real-time order data</p>
          </div>
        </div>
      )}

      {!initialLoading && (
        <>
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
              <Button variant="outline" onClick={handleExportReport}>
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
                          <DropdownMenuItem onClick={() => openEditDialog(order)}>
                            <PenTool className="mr-2 h-4 w-4" />
                            Edit Order
                          </DropdownMenuItem>
                          {order.status === "pending_qa" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openQADialog(order.id, "approve")}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve QA
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openQADialog(order.id, "reject")}>
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Reject QA
                              </DropdownMenuItem>
                            </>
                          )}
                          {order.status === "qa_approved" && (
                            <>
                              <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSendForSignature(order.id)}>
                              <Send className="mr-2 h-4 w-4" />
                              Send for Signature
                            </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDownloadOrderPDF(order)}>
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

      {/* QA Action Dialog */}
      <Dialog open={qaDialogOpen} onOpenChange={setQaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {qaAction === "approve" ? "Approve Order" : "Reject Order"}
            </DialogTitle>
            <DialogDescription>
              {qaAction === "approve"
                ? "Add comments for approval (optional)"
                : "Please provide a reason for rejection"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="qa-comments">Comments</Label>
              <Textarea
                id="qa-comments"
                placeholder={
                  qaAction === "approve"
                    ? "All documentation complete and approved..."
                    : "Please provide reason for rejection..."
                }
                value={qaComments}
                onChange={(e) => setQaComments(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setQaDialogOpen(false)
              setQaComments("")
            }}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={() => handleQAAction(currentOrderId, qaAction, qaComments)}
              className={qaAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {qaAction === "approve" ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      {editingOrder && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Order - {editingOrder.id}</DialogTitle>
              <DialogDescription>Update order information</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-patient-name">Patient Name</Label>
                  <Input
                    id="edit-patient-name"
                    value={editingOrder.patientName}
                    onChange={(e) =>
                      setEditingOrder({ ...editingOrder, patientName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-patient-id">Patient ID</Label>
                  <Input
                    id="edit-patient-id"
                    value={editingOrder.patientId}
                    onChange={(e) =>
                      setEditingOrder({ ...editingOrder, patientId: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-order-type">Order Type</Label>
                  <Input
                    id="edit-order-type"
                    value={editingOrder.orderType}
                    onChange={(e) =>
                      setEditingOrder({ ...editingOrder, orderType: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-physician">Physician</Label>
                  <Input
                    id="edit-physician"
                    value={editingOrder.physician}
                    onChange={(e) =>
                      setEditingOrder({ ...editingOrder, physician: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-priority">Priority</Label>
                  <select
                    id="edit-priority"
                    value={editingOrder.priority}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        priority: e.target.value as "routine" | "urgent" | "stat",
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="stat">STAT</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-insurance">Insurance Type</Label>
                  <Input
                    id="edit-insurance"
                    value={editingOrder.insuranceType}
                    onChange={(e) =>
                      setEditingOrder({ ...editingOrder, insuranceType: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-value">Estimated Value</Label>
                  <Input
                    id="edit-value"
                    type="number"
                    value={editingOrder.estimatedValue}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        estimatedValue: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-date">Date Received</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingOrder.dateReceived}
                    onChange={(e) =>
                      setEditingOrder({ ...editingOrder, dateReceived: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false)
                  setEditingOrder(null)
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleUpdateOrder} className="bg-blue-600 hover:bg-blue-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
        </>
      )}
    </div>
  )
}
