"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Activity, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  DollarSign,
  User,
  Calendar,
  Stethoscope,
  RefreshCw,
  TrendingUp,
  ClipboardCheck,
  Info
} from "lucide-react"
import { useParams } from "next/navigation"

interface PTVisitData {
  ptVisit: {
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
    codingSuggestions: any[]
    revenueImpact: {
      currentRevenue: number
      optimizedRevenue: number
      increase: number
      breakdown: any[]
    }
    regulatoryIssues: any[]
    documentationGaps: any[]
    analyzedAt: string
    extractedPTData?: any
    ptOptimizations?: any
    processingTime?: {
      totalSeconds: number
      aiAnalysisSeconds: number
      startTime: string
      endTime: string
    } | null
  } | null
}

export default function PTVisitOptimizationPage() {
  const params = useParams()
  const id = params.id as string
  const [data, setData] = useState<PTVisitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRawJson, setShowRawJson] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/pt-visit-qa/optimization/${id}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch PT Visit data")
        }
        
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || "Failed to load data")
        }
        
        setData(result)
      } catch (err) {
        console.error("Error fetching PT Visit data:", err)
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
            <p className="text-muted-foreground">Loading PT Visit data...</p>
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
            {error || "Failed to load PT Visit data"}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { ptVisit, analysis } = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Enhanced Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">PT Visit Optimization Report</h1>
                <p className="text-blue-100 text-lg">
                  AI-Powered Clinical Documentation Analysis & Optimization
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <FileText className="h-4 w-4" />
                <span>{ptVisit.fileName}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <Calendar className="h-4 w-4" />
                <span>
                  {ptVisit.documentDate 
                    ? new Date(ptVisit.documentDate).toLocaleDateString('en-US', { 
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
              <CardDescription className="text-base mt-2">
                Performance metrics for document analysis and AI processing
              </CardDescription>
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
                  <p className="text-xs text-gray-500">
                    From start to completion
                  </p>
                </div>
                <div className="p-5 rounded-xl bg-white border-2 border-blue-200 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">AI Analysis Time</p>
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-blue-600" />
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
                    {analysis.processingTime.totalSeconds > 0 && ptVisit.extractedText
                      ? `${Math.round((ptVisit.extractedText.length / analysis.processingTime.totalSeconds)).toLocaleString()}`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-indigo-100">
                    Characters processed per second
                  </p>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-lg bg-white/80 border border-cyan-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium mb-1">Started:</p>
                    <p className="text-gray-800">
                      {new Date(analysis.processingTime.startTime).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium mb-1">Completed:</p>
                    <p className="text-gray-800">
                      {new Date(analysis.processingTime.endTime).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patient Information - Enhanced Card */}
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
                <p className="text-lg font-bold text-gray-900">{ptVisit.patientName || "N/A"}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">MRN/Patient ID</p>
                <p className="text-lg font-bold text-gray-900">
                  {ptVisit.patientId || 
                   (ptVisit.extractedText?.match(/MRN[:\s]*([A-Z0-9]+)/i)?.[1]) ||
                   "N/A"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Visit Date</p>
                <p className="text-lg font-bold text-gray-900">
                  {ptVisit.documentDate 
                    ? new Date(ptVisit.documentDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })
                    : "N/A"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">Clinician</p>
                <p className="text-lg font-bold text-gray-900">{ptVisit.clinicianName || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality Scores - Enhanced with Progress Bars */}
        {analysis && (
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <TrendingUp className="h-5 w-5" />
                </div>
                Quality Scores
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Comprehensive analysis metrics for documentation quality
              </CardDescription>
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

        {/* Financial Impact - Enhanced */}
        {analysis?.revenueImpact && (
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-emerald-50 to-green-50">
            <CardHeader className="border-b border-emerald-200">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center text-white shadow-md">
                  <DollarSign className="h-5 w-5" />
                </div>
                Financial Impact Analysis
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Revenue optimization opportunities identified through AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl bg-white border-2 border-gray-200 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Current Revenue</p>
                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">
                    ${analysis.revenueImpact.currentRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-white border-2 border-green-200 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">Optimized Revenue</p>
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-green-700">
                    ${analysis.revenueImpact.optimizedRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-blue-100 uppercase tracking-wide">Potential Increase</p>
                    <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">
                    +${analysis.revenueImpact.increase.toLocaleString()}
                  </p>
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-xs text-blue-100">
                      {analysis.revenueImpact.currentRevenue > 0
                        ? `${Math.round((analysis.revenueImpact.increase / analysis.revenueImpact.currentRevenue) * 100)}% increase`
                        : "New revenue opportunity"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* AI Analysis & Optimization - Extracted Data with Optimization Suggestions */}
      {analysis?.extractedPTData && (
        <>
          {/* Homebound Reasons - Enhanced */}
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                  <Info className="h-5 w-5" />
                </div>
                Homebound Reasons - Analysis & Optimization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                      <FileText className="h-4 w-4" />
                    </div>
                    <p className="font-semibold text-blue-900 text-lg">Current (Extracted)</p>
                  </div>
                  <div className="space-y-2">
                    {analysis.extractedPTData.homeboundReasons?.filter((r: any) => r.checked).map((r: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-white/60">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-800">{r.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {analysis.ptOptimizations?.homeboundReasons && (
                  <div className="p-5 rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-100/50 shadow-md">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <p className="font-semibold text-green-900 text-lg">AI Optimization Suggestions</p>
                    </div>
                    <div className="space-y-2 mb-4">
                      {analysis.ptOptimizations.homeboundReasons.suggested?.map((s: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-white/60">
                          <div className="h-4 w-4 rounded-full bg-green-600 flex items-center justify-center mt-0.5 flex-shrink-0">
                            <span className="text-white text-xs">+</span>
                          </div>
                          <p className="text-sm text-gray-800">{s}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 rounded-lg bg-white/80 border border-green-200">
                      <p className="text-xs font-semibold text-green-800 mb-1">Clinical Rationale:</p>
                      <p className="text-xs text-gray-700">{analysis.ptOptimizations.homeboundReasons.rationale}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Functional Limitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Functional Limitations - Analysis & Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-blue-50">
                  <p className="font-medium mb-2 text-blue-900">📋 Current (Extracted):</p>
                  <div className="space-y-1">
                    {analysis.extractedPTData.functionalLimitations?.filter((l: any) => l.checked).map((l: any, idx: number) => (
                      <p key={idx} className="text-sm">✓ {l.limitation}</p>
                    ))}
                  </div>
                </div>
                {analysis.ptOptimizations?.functionalLimitations && (
                  <div className="p-4 border rounded-lg bg-green-50">
                    <p className="font-medium mb-2 text-green-900">✨ AI Optimization Suggestions:</p>
                    <div className="space-y-1">
                      {analysis.ptOptimizations.functionalLimitations.suggested?.map((s: string, idx: number) => (
                        <p key={idx} className="text-sm">+ {s}</p>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Rationale:</strong> {analysis.ptOptimizations.functionalLimitations.rationale}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vital Signs */}
          {analysis.extractedPTData.vitalSigns && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Vital Signs - Extracted Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {analysis.extractedPTData.vitalSigns.sbp && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-900">SBP</p>
                      <p className="text-lg font-bold text-blue-600">{analysis.extractedPTData.vitalSigns.sbp}</p>
                    </div>
                  )}
                  {analysis.extractedPTData.vitalSigns.dbp && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-900">DBP</p>
                      <p className="text-lg font-bold text-blue-600">{analysis.extractedPTData.vitalSigns.dbp}</p>
                    </div>
                  )}
                  {analysis.extractedPTData.vitalSigns.hr && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-900">HR</p>
                      <p className="text-lg font-bold text-blue-600">{analysis.extractedPTData.vitalSigns.hr}</p>
                    </div>
                  )}
                  {analysis.extractedPTData.vitalSigns.resp && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-900">Resp</p>
                      <p className="text-lg font-bold text-blue-600">{analysis.extractedPTData.vitalSigns.resp}</p>
                    </div>
                  )}
                  {analysis.extractedPTData.vitalSigns.temp && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-900">Temp</p>
                      <p className="text-lg font-bold text-blue-600">{analysis.extractedPTData.vitalSigns.temp}</p>
                    </div>
                  )}
                  {analysis.extractedPTData.vitalSigns.o2Sat && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-900">O2 Sat</p>
                      <p className="text-lg font-bold text-blue-600">{analysis.extractedPTData.vitalSigns.o2Sat}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bed Mobility Training */}
          {analysis.extractedPTData.bedMobilityTraining && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Bed Mobility Training - Analysis & Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <p className="font-medium mb-3 text-blue-900">📋 Current (Extracted):</p>
                    <div className="space-y-2 text-sm">
                      {analysis.extractedPTData.bedMobilityTraining.rolling && (
                        <p><strong>Rolling:</strong> {analysis.extractedPTData.bedMobilityTraining.rolling.level} {analysis.extractedPTData.bedMobilityTraining.rolling.reps}</p>
                      )}
                      {analysis.extractedPTData.bedMobilityTraining.supSit && (
                        <p><strong>Sup-Sit:</strong> {analysis.extractedPTData.bedMobilityTraining.supSit.level} {analysis.extractedPTData.bedMobilityTraining.supSit.reps}</p>
                      )}
                      {analysis.extractedPTData.bedMobilityTraining.scooting && (
                        <p><strong>Scooting:</strong> {analysis.extractedPTData.bedMobilityTraining.scooting.level} {analysis.extractedPTData.bedMobilityTraining.scooting.reps}</p>
                      )}
                      {analysis.extractedPTData.bedMobilityTraining.sitToStand && (
                        <p><strong>Sit to Stand:</strong> {analysis.extractedPTData.bedMobilityTraining.sitToStand.level} {analysis.extractedPTData.bedMobilityTraining.sitToStand.reps}</p>
                      )}
                    </div>
                  </div>
                  {analysis.ptOptimizations?.bedMobility && (
                    <div className="p-4 border rounded-lg bg-green-50">
                      <p className="font-medium mb-3 text-green-900">✨ AI Optimization Suggestions:</p>
                      <div className="space-y-2 text-sm">
                        {analysis.ptOptimizations.bedMobility.suggested?.rolling && (
                          <p><strong>Rolling:</strong> {analysis.ptOptimizations.bedMobility.suggested.rolling}</p>
                        )}
                        {analysis.ptOptimizations.bedMobility.suggested?.supSit && (
                          <p><strong>Sup-Sit:</strong> {analysis.ptOptimizations.bedMobility.suggested.supSit}</p>
                        )}
                        {analysis.ptOptimizations.bedMobility.suggested?.scooting && (
                          <p><strong>Scooting:</strong> {analysis.ptOptimizations.bedMobility.suggested.scooting}</p>
                        )}
                        {analysis.ptOptimizations.bedMobility.suggested?.sitToStand && (
                          <p><strong>Sit to Stand:</strong> {analysis.ptOptimizations.bedMobility.suggested.sitToStand}</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Rationale:</strong> {analysis.ptOptimizations.bedMobility.rationale}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transfer Training */}
          {analysis.extractedPTData.transferTraining && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Transfer Training - Analysis & Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <p className="font-medium mb-3 text-blue-900">📋 Current (Extracted):</p>
                    <div className="space-y-2 text-sm">
                      {analysis.extractedPTData.transferTraining.reps && (
                        <p><strong>Reps:</strong> {analysis.extractedPTData.transferTraining.reps}</p>
                      )}
                      {analysis.extractedPTData.transferTraining.assistiveDevice && (
                        <p><strong>Assistive Device:</strong> {analysis.extractedPTData.transferTraining.assistiveDevice}</p>
                      )}
                      {analysis.extractedPTData.transferTraining.bedChair && (
                        <p><strong>Bed-Chair:</strong> {analysis.extractedPTData.transferTraining.bedChair.level}</p>
                      )}
                      {analysis.extractedPTData.transferTraining.chairToilet && (
                        <p><strong>Chair-Toilet:</strong> {analysis.extractedPTData.transferTraining.chairToilet.level}</p>
                      )}
                      {analysis.extractedPTData.transferTraining.chairCar && (
                        <p><strong>Chair-Car:</strong> {analysis.extractedPTData.transferTraining.chairCar.level}</p>
                      )}
                      {analysis.extractedPTData.transferTraining.sittingBalance && (
                        <div className="mt-2">
                          <p><strong>Sitting Balance:</strong></p>
                          <p className="pl-2">Static: {analysis.extractedPTData.transferTraining.sittingBalance.static}</p>
                          <p className="pl-2">Dynamic: {analysis.extractedPTData.transferTraining.sittingBalance.dynamic}</p>
                        </div>
                      )}
                      {analysis.extractedPTData.transferTraining.standingBalance && (
                        <div className="mt-2">
                          <p><strong>Standing Balance:</strong></p>
                          <p className="pl-2">Static: {analysis.extractedPTData.transferTraining.standingBalance.static}</p>
                          <p className="pl-2">Dynamic: {analysis.extractedPTData.transferTraining.standingBalance.dynamic}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {analysis.ptOptimizations?.transferTraining && (
                    <div className="p-4 border rounded-lg bg-green-50">
                      <p className="font-medium mb-3 text-green-900">✨ AI Optimization Suggestions:</p>
                      <div className="space-y-2 text-sm">
                        {analysis.ptOptimizations.transferTraining.suggested?.bedChair && (
                          <p><strong>Bed-Chair:</strong> {analysis.ptOptimizations.transferTraining.suggested.bedChair}</p>
                        )}
                        {analysis.ptOptimizations.transferTraining.suggested?.chairToilet && (
                          <p><strong>Chair-Toilet:</strong> {analysis.ptOptimizations.transferTraining.suggested.chairToilet}</p>
                        )}
                        {analysis.ptOptimizations.transferTraining.suggested?.chairCar && (
                          <p><strong>Chair-Car:</strong> {analysis.ptOptimizations.transferTraining.suggested.chairCar}</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Rationale:</strong> {analysis.ptOptimizations.transferTraining.rationale}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gait Training */}
          {analysis.extractedPTData.gaitTraining && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Gait Training - Analysis & Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <p className="font-medium mb-3 text-blue-900">📋 Current (Extracted):</p>
                    <div className="space-y-2 text-sm">
                      {analysis.extractedPTData.gaitTraining.distance && (
                        <p><strong>Distance:</strong> {analysis.extractedPTData.gaitTraining.distance} {analysis.extractedPTData.gaitTraining.reps}</p>
                      )}
                      {analysis.extractedPTData.gaitTraining.assistiveDevice && (
                        <p><strong>Assistive Device:</strong> {analysis.extractedPTData.gaitTraining.assistiveDevice}</p>
                      )}
                      {analysis.extractedPTData.gaitTraining.assistanceLevel && (
                        <p><strong>Assistance Level:</strong> {analysis.extractedPTData.gaitTraining.assistanceLevel}</p>
                      )}
                      {analysis.extractedPTData.gaitTraining.qualityDeviation && (
                        <div className="mt-2">
                          <p><strong>Gait Quality/Deviation:</strong></p>
                          <p className="text-xs pl-2">{analysis.extractedPTData.gaitTraining.qualityDeviation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {analysis.ptOptimizations?.gaitTraining && (
                    <div className="p-4 border rounded-lg bg-green-50">
                      <p className="font-medium mb-3 text-green-900">✨ AI Optimization Suggestions:</p>
                      <div className="space-y-2 text-sm">
                        {analysis.ptOptimizations.gaitTraining.suggested?.distance && (
                          <p><strong>Distance:</strong> {analysis.ptOptimizations.gaitTraining.suggested.distance}</p>
                        )}
                        {analysis.ptOptimizations.gaitTraining.suggested?.assistanceLevel && (
                          <p><strong>Assistance Level:</strong> {analysis.ptOptimizations.gaitTraining.suggested.assistanceLevel}</p>
                        )}
                        {analysis.ptOptimizations.gaitTraining.suggested?.progression && (
                          <p><strong>Progression Plan:</strong> {analysis.ptOptimizations.gaitTraining.suggested.progression}</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Rationale:</strong> {analysis.ptOptimizations.gaitTraining.rationale}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skilled Treatment Provided */}
          {analysis.extractedPTData.skilledTreatmentProvided && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Skilled Treatment Provided - Analysis & Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <p className="font-medium mb-2 text-blue-900">📋 Current (Extracted):</p>
                    <div className="space-y-1">
                      {analysis.extractedPTData.skilledTreatmentProvided.filter((t: any) => t.checked).map((t: any, idx: number) => (
                        <p key={idx} className="text-sm">✓ {t.treatment}</p>
                      ))}
                    </div>
                  </div>
                  {analysis.ptOptimizations?.skilledTreatment && (
                    <div className="p-4 border rounded-lg bg-green-50">
                      <p className="font-medium mb-2 text-green-900">✨ AI Optimization Suggestions:</p>
                      <div className="space-y-1">
                        {analysis.ptOptimizations.skilledTreatment.suggested?.map((s: string, idx: number) => (
                          <p key={idx} className="text-sm">+ {s}</p>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Rationale:</strong> {analysis.ptOptimizations.skilledTreatment.rationale}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documentation Improvements */}
          {analysis.ptOptimizations?.documentationImprovements && analysis.ptOptimizations.documentationImprovements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Documentation Improvements ({analysis.ptOptimizations.documentationImprovements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.ptOptimizations.documentationImprovements.map((improvement: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-blue-900">📋 Section: {improvement.section}</p>
                          <p className="text-sm text-muted-foreground mt-1">Current: {improvement.current}</p>
                        </div>
                        <div>
                          <p className="font-medium text-green-900">✨ Suggested:</p>
                          <p className="text-sm text-muted-foreground mt-1">{improvement.suggested}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Rationale:</strong> {improvement.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Diagnoses */}
      {analysis?.findings && analysis.findings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Diagnoses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.isArray(analysis.findings) && analysis.findings
                .filter((f: any) => f.category === "diagnosis" || f.issue?.toLowerCase().includes("diagnosis"))
                .map((finding: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <p className="font-medium">{finding.issue || finding.description || "Diagnosis"}</p>
                    {finding.suggestion && (
                      <p className="text-sm text-muted-foreground mt-1">{finding.suggestion}</p>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

        {/* 🔎 Missing Information Detection - Enhanced */}
        {analysis?.missingElements && analysis.missingElements.length > 0 && (
          <Card className="border-2 border-red-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white shadow-md">
                  <AlertCircle className="h-5 w-5" />
                </div>
                Missing Information Detection ({analysis.missingElements.length})
              </CardTitle>
              <CardDescription className="text-base mt-2">
                These fields are blank or incomplete and require attention
              </CardDescription>
            </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Group by section */}
              {["Header Information", "Vital Signs", "Therapeutic Exercises", "Bed Mobility", "Transfer Training", "Gait Training", "Pain Section", "Assessment", "Plan of Care", "Progress Toward Goals"].map((section) => {
                const sectionItems = analysis.missingElements.filter((item: any) => item.section === section)
                if (sectionItems.length === 0) return null
                return (
                  <div key={section} className="p-4 border rounded-lg">
                    <p className="font-semibold mb-2 text-blue-900">{section}</p>
                    <div className="space-y-2">
                      {sectionItems.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-red-600">•</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.element}</p>
                            {item.recommendation && (
                              <p className="text-xs text-muted-foreground mt-1">→ {item.recommendation}</p>
                            )}
                          </div>
                          <Badge variant={item.severity === "high" ? "destructive" : "secondary"} className="text-xs">
                            {item.severity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

        {/* ⚠️ Inconsistencies & Clinical Issues - Enhanced */}
        {analysis?.findings && analysis.findings.length > 0 && (
          <Card className="border-2 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center text-white shadow-md">
                  <AlertCircle className="h-5 w-5" />
                </div>
                Inconsistencies & Clinical Issues ({analysis.findings.length})
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Detected conflicts and problems in documentation requiring review
              </CardDescription>
            </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Group by category */}
              {["inconsistency", "clinical", "documentation", "treatment"].map((category) => {
                const categoryItems = analysis.findings.filter((f: any) => f.category === category)
                if (categoryItems.length === 0) return null
                return (
                  <div key={category} className="p-4 border rounded-lg bg-orange-50">
                    <p className="font-semibold mb-2 text-orange-900 capitalize">{category} Issues</p>
                    <div className="space-y-3">
                      {categoryItems.map((finding: any, idx: number) => (
                        <div key={idx} className="p-3 bg-white rounded border-l-4 border-orange-500">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-sm">{finding.issue || "Issue"}</p>
                            <Badge variant={finding.severity === "high" || finding.severity === "critical" ? "destructive" : "secondary"} className="text-xs">
                              {finding.severity}
                            </Badge>
                          </div>
                          {finding.location && (
                            <p className="text-xs text-muted-foreground mb-1">📍 Location: {finding.location}</p>
                          )}
                          {finding.suggestion && (
                            <div className="mt-2 p-2 bg-green-50 rounded">
                              <p className="text-xs font-medium text-green-900">💡 Suggestion:</p>
                              <p className="text-xs text-green-800">{finding.suggestion}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

        {/* 📉 Clinical Documentation Weak Points - Enhanced */}
        {analysis?.documentationGaps && analysis.documentationGaps.length > 0 && (
          <Card className="border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <TrendingUp className="h-5 w-5" />
                </div>
                Clinical Documentation Weak Points ({analysis.documentationGaps.length})
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Quality scoring gaps identified for improvement
              </CardDescription>
            </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Documentation Gaps */}
              <div className="p-4 border rounded-lg">
                <p className="font-semibold mb-3 text-purple-900">Documentation Gaps</p>
                <div className="space-y-2">
                  {analysis.documentationGaps.map((gap: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded">
                      <p className="font-medium text-sm mb-1">{gap.gap}</p>
                      <p className="text-xs text-muted-foreground mb-2">Impact: {gap.impact}</p>
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="text-xs font-medium text-blue-900">→ Recommendation:</p>
                        <p className="text-xs text-blue-800">{gap.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skilled Intervention Not Justified */}
              {analysis.findings?.some((f: any) => f.category === "treatment" && f.issue?.includes("services checked")) && (
                <div className="p-4 border rounded-lg bg-yellow-50">
                  <p className="font-semibold mb-2 text-yellow-900">Skilled Intervention Not Justified</p>
                  <p className="text-sm text-yellow-800">
                    Services checked but no evidence they were performed or linked to patient condition
                  </p>
                </div>
              )}

              {/* Home Exercise Program Insufficient */}
              {analysis.documentationGaps.some((g: any) => g.gap?.includes("HEP")) && (
                <div className="p-4 border rounded-lg bg-yellow-50">
                  <p className="font-semibold mb-2 text-yellow-900">Home Exercise Program Insufficient</p>
                  <p className="text-sm text-yellow-800">
                    HEP not detailed; simply listing AROM reps is not a full program. Missing frequency, duration, progression.
                  </p>
                </div>
              )}

              {/* Risk Factors Explanation Missing */}
              {analysis.riskFactors && analysis.riskFactors.length > 0 && (
                <div className="p-4 border rounded-lg bg-red-50">
                  <p className="font-semibold mb-2 text-red-900">No Risk Factors Explanation</p>
                  <div className="space-y-2">
                    {analysis.riskFactors.map((risk: any, idx: number) => (
                      <div key={idx} className="p-2 bg-white rounded">
                        <p className="text-sm font-medium mb-1">{risk.factor}</p>
                        <p className="text-xs text-muted-foreground mb-1">Severity: {risk.severity}</p>
                        <div className="p-2 bg-green-50 rounded">
                          <p className="text-xs font-medium text-green-900">→ Recommendation:</p>
                          <p className="text-xs text-green-800">{risk.recommendation}</p>
                        </div>
                        {risk.mitigation && (
                          <div className="p-2 bg-blue-50 rounded mt-1">
                            <p className="text-xs font-medium text-blue-900">→ Mitigation:</p>
                            <p className="text-xs text-blue-800">{risk.mitigation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {analysis?.recommendations && analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Recommendations ({analysis.recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.recommendations.map((rec: any, idx: number) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium">{rec.recommendation || rec.category}</p>
                    <Badge>{rec.priority || "medium"}</Badge>
                  </div>
                  {rec.expectedImpact && (
                    <p className="text-sm text-muted-foreground">{rec.expectedImpact}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Elements */}
      {analysis?.missingElements && analysis.missingElements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-yellow-600" />
              Missing Elements ({analysis.missingElements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.missingElements.map((element: any, idx: number) => (
                <div key={idx} className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <p className="font-medium">{element.element || element.gap}</p>
                  {element.recommendation && (
                    <p className="text-sm text-muted-foreground mt-1">{element.recommendation}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw JSON Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Complete Extracted Data (JSON)
            </div>
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showRawJson ? "Hide" : "Show"} Raw JSON
            </button>
          </CardTitle>
        </CardHeader>
        {showRawJson && (
          <CardContent>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        )}
      </Card>

      {/* File Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            File Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">File Name:</span>
              <span className="font-medium">{ptVisit.fileName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Upload ID:</span>
              <span className="font-medium font-mono text-sm">{ptVisit.uploadId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chart ID:</span>
              <span className="font-medium font-mono text-sm">{ptVisit.chartId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={ptVisit.status === "completed" ? "default" : "secondary"}>
                {ptVisit.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Processed At:</span>
              <span className="font-medium">
                {new Date(ptVisit.processedAt).toLocaleString()}
              </span>
            </div>
            {ptVisit.fileUrl && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">File URL:</span>
                <a 
                  href={ptVisit.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Original File
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

