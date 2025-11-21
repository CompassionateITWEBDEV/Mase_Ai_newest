"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Activity, Pill, AlertTriangle, FileText, Loader2, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AIPatientSummaryProps {
  patientId?: string
  patientName?: string
  consultation?: any
}

export function AIPatientSummary({ patientId, patientName, consultation }: AIPatientSummaryProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    if (patientId || consultation) {
      generateSummary()
    }
  }, [patientId, consultation])

  const generateSummary = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/patient-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          patientName,
          consultation
        })
      })

      const data = await response.json()
      if (data.success) {
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('AI Summary error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-600" />
          <p className="text-sm text-gray-600">AI is analyzing patient data...</p>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Brain className="h-8 w-8 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-600">No patient summary available</p>
          <Button size="sm" onClick={generateSummary} className="mt-3">
            Generate AI Summary
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Patient Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <User className="h-4 w-4 mr-2" />
            Patient Overview
            <Badge className="ml-2 bg-blue-600 text-xs">AI-Generated</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-600">Name:</p>
            <p className="text-base font-semibold">{patientName || 'Unknown'}</p>
          </div>
          {summary.demographics && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Age:</p>
                  <p className="font-medium">{summary.demographics.age || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Gender:</p>
                  <p className="font-medium">{summary.demographics.gender || 'N/A'}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Clinical Summary */}
      {summary.clinicalSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Brain className="h-4 w-4 mr-2 text-purple-600" />
              AI Clinical Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              {summary.clinicalSummary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key Risk Factors */}
      {summary.riskFactors && summary.riskFactors.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
              Key Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.riskFactors.map((risk: any, idx: number) => (
                <li key={idx} className="flex items-start text-sm">
                  <span className="text-orange-500 mr-2 mt-0.5">⚠</span>
                  <div>
                    <p className="font-medium">{risk.factor}</p>
                    {risk.severity && (
                      <Badge className="mt-1" variant={
                        risk.severity === 'high' ? 'destructive' : 'secondary'
                      }>
                        {risk.severity}
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Current Medications */}
      {summary.medications && summary.medications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Pill className="h-4 w-4 mr-2 text-blue-600" />
              Current Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.medications.map((med: any, idx: number) => (
                <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                  <p className="font-medium">{med.name}</p>
                  <p className="text-xs text-gray-600">{med.dosage}</p>
                  {med.interactions && (
                    <p className="text-xs text-red-600 mt-1 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {med.interactions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medical History Highlights */}
      {summary.historyHighlights && summary.historyHighlights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <FileText className="h-4 w-4 mr-2 text-green-600" />
              Medical History Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.historyHighlights.map((highlight: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  {highlight}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      {summary.recommendations && summary.recommendations.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Activity className="h-4 w-4 mr-2 text-purple-600" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start">
                  <span className="text-purple-600 mr-2">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

