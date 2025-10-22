"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Brain, User, Activity, Heart, AlertTriangle, Target, TrendingUp, Calendar, Stethoscope } from "lucide-react"

interface PatientData {
  age: number
  diagnosis: string
  comorbidities: string[]
  functionalStatus: number
  cognitiveStatus: number
  medicationCompliance: number
  socialSupport: number
  priorHospitalizations: number
}

interface PredictionResult {
  outcome: "excellent" | "good" | "fair" | "poor"
  confidence: number
  riskFactors: string[]
  recommendations: string[]
  timeframe: string
}

export function PatientOutcomePredictor() {
  const [patientData, setPatientData] = useState<PatientData>({
    age: 0,
    diagnosis: "",
    comorbidities: [],
    functionalStatus: 50,
    cognitiveStatus: 50,
    medicationCompliance: 50,
    socialSupport: 50,
    priorHospitalizations: 0,
  })

  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handlePredict = async () => {
    setLoading(true)

    // Simulate AI prediction logic
    setTimeout(() => {
      const riskScore = calculateRiskScore(patientData)
      const result = generatePrediction(riskScore, patientData)
      setPrediction(result)
      setLoading(false)
    }, 2000)
  }

  const calculateRiskScore = (data: PatientData): number => {
    let score = 0

    // Age factor
    if (data.age > 75) score += 20
    else if (data.age > 65) score += 10

    // Functional status
    score += (100 - data.functionalStatus) * 0.3

    // Cognitive status
    score += (100 - data.cognitiveStatus) * 0.2

    // Medication compliance
    score += (100 - data.medicationCompliance) * 0.25

    // Social support
    score += (100 - data.socialSupport) * 0.15

    // Prior hospitalizations
    score += data.priorHospitalizations * 5

    return Math.min(100, score)
  }

  const generatePrediction = (riskScore: number, data: PatientData): PredictionResult => {
    let outcome: "excellent" | "good" | "fair" | "poor"
    let confidence: number
    const riskFactors: string[] = []
    const recommendations: string[] = []

    if (riskScore < 20) {
      outcome = "excellent"
      confidence = 92 + Math.random() * 6
    } else if (riskScore < 40) {
      outcome = "good"
      confidence = 85 + Math.random() * 10
    } else if (riskScore < 65) {
      outcome = "fair"
      confidence = 78 + Math.random() * 12
    } else {
      outcome = "poor"
      confidence = 70 + Math.random() * 15
    }

    // Generate risk factors
    if (data.age > 75) riskFactors.push("Advanced age (>75)")
    if (data.functionalStatus < 60) riskFactors.push("Limited functional mobility")
    if (data.cognitiveStatus < 70) riskFactors.push("Cognitive impairment")
    if (data.medicationCompliance < 80) riskFactors.push("Medication non-compliance")
    if (data.socialSupport < 60) riskFactors.push("Limited social support")
    if (data.priorHospitalizations > 2) riskFactors.push("Multiple prior hospitalizations")

    // Generate recommendations
    if (data.functionalStatus < 70) {
      recommendations.push("Increase physical therapy frequency")
      recommendations.push("Implement fall prevention measures")
    }
    if (data.cognitiveStatus < 80) {
      recommendations.push("Cognitive assessment and support")
      recommendations.push("Family caregiver education")
    }
    if (data.medicationCompliance < 85) {
      recommendations.push("Medication management program")
      recommendations.push("Pill organizer and reminders")
    }
    if (data.socialSupport < 70) {
      recommendations.push("Social worker consultation")
      recommendations.push("Community resource connection")
    }

    return {
      outcome,
      confidence: Math.round(confidence * 10) / 10,
      riskFactors,
      recommendations,
      timeframe: outcome === "excellent" ? "90 days" : outcome === "good" ? "60 days" : "30 days",
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Patient Outcome Predictor
          </CardTitle>
          <CardDescription>AI-powered prediction model for patient outcomes based on clinical data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Data Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="age">Patient Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={patientData.age || ""}
                  onChange={(e) => setPatientData({ ...patientData, age: Number.parseInt(e.target.value) || 0 })}
                  placeholder="Enter age"
                />
              </div>

              <div>
                <Label htmlFor="diagnosis">Primary Diagnosis</Label>
                <Input
                  id="diagnosis"
                  value={patientData.diagnosis}
                  onChange={(e) => setPatientData({ ...patientData, diagnosis: e.target.value })}
                  placeholder="e.g., Post-surgical recovery, COPD, Stroke"
                />
              </div>

              <div>
                <Label htmlFor="hospitalizations">Prior Hospitalizations (last 12 months)</Label>
                <Input
                  id="hospitalizations"
                  type="number"
                  value={patientData.priorHospitalizations || ""}
                  onChange={(e) =>
                    setPatientData({ ...patientData, priorHospitalizations: Number.parseInt(e.target.value) || 0 })
                  }
                  placeholder="Number of hospitalizations"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Functional Status</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Progress value={patientData.functionalStatus} className="flex-1" />
                  <span className="text-sm font-medium w-12">{patientData.functionalStatus}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={patientData.functionalStatus}
                  onChange={(e) =>
                    setPatientData({ ...patientData, functionalStatus: Number.parseInt(e.target.value) })
                  }
                  className="w-full mt-1"
                />
              </div>

              <div>
                <Label>Cognitive Status</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Progress value={patientData.cognitiveStatus} className="flex-1" />
                  <span className="text-sm font-medium w-12">{patientData.cognitiveStatus}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={patientData.cognitiveStatus}
                  onChange={(e) => setPatientData({ ...patientData, cognitiveStatus: Number.parseInt(e.target.value) })}
                  className="w-full mt-1"
                />
              </div>

              <div>
                <Label>Medication Compliance</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Progress value={patientData.medicationCompliance} className="flex-1" />
                  <span className="text-sm font-medium w-12">{patientData.medicationCompliance}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={patientData.medicationCompliance}
                  onChange={(e) =>
                    setPatientData({ ...patientData, medicationCompliance: Number.parseInt(e.target.value) })
                  }
                  className="w-full mt-1"
                />
              </div>

              <div>
                <Label>Social Support</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Progress value={patientData.socialSupport} className="flex-1" />
                  <span className="text-sm font-medium w-12">{patientData.socialSupport}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={patientData.socialSupport}
                  onChange={(e) => setPatientData({ ...patientData, socialSupport: Number.parseInt(e.target.value) })}
                  className="w-full mt-1"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handlePredict}
            disabled={loading || !patientData.age || !patientData.diagnosis}
            className="w-full"
          >
            {loading ? (
              <>
                <Brain className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Patient Data...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Generate Outcome Prediction
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Prediction Results */}
      {prediction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Prediction Results
            </CardTitle>
            <CardDescription>AI-generated outcome prediction with confidence score and recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Outcome Summary */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">Predicted Outcome</h3>
                  <p className="text-gray-600">Expected outcome within {prediction.timeframe}</p>
                </div>
                <div className="text-right">
                  <Badge
                    className={`text-lg px-4 py-2 ${
                      prediction.outcome === "excellent"
                        ? "bg-green-100 text-green-800"
                        : prediction.outcome === "good"
                          ? "bg-blue-100 text-blue-800"
                          : prediction.outcome === "fair"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                    }`}
                  >
                    {prediction.outcome.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">{prediction.confidence}% confidence</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded border">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="font-medium">Clinical Risk</p>
                  <p className="text-sm text-gray-600">
                    {prediction.outcome === "excellent"
                      ? "Low"
                      : prediction.outcome === "good"
                        ? "Low-Medium"
                        : prediction.outcome === "fair"
                          ? "Medium"
                          : "High"}
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded border">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="font-medium">Timeframe</p>
                  <p className="text-sm text-gray-600">{prediction.timeframe}</p>
                </div>
                <div className="text-center p-4 bg-white rounded border">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="font-medium">Confidence</p>
                  <p className="text-sm text-gray-600">{prediction.confidence}%</p>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            {prediction.riskFactors.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Identified Risk Factors
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {prediction.riskFactors.map((risk, index) => (
                    <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded">
                      <p className="text-sm font-medium text-orange-800">{risk}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {prediction.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-blue-500" />
                  Clinical Recommendations
                </h4>
                <div className="space-y-3">
                  {prediction.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm font-medium text-blue-800">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t">
              <Button className="flex-1">
                <User className="h-4 w-4 mr-2" />
                Generate Care Plan
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Follow-up
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                <Activity className="h-4 w-4 mr-2" />
                Track Progress
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
