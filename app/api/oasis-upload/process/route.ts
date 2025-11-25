import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { analyzeOasisDocument } from "@/lib/oasis-ai-analyzer"
import { pdfcoService } from "@/lib/pdfco-service"

function sanitizeText(value: any): string {
  // Handle null, undefined, or non-string values
  if (value === null || value === undefined) return ""

  // Convert to string if not already
  const text = typeof value === "string" ? value : String(value)

  // Remove problematic characters
  return text
    .replace(/\u0000/g, "") // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove other control characters
    .replace(/\uFFFD/g, "") // Remove replacement characters
    .trim()
}

function safeExtract(obj: any, defaultValue = ""): string {
  if (!obj) return defaultValue
  if (typeof obj === "string") return sanitizeText(obj)
  if (typeof obj === "object" && obj.description) return sanitizeText(obj.description)
  if (typeof obj === "object" && obj.code) return sanitizeText(obj.code)
  return sanitizeText(String(obj))
}

export async function POST(request: NextRequest) {
  try {
    console.log("[OASIS] === Starting file processing ===")
    
    const formData = await request.formData()
    const file = formData.get("file") as File
    const uploadId = formData.get("uploadId") as string
    const uploadType = formData.get("uploadType") as string
    const priority = formData.get("priority") as string
    const fileType = formData.get("fileType") as string // "oasis" or "doctor-order"
    const patientId = formData.get("patientId") as string | null
    const notes = formData.get("notes") as string | null
    const assessmentId = formData.get("assessmentId") as string | null

    console.log("[OASIS] Received request:", { uploadId, fileType, fileName: file?.name })

    if (!file || !uploadId || !uploadType || !priority || !fileType) {
      console.error("[OASIS] Missing required fields:", { 
        hasFile: !!file, 
        hasUploadId: !!uploadId, 
        hasUploadType: !!uploadType, 
        hasPriority: !!priority, 
        hasFileType: !!fileType 
      })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check API keys
    const pdfcoKey = process.env.PDFCO_API_KEY || process.env.PDF_CO_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY
    
    console.log("[OASIS] Environment configured:", {
      hasPdfcoKey: !!pdfcoKey,
      hasOpenaiKey: !!openaiKey
    })

    if (!pdfcoKey) {
      console.error("[OASIS] ❌ PDFCO_API_KEY is not configured!")
      return NextResponse.json({ 
        error: "Server configuration error: PDFCO_API_KEY is missing. Please add it to .env.local and restart the server." 
      }, { status: 500 })
    }

    if (!openaiKey) {
      console.error("[OASIS] ❌ OPENAI_API_KEY is not configured!")
      return NextResponse.json({ 
        error: "Server configuration error: OPENAI_API_KEY is missing. Please add it to .env.local and restart the server." 
      }, { status: 500 })
    }

    // Create Supabase client for file upload
    console.log("[OASIS] Creating Supabase client for file storage...")
    const supabase = createServiceClient()

    // Upload file to Supabase Storage
    let fileUrl: string
    try {
      const fileBuffer = await file.arrayBuffer()
      const fileName = `${uploadId}/${file.name}`
      
      console.log("[OASIS] Uploading file to Supabase Storage:", fileName)
      
      // Create bucket if it doesn't exist (will fail silently if it exists)
      await supabase.storage.createBucket('oasis-uploads', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
      })
      
      // Upload file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('oasis-uploads')
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: true,
        })

      if (uploadError) {
        console.error("[OASIS] ❌ Supabase upload error:", uploadError)
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('oasis-uploads')
        .getPublicUrl(fileName)

      fileUrl = urlData.publicUrl
      console.log("[OASIS] File uploaded successfully:", fileUrl)
    } catch (storageError) {
      console.error("[OASIS] ❌ File upload failed:", storageError)
      throw new Error("Failed to upload file to storage: " + (storageError instanceof Error ? storageError.message : "Unknown error"))
    }

    // Extract text using PDF.co OCR service
    console.log("[OASIS] Extracting text from document using PDF.co OCR...")
    let fileText = ""
    
    try {
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const fileExtension = file.name.toLowerCase().split('.').pop()
      
      let ocrResult
      if (fileExtension === 'pdf') {
        ocrResult = await pdfcoService.processPDF(fileBuffer, file.name)
      } else if (['jpg', 'jpeg', 'png', 'tiff', 'tif'].includes(fileExtension || '')) {
        ocrResult = await pdfcoService.processImage(fileBuffer, file.name)
      } else {
        // For text files, read directly
        fileText = await file.text()
        console.log("[OASIS] Text file read directly, length:", fileText.length)
      }
      
      if (ocrResult) {
        if (!ocrResult.success) {
          throw new Error(ocrResult.error || "PDF.co OCR extraction failed")
        }
        fileText = ocrResult.text
        console.log("[OASIS] ✅ PDF.co OCR extraction successful!")
        console.log("[OASIS] 📄 Total extracted text length:", fileText.length, "characters")
        console.log("[OASIS] 📊 Estimated pages:", Math.ceil(fileText.length / 2000))
        console.log("[OASIS] 📝 First 500 chars:", fileText.substring(0, 500))
      }
    } catch (ocrError) {
      console.error("[OASIS] OCR extraction error:", ocrError)
      // Fallback to trying direct text extraction
      try {
        fileText = await file.text()
        console.log("[OASIS] Fallback: text extracted directly")
      } catch (fallbackError) {
        throw new Error("Failed to extract text from document: " + (ocrError instanceof Error ? ocrError.message : "Unknown error"))
      }
    }

    if (!fileText || fileText.length < 10) {
      throw new Error("Extracted text is empty or too short. Please ensure the document contains readable text.")
    }

    console.log("[OASIS] Supabase client ready for database operations")

    if (fileType === "oasis") {
      console.log("[OASIS] Analyzing OASIS document with AI...")
      console.log("[OASIS] 📋 Configuration:", {
        qaType: uploadType,
        priority: priority,
        patientId: patientId || 'None',
        hasNotes: !!notes
      })
      
      const analysis = await analyzeOasisDocument(fileText, undefined, {
        qaType: uploadType as 'comprehensive-qa' | 'coding-review' | 'financial-optimization' | 'qapi-audit',
        notes: notes || '',
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        patientId: patientId || ''
      })

      console.log("[OASIS] ✅ Analysis completed!")
      console.log("[OASIS] 📊 Quality Metrics:", {
        qualityScore: analysis.qualityScore,
        confidenceScore: analysis.confidenceScore,
        completenessScore: analysis.completenessScore,
      })
      console.log("[OASIS] 👤 Patient Info:", {
        name: analysis.patientInfo.name,
        mrn: analysis.patientInfo.mrn,
        payor: analysis.patientInfo.payor,
        clinician: analysis.patientInfo.clinician,
      })
      console.log("[OASIS] 🏥 Primary Diagnosis:", {
        code: analysis.primaryDiagnosis?.code,
        description: analysis.primaryDiagnosis?.description?.substring(0, 50),
      })
      console.log("[OASIS] 🏥 Secondary Diagnoses Count:", analysis.secondaryDiagnoses?.length || 0)
      console.log("[OASIS] 💰 Financial Impact:", {
        current: analysis.financialImpact?.currentRevenue,
        optimized: analysis.financialImpact?.optimizedRevenue,
        increase: analysis.financialImpact?.increase,
      })
      console.log("[OASIS] ⚠️ Flagged Issues:", analysis.flaggedIssues?.length || 0)

      // Helper to validate and parse date - returns null if invalid
      const parseValidDate = (dateValue: any): string | null => {
        if (!dateValue) return null
        if (typeof dateValue !== 'string') return null
        // Check for invalid date strings
        const invalidPatterns = ['Not visible', 'Not found', 'N/A', 'Unknown', 'not visible', 'not found']
        if (invalidPatterns.some(pattern => dateValue.toLowerCase().includes(pattern.toLowerCase()))) {
          return null
        }
        // Try to parse the date
        const parsed = new Date(dateValue)
        if (isNaN(parsed.getTime())) {
          console.log('[OASIS] ⚠️ Invalid date format:', dateValue)
          return null
        }
        return parsed.toISOString()
      }

      const insertData = {
        upload_id: uploadId,
        patient_id: patientId,
        patient_name: sanitizeText(analysis.patientInfo?.name),
        mrn: sanitizeText(analysis.patientInfo?.mrn),
        visit_type: sanitizeText(analysis.patientInfo?.visitType),
        payor: sanitizeText(analysis.patientInfo?.payor),
        visit_date: parseValidDate(analysis.patientInfo?.visitDate) || new Date().toISOString(),
        clinician_name: sanitizeText(analysis.patientInfo?.clinician),
        file_name: file.name,
        file_size: file.size,
        file_url: fileUrl,
        file_type: file.type,
        upload_type: uploadType,
        priority,
        notes: sanitizeText(notes),
        status: "completed",
        processed_at: new Date().toISOString(),
        extracted_text: sanitizeText(fileText.substring(0, 10000)),
        // Store FULL diagnosis objects, not just strings
        primary_diagnosis: analysis.primaryDiagnosis || {
          code: "Not visible",
          description: "Not visible",
          confidence: 0
        },
        secondary_diagnoses: Array.isArray(analysis.secondaryDiagnoses)
          ? analysis.secondaryDiagnoses
          : [],
        // Store functional status, medications, extracted data, missing info, inconsistencies
        functional_status: analysis.functionalStatus || [],
        medications: analysis.medications || [],
        extracted_data: {
          ...(analysis.extractedData || {}),
          // Ensure patientInfo is included in extracted_data
          patientInfo: analysis.patientInfo || null
        },
        missing_information: analysis.missingInformation || [],
        inconsistencies: analysis.inconsistencies || [],
        debug_info: analysis.debugInfo || {},
        suggested_codes: analysis.suggestedCodes || [],
        corrections: analysis.corrections || [],
        risk_factors: analysis.riskFactors || [],
        recommendations: analysis.recommendations || [],
        flagged_issues: analysis.flaggedIssues || [],
        quality_score: analysis.qualityScore || 70,
        confidence_score: analysis.confidenceScore || 70,
        completeness_score: analysis.completenessScore || 70,
        current_revenue: analysis.financialImpact?.currentRevenue || 0,
        optimized_revenue: analysis.financialImpact?.optimizedRevenue || 0,
        revenue_increase: analysis.financialImpact?.increase || 0,
        financial_impact: analysis.financialImpact || {},
      }

      console.log("[OASIS] Inserting assessment into database...")

      const { data: assessment, error } = await supabase.from("oasis_assessments").insert(insertData).select().single()

      if (error) {
        console.error("[OASIS] Database error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw new Error(`Failed to store assessment: ${error.message}`)
      }

      console.log("[OASIS] Assessment stored in database:", assessment.id)

      return NextResponse.json({
        success: true,
        message: "OASIS assessment processed successfully",
        assessmentId: uploadId,
        analysis: {
          qualityScore: analysis.qualityScore,
          confidence: analysis.confidenceScore,
          financialImpact: analysis.financialImpact.increase,
          flaggedIssues: analysis.flaggedIssues,
        },
      })
    } else if (fileType === "doctor-order") {
      if (!assessmentId) {
        return NextResponse.json({ error: "Assessment ID required for doctor orders" }, { status: 400 })
      }

      console.log("[OASIS] Processing doctor's order for assessment:", assessmentId)

      // Get the OASIS assessment
      const { data: assessment, error: fetchError } = await supabase
        .from("oasis_assessments")
        .select("extracted_text")
        .eq("upload_id", assessmentId)
        .single()

      if (fetchError || !assessment) {
        console.error("[OASIS] Error fetching assessment:", fetchError)
        return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
      }

      console.log("[OASIS] 📋 Configuration for doctor order analysis:", {
        qaType: uploadType,
        priority: priority,
        patientId: patientId || 'None',
        hasNotes: !!notes
      })

      const analysis = await analyzeOasisDocument(assessment.extracted_text, fileText, {
        qaType: uploadType as 'comprehensive-qa' | 'coding-review' | 'financial-optimization' | 'qapi-audit',
        notes: notes || '',
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        patientId: patientId || ''
      })

      const { error: orderError } = await supabase.from("doctor_orders").insert({
        assessment_id: assessmentId,
        upload_id: uploadId,
        file_name: file.name,
        file_size: file.size,
        file_url: fileUrl,
        file_type: file.type,
        extracted_text: sanitizeText(fileText.substring(0, 10000)),
        matches_oasis: analysis.flaggedIssues.length === 0,
        discrepancies: analysis.flaggedIssues,
      })

      if (orderError) {
        console.error("[OASIS] Error storing doctor order:", orderError)
        throw new Error("Failed to store doctor order")
      }

      await supabase
        .from("oasis_assessments")
        .update({
          flagged_issues: analysis.flaggedIssues,
          updated_at: new Date().toISOString(),
        })
        .eq("upload_id", assessmentId)

      console.log("[OASIS] Doctor order processed and stored")

      return NextResponse.json({
        success: true,
        message: "Doctor order processed and compared with OASIS assessment",
        assessmentId,
        discrepancies: analysis.flaggedIssues.length,
      })
    }

    return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
  } catch (error) {
    console.error("[OASIS] ❌ Processing error:", error)
    console.error("[OASIS] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[OASIS] Error message:", errorMessage)
    
    return NextResponse.json(
      {
        error: "Failed to process file",
        details: errorMessage,
        help: "Check server console for detailed logs. Ensure PDFCO_API_KEY and OPENAI_API_KEY are set in .env.local"
      },
      { status: 500 },
    )
  }
}
