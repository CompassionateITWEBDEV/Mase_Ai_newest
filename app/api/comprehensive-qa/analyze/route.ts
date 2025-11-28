import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, chartId } = body

    if (!chartId && !patientId) {
      return NextResponse.json({ success: false, error: "chartId or patientId is required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Find chartId from patientId if needed, or use provided chartId
    let finalChartId = chartId
    if (!finalChartId && patientId) {
      // Try to find chart by patientId
      const { data: patientChart } = await supabase
        .from("clinical_documents")
        .select("chart_id")
        .eq("patient_id", patientId)
        .limit(1)
        .single()
      
      if (patientChart?.chart_id) {
        finalChartId = patientChart.chart_id
      } else {
        finalChartId = `CHART-${patientId}`
      }
    }

    // Fetch all documents for this chart
    const { data: documents } = await supabase
      .from("clinical_documents")
      .select("*")
      .eq("chart_id", finalChartId)
      .eq("status", "completed")

    const { data: oasisAssessments } = await supabase
      .from("oasis_assessments")
      .select("*")
      .eq("chart_id", finalChartId)
      .eq("status", "completed")

    // Get QA analyses
    const documentIds = documents?.map(doc => doc.id) || []
    const { data: qaAnalyses } = await supabase
      .from("qa_analysis")
      .select("*")
      .in("document_id", documentIds.length > 0 ? documentIds : [0])

    // Aggregate scores and issues
    const qualityScores: number[] = []
    const complianceScores: number[] = []
    let totalIssues = 0
    let financialImpact = 0
    const flaggedIssues: any[] = []

    // Process clinical documents
    documents?.forEach((doc: any) => {
      if (doc.quality_score) qualityScores.push(doc.quality_score)
    })

    // Process OASIS assessments
    oasisAssessments?.forEach((oasis: any) => {
      if (oasis.quality_score) qualityScores.push(oasis.quality_score)
      if (oasis.revenue_increase) financialImpact += Number(oasis.revenue_increase) || 0
      if (oasis.flagged_issues && Array.isArray(oasis.flagged_issues)) {
        flaggedIssues.push(...oasis.flagged_issues)
        totalIssues += oasis.flagged_issues.length
      }
    })

    // Process QA analyses
    qaAnalyses?.forEach((qa: any) => {
      if (qa.quality_score) qualityScores.push(qa.quality_score)
      if (qa.compliance_score) complianceScores.push(qa.compliance_score)
      
      try {
        const findings = typeof qa.findings === 'string' ? JSON.parse(qa.findings) : qa.findings
        if (findings?.flaggedIssues && Array.isArray(findings.flaggedIssues)) {
          flaggedIssues.push(...findings.flaggedIssues)
          totalIssues += findings.flaggedIssues.length
        }
        if (findings?.inconsistencies && Array.isArray(findings.inconsistencies)) {
          totalIssues += findings.inconsistencies.length
        }
        if (qa.missing_elements && Array.isArray(qa.missing_elements)) {
          totalIssues += qa.missing_elements.length
        }
      } catch (e) {
        console.error("[Comprehensive QA] Error parsing findings:", e)
      }
    })

    const overallQAScore = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
      : 0

    const complianceScore = complianceScores.length > 0
      ? Math.round(complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length)
      : overallQAScore

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "critical" = "low"
    const criticalIssues = flaggedIssues.filter((issue: any) => 
      issue.severity === 'critical' || issue.severity === 'high'
    ).length

    if (overallQAScore < 70 || totalIssues > 15 || criticalIssues > 3) {
      riskLevel = "critical"
    } else if (overallQAScore < 80 || totalIssues > 10 || criticalIssues > 1) {
      riskLevel = "high"
    } else if (overallQAScore < 90 || totalIssues > 5) {
      riskLevel = "medium"
    }

    // Get patient info from first document
    const patientInfo = documents?.[0] || oasisAssessments?.[0] || {}
    const patientName = patientInfo.patient_name || "Unknown"
    const mrn = patientInfo.mrn || "N/A"

    const analysisResult = {
      patientInfo: {
        name: patientName,
        mrn: mrn,
        dob: patientInfo.dob || "N/A",
        admissionDate: patientInfo.visit_date || new Date().toISOString().split("T")[0],
        primaryDiagnosis: patientInfo.primary_diagnosis || "N/A",
        payor: patientInfo.payor || "N/A",
        clinician: patientInfo.clinician_name || "N/A",
        status: "Active - Under Care",
      },
      overallQAScore,
      complianceScore,
      riskLevel,
      processingTime: 0,
      documentTypes: {
        oasis: { qualityScore: 0, status: "missing", issues: 0 },
        clinicalNotes: { qualityScore: 0, status: "missing", issues: 0 },
        medicationRecords: { qualityScore: 0, status: "missing", issues: 0 },
        carePlan: { qualityScore: 0, status: "missing", issues: 0 },
        physicianOrders: { qualityScore: 0, status: "missing", issues: 0 },
        progressNotes: { qualityScore: 0, status: "missing", issues: 0 },
        assessments: { qualityScore: 0, status: "missing", issues: 0 },
        labResults: { qualityScore: 0, status: "missing", issues: 0 },
        insuranceAuth: { qualityScore: 0, status: "missing", issues: 0 },
      },
      totalIssues,
      criticalIssues,
      highIssues: flaggedIssues.filter((i: any) => i.severity === 'high').length,
      mediumIssues: flaggedIssues.filter((i: any) => i.severity === 'medium').length,
      lowIssues: flaggedIssues.filter((i: any) => i.severity === 'low').length,
      financialImpact,
      recommendations: [
        totalIssues > 10 ? "Address multiple documentation issues immediately" : "",
        criticalIssues > 0 ? "Review and resolve critical issues" : "",
        overallQAScore < 80 ? "Improve overall documentation quality" : "",
      ].filter(Boolean),
      lastReviewed: new Date().toISOString(),
      reviewedBy: "MASE AI Quality System",
    }

    // Map document types
    documents?.forEach((doc: any) => {
      if (doc.document_type === "poc") {
        analysisResult.documentTypes.carePlan = {
          qualityScore: doc.quality_score || 0,
          status: "complete",
          issues: 0,
        }
      } else if (doc.document_type === "physician_order") {
        analysisResult.documentTypes.physicianOrders = {
          qualityScore: doc.quality_score || 0,
          status: "complete",
          issues: 0,
        }
      } else if (doc.document_type === "pt_note" || doc.document_type === "rn_note") {
        analysisResult.documentTypes.progressNotes = {
          qualityScore: doc.quality_score || 0,
          status: "complete",
          issues: 0,
        }
      }
    })

    if (oasisAssessments && oasisAssessments.length > 0) {
      const avgOasisScore = Math.round(
        oasisAssessments.reduce((sum: number, o: any) => sum + (o.quality_score || 0), 0) /
        oasisAssessments.length
      )
      analysisResult.documentTypes.oasis = {
        qualityScore: avgOasisScore,
        status: "complete",
        issues: oasisAssessments.reduce((sum: number, o: any) => 
          sum + (Array.isArray(o.flagged_issues) ? o.flagged_issues.length : 0), 0
        ),
      }
    }

    return NextResponse.json({
      success: true,
      overallQAScore,
      complianceScore,
      riskLevel,
      flaggedIssues,
      financialImpact,
      reviewRequired: totalIssues > 10 || criticalIssues > 0,
      data: analysisResult,
    })
  } catch (error) {
    console.error("Error in comprehensive QA analysis:", error)
    return NextResponse.json({ success: false, error: "Failed to analyze chart" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ success: false, error: "Patient ID is required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Find chart by patientId
    const { data: patientChart } = await supabase
      .from("clinical_documents")
      .select("chart_id, patient_name, mrn")
      .eq("patient_id", patientId)
      .limit(1)
      .single()

    if (!patientChart) {
      return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 })
    }

    // Fetch patient data
    const { data: documents } = await supabase
      .from("clinical_documents")
      .select("*")
      .eq("chart_id", patientChart.chart_id)
      .eq("status", "completed")

    const { data: oasisAssessments } = await supabase
      .from("oasis_assessments")
      .select("*")
      .eq("chart_id", patientChart.chart_id)
      .eq("status", "completed")

    const qualityScores: number[] = []
    documents?.forEach((doc: any) => {
      if (doc.quality_score) qualityScores.push(doc.quality_score)
    })
    oasisAssessments?.forEach((oasis: any) => {
      if (oasis.quality_score) qualityScores.push(oasis.quality_score)
    })

    const overallQAScore = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
      : 0

    const mockData = {
      patientInfo: {
        name: patientChart.patient_name || "Unknown",
        mrn: patientChart.mrn || "N/A",
        dob: "N/A",
        admissionDate: new Date().toISOString().split("T")[0],
        primaryDiagnosis: "N/A",
        payor: "N/A",
        clinician: "N/A",
        status: "Active - Under Care",
      },
      overallQAScore,
      complianceScore: overallQAScore,
      riskLevel: overallQAScore < 80 ? "high" : overallQAScore < 90 ? "medium" : "low",
      processingTime: 0,
      lastReviewed: new Date().toISOString(),
      reviewedBy: "MASE AI Quality System",
    }

    return NextResponse.json({
      success: true,
      data: mockData,
    })
  } catch (error) {
    console.error("Error fetching comprehensive QA data:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 })
  }
}
