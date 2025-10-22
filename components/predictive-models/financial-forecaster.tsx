"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts"
import { DollarSign, TrendingUp, Calculator, Target, AlertCircle, BarChart3, Calendar } from "lucide-react"

interface ForecastParameters {
  currentVolume: number
  volumeGrowthRate: number
  caseMixIndex: number
  reimbursementRate: number
  operationalEfficiency: number
  marketCompetition: number
  seasonalVariation: number
  forecastPeriod: number
}

interface ForecastResult {
  predictions: Array<{
    period: string
    revenue: number
    confidence: number
    upperBound: number
    lowerBound: number
  }>
  summary: {
    totalRevenue: number
    averageMonthly: number
    growthRate: number
    confidenceScore: number
  }
  risks: string[]
  opportunities: string[]
  recommendations: string[]
}

export function FinancialForecaster() {
  const [parameters, setParameters] = useState<ForecastParameters>({
    currentVolume: 850,
    volumeGrowthRate: 5,
    caseMixIndex: 1.25,
    reimbursementRate: 92,
    operationalEfficiency: 87,
    marketCompetition: 65,
    seasonalVariation: 8,
    forecastPeriod: 12,
  })

  const [forecast, setForecast] = useState<ForecastResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleForecast = async () => {
    setLoading(true)

    // Simulate AI forecasting logic
    setTimeout(() => {
      const result = generateForecast(parameters)
      setForecast(result)
      setLoading(false)
    }, 2000)
  }

  const generateForecast = (params: ForecastParameters): ForecastResult => {
    const baseRevenue = params.currentVolume * 3500 // Base revenue per episode
    const predictions = []

    for (let i = 1; i <= params.forecastPeriod; i++) {
      const growthFactor = 1 + (params.volumeGrowthRate / 100) * (i / 12)
      const seasonalFactor = 1 + (Math.sin(((i - 1) * Math.PI) / 6) * params.seasonalVariation) / 100
      const competitionFactor = 1 - (params.marketCompetition / 100) * 0.1
      const efficiencyFactor = params.operationalEfficiency / 100
      const reimbursementFactor = params.reimbursementRate / 100
      const caseMixFactor = params.caseMixIndex

      const revenue = Math.round(
        baseRevenue *
          growthFactor *
          seasonalFactor *
          competitionFactor *
          efficiencyFactor *
          reimbursementFactor *
          caseMixFactor,
      )

      const confidence = Math.max(70, 95 - i * 2) // Confidence decreases over time
      const variance = revenue * 0.15 // 15% variance

      predictions.push({
        period: `Month ${i}`,
        revenue,
        confidence: Math.round(confidence),
        upperBound: Math.round(revenue + variance),
        lowerBound: Math.round(revenue - variance),
      })
    }

    const totalRevenue = predictions.reduce((sum, p) => sum + p.revenue, 0)
    const averageMonthly = totalRevenue / params.forecastPeriod
    const growthRate =
      ((predictions[predictions.length - 1].revenue - predictions[0].revenue) / predictions[0].revenue) * 100
    const confidenceScore = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length

    // Generate risks and opportunities
    const risks = []
    const opportunities = []
    const recommendations = []

    if (params.marketCompetition > 70) {
      risks.push("High market competition may impact patient acquisition")
      recommendations.push("Develop competitive differentiation strategies")
    }

    if (params.reimbursementRate < 90) {
      risks.push("Below-average reimbursement rates affecting profitability")
      recommendations.push("Focus on payer contract negotiations")
    }

    if (params.operationalEfficiency < 85) {
      risks.push("Operational inefficiencies reducing profit margins")
      recommendations.push("Implement process optimization initiatives")
    }

    if (params.caseMixIndex > 1.3) {
      opportunities.push("High case mix index indicates complex cases with higher reimbursement")
      recommendations.push("Maintain focus on high-acuity patient care")
    }

    if (params.volumeGrowthRate > 8) {
      opportunities.push("Strong volume growth projections")
      recommendations.push("Scale operations to support growth")
    }

    return {
      predictions,
      summary: {
        totalRevenue,
        averageMonthly: Math.round(averageMonthly),
        growthRate: Math.round(growthRate * 10) / 10,
        confidenceScore: Math.round(confidenceScore),
      },
      risks,
      opportunities,
      recommendations,
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-green-600" />
            Financial Forecasting Model
          </CardTitle>
          <CardDescription>AI-powered revenue forecasting based on operational and market parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Parameter Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-700">Volume Metrics</h4>

              <div>
                <Label htmlFor="currentVolume">Current Monthly Volume</Label>
                <Input
                  id="currentVolume"
                  type="number"
                  value={parameters.currentVolume}
                  onChange={(e) =>
                    setParameters({ ...parameters, currentVolume: Number.parseInt(e.target.value) || 0 })
                  }
                  placeholder="Number of episodes"
                />
              </div>

              <div>
                <Label>Volume Growth Rate (%)</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Progress value={parameters.volumeGrowthRate * 2} className="flex-1" />
                  <span className="text-sm font-medium w-12">{parameters.volumeGrowthRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={parameters.volumeGrowthRate}
                  onChange={(e) =>
                    setParameters({ ...parameters, volumeGrowthRate: Number.parseFloat(e.target.value) })
                  }
                  className="w-full mt-1"
                />
              </div>

              <div>
                <Label htmlFor="forecastPeriod">Forecast Period (months)</Label>
                <Select
                  value={parameters.forecastPeriod.toString()}
                  onValueChange={(value) => setParameters({ ...parameters, forecastPeriod: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="18">18 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-700">Financial Parameters</h4>

              <div>
                <Label>Case Mix Index</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Progress value={(parameters.caseMixIndex - 0.8) * 100} className="flex-1" />
                  <span className="text-sm font-medium w-12">{parameters.caseMixIndex}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.8"
                  step="0.01"
                  value={parameters.caseMixIndex}
                  onChange={(e) => setParameters({ ...parameters, caseMixIndex: Number.parseFloat(e.target.value) })}
                  className="w-full mt-1"
                />
              </div>

              <div>
                <Label>Reimbursement Rate (%)</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Progress value={parameters.reimbursementRate} className="flex-1" />
                  <span className="text-sm font-medium w-12">{parameters.reimbursementRate}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="100"
                  value={parameters.reimbursementRate}
                  onChange={(e) => setParameters({ ...parameters, reimbursementRate: Number.parseInt(e.target.value) })}
                  className="w-full mt-1"
                />
              </div>

              <div>
                <Label>Operational Efficiency (%)</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Progress value={parameters.operationalEfficiency} className="flex-1" />
                  <span className="text-sm font-medium w-12">{parameters.operationalEfficiency}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="100"
                  value={parameters.operationalEfficiency}
                  onChange={(e) =>
                    setParameters({ ...parameters, operationalEfficiency: Number.parseInt(e.target.value) })
                  }
                  className="w-full mt-1"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-700">Market Factors</h4>

              <div>
                <Label>Market Competition Level (%)</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Progress value={parameters.marketCompetition} className="flex-1" />
                  <span className="text-sm font-medium w-12">{parameters.marketCompetition}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={parameters.marketCompetition}
                  onChange={(e) => setParameters({ ...parameters, marketCompetition: Number.parseInt(e.target.value) })}
                  className="w-full mt-1"
                />
              </div>

              <div>
                <Label>Seasonal Variation (%)</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Progress value={parameters.seasonalVariation * 5} className="flex-1" />
                  <span className="text-sm font-medium w-12">{parameters.seasonalVariation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={parameters.seasonalVariation}
                  onChange={(e) => setParameters({ ...parameters, seasonalVariation: Number.parseInt(e.target.value) })}
                  className="w-full mt-1"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleForecast} disabled={loading || !parameters.currentVolume} className="w-full">
            {loading ? (
              <>
                <Calculator className="h-4 w-4 mr-2 animate-spin" />
                Generating Financial Forecast...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Revenue Forecast
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Forecast Results */}
      {forecast && (
        <>
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Forecast Summary
              </CardTitle>
              <CardDescription>
                {parameters.forecastPeriod}-month revenue projection with {forecast.summary.confidenceScore}% confidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded border">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${(forecast.summary.totalRevenue / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded border">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-medium">Monthly Average</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${(forecast.summary.averageMonthly / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded border">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="font-medium">Growth Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {forecast.summary.growthRate > 0 ? "+" : ""}
                    {forecast.summary.growthRate}%
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded border">
                  <Target className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="font-medium">Confidence</p>
                  <p className="text-2xl font-bold text-orange-600">{forecast.summary.confidenceScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forecast Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Revenue Forecast Trend
              </CardTitle>
              <CardDescription>Monthly revenue projections with confidence intervals</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={forecast.predictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${(Number(value) / 1000).toFixed(0)}K`, ""]} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="upperBound"
                    stackId="1"
                    stroke="#E5E7EB"
                    fill="#E5E7EB"
                    fillOpacity={0.4}
                    name="Upper Bound"
                  />
                  <Area
                    type="monotone"
                    dataKey="lowerBound"
                    stackId="1"
                    stroke="#E5E7EB"
                    fill="#FFFFFF"
                    fillOpacity={1}
                    name="Lower Bound"
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} name="Projected Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Risk and Opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risks */}
            {forecast.risks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Financial Risks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forecast.risks.map((risk, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm font-medium text-red-800">{risk}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Opportunities */}
            {forecast.opportunities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Growth Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forecast.opportunities.map((opportunity, index) => (
                      <div key={index} className="p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm font-medium text-green-800">{opportunity}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recommendations */}
          {forecast.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Strategic Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {forecast.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm font-medium text-blue-800">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
