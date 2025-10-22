"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, RefreshCw, TrendingUp, Users, DollarSign, AlertTriangle, FileText, Eye, Download } from "lucide-react"

interface OasisRecord {
  id: string
  patientName: string
  patientId: string
  assessmentType: string
  submissionDate: string
  status: string
  qualityScore?: number
  financialImpact?: number
  riskLevel?: string
  assignedTo?: string
  flags?: number
  flagCount?: number
  assignedStaff?: string
  aiAnalysis?: {
    suggestedCodes: string[]
    riskFactors: string[]
    recommendations: string[]
    confidence: number
  }
}

export default function EnhancedOasisQA() {
  const [records, setRecords] = useState<OasisRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [metrics, setMetrics] = useState({
    totalRecords: 0,
    financialImpact: 0,
    avgRiskScore: 0,
    autoCodingRate: 0,
  })

  useEffect(() => {
    fetchOasisData()
  }, [])

  const fetchOasisData = async () => {
    try {
      setLoading(true)

      // Fetch OASIS records from Axxess
      const oasisResponse = await fetch("/api/axxess/oasis")
      if (!oasisResponse.ok) {
        throw new Error("Failed to fetch OASIS data")
      }
      const oasisData = await oasisResponse.json()
      const rawRecords = Array.isArray(oasisData?.data)
        ? oasisData.data
        : Array.isArray(oasisData?.records)
          ? oasisData.records
          : []

      const normalizedRecords: OasisRecord[] = rawRecords.map((record: any) => ({
        ...record,
        assignedTo: record.assignedTo || record.assignedStaff,
        flags: record.flagCount ?? record.flags ?? 0,
      }))

      // Process each record with AI analysis
      const processedRecords = await Promise.all(
        normalizedRecords.map(async (record: OasisRecord) => {
          try {
            const aiResponse = await fetch("/api/axxess/ai-qa", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                documentType: "oasis",
                documentId: record.id,
                oasisData: record,
                patientInfo: {
                  id: record.patientId,
                  name: record.patientName,
                },
              }),
            })

            if (aiResponse.ok) {
              const aiAnalysis = await aiResponse.json()
              const analysis = aiAnalysis.analysis
              const riskScore = analysis?.riskFactors?.riskScore
              const derivedRiskLevel =
                typeof riskScore === "number"
                  ? riskScore >= 7
                    ? "High"
                    : riskScore >= 4
                      ? "Medium"
                      : "Low"
                  : record.riskLevel

              return {
                ...record,
                aiAnalysis: analysis,
                qualityScore: analysis?.overallScore ?? record.qualityScore,
                financialImpact:
                  analysis?.financialImpact?.potentialIncrease ?? record.financialImpact ?? 0,
                riskLevel: derivedRiskLevel,
                flags: analysis?.qualityFlags?.length ?? record.flags ?? 0,
              }
            }

            return record
          } catch (error) {
            console.error(`AI analysis failed for record ${record.id}:`, error)
            return record
          }
        }),
      )

      setRecords(processedRecords)

      // Calculate metrics
      const totalRecords = processedRecords.length
      const financialImpact = processedRecords.reduce((sum, r) => sum + (r.financialImpact || 0), 0)
      const avgRiskScore =
        totalRecords > 0
          ? processedRecords.reduce((sum, r) => sum + (r.aiAnalysis?.riskFactors?.riskScore || 0), 0) /
            totalRecords
          : 0
      const autoCodingRate =
        totalRecords > 0 ? (processedRecords.filter((r) => r.aiAnalysis?.autoCoding).length / totalRecords) * 100 : 0

      setMetrics({
        totalRecords,
        financialImpact,
        avgRiskScore,
        autoCodingRate,
      })
    } catch (error) {
      console.error("Error fetching OASIS data:", error)
    } finally {
      setLoading(false)
    }
  }

  const syncAxxess = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/axxess/patients/sync", {
        method: "POST",
      })

      if (response.ok) {
        await fetchOasisData()
      }
    } catch (error) {
      console.error("Sync failed:", error)
    } finally {
      setSyncing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_review":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-blue-100 text-blue-800"
      case "flagged":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enhanced OASIS Quality Assurance</h1>
            <p className="text-gray-600">AI-Powered QA with Auto-Coding, Risk Assessment & Financial Optimization</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading OASIS data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced OASIS Quality Assurance</h1>
          <p className="text-gray-600">AI-Powered QA with Auto-Coding, Risk Assessment & Financial Optimization</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            AI Processing Enabled
          </Badge>
          <Button variant="outline" size="sm" onClick={syncAxxess} disabled={syncing}>
            {syncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Axxess
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="qa-review">QA Review</TabsTrigger>
          <TabsTrigger value="financial-impact">Financial Impact</TabsTrigger>
          <TabsTrigger value="risk-assessment">Risk Assessment</TabsTrigger>
          <TabsTrigger value="auto-coding">Auto-Coding</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.totalRecords}</p>
                    <p className="text-sm text-gray-500">+12% from last month</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Financial Impact</p>
                    <p className="text-3xl font-bold text-green-600">${metrics.financialImpact.toLocaleString()}</p>
                    <p className="text-sm text-green-600">Potential monthly increase</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Risk Score</p>
                    <p className="text-3xl font-bold text-orange-600">{metrics.avgRiskScore.toFixed(1)}</p>
                    <p className="text-sm text-gray-500">Out of 10.0 scale</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Auto-Coding Rate</p>
                    <p className="text-3xl font-bold text-blue-600">{metrics.autoCodingRate.toFixed(0)}%</p>
                    <p className="text-sm text-blue-600">Successful auto-coding</p>
                  </div>
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent OASIS Submissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Recent OASIS Submissions with AI Enhancement
              </CardTitle>
              <CardDescription>Latest submissions with financial optimization and risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {records.slice(0, 10).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{record.patientName}</h3>
                        <p className="text-sm text-gray-600">
                          {record.assessmentType} • {record.assignedTo}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {record.qualityScore ? `${record.qualityScore}%` : "Processing..."}
                          </span>
                          {record.flags && record.flags > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {record.flags} flags
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {record.financialImpact ? `+$${record.financialImpact}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {record.riskLevel && (
                          <Badge className={getRiskColor(record.riskLevel)}>{record.riskLevel}</Badge>
                        )}
                        {record.aiAnalysis && <Badge className="bg-green-100 text-green-800">QA RN Review</Badge>}
                        <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qa-review">
          <Card>
            <CardHeader>
              <CardTitle>QA Review Queue</CardTitle>
              <CardDescription>Review and approve OASIS submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">QA Review interface will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial-impact">
          <Card>
            <CardHeader>
              <CardTitle>Financial Impact Analysis</CardTitle>
              <CardDescription>Track revenue optimization from AI-enhanced coding</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Financial impact dashboard will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk-assessment">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>Monitor patient risk factors and compliance issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Risk assessment dashboard will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auto-coding">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Coding Performance</CardTitle>
              <CardDescription>Monitor AI coding accuracy and suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Auto-coding dashboard will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Reporting</CardTitle>
              <CardDescription>Comprehensive analytics and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-500">Analytics dashboard will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
