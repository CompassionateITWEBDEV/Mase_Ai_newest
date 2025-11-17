/**
 * PDF.co OCR Service
 * Handles document OCR processing using PDF.co API
 */

export interface OCRResult {
  success: boolean
  text: string
  error?: string
}

export class PDFcoService {
  private apiKey: string
  private baseUrl = "https://api.pdf.co/v1"

  constructor() {
    this.apiKey = process.env.PDFCO_API_KEY || process.env.PDF_CO_API_KEY || ""
    
    if (!this.apiKey) {
      console.warn("⚠️ PDF.co API key not found. Set PDFCO_API_KEY or PDF_CO_API_KEY in .env.local")
    }
  }

  /**
   * Upload file to PDF.co temporary storage
   */
  async uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    try {
      const formData = new FormData()
      const blob = new Blob([fileBuffer])
      formData.append("file", blob, fileName)

      const response = await fetch(`${this.baseUrl}/file/upload`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.message || "Failed to upload file to PDF.co")
      }

      return data.url
    } catch (error) {
      console.error("PDF.co upload error:", error)
      throw error
    }
  }

  /**
   * Perform OCR on an uploaded file URL (async mode for large files)
   */
  async performOCR(fileUrl: string): Promise<OCRResult> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          text: "",
          error: "PDF.co API key not configured",
        }
      }

      // Start async OCR job
      console.log("Starting async OCR job for:", fileUrl)
      const response = await fetch(`${this.baseUrl}/pdf/convert/to/text`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: fileUrl,
          inline: false, // Use async mode
          async: true,   // Enable async processing
          pages: "",     // Process all pages
          name: "ocr-result.txt",
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.message || "OCR job failed to start")
      }

      const jobId = data.jobId
      const resultUrl = data.url

      if (!jobId) {
        throw new Error("No job ID returned from PDF.co")
      }

      console.log("OCR job started, jobId:", jobId)

      // Poll job status until complete (max 5 minutes for large PDFs)
      const maxAttempts = 60 // 60 attempts * 5 seconds = 300 seconds (5 minutes)
      let attempts = 0

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
        attempts++

        console.log(`Checking job status (attempt ${attempts}/${maxAttempts})...`)

        const statusResponse = await fetch(`${this.baseUrl}/job/check?jobid=${jobId}`, {
          headers: {
            "x-api-key": this.apiKey,
          },
        })

        const statusData = await statusResponse.json()

        if (statusData.status === "success") {
          console.log("✅ OCR job completed successfully")
          
          // Download the result
          const textResponse = await fetch(statusData.url)
          const text = await textResponse.text()

          return {
            success: true,
            text: text || "",
          }
        } else if (statusData.status === "error" || statusData.status === "aborted") {
          throw new Error(`OCR job failed: ${statusData.error || "Unknown error"}`)
        }

        // Still working, continue polling
        console.log(`Job status: ${statusData.status}`)
      }

      throw new Error("OCR processing timeout - job took too long")
    } catch (error) {
      console.error("PDF.co OCR error:", error)
      return {
        success: false,
        text: "",
        error: error instanceof Error ? error.message : "OCR failed",
      }
    }
  }

  /**
   * Process image file (PNG, JPG) with OCR
   */
  async processImage(fileBuffer: Buffer, fileName: string): Promise<OCRResult> {
    try {
      // Upload file first
      const fileUrl = await this.uploadFile(fileBuffer, fileName)
      console.log("File uploaded to:", fileUrl)

      // Perform OCR
      const ocrResult = await this.performOCR(fileUrl)
      return ocrResult
    } catch (error) {
      console.error("Image processing error:", error)
      return {
        success: false,
        text: "",
        error: error instanceof Error ? error.message : "Failed to process image",
      }
    }
  }

  /**
   * Process PDF file with OCR
   */
  async processPDF(fileBuffer: Buffer, fileName: string): Promise<OCRResult> {
    try {
      // Upload file first
      const fileUrl = await this.uploadFile(fileBuffer, fileName)
      console.log("PDF uploaded to:", fileUrl)

      // Perform OCR
      const ocrResult = await this.performOCR(fileUrl)
      return ocrResult
    } catch (error) {
      console.error("PDF processing error:", error)
      return {
        success: false,
        text: "",
        error: error instanceof Error ? error.message : "Failed to process PDF",
      }
    }
  }
}

// Export singleton instance
export const pdfcoService = new PDFcoService()

