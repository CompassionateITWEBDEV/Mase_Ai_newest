// Utility functions for OASIS QAPI data transformation
// Provides backward compatibility for documents that don't have qapiAudit stored

export interface QapiAuditData {
  deficiencies?: Array<{
    deficiency: string
    category: string
    severity: string
    rootCause: string
    recommendation: string
  }>
  recommendations?: Array<{
    category: string
    recommendation: string
    priority: string
  }>
  regulatoryDeficiencies?: Array<{
    deficiency: string
    regulation: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    description: string
    impact: string
    recommendation: string
    correctiveAction: string
  }>
  planOfCareReview?: {
    completeness: 'complete' | 'incomplete' | 'missing'
    issues: Array<{
      issue: string
      location: string
      severity: string
      recommendation: string
    }>
    goals?: Array<{
      goal: string
      status: 'met' | 'in-progress' | 'not-met' | 'missing'
      issues?: string[]
      recommendation?: string
    }>
    riskMitigation?: Array<{
      risk: string
      mitigationStrategy: string
      status: 'documented' | 'missing' | 'inadequate'
      recommendation?: string
    }>
    safetyInstructions?: Array<{
      instruction: string
      status: 'present' | 'missing' | 'unclear'
      location: string
      recommendation?: string
    }>
  }
  incompleteElements?: Array<{
    element: string
    location: string
    missingInformation: string
    impact: string
    recommendation: string
    priority: 'high' | 'medium' | 'low'
  }>
  contradictoryElements?: Array<{
    elementA: string
    elementB: string
    contradiction: string
    location: string
    impact: string
    recommendation: string
    severity: 'critical' | 'high' | 'medium' | 'low'
  }>
}

/**
 * Safely parses extracted_data if it's a string (JSONB from database)
 */
function parseExtractedData(extractedData: any): any {
  if (!extractedData) return {}
  if (typeof extractedData === 'string') {
    try {
      return JSON.parse(extractedData)
    } catch (e) {
      console.error("[QAPI Utils] Failed to parse extracted_data:", e)
      return {}
    }
  }
  return extractedData
}

/**
 * Builds qapiAudit data from existing OASIS assessment data
 * This provides backward compatibility for documents that don't have qapiAudit stored
 */
export function buildQapiAuditFromAssessment(assessment: any): QapiAuditData | null {
  const flaggedIssues = Array.isArray(assessment.flagged_issues) ? assessment.flagged_issues : []
  const missingInfo = Array.isArray(assessment.missing_information) ? assessment.missing_information : []
  const recommendations = Array.isArray(assessment.recommendations) ? assessment.recommendations : []
  
  // Parse extracted_data if it's a string
  const extractedData = parseExtractedData(assessment.extracted_data)

  // If qapiAudit already exists in extracted_data, use it
  if (extractedData?.qapiAudit) {
    return extractedData.qapiAudit
  }

  // Build qapiAudit from available data
  const qapiAudit: QapiAuditData = {
    recommendations: [],
    regulatoryDeficiencies: [],
    incompleteElements: []
  }

  // Convert recommendations
  if (recommendations.length > 0) {
    qapiAudit.recommendations = recommendations.map((rec: any) => ({
      category: rec.category || 'General',
      recommendation: rec.recommendation || rec.description || rec,
      priority: rec.priority || (rec.severity === 'high' || rec.severity === 'critical' ? 'high' : 'medium')
    }))
  }

  // Convert flagged_issues to regulatory deficiencies and recommendations
  flaggedIssues.forEach((issue: any) => {
    if (issue.category === 'inconsistency') {
      // Inconsistencies become contradictory elements
      if (!qapiAudit.contradictoryElements) {
        qapiAudit.contradictoryElements = []
      }
      qapiAudit.contradictoryElements.push({
        elementA: issue.location?.split(' vs ')[0] || 'Section A',
        elementB: issue.location?.split(' vs ')[1] || 'Section B',
        contradiction: issue.issue || 'Data inconsistency detected',
        location: issue.location || 'Unknown',
        impact: issue.clinicalImpact || 'May affect care quality',
        recommendation: issue.suggestion || 'Review and resolve inconsistency',
        severity: issue.severity === 'critical' ? 'critical' : 
                 issue.severity === 'high' ? 'high' : 'medium'
      })
    } else if (issue.category === 'compliance' || issue.category === 'regulatory') {
      // Regulatory issues
      if (!qapiAudit.regulatoryDeficiencies) {
        qapiAudit.regulatoryDeficiencies = []
      }
      qapiAudit.regulatoryDeficiencies.push({
        deficiency: issue.issue || 'Regulatory compliance issue',
        regulation: 'CMS Conditions of Participation',
        severity: issue.severity === 'critical' ? 'critical' :
                 issue.severity === 'high' ? 'high' : 'medium',
        description: issue.issue || '',
        impact: issue.clinicalImpact || 'Compliance risk',
        recommendation: issue.suggestion || 'Address compliance issue',
        correctiveAction: issue.suggestion || 'Review and correct'
      })
    } else {
      // Other issues become recommendations
      if (!qapiAudit.recommendations) {
        qapiAudit.recommendations = []
      }
      qapiAudit.recommendations.push({
        category: issue.category || 'Quality Improvement',
        recommendation: issue.issue || issue.suggestion || 'Review and address',
        priority: issue.severity === 'critical' || issue.severity === 'high' ? 'high' : 'medium'
      })
    }
  })

  // Convert missing_information to incompleteElements
  if (missingInfo.length > 0) {
    qapiAudit.incompleteElements = missingInfo.map((item: any) => ({
      element: item.field || item.gap || item.location || 'Missing information',
      location: item.location || 'Unknown',
      missingInformation: item.field || item.gap || 'Required information not documented',
      impact: item.impact || 'Documentation incomplete',
      recommendation: item.recommendation || 'Complete required documentation',
      priority: item.priority || (item.required ? 'high' : 'medium')
    }))
  }
  
  // Also convert flagged_issues to incompleteElements if no missing_information exists
  // This ensures inconsistencies and other issues are captured as documentation gaps
  // Note: Inconsistencies are also in contradictoryElements, but we include them here too for documentation gaps
  if (qapiAudit.incompleteElements!.length === 0 && flaggedIssues.length > 0) {
    const incompleteFromIssues = flaggedIssues.map((issue: any) => {
      if (issue.category === 'inconsistency') {
        return {
          element: issue.location || issue.issue?.split(':')[0] || 'Inconsistency detected',
          location: issue.location || 'Unknown',
          missingInformation: issue.issue || 'Data inconsistency - documentation may be incomplete',
          impact: issue.clinicalImpact || issue.suggestion || 'Documentation inconsistency may affect care quality',
          recommendation: issue.suggestion || 'Review and resolve inconsistency in documentation',
          priority: issue.severity === 'critical' || issue.severity === 'high' ? 'high' : 'medium'
        }
      } else {
        return {
          element: issue.location || issue.issue || 'Missing documentation',
          location: issue.location || 'Unknown',
          missingInformation: issue.issue || 'Required information not documented',
          impact: issue.clinicalImpact || issue.suggestion || 'Documentation incomplete',
          recommendation: issue.suggestion || 'Complete required documentation',
          priority: issue.severity === 'critical' || issue.severity === 'high' ? 'high' : 'medium'
        }
      }
    })
    qapiAudit.incompleteElements = incompleteFromIssues
  }

  // Only return if we have at least some data
  if (qapiAudit.recommendations!.length > 0 || 
      qapiAudit.regulatoryDeficiencies!.length > 0 || 
      qapiAudit.incompleteElements!.length > 0 ||
      (qapiAudit.contradictoryElements && qapiAudit.contradictoryElements.length > 0)) {
    return qapiAudit
  }

  return null
}

/**
 * Gets qapiAudit from assessment, building it if necessary
 */
export function getQapiAuditFromAssessment(assessment: any): QapiAuditData | null {
  const extractedData = parseExtractedData(assessment.extracted_data)
  
  // First, try to get from extracted_data
  if (extractedData?.qapiAudit) {
    return extractedData.qapiAudit
  }
  
  // Then try top-level qapiAudit
  if (assessment.qapiAudit) {
    return assessment.qapiAudit
  }
  
  // Finally, build from available data
  return buildQapiAuditFromAssessment(assessment)
}

