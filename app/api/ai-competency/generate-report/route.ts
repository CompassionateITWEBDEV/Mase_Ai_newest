import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const dynamic = 'force-dynamic'

/**
 * Generate comprehensive AI Assessment Report
 * Features:
 * - Real-time video analysis documentation
 * - Automated competency scoring and feedback
 * - Pattern recognition for safety protocols
 * - Objective assessment with bias reduction
 * - Instant documentation and reporting
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assessmentId, format = 'json' } = body

    if (!assessmentId) {
      return NextResponse.json({ error: "Assessment ID is required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Fetch comprehensive assessment data
    const { data: assessment, error: assessmentError } = await supabase
      .from('staff_ai_assessments')
      .select(`
        *,
        staff:staff_id (
          id,
          name,
          role_id,
          department
        ),
        evaluator:evaluator_id (
          id,
          name
        ),
        competency_evaluation:competency_evaluation_id (
          id,
          evaluation_type,
          evaluation_date
        )
      `)
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      console.error('Error fetching assessment:', assessmentError)
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 })
    }

    // Fetch detailed scores
    const { data: scores } = await supabase
      .from('staff_ai_assessment_scores')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('category', { ascending: true })

    // Fetch observations
    const { data: observations } = await supabase
      .from('staff_ai_observations')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: true })

    // Fetch recommendations
    const { data: recommendations } = await supabase
      .from('staff_ai_recommendations')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('type', { ascending: true })
      .order('category', { ascending: true })

    // Fetch evidence
    const { data: evidence } = await supabase
      .from('staff_ai_evidence')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('timestamp', { ascending: true })

    // Organize data by category
    const scoresByCategory: Record<string, any> = {}
    const observationsByCategory: Record<string, any[]> = {}
    const recommendationsByCategory: Record<string, any[]> = {}
    const evidenceByCategory: Record<string, any[]> = {}

    scores?.forEach(score => {
      scoresByCategory[score.category] = score
      observationsByCategory[score.category] = []
      recommendationsByCategory[score.category] = []
      evidenceByCategory[score.category] = []
    })

    observations?.forEach(obs => {
      if (!observationsByCategory[obs.category]) {
        observationsByCategory[obs.category] = []
      }
      observationsByCategory[obs.category].push(obs)
    })

    recommendations?.forEach(rec => {
      const category = rec.category || 'Overall'
      if (!recommendationsByCategory[category]) {
        recommendationsByCategory[category] = []
      }
      recommendationsByCategory[category].push(rec)
    })

    evidence?.forEach(ev => {
      const category = ev.score_id ? scores?.find(s => s.id === ev.score_id)?.category || 'Unknown' : 'Overall'
      if (!evidenceByCategory[category]) {
        evidenceByCategory[category] = []
      }
      evidenceByCategory[category].push(ev)
    })

    // Separate strengths from development areas
    const strengths = recommendations?.filter(r => r.type === 'strength') || []
    const developmentAreas = recommendations?.filter(r => r.type === 'improvement' && r.category === 'Overall') || []
    const riskFactors = recommendations?.filter(r => r.type === 'compliance' && r.category === 'Overall') || []

    // Generate comprehensive report
    const report = {
      // Report Metadata
      reportMetadata: {
        reportId: `RPT-${assessmentId.substring(0, 8).toUpperCase()}`,
        generatedAt: new Date().toISOString(),
        assessmentId: assessment.id,
        reportType: 'AI Competency Assessment',
        format: format,
        version: '1.0'
      },

      // Assessment Overview
      assessmentOverview: {
        staffMember: {
          id: (assessment.staff as any)?.id,
          name: (assessment.staff as any)?.name || 'Unknown',
          role: (assessment.staff as any)?.department || 'Staff',
          department: (assessment.staff as any)?.department || 'Unknown'
        },
        evaluator: (assessment.evaluator as any)?.name || 'AI System',
        assessmentType: assessment.assessment_type,
        competencyArea: assessment.competency_area,
        assessmentDate: assessment.created_at,
        completedDate: assessment.completed_at,
        duration: assessment.evaluation_time,
        status: assessment.status,
        videoUrl: assessment.video_url,
        notes: assessment.notes
      },

      // AI Assessment Features Summary
      aiFeaturesSummary: {
        realTimeVideoAnalysis: assessment.assessment_type === 'live',
        automatedScoring: true,
        patternRecognition: true,
        objectiveAssessment: true,
        instantDocumentation: true,
        overallScore: assessment.overall_score,
        aiConfidence: assessment.ai_confidence,
        assessmentMethod: assessment.assessment_type === 'live' 
          ? 'Real-time Live Camera Analysis' 
          : 'Recorded Video Analysis'
      },

      // Detailed Competency Scores
      competencyScores: Object.values(scoresByCategory).map(score => ({
        category: score.category,
        score: parseFloat(score.score),
        confidence: parseFloat(score.confidence || 0),
        observations: observationsByCategory[score.category] || [],
        recommendations: recommendationsByCategory[score.category]?.filter(r => r.type === 'improvement') || [],
        evidence: evidenceByCategory[score.category] || [],
        timestamp: score.created_at
      })),

      // Pattern Recognition Results
      patternRecognition: {
        safetyProtocols: {
          observations: observationsByCategory['Safety & Compliance'] || [],
          evidence: evidenceByCategory['Safety & Compliance'] || [],
          complianceScore: scoresByCategory['Safety & Compliance']?.score || 0,
          patterns: extractSafetyPatterns(observationsByCategory['Safety & Compliance'] || [])
        },
        clinicalTechniques: {
          observations: observationsByCategory['Clinical Skills'] || [],
          evidence: evidenceByCategory['Clinical Skills'] || [],
          techniqueScore: scoresByCategory['Clinical Skills']?.score || 0,
          patterns: extractClinicalPatterns(observationsByCategory['Clinical Skills'] || [])
        },
        communicationPatterns: {
          observations: observationsByCategory['Communication'] || [],
          evidence: evidenceByCategory['Communication'] || [],
          communicationScore: scoresByCategory['Communication']?.score || 0,
          patterns: extractCommunicationPatterns(observationsByCategory['Communication'] || [])
        }
      },

      // Automated Scoring Summary
      scoringSummary: {
        overallScore: parseFloat(assessment.overall_score || 0),
        aiConfidence: parseFloat(assessment.ai_confidence || 0),
        categoryAverages: calculateCategoryAverages(scores || []),
        scoreBreakdown: Object.values(scoresByCategory).map(s => ({
          category: s.category,
          score: parseFloat(s.score),
          confidence: parseFloat(s.confidence || 0),
          grade: getGrade(parseFloat(s.score))
        })),
        strengthsIdentified: strengths.length,
        areasForDevelopment: developmentAreas.length,
        riskFactorsIdentified: riskFactors.length
      },

      // Feedback and Recommendations
      feedback: {
        strengths: strengths.map(s => s.recommendation),
        developmentAreas: developmentAreas.map(d => d.recommendation),
        riskFactors: riskFactors.map(r => r.recommendation),
        categoryRecommendations: Object.keys(recommendationsByCategory).map(category => ({
          category,
          recommendations: recommendationsByCategory[category]?.filter(r => r.type === 'improvement').map(r => r.recommendation) || []
        }))
      },

      // Evidence Documentation
      evidence: {
        timestampedEvidence: evidence?.map(e => ({
          timestamp: e.timestamp,
          description: e.description,
          confidence: parseFloat(e.confidence || 0),
          category: scores?.find(s => s.id === e.score_id)?.category || 'Unknown',
          createdAt: e.created_at
        })) || [],
        evidenceSummary: {
          totalEvidencePoints: evidence?.length || 0,
          averageConfidence: evidence?.length 
            ? evidence.reduce((sum, e) => sum + parseFloat(e.confidence || 0), 0) / evidence.length 
            : 0,
          evidenceByCategory: Object.keys(evidenceByCategory).map(category => ({
            category,
            count: evidenceByCategory[category].length
          }))
        }
      },

      // Objective Assessment Indicators
      objectivity: {
        biasReduction: {
          evidenceBased: true,
          timestampedObservations: true,
          objectiveScoring: true,
          aiConfidenceLevel: parseFloat(assessment.ai_confidence || 0)
        },
        assessmentReliability: {
          confidenceLevel: parseFloat(assessment.ai_confidence || 0),
          evidenceCount: evidence?.length || 0,
          observationCount: observations?.length || 0,
          comprehensiveCoverage: (observations?.length || 0) >= 5 && (evidence?.length || 0) >= 3
        }
      },

      // Instant Documentation Summary
      documentationSummary: {
        reportGenerated: new Date().toISOString(),
        assessmentRecorded: assessment.created_at,
        dataCompleteness: {
          scores: scores?.length || 0,
          observations: observations?.length || 0,
          recommendations: recommendations?.length || 0,
          evidence: evidence?.length || 0,
          completenessPercentage: calculateCompleteness(scores, observations, recommendations, evidence)
        },
        exportOptions: ['json', 'pdf', 'html', 'csv']
      }
    }

    // Return in requested format
    if (format === 'pdf' || format === 'html') {
      // Generate HTML report for PDF conversion
      const htmlReport = generateHTMLReport(report)
      return NextResponse.json({
        success: true,
        report: htmlReport,
        format: format,
        message: "Report generated successfully"
      })
    }

    return NextResponse.json({
      success: true,
      report,
      message: "Comprehensive AI Assessment report generated successfully"
    })

  } catch (error) {
    console.error("Report Generation Error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Helper functions
function extractSafetyPatterns(observations: any[]): string[] {
  const patterns: string[] = []
  const safetyKeywords = ['hand hygiene', 'PPE', 'sanitizing', 'infection control', 'safety protocol']
  
  observations.forEach(obs => {
    safetyKeywords.forEach(keyword => {
      if (obs.observation?.toLowerCase().includes(keyword.toLowerCase())) {
        if (!patterns.includes(keyword)) {
          patterns.push(keyword)
        }
      }
    })
  })
  
  return patterns
}

function extractClinicalPatterns(observations: any[]): string[] {
  const patterns: string[] = []
  const clinicalKeywords = ['technique', 'procedure', 'assessment', 'accuracy', 'precision']
  
  observations.forEach(obs => {
    clinicalKeywords.forEach(keyword => {
      if (obs.observation?.toLowerCase().includes(keyword.toLowerCase())) {
        if (!patterns.includes(keyword)) {
          patterns.push(keyword)
        }
      }
    })
  })
  
  return patterns
}

function extractCommunicationPatterns(observations: any[]): string[] {
  const patterns: string[] = []
  const commKeywords = ['communication', 'patient interaction', 'empathy', 'listening', 'eye contact']
  
  observations.forEach(obs => {
    commKeywords.forEach(keyword => {
      if (obs.observation?.toLowerCase().includes(keyword.toLowerCase())) {
        if (!patterns.includes(keyword)) {
          patterns.push(keyword)
        }
      }
    })
  })
  
  return patterns
}

function calculateCategoryAverages(scores: any[]): any {
  if (!scores.length) return {}
  
  const total = scores.reduce((sum, s) => sum + parseFloat(s.score || 0), 0)
  const avg = total / scores.length
  const confidenceAvg = scores.reduce((sum, s) => sum + parseFloat(s.confidence || 0), 0) / scores.length
  
  return {
    averageScore: avg,
    averageConfidence: confidenceAvg,
    categoryCount: scores.length
  }
}

function getGrade(score: number): string {
  if (score >= 90) return 'A - Excellent'
  if (score >= 80) return 'B - Proficient'
  if (score >= 70) return 'C - Competent'
  if (score >= 60) return 'D - Developing'
  return 'F - Needs Improvement'
}

function calculateCompleteness(scores: any[], observations: any[], recommendations: any[], evidence: any[]): number {
  let completeness = 0
  if (scores.length > 0) completeness += 25
  if (observations.length > 0) completeness += 25
  if (recommendations.length > 0) completeness += 25
  if (evidence.length > 0) completeness += 25
  return completeness
}

function generateHTMLReport(report: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AI Competency Assessment Report - ${report.reportMetadata.reportId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
    .score { font-size: 24px; font-weight: bold; color: #059669; }
    .category { background: #f3f4f6; padding: 10px; margin: 10px 0; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #e5e7eb; font-weight: bold; }
    .evidence-item { margin: 10px 0; padding: 10px; background: #f9fafb; border-left: 3px solid #3b82f6; }
  </style>
</head>
<body>
  <div class="header">
    <h1>AI Competency Assessment Report</h1>
    <p>Report ID: ${report.reportMetadata.reportId} | Generated: ${new Date(report.reportMetadata.generatedAt).toLocaleString()}</p>
  </div>

  <div class="section">
    <h2>Assessment Overview</h2>
    <p><strong>Staff:</strong> ${report.assessmentOverview.staffMember.name}</p>
    <p><strong>Role:</strong> ${report.assessmentOverview.staffMember.role}</p>
    <p><strong>Competency Area:</strong> ${report.assessmentOverview.competencyArea}</p>
    <p><strong>Assessment Type:</strong> ${report.assessmentOverview.assessmentType}</p>
    <p><strong>Overall Score:</strong> <span class="score">${report.scoringSummary.overallScore}%</span></p>
    <p><strong>AI Confidence:</strong> ${report.scoringSummary.aiConfidence}%</p>
  </div>

  <div class="section">
    <h2>AI Assessment Features</h2>
    <ul>
      <li>✅ Real-time video analysis: ${report.aiFeaturesSummary.realTimeVideoAnalysis ? 'Yes' : 'No'}</li>
      <li>✅ Automated competency scoring: Yes</li>
      <li>✅ Pattern recognition: Yes</li>
      <li>✅ Objective assessment: Yes</li>
      <li>✅ Instant documentation: Yes</li>
    </ul>
  </div>

  <div class="section">
    <h2>Competency Scores Breakdown</h2>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Score</th>
          <th>Confidence</th>
          <th>Grade</th>
        </tr>
      </thead>
      <tbody>
        ${report.scoringSummary.scoreBreakdown.map((s: any) => `
          <tr>
            <td>${s.category}</td>
            <td>${s.score}%</td>
            <td>${s.confidence}%</td>
            <td>${s.grade}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Pattern Recognition Results</h2>
    <div class="category">
      <h3>Safety Protocol Patterns</h3>
      <p>Compliance Score: ${report.patternRecognition.safetyProtocols.complianceScore}%</p>
      <p>Patterns Detected: ${report.patternRecognition.safetyProtocols.patterns.join(', ') || 'None'}</p>
    </div>
    <div class="category">
      <h3>Clinical Technique Patterns</h3>
      <p>Technique Score: ${report.patternRecognition.clinicalTechniques.techniqueScore}%</p>
      <p>Patterns Detected: ${report.patternRecognition.clinicalTechniques.patterns.join(', ') || 'None'}</p>
    </div>
    <div class="category">
      <h3>Communication Patterns</h3>
      <p>Communication Score: ${report.patternRecognition.communicationPatterns.communicationScore}%</p>
      <p>Patterns Detected: ${report.patternRecognition.communicationPatterns.patterns.join(', ') || 'None'}</p>
    </div>
  </div>

  <div class="section">
    <h2>Feedback & Recommendations</h2>
    <h3>Strengths (${report.feedback.strengths.length})</h3>
    <ul>
      ${report.feedback.strengths.map((s: string) => `<li>${s}</li>`).join('')}
    </ul>
    <h3>Development Areas (${report.feedback.developmentAreas.length})</h3>
    <ul>
      ${report.feedback.developmentAreas.map((d: string) => `<li>${d}</li>`).join('')}
    </ul>
  </div>

  <div class="section">
    <h2>Evidence Documentation</h2>
    <p>Total Evidence Points: ${report.evidence.evidenceSummary.totalEvidencePoints}</p>
    <p>Average Confidence: ${report.evidence.evidenceSummary.averageConfidence.toFixed(1)}%</p>
    ${report.evidence.timestampedEvidence.slice(0, 10).map((e: any) => `
      <div class="evidence-item">
        <strong>${e.timestamp}</strong> - ${e.description} (Confidence: ${e.confidence}%)
      </div>
    `).join('')}
  </div>

  <div class="section">
    <h2>Documentation Summary</h2>
    <p>Data Completeness: ${report.documentationSummary.dataCompleteness.completenessPercentage}%</p>
    <p>Observations: ${report.documentationSummary.dataCompleteness.observations}</p>
    <p>Recommendations: ${report.documentationSummary.dataCompleteness.recommendations}</p>
    <p>Evidence Points: ${report.documentationSummary.dataCompleteness.evidence}</p>
  </div>
</body>
</html>
  `
}

