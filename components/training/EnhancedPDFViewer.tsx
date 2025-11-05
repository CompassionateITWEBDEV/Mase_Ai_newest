"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Download,
  AlertCircle,
  X,
  Eye,
} from "lucide-react"

interface EnhancedPDFViewerProps {
  fileUrl: string
  fileName: string
  totalPages: number
  onComplete: () => void
  onClose: () => void
  onPageChange?: (page: number) => void
}

export function EnhancedPDFViewer({
  fileUrl,
  fileName,
  totalPages,
  onComplete,
  onClose,
  onPageChange,
}: EnhancedPDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [reachedLastPage, setReachedLastPage] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [highestPageReached, setHighestPageReached] = useState(1)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Track the highest page reached (by clicking Next or scrolling)
  useEffect(() => {
    if (currentPage > highestPageReached) {
      setHighestPageReached(currentPage)
    }
    
    // Mark as reached last page when navigating to it
    if (currentPage === totalPages || highestPageReached === totalPages) {
      setReachedLastPage(true)
    }
  }, [currentPage, totalPages, highestPageReached])

  // Listen for scroll events in iframe to detect page changes
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleIframeLoad = () => {
      try {
        const iframeWindow = iframe.contentWindow
        if (iframeWindow) {
          // Try to detect page changes from PDF viewer
          iframeWindow.addEventListener('scroll', () => {
            // PDF viewers often update URL hash with page number
            const hash = iframeWindow.location.hash
            const pageMatch = hash.match(/page=(\d+)/)
            if (pageMatch) {
              const page = parseInt(pageMatch[1])
              if (page > highestPageReached) {
                setHighestPageReached(page)
                setCurrentPage(page)
              }
            }
          })
        }
      } catch (e) {
        // Cross-origin restrictions - that's okay
        console.log('Cannot access iframe content (cross-origin)')
      }
    }

    iframe.addEventListener('load', handleIframeLoad)
    return () => {
      iframe.removeEventListener('load', handleIframeLoad)
    }
  }, [highestPageReached])

  // Auto-complete when reaching last page
  useEffect(() => {
    if (reachedLastPage && !isCompleted) {
      setIsCompleted(true)
      onComplete()
    }
  }, [reachedLastPage, isCompleted, onComplete])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      onPageChange?.(page)
    }
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = fileName
    link.click()
  }

  // Calculate progress based on current page
  const progressPercent = (currentPage / totalPages) * 100

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <Card className="w-full h-full flex flex-col rounded-none">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <FileText className="h-5 w-5 mr-2" />
              {fileName}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Tracking */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Badge variant={currentPage === totalPages ? "default" : "outline"}>
                  {currentPage === totalPages ? "Last Page" : "Reading..."}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <Badge className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed!
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    Navigate to last page
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {!reachedLastPage && (
            <Alert className="mt-2 border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-800">
                Navigate to the last page (page {totalPages}) - Use Next button or scroll through the PDF.
              </AlertDescription>
            </Alert>
          )}
          
          {highestPageReached > 1 && !isCompleted && (
            <div className="text-xs text-gray-600 mt-1">
              Highest page reached: {highestPageReached} of {totalPages}
            </div>
          )}
          
          {isCompleted && (
            <Alert className="mt-2 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-xs text-green-800">
                ✅ You've reached the last page! Click "Continue" below to proceed.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          {/* PDF Viewer with page parameter and scrolling support */}
          <iframe
            ref={iframeRef}
            src={`${fileUrl}#page=${currentPage}&view=FitH`}
            className="w-full h-full border-0"
            title={fileName}
            allow="fullscreen"
          />
        </CardContent>

        {/* Navigation Controls */}
        <div className="border-t p-4 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          
          {/* Page input */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Go to page:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value)
                if (!isNaN(page)) goToPage(page)
              }}
              className="w-16 px-2 py-1 border rounded text-sm text-center"
            />
          </div>
          
          {isCompleted && (
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Continue
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

