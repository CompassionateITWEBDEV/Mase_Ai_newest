"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Phone, FileText, Settings, CheckCircle, AlertTriangle, Clock, Mail, Zap, Save, TestTube } from "lucide-react"

interface FaxRoutingRule {
  id: string
  name: string
  keywords: string[]
  category: "referral" | "compliance" | "corporate" | "enrollment" | "credentialing" | "general"
  action: "auto_process" | "route_to_department" | "attach_to_axxess" | "notify_staff"
  assignedDepartment?: string
  priority: "low" | "medium" | "high" | "urgent"
  enabled: boolean
}

export default function VonageSetupPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  const [config, setConfig] = useState({
    apiKey: "",
    apiSecret: "",
    applicationId: "",
    webhookUrl: "",
    faxNumber: "",
    enableAutoProcessing: true,
    enableOCR: true,
    enableAIClassification: true,
    retentionDays: 90,
    notificationEmail: "",
  })

  const [routingRules, setRoutingRules] = useState<FaxRoutingRule[]>([
    {
      id: "referral",
      name: "Referral Processing",
      keywords: ["referral", "patient referral", "home health referral", "physician order", "start of care"],
      category: "referral",
      action: "auto_process",
      priority: "high",
      enabled: true,
    },
    {
      id: "compliance",
      name: "Compliance Documents",
      keywords: ["compliance", "audit", "survey", "regulation", "policy", "procedure"],
      category: "compliance",
      action: "route_to_department",
      assignedDepartment: "Compliance Team",
      priority: "medium",
      enabled: true,
    },
    {
      id: "corporate",
      name: "Corporate Communications",
      keywords: ["corporate", "executive", "board", "management", "policy update"],
      category: "corporate",
      action: "route_to_department",
      assignedDepartment: "Corporate Office",
      priority: "medium",
      enabled: true,
    },
    {
      id: "enrollment",
      name: "Patient Enrollment",
      keywords: ["enrollment", "admission", "intake", "new patient", "registration"],
      category: "enrollment",
      action: "route_to_department",
      assignedDepartment: "Admissions",
      priority: "high",
      enabled: true,
    },
    {
      id: "credentialing",
      name: "Provider Credentialing",
      keywords: ["credentialing", "license", "certification", "provider", "physician", "nurse"],
      category: "credentialing",
      action: "route_to_department",
      assignedDepartment: "HR/Credentialing",
      priority: "medium",
      enabled: true,
    },
  ])

  const testConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/integrations/vonage/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      const result = await response.json()
      setTestResults(result)
      setIsConnected(result.success)
    } catch (error) {
      setTestResults({ success: false, message: "Connection test failed" })
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfiguration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/integrations/vonage/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, routingRules }),
      })

      if (response.ok) {
        setIsConnected(true)
        alert("Configuration saved successfully!")
      }
    } catch (error) {
      alert("Failed to save configuration")
    } finally {
      setIsLoading(false)
    }
  }

  const addRoutingRule = () => {
    const newRule: FaxRoutingRule = {
      id: `rule-${Date.now()}`,
      name: "New Rule",
      keywords: [],
      category: "general",
      action: "attach_to_axxess",
      priority: "medium",
      enabled: true,
    }
    setRoutingRules([...routingRules, newRule])
  }

  const updateRoutingRule = (id: string, updates: Partial<FaxRoutingRule>) => {
    setRoutingRules(routingRules.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule)))
  }

  const deleteRoutingRule = (id: string) => {
    setRoutingRules(routingRules.filter((rule) => rule.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Vonage Business Integration</h1>
                <p className="text-gray-600">Configure automated fax processing and routing</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isConnected ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Clock className="h-4 w-4 mr-1" />
                  Not Connected
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="connection" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="routing">Fax Routing</TabsTrigger>
            <TabsTrigger value="processing">Processing Rules</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Vonage Business API Configuration
                </CardTitle>
                <CardDescription>Configure your Vonage Business API credentials and fax settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={config.apiKey}
                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                        placeholder="Your Vonage API Key"
                      />
                    </div>

                    <div>
                      <Label htmlFor="apiSecret">API Secret</Label>
                      <Input
                        id="apiSecret"
                        type="password"
                        value={config.apiSecret}
                        onChange={(e) => setConfig({ ...config, apiSecret: e.target.value })}
                        placeholder="Your Vonage API Secret"
                      />
                    </div>

                    <div>
                      <Label htmlFor="applicationId">Application ID</Label>
                      <Input
                        id="applicationId"
                        value={config.applicationId}
                        onChange={(e) => setConfig({ ...config, applicationId: e.target.value })}
                        placeholder="Your Vonage Application ID"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="faxNumber">Fax Number</Label>
                      <Input
                        id="faxNumber"
                        value={config.faxNumber}
                        onChange={(e) => setConfig({ ...config, faxNumber: e.target.value })}
                        placeholder="+1234567890"
                      />
                    </div>

                    <div>
                      <Label htmlFor="webhookUrl">Webhook URL</Label>
                      <Input
                        id="webhookUrl"
                        value={config.webhookUrl}
                        onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                        placeholder="https://yourdomain.com/api/vonage/webhook"
                        readOnly
                      />
                    </div>

                    <div>
                      <Label htmlFor="notificationEmail">Notification Email</Label>
                      <Input
                        id="notificationEmail"
                        type="email"
                        value={config.notificationEmail}
                        onChange={(e) => setConfig({ ...config, notificationEmail: e.target.value })}
                        placeholder="admin@company.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Processing Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto Processing</Label>
                        <p className="text-sm text-gray-600">Automatically process incoming faxes</p>
                      </div>
                      <Switch
                        checked={config.enableAutoProcessing}
                        onCheckedChange={(checked) => setConfig({ ...config, enableAutoProcessing: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>OCR Processing</Label>
                        <p className="text-sm text-gray-600">Extract text from fax images</p>
                      </div>
                      <Switch
                        checked={config.enableOCR}
                        onCheckedChange={(checked) => setConfig({ ...config, enableOCR: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>AI Classification</Label>
                        <p className="text-sm text-gray-600">Use AI to classify fax content</p>
                      </div>
                      <Switch
                        checked={config.enableAIClassification}
                        onCheckedChange={(checked) => setConfig({ ...config, enableAIClassification: checked })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button onClick={testConnection} disabled={isLoading} variant="outline">
                    <TestTube className="h-4 w-4 mr-2" />
                    {isLoading ? "Testing..." : "Test Connection"}
                  </Button>
                  <Button onClick={saveConfiguration} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Saving..." : "Save Configuration"}
                  </Button>
                </div>

                {testResults && (
                  <div
                    className={`p-4 rounded-lg ${
                      testResults.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <div className="flex items-center">
                      {testResults.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                      )}
                      <span className={testResults.success ? "text-green-800" : "text-red-800"}>
                        {testResults.message}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="routing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Fax Routing Rules
                  </div>
                  <Button onClick={addRoutingRule} size="sm">
                    Add Rule
                  </Button>
                </CardTitle>
                <CardDescription>
                  Configure how different types of faxes are automatically routed and processed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {routingRules.map((rule) => (
                    <Card key={rule.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={(checked) => updateRoutingRule(rule.id, { enabled: checked })}
                            />
                            <Input
                              value={rule.name}
                              onChange={(e) => updateRoutingRule(rule.id, { name: e.target.value })}
                              className="font-semibold"
                            />
                            <Badge
                              variant={
                                rule.priority === "urgent"
                                  ? "destructive"
                                  : rule.priority === "high"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {rule.priority}
                            </Badge>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Routing Rule</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this routing rule? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteRoutingRule(rule.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Category</Label>
                            <Select
                              value={rule.category}
                              onValueChange={(value) =>
                                updateRoutingRule(rule.id, { category: value as FaxRoutingRule["category"] })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="referral">Referral</SelectItem>
                                <SelectItem value="compliance">Compliance</SelectItem>
                                <SelectItem value="corporate">Corporate</SelectItem>
                                <SelectItem value="enrollment">Enrollment</SelectItem>
                                <SelectItem value="credentialing">Credentialing</SelectItem>
                                <SelectItem value="general">General</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Action</Label>
                            <Select
                              value={rule.action}
                              onValueChange={(value) =>
                                updateRoutingRule(rule.id, { action: value as FaxRoutingRule["action"] })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto_process">Auto Process</SelectItem>
                                <SelectItem value="route_to_department">Route to Department</SelectItem>
                                <SelectItem value="attach_to_axxess">Attach to Axxess</SelectItem>
                                <SelectItem value="notify_staff">Notify Staff</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Priority</Label>
                            <Select
                              value={rule.priority}
                              onValueChange={(value) =>
                                updateRoutingRule(rule.id, { priority: value as FaxRoutingRule["priority"] })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {rule.action === "route_to_department" && (
                            <div>
                              <Label>Department</Label>
                              <Select
                                value={rule.assignedDepartment}
                                onValueChange={(value) => updateRoutingRule(rule.id, { assignedDepartment: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Admissions">Admissions</SelectItem>
                                  <SelectItem value="Compliance Team">Compliance Team</SelectItem>
                                  <SelectItem value="Corporate Office">Corporate Office</SelectItem>
                                  <SelectItem value="HR/Credentialing">HR/Credentialing</SelectItem>
                                  <SelectItem value="Clinical Team">Clinical Team</SelectItem>
                                  <SelectItem value="Billing">Billing</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          <Label>Keywords (comma-separated)</Label>
                          <Textarea
                            value={rule.keywords.join(", ")}
                            onChange={(e) =>
                              updateRoutingRule(rule.id, {
                                keywords: e.target.value.split(",").map((k) => k.trim()),
                              })
                            }
                            placeholder="referral, patient referral, home health referral"
                            className="mt-1"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processing" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Referral Processing
                  </CardTitle>
                  <CardDescription>Automated referral acceptance and denial workflow</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Auto-Accept Criteria</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Medicare/Medicaid insurance</li>
                      <li>• Within 25-mile radius</li>
                      <li>• Skilled nursing services required</li>
                      <li>• No excluded diagnoses</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">Auto-Deny Criteria</h4>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>• Unsupported insurance types</li>
                      <li>• Beyond service area</li>
                      <li>• Palliative/hospice care</li>
                      <li>• Incomplete referral information</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-2">Manual Review</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Complex medical conditions</li>
                      <li>• Non-standard insurance</li>
                      <li>• High-risk patients</li>
                      <li>• Unclear service requirements</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Notification Templates
                  </CardTitle>
                  <CardDescription>Email and fax response templates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Referral Acceptance Template</Label>
                    <Textarea
                      placeholder="Thank you for your referral. We are pleased to accept..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Referral Denial Template</Label>
                    <Textarea
                      placeholder="Thank you for your referral. Unfortunately, we are unable to accept..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Information Request Template</Label>
                    <Textarea
                      placeholder="Thank you for your referral. We need additional information..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">247</p>
                      <p className="text-gray-600 text-sm">Faxes Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">89%</p>
                      <p className="text-gray-600 text-sm">Auto-Processed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-orange-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">2.3m</p>
                      <p className="text-gray-600 text-sm">Avg Process Time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">3</p>
                      <p className="text-gray-600 text-sm">Failed Processing</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Fax Activity</CardTitle>
                <CardDescription>Latest fax processing activity and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      id: "FAX-001",
                      from: "+1234567890",
                      type: "Referral",
                      status: "Auto-Accepted",
                      time: "2 minutes ago",
                      action: "Created patient record in Axxess",
                    },
                    {
                      id: "FAX-002",
                      from: "+1987654321",
                      type: "Compliance",
                      status: "Routed",
                      time: "15 minutes ago",
                      action: "Sent to Compliance Team",
                    },
                    {
                      id: "FAX-003",
                      from: "+1555123456",
                      type: "Referral",
                      status: "Auto-Denied",
                      time: "32 minutes ago",
                      action: "Sent denial fax response",
                    },
                    {
                      id: "FAX-004",
                      from: "+1444987654",
                      type: "Credentialing",
                      status: "Manual Review",
                      time: "1 hour ago",
                      action: "Assigned to HR team",
                    },
                  ].map((fax) => (
                    <div key={fax.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-semibold">{fax.id}</div>
                          <div className="text-sm text-gray-600">From: {fax.from}</div>
                        </div>
                        <Badge variant="outline">{fax.type}</Badge>
                        <Badge
                          variant={
                            fax.status === "Auto-Accepted"
                              ? "default"
                              : fax.status === "Auto-Denied"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {fax.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{fax.action}</div>
                        <div className="text-xs text-gray-500">{fax.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
