"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Zap, Shield, AlertTriangle, CheckCircle, Save, Bell, Activity } from "lucide-react"
import Link from "next/link"

interface BillingTrigger {
  id: string
  name: string
  description: string
  enabled: boolean
  triggerType: "episode_completion" | "time_based" | "visit_count" | "authorization_expiry" | "manual"
  conditions: TriggerCondition[]
  actions: TriggerAction[]
  priority: "high" | "medium" | "low"
  lastTriggered?: string
  triggerCount: number
}

interface TriggerCondition {
  id: string
  field: string
  operator: "equals" | "greater_than" | "less_than" | "contains" | "not_equals"
  value: string | number
  logicalOperator?: "AND" | "OR"
}

interface TriggerAction {
  id: string
  actionType: "generate_ub04" | "run_compliance_check" | "submit_claim" | "send_notification" | "create_task"
  parameters: Record<string, any>
  delay?: number // minutes
}

interface ComplianceThreshold {
  id: string
  name: string
  category: "documentation" | "coding" | "authorization" | "frequency" | "eligibility" | "quality"
  thresholdType: "minimum_score" | "maximum_visits" | "required_documents" | "time_limit"
  value: number
  unit: "percentage" | "count" | "days" | "hours"
  severity: "critical" | "high" | "medium" | "low"
  enabled: boolean
  autoRemediation: boolean
  remediationActions: string[]
  violationCount: number
  lastViolation?: string
}

interface AutoBillingConfig {
  enabled: boolean
  minimumComplianceScore: number
  requireAllDocuments: boolean
  autoSubmitToClearingHouse: boolean
  delayBeforeSubmission: number // hours
  maxRetryAttempts: number
  notificationSettings: NotificationSettings
  businessRules: BusinessRule[]
}

interface NotificationSettings {
  emailEnabled: boolean
  smsEnabled: boolean
  slackEnabled: boolean
  recipients: string[]
  escalationRules: EscalationRule[]
}

interface EscalationRule {
  id: string
  condition: string
  delayMinutes: number
  escalateTo: string[]
  actionType: "email" | "sms" | "call" | "create_ticket"
}

interface BusinessRule {
  id: string
  name: string
  description: string
  condition: string
  action: string
  enabled: boolean
  priority: number
}

export default function BillingAutomationConfigPage() {
  const [activeTab, setActiveTab] = useState("triggers")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [billingTriggers, setBillingTriggers] = useState<BillingTrigger[]>([])
  const [complianceThresholds, setComplianceThresholds] = useState<ComplianceThreshold[]>([])
  const [autoBillingConfig, setAutoBillingConfig] = useState<AutoBillingConfig>({
    enabled: true,
    minimumComplianceScore: 90,
    requireAllDocuments: true,
    autoSubmitToClearingHouse: false,
    delayBeforeSubmission: 24,
    maxRetryAttempts: 3,
    notificationSettings: {
      emailEnabled: true,
      smsEnabled: false,
      slackEnabled: true,
      recipients: ["billing@company.com", "compliance@company.com"],
      escalationRules: [],
    },
    businessRules: [],
  })

  useEffect(() => {
    loadConfiguration()
  }, [])

  const loadConfiguration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/billing/automation-config")
      if (response.ok) {
        const data = await response.json()
        setBillingTriggers(data.triggers || mockBillingTriggers)
        setComplianceThresholds(data.thresholds || mockComplianceThresholds)
        setAutoBillingConfig(data.config || autoBillingConfig)
      }
    } catch (error) {
      console.error("Failed to load configuration:", error)
      // Load mock data
      setBillingTriggers(mockBillingTriggers)
      setComplianceThresholds(mockComplianceThresholds)
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfiguration = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/billing/automation-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          triggers: billingTriggers,
          thresholds: complianceThresholds,
          config: autoBillingConfig,
        }),
      })

      if (response.ok) {
        alert("Configuration saved successfully!")
      } else {
        throw new Error("Failed to save configuration")
      }
    } catch (error) {
      console.error("Save error:", error)
      alert("Failed to save configuration. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const testTrigger = async (triggerId: string) => {
    try {
      const response = await fetch("/api/billing/test-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triggerId }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Trigger test completed: ${result.message}`)
      }
    } catch (error) {
      console.error("Trigger test failed:", error)
      alert("Trigger test failed. Please check the configuration.")
    }
  }

  const addNewTrigger = () => {
    const newTrigger: BillingTrigger = {
      id: `trigger_${Date.now()}`,
      name: "New Billing Trigger",
      description: "Custom billing trigger",
      enabled: false,
      triggerType: "episode_completion",
      conditions: [
        {
          id: `condition_${Date.now()}`,
          field: "episode_status",
          operator: "equals",
          value: "completed",
        },
      ],
      actions: [
        {
          id: `action_${Date.now()}`,
          actionType: "run_compliance_check",
          parameters: {},
        },
      ],
      priority: "medium",
      triggerCount: 0,
    }
    setBillingTriggers([...billingTriggers, newTrigger])
  }

  const addNewThreshold = () => {
    const newThreshold: ComplianceThreshold = {
      id: `threshold_${Date.now()}`,
      name: "New Compliance Threshold",
      category: "documentation",
      thresholdType: "minimum_score",
      value: 85,
      unit: "percentage",
      severity: "medium",
      enabled: false,
      autoRemediation: false,
      remediationActions: [],
      violationCount: 0,
    }
    setComplianceThresholds([...complianceThresholds, newThreshold])
  }

  const updateTrigger = (triggerId: string, updates: Partial<BillingTrigger>) => {
    setBillingTriggers((prev) =>
      prev.map((trigger) => (trigger.id === triggerId ? { ...trigger, ...updates } : trigger)),
    )
  }

  const updateThreshold = (thresholdId: string, updates: Partial<ComplianceThreshold>) => {
    setComplianceThresholds((prev) =>
      prev.map((threshold) => (threshold.id === thresholdId ? { ...threshold, ...updates } : threshold)),
    )
  }

  const deleteTrigger = (triggerId: string) => {
    setBillingTriggers((prev) => prev.filter((trigger) => trigger.id !== triggerId))
  }

  const deleteThreshold = (thresholdId: string) => {
    setComplianceThresholds((prev) => prev.filter((threshold) => threshold.id !== thresholdId))
  }

  // Mock data
  const mockBillingTriggers: BillingTrigger[] = [
    {
      id: "trigger_episode_complete",
      name: "Episode Completion Auto-Bill",
      description: "Automatically initiate billing when episode is marked complete in Axxess",
      enabled: true,
      triggerType: "episode_completion",
      conditions: [
        {
          id: "cond_1",
          field: "episode_status",
          operator: "equals",
          value: "completed",
        },
        {
          id: "cond_2",
          field: "compliance_score",
          operator: "greater_than",
          value: 85,
          logicalOperator: "AND",
        },
      ],
      actions: [
        {
          id: "act_1",
          actionType: "run_compliance_check",
          parameters: { checkType: "full" },
        },
        {
          id: "act_2",
          actionType: "generate_ub04",
          parameters: { autoSubmit: false },
          delay: 30,
        },
      ],
      priority: "high",
      lastTriggered: "2024-07-10T14:30:00Z",
      triggerCount: 45,
    },
    {
      id: "trigger_auth_expiry",
      name: "Authorization Expiry Alert",
      description: "Alert when authorization is expiring within 7 days",
      enabled: true,
      triggerType: "authorization_expiry",
      conditions: [
        {
          id: "cond_3",
          field: "days_until_auth_expiry",
          operator: "less_than",
          value: 7,
        },
      ],
      actions: [
        {
          id: "act_3",
          actionType: "send_notification",
          parameters: {
            type: "authorization_expiry",
            urgency: "high",
            recipients: ["authorization@company.com"],
          },
        },
        {
          id: "act_4",
          actionType: "create_task",
          parameters: {
            title: "Renew Authorization",
            assignee: "authorization_team",
            priority: "high",
          },
        },
      ],
      priority: "high",
      lastTriggered: "2024-07-09T09:15:00Z",
      triggerCount: 12,
    },
    {
      id: "trigger_visit_threshold",
      name: "LUPA Threshold Warning",
      description: "Alert when visit count approaches LUPA threshold",
      enabled: true,
      triggerType: "visit_count",
      conditions: [
        {
          id: "cond_4",
          field: "skilled_nursing_visits",
          operator: "greater_than",
          value: 8,
        },
      ],
      actions: [
        {
          id: "act_5",
          actionType: "send_notification",
          parameters: {
            type: "lupa_warning",
            urgency: "medium",
            recipients: ["clinical@company.com"],
          },
        },
      ],
      priority: "medium",
      lastTriggered: "2024-07-08T16:45:00Z",
      triggerCount: 8,
    },
  ]

  const mockComplianceThresholds: ComplianceThreshold[] = [
    {
      id: "threshold_compliance_score",
      name: "Minimum Compliance Score",
      category: "documentation",
      thresholdType: "minimum_score",
      value: 90,
      unit: "percentage",
      severity: "critical",
      enabled: true,
      autoRemediation: true,
      remediationActions: ["Request missing documents", "Schedule compliance review"],
      violationCount: 3,
      lastViolation: "2024-07-09T11:20:00Z",
    },
    {
      id: "threshold_skilled_nursing",
      name: "Skilled Nursing LUPA Threshold",
      category: "frequency",
      thresholdType: "maximum_visits",
      value: 10,
      unit: "count",
      severity: "high",
      enabled: true,
      autoRemediation: false,
      remediationActions: ["Clinical review required", "Justify medical necessity"],
      violationCount: 1,
      lastViolation: "2024-07-07T14:30:00Z",
    },
    {
      id: "threshold_auth_expiry",
      name: "Authorization Expiry Warning",
      category: "authorization",
      thresholdType: "time_limit",
      value: 7,
      unit: "days",
      severity: "high",
      enabled: true,
      autoRemediation: true,
      remediationActions: ["Auto-request authorization renewal", "Notify authorization team"],
      violationCount: 5,
      lastViolation: "2024-07-10T08:00:00Z",
    },
    {
      id: "threshold_eligibility",
      name: "Eligibility Verification Expiry",
      category: "eligibility",
      thresholdType: "time_limit",
      value: 30,
      unit: "days",
      severity: "critical",
      enabled: true,
      autoRemediation: true,
      remediationActions: ["Auto re-verify eligibility", "Hold billing until verified"],
      violationCount: 0,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/billing-automation">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Billing Automation
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Billing Automation Configuration</h1>
              <p className="text-gray-600">Configure automated billing triggers and compliance thresholds</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge
              variant="outline"
              className={autoBillingConfig.enabled ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}
            >
              <Zap className="h-3 w-3 mr-1" />
              Auto-Billing: {autoBillingConfig.enabled ? "ON" : "OFF"}
            </Badge>
            <Button onClick={saveConfiguration} disabled={isSaving}>
              <Save className={`h-4 w-4 mr-2 ${isSaving ? "animate-spin" : ""}`} />
              {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Configuration Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Triggers</p>
                  <p className="text-2xl font-bold text-gray-900">{billingTriggers.filter((t) => t.enabled).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Thresholds</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {complianceThresholds.filter((t) => t.enabled).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent Violations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {complianceThresholds.reduce((sum, t) => sum + t.violationCount, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Triggers Fired</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {billingTriggers.reduce((sum, t) => sum + t.triggerCount, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Configuration Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="triggers">Billing Triggers</TabsTrigger>
            <TabsTrigger value="thresholds">Compliance Thresholds</TabsTrigger>
            <TabsTrigger value="automation">Auto-Billing Settings</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Billing Triggers Tab */}
          <TabsContent value="triggers" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Billing Triggers</h3>
                <p className="text-gray-600">Configure automated triggers that initiate billing workflows</p>
              </div>
              <Button onClick={addNewTrigger}>
                <Zap className="h-4 w-4 mr-2" />
                Add New Trigger
              </Button>
            </div>

            <div className="space-y-4">
              {billingTriggers.map((trigger) => (
                <Card key={trigger.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          {trigger.name}
                          <Badge
                            variant="outline"
                            className={`ml-2 ${trigger.enabled ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}`}
                          >
                            {trigger.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                          <Badge variant="outline" className="ml-2">
                            {trigger.priority.toUpperCase()}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{trigger.description}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={trigger.enabled}
                          onCheckedChange={(enabled) => updateTrigger(trigger.id, { enabled })}
                        />
                        <Button size="sm" variant="outline" onClick={() => testTrigger(trigger.id)}>
                          Test
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteTrigger(trigger.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-sm font-medium">Trigger Type</Label>
                        <Select
                          value={trigger.triggerType}
                          onValueChange={(value) => updateTrigger(trigger.id, { triggerType: value as any })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="episode_completion">Episode Completion</SelectItem>
                            <SelectItem value="time_based">Time Based</SelectItem>
                            <SelectItem value="visit_count">Visit Count</SelectItem>
                            <SelectItem value="authorization_expiry">Authorization Expiry</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Priority</Label>
                        <Select
                          value={trigger.priority}
                          onValueChange={(value) => updateTrigger(trigger.id, { priority: value as any })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Statistics</Label>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-gray-600">Triggered: {trigger.triggerCount} times</p>
                          {trigger.lastTriggered && (
                            <p className="text-sm text-gray-600">
                              Last: {new Date(trigger.lastTriggered).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Conditions</Label>
                        <div className="mt-2 space-y-2">
                          {trigger.conditions.map((condition, index) => (
                            <div key={condition.id} className="flex items-center space-x-2 p-2 border rounded">
                              {index > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {condition.logicalOperator || "AND"}
                                </Badge>
                              )}
                              <span className="text-sm font-medium">{condition.field}</span>
                              <span className="text-sm">{condition.operator}</span>
                              <span className="text-sm font-medium">{condition.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Actions</Label>
                        <div className="mt-2 space-y-2">
                          {trigger.actions.map((action) => (
                            <div key={action.id} className="flex items-center space-x-2 p-2 border rounded">
                              <span className="text-sm font-medium">{action.actionType.replace("_", " ")}</span>
                              {action.delay && (
                                <Badge variant="outline" className="text-xs">
                                  Delay: {action.delay}m
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Compliance Thresholds Tab */}
          <TabsContent value="thresholds" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Compliance Thresholds</h3>
                <p className="text-gray-600">Set thresholds that trigger compliance alerts and actions</p>
              </div>
              <Button onClick={addNewThreshold}>
                <Shield className="h-4 w-4 mr-2" />
                Add New Threshold
              </Button>
            </div>

            <div className="space-y-4">
              {complianceThresholds.map((threshold) => (
                <Card key={threshold.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          {threshold.name}
                          <Badge
                            variant="outline"
                            className={`ml-2 ${threshold.enabled ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}`}
                          >
                            {threshold.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                          <Badge variant="outline" className={`ml-2 ${getSeverityColor(threshold.severity)}`}>
                            {threshold.severity.toUpperCase()}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {threshold.category} • {threshold.thresholdType} • {threshold.value} {threshold.unit}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={threshold.enabled}
                          onCheckedChange={(enabled) => updateThreshold(threshold.id, { enabled })}
                        />
                        <Button size="sm" variant="outline" onClick={() => deleteThreshold(threshold.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <Label className="text-sm font-medium">Category</Label>
                        <Select
                          value={threshold.category}
                          onValueChange={(value) => updateThreshold(threshold.id, { category: value as any })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="documentation">Documentation</SelectItem>
                            <SelectItem value="coding">Coding</SelectItem>
                            <SelectItem value="authorization">Authorization</SelectItem>
                            <SelectItem value="frequency">Frequency</SelectItem>
                            <SelectItem value="eligibility">Eligibility</SelectItem>
                            <SelectItem value="quality">Quality</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Threshold Value</Label>
                        <div className="mt-1 space-y-2">
                          <Input
                            type="number"
                            value={threshold.value}
                            onChange={(e) => updateThreshold(threshold.id, { value: Number(e.target.value) })}
                          />
                          <Select
                            value={threshold.unit}
                            onValueChange={(value) => updateThreshold(threshold.id, { unit: value as any })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="count">Count</SelectItem>
                              <SelectItem value="days">Days</SelectItem>
                              <SelectItem value="hours">Hours</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Severity</Label>
                        <Select
                          value={threshold.severity}
                          onValueChange={(value) => updateThreshold(threshold.id, { severity: value as any })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Violations</Label>
                        <div className="mt-1 space-y-1">
                          <p className="text-2xl font-bold text-red-600">{threshold.violationCount}</p>
                          {threshold.lastViolation && (
                            <p className="text-xs text-gray-500">
                              Last: {new Date(threshold.lastViolation).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={threshold.autoRemediation}
                          onCheckedChange={(autoRemediation) => updateThreshold(threshold.id, { autoRemediation })}
                        />
                        <Label className="text-sm font-medium">Enable Auto-Remediation</Label>
                      </div>

                      {threshold.autoRemediation && (
                        <div>
                          <Label className="text-sm font-medium">Remediation Actions</Label>
                          <div className="mt-2 space-y-1">
                            {threshold.remediationActions.map((action, index) => (
                              <div key={index} className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                                <CheckCircle className="h-4 w-4 text-blue-600" />
                                <span className="text-sm">{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Auto-Billing Settings Tab */}
          <TabsContent value="automation" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Auto-Billing Configuration</h3>
              <p className="text-gray-600">Configure global settings for automated billing processes</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Core automation settings and thresholds</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={autoBillingConfig.enabled}
                    onCheckedChange={(enabled) => setAutoBillingConfig({ ...autoBillingConfig, enabled })}
                  />
                  <Label className="text-sm font-medium">Enable Automated Billing</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium">Minimum Compliance Score</Label>
                    <div className="mt-2 space-y-2">
                      <Slider
                        value={[autoBillingConfig.minimumComplianceScore]}
                        onValueChange={([value]) =>
                          setAutoBillingConfig({ ...autoBillingConfig, minimumComplianceScore: value })
                        }
                        max={100}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>0%</span>
                        <span className="font-medium">{autoBillingConfig.minimumComplianceScore}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Delay Before Submission (hours)</Label>
                    <div className="mt-2 space-y-2">
                      <Slider
                        value={[autoBillingConfig.delayBeforeSubmission]}
                        onValueChange={([value]) =>
                          setAutoBillingConfig({ ...autoBillingConfig, delayBeforeSubmission: value })
                        }
                        max={168}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>0h</span>
                        <span className="font-medium">{autoBillingConfig.delayBeforeSubmission}h</span>
                        <span>168h</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={autoBillingConfig.requireAllDocuments}
                      onCheckedChange={(requireAllDocuments) =>
                        setAutoBillingConfig({ ...autoBillingConfig, requireAllDocuments })
                      }
                    />
                    <Label className="text-sm font-medium">Require All Documents</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={autoBillingConfig.autoSubmitToClearingHouse}
                      onCheckedChange={(autoSubmitToClearingHouse) =>
                        setAutoBillingConfig({ ...autoBillingConfig, autoSubmitToClearingHouse })
                      }
                    />
                    <Label className="text-sm font-medium">Auto-Submit to Clearing House</Label>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Maximum Retry Attempts</Label>
                  <Input
                    type="number"
                    value={autoBillingConfig.maxRetryAttempts}
                    onChange={(e) =>
                      setAutoBillingConfig({ ...autoBillingConfig, maxRetryAttempts: Number(e.target.value) })
                    }
                    className="mt-1 w-32"
                    min="1"
                    max="10"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Notification Settings</h3>
              <p className="text-gray-600">Configure how and when notifications are sent</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>Enable or disable notification channels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={autoBillingConfig.notificationSettings.emailEnabled}
                    onCheckedChange={(emailEnabled) =>
                      setAutoBillingConfig({
                        ...autoBillingConfig,
                        notificationSettings: { ...autoBillingConfig.notificationSettings, emailEnabled },
                      })
                    }
                  />
                  <Label className="text-sm font-medium">Email Notifications</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={autoBillingConfig.notificationSettings.smsEnabled}
                    onCheckedChange={(smsEnabled) =>
                      setAutoBillingConfig({
                        ...autoBillingConfig,
                        notificationSettings: { ...autoBillingConfig.notificationSettings, smsEnabled },
                      })
                    }
                  />
                  <Label className="text-sm font-medium">SMS Notifications</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={autoBillingConfig.notificationSettings.slackEnabled}
                    onCheckedChange={(slackEnabled) =>
                      setAutoBillingConfig({
                        ...autoBillingConfig,
                        notificationSettings: { ...autoBillingConfig.notificationSettings, slackEnabled },
                      })
                    }
                  />
                  <Label className="text-sm font-medium">Slack Notifications</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recipients</CardTitle>
                <CardDescription>Manage notification recipients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {autoBillingConfig.notificationSettings.recipients.map((recipient, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                      <Bell className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{recipient}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const newRecipients = autoBillingConfig.notificationSettings.recipients.filter(
                            (_, i) => i !== index,
                          )
                          setAutoBillingConfig({
                            ...autoBillingConfig,
                            notificationSettings: {
                              ...autoBillingConfig.notificationSettings,
                              recipients: newRecipients,
                            },
                          })
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const email = prompt("Enter email address:")
                      if (email) {
                        setAutoBillingConfig({
                          ...autoBillingConfig,
                          notificationSettings: {
                            ...autoBillingConfig.notificationSettings,
                            recipients: [...autoBillingConfig.notificationSettings.recipients, email],
                          },
                        })
                      }
                    }}
                  >
                    Add Recipient
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )

  function getSeverityColor(severity: string) {
    switch (severity) {
      case "critical":
        return "bg-red-50 text-red-700"
      case "high":
        return "bg-orange-50 text-orange-700"
      case "medium":
        return "bg-yellow-50 text-yellow-700"
      case "low":
        return "bg-blue-50 text-blue-700"
      default:
        return "bg-gray-50 text-gray-700"
    }
  }
}
