"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle,
  XCircle,
  Clock,
  Play,
  RefreshCw,
  Server,
  Database,
  Bell,
  CreditCard,
  Activity,
} from "lucide-react"

interface TestResult {
  endpoint: string
  method: string
  status: "success" | "error" | "pending" | "idle"
  responseTime?: number
  response?: any
  error?: string
}

interface ApiEndpoint {
  name: string
  endpoint: string
  method: string
  description: string
  category: string
}

const apiEndpoints: ApiEndpoint[] = [
  // Core APIs
  {
    name: "Subscription Check",
    endpoint: "/api/subscription/check-access",
    method: "GET",
    description: "Check user subscription access",
    category: "core",
  },
  {
    name: "User Usage",
    endpoint: "/api/subscription/usage",
    method: "GET",
    description: "Get subscription usage metrics",
    category: "core",
  },
  {
    name: "Upgrade Subscription",
    endpoint: "/api/subscription/upgrade",
    method: "POST",
    description: "Upgrade user subscription",
    category: "core",
  },

  // Integration APIs
  {
    name: "Axxess Configure",
    endpoint: "/api/integrations/axxess/configure",
    method: "POST",
    description: "Configure Axxess integration",
    category: "integrations",
  },
  {
    name: "Axxess Test Connection",
    endpoint: "/api/integrations/axxess/test-connection",
    method: "GET",
    description: "Test Axxess connection",
    category: "integrations",
  },
  {
    name: "Supabase Integration",
    endpoint: "/api/integrations/supabase/route",
    method: "GET",
    description: "Test Supabase integration",
    category: "integrations",
  },
  {
    name: "Stripe Integration",
    endpoint: "/api/integrations/stripe/route",
    method: "GET",
    description: "Test Stripe integration",
    category: "integrations",
  },

  // Healthcare APIs
  {
    name: "Patient Sync",
    endpoint: "/api/axxess/patients/sync",
    method: "POST",
    description: "Sync patient data with Axxess",
    category: "healthcare",
  },
  {
    name: "Orders Sync",
    endpoint: "/api/axxess/orders/sync",
    method: "POST",
    description: "Sync orders with Axxess",
    category: "healthcare",
  },
  {
    name: "OASIS Processing",
    endpoint: "/api/axxess/oasis",
    method: "POST",
    description: "Process OASIS assessments",
    category: "healthcare",
  },
  {
    name: "Drug Interaction Check",
    endpoint: "/api/drug-interactions/check",
    method: "POST",
    description: "Check for drug interactions",
    category: "healthcare",
  },
  {
    name: "G7 Patient Selection",
    endpoint: "/api/axxess/g7-patient-selection",
    method: "POST",
    description: "Axxess G7 Patient Selection API integration",
    category: "healthcare",
  },
  {
    name: "G8 Data Category Request",
    endpoint: "/api/axxess/g8-data-category-request",
    method: "POST",
    description: "Axxess G8 Data Category Request API integration",
    category: "healthcare",
  },
  {
    name: "All Data Requests",
    endpoint: "/api/axxess/all-data-requests",
    method: "POST",
    description: "Axxess All Data Requests API integration",
    category: "healthcare",
  },

  // Notification APIs
  {
    name: "Email Notification",
    endpoint: "/api/notifications/email",
    method: "POST",
    description: "Send email notification",
    category: "notifications",
  },
  {
    name: "SMS Notification",
    endpoint: "/api/notifications/sms",
    method: "POST",
    description: "Send SMS notification",
    category: "notifications",
  },
  {
    name: "Financial Alert",
    endpoint: "/api/notifications/financial-alert",
    method: "POST",
    description: "Send financial alert",
    category: "notifications",
  },

  // Billing APIs
  {
    name: "Generate UB04",
    endpoint: "/api/billing/generate-ub04",
    method: "POST",
    description: "Generate UB04 billing form",
    category: "billing",
  },
  {
    name: "Submit Claim",
    endpoint: "/api/billing/submit-claim",
    method: "POST",
    description: "Submit insurance claim",
    category: "billing",
  },
  {
    name: "Compliance Check",
    endpoint: "/api/billing/compliance-check",
    method: "POST",
    description: "Check billing compliance",
    category: "billing",
  },
]

const categoryIcons = {
  core: Server,
  integrations: Database,
  healthcare: Activity,
  notifications: Bell,
  billing: CreditCard,
}

const categoryColors = {
  core: "bg-blue-100 text-blue-800",
  integrations: "bg-purple-100 text-purple-800",
  healthcare: "bg-green-100 text-green-800",
  notifications: "bg-yellow-100 text-yellow-800",
  billing: "bg-red-100 text-red-800",
}

export default function ApiTestPage() {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [isRunningAll, setIsRunningAll] = useState(false)

  const testEndpoint = async (endpoint: ApiEndpoint) => {
    const key = `${endpoint.method}:${endpoint.endpoint}`

    setTestResults((prev) => ({
      ...prev,
      [key]: {
        endpoint: endpoint.endpoint,
        method: endpoint.method,
        status: "pending",
      },
    }))

    const startTime = Date.now()

    try {
      const response = await fetch(endpoint.endpoint, {
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
        },
        body:
          endpoint.method === "POST"
            ? JSON.stringify({
                test: true,
                timestamp: new Date().toISOString(),
              })
            : undefined,
      })

      const responseTime = Date.now() - startTime
      const data = await response.json().catch(() => ({ message: "No JSON response" }))

      setTestResults((prev) => ({
        ...prev,
        [key]: {
          endpoint: endpoint.endpoint,
          method: endpoint.method,
          status: response.ok ? "success" : "error",
          responseTime,
          response: data,
          error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        },
      }))
    } catch (error) {
      const responseTime = Date.now() - startTime
      setTestResults((prev) => ({
        ...prev,
        [key]: {
          endpoint: endpoint.endpoint,
          method: endpoint.method,
          status: "error",
          responseTime,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    }
  }

  const testAllEndpoints = async () => {
    setIsRunningAll(true)

    // Clear previous results
    setTestResults({})

    // Test endpoints in batches to avoid overwhelming the server
    const batchSize = 3
    for (let i = 0; i < apiEndpoints.length; i += batchSize) {
      const batch = apiEndpoints.slice(i, i + batchSize)
      await Promise.all(batch.map((endpoint) => testEndpoint(endpoint)))

      // Small delay between batches
      if (i + batchSize < apiEndpoints.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    setIsRunningAll(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "pending":
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800">Testing...</Badge>
      default:
        return <Badge variant="outline">Not Tested</Badge>
    }
  }

  const groupedEndpoints = apiEndpoints.reduce(
    (acc, endpoint) => {
      if (!acc[endpoint.category]) {
        acc[endpoint.category] = []
      }
      acc[endpoint.category].push(endpoint)
      return acc
    },
    {} as Record<string, ApiEndpoint[]>,
  )

  const getOverallStats = () => {
    const results = Object.values(testResults)
    const total = results.length
    const success = results.filter((r) => r.status === "success").length
    const errors = results.filter((r) => r.status === "error").length
    const pending = results.filter((r) => r.status === "pending").length

    return { total, success, errors, pending }
  }

  const stats = getOverallStats()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Test Dashboard</h1>
          <p className="text-muted-foreground">Test all API endpoints to ensure system functionality</p>
        </div>
        <Button onClick={testAllEndpoints} disabled={isRunningAll} size="lg">
          {isRunningAll ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Testing All APIs...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Test All APIs
            </>
          )}
        </Button>
      </div>

      {/* Overall Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total Tests</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{stats.success}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Running</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All APIs</TabsTrigger>
          {Object.keys(groupedEndpoints).map((category) => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {Object.entries(groupedEndpoints).map(([category, endpoints]) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons]
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Icon className="h-5 w-5" />
                    <span className="capitalize">{category} APIs</span>
                    <Badge className={categoryColors[category as keyof typeof categoryColors]}>
                      {endpoints.length} endpoints
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {endpoints.map((endpoint) => {
                      const key = `${endpoint.method}:${endpoint.endpoint}`
                      const result = testResults[key]
                      return (
                        <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{endpoint.method}</Badge>
                              <span className="font-medium">{endpoint.name}</span>
                              {getStatusIcon(result?.status || "idle")}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{endpoint.description}</p>
                            <p className="text-xs text-muted-foreground font-mono">{endpoint.endpoint}</p>
                            {result?.responseTime && (
                              <p className="text-xs text-muted-foreground">Response time: {result.responseTime}ms</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(result?.status || "idle")}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => testEndpoint(endpoint)}
                              disabled={result?.status === "pending"}
                            >
                              Test
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {Object.entries(groupedEndpoints).map(([category, endpoints]) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{category} API Tests</CardTitle>
                <CardDescription>Test {category} related endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {endpoints.map((endpoint) => {
                    const key = `${endpoint.method}:${endpoint.endpoint}`
                    const result = testResults[key]
                    return (
                      <Card key={key}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{endpoint.method}</Badge>
                              <span className="font-medium">{endpoint.name}</span>
                              {getStatusIcon(result?.status || "idle")}
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(result?.status || "idle")}
                              <Button
                                size="sm"
                                onClick={() => testEndpoint(endpoint)}
                                disabled={result?.status === "pending"}
                              >
                                Test
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{endpoint.description}</p>
                          <p className="text-xs font-mono text-muted-foreground mb-3">{endpoint.endpoint}</p>

                          {result && (
                            <div className="space-y-2">
                              {result.responseTime && (
                                <p className="text-xs text-muted-foreground">Response time: {result.responseTime}ms</p>
                              )}
                              {result.error && (
                                <Alert>
                                  <XCircle className="h-4 w-4" />
                                  <AlertDescription>{result.error}</AlertDescription>
                                </Alert>
                              )}
                              {result.response && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Response:</p>
                                  <ScrollArea className="h-32 w-full border rounded p-2">
                                    <pre className="text-xs">{JSON.stringify(result.response, null, 2)}</pre>
                                  </ScrollArea>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
