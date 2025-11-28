import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[POC] ========================================")
    console.log("[POC] Fetching Plan of Care optimization data for ID:", id)
    console.log("[POC] ========================================")

    const supabase = await createClient()

    // Get Plan of Care document from clinical_documents table
    const { data: pocDocument, error } = await supabase
      .from("clinical_documents")
      .select("*")
      .eq("upload_id", id)
      .eq("document_type", "poc")
      .single()

    if (error || !pocDocument) {
      console.log("[POC] ❌ Plan of Care not found:", id)
      console.log("[POC] Error:", error)
      return NextResponse.json({ success: false, error: "Plan of Care not found" }, { status: 404 })
    }

    console.log("[POC] ✅ Found Plan of Care document:", pocDocument.id)
    console.log("[POC] Patient Name:", pocDocument.patient_name)
    console.log("[POC] File Name:", pocDocument.file_name)
    console.log("[POC] ========================================")

    // Get QA Analysis for this document
    const { data: qaAnalysis, error: qaError } = await supabase
      .from("qa_analysis")
      .select("*")
      .eq("document_id", pocDocument.id)
      .eq("document_type", "poc")
      .single()

    if (qaError) {
      console.log("[POC] ⚠️ No QA Analysis found (this is okay if document was just uploaded)")
    } else {
      console.log("[POC] ✅ Found QA Analysis:", qaAnalysis.id)
      console.log("[POC] Quality Score:", qaAnalysis.quality_score)
      console.log("[POC] ========================================")
    }

    // Build response with all extracted and analyzed data
    const responseData = {
      success: true,
      poc: {
        id: pocDocument.id,
        uploadId: pocDocument.upload_id,
        chartId: pocDocument.chart_id,
        patientId: pocDocument.patient_id,
        patientName: pocDocument.patient_name,
        fileName: pocDocument.file_name,
        fileUrl: pocDocument.file_url,
        documentDate: pocDocument.document_date,
        clinicianName: pocDocument.clinician_name,
        discipline: pocDocument.discipline,
        status: pocDocument.status,
        processedAt: pocDocument.processed_at,
        extractedText: pocDocument.extracted_text,
        uploadType: pocDocument.upload_type || 'comprehensive-qa',
        priority: pocDocument.priority || 'medium',
        notes: pocDocument.notes || '',
      },
      analysis: qaAnalysis ? {
        qualityScore: qaAnalysis.quality_score,
        complianceScore: qaAnalysis.compliance_score,
        completenessScore: qaAnalysis.completeness_score,
        accuracyScore: qaAnalysis.accuracy_score,
        confidenceScore: qaAnalysis.confidence_score,
        findings: Array.isArray(qaAnalysis.findings) ? qaAnalysis.findings : (qaAnalysis.findings?.flaggedIssues || []),
        recommendations: qaAnalysis.recommendations,
        missingElements: qaAnalysis.missing_elements,
        codingSuggestions: qaAnalysis.coding_suggestions,
        revenueImpact: qaAnalysis.revenue_impact,
        regulatoryIssues: qaAnalysis.regulatory_issues,
        documentationGaps: qaAnalysis.documentation_gaps,
        pocQAAnalysis: qaAnalysis.findings?.pocQAAnalysis || null,
        pocStructuredData: qaAnalysis.findings?.pocStructuredData || null,
        pocExtractedData: qaAnalysis.findings?.pocExtractedData || null,
        // Comprehensive 4-Section QA Analysis
        qaComprehensive: qaAnalysis.findings?.qaComprehensive || null,
        qaCodingReview: qaAnalysis.findings?.qaCodingReview || null,
        qaFinancialOptimization: qaAnalysis.findings?.qaFinancialOptimization || null,
        qaQAPI: qaAnalysis.findings?.qaQAPI || null,
        safetyRisks: qaAnalysis.findings?.safetyRisks || null,
        suggestedCodes: qaAnalysis.findings?.suggestedCodes || null,
        finalRecommendations: qaAnalysis.findings?.finalRecommendations || null,
        qualityScore: qaAnalysis.findings?.qualityScore || null,
        confidenceScore: qaAnalysis.findings?.confidenceScore || null,
        processingTime: qaAnalysis.findings?.processingTime || null,
        analyzedAt: qaAnalysis.analyzed_at,
      } : null,
    }

    console.log("[POC] ========================================")
    console.log("[POC] 📊 COMPLETE EXTRACTED DATA:")
    console.log("[POC] ========================================")
    console.log(JSON.stringify(responseData, null, 2))
    console.log("[POC] ========================================")

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[POC] ❌ Error fetching Plan of Care data:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch Plan of Care data" },
      { status: 500 }
    )
  }
}

