"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Brain,
  Eye,
  CheckCircle,
  AlertTriangle,
  Activity,
  Zap,
  Target,
  Lightbulb,
  FileText,
  Star,
  TrendingUp,
  BookOpen,
} from "lucide-react"

interface CompetencyScore {
  category: string
  score: number
  confidence: number
  observations: string[]
  recommendations: string[]
}

interface AIEvaluationData {
  overallScore: number
  competencyScores: CompetencyScore[]
  riskFactors: string[]
  strengths: string[]
  developmentAreas: string[]
  aiConfidence: number
  evaluationTime: number
}

interface AICompetencyEvaluatorProps {
  staffMember: {
    id: string
    name: string
    role: string
    department: string
  }
  onEvaluationComplete: (data: AIEvaluationData) => void
}

export function AICompetencyEvaluator({ staffMember, onEvaluationComplete }: AICompetencyEvaluatorProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [currentPhase, setCurrentPhase] = useState("")
  const [liveInsights, setLiveInsights] = useState<string[]>([])
  const [evaluationData, setEvaluationData] = useState<AIEvaluationData | null>(null)
  const [notes, setNotes] = useState("")

  const analysisPhases = [
    "Initializing AI models...",
    "Analyzing video feed...",
    "Processing audio patterns...",
    "Evaluating clinical skills...",
    "Assessing communication...",
    "Reviewing safety protocols...",
    "Generating insights...",
    "Finalizing evaluation...",
  ]

  const startAnalysis = async () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setLiveInsights([])

    // Simulate AI analysis phases
    for (let i = 0; i < analysisPhases.length; i++) {
      setCurrentPhase(analysisPhases[i])
      setAnalysisProgress((i + 1) * 12.5)

      // Add live insights during analysis
      if (i === 2) {
        setLiveInsights((prev) => [...prev, "Excellent verbal communication detected"])
      }
      if (i === 3) {
        setLiveInsights((prev) => [...prev, "Proper hand hygiene technique observed"])
      }
      if (i === 4) {
        setLiveInsights((prev) => [...prev, "Active listening skills demonstrated"])
      }
      if (i === 5) {
        setLiveInsights((prev) => [...prev, "Safety protocols followed correctly"])
      }

      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    // Generate mock evaluation data
    const mockData: AIEvaluationData = {
      overallScore: 87,
      aiConfidence: 94,
      evaluationTime: 12,
      competencyScores: [
        {
          category: "Clinical Skills",
          score: 89,
          confidence: 92,
          observations: [
            "Demonstrated proper assessment techniques",
            "Accurate vital signs measurement",
            "Appropriate use of medical equipment",
          ],
          recommendations: ["Consider advanced wound care training", "Practice complex medication calculations"],
        },
        {
          category: "Communication",
          score: 91,
          confidence: 88,
          observations: [
            "Clear, empathetic patient communication",
            "Effective family interaction",
            "Professional team collaboration",
          ],
          recommendations: ["Excellent communication skills", "Could mentor junior staff"],
        },
        {
          category: "Safety & Compliance",
          score: 85,
          confidence: 95,
          observations: ["Consistent hand hygiene practices", "Proper PPE usage", "Fall prevention awareness"],
          recommendations: ["Review updated infection control protocols", "Attend safety refresher training"],
        },
        {
          category: "Documentation",
          score: 82,
          confidence: 89,
          observations: [
            "Accurate patient information recording",
            "Timely documentation completion",
            "Appropriate medical terminology",
          ],
          recommendations: ["Improve documentation timeliness", "Use more specific clinical language"],
        },
      ],
      riskFactors: ["Occasional delays in documentation", "Could improve medication double-checking"],
      strengths: [
        "Excellent patient rapport",
        "Strong clinical assessment skills",
        "Professional demeanor",
        "Team collaboration",
      ],
      developmentAreas: ["Documentation efficiency", "Advanced clinical procedures", "Leadership skills"],
    }

    setEvaluationData(mockData)
    setIsAnalyzing(false)
    onEvaluationComplete(mockData)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-600"
    if (score >= 80) return "bg-blue-100 text-blue-600"
    if (score >= 70) return "bg-yellow-100 text-yellow-600"
    return "bg-red-100 text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Staff Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            M.A.S.E AI Competency Evaluation
          </CardTitle>
          <CardDescription>
            AI-powered real-time competency assessment for {staffMember.name} ({staffMember.role})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">{staffMember.name}</h3>
                <p className="text-gray-600">
                  {staffMember.role} • {staffMember.department}
                </p>
              </div>
            </div>
            {!isAnalyzing && !evaluationData && (
              <Button onClick={startAnalysis} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Zap className="h-4 w-4 mr-2" />
                Start AI Analysis
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 animate-pulse" />
              AI Analysis in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{currentPhase}</span>
                <span className="text-sm text-gray-600">{analysisProgress.toFixed(0)}%</span>
              </div>
              <Progress value={analysisProgress} className="h-3" />

              {/* Live Insights */}
              {liveInsights.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Live AI Insights
                  </h4>
                  <div className="space-y-2">
                    {liveInsights.map((insight, index) => (
                      <div key={index} className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm text-green-800">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluation Results */}
      {evaluationData && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2" />
                Overall Performance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className={`text-4xl font-bold ${getScoreColor(evaluationData.overallScore)}`}>
                    {evaluationData.overallScore}%
                  </div>
                  <p className="text-gray-600">Overall Competency Score</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-purple-100 text-purple-600 mb-2">
                    AI Confidence: {evaluationData.aiConfidence}%
                  </Badge>
                  <p className="text-sm text-gray-600">Evaluation Time: {evaluationData.evaluationTime} minutes</p>
                </div>
              </div>
              <Progress value={evaluationData.overallScore} className="h-4" />
            </CardContent>
          </Card>

          {/* Competency Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Competency Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {evaluationData.competencyScores.map((competency, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{competency.category}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge className={getScoreBadge(competency.score)}>{competency.score}%</Badge>
                        <span className="text-xs text-gray-600">Confidence: {competency.confidence}%</span>
                      </div>
                    </div>
                    <Progress value={competency.score} className="h-2 mb-4" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                          Observations
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {competency.observations.map((obs, obsIndex) => (
                            <li key={obsIndex} className="flex items-start">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {obs}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center">
                          <Lightbulb className="h-3 w-3 mr-1 text-blue-600" />
                          Recommendations
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {competency.recommendations.map((rec, recIndex) => (
                            <li key={recIndex} className="flex items-start">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strengths and Development Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {evaluationData.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                      <Star className="h-4 w-4 text-green-600 mr-3" />
                      <span className="text-sm text-green-800">{strength}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Development Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {evaluationData.developmentAreas.map((area, index) => (
                    <div key={index} className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Target className="h-4 w-4 text-blue-600 mr-3" />
                      <span className="text-sm text-blue-800">{area}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Factors */}
          {evaluationData.riskFactors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Risk Factors & Areas of Concern
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {evaluationData.riskFactors.map((risk, index) => (
                    <div key={index} className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-600 mr-3" />
                      <span className="text-sm text-red-800">{risk}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Evaluation Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes">Additional Comments</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional observations or comments about this evaluation..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Evaluation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
