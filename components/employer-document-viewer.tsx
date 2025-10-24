"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle,
  Calendar,
  User,
  HardDrive,
  AlertCircle,
  X
} from "lucide-react"

interface Document {
  id: string
  document_type: string
  file_name: string
  file_size: number
  file_size_mb: string
  file_url: string
  uploaded_date: string
  uploaded_date_formatted: string
  status: string
  status_badge: { text: string; variant: string }
  verified_date?: string
  notes?: string
  applicant_name: string
}

interface EmployerDocumentViewerProps {
  isOpen: boolean
  onClose: () => void
  documents: Document[]
  applicantName: string
}

const DOCUMENT_TYPES = {
  resume: { name: 'Resume', icon: FileText, color: 'text-blue-500' },
  license: { name: 'Professional License', icon: FileText, color: 'text-green-500' },
  certification: { name: 'CPR Certification', icon: FileText, color: 'text-red-500' },
  background_check: { name: 'Background Check', icon: FileText, color: 'text-purple-500' },
  reference: { name: 'Reference Letter', icon: FileText, color: 'text-orange-500' },
  other: { name: 'Other Document', icon: FileText, color: 'text-gray-500' }
}

const STATUS_ICONS = {
  verified: CheckCircle,
  pending: Clock,
  rejected: XCircle
}

const STATUS_COLORS = {
  verified: 'text-green-500',
  pending: 'text-yellow-500',
  rejected: 'text-red-500'
}

export default function EmployerDocumentViewer({ 
  isOpen, 
  onClose, 
  documents, 
  applicantName 
}: EmployerDocumentViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)

  const handleDownload = async (document: Document) => {
    setIsDownloading(document.id)
    try {
      const response = await fetch(`/api/documents/download?document_id=${document.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      // Get the filename from the response headers or use the document filename
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : document.file_name
      
      // Create a blob from the response
      const blob = await response.blob()
      
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = filename
      window.document.body.appendChild(link)
      link.click()
      
      // Clean up
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Download error:', error)
      alert(`Failed to download document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDownloading(null)
    }
  }

  const handleDownloadAll = async () => {
    if (documents.length === 0) return
    
    setIsDownloadingAll(true)
    try {
      // Get the applicant ID from the first document
      const applicantId = documents[0].applicant_id || documents[0].id
      
      const response = await fetch(`/api/documents/download-all?applicant_id=${applicantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : `${applicantName.replace(/\s+/g, '-')}-documents.zip`
      
      // Create a blob from the response
      const blob = await response.blob()
      
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = filename
      window.document.body.appendChild(link)
      link.click()
      
      // Clean up
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Bulk download error:', error)
      alert(`Failed to download documents: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDownloadingAll(false)
    }
  }

  const getDocumentTypeInfo = (type: string) => {
    return DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES] || DOCUMENT_TYPES.other
  }

  const getStatusIcon = (status: string) => {
    const IconComponent = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || Clock
    const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'text-gray-500'
    return <IconComponent className={`h-4 w-4 ${colorClass}`} />
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'verified': return 'default'
      case 'pending': return 'secondary'
      case 'rejected': return 'destructive'
      default: return 'outline'
    }
  }

  // Group documents by type
  const documentsByType = documents.reduce((acc, doc) => {
    if (!acc[doc.document_type]) {
      acc[doc.document_type] = []
    }
    acc[doc.document_type].push(doc)
    return acc
  }, {} as Record<string, Document[]>)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents - {applicantName}
          </DialogTitle>
          <DialogDescription>
            View and download documents uploaded by this applicant
          </DialogDescription>
        </DialogHeader>

        {documents.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
            <p className="text-gray-600">This applicant hasn't uploaded any documents yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Document Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{documents.length}</p>
                      <p className="text-sm text-gray-600">Total Documents</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {documents.filter(doc => doc.status === 'verified').length}
                      </p>
                      <p className="text-sm text-gray-600">Verified</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">
                        {documents.filter(doc => doc.status === 'pending').length}
                      </p>
                      <p className="text-sm text-gray-600">Pending</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Quick Actions</p>
                      <Button
                        size="sm"
                        onClick={handleDownloadAll}
                        disabled={isDownloadingAll}
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isDownloadingAll ? (
                          <>
                            <Clock className="h-3 w-3 mr-1 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-3 w-3 mr-1" />
                            Download All
                          </>
                        )}
                      </Button>
                    </div>
                    <Download className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documents by Type */}
            <Tabs defaultValue={Object.keys(documentsByType)[0]} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {Object.keys(documentsByType).map(type => {
                  const typeInfo = getDocumentTypeInfo(type)
                  const IconComponent = typeInfo.icon
                  return (
                    <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                      <IconComponent className={`h-4 w-4 ${typeInfo.color}`} />
                      <span className="hidden sm:inline">{typeInfo.name}</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              {Object.entries(documentsByType).map(([type, docs]) => {
                const typeInfo = getDocumentTypeInfo(type)
                const IconComponent = typeInfo.icon
                return (
                  <TabsContent key={type} value={type} className="space-y-4">
                    <div className="space-y-3">
                      {docs.map(doc => (
                        <Card key={doc.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <IconComponent className={`h-5 w-5 mt-1 ${typeInfo.color}`} />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 truncate">
                                    {doc.file_name}
                                  </h4>
                                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {doc.uploaded_date_formatted}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <HardDrive className="h-3 w-3" />
                                      {doc.file_size_mb} MB
                                    </div>
                                  </div>
                                  {doc.notes && (
                                    <p className="text-sm text-gray-600 mt-1">{doc.notes}</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(doc.status)}
                                  <Badge variant={getStatusVariant(doc.status)}>
                                    {doc.status_badge.text}
                                  </Badge>
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedDocument(doc)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(doc)}
                                    disabled={isDownloading === doc.id}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    {isDownloading === doc.id ? (
                                      <>
                                        <Clock className="h-4 w-4 mr-1 animate-spin" />
                                        Downloading...
                                      </>
                                    ) : (
                                      <>
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            {documents.length > 0 && (
              <Button
                onClick={handleDownloadAll}
                disabled={isDownloadingAll}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isDownloadingAll ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Downloading All...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download All Documents
                  </>
                )}
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedDocument.file_name}
              </DialogTitle>
              <DialogDescription>
                Document uploaded by {applicantName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Document Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">File Name:</span>
                    <p className="text-gray-900">{selectedDocument.file_name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">File Size:</span>
                    <p className="text-gray-900">{selectedDocument.file_size_mb} MB</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Upload Date:</span>
                    <p className="text-gray-900">{selectedDocument.uploaded_date_formatted}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Document Type:</span>
                    <p className="text-gray-900 capitalize">{selectedDocument.document_type}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedDocument.status)}
                      <Badge variant={getStatusVariant(selectedDocument.status)}>
                        {selectedDocument.status_badge.text}
                      </Badge>
                    </div>
                  </div>
                  {selectedDocument.verified_date && (
                    <div>
                      <span className="font-medium text-gray-600">Verified Date:</span>
                      <p className="text-gray-900">{selectedDocument.verified_date}</p>
                    </div>
                  )}
                </div>
                {selectedDocument.notes && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-600">Notes:</span>
                    <p className="text-gray-900 mt-1">{selectedDocument.notes}</p>
                  </div>
                )}
              </div>

              {/* Document Preview */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedDocument)}
                      disabled={isDownloading === selectedDocument.id}
                      className="text-green-600 hover:text-green-700"
                    >
                      {isDownloading === selectedDocument.id ? (
                        <>
                          <Clock className="h-4 w-4 mr-1 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </>
                      )}
                    </Button>
                    <button
                      onClick={() => setSelectedDocument(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                
                {/* Document Content */}
                <div className="bg-white border rounded-lg p-6 min-h-[400px] flex items-center justify-center">
                  {selectedDocument.file_url ? (
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        Click download to view this document
                      </p>
                      <Button
                        onClick={() => handleDownload(selectedDocument)}
                        disabled={isDownloading === selectedDocument.id}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isDownloading === selectedDocument.id ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download to View
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                      <p>Document preview not available</p>
                      <p className="text-sm">Use the download button to access the file</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}
