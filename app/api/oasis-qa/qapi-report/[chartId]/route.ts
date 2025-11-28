import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getQapiAuditFromAssessment } from "@/lib/oasis-qapi-utils"
import { generateStructuredQAPIReport } from "@/lib/qapi-report-generator"
import { formatQAPIReportAsText } from "@/lib/qapi-text-formatter"

export async function GET(request: NextRequest, { params }: { params: Promise<{ chartId: string }> }) {
  try {
    const { chartId } = await params
    console.log("[QAPI] ========================================")
    console.log("[QAPI] Fetching QAPI Report for Chart ID:", chartId)
    console.log("[QAPI] ========================================")

    const supabase = createServiceClient()

    // Get all documents for this chart from clinical_documents
    const { data: documents, error: docsError } = await supabase
      .from("clinical_documents")
      .select("*")
      .eq("chart_id", chartId)
      .eq("status", "completed")

    if (docsError) {
      console.error("[QAPI] Error fetching documents:", docsError)
      return NextResponse.json({ success: false, error: "Failed to fetch documents" }, { status: 500 })
    }

    // Get OASIS assessments for this chart
    // MUST match by chart_id only - no fallback matching
    console.log("[QAPI] 🔍 Searching for OASIS with chart_id:", chartId)
    
    const { data: oasisAssessments, error: oasisError } = await supabase
      .from("oasis_assessments")
      .select("*")
      .eq("chart_id", chartId)
      .eq("status", "completed")

    if (oasisError) {
      console.error("[QAPI] ❌ Error fetching OASIS:", oasisError)
    }

    const matchedOasisAssessments = oasisAssessments || []
    console.log("[QAPI] ✅ OASIS found by chart_id:", matchedOasisAssessments?.length || 0)
    
    if (matchedOasisAssessments.length > 0) {
      console.log("[QAPI] 📋 OASIS documents found:")
      matchedOasisAssessments.forEach((assessment: any) => {
        console.log("[QAPI]   -", assessment.file_name, "| chart_id:", assessment.chart_id, "| patient:", assessment.patient_name)
      })
    } else {
      console.log("[QAPI] ⚠️ No OASIS found with chart_id:", chartId)
      console.log("[QAPI] ⚠️ Make sure OASIS documents are uploaded with the same chart_id")
      
      // Debug: Check what chart_ids exist in the database
      const { data: allOasis } = await supabase
        .from("oasis_assessments")
        .select("chart_id, file_name, patient_name")
        .eq("status", "completed")
        .limit(10)
      
      console.log("[QAPI] 🔍 Sample OASIS chart_ids in database:", allOasis?.map((a: any) => ({
        chart_id: a.chart_id,
        file_name: a.file_name,
        patient: a.patient_name
      })))
    }

    console.log("[QAPI] Found documents:", documents?.length || 0)
    console.log("[QAPI] Found OASIS assessments:", matchedOasisAssessments?.length || 0)

    // Get all QA analysis for the documents
    const documentIds = documents?.map(doc => doc.id) || []
    const { data: qaAnalyses, error: qaError } = await supabase
      .from("qa_analysis")
      .select("*")
      .in("document_id", documentIds)

    if (qaError) {
      console.error("[QAPI] Error fetching QA analyses:", qaError)
    }

    console.log("[QAPI] Found QA analyses:", qaAnalyses?.length || 0)

    // Aggregate data for QAPI report
    const totalDocuments = (documents?.length || 0) + (matchedOasisAssessments?.length || 0)

    // Calculate average quality scores
    const qualityScores: number[] = []
    const complianceScores: number[] = []
    const completenessScores: number[] = []
    let totalRevenueImpact = 0
    let totalCurrentRevenue = 0  // ✅ Add: Sum of actual current revenue from OASIS
    let totalOptimizedRevenue = 0  // ✅ Add: Sum of optimized revenue from OASIS
    let totalIssues = 0

    // From clinical_documents QA analyses
    qaAnalyses?.forEach(qa => {
      if (qa.quality_score) qualityScores.push(qa.quality_score)
      if (qa.compliance_score) complianceScores.push(qa.compliance_score)
      if (qa.completeness_score) completenessScores.push(qa.completeness_score)
      
      // Get source document to determine document type
      const sourceDoc = documents?.find(doc => doc.id === qa.document_id)
      
      // Count all types of issues from clinical documents
      // Match the upload page logic exactly (lines 692-737)
      const documentType = sourceDoc?.document_type || qa.document_type || 'unknown'
      
      // Parse findings if it's a string (JSONB from database)
      let parsedFindings: any = null
      if (qa.findings) {
        try {
          parsedFindings = typeof qa.findings === 'string' ? JSON.parse(qa.findings) : qa.findings
        } catch (e) {
          console.error("[QAPI] Error parsing findings JSONB:", e)
          parsedFindings = {}
        }
      }
      
      // For physician orders: ONLY count missingInformation + qaFindings + qapiDeficiencies
      // (Upload page line 706-724: doesn't count flaggedIssues/inconsistencies/missingElements for physician orders)
      if (documentType === 'physician_order' && parsedFindings) {
        const analysis = parsedFindings?._analysis || parsedFindings
        
        if (analysis?.missingInformation && Array.isArray(analysis.missingInformation)) {
          totalIssues += analysis.missingInformation.length
        }
        if (analysis?.qaFindings && Array.isArray(analysis.qaFindings)) {
          totalIssues += analysis.qaFindings.length
        }
        if (analysis?.qapiDeficiencies && Array.isArray(analysis.qapiDeficiencies)) {
          totalIssues += analysis.qapiDeficiencies.length
        }
      }
      // For PT notes and POC: count flaggedIssues + inconsistencies + missingElements (all three separately)
      // (Upload page line 726-734: counts all three for "other clinical documents")
      // Upload page uses: f.analysis?.flaggedIssues || f.analysis?.findings?.flaggedIssues
      // The API returns analysis directly, but database stores in findings JSONB
      // We need to reconstruct the same structure from database
      else if (documentType !== 'oasis') {
        // Match upload page logic exactly
        // Upload page line 727: f.analysis?.flaggedIssues || f.analysis?.findings?.flaggedIssues
        // Database stores in qa.findings.flaggedIssues (need to parse JSONB first)
        const flaggedIssues = parsedFindings?.flaggedIssues || []
        
        // Upload page line 728: f.analysis?.inconsistencies || f.analysis?.findings?.inconsistencies
        // For PT notes: API returns analysis.inconsistencies (from structuredData), DB stores in findings.inconsistencies
        // For POC: API returns analysis.inconsistencies (from pocStructuredData), DB stores in findings.inconsistencies
        // Both are stored directly in findings.inconsistencies in the database
        const inconsistencies = parsedFindings?.inconsistencies || []
        
        // Upload page line 729: f.analysis?.missingElements || f.analysis?.missing_elements
        // API returns analysis.missingElements, DB stores in missing_elements column
        // Also check findings.missingElements as fallback
        const missingElements = qa.missing_elements || parsedFindings?.missingElements || []
        
        // Count all three separately (matching upload page line 731-734)
        // Upload page counts all three even if some are empty arrays
        const flaggedCount = Array.isArray(flaggedIssues) ? flaggedIssues.length : 0
        const inconsistenciesCount = Array.isArray(inconsistencies) ? inconsistencies.length : 0
        const missingCount = Array.isArray(missingElements) ? missingElements.length : 0
        
        totalIssues += flaggedCount + inconsistenciesCount + missingCount
        
        console.log(`[QAPI] ${documentType} issues: flagged=${flaggedCount}, inconsistencies=${inconsistenciesCount}, missing=${missingCount}, total=${flaggedCount + inconsistenciesCount + missingCount}`)
      }
      // Note: OASIS documents are counted separately in the matchedOasisAssessments loop below
      
      if (qa.revenue_impact?.increase) {
        totalRevenueImpact += qa.revenue_impact.increase
      }
    })

    // From OASIS assessments
    matchedOasisAssessments?.forEach(assessment => {
      console.log("[QAPI] Processing OASIS assessment:", assessment.id, assessment.file_name)
      
      if (assessment.quality_score) qualityScores.push(assessment.quality_score)
      if (assessment.confidence_score) complianceScores.push(assessment.confidence_score)
      if (assessment.completeness_score) completenessScores.push(assessment.completeness_score)
      
      // Count flagged_issues (which now includes inconsistencies converted to flagged_issues format)
      const flaggedIssuesCount = Array.isArray(assessment.flagged_issues) ? assessment.flagged_issues.length : 0
      const inconsistenciesCount = Array.isArray(assessment.inconsistencies) ? assessment.inconsistencies.length : 0
      
      console.log("[QAPI] OASIS flagged_issues count:", flaggedIssuesCount)
      console.log("[QAPI] OASIS inconsistencies count:", inconsistenciesCount)
      
      // SIMPLE RULE: Always count flagged_issues if it exists (it already includes converted inconsistencies)
      // Only count inconsistencies if flagged_issues is empty (old records that weren't converted)
      // This prevents double counting since inconsistencies are converted to flagged_issues when storing
      if (flaggedIssuesCount > 0) {
        totalIssues += flaggedIssuesCount
        console.log("[QAPI] ✅ Counting flagged_issues only (includes converted inconsistencies):", flaggedIssuesCount)
      } else if (inconsistenciesCount > 0) {
        // Old records: only has inconsistencies (not converted yet)
        totalIssues += inconsistenciesCount
        console.log("[QAPI] ✅ Counting inconsistencies only (old record format):", inconsistenciesCount)
      }
      
      // ✅ Get actual revenue amounts from OASIS (not just the increase)
      // Check extracted_data first (most accurate), then fallback to database columns
      // Parse extracted_data if needed
      let parsedExtractedData: any = null
      if (assessment.extracted_data) {
        try {
          parsedExtractedData = typeof assessment.extracted_data === 'string' 
            ? JSON.parse(assessment.extracted_data) 
            : assessment.extracted_data
        } catch (e) {
          console.error("[QAPI] Error parsing extracted_data for revenue:", e)
        }
      }
      
      let financialImpact = null
      if (parsedExtractedData?.financialImpact) {
        financialImpact = parsedExtractedData.financialImpact
      } else if (assessment.financial_impact) {
        try {
          financialImpact = typeof assessment.financial_impact === 'string' 
            ? JSON.parse(assessment.financial_impact) 
            : assessment.financial_impact
        } catch (e) {
          console.error("[QAPI] Error parsing financial_impact:", e)
        }
      }
      
      // Use financialImpact object if available, otherwise use database columns
      const currentRevenue = financialImpact?.currentRevenue || assessment.current_revenue || 0
      const optimizedRevenue = financialImpact?.optimizedRevenue || assessment.optimized_revenue || 0
      const revenueIncrease = financialImpact?.increase || assessment.revenue_increase || 0
      
      if (currentRevenue) {
        totalCurrentRevenue += Number(currentRevenue) || 0
        console.log("[QAPI] 💰 Adding current revenue:", currentRevenue, "Total now:", totalCurrentRevenue)
      }
      if (optimizedRevenue) {
        totalOptimizedRevenue += Number(optimizedRevenue) || 0
      }
      if (revenueIncrease) {
        totalRevenueImpact += Number(revenueIncrease) || 0
      } else if (currentRevenue && optimizedRevenue) {
        // Calculate increase if not provided
        const calculatedIncrease = Number(optimizedRevenue) - Number(currentRevenue)
        if (calculatedIncrease > 0) {
          totalRevenueImpact += calculatedIncrease
        }
      }
    })

    const avgQualityScore = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
      : 0

    const avgComplianceScore = complianceScores.length > 0
      ? Math.round(complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length)
      : 0

    const avgCompletenessScore = completenessScores.length > 0
      ? Math.round(completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length)
      : 0

    // Group documents by type
    const documentsByType: Record<string, any[]> = {}
    documents?.forEach(doc => {
      const type = doc.document_type || "unknown"
      if (!documentsByType[type]) {
        documentsByType[type] = []
      }
      const qaForDoc = qaAnalyses?.find(qa => qa.document_id === doc.id)
      const flaggedIssuesCount = qaForDoc?.findings?.flaggedIssues?.length || 0
      // Check for inconsistencies in findings (for PT notes) or pocStructuredData (for POC)
      const inconsistencies = qaForDoc?.findings?.inconsistencies || qaForDoc?.findings?.pocStructuredData?.inconsistencies || []
      const inconsistenciesCount = Array.isArray(inconsistencies) ? inconsistencies.length : 0
      const missingElementsCount = qaForDoc?.missing_elements?.length || 0
      
      documentsByType[type].push({
        id: doc.id,
        fileName: doc.file_name,
        documentType: doc.document_type,
        patientName: doc.patient_name,
        qualityScore: qaForDoc?.quality_score || 0,
        issues: flaggedIssuesCount + inconsistenciesCount + missingElementsCount,
        processedAt: doc.processed_at,
      })
    })

    // Add OASIS assessments
    matchedOasisAssessments?.forEach(assessment => {
      if (!documentsByType["oasis"]) {
        documentsByType["oasis"] = []
      }
      // SIMPLE RULE: Always use flagged_issues if it exists (it already includes converted inconsistencies)
      // Only use inconsistencies if flagged_issues is empty (old records)
      const flaggedIssuesCount = Array.isArray(assessment.flagged_issues) ? assessment.flagged_issues.length : 0
      const inconsistenciesCount = Array.isArray(assessment.inconsistencies) ? assessment.inconsistencies.length : 0
      
      // Always prefer flagged_issues to avoid double counting
      const totalIssuesForDoc = flaggedIssuesCount > 0 ? flaggedIssuesCount : inconsistenciesCount
      
      documentsByType["oasis"].push({
        id: assessment.id,
        fileName: assessment.file_name,
        documentType: "oasis",
        patientName: assessment.patient_name,
        qualityScore: assessment.quality_score || 0,
        issues: totalIssuesForDoc,
        processedAt: assessment.processed_at,
      })
      
      console.log("[QAPI] OASIS document added:", {
        fileName: assessment.file_name,
        flaggedIssues: flaggedIssuesCount,
        inconsistencies: inconsistenciesCount,
        totalIssues: totalIssuesForDoc,
        chart_id: assessment.chart_id
      })
    })

    // Aggregate recommendations and issues
    const allRecommendations: any[] = []
    const allRegulatoryIssues: any[] = []
    const allDocumentationGaps: any[] = []

    qaAnalyses?.forEach(qa => {
      const sourceDoc = documents?.find(doc => doc.id === qa.document_id)
      const documentInfo = {
        sourceDocument: sourceDoc?.file_name || 'Unknown',
        documentType: sourceDoc?.document_type || qa.document_type || 'unknown',
        documentId: sourceDoc?.id
      }
      
      // For physician orders, extract data from findings JSONB if needed
      let physicianOrderAnalysis: any = null
      if (qa.document_type === 'physician_order' && qa.findings) {
        try {
          const findings = typeof qa.findings === 'string' ? JSON.parse(qa.findings) : qa.findings
          if (findings?._analysis) {
            physicianOrderAnalysis = findings._analysis
          } else if (findings) {
            // Extract directly from findings if _analysis doesn't exist
            physicianOrderAnalysis = {
              missingInformation: findings.missingInformation || [],
              qaFindings: findings.qaFindings || [],
              qapiDeficiencies: findings.qapiDeficiencies || [],
              codingReview: findings.codingReview || [],
              financialRisks: findings.financialRisks || [],
            }
          }
        } catch (e) {
          console.error("[QAPI] Error parsing physician order findings:", e)
        }
      }
      
      // Recommendations - check multiple sources
      let recommendations: any[] = []
      if (qa.recommendations && Array.isArray(qa.recommendations)) {
        recommendations = qa.recommendations
      }
      // For physician orders, also check findings
      if (qa.document_type === 'physician_order' && physicianOrderAnalysis) {
        // Add recommendations from qapiDeficiencies
        if (physicianOrderAnalysis.qapiDeficiencies && Array.isArray(physicianOrderAnalysis.qapiDeficiencies)) {
          recommendations.push(...physicianOrderAnalysis.qapiDeficiencies.map((def: any) => ({
            recommendation: def.recommendation || def.deficiency,
            category: def.category || 'Physician Order',
            priority: def.severity === 'critical' || def.severity === 'high' ? 'high' : 'medium',
            expectedImpact: def.impact || ''
          })))
        }
        // Add recommendations from qaFindings
        if (physicianOrderAnalysis.qaFindings && Array.isArray(physicianOrderAnalysis.qaFindings)) {
          recommendations.push(...physicianOrderAnalysis.qaFindings.map((finding: any) => ({
            recommendation: finding.recommendation || finding.finding,
            category: finding.category || 'QA Finding',
            priority: finding.severity === 'critical' || finding.severity === 'high' ? 'high' : 'medium',
            expectedImpact: finding.recommendation || ''
          })))
        }
      }
      
      if (recommendations.length > 0) {
        allRecommendations.push(...recommendations.map((rec: any) => ({
          recommendation: typeof rec === 'string' ? rec : (rec.recommendation || rec.description || rec),
          category: rec.category || documentInfo.documentType,
          priority: rec.priority || 'medium',
          expectedImpact: rec.expectedImpact || rec.impact || '',
          ...documentInfo
        })))
      }
      
      // Regulatory Issues - check multiple sources
      let regulatoryIssues: any[] = []
      if (qa.regulatory_issues && Array.isArray(qa.regulatory_issues)) {
        regulatoryIssues = qa.regulatory_issues
      }
      // For physician orders, also check findings
      if (qa.document_type === 'physician_order' && physicianOrderAnalysis) {
        if (physicianOrderAnalysis.qapiDeficiencies && Array.isArray(physicianOrderAnalysis.qapiDeficiencies)) {
          regulatoryIssues.push(...physicianOrderAnalysis.qapiDeficiencies.map((def: any) => ({
            regulation: def.regulation || 'CMS/CHAP/Joint Commission',
            issue: def.deficiency || def.recommendation,
            severity: def.severity || 'medium',
            remediation: def.recommendation || 'Review and correct'
          })))
        }
      }
      
      if (regulatoryIssues.length > 0) {
        allRegulatoryIssues.push(...regulatoryIssues.map((issue: any) => ({
          regulation: issue.regulation || issue.regulation || 'Compliance',
          issue: typeof issue === 'string' ? issue : (issue.issue || issue.deficiency || issue.description || issue),
          severity: issue.severity || 'medium',
          remediation: issue.remediation || issue.recommendation || issue.correctiveAction || 'Review and correct',
          ...documentInfo
        })))
      }
      
      // Documentation Gaps - check multiple sources
      let documentationGaps: any[] = []
      if (qa.documentation_gaps && Array.isArray(qa.documentation_gaps)) {
        documentationGaps = qa.documentation_gaps
      }
      if (qa.missing_elements && Array.isArray(qa.missing_elements)) {
        documentationGaps.push(...qa.missing_elements.map((elem: any) => ({
          gap: elem.element || elem.field || elem,
          impact: elem.impact || 'Documentation incomplete',
          recommendation: elem.recommendation || 'Complete required documentation'
        })))
      }
      // For physician orders, also check findings
      if (qa.document_type === 'physician_order' && physicianOrderAnalysis) {
        if (physicianOrderAnalysis.missingInformation && Array.isArray(physicianOrderAnalysis.missingInformation)) {
          documentationGaps.push(...physicianOrderAnalysis.missingInformation.map((info: any) => ({
            gap: info.element || info.field,
            impact: info.impact || 'Documentation incomplete',
            recommendation: info.recommendation || 'Complete required documentation'
          })))
        }
      }
      
      if (documentationGaps.length > 0) {
        allDocumentationGaps.push(...documentationGaps.map((gap: any) => ({
          gap: typeof gap === 'string' ? gap : (gap.gap || gap.field || gap.element || gap),
          impact: gap.impact || 'Documentation incomplete',
          recommendation: gap.recommendation || 'Complete required documentation',
          ...documentInfo
        })))
      }
    })

    // Aggregate from OASIS assessments too
    matchedOasisAssessments?.forEach(assessment => {
      const oasisDocumentInfo = {
        sourceDocument: assessment.file_name || 'Unknown',
        documentType: 'oasis',
        documentId: assessment.id
      }
      
      console.log("[QAPI] Processing OASIS recommendations/issues for:", assessment.file_name)
      
      // Parse extracted_data if it's a string (JSONB from database)
      let extractedData = assessment.extracted_data
      if (typeof extractedData === 'string') {
        try {
          extractedData = JSON.parse(extractedData)
        } catch (e) {
          console.error("[QAPI] Failed to parse extracted_data:", e)
          extractedData = {}
        }
      }
      
      // ✅ Get qapiAudit using utility function (handles backward compatibility)
      const qapiAudit = getQapiAuditFromAssessment(assessment)
      console.log("[QAPI] 🔍 QAPI Audit:", qapiAudit ? "Found" : "Not found")
      
      // Get flagged_issues for conversion if needed
      const flaggedIssues = Array.isArray(assessment.flagged_issues) ? assessment.flagged_issues : []
      console.log("[QAPI] 🔍 Flagged issues count:", flaggedIssues.length)
      
      // Recommendations from OASIS - check ALL possible locations
      let oasisRecommendations: any[] = []
      
      // First, try to get from qapiAudit recommendations
      if (qapiAudit?.recommendations && qapiAudit.recommendations.length > 0) {
        oasisRecommendations = qapiAudit.recommendations.map((rec: any) => ({
          recommendation: rec.recommendation,
          category: rec.category,
          priority: rec.priority,
          expectedImpact: ''
        }))
      } else if (Array.isArray(assessment.recommendations) && assessment.recommendations.length > 0) {
        oasisRecommendations = assessment.recommendations
      } else if (Array.isArray(extractedData?.recommendations) && extractedData.recommendations.length > 0) {
        oasisRecommendations = extractedData.recommendations
      } else if (Array.isArray(extractedData?.qaReview?.recommendations) && extractedData.qaReview.recommendations.length > 0) {
        oasisRecommendations = extractedData.qaReview.recommendations
      } else if (Array.isArray(extractedData?.qapiAudit?.recommendations) && extractedData.qapiAudit.recommendations.length > 0) {
        oasisRecommendations = extractedData.qapiAudit.recommendations
      }
      
      // If no recommendations but we have flagged_issues, convert them
      if (oasisRecommendations.length === 0 && flaggedIssues.length > 0) {
        console.log("[QAPI] Converting flagged_issues to recommendations:", flaggedIssues.length)
        const converted = flaggedIssues
          .filter((issue: any) => issue.category !== 'inconsistency') // Exclude inconsistencies
          .map((issue: any) => ({
            recommendation: issue.issue || issue.suggestion || 'Review and address issue',
            category: issue.category || 'OASIS',
            priority: issue.severity === 'critical' || issue.severity === 'high' ? 'high' : 'medium',
            expectedImpact: issue.clinicalImpact || issue.suggestion || 'Address to improve quality'
          }))
        console.log("[QAPI] 🔍 Converted recommendations:", converted.length, JSON.stringify(converted, null, 2))
        oasisRecommendations = converted
      }
      
      if (Array.isArray(oasisRecommendations) && oasisRecommendations.length > 0) {
        console.log("[QAPI] ✅ Found OASIS recommendations:", oasisRecommendations.length)
        allRecommendations.push(...oasisRecommendations.map((rec: any) => ({
          recommendation: rec.recommendation || rec.description || rec,
          category: rec.category || 'OASIS',
          priority: rec.priority || 'medium',
          expectedImpact: rec.expectedImpact || rec.impact || '',
          ...oasisDocumentInfo
        })))
        console.log("[QAPI] ✅ Added to allRecommendations, total now:", allRecommendations.length)
      } else {
        console.log("[QAPI] ❌ No OASIS recommendations found - oasisRecommendations:", oasisRecommendations)
      }
      
      // Regulatory Issues from OASIS - check ALL possible locations
      // First try qapiAudit from utility, then fallback to direct access
      let oasisRegulatoryIssues: any[] = []
      
      if (qapiAudit?.regulatoryDeficiencies && qapiAudit.regulatoryDeficiencies.length > 0) {
        oasisRegulatoryIssues = qapiAudit.regulatoryDeficiencies
      } else if (Array.isArray(extractedData?.qapiAudit?.regulatoryDeficiencies) && extractedData.qapiAudit.regulatoryDeficiencies.length > 0) {
        oasisRegulatoryIssues = extractedData.qapiAudit.regulatoryDeficiencies
      } else if (Array.isArray(assessment.qapiAudit?.regulatoryDeficiencies) && assessment.qapiAudit.regulatoryDeficiencies.length > 0) {
        oasisRegulatoryIssues = assessment.qapiAudit.regulatoryDeficiencies
      } else if (Array.isArray(assessment.regulatory_issues) && assessment.regulatory_issues.length > 0) {
        oasisRegulatoryIssues = assessment.regulatory_issues
      }
      
      if (Array.isArray(oasisRegulatoryIssues) && oasisRegulatoryIssues.length > 0) {
        console.log("[QAPI] ✅ Found OASIS regulatory issues:", oasisRegulatoryIssues.length)
        const regulatoryIssues = oasisRegulatoryIssues.map((item: any) => ({
          regulation: item.regulation || 'OASIS Compliance',
          issue: item.deficiency || item.issue || item.description || 'Regulatory deficiency',
          severity: item.severity || 'medium',
          remediation: item.correctiveAction || item.remediation || item.recommendation || 'Review and correct',
          ...oasisDocumentInfo
        }))
        allRegulatoryIssues.push(...regulatoryIssues)
      } else {
        console.log("[QAPI] ❌ No OASIS regulatory issues found")
      }
      
      // Documentation Gaps from OASIS - check ALL possible locations
      let missingInfo: any[] = []
      
      // First try qapiAudit incompleteElements from utility
      if (qapiAudit?.incompleteElements && qapiAudit.incompleteElements.length > 0) {
        missingInfo = qapiAudit.incompleteElements.map((elem: any) => ({
          field: elem.element || elem.missingInformation,
          gap: elem.element || 'Missing element',
          location: elem.location || 'Unknown',
          impact: elem.impact || 'Documentation incomplete',
          recommendation: elem.recommendation || 'Complete required documentation'
        }))
      }
      
      // Also check qapiAudit contradictoryElements (inconsistencies) - these are also documentation gaps
      if (qapiAudit?.contradictoryElements && qapiAudit.contradictoryElements.length > 0) {
        const contradictoryGaps = qapiAudit.contradictoryElements.map((contra: any) => ({
          field: contra.location || `${contra.elementA} vs ${contra.elementB}`,
          gap: contra.contradiction || 'Data inconsistency detected',
          location: contra.location || 'Unknown',
          impact: contra.impact || 'Documentation inconsistency may affect care quality',
          recommendation: contra.recommendation || 'Review and resolve inconsistency in documentation'
        }))
        missingInfo = [...missingInfo, ...contradictoryGaps]
      }
      
      // Check other sources if no qapiAudit data
      if (missingInfo.length === 0) {
        if (Array.isArray(assessment.missing_information) && assessment.missing_information.length > 0) {
          missingInfo = assessment.missing_information
        } else if (Array.isArray(extractedData?.missing_information) && extractedData.missing_information.length > 0) {
          missingInfo = extractedData.missing_information
        } else if (Array.isArray(extractedData?.qaReview?.missingFields) && extractedData.qaReview.missingFields.length > 0) {
          missingInfo = extractedData.qaReview.missingFields
        }
      }
      
      // Also check extractedData qapiAudit incompleteElements (for direct access)
      if (Array.isArray(extractedData?.qapiAudit?.incompleteElements) && extractedData.qapiAudit.incompleteElements.length > 0) {
        const incompleteElements = extractedData.qapiAudit.incompleteElements.map((elem: any) => ({
          field: elem.element || elem.missingInformation,
          gap: elem.element || 'Missing element',
          location: elem.location || 'Unknown',
          impact: elem.impact || 'Documentation incomplete',
          recommendation: elem.recommendation || 'Complete required documentation'
        }))
        missingInfo = [...missingInfo, ...incompleteElements]
      }
      
      // Also check extractedData qapiAudit contradictoryElements
      if (Array.isArray(extractedData?.qapiAudit?.contradictoryElements) && extractedData.qapiAudit.contradictoryElements.length > 0) {
        const contradictoryGaps = extractedData.qapiAudit.contradictoryElements.map((contra: any) => ({
          field: contra.location || `${contra.elementA} vs ${contra.elementB}`,
          gap: contra.contradiction || 'Data inconsistency detected',
          location: contra.location || 'Unknown',
          impact: contra.impact || 'Documentation inconsistency may affect care quality',
          recommendation: contra.recommendation || 'Review and resolve inconsistency in documentation'
        }))
        missingInfo = [...missingInfo, ...contradictoryGaps]
      }
      
      // If no missing info but we have flagged_issues, use them as documentation gaps
      // Include ALL flagged_issues (including inconsistencies) as they may indicate documentation gaps
      if (missingInfo.length === 0 && flaggedIssues.length > 0) {
        console.log("[QAPI] Converting flagged_issues to documentation gaps:", flaggedIssues.length)
        const docIssues = flaggedIssues
          .map((issue: any) => {
            // For inconsistencies, extract the gap from the issue description
            if (issue.category === 'inconsistency') {
              return {
                field: issue.location || issue.issue?.split(':')[0] || 'Inconsistency detected',
                gap: issue.issue || issue.suggestion || 'Data inconsistency - documentation may be incomplete',
                location: issue.location || 'Unknown',
                impact: issue.clinicalImpact || issue.suggestion || 'Documentation inconsistency may affect care quality',
                recommendation: issue.suggestion || 'Review and resolve inconsistency in documentation'
              }
            } else {
              // For other issues, use them directly as documentation gaps
              return {
                field: issue.location || issue.issue,
                gap: issue.issue || 'Missing documentation',
                location: issue.location || 'Unknown',
                impact: issue.clinicalImpact || issue.suggestion || 'Documentation incomplete',
                recommendation: issue.suggestion || 'Complete required documentation'
              }
            }
          })
        console.log("[QAPI] 🔍 Converted documentation gaps:", docIssues.length, JSON.stringify(docIssues, null, 2))
        missingInfo = [...missingInfo, ...docIssues]
      } else if (missingInfo.length > 0 && flaggedIssues.length > 0) {
        // If we already have missing info, still add non-inconsistency flagged_issues as additional gaps
        console.log("[QAPI] Adding additional flagged_issues to documentation gaps:", flaggedIssues.length)
        const additionalGaps = flaggedIssues
          .filter((issue: any) => issue.category !== 'inconsistency') // Only add non-inconsistencies as additional gaps
          .map((issue: any) => ({
            field: issue.location || issue.issue,
            gap: issue.issue || 'Missing documentation',
            location: issue.location || 'Unknown',
            impact: issue.clinicalImpact || issue.suggestion || 'Documentation incomplete',
            recommendation: issue.suggestion || 'Complete required documentation'
          }))
        if (additionalGaps.length > 0) {
          console.log("[QAPI] 🔍 Added additional documentation gaps:", additionalGaps.length)
          missingInfo = [...missingInfo, ...additionalGaps]
        }
      }
      
      if (Array.isArray(missingInfo) && missingInfo.length > 0) {
        console.log("[QAPI] ✅ Found OASIS documentation gaps:", missingInfo.length)
        const gaps = missingInfo.map((item: any) => ({
          gap: item.field || item.gap || item.location || 'Missing information',
          impact: item.impact || 'Documentation incomplete',
          recommendation: item.recommendation || 'Complete required documentation',
          ...oasisDocumentInfo
        }))
        allDocumentationGaps.push(...gaps)
        console.log("[QAPI] ✅ Added to allDocumentationGaps, total now:", allDocumentationGaps.length)
      } else {
        console.log("[QAPI] ❌ No OASIS documentation gaps found")
      }
    })

    // Aggregate QAPI-specific data
    const qapiDeficiencies: any[] = []
    const qapiRecommendations: any[] = []

    qaAnalyses?.forEach(qa => {
      const sourceDoc = documents?.find(doc => doc.id === qa.document_id)
      const documentInfo = {
        sourceDocument: sourceDoc?.file_name || 'Unknown',
        documentType: sourceDoc?.document_type || qa.document_type || 'unknown',
        documentId: sourceDoc?.id
      }
      
      // For POC documents
      if (qa.findings?.qaQAPI) {
        if (qa.findings.qaQAPI.qapiDeficiencies && Array.isArray(qa.findings.qaQAPI.qapiDeficiencies)) {
          qapiDeficiencies.push(...qa.findings.qaQAPI.qapiDeficiencies.map((def: any) => ({
            ...def,
            ...documentInfo
          })))
        }
        if (qa.findings.qaQAPI.qapiRecommendations && Array.isArray(qa.findings.qaQAPI.qapiRecommendations)) {
          qapiRecommendations.push(...qa.findings.qaQAPI.qapiRecommendations.map((rec: any) => ({
            ...rec,
            ...documentInfo
          })))
        }
      }
      
      // For physician orders, extract QAPI data from findings
      if (qa.document_type === 'physician_order' && qa.findings) {
        try {
          const findings = typeof qa.findings === 'string' ? JSON.parse(qa.findings) : qa.findings
          const analysis = findings?._analysis || findings
          
          if (analysis?.qapiDeficiencies && Array.isArray(analysis.qapiDeficiencies)) {
            qapiDeficiencies.push(...analysis.qapiDeficiencies.map((def: any) => ({
              deficiency: def.deficiency || def.recommendation,
              category: def.category || 'Physician Order',
              regulation: def.regulation || 'CMS/CHAP/Joint Commission',
              severity: def.severity || 'medium',
              impact: def.impact || '',
              recommendation: def.recommendation || 'Review and correct',
              ...documentInfo
            })))
          }
          
          // Convert qapiDeficiencies to recommendations as well
          if (analysis?.qapiDeficiencies && Array.isArray(analysis.qapiDeficiencies)) {
            qapiRecommendations.push(...analysis.qapiDeficiencies.map((def: any) => ({
              recommendation: def.recommendation || def.deficiency,
              category: def.category || 'Physician Order',
              priority: def.severity === 'critical' || def.severity === 'high' ? 'high' : 'medium',
              ...documentInfo
            })))
          }
        } catch (e) {
          console.error("[QAPI] Error parsing physician order findings for QAPI data:", e)
        }
      }
    })

    // Aggregate QAPI data from OASIS assessments
    matchedOasisAssessments?.forEach(assessment => {
      const oasisDocumentInfo = {
        sourceDocument: assessment.file_name || 'Unknown',
        documentType: 'oasis',
        documentId: assessment.id
      }
      
      // Check extracted_data.qapiAudit
      if (assessment.extracted_data?.qapiAudit) {
        if (assessment.extracted_data.qapiAudit.qapiDeficiencies && Array.isArray(assessment.extracted_data.qapiAudit.qapiDeficiencies)) {
          qapiDeficiencies.push(...assessment.extracted_data.qapiAudit.qapiDeficiencies.map((def: any) => ({
            ...def,
            ...oasisDocumentInfo
          })))
        }
        if (assessment.extracted_data.qapiAudit.qapiRecommendations && Array.isArray(assessment.extracted_data.qapiAudit.qapiRecommendations)) {
          qapiRecommendations.push(...assessment.extracted_data.qapiAudit.qapiRecommendations.map((rec: any) => ({
            ...rec,
            ...oasisDocumentInfo
          })))
        }
      }
      
      // Also check qapiAudit at top level
      if (assessment.qapiAudit) {
        if (assessment.qapiAudit.qapiDeficiencies && Array.isArray(assessment.qapiAudit.qapiDeficiencies)) {
          qapiDeficiencies.push(...assessment.qapiAudit.qapiDeficiencies.map((def: any) => ({
            ...def,
            ...oasisDocumentInfo
          })))
        }
        if (assessment.qapiAudit.qapiRecommendations && Array.isArray(assessment.qapiAudit.qapiRecommendations)) {
          qapiRecommendations.push(...assessment.qapiAudit.qapiRecommendations.map((rec: any) => ({
            ...rec,
            ...oasisDocumentInfo
          })))
        }
      }
    })

    // Generate structured QAPI report
    const structuredReport = generateStructuredQAPIReport(
      {
        chartId,
        summary: {
          totalDocuments,
          avgQualityScore,
          avgComplianceScore,
          avgCompletenessScore,
          totalIssues,
          totalRevenueImpact,
          totalCurrentRevenue,  // ✅ Add: Actual current revenue
          totalOptimizedRevenue,  // ✅ Add: Optimized revenue
        },
        recommendations: allRecommendations,
        regulatoryIssues: allRegulatoryIssues,
        documentationGaps: allDocumentationGaps,
        qapiData: {
          deficiencies: qapiDeficiencies,
          recommendations: qapiRecommendations,
        },
      },
      documents || [],
      matchedOasisAssessments || [],
      qaAnalyses || []
    )

    // Generate formatted text report
    const formattedTextReport = formatQAPIReportAsText(structuredReport)

    const responseData = {
      success: true,
      chartId,
      summary: {
        totalDocuments,
        avgQualityScore,
        avgComplianceScore,
        avgCompletenessScore,
        totalIssues,
        totalRevenueImpact,
        totalCurrentRevenue,  // ✅ Add: Actual current revenue from OASIS
        totalOptimizedRevenue,  // ✅ Add: Optimized revenue from OASIS
      },
      documentsByType,
      recommendations: allRecommendations,
      regulatoryIssues: allRegulatoryIssues,
      documentationGaps: allDocumentationGaps,
      qapiData: {
        deficiencies: qapiDeficiencies,
        recommendations: qapiRecommendations,
      },
      // ✅ Add structured report for comprehensive QAPI format
      structuredReport,
      // ✅ Add formatted text report (ready to display or export)
      formattedTextReport,
      generatedAt: new Date().toISOString(),
    }

    console.log("[QAPI] ========================================")
    console.log("[QAPI] QAPI Report generated successfully")
    console.log("[QAPI] Total Documents:", totalDocuments)
    console.log("[QAPI] Avg Quality Score:", avgQualityScore)
    console.log("[QAPI] Total Issues:", totalIssues)
    console.log("[QAPI] Total Revenue Impact:", totalRevenueImpact)
    console.log("[QAPI] ========================================")

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[QAPI] ❌ Error generating QAPI report:", error)
    return NextResponse.json(
      { success: false, error: "Failed to generate QAPI report" },
      { status: 500 }
    )
  }
}

