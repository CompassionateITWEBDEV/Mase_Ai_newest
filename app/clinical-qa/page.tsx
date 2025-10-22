"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Activity,
  Stethoscope,
  Dumbbell,
  Heart,
  FileSpreadsheet,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

interface UploadedDocument {
  file: File
  id: string
  progress: number
  status: "uploading" | "processing" | "completed" | "error"
  documentType: string
  documentId?: string
  analysis?: any
}

const DOCUMENT_TYPES = [
  { value: "oasis", label: "OASIS Assessment", icon: FileCheck },
  { value: "poc", label: "Plan of Care", icon: ClipboardList },
  { value: "physician_order", label: "Physician Order", icon: Stethoscope },
  { value: "rn_note", label: "RN Visit Note", icon: Activity },
  { value: "pt_note", label: "PT Visit Note", icon: Dumbbell },
  { value: "ot_note", label: "OT Visit Note", icon: Heart },
  { value: "evaluation", label: "Evaluation", icon: FileSpreadsheet },
]

export default function ClinicalQAPage() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [selectedDocType, setSelectedDocType] = useState("oasis")
  const [patientId, setPatientId] = useState("")
  const [patientName, setPatientName] = useState("")
  const [mrn, setMrn] = useState("")

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const timestamp = Date.now()
      const newDocs = acceptedFiles.map((file, index) => ({
        file,
        id: `${timestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        progress: 0,
        status: "uploading" as const,
        documentType: selectedDocType,
      }))

      setDocuments((prev) => [...prev, ...newDocs])
      newDocs.forEach((doc) => processDocument(doc))
    },
    [selectedDocType, patientId, patientName, mrn],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxSize: 10 * 1024 * 1024,
  })

  const processDocument = async (doc: UploadedDocument) => {
    try {
      // Upload file
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, progress } : d)))
      }

      const uploadFormData = new FormData()
      uploadFormData.append("file", doc.file)
      uploadFormData.append("uploadId", doc.id)
      uploadFormData.append("documentType", doc.documentType)

      const uploadRes = await fetch("/api/clinical-qa/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (!uploadRes.ok) throw new Error("Upload failed")
      const uploadData = await uploadRes.json()

      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: "processing" } : d)))

      // Process document
      const processFormData = new FormData()
      processFormData.append("fileUrl", uploadData.fileUrl)
      processFormData.append("fileName", uploadData.fileName)
      processFormData.append("fileType", uploadData.fileType)
      processFormData.append("fileSize", uploadData.fileSize.toString())
      processFormData.append("uploadId", doc.id)
      processFormData.append("documentType", doc.documentType)
      if (patientId) processFormData.append("patientId", patientId)
      if (patientName) processFormData.append("patientName", patientName)
      if (mrn) processFormData.append("mrn", mrn)

      const processRes = await fetch("/api/clinical-qa/process", {
        method: "POST",
        body: processFormData,
      })

      if (!processRes.ok) throw new Error("Processing failed")
      const processData = await processRes.json()

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                status: "completed",
                documentId: processData.documentId,
                analysis: processData.analysis,
              }
            : d,
        ),
      )

      toast({
        title: "Processing Complete",
        description: processData.message,
      })
    } catch (error) {
      console.error("Processing error:", error)
      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: "error" } : d)))
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process document",
        variant: "destructive",
      })
    }
  }

  const removeDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId))
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

  const completedDocs = documents.filter((d) => d.status === "completed")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clinical Documentation QA</h1>
          <p className="text-muted-foreground">Comprehensive quality assurance for all clinical documentation types</p>
        </div>
        <Link href="/clinical-qa/chart-review">
          <Button>
            <ClipboardList className="h-4 w-4 mr-2" />
            Chart Reviews
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>Enter patient details for all documents</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Patient ID</Label>
                <Input
                  placeholder="Enter patient ID"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Patient Name</Label>
                <Input
                  placeholder="Enter patient name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>MRN</Label>
                <Input placeholder="Enter MRN" value={mrn} onChange={(e) => setMrn(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Document Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Document Type</CardTitle>
              <CardDescription>Choose the type of clinical document to upload</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {DOCUMENT_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      onClick={() => setSelectedDocType(type.value)}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        selectedDocType === type.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <p className="font-medium text-sm">{type.label}</p>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Upload {DOCUMENT_TYPES.find((t) => t.value === selectedDocType)?.label}</CardTitle>
              <CardDescription>Drag and drop or click to upload</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-medium mb-2 text-lg">
                  {isDragActive ? "Drop files here" : "Upload Clinical Documents"}
                </h3>
                <p className="text-sm text-muted-foreground">PDF, TXT, or Image (Max 10MB)</p>
              </div>
            </CardContent>
          </Card>

          {/* Document List */}
          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 flex-1">
                      {getStatusIcon(doc.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{doc.file.name}</p>
                          <Badge variant="outline">
                            {DOCUMENT_TYPES.find((t) => t.value === doc.documentType)?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{(doc.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        {doc.status === "uploading" && <Progress value={doc.progress} className="mt-2" />}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant={doc.status === "completed" ? "default" : "secondary"}>{doc.status}</Badge>
                      {doc.status === "completed" && doc.documentId && (
                        <Link href={`/clinical-qa/document/${doc.documentId}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Report
                          </Button>
                        </Link>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => removeDocument(doc.id)}>
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
              <CardTitle>Processing Results</CardTitle>
              <CardDescription>View completed QA analyses</CardDescription>
            </CardHeader>
            <CardContent>
              {completedDocs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2 text-lg">No Results Yet</h3>
                  <p className="text-muted-foreground">Upload and process documents to see QA results</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedDocs.map((doc) => (
                    <div key={doc.id} className="p-6 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{doc.file.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {DOCUMENT_TYPES.find((t) => t.value === doc.documentType)?.label}
                          </p>
                        </div>
                        <Link href={`/clinical-qa/document/${doc.documentId}`}>
                          <Button>
                            <Eye className="h-4 w-4 mr-2" />
                            View Full Report
                          </Button>
                        </Link>
                      </div>

                      {doc.analysis && (
                        <div className="grid grid-cols-4 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-900">Quality Score</p>
                            <p className="text-2xl font-bold text-blue-600">{doc.analysis.qualityScores.overall}%</p>
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium text-green-900">Compliance</p>
                            <p className="text-2xl font-bold text-green-600">
                              {doc.analysis.qualityScores.compliance}%
                            </p>
                          </div>
                          <div className="p-4 bg-orange-50 rounded-lg">
                            <p className="text-sm font-medium text-orange-900">Issues Found</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {doc.analysis.flaggedIssues?.length || 0}
                            </p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm font-medium text-purple-900">Revenue Impact</p>
                            <p className="text-2xl font-bold text-purple-600">
                              ${doc.analysis.financialImpact?.increase?.toLocaleString() || 0}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
