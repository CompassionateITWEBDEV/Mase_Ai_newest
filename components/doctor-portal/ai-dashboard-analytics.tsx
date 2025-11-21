"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Sparkles, Target, Award } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface AIDashboardAnalyticsProps {
  doctorId: string
  stats: any
}

export function AIDashboardAnalytics({ doctorId, stats }: AIDashboardAnalyticsProps) {
  const [insights, setInsights] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (doctorId && stats) {
      generateInsights()
    }
  }, [doctorId, stats])

  const generateInsights = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const response = await fetch('/api/ai/dashboard-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId,
          stats
        })
      })

      const data = await response.json()
      if (data.success) {
        setInsights(data.insights)
      } else {
        // API returned error, don't show the component
        setHasError(true)
      }
    } catch (error) {
      console.error('AI Insights error:', error)
      // Network or parsing error, don't show the component
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show anything if there's an error (OpenAI API issues)
  if (hasError) return null

  if (isLoading) {
    return (
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Brain className="h-4 w-4 mr-2 text-purple-600 animate-pulse" />
            AI Performance Insights
            <Badge className="ml-2 bg-purple-600 text-xs">Analyzing...</Badge>
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (!insights) return null

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center text-base">
          <Brain className="h-4 w-4 mr-2 text-purple-600" />
          AI Performance Insights
          <Badge className="ml-2 bg-purple-600 text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Performance Summary */}
        {insights.performanceSummary && (
          <div className="p-3 bg-white rounded-lg">
            <p className="text-sm text-gray-700 leading-relaxed">
              {insights.performanceSummary}
            </p>
          </div>
        )}

        <Separator />

        {/* Trends */}
        {insights.trends && insights.trends.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
              Key Trends
            </h4>
            <div className="space-y-2">
              {insights.trends.map((trend: any, idx: number) => (
                <div key={idx} className="flex items-start text-sm p-2 bg-white rounded">
                  {trend.direction === 'up' ? (
                    <TrendingUp className="h-4 w-4 mr-2 text-green-600 mt-0.5" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-2 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">{trend.metric}</p>
                    <p className="text-xs text-gray-600">{trend.insight}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Recommendations */}
        {insights.recommendations && insights.recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <Target className="h-4 w-4 mr-1 text-blue-600" />
              AI Recommendations
            </h4>
            <ul className="space-y-2">
              {insights.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start p-2 bg-white rounded">
                  <span className="text-blue-600 mr-2">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        {/* Strengths */}
        {insights.strengths && insights.strengths.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <Award className="h-4 w-4 mr-1 text-yellow-600" />
              Your Strengths
            </h4>
            <div className="flex flex-wrap gap-2">
              {insights.strengths.map((strength: string, idx: number) => (
                <Badge key={idx} className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Areas for Improvement */}
        {insights.improvements && insights.improvements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1 text-orange-600" />
              Growth Opportunities
            </h4>
            <ul className="space-y-1">
              {insights.improvements.map((improvement: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Performance Score */}
        {insights.performanceScore && (
          <div className="p-3 bg-white rounded-lg text-center">
            <p className="text-xs text-gray-600 mb-1">AI Performance Score</p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-3xl font-bold text-purple-600">{insights.performanceScore}</span>
              <span className="text-lg text-gray-500">/100</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">{insights.scoreInterpretation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

