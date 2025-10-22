"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Activity,
  Clock,
  DollarSign,
  Users,
  Bell,
  Shield,
  Zap,
  Building2,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

export default function ExtendedCareSetupPage() {
  const [activeTab, setActiveTab] = useState("credentials")
  const [showPassword, setShowPassword] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    clientId: "",
    clientSecret: "",
    environment: "sandbox",
  })

  const [syncSettings, setSyncSettings] = useState({
    autoEligibilityCheck: true,
    autoPriorAuth: false,
    realTimeUpdates: true,
    batchProcessing: false,
    notifyMSW: true,
    syncInterval: "15",
  })

  const [referralMetrics, setReferralMetrics] = useState({
    acceptMedicare: true,
    acceptMedicaid: true,
    acceptCommercial: true,
    acceptManagedCare: true,
    minReimbursementRate: "80",
    maxTravelDistance: "25",
    requiredServices: ["skilled_nursing", "physical_therapy"],
    excludedDiagnoses: ["hospice", "palliative"],
  })

  const testConnection = async () => {
    setIsConnecting(true)
    setConnectionStatus("testing")

    try {
      const response = await fetch("/api/integrations/extendedcare/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      })

      const result = await response.json()

      if (result.success) {
        setConnectionStatus("success")
      } else {
        setConnectionStatus("error")
      }
    } catch (error) {
      setConnectionStatus("error")
    } finally {
      setIsConnecting(false)
    }
  }

  const saveConfiguration = async () => {
    setIsSaving(true)

    try {
      const response = await fetch("/api/integrations/extendedcare/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentials,
          syncSettings,
          referralMetrics,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Show success message
        console.log("Configuration saved successfully")
      }
    } catch (error) {
      console.error("Failed to save configuration:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/integrations">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Integrations
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ExtendedCare Integration Setup</h1>
                <p className="text-gray-600">Configure eligibility verification and prior authorization</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={testConnection} disabled={isConnecting}>
              {isConnecting ? "Testing..." : "Test Connection"}
            </Button>
            <Button onClick={saveConfiguration} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="referral-metrics">Referral Metrics</TabsTrigger>
            <TabsTrigger value="sync-settings">Sync Settings</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  API Credentials
                </CardTitle>
                <CardDescription>Enter your ExtendedCare API credentials to connect your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      placeholder="Enter your ExtendedCare username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        placeholder="Enter your password"
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

                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      id="clientId"
                      value={credentials.clientId}
                      onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
                      placeholder="Your API Client ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientSecret">Client Secret</Label>
                    <Input
                      id="clientSecret"
                      type="password"
                      value={credentials.clientSecret}
                      onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
                      placeholder="Your API Client Secret"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="environment">Environment</Label>
                    <Select
                      value={credentials.environment}
                      onValueChange={(value) => setCredentials({ ...credentials, environment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {connectionStatus !== "idle" && (
                  <Alert
                    className={
                      connectionStatus === "success"
                        ? "border-green-200 bg-green-50"
                        : connectionStatus === "error"
                          ? "border-red-200 bg-red-50"
                          : "border-blue-200 bg-blue-50"
                    }
                  >
                    {connectionStatus === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : connectionStatus === "error" ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-600" />
                    )}
                    <AlertTitle>
                      {connectionStatus === "success"
                        ? "Connection Successful"
                        : connectionStatus === "error"
                          ? "Connection Failed"
                          : "Testing Connection"}
                    </AlertTitle>
                    <AlertDescription>
                      {connectionStatus === "success"
                        ? "Successfully connected to ExtendedCare API"
                        : connectionStatus === "error"
                          ? "Failed to connect. Please check your credentials."
                          : "Testing your API credentials..."}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referral-metrics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Referral Acceptance Criteria
                </CardTitle>
                <CardDescription>
                  Set automatic criteria for accepting or rejecting referrals based on insurance and other factors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Insurance Types */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Accepted Insurance Types</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={referralMetrics.acceptMedicare}
                        onCheckedChange={(checked) =>
                          setReferralMetrics({ ...referralMetrics, acceptMedicare: checked })
                        }
                      />
                      <Label>Medicare</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={referralMetrics.acceptMedicaid}
                        onCheckedChange={(checked) =>
                          setReferralMetrics({ ...referralMetrics, acceptMedicaid: checked })
                        }
                      />
                      <Label>Medicaid</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={referralMetrics.acceptCommercial}
                        onCheckedChange={(checked) =>
                          setReferralMetrics({ ...referralMetrics, acceptCommercial: checked })
                        }
                      />
                      <Label>Commercial</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={referralMetrics.acceptManagedCare}
                        onCheckedChange={(checked) =>
                          setReferralMetrics({ ...referralMetrics, acceptManagedCare: checked })
                        }
                      />
                      <Label>Managed Care</Label>
                    </div>
                  </div>
                </div>

                {/* Financial Criteria */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="minReimbursement">Minimum Reimbursement Rate (%)</Label>
                    <Input
                      id="minReimbursement"
                      type="number"
                      value={referralMetrics.minReimbursementRate}
                      onChange={(e) => setReferralMetrics({ ...referralMetrics, minReimbursementRate: e.target.value })}
                      placeholder="80"
                    />
                    <p className="text-sm text-gray-600">Minimum percentage of Medicare rates to accept</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxDistance">Maximum Travel Distance (miles)</Label>
                    <Input
                      id="maxDistance"
                      type="number"
                      value={referralMetrics.maxTravelDistance}
                      onChange={(e) => setReferralMetrics({ ...referralMetrics, maxTravelDistance: e.target.value })}
                      placeholder="25"
                    />
                    <p className="text-sm text-gray-600">Maximum distance from your service area</p>
                  </div>
                </div>

                {/* Service Requirements */}
                <div>
                  <Label>Required Services (Select all that apply)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {[
                      { id: "skilled_nursing", label: "Skilled Nursing" },
                      { id: "physical_therapy", label: "Physical Therapy" },
                      { id: "occupational_therapy", label: "Occupational Therapy" },
                      { id: "speech_therapy", label: "Speech Therapy" },
                      { id: "medical_social_work", label: "Medical Social Work" },
                      { id: "home_health_aide", label: "Home Health Aide" },
                    ].map((service) => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Switch
                          checked={referralMetrics.requiredServices.includes(service.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setReferralMetrics({
                                ...referralMetrics,
                                requiredServices: [...referralMetrics.requiredServices, service.id],
                              })
                            } else {
                              setReferralMetrics({
                                ...referralMetrics,
                                requiredServices: referralMetrics.requiredServices.filter((s) => s !== service.id),
                              })
                            }
                          }}
                        />
                        <Label className="text-sm">{service.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Excluded Diagnoses */}
                <div className="space-y-2">
                  <Label htmlFor="excludedDiagnoses">Excluded Diagnoses</Label>
                  <Textarea
                    id="excludedDiagnoses"
                    value={referralMetrics.excludedDiagnoses.join(", ")}
                    onChange={(e) =>
                      setReferralMetrics({
                        ...referralMetrics,
                        excludedDiagnoses: e.target.value.split(", ").filter((d) => d.trim()),
                      })
                    }
                    placeholder="hospice, palliative, experimental"
                    rows={3}
                  />
                  <p className="text-sm text-gray-600">Comma-separated list of diagnoses to automatically reject</p>
                </div>
              </CardContent>
            </Card>

            {/* MSW Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  MSW Notification Settings
                </CardTitle>
                <CardDescription>Configure when to notify Medical Social Workers about referrals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked />
                      <Label>Notify on insurance denials</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked />
                      <Label>Notify on prior auth requirements</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked />
                      <Label>Notify on low reimbursement rates</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch />
                      <Label>Notify on complex cases</Label>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked />
                      <Label>Notify on eligibility issues</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch />
                      <Label>Notify on geographic restrictions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch defaultChecked />
                      <Label>Notify on service limitations</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch />
                      <Label>Daily summary reports</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync-settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Synchronization Settings
                </CardTitle>
                <CardDescription>Configure how ExtendedCare syncs with your M.A.S.E system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Automatic Eligibility Checks</Label>
                        <p className="text-sm text-gray-600">Check eligibility when new referrals arrive</p>
                      </div>
                      <Switch
                        checked={syncSettings.autoEligibilityCheck}
                        onCheckedChange={(checked) =>
                          setSyncSettings({ ...syncSettings, autoEligibilityCheck: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Automatic Prior Authorization</Label>
                        <p className="text-sm text-gray-600">Submit prior auths automatically when required</p>
                      </div>
                      <Switch
                        checked={syncSettings.autoPriorAuth}
                        onCheckedChange={(checked) => setSyncSettings({ ...syncSettings, autoPriorAuth: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Real-time Updates</Label>
                        <p className="text-sm text-gray-600">Sync changes immediately</p>
                      </div>
                      <Switch
                        checked={syncSettings.realTimeUpdates}
                        onCheckedChange={(checked) => setSyncSettings({ ...syncSettings, realTimeUpdates: checked })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Batch Processing</Label>
                        <p className="text-sm text-gray-600">Process multiple requests together</p>
                      </div>
                      <Switch
                        checked={syncSettings.batchProcessing}
                        onCheckedChange={(checked) => setSyncSettings({ ...syncSettings, batchProcessing: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Notify MSW</Label>
                        <p className="text-sm text-gray-600">Send notifications to Medical Social Workers</p>
                      </div>
                      <Switch
                        checked={syncSettings.notifyMSW}
                        onCheckedChange={(checked) => setSyncSettings({ ...syncSettings, notifyMSW: checked })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
                      <Select
                        value={syncSettings.syncInterval}
                        onValueChange={(value) => setSyncSettings({ ...syncSettings, syncInterval: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">Every 5 minutes</SelectItem>
                          <SelectItem value="15">Every 15 minutes</SelectItem>
                          <SelectItem value="30">Every 30 minutes</SelectItem>
                          <SelectItem value="60">Every hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Testing</CardTitle>
                <CardDescription>Test your ExtendedCare integration with sample data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col bg-transparent">
                    <Users className="h-6 w-6 mb-2" />
                    Test Eligibility Check
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col bg-transparent">
                    <Shield className="h-6 w-6 mb-2" />
                    Test Prior Authorization
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col bg-transparent">
                    <DollarSign className="h-6 w-6 mb-2" />
                    Test Claims Submission
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col bg-transparent">
                    <Activity className="h-6 w-6 mb-2" />
                    Test Real-time Sync
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Activity className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">1,247</p>
                      <p className="text-gray-600 text-sm">API Calls Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">98.5%</p>
                      <p className="text-gray-600 text-sm">Success Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">1.2s</p>
                      <p className="text-gray-600 text-sm">Avg Response</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-orange-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">99.2%</p>
                      <p className="text-gray-600 text-sm">Uptime</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { time: "2 min ago", action: "Eligibility check", patient: "John Doe", status: "success" },
                    { time: "5 min ago", action: "Prior auth submitted", patient: "Jane Smith", status: "pending" },
                    { time: "8 min ago", action: "Claims submission", patient: "Bob Johnson", status: "success" },
                    { time: "12 min ago", action: "Eligibility check", patient: "Mary Wilson", status: "failed" },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant={
                            activity.status === "success"
                              ? "default"
                              : activity.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {activity.status}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{activity.action}</p>
                          <p className="text-xs text-gray-600">{activity.patient}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{activity.time}</span>
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
