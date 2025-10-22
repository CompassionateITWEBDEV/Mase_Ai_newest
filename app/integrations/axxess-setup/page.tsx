"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Database,
  Settings,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  FileText,
  Printer,
  Send,
  Eye,
  Clock,
  Activity,
  ArrowLeft,
  Search,
  Filter,
  Mail,
  Phone,
  Globe,
  Info,
  HelpCircle,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

interface AxxessConfig {
  apiUrl: string
  username: string
  password: string
  agencyId: string
  environment: "production" | "staging" | "sandbox"
  autoSync: boolean
  syncInterval: number
  enableWebhooks: boolean
  webhookUrl: string
  dataRetention: number
  compressionEnabled: boolean
  encryptionEnabled: boolean
}

interface SyncMetrics {
  totalRecords: number
  successfulSyncs: number
  failedSyncs: number
  lastSyncTime: string
  averageResponseTime: number
  dataTransferred: number
  errorRate: number
  uptime: number
}

interface ADRRequest {
  id: string
  requestId: string
  insuranceCompany: string
  patientName: string
  patientId: string
  memberNumber: string
  serviceDates: {
    start: string
    end: string
  }
  requestDate: string
  dueDate: string
  status: "pending" | "in_progress" | "completed" | "submitted" | "overdue"
  recordTypes: string[]
  comments: string
  submissionMethod: "fax" | "portal" | "mail" | "electronic"
  contactInfo: {
    faxNumber?: string
    portalUrl?: string
    mailAddress?: string
    email?: string
  }
  priority: "routine" | "urgent" | "stat"
  assignedTo: string
  completedBy?: string
  submittedAt?: string
  responseTime?: number
}

export default function AxxessSetup() {
  const [activeTab, setActiveTab] = useState("configuration")
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showADRDialog, setShowADRDialog] = useState(false)
  const [showSampleChart, setShowSampleChart] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<string>("")
  const [adrFilter, setAdrFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const [config, setConfig] = useState<AxxessConfig>({
    apiUrl: "https://api.axxess.com/v1",
    username: "",
    password: "",
    agencyId: "",
    environment: "sandbox",
    autoSync: true,
    syncInterval: 15,
    enableWebhooks: true,
    webhookUrl: "",
    dataRetention: 90,
    compressionEnabled: true,
    encryptionEnabled: true,
  })

  const [metrics, setMetrics] = useState<SyncMetrics>({
    totalRecords: 1247,
    successfulSyncs: 1198,
    failedSyncs: 49,
    lastSyncTime: "2024-01-16 14:30:00",
    averageResponseTime: 1.2,
    dataTransferred: 45.7,
    errorRate: 3.9,
    uptime: 99.2,
  })

  const [adrRequests, setAdrRequests] = useState<ADRRequest[]>([
    {
      id: "ADR-2024-001",
      requestId: "HMRM32944586",
      insuranceCompany: "Humana",
      patientName: "David R Hallman",
      patientId: "PT-2024-001",
      memberNumber: "H5957862900",
      serviceDates: {
        start: "2024-04-11",
        end: "2024-05-08",
      },
      requestDate: "2024-01-15",
      dueDate: "2024-02-14",
      status: "pending",
      recordTypes: [
        "All Therapy Notes/Grids",
        "Diagnosis Notes Incl. Past Medical History",
        "Home Health Care Notes",
        "Orders",
        "Physical/Speech/Occup. Therapy Notes",
        "Plan of Care",
        "OASIS Assessments",
        "Physician Progress Notes",
        "CNA/Home Health Aide notes",
      ],
      comments:
        "Include signed physician documentation supporting primary/secondary diagnosis codes billed, dated plan of care, all interim orders, all discipline notes billed, coordination/missed visit notes, all therapy evaluations/re-evaluations for the entire 60 day certification period.",
      submissionMethod: "electronic",
      contactInfo: {
        portalUrl: "www.availity.com",
        faxNumber: "866-305-6655",
        email: "medicalrecords@humana.com",
      },
      priority: "routine",
      assignedTo: "Sarah Johnson, RN",
    },
    {
      id: "ADR-2024-002",
      requestId: "BCBS-78945612",
      insuranceCompany: "Blue Cross Blue Shield",
      patientName: "Margaret Anderson",
      patientId: "PT-2024-002",
      memberNumber: "XYZ123456789",
      serviceDates: {
        start: "2024-03-15",
        end: "2024-05-13",
      },
      requestDate: "2024-01-14",
      dueDate: "2024-02-13",
      status: "in_progress",
      recordTypes: [
        "OASIS Assessments",
        "Skilled Nursing Notes",
        "Physical Therapy Notes",
        "Plan of Care",
        "Physician Orders",
        "Medication Records",
      ],
      comments:
        "Pre-authorization review for continued home health services. Include functional improvement documentation and therapy progress notes.",
      submissionMethod: "portal",
      contactInfo: {
        portalUrl: "provider.bcbs.com",
        email: "prior.auth@bcbs.com",
      },
      priority: "urgent",
      assignedTo: "Michael Chen, PT",
    },
    {
      id: "ADR-2024-003",
      requestId: "UHC-55667788",
      insuranceCompany: "UnitedHealthcare",
      patientName: "Robert Thompson",
      patientId: "PT-2024-003",
      memberNumber: "UHC987654321",
      serviceDates: {
        start: "2024-02-01",
        end: "2024-03-31",
      },
      requestDate: "2024-01-13",
      dueDate: "2024-02-12",
      status: "completed",
      recordTypes: ["Complete Chart", "Lab Results", "Discharge Summary", "Care Coordination Notes"],
      comments: "Post-payment audit. Provide complete medical record for services rendered during specified period.",
      submissionMethod: "fax",
      contactInfo: {
        faxNumber: "1-800-555-0199",
      },
      priority: "routine",
      assignedTo: "Lisa Park, RN",
      completedBy: "Lisa Park, RN",
      submittedAt: "2024-01-20 16:45:00",
      responseTime: 7,
    },
  ])

  // Test Axxess connection
  const testConnection = async () => {
    setIsTesting(true)
    try {
      const response = await fetch("/api/integrations/axxess/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: config.username,
          password: config.password,
          agencyId: config.agencyId,
          environment: config.environment,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsConnected(data.success)
        if (data.success) {
          // Update metrics with test results
          setMetrics((prev) => ({
            ...prev,
            lastSyncTime: new Date().toISOString(),
            averageResponseTime: data.responseTime || prev.averageResponseTime,
          }))
        }
      }
    } catch (error) {
      console.error("Connection test failed:", error)
      setIsConnected(false)
    } finally {
      setIsTesting(false)
    }
  }

  // Save configuration
  const saveConfiguration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/integrations/axxess/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        // Configuration saved successfully
        await testConnection()
      }
    } catch (error) {
      console.error("Failed to save configuration:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate sample chart for ADR
  const generateSampleChart = async (patientId: string, adrId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/axxess/comprehensive-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          includeVisitNotes: true,
          includeAllDisciplines: true,
          syncType: "adr_review",
          adrRequestId: adrId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setShowSampleChart(true)
          // Update ADR status
          setAdrRequests((prev) =>
            prev.map((adr) => (adr.id === adrId ? { ...adr, status: "in_progress" as const } : adr)),
          )
        }
      }
    } catch (error) {
      console.error("Failed to generate sample chart:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Print/Export chart for ADR submission
  const exportChartForADR = async (adrId: string, format: "pdf" | "fax" | "electronic") => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/comprehensive-qa/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adrId,
          format,
          includeAllDocuments: true,
          electronicSubmission: format === "electronic",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Update ADR status to completed
          setAdrRequests((prev) =>
            prev.map((adr) =>
              adr.id === adrId
                ? {
                    ...adr,
                    status: "completed" as const,
                    completedBy: "System User",
                    submittedAt: new Date().toISOString(),
                  }
                : adr,
            ),
          )

          // Download or submit based on format
          if (format === "pdf") {
            window.open(data.downloadUrl, "_blank")
          } else if (format === "electronic") {
            // Handle electronic submission
            console.log("Electronic submission initiated")
          }
        }
      }
    } catch (error) {
      console.error("Failed to export chart:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter ADR requests
  const filteredADRs = adrRequests.filter((adr) => {
    const matchesSearch =
      adr.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adr.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adr.insuranceCompany.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = adrFilter === "all" || adr.status === adrFilter

    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "submitted":
        return "bg-purple-100 text-purple-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "stat":
        return "bg-red-100 text-red-800"
      case "urgent":
        return "bg-orange-100 text-orange-800"
      case "routine":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/integrations">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Integrations
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Axxess Integration Setup</h1>
                <p className="text-gray-600">Configure Axxess API connection and ADR management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {isConnected ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Disconnected
                  </>
                )}
              </Badge>
              <Button onClick={testConnection} disabled={isTesting} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw className={`h-4 w-4 mr-2 ${isTesting ? "animate-spin" : ""}`} />
                Test Connection
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="adr-management">ADR Management</TabsTrigger>
            <TabsTrigger value="sync-monitoring">Sync Monitoring</TabsTrigger>
            <TabsTrigger value="chart-export">Chart Export</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          </TabsList>

          <TabsContent value="configuration" className="space-y-6">
            {/* API Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  API Configuration
                </CardTitle>
                <CardDescription>Configure your Axxess API connection settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="environment">Environment</Label>
                      <Select
                        value={config.environment}
                        onValueChange={(value: "production" | "staging" | "sandbox") =>
                          setConfig((prev) => ({ ...prev, environment: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="apiUrl">Axxess Login URL</Label>
                      <Input
                        id="apiUrl"
                        value={config.apiUrl}
                        onChange={(e) => setConfig((prev) => ({ ...prev, apiUrl: e.target.value }))}
                        placeholder="https://login.axxess.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="username">Axxess Username</Label>
                      <Input
                        id="username"
                        value={config.username}
                        onChange={(e) => setConfig((prev) => ({ ...prev, username: e.target.value }))}
                        placeholder="Your Axxess login username"
                      />
                    </div>

                    <div>
                      <Label htmlFor="password">Axxess Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={config.password}
                        onChange={(e) => setConfig((prev) => ({ ...prev, password: e.target.value }))}
                        placeholder="Your Axxess login password"
                      />
                    </div>

                    <div>
                      <Label htmlFor="agencyId">Agency ID</Label>
                      <Input
                        id="agencyId"
                        value={config.agencyId}
                        onChange={(e) => setConfig((prev) => ({ ...prev, agencyId: e.target.value }))}
                        placeholder="Your Axxess Agency ID"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="webhookUrl">Webhook URL</Label>
                      <Input
                        id="webhookUrl"
                        value={config.webhookUrl}
                        onChange={(e) => setConfig((prev) => ({ ...prev, webhookUrl: e.target.value }))}
                        placeholder="https://your-domain.com/api/webhooks/axxess"
                      />
                    </div>

                    <div>
                      <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
                      <Input
                        id="syncInterval"
                        type="number"
                        value={config.syncInterval}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, syncInterval: Number.parseInt(e.target.value) }))
                        }
                        min="5"
                        max="1440"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dataRetention">Data Retention (days)</Label>
                      <Input
                        id="dataRetention"
                        type="number"
                        value={config.dataRetention}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, dataRetention: Number.parseInt(e.target.value) }))
                        }
                        min="30"
                        max="365"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="autoSync">Auto Sync</Label>
                        <Switch
                          id="autoSync"
                          checked={config.autoSync}
                          onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, autoSync: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="enableWebhooks">Enable Webhooks</Label>
                        <Switch
                          id="enableWebhooks"
                          checked={config.enableWebhooks}
                          onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, enableWebhooks: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="compressionEnabled">Data Compression</Label>
                        <Switch
                          id="compressionEnabled"
                          checked={config.compressionEnabled}
                          onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, compressionEnabled: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="encryptionEnabled">Encryption</Label>
                        <Switch
                          id="encryptionEnabled"
                          checked={config.encryptionEnabled}
                          onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, encryptionEnabled: checked }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button onClick={saveConfiguration} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                    <Settings className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                  <Button onClick={testConnection} disabled={isTesting} variant="outline">
                    <RefreshCw className={`h-4 w-4 mr-2 ${isTesting ? "animate-spin" : ""}`} />
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Connection Status */}
            {isConnected && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Connection Successful</AlertTitle>
                <AlertDescription className="text-green-700">
                  Successfully connected to Axxess API. All systems operational and ready for ADR processing.
                </AlertDescription>
              </Alert>
            )}

            {/* API Integration Status */}
            {isConnected && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Active API Integrations
                  </CardTitle>
                  <CardDescription>
                    Real-time data flow enabled through Axxess API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">G7 Patient Selection</h4>
                          <p className="text-sm text-gray-600">Patient filtering & selection</p>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          Active
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">G8 Data Category Request</h4>
                          <p className="text-sm text-gray-600">Categorized data requests</p>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          Active
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">All Data Requests</h4>
                          <p className="text-sm text-gray-600">Comprehensive data retrieval</p>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <Info className="h-4 w-4 inline mr-1" />
                      Real data flow is now enabled through these Axxess API integrations. 
                      Patient data, requests, and categories are synchronized in real-time.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="adr-management" className="space-y-6">
            {/* ADR Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total ADRs</p>
                      <p className="text-2xl font-bold text-gray-900">{adrRequests.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {adrRequests.filter((adr) => adr.status === "pending").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-green-600">
                        {adrRequests.filter((adr) => adr.status === "completed").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">
                        {adrRequests.filter((adr) => adr.status === "overdue").length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ADR Filters and Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Filter className="h-5 w-5 mr-2" />
                    ADR Requests
                  </div>
                  <Dialog open={showADRDialog} onOpenChange={setShowADRDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <FileText className="h-4 w-4 mr-2" />
                        New ADR Request
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New ADR Request</DialogTitle>
                        <DialogDescription>Manually create an ADR request for any insurance company</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Insurance Company</Label>
                            <Input placeholder="e.g., Humana, BCBS, UHC, Aetna" />
                          </div>
                          <div>
                            <Label>Request ID</Label>
                            <Input placeholder="Insurance request ID" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Patient Name</Label>
                            <Input placeholder="Patient full name" />
                          </div>
                          <div>
                            <Label>Member Number</Label>
                            <Input placeholder="Insurance member ID" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Service Start Date</Label>
                            <Input type="date" />
                          </div>
                          <div>
                            <Label>Service End Date</Label>
                            <Input type="date" />
                          </div>
                        </div>
                        <div>
                          <Label>Comments/Special Instructions</Label>
                          <Textarea placeholder="Any specific requirements or comments from the insurance company" />
                        </div>
                        <div className="flex space-x-2">
                          <Button className="flex-1">Create ADR Request</Button>
                          <Button variant="outline" onClick={() => setShowADRDialog(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by patient name, request ID, or insurance..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={adrFilter} onValueChange={setAdrFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request Info</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Insurance</TableHead>
                        <TableHead>Service Dates</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredADRs.map((adr) => (
                        <TableRow key={adr.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{adr.requestId}</div>
                              <div className="text-sm text-gray-600">Assigned: {adr.assignedTo}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{adr.patientName}</div>
                              <div className="text-sm text-gray-600">{adr.memberNumber}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{adr.insuranceCompany}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{adr.serviceDates.start}</div>
                              <div>to {adr.serviceDates.end}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(adr.status)}>{adr.status.replace("_", " ")}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(adr.priority)}>{adr.priority}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{adr.dueDate}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateSampleChart(adr.patientId, adr.id)}
                                disabled={isLoading}
                                title="Generate Sample Chart"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => exportChartForADR(adr.id, "pdf")}
                                disabled={isLoading}
                                title="Print Chart"
                              >
                                <Printer className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => exportChartForADR(adr.id, "electronic")}
                                disabled={isLoading}
                                title="Electronic Submission"
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync-monitoring" className="space-y-6">
            {/* Sync Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Database className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Records</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics.totalRecords.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Success Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        {((metrics.successfulSyncs / metrics.totalRecords) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg Response</p>
                      <p className="text-2xl font-bold text-purple-600">{metrics.averageResponseTime}s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Uptime</p>
                      <p className="text-2xl font-bold text-orange-600">{metrics.uptime}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sync Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Sync Status & History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Last Sync Successful</p>
                        <p className="text-sm text-gray-600">{metrics.lastSyncTime}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Records Processed</p>
                      <p className="font-bold">{metrics.totalRecords}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Data Transfer</span>
                        <span className="text-sm text-gray-600">{metrics.dataTransferred} MB</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Error Rate</span>
                        <span className="text-sm text-red-600">{metrics.errorRate}%</span>
                      </div>
                      <Progress value={metrics.errorRate} className="h-2" />
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">API Quota</span>
                        <span className="text-sm text-blue-600">2,847 / 5,000</span>
                      </div>
                      <Progress value={57} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chart-export" className="space-y-6">
            {/* Chart Export Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Printer className="h-5 w-5 mr-2" />
                  Chart Export & ADR Submission
                </CardTitle>
                <CardDescription>
                  Generate complete patient charts for ADR submission to any insurance company
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Electronic ADR Submission</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      Generate comprehensive patient charts with all required documentation for electronic submission to
                      insurance companies including Humana, BCBS, UnitedHealthcare, Aetna, and others.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-2 hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <Printer className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">Print Complete Chart</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Generate printable PDF with all required documents for fax or mail submission
                        </p>
                        <Button className="w-full" onClick={() => setShowSampleChart(true)}>
                          <Printer className="h-4 w-4 mr-2" />
                          Generate PDF
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-2 hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <Send className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">Electronic Submission</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Submit directly to insurance portals (Availity, provider portals, etc.)
                        </p>
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => generateSampleChart("PT-2024-001", "ADR-2024-001")}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Submit Electronically
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-2 hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <Eye className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">Preview Sample Chart</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Review complete chart before submission to ensure all requirements are met
                        </p>
                        <Button
                          variant="outline"
                          className="w-full bg-transparent"
                          onClick={() => generateSampleChart("PT-2024-001", "sample")}
                          disabled={isLoading}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {isLoading ? "Generating..." : "Preview Chart"}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sample Chart Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Generate Sample Chart for Testing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label>Select Patient for Sample Chart</Label>
                          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a patient..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PT-2024-001">David R Hallman (Humana ADR)</SelectItem>
                              <SelectItem value="PT-2024-002">Margaret Anderson (BCBS ADR)</SelectItem>
                              <SelectItem value="PT-2024-003">Robert Thompson (UHC ADR)</SelectItem>
                              <SelectItem value="PT-2024-004">Sample Patient (Demo)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex space-x-3">
                          <Button
                            onClick={() => selectedPatient && generateSampleChart(selectedPatient, "sample")}
                            disabled={!selectedPatient || isLoading}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {isLoading ? "Generating..." : "Generate Sample Chart"}
                          </Button>
                          <Button
                            onClick={() => selectedPatient && exportChartForADR("sample", "pdf")}
                            disabled={!selectedPatient || isLoading}
                            variant="outline"
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export as PDF
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="troubleshooting" className="space-y-6">
            {/* Troubleshooting Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Troubleshooting & Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Common Issues</h3>
                      <div className="space-y-3">
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="font-medium">Connection Timeout</span>
                          </div>
                          <p className="text-sm text-gray-600">Check API credentials and network connectivity</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium">Sync Failures</span>
                          </div>
                          <p className="text-sm text-gray-600">Verify data format and API rate limits</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Missing Records</span>
                          </div>
                          <p className="text-sm text-gray-600">Check date ranges and filter settings</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Diagnostic Tools</h3>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Test API Connection
                        </Button>
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <Database className="h-4 w-4 mr-2" />
                          Validate Data Sync
                        </Button>
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <Activity className="h-4 w-4 mr-2" />
                          Check System Health
                        </Button>
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <Download className="h-4 w-4 mr-2" />
                          Export Debug Logs
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-3">Contact Support</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg text-center">
                        <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <p className="font-medium">Email Support</p>
                        <p className="text-sm text-gray-600">support@mase.com</p>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <Phone className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="font-medium">Phone Support</p>
                        <p className="text-sm text-gray-600">1-800-MASE-HELP</p>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <Globe className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <p className="font-medium">Documentation</p>
                        <p className="text-sm text-gray-600">docs.mase.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sample Chart Modal */}
      {showSampleChart && (
        <Dialog open={showSampleChart} onOpenChange={setShowSampleChart}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Sample Patient Chart - ADR Ready
              </DialogTitle>
              <DialogDescription>
                Complete patient chart with all required documentation for ADR submission
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Chart Header */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Patient Name</p>
                    <p className="text-blue-900">David R Hallman</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">DOB</p>
                    <p className="text-blue-900">08/17/1961</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Member ID</p>
                    <p className="text-blue-900">H5957862900</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Service Dates</p>
                    <p className="text-blue-900">4/11/2025 - 5/8/2025</p>
                  </div>
                </div>
              </div>

              {/* Document Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ADR Document Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "OASIS Assessments (SOC, ROC, Discharge)",
                      "Skilled Nursing Notes",
                      "Physical Therapy Notes & Evaluations",
                      "Occupational Therapy Notes",
                      "Speech Therapy Notes",
                      "Home Health Aide Notes",
                      "Plan of Care (Signed & Dated)",
                      "Physician Orders",
                      "Medication Records",
                      "Lab Results",
                      "Coordination Notes",
                      "Discharge Planning",
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Export Actions */}
              <div className="flex space-x-3">
                <Button onClick={() => exportChartForADR("sample", "pdf")} className="flex-1" disabled={isLoading}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Complete Chart
                </Button>
                <Button
                  onClick={() => exportChartForADR("sample", "electronic")}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Electronically
                </Button>
                <Button variant="outline" onClick={() => setShowSampleChart(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
