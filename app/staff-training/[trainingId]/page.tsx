"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  AlertCircle,
  Loader2,
  Trophy,
  Star,
  Target,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { VideoPlayer } from "@/components/training/VideoPlayer"
import { LearningPath } from "@/components/training/LearningPath"
import { GamificationBadges } from "@/components/training/GamificationBadges"
import { InteractiveQuiz } from "@/components/training/InteractiveQuiz"
import { ModuleCard } from "@/components/training/ModuleCard"
import { CertificateModal } from "@/components/training/CertificateModal"
import { createCertificateData } from "@/lib/certificateGenerator"

export default function StaffTrainingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const trainingId = params.trainingId as string
  const staffId = searchParams?.get("staffId") || undefined
  const showCertificateParam = searchParams?.get("showCertificate") === "true"
  
  const { toast } = useToast()
  
  const [training, setTraining] = useState<any>(null)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [completedModules, setCompletedModules] = useState<string[]>([])
  const [viewedFiles, setViewedFiles] = useState<Record<string, string[]>>({})
  const [moduleQuizScores, setModuleQuizScores] = useState<Record<string, number>>({})
  const [moduleTimeSpent, setModuleTimeSpent] = useState<Record<string, number>>({})
  const [moduleStartTimes, setModuleStartTimes] = useState<Record<string, number>>({})
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [currentQuizModuleId, setCurrentQuizModuleId] = useState<string | null>(null)
  const [bookmarks, setBookmarks] = useState<Array<{ time: number; note: string }>>([])
  
  // Gamification state
  const [points, setPoints] = useState(0)
  const [badges, setBadges] = useState<string[]>([])
  const [streak, setStreak] = useState(1)
  
  // Certificate state
  const [showCertificate, setShowCertificate] = useState(false)
  const [certificateData, setCertificateData] = useState<any>(null)
  const [staffName, setStaffName] = useState("")

  useEffect(() => {
    if (trainingId && staffId) {
      fetchTrainingData()
    }
  }, [trainingId, staffId])

  // Auto-show certificate if coming from dashboard
  useEffect(() => {
    const completed = enrollment?.status === "completed" || (enrollment?.progress || 0) >= 100
    if (showCertificateParam && certificateData && completed) {
      setShowCertificate(true)
    }
  }, [showCertificateParam, certificateData, enrollment])

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
            
            // Find enrollment for this training
            const foundEnrollment = [
              ...(employee.inProgressTrainings || []),
              ...(employee.completedTrainings || []),
              ...(employee.assignedTrainings || []),
            ].find((t: any) => t.trainingId === trainingId || t.id === trainingId)
            
            if (foundEnrollment) {
              setEnrollment({
                ...foundEnrollment,
                progress: foundEnrollment.progress || 0,
                status: foundEnrollment.status || 'in_progress',
              })
              
              // Get staff name from employee data
              setStaffName(employee.full_name || employee.name || "Staff Member")
              
              // Restore progress
              const enrollmentCompletedModules = foundEnrollment.completedModules || []
              const parsedCompletedModules = Array.isArray(enrollmentCompletedModules) ? enrollmentCompletedModules : []
              setCompletedModules(parsedCompletedModules)
              
              const viewedFilesData = foundEnrollment.viewedFiles || {}
              const parsedViewedFiles = typeof viewedFilesData === 'string' ? JSON.parse(viewedFilesData) : viewedFilesData
              setViewedFiles(parsedViewedFiles)
              
              const quizScoresData = foundEnrollment.moduleQuizScores || {}
              const parsedQuizScores = typeof quizScoresData === 'string' ? JSON.parse(quizScoresData) : quizScoresData
              setModuleQuizScores(parsedQuizScores)
              
              const timeSpentData = foundEnrollment.moduleTimeSpent || {}
              const parsedTimeSpent = typeof timeSpentData === 'string' ? JSON.parse(timeSpentData) : timeSpentData
              setModuleTimeSpent(parsedTimeSpent)
              
              // Calculate points based on completed modules
              const calculatedPoints = parsedCompletedModules.length * 50
              setPoints(calculatedPoints)
              
              // Set streak (you can fetch from backend in production)
              setStreak(3)
              
              // Determine current module index
              if (trainingData.trainings[0]?.modules) {
                const trainingModules = trainingData.trainings[0].modules
                let currentIndex = 0
                for (let i = 0; i < trainingModules.length; i++) {
                  const moduleId = trainingModules[i].id || `module-${i}`
                  if (!parsedCompletedModules.includes(moduleId)) {
                    currentIndex = i
                    break
                  }
                  currentIndex = i + 1
                }
                setCurrentModuleIndex(Math.min(currentIndex, trainingModules.length - 1))
              }
              
              if (parsedCompletedModules.length > 0) {
                const totalMods = trainingData.trainings[0]?.modules?.length || 0
                toast({
                  title: "Welcome Back! 👋",
                  description: `Continuing from ${parsedCompletedModules.length} of ${totalMods} modules completed (${foundEnrollment.progress || 0}%)`,
                })
              }
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

  const startModuleTimer = (moduleId: string) => {
    if (!moduleStartTimes[moduleId]) {
      setModuleStartTimes(prev => ({
        ...prev,
        [moduleId]: Date.now()
      }))
    }
  }

  const stopModuleTimer = (moduleId: string) => {
    if (moduleStartTimes[moduleId]) {
      const startTime = moduleStartTimes[moduleId]
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
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

  const handleFileView = async (moduleId: string, fileId: string, file: any) => {
    try {
      startModuleTimer(moduleId)
      
      if (file.fileUrl) {
        if (file.fileUrl.startsWith("data:")) {
          const blob = await (await fetch(file.fileUrl)).blob()
          const blobUrl = URL.createObjectURL(blob)
          window.open(blobUrl, "_blank")
        } else {
          window.open(file.fileUrl, "_blank")
        }
      }
      
      const currentViewed = viewedFiles[moduleId] || []
      if (!currentViewed.includes(fileId)) {
        const newViewed = [...currentViewed, fileId]
        const updatedViewedFiles = {
          ...viewedFiles,
          [moduleId]: newViewed,
        }
        setViewedFiles(updatedViewedFiles)
        
        const module = training.modules?.find((m: any) => (m.id || `module-${training.modules.indexOf(m)}`) === moduleId)
        if (module) {
          const moduleFiles = module.files || [module]
          const allFileIds = moduleFiles.map((f: any, idx: number) => f.id || `file-${idx}`)
          const allFilesViewed = allFileIds.every((fId: string) => newViewed.includes(fId))
          
          if (allFilesViewed && !completedModules.includes(moduleId)) {
            const timeSpent = stopModuleTimer(moduleId)
            const updatedTimeSpent = {
              ...moduleTimeSpent,
              [moduleId]: (moduleTimeSpent[moduleId] || 0) + timeSpent
            }
            setModuleTimeSpent(updatedTimeSpent)
            
            const moduleQuiz = module.quiz || module.quiz_config
            if (moduleQuiz && moduleQuiz.questions && moduleQuiz.questions.length > 0) {
              setCurrentQuizModuleId(moduleId)
              setShowQuiz(true)
              toast({
                title: "🎉 Module Content Completed",
                description: "Take the quiz to complete this module!",
              })
            } else {
              await completeModule(moduleId, updatedTimeSpent, updatedViewedFiles)
            }
          } else {
            setIsUpdatingProgress(true)
            await fetch("/api/in-service/employee-progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                employeeId: staffId,
                trainingId: trainingId,
                action: "progress",
                data: { 
                  progress: enrollment?.progress || 0,
                  completedModules: completedModules,
                  viewedFiles: updatedViewedFiles,
                  moduleTimeSpent: moduleTimeSpent,
                },
              }),
            })
            
            toast({
              title: "📄 File Viewed",
              description: "Keep going! View all content to complete this module.",
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

  const completeModule = async (moduleId: string, updatedTimeSpent?: Record<string, number>, updatedViewedFiles?: Record<string, string[]>, updatedQuizScores?: Record<string, number>) => {
    try {
      const newCompleted = [...completedModules, moduleId]
      setCompletedModules(newCompleted)
      
      const totalModules = training.modules?.length || 1
      const newProgress = Math.round((newCompleted.length / totalModules) * 100)
      
      // Award points
      const newPoints = points + 50
      setPoints(newPoints)
      
      setEnrollment((prev: any) => ({
        ...prev,
        progress: newProgress,
        status: newProgress >= 100 ? "completed" : "in_progress",
      }))
      
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
            completedModules: newCompleted,
            viewedFiles: updatedViewedFiles || viewedFiles,
            moduleTimeSpent: updatedTimeSpent || moduleTimeSpent,
            moduleQuizScores: updatedQuizScores || moduleQuizScores,
          },
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update progress")
      }
      
      const moduleIndex = training.modules.findIndex((m: any, idx: number) => (m.id || `module-${idx}`) === moduleId)
      if (moduleIndex >= 0 && moduleIndex < training.modules.length - 1) {
        setCurrentModuleIndex(moduleIndex + 1)
      }
      
      toast({
        title: "🎉 Module Completed!",
        description: `+50 points! Progress: ${newProgress}%`,
      })
    } catch (error: any) {
      console.error("Error completing module:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to complete module",
        variant: "destructive",
      })
      setCompletedModules((prev) => prev.filter(id => id !== moduleId))
      const revertedProgress = Math.round(((completedModules.length) / (training.modules?.length || 1)) * 100)
      setEnrollment((prev: any) => ({
        ...prev,
        progress: revertedProgress,
      }))
    } finally {
      setIsUpdatingProgress(false)
    }
  }

  const handleStartModuleQuiz = (moduleId: string) => {
    setCurrentQuizModuleId(moduleId)
    setShowQuiz(true)
  }

  const handleQuizComplete = async (score: number, passed: boolean, moduleId: string | null) => {
    if (passed) {
      if (moduleId) {
        // Module quiz passed
        const updatedQuizScores = {
          ...moduleQuizScores,
          [moduleId]: score
        }
        setModuleQuizScores(updatedQuizScores)
        
        const timeSpent = stopModuleTimer(moduleId)
        const updatedTimeSpent = {
          ...moduleTimeSpent,
          [moduleId]: (moduleTimeSpent[moduleId] || 0) + timeSpent
        }
        
        // Award bonus points for perfect score
        if (score === 100) {
          setPoints(prev => prev + 20)
          toast({
            title: "🌟 Perfect Score!",
            description: "+20 bonus points!",
          })
        }
        
        await completeModule(moduleId, updatedTimeSpent, viewedFiles, updatedQuizScores)
        setShowQuiz(false)
        setCurrentQuizModuleId(null)
      } else {
        // Final quiz passed
        await handleCompleteTraining(score)
      }
    }
  }

  const handleStartFinalQuiz = () => {
    const totalModules = training.modules?.length || 0
    if (totalModules > 0 && completedModules.length < totalModules) {
      toast({
        title: "⚠️ Incomplete Training",
        description: `Please complete all ${totalModules} modules first.`,
        variant: "destructive",
      })
      return
    }
    
    const quizConfig = training.quiz || training.quiz_config
    if (!quizConfig || !quizConfig.questions || quizConfig.questions.length === 0) {
      handleCompleteTraining(100)
      return
    }
    
    setCurrentQuizModuleId(null)
    setShowQuiz(true)
  }

  const handleCompleteTraining = async (finalScore: number = 100) => {
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
        throw new Error("Failed to complete training")
      }
      
      // Final bonus points
      setPoints(prev => prev + 100)
      
      // Generate certificate
      const certificate = createCertificateData(
        staffId || "",
        staffName || "Staff Member",
        trainingId,
        training.title,
        training.ceuHours,
        finalScore
      )
      setCertificateData(certificate)
      
      toast({
        title: "🏆 Training Completed!",
        description: `Congratulations! +100 points! ${training.ceuHours ? `${training.ceuHours} CEU hours earned.` : ""}`,
      })
      
      // Show certificate after a short delay
      setTimeout(() => {
        setShowCertificate(true)
      }, 1500)
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

  const addBookmark = (time: number, note: string) => {
    setBookmarks(prev => [...prev, { time, note }])
    toast({
      title: "📌 Bookmark Added",
      description: "Your note has been saved",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading your training...</p>
        </div>
      </div>
    )
  }

  if (!training) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="max-w-md shadow-lg">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Training Not Found</h2>
            <p className="text-gray-600 mb-6">The training you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => router.push(`/staff-dashboard?staff_id=${staffId}#training`)} size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalModules = training.modules?.length || 0
  const progress = enrollment?.progress || 0
  const allModulesCompleted = totalModules > 0 && completedModules.length >= totalModules
  const isCompleted = enrollment?.status === "completed" || progress >= 100

  // Prepare modules for LearningPath component
  const learningPathModules = (training.modules || []).map((module: any, index: number) => {
    const moduleId = module.id || `module-${index}`
    return {
      id: moduleId,
      title: module.title || `Module ${index + 1}`,
      duration: module.duration,
      completed: completedModules.includes(moduleId),
      locked: index > currentModuleIndex,
      current: index === currentModuleIndex,
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/staff-dashboard?staff_id=${staffId}#training`)}
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-3">{training.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {training.category && (
                      <Badge className="bg-white/20 border-white/30 text-white">
                        {training.category}
                      </Badge>
                    )}
                    {training.ceuHours && (
                      <span className="flex items-center text-white/90">
                        <Award className="h-4 w-4 mr-1" />
                        {training.ceuHours} CEU {training.ceuHours === 1 ? "Hour" : "Hours"}
                      </span>
                    )}
                    {training.duration && (
                      <span className="flex items-center text-white/90">
                        <Clock className="h-4 w-4 mr-1" />
                        {training.duration} minutes
                      </span>
                    )}
                    {training.difficulty && (
                      <Badge className="bg-white/20 border-white/30 text-white capitalize">
                        {training.difficulty}
                      </Badge>
                    )}
                  </div>
                  {training.description && (
                    <p className="text-white/90 text-lg">{training.description}</p>
                  )}
                </div>
                {isCompleted && (
                  <div className="flex flex-col items-center">
                    <div className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center mb-2">
                      <Trophy className="h-10 w-10 text-white" />
                    </div>
                    <Badge className="bg-green-500 border-0">
                      Completed
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quiz Section */}
            {!isCompleted && showQuiz && (
              <InteractiveQuiz
                questions={(() => {
                  if (currentQuizModuleId) {
                    const module = training.modules?.find((m: any, idx: number) => 
                      (m.id || `module-${idx}`) === currentQuizModuleId
                    )
                    return (module?.quiz || module?.quiz_config)?.questions || []
                  } else {
                    return (training.quiz || training.quiz_config)?.questions || []
                  }
                })()}
                passingScore={(() => {
                  if (currentQuizModuleId) {
                    const module = training.modules?.find((m: any, idx: number) => 
                      (m.id || `module-${idx}`) === currentQuizModuleId
                    )
                    return (module?.quiz || module?.quiz_config)?.passingScore || 80
                  } else {
                    return (training.quiz || training.quiz_config)?.passingScore || 80
                  }
                })()}
                onComplete={(score, passed) => handleQuizComplete(score, passed, currentQuizModuleId)}
                onCancel={() => {
                  setShowQuiz(false)
                  setCurrentQuizModuleId(null)
                }}
                title={currentQuizModuleId 
                  ? `Module Quiz: ${training.modules?.find((m: any, idx: number) => (m.id || `module-${idx}`) === currentQuizModuleId)?.title || 'Module Quiz'}`
                  : 'Final Training Quiz'
                }
              />
            )}

            {/* Training Modules */}
            {!showQuiz && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <BookOpen className="h-6 w-6 mr-2 text-blue-600" />
                    Training Modules
                  </h2>
                  <Badge className="bg-blue-600 text-lg px-4 py-2">
                    {completedModules.length}/{totalModules} Complete
                  </Badge>
                </div>

                {totalModules === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This training doesn't have any modules yet. Please contact your administrator.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    {training.modules.map((module: any, index: number) => {
                      const moduleId = module.id || `module-${index}`
                      const isModuleCompleted = completedModules.includes(moduleId)
                      const isModuleLocked = index > currentModuleIndex
                      const isCurrentModule = index === currentModuleIndex
                      const moduleQuiz = module.quiz || module.quiz_config
                      const hasModuleQuiz = moduleQuiz && moduleQuiz.questions && moduleQuiz.questions.length > 0
                      const moduleScore = moduleQuizScores[moduleId] || null
                      const moduleFiles = module.files || (module.fileUrl ? [module] : [])
                      const viewedFilesInModule = viewedFiles[moduleId] || []
                      const timeSpent = moduleTimeSpent[moduleId] || 0

                      return (
                        <ModuleCard
                          key={moduleId}
                          moduleId={moduleId}
                          title={module.title || `Module ${index + 1}`}
                          description={module.description}
                          index={index}
                          completed={isModuleCompleted}
                          locked={isModuleLocked}
                          current={isCurrentModule}
                          duration={module.duration}
                          files={moduleFiles.map((file: any, fileIndex: number) => ({
                            id: file.id || `file-${fileIndex}`,
                            fileName: file.fileName || file.name || `Content ${fileIndex + 1}`,
                            fileUrl: file.fileUrl,
                            type: file.type || file.fileType,
                          }))}
                          viewedFiles={viewedFilesInModule}
                          hasQuiz={hasModuleQuiz}
                          quizScore={moduleScore}
                          timeSpent={timeSpent}
                          onFileView={(fileId, file) => handleFileView(moduleId, fileId, file)}
                          onStartQuiz={() => handleStartModuleQuiz(moduleId)}
                          isUpdating={isUpdatingProgress}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Completion Button */}
            {!isCompleted && !showQuiz && allModulesCompleted && (
              <Card className="bg-gradient-to-r from-green-500 to-emerald-600 border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <h3 className="text-xl font-bold mb-1">🎉 Ready to Complete!</h3>
                      <p>
                        {(training.quiz || training.quiz_config)?.questions?.length > 0
                          ? "Take the final quiz to earn your certificate"
                          : "Click to complete and earn your certificate"}
                      </p>
                    </div>
                    <Button
                      onClick={handleStartFinalQuiz}
                      disabled={isCompleting}
                      size="lg"
                      className="bg-white text-green-600 hover:bg-gray-100 ml-4"
                    >
                      {isCompleting ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Completing...
                        </>
                      ) : (training.quiz || training.quiz_config)?.questions?.length > 0 ? (
                        <>
                          <Star className="h-5 w-5 mr-2" />
                          Start Final Quiz
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
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
              <div className="space-y-4">
                <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg">
                  <Trophy className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-800 text-lg">
                    <strong>🏆 Congratulations!</strong> You have successfully completed this training.
                    {training.ceuHours && ` You earned ${training.ceuHours} CEU ${training.ceuHours === 1 ? "hour" : "hours"}.`}
                  </AlertDescription>
                </Alert>
                {certificateData && (
                  <Button
                    onClick={() => setShowCertificate(true)}
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Award className="h-5 w-5 mr-2" />
                    View Your Certificate
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Gamification Badges */}
            <GamificationBadges
              points={points}
              badges={badges}
              streak={streak}
              modulesCompleted={completedModules.length}
              totalModules={totalModules}
            />

            {/* Learning Path */}
            <LearningPath
              modules={learningPathModules}
              currentModuleIndex={currentModuleIndex}
            />

            {/* Quick Stats */}
            <Card className="bg-white border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{progress}%</p>
                    <p className="text-xs text-gray-600">Complete</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{completedModules.length}</p>
                    <p className="text-xs text-gray-600">Modules Done</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{training.ceuHours || 0}</p>
                    <p className="text-xs text-gray-600">CEU Hours</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{totalModules - completedModules.length}</p>
                    <p className="text-xs text-gray-600">Remaining</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {certificateData && (
        <CertificateModal
          open={showCertificate}
          onOpenChange={(open) => setShowCertificate(open)}
          staffName={certificateData.staffName}
          trainingTitle={certificateData.trainingTitle}
          completionDate={certificateData.completionDate}
          ceuHours={certificateData.ceuHours}
          score={certificateData.score}
          certificateId={certificateData.certificateId}
        />
      )}
    </div>
  )
}
