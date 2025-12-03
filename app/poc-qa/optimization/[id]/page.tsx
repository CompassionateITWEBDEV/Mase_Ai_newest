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
    uploadType?: 'comprehensive-qa' | 'coding-review' | 'financial-optimization' | 'qapi-audit'
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    notes?: string
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
    missingElementDetails?: Array<{ element: string; category: string; severity: string; recommendation: string }>
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
        principal?: { code: string; description: string }
        primary?: { code: string; description: string }
        other?: Array<{ code: string; description: string }>
        secondary?: Array<{ code: string; description: string }>
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
    // Comprehensive 4-Section QA Analysis
    qaComprehensive?: {
      qaSummary: string
      qaMissingFields: Array<{ field: string; location: string; impact: string; recommendation: string }>
      qaScore: number
    } | null
    qaCodingReview?: {
      codingErrors: Array<{ error: string; severity: string; recommendation: string }>
      suggestedCodes: Array<{ code: string; description: string; reason: string; revenueImpact: number }>
      pdgmAssessment: string
      validatedCodes?: Array<{ code: string; description: string; validationStatus: string; issues?: string[]; recommendation?: string }>
      missingDiagnoses?: Array<{ condition: string; suggestedCode: string; codeDescription: string; medicalNecessity: string; documentationSupport: string; revenueImpact?: number }>
    } | null
    qaFinancialOptimization?: {
      currentEstimatedReimbursement: number
      optimizedReimbursement: number
      revenueDifference: number
      documentationNeededToIncreaseReimbursement: Array<{ documentation: string; impact: string; revenueImpact: number; recommendation: string }>
    } | null
    qaQAPI?: {
      qapiDeficiencies: Array<{ deficiency: string; category: string; severity: string; rootCause: string; recommendation: string }>
      rootCauses: Array<{ cause: string; category: string; impact: string }>
      correctiveActions: Array<{ action: string; priority: string; timeline: string }>
      qapiRecommendations: Array<{ category: string; recommendation: string; priority: string }>
      regulatoryDeficiencies?: Array<{ deficiency: string; regulation: string; severity: string; description: string; impact: string; recommendation: string; correctiveAction: string }>
      planOfCareReview?: {
        completeness: string
        issues: Array<{ issue: string; location: string; severity: string; recommendation: string }>
        goals?: Array<{ goal: string; status: string; issues?: string[]; recommendation?: string }>
        riskMitigation?: Array<{ risk: string; mitigationStrategy: string; status: string; recommendation?: string }>
        safetyInstructions?: Array<{ instruction: string; status: string; location: string; recommendation?: string }>
      }
      incompleteElements?: Array<{ element: string; location: string; missingInformation: string; impact: string; recommendation: string; priority: string }>
      contradictoryElements?: Array<{ elementA: string; elementB: string; contradiction: string; location: string; impact: string; recommendation: string; severity: string }>
    } | null
    safetyRisks?: Array<{ risk: string; category: string; severity: string; mitigation: string }> | null
    suggestedCodes?: Array<{ code: string; description: string; reason: string; revenueImpact: number }> | null
    finalRecommendations?: Array<{ category: string; recommendation: string; priority: string }> | null
  } | null
}

// Helper function to determine which sections to show based on QA Type
const getPOCSectionVisibility = (qaType: string) => {
  switch (qaType) {
    case 'coding-review':
      return {
        qualityScores: false, // Hide - not coding focus
        missingInformation: false, // Hide - use qaCodingReview instead
        inconsistencies: false, // Hide - use qaCodingReview instead
        medicationIssues: false, // Hide - not coding focus
        clinicalLogicGaps: false, // Hide - not coding focus
        complianceRisks: false, // Hide - not coding focus
        signatureDateProblems: false, // Hide - not coding focus
        recommendations: false, // Hide - use qaCodingReview instead
        extractedData: true, // ✅ PRIMARY FOCUS - diagnoses and codes
        pocQAAnalysis: false, // Hide - use qaCodingReview instead
        // New 4-Section QA
        qaComprehensive: false, // Hide - not comprehensive focus
        qaCodingReview: true, // ✅ PRIMARY FOCUS - coding review
        qaFinancialOptimization: false, // Hide - not financial focus
        qaQAPI: false, // Hide - not QAPI focus
        safetyRisks: false, // Hide - not coding focus
      }
    
    case 'financial-optimization':
      return {
        qualityScores: true, // Show - overall quality
        missingInformation: false, // Hide - use qaFinancialOptimization instead
        inconsistencies: false, // Hide - use qaFinancialOptimization instead
        medicationIssues: false, // Hide - not revenue focus
        clinicalLogicGaps: false, // Hide - not revenue focus
        complianceRisks: false, // Hide - not revenue focus
        signatureDateProblems: false, // Hide - not revenue focus
        recommendations: false, // Hide - use qaFinancialOptimization instead
        extractedData: true, // Show - diagnoses affect revenue
        pocQAAnalysis: false, // Hide - use qaFinancialOptimization instead
        // New 4-Section QA
        qaComprehensive: false, // Hide - not comprehensive focus
        qaCodingReview: false, // Hide - not coding focus
        qaFinancialOptimization: true, // ✅ PRIMARY FOCUS - financial optimization
        qaQAPI: false, // Hide - not QAPI focus
        safetyRisks: false, // Hide - not financial focus
      }
    
    case 'qapi-audit':
      return {
        qualityScores: true, // ✅ PRIMARY FOCUS - quality metrics
        missingInformation: false, // Hide - use qaQAPI instead
        inconsistencies: false, // Hide - use qaQAPI instead
        medicationIssues: false, // Hide - use qaQAPI instead
        clinicalLogicGaps: false, // Hide - use qaQAPI instead
        complianceRisks: false, // Hide - use qaQAPI instead
        signatureDateProblems: false, // Hide - use qaQAPI instead
        recommendations: false, // Hide - use qaQAPI instead
        extractedData: true, // Show - documentation completeness
        pocQAAnalysis: false, // Hide - use qaQAPI instead
        // New 4-Section QA
        qaComprehensive: false, // Hide - not comprehensive focus
        qaCodingReview: false, // Hide - not coding focus
        qaFinancialOptimization: false, // Hide - not financial focus
        qaQAPI: true, // ✅ PRIMARY FOCUS - QAPI audit
        safetyRisks: true, // Show - safety is part of QAPI
      }
    
    case 'comprehensive-qa':
    default:
      return {
        qualityScores: true, // Show everything
        missingInformation: true,
        inconsistencies: true,
        medicationIssues: true,
        clinicalLogicGaps: true,
        complianceRisks: true,
        signatureDateProblems: true,
        recommendations: true,
        extractedData: true,
        pocQAAnalysis: true,
        // New 4-Section QA - show all
        qaComprehensive: true, // ✅ PRIMARY FOCUS - comprehensive QA
        qaCodingReview: true, // Show - coding review
        qaFinancialOptimization: true, // Show - financial optimization
        qaQAPI: true, // Show - QAPI audit
        safetyRisks: true, // Show - safety risks
      }
  }
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
              {poc.uploadType && (
                <Badge className={`${
                  poc.uploadType === 'coding-review' ? 'bg-purple-500 hover:bg-purple-600' :
                  poc.uploadType === 'financial-optimization' ? 'bg-green-500 hover:bg-green-600' :
                  poc.uploadType === 'qapi-audit' ? 'bg-orange-500 hover:bg-orange-600' :
                  'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                } text-white px-4 py-2 text-base shadow-lg`}>
                  {poc.uploadType === 'coding-review' ? 'Coding Review' :
                   poc.uploadType === 'financial-optimization' ? 'Financial Optimization' :
                   poc.uploadType === 'qapi-audit' ? 'QAPI Audit' :
                   'Comprehensive QA'}
                </Badge>
              )}
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
        {analysis?.pocExtractedData && getPOCSectionVisibility(poc.uploadType || 'comprehensive-qa').extractedData && (
          <>
            {/* Patient Information - Enhanced with Extracted Data */}
            <Card className={`border-2 shadow-lg hover:shadow-xl transition-shadow ${
              poc.uploadType === 'coding-review' ? 'ring-2 ring-purple-300 ring-offset-1' : ''
            }`}>
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
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData?.patientInfo?.name || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Medical Record Number</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData?.patientInfo?.mrn || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Date of Birth</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData?.patientInfo?.dob || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">Gender</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData?.patientInfo?.gender || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-2">Address</p>
                    <p className="text-sm font-bold text-gray-900">{analysis.pocExtractedData?.patientInfo?.address || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100/50 border border-pink-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-pink-700 uppercase tracking-wide mb-2">Phone</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData?.patientInfo?.phone || "N/A"}</p>
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
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData?.orderInfo?.orderNumber || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Start of Care Date</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData?.orderInfo?.startOfCareDate || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Certification Period</p>
                    <p className="text-lg font-bold text-gray-900">
                      {analysis.pocExtractedData?.orderInfo?.certificationPeriod?.start || "N/A"} to {analysis.pocExtractedData?.orderInfo?.certificationPeriod?.end || "N/A"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200">
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Provider Number</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData?.orderInfo?.providerNumber || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200">
                    <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">Patient HI Claim No.</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData?.orderInfo?.patientHIClaimNo || "N/A"}</p>
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
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData?.physicianInfo?.name || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100/50 border border-pink-200">
                    <p className="text-xs font-semibold text-pink-700 uppercase tracking-wide mb-2">NPI Number</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData?.physicianInfo?.npi || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200">
                    <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide mb-2">Address</p>
                    <p className="text-sm font-bold text-gray-900">{analysis.pocExtractedData?.physicianInfo?.address || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Contact</p>
                    <p className="text-sm font-bold text-gray-900">
                      Phone: {analysis.pocExtractedData?.physicianInfo?.phone || "N/A"}<br />
                      Fax: {analysis.pocExtractedData?.physicianInfo?.fax || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medications */}
            {analysis.pocExtractedData?.medications?.length > 0 && (
              <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="h-10 w-10 rounded-lg bg-yellow-600 flex items-center justify-center text-white shadow-md">
                      <Pill className="h-5 w-5" />
                    </div>
                    Medications ({analysis.pocExtractedData?.medications?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {(analysis.pocExtractedData?.medications || []).map((med: any, idx: number) => (
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
              <Card className={`border-2 shadow-lg hover:shadow-xl transition-shadow ${
                poc.uploadType === 'coding-review' ? 'ring-4 ring-purple-400 ring-offset-2' : ''
              }`}>
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center text-white shadow-md">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      ICD-10 Diagnoses
                    </CardTitle>
                    {poc.uploadType === 'coding-review' && (
                      <Badge className="bg-purple-500 text-white font-bold px-3 py-1 shadow-lg animate-pulse">
                        🎯 PRIMARY FOCUS
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Principal/Primary Diagnosis */}
                    {(analysis.pocExtractedData?.diagnoses?.principal || analysis.pocExtractedData?.diagnoses?.primary) && (
                      <div className="p-4 rounded-lg bg-green-50 border-2 border-green-300">
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Principal Diagnosis</p>
                        <p className="font-bold text-gray-900 mb-1">
                          {(analysis.pocExtractedData.diagnoses.principal?.code || analysis.pocExtractedData.diagnoses.primary?.code || "N/A")} - {(analysis.pocExtractedData.diagnoses.principal?.description || analysis.pocExtractedData.diagnoses.primary?.description || "Not specified")}
                        </p>
                      </div>
                    )}
                    {/* Other/Secondary Diagnoses */}
                    {((analysis.pocExtractedData?.diagnoses?.other?.length || 0) > 0 || (analysis.pocExtractedData?.diagnoses?.secondary?.length || 0) > 0) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Other Diagnoses ({(analysis.pocExtractedData.diagnoses?.other?.length || analysis.pocExtractedData.diagnoses?.secondary?.length || 0)})</p>
                        <div className="space-y-2">
                          {(analysis.pocExtractedData.diagnoses.other || analysis.pocExtractedData.diagnoses.secondary || []).map((diag: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-lg bg-white border border-gray-200">
                              <p className="font-medium text-gray-900">
                                {diag?.code || "N/A"} - {diag?.description || "Not specified"}
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
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData?.clinicalStatus?.prognosis || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200">
                    <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wide mb-2">Mental/Cognitive Status</p>
                    <p className="text-lg font-bold text-gray-900">{analysis.pocExtractedData?.clinicalStatus?.mentalCognitiveStatus || "N/A"}</p>
                  </div>
                  {analysis.pocExtractedData?.clinicalStatus?.functionalLimitations?.length > 0 && (
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Functional Limitations</p>
                      <div className="space-y-1">
                        {analysis.pocExtractedData.clinicalStatus.functionalLimitations.map((limitation: string, idx: number) => (
                          <p key={idx} className="text-sm text-gray-800">• {limitation}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.pocExtractedData?.clinicalStatus?.safety?.length > 0 && (
                    <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                      <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">Safety Measures</p>
                      <div className="space-y-1">
                        {analysis.pocExtractedData.clinicalStatus.safety.map((safety: string, idx: number) => (
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
                  {analysis.pocExtractedData?.dmeInfo?.dmeItems?.length > 0 && (
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">DME Items</p>
                      <div className="space-y-1">
                        {analysis.pocExtractedData.dmeInfo.dmeItems.map((item: string, idx: number) => (
                          <p key={idx} className="text-sm font-medium text-gray-900">• {item}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">DME Provider</p>
                    <p className="text-sm font-bold text-gray-900 mb-1">Name: {analysis.pocExtractedData?.dmeInfo?.providerName || "N/A"}</p>
                    <p className="text-sm font-bold text-gray-900 mb-1">Phone: {analysis.pocExtractedData?.dmeInfo?.providerPhone || "N/A"}</p>
                    <p className="text-sm font-bold text-gray-900">Supplies: {analysis.pocExtractedData?.dmeInfo?.suppliesProvided || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Goals */}
            {(analysis.pocExtractedData?.goals?.patientGoals?.length > 0 || analysis.pocExtractedData?.goals?.ptGoals?.length > 0) && (
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
                    {analysis.pocExtractedData?.goals?.patientGoals?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-2">Patient's Personal Healthcare Goals</p>
                        <div className="space-y-2">
                          {analysis.pocExtractedData.goals.patientGoals.map((goal: string, idx: number) => (
                            <div key={idx} className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                              <p className="text-sm text-gray-800">• {goal}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.pocExtractedData?.goals?.ptGoals?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-2">PT Goals</p>
                        <div className="space-y-2">
                          {analysis.pocExtractedData.goals.ptGoals.map((goal: string, idx: number) => (
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
                    <p className="text-sm font-bold text-gray-900 mb-1">{analysis.pocExtractedData?.signatures?.nurseTherapistSignature || "N/A"}</p>
                    <p className="text-xs text-gray-600">Date: {analysis.pocExtractedData?.signatures?.nurseTherapistDate || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">Physician</p>
                    <p className="text-sm font-bold text-gray-900 mb-1">{analysis.pocExtractedData?.signatures?.physicianSignature || "N/A"}</p>
                    <p className="text-xs text-gray-600">Signature Date: {analysis.pocExtractedData?.signatures?.physicianSignatureDate || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">Date HHA Received Signed</p>
                    <p className="text-sm font-bold text-gray-900">{analysis.pocExtractedData?.signatures?.dateHHAReceivedSigned || "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Face-to-Face Date</p>
                    <p className="text-sm font-bold text-gray-900">{analysis.pocExtractedData?.signatures?.f2fDate || "N/A"}</p>
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
        {analysis && getPOCSectionVisibility(poc.uploadType || 'comprehensive-qa').qualityScores && (
          <Card className={`border-2 shadow-lg hover:shadow-xl transition-shadow ${
            poc.uploadType === 'qapi-audit' ? 'ring-4 ring-orange-400 ring-offset-2' : ''
          }`}>
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
        {analysis?.pocQAAnalysis && getPOCSectionVisibility(poc.uploadType || 'comprehensive-qa').pocQAAnalysis && (
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
            {(analysis.pocStructuredData?.missingInformation?.length || 0) > 0 && getPOCSectionVisibility(poc.uploadType || 'comprehensive-qa').missingInformation && (
              <Card className={`border-2 border-red-200 shadow-lg ${
                poc.uploadType === 'qapi-audit' ? 'ring-4 ring-red-400 ring-offset-2' : ''
              }`}>
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white shadow-md">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      Missing Information ({analysis.pocStructuredData.missingInformation.length})
                    </CardTitle>
                    {poc.uploadType === 'qapi-audit' && (
                      <Badge className="bg-red-500 text-white font-bold px-3 py-1.5 shadow-lg animate-pulse">
                        🎯 PRIMARY FOCUS
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base mt-2">
                    {poc.uploadType === 'qapi-audit' 
                      ? 'QAPI Audit Focus: Document all missing fields to ensure CMS compliance and prevent survey deficiencies.'
                      : 'These fields are blank or incomplete and require attention'}
                  </CardDescription>
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
            {(analysis.pocStructuredData?.inconsistencies?.length || 0) > 0 && getPOCSectionVisibility(poc.uploadType || 'comprehensive-qa').inconsistencies && (
              <Card className={`border-2 border-orange-200 shadow-lg ${
                poc.uploadType === 'qapi-audit' ? 'ring-4 ring-orange-400 ring-offset-2' : ''
              }`}>
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center text-white shadow-md">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      Inconsistencies ({analysis.pocStructuredData.inconsistencies.length})
                    </CardTitle>
                    {poc.uploadType === 'qapi-audit' && (
                      <Badge className="bg-orange-500 text-white font-bold px-3 py-1.5 shadow-lg animate-pulse">
                        🎯 PRIMARY FOCUS
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base mt-2">
                    {poc.uploadType === 'qapi-audit'
                      ? 'QAPI Audit Focus: Identify and resolve all data conflicts to ensure clinical accuracy and documentation integrity.'
                      : 'Detected conflicts and problems in documentation requiring review'}
                  </CardDescription>
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
            {(analysis.pocStructuredData?.medicationIssues?.length || 0) > 0 && getPOCSectionVisibility(poc.uploadType || 'comprehensive-qa').medicationIssues && (
              <Card className={`border-2 border-yellow-200 shadow-lg ${
                poc.uploadType === 'qapi-audit' ? 'ring-4 ring-yellow-400 ring-offset-2' : ''
              }`}>
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
            {(analysis.pocStructuredData?.clinicalLogicGaps?.length || 0) > 0 && getPOCSectionVisibility(poc.uploadType || 'comprehensive-qa').clinicalLogicGaps && (
              <Card className={`border-2 border-purple-200 shadow-lg ${
                poc.uploadType === 'qapi-audit' ? 'ring-4 ring-purple-400 ring-offset-2' : ''
              }`}>
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
            {(analysis.pocStructuredData?.complianceRisks?.length || 0) > 0 && getPOCSectionVisibility(poc.uploadType || 'comprehensive-qa').complianceRisks && (
              <Card className={`border-2 border-red-200 shadow-lg ${
                poc.uploadType === 'qapi-audit' ? 'ring-4 ring-red-400 ring-offset-2' : ''
              }`}>
                <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center text-white shadow-md">
                        <Shield className="h-5 w-5" />
                      </div>
                      Compliance Risks ({analysis.pocStructuredData.complianceRisks.length})
                    </CardTitle>
                    {poc.uploadType === 'qapi-audit' && (
                      <Badge className="bg-red-500 text-white font-bold px-3 py-1.5 shadow-lg animate-pulse">
                        🎯 PRIMARY FOCUS
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base mt-2">
                    {poc.uploadType === 'qapi-audit'
                      ? 'QAPI Audit Focus: Address compliance risks to ensure CMS Conditions of Participation compliance.'
                      : 'Regulatory compliance issues requiring attention'}
                  </CardDescription>
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
            {(analysis.pocStructuredData?.signatureDateProblems?.length || 0) > 0 && getPOCSectionVisibility(poc.uploadType || 'comprehensive-qa').signatureDateProblems && (
              <Card className={`border-2 border-orange-200 shadow-lg ${
                poc.uploadType === 'qapi-audit' ? 'ring-4 ring-orange-400 ring-offset-2' : ''
              }`}>
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white shadow-md">
                        <FileText className="h-5 w-5" />
                      </div>
                      Signature/Date Problems ({analysis.pocStructuredData.signatureDateProblems.length})
                    </CardTitle>
                    {poc.uploadType === 'qapi-audit' && (
                      <Badge className="bg-orange-500 text-white font-bold px-3 py-1.5 shadow-lg animate-pulse">
                        🎯 PRIMARY FOCUS
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base mt-2">
                    {poc.uploadType === 'qapi-audit'
                      ? 'QAPI Audit Focus: Resolve signature and date issues to ensure CMS compliance and prevent survey deficiencies.'
                      : 'Signature and date conflicts requiring attention'}
                  </CardDescription>
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

        {/* Comprehensive 4-Section QA Analysis */}
        {analysis && (
          <>
            {/* Comprehensive QA Review */}
            {analysis.qaComprehensive && getPOCSectionVisibility(poc.uploadType || 'comprehensive-qa').qaComprehensive && (
              <Card className={`border-2 border-blue-200 shadow-lg ${
                poc.uploadType === 'comprehensive-qa' ? 'ring-4 ring-blue-400 ring-offset-2' : ''
              }`}>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                        <ClipboardCheck className="h-5 w-5" />
                      </div>
                      Comprehensive QA Review
                    </CardTitle>
                    {poc.uploadType === 'comprehensive-qa' && (
                      <Badge className="bg-blue-500 text-white font-bold px-3 py-1.5 shadow-lg animate-pulse">
                        🎯 PRIMARY FOCUS
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base mt-2">
                    Overall quality assessment and missing mandatory fields
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-blue-50 border-l-4 border-blue-600">
                      <p className="font-semibold text-blue-900 mb-2">QA Summary:</p>
                      <p className="text-sm text-blue-800">{analysis.qaComprehensive.qaSummary}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">QA Score:</span>
                      <Badge variant={analysis.qaComprehensive.qaScore >= 80 ? "default" : analysis.qaComprehensive.qaScore >= 60 ? "secondary" : "destructive"}>
                        {analysis.qaComprehensive.qaScore}/100
                      </Badge>
                    </div>
                    {analysis.qaComprehensive.qaMissingFields && analysis.qaComprehensive.qaMissingFields.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">Missing Fields ({analysis.qaComprehensive.qaMissingFields.length}):</p>
                        <div className="space-y-2">
                          {analysis.qaComprehensive.qaMissingFields.map((field, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-yellow-50 border-l-4 border-yellow-600">
                              <p className="font-semibold text-yellow-900 mb-1">• {field.field}</p>
                              <p className="text-xs text-yellow-700 mb-1">Location: {field.location}</p>
                              <p className="text-xs text-yellow-700 mb-1">Impact: {field.impact}</p>
                              <p className="text-xs text-yellow-700">Recommendation: {field.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Coding Review */}
            {analysis.qaCodingReview && getPOCSectionVisibility(poc.uploadType || 'comprehensive-qa').qaCodingReview && (
              <Card className={`border-2 border-purple-200 shadow-lg ${
                poc.uploadType === 'coding-review' ? 'ring-4 ring-purple-400 ring-offset-2' : ''
              }`}>
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-md">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      Coding Review (ICD-10/PDGM)
                    </CardTitle>
                    {poc.uploadType === 'coding-review' && (
                      <Badge className="bg-purple-500 text-white font-bold px-3 py-1.5 shadow-lg animate-pulse">
                        🎯 PRIMARY FOCUS
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base mt-2">
                    ICD-10 code validation, PDGM assessment, and coding recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {analysis.qaCodingReview.codingErrors && analysis.qaCodingReview.codingErrors.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">Coding Errors ({analysis.qaCodingReview.codingErrors.length}):</p>
                        <div className="space-y-2">
                          {analysis.qaCodingReview.codingErrors.map((error, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-red-50 border-l-4 border-red-600">
                              <div className="flex items-start justify-between mb-1">
                                <p className="font-semibold text-red-900">• {error.error}</p>
                                <Badge variant={error.severity === 'critical' || error.severity === 'high' ? 'destructive' : 'secondary'}>
                                  {error.severity}
                                </Badge>
                              </div>
                              <p className="text-xs text-red-700">Recommendation: {error.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.qaCodingReview.validatedCodes && analysis.qaCodingReview.validatedCodes.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">Validated ICD-10 Codes ({analysis.qaCodingReview.validatedCodes.length}):</p>
                        <div className="space-y-2">
                          {analysis.qaCodingReview.validatedCodes.map((code: any, idx: number) => (
                            <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                              code?.validationStatus === 'valid' ? 'bg-green-50 border-green-600' :
                              code?.validationStatus === 'needs-review' ? 'bg-yellow-50 border-yellow-600' :
                              'bg-red-50 border-red-600'
                            }`}>
                              <div className="flex items-start justify-between mb-1">
                                <div>
                                  <p className="font-semibold text-gray-900">{code?.code || "N/A"} - {code?.description || "Not specified"}</p>
                                  <Badge variant={code?.validationStatus === 'valid' ? 'default' : code?.validationStatus === 'needs-review' ? 'secondary' : 'destructive'}>
                                    {code?.validationStatus || "unknown"}
                                  </Badge>
                                </div>
                              </div>
                              {code?.issues && code.issues.length > 0 && (
                                <p className="text-xs text-gray-700 mt-1">Issues: {code.issues.join(', ')}</p>
                              )}
                              {code?.recommendation && (
                                <p className="text-xs text-gray-700 mt-1">Recommendation: {code.recommendation}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.qaCodingReview.suggestedCodes && analysis.qaCodingReview.suggestedCodes.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">Optimized Code Recommendations ({analysis.qaCodingReview.suggestedCodes.length}):</p>
                        <div className="space-y-2">
                          {analysis.qaCodingReview.suggestedCodes.map((code: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-lg bg-blue-50 border-l-4 border-blue-600">
                              <p className="font-semibold text-blue-900 mb-1">{code?.code || "N/A"} - {code?.description || "Not specified"}</p>
                              <p className="text-xs text-blue-700 mb-1">Reason: {code?.reason || "See documentation"}</p>
                              <p className="text-xs text-blue-700">Revenue Impact: ${(code?.revenueImpact || 0).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.qaCodingReview.missingDiagnoses && analysis.qaCodingReview.missingDiagnoses.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">Missing Medically-Necessary Diagnoses ({analysis.qaCodingReview.missingDiagnoses.length}):</p>
                        <div className="space-y-2">
                          {analysis.qaCodingReview.missingDiagnoses.map((diag: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-lg bg-yellow-50 border-l-4 border-yellow-600">
                              <p className="font-semibold text-yellow-900 mb-1">• {diag?.condition || "Unspecified condition"}</p>
                              <p className="text-xs text-yellow-700 mb-1">Suggested Code: {diag?.suggestedCode || "N/A"} - {diag?.codeDescription || "Not specified"}</p>
                              <p className="text-xs text-yellow-700 mb-1">Medical Necessity: {diag?.medicalNecessity || "Review required"}</p>
                              <p className="text-xs text-yellow-700 mb-1">Documentation Support: {diag?.documentationSupport || "See document"}</p>
                              {diag?.revenueImpact && (
                                <p className="text-xs text-yellow-700">Revenue Impact: ${(diag.revenueImpact || 0).toLocaleString()}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.qaCodingReview.pdgmAssessment && (
                      <div className="p-4 rounded-lg bg-purple-50 border-l-4 border-purple-600">
                        <p className="font-semibold text-purple-900 mb-2">PDGM Assessment:</p>
                        <p className="text-sm text-purple-800">{analysis.qaCodingReview.pdgmAssessment}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Optimization */}
            {analysis.qaFinancialOptimization && getPOCSectionVisibility(poc.uploadType || 'comprehensive-qa').qaFinancialOptimization && (
              <Card className={`border-2 border-green-200 shadow-lg ${
                poc.uploadType === 'financial-optimization' ? 'ring-4 ring-green-400 ring-offset-2' : ''
              }`}>
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white shadow-md">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      Financial Optimization
                    </CardTitle>
                    {poc.uploadType === 'financial-optimization' && (
                      <Badge className="bg-green-500 text-white font-bold px-3 py-1.5 shadow-lg animate-pulse">
                        🎯 PRIMARY FOCUS
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base mt-2">
                    Revenue analysis and documentation optimization recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                        <p className="text-sm font-medium text-gray-600 mb-1">Current Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">${analysis.qaFinancialOptimization.currentEstimatedReimbursement.toLocaleString()}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-sm font-medium text-green-600 mb-1">Optimized Revenue</p>
                        <p className="text-2xl font-bold text-green-900">${analysis.qaFinancialOptimization.optimizedReimbursement.toLocaleString()}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-sm font-medium text-blue-600 mb-1">Potential Increase</p>
                        <p className="text-2xl font-bold text-blue-900">${analysis.qaFinancialOptimization.revenueDifference.toLocaleString()}</p>
                      </div>
                    </div>
                    {analysis.qaFinancialOptimization.documentationNeededToIncreaseReimbursement && analysis.qaFinancialOptimization.documentationNeededToIncreaseReimbursement.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">Documentation Needed to Increase Reimbursement ({analysis.qaFinancialOptimization.documentationNeededToIncreaseReimbursement.length}):</p>
                        <div className="space-y-2">
                          {analysis.qaFinancialOptimization.documentationNeededToIncreaseReimbursement.map((doc, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-yellow-50 border-l-4 border-yellow-600">
                              <p className="font-semibold text-yellow-900 mb-1">• {doc.documentation}</p>
                              <p className="text-xs text-yellow-700 mb-1">Impact: {doc.impact}</p>
                              <p className="text-xs text-yellow-700 mb-1">Revenue Impact: ${doc.revenueImpact.toLocaleString()}</p>
                              <p className="text-xs text-yellow-700">Recommendation: {doc.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* QAPI Audit */}
            {analysis.qaQAPI && getPOCSectionVisibility(poc.uploadType || 'comprehensive-qa').qaQAPI && (
              <Card className={`border-2 border-red-200 shadow-lg ${
                poc.uploadType === 'qapi-audit' ? 'ring-4 ring-red-400 ring-offset-2' : ''
              }`}>
                <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center text-white shadow-md">
                        <Shield className="h-5 w-5" />
                      </div>
                      QAPI Audit
                    </CardTitle>
                    {poc.uploadType === 'qapi-audit' && (
                      <Badge className="bg-red-500 text-white font-bold px-3 py-1.5 shadow-lg animate-pulse">
                        🎯 PRIMARY FOCUS
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base mt-2">
                    Regulatory deficiencies, plan of care review, and QAPI recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {analysis.qaQAPI.regulatoryDeficiencies && analysis.qaQAPI.regulatoryDeficiencies.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">Regulatory Deficiencies ({analysis.qaQAPI.regulatoryDeficiencies.length}):</p>
                        <div className="space-y-2">
                          {analysis.qaQAPI.regulatoryDeficiencies.map((def, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-red-50 border-l-4 border-red-600">
                              <div className="flex items-start justify-between mb-1">
                                <p className="font-semibold text-red-900">• {def.deficiency}</p>
                                <Badge variant={def.severity === 'critical' || def.severity === 'high' ? 'destructive' : 'secondary'}>
                                  {def.severity}
                                </Badge>
                              </div>
                              <p className="text-xs text-red-700 mb-1">Regulation: {def.regulation}</p>
                              <p className="text-xs text-red-700 mb-1">Description: {def.description}</p>
                              <p className="text-xs text-red-700 mb-1">Impact: {def.impact}</p>
                              <p className="text-xs text-red-700 mb-1">Recommendation: {def.recommendation}</p>
                              <p className="text-xs text-red-700">Corrective Action: {def.correctiveAction}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.qaQAPI.planOfCareReview && (
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">Plan of Care Review:</p>
                        <div className="p-4 rounded-lg bg-blue-50 border-l-4 border-blue-600">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-700">Completeness:</span>
                            <Badge variant={analysis.qaQAPI.planOfCareReview.completeness === 'complete' ? 'default' : 'destructive'}>
                              {analysis.qaQAPI.planOfCareReview.completeness}
                            </Badge>
                          </div>
                          {analysis.qaQAPI.planOfCareReview.issues && analysis.qaQAPI.planOfCareReview.issues.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700 mb-1">Issues ({analysis.qaQAPI.planOfCareReview.issues.length}):</p>
                              {analysis.qaQAPI.planOfCareReview.issues.map((issue, idx) => (
                                <div key={idx} className="p-2 rounded bg-yellow-50 mb-1">
                                  <p className="text-xs text-yellow-900">• {issue.issue} ({issue.location})</p>
                                  <p className="text-xs text-yellow-700">Recommendation: {issue.recommendation}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {analysis.qaQAPI.planOfCareReview.goals && analysis.qaQAPI.planOfCareReview.goals.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700 mb-1">Goals ({analysis.qaQAPI.planOfCareReview.goals.length}):</p>
                              {analysis.qaQAPI.planOfCareReview.goals.map((goal, idx) => (
                                <div key={idx} className="p-2 rounded bg-green-50 mb-1">
                                  <p className="text-xs text-green-900">• {goal.goal} - Status: {goal.status}</p>
                                  {goal.issues && goal.issues.length > 0 && (
                                    <p className="text-xs text-green-700">Issues: {goal.issues.join(', ')}</p>
                                  )}
                                  {goal.recommendation && (
                                    <p className="text-xs text-green-700">Recommendation: {goal.recommendation}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {analysis.qaQAPI.planOfCareReview.riskMitigation && analysis.qaQAPI.planOfCareReview.riskMitigation.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700 mb-1">Risk Mitigation ({analysis.qaQAPI.planOfCareReview.riskMitigation.length}):</p>
                              {analysis.qaQAPI.planOfCareReview.riskMitigation.map((risk, idx) => (
                                <div key={idx} className="p-2 rounded bg-purple-50 mb-1">
                                  <p className="text-xs text-purple-900">• {risk.risk} - {risk.mitigationStrategy} (Status: {risk.status})</p>
                                  {risk.recommendation && (
                                    <p className="text-xs text-purple-700">Recommendation: {risk.recommendation}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {analysis.qaQAPI.planOfCareReview.safetyInstructions && analysis.qaQAPI.planOfCareReview.safetyInstructions.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700 mb-1">Safety Instructions ({analysis.qaQAPI.planOfCareReview.safetyInstructions.length}):</p>
                              {analysis.qaQAPI.planOfCareReview.safetyInstructions.map((instruction, idx) => (
                                <div key={idx} className="p-2 rounded bg-orange-50 mb-1">
                                  <p className="text-xs text-orange-900">• {instruction.instruction} ({instruction.location}) - Status: {instruction.status}</p>
                                  {instruction.recommendation && (
                                    <p className="text-xs text-orange-700">Recommendation: {instruction.recommendation}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {analysis.qaQAPI.incompleteElements && analysis.qaQAPI.incompleteElements.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">Incomplete Elements ({analysis.qaQAPI.incompleteElements.length}):</p>
                        <div className="space-y-2">
                          {analysis.qaQAPI.incompleteElements.map((elem, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-yellow-50 border-l-4 border-yellow-600">
                              <p className="font-semibold text-yellow-900 mb-1">• {elem.element} ({elem.location})</p>
                              <p className="text-xs text-yellow-700 mb-1">Missing: {elem.missingInformation}</p>
                              <p className="text-xs text-yellow-700 mb-1">Impact: {elem.impact}</p>
                              <p className="text-xs text-yellow-700 mb-1">Recommendation: {elem.recommendation}</p>
                              <Badge variant={elem.priority === 'high' ? 'destructive' : 'secondary'}>{elem.priority}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.qaQAPI.contradictoryElements && analysis.qaQAPI.contradictoryElements.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">Contradictory Elements ({analysis.qaQAPI.contradictoryElements.length}):</p>
                        <div className="space-y-2">
                          {analysis.qaQAPI.contradictoryElements.map((contra, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-red-50 border-l-4 border-red-600">
                              <p className="font-semibold text-red-900 mb-1">• {contra.elementA} vs {contra.elementB}</p>
                              <p className="text-xs text-red-700 mb-1">Contradiction: {contra.contradiction}</p>
                              <p className="text-xs text-red-700 mb-1">Location: {contra.location}</p>
                              <p className="text-xs text-red-700 mb-1">Impact: {contra.impact}</p>
                              <p className="text-xs text-red-700 mb-1">Recommendation: {contra.recommendation}</p>
                              <Badge variant={contra.severity === 'critical' || contra.severity === 'high' ? 'destructive' : 'secondary'}>
                                {contra.severity}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.qaQAPI.qapiDeficiencies && analysis.qaQAPI.qapiDeficiencies.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">QAPI Deficiencies ({analysis.qaQAPI.qapiDeficiencies.length}):</p>
                        <div className="space-y-2">
                          {analysis.qaQAPI.qapiDeficiencies.map((def, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-red-50 border-l-4 border-red-600">
                              <p className="font-semibold text-red-900 mb-1">• {def.deficiency}</p>
                              <p className="text-xs text-red-700 mb-1">Category: {def.category}</p>
                              <p className="text-xs text-red-700 mb-1">Root Cause: {def.rootCause}</p>
                              <p className="text-xs text-red-700">Recommendation: {def.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.qaQAPI.correctiveActions && analysis.qaQAPI.correctiveActions.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-900 mb-2">Corrective Actions ({analysis.qaQAPI.correctiveActions.length}):</p>
                        <div className="space-y-2">
                          {analysis.qaQAPI.correctiveActions.map((action, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-green-50 border-l-4 border-green-600">
                              <p className="font-semibold text-green-900 mb-1">• {action.action}</p>
                              <p className="text-xs text-green-700 mb-1">Priority: {action.priority}</p>
                              <p className="text-xs text-green-700">Timeline: {action.timeline}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Safety Risks */}
            {analysis.safetyRisks && analysis.safetyRisks.length > 0 && getPOCSectionVisibility(poc.uploadType || 'comprehensive-qa').safetyRisks && (
              <Card className="border-2 border-orange-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-white shadow-md">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    Safety / Risk Analysis ({analysis.safetyRisks.length})
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Risk factors based on diagnoses and medications
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    {analysis.safetyRisks.map((risk, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                        risk.severity === 'high' ? 'bg-red-50 border-red-600' :
                        risk.severity === 'medium' ? 'bg-yellow-50 border-yellow-600' :
                        'bg-blue-50 border-blue-600'
                      }`}>
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-semibold text-gray-900">• {risk.risk}</p>
                          <Badge variant={risk.severity === 'high' ? 'destructive' : 'secondary'}>
                            {risk.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-700 mb-1">Category: {risk.category}</p>
                        <p className="text-xs text-gray-700">Mitigation: {risk.mitigation}</p>
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

