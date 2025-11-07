"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
  Loader2,
} from "lucide-react"

interface EnhancedPDFViewerProps {
  fileUrl: string
  fileName: string
  totalPages?: number // Optional now - will auto-detect
  onComplete: () => void
  onClose: () => void
  onPageChange?: (page: number) => void
  isPanelMode?: boolean // When true, viewer is in panel mode (not fullscreen)
}

export function EnhancedPDFViewer({
  fileUrl,
  fileName,
  totalPages: propTotalPages,
  onComplete,
  onClose,
  onPageChange,
  isPanelMode = false,
}: EnhancedPDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(propTotalPages || 0)
  const [isLoadingPDF, setIsLoadingPDF] = useState(true)
  const [reachedLastPage, setReachedLastPage] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [highestPageReached, setHighestPageReached] = useState(1)
  const [viewedPages, setViewedPages] = useState<Set<number>>(new Set([1]))
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const iframeKeyRef = useRef<number>(1) // Initialize to page 1
  const containerRef = useRef<HTMLDivElement>(null) // Ref for the PDF container
  const lastWheelTimeRef = useRef<number>(0) // Track last wheel event time

  // Detect PDF page count from browser's PDF viewer
  useEffect(() => {
    if (propTotalPages) {
      setTotalPages(propTotalPages)
      setIsLoadingPDF(false)
      return
    }

    // Use browser to load PDF and detect pages
    const detectPDFPagesFromBrowser = async () => {
      setIsLoadingPDF(true)
      
      try {
        console.log('📄 Attempting to detect PDF pages from:', fileUrl)
        
        // Fetch the PDF file
        const response = await fetch(fileUrl)
        const arrayBuffer = await response.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        
        // Convert to string to search for page count (decode as Latin1 for PDF structure)
        let pdfString = ''
        for (let i = 0; i < uint8Array.length; i++) {
          pdfString += String.fromCharCode(uint8Array[i])
        }
        
        // Method 1: Search for /Count in PDF structure
        const countMatch = pdfString.match(/\/Count\s+(\d+)/)
        if (countMatch) {
          const pages = parseInt(countMatch[1])
          console.log('📄 PDF pages detected (Method 1):', pages)
          setTotalPages(pages)
          setIsLoadingPDF(false)
          return
        }
        
        // Method 2: Count /Page objects
        const pageMatches = pdfString.match(/\/Type\s*\/Page[^s]/g)
        if (pageMatches && pageMatches.length > 0) {
          const pages = pageMatches.length
          console.log('📄 PDF pages detected (Method 2):', pages)
          setTotalPages(pages)
          setIsLoadingPDF(false)
          return
        }
        
        // Fallback: Use reasonable default
        console.warn('⚠️ Could not detect PDF pages automatically')
        console.log('📄 Using default 20 pages - set totalPages prop for accuracy')
        setTotalPages(20)
        setIsLoadingPDF(false)
      } catch (error) {
        console.error('⚠️ Error detecting PDF pages:', error)
        console.log('📄 Using default 20 pages')
        setTotalPages(20)
        setIsLoadingPDF(false)
      }
    }

    // Start detection after small delay
    const timer = setTimeout(() => {
      detectPDFPagesFromBrowser()
    }, 300)

    return () => clearTimeout(timer)
  }, [fileUrl, fileName, propTotalPages])

  // Track the highest page reached (by clicking Next or scrolling)
  useEffect(() => {
    if (currentPage > highestPageReached) {
      setHighestPageReached(currentPage)
    }
    
    // Track viewed pages
    setViewedPages(prev => new Set([...prev, currentPage]))
    
    // Mark as reached last page when navigating to it
    if (totalPages > 0 && (currentPage === totalPages || highestPageReached === totalPages)) {
      setReachedLastPage(true)
    }
  }, [currentPage, totalPages, highestPageReached])

  // Track if we're programmatically navigating (to avoid conflicts)
  const isNavigatingRef = useRef(false)
  const lastHashRef = useRef<string>('')
  const lastPageRef = useRef<number>(1)
  const isScrollingRef = useRef(false) // Track if user is scrolling (don't recreate iframe)

  // goToPage function - must be defined before useEffects that use it
  const goToPage = useCallback((page: number, fromScroll: boolean = false) => {
    if (page >= 1 && page <= totalPages) {
      console.log('📄 goToPage called:', page, 'from', currentPage, 'fromScroll:', fromScroll)
      
      if (fromScroll) {
        // When scrolling, don't recreate iframe - just update state and iframe src
        isScrollingRef.current = true
        isNavigatingRef.current = false
        
        // Update state
        setCurrentPage(page)
        setViewedPages(prev => new Set([...prev, page]))
        setHighestPageReached(prev => Math.max(prev, page))
        onPageChange?.(page)
        
        // Update iframe src without changing key (no reload)
        const iframe = iframeRef.current
        if (iframe) {
          const baseUrl = fileUrl.split('#')[0]
          const newSrc = `${baseUrl}#page=${page}&view=FitH`
          iframe.src = newSrc
          console.log('📄 Updated iframe src for scroll:', newSrc)
        }
        
        // Reset flag
        setTimeout(() => {
          isScrollingRef.current = false
        }, 300)
      } else {
        // When using buttons/arrows, recreate iframe
        isNavigatingRef.current = true
        isScrollingRef.current = false
        
        // Update iframe key to force reload (for button/arrow navigation)
        iframeKeyRef.current = page
        
        // Update state immediately - this will trigger useEffect to recreate iframe
        setCurrentPage(page)
        setViewedPages(prev => new Set([...prev, page]))
        setHighestPageReached(prev => Math.max(prev, page))
        onPageChange?.(page)
        
        // Reset flag after navigation completes
        setTimeout(() => {
          isNavigatingRef.current = false
        }, 600)
      }
    }
  }, [totalPages, fileUrl, onPageChange, currentPage])

  // Update iframe when currentPage changes (for Next/Previous buttons and arrow keys)
  // Only recreate iframe if we're programmatically navigating (not scrolling)
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !totalPages) return

    // If user is scrolling, don't recreate iframe - just let scroll detection handle it
    if (isScrollingRef.current) {
      console.log('📄 Page changed via scroll, not recreating iframe')
      isScrollingRef.current = false // Reset flag
      return
    }

    // Mark that we're programmatically navigating
    isNavigatingRef.current = true
    
    // Force iframe key change to recreate iframe (only for button/arrow navigation)
    iframeKeyRef.current = currentPage
    console.log('📄 Page changed via button/arrow to:', currentPage, '- iframe will reload')
    
    // Reset flag after iframe loads
    const handleLoad = () => {
      console.log('✅ PDF iframe loaded on page:', currentPage)
      setTimeout(() => {
        isNavigatingRef.current = false
      }, 300)
    }
    
    iframe.addEventListener('load', handleLoad)

    // Reset flag after a delay as fallback
    const timeoutId = setTimeout(() => {
      isNavigatingRef.current = false
    }, 1000)

    return () => {
      clearTimeout(timeoutId)
      iframe.removeEventListener('load', handleLoad)
    }
  }, [currentPage, fileUrl, totalPages])

  // Listen for page changes in iframe (from scrolling or PDF viewer navigation)
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !totalPages) return

    // Initialize refs
    lastPageRef.current = currentPage
    
    // Function to check and update page from iframe
    const checkPageChange = () => {
      // Skip if we're programmatically navigating (button/arrow clicks)
      if (isNavigatingRef.current) {
        return
      }

      let pageDetected: number | null = null

      // Method 1: Try to access iframe contentWindow location.hash
      try {
        const iframeWindow = iframe.contentWindow
        if (iframeWindow && iframeWindow.location) {
          const currentHash = iframeWindow.location.hash
          
          // Check if hash changed (indicates page navigation via scrolling)
          if (currentHash !== lastHashRef.current) {
            lastHashRef.current = currentHash
            
            // Try to extract page number from hash
            const pageMatch = currentHash.match(/page=(\d+)/)
            if (pageMatch) {
              pageDetected = parseInt(pageMatch[1])
            }
          }
        }
      } catch (e) {
        // Cross-origin - try other methods
      }

      // Method 2: Try to access iframe document and check for PDF viewer elements
      if (!pageDetected) {
        try {
          const iframeWindow = iframe.contentWindow
          const iframeDoc = iframeWindow?.document
          
          if (iframeDoc) {
            // Try to find PDF viewer page indicator
            const pageIndicator = iframeDoc.querySelector('[data-page-number]') as HTMLElement
            if (pageIndicator) {
              const pageNum = parseInt(pageIndicator.getAttribute('data-page-number') || '0')
              if (pageNum > 0) {
                pageDetected = pageNum
              }
            }
            
            // Alternative: Check for page number in title or other elements
            if (!pageDetected) {
              const titleMatch = iframeDoc.title?.match(/page\s+(\d+)/i)
              if (titleMatch) {
                pageDetected = parseInt(titleMatch[1])
              }
            }
          }
        } catch (err) {
          // Cross-origin - can't access
        }
      }

      // Method 3: Check iframe src attribute (fallback)
      if (!pageDetected) {
        try {
          const iframeSrc = iframe.src
          const hashMatch = iframeSrc.match(/#page=(\d+)/)
          if (hashMatch) {
            pageDetected = parseInt(hashMatch[1])
          }
        } catch (err) {
          // Can't access
        }
      }

      // Update state if page was detected and it's different
      if (pageDetected && pageDetected >= 1 && pageDetected <= totalPages) {
        if (pageDetected !== lastPageRef.current && pageDetected !== currentPage) {
          console.log('📄 Page changed via scrolling:', pageDetected)
          
          // Mark that this is from scrolling (don't recreate iframe)
          isScrollingRef.current = true
          
          // Update state - this will trigger progress bar update
          // But won't recreate iframe because of isScrollingRef flag
          setCurrentPage(pageDetected)
          setViewedPages(prev => new Set([...prev, pageDetected!]))
          if (pageDetected > highestPageReached) {
            setHighestPageReached(pageDetected)
          }
          lastPageRef.current = pageDetected
          // Call onPageChange callback
          onPageChange?.(pageDetected)
        }
      }
    }
    
    // Check on iframe load events
    const handleIframeLoad = () => {
      // Small delay to let PDF viewer update hash
      setTimeout(() => {
        checkPageChange()
      }, 200)
    }
    
    iframe.addEventListener('load', handleIframeLoad)
    
    // Listen for scroll/wheel events - navigate pages like arrow keys
    let scrollTimeout: NodeJS.Timeout | null = null
    let lastScrollTime = 0
    const SCROLL_THROTTLE = 500 // Minimum time between page changes (ms)
    
    const handleWheel = (e: WheelEvent) => {
      // Skip if we're programmatically navigating
      if (isNavigatingRef.current) {
        return
      }
      
      // Throttle scroll events to avoid too many page changes
      const now = Date.now()
      if (now - lastScrollTime < SCROLL_THROTTLE) {
        return
      }
      
      // Detect scroll direction
      const deltaY = e.deltaY
      const isScrollingDown = deltaY > 0
      const isScrollingUp = deltaY < 0
      
      // Clear previous timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      
      // Wait a bit to see if user continues scrolling
      scrollTimeout = setTimeout(() => {
        // Mark that this is from scrolling (don't recreate iframe)
        isScrollingRef.current = true
        
        if (isScrollingDown && currentPage < totalPages) {
          // Scroll down = Next page (like Arrow Down/Right)
          console.log('📄 Scrolling down → Next page')
          const nextPage = currentPage + 1
          goToPage(nextPage, true) // true = from scroll, don't recreate iframe
          lastScrollTime = now
        } else if (isScrollingUp && currentPage > 1) {
          // Scroll up = Previous page (like Arrow Up/Left)
          console.log('📄 Scrolling up → Previous page')
          const prevPage = currentPage - 1
          goToPage(prevPage, true) // true = from scroll, don't recreate iframe
          lastScrollTime = now
        }
        
        // Reset scroll flag after navigation
        setTimeout(() => {
          isScrollingRef.current = false
        }, 300)
      }, 150) // Wait 150ms to see if scroll continues
    }
    
    // Listen to mouse wheel on the container (more reliable than iframe)
    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: true })
      console.log('📄 Added wheel listener to container')
    }
    
    // Also try on iframe element
    iframe.addEventListener('wheel', handleWheel, { passive: true })
    
    // Also try to listen inside iframe (might not work due to cross-origin)
    try {
      const iframeWindow = iframe.contentWindow
      if (iframeWindow) {
        iframeWindow.addEventListener('wheel', handleWheel as EventListener, { passive: true, capture: true })
      }
    } catch (e) {
      // Cross-origin - that's okay
    }
    
    // Also check periodically for scroll-based navigation
    // More frequent checking for better responsiveness when scrolling
    const checkInterval = setInterval(checkPageChange, 200) // Check every 200ms

    return () => {
      clearInterval(checkInterval)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      iframe.removeEventListener('load', handleIframeLoad)
      iframe.removeEventListener('wheel', handleWheel)
      if (container) {
        container.removeEventListener('wheel', handleWheel)
      }
      try {
        const iframeWindow = iframe.contentWindow
        if (iframeWindow) {
          iframeWindow.removeEventListener('wheel', handleWheel as EventListener, true)
        }
      } catch (e) {
        // Ignore
      }
    }
  }, [totalPages, highestPageReached, currentPage, onPageChange, goToPage])

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if not typing in input field
      if (e.target instanceof HTMLInputElement) return

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        if (currentPage < totalPages) {
          goToPage(currentPage + 1)
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        if (currentPage > 1) {
          goToPage(currentPage - 1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPage, totalPages, goToPage])

  // Auto-complete when reaching last page
  useEffect(() => {
    if (reachedLastPage && !isCompleted) {
      setIsCompleted(true)
      onComplete()
    }
  }, [reachedLastPage, isCompleted, onComplete])

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = fileName
    link.click()
  }

  // Calculate progress based on current page (for progress bar)
  const viewedPagesCount = viewedPages.size
  // Use currentPage for progress bar to show real-time position
  const progressPercent = totalPages > 0 ? (currentPage / totalPages) * 100 : 0
  const pageProgressPercent = totalPages > 0 ? (currentPage / totalPages) * 100 : 0

  return (
    <div className={`${isPanelMode ? 'fixed top-0 left-0 right-0 h-1/2 z-40 bg-black/90' : 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center'}`}>
      <Card className={`w-full h-full flex flex-col ${isPanelMode ? 'rounded-lg' : 'rounded-none'}`}>
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

          {/* Loading State */}
          {isLoadingPDF && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Detecting PDF pages...</span>
            </div>
          )}

          {/* Progress Tracking */}
          {!isLoadingPDF && totalPages > 0 && (
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
                      {viewedPagesCount} of {totalPages} viewed
                    </Badge>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Page Progress</span>
                  <span>Page {currentPage} / {totalPages}</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>
          )}

          {!isLoadingPDF && totalPages > 0 && !reachedLastPage && (
            <Alert className="mt-2 border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-800">
                📖 Navigate to page {totalPages} - Use Next/Previous buttons, arrow keys (← →), or scroll through the PDF viewer.
              </AlertDescription>
            </Alert>
          )}
          
          {!isLoadingPDF && totalPages > 0 && highestPageReached > 1 && !isCompleted && (
            <div className="text-xs text-gray-600 mt-1 flex items-center justify-between">
              <span>Highest page reached: {highestPageReached} of {totalPages}</span>
              <span className="text-blue-600">{Math.round((highestPageReached / totalPages) * 100)}% through</span>
            </div>
          )}
          
          {isCompleted && (
            <Alert className="mt-2 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-xs text-green-800">
                ✅ You've reached the last page! Quiz will be generated automatically.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent 
          ref={containerRef}
          className="flex-1 overflow-hidden p-0 relative"
          onWheel={(e) => {
            // Handle wheel directly on container - this is the most reliable method
            const now = Date.now()
            const deltaY = e.deltaY
            
            // Throttle to avoid too many page changes
            if (now - lastWheelTimeRef.current < 500) {
              return
            }
            
            // Only if significant scroll
            if (Math.abs(deltaY) > 10 && !isNavigatingRef.current) {
              const isScrollingDown = deltaY > 0
              const isScrollingUp = deltaY < 0
              
              console.log('📄 Wheel event detected:', { deltaY, isScrollingDown, isScrollingUp, currentPage })
              
              if (isScrollingDown && currentPage < totalPages) {
                lastWheelTimeRef.current = now
                console.log('📄 Scrolling down → Next page')
                goToPage(currentPage + 1, true)
              } else if (isScrollingUp && currentPage > 1) {
                lastWheelTimeRef.current = now
                console.log('📄 Scrolling up → Previous page')
                goToPage(currentPage - 1, true)
              }
            }
          }}
        >
          {/* PDF Viewer with page parameter and scrolling support */}
          {/* Use key to force iframe reload ONLY when programmatically navigating (button/arrow) */}
          {/* When scrolling, key stays same so iframe doesn't reload */}
          <iframe
            key={`pdf-page-${iframeKeyRef.current}`}
            ref={iframeRef}
            src={`${fileUrl.split('#')[0]}#page=${currentPage}&view=FitH`}
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
              disabled={isLoadingPDF || currentPage === 1}
              title={currentPage === 1 ? "Already at first page" : "Previous page"}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={isLoadingPDF || currentPage === totalPages}
              title={currentPage === totalPages ? "Already at last page" : "Next page"}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isLoadingPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          
          {/* Page input */}
          {!isLoadingPDF && totalPages > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Jump to:</span>
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
                placeholder="Page"
              />
              <span className="text-xs text-gray-500">of {totalPages}</span>
            </div>
          )}
          
          {isLoadingPDF && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          )}
          
          {isCompleted && (
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Content Completed - Quiz will be generated automatically
              </Badge>
              {/* REMOVED Continue button - Quiz generation happens automatically, viewer stays open */}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

