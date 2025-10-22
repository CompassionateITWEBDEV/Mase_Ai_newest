"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  TrendingUp,
  Brain,
  Target,
  AlertTriangle,
  DollarSign,
  Users,
  Calendar,
  Activity,
  Zap,
  Eye,
  Download,
  RefreshCw,
  BarChart3,
  PieChartIcon,
  LineChartIcon,
  Stethoscope,
  Heart,
  Shield,
  Calculator,
  Award,
  AlertCircle,
} from "lucide-react"

interface PredictiveModel {
  id: string
  name: string
  type: "patient_outcome" | "financial_forecast" | "readmission_risk" | "length_of_stay"
  accuracy: number
  lastTrained: string
  status: "active" | "training" | "needs_update"
  predictions: number
  confidence: number
}

interface PatientOutcomePrediction {
  patientId: string
  patientName: string
  currentCondition: string
  predictedOutcome: "excellent" | "good" | "fair" | "poor"
  riskFactors: string[]
  interventionRecommendations: string[]
  confidenceScore: number
  timeframe: string
  clinicalIndicators: {
    mobility: number
    cognition: number
    medication_compliance: number
    social_support: number
  }
}

interface FinancialForecast {
  period: string
  predictedRevenue: number
  actualRevenue?: number
  variance?: number
  confidence: number
  factors: {
    patient_volume: number
    case_mix_index: number
    reimbursement_rate: number
    operational_efficiency: number
  }
  risks: string[]
  opportunities: string[]
}

export default function PredictiveAnalytics() {
  const [models, setModels] = useState<PredictiveModel[]>([])
  const [patientPredictions, setPatientPredictions] = useState<PatientOutcomePrediction[]>([])
  const [financialForecasts, setFinancialForecasts] = useState<FinancialForecast[]>([])
  const [selectedTimeframe, setSelectedTimeframe] = useState("3_months")
  const [selectedModel, setSelectedModel] = useState<PredictiveModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    // Mock data for predictive models
    const mockModels: PredictiveModel[] = [
      {
        id: "model_001",
        name: "Patient Outcome Predictor",
        type: "patient_outcome",
        accuracy: 87.3,
        lastTrained: "2024-01-15",
        status: "active",
        predictions: 1247,
        confidence: 92.1,
      },
      {
        id: "model_002",
        name: "Financial Revenue Forecaster",
        type: "financial_forecast",
        accuracy: 91.8,
        lastTrained: "2024-01-14",
        status: "active",
        predictions: 856,
        confidence: 89.4,
      },
      {
        id: "model_003",
        name: "Readmission Risk Analyzer",
        type: "readmission_risk",
        accuracy: 84.6,
        lastTrained: "2024-01-13",
        status: "needs_update",
        predictions: 2103,
        confidence: 86.7,
      },
      {
        id: "model_004",
        name: "Length of Stay Predictor",
        type: "length_of_stay",
        accuracy: 79.2,
        lastTrained: "2024-01-12",
        status: "training",
        predictions: 1892,
        confidence: 81.3,
      },
    ]

    const mockPatientPredictions: PatientOutcomePrediction[] = [
      {
        patientId: "PT-2024-001",
        patientName: "Margaret Anderson",
        currentCondition: "Post-surgical recovery with diabetes",
        predictedOutcome: "good",
        riskFactors: ["Diabetes complications", "Age >75", "Limited mobility", "Medication adherence issues"],
        interventionRecommendations: [
          "Increase PT frequency to 3x/week",
          "Implement diabetes management protocol",
          "Family caregiver education",
          "Medication compliance monitoring",
        ],
        confidenceScore: 87.3,
        timeframe: "30 days",
        clinicalIndicators: {
          mobility: 65,
          cognition: 85,
          medication_compliance: 72,
          social_support: 90,
        },
      },
      {
        patientId: "PT-2024-002",
        patientName: "Robert Thompson",
        currentCondition: "COPD exacerbation management",
        predictedOutcome: "fair",
        riskFactors: ["Severe COPD", "History of hospitalizations", "Social isolation", "Smoking history"],
        interventionRecommendations: [
          "Pulmonary rehabilitation program",
          "Social worker consultation",
          "Respiratory therapy intensification",
          "Emergency action plan review",
        ],
        confidenceScore: 91.7,
        timeframe: "60 days",
        clinicalIndicators: {
          mobility: 45,
          cognition: 78,
          medication_compliance: 68,
          social_support: 35,
        },
      },
      {
        patientId: "PT-2024-003",
        patientName: "Sarah Williams",
        currentCondition: "Stroke recovery rehabilitation",
        predictedOutcome: "excellent",
        riskFactors: ["Recent stroke", "Hypertension"],
        interventionRecommendations: [
          "Continue current therapy regimen",
          "Blood pressure monitoring",
          "Speech therapy maintenance",
          "Family support optimization",
        ],
        confidenceScore: 94.2,
        timeframe: "90 days",
        clinicalIndicators: {
          mobility: 82,
          cognition: 88,
          medication_compliance: 95,
          social_support: 92,
        },
      },
    ]

    const mockFinancialForecasts: FinancialForecast[] = [
      {
        period: "Jan 2024",
        predictedRevenue: 342000,
        actualRevenue: 338500,
        variance: -1.0,
        confidence: 89.2,
        factors: {
          patient_volume: 85,
          case_mix_index: 1.24,
          reimbursement_rate: 92,
          operational_efficiency: 87,
        },
        risks: ["Seasonal patient volume decline", "Reimbursement rate changes"],
        opportunities: ["New therapy programs", "Improved case mix optimization"],
      },
      {
        period: "Feb 2024",
        predictedRevenue: 358000,
        confidence: 91.5,
        factors: {
          patient_volume: 92,
          case_mix_index: 1.28,
          reimbursement_rate: 93,
          operational_efficiency: 89,
        },
        risks: ["Staff shortage impact", "Regulatory changes"],
        opportunities: ["Enhanced OASIS coding", "Expanded service areas"],
      },
      {
        period: "Mar 2024",
        predictedRevenue: 375000,
        confidence: 87.8,
        factors: {
          patient_volume: 96,
          case_mix_index: 1.31,
          reimbursement_rate: 94,
          operational_efficiency: 91,
        },
        risks: ["Market competition", "Payer mix changes"],
        opportunities: ["Quality bonus programs", "Technology efficiency gains"],
      },
    ]

    setTimeout(() => {
      setModels(mockModels)
      setPatientPredictions(mockPatientPredictions)
      setFinancialForecasts(mockFinancialForecasts)
      setLoading(false)
    }, 1000)
  }, [])

  // Chart data preparation
  const revenueChartData = financialForecasts.map((forecast) => ({
    period: forecast.period,
    predicted: forecast.predictedRevenue,
    actual: forecast.actualRevenue || null,
    confidence: forecast.confidence,
  }))

  const outcomeDistributionData = [
    { name: "Excellent", value: 35, color: "#10B981" },
    { name: "Good", value: 42, color: "#3B82F6" },
    { name: "Fair", value: 18, color: "#F59E0B" },
    { name: "Poor", value: 5, color: "#EF4444" },
  ]

  const riskFactorData = [
    { factor: "Diabetes", count: 23, severity: "high" },
    { factor: "Age >75", count: 31, severity: "medium" },
    { factor: "Mobility Issues", count: 18, severity: "high" },
    { factor: "Social Isolation", count: 12, severity: "medium" },
    { factor: "Medication Non-compliance", count: 15, severity: "high" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading Predictive Analytics Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Brain className="h-8 w-8 mr-3 text-purple-600" />
            Predictive Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">AI-powered patient outcome predictions and financial forecasting</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1_month">1 Month</SelectItem>
              <SelectItem value="3_months">3 Months</SelectItem>
              <SelectItem value="6_months">6 Months</SelectItem>
              <SelectItem value="1_year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retrain Models
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patient-outcomes">Patient Outcomes</TabsTrigger>
          <TabsTrigger value="financial-forecast">Financial Forecast</TabsTrigger>
          <TabsTrigger value="risk-analysis">Risk Analysis</TabsTrigger>
          <TabsTrigger value="model-performance">Model Performance</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Models</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{models.filter((m) => m.status === "active").length}</div>
                <p className="text-xs text-muted-foreground">
                  {models.filter((m) => m.status === "needs_update").length} need updates
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Model Accuracy</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(models.reduce((sum, m) => sum + m.accuracy, 0) / models.length)}%
                </div>
                <p className="text-xs text-muted-foreground">+2.3% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Predictions Made</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {models.reduce((sum, m) => sum + m.predictions, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Forecast</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ${financialForecasts[financialForecasts.length - 1]?.predictedRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Next month prediction</p>
              </CardContent>
            </Card>
          </div>

          {/* Model Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Predictive Models Status
              </CardTitle>
              <CardDescription>Current status and performance of all predictive models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.map((model) => (
                  <div key={model.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{model.name}</h3>
                        <p className="text-sm text-gray-600">Last trained: {model.lastTrained}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-purple-100 text-purple-800">{model.accuracy}% accuracy</Badge>
                        <Badge
                          className={
                            model.status === "active"
                              ? "bg-green-100 text-green-800"
                              : model.status === "training"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-orange-100 text-orange-800"
                          }
                        >
                          {model.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs font-medium">Predictions Made</Label>
                        <div className="text-lg font-semibold">{model.predictions.toLocaleString()}</div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Confidence Score</Label>
                        <div className="flex items-center space-x-2">
                          <div className="text-lg font-semibold">{model.confidence}%</div>
                          <Progress value={model.confidence} className="flex-1" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Model Type</Label>
                        <div className="text-sm capitalize">{model.type.replace("_", " ")}</div>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setSelectedModel(model)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Brain className="h-5 w-5 text-purple-600" />
                              {model.name} - Detailed Analysis
                            </DialogTitle>
                            <DialogDescription>
                              Comprehensive model performance and prediction analysis
                            </DialogDescription>
                          </DialogHeader>

                          {selectedModel && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Performance Metrics</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      <div>
                                        <div className="flex justify-between mb-1">
                                          <span className="text-sm">Accuracy</span>
                                          <span className="text-sm font-medium">{selectedModel.accuracy}%</span>
                                        </div>
                                        <Progress value={selectedModel.accuracy} />
                                      </div>
                                      <div>
                                        <div className="flex justify-between mb-1">
                                          <span className="text-sm">Confidence</span>
                                          <span className="text-sm font-medium">{selectedModel.confidence}%</span>
                                        </div>
                                        <Progress value={selectedModel.confidence} />
                                      </div>
                                      <div>
                                        <div className="flex justify-between mb-1">
                                          <span className="text-sm">Precision</span>
                                          <span className="text-sm font-medium">89.2%</span>
                                        </div>
                                        <Progress value={89.2} />
                                      </div>
                                      <div>
                                        <div className="flex justify-between mb-1">
                                          <span className="text-sm">Recall</span>
                                          <span className="text-sm font-medium">91.7%</span>
                                        </div>
                                        <Progress value={91.7} />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Model Information</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-3">
                                      <div>
                                        <Label className="text-sm font-medium">Model Type</Label>
                                        <p className="text-sm capitalize">{selectedModel.type.replace("_", " ")}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Algorithm</Label>
                                        <p className="text-sm">Random Forest Ensemble</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Training Data</Label>
                                        <p className="text-sm">12,847 patient records</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Features Used</Label>
                                        <p className="text-sm">47 clinical and demographic variables</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Last Updated</Label>
                                        <p className="text-sm">{selectedModel.lastTrained}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg">Feature Importance</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-3">
                                    {[
                                      { feature: "Age", importance: 0.23 },
                                      { feature: "Comorbidity Count", importance: 0.19 },
                                      { feature: "Functional Status", importance: 0.16 },
                                      { feature: "Medication Count", importance: 0.14 },
                                      { feature: "Social Support", importance: 0.12 },
                                      { feature: "Previous Hospitalizations", importance: 0.16 },
                                    ].map((item, index) => (
                                      <div key={index}>
                                        <div className="flex justify-between mb-1">
                                          <span className="text-sm">{item.feature}</span>
                                          <span className="text-sm font-medium">
                                            {(item.importance * 100).toFixed(1)}%
                                          </span>
                                        </div>
                                        <Progress value={item.importance * 100} />
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button size="sm" variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retrain
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patient-outcomes" className="space-y-6">
          {/* Patient Outcome Predictions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-blue-600" />
                  Predicted Outcome Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={outcomeDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {outcomeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  Risk Factor Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskFactorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="factor" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Individual Patient Predictions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Individual Patient Outcome Predictions
              </CardTitle>
              <CardDescription>AI-powered predictions for current patients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {patientPredictions.map((prediction) => (
                  <div key={prediction.patientId} className="p-6 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium">{prediction.patientName}</h3>
                        <p className="text-sm text-gray-600">{prediction.currentCondition}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge
                          className={
                            prediction.predictedOutcome === "excellent"
                              ? "bg-green-100 text-green-800"
                              : prediction.predictedOutcome === "good"
                                ? "bg-blue-100 text-blue-800"
                                : prediction.predictedOutcome === "fair"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                          }
                        >
                          {prediction.predictedOutcome} outcome
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800">
                          {prediction.confidenceScore}% confidence
                        </Badge>
                        <Badge variant="outline">{prediction.timeframe}</Badge>
                      </div>
                    </div>

                    {/* Clinical Indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <Label className="text-xs font-medium">Mobility</Label>
                        <div className="flex items-center space-x-2">
                          <Progress value={prediction.clinicalIndicators.mobility} className="flex-1" />
                          <span className="text-sm font-medium">{prediction.clinicalIndicators.mobility}%</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Cognition</Label>
                        <div className="flex items-center space-x-2">
                          <Progress value={prediction.clinicalIndicators.cognition} className="flex-1" />
                          <span className="text-sm font-medium">{prediction.clinicalIndicators.cognition}%</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Medication Compliance</Label>
                        <div className="flex items-center space-x-2">
                          <Progress value={prediction.clinicalIndicators.medication_compliance} className="flex-1" />
                          <span className="text-sm font-medium">
                            {prediction.clinicalIndicators.medication_compliance}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Social Support</Label>
                        <div className="flex items-center space-x-2">
                          <Progress value={prediction.clinicalIndicators.social_support} className="flex-1" />
                          <span className="text-sm font-medium">{prediction.clinicalIndicators.social_support}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Risk Factors and Interventions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          Risk Factors
                        </h4>
                        <div className="space-y-1">
                          {prediction.riskFactors.map((risk, index) => (
                            <div key={index} className="text-sm p-2 bg-orange-50 rounded border-l-4 border-orange-500">
                              {risk}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-500" />
                          Recommended Interventions
                        </h4>
                        <div className="space-y-1">
                          {prediction.interventionRecommendations.map((intervention, index) => (
                            <div key={index} className="text-sm p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                              {intervention}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button size="sm">
                        <Stethoscope className="h-4 w-4 mr-2" />
                        Generate Care Plan
                      </Button>
                      <Button size="sm" variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Review
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial-forecast" className="space-y-6">
          {/* Revenue Forecast Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-blue-600" />
                Revenue Forecast vs Actual
              </CardTitle>
              <CardDescription>Predicted vs actual revenue with confidence intervals</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value?.toLocaleString()}`, ""]} />
                  <Legend />
                  <Line type="monotone" dataKey="predicted" stroke="#3B82F6" strokeWidth={3} name="Predicted Revenue" />
                  <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2} name="Actual Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Financial Forecast Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Detailed Financial Forecasts
              </CardTitle>
              <CardDescription>Monthly revenue predictions with contributing factors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {financialForecasts.map((forecast, index) => (
                  <div key={index} className="p-6 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium">{forecast.period}</h3>
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl font-bold text-blue-600">
                            ${forecast.predictedRevenue.toLocaleString()}
                          </span>
                          {forecast.actualRevenue && (
                            <>
                              <span className="text-lg text-gray-600">
                                vs ${forecast.actualRevenue.toLocaleString()} actual
                              </span>
                              <Badge
                                className={
                                  (forecast.variance || 0) >= 0
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }
                              >
                                {forecast.variance && forecast.variance > 0 ? "+" : ""}
                                {forecast.variance?.toFixed(1)}%
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">{forecast.confidence}% confidence</Badge>
                    </div>

                    {/* Contributing Factors */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <Label className="text-xs font-medium">Patient Volume</Label>
                        <div className="flex items-center space-x-2">
                          <Progress value={forecast.factors.patient_volume} className="flex-1" />
                          <span className="text-sm font-medium">{forecast.factors.patient_volume}%</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Case Mix Index</Label>
                        <div className="text-lg font-semibold">{forecast.factors.case_mix_index}</div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Reimbursement Rate</Label>
                        <div className="flex items-center space-x-2">
                          <Progress value={forecast.factors.reimbursement_rate} className="flex-1" />
                          <span className="text-sm font-medium">{forecast.factors.reimbursement_rate}%</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Operational Efficiency</Label>
                        <div className="flex items-center space-x-2">
                          <Progress value={forecast.factors.operational_efficiency} className="flex-1" />
                          <span className="text-sm font-medium">{forecast.factors.operational_efficiency}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Risks and Opportunities */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Financial Risks
                        </h4>
                        <div className="space-y-1">
                          {forecast.risks.map((risk, riskIndex) => (
                            <div key={riskIndex} className="text-sm p-2 bg-red-50 rounded border-l-4 border-red-500">
                              {risk}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Growth Opportunities
                        </h4>
                        <div className="space-y-1">
                          {forecast.opportunities.map((opportunity, oppIndex) => (
                            <div key={oppIndex} className="text-sm p-2 bg-green-50 rounded border-l-4 border-green-500">
                              {opportunity}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-600" />
                Comprehensive Risk Analysis
              </CardTitle>
              <CardDescription>AI-identified risks across clinical, financial, and operational domains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Clinical Risks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 rounded border border-red-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">High Readmission Risk</span>
                          <Badge className="bg-red-100 text-red-800">Critical</Badge>
                        </div>
                        <p className="text-xs text-gray-600">12 patients identified</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded border border-orange-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">Medication Non-compliance</span>
                          <Badge className="bg-orange-100 text-orange-800">High</Badge>
                        </div>
                        <p className="text-xs text-gray-600">8 patients at risk</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">Fall Risk</span>
                          <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                        </div>
                        <p className="text-xs text-gray-600">15 patients monitored</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-yellow-500" />
                      Financial Risks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 rounded border border-red-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">Reimbursement Denial Risk</span>
                          <Badge className="bg-red-100 text-red-800">Critical</Badge>
                        </div>
                        <p className="text-xs text-gray-600">$45K at risk</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded border border-orange-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">Under-coding</span>
                          <Badge className="bg-orange-100 text-orange-800">High</Badge>
                        </div>
                        <p className="text-xs text-gray-600">$28K opportunity loss</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">Payer Mix Changes</span>
                          <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                        </div>
                        <p className="text-xs text-gray-600">Monitor trends</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-500" />
                      Operational Risks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 rounded border border-red-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">Staff Shortage</span>
                          <Badge className="bg-red-100 text-red-800">Critical</Badge>
                        </div>
                        <p className="text-xs text-gray-600">3 key positions open</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded border border-orange-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">Documentation Delays</span>
                          <Badge className="bg-orange-100 text-orange-800">High</Badge>
                        </div>
                        <p className="text-xs text-gray-600">Average 2.3 days late</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">System Downtime</span>
                          <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                        </div>
                        <p className="text-xs text-gray-600">2.1% uptime target</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="model-performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Model Performance Analytics
              </CardTitle>
              <CardDescription>Detailed performance metrics and accuracy trends for all models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Accuracy Trends</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={[
                        { month: "Oct", accuracy: 84.2 },
                        { month: "Nov", accuracy: 86.1 },
                        { month: "Dec", accuracy: 87.8 },
                        { month: "Jan", accuracy: 89.3 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[80, 95]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="accuracy" stroke="#8B5CF6" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Model Comparison</h4>
                  <div className="space-y-4">
                    {models.map((model) => (
                      <div key={model.id} className="p-3 border rounded">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">{model.name}</span>
                          <span className="text-sm font-bold">{model.accuracy}%</span>
                        </div>
                        <Progress value={model.accuracy} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interventions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                AI-Recommended Interventions
              </CardTitle>
              <CardDescription>Proactive interventions based on predictive analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-red-800">Immediate Action Required</h4>
                    <Badge className="bg-red-100 text-red-800">High Priority</Badge>
                  </div>
                  <p className="text-sm text-red-700 mb-3">3 patients predicted to have poor outcomes within 30 days</p>
                  <div className="flex space-x-2">
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Review Patients
                    </Button>
                    <Button size="sm" variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Interventions
                    </Button>
                  </div>
                </div>

                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-yellow-800">Optimization Opportunity</h4>
                    <Badge className="bg-yellow-100 text-yellow-800">Medium Priority</Badge>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    Financial optimization could increase revenue by $47K this month
                  </p>
                  <div className="flex space-x-2">
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                      <Calculator className="h-4 w-4 mr-2" />
                      Implement Optimizations
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>

                <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-800">Preventive Care</h4>
                    <Badge className="bg-blue-100 text-blue-800">Low Priority</Badge>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">8 patients would benefit from enhanced therapy programs</p>
                  <div className="flex space-x-2">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Stethoscope className="h-4 w-4 mr-2" />
                      Plan Interventions
                    </Button>
                    <Button size="sm" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Contact Patients
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  )
}
