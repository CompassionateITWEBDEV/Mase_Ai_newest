"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ClipboardCheck,
  Info,
  Code,
  Shield,
  TrendingUp,
  FileCheck,
  XCircle
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"

interface PhysicianOrderData {
  physicianOrder: {
    id: string
    upload_id: string
    file_name: string
    file_url: string
    file_size: number
    extracted_text: string
    uploaded_at: string
    chart_id?: string
    patient_name?: string
    upload_type?: 'comprehensive-qa' | 'coding-review' | 'financial-optimization' | 'qapi-audit'
    patient_info?: {
      name: string
      mrn: string
      dob: string
      physician: string
      npi: string
      orderNumber: string
      orderDate: string
    }
  }
  analysisResults: {
    presentInPdf: Array<{
      element: string
      content: string
      location?: string
    }>
    missingInformation: Array<{
      element: string
      location: string
      impact: string
      recommendation: string
      severity?: 'critical' | 'high' | 'medium' | 'low'
    }>
    qaFindings: Array<{
      finding: string
      category: string
      severity: 'critical' | 'high' | 'medium' | 'low'
      location?: string
      recommendation: string
    }>
    codingReview: Array<{
      type: 'diagnosis-codes' | 'no-codes' | 'missing-connections'
      content: string
      codes?: Array<{ code: string; description: string }>
      issues?: Array<{ issue: string; severity: string; recommendation: string }>
    }>
    financialRisks: Array<{
      risk: string
      category: 'reimbursement' | 'audit-defense' | 'medical-necessity' | 'lupa-protection'
      impact: string
      recommendation: string
      severity: 'critical' | 'high' | 'medium' | 'low'
    }>
    qapiDeficiencies: Array<{
      deficiency: string
      category: string
      regulation?: string
      severity: 'critical' | 'high' | 'medium' | 'low'
      impact: string
      recommendation: string
    }>
    optimizedOrderTemplate: string
    qualityScore?: number
    confidenceScore?: number
  }
  discrepancies: any[]
  linkedAssessment: any
}

export default function PhysicianOrderOptimizationPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [data, setData] = useState<PhysicianOrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/physician-order/optimization/${id}`)
        
        if (!response.ok) {
          const errorText = await response.text()
          let errorMessage = "Failed to fetch physician order data"
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.error || errorData.message || errorMessage
          } catch (e) {
            errorMessage = errorText || errorMessage
          }
          throw new Error(errorMessage)
        }

        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || "Failed to load data")
        }

        if (!result.data) {
          throw new Error("No data returned from server")
        }

        console.log("[PO Optimization] 📊 Received data:", {
          hasPhysicianOrder: !!result.data?.physicianOrder,
          hasAnalysisResults: !!result.data?.analysisResults,
          analysisKeys: result.data?.analysisResults ? Object.keys(result.data.analysisResults) : [],
          presentInPdf: result.data?.analysisResults?.presentInPdf?.length || 0,
          missingInformation: result.data?.analysisResults?.missingInformation?.length || 0,
          qaFindings: result.data?.analysisResults?.qaFindings?.length || 0,
          codingReview: result.data?.analysisResults?.codingReview?.length || 0,
          financialRisks: result.data?.analysisResults?.financialRisks?.length || 0,
          qapiDeficiencies: result.data?.analysisResults?.qapiDeficiencies?.length || 0,
        })

        setData(result.data)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'critical': return <Badge className="bg-red-500">Critical</Badge>
      case 'high': return <Badge className="bg-orange-500">High</Badge>
      case 'medium': return <Badge className="bg-yellow-500">Medium</Badge>
      case 'low': return <Badge className="bg-blue-500">Low</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Helper function to determine which sections to show based on QA Type
  const getSectionVisibility = (qaType?: string) => {
    switch (qaType) {
      case 'coding-review':
        return {
          presentInPdf: true, // Always show what's found
          missingInformation: true, // Always show missing info
          qaFindings: false, // Hide - not coding focus
          codingReview: true, // ✅ PRIMARY FOCUS
          financialRisks: false, // Hide - not coding focus
          qapiDeficiencies: false, // Hide - not coding focus
          optimizedOrderTemplate: true, // Show - may include coding improvements
        }
      
      case 'financial-optimization':
        return {
          presentInPdf: true, // Always show what's found
          missingInformation: true, // Always show missing info
          qaFindings: false, // Hide - not financial focus
          codingReview: true, // Show - affects reimbursement
          financialRisks: true, // ✅ PRIMARY FOCUS
          qapiDeficiencies: false, // Hide - not financial focus
          optimizedOrderTemplate: true, // Show - may include financial improvements
        }
      
      case 'qapi-audit':
        return {
          presentInPdf: true, // Always show what's found
          missingInformation: true, // ✅ PRIMARY FOCUS - compliance gaps
          qaFindings: true, // ✅ PRIMARY FOCUS - QA issues
          codingReview: false, // Hide - not QAPI focus
          financialRisks: false, // Hide - not QAPI focus
          qapiDeficiencies: true, // ✅ PRIMARY FOCUS
          optimizedOrderTemplate: true, // Show - compliance improvements
        }
      
      case 'comprehensive-qa':
      default:
        return {
          presentInPdf: true, // Show all sections
          missingInformation: true,
          qaFindings: true,
          codingReview: true,
          financialRisks: true,
          qapiDeficiencies: true,
          optimizedOrderTemplate: true,
        }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-lg">Loading physician order analysis...</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Failed to load physician order data"}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { analysisResults, physicianOrder } = data

  // Get QA type from physician order data
  const qaType = physicianOrder?.upload_type || 'comprehensive-qa'
  const visibility = getSectionVisibility(qaType)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Enhanced Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-1">Physician Order Optimization</h1>
                    <p className="text-blue-100 text-sm">{physicianOrder.file_name}</p>
                  </div>
                </div>
                
                {/* Patient Information Grid */}
                {physicianOrder.patient_info && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    {physicianOrder.patient_info.name && (
                      <div>
                        <p className="text-xs text-blue-100 uppercase mb-1">Patient</p>
                        <p className="font-semibold">{physicianOrder.patient_info.name}</p>
                      </div>
                    )}
                    {physicianOrder.patient_info.mrn && (
                      <div>
                        <p className="text-xs text-blue-100 uppercase mb-1">MRN</p>
                        <p className="font-semibold">{physicianOrder.patient_info.mrn}</p>
                      </div>
                    )}
                    {physicianOrder.patient_info.dob && (
                      <div>
                        <p className="text-xs text-blue-100 uppercase mb-1">DOB</p>
                        <p className="font-semibold">{physicianOrder.patient_info.dob}</p>
                      </div>
                    )}
                    {physicianOrder.patient_info.physician && (
                      <div>
                        <p className="text-xs text-blue-100 uppercase mb-1">Physician</p>
                        <p className="font-semibold">{physicianOrder.patient_info.physician}</p>
                      </div>
                    )}
                    {physicianOrder.patient_info.orderNumber && (
                      <div>
                        <p className="text-xs text-blue-100 uppercase mb-1">Order #</p>
                        <p className="font-semibold">{physicianOrder.patient_info.orderNumber}</p>
                      </div>
                    )}
                    {physicianOrder.patient_info.orderDate && (
                      <div>
                        <p className="text-xs text-blue-100 uppercase mb-1">Order Date</p>
                        <p className="font-semibold">{physicianOrder.patient_info.orderDate}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Quality Scores */}
              <div className="flex flex-col gap-2 ml-4">
                {analysisResults.qualityScore !== undefined && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30 text-center min-w-[120px]">
                    <p className="text-xs text-blue-100 uppercase mb-1">Quality</p>
                    <p className="text-2xl font-bold">{analysisResults.qualityScore}%</p>
                  </div>
                )}
                {analysisResults.confidenceScore !== undefined && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30 text-center min-w-[120px]">
                    <p className="text-xs text-blue-100 uppercase mb-1">Confidence</p>
                    <p className="text-2xl font-bold">{analysisResults.confidenceScore}%</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-green-700 uppercase">Present Elements</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600 mb-1">
                {analysisResults.presentInPdf?.length || 0}
              </p>
              <p className="text-xs text-green-600/70">Found in document</p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-orange-700 uppercase">Missing Information</CardTitle>
                <XCircle className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-orange-600 mb-1">
                {analysisResults.missingInformation?.length || 0}
              </p>
              <p className="text-xs text-orange-600/70">Required elements</p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-yellow-700 uppercase">QA Findings</CardTitle>
                <FileCheck className="h-5 w-5 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-yellow-600 mb-1">
                {analysisResults.qaFindings?.length || 0}
              </p>
              <p className="text-xs text-yellow-600/70">Issues identified</p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-red-700 uppercase">QAPI Deficiencies</CardTitle>
                <Shield className="h-5 w-5 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-red-600 mb-1">
                {analysisResults.qapiDeficiencies?.length || 0}
              </p>
              <p className="text-xs text-red-600/70">Compliance gaps</p>
            </CardContent>
          </Card>
        </div>


        {/* QA Type Badge */}
        <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-indigo-700 uppercase mb-1">QA Analysis Type</p>
                <Badge className={`${
                  qaType === 'coding-review' ? 'bg-purple-500 hover:bg-purple-600' :
                  qaType === 'financial-optimization' ? 'bg-green-500 hover:bg-green-600' :
                  qaType === 'qapi-audit' ? 'bg-orange-500 hover:bg-orange-600' :
                  'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                } text-white text-lg px-4 py-2 shadow-lg`}>
                  {qaType === 'comprehensive-qa' && 'Comprehensive QA'}
                  {qaType === 'coding-review' && 'Coding Review'}
                  {qaType === 'financial-optimization' && 'Financial Optimization'}
                  {qaType === 'qapi-audit' && 'QAPI Audit'}
                </Badge>
              </div>
              <div className="text-sm text-indigo-600">
                <p>Showing sections relevant to this QA type</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Present in PDF */}
        {visibility.presentInPdf && analysisResults.presentInPdf && Array.isArray(analysisResults.presentInPdf) && analysisResults.presentInPdf.length > 0 && (
          <Card className="border-2 border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    Present in PDF
                  </CardTitle>
                  <CardDescription className="text-green-600/70">
                    Elements successfully extracted from the physician order document
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisResults.presentInPdf.map((item, idx) => (
                  <div key={idx} className="border-l-4 border-green-500 bg-green-50/50 pl-4 py-3 rounded-r-lg hover:bg-green-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-green-900 mb-1">{item.element}</div>
                        <div className="text-sm text-green-700/80 mt-1 line-clamp-2">{item.content}</div>
                        {item.location && (
                          <div className="text-xs text-green-600/60 mt-2 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            {item.location}
                          </div>
                        )}
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Missing Information */}
        {visibility.missingInformation && analysisResults.missingInformation && Array.isArray(analysisResults.missingInformation) && analysisResults.missingInformation.length > 0 && (
          <Card className="border-2 border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <XCircle className="h-6 w-6 text-orange-600" />
                    Missing Information
                  </CardTitle>
                  <CardDescription className="text-orange-600/70">
                    Required elements not found in the document - action required
                  </CardDescription>
                </div>
                {qaType === 'qapi-audit' && (
                  <Badge className="bg-orange-500 text-white font-bold px-3 py-1 shadow-lg animate-pulse">
                    🎯 PRIMARY FOCUS
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {analysisResults.missingInformation.map((item, idx) => (
                  <div key={idx} className="border-l-4 border-orange-500 bg-orange-50/50 pl-4 py-4 rounded-r-lg hover:bg-orange-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-semibold text-orange-900 text-lg">{item.element}</div>
                      {getSeverityBadge(item.severity)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <span className="font-semibold text-orange-800 min-w-[80px]">Location:</span>
                        <span className="text-orange-700">{item.location}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <span className="font-semibold text-orange-800 min-w-[80px]">Impact:</span>
                        <span className="text-orange-700">{item.impact}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm bg-orange-100/50 p-2 rounded mt-2">
                        <span className="font-semibold text-orange-800 min-w-[80px]">Recommendation:</span>
                        <span className="text-orange-700">{item.recommendation}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* QA Findings */}
        {visibility.qaFindings && analysisResults.qaFindings && Array.isArray(analysisResults.qaFindings) && analysisResults.qaFindings.length > 0 && (
          <Card className="border-2 border-yellow-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-yellow-700">
                    <FileCheck className="h-6 w-6 text-yellow-600" />
                    QA Findings
                  </CardTitle>
                  <CardDescription className="text-yellow-600/70">
                    Quality assurance issues identified during review
                  </CardDescription>
                </div>
                {qaType === 'qapi-audit' && (
                  <Badge className="bg-orange-500 text-white font-bold px-3 py-1 shadow-lg animate-pulse">
                    🎯 PRIMARY FOCUS
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {analysisResults.qaFindings.map((item, idx) => (
                  <div key={idx} className="border-l-4 border-yellow-500 bg-yellow-50/50 pl-4 py-4 rounded-r-lg hover:bg-yellow-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-semibold text-yellow-900 text-lg flex-1">{item.finding}</div>
                      <div className="ml-3">{getSeverityBadge(item.severity)}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          {item.category}
                        </Badge>
                        {item.location && (
                          <span className="text-yellow-700 text-xs flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            {item.location}
                          </span>
                        )}
                      </div>
                      <div className="bg-yellow-100/50 p-2 rounded mt-2">
                        <p className="text-sm text-yellow-800">
                          <span className="font-semibold">Recommendation:</span> {item.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Coding Review */}
        {visibility.codingReview && analysisResults.codingReview && Array.isArray(analysisResults.codingReview) && analysisResults.codingReview.length > 0 && (
          <Card className="border-2 border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Code className="h-6 w-6 text-blue-600" />
                    Coding Review
                  </CardTitle>
                  <CardDescription className="text-blue-600/70">
                    ICD-10 coding analysis and validation
                  </CardDescription>
                </div>
                {qaType === 'coding-review' && (
                  <Badge className="bg-purple-500 text-white font-bold px-3 py-1 shadow-lg animate-pulse">
                    🎯 PRIMARY FOCUS
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {analysisResults.codingReview.map((item, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 bg-blue-50/50 pl-4 py-4 rounded-r-lg">
                    <div className="mb-3">
                      <Badge className="bg-blue-600 text-white mb-2">
                        {item.type.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <p className="text-sm text-blue-900 mt-2">{item.content}</p>
                    </div>
                    
                    {item.codes && item.codes.length > 0 && (
                      <div className="mt-4 bg-blue-100/50 p-3 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Codes Found:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {item.codes.map((code, codeIdx) => (
                            <div key={codeIdx} className="flex items-start gap-2 bg-white p-2 rounded border border-blue-200">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 font-mono">
                                {code.code}
                              </Badge>
                              <span className="text-sm text-blue-900 flex-1">{code.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.issues && item.issues.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Coding Issues:</p>
                        <div className="space-y-2">
                          {item.issues.map((issue, issueIdx) => (
                            <div key={issueIdx} className="bg-white p-3 rounded border border-blue-200">
                              <div className="flex items-start gap-2 mb-1">
                                {getSeverityBadge(issue.severity)}
                                <span className="text-sm text-blue-900 font-medium flex-1">{issue.issue}</span>
                              </div>
                              <p className="text-xs text-blue-700 mt-1 ml-1">{issue.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Financial Risks */}
        {visibility.financialRisks && analysisResults.financialRisks && Array.isArray(analysisResults.financialRisks) && analysisResults.financialRisks.length > 0 && (
          <Card className="border-2 border-emerald-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-emerald-700">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                    Financial Risks
                  </CardTitle>
                  <CardDescription className="text-emerald-600/70">
                    Potential financial impact of documentation gaps on reimbursement
                  </CardDescription>
                </div>
                {qaType === 'financial-optimization' && (
                  <Badge className="bg-green-500 text-white font-bold px-3 py-1 shadow-lg animate-pulse">
                    🎯 PRIMARY FOCUS
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {analysisResults.financialRisks.map((item, idx) => (
                  <div key={idx} className="border-l-4 border-emerald-500 bg-emerald-50/50 pl-4 py-4 rounded-r-lg hover:bg-emerald-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-semibold text-emerald-900 text-lg flex-1">{item.risk}</div>
                      <div className="ml-3">{getSeverityBadge(item.severity)}</div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                          {item.category.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <span className="font-semibold text-emerald-800 min-w-[80px]">Impact:</span>
                        <span className="text-emerald-700">{item.impact}</span>
                      </div>
                      <div className="bg-emerald-100/50 p-2 rounded mt-2">
                        <p className="text-sm text-emerald-800">
                          <span className="font-semibold">Recommendation:</span> {item.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* QAPI Deficiencies */}
        {visibility.qapiDeficiencies && analysisResults.qapiDeficiencies && Array.isArray(analysisResults.qapiDeficiencies) && analysisResults.qapiDeficiencies.length > 0 && (
          <Card className="border-2 border-red-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <Shield className="h-6 w-6 text-red-600" />
                    QAPI Deficiencies
                  </CardTitle>
                  <CardDescription className="text-red-600/70">
                    Compliance gaps requiring immediate corrective action
                  </CardDescription>
                </div>
                {qaType === 'qapi-audit' && (
                  <Badge className="bg-orange-500 text-white font-bold px-3 py-1 shadow-lg animate-pulse">
                    🎯 PRIMARY FOCUS
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {analysisResults.qapiDeficiencies.map((item, idx) => (
                  <div key={idx} className="border-l-4 border-red-500 bg-red-50/50 pl-4 py-4 rounded-r-lg hover:bg-red-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-semibold text-red-900 text-lg flex-1">{item.deficiency}</div>
                      <div className="ml-3">{getSeverityBadge(item.severity)}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                          {item.category}
                        </Badge>
                        {item.regulation && (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                            {item.regulation}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <span className="font-semibold text-red-800 min-w-[80px]">Impact:</span>
                        <span className="text-red-700">{item.impact}</span>
                      </div>
                      <div className="bg-red-100/50 p-3 rounded mt-2 border border-red-200">
                        <p className="text-sm text-red-800">
                          <span className="font-semibold">Corrective Action:</span> {item.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Optimized Order Template */}
        {visibility.optimizedOrderTemplate && analysisResults.optimizedOrderTemplate && (
          <Card className="border-2 border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <FileText className="h-6 w-6 text-purple-600" />
                Optimized Order Template
              </CardTitle>
              <CardDescription className="text-purple-600/70">
                Improved template structure with regulatory requirements (no fabricated clinical data)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 p-6 rounded-lg shadow-inner">
                <pre className="whitespace-pre-wrap text-sm font-mono text-purple-900 leading-relaxed">
                  {analysisResults.optimizedOrderTemplate}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Analysis Data Message */}
        {(!analysisResults.presentInPdf || analysisResults.presentInPdf.length === 0) &&
         (!analysisResults.missingInformation || analysisResults.missingInformation.length === 0) &&
         (!analysisResults.qaFindings || analysisResults.qaFindings.length === 0) &&
         (!analysisResults.codingReview || analysisResults.codingReview.length === 0) &&
         (!analysisResults.financialRisks || analysisResults.financialRisks.length === 0) &&
         (!analysisResults.qapiDeficiencies || analysisResults.qapiDeficiencies.length === 0) &&
         (!analysisResults.optimizedOrderTemplate) && (
          <Card className="border-2 border-blue-200">
            <CardContent className="pt-6">
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-5 w-5 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <p className="font-semibold mb-2">No analysis data found</p>
                  <p className="text-sm">
                    The physician order may still be processing, or the analysis may not have been stored correctly.
                    Please check the server logs for more information or try refreshing the page.
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

