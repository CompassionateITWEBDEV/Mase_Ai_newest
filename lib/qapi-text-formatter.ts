// Formats structured QAPI report into comprehensive text format
// Following the 4-part QAPI structure

import { StructuredQAPIReport } from './qapi-report-generator'

export function formatQAPIReportAsText(report: StructuredQAPIReport): string {
  let text = `📌 QAPI REPORT – MULTI-DOCUMENT ANALYSIS\n\n`
  text += `For: ${report.summary.agencyName}\n`
  text += `Documents Reviewed: ${report.summary.documentsReviewed.map(d => `${d.type} (${d.patientName})`).join(', ')}\n\n`

  // 1️⃣ COMPREHENSIVE QA ANALYSIS
  text += `1️⃣ COMPREHENSIVE QA ANALYSIS\n\n`
  text += `A full clinical review of all documents for accuracy, consistency, and clinical risks.\n\n`

  text += `A. Patient Identification & Demographics\n\n`
  text += `Findings (${report.summary.documentsReviewed.map(d => d.type).join(' + ')})\n\n`
  report.comprehensiveQA.patientIdentification.findings.forEach(f => {
    text += `${f}\n`
  })
  text += `\nRisks:\n\n`
  report.comprehensiveQA.patientIdentification.risks.forEach(r => {
    text += `${r}\n`
  })

  text += `\nB. Clinical Status & Functional Decline\n\n`
  report.comprehensiveQA.clinicalStatus.byDocument.forEach(doc => {
    text += `${doc.documentType}: ${doc.patientName}\n\n`
    text += `${doc.fileName}\n\n`
    doc.findings.forEach(f => {
      text += `${f}\n`
    })
    if (doc.risks.length > 0) {
      text += `\nRisks:\n`
      doc.risks.forEach(r => {
        text += `${r}\n`
      })
    }
    text += `\n`
  })

  text += `C. Missing Information / Inconsistencies\n\n`
  text += `Across all documents\n\n`
  if (report.comprehensiveQA.inconsistencies.findings.length === 0) {
    text += `No contradictions in clinical findings.\n\n`
  } else {
    report.comprehensiveQA.inconsistencies.findings.forEach(inc => {
      text += `${inc.type}: ${inc.description}\n`
      text += `  → ${inc.recommendation}\n\n`
    })
  }

  if (report.comprehensiveQA.missingInformation.gaps.length > 0) {
    text += `Minor Gaps Noted\n\n`
    report.comprehensiveQA.missingInformation.gaps.slice(0, 5).forEach(gap => {
      text += `${gap.gap} (${gap.document})\n`
      text += `  Impact: ${gap.impact}\n`
      text += `  Recommendation: ${gap.recommendation}\n\n`
    })
  }

  // 2️⃣ CODING REVIEW
  text += `2️⃣ CODING REVIEW\n\n`
  text += `Review of ICD-10 diagnosis coding in both OASIS and POC.\n\n`

  text += `A. Accuracy Evaluation (OASIS)\n\n`
  text += `Primary Dx: ${report.codingReview.oasis.primaryDiagnosis.code} – ${report.codingReview.oasis.primaryDiagnosis.description} `
  text += report.codingReview.oasis.primaryDiagnosis.accuracy === 'Appropriate' ? '✔ Appropriate\n\n' : '⚠ Needs Review\n\n'
  
  if (report.codingReview.oasis.secondaryDiagnoses.diagnoses.length > 0) {
    text += `Secondary Dx list is accurate and clinically justified:\n\n`
    report.codingReview.oasis.secondaryDiagnoses.diagnoses.forEach(dx => {
      text += `${dx.code} (${dx.description})\n`
    })
    text += `\n${report.codingReview.oasis.secondaryDiagnoses.summary}\n\n`
  }

  if (report.codingReview.poc.primaryDiagnosis) {
    text += `B. Accuracy Evaluation (Plan of Care)\n\n`
    text += `Primary Dx:\n\n`
    text += `${report.codingReview.poc.primaryDiagnosis.code} – ${report.codingReview.poc.primaryDiagnosis.description} `
    text += report.codingReview.poc.primaryDiagnosis.accuracy === 'Appropriate' ? '✔ Appropriate\n\n' : '⚠ Needs Review\n\n'
    
    if (report.codingReview.poc.comorbidities) {
      text += `Multiple comorbidities documented correctly `
      text += `(${report.codingReview.poc.comorbidities.diagnoses.length} total).\n\n`
      text += `${report.codingReview.poc.comorbidities.summary}\n\n`
    }
  }

  // 3️⃣ FINANCIAL OPTIMIZATION REVIEW
  text += `3️⃣ FINANCIAL OPTIMIZATION REVIEW\n\n`
  text += `Focus on compliance, billable opportunities, risk, and missed revenue.\n\n`

  text += `A. OASIS-Based Reimbursement\n\n`
  if (report.financialOptimization.oasisBasedReimbursement.qualification.length > 0) {
    text += `Patient qualifies for high functional impairment payment group due to:\n\n`
    report.financialOptimization.oasisBasedReimbursement.qualification.forEach(q => {
      text += `${q}\n`
    })
    text += `\n`
  }

  if (report.financialOptimization.oasisBasedReimbursement.opportunities.length > 0) {
    text += `Opportunity:\n\n`
    report.financialOptimization.oasisBasedReimbursement.opportunities.forEach(opp => {
      text += `${opp.opportunity}\n`
      text += `  → ${opp.recommendation}\n\n`
    })
  }

  text += `B. Visit Utilization Review\n\n`
  report.financialOptimization.visitUtilization.findings.forEach(finding => {
    text += `${finding.service} confirms skilled need → ${finding.compliance === 'Compliant' ? 'compliant' : 'needs review'} and billable.\n`
    if (finding.opportunity) {
      text += `  Opportunity: ${finding.opportunity}\n`
    }
    text += `\n`
  })

  if (report.financialOptimization.revenueOpportunities.length > 0) {
    text += `C. Revenue Opportunities\n\n`
    report.financialOptimization.revenueOpportunities.forEach(opp => {
      text += `${opp.category}: ${opp.opportunity}\n`
      text += `  Potential Impact: ${opp.potentialImpact}\n`
      text += `  Recommendation: ${opp.recommendation}\n\n`
    })
  }

  // 4️⃣ QAPI AUDIT & PERFORMANCE IMPROVEMENT PLAN
  text += `4️⃣ QAPI AUDIT & PERFORMANCE IMPROVEMENT PLAN\n\n`
  text += `Overarching system-level improvements based on all PDF findings.\n\n`

  report.qapiAudit.clinicalQualityIndicators.forEach(indicator => {
    text += `A. ${indicator.indicator}\n\n`
    if (indicator.findings.length > 0) {
      indicator.findings.forEach(f => {
        text += `${f}\n`
      })
    }
    text += `\nRecommend:\n\n`
    indicator.recommendations.forEach(rec => {
      text += `${rec}\n`
    })
    text += `\n`
  })

  text += `B. Safety & Infection Control\n\n`
  report.qapiAudit.safetyInfectionControl.findings.forEach(f => {
    text += `${f}\n`
  })
  if (report.qapiAudit.safetyInfectionControl.recommendations.length > 0) {
    text += `\nRecommend:\n\n`
    report.qapiAudit.safetyInfectionControl.recommendations.forEach(rec => {
      text += `${rec}\n`
    })
  }
  text += `\n`

  text += `C. Documentation Accuracy\n\n`
  if (report.qapiAudit.documentationAccuracy.issues.length > 0) {
    report.qapiAudit.documentationAccuracy.issues.forEach(issue => {
      text += `${issue}\n`
    })
  }
  if (report.qapiAudit.documentationAccuracy.recommendations.length > 0) {
    text += `\nRecommend:\n\n`
    report.qapiAudit.documentationAccuracy.recommendations.forEach(rec => {
      text += `${rec}\n`
    })
  }
  text += `\n`

  text += `D. Care Coordination\n\n`
  report.qapiAudit.careCoordination.findings.forEach(f => {
    text += `${f}\n`
  })
  if (report.qapiAudit.careCoordination.recommendations.length > 0) {
    text += `\nRecommend:\n\n`
    report.qapiAudit.careCoordination.recommendations.forEach(rec => {
      text += `${rec}\n`
    })
  }
  text += `\n`

  // SUMMARY
  text += `📌 SUMMARY OF OVERALL FINDINGS\n\n`
  report.overallFindings.strengths.forEach(strength => {
    text += `✔ ${strength}\n`
  })
  text += `\n`
  report.overallFindings.opportunities.forEach(opp => {
    text += `✔ ${opp}\n`
  })
  text += `\n`

  if (report.overallFindings.actionItems.length > 0) {
    text += `Action Items:\n\n`
    const highPriority = report.overallFindings.actionItems.filter(a => a.priority === 'high')
    const mediumPriority = report.overallFindings.actionItems.filter(a => a.priority === 'medium')
    const lowPriority = report.overallFindings.actionItems.filter(a => a.priority === 'low')

    if (highPriority.length > 0) {
      text += `HIGH PRIORITY:\n`
      highPriority.forEach(item => {
        text += `  • ${item.action} (${item.category})\n`
      })
      text += `\n`
    }

    if (mediumPriority.length > 0) {
      text += `MEDIUM PRIORITY:\n`
      mediumPriority.forEach(item => {
        text += `  • ${item.action} (${item.category})\n`
      })
      text += `\n`
    }

    if (lowPriority.length > 0) {
      text += `LOW PRIORITY:\n`
      lowPriority.forEach(item => {
        text += `  • ${item.action} (${item.category})\n`
      })
    }
  }

  return text
}

