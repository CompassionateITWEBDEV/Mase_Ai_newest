"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Mail,
  Settings,
  Shield,
  CheckCircle,
  AlertCircle,
  Copy,
  TestTube,
  Zap,
  Globe,
  Lock,
  Filter,
  Users,
} from "lucide-react"

interface EmailConfiguration {
  provider: string
  webhookUrl: string
  apiKey: string
  username?: string
  password?: string
  forwardingEmail: string
  autoProcessing: boolean
  requireSignature: boolean
  allowedSenders: string[]
  subjectFilters: string[]
  spamProtection: boolean
  encryptionEnabled: boolean
}

interface TestResult {
  success: boolean
  message: string
  processingTime: number
  referralData?: any
  webhookResponse?: any
}

export default function EmailIntegrationPage() {
  const [config, setConfig] = useState<EmailConfiguration>({
    provider: "",
    webhookUrl: "",
    apiKey: "",
    forwardingEmail: "referrals@yourhealthcareagency.com",
    autoProcessing: true,
    requireSignature: false,
    allowedSenders: [],
    subjectFilters: ["referral", "patient", "admission"],
    spamProtection: true,
    encryptionEnabled: true,
  })

  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [newSender, setNewSender] = useState("")
  const [newFilter, setNewFilter] = useState("")
  const [testEmail, setTestEmail] = useState("")

  useEffect(() => {
    loadConfiguration()
  }, [])

  const loadConfiguration = async () => {
    try {
      const response = await fetch("/api/email-integration/config")
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        generateWebhookUrl(data.provider)
      }
    } catch (error) {
      console.error("Failed to load configuration:", error)
    }
  }

  const saveConfiguration = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/email-integration/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        alert("Configuration saved successfully!")
      } else {
        const error = await response.json()
        alert(`Failed to save: ${error.error}`)
      }
    } catch (error) {
      alert("Failed to save configuration")
    } finally {
      setLoading(false)
    }
  }

  const testIntegration = async () => {
    if (!testEmail) {
      alert("Please enter a test email address")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/email-integration/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: config.provider,
          testEmail,
        }),
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: "Test failed: Network error",
        processingTime: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const generateWebhookUrl = (provider: string) => {
    if (!provider) return

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"
    const webhookUrl = `${baseUrl}/api/email/${provider.toLowerCase()}/webhook`

    setConfig((prev) => ({ ...prev, webhookUrl }))
  }

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(config.webhookUrl)
    alert("Webhook URL copied to clipboard!")
  }

  const addAllowedSender = () => {
    if (newSender && !config.allowedSenders.includes(newSender)) {
      setConfig((prev) => ({
        ...prev,
        allowedSenders: [...prev.allowedSenders, newSender],
      }))
      setNewSender("")
    }
  }

  const removeSender = (sender: string) => {
    setConfig((prev) => ({
      ...prev,
      allowedSenders: prev.allowedSenders.filter((s) => s !== sender),
    }))
  }

  const addSubjectFilter = () => {
    if (newFilter && !config.subjectFilters.includes(newFilter)) {
      setConfig((prev) => ({
        ...prev,
        subjectFilters: [...prev.subjectFilters, newFilter],
      }))
      setNewFilter("")
    }
  }

  const removeFilter = (filter: string) => {
    setConfig((prev) => ({
      ...prev,
      subjectFilters: prev.subjectFilters.filter((f) => f !== filter),
    }))
  }

  const providers = [
    { value: "sendgrid", label: "SendGrid", description: "Reliable email delivery with inbound parse" },
    { value: "mailgun", label: "Mailgun", description: "Powerful email API with advanced routing" },
    { value: "postmark", label: "Postmark", description: "Fast transactional email service" },
    { value: "microsoft", label: "Microsoft 365", description: "Enterprise email with Graph API" },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Email Integration</h1>
          <p className="text-gray-600">Configure email webhooks to automatically receive and process referrals</p>
        </div>
      </div>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="filters" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Provider Configuration
              </CardTitle>
              <CardDescription>Choose your email provider and configure the integration settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="provider">Email Provider</Label>
                    <Select
                      value={config.provider}
                      onValueChange={(value) => {
                        setConfig((prev) => ({ ...prev, provider: value }))
                        generateWebhookUrl(value)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select email provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            <div>
                              <div className="font-medium">{provider.label}</div>
                              <div className="text-sm text-gray-500">{provider.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={config.apiKey}
                      onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="Enter your API key"
                    />
                  </div>

                  {config.provider === "microsoft" && (
                    <>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={config.username || ""}
                          onChange={(e) => setConfig((prev) => ({ ...prev, username: e.target.value }))}
                          placeholder="Microsoft 365 username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={config.password || ""}
                          onChange={(e) => setConfig((prev) => ({ ...prev, password: e.target.value }))}
                          placeholder="Microsoft 365 password"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="forwardingEmail">Referral Email Address</Label>
                    <Input
                      id="forwardingEmail"
                      type="email"
                      value={config.forwardingEmail}
                      onChange={(e) => setConfig((prev) => ({ ...prev, forwardingEmail: e.target.value }))}
                      placeholder="referrals@youragency.com"
                    />
                    <p className="text-sm text-gray-500 mt-1">Email address where referrals will be sent</p>
                  </div>

                  <div>
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input id="webhookUrl" value={config.webhookUrl} readOnly className="bg-gray-50" />
                      <Button variant="outline" size="sm" onClick={copyWebhookUrl} disabled={!config.webhookUrl}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Configure this URL in your email provider's webhook settings
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoProcessing">Auto-Processing</Label>
                      <p className="text-sm text-gray-500">Automatically process referrals with AI</p>
                    </div>
                    <Switch
                      id="autoProcessing"
                      checked={config.autoProcessing}
                      onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, autoProcessing: checked }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security and compliance settings for email processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Digital Signatures</Label>
                      <p className="text-sm text-gray-500">Require digitally signed emails</p>
                    </div>
                    <Switch
                      checked={config.requireSignature}
                      onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, requireSignature: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Spam Protection</Label>
                      <p className="text-sm text-gray-500">Enable advanced spam filtering</p>
                    </div>
                    <Switch
                      checked={config.spamProtection}
                      onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, spamProtection: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>End-to-End Encryption</Label>
                      <p className="text-sm text-gray-500">Encrypt all email processing</p>
                    </div>
                    <Switch
                      checked={config.encryptionEnabled}
                      onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, encryptionEnabled: checked }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      All email processing is HIPAA compliant with full audit logging and encryption at rest.
                    </AlertDescription>
                  </Alert>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Security Features</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Webhook signature verification</li>
                      <li>• TLS 1.3 encryption in transit</li>
                      <li>• AES-256 encryption at rest</li>
                      <li>• Complete audit trail</li>
                      <li>• IP whitelisting support</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Allowed Senders
                </CardTitle>
                <CardDescription>Only process emails from these trusted senders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newSender}
                    onChange={(e) => setNewSender(e.target.value)}
                    placeholder="hospital@example.com"
                    onKeyPress={(e) => e.key === "Enter" && addAllowedSender()}
                  />
                  <Button onClick={addAllowedSender} size="sm">
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {config.allowedSenders.map((sender) => (
                    <div key={sender} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{sender}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSender(sender)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  {config.allowedSenders.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No restrictions - all senders allowed</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Subject Filters
                </CardTitle>
                <CardDescription>Only process emails containing these keywords</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newFilter}
                    onChange={(e) => setNewFilter(e.target.value)}
                    placeholder="referral"
                    onKeyPress={(e) => e.key === "Enter" && addSubjectFilter()}
                  />
                  <Button onClick={addSubjectFilter} size="sm">
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {config.subjectFilters.map((filter) => (
                    <Badge
                      key={filter}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeFilter(filter)}
                    >
                      {filter} ×
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test Integration
              </CardTitle>
              <CardDescription>Send a test email to verify your webhook configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="testEmail">Test Email Address</Label>
                    <Input
                      id="testEmail"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@hospital.com"
                    />
                  </div>

                  <Button
                    onClick={testIntegration}
                    disabled={loading || !config.provider || !testEmail}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Send Test Email
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  {testResult && (
                    <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                      {testResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                        <div className="space-y-2">
                          <p className="font-medium">{testResult.message}</p>
                          <p className="text-sm">Processing time: {testResult.processingTime}ms</p>

                          {testResult.referralData && (
                            <div className="mt-3 p-3 bg-white rounded border">
                              <h4 className="font-medium mb-2">Extracted Data:</h4>
                              <div className="text-sm space-y-1">
                                <p>
                                  <strong>Patient:</strong> {testResult.referralData.patientName}
                                </p>
                                <p>
                                  <strong>Diagnosis:</strong> {testResult.referralData.diagnosis}
                                </p>
                                <p>
                                  <strong>Insurance:</strong> {testResult.referralData.insuranceProvider}
                                </p>
                                <p>
                                  <strong>Services:</strong> {testResult.referralData.serviceRequested.join(", ")}
                                </p>
                                <p>
                                  <strong>Urgency:</strong> {testResult.referralData.urgency}
                                </p>
                              </div>
                            </div>
                          )}

                          {testResult.webhookResponse && (
                            <div className="mt-3 p-3 bg-white rounded border">
                              <h4 className="font-medium mb-2">AI Decision:</h4>
                              <div className="text-sm space-y-1">
                                <p>
                                  <strong>Action:</strong> {testResult.webhookResponse.decision}
                                </p>
                                <p>
                                  <strong>Referral ID:</strong> {testResult.webhookResponse.referralId}
                                </p>
                                <p>
                                  <strong>Status:</strong> {testResult.webhookResponse.status}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={loadConfiguration}>
          Reset
        </Button>
        <Button onClick={saveConfiguration} disabled={loading}>
          {loading ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  )
}
