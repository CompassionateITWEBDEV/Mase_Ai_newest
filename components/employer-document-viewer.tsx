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
  FileSize,
  AlertCircle
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

  const handleDownload = async (document: Document) => {
    setIsDownloading(document.id)
    try {
      // In a real implementation, you would download the actual file
      // For now, we'll just show a success message
      alert(`Downloading ${document.file_name}...`)
      
      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download document')
    } finally {
      setIsDownloading(null)
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                return (
                  <TabsContent key={type} value={type} className="space-y-4">
                    <div className="space-y-3">
                      {docs.map(doc => (
                        <Card key={doc.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <typeInfo.icon className={`h-5 w-5 mt-1 ${typeInfo.color}`} />
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
                                      <FileSize className="h-3 w-3" />
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
                                
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedDocument(doc)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(doc)}
                                    disabled={isDownloading === doc.id}
                                  >
                                    {isDownloading === doc.id ? (
                                      <Clock className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4" />
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
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
