"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  FileText,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Send,
  Download,
  RefreshCw,
  Building2,
  Receipt,
  FileCheck,
  Zap,
  Eye,
  Settings,
} from "lucide-react"
import Link from "next/link"

interface BillingRecord {
  id: string
  patientId: string
  patientName: string
  axxessId?: string
  episodeStartDate: string
  episodeEndDate?: string
  status: "draft" | "ready_for_review" | "compliance_check" | "ready_to_submit" | "submitted" | "paid" | "denied"
  totalCharges: number
  expectedReimbursement: number
  actualReimbursement?: number
  insuranceType: string
  claimNumber?: string
  ub04Generated: boolean
  complianceScore: number
  lastUpdated: string
  submissionDate?: string
  paymentDate?: string
  denialReason?: string
  visitCount: number
  serviceLines: ServiceLine[]
  complianceIssues: ComplianceIssue[]
}

interface ServiceLine {
  id: string
  serviceDate: string
  serviceCode: string
  description: string
  units: number
  unitCharge: number
  totalCharge: number
  modifier?: string
  discipline: string
  nurseId: string
  nurseName: string
}

interface ComplianceIssue {
  id: string
  type: "missing_documentation" | "invalid_service_code" | "frequency_violation" | "authorization_expired"
  severity: "critical" | "high" | "medium" | "low"
  description: string
  resolution?: string
  resolvedAt?: string
}

export default function BillingAutomationPage() {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([])
  const [activeTab, setActiveTab] = useState("ready-to-bill")
  const [isLoading, setIsLoading] = useState(true)
  const [autoSubmissionEnabled, setAutoSubmissionEnabled] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null)

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const mockBillingRecords: BillingRecord[] = [
      {
        id: "BILL-001",
        patientId: "PT-2024-001",
        patientName: "Margaret Anderson",
        axxessId: "AX-12345",
        episodeStartDate: "2024-06-15",
        episodeEndDate: "2024-07-10",
        status: "ready_to_submit",
        totalCharges: 8450.0,
        expectedReimbursement: 7605.0,
        insuranceType: "Medicare",
        ub04Generated: true,
        complianceScore: 98,
        lastUpdated: "2024-07-10T14:30:00Z",
        visitCount: 16,
        serviceLines: [
          {
            id: "SL-001",
            serviceDate: "2024-06-15",
            serviceCode: "G0151",
            description: "Services of physical therapist in home health setting",
            units: 8,
            unitCharge: 150.0,
            totalCharge: 1200.0,
            discipline: "PT",
            nurseId: "RN-001",
            nurseName: "Sarah Johnson",
          },
          {
            id: "SL-002",
            serviceDate: "2024-06-15",
            serviceCode: "G0154",
            description: "Direct skilled nursing services of a registered nurse",
            units: 8,
            unitCharge: 125.0,
            totalCharge: 1000.0,
            discipline: "RN",
            nurseId: "RN-002",
            nurseName: "Michael Davis",
          },
        ],
        complianceIssues: [],
      },
      {
        id: "BILL-002",
        patientId: "PT-2024-002",
        patientName: "Robert Thompson",
        axxessId: "AX-12346",
        episodeStartDate: "2024-06-20",
        episodeEndDate: "2024-07-08",
        status: "compliance_check",
        totalCharges: 6750.0,
        expectedReimbursement: 6075.0,
        insuranceType: "Blue Cross",
        ub04Generated: false,
        complianceScore: 85,
        lastUpdated: "2024-07-10T12:15:00Z",
        visitCount: 12,
        serviceLines: [],
        complianceIssues: [
          {
            id: "CI-001",
            type: "missing_documentation",
            severity: "medium",
            description: "Missing physician signature on Plan of Care",
          },
          {
            id: "CI-002",
            type: "frequency_violation",
            severity: "low",
            description: "PT visits exceed recommended frequency for diagnosis",
          },
        ],
      },
      {
        id: "BILL-003",
        patientId: "PT-2024-003",
        patientName: "Dorothy Williams",
        axxessId: "AX-12347",
        episodeStartDate: "2024-05-15",
        episodeEndDate: "2024-06-30",
        status: "submitted",
        totalCharges: 12500.0,
        expectedReimbursement: 11250.0,
        actualReimbursement: 10800.0,
        insuranceType: "Medicaid",
        claimNumber: "CLM-789456",
        ub04Generated: true,
        complianceScore: 95,
        lastUpdated: "2024-07-05T09:20:00Z",
        submissionDate: "2024-07-01T10:00:00Z",
        visitCount: 20,
        serviceLines: [],
        complianceIssues: [],
      },
    ]

    setBillingRecords(mockBillingRecords)
    setIsLoading(false)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready_to_submit":
        return "bg-green-100 text-green-800"
      case "compliance_check":
        return "bg-yellow-100 text-yellow-800"
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "paid":
        return "bg-emerald-100 text-emerald-800"
      case "denied":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getComplianceColor = (score: number) => {
    if (score >= 95) return "text-green-600"
    if (score >= 85) return "text-yellow-600"
    return "text-red-600"
  }

  const generateUB04 = async (recordId: string) => {
    try {
      const response = await fetch("/api/billing/generate-ub04", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingRecordId: recordId }),
      })

      if (response.ok) {
        setBillingRecords((prev) =>
          prev.map((record) => (record.id === recordId ? { ...record, ub04Generated: true } : record)),
        )
        alert("UB-04 form generated successfully!")
      }
    } catch (error) {
      console.error("Failed to generate UB-04:", error)
    }
  }

  const submitToClearingHouse = async (recordId: string) => {
    try {
      const response = await fetch("/api/billing/submit-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingRecordId: recordId }),
      })

      if (response.ok) {
        const result = await response.json()
        setBillingRecords((prev) =>
          prev.map((record) =>
            record.id === recordId
              ? {
                  ...record,
                  status: "submitted",
                  claimNumber: result.claimNumber,
                  submissionDate: new Date().toISOString(),
                }
              : record,
          ),
        )
        alert(`Claim submitted successfully! Claim #: ${result.claimNumber}`)
      }
    } catch (error) {
      console.error("Failed to submit claim:", error)
    }
  }

  const runComplianceCheck = async (recordId: string) => {
    try {
      const response = await fetch("/api/billing/compliance-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingRecordId: recordId }),
      })

      if (response.ok) {
        const result = await response.json()
        setBillingRecords((prev) =>
          prev.map((record) =>
            record.id === recordId
              ? {
                  ...record,
                  complianceScore: result.score,
                  complianceIssues: result.issues,
                  status: result.score >= 90 ? "ready_to_submit" : "compliance_check",
                }
              : record,
          ),
        )
      }
    } catch (error) {
      console.error("Failed to run compliance check:", error)
    }
  }

  const syncWithAxxess = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/axxess/billing-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeVisitData: true, includeBillingData: true }),
      })

      if (response.ok) {
        const result = await response.json()
        // Update billing records with Axxess data
        setBillingRecords((prev) => [...result.billingRecords, ...prev])
        alert(`Synced ${result.billingRecords.length} billing records from Axxess`)
      }
    } catch (error) {
      console.error("Failed to sync with Axxess:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRecords = billingRecords.filter((record) => {
    const matchesSearch =
      record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.axxessId?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTab = (() => {
      switch (activeTab) {
        case "ready-to-bill":
          return record.status === "ready_to_submit"
        case "compliance":
          return record.status === "compliance_check" || record.complianceScore < 90
        case "submitted":
          return record.status === "submitted"
        case "paid":
          return record.status === "paid"
        case "denied":
          return record.status === "denied"
        default:
          return true
      }
    })()

    return matchesSearch && matchesTab
  })

  const stats = {
    readyToBill: billingRecords.filter((r) => r.status === "ready_to_submit").length,
    needsCompliance: billingRecords.filter((r) => r.status === "compliance_check").length,
    submitted: billingRecords.filter((r) => r.status === "submitted").length,
    totalValue: billingRecords.reduce((sum, r) => sum + r.totalCharges, 0),
    expectedReimbursement: billingRecords.reduce((sum, r) => sum + r.expectedReimbursement, 0),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/billing-center">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Billing Center
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Automated Billing & Claims</h1>
              <p className="text-gray-600">
                Automated UB-04 generation, compliance checking, and clearing house submission
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <Building2 className="h-3 w-3 mr-1" />
              Axxess Integrated
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <Zap className="h-3 w-3 mr-1" />
              Auto-Submit: {autoSubmissionEnabled ? "ON" : "OFF"}
            </Badge>
            <Button onClick={syncWithAxxess} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Sync Axxess
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ready to Bill</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.readyToBill}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Needs Compliance</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.needsCompliance}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Send className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Submitted</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.submitted}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Charges</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Receipt className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Expected Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.expectedReimbursement.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by patient name or Axxess ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configure Auto-Billing
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="ready-to-bill">Ready to Bill ({stats.readyToBill})</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Check ({stats.needsCompliance})</TabsTrigger>
            <TabsTrigger value="submitted">Submitted ({stats.submitted})</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="denied">Denied</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredRecords.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        {record.patientName}
                        {record.axxessId && (
                          <Badge variant="outline" className="ml-2">
                            {record.axxessId}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Episode: {record.episodeStartDate} - {record.episodeEndDate || "Ongoing"} •{record.visitCount}{" "}
                        visits • {record.insuranceType}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(record.status)}>
                        {record.status.replace("_", " ").toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={getComplianceColor(record.complianceScore)}>
                        {record.complianceScore}% Compliant
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Financial Summary</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Charges:</span>
                          <span className="font-medium">${record.totalCharges.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Expected:</span>
                          <span className="font-medium">${record.expectedReimbursement.toLocaleString()}</span>
                        </div>
                        {record.actualReimbursement && (
                          <div className="flex justify-between">
                            <span className="text-sm">Actual:</span>
                            <span className="font-medium text-green-600">
                              ${record.actualReimbursement.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Compliance Status</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Score:</span>
                          <span className={`font-medium ${getComplianceColor(record.complianceScore)}`}>
                            {record.complianceScore}%
                          </span>
                        </div>
                        <Progress value={record.complianceScore} className="h-2" />
                        {record.complianceIssues.length > 0 && (
                          <p className="text-xs text-red-600">{record.complianceIssues.length} issue(s) to resolve</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Billing Status</p>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">UB-04: {record.ub04Generated ? "Generated" : "Pending"}</span>
                          {record.ub04Generated && <CheckCircle className="h-4 w-4 text-green-600" />}
                        </div>
                        {record.claimNumber && (
                          <div className="flex items-center space-x-2">
                            <Receipt className="h-4 w-4" />
                            <span className="text-sm">Claim: {record.claimNumber}</span>
                          </div>
                        )}
                        {record.submissionDate && (
                          <p className="text-xs text-gray-500">
                            Submitted: {new Date(record.submissionDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Compliance Issues */}
                  {record.complianceIssues.length > 0 && (
                    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">Compliance Issues</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1 text-yellow-700">
                          {record.complianceIssues.map((issue) => (
                            <li key={issue.id} className="text-sm">
                              <span className="font-medium">{issue.severity.toUpperCase()}:</span> {issue.description}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedRecord(record)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>

                    {record.status === "compliance_check" && (
                      <Button size="sm" onClick={() => runComplianceCheck(record.id)}>
                        <FileCheck className="h-4 w-4 mr-2" />
                        Re-check Compliance
                      </Button>
                    )}

                    {!record.ub04Generated && record.complianceScore >= 90 && (
                      <Button size="sm" onClick={() => generateUB04(record.id)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate UB-04
                      </Button>
                    )}

                    {record.status === "ready_to_submit" && record.ub04Generated && (
                      <Button size="sm" onClick={() => submitToClearingHouse(record.id)}>
                        <Send className="h-4 w-4 mr-2" />
                        Submit to Clearing House
                      </Button>
                    )}

                    {record.ub04Generated && (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download UB-04
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredRecords.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-4" />
                <p>No billing records found for this category.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
