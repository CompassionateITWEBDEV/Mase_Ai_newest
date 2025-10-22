import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createServiceClient } from "@/lib/supabase/service"
import { analyzeOasisDocument } from "@/lib/oasis-ai-analyzer"

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
    const formData = await request.formData()
    const file = formData.get("file") as File
    const uploadId = formData.get("uploadId") as string
    const uploadType = formData.get("uploadType") as string
    const priority = formData.get("priority") as string
    const fileType = formData.get("fileType") as string // "oasis" or "doctor-order"
    const patientId = formData.get("patientId") as string | null
    const notes = formData.get("notes") as string | null
    const assessmentId = formData.get("assessmentId") as string | null

    if (!file || !uploadId || !uploadType || !priority || !fileType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] Processing file:", { uploadId, fileType, fileName: file.name })

    const blob = await put(`oasis/${uploadId}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: false,
    })

    console.log("[v0] File uploaded to blob:", blob.url)

    const fileText = await file.text()

    console.log("[v0] Creating Supabase service client...")
    const supabase = createServiceClient()
    console.log("[v0] Supabase service client created successfully")

    if (fileType === "oasis") {
      console.log("[v0] Analyzing OASIS document with AI...")
      const analysis = await analyzeOasisDocument(fileText)

      console.log("[v0] AI analysis complete:", {
        qualityScore: analysis.qualityScore,
        financialImpact: analysis.financialImpact.increase,
      })

      const insertData = {
        upload_id: uploadId,
        patient_id: patientId,
        patient_name: sanitizeText(analysis.patientInfo?.name),
        mrn: sanitizeText(analysis.patientInfo?.mrn),
        visit_type: sanitizeText(analysis.patientInfo?.visitType),
        payor: sanitizeText(analysis.patientInfo?.payor),
        visit_date: analysis.patientInfo?.visitDate || new Date().toISOString(),
        clinician_name: sanitizeText(analysis.patientInfo?.clinician),
        file_name: file.name,
        file_size: file.size,
        file_url: blob.url,
        file_type: file.type,
        upload_type: uploadType,
        priority,
        notes: sanitizeText(notes),
        status: "completed",
        processed_at: new Date().toISOString(),
        extracted_text: sanitizeText(fileText.substring(0, 10000)),
        primary_diagnosis: safeExtract(analysis.primaryDiagnosis),
        secondary_diagnoses: Array.isArray(analysis.secondaryDiagnoses)
          ? analysis.secondaryDiagnoses.map((d) => safeExtract(d))
          : [],
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

      console.log("[v0] Inserting assessment into database...")

      const { data: assessment, error } = await supabase.from("oasis_assessments").insert(insertData).select().single()

      if (error) {
        console.error("[v0] Database error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw new Error(`Failed to store assessment: ${error.message}`)
      }

      console.log("[v0] Assessment stored in database:", assessment.id)

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

      console.log("[v0] Processing doctor's order for assessment:", assessmentId)

      // Get the OASIS assessment
      const { data: assessment, error: fetchError } = await supabase
        .from("oasis_assessments")
        .select("extracted_text")
        .eq("upload_id", assessmentId)
        .single()

      if (fetchError || !assessment) {
        console.error("[v0] Error fetching assessment:", fetchError)
        return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
      }

      const analysis = await analyzeOasisDocument(assessment.extracted_text, fileText)

      const { error: orderError } = await supabase.from("doctor_orders").insert({
        assessment_id: assessmentId,
        upload_id: uploadId,
        file_name: file.name,
        file_size: file.size,
        file_url: blob.url,
        file_type: file.type,
        extracted_text: sanitizeText(fileText.substring(0, 10000)),
        matches_oasis: analysis.flaggedIssues.length === 0,
        discrepancies: analysis.flaggedIssues,
      })

      if (orderError) {
        console.error("[v0] Error storing doctor order:", orderError)
        throw new Error("Failed to store doctor order")
      }

      await supabase
        .from("oasis_assessments")
        .update({
          flagged_issues: analysis.flaggedIssues,
          updated_at: new Date().toISOString(),
        })
        .eq("upload_id", assessmentId)

      console.log("[v0] Doctor order processed and stored")

      return NextResponse.json({
        success: true,
        message: "Doctor order processed and compared with OASIS assessment",
        assessmentId,
        discrepancies: analysis.flaggedIssues.length,
      })
    }

    return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Processing error:", error)
    return NextResponse.json(
      {
        error: "Failed to process file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
