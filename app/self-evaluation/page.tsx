"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, PenTool, Save, Send, Clock, User, Target, Star, BookOpen, Award, TrendingUp } from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"

interface PerformanceQuestion {
  id: string
  category: string
  question: string
  type: "rating" | "checkbox" | "text" | "select"
  options?: string[]
  required: boolean
  weight: number
  evaluationType: "performance" | "competency"
}

interface SelfEvaluationData {
  id: string
  staffId: string
  evaluationType: "performance" | "competency"
  assessmentType: "annual" | "mid-year" | "probationary" | "initial" | "skills-validation"
  status: "draft" | "submitted" | "approved"
  completionPercentage: number
  responses: Record<string, any>
  submittedAt?: string
  lastModified: string
  dueDate: string
}

export default function SelfEvaluationPage() {
  const [currentUser] = useState(getCurrentUser())
  const [activeTab, setActiveTab] = useState("performance")
  const [currentEvaluation, setCurrentEvaluation] = useState<SelfEvaluationData | null>(null)
  const [questions, setQuestions] = useState<PerformanceQuestion[]>([])
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [evaluationType, setEvaluationType] = useState<"performance" | "competency">("performance")

  // Mock evaluation history
  const evaluationHistory = [
    {
      id: "PERF-2024-001",
      type: "Performance - Annual Review",
      status: "approved",
      submittedAt: "2024-01-15",
      score: 4.6,
      approvedBy: "Dr. Martinez",
      evaluationType: "performance" as const,
    },
    {
      id: "COMP-2024-001",
      type: "Competency - Skills Validation",
      status: "approved",
      submittedAt: "2024-01-10",
      score: 4.4,
      approvedBy: "Dr. Martinez",
      evaluationType: "competency" as const,
    },
    {
      id: "PERF-2023-002",
      type: "Performance - Mid-Year Review",
      status: "approved",
      submittedAt: "2023-07-20",
      score: 4.4,
      approvedBy: "Jane Smith",
      evaluationType: "performance" as const,
    },
    {
      id: "COMP-2023-001",
      type: "Competency - Annual Assessment",
      status: "approved",
      submittedAt: "2023-01-10",
      score: 4.2,
      approvedBy: "Dr. Wilson",
      evaluationType: "competency" as const,
    },
  ]

  // Performance evaluation questions (focus on how well they're doing the job)
  const getPerformanceQuestions = (role: string): PerformanceQuestion[] => {
    const basePerformanceQuestions: PerformanceQuestion[] = [
      {
        id: "job-performance",
        category: "Job Performance",
        question: "How would you rate your overall job performance this evaluation period?",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 25,
        evaluationType: "performance",
      },
      {
        id: "productivity",
        category: "Productivity",
        question: "How effectively do you manage your workload and meet deadlines?",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 20,
        evaluationType: "performance",
      },
      {
        id: "quality-of-work",
        category: "Quality of Work",
        question: "Rate the quality and accuracy of your work output",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 20,
        evaluationType: "performance",
      },
      {
        id: "communication-performance",
        category: "Communication",
        question: "How effectively do you communicate with patients, families, and team members?",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 15,
        evaluationType: "performance",
      },
      {
        id: "teamwork-performance",
        category: "Teamwork",
        question: "How well do you collaborate and work as part of the healthcare team?",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 10,
        evaluationType: "performance",
      },
      {
        id: "achievements",
        category: "Achievements",
        question: "Describe your key accomplishments and contributions this evaluation period",
        type: "text",
        required: true,
        weight: 5,
        evaluationType: "performance",
      },
      {
        id: "challenges",
        category: "Challenges",
        question: "What challenges did you face and how did you overcome them?",
        type: "text",
        required: false,
        weight: 3,
        evaluationType: "performance",
      },
      {
        id: "goals",
        category: "Goals",
        question: "What are your performance goals for the next evaluation period?",
        type: "text",
        required: true,
        weight: 2,
        evaluationType: "performance",
      },
    ]

    return basePerformanceQuestions
  }

  // Competency evaluation questions (focus on whether they can do the job)
  const getCompetencyQuestions = (role: string): PerformanceQuestion[] => {
    const baseCompetencyQuestions: PerformanceQuestion[] = [
      {
        id: "safety-knowledge",
        category: "Safety & Compliance",
        question: "Rate your knowledge and application of safety protocols and infection control measures",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 25,
        evaluationType: "competency",
      },
      {
        id: "clinical-skills-self",
        category: "Clinical Skills",
        question: "How confident are you in your clinical assessment and intervention skills?",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 25,
        evaluationType: "competency",
      },
      {
        id: "technical-competency",
        category: "Technical Skills",
        question: "Rate your proficiency with required equipment and technology",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 20,
        evaluationType: "competency",
      },
      {
        id: "knowledge-base",
        category: "Professional Knowledge",
        question: "How would you rate your understanding of policies, procedures, and best practices?",
        type: "rating",
        options: ["1", "2", "3", "4", "5"],
        required: true,
        weight: 15,
        evaluationType: "competency",
      },
      {
        id: "skills-demonstration",
        category: "Skills Application",
        question: "Which skills do you feel most confident demonstrating?",
        type: "checkbox",
        options: [
          "Patient assessment",
          "Medication administration",
          "Wound care",
          "Documentation",
          "Emergency procedures",
          "Equipment operation",
          "Infection control",
          "Patient education",
        ],
        required: true,
        weight: 10,
        evaluationType: "competency",
      },
      {
        id: "learning-needs",
        category: "Development Needs",
        question: "What areas do you feel you need additional training or skill development?",
        type: "text",
        required: true,
        weight: 5,
        evaluationType: "competency",
      },
    ]

    // Add role-specific competency questions
    const roleSpecificQuestions: Record<string, PerformanceQuestion[]> = {
      RN: [
        {
          id: "rn-supervision",
          category: "Supervision & Leadership",
          question: "How confident are you in supervising and delegating to LPNs and HHAs?",
          type: "rating",
          options: ["1", "2", "3", "4", "5"],
          required: true,
          weight: 15,
          evaluationType: "competency",
        },
        {
          id: "rn-clinical-judgment",
          category: "Clinical Judgment",
          question: "Rate your ability to make independent clinical decisions and assessments",
          type: "rating",
          options: ["1", "2", "3", "4", "5"],
          required: true,
          weight: 20,
          evaluationType: "competency",
        },
      ],
      LPN: [
        {
          id: "lpn-scope",
          category: "Scope of Practice",
          question: "How well do you understand and work within your LPN scope of practice?",
          type: "rating",
          options: ["1", "2", "3", "4", "5"],
          required: true,
          weight: 20,
          evaluationType: "competency",
        },
      ],
      HHA: [
        {
          id: "hha-personal-care",
          category: "Personal Care Skills",
          question: "Rate your competency in providing activities of daily living assistance",
          type: "rating",
          options: ["1", "2", "3", "4", "5"],
          required: true,
          weight: 25,
          evaluationType: "competency",
        },
      ],
      PT: [
        {
          id: "pt-assessment",
          category: "Physical Therapy Assessment",
          question: "How confident are you in conducting comprehensive PT evaluations?",
          type: "rating",
          options: ["1", "2", "3", "4", "5"],
          required: true,
          weight: 25,
          evaluationType: "competency",
        },
      ],
      OT: [
        {
          id: "ot-functional",
          category: "Functional Assessment",
          question: "Rate your competency in functional and occupational assessments",
          type: "rating",
          options: ["1", "2", "3", "4", "5"],
          required: true,
          weight: 25,
          evaluationType: "competency",
        },
      ],
    }

    return [...baseCompetencyQuestions, ...(roleSpecificQuestions[role] || [])]
  }

  useEffect(() => {
    // Load questions based on evaluation type and user role
    const questionsToLoad =
      evaluationType === "performance"
        ? getPerformanceQuestions(currentUser.role.id)
        : getCompetencyQuestions(currentUser.role.id)
    setQuestions(questionsToLoad)

    // Load current evaluation or create new one
    const mockCurrentEvaluation: SelfEvaluationData = {
      id: `${evaluationType.toUpperCase()}-2024-CURRENT`,
      staffId: currentUser.id,
      evaluationType,
      assessmentType: evaluationType === "performance" ? "annual" : "skills-validation",
      status: "draft",
      completionPercentage: 0,
      responses: {},
      lastModified: new Date().toISOString(),
      dueDate: "2024-02-15",
    }
    setCurrentEvaluation(mockCurrentEvaluation)
    setResponses({}) // Clear responses when switching evaluation types
  }, [currentUser, evaluationType])

  useEffect(() => {
    // Calculate completion percentage
    const totalQuestions = questions.filter((q) => q.required).length
    const answeredQuestions = questions.filter((q) => q.required && responses[q.id]).length
    const percentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
    setCompletionPercentage(percentage)
  }, [responses, questions])

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleSaveDraft = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    // Show success message
  }

  const handleSubmitEvaluation = async () => {
    if (completionPercentage < 100) {
      alert("Please complete all required questions before submitting.")
      return
    }

    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    // Show success message and redirect
  }

  const renderQuestion = (question: PerformanceQuestion) => {
    switch (question.type) {
      case "rating":
        return (
          <RadioGroup
            value={responses[question.id] || ""}
            onValueChange={(value) => handleResponseChange(question.id, value)}
            className="flex space-x-4"
          >
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                <Label htmlFor={`${question.id}-${option}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "text":
        return (
          <Textarea
            value={responses[question.id] || ""}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter your response..."
            className="min-h-[100px]"
          />
        )

      case "select":
        return (
          <Select
            value={responses[question.id] || ""}
            onValueChange={(value) => handleResponseChange(question.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "checkbox":
        return (
          <div className="grid grid-cols-2 gap-2">
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  checked={responses[question.id]?.includes(option) || false}
                  onCheckedChange={(checked) => {
                    const currentValues = responses[question.id] || []
                    if (checked) {
                      handleResponseChange(question.id, [...currentValues, option])
                    } else {
                      handleResponseChange(
                        question.id,
                        currentValues.filter((v: string) => v !== option),
                      )
                    }
                  }}
                />
                <Label className="text-sm">{option}</Label>
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getEvaluationTypeIcon = (type: "performance" | "competency") => {
    return type === "competency" ? (
      <Target className="h-4 w-4 text-blue-600" />
    ) : (
      <TrendingUp className="h-4 w-4 text-green-600" />
    )
  }

  const groupedQuestions = questions.reduce(
    (acc, question) => {
      if (!acc[question.category]) {
        acc[question.category] = []
      }
      acc[question.category].push(question)
      return acc
    },
    {} as Record<string, PerformanceQuestion[]>,
  )

  const performanceHistory = evaluationHistory.filter((e) => e.evaluationType === "performance")
  const competencyHistory = evaluationHistory.filter((e) => e.evaluationType === "competency")

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/evaluations">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Evaluations
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <PenTool className="h-6 w-6 mr-3 text-indigo-600" />
                  Self Evaluation
                </h1>
                <p className="text-gray-600">Complete your performance and competency self-assessments</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-indigo-100 text-indigo-800">
                <User className="h-3 w-3 mr-1" />
                {currentUser.role.name}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="performance">Performance Evaluation</TabsTrigger>
            <TabsTrigger value="competency">Competency Assessment</TabsTrigger>
            <TabsTrigger value="history">Evaluation History</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            {/* Performance Evaluation Explanation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Performance Evaluation
                </CardTitle>
                <CardDescription>
                  <strong>Focus:</strong> How well are you performing your job responsibilities?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Purpose</h4>
                  <p className="text-sm text-green-700 mb-3">
                    Assess how well you actually perform your assigned job responsibilities and tasks over time,
                    including productivity, quality of care, and adherence to organizational policies.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                    <div>
                      <h5 className="font-medium mb-1">Evaluation Areas:</h5>
                      <ul className="space-y-1">
                        <li>• Job performance and productivity</li>
                        <li>• Quality of work output</li>
                        <li>• Communication effectiveness</li>
                        <li>• Teamwork and collaboration</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-1">Assessment Focus:</h5>
                      <ul className="space-y-1">
                        <li>• Actual execution of duties</li>
                        <li>• Achievement of goals and metrics</li>
                        <li>• Professional behavior</li>
                        <li>• Continuous improvement</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Evaluation Form */}
            {currentEvaluation && (
              <>
                {/* Progress Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Performance Evaluation Progress</span>
                      {getStatusBadge(currentEvaluation.status)}
                    </CardTitle>
                    <CardDescription>
                      Annual Performance Review • Due: {new Date(currentEvaluation.dueDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Completion Progress</span>
                        <span className="text-sm text-gray-600">{Math.round(completionPercentage)}%</span>
                      </div>
                      <Progress value={completionPercentage} className="h-3" />
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Last modified: {new Date(currentEvaluation.lastModified).toLocaleString()}</span>
                        <span>
                          {questions.filter((q) => q.required && responses[q.id]).length} of{" "}
                          {questions.filter((q) => q.required).length} required questions completed
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Questions */}
                <div className="space-y-6">
                  {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className="text-lg">{category}</CardTitle>
                        <CardDescription>
                          {categoryQuestions.length} question{categoryQuestions.length !== 1 ? "s" : ""} in this
                          category
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {categoryQuestions.map((question) => (
                          <div key={question.id} className="space-y-3">
                            <div className="flex items-start justify-between">
                              <Label className="text-sm font-medium leading-relaxed">{question.question}</Label>
                              {question.required && <span className="text-red-500 text-sm ml-1">*</span>}
                            </div>
                            {renderQuestion(question)}
                            {question.type === "rating" && (
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Poor</span>
                                <span>Excellent</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Action Buttons */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Auto-saved {new Date().toLocaleTimeString()}
                      </div>
                      <div className="flex space-x-3">
                        <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Draft
                        </Button>
                        <Button
                          onClick={handleSubmitEvaluation}
                          disabled={completionPercentage < 100 || isSubmitting}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {isSubmitting ? "Submitting..." : "Submit Performance Evaluation"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="competency" className="space-y-6">
            {/* Competency Assessment Explanation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                  Competency Assessment
                </CardTitle>
                <CardDescription>
                  <strong>Focus:</strong> Do you have the skills and knowledge to do your job safely?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Purpose</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Evaluate whether you have the necessary skills, knowledge, and abilities to perform your assigned
                    job duties safely and effectively. This determines if you possess the required competencies for your
                    role.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                    <div>
                      <h5 className="font-medium mb-1">Assessment Areas:</h5>
                      <ul className="space-y-1">
                        <li>• Clinical skills and knowledge</li>
                        <li>• Safety protocols and compliance</li>
                        <li>• Technical proficiency</li>
                        <li>• Professional standards</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium mb-1">Assessment Methods:</h5>
                      <ul className="space-y-1">
                        <li>• Skills demonstrations</li>
                        <li>• Knowledge assessments</li>
                        <li>• Competency checklists</li>
                        <li>• Self-evaluation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Switch to Competency Questions */}
            <div className="flex justify-center">
              <Button
                onClick={() => setEvaluationType("competency")}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={evaluationType === "competency"}
              >
                <Target className="h-4 w-4 mr-2" />
                {evaluationType === "competency" ? "Competency Assessment Active" : "Start Competency Assessment"}
              </Button>
            </div>

            {/* Competency Assessment Form */}
            {evaluationType === "competency" && currentEvaluation && (
              <>
                {/* Progress Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Competency Assessment Progress</span>
                      {getStatusBadge(currentEvaluation.status)}
                    </CardTitle>
                    <CardDescription>
                      Skills Validation Assessment • Due: {new Date(currentEvaluation.dueDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Completion Progress</span>
                        <span className="text-sm text-gray-600">{Math.round(completionPercentage)}%</span>
                      </div>
                      <Progress value={completionPercentage} className="h-3" />
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Last modified: {new Date(currentEvaluation.lastModified).toLocaleString()}</span>
                        <span>
                          {questions.filter((q) => q.required && responses[q.id]).length} of{" "}
                          {questions.filter((q) => q.required).length} required questions completed
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Competency Questions */}
                <div className="space-y-6">
                  {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className="text-lg">{category}</CardTitle>
                        <CardDescription>
                          {categoryQuestions.length} question{categoryQuestions.length !== 1 ? "s" : ""} in this
                          category
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {categoryQuestions.map((question) => (
                          <div key={question.id} className="space-y-3">
                            <div className="flex items-start justify-between">
                              <Label className="text-sm font-medium leading-relaxed">{question.question}</Label>
                              {question.required && <span className="text-red-500 text-sm ml-1">*</span>}
                            </div>
                            {renderQuestion(question)}
                            {question.type === "rating" && (
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>Not Competent</span>
                                <span>Highly Competent</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Action Buttons */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Auto-saved {new Date().toLocaleTimeString()}
                      </div>
                      <div className="flex space-x-3">
                        <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Draft
                        </Button>
                        <Button
                          onClick={handleSubmitEvaluation}
                          disabled={completionPercentage < 100 || isSubmitting}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {isSubmitting ? "Submitting..." : "Submit Competency Assessment"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    Performance Evaluation History
                  </CardTitle>
                  <CardDescription>Your completed performance evaluations and feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performanceHistory.map((evaluation) => (
                      <div key={evaluation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{evaluation.type}</h3>
                            <p className="text-sm text-gray-600">
                              Submitted: {new Date(evaluation.submittedAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">Approved by: {evaluation.approvedBy}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="font-medium">{evaluation.score}</span>
                            </div>
                            <p className="text-xs text-gray-500">Overall Score</p>
                          </div>
                          {getStatusBadge(evaluation.status)}
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Competency History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-blue-600" />
                    Competency Assessment History
                  </CardTitle>
                  <CardDescription>Your completed competency assessments and validations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {competencyHistory.map((evaluation) => (
                      <div key={evaluation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Target className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{evaluation.type}</h3>
                            <p className="text-sm text-gray-600">
                              Submitted: {new Date(evaluation.submittedAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">Approved by: {evaluation.approvedBy}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="font-medium">{evaluation.score}</span>
                            </div>
                            <p className="text-xs text-gray-500">Overall Score</p>
                          </div>
                          {getStatusBadge(evaluation.status)}
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Development Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Professional Development Plan
                </CardTitle>
                <CardDescription>Set goals and track your professional growth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Award className="h-4 w-4 mr-2" />
                        Performance Goals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-medium text-sm">Improve Documentation Efficiency</h4>
                          <p className="text-xs text-gray-600 mt-1">Target: Reduce documentation time by 20%</p>
                          <Progress value={75} className="h-2 mt-2" />
                        </div>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium text-sm">Enhance Patient Communication</h4>
                          <p className="text-xs text-gray-600 mt-1">Target: Achieve 95% patient satisfaction</p>
                          <Progress value={85} className="h-2 mt-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Competency Goals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium text-sm">Advanced Wound Care Certification</h4>
                          <p className="text-xs text-gray-600 mt-1">Target completion: Q2 2024</p>
                          <Progress value={60} className="h-2 mt-2" />
                        </div>
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <h4 className="font-medium text-sm">IV Therapy Skills Validation</h4>
                          <p className="text-xs text-gray-600 mt-1">Target completion: Q1 2024</p>
                          <Progress value={90} className="h-2 mt-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
