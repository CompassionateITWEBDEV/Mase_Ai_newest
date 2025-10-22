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
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Settings,
  Activity,
  Clock,
  DollarSign,
  Shield,
  Zap,
  Globe,
  Building,
  CreditCard,
  FileText,
  Search,
  Database,
} from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default function ChangeHealthcareSetupPage() {
  const [activeTab, setActiveTab] = useState("credentials")
  const [showPassword, setShowPassword] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    submitterId: "",
    applicationId: "",
    environment: "sandbox",
    tradingPartnerId: "",
  })

  const [services, setServices] = useState({
    eligibility: true,
    priorAuth: true,
    claims: true,
    era: true,
    providerDirectory: true,
    formulary: true,
    memberEnrollment: true,
    claimsStatus: true,
    referralAuth: true,
    paymentAdvice: true,
  })

  const [automationSettings, setAutomationSettings] = useState({
    autoEligibilityOnReferral: true,
    autoPriorAuthSubmission: false,
    autoClaimsSubmission: false,
    realTimeEligibility: true,
    batchProcessing: true,
    errorRetryAttempts: "3",
    notificationSettings: {
      eligibilityFailures: true,
      priorAuthUpdates: true,
      claimsRejections: true,
      paymentNotifications: true,
    },
  })

  const [insuranceCoverage, setInsuranceCoverage] = useState({
    totalPlans: 2847,
    medicareAdvantage: 456,
    medicaid: 234,
    commercial: 1890,
    marketplace: 267,
    coveragePercentage: 99.7,
  })

  const testConnection = async () => {
    setIsConnecting(true)
    setConnectionStatus("testing")

    try {
      const response = await fetch("/api/integrations/change-healthcare/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      })

      const result = await response.json()

      if (result.success) {
        setConnectionStatus("success")
        setInsuranceCoverage(result.coverage || insuranceCoverage)
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
      const response = await fetch("/api/integrations/change-healthcare/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentials,
          services,
          automationSettings,
        }),
      })

      const result = await response.json()

      if (result.success) {
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
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Change Healthcare Integration</h1>
                <p className="text-gray-600">
                  Connect to 2,800+ health plans with comprehensive eligibility, prior auth, and claims processing
                </p>
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="coverage">Coverage</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Change Healthcare API Credentials
                </CardTitle>
                <CardDescription>
                  Enter your Change Healthcare credentials to access 2,800+ health plans nationwide
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      placeholder="Your Change Healthcare username"
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
                    <Label htmlFor="submitterId">Submitter ID</Label>
                    <Input
                      id="submitterId"
                      value={credentials.submitterId}
                      onChange={(e) => setCredentials({ ...credentials, submitterId: e.target.value })}
                      placeholder="Your EDI Submitter ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="applicationId">Application ID</Label>
                    <Input
                      id="applicationId"
                      value={credentials.applicationId}
                      onChange={(e) => setCredentials({ ...credentials, applicationId: e.target.value })}
                      placeholder="Your Application ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tradingPartnerId">Trading Partner ID</Label>
                    <Input
                      id="tradingPartnerId"
                      value={credentials.tradingPartnerId}
                      onChange={(e) => setCredentials({ ...credentials, tradingPartnerId: e.target.value })}
                      placeholder="Your Trading Partner ID"
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
                        ? `Successfully connected to Change Healthcare. Access to ${insuranceCoverage.totalPlans} health plans confirmed.`
                        : connectionStatus === "error"
                          ? "Failed to connect. Please check your credentials and try again."
                          : "Testing your API credentials and verifying access..."}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Available Services
                </CardTitle>
                <CardDescription>Enable the Change Healthcare services you want to use</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Core Services</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">Real-time Eligibility (270/271)</Label>
                          <p className="text-sm text-gray-600">Check patient eligibility and benefits</p>
                        </div>
                        <Switch
                          checked={services.eligibility}
                          onCheckedChange={(checked) => setServices({ ...services, eligibility: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">Prior Authorization (278)</Label>
                          <p className="text-sm text-gray-600">Submit and track prior authorizations</p>
                        </div>
                        <Switch
                          checked={services.priorAuth}
                          onCheckedChange={(checked) => setServices({ ...services, priorAuth: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">Claims Submission (837)</Label>
                          <p className="text-sm text-gray-600">Submit professional and institutional claims</p>
                        </div>
                        <Switch
                          checked={services.claims}
                          onCheckedChange={(checked) => setServices({ ...services, claims: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">ERA Processing (835)</Label>
                          <p className="text-sm text-gray-600">Electronic remittance advice processing</p>
                        </div>
                        <Switch
                          checked={services.era}
                          onCheckedChange={(checked) => setServices({ ...services, era: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">Claims Status (276/277)</Label>
                          <p className="text-sm text-gray-600">Check status of submitted claims</p>
                        </div>
                        <Switch
                          checked={services.claimsStatus}
                          onCheckedChange={(checked) => setServices({ ...services, claimsStatus: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Enhanced Services</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">Provider Directory</Label>
                          <p className="text-sm text-gray-600">Access provider network information</p>
                        </div>
                        <Switch
                          checked={services.providerDirectory}
                          onCheckedChange={(checked) => setServices({ ...services, providerDirectory: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">Formulary Information</Label>
                          <p className="text-sm text-gray-600">Drug formulary and coverage details</p>
                        </div>
                        <Switch
                          checked={services.formulary}
                          onCheckedChange={(checked) => setServices({ ...services, formulary: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">Member Enrollment</Label>
                          <p className="text-sm text-gray-600">Enrollment verification and updates</p>
                        </div>
                        <Switch
                          checked={services.memberEnrollment}
                          onCheckedChange={(checked) => setServices({ ...services, memberEnrollment: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">Referral Authorization</Label>
                          <p className="text-sm text-gray-600">Manage referral authorizations</p>
                        </div>
                        <Switch
                          checked={services.referralAuth}
                          onCheckedChange={(checked) => setServices({ ...services, referralAuth: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">Payment Advice</Label>
                          <p className="text-sm text-gray-600">Electronic payment notifications</p>
                        </div>
                        <Switch
                          checked={services.paymentAdvice}
                          onCheckedChange={(checked) => setServices({ ...services, paymentAdvice: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Automation & Workflow Settings
                </CardTitle>
                <CardDescription>Configure automated processes and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Automated Processes</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-check eligibility on new referrals</Label>
                          <p className="text-sm text-gray-600">
                            Automatically verify eligibility when referrals arrive
                          </p>
                        </div>
                        <Switch
                          checked={automationSettings.autoEligibilityOnReferral}
                          onCheckedChange={(checked) =>
                            setAutomationSettings({ ...automationSettings, autoEligibilityOnReferral: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-submit prior authorizations</Label>
                          <p className="text-sm text-gray-600">Submit prior auths when required by payer</p>
                        </div>
                        <Switch
                          checked={automationSettings.autoPriorAuthSubmission}
                          onCheckedChange={(checked) =>
                            setAutomationSettings({ ...automationSettings, autoPriorAuthSubmission: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-submit claims</Label>
                          <p className="text-sm text-gray-600">Submit claims automatically after service delivery</p>
                        </div>
                        <Switch
                          checked={automationSettings.autoClaimsSubmission}
                          onCheckedChange={(checked) =>
                            setAutomationSettings({ ...automationSettings, autoClaimsSubmission: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Real-time eligibility updates</Label>
                          <p className="text-sm text-gray-600">Check for eligibility changes during episodes</p>
                        </div>
                        <Switch
                          checked={automationSettings.realTimeEligibility}
                          onCheckedChange={(checked) =>
                            setAutomationSettings({ ...automationSettings, realTimeEligibility: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Batch processing</Label>
                          <p className="text-sm text-gray-600">Process multiple transactions together</p>
                        </div>
                        <Switch
                          checked={automationSettings.batchProcessing}
                          onCheckedChange={(checked) =>
                            setAutomationSettings({ ...automationSettings, batchProcessing: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Notification Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Eligibility check failures</Label>
                          <p className="text-sm text-gray-600">Notify MSW when eligibility checks fail</p>
                        </div>
                        <Switch
                          checked={automationSettings.notificationSettings.eligibilityFailures}
                          onCheckedChange={(checked) =>
                            setAutomationSettings({
                              ...automationSettings,
                              notificationSettings: {
                                ...automationSettings.notificationSettings,
                                eligibilityFailures: checked,
                              },
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Prior auth status updates</Label>
                          <p className="text-sm text-gray-600">Notify when prior auth status changes</p>
                        </div>
                        <Switch
                          checked={automationSettings.notificationSettings.priorAuthUpdates}
                          onCheckedChange={(checked) =>
                            setAutomationSettings({
                              ...automationSettings,
                              notificationSettings: {
                                ...automationSettings.notificationSettings,
                                priorAuthUpdates: checked,
                              },
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Claims rejections</Label>
                          <p className="text-sm text-gray-600">Alert when claims are rejected</p>
                        </div>
                        <Switch
                          checked={automationSettings.notificationSettings.claimsRejections}
                          onCheckedChange={(checked) =>
                            setAutomationSettings({
                              ...automationSettings,
                              notificationSettings: {
                                ...automationSettings.notificationSettings,
                                claimsRejections: checked,
                              },
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Payment notifications</Label>
                          <p className="text-sm text-gray-600">Notify when payments are received</p>
                        </div>
                        <Switch
                          checked={automationSettings.notificationSettings.paymentNotifications}
                          onCheckedChange={(checked) =>
                            setAutomationSettings({
                              ...automationSettings,
                              notificationSettings: {
                                ...automationSettings.notificationSettings,
                                paymentNotifications: checked,
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="retryAttempts">Error Retry Attempts</Label>
                      <Select
                        value={automationSettings.errorRetryAttempts}
                        onValueChange={(value) =>
                          setAutomationSettings({ ...automationSettings, errorRetryAttempts: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 attempt</SelectItem>
                          <SelectItem value="3">3 attempts</SelectItem>
                          <SelectItem value="5">5 attempts</SelectItem>
                          <SelectItem value="10">10 attempts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coverage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Insurance Coverage Network
                </CardTitle>
                <CardDescription>
                  Change Healthcare provides access to the largest payer network in the industry
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{insuranceCoverage.totalPlans}</div>
                      <div className="text-sm text-gray-600">Total Health Plans</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{insuranceCoverage.coveragePercentage}%</div>
                      <div className="text-sm text-gray-600">Market Coverage</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{insuranceCoverage.commercial}</div>
                      <div className="text-sm text-gray-600">Commercial Plans</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">{insuranceCoverage.medicareAdvantage}</div>
                      <div className="text-sm text-gray-600">Medicare Advantage</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Major Payers Included</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[
                          "Aetna",
                          "Anthem/BCBS",
                          "Cigna",
                          "Humana",
                          "UnitedHealthcare",
                          "Medicare",
                          "Medicaid (All States)",
                          "Kaiser Permanente",
                          "Molina Healthcare",
                          "Centene",
                          "WellCare",
                          "Independence Blue Cross",
                        ].map((payer, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{payer}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Coverage by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Commercial Insurance</span>
                            <span>{insuranceCoverage.commercial} plans</span>
                          </div>
                          <Progress value={67} className="h-2" />
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Medicare Advantage</span>
                            <span>{insuranceCoverage.medicareAdvantage} plans</span>
                          </div>
                          <Progress value={16} className="h-2" />
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Marketplace Plans</span>
                            <span>{insuranceCoverage.marketplace} plans</span>
                          </div>
                          <Progress value={9} className="h-2" />
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Medicaid</span>
                            <span>{insuranceCoverage.medicaid} plans</span>
                          </div>
                          <Progress value={8} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Testing</CardTitle>
                <CardDescription>Test your Change Healthcare integration with sample data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-24 flex flex-col bg-transparent">
                    <Search className="h-6 w-6 mb-2" />
                    <span className="font-medium">Test Eligibility</span>
                    <span className="text-xs text-gray-600">270/271 Transaction</span>
                  </Button>

                  <Button variant="outline" className="h-24 flex flex-col bg-transparent">
                    <Shield className="h-6 w-6 mb-2" />
                    <span className="font-medium">Test Prior Auth</span>
                    <span className="text-xs text-gray-600">278 Transaction</span>
                  </Button>

                  <Button variant="outline" className="h-24 flex flex-col bg-transparent">
                    <FileText className="h-6 w-6 mb-2" />
                    <span className="font-medium">Test Claims</span>
                    <span className="text-xs text-gray-600">837 Transaction</span>
                  </Button>

                  <Button variant="outline" className="h-24 flex flex-col bg-transparent">
                    <CreditCard className="h-6 w-6 mb-2" />
                    <span className="font-medium">Test ERA</span>
                    <span className="text-xs text-gray-600">835 Transaction</span>
                  </Button>

                  <Button variant="outline" className="h-24 flex flex-col bg-transparent">
                    <Activity className="h-6 w-6 mb-2" />
                    <span className="font-medium">Test Claims Status</span>
                    <span className="text-xs text-gray-600">276/277 Transaction</span>
                  </Button>

                  <Button variant="outline" className="h-24 flex flex-col bg-transparent">
                    <Building className="h-6 w-6 mb-2" />
                    <span className="font-medium">Test Provider Directory</span>
                    <span className="text-xs text-gray-600">Network Lookup</span>
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
                      <p className="text-2xl font-bold">3,247</p>
                      <p className="text-gray-600 text-sm">Transactions Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">99.1%</p>
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
                      <p className="text-2xl font-bold">0.8s</p>
                      <p className="text-gray-600 text-sm">Avg Response</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-orange-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">$2.4M</p>
                      <p className="text-gray-600 text-sm">Claims Processed</p>
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
                    { time: "1 min ago", action: "Eligibility verified", patient: "Sarah Johnson", status: "success" },
                    { time: "3 min ago", action: "Prior auth approved", patient: "Michael Chen", status: "success" },
                    { time: "5 min ago", action: "Claims submitted", patient: "Emily Davis", status: "pending" },
                    { time: "8 min ago", action: "ERA processed", patient: "Robert Wilson", status: "success" },
                    { time: "12 min ago", action: "Eligibility check", patient: "Lisa Garcia", status: "failed" },
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
