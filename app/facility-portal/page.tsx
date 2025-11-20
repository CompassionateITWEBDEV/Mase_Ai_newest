"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Building2,
  Send,
  MessageSquare,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Truck,
  Bot,
  Download,
  Eye,
  Calendar,
  User,
  Zap,
  Heart,
  Activity,
  RefreshCw,
  Search,
  Plus,
} from "lucide-react"

interface Referral {
  id: string
  patientName: string
  patientInitials: string
  diagnosis: string
  submittedDate: string
  status: "pending" | "accepted" | "denied" | "admitted" | "discharged"
  facilityName: string
  caseManager: string
  services: string[]
  insuranceProvider: string
  estimatedAdmissionDate?: string
  actualAdmissionDate?: string
  dischargeDate?: string
  dmeOrders?: DMEOrder[]
  feedback?: string
}

interface DMEOrder {
  id: string
  referralId: string
  items: DMEItem[]
  status: "pending" | "approved" | "shipped" | "delivered"
  orderDate: string
  estimatedDelivery?: string
  trackingNumber?: string
  supplier: "parachute" | "verse"
}

interface DMEItem {
  name: string
  quantity: number
  category: "mobility" | "respiratory" | "wound_care" | "diabetic" | "other"
  urgency: "routine" | "urgent" | "stat"
}

interface Message {
  id: string
  from: string
  to: string
  subject: string
  content: string
  timestamp: string
  read: boolean
  type: "message" | "notification" | "alert"
}

export default function FacilityPortalPage() {
  const [activeTab, setActiveTab] = useState("submit")
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const facilityName = "Mercy Hospital" // In production, get from auth context

  const [newReferral, setNewReferral] = useState({
    patientInitials: "",
    diagnosis: "",
    services: [] as string[],
    insuranceProvider: "",
    urgency: "routine",
    notes: "",
    dmeNeeded: false,
    dmeItems: [] as DMEItem[],
  })

  const [chatMessages, setChatMessages] = useState<Array<{text: string, sender: 'user' | 'ai', timestamp: Date}>>([])
  const [chatInput, setChatInput] = useState("")
  const [aiTyping, setAiTyping] = useState(false)
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null)
  const [showReferralDetails, setShowReferralDetails] = useState(false)
  
  // Document upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [documentType, setDocumentType] = useState<string>("medical")
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const [uploadForReferralId, setUploadForReferralId] = useState<string | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [referralDocuments, setReferralDocuments] = useState<any[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [lastSubmittedReferralId, setLastSubmittedReferralId] = useState<string | null>(null)

  // Messaging state
  const [showComposeDialog, setShowComposeDialog] = useState(false)
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'alerts'>('all')
  const [newMessage, setNewMessage] = useState({
    subject: '',
    content: '',
    referralId: ''
  })
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)

  // DME Orders state
  const [dmeOrders, setDmeOrders] = useState<any[]>([])
  const [loadingDME, setLoadingDME] = useState(false)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<'parachute' | 'verse'>('parachute')
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all')
  const [newDMEOrder, setNewDMEOrder] = useState({
    patientInitials: '',
    referralId: '',
    items: [{ name: '', quantity: 1, category: 'wheelchair' }],
    notes: ''
  })
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Fetch referrals from API
  const fetchReferrals = async () => {
    try {
      const response = await fetch(`/api/facility-portal/referrals?facilityName=${encodeURIComponent(facilityName)}`)
      if (!response.ok) throw new Error('Failed to fetch referrals')
      const data = await response.json()
      setReferrals(data)
    } catch (err) {
      console.error('Error fetching referrals:', err)
      setError('Failed to load referrals')
    }
  }

  // Fetch messages from API
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/facility-portal/messages?facilityName=${encodeURIComponent(facilityName)}`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      const data = await response.json()
      setMessages(data)
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Failed to load messages')
    }
  }

  // Fetch DME orders from API
  const fetchDMEOrders = async () => {
    try {
      setLoadingDME(true)
      const response = await fetch(`/api/facility-portal/dme?facilityName=${encodeURIComponent(facilityName)}`)
      if (!response.ok) throw new Error('Failed to fetch DME orders')
      const data = await response.json()
      setDmeOrders(data)
    } catch (err) {
      console.error('Error fetching DME orders:', err)
      setError('Failed to load DME orders')
    } finally {
      setLoadingDME(false)
    }
  }

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchReferrals(), fetchMessages(), fetchDMEOrders()])
      setLoading(false)
    }
    loadData()
  }, [])

  // Real-time status updates - refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReferrals()
      fetchMessages()
      fetchDMEOrders()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-green-100 text-green-800"
      case "denied":
        return "bg-red-100 text-red-800"
      case "admitted":
        return "bg-blue-100 text-blue-800"
      case "discharged":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "accepted":
        return <CheckCircle className="h-4 w-4" />
      case "denied":
        return <XCircle className="h-4 w-4" />
      case "admitted":
        return <Heart className="h-4 w-4" />
      case "discharged":
        return <Activity className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const submitReferral = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/facility-portal/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientInitials: newReferral.patientInitials,
          diagnosis: newReferral.diagnosis,
          services: newReferral.services,
          insuranceProvider: newReferral.insuranceProvider,
          urgency: newReferral.urgency,
          facilityName: facilityName,
          caseManager: "Lisa Rodriguez, RN",
          notes: newReferral.notes,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit referral')
      }

      const result = await response.json()
      
      // Save the referral ID for upload button
      setLastSubmittedReferralId(result.id)
      
      // Show success message
      alert(`✅ Referral submitted successfully!\n\n${result.message}\n\nYou can now upload documents using the "Upload Documents" button below.`)

      // Reset form
      setNewReferral({
        patientInitials: "",
        diagnosis: "",
        services: [],
        insuranceProvider: "",
        urgency: "routine",
        notes: "",
        dmeNeeded: false,
        dmeItems: [],
      })

      // Refresh referrals list
      await fetchReferrals()
      
    } catch (err) {
      console.error('Error submitting referral:', err)
      alert('Failed to submit referral: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const orderDMESupplies = async (referralId: string, patientInitials: string) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/facility-portal/dme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralId: referralId,
          patientInitials: patientInitials,
          facilityName: facilityName,
          supplier: 'parachute',
          items: [
            {
              name: 'Wound Care Kit',
              quantity: 1,
              category: 'wound_care',
              urgency: 'routine'
            }
          ]
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to order DME supplies')
      }

      const result = await response.json()
      
      alert(`DME Order placed successfully!\n\nOrder ID: ${result.orderId}\nTracking: ${result.trackingNumber}\nEstimated Delivery: ${result.estimatedDelivery}`)
      
      // Refresh data
      await Promise.all([fetchReferrals(), fetchDMEOrders()])
      
    } catch (err) {
      console.error('Error ordering DME:', err)
      alert('Failed to order DME supplies: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Create new DME order
  const createDMEOrder = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/facility-portal/dme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralId: newDMEOrder.referralId || null,
          patientInitials: newDMEOrder.patientInitials,
          facilityName: facilityName,
          supplier: selectedSupplier,
          items: newDMEOrder.items,
          notes: newDMEOrder.notes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create DME order')
      }

      const result = await response.json()
      
      alert(`DME Order created successfully!\n\nOrder ID: ${result.orderId}\nTracking: ${result.trackingNumber}\nEstimated Delivery: ${result.estimatedDelivery}`)
      
      // Reset form and close dialog
      setNewDMEOrder({
        patientInitials: '',
        referralId: '',
        items: [{ name: '', quantity: 1, category: 'wheelchair' }],
        notes: ''
      })
      setShowOrderDialog(false)
      
      // Refresh data
      await fetchDMEOrders()
      
    } catch (err) {
      console.error('Error creating DME order:', err)
      alert('Failed to create DME order: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Filter DME orders
  const getFilteredDMEOrders = () => {
    let filtered = dmeOrders

    // Filter by status
    if (orderStatusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === orderStatusFilter)
    }

    // Search filter
    if (orderSearch) {
      const searchLower = orderSearch.toLowerCase()
      filtered = filtered.filter(order => 
        order.patient_initials?.toLowerCase().includes(searchLower) ||
        order.order_id?.toLowerCase().includes(searchLower) ||
        order.tracking_number?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }

  // Add item to DME order
  const addDMEItem = () => {
    setNewDMEOrder({
      ...newDMEOrder,
      items: [...newDMEOrder.items, { name: '', quantity: 1, category: 'wheelchair' }]
    })
  }

  // Remove item from DME order
  const removeDMEItem = (index: number) => {
    setNewDMEOrder({
      ...newDMEOrder,
      items: newDMEOrder.items.filter((_, i) => i !== index)
    })
  }

  // Update DME item
  const updateDMEItem = (index: number, field: string, value: any) => {
    const updatedItems = [...newDMEOrder.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setNewDMEOrder({ ...newDMEOrder, items: updatedItems })
  }

  // Fetch documents for a referral
  const fetchReferralDocuments = async (referralId: string) => {
    try {
      setLoadingDocuments(true)
      const response = await fetch(`/api/facility-portal/documents?referralId=${referralId}`)
      
      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseErr) {
          const textError = await response.text()
          console.error('Failed to fetch documents:', {
            status: response.status,
            statusText: response.statusText,
            body: textError
          })
          toast({
            title: 'Error Loading Documents',
            description: `Server error: ${response.status} ${response.statusText}`,
            variant: 'destructive'
          })
          setReferralDocuments([])
          return
        }
        console.error('Failed to fetch documents:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        toast({
          title: 'Error Loading Documents',
          description: errorData?.error || errorData?.message || 'Failed to load documents',
          variant: 'destructive'
        })
        setReferralDocuments([])
        return
      }
      
      const data = await response.json()
      setReferralDocuments(data.documents || [])
      
      // Show info if no documents found (not an error)
      if (!data.documents || data.documents.length === 0) {
        console.log('No documents found for referral:', referralId)
      }
    } catch (err) {
      console.error('Unexpected error fetching documents:', err)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while loading documents',
        variant: 'destructive'
      })
      setReferralDocuments([])
    } finally {
      setLoadingDocuments(false)
    }
  }

  const viewReferralDetails = (referral: Referral) => {
    setSelectedReferral(referral)
    setShowReferralDetails(true)
    fetchReferralDocuments(referral.id)
  }

  const sendAIMessage = async (message: string) => {
    // Add user message
    setChatMessages((prev) => [...prev, { text: message, sender: 'user', timestamp: new Date() }])
    setChatInput("")
    setAiTyping(true)

    // Scroll to bottom after adding message
    setTimeout(() => {
      const chatContainer = document.getElementById('ai-chat-container')
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }, 100)

    try {
      const response = await fetch('/api/facility-portal/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          conversationHistory: chatMessages // Send conversation history for context
        })
      })

      if (!response.ok) throw new Error('Failed to get AI response')

      const data = await response.json()
      setChatMessages((prev) => [...prev, { text: data.response, sender: 'ai', timestamp: new Date() }])
      
      // Scroll to bottom after AI response
      setTimeout(() => {
        const chatContainer = document.getElementById('ai-chat-container')
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight
        }
      }, 100)
    } catch (err) {
      console.error('Error getting AI response:', err)
      setChatMessages((prev) => [
        ...prev,
        { text: "Sorry, I'm having trouble responding right now. Please try again or contact support at (555) 123-4567.", sender: 'ai', timestamp: new Date() }
      ])
    } finally {
      setAiTyping(false)
    }
  }

  // Clear chat conversation
  const clearChat = () => {
    if (confirm('Are you sure you want to clear the conversation?')) {
      setChatMessages([])
    }
  }

  // Copy message to clipboard
  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Message copied to clipboard!')
  }

  // Handle file selection for upload
  const handleFileSelect = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt'
    
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      setSelectedFiles(files)
      setShowUploadDialog(true)
    }
    
    input.click()
  }

  // Upload documents to API
  const uploadDocuments = async (referralId: string) => {
    if (selectedFiles.length === 0) {
      alert('Please select files to upload')
      return
    }

    try {
      setUploadingDocs(true)
      
      const formData = new FormData()
      formData.append('referralId', referralId)
      formData.append('documentType', documentType)
      formData.append('uploadedByName', facilityName)
      
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/facility-portal/documents', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Failed to upload documents')

      const data = await response.json()
      
      if (data.success) {
        alert(`✅ Successfully uploaded ${data.successful} document(s)!\n\n${data.errors.length > 0 ? `Failed: ${data.errors.length}` : ''}`)
        setSelectedFiles([])
        setShowUploadDialog(false)
        await fetchReferrals() // Refresh to show updated document count
        // Refresh documents if modal is open
        if (showReferralDetails && selectedReferral) {
          await fetchReferralDocuments(selectedReferral.id)
        }
      } else {
        alert('❌ Failed to upload documents: ' + data.message)
      }
    } catch (err) {
      console.error('Error uploading documents:', err)
      alert('Failed to upload documents: ' + (err as Error).message)
    } finally {
      setUploadingDocs(false)
    }
  }

  // Open upload dialog for a specific referral
  const openUploadForReferral = (referralId: string) => {
    setUploadForReferralId(referralId)
    handleFileSelect()
  }

  // Compose new message
  const composeMessage = async () => {
    if (!newMessage.subject || !newMessage.content) {
      alert('⚠️ Please enter both subject and message content')
      return
    }

    try {
      setSendingMessage(true)
      
      const response = await fetch('/api/facility-portal/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityName: facilityName,
          subject: newMessage.subject,
          content: newMessage.content,
          referralId: newMessage.referralId || null
        })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()
      alert('✅ Message sent successfully!')
      
      // Reset form and close dialog
      setNewMessage({ subject: '', content: '', referralId: '' })
      setShowComposeDialog(false)
      setReplyingTo(null)
      
      // Refresh messages
      await fetchMessages()
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Failed to send message: ' + (err as Error).message)
    } finally {
      setSendingMessage(false)
    }
  }

  // Reply to a message
  const replyToMessage = (message: Message) => {
    setReplyingTo(message)
    setNewMessage({
      subject: `Re: ${message.subject}`,
      content: '',
      referralId: message.referralId || ''
    })
    setShowComposeDialog(true)
  }

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch('/api/facility-portal/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId })
      })

      if (!response.ok) throw new Error('Failed to mark as read')

      // Refresh messages to show updated status
      await fetchMessages()
    } catch (err) {
      console.error('Error marking message as read:', err)
    }
  }

  // Filter messages based on selected filter
  const getFilteredMessages = () => {
    switch (messageFilter) {
      case 'unread':
        return messages.filter(m => !m.read)
      case 'alerts':
        return messages.filter(m => m.type === 'alert')
      default:
        return messages
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-lg font-medium">Loading...</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
          <div className="flex items-start space-x-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Facility Portal</h1>
                <p className="text-gray-600">{facilityName} - Case Management Team</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>Lisa Rodriguez, RN</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="submit">Submit Referral</TabsTrigger>
            <TabsTrigger value="tracker">Referral Tracker</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="dme">DME Orders</TabsTrigger>
            <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          </TabsList>

          {/* Submit Referral Tab */}
          <TabsContent value="submit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Send className="h-5 w-5 mr-2" />
                  Live Referral Submission
                </CardTitle>
                <CardDescription>Submit referrals with real-time status updates and instant feedback</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="patient-initials">Patient Initials</Label>
                      <Input
                        id="patient-initials"
                        value={newReferral.patientInitials}
                        onChange={(e) => setNewReferral({ ...newReferral, patientInitials: e.target.value })}
                        placeholder="J.S."
                      />
                    </div>
                    <div>
                      <Label htmlFor="diagnosis">Primary Diagnosis</Label>
                      <Input
                        id="diagnosis"
                        value={newReferral.diagnosis}
                        onChange={(e) => setNewReferral({ ...newReferral, diagnosis: e.target.value })}
                        placeholder="Post-operative care"
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance">Insurance Provider</Label>
                      <select
                        id="insurance"
                        value={newReferral.insuranceProvider}
                        onChange={(e) => setNewReferral({ ...newReferral, insuranceProvider: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Insurance</option>
                        <option value="Medicare">Medicare</option>
                        <option value="Medicaid">Medicaid</option>
                        <option value="Humana">Humana</option>
                        <option value="United Healthcare">United Healthcare</option>
                        <option value="Aetna">Aetna</option>
                        <option value="Cigna">Cigna</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Services Needed</Label>
                      <div className="space-y-2 mt-2">
                        {[
                          "Skilled Nursing",
                          "Physical Therapy",
                          "Occupational Therapy",
                          "Speech Therapy",
                          "Wound Care",
                        ].map((service) => (
                          <label key={service} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={newReferral.services.includes(service)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewReferral({ ...newReferral, services: [...newReferral.services, service] })
                                } else {
                                  setNewReferral({
                                    ...newReferral,
                                    services: newReferral.services.filter((s) => s !== service),
                                  })
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{service}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="urgency">Urgency Level</Label>
                      <select
                        id="urgency"
                        value={newReferral.urgency}
                        onChange={(e) => setNewReferral({ ...newReferral, urgency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="routine">Routine</option>
                        <option value="urgent">Urgent</option>
                        <option value="stat">STAT</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* DME Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      id="dme-needed"
                      checked={newReferral.dmeNeeded}
                      onChange={(e) => setNewReferral({ ...newReferral, dmeNeeded: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="dme-needed" className="flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      DME Supplies Needed
                    </Label>
                  </div>

                  {newReferral.dmeNeeded && (
                    <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800">DME Supply Request</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Item Category</Label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="wound_care">Wound Care</option>
                            <option value="diabetic">Diabetic Supplies</option>
                            <option value="mobility">Mobility Aids</option>
                            <option value="respiratory">Respiratory</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <Label>Item Name</Label>
                          <Input placeholder="Wound dressings, glucose monitor, etc." />
                        </div>
                        <div>
                          <Label>Quantity</Label>
                          <Input type="number" placeholder="1" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm">
                          <Package className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                        <div className="text-sm text-blue-600">
                          Powered by <strong>Parachute Health</strong> & <strong>Verse Medical</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={newReferral.notes}
                    onChange={(e) => setNewReferral({ ...newReferral, notes: e.target.value })}
                    placeholder="Any additional information or special requirements..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <Button 
                    onClick={submitReferral} 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={loading || !newReferral.patientInitials || !newReferral.diagnosis || !newReferral.insuranceProvider}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Referral
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (lastSubmittedReferralId) {
                        openUploadForReferral(lastSubmittedReferralId)
                      } else {
                        alert('⚠️ Please submit a referral first, then you can upload documents for it.')
                      }
                    }}
                    disabled={loading || !lastSubmittedReferralId}
                    className={lastSubmittedReferralId ? "text-blue-600 hover:text-blue-700 border-blue-600" : ""}
                    title={lastSubmittedReferralId ? "Upload documents for the referral you just submitted" : "Submit a referral first"}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                </div>
                {lastSubmittedReferralId ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-2">
                    <p className="text-sm text-green-800">
                      ✅ <strong>Referral submitted!</strong> Click "Upload Documents" above to attach medical records, insurance cards, or consent forms.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 mt-2">
                    💡 <strong>Tip:</strong> After submitting a referral, the "Upload Documents" button will be enabled so you can attach files.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referral Tracker Tab */}
          <TabsContent value="tracker" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Referral Tracker Dashboard
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      await fetchReferrals()
                      await fetchMessages()
                    }}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription>Real-time status updates for all submitted referrals</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell className="font-medium">{referral.patientInitials}</TableCell>
                        <TableCell>{referral.diagnosis}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {referral.services.map((service) => (
                              <Badge key={service} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(referral.status)}>
                            {getStatusIcon(referral.status)}
                            <span className="ml-1 capitalize">{referral.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>{referral.submittedDate}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => viewReferralDetails(referral)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openUploadForReferral(referral.id)}
                              title="Upload Documents"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                            {(referral.status === "accepted" || referral.status === "approved") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => orderDMESupplies(referral.id, referral.patientInitials)}
                                title="Order DME Supplies"
                                disabled={loading}
                              >
                                <Package className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Real-time Status Updates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-yellow-600" />
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {referrals.filter((r) => r.status === "pending").length}
                  </div>
                  <p className="text-sm text-gray-600">Awaiting review</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Accepted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {referrals.filter((r) => r.status === "accepted").length}
                  </div>
                  <p className="text-sm text-gray-600">Ready for admission</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-blue-600" />
                    Active Patients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {referrals.filter((r) => r.status === "admitted").length}
                  </div>
                  <p className="text-sm text-gray-600">Currently receiving care</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Secure Messaging Hub
                      <Badge variant="outline" className="ml-3">
                        {messages.length} Total
                      </Badge>
                      {messages.filter(m => !m.read).length > 0 && (
                        <Badge className="ml-2 bg-blue-600">
                          {messages.filter(m => !m.read).length} Unread
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>HIPAA-compliant communication with M.A.S.E. team</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setLoading(true)
                        await fetchMessages()
                        setLoading(false)
                      }}
                      disabled={loading}
                      title="Refresh Messages"
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowComposeDialog(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Compose
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Message Filters */}
                <div className="flex space-x-2 mb-6">
                  <Button
                    variant={messageFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMessageFilter('all')}
                  >
                    All ({messages.length})
                  </Button>
                  <Button
                    variant={messageFilter === 'unread' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMessageFilter('unread')}
                  >
                    Unread ({messages.filter(m => !m.read).length})
                  </Button>
                  <Button
                    variant={messageFilter === 'alerts' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMessageFilter('alerts')}
                  >
                    Alerts ({messages.filter(m => m.type === 'alert').length})
                  </Button>
                </div>

                {/* Messages List */}
                <div className="space-y-4">
                  {getFilteredMessages().length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {messageFilter === 'all' ? 'No messages yet' : `No ${messageFilter} messages`}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {messageFilter === 'all' 
                          ? 'Send your first message to the M.A.S.E. team'
                          : `You don't have any ${messageFilter} messages`}
                      </p>
                      {messageFilter === 'all' && (
                        <Button onClick={() => setShowComposeDialog(true)}>
                          <Send className="h-4 w-4 mr-2" />
                          Compose Your First Message
                        </Button>
                      )}
                    </div>
                  ) : (
                    getFilteredMessages().map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          !message.read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={
                                message.type === 'alert'
                                  ? 'destructive'
                                  : message.type === 'notification'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {message.type}
                            </Badge>
                            <span className="font-medium">{message.from}</span>
                            {!message.read && (
                              <Badge variant="outline" className="text-xs bg-blue-600 text-white border-blue-600">
                                New
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(message.timestamp).toLocaleDateString()} {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="font-medium mb-2">{message.subject}</h4>
                        <p className="text-gray-700 mb-3">{message.content}</p>
                        
                        {/* Message Actions */}
                        <div className="flex items-center space-x-2 pt-3 border-t border-gray-200">
                          {!message.read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRead(message.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Mark as Read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => replyToMessage(message)}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Resource Hub
                  </CardTitle>
                  <CardDescription>Downloadable resources for case managers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Download className="h-4 w-4 mr-2" />
                      Discharge Planning Checklist
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Download className="h-4 w-4 mr-2" />
                      Home Health Recovery Guide
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Download className="h-4 w-4 mr-2" />
                      Insurance Authorization Forms
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Download className="h-4 w-4 mr-2" />
                      Narcan Training Materials
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Events & Training
                  </CardTitle>
                  <CardDescription>Request speakers and view upcoming events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800">Upcoming Workshop</h4>
                      <p className="text-sm text-blue-600">Advanced Wound Care Management</p>
                      <p className="text-xs text-blue-500">January 25, 2024 - 2:00 PM</p>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent">
                      <User className="h-4 w-4 mr-2" />
                      Request Speaker
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Event Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Referral Guides</CardTitle>
                <CardDescription>Step-by-step guides for common referral scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg hover:bg-gray-50">
                    <h4 className="font-medium mb-2">Skilled Nursing Referral</h4>
                    <p className="text-sm text-gray-600 mb-3">Complete guide for nursing care referrals</p>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Guide
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50">
                    <h4 className="font-medium mb-2">Behavioral Health</h4>
                    <p className="text-sm text-gray-600 mb-3">Mental health and substance abuse referrals</p>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Guide
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50">
                    <h4 className="font-medium mb-2">Emergency Referrals</h4>
                    <p className="text-sm text-gray-600 mb-3">STAT and urgent care procedures</p>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Guide
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DME Orders Tab */}
          <TabsContent value="dme" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Package className="h-5 w-5 mr-2 text-blue-600" />
                      DME Supply Management
                    </CardTitle>
                    <CardDescription>Automated DME ordering through Parachute Health & Verse Medical</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchDMEOrders}
                    disabled={loadingDME}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingDME ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Supplier Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedSupplier === 'parachute' ? 'border-blue-600 bg-blue-50' : 'hover:border-blue-400'}`}
                    onClick={() => { setSelectedSupplier('parachute'); setShowOrderDialog(true); }}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">Parachute Health</h3>
                        <p className="text-sm text-gray-600">Automated DME ordering platform</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent" onClick={(e) => { e.stopPropagation(); setSelectedSupplier('parachute'); setShowOrderDialog(true); }}>
                      <Package className="h-4 w-4 mr-2" />
                      Order DME Supplies
                    </Button>
                  </div>
                  <div className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedSupplier === 'verse' ? 'border-green-600 bg-green-50' : 'hover:border-green-400'}`}
                    onClick={() => { setSelectedSupplier('verse'); setShowOrderDialog(true); }}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">Verse Medical</h3>
                        <p className="text-sm text-gray-600">Medical supply management</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent" onClick={(e) => { e.stopPropagation(); setSelectedSupplier('verse'); setShowOrderDialog(true); }}>
                      <Package className="h-4 w-4 mr-2" />
                      Browse Catalog
                    </Button>
                  </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by patient, order ID, or tracking..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      {orderStatusFilter === 'all' ? 'All DME Orders' : `${orderStatusFilter.charAt(0).toUpperCase() + orderStatusFilter.slice(1)} Orders`}
                      <Badge variant="outline" className="ml-2">{getFilteredDMEOrders().length}</Badge>
                    </h3>
                  </div>

                  {loadingDME ? (
                    <div className="text-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" />
                      <p className="text-gray-600">Loading DME orders...</p>
                    </div>
                  ) : getFilteredDMEOrders().length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No DME Orders Found</h3>
                      <p className="text-gray-600 mb-4">
                        {orderSearch || orderStatusFilter !== 'all' 
                          ? 'Try adjusting your search or filters' 
                          : 'Create your first DME order using the supplier buttons above'}
                      </p>
                      {!orderSearch && orderStatusFilter === 'all' && (
                        <Button onClick={() => setShowOrderDialog(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Order
                        </Button>
                      )}
                    </div>
                  ) : (
                    getFilteredDMEOrders().map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              Order #{order.order_id || order.id.substring(0, 8)}
                              <Badge 
                                variant="outline" 
                                className={`${
                                  order.supplier === 'parachute' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'
                                }`}
                              >
                                {order.supplier === 'parachute' ? 'Parachute' : 'Verse Medical'}
                              </Badge>
                            </h4>
                            <p className="text-sm text-gray-600">Patient: {order.patient_initials}</p>
                            <p className="text-xs text-gray-500">
                              Ordered: {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                            {order.status === "processing" && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                            {order.status === "shipped" && <Truck className="h-3 w-3 mr-1" />}
                            {order.status === "delivered" && <CheckCircle className="h-3 w-3 mr-1" />}
                            <span className="capitalize">{order.status}</span>
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                          <p className="text-sm font-medium text-gray-700">Items:</p>
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-600">Qty: {item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {order.notes && (
                          <div className="mb-3 p-2 bg-yellow-50 rounded">
                            <p className="text-xs text-gray-700">
                              <strong>Notes:</strong> {order.notes}
                            </p>
                          </div>
                        )}

                        {order.tracking_number && (
                          <div className="p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm text-blue-800 font-medium">
                              <Truck className="h-4 w-4 inline mr-1" />
                              Tracking: {order.tracking_number}
                            </p>
                            {order.estimated_delivery && (
                              <p className="text-xs text-blue-600 mt-1">
                                📅 Estimated delivery: {new Date(order.estimated_delivery).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Bot className="h-5 w-5 mr-2 text-purple-600" />
                      AI Assistant - 24/7 Support
                      <Badge variant="outline" className="ml-3 bg-green-50 text-green-700 border-green-200">
                        Online
                      </Badge>
                    </CardTitle>
                    <CardDescription>Get instant answers about referrals, services, and insurance</CardDescription>
                  </div>
                  {chatMessages.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearChat}
                      title="Clear conversation"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Chat Container */}
                  <div 
                    id="ai-chat-container"
                    className="h-[500px] border rounded-lg p-4 overflow-y-auto bg-gradient-to-b from-purple-50 to-gray-50"
                  >
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-600 mt-16">
                        <div className="inline-block p-4 bg-purple-100 rounded-full mb-4">
                          <Bot className="h-12 w-12 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">👋 Hello! I'm your AI Assistant</h3>
                        <p className="text-sm mb-4">I'm here to help you 24/7. Ask me anything about:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
                          <div className="bg-white p-3 rounded-lg border border-purple-200">
                            <h4 className="font-medium text-sm mb-1">📝 Referral Submission</h4>
                            <p className="text-xs text-gray-600">How to submit, track, and manage referrals</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-purple-200">
                            <h4 className="font-medium text-sm mb-1">💳 Insurance Coverage</h4>
                            <p className="text-xs text-gray-600">Accepted insurers, authorization, claims</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-purple-200">
                            <h4 className="font-medium text-sm mb-1">🏥 Services & Care</h4>
                            <p className="text-xs text-gray-600">Available services, specialties, locations</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-purple-200">
                            <h4 className="font-medium text-sm mb-1">📦 DME Supplies</h4>
                            <p className="text-xs text-gray-600">Ordering, delivery, equipment options</p>
                          </div>
                        </div>
                        <p className="text-sm text-purple-600 mt-6 font-medium">
                          💡 Try clicking a quick action button below to get started!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                              <div className="flex items-start space-x-2">
                                {msg.sender === 'ai' && (
                                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                    <Bot className="h-5 w-5 text-white" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div
                                    className={`p-3 rounded-lg ${
                                      msg.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white border border-gray-200 rounded-bl-none'
                                    }`}
                                  >
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                  </div>
                                  <div className="flex items-center space-x-2 mt-1 px-1">
                                    <span className="text-xs text-gray-500">
                                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {msg.sender === 'ai' && (
                                      <button
                                        onClick={() => copyMessage(msg.text)}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                        title="Copy message"
                                      >
                                        📋 Copy
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {msg.sender === 'user' && (
                                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {aiTyping && (
                          <div className="flex justify-start">
                            <div className="max-w-[80%]">
                              <div className="flex items-start space-x-2">
                                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                  <Bot className="h-5 w-5 text-white" />
                                </div>
                                <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-none">
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask me anything about referrals, insurance, or services..."
                        onKeyPress={(e) => e.key === "Enter" && chatInput.trim() && !aiTyping && sendAIMessage(chatInput)}
                        disabled={aiTyping}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => chatInput.trim() && sendAIMessage(chatInput)}
                        disabled={!chatInput.trim() || aiTyping}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Quick Action Buttons */}
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Quick Actions:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => sendAIMessage("How do I submit a referral?")}
                          disabled={aiTyping}
                          className="text-xs"
                        >
                          📝 Submit Referral
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => sendAIMessage("What insurance do you accept?")}
                          disabled={aiTyping}
                          className="text-xs"
                        >
                          💳 Insurance Info
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => sendAIMessage("How do I order DME supplies?")}
                          disabled={aiTyping}
                          className="text-xs"
                        >
                          📦 DME Supplies
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendAIMessage("What is your contact information?")}
                          disabled={aiTyping}
                          className="text-xs"
                        >
                          📞 Contact Info
                        </Button>
                      </div>
                    </div>

                    {/* Additional Suggestions */}
                    {chatMessages.length === 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                        <p className="text-xs font-medium text-purple-900 mb-2">💡 Popular Questions:</p>
                        <div className="space-y-1">
                          <button
                            onClick={() => sendAIMessage("What services do you offer?")}
                            className="text-xs text-purple-700 hover:text-purple-900 block"
                          >
                            • What services do you offer?
                          </button>
                          <button
                            onClick={() => sendAIMessage("How long does referral approval take?")}
                            className="text-xs text-purple-700 hover:text-purple-900 block"
                          >
                            • How long does referral approval take?
                          </button>
                          <button
                            onClick={() => sendAIMessage("Can I upload documents for a referral?")}
                            className="text-xs text-purple-700 hover:text-purple-900 block"
                          >
                            • Can I upload documents for a referral?
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Referral Details Modal */}
      {showReferralDetails && selectedReferral && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Referral Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReferralDetails(false)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Patient Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Patient Initials</p>
                        <p className="font-medium">{selectedReferral.patientInitials}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Referral ID</p>
                        <p className="font-medium">{selectedReferral.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Diagnosis</p>
                        <p className="font-medium">{selectedReferral.diagnosis}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Insurance</p>
                        <p className="font-medium">{selectedReferral.insuranceProvider}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className={getStatusColor(selectedReferral.status)}>
                      {getStatusIcon(selectedReferral.status)}
                      <span className="ml-1 capitalize">{selectedReferral.status}</span>
                    </Badge>
                    <div className="mt-4 space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Submitted Date</p>
                        <p className="font-medium">{selectedReferral.submittedDate}</p>
                      </div>
                      {selectedReferral.estimatedAdmissionDate && (
                        <div>
                          <p className="text-sm text-gray-600">Estimated Admission</p>
                          <p className="font-medium">{selectedReferral.estimatedAdmissionDate}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Services */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Requested Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedReferral.services.map((service) => (
                        <Badge key={service} variant="secondary">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Feedback */}
                {selectedReferral.feedback && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{selectedReferral.feedback}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Documents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Uploaded Documents ({referralDocuments.length})
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openUploadForReferral(selectedReferral.id)}
                        className="text-blue-600"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload More
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingDocuments ? (
                      <div className="text-center py-4">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                        <p className="text-sm text-gray-600 mt-2">Loading documents...</p>
                      </div>
                    ) : referralDocuments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No documents uploaded yet</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openUploadForReferral(selectedReferral.id)}
                          className="mt-4"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload First Document
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {referralDocuments.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="flex-shrink-0">
                                {doc.mime_type?.includes('image') ? (
                                  <img src={doc.file_url} alt={doc.document_name} className="h-10 w-10 object-cover rounded" />
                                ) : (
                                  <FileText className="h-10 w-10 text-blue-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{doc.document_name}</p>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <Badge variant="secondary" className="text-xs">
                                    {doc.document_type}
                                  </Badge>
                                  <span>•</span>
                                  <span>{(doc.file_size / 1024).toFixed(2)} KB</span>
                                  <span>•</span>
                                  <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(doc.file_url, '_blank')}
                                title="View Document"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const link = document.createElement('a')
                                  link.href = doc.file_url
                                  link.download = doc.document_name
                                  link.click()
                                }}
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                {(selectedReferral.status === "accepted" || selectedReferral.status === "approved") && (
                  <Button
                    onClick={() => {
                      setShowReferralDetails(false)
                      orderDMESupplies(selectedReferral.id, selectedReferral.patientInitials)
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Order DME Supplies
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowReferralDetails(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Documents Dialog */}
      {showUploadDialog && selectedFiles.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                  <Upload className="h-6 w-6 mr-2 text-blue-600" />
                  Upload Documents
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowUploadDialog(false)
                    setSelectedFiles([])
                  }}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                {/* Document Type Selection */}
                <div>
                  <Label>Document Type</Label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="medical">Medical Records</option>
                    <option value="insurance">Insurance Documents</option>
                    <option value="consent">Consent Forms</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Selected Files List */}
                <div>
                  <Label>Selected Files ({selectedFiles.length})</Label>
                  <div className="mt-2 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(2)} KB • {file.type}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newFiles = selectedFiles.filter((_, i) => i !== index)
                            setSelectedFiles(newFiles)
                            if (newFiles.length === 0) {
                              setShowUploadDialog(false)
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload Information */}
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-semibold text-sm mb-2 flex items-center">
                    📋 Accepted File Types:
                  </h3>
                  <p className="text-xs text-gray-700">
                    PDF, DOC, DOCX, JPG, PNG, GIF, TXT (Max 10MB per file)
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-4 pt-4">
                  <Button
                    onClick={() => {
                      if (uploadForReferralId) {
                        uploadDocuments(uploadForReferralId)
                      } else {
                        alert('Please select a referral first')
                      }
                    }}
                    disabled={uploadingDocs || !uploadForReferralId}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {uploadingDocs ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload {selectedFiles.length} File(s)
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUploadDialog(false)
                      setSelectedFiles([])
                    }}
                    disabled={uploadingDocs}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compose Message Dialog */}
      {showComposeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                  <Send className="h-6 w-6 mr-2 text-blue-600" />
                  {replyingTo ? 'Reply to Message' : 'Compose New Message'}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowComposeDialog(false)
                    setNewMessage({ subject: '', content: '', referralId: '' })
                    setReplyingTo(null)
                  }}
                >
                  ✕
                </Button>
              </div>

              {replyingTo && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Replying to:</p>
                  <p className="font-medium text-sm">{replyingTo.subject}</p>
                  <p className="text-xs text-gray-600">From: {replyingTo.from}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* To Field */}
                <div>
                  <Label htmlFor="messageTo">To</Label>
                  <Input
                    id="messageTo"
                    value="M.A.S.E. Team"
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                {/* Referral Link (Optional) */}
                <div>
                  <Label htmlFor="messageReferral">Link to Referral (Optional)</Label>
                  <select
                    id="messageReferral"
                    value={newMessage.referralId}
                    onChange={(e) => setNewMessage({ ...newMessage, referralId: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="">No referral linked</option>
                    {referrals.map((ref) => (
                      <option key={ref.id} value={ref.id}>
                        {ref.patientInitials} - {ref.diagnosis} ({ref.submittedDate})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <Label htmlFor="messageSubject">Subject *</Label>
                  <Input
                    id="messageSubject"
                    placeholder="Enter message subject"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  />
                </div>

                {/* Message Content */}
                <div>
                  <Label htmlFor="messageContent">Message *</Label>
                  <Textarea
                    id="messageContent"
                    placeholder="Type your message here..."
                    rows={8}
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    This message will be sent securely via HIPAA-compliant communication
                  </p>
                </div>

                {/* Quick Templates */}
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm font-medium mb-2">Quick Templates:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNewMessage({
                        ...newMessage,
                        subject: 'Referral Status Inquiry',
                        content: 'Hello, I would like to inquire about the status of a referral. Could you please provide an update?'
                      })}
                    >
                      Status Inquiry
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNewMessage({
                        ...newMessage,
                        subject: 'Document Submission',
                        content: 'Hello, I have uploaded additional documents for your review. Please let me know if you need anything else.'
                      })}
                    >
                      Document Submission
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNewMessage({
                        ...newMessage,
                        subject: 'Urgent Request',
                        content: 'Hello, this is an urgent matter regarding a patient referral. Please contact me as soon as possible.'
                      })}
                    >
                      Urgent Request
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-4 pt-4 border-t">
                  <Button
                    onClick={composeMessage}
                    disabled={sendingMessage || !newMessage.subject || !newMessage.content}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {sendingMessage ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowComposeDialog(false)
                      setNewMessage({ subject: '', content: '', referralId: '' })
                      setReplyingTo(null)
                    }}
                    disabled={sendingMessage}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DME Order Dialog */}
      {showOrderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Package className="h-6 w-6 text-blue-600" />
                    Create DME Order
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Ordering through {selectedSupplier === 'parachute' ? 'Parachute Health' : 'Verse Medical'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowOrderDialog(false)
                    setNewDMEOrder({
                      patientInitials: '',
                      referralId: '',
                      items: [{ name: '', quantity: 1, category: 'wheelchair' }],
                      notes: ''
                    })
                  }}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Patient Initials */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Patient Initials <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g., J.W."
                    value={newDMEOrder.patientInitials}
                    onChange={(e) => setNewDMEOrder({ ...newDMEOrder, patientInitials: e.target.value })}
                  />
                </div>

                {/* Optional Referral ID */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Link to Referral (Optional)
                  </label>
                  <select
                    value={newDMEOrder.referralId}
                    onChange={(e) => setNewDMEOrder({ ...newDMEOrder, referralId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">No referral link</option>
                    {referrals.map((ref) => (
                      <option key={ref.id} value={ref.id}>
                        {ref.patientInitials} - {ref.urgency} - {new Date(ref.submittedAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* DME Items */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    DME Items <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {newDMEOrder.items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start border p-3 rounded-lg">
                        <div className="flex-1 space-y-2">
                          <select
                            value={item.category}
                            onChange={(e) => updateDMEItem(index, 'category', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md text-sm"
                          >
                            <option value="wheelchair">Wheelchair</option>
                            <option value="walker">Walker</option>
                            <option value="cane">Cane</option>
                            <option value="oxygen">Oxygen Equipment</option>
                            <option value="cpap">CPAP/BiPAP</option>
                            <option value="hospital_bed">Hospital Bed</option>
                            <option value="wound_care">Wound Care</option>
                            <option value="diabetic_supplies">Diabetic Supplies</option>
                            <option value="other">Other</option>
                          </select>
                          <Input
                            placeholder="Item name/description"
                            value={item.name}
                            onChange={(e) => updateDMEItem(index, 'name', e.target.value)}
                          />
                          <Input
                            type="number"
                            min="1"
                            placeholder="Quantity"
                            value={item.quantity}
                            onChange={(e) => updateDMEItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        {newDMEOrder.items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDMEItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addDMEItem}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Item
                  </Button>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any special delivery instructions or notes..."
                    value={newDMEOrder.notes}
                    onChange={(e) => setNewDMEOrder({ ...newDMEOrder, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={createDMEOrder}
                    disabled={loading || !newDMEOrder.patientInitials || newDMEOrder.items.some(item => !item.name)}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating Order...
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4 mr-2" />
                        Create Order
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowOrderDialog(false)
                      setNewDMEOrder({
                        patientInitials: '',
                        referralId: '',
                        items: [{ name: '', quantity: 1, category: 'wheelchair' }],
                        notes: ''
                      })
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
