"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  GraduationCap,
  Brain,
  Target,
  TrendingUp,
  BookMarked,
  User,
  Clock,
  Award,
  CheckCircle,
  Lightbulb,
  Star,
} from "lucide-react"

interface StaffEducationWidgetProps {
  staffId: string
  onEducationComplete?: (staffId: string, moduleId: string) => void
}

export function StaffEducationWidget({ staffId, onEducationComplete }: StaffEducationWidgetProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Mock staff data - in real implementation, this would come from props or API
  const staffData = {
    id: staffId,
    name: "Sarah Johnson, RN",
    role: "Registered Nurse",
    documentationScore: 89,
    improvementTrend: "+5.2%",
    recentErrors: [
      {
        orderId: "POC-2024-001247",
        errorType: "Medication Documentation",
        description: "Missing dosage information for Lisinopril",
        severity: "Medium",
        date: "2024-01-16",
        educationModule: "med-doc-101",
      },
      {
        orderId: "POC-2024-001240",
        errorType: "Patient Response",
        description: "No documentation of patient response to PT",
        severity: "Low",
        date: "2024-01-14",
        educationModule: "patient-response-301",
      },
    ],
    documentationStyle: {
      averageNoteLength: 245,
      detailLevel: "Moderate",
      consistencyScore: 78,
      clinicalAccuracy: 92,
      timeliness: 85,
      completeness: 89,
      areas: {
        assessments: 95,
        interventions: 88,
        outcomes: 82,
        planning: 91,
      },
    },
    improvementPlan: {
      active: true,
      startDate: "2024-01-08",
      targetDate: "2024-02-08",
      progress: 67,
      goals: [
        "Achieve 95% medication reconciliation completion",
        "Improve patient response documentation to 90%",
        "Standardize vital signs recording format",
      ],
      completedModules: 3,
      totalModules: 5,
    },
    recommendedModules: [
      {
        id: "med-doc-101",
        title: "Medication Documentation Mastery",
        description: "Complete guide to accurate medication reconciliation and documentation",
        duration: "45 minutes",
        difficulty: "Intermediate",
        priority: "High",
        starRatingImpact: "+0.3",
        completed: false,
        progress: 0,
      },
      {
        id: "patient-response-301",
        title: "Patient Response Documentation",
        description: "Advanced techniques for documenting patient responses and outcomes",
        duration: "40 minutes",
        difficulty: "Advanced",
        priority: "Medium",
        starRatingImpact: "+0.5",
        completed: false,
        progress: 0,
      },
      {
        id: "clinical-writing-101",
        title: "Clinical Writing Excellence",
        description: "Fundamentals of clear, complete, and compliant clinical documentation",
        duration: "30 minutes",
        difficulty: "Beginner",
        priority: "Low",
        starRatingImpact: "+0.2",
        completed: true,
        progress: 100,
      },
    ],
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-yellow-600"
    return "text-red-600"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const generatePersonalizedPlan = () => {
    console.log(`Generating personalized improvement plan for ${staffData.name}`)
    // In real implementation, this would analyze documentation patterns and create a custom plan
  }

  const startEducationModule = (moduleId: string) => {
    console.log(`Starting education module ${moduleId} for ${staffData.name}`)
    // In real implementation, this would launch the education module
  }

  return (
    <div className="space-y-6">
      {/* Staff Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            {staffData.name} - Documentation Performance & Education
          </CardTitle>
          <CardDescription>{staffData.role}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-xl font-bold text-blue-600">{staffData.documentationScore}%</div>
              <p className="text-sm text-blue-700">Documentation Score</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-xl font-bold text-green-600">{staffData.improvementTrend}</div>
              <p className="text-sm text-green-700">Improvement Trend</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded">
              <div className="text-xl font-bold text-yellow-600">{staffData.recentErrors.length}</div>
              <p className="text-sm text-yellow-700">Recent Issues</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <div className="text-xl font-bold text-purple-600">{staffData.improvementPlan.progress}%</div>
              <p className="text-sm text-purple-700">Plan Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="education">Education Plan</TabsTrigger>
          <TabsTrigger value="analysis">Style Analysis</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Recent Errors with Education Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Documentation Issues & Education Triggers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staffData.recentErrors.map((error, index) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {error.orderId} - {error.errorType}
                      </span>
                      <Badge
                        className={
                          error.severity === "High"
                            ? "bg-red-100 text-red-800"
                            : error.severity === "Medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                        }
                      >
                        {error.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{error.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{error.date}</span>
                      <Button size="sm" variant="outline" onClick={() => startEducationModule(error.educationModule)}>
                        <GraduationCap className="h-3 w-3 mr-1" />
                        Start Education
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={generatePersonalizedPlan} className="h-20 flex-col">
              <Brain className="h-6 w-6 mb-2" />
              Generate Improvement Plan
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <BookMarked className="h-6 w-6 mb-2" />
              View All Modules
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <TrendingUp className="h-6 w-6 mb-2" />
              Performance Report
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="education" className="space-y-4">
          {/* Active Improvement Plan */}
          {staffData.improvementPlan.active && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-orange-600" />
                  Active Improvement Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-sm text-gray-600">{staffData.improvementPlan.progress}%</span>
                  </div>
                  <Progress value={staffData.improvementPlan.progress} className="h-2" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Timeline</p>
                      <p>Start: {staffData.improvementPlan.startDate}</p>
                      <p>Target: {staffData.improvementPlan.targetDate}</p>
                    </div>
                    <div>
                      <p className="font-medium">Module Progress</p>
                      <p>
                        {staffData.improvementPlan.completedModules}/{staffData.improvementPlan.totalModules} completed
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="font-medium mb-2">Goals</p>
                    <ul className="text-sm space-y-1">
                      {staffData.improvementPlan.goals.map((goal, index) => (
                        <li key={index} className="flex items-start">
                          <Target className="h-3 w-3 mr-2 mt-0.5 text-blue-500" />
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommended Education Modules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookMarked className="h-5 w-5 mr-2 text-green-600" />
                Personalized Education Modules
              </CardTitle>
              <CardDescription>Modules recommended based on documentation patterns and recent errors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffData.recommendedModules.map((module) => (
                  <div key={module.id} className="p-4 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{module.title}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(module.priority)}>{module.priority}</Badge>
                        <Badge className="bg-green-100 text-green-800">
                          <Star className="h-3 w-3 mr-1" />
                          {module.starRatingImpact}
                        </Badge>
                        {module.completed && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{module.description}</p>

                    <div className="flex justify-between items-center text-sm mb-3">
                      <span>Duration: {module.duration}</span>
                      <span>Difficulty: {module.difficulty}</span>
                    </div>

                    {module.progress > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{module.progress}%</span>
                        </div>
                        <Progress value={module.progress} className="h-2" />
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {!module.completed ? (
                        <Button size="sm" onClick={() => startEducationModule(module.id)}>
                          <GraduationCap className="h-4 w-4 mr-2" />
                          {module.progress > 0 ? "Continue" : "Start"} Module
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline">
                          <Award className="h-4 w-4 mr-2" />
                          View Certificate
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {/* Documentation Style Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-600" />
                Documentation Style Analysis
              </CardTitle>
              <CardDescription>AI-powered analysis of documentation patterns and style characteristics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Performance by Area</h4>
                  <div className="space-y-3">
                    {Object.entries(staffData.documentationStyle.areas).map(([area, score]) => (
                      <div key={area} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{area}:</span>
                          <span className={`font-medium ${getPerformanceColor(score)}`}>{score}%</span>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Style Characteristics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Average Note Length:</span>
                      <span className="font-medium">{staffData.documentationStyle.averageNoteLength} words</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Detail Level:</span>
                      <span className="font-medium">{staffData.documentationStyle.detailLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Consistency Score:</span>
                      <span
                        className={`font-medium ${getPerformanceColor(staffData.documentationStyle.consistencyScore)}`}
                      >
                        {staffData.documentationStyle.consistencyScore}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clinical Accuracy:</span>
                      <span
                        className={`font-medium ${getPerformanceColor(staffData.documentationStyle.clinicalAccuracy)}`}
                      >
                        {staffData.documentationStyle.clinicalAccuracy}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timeliness:</span>
                      <span className={`font-medium ${getPerformanceColor(staffData.documentationStyle.timeliness)}`}>
                        {staffData.documentationStyle.timeliness}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completeness:</span>
                      <span className={`font-medium ${getPerformanceColor(staffData.documentationStyle.completeness)}`}>
                        {staffData.documentationStyle.completeness}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="mt-6 p-4 bg-blue-50 rounded">
                <h4 className="font-medium text-blue-800 mb-2">
                  <Lightbulb className="h-4 w-4 inline mr-2" />
                  AI-Generated Improvement Recommendations
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Focus on improving outcome documentation consistency (currently 82%)</li>
                  <li>• Consider using standardized templates for medication reconciliation</li>
                  <li>• Increase detail level in patient response documentation</li>
                  <li>• Maintain current strength in assessment documentation (95%)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {/* Progress Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Progress Tracking & Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Overall Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Overall Documentation Improvement</span>
                    <span className="text-sm text-green-600 font-medium">{staffData.improvementTrend}</span>
                  </div>
                  <Progress value={89} className="h-3" />
                  <p className="text-xs text-gray-500 mt-1">Target: 95% by {staffData.improvementPlan.targetDate}</p>
                </div>

                {/* Module Completion Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Education Module Completion</span>
                    <span className="text-sm text-gray-600">
                      {staffData.improvementPlan.completedModules}/{staffData.improvementPlan.totalModules}
                    </span>
                  </div>
                  <Progress
                    value={(staffData.improvementPlan.completedModules / staffData.improvementPlan.totalModules) * 100}
                    className="h-3"
                  />
                </div>

                {/* Recent Achievements */}
                <div className="p-4 bg-green-50 rounded">
                  <h4 className="font-medium text-green-800 mb-2">
                    <Award className="h-4 w-4 inline mr-2" />
                    Recent Achievements
                  </h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Completed "Clinical Writing Excellence" module</li>
                    <li>• Improved assessment documentation to 95%</li>
                    <li>• Reduced documentation errors by 15% this month</li>
                    <li>• Achieved 5.2% improvement in overall score</li>
                  </ul>
                </div>

                {/* Upcoming Milestones */}
                <div className="p-4 bg-blue-50 rounded">
                  <h4 className="font-medium text-blue-800 mb-2">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Upcoming Milestones
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Complete "Medication Documentation Mastery" by Jan 20</li>
                    <li>• Achieve 90% patient response documentation by Jan 25</li>
                    <li>• Reach 95% overall documentation score by Feb 8</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
