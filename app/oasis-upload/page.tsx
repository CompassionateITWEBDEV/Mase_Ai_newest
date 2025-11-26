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
    color: string,
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...dropzone.getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dropzone.isDragActive ? `border-${color}-500 bg-${color}-50` : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...dropzone.getInputProps()} />
          <Upload className={`h-6 w-6 text-${color}-600 mx-auto mb-2`} />
          <p className="text-sm font-medium">{dropzone.isDragActive ? "Drop file here" : "Click or drag to upload"}</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, TXT, or Image (Max 10MB)</p>
        </div>
      </CardContent>
    </Card>
  )

  const completedFiles = files.filter((f) => f.status === "completed")
  const chartFiles = files.filter((f) => f.chartId === chartId)

  const canGenerateQAPIReport =
    chartFiles.some((f) => f.type === "oasis" && f.status === "completed") &&
    chartFiles.filter((f) => f.type !== "oasis" && f.status === "completed").length >= 2

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clinical Documentation QA</h1>
        <p className="text-muted-foreground">
          Upload complete patient chart for comprehensive QA analysis and QAPI reporting
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="results">Results & QAPI Report</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Configure QA processing settings</CardDescription>
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
          <div className="grid grid-cols-2 gap-4">
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
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents ({chartFiles.length})</CardTitle>
                <CardDescription>Chart ID: {chartId}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {chartFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 flex-1">
                      {getStatusIcon(file.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{file.file.name}</p>
                          <Badge variant="outline">{getDocumentTypeLabel(file.type)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        {file.status === "uploading" && <Progress value={file.progress} className="mt-2" />}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant={file.status === "completed" ? "default" : "secondary"}>{file.status}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>QA Results & QAPI Report</CardTitle>
                  <CardDescription>Comprehensive analysis of all uploaded documents</CardDescription>
                </div>
                {canGenerateQAPIReport && (
                  <Button onClick={() => (window.location.href = `/oasis-qa/qapi-report/${chartId}`)}>
                    <FileCheck className="h-4 w-4 mr-2" />
                    Generate QAPI Report
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {completedFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Results Yet</h3>
                  <p className="text-muted-foreground">Upload and process documents to see QA results</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Documents Processed</p>
                      <p className="text-2xl font-bold text-blue-600">{completedFiles.length}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-900">Avg Quality Score</p>
                      <p className="text-2xl font-bold text-green-600">
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
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm font-medium text-orange-900">Total Issues</p>
                      <p className="text-2xl font-bold text-orange-600">
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
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-900">Revenue Impact</p>
                      <p className="text-2xl font-bold text-purple-600">
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
                      <div key={file.id} className="p-6 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{file.file.name}</h3>
                              <Badge>{getDocumentTypeLabel(file.type)}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Processed successfully</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (file.type === "pt-note") {
                                window.location.href = `/pt-visit-qa/optimization/${file.id}`
                              } else {
                                window.location.href = `/oasis-qa/optimization/${file.id}`
                              }
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Optimization Report
                          </Button>
                        </div>

                        {file.analysis && (
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 bg-blue-50 rounded">
                              <p className="text-xs font-medium text-blue-900">Quality Score</p>
                              <p className="text-xl font-bold text-blue-600">
                                {file.analysis.qualityScore ||
                                  file.analysis.qualityScores?.overall ||
                                  file.analysis.quality_score ||
                                  0}
                                %
                              </p>
                            </div>
                            <div className="p-3 bg-green-50 rounded">
                              <p className="text-xs font-medium text-green-900">Confidence</p>
                              <p className="text-xl font-bold text-green-600">
                                {file.analysis.confidence ||
                                  file.analysis.qualityScores?.confidence ||
                                  file.analysis.confidence_score ||
                                  0}
                                %
                              </p>
                            </div>
                            <div className="p-3 bg-orange-50 rounded">
                              <p className="text-xs font-medium text-orange-900">Issues</p>
                              <p className="text-xl font-bold text-orange-600">
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
  )
}
