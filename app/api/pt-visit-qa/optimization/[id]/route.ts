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
        findings:
          qaAnalysis.findings?.flaggedIssues ||
          (Array.isArray(qaAnalysis.findings)
            ? qaAnalysis.findings.map((f: any) => (typeof f === "string" ? f : f?.issue || f?.element || "Finding"))
            : []),
        // All comprehensive analysis sections
        diagnoses: (qaAnalysis.findings?.diagnoses || []).map((d: any) =>
          typeof d === 'string' ? { code: d, description: 'Review document', confidence: 50, source: 'document' } : d
        ),
        suggestedCodes: (qaAnalysis.coding_suggestions || qaAnalysis.findings?.suggestedCodes || []).map((c: any) =>
          typeof c === 'string' ? { code: c, description: 'Review document', reason: 'Coding review needed', revenueImpact: 0, confidence: 50 } : c
        ),
        corrections: (qaAnalysis.findings?.corrections || []).map((c: any) =>
          typeof c === 'string' ? { field: c, current: 'N/A', suggested: 'N/A', reason: 'Review needed', impact: 'Documentation', revenueChange: 0 } : c
        ),
        flaggedIssues: (qaAnalysis.findings?.flaggedIssues || []).map((f: any) =>
          typeof f === 'string' ? { issue: f, severity: 'medium', location: 'document', suggestion: 'Review needed', category: 'documentation' } : f
        ),
        riskFactors: (qaAnalysis.findings?.riskFactors || []).map((r: any) =>
          typeof r === 'string' ? { factor: r, severity: 'medium', recommendation: 'Review needed', mitigation: 'Manual review' } : r
        ),
        recommendations: (qaAnalysis.recommendations || qaAnalysis.findings?.recommendations || []).map((r: any) => 
          typeof r === 'string' ? { recommendation: r, category: 'documentation', priority: 'medium', expectedImpact: 'Improved documentation' } : r
        ),
        missingElements: (qaAnalysis.missing_elements || qaAnalysis.findings?.missingElements || []).map((e: any) => 
          typeof e === 'string' ? e : (e?.element || e?.gap || 'Missing element')
        ),
        missingElementDetails: (qaAnalysis.missing_elements || qaAnalysis.findings?.missingElements || []).map((e: any) => 
          typeof e === 'string'
            ? { element: e, category: 'documentation', severity: 'medium', recommendation: 'Review required' }
            : {
                element: e?.element || e?.gap || 'Missing element',
                category: e?.category || 'documentation',
                severity: e?.severity || 'medium',
                recommendation: e?.recommendation || 'Review required'
              }
        ),
        regulatoryIssues: (qaAnalysis.regulatory_issues || qaAnalysis.findings?.regulatoryIssues || []).map((r: any) =>
          typeof r === 'string' ? { regulation: r, issue: 'Review needed', severity: 'medium', remediation: 'Manual review' } : r
        ),
        documentationGaps: (qaAnalysis.documentation_gaps || qaAnalysis.findings?.documentationGaps || []).map((d: any) =>
          typeof d === 'string' ? { gap: d, impact: 'Documentation incomplete', recommendation: 'Complete documentation' } : d
        ),
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

