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
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

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
      const formData = new FormData()
      formData.append("file", uploadFile.file)
      formData.append("uploadId", uploadFile.id)
      formData.append("uploadType", uploadType)
      formData.append("priority", priority)
      formData.append("fileType", uploadFile.type)
      formData.append("chartId", chartId)
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
                    onClick={() => (window.location.href = `/oasis-qa/qapi-report/${chartId}`)}
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
                          (sum, f) =>
                            sum +
                            (f.analysis?.flaggedIssues?.length ||
                              f.analysis?.findings?.length ||
                              (Array.isArray(f.analysis?.findings) ? f.analysis.findings.length : 0) ||
                              0),
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
                            const revenue =
                              f.analysis?.financialImpact?.increase ||
                              f.analysis?.revenueImpact?.increase ||
                              f.analysis?.financialImpact ||
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
                              if (file.type === "pt-note") {
                                window.location.href = `/pt-visit-qa/optimization/${file.id}`
                              } else if (file.type === "poc") {
                                window.location.href = `/poc-qa/optimization/${file.id}`
                              } else {
                                window.location.href = `/oasis-qa/optimization/${file.id}`
                              }
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
                                {file.analysis.confidence ||
                                  file.analysis.qualityScores?.confidence ||
                                  file.analysis.confidence_score ||
                                  0}
                                %
                              </p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2">Issues</p>
                              <p className="text-2xl font-bold text-orange-600">
                                {file.analysis.flaggedIssues?.length ||
                                  file.analysis.findings?.length ||
                                  (Array.isArray(file.analysis.findings) ? file.analysis.findings.length : 0) ||
                                  0}
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
      </div>
    </div>
  )
}
