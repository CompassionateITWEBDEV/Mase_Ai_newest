"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Award,
  Play,
  Eye,
  Download,
  AlertCircle,
  Loader2,
  HelpCircle,
} from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function StaffTrainingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const trainingId = params.trainingId as string
  const staffId = searchParams?.get("staffId") || undefined
  
  const { toast } = useToast()
  
  const [training, setTraining] = useState<any>(null)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [completedModules, setCompletedModules] = useState<string[]>([]) // Array of completed module IDs
  const [viewedFiles, setViewedFiles] = useState<Record<string, string[]>>({}) // Track viewed files per module: { moduleId: [fileId1, fileId2, ...] }
  const [moduleQuizScores, setModuleQuizScores] = useState<Record<string, number>>({}) // Track quiz scores per module: { moduleId: score }
  const [moduleStartTimes, setModuleStartTimes] = useState<Record<string, number>>({}) // Track when each module was started: { moduleId: timestamp }
  const [moduleTimeSpent, setModuleTimeSpent] = useState<Record<string, number>>({}) // Track time spent per module in seconds: { moduleId: seconds }
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number>(0) // Track which module user is currently on (sequential)
  const [loading, setLoading] = useState(true)
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [currentQuizModuleId, setCurrentQuizModuleId] = useState<string | null>(null) // Which module's quiz is being shown
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [quizScore, setQuizScore] = useState<number | null>(null)
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false)

  useEffect(() => {
    if (trainingId && staffId) {
      fetchTrainingData()
    }
  }, [trainingId, staffId])

  const fetchTrainingData = async () => {
    try {
      setLoading(true)
      
      // Fetch training details
      const trainingResponse = await fetch(`/api/in-service/trainings?trainingId=${encodeURIComponent(trainingId)}`, {
        cache: "no-store",
      })
      
      if (!trainingResponse.ok) {
        throw new Error("Failed to fetch training details")
      }
      
      const contentType = trainingResponse.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format")
      }
      
      const trainingData = await trainingResponse.json()
      
      if (trainingData.success && trainingData.trainings && trainingData.trainings.length > 0) {
        setTraining(trainingData.trainings[0])
      } else {
        throw new Error("Training not found")
      }
      
      // Fetch enrollment status
      const enrollmentResponse = await fetch(`/api/in-service/employee-progress?employeeId=${encodeURIComponent(staffId!)}`, {
        cache: "no-store",
      })
      
      if (enrollmentResponse.ok) {
        const enrollmentContentType = enrollmentResponse.headers.get("content-type")
        if (enrollmentContentType && enrollmentContentType.includes("application/json")) {
          const enrollmentData = await enrollmentResponse.json()
          
          if (enrollmentData.success && enrollmentData.employees && enrollmentData.employees.length > 0) {
            const employee = enrollmentData.employees[0]
            
            console.log('Loading training progress for employee:', {
              employeeId: staffId,
              trainingId: trainingId,
              inProgress: employee.inProgressTrainings?.length || 0,
              completed: employee.completedTrainings?.length || 0,
              assigned: employee.assignedTrainings?.length || 0,
            })
            
            // Find enrollment for this training
            const foundEnrollment = [
              ...(employee.inProgressTrainings || []),
              ...(employee.completedTrainings || []),
              ...(employee.assignedTrainings || []),
            ].find((t: any) => t.trainingId === trainingId || t.id === trainingId)
            
            if (foundEnrollment) {
              console.log('Found enrollment data:', {
                status: foundEnrollment.status,
                progress: foundEnrollment.progress,
                completedModules: foundEnrollment.completedModules,
                enrollmentId: foundEnrollment.enrollmentId,
                trainingId: foundEnrollment.trainingId,
              })
              
              // Set enrollment with all progress data
              setEnrollment({
                ...foundEnrollment,
                progress: foundEnrollment.progress || 0, // Ensure progress is set
                status: foundEnrollment.status || 'in_progress',
              })
              
              // Get completed modules from enrollment (stored as JSONB array)
              const enrollmentCompletedModules = foundEnrollment.completedModules || []
              const parsedCompletedModules = Array.isArray(enrollmentCompletedModules) ? enrollmentCompletedModules : []
              console.log('Restoring completed modules:', parsedCompletedModules)
              setCompletedModules(parsedCompletedModules)
              
              // Get viewed files per module (stored as JSONB object)
              const viewedFilesData = foundEnrollment.viewedFiles || {}
              const parsedViewedFiles = typeof viewedFilesData === 'string' ? JSON.parse(viewedFilesData) : viewedFilesData
              console.log('Restoring viewed files:', parsedViewedFiles)
              setViewedFiles(parsedViewedFiles)
              
              // Get module quiz scores
              const quizScoresData = foundEnrollment.moduleQuizScores || {}
              const parsedQuizScores = typeof quizScoresData === 'string' ? JSON.parse(quizScoresData) : quizScoresData
              console.log('Restoring quiz scores:', parsedQuizScores)
              setModuleQuizScores(parsedQuizScores)
              
              // Get module time tracking
              const timeSpentData = foundEnrollment.moduleTimeSpent || {}
              const parsedTimeSpent = typeof timeSpentData === 'string' ? JSON.parse(timeSpentData) : timeSpentData
              console.log('Restoring time spent:', parsedTimeSpent)
              setModuleTimeSpent(parsedTimeSpent)
              
              // Determine current module index (first incomplete module) using the data from database
              if (trainingData.trainings[0]?.modules) {
                const trainingModules = trainingData.trainings[0].modules
                let currentIndex = 0
                for (let i = 0; i < trainingModules.length; i++) {
                  const moduleId = trainingModules[i].id || `module-${i}`
                  // Use the parsed completed modules from database, not the state
                  if (!parsedCompletedModules.includes(moduleId)) {
                    currentIndex = i
                    break
                  }
                  currentIndex = i + 1 // If all completed, point to next (which doesn't exist)
                }
                console.log('Current module to continue from:', currentIndex)
                setCurrentModuleIndex(Math.min(currentIndex, trainingModules.length - 1))
              }
              
              console.log('✅ Training progress restored successfully!')
              
              // Show toast notification if there's existing progress
              if (parsedCompletedModules.length > 0) {
                const totalMods = trainingData.trainings[0]?.modules?.length || 0
                toast({
                  title: "Progress Restored",
                  description: `Continuing from ${parsedCompletedModules.length} of ${totalMods} module${totalMods !== 1 ? 's' : ''} completed (${foundEnrollment.progress || 0}%)`,
                })
              }
            } else {
              console.warn('⚠️ No enrollment found for this training. Starting fresh.')
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Error fetching training data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load training",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Start tracking time for a module when user first accesses it
  const startModuleTimer = (moduleId: string) => {
    if (!moduleStartTimes[moduleId]) {
      setModuleStartTimes(prev => ({
        ...prev,
        [moduleId]: Date.now()
      }))
    }
  }

  // Stop timer and record time spent on module
  const stopModuleTimer = (moduleId: string) => {
    if (moduleStartTimes[moduleId]) {
      const startTime = moduleStartTimes[moduleId]
      const timeSpent = Math.floor((Date.now() - startTime) / 1000) // Convert to seconds
      setModuleTimeSpent(prev => ({
        ...prev,
        [moduleId]: (prev[moduleId] || 0) + timeSpent
      }))
      setModuleStartTimes(prev => {
        const newTimes = { ...prev }
        delete newTimes[moduleId]
        return newTimes
      })
      return timeSpent
    }
    return 0
  }

  // Handle viewing a specific file within a module
  const handleFileView = async (moduleId: string, fileId: string, file: any) => {
    try {
      // Start timer if this is the first file viewed in this module
      startModuleTimer(moduleId)
      
      // Open file (PDF, video, slide, etc.)
      if (file.fileUrl) {
        // Check if it's a base64 data URL
        if (file.fileUrl.startsWith("data:")) {
          // Convert base64 to blob URL
          const blob = await (await fetch(file.fileUrl)).blob()
          const blobUrl = URL.createObjectURL(blob)
          window.open(blobUrl, "_blank")
        } else {
          // Regular URL
          window.open(file.fileUrl, "_blank")
        }
      }
      
      // Mark this file as viewed
      const currentViewed = viewedFiles[moduleId] || []
      if (!currentViewed.includes(fileId)) {
        const newViewed = [...currentViewed, fileId]
        const updatedViewedFiles = {
          ...viewedFiles,
          [moduleId]: newViewed,
        }
        setViewedFiles(updatedViewedFiles)
        
        // Check if all files in this module are now viewed
        const module = training.modules?.find((m: any) => (m.id || `module-${training.modules.indexOf(m)}`) === moduleId)
        if (module) {
          // Get all files in this module (support multiple files per module)
          const moduleFiles = module.files || [module] // Support both old format (single file) and new format (array of files)
          const allFileIds = moduleFiles.map((f: any, idx: number) => f.id || `file-${idx}`)
          
          // Check if all files are viewed
          const allFilesViewed = allFileIds.every((fId: string) => newViewed.includes(fId))
          
          if (allFilesViewed && !completedModules.includes(moduleId)) {
            // All files viewed - stop timer and record time
            const timeSpent = stopModuleTimer(moduleId)
            const updatedTimeSpent = {
              ...moduleTimeSpent,
              [moduleId]: (moduleTimeSpent[moduleId] || 0) + timeSpent
            }
            setModuleTimeSpent(updatedTimeSpent)
            
            // Check if module has a quiz - if yes, show quiz instead of marking complete
            const moduleQuiz = module.quiz || module.quiz_config
            if (moduleQuiz && moduleQuiz.questions && moduleQuiz.questions.length > 0) {
              // Module has quiz - show quiz for this module
              setCurrentQuizModuleId(moduleId)
              setShowQuiz(true)
              setQuizAnswers({})
              setQuizScore(null)
              toast({
                title: "Module Content Completed",
                description: "Please complete the quiz for this module to proceed.",
              })
            } else {
              // No quiz - mark module as completed immediately
              await completeModule(moduleId, updatedTimeSpent, updatedViewedFiles)
            }
          } else {
            // Just mark file as viewed, but don't update progress yet
            // Update viewed files in database without changing progress
            setIsUpdatingProgress(true)
            const response = await fetch("/api/in-service/employee-progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                employeeId: staffId,
                trainingId: trainingId,
                action: "progress",
                data: { 
                  progress: enrollment?.progress || 0, // Keep current progress
                  completedModules: completedModules, // Keep current completed modules
                  viewedFiles: updatedViewedFiles, // Update viewed files
                  moduleTimeSpent: moduleTimeSpent, // Update time tracking
                },
              }),
            })
            
            if (!response.ok) {
              const errorText = await response.text()
              throw new Error(`Failed to update file view: ${errorText}`)
            }
            
            toast({
              title: "File Viewed",
              description: "Continue viewing all content in this module to complete it.",
            })
          }
        }
      }
    } catch (error: any) {
      console.error("Error viewing file:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to open file",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingProgress(false)
    }
  }

  // Complete a module (after quiz is passed or if no quiz)
  const completeModule = async (moduleId: string, updatedTimeSpent?: Record<string, number>, updatedViewedFiles?: Record<string, string[]>, updatedQuizScores?: Record<string, number>) => {
    try {
      // Update local state immediately for instant UI feedback
      const newCompleted = [...completedModules, moduleId]
      setCompletedModules(newCompleted)
      
      // Calculate progress based on completed modules
      const totalModules = training.modules?.length || 1
      const newProgress = Math.round((newCompleted.length / totalModules) * 100)
      
      console.log(`Module ${moduleId} completed. Progress: ${newCompleted.length}/${totalModules} = ${newProgress}%`)
      
      // Update enrollment state IMMEDIATELY for instant UI update
      setEnrollment((prev: any) => ({
        ...prev,
        progress: newProgress,
        status: newProgress >= 100 ? "completed" : "in_progress",
      }))
      
      // Update progress in database
      setIsUpdatingProgress(true)
      const response = await fetch("/api/in-service/employee-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: staffId,
          trainingId: trainingId,
          action: "progress",
          data: { 
            progress: newProgress,
            completedModules: newCompleted, // Array of completed module IDs
            viewedFiles: updatedViewedFiles || viewedFiles, // Track viewed files per module
            moduleTimeSpent: updatedTimeSpent || moduleTimeSpent, // Track time per module
            moduleQuizScores: updatedQuizScores || moduleQuizScores, // Track quiz scores per module
          },
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Failed to save progress to database:", errorText)
        throw new Error(`Failed to update progress: ${errorText}`)
      }
      
      console.log(`Progress saved to database: ${newProgress}%`)
      
      // Move to next module if available
      const moduleIndex = training.modules.findIndex((m: any, idx: number) => (m.id || `module-${idx}`) === moduleId)
      if (moduleIndex >= 0 && moduleIndex < training.modules.length - 1) {
        setCurrentModuleIndex(moduleIndex + 1)
      }
      
      toast({
        title: "Module Completed!",
        description: `Module completed successfully. Progress: ${newProgress}%`,
      })
    } catch (error: any) {
      console.error("Error completing module:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to complete module",
        variant: "destructive",
      })
      // Revert the state changes on error
      setCompletedModules((prev) => prev.filter(id => id !== moduleId))
      // Recalculate progress
      const revertedProgress = Math.round(((completedModules.length) / (training.modules?.length || 1)) * 100)
      setEnrollment((prev: any) => ({
        ...prev,
        progress: revertedProgress,
      }))
    } finally {
      setIsUpdatingProgress(false)
    }
  }

  // Legacy function for backward compatibility (if module has single file)
  const handleModuleView = async (moduleId: string, module: any) => {
    // If module has a single file (old format), use it
    if (module.fileUrl) {
      const fileId = module.id || `file-0`
      await handleFileView(moduleId, fileId, module)
    } else if (module.files && module.files.length > 0) {
      // If module has multiple files, show them all
      // This will be handled in the UI
    }
  }

  // Handle starting quiz for a specific module (called when module content is completed)
  const handleStartModuleQuiz = (moduleId: string) => {
    if (!training || !staffId) return
    
    const module = training.modules?.find((m: any, idx: number) => (m.id || `module-${idx}`) === moduleId)
    if (!module) return
    
    const moduleQuiz = module.quiz || module.quiz_config
    if (!moduleQuiz || !moduleQuiz.questions || moduleQuiz.questions.length === 0) {
      // No quiz for this module, complete it directly
      completeModule(moduleId)
      return
    }
    
    setCurrentQuizModuleId(moduleId)
    setShowQuiz(true)
    setQuizAnswers({})
    setQuizScore(null)
  }

  // Handle starting final training quiz (if all modules completed)
  const handleStartFinalQuiz = () => {
    if (!training || !staffId) return
    
    // Check if all modules are completed
    const totalModules = training.modules?.length || 0
    if (totalModules > 0 && completedModules.length < totalModules) {
      toast({
        title: "Incomplete Training",
        description: `Please complete all ${totalModules} module(s) before taking the final quiz.`,
        variant: "destructive",
      })
      return
    }
    
    // Check if training has final quiz configured
    const quizConfig = training.quiz || training.quiz_config
    if (!quizConfig || !quizConfig.questions || quizConfig.questions.length === 0) {
      // No final quiz, complete training directly
      handleCompleteTraining(100)
      return
    }
    
    setCurrentQuizModuleId(null) // null means final quiz
    setShowQuiz(true)
    setQuizAnswers({})
    setQuizScore(null)
  }

  const handleQuizSubmit = async () => {
    if (!training || !staffId) return
    
    // Determine which quiz to use (module quiz or final quiz)
    let quizConfig: any = null
    if (currentQuizModuleId) {
      // Module-specific quiz
      const module = training.modules?.find((m: any, idx: number) => (m.id || `module-${idx}`) === currentQuizModuleId)
      quizConfig = module?.quiz || module?.quiz_config
    } else {
      // Final training quiz
      quizConfig = training.quiz || training.quiz_config
    }
    
    if (!quizConfig || !quizConfig.questions || quizConfig.questions.length === 0) {
      return
    }
    
    try {
      setIsSubmittingQuiz(true)
      
      // Calculate score
      let correctAnswers = 0
      const questions = quizConfig.questions || []
      
      questions.forEach((question: any, index: number) => {
        const questionId = question.id || `question-${index}`
        const userAnswer = quizAnswers[questionId]
        const correctAnswer = question.correctAnswer || question.correct_answer
        
        if (userAnswer === correctAnswer) {
          correctAnswers++
        }
      })
      
      const score = Math.round((correctAnswers / questions.length) * 100)
      const passingScore = quizConfig.passingScore || quizConfig.passing_score || 80
      
      setQuizScore(score)
      
      if (score >= passingScore) {
        // Passed
        if (currentQuizModuleId) {
          // Module quiz passed - complete the module
          const updatedQuizScores = {
            ...moduleQuizScores,
            [currentQuizModuleId]: score
          }
          setModuleQuizScores(updatedQuizScores)
          
          // Stop timer and record time
          const timeSpent = stopModuleTimer(currentQuizModuleId)
          const updatedTimeSpent = {
            ...moduleTimeSpent,
            [currentQuizModuleId]: (moduleTimeSpent[currentQuizModuleId] || 0) + timeSpent
          }
          
          await completeModule(currentQuizModuleId, updatedTimeSpent, viewedFiles, updatedQuizScores)
          
          // Close quiz
          setShowQuiz(false)
          setCurrentQuizModuleId(null)
          setQuizAnswers({})
          setQuizScore(null)
          
          toast({
            title: "Quiz Passed!",
            description: `You scored ${score}%. Module completed successfully!`,
          })
        } else {
          // Final quiz passed - complete training
          await handleCompleteTraining(score)
        }
      } else {
        // Failed - show message
        toast({
          title: "Quiz Not Passed",
          description: `You scored ${score}%. You need ${passingScore}% to pass. Please review the ${currentQuizModuleId ? 'module' : 'training'} and try again.`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error submitting quiz:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit quiz",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingQuiz(false)
    }
  }

  const handleCompleteTraining = async (finalScore: number = 100) => {
    if (!training || !staffId) return
    
    try {
      setIsCompleting(true)
      
      const response = await fetch("/api/in-service/employee-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: staffId,
          trainingId: trainingId,
          action: "complete",
          data: {
            score: finalScore,
            ceuHours: training.ceuHours || 0,
            quizAttempts: 1,
          },
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to complete training: ${errorText}`)
      }
      
      toast({
        title: "Training Completed!",
        description: `Congratulations! You've completed "${training.title}". ${training.ceuHours ? `${training.ceuHours} CEU hours earned.` : ""} ${finalScore < 100 ? `Quiz Score: ${finalScore}%` : ""}`,
      })
      
      // Redirect back to staff dashboard after a short delay
      setTimeout(() => {
        router.push(`/staff-dashboard?staff_id=${staffId}#training`)
      }, 2000)
    } catch (error: any) {
      console.error("Error completing training:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to complete training",
        variant: "destructive",
      })
    } finally {
      setIsCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading training...</p>
        </div>
      </div>
    )
  }

  if (!training) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Training Not Found</h2>
            <p className="text-gray-600 mb-4">The training you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => router.push(`/staff-dashboard?staff_id=${staffId}#training`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate current progress from state (most up-to-date)
  const totalModules = training.modules?.length || 0
  const calculatedProgress = totalModules > 0 ? Math.round((completedModules.length / totalModules) * 100) : 0
  
  // Use enrollment progress if available, otherwise use calculated (for immediate updates)
  const progress = enrollment?.progress !== undefined ? enrollment.progress : calculatedProgress
  const allModulesCompleted = totalModules > 0 && completedModules.length >= totalModules
  const isCompleted = enrollment?.status === "completed" || enrollment?.completed === true || progress >= 100
  
  // Debug: Log progress whenever it changes
  console.log('Staff Training Progress:', {
    completedModules: completedModules.length,
    totalModules,
    calculatedProgress,
    enrollmentProgress: enrollment?.progress,
    displayedProgress: progress,
    status: enrollment?.status
  })
  
  // Get current module (for sequential access)
  const currentModule = training.modules?.[currentModuleIndex]
  const currentModuleId = currentModule ? (currentModule.id || `module-${currentModuleIndex}`) : null
  const isCurrentModuleCompleted = currentModuleId ? completedModules.includes(currentModuleId) : false
  const canAccessNextModule = currentModuleIndex < totalModules - 1 && isCurrentModuleCompleted
  
  // Format time spent
  const formatTimeSpent = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/staff-dashboard?staff_id=${staffId}#training`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{training.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                {training.category && (
                  <Badge variant="outline">{training.category}</Badge>
                )}
                {training.ceuHours && (
                  <span className="flex items-center">
                    <Award className="h-4 w-4 mr-1" />
                    {training.ceuHours} CEU {training.ceuHours === 1 ? "Hour" : "Hours"}
                  </span>
                )}
                {training.duration && (
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {training.duration} minutes
                  </span>
                )}
                {training.difficulty && (
                  <Badge variant="outline" className="capitalize">
                    {training.difficulty}
                  </Badge>
                )}
              </div>
            </div>
            {isCompleted && (
              <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
                <CheckCircle className="h-4 w-4 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {!isCompleted && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-semibold text-blue-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-xs text-gray-500 mt-2">
                {completedModules.length} of {totalModules} module{totalModules !== 1 ? "s" : ""} completed
              </p>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {training.description && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                About This Training
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line">{training.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Training Modules */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Training Modules
            </CardTitle>
            <CardDescription>
              {totalModules === 0
                ? "No modules available for this training."
                : `Complete all ${totalModules} module${totalModules !== 1 ? "s" : ""} to finish this training.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalModules === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This training doesn't have any modules yet. Please contact your administrator.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {training.modules.map((module: any, index: number) => {
                  const moduleId = module.id || `module-${index}`
                  const isModuleCompleted = completedModules.includes(moduleId)
                  const isModuleLocked = index > currentModuleIndex // Lock modules that haven't been reached yet
                  const isCurrentModule = index === currentModuleIndex
                  const moduleQuiz = module.quiz || module.quiz_config
                  const hasModuleQuiz = moduleQuiz && moduleQuiz.questions && moduleQuiz.questions.length > 0
                  const moduleScore = moduleQuizScores[moduleId] || null
                  
                  // Support both old format (single file) and new format (multiple files)
                  const moduleFiles = module.files || (module.fileUrl ? [module] : [])
                  const viewedFilesInModule = viewedFiles[moduleId] || []
                  const filesProgress = moduleFiles.length > 0 
                    ? Math.round((viewedFilesInModule.length / moduleFiles.length) * 100)
                    : 0
                  const timeSpent = moduleTimeSpent[moduleId] || 0
                  
                  const getFileTypeIcon = (fileName: string) => {
                    const ext = fileName?.toLowerCase().split('.').pop() || ''
                    if (['pdf'].includes(ext)) return <FileText className="h-4 w-4" />
                    if (['ppt', 'pptx'].includes(ext)) return <FileText className="h-4 w-4" />
                    if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) return <Play className="h-4 w-4" />
                    return <FileText className="h-4 w-4" />
                  }
                  
                  const getFileTypeLabel = (fileName: string, fileType?: string) => {
                    const ext = fileName?.toLowerCase().split('.').pop() || ''
                    if (['pdf'].includes(ext)) return "PDF Handbook"
                    if (['ppt', 'pptx'].includes(ext)) return "PowerPoint Slides"
                    if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) return "Video"
                    if (fileType === 'video') return "Video"
                    if (fileType === 'slide') return "Slides"
                    return "Document"
                  }
                  
                  return (
                    <div
                      key={moduleId}
                      className={`p-4 border-2 rounded-lg ${
                        isModuleLocked
                          ? "bg-gray-100 border-gray-300 opacity-60"
                          : isModuleCompleted 
                            ? "bg-green-50 border-green-300" 
                            : isCurrentModule
                              ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
                              : filesProgress > 0 
                                ? "bg-blue-50 border-blue-200" 
                                : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              {isModuleLocked && (
                                <Badge variant="outline" className="bg-gray-200 text-gray-600 text-xs">
                                  🔒 Locked
                                </Badge>
                              )}
                              {isCurrentModule && !isModuleCompleted && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                  Current
                                </Badge>
                              )}
                              <h3 className="font-semibold text-gray-900">
                                {module.title || `Module ${index + 1}`}
                              </h3>
                            </div>
                            {isModuleCompleted && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                            {!isModuleCompleted && !isModuleLocked && filesProgress > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {filesProgress}% Complete
                              </Badge>
                            )}
                            {moduleScore !== null && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs">
                                Quiz: {moduleScore}%
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {timeSpent > 0 && (
                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTimeSpent(timeSpent)}
                              </span>
                            )}
                            {module.duration && (
                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Est: {module.duration} min
                              </span>
                            )}
                          </div>
                        </div>
                        {!isModuleCompleted && !isModuleLocked && filesProgress > 0 && (
                          <Progress value={filesProgress} className="h-2 mt-2" />
                        )}
                        {isModuleLocked && (
                          <p className="text-xs text-gray-500 mt-2">
                            Complete previous modules to unlock this module.
                          </p>
                        )}
                      </div>
                      
                      {/* List all files in this module */}
                      <div className="space-y-2">
                        {moduleFiles.length === 0 ? (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              No content available for this module.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          moduleFiles.map((file: any, fileIndex: number) => {
                            const fileId = file.id || `file-${fileIndex}`
                            const isFileViewed = viewedFilesInModule.includes(fileId)
                            const fileName = file.fileName || file.name || `Content ${fileIndex + 1}`
                            const fileType = file.type || file.fileType || ''
                            
                            return (
                              <div
                                key={fileId}
                                className={`p-3 border rounded-md flex items-center justify-between ${
                                  isFileViewed ? "bg-gray-50 border-gray-300" : "bg-white border-gray-200"
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  {getFileTypeIcon(fileName)}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {fileName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {getFileTypeLabel(fileName, fileType)}
                                    </p>
                                  </div>
                                  {isFileViewed && (
                                    <Badge variant="outline" className="text-xs bg-green-50 border-green-200">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Viewed
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant={isFileViewed ? "outline" : "default"}
                                  onClick={() => handleFileView(moduleId, fileId, file)}
                                  disabled={isUpdatingProgress || isModuleLocked}
                                  className="ml-3"
                                >
                                  {isModuleLocked ? (
                                    <>
                                      <AlertCircle className="h-4 w-4 mr-1" />
                                      Locked
                                    </>
                                  ) : isFileViewed ? (
                                    <>
                                      <Eye className="h-4 w-4 mr-1" />
                                      Review
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-4 w-4 mr-1" />
                                      View
                                    </>
                                  )}
                                </Button>
                              </div>
                            )
                          })
                        )}
                      </div>
                      
                      {/* Module completion message */}
                      {isModuleCompleted && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <p className="text-xs text-green-700 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            All content in this module has been completed.
                            {moduleScore !== null && ` Quiz Score: ${moduleScore}%`}
                            {timeSpent > 0 && ` | Time Spent: ${formatTimeSpent(timeSpent)}`}
                          </p>
                        </div>
                      )}
                      
                      {/* Module quiz button (if module has quiz and all files viewed but not completed) */}
                      {!isModuleCompleted && !isModuleLocked && filesProgress === 100 && hasModuleQuiz && !moduleScore && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <Button
                            onClick={() => handleStartModuleQuiz(moduleId)}
                            className="w-full"
                            variant="outline"
                          >
                            <HelpCircle className="h-4 w-4 mr-2" />
                            Take Module Quiz
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz Section - Module Quiz or Final Quiz */}
        {!isCompleted && showQuiz && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                {currentQuizModuleId ? `Module Quiz: ${training.modules?.find((m: any, idx: number) => (m.id || `module-${idx}`) === currentQuizModuleId)?.title || 'Module Quiz'}` : 'Final Training Quiz'}
              </CardTitle>
              <CardDescription>
                Please answer all questions. You need {
                  currentQuizModuleId 
                    ? (training.modules?.find((m: any, idx: number) => (m.id || `module-${idx}`) === currentQuizModuleId)?.quiz || training.modules?.find((m: any, idx: number) => (m.id || `module-${idx}`) === currentQuizModuleId)?.quiz_config)?.passingScore || 80
                    : (training.quiz || training.quiz_config)?.passingScore || 80
                }% to pass.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(() => {
                  // Get questions from the appropriate quiz (module quiz or final quiz)
                  let questions: any[] = []
                  if (currentQuizModuleId) {
                    const module = training.modules?.find((m: any, idx: number) => (m.id || `module-${idx}`) === currentQuizModuleId)
                    questions = (module?.quiz || module?.quiz_config)?.questions || []
                  } else {
                    questions = (training.quiz || training.quiz_config)?.questions || []
                  }
                  return questions
                })().map((question: any, index: number) => {
                  const questionId = question.id || `question-${index}`
                  const options = question.options || question.choices || []
                  
                  return (
                    <div key={questionId} className="p-4 border rounded-lg bg-white">
                      <Label className="text-base font-semibold mb-3 block">
                        {index + 1}. {question.question || question.text}
                      </Label>
                      <RadioGroup
                        value={quizAnswers[questionId] || ""}
                        onValueChange={(value) => {
                          setQuizAnswers((prev) => ({
                            ...prev,
                            [questionId]: value,
                          }))
                        }}
                        className="space-y-2"
                      >
                        {options.map((option: string, optIndex: number) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`${questionId}-${optIndex}`} />
                            <Label htmlFor={`${questionId}-${optIndex}`} className="cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )
                })}
                
                {quizScore !== null && (
                  <Alert className={quizScore >= (() => {
                    if (currentQuizModuleId) {
                      const module = training.modules?.find((m: any, idx: number) => (m.id || `module-${idx}`) === currentQuizModuleId)
                      return (module?.quiz || module?.quiz_config)?.passingScore || 80
                    } else {
                      return (training.quiz || training.quiz_config)?.passingScore || 80
                    }
                  })() ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Quiz Score: {quizScore}%</strong>
                      {quizScore >= (() => {
                        if (currentQuizModuleId) {
                          const module = training.modules?.find((m: any, idx: number) => (m.id || `module-${idx}`) === currentQuizModuleId)
                          return (module?.quiz || module?.quiz_config)?.passingScore || 80
                        } else {
                          return (training.quiz || training.quiz_config)?.passingScore || 80
                        }
                      })() 
                        ? " Congratulations! You passed the quiz." 
                        : " You did not pass. Please review the module and try again."}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowQuiz(false)
                      setCurrentQuizModuleId(null)
                      setQuizAnswers({})
                      setQuizScore(null)
                    }}
                    disabled={isSubmittingQuiz}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleQuizSubmit}
                    disabled={isSubmittingQuiz || Object.keys(quizAnswers).length < (() => {
                      if (currentQuizModuleId) {
                        const module = training.modules?.find((m: any, idx: number) => (m.id || `module-${idx}`) === currentQuizModuleId)
                        return (module?.quiz || module?.quiz_config)?.questions?.length || 0
                      } else {
                        return (training.quiz || training.quiz_config)?.questions?.length || 0
                      }
                    })()}
                  >
                    {isSubmittingQuiz ? (
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
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion Button */}
        {!isCompleted && !showQuiz && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Ready to Complete Training?</h3>
                  <p className="text-sm text-gray-600">
                    {allModulesCompleted
                      ? (training.quiz || training.quiz_config)?.questions?.length > 0
                        ? "All modules completed. Click below to take the quiz."
                        : "All modules have been completed. You can now mark this training as complete."
                      : `Please complete all ${totalModules} module${totalModules !== 1 ? "s" : ""} before completing this training.`}
                  </p>
                </div>
                <Button
                  onClick={handleStartFinalQuiz}
                  disabled={!allModulesCompleted || isCompleting}
                  size="lg"
                  className="ml-4"
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (training.quiz || training.quiz_config)?.questions?.length > 0 ? (
                    <>
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Start Final Quiz
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Training
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion Message */}
        {isCompleted && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Congratulations!</strong> You have successfully completed this training.
              {training.ceuHours && ` You earned ${training.ceuHours} CEU ${training.ceuHours === 1 ? "hour" : "hours"}.`}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

