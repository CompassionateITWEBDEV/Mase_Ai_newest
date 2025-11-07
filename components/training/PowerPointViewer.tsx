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
  isPanelMode?: boolean // When true, viewer is in panel mode (not fullscreen)
}

export function PowerPointViewer({
  fileUrl,
  fileName,
  totalSlides,
  onComplete,
  onClose,
  onSlideChange,
  isPanelMode = false,
}: PowerPointViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(1)
  const [reachedLastSlide, setReachedLastSlide] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [highestSlideReached, setHighestSlideReached] = useState(1)
  
  const containerRef = useRef<HTMLDivElement>(null)

  // Track the highest slide reached (by clicking Next or scrolling)
  useEffect(() => {
    if (currentSlide > highestSlideReached) {
      setHighestSlideReached(currentSlide)
    }
    
    // Mark as reached last slide when navigating to it
    if (currentSlide === totalSlides || highestSlideReached === totalSlides) {
      setReachedLastSlide(true)
    }
  }, [currentSlide, totalSlides, highestSlideReached])

  // Auto-complete when reaching last slide
  useEffect(() => {
    if (reachedLastSlide && !isCompleted) {
      setIsCompleted(true)
      onComplete()
    }
  }, [reachedLastSlide, isCompleted, onComplete])

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

  // Calculate progress based on current slide
  const progressPercent = (currentSlide / totalSlides) * 100

  return (
    <div className={`${isPanelMode ? 'fixed top-0 left-0 right-0 h-1/2 z-40 bg-black/90' : 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center'}`}>
      <Card ref={containerRef} className={`w-full h-full flex flex-col ${isPanelMode ? 'rounded-lg' : 'rounded-none'}`}>
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
              <Badge variant={currentSlide === totalSlides ? "default" : "outline"}>
                {currentSlide === totalSlides ? "Last Slide" : "Viewing..."}
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
                  Navigate to last slide
                </Badge>
              )}
            </div>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

          {!reachedLastSlide && (
          <Alert className="mt-2 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-800">
              Navigate to the last slide (slide {totalSlides}) - Use Next button or scroll through the presentation.
            </AlertDescription>
          </Alert>
        )}
        
        {highestSlideReached > 1 && !isCompleted && (
          <div className="text-xs text-gray-600 mt-1">
            Highest slide reached: {highestSlideReached} of {totalSlides}
          </div>
        )}
        
        {isCompleted && (
          <Alert className="mt-2 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-xs text-green-800">
              ✅ You've reached the last slide! Quiz will be generated automatically.
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
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Content Completed - Quiz will be generated automatically
              </Badge>
              {/* REMOVED Continue to Quiz button - Quiz generation happens automatically, viewer stays open */}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

