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
  const [viewedPages, setViewedPages] = useState<Set<number>>(new Set([1]))
  const [timeSpentPerPage, setTimeSpentPerPage] = useState<Record<number, number>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  
  const pageStartTimeRef = useRef<number>(Date.now())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate progress
  const viewedPercent = (viewedPages.size / totalPages) * 100
  const mustViewPercent = 90 // Must view 90% of pages
  const canComplete = viewedPercent >= mustViewPercent

  // Track time on current page
  useEffect(() => {
    pageStartTimeRef.current = Date.now()
    
    intervalRef.current = setInterval(() => {
      const timeOnPage = Math.floor((Date.now() - pageStartTimeRef.current) / 1000)
      setTimeSpentPerPage(prev => ({
        ...prev,
        [currentPage]: timeOnPage
      }))
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [currentPage])

  // Mark page as viewed when enough time spent
  useEffect(() => {
    const minTimePerPage = 10 // Minimum 10 seconds per page
    if (timeSpentPerPage[currentPage] >= minTimePerPage) {
      setViewedPages(prev => new Set([...prev, currentPage]))
    }
  }, [timeSpentPerPage, currentPage])

  // Auto-complete when requirements met
  useEffect(() => {
    if (canComplete && !isCompleted) {
      setIsCompleted(true)
      onComplete()
    }
  }, [canComplete, isCompleted, onComplete])

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

  const reachedLastPage = viewedPages.has(totalPages)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
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
              disabled={!canComplete}
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
                <Badge variant={viewedPages.has(currentPage) ? "default" : "outline"}>
                  {viewedPages.has(currentPage) ? "Viewed" : "Reading..."}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <Badge className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Can Proceed
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    {viewedPages.size}/{totalPages} pages viewed
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={viewedPercent} className="h-2" />
            
            {/* Page time tracker */}
            <div className="text-xs text-gray-500">
              Time on this page: {timeSpentPerPage[currentPage] || 0}s
              {timeSpentPerPage[currentPage] < 10 && " (minimum 10s)"}
            </div>
          </div>

          {!reachedLastPage && (
            <Alert className="mt-2 border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-800">
                Please read through to the last page and spend at least 10 seconds on each page
                to ensure proper understanding of the material.
              </AlertDescription>
            </Alert>
          )}
          
          {reachedLastPage && !canComplete && (
            <Alert className="mt-2 border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-xs text-orange-800">
                You've reached the last page! Review any skipped pages (
                {Math.ceil((mustViewPercent - viewedPercent) / 100 * totalPages)} more pages needed).
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          {/* PDF Viewer with page parameter */}
          <iframe
            src={`${fileUrl}#page=${currentPage}&zoom=page-fit`}
            className="w-full h-full border-0"
            title={fileName}
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
          
          {canComplete && (
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Continue to Quiz
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

