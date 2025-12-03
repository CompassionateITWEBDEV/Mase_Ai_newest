import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const chartId = searchParams.get("chartId")

    const supabase = createServiceClient()

    // Get all unique chart_ids from clinical_documents and oasis_assessments
    const { data: clinicalDocs, error: docsError } = await supabase
      .from("clinical_documents")
      .select("id, chart_id, patient_name, patient_id, document_type, file_name, status, created_at, processed_at")
      .eq("status", "completed")
      .order("created_at", { ascending: false })

    if (docsError) {
      console.error("[Comprehensive QA] Error fetching clinical documents:", docsError)
    }

    const { data: oasisAssessments, error: oasisError } = await supabase
      .from("oasis_assessments")
      .select("chart_id, patient_name, patient_id, mrn, visit_type, status, quality_score, created_at")
      .eq("status", "completed")
      .order("created_at", { ascending: false })

    if (oasisError) {
      console.error("[Comprehensive QA] Error fetching OASIS assessments:", oasisError)
    }

    // Group documents by chart_id
    const chartsMap = new Map<string, any>()

    // Process clinical documents
    clinicalDocs?.forEach((doc: any) => {
      if (!doc.chart_id) return

      const chartKey = doc.chart_id
      if (!chartsMap.has(chartKey)) {
        chartsMap.set(chartKey, {
          chartId: chartKey,
          patientName: doc.patient_name || "Unknown",
          patientId: doc.patient_id || chartKey,
          mrn: "N/A", // MRN not stored in clinical_documents, will be updated from OASIS if available
          documents: [],
          oasisAssessments: [],
          lastQADate: doc.created_at,
          overallScore: 0,
          complianceScore: 0,
          totalIssues: 0,
          criticalIssues: 0,
          financialImpact: 0,
        })
      }

      const chart = chartsMap.get(chartKey)!
      chart.documents.push({
        type: doc.document_type,
        fileName: doc.file_name,
        qualityScore: 0, // Will be filled from qa_analysis table
        status: doc.status,
        createdAt: doc.created_at,
      })
    })

    // Process OASIS assessments
    oasisAssessments?.forEach((assessment: any) => {
      if (!assessment.chart_id) return

      const chartKey = assessment.chart_id
      if (!chartsMap.has(chartKey)) {
        chartsMap.set(chartKey, {
          chartId: chartKey,
          patientName: assessment.patient_name || "Unknown",
          patientId: assessment.patient_id || chartKey,
          mrn: assessment.mrn || "N/A",
          documents: [],
          oasisAssessments: [],
          lastQADate: assessment.created_at,
          overallScore: 0,
          complianceScore: 0,
          totalIssues: 0,
          criticalIssues: 0,
          financialImpact: 0,
        })
      }

      const chart = chartsMap.get(chartKey)!
      chart.oasisAssessments.push({
        visitType: assessment.visit_type,
        fileName: assessment.file_name,
        qualityScore: assessment.quality_score || 0,
        status: assessment.status,
        createdAt: assessment.created_at,
      })

      // Update MRN from OASIS if available (OASIS has mrn column)
      if (assessment.mrn && chart.mrn === "N/A") {
        chart.mrn = assessment.mrn
      }

      // Update lastQADate if this is more recent
      if (new Date(assessment.created_at) > new Date(chart.lastQADate)) {
        chart.lastQADate = assessment.created_at
      }
    })

    // Get QA analysis for all documents to calculate scores and issues
    // First get all document IDs for these charts
    const allChartIds = Array.from(chartsMap.keys())
    const documentIds = clinicalDocs?.filter((doc: any) => allChartIds.includes(doc.chart_id))
      .map((doc: any) => doc.id) || []
    
    let qaAnalyses: any[] = []
    if (documentIds.length > 0) {
      const { data, error: qaError } = await supabase
        .from("qa_analysis")
        .select("document_id, quality_score, compliance_score, document_type, findings, missing_elements, chart_id")
        .in("document_id", documentIds)
      
      if (qaError) {
        console.error("[Comprehensive QA] Error fetching QA analyses:", qaError)
      } else {
        qaAnalyses = data || []
      }
    }

    // Get OASIS assessments with financial impact
    const { data: oasisWithFinancial, error: oasisFinError } = await supabase
      .from("oasis_assessments")
      .select("chart_id, financial_impact, current_revenue, optimized_revenue, revenue_increase, flagged_issues")
      .in("chart_id", allChartIds)

    if (oasisFinError) {
      console.error("[Comprehensive QA] Error fetching OASIS financial data:", oasisFinError)
    }

    // Create a map of document_id to chart_id for quick lookup
    const docIdToChartId = new Map<number, string>()
    clinicalDocs?.forEach((doc: any) => {
      if (doc.chart_id && doc.id) {
        docIdToChartId.set(doc.id, doc.chart_id)
      }
    })

    // Calculate scores and issues for each chart
    chartsMap.forEach((chart, chartKey) => {
      // Get QA analyses for documents in this chart
      const chartQAs = qaAnalyses?.filter((qa: any) => {
        const qaChartId = qa.chart_id || docIdToChartId.get(qa.document_id)
        return qaChartId === chartKey
      }) || []
      const chartOasis = oasisWithFinancial?.filter((o: any) => o.chart_id === chartKey) || []

      // Calculate average quality scores
      const qualityScores: number[] = []
      const complianceScores: number[] = []

      // Update document quality scores from QA analyses
      chart.documents.forEach((doc: any) => {
        // Find QA analysis for this document type
        const docQA = chartQAs.find((qa: any) => qa.document_type === doc.type)
        if (docQA && docQA.quality_score) {
          doc.qualityScore = docQA.quality_score
        }
      })

      chartQAs.forEach((qa: any) => {
        if (qa.quality_score) qualityScores.push(qa.quality_score)
        if (qa.compliance_score) complianceScores.push(qa.compliance_score)
      })

      chart.oasisAssessments.forEach((oasis: any) => {
        if (oasis.qualityScore) qualityScores.push(oasis.qualityScore)
      })

      chart.overallScore = qualityScores.length > 0
        ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
        : 0

      chart.complianceScore = complianceScores.length > 0
        ? Math.round(complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length)
        : chart.overallScore

      // Count issues
      let totalIssues = 0
      let criticalIssues = 0

      chartQAs.forEach((qa: any) => {
        try {
          const findings = typeof qa.findings === 'string' ? JSON.parse(qa.findings) : qa.findings
          
          // Count flagged issues
          if (findings?.flaggedIssues && Array.isArray(findings.flaggedIssues)) {
            totalIssues += findings.flaggedIssues.length
            criticalIssues += findings.flaggedIssues.filter((issue: any) => 
              issue.severity === 'critical' || issue.severity === 'high'
            ).length
          }

          // Count inconsistencies
          if (findings?.inconsistencies && Array.isArray(findings.inconsistencies)) {
            totalIssues += findings.inconsistencies.length
          }

          // Count missing elements
          if (qa.missing_elements && Array.isArray(qa.missing_elements)) {
            totalIssues += qa.missing_elements.length
          }

          // For physician orders
          if (qa.document_type === 'physician_order' && findings?._analysis) {
            const analysis = findings._analysis
            if (analysis.missingInformation && Array.isArray(analysis.missingInformation)) {
              totalIssues += analysis.missingInformation.length
            }
            if (analysis.qaFindings && Array.isArray(analysis.qaFindings)) {
              totalIssues += analysis.qaFindings.length
            }
            if (analysis.qapiDeficiencies && Array.isArray(analysis.qapiDeficiencies)) {
              totalIssues += analysis.qapiDeficiencies.length
            }
          }
        } catch (e) {
          console.error("[Comprehensive QA] Error parsing findings:", e)
        }
      })

      // Count OASIS flagged issues
      chartOasis.forEach((oasis: any) => {
        if (oasis.flagged_issues && Array.isArray(oasis.flagged_issues)) {
          totalIssues += oasis.flagged_issues.length
          criticalIssues += oasis.flagged_issues.filter((issue: any) => 
            issue.severity === 'critical' || issue.severity === 'high'
          ).length
        }
      })

      chart.totalIssues = totalIssues
      chart.criticalIssues = criticalIssues

      // Calculate financial impact
      let financialImpact = 0
      chartOasis.forEach((oasis: any) => {
        if (oasis.revenue_increase) {
          financialImpact += Number(oasis.revenue_increase) || 0
        } else if (oasis.financial_impact) {
          try {
            const finImpact = typeof oasis.financial_impact === 'string' 
              ? JSON.parse(oasis.financial_impact) 
              : oasis.financial_impact
            if (finImpact?.increase) {
              financialImpact += Number(finImpact.increase) || 0
            }
          } catch (e) {
            console.error("[Comprehensive QA] Error parsing financial_impact:", e)
          }
        }
      })

      chart.financialImpact = financialImpact

      // Determine risk level
      if (chart.overallScore < 70 || chart.totalIssues > 15 || chart.criticalIssues > 3) {
        chart.riskLevel = "critical"
      } else if (chart.overallScore < 80 || chart.totalIssues > 10 || chart.criticalIssues > 1) {
        chart.riskLevel = "high"
      } else if (chart.overallScore < 90 || chart.totalIssues > 5) {
        chart.riskLevel = "medium"
      } else {
        chart.riskLevel = "low"
      }

      // Determine status
      if (chart.totalIssues > 10 || chart.criticalIssues > 0) {
        chart.status = "requires_review"
      } else if (chart.documents.length > 0 || chart.oasisAssessments.length > 0) {
        chart.status = "completed"
      } else {
        chart.status = "pending"
      }
    })

    // Convert map to array and format as PatientQARecord
    const patientRecords = Array.from(chartsMap.values()).map((chart) => {
      // Map document types
      const documentTypes: any = {
        oasis: { score: 0, status: "missing", issues: 0 },
        clinicalNotes: { score: 0, status: "missing", issues: 0 },
        medicationRecords: { score: 0, status: "missing", issues: 0 },
        carePlan: { score: 0, status: "missing", issues: 0 },
        physicianOrders: { score: 0, status: "missing", issues: 0 },
        progressNotes: { score: 0, status: "missing", issues: 0 },
        assessments: { score: 0, status: "missing", issues: 0 },
        labResults: { score: 0, status: "missing", issues: 0 },
        insuranceAuth: { score: 0, status: "missing", issues: 0 },
      }

      // Map OASIS
      if (chart.oasisAssessments.length > 0) {
        const avgScore = Math.round(
          chart.oasisAssessments.reduce((sum: number, o: any) => sum + (o.qualityScore || 0), 0) /
          chart.oasisAssessments.length
        )
        documentTypes.oasis = {
          score: avgScore,
          status: "complete",
          issues: chart.oasisAssessments.length,
        }
      }

      // Map other document types
      chart.documents.forEach((doc: any) => {
        const docType = doc.type
        if (docType === "poc") {
          documentTypes.carePlan = {
            score: doc.qualityScore || 0,
            status: doc.status === "completed" ? "complete" : "incomplete",
            issues: 0,
          }
        } else if (docType === "physician_order") {
          documentTypes.physicianOrders = {
            score: doc.qualityScore || 0,
            status: doc.status === "completed" ? "complete" : "incomplete",
            issues: 0,
          }
        } else if (docType === "pt_note" || docType === "rn_note" || docType === "ot_note") {
          documentTypes.progressNotes = {
            score: doc.qualityScore || 0,
            status: doc.status === "completed" ? "complete" : "incomplete",
            issues: 0,
          }
        } else if (docType === "evaluation") {
          documentTypes.assessments = {
            score: doc.qualityScore || 0,
            status: doc.status === "completed" ? "complete" : "incomplete",
            issues: 0,
          }
        }
      })

      return {
        id: chart.patientId || chart.chartId,
        patientName: chart.patientName,
        mrn: chart.mrn,
        axxessId: chart.chartId,
        lastQADate: chart.lastQADate?.split("T")[0] || new Date().toISOString().split("T")[0],
        overallScore: chart.overallScore,
        complianceScore: chart.complianceScore,
        riskLevel: chart.riskLevel,
        status: chart.status,
        assignedStaff: "System",
        documentTypes,
        totalIssues: chart.totalIssues,
        criticalIssues: chart.criticalIssues,
        financialImpact: chart.financialImpact,
        nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        axxessLastSync: chart.lastQADate || new Date().toISOString(),
        chartId: chart.chartId,
        documents: chart.documents,
        oasisAssessments: chart.oasisAssessments,
      }
    })

    // Filter by patientId or chartId if provided
    let filteredRecords = patientRecords
    if (patientId) {
      filteredRecords = patientRecords.filter((p) => p.id === patientId || p.axxessId === patientId)
    }
    if (chartId) {
      filteredRecords = patientRecords.filter((p) => p.chartId === chartId)
    }

    return NextResponse.json({
      success: true,
      data: filteredRecords,
      total: filteredRecords.length,
    })
  } catch (error) {
    console.error("[Comprehensive QA] Error fetching patient records:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch patient records" },
      { status: 500 }
    )
  }
}

