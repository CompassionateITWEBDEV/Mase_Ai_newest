"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Target, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

// Sample analytics data
const analyticsData = {
  overview: {
    totalReferrals: 156,
    totalAdmissions: 98,
    conversionRate: 62.8,
    avgCostPerAdmission: 78.5,
    totalMarketingSpend: 7693,
    roi: 245,
  },
  trends: {
    referralsTrend: [
      { month: "Jan", referrals: 45, admissions: 28 },
      { month: "Feb", referrals: 52, admissions: 35 },
      { month: "Mar", referrals: 48, admissions: 31 },
      { month: "Apr", referrals: 59, admissions: 38 },
      { month: "May", referrals: 156, admissions: 98 },
    ],
    costTrends: [
      { month: "Jan", cost: 85.2 },
      { month: "Feb", cost: 82.15 },
      { month: "Mar", cost: 79.8 },
      { month: "Apr", cost: 81.25 },
      { month: "May", cost: 78.5 },
    ],
  },
  topPerformers: {
    facilities: [
      { name: "Mercy General Hospital", referrals: 45, admissions: 32, rate: 71 },
      { name: "Community Care Center", referrals: 28, admissions: 18, rate: 64 },
      { name: "Regional Medical Center", referrals: 35, admissions: 22, rate: 63 },
    ],
    marketers: [
      { name: "Sarah Johnson", referrals: 67, admissions: 48, rate: 72 },
      { name: "Mike Rodriguez", referrals: 45, admissions: 28, rate: 62 },
      { name: "Emily Chen", referrals: 44, admissions: 22, rate: 50 },
    ],
  },
}

export default function MarketingAnalyticsPage() {
  const [timeframe, setTimeframe] = useState("30")
  const [selectedMetric, setSelectedMetric] = useState("referrals")

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/marketing-dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Marketing Analytics</h1>
                <p className="text-gray-600">Detailed performance insights and trends</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.totalReferrals}</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.conversionRate}%</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +3.2% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Cost/Admission</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analyticsData.overview.avgCostPerAdmission}</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingDown className="h-3 w-3 mr-1" />
                -5.8% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Marketing ROI</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.roi}%</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +18% from last month
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList>
            <TabsTrigger value="trends">Trends & Patterns</TabsTrigger>
            <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
            <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Referral Trends</CardTitle>
                  <CardDescription>Monthly referrals and admissions over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.trends.referralsTrend.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.month}</span>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-semibold text-blue-600">{item.referrals} referrals</div>
                            <div className="text-xs text-green-600">{item.admissions} admitted</div>
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(item.admissions / item.referrals) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cost Efficiency Trends</CardTitle>
                  <CardDescription>Average cost per admission over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.trends.costTrends.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.month}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-semibold">${item.cost.toFixed(2)}</span>
                          <div className="flex items-center">
                            {index > 0 && item.cost < analyticsData.trends.costTrends[index - 1].cost ? (
                              <TrendingDown className="h-4 w-4 text-green-500" />
                            ) : index > 0 ? (
                              <TrendingUp className="h-4 w-4 text-red-500" />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Facilities</CardTitle>
                  <CardDescription>Facilities with highest conversion rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.topPerformers.facilities.map((facility, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                          </div>
                          <div>
                            <div className="font-medium">{facility.name}</div>
                            <div className="text-sm text-gray-600">
                              {facility.referrals} referrals • {facility.admissions} admitted
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">{facility.rate}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Marketers</CardTitle>
                  <CardDescription>Marketers with highest conversion rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.topPerformers.marketers.map((marketer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-purple-600">#{index + 1}</span>
                          </div>
                          <div>
                            <div className="font-medium">{marketer.name}</div>
                            <div className="text-sm text-gray-600">
                              {marketer.referrals} referrals • {marketer.admissions} admitted
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-purple-100 text-purple-800">{marketer.rate}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="forecasting" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Predictive Analytics</CardTitle>
                <CardDescription>AI-powered forecasting and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Next Month Forecast</div>
                    <div className="text-2xl font-bold text-blue-800 mt-1">185 referrals</div>
                    <div className="text-xs text-blue-600 mt-1">+18% projected growth</div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Conversion Prediction</div>
                    <div className="text-2xl font-bold text-green-800 mt-1">68.5%</div>
                    <div className="text-xs text-green-600 mt-1">+5.7% improvement expected</div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium">Cost Optimization</div>
                    <div className="text-2xl font-bold text-purple-800 mt-1">$72.30</div>
                    <div className="text-xs text-purple-600 mt-1">Target cost per admission</div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">AI Recommendations</h4>
                  <ul className="space-y-1 text-sm text-yellow-700">
                    <li>• Focus marketing efforts on facilities with 60%+ conversion rates</li>
                    <li>• Increase visit frequency to "warning" status facilities</li>
                    <li>• Consider reducing lunch budget for facilities with $90+ cost per admission</li>
                    <li>• Implement follow-up protocol for referrals not acted upon within 24 hours</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
