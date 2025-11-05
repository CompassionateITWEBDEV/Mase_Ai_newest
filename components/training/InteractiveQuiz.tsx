"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader2,
  Trophy,
  RotateCcw,
  ArrowRight,
} from "lucide-react"

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  explanation?: string
}

interface InteractiveQuizProps {
  questions: Question[]
  passingScore: number
  onComplete: (score: number, passed: boolean) => void
  onCancel?: () => void
  title?: string
}

export function InteractiveQuiz({
  questions,
  passingScore,
  onComplete,
  onCancel,
  title = "Quiz",
}: InteractiveQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = answers[currentQuestion?.id] || ""
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const answeredQuestions = Object.keys(answers).length

  const handleAnswerSelect = (answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }))
    setShowExplanation(false)
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setShowExplanation(false)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
      setShowExplanation(false)
    }
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      return
    }

    setIsSubmitting(true)

    // Calculate score
    let correctCount = 0
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++
      }
    })

    const finalScore = Math.round((correctCount / questions.length) * 100)
    setScore(finalScore)
    setShowResult(true)
    setIsSubmitting(false)

    // Call onComplete after a short delay to show results
    setTimeout(() => {
      onComplete(finalScore, finalScore >= passingScore)
    }, 3000)
  }

  const handleRetry = () => {
    setAnswers({})
    setCurrentQuestionIndex(0)
    setShowResult(false)
    setScore(0)
    setShowExplanation(false)
  }

  if (showResult) {
    const passed = score >= passingScore
    return (
      <Card className={`border-2 ${passed ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
        <CardContent className="p-8 text-center">
          <div
            className={`h-20 w-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
              passed ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {passed ? (
              <Trophy className="h-10 w-10 text-green-600" />
            ) : (
              <XCircle className="h-10 w-10 text-red-600" />
            )}
          </div>
          
          <h3 className="text-2xl font-bold mb-2">
            {passed ? "🎉 Congratulations!" : "Keep Learning"}
          </h3>
          
          <div className="text-5xl font-bold mb-4">
            <span className={passed ? "text-green-600" : "text-red-600"}>{score}%</span>
          </div>
          
          <p className="text-gray-700 mb-6">
            {passed
              ? `Great job! You passed the quiz with ${score}%. You've earned ${questions.length * 10} points!`
              : `You scored ${score}%, but need ${passingScore}% to pass. Review the material and try again!`}
          </p>

          <div className="flex justify-center space-x-3">
            {!passed && (
              <Button onClick={handleRetry} variant="outline" size="lg">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry Quiz
              </Button>
            )}
          </div>

          {/* Answer Review */}
          <div className="mt-6 pt-6 border-t border-gray-300">
            <h4 className="font-semibold mb-3 text-left">Answer Review</h4>
            <div className="space-y-2 text-left">
              {questions.map((q, index) => {
                const userAnswer = answers[q.id]
                const isCorrect = userAnswer === q.correctAnswer
                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded-lg border ${
                      isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">Question {index + 1}</p>
                        {!isCorrect && (
                          <p className="text-xs text-gray-600 mt-1">
                            Correct answer: {q.correctAnswer}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="flex items-center text-xl">
            <HelpCircle className="h-6 w-6 mr-2 text-blue-600" />
            {title}
          </CardTitle>
          <Badge className="bg-blue-600">
            {currentQuestionIndex + 1} / {questions.length}
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progress</span>
            <span>{Math.round((answeredQuestions / questions.length) * 100)}% Complete</span>
          </div>
          <Progress value={(answeredQuestions / questions.length) * 100} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question Card */}
        <Card className="bg-white border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="mb-4">
              <Badge variant="outline" className="mb-3">
                Question {currentQuestionIndex + 1}
              </Badge>
              <h3 className="text-lg font-semibold text-gray-900">
                {currentQuestion.question}
              </h3>
            </div>

            <RadioGroup value={currentAnswer} onValueChange={handleAnswerSelect}>
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = currentAnswer === option
                  return (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-blue-300 ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label
                        htmlFor={`option-${index}`}
                        className="flex-1 cursor-pointer font-medium"
                      >
                        {option}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </RadioGroup>

            {/* Explanation (if answer selected) */}
            {currentAnswer && currentQuestion.explanation && showExplanation && (
              <Alert className="mt-4 bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm">
                  <strong>Tip:</strong> {currentQuestion.explanation}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <div className="flex space-x-2">
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={answeredQuestions < questions.length || isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Quiz
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!currentAnswer}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Quiz Info */}
        <Alert>
          <AlertDescription className="text-xs">
            <strong>Passing Score:</strong> {passingScore}% • 
            <strong className="ml-2">Questions Answered:</strong> {answeredQuestions}/{questions.length}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

