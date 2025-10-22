import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { analyzeClinicalDocument, type DocumentType } from "@/lib/clinical-qa-analyzer"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const fileUrl = formData.get("fileUrl") as string
    const fileName = formData.get("fileName") as string
    const fileType = formData.get("fileType") as string
    const fileSize = formData.get("fileSize") as string
    const uploadId = formData.get("uploadId") as string
    const documentType = formData.get("documentType") as DocumentType
    const patientId = formData.get("patientId") as string | null
    const patientName = formData.get("patientName") as string | null
    const mrn = formData.get("mrn") as string | null
    const chartReviewId = formData.get("chartReviewId") as string | null

    if (!fileUrl || !uploadId || !documentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Extract text from file (simplified - in production, use OCR/PDF parsing)
    const extractedText = `Sample ${documentType} document text for ${fileName}`

    // Insert document record
    const { data: document, error: docError } = await supabase
      .from("clinical_documents")
      .insert({
        upload_id: uploadId,
        patient_id: patientId,
        patient_name: patientName,
        mrn: mrn,
        document_type: documentType,
        file_name: fileName,
        file_url: fileUrl,
        file_type: fileType,
        file_size: Number.parseInt(fileSize),
        extracted_text: extractedText,
        status: "processing",
      })
      .select()
      .single()

    if (docError) throw docError

    // Analyze document with AI
    const analysis = await analyzeClinicalDocument(extractedText, documentType)

    // Store QA analysis
    const { error: analysisError } = await supabase.from("qa_analysis").insert({
      document_id: document.id,
      analysis_type: "comprehensive",
      quality_score: analysis.qualityScores.overall,
      confidence_score: analysis.qualityScores.confidence,
      completeness_score: analysis.qualityScores.completeness,
      accuracy_score: analysis.qualityScores.accuracy,
      compliance_score: analysis.qualityScores.compliance,
      diagnoses: analysis.diagnoses,
      suggested_codes: analysis.suggestedCodes,
      corrections: analysis.corrections,
      missing_elements: analysis.missingElements,
      flagged_issues: analysis.flaggedIssues,
      risk_factors: analysis.riskFactors,
      recommendations: analysis.recommendations,
      current_revenue: analysis.financialImpact.currentRevenue,
      optimized_revenue: analysis.financialImpact.optimizedRevenue,
      revenue_increase: analysis.financialImpact.increase,
      financial_breakdown: analysis.financialImpact.breakdown,
      regulatory_issues: analysis.regulatoryIssues,
      documentation_gaps: analysis.documentationGaps,
    })

    if (analysisError) throw analysisError

    // Update document status
    await supabase
      .from("clinical_documents")
      .update({ status: "completed", processed_at: new Date().toISOString() })
      .eq("id", document.id)

    // If part of chart review, link it
    if (chartReviewId) {
      await supabase.from("chart_review_documents").insert({
        chart_review_id: chartReviewId,
        document_id: document.id,
      })
    }

    return NextResponse.json({
      success: true,
      documentId: document.id,
      analysis,
      message: `${documentType} processed successfully`,
    })
  } catch (error) {
    console.error("Processing error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Processing failed" }, { status: 500 })
  }
}
