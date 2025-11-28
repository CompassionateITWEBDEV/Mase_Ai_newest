import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[PT VISIT] ========================================")
    console.log("[PT VISIT] Fetching PT Visit optimization data for ID:", id)
    console.log("[PT VISIT] ========================================")

    const supabase = await createClient()

    // Get PT Visit document from clinical_documents table
    const { data: ptVisit, error } = await supabase
      .from("clinical_documents")
      .select("*")
      .eq("upload_id", id)
      .eq("document_type", "pt_note")
      .single()

    if (error || !ptVisit) {
      console.log("[PT VISIT] ❌ PT Visit not found:", id)
      console.log("[PT VISIT] Error:", error)
      return NextResponse.json({ success: false, error: "PT Visit not found" }, { status: 404 })
    }

    console.log("[PT VISIT] ✅ Found PT Visit document:", ptVisit.id)
    console.log("[PT VISIT] Patient Name:", ptVisit.patient_name)
    console.log("[PT VISIT] File Name:", ptVisit.file_name)
    console.log("[PT VISIT] ========================================")

    // Get QA Analysis for this document
    const { data: qaAnalysis, error: qaError } = await supabase
      .from("qa_analysis")
      .select("*")
      .eq("document_id", ptVisit.id)
      .eq("document_type", "pt_note")
      .single()

    if (qaError) {
      console.log("[PT VISIT] ⚠️ No QA Analysis found (this is okay if document was just uploaded)")
    } else {
      console.log("[PT VISIT] ✅ Found QA Analysis:", qaAnalysis.id)
      console.log("[PT VISIT] Quality Score:", qaAnalysis.quality_score)
      console.log("[PT VISIT] ========================================")
    }

    // Extract MRN from extracted_text if not in patient_id
    let mrn = ptVisit.patient_id
    if (!mrn && ptVisit.extracted_text) {
      const mrnMatch = ptVisit.extracted_text.match(/MRN[:\s]*([A-Z0-9]+)/i)
      mrn = mrnMatch ? mrnMatch[1] : null
    }

    // Build response with all extracted and analyzed data
    const responseData = {
      success: true,
      ptVisit: {
        id: ptVisit.id,
        uploadId: ptVisit.upload_id,
        chartId: ptVisit.chart_id,
        patientId: mrn || ptVisit.patient_id,
        patientName: ptVisit.patient_name,
        fileName: ptVisit.file_name,
        fileUrl: ptVisit.file_url,
        documentDate: ptVisit.document_date,
        clinicianName: ptVisit.clinician_name,
        discipline: ptVisit.discipline,
        status: ptVisit.status,
        processedAt: ptVisit.processed_at,
        extractedText: ptVisit.extracted_text,
        uploadType: ptVisit.upload_type || 'comprehensive-qa',
        priority: ptVisit.priority || 'medium',
        notes: ptVisit.notes || '',
      },
      analysis: qaAnalysis ? {
        qualityScore: qaAnalysis.quality_score,
        complianceScore: qaAnalysis.compliance_score,
        completenessScore: qaAnalysis.completeness_score,
        accuracyScore: qaAnalysis.accuracy_score,
        confidenceScore: qaAnalysis.confidence_score,
        // Extract all findings data - this contains the full comprehensive analysis
        findings: qaAnalysis.findings?.flaggedIssues || (Array.isArray(qaAnalysis.findings) ? qaAnalysis.findings : []),
        // All comprehensive analysis sections
        diagnoses: qaAnalysis.findings?.diagnoses || [],
        suggestedCodes: qaAnalysis.coding_suggestions || qaAnalysis.findings?.suggestedCodes || [],
        corrections: qaAnalysis.findings?.corrections || [],
        flaggedIssues: qaAnalysis.findings?.flaggedIssues || [],
        riskFactors: qaAnalysis.findings?.riskFactors || [],
        recommendations: qaAnalysis.recommendations || qaAnalysis.findings?.recommendations || [],
        missingElements: qaAnalysis.missing_elements || qaAnalysis.findings?.missingElements || [],
        regulatoryIssues: qaAnalysis.regulatory_issues || qaAnalysis.findings?.regulatoryIssues || [],
        documentationGaps: qaAnalysis.documentation_gaps || qaAnalysis.findings?.documentationGaps || [],
        financialImpact: qaAnalysis.revenue_impact || qaAnalysis.findings?.financialImpact || null,
        // PT-specific extracted data
        extractedPTData: qaAnalysis.findings?.extractedPTData || null,
        ptOptimizations: qaAnalysis.findings?.ptOptimizations || null,
        // Processing metadata
        analyzedAt: qaAnalysis.analyzed_at,
        processingTime: qaAnalysis.findings?.processingTime || null,
        // Full findings object for complete access
        fullFindings: qaAnalysis.findings || null,
      } : null,
    }

    console.log("[PT VISIT] ========================================")
    console.log("[PT VISIT] 📊 COMPLETE EXTRACTED DATA:")
    console.log("[PT VISIT] ========================================")
    console.log(JSON.stringify(responseData, null, 2))
    console.log("[PT VISIT] ========================================")

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[PT VISIT] ❌ Error fetching PT Visit data:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch PT Visit data" },
      { status: 500 }
    )
  }
}

