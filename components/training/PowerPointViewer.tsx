"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Download,
  AlertCircle,
  X,
  Eye,
  Maximize,
  Minimize,
} from "lucide-react"

interface PowerPointViewerProps {
  fileUrl: string
  fileName: string
  totalSlides: number
  onComplete: () => void
  onClose: () => void
  onSlideChange?: (slide: number) => void
}

export function PowerPointViewer({
  fileUrl,
  fileName,
  totalSlides,
  onComplete,
  onClose,
  onSlideChange,
}: PowerPointViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(1)
  const [viewedSlides, setViewedSlides] = useState<Set<number>>(new Set([1]))
  const [timeSpentPerSlide, setTimeSpentPerSlide] = useState<Record<number, number>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const slideStartTimeRef = useRef<number>(Date.now())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate progress - must view ALL slides
  const viewedPercent = (viewedSlides.size / totalSlides) * 100
  const canComplete = viewedSlides.size === totalSlides && viewedSlides.has(totalSlides)

  // Track time on current slide
  useEffect(() => {
    slideStartTimeRef.current = Date.now()
    
    intervalRef.current = setInterval(() => {
      const timeOnSlide = Math.floor((Date.now() - slideStartTimeRef.current) / 1000)
      setTimeSpentPerSlide(prev => ({
        ...prev,
        [currentSlide]: timeOnSlide
      }))
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [currentSlide])

  // Mark slide as viewed when enough time spent
  useEffect(() => {
    const minTimePerSlide = 8 // Minimum 8 seconds per slide
    if (timeSpentPerSlide[currentSlide] >= minTimePerSlide) {
      setViewedSlides(prev => new Set([...prev, currentSlide]))
    }
  }, [timeSpentPerSlide, currentSlide])

  // Auto-complete when all slides viewed
  useEffect(() => {
    if (canComplete && !isCompleted) {
      setIsCompleted(true)
      onComplete()
    }
  }, [canComplete, isCompleted, onComplete])

  const goToSlide = (slide: number) => {
    if (slide >= 1 && slide <= totalSlides) {
      setCurrentSlide(slide)
      onSlideChange?.(slide)
    }
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = fileName
    link.click()
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const unviewedSlides = totalSlides - viewedSlides.size
  const reachedLastSlide = currentSlide === totalSlides

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card ref={containerRef} className="w-full max-w-6xl max-h-[90vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <Presentation className="h-5 w-5 mr-2" />
              {fileName}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={!canComplete}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress Tracking */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">
                  Slide {currentSlide} of {totalSlides}
                </span>
                <Badge variant={viewedSlides.has(currentSlide) ? "default" : "outline"}>
                  {viewedSlides.has(currentSlide) ? "Viewed" : "Viewing..."}
                </Badge>
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
                    {viewedSlides.size}/{totalSlides} slides viewed
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={viewedPercent} className="h-2" />
            
            {/* Slide time tracker */}
            <div className="text-xs text-gray-500">
              Time on this slide: {timeSpentPerSlide[currentSlide] || 0}s
              {timeSpentPerSlide[currentSlide] < 8 && " (minimum 8s per slide)"}
            </div>
          </div>

          {!reachedLastSlide && (
            <Alert className="mt-2 border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-800">
                Please review all slides to the end. Spend at least 8 seconds on each slide
                to ensure proper understanding. {unviewedSlides} slide{unviewedSlides !== 1 ? 's' : ''} remaining.
              </AlertDescription>
            </Alert>
          )}
          
          {reachedLastSlide && !canComplete && (
            <Alert className="mt-2 border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-xs text-orange-800">
                You've reached the last slide! Review any skipped slides ({unviewedSlides} remaining).
              </AlertDescription>
            </Alert>
          )}
          
          {canComplete && (
            <Alert className="mt-2 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-xs text-green-800">
                ✅ All slides viewed! You can now proceed to the quiz.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 bg-gray-900">
          {/* PowerPoint Viewer - Using Office Online or Google Docs Viewer */}
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
            className="w-full h-full border-0"
            title={fileName}
            allowFullScreen
          />
        </CardContent>

        {/* Navigation Controls */}
        <div className="border-t p-4 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToSlide(currentSlide - 1)}
              disabled={currentSlide === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToSlide(currentSlide + 1)}
              disabled={currentSlide === totalSlides}
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
          
          {/* Slide navigation */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Jump to slide:</span>
            <input
              type="number"
              min="1"
              max={totalSlides}
              value={currentSlide}
              onChange={(e) => {
                const slide = parseInt(e.target.value)
                if (!isNaN(slide)) goToSlide(slide)
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

