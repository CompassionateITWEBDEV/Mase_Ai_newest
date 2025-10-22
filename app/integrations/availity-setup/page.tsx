"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Settings,
  Shield,
  DollarSign,
  FileCheck,
  Zap,
  RefreshCw,
  Eye,
  EyeOff,
  Globe,
} from "lucide-react"
import Link from "next/link"

export default function AvailitySetupPage() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    organizationId: "",
    applicationId: "",
    environment: "production",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")
  const [testResults, setTestResults] = useState<any>(null)

  const [syncSettings, setSyncSettings] = useState({
    autoEligibilityCheck: true,
    autoPriorAuth: true,
    realTimeUpdates: true,
    batchProcessing: true,
    syncFrequency: "15",
    enableClaims: false,
    enableRemittance: false,
  })

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }))
  }

  const handleSyncSettingChange = (setting: string, value: boolean | string) => {
    setSyncSettings((prev) => ({ ...prev, [setting]: value }))
  }

  const testConnection = async () => {
    setIsConnecting(true)
    setConnectionStatus("idle")

    try {
      const response = await fetch("/api/integrations/availity/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (data.success) {
        setConnectionStatus("success")
        setTestResults(data.testResults)
      } else {
        setConnectionStatus("error")
        setTestResults({ error: data.message })
      }
    } catch (error) {
      setConnectionStatus("error")
      setTestResults({ error: "Failed to connect to Availity API" })
    } finally {
      setIsConnecting(false)
    }
  }

  const saveConfiguration = async () => {
    try {
      const response = await fetch("/api/integrations/availity/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentials,
          syncSettings,
        }),
      })

      if (response.ok) {
        alert("Availity integration configured successfully!")
      } else {
        alert("Failed to save configuration")
      }
    } catch (error) {
      alert("Error saving configuration")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Link href="/integrations">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Integrations
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Availity Integration Setup</h1>
              <p className="text-gray-600">
                Configure eligibility verification, prior authorization, and claims processing with Availity
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="credentials" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="settings">Services</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-blue-600" />
                  Availity Portal Credentials
                </CardTitle>
                <CardDescription>
                  Enter your Availity portal credentials to enable real-time eligibility, prior authorization, and
                  claims processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Availity Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your Availity username"
                      value={credentials.username}
                      onChange={(e) => handleCredentialChange("username", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your Availity password"
                        value={credentials.password}
                        onChange={(e) => handleCredentialChange("password", e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizationId">Organization ID</Label>
                    <Input
                      id="organizationId"
                      type="text"
                      placeholder="Your Availity Organization ID"
                      value={credentials.organizationId}
                      onChange={(e) => handleCredentialChange("organizationId", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="applicationId">Application ID</Label>
                    <Input
                      id="applicationId"
                      type="text"
                      placeholder="Your registered Application ID"
                      value={credentials.applicationId}
                      onChange={(e) => handleCredentialChange("applicationId", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <Select
                    value={credentials.environment}
                    onValueChange={(value) => handleCredentialChange("environment", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="sandbox">Sandbox/Testing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Availity Integration Benefits</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Availity provides real-time access to 2,500+ health plans, covering 99% of insured Americans. This
                    integration enables instant eligibility verification and streamlined prior authorization workflows.
                  </AlertDescription>
                </Alert>

                <div className="flex space-x-2">
                  <Button
                    onClick={testConnection}
                    disabled={!credentials.username || !credentials.password || isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Testing Connection...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>

                  {connectionStatus === "success" && (
                    <Button onClick={saveConfiguration}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Configuration
                    </Button>
                  )}
                </div>

                {connectionStatus === "success" && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Connection Successful</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Successfully connected to Availity API. All enabled services are now available.
                    </AlertDescription>
                  </Alert>
                )}

                {connectionStatus === "error" && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertTitle className="text-red-800">Connection Failed</AlertTitle>
                    <AlertDescription className="text-red-700">
                      {testResults?.error ||
                        "Unable to connect to Availity API. Please verify your credentials and organization setup."}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-purple-600" />
                  Availity Services Configuration
                </CardTitle>
                <CardDescription>Enable and configure Availity services for your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Real-Time Eligibility & Benefits</Label>
                        <p className="text-sm text-gray-600">
                          Instant eligibility verification with detailed benefit information
                        </p>
                      </div>
                      <Switch
                        checked={syncSettings.autoEligibilityCheck}
                        onCheckedChange={(checked) => handleSyncSettingChange("autoEligibilityCheck", checked)}
                      />
                    </div>
                    {syncSettings.autoEligibilityCheck && (
                      <div className="mt-3 pl-4 border-l-2 border-blue-200">
                        <p className="text-xs text-gray-500">
                          • Copay, deductible, and out-of-pocket information • Coverage verification for home health
                          services • Real-time benefit details
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Prior Authorization</Label>
                        <p className="text-sm text-gray-600">Automated prior authorization submission and tracking</p>
                      </div>
                      <Switch
                        checked={syncSettings.autoPriorAuth}
                        onCheckedChange={(checked) => handleSyncSettingChange("autoPriorAuth", checked)}
                      />
                    </div>
                    {syncSettings.autoPriorAuth && (
                      <div className="mt-3 pl-4 border-l-2 border-green-200">
                        <p className="text-xs text-gray-500">
                          • Automatic PA submission for qualifying services • Real-time status updates and notifications
                          • Attachment support for clinical documentation
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Claims Processing</Label>
                        <p className="text-sm text-gray-600">Electronic claims submission and status tracking</p>
                      </div>
                      <Switch
                        checked={syncSettings.enableClaims}
                        onCheckedChange={(checked) => handleSyncSettingChange("enableClaims", checked)}
                      />
                    </div>
                    {syncSettings.enableClaims && (
                      <div className="mt-3 pl-4 border-l-2 border-purple-200">
                        <p className="text-xs text-gray-500">
                          • Electronic claim submission (837P) • Real-time claim status inquiries • Claim rejection and
                          denial management
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="space-y-0.5">
                        <Label className="text-base font-medium">Electronic Remittance</Label>
                        <p className="text-sm text-gray-600">Automated ERA processing and payment reconciliation</p>
                      </div>
                      <Switch
                        checked={syncSettings.enableRemittance}
                        onCheckedChange={(checked) => handleSyncSettingChange("enableRemittance", checked)}
                      />
                    </div>
                    {syncSettings.enableRemittance && (
                      <div className="mt-3 pl-4 border-l-2 border-orange-200">
                        <p className="text-xs text-gray-500">
                          • Automatic ERA download and processing • Payment posting and reconciliation • Denial and
                          adjustment tracking
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="syncFrequency">Sync Frequency</Label>
                  <Select
                    value={syncSettings.syncFrequency}
                    onValueChange={(value) => handleSyncSettingChange("syncFrequency", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Every 5 minutes</SelectItem>
                      <SelectItem value="15">Every 15 minutes</SelectItem>
                      <SelectItem value="30">Every 30 minutes</SelectItem>
                      <SelectItem value="60">Every hour</SelectItem>
                      <SelectItem value="240">Every 4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Availity Advantage</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Availity's network includes Medicare, Medicaid, and most major commercial payers, providing
                    comprehensive coverage for home health eligibility and authorization needs.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileCheck className="h-5 w-5 mr-2 text-green-600" />
                  Service Testing & Validation
                </CardTitle>
                <CardDescription>Test Availity services with sample patient data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
                    <Shield className="h-6 w-6 mb-2 text-blue-600" />
                    <span className="text-sm">Test Eligibility</span>
                  </Button>

                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
                    <FileCheck className="h-6 w-6 mb-2 text-green-600" />
                    <span className="text-sm">Test Prior Auth</span>
                  </Button>

                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
                    <DollarSign className="h-6 w-6 mb-2 text-purple-600" />
                    <span className="text-sm">Test Claims</span>
                  </Button>

                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
                    <RefreshCw className="h-6 w-6 mb-2 text-orange-600" />
                    <span className="text-sm">Test ERA</span>
                  </Button>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-3">Sample Test Data</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">Test Patient</Label>
                      <p>Jane Doe</p>
                      <p>DOB: 01/01/1980</p>
                      <p>Member ID: TEST123456</p>
                    </div>
                    <div>
                      <Label className="font-medium">Test Payer</Label>
                      <p>Availity Test Payer</p>
                      <p>Payer ID: 12345</p>
                      <p>Plan: Test Plan A</p>
                    </div>
                  </div>
                </div>

                {testResults && connectionStatus === "success" && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Test Results</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>API Response Time:</span>
                        <Badge variant="outline">0.8s</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Eligibility Service:</span>
                        <Badge className="bg-green-100 text-green-800">Available</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Prior Auth Service:</span>
                        <Badge className="bg-green-100 text-green-800">Available</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Claims Service:</span>
                        <Badge className="bg-green-100 text-green-800">Available</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>ERA Service:</span>
                        <Badge className="bg-green-100 text-green-800">Available</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-orange-600" />
                  Availity Integration Monitoring
                </CardTitle>
                <CardDescription>Monitor Availity service performance and transaction volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-700">Eligibility Checks</p>
                        <p className="text-2xl font-bold text-blue-600">342</p>
                      </div>
                      <Shield className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">Prior Auths</p>
                        <p className="text-2xl font-bold text-green-600">89</p>
                      </div>
                      <FileCheck className="h-8 w-8 text-green-500" />
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-700">Claims Submitted</p>
                        <p className="text-2xl font-bold text-purple-600">156</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-purple-500" />
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-700">Success Rate</p>
                        <p className="text-2xl font-bold text-orange-600">99.1%</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-orange-500" />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-4">Recent Transactions</h3>
                  <div className="space-y-2">
                    {[
                      {
                        time: "2:18 PM",
                        service: "Eligibility Check",
                        patient: "Margaret Anderson",
                        payer: "Medicare",
                        status: "success",
                      },
                      {
                        time: "2:15 PM",
                        service: "Prior Auth",
                        patient: "Robert Thompson",
                        payer: "Blue Cross",
                        status: "approved",
                      },
                      {
                        time: "2:12 PM",
                        service: "Claim Submission",
                        patient: "Dorothy Williams",
                        payer: "Medicaid",
                        status: "accepted",
                      },
                      {
                        time: "2:08 PM",
                        service: "ERA Processing",
                        patient: "Batch #1247",
                        payer: "Multiple",
                        status: "processed",
                      },
                    ].map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm text-gray-500">{transaction.time}</div>
                          <div className="text-sm font-medium">{transaction.service}</div>
                          <div className="text-sm text-gray-600">{transaction.patient}</div>
                          <div className="text-sm text-gray-500">({transaction.payer})</div>
                        </div>
                        <Badge
                          className={
                            transaction.status === "success" ||
                            transaction.status === "approved" ||
                            transaction.status === "accepted" ||
                            transaction.status === "processed"
                              ? "bg-green-100 text-green-800"
                              : transaction.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    ))}
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
