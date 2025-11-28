import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chartId: string }> }
) {
  try {
    const { chartId } = await params

    if (!chartId) {
      return NextResponse.json(
        { success: false, error: "chartId is required" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get all documents for this chart (include all statuses to catch all documents)
    console.log(`[Chart QA] 🔍 Searching for documents with chart_id: "${chartId}"`)
    const { data: documents, error: docsError } = await supabase
      .from("clinical_documents")
      .select("id, chart_id, patient_name, patient_id, document_type, file_name, status, created_at")
      .eq("chart_id", chartId)
      .order("created_at", { ascending: false })
    
    // Also try case-insensitive match in case there are formatting differences
    const { data: caseInsensitiveDocs } = await supabase
      .from("clinical_documents")
      .select("id, chart_id, patient_name, patient_id, document_type, file_name, status, created_at")
      .ilike("chart_id", chartId)
      .order("created_at", { ascending: false })
    
    // Combine and deduplicate
    const allDocs = [...(documents || []), ...(caseInsensitiveDocs || [])]
    let finalDocsList: any[] = allDocs.filter((doc, index, self) => 
      index === self.findIndex(d => d.id === doc.id)
    )
    
    if (docsError) {
      console.error("[Chart QA] ❌ Error fetching clinical documents:", docsError)
    }
    
    console.log(`[Chart QA] 📊 Query Results:`)
    console.log(`  - Exact match: ${documents?.length || 0} documents`)
    console.log(`  - Case-insensitive match: ${caseInsensitiveDocs?.length || 0} documents`)
    console.log(`  - Total unique: ${finalDocsList.length} documents`)
    
    if (finalDocsList.length > 0) {
      console.log("[Chart QA] 📄 Document details:")
      finalDocsList.forEach((doc: any) => {
        console.log(`  - ${doc.document_type}: ${doc.file_name} (ID: ${doc.id}, chart_id: "${doc.chart_id}", status: ${doc.status})`)
      })
    } else {
      // If no documents found, check what documents exist with similar chart_id or recent uploads
      console.log(`[Chart QA] ⚠️ No documents found with exact chart_id: ${chartId}`)
      console.log(`[Chart QA] 🔍 Checking for documents with similar chart_id...`)
      
      // Try to find documents with partial match
      const { data: similarDocs } = await supabase
        .from("clinical_documents")
        .select("id, chart_id, patient_name, patient_id, document_type, file_name, status, created_at")
        .ilike("chart_id", `%${chartId}%`)
        .order("created_at", { ascending: false })
        .limit(10)
      
      if (similarDocs && similarDocs.length > 0) {
        console.log(`[Chart QA] Found ${similarDocs.length} documents with similar chart_id:`)
        similarDocs.forEach((doc: any) => {
          console.log(`  - ${doc.document_type}: ${doc.file_name} (chart_id: ${doc.chart_id})`)
        })
        
        // Use exact matches from similar docs if finalDocsList is still empty
        if (finalDocsList.length === 0) {
          const exactMatches = similarDocs.filter((doc: any) => doc.chart_id === chartId)
          if (exactMatches.length > 0) {
            console.log(`[Chart QA] ✅ Using ${exactMatches.length} exact matches from similar search`)
            finalDocsList = exactMatches
          }
        }
      }
      
      // Also check recent documents to see what chart_ids exist
      const { data: recentDocs } = await supabase
        .from("clinical_documents")
        .select("chart_id, document_type, file_name, created_at")
        .order("created_at", { ascending: false })
        .limit(20)
      
      if (recentDocs && recentDocs.length > 0) {
        console.log(`[Chart QA] 📋 Recent documents in database (last 20):`)
        recentDocs.forEach((doc: any) => {
          console.log(`  - ${doc.document_type}: chart_id="${doc.chart_id}", file=${doc.file_name}`)
        })
      }
      
      // Also check if there are any documents with the exact chart_id but different case or formatting
      const { data: allDocsWithChartId } = await supabase
        .from("clinical_documents")
        .select("id, chart_id, patient_name, patient_id, document_type, file_name, status, created_at")
        .ilike("chart_id", chartId)
        .limit(50)
      
      if (allDocsWithChartId && allDocsWithChartId.length > 0) {
        console.log(`[Chart QA] 🔍 Found ${allDocsWithChartId.length} documents with case-insensitive chart_id match:`)
        allDocsWithChartId.forEach((doc: any) => {
          console.log(`  - ${doc.document_type}: chart_id="${doc.chart_id}" (exact match: ${doc.chart_id === chartId}), file=${doc.file_name}, status=${doc.status}`)
        })
        
        // Use exact matches from this query if finalDocsList is still empty
        if (finalDocsList.length === 0) {
          const exactMatches = allDocsWithChartId.filter((doc: any) => doc.chart_id === chartId)
          if (exactMatches.length > 0) {
            console.log(`[Chart QA] ✅ Using ${exactMatches.length} exact matches from case-insensitive search`)
            finalDocsList = exactMatches
          }
        }
      }
    }
    
    // Log final result before using it
    console.log(`[Chart QA] 📦 Final finalDocsList count: ${finalDocsList.length}`)
    if (finalDocsList.length > 0) {
      console.log(`[Chart QA] 📄 Final documents to process:`)
      finalDocsList.forEach((doc: any) => {
        console.log(`  - ${doc.document_type}: ${doc.file_name} (chart_id: ${doc.chart_id})`)
      })
    }
    
    // Initialize finalDocuments with the combined results
    let finalDocuments = finalDocsList

    // Get OASIS assessments for this chart (need this first to get patient info for fallback search)
    const { data: oasisAssessments, error: oasisError } = await supabase
      .from("oasis_assessments")
      .select("id, chart_id, patient_name, patient_id, mrn, visit_type, file_name, status, quality_score, flagged_issues, created_at")
      .eq("chart_id", chartId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })

    if (oasisError) {
      console.error("[Chart QA] Error fetching OASIS assessments:", oasisError)
    }
    
    // If no documents found by chart_id, try to find by patient info from OASIS
    if (finalDocuments.length === 0 && oasisAssessments && oasisAssessments.length > 0) {
      const firstOasis = oasisAssessments[0]
      const patientName = firstOasis.patient_name
      const mrn = firstOasis.mrn
      
      console.log(`[Chart QA] 🔍 No documents found by chart_id, trying patient info: name=${patientName}, mrn=${mrn}`)
      
      // Try to find by patient_name
      if (patientName) {
        const { data: docsByName } = await supabase
          .from("clinical_documents")
          .select("id, chart_id, patient_name, patient_id, document_type, file_name, status, created_at")
          .ilike("patient_name", `%${patientName}%`)
          .order("created_at", { ascending: false })
          .limit(20)
        
        if (docsByName && docsByName.length > 0) {
          console.log(`[Chart QA] ✅ Found ${docsByName.length} documents by patient name:`)
          docsByName.forEach((doc: any) => {
            console.log(`  - ${doc.document_type}: chart_id=${doc.chart_id}, file=${doc.file_name}`)
          })
          
          // Use these documents - they belong to the same patient
          finalDocuments = docsByName
        }
      }
    }

    // Get QA analyses for documents
    const documentIds = finalDocuments.map(doc => doc.id) || []
    let qaAnalyses: any[] = []
    if (documentIds.length > 0) {
      const { data, error: qaError } = await supabase
        .from("qa_analysis")
        .select("document_id, quality_score, compliance_score, document_type, findings, missing_elements, chart_id")
        .in("document_id", documentIds)
      
      if (qaError) {
        console.error("[Chart QA] Error fetching QA analyses:", qaError)
      } else {
        qaAnalyses = data || []
      }
    }

    // Create document type mapping
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

    // Process OASIS assessments
    if (oasisAssessments && oasisAssessments.length > 0) {
      const scores: number[] = []
      let totalIssues = 0

      oasisAssessments.forEach((oasis: any) => {
        if (oasis.quality_score) scores.push(oasis.quality_score)
        
        // Match QAPI report logic: count flagged_issues if it exists (includes converted inconsistencies)
        // Only count inconsistencies if flagged_issues is empty (old records)
        const flaggedIssuesCount = Array.isArray(oasis.flagged_issues) ? oasis.flagged_issues.length : 0
        const inconsistenciesCount = Array.isArray(oasis.inconsistencies) ? oasis.inconsistencies.length : 0
        
        if (flaggedIssuesCount > 0) {
          totalIssues += flaggedIssuesCount
        } else if (inconsistenciesCount > 0) {
          totalIssues += inconsistenciesCount
        }
      })

      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : 0

      documentTypes.oasis = {
        score: avgScore || 0,
        status: "complete",
        issues: totalIssues,
      }
    }

    // Process clinical documents
    const docIdToChartId = new Map<number, string>()
    finalDocuments.forEach((doc: any) => {
      if (doc.chart_id && doc.id) {
        docIdToChartId.set(doc.id, doc.chart_id)
      }
    })

    console.log(`[Chart QA] Processing ${finalDocuments.length} clinical documents...`)
    
    // Track scores and issues for each document type (to aggregate multiple documents)
    const docTypeScores: Record<string, number[]> = {}
    const docTypeIssues: Record<string, number> = {}
    const docTypeStatus: Record<string, string> = {}
    
    finalDocuments.forEach((doc: any) => {
      console.log(`[Chart QA] Processing document: ${doc.document_type} - ${doc.file_name} (ID: ${doc.id}, chart_id: ${doc.chart_id})`)
      
      // Verify chart_id matches (or use if found by patient name)
      if (doc.chart_id && doc.chart_id !== chartId) {
        console.log(`[Chart QA] ⚠️ Document chart_id (${doc.chart_id}) doesn't match requested chartId (${chartId}) - but using it anyway (found by patient name)`)
      }
      
      const qaForDoc = qaAnalyses.find((qa: any) => {
        const qaChartId = qa.chart_id || docIdToChartId.get(qa.document_id)
        return qaChartId === chartId && qa.document_id === doc.id
      })

      let parsedFindings: any = null
      if (qaForDoc?.findings) {
        try {
          parsedFindings = typeof qaForDoc.findings === 'string' 
            ? JSON.parse(qaForDoc.findings) 
            : qaForDoc.findings
        } catch (e) {
          console.error("[Chart QA] Error parsing findings:", e)
        }
      }

      let issues = 0
      if (parsedFindings) {
        if (parsedFindings.flaggedIssues && Array.isArray(parsedFindings.flaggedIssues)) {
          issues += parsedFindings.flaggedIssues.length
        }
        if (parsedFindings.inconsistencies && Array.isArray(parsedFindings.inconsistencies)) {
          issues += parsedFindings.inconsistencies.length
        }
        if (qaForDoc?.missing_elements && Array.isArray(qaForDoc.missing_elements)) {
          issues += qaForDoc.missing_elements.length
        }
      }

      const qualityScore = qaForDoc?.quality_score || 0
      const docStatus = doc.status === "completed" ? "complete" : "incomplete"

      // Map document types and aggregate scores/issues
      let mappedType: string | null = null
      
      if (doc.document_type === "poc") {
        mappedType = "carePlan"
      } else if (doc.document_type === "physician_order") {
        // For physician orders, count different issue types
        if (parsedFindings?._analysis) {
          const analysis = parsedFindings._analysis
          issues = (analysis.missingInformation?.length || 0) +
                   (analysis.qaFindings?.length || 0) +
                   (analysis.qapiDeficiencies?.length || 0)
        }
        mappedType = "physicianOrders"
      } else if (doc.document_type === "pt_note" || doc.document_type === "rn_note" || doc.document_type === "ot_note") {
        mappedType = "progressNotes"
      } else if (doc.document_type === "evaluation") {
        mappedType = "assessments"
      } else {
        console.log(`[Chart QA] ⚠️ Unknown document_type: ${doc.document_type} - not mapped to any document type`)
      }
      
      if (mappedType) {
        if (!docTypeScores[mappedType]) {
          docTypeScores[mappedType] = []
          docTypeIssues[mappedType] = 0
          docTypeStatus[mappedType] = docStatus
        }
        docTypeScores[mappedType].push(qualityScore || 0)
        docTypeIssues[mappedType] += issues
        // If any document is complete, mark the type as complete
        if (docStatus === "complete") {
          docTypeStatus[mappedType] = "complete"
        }
        console.log(`[Chart QA] ✅ Mapped ${doc.document_type} to ${mappedType}: score=${qualityScore}, issues=${issues}`)
      }
    })
    
    // Apply aggregated scores and issues to documentTypes
    Object.keys(docTypeScores).forEach((mappedType) => {
      const avgScore = docTypeScores[mappedType].length > 0
        ? Math.round(docTypeScores[mappedType].reduce((sum, s) => sum + s, 0) / docTypeScores[mappedType].length)
        : 0
      
      documentTypes[mappedType] = {
        score: avgScore,
        status: docTypeStatus[mappedType] || "incomplete",
        issues: docTypeIssues[mappedType] || 0,
      }
    })
    
    console.log(`[Chart QA] Final documentTypes:`, JSON.stringify(documentTypes, null, 2))

    // Calculate overall metrics
    const allScores: number[] = []
    let totalIssues = 0
    let financialImpact = 0

    // Add OASIS scores and issues (match QAPI report logic)
    oasisAssessments?.forEach((oasis: any) => {
      if (oasis.quality_score) allScores.push(oasis.quality_score)
      
      // Match QAPI report logic: count flagged_issues if it exists (includes converted inconsistencies)
      // Only count inconsistencies if flagged_issues is empty (old records)
      const flaggedIssuesCount = Array.isArray(oasis.flagged_issues) ? oasis.flagged_issues.length : 0
      const inconsistenciesCount = Array.isArray(oasis.inconsistencies) ? oasis.inconsistencies.length : 0
      
      if (flaggedIssuesCount > 0) {
        totalIssues += flaggedIssuesCount
      } else if (inconsistenciesCount > 0) {
        totalIssues += inconsistenciesCount
      }
      
      if (oasis.revenue_increase) {
        financialImpact += Number(oasis.revenue_increase) || 0
      }
    })

    // Add clinical document scores and issues
    finalDocuments.forEach((doc: any) => {
      const qaForDoc = qaAnalyses.find((qa: any) => qa.document_id === doc.id)
      if (qaForDoc?.quality_score) {
        allScores.push(qaForDoc.quality_score)
      }
    })

    // Count issues from QA analyses
    qaAnalyses.forEach((qa: any) => {
      try {
        const findings = typeof qa.findings === 'string' ? JSON.parse(qa.findings) : qa.findings
        
        if (qa.document_type === 'physician_order' && findings?._analysis) {
          const analysis = findings._analysis
          totalIssues += (analysis.missingInformation?.length || 0)
          totalIssues += (analysis.qaFindings?.length || 0)
          totalIssues += (analysis.qapiDeficiencies?.length || 0)
        } else {
          if (findings?.flaggedIssues && Array.isArray(findings.flaggedIssues)) {
            totalIssues += findings.flaggedIssues.length
          }
          if (findings?.inconsistencies && Array.isArray(findings.inconsistencies)) {
            totalIssues += findings.inconsistencies.length
          }
          if (qa.missing_elements && Array.isArray(qa.missing_elements)) {
            totalIssues += qa.missing_elements.length
          }
        }
      } catch (e) {
        console.error("[Chart QA] Error parsing findings for issue count:", e)
      }
    })

    const overallScore = allScores.length > 0
      ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length)
      : 0

    const complianceScores = qaAnalyses
      .map(qa => qa.compliance_score)
      .filter(score => score !== null && score !== undefined)
    
    const complianceScore = complianceScores.length > 0
      ? Math.round(complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length)
      : overallScore

    // Get patient info from first document
    const patientInfo = finalDocuments[0] || oasisAssessments?.[0] || {}
    const patientName = patientInfo.patient_name || "Unknown"
    const mrn = patientInfo.mrn || "N/A"

    // Map quality scores from qa_analysis to documents
    const documentsWithScores = (finalDocuments || []).map((doc: any) => {
      const qaForDoc = qaAnalyses.find((qa: any) => {
        const qaChartId = qa.chart_id || docIdToChartId.get(qa.document_id)
        return qaChartId === chartId && qa.document_id === doc.id
      })
      
      return {
        ...doc,
        quality_score: qaForDoc?.quality_score || 0,
        issues: (() => {
          if (!qaForDoc?.findings) return 0
          try {
            const findings = typeof qaForDoc.findings === 'string' ? JSON.parse(qaForDoc.findings) : qaForDoc.findings
            
            if (qaForDoc.document_type === 'physician_order' && findings?._analysis) {
              const analysis = findings._analysis
              return (analysis.missingInformation?.length || 0) +
                     (analysis.qaFindings?.length || 0) +
                     (analysis.qapiDeficiencies?.length || 0)
            } else {
              let count = 0
              if (findings?.flaggedIssues && Array.isArray(findings.flaggedIssues)) {
                count += findings.flaggedIssues.length
              }
              if (findings?.inconsistencies && Array.isArray(findings.inconsistencies)) {
                count += findings.inconsistencies.length
              }
              if (qaForDoc.missing_elements && Array.isArray(qaForDoc.missing_elements)) {
                count += qaForDoc.missing_elements.length
              }
              return count
            }
          } catch (e) {
            console.error("[Chart QA] Error calculating issues for document:", e)
            return 0
          }
        })()
      }
    })

    const responseData = {
      success: true,
      data: {
        chartId,
        patientName,
        mrn,
        overallScore,
        complianceScore,
        totalIssues,
        financialImpact,
        documentTypes,
        documents: documentsWithScores,
        oasisAssessments: oasisAssessments || [],
      },
    }
    
    console.log(`[Chart QA] Returning data:`, {
      chartId,
      documentsCount: documents?.length || 0,
      oasisCount: oasisAssessments?.length || 0,
      documentTypes: Object.keys(documentTypes).filter(key => documentTypes[key].status !== "missing")
    })
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[Chart QA] Error fetching chart data:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch chart data" },
      { status: 500 }
    )
  }
}

