"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useDropzone } from "react-dropzone"
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  X,
  Eye,
  FileCheck,
  ClipboardList,
  Stethoscope,
  Activity,
  TrendingUp,
  Target,
  Shield,
  BarChart3,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type DocumentType = "oasis" | "poc" | "physician-order" | "rn-note" | "pt-note" | "ot-note" | "evaluation"

interface UploadedFile {
  file: File
  id: string
  progress: number
  status: "uploading" | "processing" | "completed" | "error"
  type: DocumentType
  chartId?: string
  analysis?: any
}

export default function OasisUpload() {
  const oasisDropzone = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, "oasis"),
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxSize: 10 * 1024 * 1024,
  })

  const pocDropzone = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, "poc"),
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxSize: 10 * 1024 * 1024,
  })

  const physicianOrderDropzone = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, "physician-order"),
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxSize: 10 * 1024 * 1024,
  })

  const rnNoteDropzone = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, "rn-note"),
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxSize: 10 * 1024 * 1024,
  })

  const ptNoteDropzone = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, "pt-note"),
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxSize: 10 * 1024 * 1024,
  })

  const otNoteDropzone = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, "ot-note"),
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxSize: 10 * 1024 * 1024,
  })

  const evaluationDropzone = useDropzone({
    onDrop: (acceptedFiles) => onDrop(acceptedFiles, "evaluation"),
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxSize: 10 * 1024 * 1024,
  })

  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploadType, setUploadType] = useState("comprehensive-qa")
  const [priority, setPriority] = useState("medium")
  const [patientId, setPatientId] = useState("")
  const [notes, setNotes] = useState("")
  const [chartId, setChartId] = useState<string>(`chart-${Date.now()}`)
  const [qapiReportOpen, setQapiReportOpen] = useState(false)
  const [qapiReportData, setQapiReportData] = useState<any>(null)
  const [qapiReportLoading, setQapiReportLoading] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[], fileType: DocumentType) => {
      const timestamp = Date.now()
      const newFiles = acceptedFiles.map((file, index) => ({
        file,
        id: `${timestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        progress: 0,
        status: "uploading" as const,
        type: fileType,
        chartId,
      }))

      setFiles((prev) => [...prev, ...newFiles])

      newFiles.forEach((uploadFile) => {
        simulateUpload(uploadFile)
      })
    },
    [uploadType, priority, patientId, notes, chartId],
  )

  const simulateUpload = async (uploadFile: UploadedFile) => {
    try {
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f)))
      }

      setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "processing" } : f)))

      await processFile(uploadFile)
    } catch (error) {
      console.error("Upload error:", error)
      setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "error" } : f)))
    }
  }

  const processFile = async (uploadFile: UploadedFile) => {
    try {
      // Use chartId from the file object (set during onDrop) or fallback to state
      const fileChartId = uploadFile.chartId || chartId
      console.log(`[Upload] Processing ${uploadFile.type} with chartId:`, fileChartId)
      
      const formData = new FormData()
      formData.append("file", uploadFile.file)
      formData.append("uploadId", uploadFile.id)
      formData.append("uploadType", uploadType)
      formData.append("priority", priority)
      formData.append("fileType", uploadFile.type)
      formData.append("chartId", fileChartId)
      if (patientId) formData.append("patientId", patientId)
      if (notes) formData.append("notes", notes)

      const response = await fetch("/api/oasis-upload/process", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        let errorData: any = {}
        let errorText = ""
        
        try {
          errorText = await response.text()
          console.error("Raw error response:", errorText)
          
          if (errorText) {
            errorData = JSON.parse(errorText)
          }
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError)
          errorData = { error: "Server error", details: errorText || `HTTP ${response.status}` }
        }
        
        console.error("Server error response:", errorData)
        
        const errorMsg = errorData.details 
          ? `${errorData.error}: ${errorData.details}` 
          : errorData.error || `Server error (${response.status}). Check server console for details.`
        throw new Error(errorMsg)
      }

      const result = await response.json()

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? {
                ...f,
                status: "completed",
                analysis: result.analysis,
              }
            : f,
        ),
      )

      toast({
        title: "Processing Complete",
        description: result.message,
      })
    } catch (error) {
      console.error("Processing error:", error)
      setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "error" } : f)))

      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      })
    }
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const fetchQAPIReport = async () => {
    try {
      setQapiReportLoading(true)
      setQapiReportOpen(true)
      
      const response = await fetch(`/api/oasis-qa/qapi-report/${chartId}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch QAPI report")
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || "Failed to generate QAPI report")
      }
      
      setQapiReportData(result)
    } catch (error) {
      console.error("Error fetching QAPI report:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate QAPI report",
        variant: "destructive",
      })
    } finally {
      setQapiReportLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploading":
        return <Upload className="h-4 w-4 text-blue-600" />
      case "processing":
        return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getDocumentTypeLabel = (type: DocumentType) => {
    const labels: Record<DocumentType, string> = {
      oasis: "OASIS Assessment",
      poc: "Plan of Care",
      "physician-order": "Physician Order",
      "rn-note": "RN Note",
      "pt-note": "PT Visit",
      "ot-note": "OT Note",
      evaluation: "Evaluation",
    }
    return labels[type]
  }

  const renderUploadZone = (
    dropzone: ReturnType<typeof useDropzone>,
    title: string,
    description: string,
    icon: React.ReactNode,
    colorClass: string,
  ) => {
    const colorMap: Record<string, { border: string; bg: string; text: string; iconBg: string }> = {
      blue: {
        border: "border-blue-300",
        bg: "bg-blue-50",
        text: "text-blue-600",
        iconBg: "bg-blue-100",
      },
      green: {
        border: "border-green-300",
        bg: "bg-green-50",
        text: "text-green-600",
        iconBg: "bg-green-100",
      },
      purple: {
        border: "border-purple-300",
        bg: "bg-purple-50",
        text: "text-purple-600",
        iconBg: "bg-purple-100",
      },
      pink: {
        border: "border-pink-300",
        bg: "bg-pink-50",
        text: "text-pink-600",
        iconBg: "bg-pink-100",
      },
      orange: {
        border: "border-orange-300",
        bg: "bg-orange-50",
        text: "text-orange-600",
        iconBg: "bg-orange-100",
      },
      teal: {
        border: "border-teal-300",
        bg: "bg-teal-50",
        text: "text-teal-600",
        iconBg: "bg-teal-100",
      },
      indigo: {
        border: "border-indigo-300",
        bg: "bg-indigo-50",
        text: "text-indigo-600",
        iconBg: "bg-indigo-100",
      },
    }

    const colors = colorMap[colorClass] || colorMap.blue

    return (
      <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="bg-gradient-to-r from-white to-gray-50 border-b">
          <CardTitle className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${colors.iconBg} flex items-center justify-center ${colors.text}`}>
              {icon}
            </div>
            <span className="text-lg">{title}</span>
          </CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div
            {...dropzone.getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              dropzone.isDragActive
                ? `${colors.border} ${colors.bg} scale-105 shadow-lg`
                : `${colors.border} hover:${colors.bg} hover:shadow-md`
            }`}
          >
            <input {...dropzone.getInputProps()} />
            <div className={`h-16 w-16 ${colors.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 transition-transform ${dropzone.isDragActive ? "scale-110" : ""}`}>
              <Upload className={`h-8 w-8 ${colors.text}`} />
            </div>
            <p className="text-sm font-semibold mb-1">{dropzone.isDragActive ? "Drop file here" : "Click or drag to upload"}</p>
            <p className="text-xs text-muted-foreground">PDF, TXT, or Image (Max 10MB)</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const completedFiles = files.filter((f) => f.status === "completed")
  const chartFiles = files.filter((f) => f.chartId === chartId)

  const canGenerateQAPIReport =
    chartFiles.some((f) => f.type === "oasis" && f.status === "completed") &&
    chartFiles.filter((f) => f.type !== "oasis" && f.status === "completed").length >= 2

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <FileCheck className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">Clinical Documentation QA</h1>
                <p className="text-blue-100 text-lg">
                  Upload complete patient chart for comprehensive QA analysis and QAPI reporting
                </p>
              </div>
            </div>
          </div>
        </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="bg-white border-2 shadow-md p-1">
          <TabsTrigger value="upload" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
            Upload Documents
          </TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-green-600 data-[state=active]:text-white">
            Results & QAPI Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {/* Configuration */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Activity className="h-5 w-5" />
                </div>
                Configuration
              </CardTitle>
              <CardDescription className="text-base mt-2">Configure QA processing settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>QA Type</Label>
                  <Select value={uploadType} onValueChange={setUploadType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprehensive-qa">Comprehensive QA</SelectItem>
                      <SelectItem value="coding-review">Coding Review</SelectItem>
                      <SelectItem value="financial-optimization">Financial Optimization</SelectItem>
                      <SelectItem value="qapi-audit">QAPI Audit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Patient ID (Optional)</Label>
                  <Input
                    placeholder="Enter patient ID"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Chart ID</Label>
                <Input value={chartId} onChange={(e) => setChartId(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  All documents uploaded with the same Chart ID will be analyzed together
                </p>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Add processing notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Document Upload Zones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderUploadZone(
              oasisDropzone,
              "OASIS Assessment",
              "Primary assessment document",
              <FileCheck className="h-5 w-5" />,
              "blue",
            )}
            {renderUploadZone(
              pocDropzone,
              "Plan of Care (POC)",
              "Patient care plan",
              <ClipboardList className="h-5 w-5" />,
              "green",
            )}
            {renderUploadZone(
              physicianOrderDropzone,
              "Physician Order (PO)",
              "Doctor's orders",
              <Stethoscope className="h-5 w-5" />,
              "purple",
            )}
            {renderUploadZone(
              rnNoteDropzone,
              "RN Note",
              "Registered nurse documentation",
              <FileText className="h-5 w-5" />,
              "pink",
            )}
            {renderUploadZone(
              ptNoteDropzone,
              "PT Visit",
              "Physical therapy visit documentation",
              <Activity className="h-5 w-5" />,
              "orange",
            )}
            {renderUploadZone(
              otNoteDropzone,
              "OT Note",
              "Occupational therapy documentation",
              <Activity className="h-5 w-5" />,
              "teal",
            )}
            {renderUploadZone(
              evaluationDropzone,
              "Evaluation",
              "Clinical evaluation notes",
              <FileCheck className="h-5 w-5" />,
              "indigo",
            )}
          </div>

          {/* File List */}
          {chartFiles.length > 0 && (
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="h-10 w-10 rounded-lg bg-gray-600 flex items-center justify-center text-white shadow-md">
                    <FileText className="h-5 w-5" />
                  </div>
                  Uploaded Documents ({chartFiles.length})
                </CardTitle>
                <CardDescription className="text-base mt-2">Chart ID: <span className="font-mono font-semibold">{chartId}</span></CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {chartFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border-2 rounded-xl hover:shadow-md transition-all bg-white"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0">{getStatusIcon(file.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 truncate">{file.file.name}</p>
                          <Badge variant="outline" className="flex-shrink-0">{getDocumentTypeLabel(file.type)}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-muted-foreground">{(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
                          {file.status === "uploading" && (
                            <div className="flex-1 max-w-xs">
                              <Progress value={file.progress} className="h-2" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge
                        variant={file.status === "completed" ? "default" : file.status === "error" ? "destructive" : "secondary"}
                        className="capitalize"
                      >
                        {file.status}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)} className="hover:bg-red-50 hover:text-red-600">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md">
                      <FileCheck className="h-5 w-5" />
                    </div>
                    QA Results & QAPI Report
                  </CardTitle>
                  <CardDescription className="text-base mt-2">Comprehensive analysis of all uploaded documents</CardDescription>
                </div>
                {canGenerateQAPIReport && (
                  <Button
                    onClick={fetchQAPIReport}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-md"
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Generate QAPI Report
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {completedFiles.length === 0 ? (
                <div className="text-center py-16">
                  <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">No Results Yet</h3>
                  <p className="text-muted-foreground">Upload and process documents to see QA results</p>
                </div>
              ) : (
                <div className="space-y-6 p-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 shadow-md hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Documents Processed</p>
                        <div className="h-10 w-10 rounded-lg bg-blue-200 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-blue-600">{completedFiles.length}</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200 shadow-md hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Avg Quality Score</p>
                        <div className="h-10 w-10 rounded-lg bg-green-200 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-green-600">
                        {completedFiles.length > 0
                          ? Math.round(
                              completedFiles.reduce(
                                (sum, f) =>
                                  sum +
                                  (f.analysis?.qualityScore ||
                                    f.analysis?.qualityScores?.overall ||
                                    f.analysis?.quality_score ||
                                    0),
                                0,
                              ) / completedFiles.length,
                            )
                          : 0}
                        %
                      </p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200 shadow-md hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Total Issues</p>
                        <div className="h-10 w-10 rounded-lg bg-orange-200 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-orange-600">
                        {completedFiles.reduce(
                          (sum, f) => {
                            // For OASIS documents: count flagged_issues (includes converted inconsistencies) or inconsistencies (old records)
                            if (f.type === "oasis") {
                              const flaggedIssues = f.analysis?.flagged_issues || f.analysis?.flaggedIssues || []
                              const inconsistencies = f.analysis?.inconsistencies || []
                              // Always prefer flagged_issues to avoid double counting
                              const oasisIssues = Array.isArray(flaggedIssues) && flaggedIssues.length > 0 
                                ? flaggedIssues.length 
                                : (Array.isArray(inconsistencies) ? inconsistencies.length : 0)
                              return sum + oasisIssues
                            }
                            
                            // For physician orders: count missingInformation + qaFindings + qapiDeficiencies
                            if (f.type === "physician-order") {
                              // Try arrays first (from API response), then fall back to counts
                              const missingInfo = f.analysis?.missingInformationArray || 
                                                 f.analysis?.findings?.missingInformation || 
                                                 []
                              const qaFindings = f.analysis?.qaFindingsArray || 
                                               f.analysis?.findings?.qaFindings || 
                                               []
                              const qapiDeficiencies = f.analysis?.qapiDeficienciesArray || 
                                                      f.analysis?.findings?.qapiDeficiencies || 
                                                      []
                              
                              // If we have arrays, use length; otherwise use the count numbers
                              const missingCount = Array.isArray(missingInfo) ? missingInfo.length : (f.analysis?.missingInformation || 0)
                              const qaCount = Array.isArray(qaFindings) ? qaFindings.length : (f.analysis?.qaFindings || 0)
                              const qapiCount = Array.isArray(qapiDeficiencies) ? qapiDeficiencies.length : (f.analysis?.qapiDeficiencies || 0)
                              
                              return sum + missingCount + qaCount + qapiCount
                            }
                            
                            // For other clinical documents: count flaggedIssues + inconsistencies + missingElements
                            const flaggedIssues = f.analysis?.flaggedIssues || f.analysis?.findings?.flaggedIssues || []
                            const inconsistencies = f.analysis?.inconsistencies || f.analysis?.findings?.inconsistencies || []
                            const missingElements = f.analysis?.missingElements || f.analysis?.missing_elements || []
                            
                            return sum + 
                              (Array.isArray(flaggedIssues) ? flaggedIssues.length : 0) +
                              (Array.isArray(inconsistencies) ? inconsistencies.length : 0) +
                              (Array.isArray(missingElements) ? missingElements.length : 0)
                          },
                          0,
                        )}
                      </p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 shadow-md hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Revenue Impact</p>
                        <div className="h-10 w-10 rounded-lg bg-purple-200 flex items-center justify-center">
                          <Activity className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-purple-600">
                        $
                        {completedFiles
                          .reduce((sum, f) => {
                            // Revenue impact is ONLY applicable for OASIS documents
                            // POC, PT Visit, OT, RN notes don't have revenue impact
                            if (f.type !== "oasis") {
                              return sum + 0
                            }
                            // For OASIS: financialImpact can be a number (increase) or an object with increase property
                            let revenue = 0
                            if (f.analysis?.financialImpact) {
                              if (typeof f.analysis.financialImpact === "number") {
                                // OASIS returns financialImpact as a number (the increase)
                                revenue = f.analysis.financialImpact
                              } else if (f.analysis.financialImpact?.increase) {
                                // Or it could be an object with increase property
                                revenue = f.analysis.financialImpact.increase
                              }
                            }
                            // Also check other possible locations
                            revenue = revenue || 
                              f.analysis?.revenueImpact?.increase ||
                              f.analysis?.revenue_increase ||
                              0
                            return sum + (typeof revenue === "number" ? revenue : 0)
                          }, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Document Results */}
                  <div className="space-y-4">
                    {completedFiles.map((file) => (
                      <div key={file.id} className="p-6 border-2 rounded-xl space-y-4 bg-white hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-semibold text-lg text-gray-900 truncate">{file.file.name}</h3>
                              <Badge variant="outline" className="flex-shrink-0">{getDocumentTypeLabel(file.type)}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Processed successfully</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              let url = ''
                              if (file.type === "pt-note") {
                                url = `/pt-visit-qa/optimization/${file.id}`
                              } else if (file.type === "poc") {
                                url = `/poc-qa/optimization/${file.id}`
                              } else if (file.type === "physician-order") {
                                url = `/physician-order/optimization/${file.id}`
                              } else {
                                url = `/oasis-qa/optimization/${file.id}`
                              }
                              window.open(url, '_blank', 'noopener,noreferrer')
                            }}
                            className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Optimization Report
                          </Button>
                        </div>

                        {file.analysis && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Quality Score</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {file.analysis.qualityScore ||
                                  file.analysis.qualityScores?.overall ||
                                  file.analysis.quality_score ||
                                  0}
                                %
                              </p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Confidence</p>
                              <p className="text-2xl font-bold text-green-600">
                                {(() => {
                                  // For physician orders: check multiple possible locations
                                  if (file.type === "physician-order") {
                                    return file.analysis?.confidenceScore ||
                                           file.analysis?.confidence_score ||
                                           file.analysis?.confidence ||
                                           file.analysis?.qualityScores?.confidence ||
                                           0
                                  }
                                  // For other documents
                                  return file.analysis?.confidence ||
                                         file.analysis?.qualityScores?.confidence ||
                                         file.analysis?.confidence_score ||
                                         file.analysis?.confidenceScore ||
                                         0
                                })()}
                                %
                              </p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">Issues</p>
                              <p className="text-2xl font-bold text-orange-600">
                                {(() => {
                                  // For OASIS documents: count flagged_issues (includes converted inconsistencies) or inconsistencies (old records)
                                  if (file.type === "oasis") {
                                    const flaggedIssues = file.analysis?.flagged_issues || file.analysis?.flaggedIssues || []
                                    const inconsistencies = file.analysis?.inconsistencies || []
                                    // Always prefer flagged_issues to avoid double counting
                                    return Array.isArray(flaggedIssues) && flaggedIssues.length > 0 
                                      ? flaggedIssues.length 
                                      : (Array.isArray(inconsistencies) ? inconsistencies.length : 0)
                                  }
                                  
                                  // For physician orders: count missingInformation + qaFindings + qapiDeficiencies
                                  if (file.type === "physician-order") {
                                    // Try arrays first (from API response), then fall back to counts
                                    const missingInfo = file.analysis?.missingInformationArray || 
                                                       file.analysis?.findings?.missingInformation || 
                                                       (file.analysis?.missingInformation ? Array(file.analysis.missingInformation).fill(null) : [])
                                    const qaFindings = file.analysis?.qaFindingsArray || 
                                                      file.analysis?.findings?.qaFindings || 
                                                      (file.analysis?.qaFindings ? Array(file.analysis.qaFindings).fill(null) : [])
                                    const qapiDeficiencies = file.analysis?.qapiDeficienciesArray || 
                                                           file.analysis?.findings?.qapiDeficiencies || 
                                                           (file.analysis?.qapiDeficiencies ? Array(file.analysis.qapiDeficiencies).fill(null) : [])
                                    
                                    // If we have arrays, use length; otherwise use the count numbers
                                    const missingCount = Array.isArray(missingInfo) ? missingInfo.length : (file.analysis?.missingInformation || 0)
                                    const qaCount = Array.isArray(qaFindings) ? qaFindings.length : (file.analysis?.qaFindings || 0)
                                    const qapiCount = Array.isArray(qapiDeficiencies) ? qapiDeficiencies.length : (file.analysis?.qapiDeficiencies || 0)
                                    
                                    return missingCount + qaCount + qapiCount
                                  }
                                  
                                  // For other clinical documents: count flaggedIssues + inconsistencies + missingElements
                                  const flaggedIssues = file.analysis?.flaggedIssues || file.analysis?.findings?.flaggedIssues || []
                                  const inconsistencies = file.analysis?.inconsistencies || file.analysis?.findings?.inconsistencies || []
                                  const missingElements = file.analysis?.missingElements || file.analysis?.missing_elements || []
                                  
                                  return (Array.isArray(flaggedIssues) ? flaggedIssues.length : 0) +
                                         (Array.isArray(inconsistencies) ? inconsistencies.length : 0) +
                                         (Array.isArray(missingElements) ? missingElements.length : 0)
                                })()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* QAPI Report Modal */}
      <Dialog open={qapiReportOpen} onOpenChange={setQapiReportOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center text-white shadow-md">
                <FileCheck className="h-5 w-5" />
              </div>
              QAPI Report - Chart {chartId}
            </DialogTitle>
            <DialogDescription>
              Comprehensive Quality Assurance and Performance Improvement report for all documents in this chart
            </DialogDescription>
          </DialogHeader>

          {qapiReportLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mr-3" />
              <p className="text-lg text-gray-600">Generating QAPI Report...</p>
            </div>
          ) : qapiReportData ? (
            <div className="space-y-6 py-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-2 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-700 uppercase">Total Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-600">{qapiReportData.summary.totalDocuments}</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-700 uppercase">Avg Quality Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">{qapiReportData.summary.avgQualityScore}%</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-orange-700 uppercase">Total Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-orange-600">{qapiReportData.summary.totalIssues}</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-purple-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-purple-700 uppercase">Revenue Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* ✅ Show actual current revenue from OASIS (not just the increase) */}
                    <p className="text-3xl font-bold text-purple-600">
                      ${(qapiReportData.summary.totalCurrentRevenue || qapiReportData.summary.totalRevenueImpact || 0).toLocaleString()}
                    </p>
                    {qapiReportData.summary.totalCurrentRevenue > 0 && qapiReportData.summary.totalRevenueImpact !== 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {qapiReportData.summary.totalRevenueImpact > 0 ? '+' : ''}
                        ${qapiReportData.summary.totalRevenueImpact.toLocaleString()} optimization
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Documents by Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents by Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(qapiReportData.documentsByType || {}).map(([type, docs]: [string, any]) => (
                      <div key={type} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-lg capitalize">{type.replace('_', ' ')}</h4>
                          <Badge variant="outline">{Array.isArray(docs) ? docs.length : 0} documents</Badge>
                        </div>
                        <div className="space-y-2">
                          {Array.isArray(docs) && docs.map((doc: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{doc.fileName}</p>
                                <p className="text-xs text-gray-500">{doc.patientName || 'Unknown Patient'}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge variant={doc.qualityScore >= 80 ? "default" : doc.qualityScore >= 60 ? "secondary" : "destructive"}>
                                  {doc.qualityScore}%
                                </Badge>
                                <Badge variant="outline">{doc.issues} issues</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* QAPI Deficiencies */}
              {qapiReportData.qapiData?.deficiencies && qapiReportData.qapiData.deficiencies.length > 0 && (
                <Card className="border-2 border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-5 w-5" />
                      QAPI Deficiencies ({qapiReportData.qapiData.deficiencies.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {qapiReportData.qapiData.deficiencies.map((def: any, idx: number) => (
                        <div key={idx} className="p-3 bg-red-50 border-l-4 border-red-600 rounded">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <p className="font-semibold text-red-900">{def.deficiency}</p>
                              {def.sourceDocument && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {def.sourceDocument} ({def.documentType})
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-red-700 mb-1">Category: {def.category}</p>
                          <p className="text-sm text-red-700 mb-1">Severity: {def.severity}</p>
                          <p className="text-sm text-red-700">Root Cause: {def.rootCause}</p>
                          {def.recommendation && (
                            <p className="text-sm text-red-700 mt-1">Recommendation: {def.recommendation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {qapiReportData.recommendations && qapiReportData.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Recommendations ({qapiReportData.recommendations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {qapiReportData.recommendations.map((rec: any, idx: number) => (
                        <div key={idx} className="p-3 bg-blue-50 border-l-4 border-blue-600 rounded">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <p className="font-semibold text-blue-900">{rec.recommendation || rec.description}</p>
                              {rec.sourceDocument && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {rec.sourceDocument} ({rec.documentType})
                                </Badge>
                              )}
                            </div>
                            <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'outline'}>
                              {rec.priority || 'medium'}
                            </Badge>
                          </div>
                          {rec.category && (
                            <p className="text-sm text-blue-700">Category: {rec.category}</p>
                          )}
                          {rec.expectedImpact && (
                            <p className="text-sm text-blue-700">Impact: {rec.expectedImpact}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Regulatory Issues */}
              {qapiReportData.regulatoryIssues && qapiReportData.regulatoryIssues.length > 0 && (
                <Card className="border-2 border-orange-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-700">
                      <Shield className="h-5 w-5" />
                      Regulatory Issues ({qapiReportData.regulatoryIssues.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {qapiReportData.regulatoryIssues.map((issue: any, idx: number) => (
                        <div key={idx} className="p-3 bg-orange-50 border-l-4 border-orange-600 rounded">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <p className="font-semibold text-orange-900">{issue.issue}</p>
                              {issue.sourceDocument && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {issue.sourceDocument} ({issue.documentType})
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-orange-700 mb-1">Regulation: {issue.regulation}</p>
                          <p className="text-sm text-orange-700 mb-1">Severity: {issue.severity}</p>
                          {issue.remediation && (
                            <p className="text-sm text-orange-700">Remediation: {issue.remediation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Documentation Gaps */}
              {qapiReportData.documentationGaps && qapiReportData.documentationGaps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5" />
                      Documentation Gaps ({qapiReportData.documentationGaps.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {qapiReportData.documentationGaps.map((gap: any, idx: number) => (
                        <div key={idx} className="p-3 bg-yellow-50 border-l-4 border-yellow-600 rounded">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <p className="font-semibold text-yellow-900">{gap.gap}</p>
                              {gap.sourceDocument && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {gap.sourceDocument} ({gap.documentType})
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-yellow-700 mb-1">Impact: {gap.impact}</p>
                          {gap.recommendation && (
                            <p className="text-sm text-yellow-700">Recommendation: {gap.recommendation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Report Metadata */}
              <Card className="bg-gray-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <p>Report Generated: {new Date(qapiReportData.generatedAt).toLocaleString()}</p>
                    <p>Chart ID: {qapiReportData.chartId}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No QAPI report data available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
