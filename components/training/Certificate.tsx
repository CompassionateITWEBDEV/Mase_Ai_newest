"use client"

import { useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Award, CheckCircle, Star, Loader2 } from "lucide-react"

interface CertificateProps {
  staffName: string
  trainingTitle: string
  completionDate: string
  ceuHours?: number
  score?: number
  certificateId: string
  organizationName?: string
  onBackToDashboard?: () => void
}

export function Certificate({
  staffName,
  trainingTitle,
  completionDate,
  ceuHours,
  score,
  certificateId,
  organizationName = "M.A.S.E Healthcare",
  onBackToDashboard,
}: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const handleDownload = async () => {
    if (!certificateRef.current) {
      setDownloadError("Certificate element not found")
      return
    }

    setIsDownloading(true)
    setDownloadError(null)

    try {
      // Import html2canvas dynamically
      const html2canvas = (await import("html2canvas")).default
      
      // Wait a bit to ensure all content is rendered
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Create a function to recursively copy computed styles to inline styles
      const applyComputedStyles = (originalEl: HTMLElement, clonedEl: HTMLElement) => {
        const computed = window.getComputedStyle(originalEl)
        
        // Remove all class names to prevent CSS variable references
        clonedEl.removeAttribute('class')
        
        // List of all style properties we need to copy
        const styleProps = [
          'backgroundColor', 'color', 'borderColor', 'borderTopColor',
          'borderRightColor', 'borderBottomColor', 'borderLeftColor',
          'width', 'height', 'padding', 'paddingTop', 'paddingRight', 
          'paddingBottom', 'paddingLeft', 'margin', 'marginTop', 
          'marginRight', 'marginBottom', 'marginLeft',
          'border', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
          'borderWidth', 'borderStyle', 'borderRadius',
          'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'lineHeight',
          'textAlign', 'textDecoration', 'display', 'position', 
          'top', 'left', 'right', 'bottom', 'zIndex',
          'opacity', 'transform', 'boxShadow', 'backgroundImage',
          'backgroundSize', 'backgroundPosition', 'backgroundRepeat',
          'flexDirection', 'justifyContent', 'alignItems', 'gap',
          'gridTemplateColumns', 'gridTemplateRows', 'gridGap'
        ]
        
        styleProps.forEach(prop => {
          try {
            const value = computed[prop as keyof CSSStyleDeclaration] as string
            if (value && value !== 'none' && value !== 'auto' && value !== 'normal') {
              // Skip any values that contain CSS variables or oklch
              if (value.includes('var(') || value.includes('oklch')) {
                return
              }
              
              // For color properties, only use RGB/RGBA/hex values
              if (prop.includes('Color')) {
                // Browser automatically converts oklch to RGB in computed styles
                if (value.startsWith('rgb') || value.startsWith('#') || 
                    ['transparent', 'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple'].includes(value.toLowerCase())) {
                  (clonedEl.style as any)[prop] = value
                }
              } else {
                (clonedEl.style as any)[prop] = value
              }
            }
          } catch (e) {
            // Ignore errors for individual properties
          }
        })
        
        // Process children recursively
        const originalChildren = Array.from(originalEl.children) as HTMLElement[]
        const clonedChildren = Array.from(clonedEl.children) as HTMLElement[]
        
        originalChildren.forEach((originalChild, index) => {
          const clonedChild = clonedChildren[index]
          if (clonedChild && originalChild) {
            applyComputedStyles(originalChild, clonedChild)
          }
        })
      }
      
      // Function to sanitize HTML string and remove any oklch references
      const sanitizeHTML = (html: string): string => {
        // Remove oklch() color functions from style attributes
        return html.replace(/oklch\([^)]+\)/gi, (match) => {
          // Try to convert oklch to rgb if possible, otherwise use fallback
          // For now, just replace with a safe fallback color
          return 'rgb(128, 128, 128)'
        }).replace(/var\([^)]+\)/gi, '') // Remove CSS variable references
      }
      
      // Clone the element and apply all computed styles as inline styles
      const clonedElement = certificateRef.current.cloneNode(true) as HTMLElement
      applyComputedStyles(certificateRef.current, clonedElement)
      
      // Get sanitized HTML
      let sanitizedHTML = sanitizeHTML(clonedElement.outerHTML)
      
      // Use an isolated iframe from the start to completely avoid parent document stylesheets
      // This is the only reliable way to prevent html2canvas from parsing oklch
      const iframe = document.createElement('iframe')
      iframe.style.position = 'absolute'
      iframe.style.left = '-9999px'
      iframe.style.top = '0'
      iframe.style.width = `${certificateRef.current.scrollWidth + 100}px`
      iframe.style.height = `${certificateRef.current.scrollHeight + 100}px`
      iframe.style.border = 'none'
      document.body.appendChild(iframe)
      
      // Wait for iframe to be ready
      await new Promise(resolve => {
        if (iframe.contentDocument) {
          resolve(undefined)
        } else {
          iframe.onload = () => resolve(undefined)
        }
      })
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) {
        throw new Error('Failed to access iframe document')
      }
      
      // Write the certificate HTML to the iframe
      // All styles are already inline from applyComputedStyles (RGB only, no oklch)
      // We'll load html2canvas in the iframe and execute it there
      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background: white;
                padding: 0;
                margin: 0;
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              #certificate-wrapper {
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
              }
            </style>
            <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
          </head>
          <body>
            <div id="certificate-wrapper">
              ${sanitizedHTML}
            </div>
            <script>
              (async function() {
                try {
                  // Wait for html2canvas to load
                  let h2c = window.html2canvas;
                  if (!h2c) {
                    await new Promise((resolve) => {
                      const check = setInterval(() => {
                        if (window.html2canvas) {
                          clearInterval(check);
                          resolve(undefined);
                        }
                      }, 50);
                      setTimeout(() => {
                        clearInterval(check);
                        resolve(undefined);
                      }, 5000);
                    });
                    h2c = window.html2canvas;
                  }
                  
                  // Wait for jsPDF to load
                  let jsPDF = window.jspdf?.jsPDF;
                  if (!jsPDF) {
                    await new Promise((resolve) => {
                      const check = setInterval(() => {
                        if (window.jspdf?.jsPDF) {
                          clearInterval(check);
                          resolve(undefined);
                        }
                      }, 50);
                      setTimeout(() => {
                        clearInterval(check);
                        resolve(undefined);
                      }, 5000);
                    });
                    jsPDF = window.jspdf?.jsPDF;
                  }
                  
                  if (!h2c) {
                    window.parent.postMessage({ type: 'canvas-error', error: 'html2canvas failed to load' }, '*');
                    return;
                  }
                  
                  if (!jsPDF) {
                    window.parent.postMessage({ type: 'canvas-error', error: 'jsPDF failed to load' }, '*');
                    return;
                  }
                  
                  // Sanitize all styles in the document before html2canvas processes them
                  const allElements = document.querySelectorAll('*');
                  allElements.forEach(el => {
                    const computed = window.getComputedStyle(el);
                    const style = el.style;
                    // Remove any style properties that might contain oklch
                    for (let i = style.length - 1; i >= 0; i--) {
                      const prop = style[i];
                      const value = style.getPropertyValue(prop);
                      if (value && (value.includes('oklch') || value.includes('var('))) {
                        style.removeProperty(prop);
                      }
                    }
                  });
                  
                  // Get full dimensions to ensure nothing is cut off
                  const certElement = document.querySelector('#certificate-wrapper > *');
                  const baseWidth = ${certificateRef.current.scrollWidth};
                  const baseHeight = ${certificateRef.current.scrollHeight};
                  const fullWidth = certElement ? Math.max(certElement.scrollWidth, certElement.offsetWidth, baseWidth) : baseWidth;
                  const fullHeight = certElement ? Math.max(certElement.scrollHeight, certElement.offsetHeight, baseHeight) : baseHeight;
                  
                  const canvas = await h2c(document.body, {
                    scale: 3, // Higher scale for better quality and color accuracy
                    backgroundColor: "#ffffff",
                    useCORS: true,
                    logging: false,
                    width: fullWidth,
                    height: fullHeight,
                    windowWidth: fullWidth,
                    windowHeight: fullHeight,
                    allowTaint: true,
                    removeContainer: false,
                    imageTimeout: 0,
                    ignoreElements: function(element) {
                      // Ignore elements with problematic styles
                      return false;
                    },
                    onclone: function(clonedDoc) {
                      // Final sanitization pass on cloned document
                      const allElements = clonedDoc.querySelectorAll('*');
                      allElements.forEach(el => {
                        if (el.style) {
                          for (let i = el.style.length - 1; i >= 0; i--) {
                            const prop = el.style[i];
                            const value = el.style.getPropertyValue(prop);
                            if (value && (value.includes('oklch') || value.includes('var('))) {
                              el.style.removeProperty(prop);
                            }
                          }
                        }
                      });
                    }
                  });
                  
                  // Convert canvas to image data with maximum quality (PNG preserves colors best)
                  const imgData = canvas.toDataURL('image/png', 1.0);
                  
                  // Calculate PDF dimensions (A4 landscape or custom based on certificate size)
                  // Convert pixels to mm (1 inch = 96px, 1 inch = 25.4mm)
                  const pxToMm = 25.4 / 96;
                  const pdfWidth = fullWidth * pxToMm;
                  const pdfHeight = fullHeight * pxToMm;
                  
                  // Create PDF with custom dimensions to fit full certificate
                  const pdf = new jsPDF({
                    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
                    unit: 'mm',
                    format: [pdfWidth, pdfHeight]
                  });
                  
                  // Add image to PDF with maximum quality to preserve all colors
                  // 'SLOW' mode provides better quality and color accuracy
                  // PNG format already preserves colors, using SLOW ensures no compression artifacts
                  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'SLOW');
                  
                  // Convert PDF to blob and send to parent
                  const pdfBlob = pdf.output('blob');
                  const reader = new FileReader();
                  reader.onload = function() {
                    window.parent.postMessage({ 
                      type: 'pdf-ready', 
                      dataUrl: reader.result,
                      width: fullWidth,
                      height: fullHeight
                    }, '*');
                  };
                  reader.onerror = function() {
                    window.parent.postMessage({ 
                      type: 'canvas-error', 
                      error: 'Failed to convert PDF to data URL' 
                    }, '*');
                  };
                  reader.readAsDataURL(pdfBlob);
                } catch (error) {
                  // Enhanced error handling for oklch parsing errors
                  let errorMessage = error.message || 'Unknown error';
                  if (errorMessage.includes('oklch')) {
                    errorMessage = 'Color format not supported. Please try again.';
                  }
                  window.parent.postMessage({ 
                    type: 'canvas-error', 
                    error: errorMessage 
                  }, '*');
                }
              })();
            </script>
          </body>
        </html>
      `)
      iframeDoc.close()
      
      // Wait for iframe to send PDF data via postMessage
      const pdfDataUrl = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          window.removeEventListener('message', messageHandler)
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
          reject(new Error('Timeout waiting for PDF generation'))
        }, 30000)
        
        const messageHandler = (event: MessageEvent) => {
          if (event.data?.type === 'pdf-ready') {
            clearTimeout(timeout)
            window.removeEventListener('message', messageHandler)
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe)
            }
            resolve(event.data.dataUrl)
          } else if (event.data?.type === 'canvas-error') {
            clearTimeout(timeout)
            window.removeEventListener('message', messageHandler)
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe)
            }
            // Enhanced error message for oklch errors
            let errorMsg = event.data.error || 'PDF generation failed'
            if (errorMsg.includes('oklch') || errorMsg.includes('unsupported color')) {
              errorMsg = 'Color format not supported. Please try again or contact support.'
            }
            reject(new Error(errorMsg))
          }
        }
        
        window.addEventListener('message', messageHandler)
      })

      // Download PDF
      try {
        // Convert data URL to blob
        const response = await fetch(pdfDataUrl)
        const blob = await response.blob()
        
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        
        // Create a clean filename
        const cleanTitle = trainingTitle
          .replace(/[^a-z0-9\s-]/gi, "")
          .replace(/\s+/g, "_")
          .substring(0, 50)
        const cleanName = staffName
          .replace(/[^a-z0-9\s-]/gi, "")
          .replace(/\s+/g, "_")
          .substring(0, 30)
        
        link.download = `${cleanTitle}_${cleanName}_${certificateId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        setIsDownloading(false)
      } catch (error) {
        setDownloadError("Failed to generate certificate PDF")
        setIsDownloading(false)
        throw error
      }
    } catch (error) {
      console.error("Error downloading certificate:", error)
      setDownloadError(error instanceof Error ? error.message : "Failed to download certificate")
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Certificate Preview */}
      <div
        ref={certificateRef}
        id="certificate-content"
        className="relative overflow-hidden shadow-2xl"
        style={{ 
          minHeight: "600px",
          minWidth: "1000px",
          width: "100%",
          maxWidth: "1200px",
          backgroundColor: "#F5F5DC", // Cream/beige background
          border: "2px solid #D4AF37", // Thin gold border
          padding: "50px 80px",
          margin: "0 auto"
        }}
      >
        {/* Corner Decorations */}
        {/* Top-left: Blue geometric shapes with gold diagonal line */}
        <div className="absolute top-8 left-8 w-32 h-32 pointer-events-none">
          <svg width="128" height="128" viewBox="0 0 128 128" className="absolute">
            {/* Blue geometric shapes */}
            <polygon points="20,30 50,20 45,50 25,55" fill="#1e40af" opacity="0.7" />
            <polygon points="35,45 65,35 60,65 40,70" fill="#3b82f6" opacity="0.8" />
            <polygon points="15,60 45,50 40,80 20,85" fill="#2563eb" opacity="0.6" />
            {/* Gold diagonal line */}
            <line x1="10" y1="10" x2="118" y2="118" stroke="#D4AF37" strokeWidth="2" />
          </svg>
        </div>

        {/* Top-right: Ornate gold swirl */}
        <div className="absolute top-8 right-8 w-32 h-32 pointer-events-none">
          <svg width="128" height="128" viewBox="0 0 128 128" className="absolute">
            <path d="M64,20 Q80,30 85,50 Q90,70 75,85 Q60,100 40,95 Q20,90 15,70 Q10,50 25,35 Q40,20 64,20" 
                  fill="none" stroke="#D4AF37" strokeWidth="3" opacity="0.8" />
            <path d="M50,40 Q65,45 70,60 Q75,75 65,85 Q55,95 45,90 Q35,85 32,70 Q29,55 40,45 Q51,35 50,40" 
                  fill="none" stroke="#D4AF37" strokeWidth="2" opacity="0.6" />
          </svg>
        </div>

        {/* Bottom-left: Ornate gold swirl */}
        <div className="absolute bottom-8 left-8 w-32 h-32 pointer-events-none">
          <svg width="128" height="128" viewBox="0 0 128 128" className="absolute">
            <path d="M64,108 Q80,98 85,78 Q90,58 75,43 Q60,28 40,33 Q20,38 15,58 Q10,78 25,93 Q40,108 64,108" 
                  fill="none" stroke="#D4AF37" strokeWidth="3" opacity="0.8" />
            <path d="M50,88 Q65,83 70,68 Q75,53 65,43 Q55,33 45,38 Q35,43 32,58 Q29,73 40,83 Q51,93 50,88" 
                  fill="none" stroke="#D4AF37" strokeWidth="2" opacity="0.6" />
          </svg>
        </div>

        {/* Bottom-right: Blue geometric shapes with gold diagonal line */}
        <div className="absolute bottom-8 right-8 w-32 h-32 pointer-events-none">
          <svg width="128" height="128" viewBox="0 0 128 128" className="absolute">
            {/* Blue geometric shapes */}
            <polygon points="108,98 78,108 83,78 103,73" fill="#1e40af" opacity="0.7" />
            <polygon points="93,83 63,93 68,63 88,58" fill="#3b82f6" opacity="0.8" />
            <polygon points="113,68 83,78 88,48 108,43" fill="#2563eb" opacity="0.6" />
            {/* Gold diagonal line */}
            <line x1="118" y1="118" x2="10" y2="10" stroke="#D4AF37" strokeWidth="2" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Top Section with Company Name */}
          <div className="flex items-start justify-between mb-12">
            <div className="flex items-center gap-3">
              {/* Company Logo Placeholder */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Award className="h-8 w-8 text-white" />
              </div>
              <p 
                className="text-lg font-semibold"
                style={{ 
                  fontFamily: "Arial, sans-serif",
                  color: "#1e3a5f"
                }}
              >
                {organizationName}
              </p>
            </div>
          </div>

          {/* Main Title */}
          <div className="text-center mb-8">
            <h1 
              className="text-6xl font-bold mb-2"
              style={{ 
                fontFamily: "'Times New Roman', serif",
                color: "#1e3a5f",
                letterSpacing: "0.05em"
              }}
            >
              CERTIFICATE
            </h1>
            <h2 
              className="text-3xl font-bold"
              style={{ 
                fontFamily: "'Times New Roman', serif",
                color: "#1e3a5f",
                letterSpacing: "0.03em"
              }}
            >
              OF TRAINING
            </h2>
          </div>

          {/* Main Content */}
          <div className="text-center space-y-4 mb-8">
            <p 
              className="text-lg"
              style={{ 
                fontFamily: "'Times New Roman', serif",
                color: "#1e3a5f"
              }}
            >
              This is to Certify that
            </p>
            
            {/* Name with decorative lines */}
            <div className="my-6">
              <div className="w-full h-px bg-blue-900 mb-3 mx-auto" style={{ maxWidth: "700px" }}></div>
              <h2 
                className="text-5xl font-normal mb-3"
                style={{ 
                  fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive",
                  color: "#1e3a5f"
                }}
              >
                {staffName}
              </h2>
              <div className="w-full h-px bg-blue-900 mt-3 mx-auto" style={{ maxWidth: "700px" }}></div>
            </div>

            <p 
              className="text-lg leading-relaxed"
              style={{ 
                fontFamily: "'Times New Roman', serif",
                color: "#1e3a5f",
                maxWidth: "800px",
                margin: "0 auto"
              }}
            >
              Has Successfully Completed the {trainingTitle}
            </p>

            {ceuHours && (
              <p 
                className="text-base leading-relaxed mt-3"
                style={{ 
                  fontFamily: "'Times New Roman', serif",
                  color: "#1e3a5f",
                  maxWidth: "800px",
                  margin: "0 auto",
                  textAlign: "justify"
                }}
              >
                The program includes fundamental knowledge of workplace safety, hazard prevention, risk assessment, and emergency procedures.
              </p>
            )}

            <div className="mt-6">
              <p 
                className="text-lg"
                style={{ 
                  fontFamily: "'Times New Roman', serif",
                  color: "#1e3a5f"
                }}
              >
                {new Date(completionDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Signatures Section */}
          <div className="mt-12 flex items-end justify-center gap-24">
            {/* Left Signature */}
            <div className="text-center flex-1 max-w-xs">
              <div className="mb-2" style={{ height: "60px" }}>
                {/* Signature line placeholder */}
                <div className="w-full h-12 border-b-2 border-gray-400"></div>
              </div>
              <div className="h-px bg-gray-400 mb-2"></div>
              <p 
                className="text-base font-semibold mb-1"
                style={{ 
                  fontFamily: "'Times New Roman', serif",
                  color: "#1e3a5f"
                }}
              >
                Training Administrator
              </p>
              <p 
                className="text-sm"
                style={{ 
                  fontFamily: "'Times New Roman', serif",
                  color: "#1e3a5f"
                }}
              >
                Operation Manager
              </p>
            </div>

            {/* Center Seal */}
            <div className="flex-shrink-0 mb-4">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background: "radial-gradient(circle, #D4AF37 0%, #B8941F 100%)",
                  border: "3px solid #B8941F"
                }}
              >
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                  <Award className="h-12 w-12" style={{ color: "#D4AF37" }} />
                </div>
              </div>
              {/* Ribbon extension */}
              <div 
                className="w-1 h-8 mx-auto"
                style={{ backgroundColor: "#D4AF37" }}
              ></div>
            </div>

            {/* Right Signature */}
            <div className="text-center flex-1 max-w-xs">
              <div className="mb-2" style={{ height: "60px" }}>
                {/* Signature line placeholder */}
                <div className="w-full h-12 border-b-2 border-gray-400"></div>
              </div>
              <div className="h-px bg-gray-400 mb-2"></div>
              <p 
                className="text-base font-semibold mb-1"
                style={{ 
                  fontFamily: "'Times New Roman', serif",
                  color: "#1e3a5f"
                }}
              >
                Training Administrator
              </p>
              <p 
                className="text-sm"
                style={{ 
                  fontFamily: "'Times New Roman', serif",
                  color: "#1e3a5f"
                }}
              >
                Operation Manager
              </p>
            </div>
          </div>

          {/* Certificate ID */}
          <div className="mt-8 text-center">
            <p 
              className="text-xs"
              style={{ 
                fontFamily: "'Times New Roman', serif",
                color: "#666"
              }}
            >
              Certificate ID: {certificateId}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              onClick={handleDownload} 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Download as PDF
                </>
              )}
            </Button>
            {onBackToDashboard && (
              <Button onClick={onBackToDashboard} size="lg" variant="default" className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-5 w-5 mr-2" />
                Back
              </Button>
            )}
          </div>
          {downloadError && (
            <p className="text-center text-sm text-red-600 mt-4">
              {downloadError}
            </p>
          )}
          <p className="text-center text-sm text-gray-600 mt-4">
            Your certificate has been saved to your profile and can be accessed anytime.
          </p>
        </CardContent>
      </Card>

    </div>
  )
}

