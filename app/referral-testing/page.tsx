"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Play, RotateCcw, CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { ReferralData, AutomationDecision } from "@/lib/referral-automation"

interface TestScenario {
  id: string
  name: string
  description: string
  referralData: ReferralData
  expectedOutcome?: "accept" | "review" | "reject"
}

const sampleScenarios: TestScenario[] = [
  {
    id: "ideal-medicare",
    name: "Ideal Medicare Patient",
    description: "Perfect candidate with Medicare, close distance, standard diagnosis",
    referralData: {
      patientName: "John Smith",
      diagnosis: "Diabetes with complications, wound care needed",
      insuranceProvider: "Medicare Part A & B",
      insuranceId: "123456789A",
      referralSource: "Memorial Hospital",
      serviceRequested: ["skilled_nursing", "wound_care"],
      urgency: "routine",
      estimatedEpisodeLength: 45,
      geographicLocation: {
        address: "123 Main St, Anytown, ST 12345",
        zipCode: "12345",
        distance: 8,
      },
      hospitalRating: 4,
      physicianOrders: true,
    },
    expectedOutcome: "accept",
  },
  {
    id: "challenging-medicaid",
    name: "Challenging Medicaid Case",
    description: "Medicaid patient with complex diagnosis and longer episode",
    referralData: {
      patientName: "Maria Garcia",
      diagnosis: "COPD exacerbation, respiratory therapy needed",
      insuranceProvider: "Medicaid Managed Care",
      insuranceId: "MCD987654321",
      referralSource: "Community Health Center",
      serviceRequested: ["skilled_nursing", "respiratory_therapy", "physical_therapy"],
      urgency: "urgent",
      estimatedEpisodeLength: 90,
      geographicLocation: {
        address: "456 Oak Ave, Fartown, ST 67890",
        zipCode: "67890",
        distance: 22,
      },
      hospitalRating: 3,
      physicianOrders: true,
    },
    expectedOutcome: "review",
  },
  {
    id: "problematic-case",
    name: "Problematic Referral",
    description: "Self-pay patient with excluded diagnosis and excessive distance",
    referralData: {
      patientName: "Robert Johnson",
      diagnosis: "Terminal cancer, palliative care needed",
      insuranceProvider: "Self Pay",
      insuranceId: "SELFPAY001",
      referralSource: "Rural Clinic",
      serviceRequested: ["palliative_care", "pain_management"],
      urgency: "stat",
      estimatedEpisodeLength: 180,
      geographicLocation: {
        address: "789 Country Rd, Remoteville, ST 99999",
        zipCode: "99999",
        distance: 45,
      },
      hospitalRating: 2,
      physicianOrders: false,
    },
    expectedOutcome: "reject",
  },
  {
    id: "weekend-emergency",
    name: "Weekend Emergency",
    description: "STAT referral received on weekend",
    referralData: {
      patientName: "Sarah Wilson",
      diagnosis: "Post-surgical wound infection",
      insuranceProvider: "Aetna Better Health",
      insuranceId: "AET123456789",
      referralSource: "Emergency Department",
      serviceRequested: ["skilled_nursing", "wound_care", "iv_therapy"],
      urgency: "stat",
      estimatedEpisodeLength: 21,
      geographicLocation: {
        address: "321 Hospital Dr, Medtown, ST 54321",
        zipCode: "54321",
        distance: 12,
      },
      hospitalRating: 5,
      physicianOrders: true,
    },
    expectedOutcome: "review",
  },
]

export default function ReferralTestingPage() {
  const [selectedScenario, setSelectedScenario] = useState<TestScenario>(sampleScenarios[0])
  const [customReferral, setCustomReferral] = useState<ReferralData>({
    patientName: "",
    diagnosis: "",
    insuranceProvider: "",
    insuranceId: "",
    referralSource: "",
    serviceRequested: [],
    urgency: "routine",
    estimatedEpisodeLength: 30,
    geographicLocation: {
      address: "",
      zipCode: "",
      distance: 0,
    },
    hospitalRating: 3,
    physicianOrders: false,
  })
  const [testResults, setTestResults] = useState<
    {
      decision: AutomationDecision
      configName: string
      timestamp: string
    }[]
  >([])
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState("scenarios")
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  const availableServices = [
    "skilled_nursing",
    "physical_therapy",
    "occupational_therapy",
    "speech_therapy",
    "wound_care",
    "iv_therapy",
    "respiratory_therapy",
    "pain_management",
    "palliative_care",
    "diabetic_education",
  ]

  const runTest = async (referralData: ReferralData, configName = "Default") => {
    setIsRunning(true)
    try {
      const response = await fetch("/api/referral-testing/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralData, configName }),
      })

      if (response.ok) {
        const result = await response.json()
        setTestResults((prev) => [
          {
            decision: result.decision,
            configName,
            timestamp: new Date().toISOString(),
          },
          ...prev.slice(0, 9),
        ]) // Keep last 10 results
      }
    } catch (error) {
      console.error("Test failed:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const runBatchTest = async () => {
    setIsRunning(true)
    setTestResults([])

    for (const scenario of sampleScenarios) {
      await runTest(scenario.referralData, `Scenario: ${scenario.name}`)
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setIsRunning(false)
  }

  const getDecisionIcon = (action: string) => {
    switch (action) {
      case "accept":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "reject":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "review":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600"
    if (score >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreTrend = (score: number) => {
    if (score >= 0.8) return <TrendingUp className="h-3 w-3 text-green-500" />
    if (score >= 0.6) return <Minus className="h-3 w-3 text-yellow-500" />
    return <TrendingDown className="h-3 w-3 text-red-500" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Referral Testing Lab</h1>
          <p className="text-muted-foreground">Test how different referrals perform against your AI decision rules</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runBatchTest} disabled={isRunning} variant="outline">
            <Play className="h-4 w-4 mr-2" />
            Run All Scenarios
          </Button>
          <Button onClick={() => setTestResults([])} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear Results
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Input Section */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scenarios">Sample Scenarios</TabsTrigger>
              <TabsTrigger value="custom">Custom Referral</TabsTrigger>
            </TabsList>

            <TabsContent value="scenarios" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Test Scenarios</CardTitle>
                  <CardDescription>Pre-built scenarios covering common referral types</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sampleScenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedScenario.id === scenario.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedScenario(scenario)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{scenario.name}</h3>
                        {scenario.expectedOutcome && (
                          <Badge
                            variant={
                              scenario.expectedOutcome === "accept"
                                ? "default"
                                : scenario.expectedOutcome === "review"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            Expected: {scenario.expectedOutcome}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <strong>Patient:</strong> {scenario.referralData.patientName}
                        </div>
                        <div>
                          <strong>Insurance:</strong> {scenario.referralData.insuranceProvider}
                        </div>
                        <div>
                          <strong>Distance:</strong> {scenario.referralData.geographicLocation.distance} miles
                        </div>
                        <div>
                          <strong>Urgency:</strong> {scenario.referralData.urgency}
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    onClick={() => runTest(selectedScenario.referralData, selectedScenario.name)}
                    disabled={isRunning}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isRunning ? "Running Test..." : "Test Selected Scenario"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Referral</CardTitle>
                  <CardDescription>Create your own test referral</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patientName">Patient Name</Label>
                      <Input
                        id="patientName"
                        value={customReferral.patientName}
                        onChange={(e) => setCustomReferral((prev) => ({ ...prev, patientName: e.target.value }))}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                      <Input
                        id="insuranceProvider"
                        value={customReferral.insuranceProvider}
                        onChange={(e) => setCustomReferral((prev) => ({ ...prev, insuranceProvider: e.target.value }))}
                        placeholder="Medicare Part A & B"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">Diagnosis</Label>
                    <Textarea
                      id="diagnosis"
                      value={customReferral.diagnosis}
                      onChange={(e) => setCustomReferral((prev) => ({ ...prev, diagnosis: e.target.value }))}
                      placeholder="Primary diagnosis and relevant conditions"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="referralSource">Referral Source</Label>
                      <Input
                        id="referralSource"
                        value={customReferral.referralSource}
                        onChange={(e) => setCustomReferral((prev) => ({ ...prev, referralSource: e.target.value }))}
                        placeholder="Memorial Hospital"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="urgency">Urgency</Label>
                      <Select
                        value={customReferral.urgency}
                        onValueChange={(value: "routine" | "urgent" | "stat") =>
                          setCustomReferral((prev) => ({ ...prev, urgency: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="routine">Routine</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="stat">STAT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Services Requested</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableServices.map((service) => (
                        <div key={service} className="flex items-center space-x-2">
                          <Switch
                            id={service}
                            checked={customReferral.serviceRequested.includes(service)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCustomReferral((prev) => ({
                                  ...prev,
                                  serviceRequested: [...prev.serviceRequested, service],
                                }))
                              } else {
                                setCustomReferral((prev) => ({
                                  ...prev,
                                  serviceRequested: prev.serviceRequested.filter((s) => s !== service),
                                }))
                              }
                            }}
                          />
                          <Label htmlFor={service} className="text-sm">
                            {service.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input
                        id="zipCode"
                        value={customReferral.geographicLocation.zipCode}
                        onChange={(e) =>
                          setCustomReferral((prev) => ({
                            ...prev,
                            geographicLocation: { ...prev.geographicLocation, zipCode: e.target.value },
                          }))
                        }
                        placeholder="12345"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="distance">Distance (miles)</Label>
                      <Input
                        id="distance"
                        type="number"
                        value={customReferral.geographicLocation.distance}
                        onChange={(e) =>
                          setCustomReferral((prev) => ({
                            ...prev,
                            geographicLocation: {
                              ...prev.geographicLocation,
                              distance: Number.parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="episodeLength">Episode Length (days)</Label>
                      <Input
                        id="episodeLength"
                        type="number"
                        value={customReferral.estimatedEpisodeLength}
                        onChange={(e) =>
                          setCustomReferral((prev) => ({
                            ...prev,
                            estimatedEpisodeLength: Number.parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hospitalRating">Hospital Rating (1-5)</Label>
                      <Input
                        id="hospitalRating"
                        type="number"
                        min="1"
                        max="5"
                        value={customReferral.hospitalRating}
                        onChange={(e) =>
                          setCustomReferral((prev) => ({
                            ...prev,
                            hospitalRating: Number.parseInt(e.target.value) || 3,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="physicianOrders"
                        checked={customReferral.physicianOrders || false}
                        onCheckedChange={(checked) =>
                          setCustomReferral((prev) => ({
                            ...prev,
                            physicianOrders: checked,
                          }))
                        }
                      />
                      <Label htmlFor="physicianOrders">Physician Orders Included</Label>
                    </div>
                  </div>

                  <Button
                    onClick={() => runTest(customReferral, "Custom Test")}
                    disabled={isRunning || !customReferral.patientName}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isRunning ? "Running Test..." : "Test Custom Referral"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Latest test outcomes and decision factors</CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No test results yet</p>
                  <p className="text-sm">Run a test to see decision outcomes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {getDecisionIcon(result.decision.action)}
                          <span className="font-semibold capitalize">{result.decision.action}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>

                      <div className="text-sm">
                        <p className="font-medium">{result.configName}</p>
                        <p className="text-muted-foreground">{result.decision.reason}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Confidence Score</span>
                          <span className={getScoreColor(result.decision.confidence)}>
                            {(result.decision.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={result.decision.confidence * 100} className="h-2" />
                      </div>

                      {result.decision.decisionFactors && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium">Factor Scores:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(result.decision.decisionFactors).map(([key, factor]) => {
                              if (key === "overall") return null
                              const score = (factor as any).score || 0
                              return (
                                <div key={key} className="flex justify-between items-center">
                                  <span className="capitalize">{key}:</span>
                                  <div className="flex items-center gap-1">
                                    {getScoreTrend(score)}
                                    <span className={getScoreColor(score)}>{(score * 100).toFixed(0)}%</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {result.decision.recommendedNextSteps.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium">Next Steps:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {result.decision.recommendedNextSteps.slice(0, 3).map((step, stepIndex) => (
                              <li key={stepIndex} className="flex items-start gap-1">
                                <span className="text-primary">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-green-600">
                      {testResults.filter((r) => r.decision.action === "accept").length}
                    </div>
                    <div className="text-xs text-muted-foreground">Accepted</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-yellow-600">
                      {testResults.filter((r) => r.decision.action === "review").length}
                    </div>
                    <div className="text-xs text-muted-foreground">Review</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-bold text-red-600">
                      {testResults.filter((r) => r.decision.action === "reject").length}
                    </div>
                    <div className="text-xs text-muted-foreground">Rejected</div>
                  </div>
                </div>
                <Separator />
                <div className="text-center">
                  <div className="text-sm font-medium">
                    Avg Confidence:{" "}
                    {testResults.length > 0
                      ? (
                          (testResults.reduce((sum, r) => sum + r.decision.confidence, 0) / testResults.length) *
                          100
                        ).toFixed(0)
                      : 0}
                    %
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
