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
  ArrowLeft, FileText, Send, Eye, Download, Clock, CheckCircle, AlertCircle, 
  PenTool, Plus, RefreshCw, Trash2, XCircle, ExternalLink, Loader2, Edit3
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { SignaturePad } from "@/components/signature-pad"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SignatureRecipient {
  id?: string
  name: string
  email: string
  role: string
  status: "pending" | "viewed" | "signed" | "declined"
  signedAt?: string
  viewedAt?: string
  signatureData?: string  // Base64 encoded signature image
  signerName?: string     // Name entered when signing
}

interface SignatureRequest {
  id: string
  requestId: string
  documentName: string
  orderId?: string
  recipients: SignatureRecipient[]
  status: "draft" | "sent" | "completed" | "cancelled" | "expired"
  createdAt: string
  sentAt?: string
  completedAt?: string
  expiresAt: string
  templateId?: string
}

interface TemplateField {
  name: string
  type: "text" | "textarea" | "date" | "signature" | "checkbox"
  required: boolean
  placeholder?: string
}

interface DocumentTemplate {
  id: string
  templateId?: string
  name: string
  description: string
  fields: TemplateField[]
  category: string
  isActive?: boolean
}

const TEMPLATE_CATEGORIES = ["HR", "Legal", "Healthcare", "Compliance", "General"]
const FIELD_TYPES = [
  { value: "text", label: "Text Input" },
  { value: "textarea", label: "Text Area" },
  { value: "date", label: "Date" },
  { value: "signature", label: "Signature" },
  { value: "checkbox", label: "Checkbox" },
]

export default function DigitalSignatures() {
  const { toast } = useToast()
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([])
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<SignatureRequest | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null)
  
  // Template management state
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    category: "General",
    fields: [{ name: "", type: "text" as const, required: true }],
  })
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [showDeleteTemplateDialog, setShowDeleteTemplateDialog] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<DocumentTemplate | null>(null)
  
  // Draft and Preview state
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [savedDrafts, setSavedDrafts] = useState<Array<{
    id: string
    documentTitle: string
    templateId: string
    message: string
    signers: Array<{ name: string; email: string; role: string }>
    expiryDays: string
    savedAt: string
  }>>([])
  const [savingDraft, setSavingDraft] = useState(false)
  const [showDraftsDialog, setShowDraftsDialog] = useState(false)
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("signature-requests")
  
  // Signing dialog state
  const [showSigningDialog, setShowSigningDialog] = useState(false)
  const [signingRequest, setSigningRequest] = useState<{
    requestId: string
    recipientEmail: string
    recipientName: string
    documentName: string
    orderId?: string
  } | null>(null)
  
  // New request form state
  const [newRequest, setNewRequest] = useState({
    documentTitle: "",
    templateId: "",
    message: "",
    signers: [{ name: "", email: "", role: "signer" }],
    expiryDays: "30",
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch signature requests from API
  const fetchSignatureRequests = async () => {
    try {
      const response = await fetch("/api/signatures/create")
      const data = await response.json()
      
      if (data.success) {
        setSignatureRequests(data.data || [])
      } else {
        console.error("Failed to fetch signatures:", data.error)
        toast({
          title: "Error",
          description: "Failed to load signature requests",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching signatures:", error)
      toast({
        title: "Error",
        description: "Failed to connect to signature service",
        variant: "destructive",
      })
    }
  }

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/signatures/templates")
      const data = await response.json()
      
      if (data.success) {
        setDocumentTemplates(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
      // Use default templates
      setDocumentTemplates([
        {
          id: "TEMP-001",
          name: "Employment Agreement",
          description: "Standard employment contract template",
          fields: ["Employee Name", "Position", "Start Date", "Salary", "Department"],
          category: "HR",
        },
        {
          id: "TEMP-002",
          name: "Confidentiality Agreement",
          description: "Non-disclosure and confidentiality agreement",
          fields: ["Employee Name", "Department", "Effective Date"],
          category: "Legal",
        },
        {
          id: "TEMP-003",
          name: "Healthcare Order",
          description: "Physician signature for healthcare orders",
          fields: ["Patient Name", "Order Type", "Order Date"],
          category: "Healthcare",
        },
        {
          id: "TEMP-004",
          name: "HIPAA Agreement",
          description: "HIPAA privacy and security agreement",
          fields: ["Employee Name", "Position", "Training Date"],
          category: "Compliance",
        },
      ])
    }
  }

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchSignatureRequests(), fetchTemplates()])
      setLoading(false)
    }
    loadData()
  }, [])

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchSignatureRequests()
    setRefreshing(false)
    toast({
      title: "Refreshed",
      description: "Signature requests updated",
    })
  }

  // Load drafts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("signature-drafts")
    if (stored) {
      try {
        setSavedDrafts(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to load drafts:", e)
      }
    }
  }, [])

  // Save draft to localStorage
  const handleSaveDraft = () => {
    if (!newRequest.documentTitle.trim()) {
      toast({
        title: "Cannot Save Draft",
        description: "Please enter a document title first",
        variant: "destructive",
      })
      return
    }

    setSavingDraft(true)
    
    const draft = {
      id: `draft-${Date.now()}`,
      ...newRequest,
      savedAt: new Date().toISOString(),
    }

    const updatedDrafts = [...savedDrafts, draft]
    setSavedDrafts(updatedDrafts)
    localStorage.setItem("signature-drafts", JSON.stringify(updatedDrafts))

    setTimeout(() => {
      setSavingDraft(false)
      toast({
        title: "✓ Draft Saved",
        description: `"${newRequest.documentTitle}" saved as draft`,
      })
    }, 500)
  }

  // Load draft into form
  const loadDraft = (draft: typeof savedDrafts[0]) => {
    setNewRequest({
      documentTitle: draft.documentTitle,
      templateId: draft.templateId,
      message: draft.message,
      signers: draft.signers,
      expiryDays: draft.expiryDays,
    })
    setShowDraftsDialog(false)
    toast({
      title: "Draft Loaded",
      description: `"${draft.documentTitle}" loaded into form`,
    })
  }

  // Delete draft
  const deleteDraft = (draftId: string) => {
    const updatedDrafts = savedDrafts.filter(d => d.id !== draftId)
    setSavedDrafts(updatedDrafts)
    localStorage.setItem("signature-drafts", JSON.stringify(updatedDrafts))
    toast({
      title: "Draft Deleted",
      description: "Draft has been removed",
    })
  }

  // Email validation helper
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // Create new signature request
  const handleCreateRequest = async () => {
    // Validate document title
    if (!newRequest.documentTitle.trim()) {
      toast({
        title: "Missing Document Title",
        description: "Please enter a document title",
        variant: "destructive",
      })
      return
    }

    // Validate signers
    const validSigners = newRequest.signers.filter(s => s.name.trim() && s.email.trim())
    if (validSigners.length === 0) {
      toast({
        title: "No Signers Added",
        description: "Please add at least one signer with name and email",
        variant: "destructive",
      })
      return
    }

    // Validate email addresses
    const invalidEmails = validSigners.filter(s => !isValidEmail(s.email))
    if (invalidEmails.length > 0) {
      toast({
        title: "Invalid Email Address",
        description: `Please check the email for: ${invalidEmails.map(s => s.name).join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/signatures/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentName: newRequest.documentTitle.trim(),
          recipients: validSigners.map(s => ({
            name: s.name.trim(),
            email: s.email.trim().toLowerCase(),
            role: s.role,
          })),
          templateId: newRequest.templateId || undefined,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "✓ Signature Request Sent!",
          description: `Request sent to ${validSigners.length} recipient${validSigners.length > 1 ? "s" : ""}. They will receive an email notification.`,
        })
        
        // Reset form
        setNewRequest({
          documentTitle: "",
          templateId: "",
          message: "",
          signers: [{ name: "", email: "", role: "signer" }],
          expiryDays: "30",
        })
        
        // Refresh list
        await fetchSignatureRequests()
      } else {
        throw new Error(data.error || "Failed to create request")
      }
    } catch (error) {
      console.error("Error creating signature request:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send signature request",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Cancel signature request
  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/signatures/create?id=${requestId}`, {
        method: "DELETE",
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "Cancelled",
          description: "Signature request has been cancelled",
        })
        await fetchSignatureRequests()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel signature request",
        variant: "destructive",
      })
    } finally {
      setShowCancelDialog(false)
      setRequestToCancel(null)
    }
  }

  // Open signing dialog
  const openSigningDialog = (request: SignatureRequest, recipient: SignatureRecipient) => {
    setSigningRequest({
      requestId: request.requestId,
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      documentName: request.documentName,
      orderId: request.orderId, // Include orderId for healthcare orders
    })
    setShowSigningDialog(true)
  }

  // Handle actual digital signature
  const handleActualSign = async (signatureData: string, signerName: string) => {
    if (!signingRequest) return

    try {
      // Update signature request
      const response = await fetch("/api/signatures/create", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: signingRequest.requestId,
          recipientEmail: signingRequest.recipientEmail,
          status: "signed",
          signatureData, // Store the actual signature image
          signerName,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // If this signature is linked to a healthcare order, update that too
        if (signingRequest.orderId) {
          try {
            await fetch("/api/healthcare-orders/update-signature", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: signingRequest.orderId,
                signatureRequestId: signingRequest.requestId,
                signatureData,
                signerName,
                signedAt: new Date().toISOString(),
              }),
            })
          } catch (orderError) {
            console.error("Failed to update order:", orderError)
          }
        }

        toast({
          title: "✓ Document Signed!",
          description: `Signature recorded for ${signerName}${signingRequest.orderId ? ". Order updated." : ""}`,
        })
        setShowSigningDialog(false)
        setSigningRequest(null)
        await fetchSignatureRequests()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record signature",
        variant: "destructive",
      })
    }
  }

  // Add signer to form
  const addSigner = () => {
    setNewRequest({
      ...newRequest,
      signers: [...newRequest.signers, { name: "", email: "", role: "signer" }],
    })
  }

  // Remove signer from form
  const removeSigner = (index: number) => {
    if (newRequest.signers.length > 1) {
      const updated = [...newRequest.signers]
      updated.splice(index, 1)
      setNewRequest({ ...newRequest, signers: updated })
    }
  }

  // Update signer in form
  const updateSigner = (index: number, field: string, value: string) => {
    const updated = [...newRequest.signers]
    updated[index] = { ...updated[index], [field]: value }
    setNewRequest({ ...newRequest, signers: updated })
  }

  // ============ TEMPLATE MANAGEMENT FUNCTIONS ============

  // Open template dialog for creating
  const openCreateTemplateDialog = () => {
    setEditingTemplate(null)
    setTemplateForm({
      name: "",
      description: "",
      category: "General",
      fields: [{ name: "", type: "text", required: true }],
    })
    setShowTemplateDialog(true)
  }

  // Open template dialog for editing
  const openEditTemplateDialog = (template: DocumentTemplate) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      description: template.description,
      category: template.category,
      fields: template.fields.map(f => ({
        name: typeof f === "string" ? f : f.name,
        type: (typeof f === "string" ? "text" : f.type) as "text" | "textarea" | "date" | "signature" | "checkbox",
        required: typeof f === "string" ? true : f.required,
      })),
    })
    setShowTemplateDialog(true)
  }

  // Add field to template
  const addTemplateField = () => {
    setTemplateForm({
      ...templateForm,
      fields: [...templateForm.fields, { name: "", type: "text", required: true }],
    })
  }

  // Remove field from template
  const removeTemplateField = (index: number) => {
    if (templateForm.fields.length > 1) {
      const updated = [...templateForm.fields]
      updated.splice(index, 1)
      setTemplateForm({ ...templateForm, fields: updated })
    }
  }

  // Update template field
  const updateTemplateField = (index: number, key: string, value: any) => {
    const updated = [...templateForm.fields]
    updated[index] = { ...updated[index], [key]: value }
    setTemplateForm({ ...templateForm, fields: updated })
  }

  // Save template (create or update)
  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      })
      return
    }

    const validFields = templateForm.fields.filter(f => f.name.trim())
    if (validFields.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one field with a name",
        variant: "destructive",
      })
      return
    }

    setSavingTemplate(true)
    try {
      const method = editingTemplate ? "PUT" : "POST"
      const body = editingTemplate
        ? { id: editingTemplate.id, ...templateForm, fields: validFields }
        : { ...templateForm, fields: validFields }

      const response = await fetch("/api/signatures/templates", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: editingTemplate ? "Template Updated" : "Template Created",
          description: `"${templateForm.name}" has been saved`,
        })
        setShowTemplateDialog(false)
        await fetchTemplates()
      } else {
        throw new Error(data.error || "Failed to save template")
      }
    } catch (error) {
      console.error("Error saving template:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save template",
        variant: "destructive",
      })
    } finally {
      setSavingTemplate(false)
    }
  }

  // Delete template
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return

    try {
      const response = await fetch(`/api/signatures/templates?id=${templateToDelete.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Template Deleted",
          description: `"${templateToDelete.name}" has been deleted`,
        })
        setShowDeleteTemplateDialog(false)
        setTemplateToDelete(null)
        await fetchTemplates()
      } else {
        throw new Error(data.error || "Failed to delete template")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      })
    }
  }

  // ============ END TEMPLATE MANAGEMENT ============

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "pending":
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "viewed":
        return "bg-purple-100 text-purple-800"
      case "expired":
      case "cancelled":
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
      case "declined":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Stats
  const stats = {
    total: signatureRequests.length,
    completed: signatureRequests.filter(r => r.status === "completed").length,
    pending: signatureRequests.filter(r => r.status === "sent").length,
    cancelled: signatureRequests.filter(r => r.status === "cancelled").length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading signature requests...</p>
        </div>
      </div>
    )
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
              <Button variant="outline" onClick={() => setActiveTab("templates")}>
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button onClick={() => setActiveTab("create-request")}>
                <Send className="h-4 w-4 mr-2" />
                Send for Signature
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {signatureRequests.length === 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-800">Database Setup Required</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Run the SQL script <code className="bg-amber-100 px-1 rounded">scripts/setup-signatures-table.sql</code> in your Supabase SQL Editor to create the signatures tables.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                      <p className="text-2xl font-bold">{stats.total}</p>
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
                      <p className="text-2xl font-bold">{stats.completed}</p>
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
                      <p className="text-2xl font-bold">{stats.pending}</p>
                      <p className="text-gray-600 text-sm">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <XCircle className="h-8 w-8 text-red-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{stats.cancelled}</p>
                      <p className="text-gray-600 text-sm">Cancelled</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Signature Requests List */}
            <div className="space-y-4">
              {signatureRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900">No signature requests yet</h3>
                    <p className="text-gray-500 mt-1">Create your first signature request or send one from Order Management</p>
                  </CardContent>
                </Card>
              ) : (
                signatureRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            request.orderId ? "bg-purple-100" : "bg-blue-100"
                          }`}>
                            <FileText className={`h-6 w-6 ${request.orderId ? "text-purple-600" : "text-blue-600"}`} />
                          </div>
                          <div>
                            <h3 className="font-medium">{request.documentName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">ID: {request.requestId}</span>
                              {request.orderId && (
                                <Badge variant="outline" className="text-xs bg-purple-50">
                                  From Order: {request.orderId}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span>Created: {formatDate(request.createdAt)}</span>
                              {request.sentAt && <span>Sent: {formatDate(request.sentAt)}</span>}
                              {request.completedAt && <span>Completed: {formatDate(request.completedAt)}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(request.status)}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {request.status === "sent" && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setRequestToCancel(request.requestId)
                                  setShowCancelDialog(true)
                                }}
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Signers Status */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Signers:</h4>
                        <div className="space-y-2">
                          {request.recipients.map((recipient, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {getSignerStatusIcon(recipient.status)}
                                <span className="text-sm">{recipient.name}</span>
                                <span className="text-xs text-gray-500">({recipient.email})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {recipient.status}
                                </Badge>
                                {recipient.status === "pending" && request.status === "sent" && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                    onClick={() => openSigningDialog(request, recipient)}
                                  >
                                    <Edit3 className="h-3 w-3 mr-1" />
                                    Sign Now
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
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
                  <Button onClick={openCreateTemplateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {documentTemplates.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900">No templates yet</h3>
                    <p className="text-gray-500 mt-1">Create your first document template to get started</p>
                    <Button onClick={openCreateTemplateDialog} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documentTemplates.map((template) => (
                      <Card key={template.id} className="hover:shadow-md transition-shadow group">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium">{template.name}</h4>
                                <Badge variant="outline" className="text-xs mt-1">{template.category}</Badge>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => openEditTemplateDialog(template)}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                  onClick={() => {
                                    setTemplateToDelete(template)
                                    setShowDeleteTemplateDialog(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{template.description}</p>
                            <div>
                              <p className="text-xs font-medium text-gray-700 mb-1">Fields ({template.fields.length}):</p>
                              <div className="flex flex-wrap gap-1">
                                {template.fields.slice(0, 5).map((field, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {typeof field === "string" ? field : field.name}
                                    {typeof field !== "string" && field.type === "signature" && " ✍️"}
                                  </Badge>
                                ))}
                                {template.fields.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{template.fields.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setNewRequest({
                                    ...newRequest,
                                    templateId: template.id,
                                    documentTitle: template.name,
                                  })
                                  toast({
                                    title: "Template Selected",
                                    description: `Go to "Create Request" tab to use "${template.name}"`,
                                  })
                                }}
                              >
                                Use Template
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-request" className="space-y-6">
            {/* Create Signature Request */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Create Signature Request
                    </CardTitle>
                    <CardDescription>Fill in the details below to send a document for digital signature</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Step 1: Document Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
                        Document Information
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="document-title">Document Title *</Label>
                          <Input 
                            id="document-title" 
                            placeholder="e.g., Employment Agreement - John Doe"
                            value={newRequest.documentTitle}
                            onChange={(e) => setNewRequest({ ...newRequest, documentTitle: e.target.value })}
                            className={!newRequest.documentTitle && submitting ? "border-red-500" : ""}
                          />
                        </div>
                        <div>
                          <Label htmlFor="template-select">Use Template</Label>
                          <Select 
                            value={newRequest.templateId}
                            onValueChange={(value) => {
                              const template = documentTemplates.find(t => t.id === value)
                              setNewRequest({ 
                                ...newRequest, 
                                templateId: value,
                                documentTitle: template ? template.name : newRequest.documentTitle
                              })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              {documentTemplates.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{template.name}</span>
                                    <Badge variant="outline" className="text-xs">{template.category}</Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Show selected template info */}
                      {newRequest.templateId && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-800">
                                Template: {documentTemplates.find(t => t.id === newRequest.templateId)?.name}
                              </p>
                              <p className="text-xs text-blue-600 mt-1">
                                {documentTemplates.find(t => t.id === newRequest.templateId)?.description}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {documentTemplates.find(t => t.id === newRequest.templateId)?.fields.map((field, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-white">
                                    {typeof field === "string" ? field : field.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setNewRequest({ ...newRequest, templateId: "" })}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="message">Message to Recipients (Optional)</Label>
                        <Textarea 
                          id="message" 
                          placeholder="Add a personal message that will be included in the signature request email..." 
                          rows={3}
                          value={newRequest.message}
                          onChange={(e) => setNewRequest({ ...newRequest, message: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Step 2: Signers */}
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                          <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
                          Add Signers *
                        </div>
                        <Button variant="outline" size="sm" onClick={addSigner}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Signer
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {newRequest.signers.map((signer, index) => (
                          <div key={index} className="p-4 border rounded-lg bg-gray-50 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Signer {index + 1}</span>
                              {newRequest.signers.length > 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 h-8"
                                  onClick={() => removeSigner(index)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs">Full Name *</Label>
                                <Input 
                                  placeholder="John Smith"
                                  value={signer.name}
                                  onChange={(e) => updateSigner(index, "name", e.target.value)}
                                  className={!signer.name && submitting ? "border-red-500" : ""}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Email Address *</Label>
                                <Input 
                                  placeholder="john@example.com" 
                                  type="email"
                                  value={signer.email}
                                  onChange={(e) => updateSigner(index, "email", e.target.value)}
                                  className={!signer.email && submitting ? "border-red-500" : ""}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Role</Label>
                                <Select 
                                  value={signer.role}
                                  onValueChange={(value) => updateSigner(index, "role", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="signer">
                                      <div className="flex items-center gap-2">
                                        <PenTool className="h-3 w-3" />
                                        Signer (Must Sign)
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="approver">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="h-3 w-3" />
                                        Approver
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="witness">
                                      <div className="flex items-center gap-2">
                                        <Eye className="h-3 w-3" />
                                        Witness
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="cc">
                                      <div className="flex items-center gap-2">
                                        <Send className="h-3 w-3" />
                                        CC (View Only)
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step 3: Settings */}
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
                        Settings
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <Label>Expiration</Label>
                          <Select 
                            value={newRequest.expiryDays}
                            onValueChange={(value) => setNewRequest({ ...newRequest, expiryDays: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7">7 days</SelectItem>
                              <SelectItem value="14">14 days</SelectItem>
                              <SelectItem value="30">30 days (Recommended)</SelectItem>
                              <SelectItem value="60">60 days</SelectItem>
                              <SelectItem value="90">90 days</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">
                            Request will expire on {new Date(Date.now() + parseInt(newRequest.expiryDays) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preview Panel */}
              <div className="space-y-4">
                <Card className="sticky top-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Document Preview */}
                    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Document</p>
                        <p className="font-medium">{newRequest.documentTitle || "Untitled Document"}</p>
                      </div>
                      
                      {newRequest.templateId && (
                        <div>
                          <p className="text-xs text-gray-500">Template</p>
                          <Badge variant="outline">
                            {documentTemplates.find(t => t.id === newRequest.templateId)?.name}
                          </Badge>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-gray-500">Signers ({newRequest.signers.filter(s => s.name || s.email).length})</p>
                        <div className="space-y-1 mt-1">
                          {newRequest.signers.map((signer, idx) => (
                            signer.name || signer.email ? (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs text-blue-600">
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className="font-medium">{signer.name || "No name"}</p>
                                  <p className="text-xs text-gray-500">{signer.email || "No email"}</p>
                                </div>
                              </div>
                            ) : null
                          ))}
                          {newRequest.signers.every(s => !s.name && !s.email) && (
                            <p className="text-sm text-gray-400 italic">No signers added yet</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Expires</p>
                        <p className="text-sm">{newRequest.expiryDays} days</p>
                      </div>
                    </div>

                    {/* Validation Status */}
                    <div className="space-y-2">
                      <div className={`flex items-center gap-2 text-sm ${newRequest.documentTitle ? "text-green-600" : "text-gray-400"}`}>
                        {newRequest.documentTitle ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        Document title
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${newRequest.signers.some(s => s.name && s.email) ? "text-green-600" : "text-gray-400"}`}>
                        {newRequest.signers.some(s => s.name && s.email) ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        At least one signer
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${newRequest.signers.every(s => !s.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) ? "text-green-600" : "text-red-500"}`}>
                        {newRequest.signers.every(s => !s.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        Valid email addresses
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-4 border-t">
                      <Button 
                        onClick={handleCreateRequest} 
                        disabled={submitting || !newRequest.documentTitle || !newRequest.signers.some(s => s.name && s.email)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send for Signature
                          </>
                        )}
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => setShowPreviewDialog(true)}
                          disabled={!newRequest.documentTitle}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleSaveDraft}
                          disabled={savingDraft || !newRequest.documentTitle}
                        >
                          {savingDraft ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4 mr-1" />
                          )}
                          Save Draft
                        </Button>
                      </div>

                      {savedDrafts.length > 0 && (
                        <Button 
                          variant="ghost" 
                          className="w-full text-blue-600"
                          onClick={() => setShowDraftsDialog(true)}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Load Draft ({savedDrafts.length})
                        </Button>
                      )}

                      <Button 
                        variant="ghost" 
                        className="w-full text-gray-500"
                        onClick={() => setNewRequest({
                          documentTitle: "",
                          templateId: "",
                          message: "",
                          signers: [{ name: "", email: "", role: "signer" }],
                          expiryDays: "30",
                        })}
                      >
                        Clear Form
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
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
                    <p className="text-4xl font-bold text-green-600">
                      {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                    </p>
                    <p className="text-gray-600 mt-2">Completion rate</p>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completed:</span>
                      <span className="font-medium">{stats.completed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pending:</span>
                      <span className="font-medium">{stats.pending}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cancelled:</span>
                      <span className="font-medium">{stats.cancelled}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Request Sources</CardTitle>
                  <CardDescription>Where signature requests originate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">From Order Management</span>
                      </div>
                      <span className="text-lg font-bold text-purple-600">
                        {signatureRequests.filter(r => r.orderId).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <PenTool className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Created Directly</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {signatureRequests.filter(r => !r.orderId).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>Overall signature request statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                    <p className="text-sm text-gray-600">Total Requests</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                    <p className="text-sm text-gray-600">Cancelled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Signature Request Details</DialogTitle>
            <DialogDescription>
              {selectedRequest?.requestId}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Document Name</Label>
                  <p className="font-medium">{selectedRequest.documentName}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Status</Label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Created</Label>
                  <p>{formatDate(selectedRequest.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Expires</Label>
                  <p>{formatDate(selectedRequest.expiresAt)}</p>
                </div>
                {selectedRequest.orderId && (
                  <div className="col-span-2">
                    <Label className="text-sm text-gray-500">Source Order</Label>
                    <p className="font-medium text-purple-600">{selectedRequest.orderId}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm text-gray-500 mb-2 block">Recipients</Label>
                <div className="space-y-3">
                  {selectedRequest.recipients.map((recipient, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getSignerStatusIcon(recipient.status)}
                          <div>
                            <p className="font-medium">{recipient.name}</p>
                            <p className="text-xs text-gray-500">{recipient.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{recipient.role}</Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {recipient.signedAt ? `Signed: ${formatDate(recipient.signedAt)}` : recipient.status}
                          </p>
                        </div>
                      </div>
                      {/* Show actual signature if signed */}
                      {recipient.status === "signed" && recipient.signatureData && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Digital Signature:</p>
                          <div className="bg-white border rounded-lg p-2 inline-block">
                            <img 
                              src={recipient.signatureData} 
                              alt={`Signature by ${recipient.signerName || recipient.name}`}
                              className="h-16 max-w-[200px] object-contain"
                            />
                          </div>
                          {recipient.signerName && (
                            <p className="text-xs text-gray-600 mt-1">
                              Signed as: <span className="font-medium">{recipient.signerName}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Signature Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the signature request and notify all recipients. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => requestToCancel && handleCancelRequest(requestToCancel)}
            >
              Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Digital Signature Dialog */}
      <Dialog open={showSigningDialog} onOpenChange={setShowSigningDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-green-600" />
              Sign Document
            </DialogTitle>
            <DialogDescription>
              Please provide your digital signature below
            </DialogDescription>
          </DialogHeader>
          {signingRequest && (
            <SignaturePad
              signerName={signingRequest.recipientName}
              documentName={signingRequest.documentName}
              onSign={handleActualSign}
              onCancel={() => {
                setShowSigningDialog(false)
                setSigningRequest(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Template Create/Edit Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {editingTemplate ? "Edit Template" : "Create New Template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate 
                ? "Update the template details and fields below"
                : "Create a reusable document template for signature requests"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Template Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-name">Template Name *</Label>
                <Input
                  id="template-name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g., Employment Agreement"
                />
              </div>
              <div>
                <Label htmlFor="template-category">Category</Label>
                <Select
                  value={templateForm.category}
                  onValueChange={(value) => setTemplateForm({ ...templateForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                placeholder="Describe what this template is used for..."
                rows={2}
              />
            </div>

            {/* Fields */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Template Fields</Label>
                <Button variant="outline" size="sm" onClick={addTemplateField}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>
              <div className="space-y-2">
                {templateForm.fields.map((field, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <Input
                        value={field.name}
                        onChange={(e) => updateTemplateField(index, "name", e.target.value)}
                        placeholder="Field name"
                        className="mb-2"
                      />
                      <div className="flex gap-2">
                        <Select
                          value={field.type}
                          onValueChange={(value) => updateTemplateField(index, "type", value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateTemplateField(index, "required", e.target.checked)}
                            className="rounded"
                          />
                          Required
                        </label>
                      </div>
                    </div>
                    {templateForm.fields.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeTemplateField(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            {templateForm.fields.some(f => f.name) && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800 font-medium mb-2">Preview:</p>
                <div className="flex flex-wrap gap-1">
                  {templateForm.fields
                    .filter(f => f.name)
                    .map((field, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-white">
                        {field.name}
                        {field.type === "signature" && " ✍️"}
                        {field.required && " *"}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={savingTemplate}>
              {savingTemplate ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {editingTemplate ? "Update Template" : "Create Template"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Confirmation Dialog */}
      <AlertDialog open={showDeleteTemplateDialog} onOpenChange={setShowDeleteTemplateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteTemplate}
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Document Preview
            </DialogTitle>
            <DialogDescription>
              Preview how the signature request will appear to recipients
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-lg overflow-hidden">
            {/* Preview Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{newRequest.documentTitle || "Untitled Document"}</h2>
                  <p className="text-blue-100 text-sm">Signature Request from Serenity Healthcare</p>
                </div>
              </div>
            </div>

            {/* Preview Body */}
            <div className="p-6 space-y-6 bg-gray-50">
              {/* Message Section */}
              {newRequest.message && (
                <div className="bg-white rounded-lg p-4 border">
                  <p className="text-sm font-medium text-gray-500 mb-2">Message from sender:</p>
                  <p className="text-gray-700">{newRequest.message}</p>
                </div>
              )}

              {/* Template Info */}
              {newRequest.templateId && (
                <div className="bg-white rounded-lg p-4 border">
                  <p className="text-sm font-medium text-gray-500 mb-2">Document Template:</p>
                  <div className="flex items-center gap-2">
                    <Badge>{documentTemplates.find(t => t.id === newRequest.templateId)?.name}</Badge>
                    <span className="text-sm text-gray-500">
                      {documentTemplates.find(t => t.id === newRequest.templateId)?.category}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Required Fields:</p>
                    <div className="flex flex-wrap gap-1">
                      {documentTemplates.find(t => t.id === newRequest.templateId)?.fields.map((field, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {typeof field === "string" ? field : field.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Signers Section */}
              <div className="bg-white rounded-lg p-4 border">
                <p className="text-sm font-medium text-gray-500 mb-3">
                  Signers ({newRequest.signers.filter(s => s.name || s.email).length})
                </p>
                <div className="space-y-3">
                  {newRequest.signers.map((signer, idx) => (
                    signer.name || signer.email ? (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {signer.name ? signer.name.charAt(0).toUpperCase() : "?"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{signer.name || "No name"}</p>
                          <p className="text-sm text-gray-500">{signer.email || "No email"}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">{signer.role}</Badge>
                      </div>
                    ) : null
                  ))}
                </div>
              </div>

              {/* Expiration Info */}
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center gap-2 text-amber-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    This request will expire on{" "}
                    <strong>
                      {new Date(Date.now() + parseInt(newRequest.expiryDays) * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Signature Placeholder */}
              <div className="bg-white rounded-lg p-6 border-2 border-dashed border-blue-300">
                <div className="text-center">
                  <PenTool className="h-12 w-12 text-blue-300 mx-auto mb-3" />
                  <p className="text-gray-500">Signature area will appear here</p>
                  <p className="text-xs text-gray-400 mt-1">Recipients will be able to draw or type their signature</p>
                </div>
              </div>
            </div>

            {/* Preview Footer */}
            <div className="bg-gray-100 px-6 py-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                This is a preview of how the signature request will appear to recipients.
                Actual appearance may vary slightly based on recipient&apos;s device.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close Preview
            </Button>
            <Button 
              onClick={() => {
                setShowPreviewDialog(false)
                handleCreateRequest()
              }}
              disabled={!newRequest.documentTitle || !newRequest.signers.some(s => s.name && s.email)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saved Drafts Dialog */}
      <Dialog open={showDraftsDialog} onOpenChange={setShowDraftsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Saved Drafts
            </DialogTitle>
            <DialogDescription>
              Select a draft to continue editing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {savedDrafts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No saved drafts</p>
              </div>
            ) : (
              savedDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => loadDraft(draft)}>
                      <h4 className="font-medium">{draft.documentTitle}</h4>
                      <p className="text-sm text-gray-500">
                        {draft.signers.filter(s => s.name).length} signer(s)
                        {draft.templateId && " • Using template"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Saved {new Date(draft.savedAt).toLocaleDateString()} at{" "}
                        {new Date(draft.savedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadDraft(draft)}
                      >
                        Load
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => deleteDraft(draft.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDraftsDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
