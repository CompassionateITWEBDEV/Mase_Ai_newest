"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileText,
  Clock,
  CheckCircle,
  Eye,
  Download,
  AlertCircle,
  X,
} from "lucide-react"

interface PDFViewerProps {
  fileUrl: string
  fileName: string
  estimatedReadTime: number // in seconds
  onComplete: () => void
  onClose: () => void
}

export function PDFViewer({
  fileUrl,
  fileName,
  estimatedReadTime,
  onComplete,
  onClose,
}: PDFViewerProps) {
  const [timeSpent, setTimeSpent] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const startTimeRef = useRef<number>(Date.now())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const progressPercent = Math.min((timeSpent / estimatedReadTime) * 100, 100)
  const canComplete = progressPercent >= 80 // Must view 80% of estimated time

  useEffect(() => {
    // Start timer
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setTimeSpent(elapsed)
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // Auto-complete if time requirement met
    if (canComplete && !isCompleted) {
      setIsCompleted(true)
      onComplete()
    }
  }, [canComplete, isCompleted, onComplete])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = fileName
    link.click()
  }

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

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  Time: {formatTime(timeSpent)} / {formatTime(estimatedReadTime)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <Badge className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    {Math.round(progressPercent)}% Viewed
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {!canComplete && (
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Please spend at least {Math.ceil(estimatedReadTime * 0.8 / 60)} minutes reviewing this content
                to ensure proper understanding.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          {/* PDF Viewer */}
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title={fileName}
          />
        </CardContent>

        <div className="border-t p-4 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          {isCompleted && (
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

