"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle,
  XCircle,
  Clock,
  Play,
  RefreshCw,
  Shield,
  Database,
  Users,
  FileText,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react"

interface IntegrationTest {
  id: string
  name: string
  type: "healthcare" | "database" | "hr" | "qa"
  status: "idle" | "testing" | "success" | "error"
  lastTested?: string
  responseTime?: number
  error?: string
  credentials?: {
    username?: string
    password?: string
    apiKey?: string
    clientId?: string
    environment?: string
  }
  testResults?: any
}

export default function IntegrationTesting() {
  const [integrations, setIntegrations] = useState<IntegrationTest[]>([
    {
      id: "axxess",
      name: "Axxess Integration",
      type: "healthcare",
      status: "idle",
      credentials: { username: "", password: "", environment: "production" },
    },
    {
      id: "availity",
      name: "Availity Integration",
      type: "healthcare",
      status: "idle",
      credentials: { username: "", password: "", organizationId: "" },
    },
    {
      id: "extendedcare",
      name: "Extended Care Integration",
      type: "healthcare",
      status: "idle",
      credentials: { username: "", password: "", clientId: "" },
    },
    {
      id: "change-healthcare",
      name: "Change Healthcare Integration",
      type: "healthcare",
      status: "idle",
      credentials: { username: "", password: "", submitterId: "" },
    },
    {
      id: "supabase",
      name: "Supabase Database",
      type: "database",
      status: "idle",
      credentials: {},
    },
    {
      id: "neon",
      name: "Neon Database",
      type: "database",
      status: "idle",
      credentials: {},
    },
    {
      id: "adr-management",
      name: "ADR Management System",
      type: "qa",
      status: "idle",
      credentials: {},
    },
    {
      id: "staff-competency",
      name: "Staff Competency Evaluation",
      type: "hr",
      status: "idle",
      credentials: {},
    },
    {
      id: "hr-system",
      name: "HR Management System",
      type: "hr",
      status: "idle",
      credentials: {},
    },
    {
      id: "qa-coding",
      name: "QA Coding System",
      type: "qa",
      status: "idle",
      credentials: {},
    },
  ])

  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})
  const [testingAll, setTestingAll] = useState(false)

  const updateIntegrationCredentials = (id: string, field: string, value: string) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id
          ? {
              ...integration,
              credentials: { ...integration.credentials, [field]: value },
            }
          : integration,
      ),
    )
  }

  const testIntegration = async (id: string) => {
    setIntegrations((prev) =>
      prev.map((integration) => (integration.id === id ? { ...integration, status: "testing" as const } : integration)),
    )

    try {
      const integration = integrations.find((i) => i.id === id)
      if (!integration) return

      let response
      const startTime = Date.now()

      switch (id) {
        case "axxess":
          response = await fetch("/api/integrations/axxess/test-connection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: integration.credentials?.username,
              password: integration.credentials?.password,
              agencyId: "TEST-AGENCY",
              environment: integration.credentials?.environment || "production",
            }),
          })
          break

        case "availity":
          response = await fetch("/api/integrations/availity/test-connection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: integration.credentials?.username,
              password: integration.credentials?.password,
              organizationId: integration.credentials?.organizationId,
              environment: "production",
            }),
          })
          break

        case "extendedcare":
          response = await fetch("/api/integrations/extendedcare/test-connection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: integration.credentials?.username,
              password: integration.credentials?.password,
              clientId: integration.credentials?.clientId,
              environment: "production",
            }),
          })
          break

        case "change-healthcare":
          response = await fetch("/api/integrations/change-healthcare/test-connection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: integration.credentials?.username,
              password: integration.credentials?.password,
              submitterId: integration.credentials?.submitterId,
              environment: "production",
            }),
          })
          break

        case "supabase":
          response = await fetch("/api/database-test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider: "supabase" }),
          })
          break

        case "neon":
          response = await fetch("/api/database-test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider: "neon" }),
          })
          break

        case "adr-management":
          response = await fetch("/api/axxess/ai-qa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              documentType: "oasis",
              documentId: "TEST-DOC-001",
              oasisData: { test: true },
            }),
          })
          break

        case "staff-competency":
          response = await fetch("/api/ai-competency/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              staffId: "TEST-STAFF-001",
              evaluationType: "recorded",
              duration: 300,
              evaluatorId: "TEST-EVALUATOR",
            }),
          })
          break

        case "hr-system":
          response = await fetch("/api/staff-performance/competency", {
            method: "GET",
          })
          break

        case "qa-coding":
          response = await fetch("/api/comprehensive-qa/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              documentId: "TEST-QA-001",
              documentType: "oasis",
            }),
          })
          break

        default:
          response = await fetch(`/api/integrations/${id}/test`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(integration.credentials),
          })
      }

      const responseTime = Date.now() - startTime
      const result = await response.json()

      setIntegrations((prev) =>
        prev.map((integration) =>
          integration.id === id
            ? {
                ...integration,
                status: response.ok ? ("success" as const) : ("error" as const),
                lastTested: new Date().toISOString(),
                responseTime,
                testResults: result,
                error: response.ok ? undefined : result.message || "Test failed",
              }
            : integration,
        ),
      )
    } catch (error) {
      setIntegrations((prev) =>
        prev.map((integration) =>
          integration.id === id
            ? {
                ...integration,
                status: "error" as const,
                lastTested: new Date().toISOString(),
                error: error instanceof Error ? error.message : "Unknown error",
              }
            : integration,
        ),
      )
    }
  }

  const testAllIntegrations = async () => {
    setTestingAll(true)

    // Test integrations sequentially to avoid overwhelming the system
    for (const integration of integrations) {
      await testIntegration(integration.id)
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    setTestingAll(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "testing":
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case "testing":
        return <Badge className="bg-blue-100 text-blue-800">Testing...</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Not Tested</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "healthcare":
        return <Shield className="h-5 w-5 text-blue-600" />
      case "database":
        return <Database className="h-5 w-5 text-green-600" />
      case "hr":
        return <Users className="h-5 w-5 text-purple-600" />
      case "qa":
        return <FileText className="h-5 w-5 text-orange-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />
    }
  }

  const togglePasswordVisibility = (integrationId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [integrationId]: !prev[integrationId],
    }))
  }

  const healthcareIntegrations = integrations.filter((i) => i.type === "healthcare")
  const databaseIntegrations = integrations.filter((i) => i.type === "database")
  const hrIntegrations = integrations.filter((i) => i.type === "hr")
  const qaIntegrations = integrations.filter((i) => i.type === "qa")

  const successCount = integrations.filter((i) => i.status === "success").length
  const errorCount = integrations.filter((i) => i.status === "error").length
  const testingCount = integrations.filter((i) => i.status === "testing").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integration Testing Dashboard</h1>
          <p className="text-gray-600">Test all healthcare integrations, databases, and systems</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">{successCount} Connected</span>
          </div>
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm">{errorCount} Failed</span>
          </div>
          <Button
            onClick={testAllIntegrations}
            disabled={testingAll || testingCount > 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {testingAll ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing All...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Test All Integrations
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Healthcare APIs</p>
                <p className="text-2xl font-bold text-blue-600">{healthcareIntegrations.length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Database Systems</p>
                <p className="text-2xl font-bold text-green-600">{databaseIntegrations.length}</p>
              </div>
              <Database className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">HR Systems</p>
                <p className="text-2xl font-bold text-purple-600">{hrIntegrations.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">QA Systems</p>
                <p className="text-2xl font-bold text-orange-600">{qaIntegrations.length}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Testing Tabs */}
      <Tabs defaultValue="healthcare" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="healthcare">Healthcare APIs</TabsTrigger>
          <TabsTrigger value="databases">Databases</TabsTrigger>
          <TabsTrigger value="hr-systems">HR Systems</TabsTrigger>
          <TabsTrigger value="qa-systems">QA Systems</TabsTrigger>
        </TabsList>

        <TabsContent value="healthcare" className="space-y-4">
          {healthcareIntegrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(integration.type)}
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription>Healthcare API Integration</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(integration.status)}
                    {getStatusBadge(integration.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Credentials Input */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`${integration.id}-username`}>Username</Label>
                    <Input
                      id={`${integration.id}-username`}
                      type="text"
                      value={integration.credentials?.username || ""}
                      onChange={(e) => updateIntegrationCredentials(integration.id, "username", e.target.value)}
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${integration.id}-password`}>Password</Label>
                    <div className="relative">
                      <Input
                        id={`${integration.id}-password`}
                        type={showPasswords[integration.id] ? "text" : "password"}
                        value={integration.credentials?.password || ""}
                        onChange={(e) => updateIntegrationCredentials(integration.id, "password", e.target.value)}
                        placeholder="Enter password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility(integration.id)}
                      >
                        {showPasswords[integration.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`${integration.id}-extra`}>
                      {integration.id === "availity"
                        ? "Organization ID"
                        : integration.id === "extendedcare"
                          ? "Client ID"
                          : integration.id === "change-healthcare"
                            ? "Submitter ID"
                            : "Agency ID"}
                    </Label>
                    <Input
                      id={`${integration.id}-extra`}
                      type="text"
                      value={
                        integration.credentials?.organizationId ||
                        integration.credentials?.clientId ||
                        integration.credentials?.submitterId ||
                        ""
                      }
                      onChange={(e) => {
                        const field =
                          integration.id === "availity"
                            ? "organizationId"
                            : integration.id === "extendedcare"
                              ? "clientId"
                              : integration.id === "change-healthcare"
                                ? "submitterId"
                                : "agencyId"
                        updateIntegrationCredentials(integration.id, field, e.target.value)
                      }}
                      placeholder={`Enter ${
                        integration.id === "availity"
                          ? "organization"
                          : integration.id === "extendedcare"
                            ? "client"
                            : integration.id === "change-healthcare"
                              ? "submitter"
                              : "agency"
                      } ID`}
                    />
                  </div>
                </div>

                {/* Test Results */}
                {integration.error && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{integration.error}</AlertDescription>
                  </Alert>
                )}

                {integration.testResults && integration.status === "success" && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Connection successful! Response time: {integration.responseTime}ms
                      {integration.testResults.message && ` - ${integration.testResults.message}`}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Test Button */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {integration.lastTested && <>Last tested: {new Date(integration.lastTested).toLocaleString()}</>}
                  </div>
                  <Button
                    onClick={() => testIntegration(integration.id)}
                    disabled={integration.status === "testing"}
                    variant="outline"
                  >
                    {integration.status === "testing" ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="databases" className="space-y-4">
          {databaseIntegrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(integration.type)}
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription>Database Connection</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(integration.status)}
                    {getStatusBadge(integration.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {integration.lastTested && <>Last tested: {new Date(integration.lastTested).toLocaleString()}</>}
                  </div>
                  <Button
                    onClick={() => testIntegration(integration.id)}
                    disabled={integration.status === "testing"}
                    variant="outline"
                  >
                    {integration.status === "testing" ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="hr-systems" className="space-y-4">
          {hrIntegrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(integration.type)}
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription>HR System Integration</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(integration.status)}
                    {getStatusBadge(integration.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {integration.lastTested && <>Last tested: {new Date(integration.lastTested).toLocaleString()}</>}
                  </div>
                  <Button
                    onClick={() => testIntegration(integration.id)}
                    disabled={integration.status === "testing"}
                    variant="outline"
                  >
                    {integration.status === "testing" ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Test System
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="qa-systems" className="space-y-4">
          {qaIntegrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(integration.type)}
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription>Quality Assurance System</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(integration.status)}
                    {getStatusBadge(integration.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {integration.lastTested && <>Last tested: {new Date(integration.lastTested).toLocaleString()}</>}
                  </div>
                  <Button
                    onClick={() => testIntegration(integration.id)}
                    disabled={integration.status === "testing"}
                    variant="outline"
                  >
                    {integration.status === "testing" ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Test System
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
