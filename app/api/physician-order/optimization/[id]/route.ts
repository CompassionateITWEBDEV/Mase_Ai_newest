import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[PHYSICIAN ORDER] Fetching optimization data for ID:", id)

    const supabase = await createClient()

    // Get physician order from clinical_documents table (same as PT visit)
    const { data: physicianOrderDoc, error: docError } = await supabase
      .from("clinical_documents")
      .select("*")
      .eq("upload_id", id)
      .eq("document_type", "physician_order")
      .single()

    if (docError || !physicianOrderDoc) {
      console.log("[PHYSICIAN ORDER] ❌ Document not found:", id)
      console.log("[PHYSICIAN ORDER] Error:", docError)
      return NextResponse.json({ success: false, error: "Physician order not found" }, { status: 404 })
    }

    console.log("[PHYSICIAN ORDER] ✅ Found document:", physicianOrderDoc.id)
    console.log("[PHYSICIAN ORDER] Patient Name:", physicianOrderDoc.patient_name)
    console.log("[PHYSICIAN ORDER] File Name:", physicianOrderDoc.file_name)
    console.log("[PHYSICIAN ORDER] ========================================")

    // Get QA analysis from qa_analysis table (same as PT visit)
    const { data: qaAnalysis, error: qaError } = await supabase
      .from("qa_analysis")
      .select("*")
      .eq("document_id", physicianOrderDoc.id)
      .eq("document_type", "physician_order")
      .maybeSingle()

    if (qaError && qaError.code !== 'PGRST116') {
      console.log("[PHYSICIAN ORDER] ⚠️ Error fetching QA analysis:", qaError)
    } else if (!qaAnalysis) {
      console.log("[PHYSICIAN ORDER] ⚠️ No QA Analysis found (document may still be processing)")
    } else {
      console.log("[PHYSICIAN ORDER] ✅ Found QA Analysis:", qaAnalysis.id)
      console.log("[PHYSICIAN ORDER] Quality Score:", qaAnalysis.quality_score)
    }

    // Parse analysis from findings JSONB
    let analysisData = null
    let discrepancies = []
    
    console.log("[PHYSICIAN ORDER] 📊 QA Analysis found:", !!qaAnalysis)
    console.log("[PHYSICIAN ORDER] 📊 Findings type:", typeof qaAnalysis?.findings)
    
    if (qaAnalysis?.findings) {
      try {
        const findings = typeof qaAnalysis.findings === 'string'
          ? JSON.parse(qaAnalysis.findings)
          : qaAnalysis.findings

        console.log("[PHYSICIAN ORDER] 📊 Findings keys:", findings ? Object.keys(findings) : 'null')

        // Extract analysis from findings
        if (findings && typeof findings === 'object') {
          // Check if _analysis exists (stored separately)
          if (findings._analysis) {
            analysisData = findings._analysis
            console.log("[PHYSICIAN ORDER] ✅ Found _analysis in findings")
          } 
          // Otherwise, extract directly from findings object
          else if (findings.presentInPdf || findings.missingInformation || findings.qaFindings) {
            analysisData = {
              presentInPdf: findings.presentInPdf || [],
              missingInformation: findings.missingInformation || [],
              qaFindings: findings.qaFindings || [],
              codingReview: findings.codingReview || [],
              financialRisks: findings.financialRisks || [],
              qapiDeficiencies: findings.qapiDeficiencies || [],
              optimizedOrderTemplate: findings.optimizedOrderTemplate || "",
              qualityScore: qaAnalysis.quality_score || 0,
              confidenceScore: qaAnalysis.confidence_score || 0,
            }
            console.log("[PHYSICIAN ORDER] ✅ Extracted analysis from findings directly")
          }
          
          // Extract discrepancies (non-analysis items from the discrepancies array)
          if (findings.discrepancies && Array.isArray(findings.discrepancies)) {
            discrepancies = findings.discrepancies
          } else {
            // Remove analysis fields to get discrepancies
            const { _analysis, presentInPdf, missingInformation, qaFindings, codingReview, financialRisks, qapiDeficiencies, optimizedOrderTemplate, discrepancies: disc, ...rest } = findings
            discrepancies = disc || (Array.isArray(rest) ? rest : Object.keys(rest).length > 0 ? [rest] : [])
          }
        }
        
        console.log("[PHYSICIAN ORDER] 📊 Analysis data extracted:", {
          hasPresentInPdf: !!analysisData?.presentInPdf?.length,
          hasMissingInfo: !!analysisData?.missingInformation?.length,
          hasQaFindings: !!analysisData?.qaFindings?.length,
          hasCodingReview: !!analysisData?.codingReview?.length,
          hasFinancialRisks: !!analysisData?.financialRisks?.length,
          hasQapiDeficiencies: !!analysisData?.qapiDeficiencies?.length,
          hasOptimizedTemplate: !!analysisData?.optimizedOrderTemplate,
        })
      } catch (e) {
        console.error("[PHYSICIAN ORDER] ❌ Error parsing findings:", e)
      }
    } else {
      console.log("[PHYSICIAN ORDER] ⚠️ No findings in QA analysis")
    }

    // Extract patient info from extracted_text if not in patient_name
    let patientInfo = {
      name: physicianOrderDoc.patient_name || "",
      mrn: "",
      dob: "",
      physician: "",
      npi: "",
      orderNumber: "",
      orderDate: "",
    }

    if (physicianOrderDoc.extracted_text) {
      const text = physicianOrderDoc.extracted_text
      // Extract MRN
      const mrnMatch = text.match(/MRN[:\s]*([A-Z0-9]+)/i) || 
                       text.match(/Medical Record Number[:\s]*([A-Z0-9]+)/i)
      if (mrnMatch) patientInfo.mrn = mrnMatch[1]

      // Extract DOB
      const dobMatch = text.match(/DOB[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i) ||
                          text.match(/Date of Birth[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i)
      if (dobMatch) patientInfo.dob = dobMatch[1]

      // Extract Physician Name
      const physicianMatch = text.match(/Physician[:\s]*([A-Z][a-z]+(?:,\s*[A-Z][a-z]+(?:\s+[A-Z])?)+(?:\s+MD)?)/i)
      if (physicianMatch) patientInfo.physician = physicianMatch[1]

      // Extract NPI
      const npiMatch = text.match(/NPI[:\s]*(\d+)/i)
      if (npiMatch) patientInfo.npi = npiMatch[1]

      // Extract Order Number
      const orderMatch = text.match(/Order\s*#?[:\s]*(\d+)/i)
      if (orderMatch) patientInfo.orderNumber = orderMatch[1]

      // Extract Order Date
      const orderDateMatch = text.match(/Order Date[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i)
      if (orderDateMatch) patientInfo.orderDate = orderDateMatch[1]
    }

    console.log("[PHYSICIAN ORDER] 📊 Extracted patient info:", patientInfo)
    console.log("[PHYSICIAN ORDER] ========================================")

    return NextResponse.json({
      success: true,
      data: {
        physicianOrder: {
          id: physicianOrderDoc.id,
          upload_id: physicianOrderDoc.upload_id,
          file_name: physicianOrderDoc.file_name,
          file_url: physicianOrderDoc.file_url,
          file_size: physicianOrderDoc.file_size,
          extracted_text: physicianOrderDoc.extracted_text,
          uploaded_at: physicianOrderDoc.created_at,
          chart_id: physicianOrderDoc.chart_id,
          patient_name: physicianOrderDoc.patient_name || patientInfo.name,
          patient_info: patientInfo,
          upload_type: physicianOrderDoc.upload_type || 'comprehensive-qa', // QA type used for analysis
        },
        analysisResults: analysisData || {
          presentInPdf: [],
          missingInformation: [],
          qaFindings: [],
          codingReview: [],
          financialRisks: [],
          qapiDeficiencies: [],
          optimizedOrderTemplate: "",
          qualityScore: qaAnalysis?.quality_score || 0,
          confidenceScore: qaAnalysis?.confidence_score || 0,
        },
        discrepancies: discrepancies,
        qaAnalysis: qaAnalysis,
      },
    })
  } catch (error) {
    console.error("[PHYSICIAN ORDER] Error fetching optimization data:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch optimization data" },
      { status: 500 }
    )
  }
}

