"use client"

import { useState, useEffect } from "react"
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
  const [referrals, setReferrals] = useState<Referral[]>([
    {
      id: "REF-001",
      patientName: "J.S.",
      patientInitials: "J.S.",
      diagnosis: "Post-operative care for hip replacement",
      submittedDate: "2024-01-15",
      status: "accepted",
      facilityName: "Mercy Hospital",
      caseManager: "Lisa Rodriguez, RN",
      services: ["Skilled Nursing", "Physical Therapy"],
      insuranceProvider: "Medicare",
      estimatedAdmissionDate: "2024-01-18",
      actualAdmissionDate: "2024-01-18",
      feedback: "Patient admitted successfully. Excellent documentation provided.",
    },
    {
      id: "REF-002",
      patientName: "M.J.",
      patientInitials: "M.J.",
      diagnosis: "Diabetes management and wound care",
      submittedDate: "2024-01-16",
      status: "pending",
      facilityName: "Mercy Hospital",
      caseManager: "Lisa Rodriguez, RN",
      services: ["Skilled Nursing", "Wound Care"],
      insuranceProvider: "Humana",
      dmeOrders: [
        {
          id: "DME-001",
          referralId: "REF-002",
          items: [
            { name: "Wound Care Dressings", quantity: 30, category: "wound_care", urgency: "urgent" },
            { name: "Blood Glucose Monitor", quantity: 1, category: "diabetic", urgency: "routine" },
          ],
          status: "approved",
          orderDate: "2024-01-16",
          estimatedDelivery: "2024-01-19",
          supplier: "parachute",
        },
      ],
    },
    {
      id: "REF-003",
      patientName: "R.W.",
      patientInitials: "R.W.",
      diagnosis: "CHF management",
      submittedDate: "2024-01-14",
      status: "denied",
      facilityName: "Mercy Hospital",
      caseManager: "Lisa Rodriguez, RN",
      services: ["Skilled Nursing"],
      insuranceProvider: "United Healthcare",
      feedback: "Insurance authorization required. Please submit prior auth documentation.",
    },
  ])

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "MSG-001",
      from: "M.A.S.E. Intake Team",
      to: "Mercy Hospital",
      subject: "Referral REF-002 - Additional Information Needed",
      content: "We need the latest physician orders for patient M.J. Please upload when available.",
      timestamp: "2024-01-16T10:30:00Z",
      read: false,
      type: "message",
    },
    {
      id: "MSG-002",
      from: "M.A.S.E. DME Team",
      to: "Mercy Hospital",
      subject: "DME Order DME-001 Approved and Shipped",
      content: "Your DME order for patient M.J. has been approved and shipped. Tracking: PH123456789",
      timestamp: "2024-01-16T14:15:00Z",
      read: false,
      type: "notification",
    },
  ])

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

  const [chatMessages, setChatMessages] = useState<string[]>([])
  const [chatInput, setChatInput] = useState("")
  const [aiTyping, setAiTyping] = useState(false)

  // Real-time status updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setReferrals((prev) =>
        prev.map((ref) => {
          if (ref.id === "REF-002" && ref.status === "pending") {
            return { ...ref, status: "accepted", actualAdmissionDate: "2024-01-17" }
          }
          return ref
        }),
      )
    }, 10000) // Update every 10 seconds for demo

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
    const referralId = `REF-${Date.now()}`
    const newRef: Referral = {
      id: referralId,
      patientName: newReferral.patientInitials,
      patientInitials: newReferral.patientInitials,
      diagnosis: newReferral.diagnosis,
      submittedDate: new Date().toISOString().split("T")[0],
      status: "pending",
      facilityName: "Mercy Hospital",
      caseManager: "Lisa Rodriguez, RN",
      services: newReferral.services,
      insuranceProvider: newReferral.insuranceProvider,
    }

    // Add DME order if needed
    if (newReferral.dmeNeeded && newReferral.dmeItems.length > 0) {
      newRef.dmeOrders = [
        {
          id: `DME-${Date.now()}`,
          referralId: referralId,
          items: newReferral.dmeItems,
          status: "pending",
          orderDate: new Date().toISOString().split("T")[0],
          supplier: "parachute",
        },
      ]
    }

    setReferrals((prev) => [newRef, ...prev])

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

    // Simulate real-time status update
    setTimeout(() => {
      setReferrals((prev) => prev.map((ref) => (ref.id === referralId ? { ...ref, status: "accepted" } : ref)))
    }, 3000)
  }

  const orderDMESupplies = async (referralId: string, items: DMEItem[], supplier: "parachute" | "verse") => {
    const dmeOrder: DMEOrder = {
      id: `DME-${Date.now()}`,
      referralId,
      items,
      status: "pending",
      orderDate: new Date().toISOString().split("T")[0],
      supplier,
    }

    setReferrals((prev) =>
      prev.map((ref) => (ref.id === referralId ? { ...ref, dmeOrders: [...(ref.dmeOrders || []), dmeOrder] } : ref)),
    )

    // Simulate approval and shipping
    setTimeout(() => {
      setReferrals((prev) =>
        prev.map((ref) => ({
          ...ref,
          dmeOrders: ref.dmeOrders?.map((order) =>
            order.id === dmeOrder.id ? { ...order, status: "approved", estimatedDelivery: "2024-01-20" } : order,
          ),
        })),
      )
    }, 2000)

    setTimeout(() => {
      setReferrals((prev) =>
        prev.map((ref) => ({
          ...ref,
          dmeOrders: ref.dmeOrders?.map((order) =>
            order.id === dmeOrder.id
              ? { ...order, status: "shipped", trackingNumber: `${supplier.toUpperCase()}123456789` }
              : order,
          ),
        })),
      )
    }, 5000)
  }

  const sendAIMessage = async (message: string) => {
    setChatMessages((prev) => [...prev, `You: ${message}`])
    setChatInput("")
    setAiTyping(true)

    // Simulate AI response
    setTimeout(() => {
      let response = ""
      const lowerMessage = message.toLowerCase()

      if (lowerMessage.includes("refer") || lowerMessage.includes("referral")) {
        response =
          "To submit a referral, go to the 'Submit Referral' tab and fill out the patient information. We accept referrals for skilled nursing, physical therapy, occupational therapy, and wound care services."
      } else if (lowerMessage.includes("insurance") || lowerMessage.includes("coverage")) {
        response =
          "We accept Medicare, Medicaid, and most major commercial insurances including Humana, United Healthcare, Aetna, and Cigna. Prior authorization may be required for some services."
      } else if (lowerMessage.includes("dme") || lowerMessage.includes("supplies")) {
        response =
          "We can arrange DME supplies through our partnerships with Parachute Health and Verse Medical. Common items include wound care supplies, mobility aids, diabetic supplies, and respiratory equipment."
      } else if (lowerMessage.includes("status") || lowerMessage.includes("track")) {
        response =
          "You can track all your referrals in the 'Referral Tracker' tab. Status updates are provided in real-time, and you'll receive notifications for any changes."
      } else if (lowerMessage.includes("contact") || lowerMessage.includes("phone")) {
        response =
          "You can reach our intake team at (555) 123-4567 or use the secure messaging system in this portal. Our team is available 24/7 for urgent matters."
      } else {
        response =
          "I'm here to help with referrals, insurance questions, DME supplies, and general information about our services. What specific question can I assist you with?"
      }

      setChatMessages((prev) => [...prev, `AI Assistant: ${response}`])
      setAiTyping(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Facility Portal</h1>
                <p className="text-gray-600">Mercy Hospital - Case Management Team</p>
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
                  <Button onClick={submitReferral} className="bg-blue-600 hover:bg-blue-700">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Referral
                  </Button>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                </div>
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
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
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
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {referral.status === "accepted" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  orderDMESupplies(
                                    referral.id,
                                    [
                                      {
                                        name: "Wound Care Kit",
                                        quantity: 1,
                                        category: "wound_care",
                                        urgency: "routine",
                                      },
                                    ],
                                    "parachute",
                                  )
                                }
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
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Secure Messaging Hub
                </CardTitle>
                <CardDescription>HIPAA-compliant communication with M.A.S.E. team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg border ${!message.read ? "bg-blue-50 border-blue-200" : "bg-gray-50"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              message.type === "alert"
                                ? "destructive"
                                : message.type === "notification"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {message.type}
                          </Badge>
                          <span className="font-medium">{message.from}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(message.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-medium mb-2">{message.subject}</h4>
                      <p className="text-gray-700">{message.content}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t">
                  <Button>
                    <Send className="h-4 w-4 mr-2" />
                    Compose Message
                  </Button>
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
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  DME Supply Management
                </CardTitle>
                <CardDescription>Automated DME ordering through Parachute Health & Verse Medical</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">Parachute Health</h3>
                        <p className="text-sm text-gray-600">Automated DME ordering platform</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Package className="h-4 w-4 mr-2" />
                      Order DME Supplies
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">Verse Medical</h3>
                        <p className="text-sm text-gray-600">Medical supply management</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Package className="h-4 w-4 mr-2" />
                      Browse Catalog
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Recent DME Orders</h3>
                  {referrals
                    .filter((r) => r.dmeOrders && r.dmeOrders.length > 0)
                    .map((referral) =>
                      referral.dmeOrders?.map((order) => (
                        <div key={order.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">Order {order.id}</h4>
                              <p className="text-sm text-gray-600">Patient: {referral.patientInitials}</p>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status === "shipped" && <Truck className="h-3 w-3 mr-1" />}
                              {order.status === "delivered" && <CheckCircle className="h-3 w-3 mr-1" />}
                              <span className="capitalize">{order.status}</span>
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{item.name}</span>
                                <span>Qty: {item.quantity}</span>
                              </div>
                            ))}
                          </div>
                          {order.trackingNumber && (
                            <div className="mt-3 p-2 bg-blue-50 rounded">
                              <p className="text-sm text-blue-800">
                                <Truck className="h-4 w-4 inline mr-1" />
                                Tracking: {order.trackingNumber}
                              </p>
                              {order.estimatedDelivery && (
                                <p className="text-xs text-blue-600">Estimated delivery: {order.estimatedDelivery}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )),
                    )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="h-5 w-5 mr-2" />
                  AI Assistant - 24/7 Support
                </CardTitle>
                <CardDescription>Get instant answers about referrals, services, and insurance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-96 border rounded-lg p-4 overflow-y-auto bg-gray-50">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-500 mt-20">
                        <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>Hi! I'm your AI assistant. Ask me about:</p>
                        <ul className="text-sm mt-2 space-y-1">
                          <li>• How to submit referrals</li>
                          <li>• Insurance coverage questions</li>
                          <li>• DME supply ordering</li>
                          <li>• Service availability</li>
                          <li>• Contact information</li>
                        </ul>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {chatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg ${msg.startsWith("You:") ? "bg-blue-100 ml-8" : "bg-white mr-8"}`}
                          >
                            <p className="text-sm">{msg}</p>
                          </div>
                        ))}
                        {aiTyping && (
                          <div className="bg-white mr-8 p-3 rounded-lg">
                            <p className="text-sm text-gray-500">AI Assistant is typing...</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask me anything about referrals, insurance, or services..."
                      onKeyPress={(e) => e.key === "Enter" && chatInput.trim() && sendAIMessage(chatInput)}
                    />
                    <Button
                      onClick={() => chatInput.trim() && sendAIMessage(chatInput)}
                      disabled={!chatInput.trim() || aiTyping}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button variant="outline" size="sm" onClick={() => sendAIMessage("How do I submit a referral?")}>
                      Submit Referral
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => sendAIMessage("What insurance do you accept?")}>
                      Insurance Info
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => sendAIMessage("How do I order DME supplies?")}>
                      DME Supplies
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendAIMessage("What is your contact information?")}
                    >
                      Contact Info
                    </Button>
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
