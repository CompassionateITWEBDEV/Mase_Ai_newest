"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Mail,
  Send,
  TestTube,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  FileText,
  Activity,
  Zap,
  RefreshCw,
  Download,
  Eye,
} from "lucide-react"

interface TestEmail {
  id: string
  subject: string
  from: string
  to: string
  body: string
  urgency: "routine" | "urgent" | "stat"
  scenario: string
  timestamp?: string
  status?: "pending" | "sent" | "processed" | "failed"
  result?: any
}

interface ProcessingResult {
  success: boolean
  referralId: string
  processingTime: number
  extractedData: any
  decision: any
  confirmationSent: boolean
  errors?: string[]
}

export default function EmailTestingPage() {
  const [testEmails, setTestEmails] = useState<TestEmail[]>([])
  const [selectedEmail, setSelectedEmail] = useState<TestEmail | null>(null)
  const [customEmail, setCustomEmail] = useState<TestEmail>({
    id: "",
    subject: "",
    from: "",
    to: "referrals@yourhealthcareagency.com",
    body: "",
    urgency: "routine",
    scenario: "custom",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<ProcessingResult[]>([])
  const [activeTab, setActiveTab] = useState("templates")

  useEffect(() => {
    loadTestTemplates()
  }, [])

  const loadTestTemplates = () => {
    const templates: TestEmail[] = [
      {
        id: "ideal-medicare",
        scenario: "Ideal Medicare Patient",
        subject: "New Patient Referral - Mary Johnson",
        from: "discharge@springfieldgeneral.com",
        to: "referrals@yourhealthcareagency.com",
        urgency: "routine",
        body: `Dear Home Health Team,

We have a new patient referral for your consideration:

Patient: Mary Johnson
DOB: 03/15/1945
MRN: MJ123456
Diagnosis: Post-surgical wound care following hip replacement, diabetes management
Insurance Provider: Medicare Part A & B
Medicare ID: 123456789A
Secondary Insurance: Blue Cross Blue Shield Supplement

Address: 123 Oak Street, Springfield, IL 62701
Phone: (217) 555-0123
Emergency Contact: John Johnson (son) - (217) 555-0124

Services Requested:
- Skilled Nursing (wound assessment and care)
- Physical Therapy (mobility and strength)
- Diabetic education and monitoring

Physician Orders: Attached (signed by Dr. Sarah Smith, MD)
Urgency: Routine
Estimated Episode Length: 60 days
Hospital Rating: 5 stars
Discharge Date: Tomorrow

Additional Notes:
- Patient is motivated and has good family support
- Lives in single-story home with minimal barriers
- Previous home health experience with positive outcomes

Please confirm receipt and provide estimated start of care date.

Best regards,
Springfield General Hospital
Discharge Planning Department
Phone: (217) 555-0100`,
      },
      {
        id: "urgent-medicaid",
        scenario: "Urgent Medicaid Case",
        subject: "URGENT - High-Risk Patient Discharge",
        from: "socialwork@countyhospital.org",
        to: "referrals@yourhealthcareagency.com",
        urgency: "urgent",
        body: `URGENT REFERRAL - PLEASE RESPOND ASAP

Patient: Robert Williams
DOB: 08/22/1960
MRN: RW789012
Diagnosis: COPD exacerbation, congestive heart failure, medication non-compliance
Insurance Provider: Medicaid (Molina Healthcare)
Medicaid ID: MW987654321

Address: 456 Elm Avenue, Apt 2B, Springfield, IL 62702
Phone: (217) 555-0456
Emergency Contact: Sister - Linda Williams (217) 555-0457

Services Requested:
- Skilled Nursing (medication management, disease monitoring)
- Respiratory therapy consultation
- Social work assessment

Physician Orders: Available upon request
Urgency: URGENT - Patient being discharged today
Estimated Episode Length: 45 days
Hospital Rating: 4 stars

Risk Factors:
- History of frequent readmissions
- Lives alone in second-floor apartment
- Limited family support
- Financial constraints
- Previous medication non-compliance

This patient requires immediate intervention to prevent readmission. Please advise if you can accept this referral.

Contact: Maria Rodriguez, MSW
County Hospital Social Services
Phone: (217) 555-0200
Pager: (217) 555-0201`,
      },
      {
        id: "stat-complex",
        scenario: "STAT Complex Case",
        subject: "STAT REFERRAL - Ventilator Patient",
        from: "icu@universityhospital.edu",
        to: "referrals@yourhealthcareagency.com",
        urgency: "stat",
        body: `STAT REFERRAL - IMMEDIATE RESPONSE REQUIRED

Patient: Jennifer Martinez
DOB: 11/30/1978
MRN: JM345678
Diagnosis: Respiratory failure post-COVID, tracheostomy with ventilator dependence
Insurance Provider: Blue Cross Blue Shield PPO
Policy ID: BC123456789
Prior Authorization: Required and pending

Address: 789 Pine Street, Springfield, IL 62703
Phone: (217) 555-0789
Emergency Contact: Husband - Carlos Martinez (217) 555-0790

Services Requested:
- Skilled Nursing (ventilator management, trach care)
- Respiratory Therapy (daily visits)
- Physical Therapy (reconditioning)
- Medical Social Worker (equipment coordination)

Physician Orders: Dr. Michael Chen, Pulmonologist
Urgency: STAT - Patient needs discharge within 6 hours
Estimated Episode Length: 90+ days
Hospital Rating: 5 stars

Special Requirements:
- 24/7 nursing coverage initially
- Ventilator and backup equipment
- Specialized nursing staff with vent experience
- Family training required
- DME coordination essential

Equipment Needed:
- Home ventilator
- Suction machine
- Pulse oximeter
- Hospital bed
- Oxygen concentrator

This is a high-acuity case requiring immediate response. Patient cannot be discharged without confirmed home health services.

Contact: Dr. Michael Chen
University Hospital ICU
Phone: (217) 555-0300
Direct: (217) 555-0301`,
      },
      {
        id: "problematic-referral",
        scenario: "Problematic Referral",
        subject: "Patient Referral - Distance Concern",
        from: "referrals@distanthospital.com",
        to: "referrals@yourhealthcareagency.com",
        urgency: "routine",
        body: `Dear Home Health Agency,

We have a patient who may need your services:

Patient: Thomas Anderson
DOB: 05/12/1955
Diagnosis: Terminal cancer, hospice appropriate
Insurance Provider: Denied Insurance Company
Policy Status: Claim under review

Address: 999 Remote Road, Faraway, IL 99999
Phone: (999) 555-9999
Distance from your office: Approximately 45 miles

Services Requested:
- Skilled Nursing
- Pain management
- Emotional support

Physician Orders: To be provided
Urgency: Routine
Estimated Episode Length: 180 days
Hospital Rating: 2 stars

Additional Information:
- Patient has history of non-compliance
- Family reports difficult access to home
- Previous agencies have declined services
- Insurance coverage questionable

Please let us know if you can assist with this case.

Regards,
Distant Hospital
Referral Department`,
      },
      {
        id: "weekend-emergency",
        scenario: "Weekend Emergency",
        subject: "Weekend Discharge - Elderly Fall",
        from: "weekend@emergencyhospital.com",
        to: "referrals@yourhealthcareagency.com",
        urgency: "urgent",
        body: `Weekend Referral - Emergency Department

Patient: Dorothy Thompson
DOB: 01/08/1932
MRN: DT567890
Diagnosis: Hip fracture post-fall, dehydration, confusion
Insurance Provider: Medicare Advantage (Humana)
Medicare ID: DT987654321

Address: 321 Senior Lane, Springfield, IL 62704
Phone: (217) 555-0321
Emergency Contact: Daughter - Susan Thompson (217) 555-0322

Services Requested:
- Skilled Nursing (wound care, medication management)
- Physical Therapy (fall prevention, mobility)
- Occupational Therapy (safety assessment)

Physician Orders: Dr. Emergency Room
Urgency: Weekend discharge needed
Estimated Episode Length: 30 days
Hospital Rating: 3 stars

Weekend Considerations:
- Patient being discharged Saturday afternoon
- Family available for coordination
- Home safety concerns identified
- Medication reconciliation needed

This patient needs weekend services to prevent readmission.

Contact: Weekend Charge Nurse
Emergency Hospital
Phone: (217) 555-0400`,
      },
    ]

    setTestEmails(templates)
  }

  const sendTestEmail = async (email: TestEmail) => {
    setIsLoading(true)
    try {
      const emailToSend = {
        ...email,
        id: email.id || `test-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: "pending" as const,
      }

      // Update the email status
      setTestEmails((prev) => prev.map((e) => (e.id === email.id ? { ...emailToSend, status: "sent" } : e)))

      // Send the email through the webhook
      const response = await fetch("/api/email/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailToSend.from,
          to: emailToSend.to,
          subject: emailToSend.subject,
          text: emailToSend.body,
          timestamp: emailToSend.timestamp,
          messageId: `test-${emailToSend.id}-${Date.now()}`,
          provider: "test",
        }),
      })

      const result = await response.json()

      const processingResult: ProcessingResult = {
        success: result.success || false,
        referralId: result.referralId || `ERROR-${Date.now()}`,
        processingTime: result.processingTime || 0,
        extractedData: result.extractedData || null,
        decision: result.decision || null,
        confirmationSent: result.confirmationSent || false,
        errors: result.errors || [],
      }

      // Update results
      setResults((prev) => [
        {
          ...processingResult,
          success: response.ok,
        },
        ...prev,
      ])

      // Update email status
      setTestEmails((prev) =>
        prev.map((e) =>
          e.id === email.id
            ? {
                ...e,
                status: response.ok ? "processed" : "failed",
                result: processingResult,
              }
            : e,
        ),
      )

      if (response.ok) {
        alert(`Test email sent successfully! Referral ID: ${processingResult.referralId}`)
      } else {
        alert(`Test failed: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Test email error:", error)
      alert("Failed to send test email")

      setTestEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, status: "failed" } : e)))
    } finally {
      setIsLoading(false)
    }
  }

  const sendCustomEmail = async () => {
    if (!customEmail.subject || !customEmail.from || !customEmail.body) {
      alert("Please fill in all required fields")
      return
    }

    const emailToSend = {
      ...customEmail,
      id: `custom-${Date.now()}`,
    }

    await sendTestEmail(emailToSend)
  }

  const sendAllTests = async () => {
    setIsLoading(true)
    for (const email of testEmails) {
      await sendTestEmail(email)
      // Small delay between emails
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    setIsLoading(false)
  }

  const clearResults = () => {
    setResults([])
    setTestEmails((prev) =>
      prev.map((email) => ({
        ...email,
        status: undefined,
        result: undefined,
      })),
    )
  }

  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      results: results,
      testEmails: testEmails,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `email-test-results-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TestTube className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Email Testing</h1>
            <p className="text-gray-600">Send real referral emails to test the complete workflow</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearResults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Results
          </Button>
          <Button variant="outline" onClick={exportResults} disabled={results.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
          <Button onClick={sendAllTests} disabled={isLoading}>
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? "Sending..." : "Send All Tests"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Test Templates</TabsTrigger>
          <TabsTrigger value="custom">Custom Email</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testEmails.map((email) => (
              <Card key={email.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{email.scenario}</CardTitle>
                      <CardDescription className="mt-1">{email.subject}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={
                          email.urgency === "stat"
                            ? "destructive"
                            : email.urgency === "urgent"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {email.urgency.toUpperCase()}
                      </Badge>
                      {email.status && (
                        <Badge
                          variant={
                            email.status === "processed"
                              ? "default"
                              : email.status === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {email.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">From:</span>
                      <span className="text-gray-600">{email.from}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <span className="font-medium">Preview:</span>
                        <p className="text-gray-600 text-xs mt-1 line-clamp-3">{email.body.substring(0, 150)}...</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => sendTestEmail(email)} disabled={isLoading} className="flex-1">
                      <Send className="h-4 w-4 mr-2" />
                      Send Test
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedEmail(email)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>

                  {email.result && (
                    <Alert className={email.result.success ? "border-green-200" : "border-red-200"}>
                      {email.result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription>
                        <div className="space-y-1 text-xs">
                          <p>
                            <strong>Referral ID:</strong> {email.result.referralId}
                          </p>
                          <p>
                            <strong>Processing Time:</strong> {email.result.processingTime}ms
                          </p>
                          {email.result.decision && (
                            <p>
                              <strong>Decision:</strong> {email.result.decision.action?.toUpperCase()}
                            </p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Custom Test Email</CardTitle>
              <CardDescription>Build your own referral email to test specific scenarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customSubject">Subject *</Label>
                  <Input
                    id="customSubject"
                    value={customEmail.subject}
                    onChange={(e) => setCustomEmail((prev) => ({ ...prev, subject: e.target.value }))}
                    placeholder="Patient Referral - John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customFrom">From Email *</Label>
                  <Input
                    id="customFrom"
                    type="email"
                    value={customEmail.from}
                    onChange={(e) => setCustomEmail((prev) => ({ ...prev, from: e.target.value }))}
                    placeholder="hospital@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customTo">To Email</Label>
                  <Input
                    id="customTo"
                    type="email"
                    value={customEmail.to}
                    onChange={(e) => setCustomEmail((prev) => ({ ...prev, to: e.target.value }))}
                    placeholder="referrals@yourhealthcareagency.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customUrgency">Urgency</Label>
                  <Select
                    value={customEmail.urgency}
                    onValueChange={(value: "routine" | "urgent" | "stat") =>
                      setCustomEmail((prev) => ({ ...prev, urgency: value }))
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
                <Label htmlFor="customBody">Email Body *</Label>
                <Textarea
                  id="customBody"
                  rows={15}
                  value={customEmail.body}
                  onChange={(e) => setCustomEmail((prev) => ({ ...prev, body: e.target.value }))}
                  placeholder={`Dear Home Health Team,

We have a new patient referral:

Patient: [Patient Name]
DOB: [Date of Birth]
Diagnosis: [Primary Diagnosis]
Insurance Provider: [Insurance Company]
Insurance ID: [Policy Number]

Address: [Patient Address]
Phone: [Phone Number]

Services Requested:
- [Service 1]
- [Service 2]

Urgency: [Routine/Urgent/STAT]
Estimated Episode Length: [Days]

Additional Notes:
[Any special considerations]

Best regards,
[Hospital/Facility Name]`}
                />
              </div>

              <Button onClick={sendCustomEmail} disabled={isLoading} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? "Sending..." : "Send Custom Email"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Processing Results
              </CardTitle>
              <CardDescription>Detailed results from email processing tests ({results.length} total)</CardDescription>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No test results yet. Send some test emails to see results here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <Card key={index} className={result.success ? "border-green-200" : "border-red-200"}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            {result.success ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            )}
                            <div>
                              <h4 className="font-semibold">
                                {result.success ? "Processing Successful" : "Processing Failed"}
                              </h4>
                              <p className="text-sm text-gray-600">Referral ID: {result.referralId}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            {result.processingTime}ms
                          </div>
                        </div>

                        {result.extractedData && (
                          <div className="mb-4">
                            <h5 className="font-medium mb-2 flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Extracted Patient Data
                            </h5>
                            <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                              <p>
                                <strong>Patient:</strong> {result.extractedData.patientName}
                              </p>
                              <p>
                                <strong>Diagnosis:</strong> {result.extractedData.diagnosis}
                              </p>
                              <p>
                                <strong>Insurance:</strong> {result.extractedData.insuranceProvider}
                              </p>
                              <p>
                                <strong>Services:</strong> {result.extractedData.serviceRequested?.join(", ")}
                              </p>
                              <p>
                                <strong>Urgency:</strong> {result.extractedData.urgency}
                              </p>
                              <p>
                                <strong>Location:</strong> {result.extractedData.geographicLocation?.address}
                              </p>
                            </div>
                          </div>
                        )}

                        {result.decision && (
                          <div className="mb-4">
                            <h5 className="font-medium mb-2 flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              AI Decision
                            </h5>
                            <div className="space-y-3">
                              <div className="flex items-center gap-4">
                                <Badge
                                  variant={
                                    result.decision.action === "accept"
                                      ? "default"
                                      : result.decision.action === "review"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                  className="text-sm"
                                >
                                  {result.decision.action?.toUpperCase()}
                                </Badge>
                                <span className="text-sm">
                                  Confidence: {Math.round((result.decision.confidence || 0) * 100)}%
                                </span>
                              </div>

                              <p className="text-sm text-gray-600">{result.decision.reason}</p>

                              {result.decision.decisionFactors && (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                                  <div className="text-center">
                                    <div className="font-medium">Geographic</div>
                                    <div className="text-gray-600">
                                      {Math.round(result.decision.decisionFactors.geographic.score * 100)}%
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-medium">Insurance</div>
                                    <div className="text-gray-600">
                                      {Math.round(result.decision.decisionFactors.insurance.score * 100)}%
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-medium">Clinical</div>
                                    <div className="text-gray-600">
                                      {Math.round(result.decision.decisionFactors.clinical.score * 100)}%
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-medium">Capacity</div>
                                    <div className="text-gray-600">
                                      {Math.round(result.decision.decisionFactors.capacity.score * 100)}%
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-medium">Quality</div>
                                    <div className="text-gray-600">
                                      {Math.round(result.decision.decisionFactors.quality.score * 100)}%
                                    </div>
                                  </div>
                                </div>
                              )}

                              {result.decision.recommendedNextSteps && (
                                <div>
                                  <h6 className="font-medium text-sm mb-1">Next Steps:</h6>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {result.decision.recommendedNextSteps.map((step: string, stepIndex: number) => (
                                      <li key={stepIndex} className="flex items-start gap-2">
                                        <span className="text-gray-400">•</span>
                                        {step}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            Confirmation: {result.confirmationSent ? "Sent" : "Not sent"}
                          </div>
                          {result.errors && result.errors.length > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              {result.errors.length} error(s)
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Preview Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedEmail.scenario}</CardTitle>
                  <CardDescription>{selectedEmail.subject}</CardDescription>
                </div>
                <Button variant="ghost" onClick={() => setSelectedEmail(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>From:</strong> {selectedEmail.from}
                </div>
                <div>
                  <strong>To:</strong> {selectedEmail.to}
                </div>
                <div>
                  <strong>Urgency:</strong> {selectedEmail.urgency.toUpperCase()}
                </div>
                <div>
                  <strong>Scenario:</strong> {selectedEmail.scenario}
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Email Body:</h4>
                <div className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap font-mono">{selectedEmail.body}</div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedEmail(null)}>
                  Close
                </Button>
                <Button onClick={() => sendTestEmail(selectedEmail)} disabled={isLoading}>
                  <Send className="h-4 w-4 mr-2" />
                  Send This Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
