import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { analyzeOasisDocument, analyzeOasisFast } from "@/lib/oasis-ai-analyzer"
import { pdfcoService } from "@/lib/pdfco-service"
import { analyzeClinicalDocument, analyzePlanOfCare, analyzeClinicalDocumentFast } from "@/lib/clinical-qa-analyzer"

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
    const fileType = formData.get("fileType") as string // "oasis" or "physician-order" or "pt-note" or "poc"
    const patientId = formData.get("patientId") as string | null
    const notes = formData.get("notes") as string | null
    const assessmentId = formData.get("assessmentId") as string | null
    const chartId = formData.get("chartId") as string | null

    console.log("[OASIS] Received request:", { uploadId, fileType, fileName: file?.name, chartId })
    console.log("[OASIS] 📋 Chart ID from formData:", chartId)

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
      console.log("[OASIS] Analyzing OASIS document with FULL AI analyzer for complete data extraction...")
      console.log("[OASIS] 📋 Configuration:", {
        qaType: uploadType,
        priority: priority,
        patientId: patientId || 'None',
        hasNotes: !!notes
      })
      
      // ⚠️ DEBUG: Check what M-codes are present in the extracted text
      const mCodes = ['M1800', 'M1810', 'M1820', 'M1830', 'M1840', 'M1845', 'M1850', 'M1860', 'M1870', 'M2001', 'M2010', 'M2020', 'M2030']
      const foundMCodes = mCodes.filter(code => fileText.includes(code))
      console.log("[OASIS] 🔍 M-codes found in extracted text:", foundMCodes.join(', ') || 'NONE')
      console.log("[OASIS] 🔍 Text contains 'Functional':", fileText.toLowerCase().includes('functional'))
      console.log("[OASIS] 🔍 Text contains 'Medication':", fileText.toLowerCase().includes('medication'))
      console.log("[OASIS] 🔍 Text contains 'Grooming':", fileText.toLowerCase().includes('grooming'))
      console.log("[OASIS] 🔍 Text contains 'Drug Regimen':", fileText.toLowerCase().includes('drug regimen'))
      
      let analysis: any
      
      // Track analysis start time
      const analysisStartTime = Date.now()
      const documentSize = fileText.length
      
      console.log("[OASIS] ⏱️ Starting SMART AI analysis at:", new Date(analysisStartTime).toISOString())
      console.log("[OASIS] 📄 Document size:", documentSize, "characters (~", Math.ceil(documentSize / 2000), "pages)")
      console.log("[OASIS] 📊 Analysis type:", uploadType)
      console.log("[OASIS] 🎯 Priority level:", priority)
      
      // ✅ SMART STRATEGY: Choose analyzer based on document size to avoid timeout
      let analyzerUsed = ''
      let textToAnalyze = fileText
      
      try {
        if (documentSize > 60000) {
          // VERY LARGE document (>60k chars / 30+ pages) - use smart chunking
          console.log("[OASIS] 🚀 LARGE DOCUMENT DETECTED - Using Smart Chunking + Fast Analyzer")
          analyzerUsed = 'Smart Chunking + Fast'
          
          // Extract key sections strategically to stay within AI token limits
          const sections = {
            demographics: fileText.substring(0, 5000),     // First 5k - patient info, visit info
            middle: fileText.substring(5000, 45000),       // Middle 40k - diagnoses, functional status
            medications: fileText.substring(45000, 65000), // Next 20k - medications section
            end: fileText.substring(Math.max(0, documentSize - 10000)) // Last 10k - signatures, notes
          }
          
          // Combine strategically (total ~75k chars - optimized for AI processing)
          textToAnalyze = `[PATIENT DEMOGRAPHICS]\n${sections.demographics}\n\n[ASSESSMENT DATA - DIAGNOSES & FUNCTIONAL STATUS]\n${sections.middle}\n\n[MEDICATIONS SECTION]\n${sections.medications}\n\n[END OF DOCUMENT - SIGNATURES & NOTES]\n${sections.end}`
          
          console.log("[OASIS] 📊 Smart extraction: Combined", textToAnalyze.length, "chars from", documentSize, "char document")
          
          analysis = await analyzeOasisFast(textToAnalyze, {
            qaType: uploadType as 'comprehensive-qa' | 'coding-review' | 'financial-optimization' | 'qapi-audit',
            notes: notes || '',
            priority: priority as 'low' | 'medium' | 'high' | 'urgent'
          })
          
        } else if (documentSize > 30000) {
          // LARGE document (30-60k chars / 15-30 pages) - use Fast analyzer with full text
          console.log("[OASIS] ⚡ MEDIUM-LARGE DOCUMENT - Using Fast Analyzer with full text")
          analyzerUsed = 'Fast (Full Text)'
          
          analysis = await analyzeOasisFast(fileText, {
            qaType: uploadType as 'comprehensive-qa' | 'coding-review' | 'financial-optimization' | 'qapi-audit',
            notes: notes || '',
            priority: priority as 'low' | 'medium' | 'high' | 'urgent'
          })
          
        } else {
          // NORMAL document (<30k chars / <15 pages) - use FULL two-pass analyzer
          console.log("[OASIS] 📊 NORMAL DOCUMENT - Using Full Two-Pass Analyzer")
          analyzerUsed = 'Full Two-Pass'
          
          analysis = await analyzeOasisDocument(fileText, undefined, {
            qaType: uploadType as 'comprehensive-qa' | 'coding-review' | 'financial-optimization' | 'qapi-audit',
            notes: notes || '',
            priority: priority as 'low' | 'medium' | 'high' | 'urgent',
            patientId: patientId || ''
          })
        }
        
        const analysisEndTime = Date.now()
        const analysisDuration = ((analysisEndTime - analysisStartTime) / 1000).toFixed(2)
        
        console.log("[OASIS] ✅ Analysis completed in:", analysisDuration, "seconds")
        console.log("[OASIS] 📊 Analyzer used:", analyzerUsed)
        console.log("[OASIS] 📊 Extracted data:")
        console.log("[OASIS]    - Patient Info:", !!analysis.patientInfo)
        console.log("[OASIS]    - Diagnoses:", (analysis.secondaryDiagnoses?.length || 0) + 1)
        console.log("[OASIS]    - Functional Status Items:", analysis.functionalStatus?.length || 0)
        console.log("[OASIS]    - Medications:", analysis.medications?.length || 0)
        console.log("[OASIS]    - Optimization Suggestions:", analysis.suggestedCodes?.length || 0)
        console.log("[OASIS]    - Financial Impact: $", analysis.financialImpact?.increase || 0)
        
      } catch (aiError) {
        const analysisEndTime = Date.now()
        const analysisDuration = ((analysisEndTime - analysisStartTime) / 1000).toFixed(2)
        console.error("[OASIS] ⚠️ Analysis failed after", analysisDuration, "seconds:", aiError)
        console.log("[OASIS] 🔄 Trying ultimate fallback...")
        
        // Ultimate fallback - try Fast analyzer one more time with reduced text
        try {
          const fastStartTime = Date.now()
          const reducedText = fileText.substring(0, 50000) // First 50k only
          console.log("[OASIS] 🔄 Fallback: Using first 50k chars only...")
          
          analysis = await analyzeOasisFast(reducedText, {
            qaType: uploadType as 'comprehensive-qa' | 'coding-review' | 'financial-optimization' | 'qapi-audit',
            notes: notes || '',
            priority: priority as 'low' | 'medium' | 'high' | 'urgent'
          })
          
          const fastEndTime = Date.now()
          const fastDuration = ((fastEndTime - fastStartTime) / 1000).toFixed(2)
          console.log("[OASIS] ✅ Fallback analyzer completed in:", fastDuration, "seconds")
        } catch (fastError) {
          console.error("[OASIS] ⚠️ All analyzers failed, using basic extraction:", fastError)
          // Extract basic info from text
          const mrnMatch = fileText.match(/MRN[:\s]*([A-Z0-9]+)/i)
          const nameMatch = fileText.match(/Patient(?:\s+Name)?[:\s]*([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)?)/i)
          
          // Provide a basic fallback analysis
          analysis = {
            patientInfo: {
              name: nameMatch ? nameMatch[1] : "Unknown Patient",
              mrn: mrnMatch ? mrnMatch[1] : "N/A",
              visitType: "OASIS",
              payor: "N/A",
              visitDate: new Date().toISOString().split('T')[0],
              clinician: "N/A"
            },
            primaryDiagnosis: { code: "N/A", description: "Unable to extract - AI timeout", confidence: 0 },
            secondaryDiagnoses: [],
            functionalStatus: [],
            medications: [],
            qualityScore: 60,
            confidenceScore: 50,
            completenessScore: 60,
            flaggedIssues: [{ issue: "AI analysis timed out - manual review recommended", severity: "high", category: "system" }],
            recommendations: [{ recommendation: "Manual review of OASIS document recommended due to AI timeout", priority: "high", category: "system" }],
            financialImpact: { currentRevenue: 0, optimizedRevenue: 0, potentialIncrease: 0 },
            suggestedCodes: []
          }
        }
      }

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

      // Ensure chart_id is always set - use provided chartId or generate consistent one
      const finalChartId = chartId && chartId.trim() !== '' ? chartId.trim() : `chart-${Date.now()}`
      console.log("[OASIS] 📋 Chart ID from formData:", chartId)
      console.log("[OASIS] 📋 Final chart_id to insert:", finalChartId)
      
      if (!finalChartId || finalChartId.trim() === '') {
        console.error("[OASIS] ❌ ERROR: finalChartId is empty!")
        throw new Error("chart_id cannot be empty")
      }
      
      const insertData = {
        upload_id: uploadId,
        patient_id: patientId,
        chart_id: finalChartId, // Ensure this is always a non-empty string
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
          patientInfo: analysis.patientInfo || null,
          // Store qapiAudit in extracted_data so QAPI report can find it
          qapiAudit: analysis.qapiAudit || undefined,
          // ⚠️ IMPORTANT: Include functionalStatus and medications in extracted_data
          // so the optimization API can find them
          functionalStatus: analysis.functionalStatus || [],
          medications: analysis.medications || [],
          // ✅ NEW: Include ALL clinical status sections in extracted_data
          painStatus: analysis.painStatus || [],
          integumentaryStatus: analysis.integumentaryStatus || [],
          respiratoryStatus: analysis.respiratoryStatus || [],
          cardiacStatus: analysis.cardiacStatus || [],
          eliminationStatus: analysis.eliminationStatus || [],
          neuroEmotionalBehavioralStatus: analysis.neuroEmotionalBehavioralStatus || [],
          // Include other analysis data for complete retrieval
          primaryDiagnosis: analysis.primaryDiagnosis || null,
          secondaryDiagnoses: analysis.secondaryDiagnoses || [],
          missingInformation: analysis.missingInformation || [],
          inconsistencies: analysis.inconsistencies || [],
          suggestedCodes: analysis.suggestedCodes || [],
          recommendations: analysis.recommendations || [],
          flaggedIssues: analysis.flaggedIssues || [],
          qualityScore: analysis.qualityScore || 0,
          confidenceScore: analysis.confidenceScore || 0,
          completenessScore: analysis.completenessScore || 0,
          financialImpact: analysis.financialImpact || null
        },
        missing_information: analysis.missingInformation || [],
        inconsistencies: analysis.inconsistencies || [],
        debug_info: analysis.debugInfo || {},
        suggested_codes: analysis.suggestedCodes || [],
        corrections: analysis.corrections || [],
        risk_factors: analysis.riskFactors || [],
        recommendations: analysis.recommendations || [],
        // Combine flaggedIssues and inconsistencies - inconsistencies should also be flagged as issues
        flagged_issues: [
          ...(analysis.flaggedIssues || []),
          // Convert inconsistencies to flagged_issues format
          ...(analysis.inconsistencies || []).map((inc: any) => ({
            issue: `${inc.conflictType || 'Inconsistency'}: ${inc.sectionA || ''} vs ${inc.sectionB || ''}`,
            severity: inc.severity || 'medium',
            location: `${inc.sectionA || 'Section A'} vs ${inc.sectionB || 'Section B'}`,
            suggestion: inc.recommendation || inc.clinicalImpact || 'Review and resolve inconsistency',
            category: 'inconsistency',
            clinicalImpact: inc.clinicalImpact || ''
          }))
        ],
        quality_score: analysis.qualityScore || 70,
        confidence_score: analysis.confidenceScore || 70,
        completeness_score: analysis.completenessScore || 70,
        current_revenue: analysis.financialImpact?.currentRevenue || 0,
        optimized_revenue: analysis.financialImpact?.optimizedRevenue || 0,
        revenue_increase: analysis.financialImpact?.increase || 0,
        financial_impact: analysis.financialImpact || {},
      }

      console.log("[OASIS] Inserting assessment into database...")
      console.log("[OASIS] 🔍 Verifying chart_id in insertData:", insertData.chart_id)
      console.log("[OASIS] 🔍 Type of chart_id:", typeof insertData.chart_id)
      console.log("[OASIS] 🔍 Is chart_id empty?", !insertData.chart_id || insertData.chart_id.trim() === '')

      const { data: assessment, error } = await supabase.from("oasis_assessments").insert(insertData).select().single()

      if (error) {
        console.error("[OASIS] ❌ Database error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        console.error("[OASIS] ❌ Failed insertData.chart_id:", insertData.chart_id)
        throw new Error(`Failed to store assessment: ${error.message}`)
      }

      console.log("[OASIS] ✅ Assessment stored in database:", assessment.id)
      console.log("[OASIS] ✅ Verifying chart_id was saved:", assessment.chart_id)
      
      if (!assessment.chart_id || assessment.chart_id === null) {
        console.error("[OASIS] ⚠️ WARNING: chart_id is NULL after insert!")
        console.error("[OASIS] ⚠️ This means the database insert failed to save chart_id")
        console.error("[OASIS] ⚠️ Check if chart_id column exists and allows NULL values")
      } else {
        console.log("[OASIS] ✅ chart_id successfully saved:", assessment.chart_id)
      }

      return NextResponse.json({
        success: true,
        message: "OASIS assessment processed successfully",
        assessmentId: uploadId,
        analysis: {
          qualityScore: analysis.qualityScore,
          confidence: analysis.confidenceScore,
          // Return full financialImpact object so frontend can access increase, currentRevenue, optimizedRevenue
          financialImpact: analysis.financialImpact || {
            currentRevenue: 0,
            optimizedRevenue: 0,
            increase: 0,
            breakdown: [],
          },
          // Include both flaggedIssues and inconsistencies for frontend counting
          flaggedIssues: analysis.flaggedIssues || [],
          inconsistencies: analysis.inconsistencies || [],
          // Also include recommendations, regulatoryIssues, documentationGaps for QAPI report
          recommendations: analysis.recommendations || [],
          regulatoryIssues: analysis.qapiAudit?.regulatoryDeficiencies || [],
          documentationGaps: analysis.missingInformation || [],
        },
      })
    } else if (fileType === "physician-order") {
      // Physician orders can be analyzed standalone or linked to an OASIS assessment
      // If assessmentId is provided, use it; otherwise, try to find the most recent OASIS for this chart
      // If no OASIS is found, the physician order will be analyzed standalone
      console.log("[PHYSICIAN ORDER] 📋 Starting physician order processing:", {
        hasAssessmentId: !!assessmentId,
        hasChartId: !!chartId,
        chartId: chartId,
        assessmentId: assessmentId
      })
      
      let targetAssessmentId = assessmentId
      let oasisExtractedText: string | null = null
      
      // Try to find OASIS assessment if not provided
      if (!targetAssessmentId && chartId) {
        console.log("[PHYSICIAN ORDER] 🔍 No assessmentId provided, finding most recent OASIS for chartId:", chartId)
        
        // Find the most recent OASIS assessment for this chart
        const { data: recentAssessment, error: findError } = await supabase
          .from("oasis_assessments")
          .select("upload_id, id, chart_id, status, created_at, extracted_text")
          .eq("chart_id", chartId)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (findError) {
          console.error("[PHYSICIAN ORDER] ⚠️ Database error finding OASIS assessment (will proceed standalone):", findError)
        } else if (recentAssessment) {
          targetAssessmentId = recentAssessment.upload_id
          oasisExtractedText = recentAssessment.extracted_text
          console.log("[PHYSICIAN ORDER] ✅ Found OASIS assessment:", targetAssessmentId)
        } else {
          console.log("[PHYSICIAN ORDER] ℹ️ No OASIS assessment found - will analyze physician order standalone")
        }
      } else if (targetAssessmentId) {
        // Get the OASIS assessment if assessmentId was provided
        const { data: assessment, error: fetchError } = await supabase
          .from("oasis_assessments")
          .select("extracted_text, upload_id")
          .eq("upload_id", targetAssessmentId)
          .maybeSingle()

        if (fetchError) {
          console.error("[PHYSICIAN ORDER] ⚠️ Error fetching assessment (will proceed standalone):", fetchError)
        } else if (assessment) {
          oasisExtractedText = assessment.extracted_text
          console.log("[PHYSICIAN ORDER] ✅ Loaded OASIS assessment text")
        }
      }

      console.log("[PHYSICIAN ORDER] 📋 Configuration for physician order analysis:", {
        qaType: uploadType,
        priority: priority,
        patientId: patientId || 'None',
        hasNotes: !!notes
      })

      // Import the new Physician Order analyzer
      const { analyzePhysicianOrder } = await import("@/lib/clinical-qa-analyzer")
      
      // Track AI analysis start time
      const aiAnalysisStartTime = Date.now()
      let analysis: any
      
      try {
        analysis = await analyzePhysicianOrder(
          fileText,
          uploadType as 'comprehensive-qa' | 'coding-review' | 'financial-optimization' | 'qapi-audit',
          notes || '',
          priority as 'low' | 'medium' | 'high' | 'urgent'
        )
      } catch (aiError) {
        console.error("[PHYSICIAN ORDER] ⚠️ AI analysis failed, using basic extraction:", aiError)
        // Extract basic info from text
        const physicianMatch = fileText.match(/(?:Physician|Doctor|MD)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
        const npiMatch = fileText.match(/NPI[:\s]*(\d+)/i)
        
        // Provide a basic fallback analysis
        analysis = {
          presentInPdf: [],
          missingInformation: [{ element: "AI Analysis", location: "N/A", impact: "Unable to analyze - timeout", recommendation: "Manual review required", severity: "high" }],
          qaFindings: [{ finding: "AI analysis timed out", category: "system", severity: "medium", recommendation: "Retry analysis or review manually" }],
          codingReview: [],
          financialRisks: [],
          qapiDeficiencies: [],
          optimizedOrderTemplate: "",
          qualityScore: 60,
          confidenceScore: 50,
          extractedData: {
            physician: physicianMatch ? physicianMatch[1] : "Unknown",
            npi: npiMatch ? npiMatch[1] : "N/A"
          }
        }
      }
      
      const aiAnalysisEndTime = Date.now()
      const aiAnalysisDuration = aiAnalysisEndTime - aiAnalysisStartTime
      
      console.log("[PHYSICIAN ORDER] ⏱️ AI Analysis completed in:", (aiAnalysisDuration / 1000).toFixed(2), "seconds")
      console.log("[PHYSICIAN ORDER] 📊 Analysis Results:", {
        presentInPdf: analysis.presentInPdf?.length || 0,
        missingInformation: analysis.missingInformation?.length || 0,
        qaFindings: analysis.qaFindings?.length || 0,
        codingReview: analysis.codingReview?.length || 0,
        financialRisks: analysis.financialRisks?.length || 0,
        qapiDeficiencies: analysis.qapiDeficiencies?.length || 0,
        qualityScore: analysis.qualityScore,
        confidenceScore: analysis.confidenceScore,
      })

      // Convert analysis to format compatible with doctor_orders table
      const discrepancies = [
        ...(analysis.missingInformation || []).map((item: any) => ({
          type: 'missing',
          element: item.element,
          location: item.location,
          impact: item.impact,
          recommendation: item.recommendation,
          severity: item.severity || 'medium'
        })),
        ...(analysis.qaFindings || []).map((item: any) => ({
          type: 'finding',
          finding: item.finding,
          category: item.category,
          severity: item.severity || 'medium',
          recommendation: item.recommendation
        })),
        ...(analysis.qapiDeficiencies || []).map((item: any) => ({
          type: 'deficiency',
          deficiency: item.deficiency,
          category: item.category,
          severity: item.severity || 'medium',
          impact: item.impact,
          recommendation: item.recommendation
        }))
      ]

      // Use clinical_documents table (same as PT visit and POC)
      // Determine chart_id
      const finalChartId = chartId || `chart-${Date.now()}`

      // Store analysis data in findings JSONB (same structure as PT visit)
      const findingsWithAnalysis = {
        ...discrepancies,
        _analysis: analysis, // Store full analysis
        presentInPdf: analysis.presentInPdf || [],
        missingInformation: analysis.missingInformation || [],
        qaFindings: analysis.qaFindings || [],
        codingReview: analysis.codingReview || [],
        financialRisks: analysis.financialRisks || [],
        qapiDeficiencies: analysis.qapiDeficiencies || [],
        optimizedOrderTemplate: analysis.optimizedOrderTemplate || "",
      }

      // Prepare insert data for clinical_documents table (same as PT visit)
      const insertData: any = {
        upload_id: uploadId,
        chart_id: finalChartId,
        document_type: "physician_order",
        patient_id: patientId || null,
        patient_name: sanitizeText(analysis.presentInPdf?.find((p: any) => p.element?.toLowerCase().includes('patient'))?.content || ""),
        file_name: file.name,
        file_size: file.size,
        file_url: fileUrl,
        extracted_text: sanitizeText(fileText.substring(0, 10000)),
        document_date: new Date().toISOString(),
        clinician_name: sanitizeText(analysis.presentInPdf?.find((p: any) => p.element?.toLowerCase().includes('physician'))?.content || ""),
        discipline: "MD",
        upload_type: uploadType,
        priority: priority,
        notes: sanitizeText(notes || ""),
        status: "completed",
        processed_at: new Date().toISOString(),
      }

      console.log("[PHYSICIAN ORDER] 📝 Storing in clinical_documents table:", {
        upload_id: insertData.upload_id,
        chart_id: insertData.chart_id,
        document_type: insertData.document_type,
        file_name: insertData.file_name,
      })

      // Insert into clinical_documents (same as PT visit)
      const { data: physicianOrderDoc, error: insertError } = await supabase
        .from("clinical_documents")
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        console.error("[PHYSICIAN ORDER] ❌ Database insert error:", insertError)
        console.error("[PHYSICIAN ORDER] ❌ Error details:", {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
        })
        throw new Error(`Failed to store physician order: ${insertError.message || 'Unknown database error'}`)
      }

      console.log("[PHYSICIAN ORDER] ✅ Physician order stored in clinical_documents with ID:", physicianOrderDoc.id)

      // Also store QA analysis in qa_analysis table (same as PT visit)
      // Convert decimal scores to integers (database expects INTEGER type)
      const analysisData = {
        document_id: physicianOrderDoc.id,
        document_type: "physician_order",
        chart_id: finalChartId,
        quality_score: Math.round(analysis.qualityScore || 0),
        compliance_score: 0,
        completeness_score: 0,
        accuracy_score: 0,
        confidence_score: Math.round(analysis.confidenceScore || 0),
        findings: findingsWithAnalysis, // Store full analysis in findings JSONB
        recommendations: analysis.qapiDeficiencies?.map((d: any) => d.recommendation) || [],
        missing_elements: analysis.missingInformation || [],
        coding_suggestions: analysis.codingReview || [],
        revenue_impact: analysis.financialRisks || [],
        regulatory_issues: analysis.qapiDeficiencies || [],
        documentation_gaps: analysis.missingInformation || [],
        analyzed_at: new Date().toISOString(),
      }

      console.log("[PHYSICIAN ORDER] 📊 Storing QA analysis:", {
        document_id: analysisData.document_id,
        quality_score: analysisData.quality_score,
        confidence_score: analysisData.confidence_score,
        findings_keys: Object.keys(findingsWithAnalysis),
        has_analysis: !!findingsWithAnalysis._analysis,
      })

      const { data: qaAnalysis, error: qaError } = await supabase
        .from("qa_analysis")
        .insert(analysisData)
        .select()
        .single()

      if (qaError) {
        console.error("[PHYSICIAN ORDER] ⚠️ Warning: Failed to store QA analysis:", qaError)
        // Don't fail the whole request if QA analysis insert fails
      } else {
        console.log("[PHYSICIAN ORDER] ✅ QA Analysis stored with ID:", qaAnalysis.id)
      }

      // Update OASIS assessment with physician order analysis summary
      const summaryIssues = [
        ...(analysis.missingInformation || []).slice(0, 5).map((item: any) => `Missing: ${item.element}`),
        ...(analysis.qaFindings || []).slice(0, 5).map((item: any) => `Finding: ${item.finding}`),
        ...(analysis.qapiDeficiencies || []).slice(0, 5).map((item: any) => `Deficiency: ${item.deficiency}`)
      ]

      await supabase
        .from("oasis_assessments")
        .update({
          flagged_issues: summaryIssues.length > 0 ? summaryIssues : null,
          updated_at: new Date().toISOString(),
        })
        .eq("upload_id", assessmentId)

      console.log("[PHYSICIAN ORDER] ✅ Physician order processed and stored successfully")

      return NextResponse.json({
        success: true,
        message: "Physician order processed and analyzed with 4-type QA review",
        assessmentId,
        uploadId,
        analysis: {
          // Include counts for summary
          presentInPdf: analysis.presentInPdf?.length || 0,
          missingInformation: analysis.missingInformation?.length || 0,
          qaFindings: analysis.qaFindings?.length || 0,
          codingReview: analysis.codingReview?.length || 0,
          financialRisks: analysis.financialRisks?.length || 0,
          qapiDeficiencies: analysis.qapiDeficiencies?.length || 0,
          qualityScore: analysis.qualityScore,
          confidenceScore: analysis.confidenceScore,
          // Include full arrays for frontend to calculate issues properly
          missingInformationArray: analysis.missingInformation || [],
          qaFindingsArray: analysis.qaFindings || [],
          qapiDeficienciesArray: analysis.qapiDeficiencies || [],
          // Also include for backward compatibility
          confidence: analysis.confidenceScore,
          confidence_score: analysis.confidenceScore,
        },
        discrepancies: discrepancies.length,
      })
    } else if (fileType === "pt-note") {
      console.log("[PT VISIT] ========================================")
      console.log("[PT VISIT] Processing PT Visit Note...")
      console.log("[PT VISIT] Upload ID:", uploadId)
      console.log("[PT VISIT] File Name:", file.name)
      console.log("[PT VISIT] File Size:", file.size, "bytes")
      console.log("[PT VISIT] ========================================")

      // Track processing start time
      const processingStartTime = Date.now()
      console.log("[PT VISIT] ⏱️ Processing started at:", new Date(processingStartTime).toISOString())

      // ✅ Using analyzeClinicalDocumentFast from top-level import (no dynamic import needed)
      
      console.log("[PT VISIT] Extracted text length:", fileText.length, "characters")
      console.log("[PT VISIT] Estimated pages:", Math.ceil(fileText.length / 2000))
      console.log("[PT VISIT] First 1000 chars of extracted text:")
      console.log(fileText.substring(0, 1000))
      console.log("[PT VISIT] Last 500 chars of extracted text:")
      console.log(fileText.substring(Math.max(0, fileText.length - 500)))
      console.log("[PT VISIT] ========================================")

      // Extract MRN directly from text if not in analysis
      const mrnMatch = fileText.match(/MRN[:\s]*([A-Z0-9]+)/i) || 
                       fileText.match(/Medical Record Number[:\s]*([A-Z0-9]+)/i) ||
                       fileText.match(/Patient ID[:\s]*([A-Z0-9]+)/i)
      const extractedMRN = mrnMatch ? mrnMatch[1] : null
      
      console.log("[PT VISIT] Direct MRN extraction from text:", extractedMRN)

      console.log("[PT VISIT] Starting FAST AI analysis (same method as OASIS)...")
      console.log("[PT VISIT] 📋 Configuration:", {
        qaType: uploadType,
        priority: priority,
        patientId: patientId || 'None',
        hasNotes: !!notes
      })
      
      // Track AI analysis start time
      const aiAnalysisStartTime = Date.now()
      let analysis: any
      
      try {
        // ✅ Use FAST analyzer first (same as OASIS) - faster and more reliable
        analysis = await analyzeClinicalDocumentFast(fileText, "pt_note", uploadType)
        console.log("[PT VISIT] ✅ FAST analysis completed successfully!")
      } catch (aiError) {
        console.error("[PT VISIT] ⚠️ FAST analyzer failed, using basic extraction:", aiError)
        // Provide a basic fallback analysis
        analysis = {
          patientInfo: {
            name: extractedMRN ? "Patient" : "Unknown Patient",
            mrn: extractedMRN || "N/A",
            dob: "N/A",
            visitDate: new Date().toISOString().split('T')[0]
          },
          qualityScores: { overall: 70, documentation: 70, compliance: 70, completeness: 70 },
          diagnoses: [],
          flaggedIssues: [{ issue: "AI analysis timed out - manual review recommended", severity: "medium" }],
          recommendations: ["Manual review of document recommended due to AI timeout"],
          missingElements: [],
          financialImpact: { estimatedImpact: 0, details: "Unable to calculate - AI timeout" },
          extractedData: { rawText: fileText.substring(0, 5000) }
        }
      }
      
      const aiAnalysisEndTime = Date.now()
      const aiAnalysisDuration = aiAnalysisEndTime - aiAnalysisStartTime
      
      console.log("[PT VISIT] ⏱️ AI Analysis completed in:", (aiAnalysisDuration / 1000).toFixed(2), "seconds")

      // Override patientInfo with direct extraction if AI didn't get it
      if (analysis.patientInfo) {
        if (!analysis.patientInfo.mrn || analysis.patientInfo.mrn === "N/A") {
          analysis.patientInfo.mrn = extractedMRN || analysis.patientInfo.mrn || "N/A"
        }
        // Extract patient name directly if needed
        const nameMatch = fileText.match(/Patient Name[:\s]*([A-Z][a-z]+(?:,\s*[A-Z][a-z]+(?:\s+[A-Z])?)+)/i)
        if (nameMatch && (!analysis.patientInfo.name || analysis.patientInfo.name === "Unknown Patient")) {
          analysis.patientInfo.name = nameMatch[1].trim()
        }
      }

      console.log("[PT VISIT] ========================================")
      console.log("[PT VISIT] ✅ AI Analysis Completed!")
      console.log("[PT VISIT] ========================================")
      console.log("[PT VISIT] 📊 EXTRACTED AND ANALYZED DATA:")
      console.log("[PT VISIT] ========================================")
      console.log(JSON.stringify(analysis, null, 2))
      console.log("[PT VISIT] ========================================")
      console.log("[PT VISIT] Patient Info:", analysis.patientInfo)
      console.log("[PT VISIT] Quality Scores:", analysis.qualityScores)
      console.log("[PT VISIT] Diagnoses Count:", analysis.diagnoses.length)
      console.log("[PT VISIT] Flagged Issues Count:", analysis.flaggedIssues.length)
      console.log("[PT VISIT] Recommendations Count:", analysis.recommendations.length)
      console.log("[PT VISIT] Missing Elements Count:", analysis.missingElements.length)
      console.log("[PT VISIT] Financial Impact:", analysis.financialImpact)
      console.log("[PT VISIT] ========================================")

      // Use the same chartId for all documents in the same chart
      const finalChartId = chartId || `chart-${Date.now()}`
      console.log("[PT VISIT] 📋 Using chart_id:", finalChartId, chartId ? "(from formData)" : "(generated)")

      // Store PT Visit in clinical_documents table
      const insertData = {
        upload_id: uploadId,
        chart_id: finalChartId,
        document_type: "pt_note",
        patient_id: patientId || extractedMRN || null,
        patient_name: sanitizeText(analysis.patientInfo?.name || ""),
        file_name: file.name,
        file_size: file.size,
        file_url: fileUrl,
        extracted_text: sanitizeText(fileText.substring(0, 10000)),
        document_date: (() => {
          try {
            if (analysis.patientInfo?.visitDate && analysis.patientInfo.visitDate !== "N/A") {
              const parsedDate = new Date(analysis.patientInfo.visitDate)
              return isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString()
            }
            return new Date().toISOString()
          } catch {
            return new Date().toISOString()
          }
        })(),
        clinician_name: sanitizeText(analysis.patientInfo?.clinician || ""),
        discipline: "PT",
        upload_type: uploadType,
        priority: priority,
        notes: sanitizeText(notes),
        status: "completed",
        processed_at: new Date().toISOString(),
      }

      console.log("[PT VISIT] Storing PT Visit in database...")
      const { data: ptVisit, error: insertError } = await supabase
        .from("clinical_documents")
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        console.error("[PT VISIT] ❌ Database insert error:", insertError)
        throw new Error(`Failed to store PT Visit: ${insertError.message}`)
      }

      console.log("[PT VISIT] ✅ PT Visit stored in database with ID:", ptVisit.id)

      // Calculate total processing time
      const processingEndTime = Date.now()
      const totalProcessingDuration = processingEndTime - processingStartTime
      const processingDurationSeconds = (totalProcessingDuration / 1000).toFixed(2)
      
      console.log("[PT VISIT] ⏱️ Total processing time:", processingDurationSeconds, "seconds")
      console.log("[PT VISIT] ⏱️ Breakdown:")
      console.log("[PT VISIT]   - OCR & Text Extraction:", ((aiAnalysisStartTime - processingStartTime) / 1000).toFixed(2), "seconds")
      console.log("[PT VISIT]   - AI Analysis:", (aiAnalysisDuration / 1000).toFixed(2), "seconds")
      console.log("[PT VISIT]   - Database Operations:", ((processingEndTime - aiAnalysisEndTime) / 1000).toFixed(2), "seconds")

      // Store analysis in qa_analysis table
      // Store ALL comprehensive analysis data in findings JSONB (includes all 4 sections: Clinical QA, Coding Review, Financial Optimization, QAPI Audit)
      const findingsWithPTData = {
        // Section 1: Clinical Quality Assurance (QA)
        flaggedIssues: analysis.flaggedIssues,
        inconsistencies: analysis.structuredData?.inconsistencies || [], // Store inconsistencies for counting
        missingElements: analysis.missingElements,
        riskFactors: analysis.riskFactors,
        // Section 2: Coding Review
        diagnoses: analysis.diagnoses,
        suggestedCodes: analysis.suggestedCodes,
        corrections: analysis.corrections,
        // Section 3: Financial Optimization
        financialImpact: analysis.financialImpact,
        ptOptimizations: analysis.ptOptimizations || null,
        // Section 4: QAPI Audit
        regulatoryIssues: analysis.regulatoryIssues,
        documentationGaps: analysis.documentationGaps,
        recommendations: analysis.recommendations,
        // PT-specific extracted data
        extractedPTData: analysis.extractedPTData || null,
        // Processing metadata
        processingTime: {
          totalSeconds: parseFloat(processingDurationSeconds),
          aiAnalysisSeconds: parseFloat((aiAnalysisDuration / 1000).toFixed(2)),
          startTime: new Date(processingStartTime).toISOString(),
          endTime: new Date(processingEndTime).toISOString(),
        },
        // Full analysis object for complete access
        fullAnalysis: analysis,
      }

      const analysisData = {
        document_id: ptVisit.id,
        document_type: "pt_note",
        chart_id: finalChartId,
        quality_score: analysis.qualityScores.overall,
        compliance_score: analysis.qualityScores.compliance,
        completeness_score: analysis.qualityScores.completeness,
        accuracy_score: analysis.qualityScores.accuracy,
        confidence_score: analysis.qualityScores.confidence,
        findings: findingsWithPTData, // Store PT data in findings JSONB
        recommendations: analysis.recommendations,
        missing_elements: analysis.missingElements,
        coding_suggestions: analysis.suggestedCodes,
        revenue_impact: analysis.financialImpact,
        regulatory_issues: analysis.regulatoryIssues,
        documentation_gaps: analysis.documentationGaps,
        analyzed_at: new Date().toISOString(),
      }

      const { data: qaAnalysis, error: qaError } = await supabase
        .from("qa_analysis")
        .insert(analysisData)
        .select()
        .single()

      if (qaError) {
        console.error("[PT VISIT] ⚠️ Warning: Failed to store QA analysis:", qaError)
        // Don't fail the whole request if QA analysis insert fails
      } else {
        console.log("[PT VISIT] ✅ QA Analysis stored with ID:", qaAnalysis.id)
      }

      console.log("[PT VISIT] ========================================")
      console.log("[PT VISIT] 🎉 PT Visit processing complete!")
      console.log("[PT VISIT] Upload ID:", uploadId)
      console.log("[PT VISIT] ========================================")

      return NextResponse.json({
        success: true,
        message: "PT Visit note processed successfully",
        uploadId: uploadId,
        analysis: analysis,
      })
    } else if (fileType === "poc") {
      console.log("[POC] ========================================")
      console.log("[POC] Processing Plan of Care (485) form...")
      console.log("[POC] Upload ID:", uploadId)
      console.log("[POC] File Name:", file.name)
      console.log("[POC] File Size:", file.size, "bytes")
      console.log("[POC] ========================================")

      // Track processing start time
      const processingStartTime = Date.now()
      console.log("[POC] ⏱️ Processing started at:", new Date(processingStartTime).toISOString())

      console.log("[POC] Extracted text length:", fileText.length, "characters")
      console.log("[POC] Estimated pages:", Math.ceil(fileText.length / 2000))
      console.log("[POC] ========================================")

      // Extract key information directly from text for validation
      const directExtractions = {
        mrn: fileText.match(/Medical Record No[.:\s]*([A-Z0-9]+)/i)?.[1] || 
              fileText.match(/MRN[.:\s]*([A-Z0-9]+)/i)?.[1] || null,
        orderNumber: fileText.match(/Order\s*#?[.:\s]*(\d+)/i)?.[1] || null,
        patientName: fileText.match(/(?:Patient Name|Name)[:\s]*([A-Z][a-z]+(?:,\s*[A-Z][a-z]+(?:\s+[A-Z])?)+)/i)?.[1]?.trim() || null,
        physicianName: fileText.match(/(?:Physician|Attending Physician)[:\s]*([A-Z][A-Z\s,]+M\.?D\.?)/i)?.[1]?.trim() || null,
        physicianNPI: fileText.match(/NPI[:\s]*(\d+)/i)?.[1] || null,
        startOfCare: fileText.match(/Start of Care Date[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i)?.[1] || null,
        certificationStart: fileText.match(/Certification Period[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i)?.[1] || null,
        certificationEnd: fileText.match(/Certification Period[:\s]*\d{1,2}\/\d{1,2}\/\d{4}\s*[-–]\s*(\d{1,2}\/\d{1,2}\/\d{4})/i)?.[1] || null,
      }

      console.log("[POC] Direct text extractions for validation:")
      console.log("[POC] MRN:", directExtractions.mrn)
      console.log("[POC] Order #:", directExtractions.orderNumber)
      console.log("[POC] Patient Name:", directExtractions.patientName)
      console.log("[POC] Physician:", directExtractions.physicianName)
      console.log("[POC] ========================================")

      // Analyze Plan of Care using FAST analyzer first (60 sec timeout)
      // Falls back to basic extraction if FAST fails
      const aiAnalysisStartTime = Date.now()
      let pocAnalysis: any
      
      console.log("[POC] Starting FAST AI analysis (60 sec timeout)...")
      try {
        // Use FAST analyzer for quicker processing
        const fastResult = await analyzeClinicalDocumentFast(fileText, "poc", uploadType)
        const fastResultAny = fastResult as any
        
        // ✅ Convert FAST result to POC format - use AI-extracted data with fallbacks
        const aiData = fastResultAny.pocExtractedData || fastResultAny.extractedData || fastResultAny
        const aiPatient = (aiData.patientInfo || {}) as any
        const structuredQA = aiData.structuredQA || fastResultAny.structuredQA || {}
        const qaQAPI = aiData.qaQAPI || fastResultAny.qaQAPI || {}
        const qaFinancialOptimization = aiData.qaFinancialOptimization || fastResultAny.qaFinancialOptimization || {}
        const qaCodingReview = aiData.qaCodingReview || fastResultAny.qaCodingReview || {}
        const aiMedications = (aiData.medications || fastResultAny.medications || []) as any[]
        const aiDiagnoses = (aiData.diagnoses || fastResultAny.diagnoses || []) as any[]
        
        pocAnalysis = {
          qaAnalysis: "Analysis completed with FAST analyzer",
          structuredData: {
            // ✅ Use AI-extracted QA issues, with fallbacks
            missingInformation: structuredQA.missingInformation || 
              (fastResult.missingElements || []).map((e: any) => ({ issue: e, whyItMatters: "Missing from document" })),
            inconsistencies: structuredQA.inconsistencies || [],
            medicationIssues: structuredQA.medicationIssues || [],
            clinicalLogicGaps: structuredQA.clinicalLogicGaps || [],
            complianceRisks: structuredQA.complianceRisks || 
              (fastResult.flaggedIssues || []).map((i: any) => ({ issue: i.issue || i, reason: i.severity || "medium" })),
            signatureDateProblems: structuredQA.signatureDateProblems || []
          },
          // ✅ QAPI Audit data (UI-compatible format)
          qaQAPI: {
            regulatoryDeficiencies: qaQAPI.regulatoryDeficiencies || [],
            planOfCareReview: qaQAPI.planOfCareReview || { completeness: 'incomplete', issues: [], goals: [], riskMitigation: [] },
            incompleteElements: qaQAPI.incompleteElements || [],
            overallQualityScore: qaQAPI.overallQualityScore || 0,
            riskLevel: qaQAPI.riskLevel || 'medium'
          },
          // ✅ Financial Optimization data (UI-compatible format)
          qaFinancialOptimization: {
            currentEstimatedReimbursement: qaFinancialOptimization.currentEstimatedReimbursement || 0,
            optimizedReimbursement: qaFinancialOptimization.optimizedReimbursement || 0,
            revenueDifference: qaFinancialOptimization.revenueDifference || 0,
            documentationNeededToIncreaseReimbursement: qaFinancialOptimization.documentationNeededToIncreaseReimbursement || []
          },
          // ✅ Coding Review data (UI-compatible format)
          qaCodingReview: {
            validatedCodes: qaCodingReview.validatedCodes || [],
            missingDiagnoses: qaCodingReview.missingDiagnoses || [],
            codingAccuracy: qaCodingReview.codingAccuracy || 0,
            specificityScore: qaCodingReview.specificityScore || 0
          },
          extractedData: {
            // ✅ Patient Info - use AI data first, then direct extractions, then fallback
            patientInfo: {
              name: aiPatient?.name || fastResult.patientInfo?.name || directExtractions.patientName || "Unknown",
              mrn: aiPatient?.mrn || fastResult.patientInfo?.mrn || directExtractions.mrn || "N/A",
              dob: aiPatient?.dob || "N/A",
              gender: aiPatient?.gender || "N/A",
              address: aiPatient?.address || "N/A",
              phone: aiPatient?.phone || "N/A"
            },
            // ✅ Order Info - use AI data first
            orderInfo: {
              orderNumber: aiData.orderInfo?.orderNumber || directExtractions.orderNumber || "N/A",
              startOfCareDate: aiData.orderInfo?.startOfCareDate || directExtractions.startOfCare || "N/A",
              certificationPeriod: {
                start: aiData.orderInfo?.certificationPeriod?.start || directExtractions.certificationStart || "N/A",
                end: aiData.orderInfo?.certificationPeriod?.end || directExtractions.certificationEnd || "N/A"
              },
              providerNumber: aiData.orderInfo?.providerNumber || "N/A",
              patientHIClaimNo: aiData.orderInfo?.patientHIClaimNo || "N/A"
            },
            // ✅ Physician Info - use AI data first
            physicianInfo: {
              name: aiData.physicianInfo?.name || directExtractions.physicianName || "N/A",
              npi: aiData.physicianInfo?.npi || directExtractions.physicianNPI || "N/A",
              address: aiData.physicianInfo?.address || "N/A",
              phone: aiData.physicianInfo?.phone || "N/A",
              fax: aiData.physicianInfo?.fax || "N/A"
            },
            agencyInfo: { name: "N/A", address: "N/A", phone: "N/A", fax: "N/A" },
            // ✅ Clinical Status - use AI data
            clinicalStatus: { 
              prognosis: aiData.clinicalStatus?.prognosis || "N/A", 
              mentalCognitiveStatus: aiData.clinicalStatus?.mentalCognitiveStatus || "N/A", 
              functionalLimitations: aiData.clinicalStatus?.functionalLimitations || [], 
              safety: aiData.clinicalStatus?.safety || [], 
              advanceDirectives: "N/A", 
              psychosocialStatus: "N/A" 
            },
            emergencyPreparedness: { emergencyTriage: "N/A", evacuationZone: "N/A", additionalInfo: "N/A" },
            // ✅ Medications - use AI data
            medications: aiMedications,
            // ✅ Diagnoses - use AI data
            diagnoses: { 
              primary: aiDiagnoses?.[0] || { code: "N/A", description: "N/A" }, 
              other: aiDiagnoses.slice(1) 
            },
            // ✅ Goals - use AI data
            goals: { 
              patientGoals: aiData.goals?.patientGoals || [], 
              ptGoals: aiData.goals?.ptGoals || [], 
              measurableGoals: aiData.goals?.measurableGoals || [] 
            },
            // ✅ Treatment Plan - use AI data
            treatmentPlan: { 
              disciplines: aiData.treatmentPlan?.disciplines || [], 
              frequencies: aiData.treatmentPlan?.frequencies || [], 
              effectiveDate: "N/A", 
              orders: aiData.treatmentPlan?.orders || [] 
            },
            // ✅ DME Info - use AI data
            dmeInfo: {
              dmeItems: aiData.dmeInfo?.dmeItems || [],
              providerName: aiData.dmeInfo?.providerName || "N/A",
              providerPhone: aiData.dmeInfo?.providerPhone || "N/A",
              suppliesProvided: aiData.dmeInfo?.suppliesProvided || "N/A"
            },
            // ✅ Signatures - use AI data
            signatures: { 
              nurseTherapistSignature: aiData.signatures?.nurseTherapistSignature || "N/A", 
              nurseTherapistDate: aiData.signatures?.nurseTherapistDate || "N/A", 
              physicianSignature: aiData.signatures?.physicianSignature || "N/A", 
              physicianSignatureDate: aiData.signatures?.physicianSignatureDate || "N/A", 
              dateHHAReceivedSigned: aiData.signatures?.dateHHAReceivedSigned || "N/A", 
              f2fDate: aiData.signatures?.f2fDate || "N/A" 
            },
            homeboundNarrative: "N/A",
            medicalNecessity: "N/A",
            rehabilitationPotential: "N/A",
            dischargePlan: { dischargeTo: "N/A", dischargeWhen: "N/A" }
          },
          qualityScore: fastResult.qualityScores?.overall || 75,
          confidenceScore: 70,
          // ✅ 4-Section QA Analysis for different QA types (UI-compatible)
          qaComprehensive: {
            clinicalFindings: structuredQA.clinicalLogicGaps || [],
            documentationIssues: structuredQA.missingInformation || [],
            qualityMetrics: {
              overall: fastResult.qualityScores?.overall || 75,
            documentation: fastResult.qualityScores?.completeness || 70,
              compliance: fastResult.qualityScores?.compliance || 75,
              completeness: fastResult.qualityScores?.completeness || 70
            }
          },
        safetyRisks: structuredQA.complianceRisks || [],
        suggestedCodes: qaCodingReview.validatedCodes || [],
        finalRecommendations: [
          ...(structuredQA.missingInformation || []).map((m: any) => ({ category: 'Documentation', recommendation: m.issue, priority: 'high' })),
          ...(structuredQA.inconsistencies || []).map((i: any) => ({ category: 'Consistency', recommendation: i.issue, priority: 'medium' }))
        ]
        }
        console.log("[POC] ✅ FAST analysis completed successfully!")
        console.log("[POC] 📊 Extracted Patient:", pocAnalysis.extractedData.patientInfo.name)
        console.log("[POC] 📊 Extracted Physician:", pocAnalysis.extractedData.physicianInfo.name)
        console.log("[POC] 📊 Extracted Diagnoses:", pocAnalysis.extractedData.diagnoses.other.length + 1)
        console.log("[POC] 📊 Extracted Medications:", pocAnalysis.extractedData.medications.length)
      } catch (aiError) {
        console.error("[POC] ⚠️ FAST AI analysis failed, using basic extraction:", aiError)
        // Provide a basic fallback analysis
        pocAnalysis = {
          qaAnalysis: "AI analysis timed out - manual review recommended",
          structuredData: {
            missingInformation: [{ issue: "AI timeout", whyItMatters: "Unable to analyze document" }],
            inconsistencies: [],
            medicationIssues: [],
            clinicalLogicGaps: [],
            complianceRisks: [],
            signatureDateProblems: []
          },
          extractedData: {
            patientInfo: {
              name: directExtractions.patientName || "Unknown",
              mrn: directExtractions.mrn || "N/A",
              dob: "N/A",
              gender: "N/A",
              address: "N/A",
              phone: "N/A"
            },
            orderInfo: {
              orderNumber: directExtractions.orderNumber || "N/A",
              startOfCareDate: directExtractions.startOfCare || "N/A",
              certificationPeriod: {
                start: directExtractions.certificationStart || "N/A",
                end: directExtractions.certificationEnd || "N/A"
              },
              providerNumber: "N/A",
              patientHIClaimNo: "N/A"
            },
            physicianInfo: {
              name: directExtractions.physicianName || "N/A",
              npi: directExtractions.physicianNPI || "N/A",
              address: "N/A",
              phone: "N/A",
              fax: "N/A"
            },
            agencyInfo: { name: "N/A", address: "N/A", phone: "N/A", fax: "N/A" },
            clinicalStatus: { prognosis: "N/A", mentalCognitiveStatus: "N/A", functionalLimitations: [], safety: [], advanceDirectives: "N/A", psychosocialStatus: "N/A" },
            emergencyPreparedness: { emergencyTriage: "N/A", evacuationZone: "N/A", additionalInfo: "N/A" },
            medications: [],
            diagnoses: { primary: { code: "N/A", description: "N/A" }, other: [] },
            goals: { patientGoals: [], ptGoals: [], measurableGoals: [] },
            treatmentPlan: { disciplines: [], frequencies: [], effectiveDate: "N/A", orders: [] },
            signatures: { nurseTherapistSignature: "N/A", nurseTherapistDate: "N/A", physicianSignature: "N/A", physicianSignatureDate: "N/A", dateHHAReceivedSigned: "N/A", f2fDate: "N/A" },
            homeboundNarrative: "N/A",
            medicalNecessity: "N/A",
            rehabilitationPotential: "N/A",
            dischargePlan: { dischargeTo: "N/A", dischargeWhen: "N/A" }
          },
          qualityScore: 60,
          confidenceScore: 50,
          // ✅ Fallback 4-Section QA Analysis (UI-compatible format)
          qaQAPI: {
            regulatoryDeficiencies: [{ deficiency: "AI Analysis Timeout", severity: "high", regulation: "N/A", description: "Unable to analyze document", impact: "Cannot verify compliance", recommendation: "Manual review required", correctiveAction: "Resubmit document or review manually" }],
            planOfCareReview: { completeness: 'incomplete', issues: [{ issue: "AI timeout", location: "Full document", recommendation: "Manual review" }], goals: [], riskMitigation: [] },
            incompleteElements: [{ element: "Full Analysis", location: "Entire document", missingInformation: "AI timeout", impact: "Unable to verify quality", recommendation: "Manual review required" }],
            overallQualityScore: 50,
            riskLevel: 'high'
          },
          qaFinancialOptimization: {
            currentEstimatedReimbursement: 0,
            optimizedReimbursement: 0,
            revenueDifference: 0,
            documentationNeededToIncreaseReimbursement: [{ documentation: "Full document analysis", impact: "Unable to calculate", revenueImpact: 0, recommendation: "Manual review required" }]
          },
          qaCodingReview: {
            validatedCodes: [],
            missingDiagnoses: [],
            codingAccuracy: 0,
            specificityScore: 0
          },
          qaComprehensive: {
            clinicalFindings: [],
            documentationIssues: [{ issue: "AI timeout", whyItMatters: "Unable to analyze document" }],
            qualityMetrics: { overall: 50, documentation: 0, compliance: 0, completeness: 0 }
          },
          safetyRisks: [],
          suggestedCodes: [],
          finalRecommendations: [{ category: 'System', recommendation: 'AI analysis timeout - manual review required', priority: 'high' }]
        }
      }
      
      const aiAnalysisEndTime = Date.now()
      const aiAnalysisDuration = aiAnalysisEndTime - aiAnalysisStartTime

      // Validate and override extracted data with direct extractions if AI missed them
      if (pocAnalysis.extractedData) {
        if (!pocAnalysis.extractedData.patientInfo.mrn || pocAnalysis.extractedData.patientInfo.mrn === "N/A") {
          pocAnalysis.extractedData.patientInfo.mrn = directExtractions.mrn || pocAnalysis.extractedData.patientInfo.mrn || "N/A"
        }
        if (!pocAnalysis.extractedData.orderInfo.orderNumber || pocAnalysis.extractedData.orderInfo.orderNumber === "N/A") {
          pocAnalysis.extractedData.orderInfo.orderNumber = directExtractions.orderNumber || pocAnalysis.extractedData.orderInfo.orderNumber || "N/A"
        }
        if (!pocAnalysis.extractedData.patientInfo.name || pocAnalysis.extractedData.patientInfo.name === "N/A") {
          pocAnalysis.extractedData.patientInfo.name = directExtractions.patientName || pocAnalysis.extractedData.patientInfo.name || "N/A"
        }
        if (!pocAnalysis.extractedData.physicianInfo.name || pocAnalysis.extractedData.physicianInfo.name === "N/A") {
          pocAnalysis.extractedData.physicianInfo.name = directExtractions.physicianName || pocAnalysis.extractedData.physicianInfo.name || "N/A"
        }
        if (!pocAnalysis.extractedData.physicianInfo.npi || pocAnalysis.extractedData.physicianInfo.npi === "N/A") {
          pocAnalysis.extractedData.physicianInfo.npi = directExtractions.physicianNPI || pocAnalysis.extractedData.physicianInfo.npi || "N/A"
        }
        if (!pocAnalysis.extractedData.orderInfo.startOfCareDate || pocAnalysis.extractedData.orderInfo.startOfCareDate === "N/A") {
          pocAnalysis.extractedData.orderInfo.startOfCareDate = directExtractions.startOfCare || pocAnalysis.extractedData.orderInfo.startOfCareDate || "N/A"
        }
        if (!pocAnalysis.extractedData.orderInfo.certificationPeriod.start || pocAnalysis.extractedData.orderInfo.certificationPeriod.start === "N/A") {
          pocAnalysis.extractedData.orderInfo.certificationPeriod.start = directExtractions.certificationStart || pocAnalysis.extractedData.orderInfo.certificationPeriod.start || "N/A"
        }
        if (!pocAnalysis.extractedData.orderInfo.certificationPeriod.end || pocAnalysis.extractedData.orderInfo.certificationPeriod.end === "N/A") {
          pocAnalysis.extractedData.orderInfo.certificationPeriod.end = directExtractions.certificationEnd || pocAnalysis.extractedData.orderInfo.certificationPeriod.end || "N/A"
        }
      }

      console.log("[POC] ⏱️ AI Analysis completed in:", (aiAnalysisDuration / 1000).toFixed(2), "seconds")
      console.log("[POC] ========================================")
      console.log("[POC] ✅ Plan of Care QA Analysis Completed!")
      console.log("[POC] ========================================")
      console.log("[POC] 📊 QA ANALYSIS RESULTS:")
      console.log("[POC] ========================================")
      console.log(pocAnalysis.qaAnalysis)
      console.log("[POC] ========================================")
      console.log("[POC] Missing Information Count:", pocAnalysis.structuredData.missingInformation.length)
      console.log("[POC] Inconsistencies Count:", pocAnalysis.structuredData.inconsistencies.length)
      console.log("[POC] Medication Issues Count:", pocAnalysis.structuredData.medicationIssues.length)
      console.log("[POC] Clinical Logic Gaps Count:", pocAnalysis.structuredData.clinicalLogicGaps.length)
      console.log("[POC] Compliance Risks Count:", pocAnalysis.structuredData.complianceRisks.length)
      console.log("[POC] Signature/Date Problems Count:", pocAnalysis.structuredData.signatureDateProblems.length)
      console.log("[POC] ========================================")
      console.log("[POC] 📋 EXTRACTED DATA VERIFICATION:")
      console.log("[POC] Patient:", pocAnalysis.extractedData.patientInfo.name)
      console.log("[POC] MRN:", pocAnalysis.extractedData.patientInfo.mrn)
      console.log("[POC] Order #:", pocAnalysis.extractedData.orderInfo.orderNumber)
      console.log("[POC] Physician:", pocAnalysis.extractedData.physicianInfo.name)
      console.log("[POC] Medications Count:", pocAnalysis.extractedData.medications.length)
      console.log("[POC] Diagnoses Count:", pocAnalysis.extractedData.diagnoses.other.length + 1)
      console.log("[POC] ========================================")

      // Calculate total processing time
      const processingEndTime = Date.now()
      const totalProcessingDuration = processingEndTime - processingStartTime
      const processingDurationSeconds = (totalProcessingDuration / 1000).toFixed(2)

      console.log("[POC] ⏱️ Total processing time:", processingDurationSeconds, "seconds")

      // Convert to standard ClinicalQAResult format for storage
      console.log("[POC] 📋 Configuration:", {
        qaType: uploadType,
        priority: priority,
        patientId: patientId || 'None',
        hasNotes: !!notes
      })
      
      // ✅ Use FAST analysis result directly - NO DOUBLE ANALYSIS!
      // Convert pocAnalysis to standard ClinicalQAResult format
      const analysis = {
        documentType: "poc" as const,
        patientInfo: {
          name: pocAnalysis.extractedData?.patientInfo?.name || directExtractions.patientName || "Unknown",
          mrn: pocAnalysis.extractedData?.patientInfo?.mrn || directExtractions.mrn || "N/A",
          visitDate: pocAnalysis.extractedData?.orderInfo?.startOfCareDate || "N/A",
          clinician: pocAnalysis.extractedData?.physicianInfo?.name || directExtractions.physicianName || "N/A",
          clinicianType: "MD"
        },
        qualityScores: {
          overall: pocAnalysis.qualityScore || 75,
          completeness: pocAnalysis.confidenceScore || 70,
          accuracy: pocAnalysis.qualityScore || 75,
          compliance: pocAnalysis.qualityScore || 75,
          confidence: pocAnalysis.confidenceScore || 70
        },
        diagnoses: pocAnalysis.extractedData?.diagnoses?.other?.map((d: any) => ({
          code: d.code || "N/A",
          description: d.description || "N/A",
          type: "secondary"
        })) || [],
        flaggedIssues: pocAnalysis.structuredData?.complianceRisks?.map((r: any) => ({
          issue: r.issue || r,
          severity: r.reason || "medium",
          location: "Plan of Care",
          suggestion: "Review and address",
          category: "compliance"
        })) || [],
        recommendations: pocAnalysis.structuredData?.missingInformation?.map((m: any) => ({
          category: "documentation",
          recommendation: m.issue || m,
          priority: "medium",
          expectedImpact: m.whyItMatters || "Complete for compliance"
        })) || [],
        missingElements: pocAnalysis.structuredData?.missingInformation?.map((m: any) => ({
          element: m.issue || m,
          category: "documentation",
          severity: "medium",
          recommendation: m.whyItMatters || "Review document"
        })) || [],
        financialImpact: {
          currentRevenue: 0,
          optimizedRevenue: 0,
          increase: 0,
          breakdown: []
        },
        suggestedCodes: [],
        regulatoryIssues: pocAnalysis.structuredData?.complianceRisks || [],
        documentationGaps: pocAnalysis.structuredData?.missingInformation || []
      }

      // Use the same chartId for all documents in the same chart
      const finalChartId = chartId || `chart-${Date.now()}`
      console.log("[POC] 📋 Using chart_id:", finalChartId, chartId ? "(from formData)" : "(generated)")

      // Store Plan of Care in clinical_documents table
      const insertData = {
        upload_id: uploadId,
        chart_id: finalChartId,
        document_type: "poc",
        patient_id: patientId || null,
        patient_name: sanitizeText(analysis.patientInfo?.name || ""),
        file_name: file.name,
        file_size: file.size,
        file_url: fileUrl,
        extracted_text: sanitizeText(fileText.substring(0, 10000)),
        document_date: (() => {
          try {
            if (analysis.patientInfo?.visitDate && analysis.patientInfo.visitDate !== "N/A") {
              const parsedDate = new Date(analysis.patientInfo.visitDate)
              return isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString()
            }
            return new Date().toISOString()
          } catch {
            return new Date().toISOString()
          }
        })(),
        clinician_name: sanitizeText(analysis.patientInfo?.clinician || ""),
        discipline: "N/A",
        upload_type: uploadType,
        priority: priority,
        notes: sanitizeText(notes),
        status: "completed",
        processed_at: new Date().toISOString(),
      }

      console.log("[POC] Storing Plan of Care in database...")
      const { data: pocDocument, error: insertError } = await supabase
        .from("clinical_documents")
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        console.error("[POC] ❌ Database insert error:", insertError)
        throw new Error(`Failed to store Plan of Care: ${insertError.message}`)
      }

      console.log("[POC] ✅ Plan of Care stored in database with ID:", pocDocument.id)

      // Store analysis in qa_analysis table with POC-specific data
      // Store ALL comprehensive analysis data in findings JSONB (includes all 4 sections: Comprehensive QA, Coding Review, Financial Optimization, QAPI Audit)
      const findingsWithPOCData = {
        flaggedIssues: analysis.flaggedIssues,
        inconsistencies: pocAnalysis.structuredData?.inconsistencies || [], // Store inconsistencies for counting
        pocQAAnalysis: pocAnalysis.qaAnalysis,
        pocStructuredData: pocAnalysis.structuredData,
        pocExtractedData: pocAnalysis.extractedData,
        // Comprehensive 4-Section QA Analysis
        qaComprehensive: pocAnalysis.qaComprehensive,
        qaCodingReview: pocAnalysis.qaCodingReview,
        qaFinancialOptimization: pocAnalysis.qaFinancialOptimization,
        qaQAPI: pocAnalysis.qaQAPI,
        safetyRisks: pocAnalysis.safetyRisks,
        suggestedCodes: pocAnalysis.suggestedCodes,
        finalRecommendations: pocAnalysis.finalRecommendations,
        qualityScore: pocAnalysis.qualityScore,
        confidenceScore: pocAnalysis.confidenceScore,
        processingTime: {
          totalSeconds: parseFloat(processingDurationSeconds),
          aiAnalysisSeconds: parseFloat((aiAnalysisDuration / 1000).toFixed(2)),
          startTime: new Date(processingStartTime).toISOString(),
          endTime: new Date(processingEndTime).toISOString(),
        },
      }

      const analysisData = {
        document_id: pocDocument.id,
        document_type: "poc",
        chart_id: finalChartId,
        quality_score: analysis.qualityScores.overall,
        compliance_score: analysis.qualityScores.compliance,
        completeness_score: analysis.qualityScores.completeness,
        accuracy_score: analysis.qualityScores.accuracy,
        confidence_score: analysis.qualityScores.confidence,
        findings: findingsWithPOCData,
        recommendations: analysis.recommendations,
        missing_elements: analysis.missingElements,
        coding_suggestions: analysis.suggestedCodes,
        revenue_impact: analysis.financialImpact,
        regulatory_issues: analysis.regulatoryIssues,
        documentation_gaps: analysis.documentationGaps,
        analyzed_at: new Date().toISOString(),
      }

      console.log("[POC] Storing QA analysis for Plan of Care...")
      const { error: qaAnalysisError } = await supabase
        .from("qa_analysis")
        .insert(analysisData)

      if (qaAnalysisError) {
        console.error("[POC] QA Analysis insert error:", qaAnalysisError)
        throw new Error(`Failed to store Plan of Care QA analysis: ${qaAnalysisError.message}`)
      }
      console.log("[POC] ✅ QA Analysis stored successfully.")

      console.log("[POC] ========================================")
      console.log("[POC] 🎉 Plan of Care processing complete!")
      console.log("[POC] Upload ID:", uploadId)
      console.log("[POC] ========================================")

      console.log("[POC] ========================================")
      console.log("[POC] 📋 EXTRACTED DATA SUMMARY:")
      console.log("[POC] ========================================")
      console.log("[POC] Patient:", pocAnalysis.extractedData.patientInfo.name)
      console.log("[POC] MRN:", pocAnalysis.extractedData.patientInfo.mrn)
      console.log("[POC] Order #:", pocAnalysis.extractedData.orderInfo.orderNumber)
      console.log("[POC] Physician:", pocAnalysis.extractedData.physicianInfo.name)
      console.log("[POC] Medications Count:", pocAnalysis.extractedData.medications.length)
      console.log("[POC] Diagnoses Count:", pocAnalysis.extractedData.diagnoses.other.length + 1)
      console.log("[POC] Certification Period:", pocAnalysis.extractedData.orderInfo.certificationPeriod.start, "to", pocAnalysis.extractedData.orderInfo.certificationPeriod.end)
      console.log("[POC] ========================================")

      return NextResponse.json({
        success: true,
        message: "Plan of Care processed successfully",
        uploadId: uploadId,
        analysis: {
          ...analysis,
          pocQAAnalysis: pocAnalysis.qaAnalysis,
          pocStructuredData: pocAnalysis.structuredData,
          pocExtractedData: pocAnalysis.extractedData,
        },
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
