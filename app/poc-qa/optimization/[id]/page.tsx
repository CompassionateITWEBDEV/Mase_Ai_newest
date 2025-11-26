"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  AlertCircle,
  CheckCircle2,
  User,
  Calendar,
  RefreshCw,
  TrendingUp,
  ClipboardCheck,
  Info,
  Pill,
  FileCheck,
  Shield,
  Stethoscope,
  Activity
} from "lucide-react"
import { useParams } from "next/navigation"

interface POCData {
  poc: {
    id: number
    uploadId: string
    chartId: string
    patientId: string | null
    patientName: string | null
    fileName: string
    fileUrl: string
    documentDate: string
    clinicianName: string | null
    discipline: string
    status: string
    processedAt: string
    extractedText: string
  }
  analysis: {
    qualityScore: number
    complianceScore: number
    completenessScore: number
    accuracyScore: number
    confidenceScore: number
    findings: any[]
    recommendations: any[]
    missingElements: any[]
    regulatoryIssues: any[]
    documentationGaps: any[]
    analyzedAt: string
    pocQAAnalysis?: string | null
    pocStructuredData?: {
      missingInformation: Array<{ issue: string; whyItMatters: string }>
      inconsistencies: Array<{ issue: string; conflictsWith: string }>
      medicationIssues: Array<{ issue: string; problemType: string }>
      clinicalLogicGaps: Array<{ issue: string; explanation: string }>
      complianceRisks: Array<{ issue: string; reason: string }>
      signatureDateProblems: Array<{ issue: string; conflict: string }>
    } | null
    pocExtractedData?: {
      patientInfo: {
        name: string
        mrn: string
        dob: string
        gender: string
        address: string
        phone: string
      }
      orderInfo: {
        orderNumber: string
        startOfCareDate: string
        certificationPeriod: { start: string; end: string }
        providerNumber: string
        patientHIClaimNo: string
      }
      physicianInfo: {
        name: string
        npi: string
        address: string
        phone: string
        fax: string
      }
      agencyInfo: {
        name: string
        address: string
        phone: string
        fax: string
      }
      clinicalStatus: {
        prognosis: string
        mentalCognitiveStatus: string
        functionalLimitations: string[]
        safety: string[]
        advanceDirectives: string
        psychosocialStatus: string
      }
      emergencyPreparedness: {
        emergencyTriage: string
        evacuationZone: string
        additionalInfo: string
      }
      medications: Array<{
        name: string
        dosage: string
        frequency: string
        route: string
        prn: boolean
        prnRationale?: string
      }>
      diagnoses: {
        principal: { code: string; description: string }
        other: Array<{ code: string; description: string }>
      }
      dmeInfo: {
        dmeItems: string[]
        providerName: string
        providerPhone: string
        suppliesProvided: string
      }
      caregiverInfo: {
        status: string
        details: string
      }
      goals: {
        patientGoals: string[]
        ptGoals: string[]
        measurableGoals: string[]
      }
      treatmentPlan: {
        disciplines: string[]
        frequencies: string[]
        effectiveDate: string
        orders: string[]
      }
      signatures: {
        nurseTherapistSignature: string
        nurseTherapistDate: string
        physicianSignature: string
        physicianSignatureDate: string
        dateHHAReceivedSigned: string
        f2fDate: string
      }
      homeboundNarrative: string
      medicalNecessity: string
      rehabilitationPotential: string
      dischargePlan: {
        dischargeTo: string
        dischargeWhen: string
      }
    } | null
    processingTime?: {
      totalSeconds: number
      aiAnalysisSeconds: number
      startTime: string
      endTime: string
    } | null
  } | null
}

export default function POCOptimizationPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<POCData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRawJson, setShowRawJson] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/poc-qa/optimization/${id}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch Plan of Care data")
        }
        
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || "Failed to load data")
        }
        
        setData(result)
      } catch (err) {
        console.error("Error fetching Plan of Care data:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Loading Plan of Care data...</p>
          </div>
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
            {error || "Failed to load Plan of Care data"}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { poc, analysis } = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Enhanced Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <FileCheck className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">Plan of Care (485) QA Analysis</h1>
                <p className="text-blue-100 text-lg">
                  CMS Home Health Plan of Care Quality Assurance Audit
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <FileText className="h-4 w-4" />
                <span>{poc.fileName}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <Calendar className="h-4 w-4" />
                <span>
                  {poc.documentDate 
                    ? new Date(poc.documentDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : "N/A"}
                </span>
              </div>
              {analysis?.processingTime && (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <RefreshCw className="h-4 w-4" />
                  <span className="font-semibold">
                    Processing Time: {analysis.processingTime.totalSeconds.toFixed(2)}s
                    {analysis.processingTime.aiAnalysisSeconds && (
                      <span className="text-blue-200 ml-1">
                        (AI: {analysis.processingTime.aiAnalysisSeconds.toFixed(2)}s)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Processing Time Card */}
        {analysis?.processingTime && (
          <Card className="border-2 border-cyan-200 shadow-lg bg-gradient-to-br from-cyan-50 to-blue-50">
            <CardHeader className="border-b border-cyan-200">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md">
                  <RefreshCw className="h-5 w-5" />
                </div>
                Processing Time Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-xl bg-white border-2 border-cyan-200 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Processing Time</p>
                    <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 text-cyan-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-800 mb-1">
                    {analysis.processingTime.totalSeconds.toFixed(2)}s
                  </p>
                  <p className="text-xs text-gray-500">From start to completion</p>
                </div>
                <div className="p-5 rounded-xl bg-white border-2 border-blue-200 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">AI Analysis Time</p>
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileCheck className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-blue-700 mb-1">
                    {analysis.processingTime.aiAnalysisSeconds.toFixed(2)}s
                  </p>
                  <p className="text-xs text-gray-500">
                    {analysis.processingTime.totalSeconds > 0
                      ? `${Math.round((analysis.processingTime.aiAnalysisSeconds / analysis.processingTime.totalSeconds) * 100)}% of total time`
                      : "AI processing duration"}
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-indigo-100 uppercase tracking-wide">Processing Speed</p>
                    <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold mb-1">
                    {analysis.processingTime.totalSeconds > 0 && poc.extractedText
                      ? `${Math.round((poc.extractedText.length / analysis.processingTime.totalSeconds)).toLocaleString()}`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-indigo-100">Characters processed per second</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extracted Data from Plan of Care */}
        {analysis?.pocExtractedData && (
          <>
            {/* Patient Information - Enhanced with Extracted Data */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                    <User className="h-5 w-5" />
                  </div>
                  Patient Information (Extracted from POC)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Patient Name</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData.patientInfo.name}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Medical Record Number</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData.patientInfo.mrn}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Date of Birth</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData.patientInfo.dob}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">Gender</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData.patientInfo.gender}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">Address</p>
                    <p className="text-sm font-bold text-gray-900">{analysis.pocExtractedData.patientInfo.address}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100/50 border border-pink-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-pink-700 uppercase tracking-wide mb-2">Phone</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData.patientInfo.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
                    <FileText className="h-5 w-5" />
                  </div>
                  Order & Certification Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">Order Number</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData.orderInfo.orderNumber}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Start of Care Date</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData.orderInfo.startOfCareDate}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Certification Period</p>
                    <p className="text-lg font-bold text-gray-900">
                      {analysis.pocExtractedData.orderInfo.certificationPeriod.start} to {analysis.pocExtractedData.orderInfo.certificationPeriod.end}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Provider Number</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData.orderInfo.providerNumber}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200">
                    <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">Patient HI Claim No.</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData.orderInfo.patientHIClaimNo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Physician Information */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="h-10 w-10 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  Attending Physician Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Physician Name</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData.physicianInfo.name}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100/50 border border-pink-200">
                    <p className="text-xs font-semibold text-pink-700 uppercase tracking-wide mb-2">NPI Number</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData.physicianInfo.npi}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200">
                    <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide mb-2">Address</p>
                    <p className="text-sm font-bold text-gray-900">{analysis.pocExtractedData.physicianInfo.address}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Contact</p>
                    <p className="text-sm font-bold text-gray-900">
                      Phone: {analysis.pocExtractedData.physicianInfo.phone}<br />
                      Fax: {analysis.pocExtractedData.physicianInfo.fax}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medications */}
            {analysis.pocExtractedData.medications.length > 0 && (
              <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="h-10 w-10 rounded-lg bg-yellow-600 flex items-center justify-center text-white shadow-md">
                      <Pill className="h-5 w-5" />
                    </div>
                    Medications ({analysis.pocExtractedData.medications.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {analysis.pocExtractedData.medications.map((med, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-white border-2 border-yellow-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 mb-1">{med.name}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Dosage:</span>
                                <span className="ml-2 font-medium">{med.dosage}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Frequency:</span>
                                <span className="ml-2 font-medium">{med.frequency}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Route:</span>
                                <span className="ml-2 font-medium">{med.route}</span>
                              </div>
                              {med.prn && (
                                <div>
                                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                    PRN
                                  </Badge>
                                  {med.prnRationale && (
                                    <p className="text-xs text-gray-600 mt-1">{med.prnRationale}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Diagnoses */}
            {analysis.pocExtractedData.diagnoses && (
              <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center text-white shadow-md">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    ICD-10 Diagnoses
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-green-50 border-2 border-green-300">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Principal Diagnosis</p>
                      <p className="font-bold text-gray-900 mb-1">
                        {analysis.pocExtractedData.diagnoses.principal.code} - {analysis.pocExtractedData.diagnoses.principal.description}
                      </p>
                    </div>
                    {analysis.pocExtractedData.diagnoses.other.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Other Diagnoses ({analysis.pocExtractedData.diagnoses.other.length})</p>
                        <div className="space-y-2">
                          {analysis.pocExtractedData.diagnoses.other.map((diag, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-white border border-gray-200">
                              <p className="font-medium text-gray-900">
                                {diag.code} - {diag.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Clinical Status */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                    <Activity className="h-5 w-5" />
                  </div>
                  Clinical Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Prognosis</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData.clinicalStatus.prognosis}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200">
                    <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wide mb-2">Mental/Cognitive Status</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData.clinicalStatus.mentalCognitiveStatus}</p>
                  </div>
                  {analysis.pocExtractedData.clinicalStatus.functionalLimitations.length > 0 && (
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Functional Limitations</p>
                      <div className="space-y-1">
                        {analysis.pocExtractedData.clinicalStatus.functionalLimitations.map((limitation, idx) => (
                          <p key={idx} className="text-sm text-gray-800">• {limitation}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.pocExtractedData.clinicalStatus.safety.length > 0 && (
                    <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                      <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">Safety Measures</p>
                      <div className="space-y-1">
                        {analysis.pocExtractedData.clinicalStatus.safety.map((safety, idx) => (
                          <p key={idx} className="text-sm text-gray-800">• {safety}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* DME Information */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="h-10 w-10 rounded-lg bg-gray-600 flex items-center justify-center text-white shadow-md">
                    <FileText className="h-5 w-5" />
                  </div>
                  DME & Supplies Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analysis.pocExtractedData.dmeInfo.dmeItems.length > 0 && (
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">DME Items</p>
                      <div className="space-y-1">
                        {analysis.pocExtractedData.dmeInfo.dmeItems.map((item, idx) => (
                          <p key={idx} className="text-sm font-medium text-gray-900">• {item}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">DME Provider</p>
                    <p className="text-sm font-bold text-gray-900 mb-1">Name: {analysis.pocExtractedData.dmeInfo.providerName}</p>
                    <p className="text-sm font-bold text-gray-900 mb-1">Phone: {analysis.pocExtractedData.dmeInfo.providerPhone}</p>
                    <p className="text-sm font-bold text-gray-900">Supplies: {analysis.pocExtractedData.dmeInfo.suppliesProvided}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Goals */}
            {(analysis.pocExtractedData.goals.patientGoals.length > 0 || analysis.pocExtractedData.goals.ptGoals.length > 0) && (
              <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {analysis.pocExtractedData.goals.patientGoals.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-2">Patient's Personal Healthcare Goals</p>
                        <div className="space-y-2">
                          {analysis.pocExtractedData.goals.patientGoals.map((goal, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                              <p className="text-sm text-gray-800">• {goal}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.pocExtractedData.goals.ptGoals.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-2">PT Goals</p>
                        <div className="space-y-2">
                          {analysis.pocExtractedData.goals.ptGoals.map((goal, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-green-50 border border-green-200">
                              <p className="text-sm text-gray-800">• {goal}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Signatures */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="h-10 w-10 rounded-lg bg-violet-600 flex items-center justify-center text-white shadow-md">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  Signatures & Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-violet-50 border border-violet-200">
                    <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-2">Nurse/Therapist</p>
                    <p className="text-sm font-bold text-gray-900 mb-1">{analysis.pocExtractedData.signatures.nurseTherapistSignature}</p>
                    <p className="text-xs text-gray-600">Date: {analysis.pocExtractedData.signatures.nurseTherapistDate}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Physician</p>
                    <p className="text-sm font-bold text-gray-900 mb-1">{analysis.pocExtractedData.signatures.physicianSignature}</p>
                    <p className="text-xs text-gray-600">Signature Date: {analysis.pocExtractedData.signatures.physicianSignatureDate}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">Date HHA Received Signed</p>
                    <p className="text-sm font-bold text-gray-900">{analysis.pocExtractedData.signatures.dateHHAReceivedSigned}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Face-to-Face Date</p>
                    <p className="text-sm font-bold text-gray-900">{analysis.pocExtractedData.signatures.f2fDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Patient Information - Fallback if extracted data not available */}
        {!analysis?.pocExtractedData && (
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                  <User className="h-5 w-5" />
                </div>
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 hover:shadow-md transition-shadow">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Patient Name</p>
                  <p className="text-lg font-bold text-gray-900">{poc.patientName || "N/A"}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 hover:shadow-md transition-shadow">
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">MRN/Patient ID</p>
                  <p className="text-lg font-bold text-gray-900">{poc.patientId || "N/A"}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 hover:shadow-md transition-shadow">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Document Date</p>
                  <p className="text-lg font-bold text-gray-900">
                    {poc.documentDate 
                      ? new Date(poc.documentDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })
                      : "N/A"}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 hover:shadow-md transition-shadow">
                  <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">Clinician</p>
                  <p className="text-lg font-bold text-gray-900">{poc.clinicianName || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quality Scores */}
        {analysis && (
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <TrendingUp className="h-5 w-5" />
                </div>
                Quality Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: "Overall Quality", value: analysis.qualityScore, color: "blue", icon: CheckCircle2 },
                  { label: "Compliance", value: analysis.complianceScore, color: "green", icon: ClipboardCheck },
                  { label: "Completeness", value: analysis.completenessScore, color: "purple", icon: FileText },
                  { label: "Accuracy", value: analysis.accuracyScore, color: "orange", icon: AlertCircle },
                  { label: "Confidence", value: analysis.confidenceScore, color: "teal", icon: Info },
                ].map(({ label, value, color, icon: Icon }) => {
                  const colorClasses = {
                    blue: "from-blue-500 to-blue-600 bg-blue-50 border-blue-200 text-blue-700",
                    green: "from-green-500 to-green-600 bg-green-50 border-green-200 text-green-700",
                    purple: "from-purple-500 to-purple-600 bg-purple-50 border-purple-200 text-purple-700",
                    orange: "from-orange-500 to-orange-600 bg-orange-50 border-orange-200 text-orange-700",
                    teal: "from-teal-500 to-teal-600 bg-teal-50 border-teal-200 text-teal-700",
                  }
                  return (
                    <div
                      key={label}
                      className={`p-5 rounded-xl border-2 ${colorClasses[color as keyof typeof colorClasses].split(' ')[2]} ${colorClasses[color as keyof typeof colorClasses].split(' ')[3]} hover:shadow-lg transition-all transform hover:scale-105`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Icon className={`h-5 w-5 ${colorClasses[color as keyof typeof colorClasses].split(' ')[4]}`} />
                        <Badge className={`bg-${color}-100 text-${color}-700 border-${color}-300`}>
                          {value}%
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2">{label}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses].split(' ').slice(0, 2).join(' ')} transition-all duration-500`}
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan of Care QA Analysis - Full Text */}
        {analysis?.pocQAAnalysis && (
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white shadow-md">
                  <FileCheck className="h-5 w-5" />
                </div>
                Plan of Care QA Analysis
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Complete QA audit findings in CMS format
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="p-6 bg-white rounded-xl border-2 border-gray-200">
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 leading-relaxed">
                  {analysis.pocQAAnalysis}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Structured QA Findings */}
        {analysis?.pocStructuredData && (
          <>
            {/* Missing Information */}
            {analysis.pocStructuredData.missingInformation.length > 0 && (
              <Card className="border-2 border-red-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white shadow-md">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    Missing Information ({analysis.pocStructuredData.missingInformation.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {analysis.pocStructuredData.missingInformation.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-red-50 border-l-4 border-red-500">
                        <p className="font-semibold text-red-900 mb-1">• {item.issue}</p>
                        <p className="text-sm text-red-700">– {item.whyItMatters}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inconsistencies */}
            {analysis.pocStructuredData.inconsistencies.length > 0 && (
              <Card className="border-2 border-orange-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center text-white shadow-md">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    Inconsistencies ({analysis.pocStructuredData.inconsistencies.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {analysis.pocStructuredData.inconsistencies.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-orange-50 border-l-4 border-orange-500">
                        <p className="font-semibold text-orange-900 mb-1">• {item.issue}</p>
                        <p className="text-sm text-orange-700">– {item.conflictsWith}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Medication Issues */}
            {analysis.pocStructuredData.medicationIssues.length > 0 && (
              <Card className="border-2 border-yellow-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-200">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-600 to-amber-600 flex items-center justify-center text-white shadow-md">
                      <Pill className="h-5 w-5" />
                    </div>
                    Medication Issues ({analysis.pocStructuredData.medicationIssues.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {analysis.pocStructuredData.medicationIssues.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-yellow-50 border-l-4 border-yellow-500">
                        <p className="font-semibold text-yellow-900 mb-1">• {item.issue}</p>
                        <p className="text-sm text-yellow-700">– {item.problemType}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Clinical Logic Gaps */}
            {analysis.pocStructuredData.clinicalLogicGaps.length > 0 && (
              <Card className="border-2 border-purple-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                      <Info className="h-5 w-5" />
                    </div>
                    Clinical Logic Gaps ({analysis.pocStructuredData.clinicalLogicGaps.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {analysis.pocStructuredData.clinicalLogicGaps.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-purple-50 border-l-4 border-purple-500">
                        <p className="font-semibold text-purple-900 mb-1">• {item.issue}</p>
                        <p className="text-sm text-purple-700">– {item.explanation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compliance Risks */}
            {analysis.pocStructuredData.complianceRisks.length > 0 && (
              <Card className="border-2 border-red-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-200">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center text-white shadow-md">
                      <Shield className="h-5 w-5" />
                    </div>
                    Compliance Risks ({analysis.pocStructuredData.complianceRisks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {analysis.pocStructuredData.complianceRisks.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-red-50 border-l-4 border-red-600">
                        <p className="font-semibold text-red-900 mb-1">• {item.issue}</p>
                        <p className="text-sm text-red-700">– {item.reason}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Signature/Date Problems */}
            {analysis.pocStructuredData.signatureDateProblems.length > 0 && (
              <Card className="border-2 border-orange-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white shadow-md">
                      <FileText className="h-5 w-5" />
                    </div>
                    Signature/Date Problems ({analysis.pocStructuredData.signatureDateProblems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {analysis.pocStructuredData.signatureDateProblems.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-orange-50 border-l-4 border-orange-600">
                        <p className="font-semibold text-orange-900 mb-1">• {item.issue}</p>
                        <p className="text-sm text-orange-700">– {item.conflict}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Raw JSON Data Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Raw Analysis Data</span>
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showRawJson ? "Hide" : "Show"} JSON
              </button>
            </CardTitle>
          </CardHeader>
          {showRawJson && (
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

