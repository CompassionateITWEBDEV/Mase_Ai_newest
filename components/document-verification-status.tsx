"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CheckCircle, AlertTriangle, XCircle, Eye, Clock, FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface DocumentVerificationStatusProps {
  document: {
    id: string
    file_name: string
    document_type: string
    status: 'pending' | 'verified' | 'rejected'
    verified_date?: string
    notes?: string
    uploaded_date: string
  }
  onVerify?: (documentId: string, action: 'verified' | 'rejected', notes?: string) => void
  canVerify?: boolean
}

export default function DocumentVerificationStatus({ 
  document, 
  onVerify, 
  canVerify = false 
}: DocumentVerificationStatusProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [verificationNotes, setVerificationNotes] = useState('')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      case 'pending':
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        )
    }
  }

  const handleVerify = (action: 'verified' | 'rejected') => {
    if (onVerify) {
      onVerify(document.id, action, verificationNotes)
      setIsDetailsOpen(false)
      setVerificationNotes('')
    }
  }

  return (
    <>
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center space-x-3">
          {getStatusIcon(document.status)}
          <div>
            <p className="font-medium text-gray-900">{document.file_name}</p>
            <p className="text-sm text-gray-600 capitalize">
              {document.document_type.replace('_', ' ')}
            </p>
            <p className="text-xs text-gray-500">
              Uploaded: {new Date(document.uploaded_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(document.status)}
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsDetailsOpen(true)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Details
          </Button>
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Verification Details
            </DialogTitle>
            <DialogDescription>
              Verification status and details for {document.file_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">File Name:</span>
                  <span>{document.file_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Document Type:</span>
                  <span className="capitalize">{document.document_type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Upload Date:</span>
                  <span>{new Date(document.uploaded_date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  {getStatusBadge(document.status)}
                </div>
                {document.verified_date && (
                  <div className="flex justify-between">
                    <span className="font-medium">Verified Date:</span>
                    <span>{new Date(document.verified_date).toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {document.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Verification Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{document.notes}</p>
                </CardContent>
              </Card>
            )}

            {canVerify && document.status === 'pending' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Manual Verification</CardTitle>
                  <CardDescription>
                    Review the document and update its verification status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Notes
                    </label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                      placeholder="Add notes about the verification process..."
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => handleVerify('verified')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Document
                    </Button>
                    <Button 
                      onClick={() => handleVerify('rejected')}
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
