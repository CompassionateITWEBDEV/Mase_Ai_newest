"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DollarSign, TrendingUp, Calculator, Target, Zap, AlertCircle, CheckCircle, ArrowUp } from "lucide-react"

interface FinancialOptimizationData {
  currentMonthlyRevenue: number
  optimizedMonthlyRevenue: number
  potentialIncrease: number
  riskAdjustmentOpportunity: number
  codingAccuracyScore: number
  reimbursementEfficiency: number
  topOpportunities: Array<{
    category: string
    impact: number
    difficulty: "low" | "medium" | "high"
    description: string
  }>
  trends: {
    lastMonth: number
    threeMonthAvg: number
    yearOverYear: number
  }
}

export function FinancialOptimizationWidget() {
  const [data, setData] = useState<FinancialOptimizationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data - in real app, fetch from API
    const mockData: FinancialOptimizationData = {
      currentMonthlyRevenue: 285000,
      optimizedMonthlyRevenue: 342000,
      potentialIncrease: 57000,
      riskAdjustmentOpportunity: 15.2,
      codingAccuracyScore: 87.5,
      reimbursementEfficiency: 82.3,
      topOpportunities: [
        {
          category: "OASIS Coding Optimization",
          impact: 25000,
          difficulty: "low",
          description: "Improve M-item coding accuracy for higher case mix scores",
        },
        {
          category: "Therapy Utilization",
          impact: 18000,
          difficulty: "medium",
          description: "Optimize therapy frequency and duration documentation",
        },
        {
          category: "Wound Care Documentation",
          impact: 14000,
          difficulty: "low",
          description: "Enhanced wound staging and treatment documentation",
        },
      ],
      trends: {
        lastMonth: 8.5,
        threeMonthAvg: 12.3,
        yearOverYear: 22.7,
      },
    }

    setTimeout(() => {
      setData(mockData)
      setLoading(false)
    }, 1000)
  }, [])

  if (loading || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const increasePercentage = ((data.potentialIncrease / data.currentMonthlyRevenue) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Main Financial Overview */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Financial Optimization Overview
          </CardTitle>
          <CardDescription>AI-powered revenue optimization analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">${data.potentialIncrease.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Monthly Opportunity</div>
              <div className="flex items-center justify-center mt-1">
                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">+{increasePercentage}%</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{data.riskAdjustmentOpportunity}%</div>
              <div className="text-sm text-gray-600">Risk Adjustment Upside</div>
              <Progress value={data.riskAdjustmentOpportunity} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{data.codingAccuracyScore}%</div>
              <div className="text-sm text-gray-600">Coding Accuracy</div>
              <Progress value={data.codingAccuracyScore} className="mt-2" />
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Current Monthly Revenue</div>
                <div className="text-2xl font-bold">${data.currentMonthlyRevenue.toLocaleString()}</div>
              </div>
              <div className="text-center">
                <ArrowUp className="h-8 w-8 text-green-500 mx-auto" />
                <div className="text-sm font-medium text-green-600">Optimization</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Optimized Revenue</div>
                <div className="text-2xl font-bold text-green-600">
                  ${data.optimizedMonthlyRevenue.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-blue-600" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Reimbursement Efficiency</span>
                  <span className="text-sm font-bold">{data.reimbursementEfficiency}%</span>
                </div>
                <Progress value={data.reimbursementEfficiency} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Coding Accuracy</span>
                  <span className="text-sm font-bold">{data.codingAccuracyScore}%</span>
                </div>
                <Progress value={data.codingAccuracyScore} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Risk Adjustment Capture</span>
                  <span className="text-sm font-bold">{data.riskAdjustmentOpportunity}%</span>
                </div>
                <Progress value={data.riskAdjustmentOpportunity} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Revenue Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <span className="text-sm font-medium">Last Month Growth</span>
                <div className="flex items-center">
                  <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="font-bold text-green-600">+{data.trends.lastMonth}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                <span className="text-sm font-medium">3-Month Average</span>
                <div className="flex items-center">
                  <ArrowUp className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="font-bold text-blue-600">+{data.trends.threeMonthAvg}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                <span className="text-sm font-medium">Year over Year</span>
                <div className="flex items-center">
                  <ArrowUp className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="font-bold text-purple-600">+{data.trends.yearOverYear}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Top Optimization Opportunities
          </CardTitle>
          <CardDescription>Prioritized recommendations for maximum financial impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topOpportunities.map((opportunity, index) => (
              <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{opportunity.category}</h4>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">+${opportunity.impact.toLocaleString()}/month</Badge>
                    <Badge
                      className={
                        opportunity.difficulty === "low"
                          ? "bg-green-100 text-green-800"
                          : opportunity.difficulty === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }
                    >
                      {opportunity.difficulty} effort
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{opportunity.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {opportunity.difficulty === "low" ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-600">
                      {opportunity.difficulty === "low" ? "Quick win" : "Requires planning"}
                    </span>
                  </div>
                  <Button size="sm" variant="outline">
                    <Calculator className="h-4 w-4 mr-2" />
                    Implement
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button className="bg-green-600 hover:bg-green-700">
          <DollarSign className="h-4 w-4 mr-2" />
          Generate Optimization Report
        </Button>
        <Button variant="outline">
          <Calculator className="h-4 w-4 mr-2" />
          Schedule Optimization Review
        </Button>
      </div>
    </div>
  )
}
