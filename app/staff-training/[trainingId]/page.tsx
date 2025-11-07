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
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { VideoPlayer } from "@/components/training/VideoPlayer"
import { EnhancedPDFViewer } from "@/components/training/EnhancedPDFViewer"
import { PowerPointViewer } from "@/components/training/PowerPointViewer"
import { LearningPath } from "@/components/training/LearningPath"
import { GamificationBadges } from "@/components/training/GamificationBadges"
import { InteractiveQuiz } from "@/components/training/InteractiveQuiz"
import { ModuleCard } from "@/components/training/ModuleCard"
import { CertificateModal } from "@/components/training/CertificateModal"
import { createCertificateData } from "@/lib/certificateGenerator"
import { generateQuiz } from "@/lib/quizGenerator"
import { calculateLearningStreak, extractCompletionDates } from "@/lib/learningStreak"

export default function StaffTrainingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const trainingId = params.trainingId as string
  const staffId = searchParams?.get("staffId") || undefined
  const showCertificateParam = searchParams?.get("showCertificate") === "true"
  // Determine source page from URL parameter or referrer
  const sourceParam = searchParams?.get("source") as "staff-dashboard" | "in-service" | "other" | null
  const sourcePage = sourceParam || 
                     (typeof window !== "undefined" && document.referrer.includes("staff-dashboard") ? "staff-dashboard" : 
                      typeof window !== "undefined" && document.referrer.includes("in-service") ? "in-service" : "other")
  
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
  const [generatedQuizzes, setGeneratedQuizzes] = useState<Record<string, any[]>>({})
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [bookmarks, setBookmarks] = useState<Array<{ time: number; note: string }>>([])
  
  // Gamification state
  const [points, setPoints] = useState(0)
  const [badges, setBadges] = useState<string[]>([])
  const [streak, setStreak] = useState(1)
  
  // Certificate state
  const [showCertificate, setShowCertificate] = useState(false)
  const [certificateData, setCertificateData] = useState<any>(null)
  const [staffName, setStaffName] = useState("")
  
  // Content viewer state
  const [showContentViewer, setShowContentViewer] = useState(false)
  const [currentViewerFile, setCurrentViewerFile] = useState<any>(null)
  const [currentViewerModuleId, setCurrentViewerModuleId] = useState<string | null>(null)
  const [currentViewerFileId, setCurrentViewerFileId] = useState<string | null>(null)
  const [isViewerMinimized, setIsViewerMinimized] = useState(false) // For when quiz is shown
  const [extractedVideoFrames, setExtractedVideoFrames] = useState<Array<{ data: string; timestamp: string }> | null>(null) // Store extracted video frames

  useEffect(() => {
    if (trainingId && staffId) {
      console.log("=== INITIAL LOAD ===")
      console.log("trainingId:", trainingId)
      console.log("staffId:", staffId)
      console.log("showCertificateParam:", showCertificateParam)
      fetchTrainingData()
    }
  }, [trainingId, staffId])

  // Auto-show certificate if coming from dashboard - SIMPLIFIED AND MORE AGGRESSIVE
  useEffect(() => {
    console.log("=== CERTIFICATE AUTO-OPEN CHECK ===")
    console.log("showCertificateParam:", showCertificateParam)
    console.log("certificateData:", certificateData ? "EXISTS" : "NULL")
    console.log("enrollment?.status:", enrollment?.status)
    console.log("enrollment?.progress:", enrollment?.progress)
    
    const completed = enrollment?.status === "completed" || (enrollment?.progress || 0) >= 100
    
    if (showCertificateParam && certificateData) {
      console.log("✅ OPENING CERTIFICATE NOW!")
      setShowCertificate(true)
    } else if (showCertificateParam && !certificateData) {
      console.log("⚠️ showCertificate=true BUT no certificateData yet, waiting...")
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
      
      console.log("📡 Fetching enrollment status...")
      console.log("Enrollment API URL:", `/api/in-service/employee-progress?employeeId=${encodeURIComponent(staffId!)}`)
      
      if (enrollmentResponse.ok) {
        console.log("✅ Enrollment API responded OK")
        const enrollmentContentType = enrollmentResponse.headers.get("content-type")
        if (enrollmentContentType && enrollmentContentType.includes("application/json")) {
          const enrollmentData = await enrollmentResponse.json()
          console.log("📦 Enrollment data received:", enrollmentData)
          
          if (enrollmentData.success && enrollmentData.employees && enrollmentData.employees.length > 0) {
            const employee = enrollmentData.employees[0]
            console.log("👤 Employee found:", employee.full_name || employee.name)
            console.log("📚 Completed trainings:", employee.completedTrainings?.length || 0)
            console.log("📚 In progress trainings:", employee.inProgressTrainings?.length || 0)
            console.log("📚 Assigned trainings:", employee.assignedTrainings?.length || 0)
            
            // Find enrollment for this training
            const foundEnrollment = [
              ...(employee.inProgressTrainings || []),
              ...(employee.completedTrainings || []),
              ...(employee.assignedTrainings || []),
            ].find((t: any) => t.trainingId === trainingId || t.id === trainingId)
            
            console.log("🔍 Looking for training ID:", trainingId)
            console.log("🔍 Found enrollment:", foundEnrollment)
            
            if (foundEnrollment) {
              console.log("✅ FOUND ENROLLMENT!")
              console.log("- Status:", foundEnrollment.status)
              console.log("- Progress:", foundEnrollment.progress)
              console.log("- Training ID:", foundEnrollment.trainingId || foundEnrollment.id)
              
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
              
              // Calculate badges based on achievements
              const calculatedBadges: string[] = []
              const totalModules = trainingData.trainings[0]?.modules?.length || 0
              
              // First Steps - Complete first module
              if (parsedCompletedModules.length >= 1) {
                calculatedBadges.push("first_step")
              }
              
              // Halfway Hero - Complete 50% of modules
              if (totalModules > 0 && parsedCompletedModules.length >= Math.ceil(totalModules / 2)) {
                calculatedBadges.push("halfway")
              }
              
              // Speed Learner - Complete 3 modules in one day (check moduleTimeSpent for same-day completions)
              const today = new Date().toDateString()
              const todayCompletions = Object.keys(parsedTimeSpent).filter(moduleId => {
                const completionTime = parsedTimeSpent[moduleId]
                if (completionTime) {
                  const completionDate = new Date(completionTime)
                  return completionDate.toDateString() === today
                }
                return false
              })
              if (todayCompletions.length >= 3) {
                calculatedBadges.push("speed_learner")
              }
              
              // Perfectionist - Score 100% on all quizzes
              const allScores = Object.values(parsedQuizScores)
              if (allScores.length > 0 && allScores.every(score => score === 100)) {
                calculatedBadges.push("perfectionist")
              }
              
              // Champion - Complete all modules (handled by component based on modulesCompleted)
              
              setBadges(calculatedBadges)
              console.log("🏆 Badges calculated:", calculatedBadges)
              
              // Calculate learning streak from completion dates
              try {
                // Extract completion dates from enrollment and employee data
                const completionDates = extractCompletionDates(foundEnrollment, employee.completedTrainings || [])
                
                // Also fetch additional completion records if available
                if (staffId) {
                  try {
                    const completionsResponse = await fetch(`/api/staff/${staffId}/completions`)
                    if (completionsResponse.ok) {
                      const completionsData = await completionsResponse.json()
                      if (completionsData.completions) {
                        completionsData.completions.forEach((c: any) => {
                          if (c.completion_date || c.completionDate) {
                            completionDates.push({
                              date: c.completion_date || c.completionDate,
                              trainingId: c.training_id || c.trainingId,
                            })
                          }
                        })
                      }
                    }
                  } catch (e) {
                    console.log("Could not fetch additional completions:", e)
                  }
                }
                
                const calculatedStreak = calculateLearningStreak(completionDates)
                setStreak(calculatedStreak)
                console.log("📊 Learning streak calculated:", calculatedStreak, "days")
              } catch (streakError) {
                console.error("Error calculating streak:", streakError)
                setStreak(1) // Default to 1 if calculation fails
              }
              
              // Generate certificate data for already completed trainings
              // Check if completed by: status='completed' OR has completionDate OR came from completedTrainings array
              const isCompleted = foundEnrollment.status === 'completed' || 
                                  foundEnrollment.completionDate || 
                                  foundEnrollment.completed === true ||
                                  employee.completedTrainings?.some((t: any) => 
                                    (t.trainingId === trainingId || t.id === trainingId)
                                  )
              
              console.log("🔍 Checking if training is completed:")
              console.log("- status === 'completed':", foundEnrollment.status === 'completed')
              console.log("- has completionDate:", !!foundEnrollment.completionDate)
              console.log("- completionDate value:", foundEnrollment.completionDate)
              console.log("- completed flag:", foundEnrollment.completed)
              console.log("- is in completedTrainings array:", employee.completedTrainings?.some((t: any) => 
                (t.trainingId === trainingId || t.id === trainingId)
              ))
              console.log("✅ IS COMPLETED?", isCompleted)
              
              if (isCompleted && trainingData.trainings[0]) {
                console.log("🎓 GENERATING CERTIFICATE - Training is completed!")
                console.log("Employee name:", employee.full_name || employee.name)
                console.log("Training title:", trainingData.trainings[0].title)
                
                const completedTraining = trainingData.trainings[0]
                const certificateScore = foundEnrollment.score || foundEnrollment.quiz_score || 100
                const certificate = createCertificateData(
                  staffId!,
                  employee.full_name || employee.name || "Staff Member",
                  trainingId,
                  completedTraining.title,
                  completedTraining.ceuHours,
                  certificateScore
                )
                console.log("📜 Certificate created:", certificate)
                setCertificateData(certificate)
                
                // DIRECT OPEN if coming from dashboard
                console.log("Checking showCertificateParam:", showCertificateParam)
                if (showCertificateParam) {
                  console.log("🚀 FORCE OPENING CERTIFICATE IMMEDIATELY!")
                  // Open directly, no timeout
                  setShowCertificate(true)
                }
              } else {
                console.log("⚠️ Cannot generate certificate:")
                console.log("- isCompleted:", isCompleted)
                console.log("- Has training data:", !!trainingData.trainings[0])
              }
              
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
            } else {
              console.log("❌ NO ENROLLMENT FOUND for this training!")
              console.log("This could mean:")
              console.log("1. Training not assigned to this staff")
              console.log("2. Wrong training ID")
              console.log("3. Wrong staff ID")
            }
          } else {
            console.log("❌ API success but no employee data:")
            console.log("- success:", enrollmentData.success)
            console.log("- employees:", enrollmentData.employees)
          }
        } else {
          console.log("❌ Wrong content type:", enrollmentContentType)
        }
      } else {
        console.log("❌ Enrollment API failed:", enrollmentResponse.status, enrollmentResponse.statusText)
      }
    } catch (error: any) {
      console.error("❌ ERROR fetching training data:", error)
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
      
      // Open the appropriate viewer based on file type
      setCurrentViewerFile(file)
      setCurrentViewerModuleId(moduleId)
      setCurrentViewerFileId(fileId)
      setShowContentViewer(true)
      
      toast({
        title: "📖 Content Opened",
        description: "Complete the content requirements to mark as viewed.",
      })
    } catch (error: any) {
      console.error("Error opening file:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to open file",
        variant: "destructive",
      })
    }
  }
  
  const handleContentComplete = async () => {
    if (!currentViewerModuleId || !currentViewerFileId) return
    
    try {
      const moduleId = currentViewerModuleId
      const fileId = currentViewerFileId
      
      // Mark file as viewed
      const currentViewed = viewedFiles[moduleId] || []
      if (!currentViewed.includes(fileId)) {
        const newViewed = [...currentViewed, fileId]
        const updatedViewedFiles = {
          ...viewedFiles,
          [moduleId]: newViewed,
        }
        setViewedFiles(updatedViewedFiles)
        
        const module = training.modules?.find((m: any, idx: number) => (m.id || `module-${idx}`) === moduleId)
        if (module) {
          // Get all files from module - check multiple possible structures
          const moduleFiles = module.files || (module.fileUrl ? [module] : []) || module.content_files || []
          const allFileIds = moduleFiles.map((f: any, idx: number) => f.id || `file-${idx}`)
          const allFilesViewed = allFileIds.every((fId: string) => newViewed.includes(fId))
          
          if (allFilesViewed && !completedModules.includes(moduleId)) {
            const timeSpent = stopModuleTimer(moduleId)
            const updatedTimeSpent = {
              ...moduleTimeSpent,
              [moduleId]: (moduleTimeSpent[moduleId] || 0) + timeSpent
            }
            setModuleTimeSpent(updatedTimeSpent)
            
            // DON'T close viewer - keep it visible so user can review quiz
            // Only close viewer if there's no quiz to show
            const moduleQuiz = module.quiz || module.quiz_config
            
            // Check if module has quiz or if we've already generated one
            const hasExistingQuiz = moduleQuiz && moduleQuiz.questions && moduleQuiz.questions.length > 0
            const hasGeneratedQuiz = generatedQuizzes[moduleId] && generatedQuizzes[moduleId].length > 0
            
            if (hasExistingQuiz || hasGeneratedQuiz) {
              // Use existing or generated quiz
              // Keep viewer open so user can review the quiz
              setCurrentQuizModuleId(moduleId)
              setShowQuiz(true)
              setIsViewerMinimized(false) // Show viewer in panel mode (not fullscreen) when quiz is shown
              toast({
                title: "🎉 Module Content Completed",
                description: "Take the quiz to complete this module!",
              })
            } else {
              // Auto-generate quiz from module content
              console.log("📝 No quiz found, auto-generating from module content...")
              setIsGeneratingQuiz(true)
              
              try {
                // CRITICAL: Questions must be generated ONLY from extracted file content
                // DO NOT use module title, description, or training metadata
                // Only extract content from the actual files (PDF, PowerPoint, video)
                
                // Get file information for content extraction
                // Check multiple possible locations for files
                let fileUrl: string | undefined
                let fileType: string | undefined
                let fileName: string | undefined
                
                console.log("🔍 Searching for files in module:", {
                  hasModuleFiles: !!(module.files && module.files.length > 0),
                  moduleFilesLength: module.files?.length || 0,
                  hasCurrentViewerFile: !!currentViewerFile,
                  hasModuleFileUrl: !!module.fileUrl,
                  moduleKeys: Object.keys(module || {}),
                })
                
                // Priority 1: Check current viewer file (the file being viewed)
                if (currentViewerFile) {
                  console.log("🔍 Checking currentViewerFile:", {
                    hasFileUrl: !!currentViewerFile.fileUrl,
                    hasUrl: !!currentViewerFile.url,
                    keys: Object.keys(currentViewerFile || {}),
                  })
                  fileUrl = currentViewerFile.fileUrl || currentViewerFile.url
                  fileType = currentViewerFile.type || currentViewerFile.fileType
                  fileName = currentViewerFile.fileName || currentViewerFile.name
                  
                  if (fileUrl) {
                    console.log("✅ Found file in currentViewerFile:", { fileUrl, fileType, fileName })
                  }
                }
                
                // Priority 2: Check module.files array (use the same logic as above)
                if (!fileUrl) {
                  // Get moduleFiles the same way as above
                  const moduleFiles = module.files || (module.fileUrl ? [module] : []) || module.content_files || []
                  
                  if (moduleFiles && Array.isArray(moduleFiles) && moduleFiles.length > 0) {
                    console.log("🔍 Checking moduleFiles array:", {
                      filesCount: moduleFiles.length,
                      firstFileKeys: Object.keys(moduleFiles[0] || {}),
                    })
                    
                    // Try all files in the array
                    for (let i = 0; i < moduleFiles.length; i++) {
                      const file = moduleFiles[i]
                      const testUrl = file.fileUrl || file.url
                      if (testUrl) {
                        fileUrl = testUrl
                        fileType = file.type || file.fileType
                        fileName = file.fileName || file.name
                        console.log(`✅ Found file in moduleFiles[${i}]:`, { fileUrl, fileType, fileName })
                        break
                      }
                    }
                  }
                }
                
                // Priority 3: Check if module itself has fileUrl (some modules might be files)
                if (!fileUrl && module.fileUrl) {
                  console.log("🔍 Checking module.fileUrl directly")
                  fileUrl = module.fileUrl
                  fileType = module.type || module.fileType
                  fileName = module.fileName || module.name
                  console.log("✅ Found file in module.fileUrl:", { fileUrl, fileType, fileName })
                }
                
                // Priority 4: Check module.content_files or other possible file locations
                if (!fileUrl && module.content_files && Array.isArray(module.content_files) && module.content_files.length > 0) {
                  console.log("🔍 Checking module.content_files")
                  const firstContentFile = module.content_files[0]
                  fileUrl = firstContentFile.fileUrl || firstContentFile.url
                  fileType = firstContentFile.type || firstContentFile.fileType
                  fileName = firstContentFile.fileName || firstContentFile.name
                  if (fileUrl) {
                    console.log("✅ Found file in module.content_files:", { fileUrl, fileType, fileName })
                  }
                }
                
                // Final check - if still no file found
                if (!fileUrl) {
                  console.error("❌ No file found in module. Debug info:", {
                    moduleId: module.id,
                    moduleTitle: module.title,
                    hasFiles: !!(module.files && module.files.length > 0),
                    filesCount: module.files?.length || 0,
                    hasCurrentViewerFile: !!currentViewerFile,
                    hasModuleFileUrl: !!module.fileUrl,
                    moduleStructure: JSON.stringify(module).substring(0, 500),
                  })
                  throw new Error("No file found in module. Quiz questions can only be generated from extracted file content (PDF, PowerPoint, or video). Please ensure the module has at least one file attached.")
                }
                
                // Log content for debugging
                console.log("📝 Quiz generation - extracting from file ONLY (NO database metadata):", {
                  fileUrl: fileUrl ? "Present" : "Missing",
                  fileType: fileType || "unknown",
                  fileName: fileName || "unknown",
                  note: "NOT using module title, description, or training metadata"
                })
                
                // For videos, extract frames client-side before generating quiz
                let framesToUse: Array<{ data: string; timestamp: string }> | undefined = undefined
                
                if (fileType === "video" && fileUrl) {
                  try {
                    console.log("📸 Extracting frames from video for OCR...")
                toast({
                      title: "📸 Extracting Video Frames...",
                      description: "Extracting frames from video for content analysis",
                    })
                    
                    // Create a temporary video element to extract frames
                    const videoElement = document.createElement("video")
                    videoElement.src = fileUrl
                    videoElement.crossOrigin = "anonymous"
                    videoElement.preload = "metadata"
                    
                    // Wait for video to load
                    await new Promise<void>((resolve, reject) => {
                      videoElement.onloadedmetadata = () => {
                        resolve()
                      }
                      videoElement.onerror = () => {
                        reject(new Error("Failed to load video"))
                      }
                      setTimeout(() => reject(new Error("Video load timeout")), 30000)
                    })
                    
                    // Extract frames
                    const { extractVideoFrames } = await import("@/lib/videoFrameExtractor")
                    const extractedFrames = await extractVideoFrames(videoElement, 10)
                    framesToUse = extractedFrames.map(f => ({ data: f.data, timestamp: f.timestampFormatted }))
                    
                    console.log(`✅ Extracted ${framesToUse.length} frames from video`)
                    
                    // Clean up
                    videoElement.src = ""
                    videoElement.load()
                  } catch (frameError: any) {
                    console.warn("⚠️ Frame extraction failed, will try server-side extraction:", frameError.message)
                    // Continue without frames - server will try to extract
                  }
                } else {
                  // Use frames from state if available (for non-video or if already extracted)
                  framesToUse = extractedVideoFrames || undefined
                }
                
                toast({
                  title: "🤖 Extracting File Content...",
                  description: `Extracting content from ${fileType || "file"} and generating quiz questions from extracted data`,
                })
                
                // Generate quiz using AI with automatic content extraction
                // Pass empty strings for module metadata - only fileUrl is used for extraction
                // For large videos, use extracted frames if available
                const generatedQuestions = await generateQuiz({
                  moduleTitle: "", // Not used - questions from extracted file content only
                  moduleDescription: "", // Not used - questions from extracted file content only
                  moduleContent: "", // Not used - questions from extracted file content only
                  fileContent: "", // Not used - will extract from fileUrl
                  fileUrl, // CRITICAL: This is used to extract actual file content
                  fileType, // Pass file type (pdf, video, powerpoint)
                  fileName, // Pass file name
                  numberOfQuestions: 5, // Default 5 questions
                  frames: framesToUse, // Pass extracted frames for large videos
                })
                
                // Clear extracted frames after use
                setExtractedVideoFrames(null)
                
                console.log("✅ Quiz generated:", generatedQuestions.length, "questions")
                
                // Log generated questions as JSON
                console.log("📋 GENERATED QUIZ QUESTIONS (JSON):", JSON.stringify({
                  moduleId: moduleId,
                  moduleTitle: module.title,
                  fileName: fileName,
                  fileType: fileType,
                  numberOfQuestions: generatedQuestions.length,
                  questions: generatedQuestions,
                  generatedAt: new Date().toISOString(),
                }, null, 2))
                
                // Convert generated quiz format to match InteractiveQuiz expectations
                // Generated quiz has: correctAnswer as number (0-3)
                // InteractiveQuiz expects: correctAnswer as string (option text)
                const convertedQuestions = generatedQuestions.map((q: any) => {
                  // If correctAnswer is a number, convert to option text
                  if (typeof q.correctAnswer === 'number' && q.options && q.options[q.correctAnswer]) {
                    return {
                      ...q,
                      correctAnswer: q.options[q.correctAnswer], // Convert index to option text
                    }
                  }
                  // If already a string, use as-is
                  return q
                })
                
                console.log("📝 Converted quiz questions:", convertedQuestions)
                
                // Log converted questions as JSON
                console.log("📋 CONVERTED QUIZ QUESTIONS (JSON):", JSON.stringify({
                  moduleId: moduleId,
                  convertedQuestions: convertedQuestions,
                  convertedAt: new Date().toISOString(),
                }, null, 2))
                
                // Store generated quiz
                setGeneratedQuizzes(prev => ({
                  ...prev,
                  [moduleId]: convertedQuestions
                }))
                
                // Show quiz immediately - keep viewer open so user can review
                setCurrentQuizModuleId(moduleId)
                setShowQuiz(true)
                setIsViewerMinimized(false) // Show viewer in panel mode (not fullscreen) when quiz is shown
                // DON'T close viewer - keep module visible for review
                
                toast({
                  title: "✅ Quiz Generated!",
                  description: `${generatedQuestions.length} questions ready. Take the quiz to complete this module!`,
                })
              } catch (error: any) {
                console.error("❌ Error generating quiz:", error)
                const errorMessage = error.message || "Failed to generate quiz from module content"
                
                // Check if it's a video extraction error
                const isVideoError = errorMessage.includes("video") || errorMessage.includes("25MB") || errorMessage.includes("audio track") || errorMessage.includes("Unable to extract content from video")
                
                // Show detailed error message with helpful guidance
                // For video errors, make it clear the module can still be completed
                toast({
                  title: isVideoError ? "⚠️ Quiz Not Generated (Video Too Large)" : "❌ Quiz Generation Failed",
                  description: isVideoError
                    ? `Video is too large (>25MB) for automatic quiz generation. The module will be marked as complete. You can add quiz questions manually later.\n\n💡 To enable auto-quiz: Compress video to <25MB or split into smaller modules.`
                    : errorMessage.includes("OpenAI") 
                    ? "OpenAI API error. Please check API configuration and ensure module has content."
                    : errorMessage.includes("content") || errorMessage.includes("too short")
                    ? "Module content is insufficient. Please ensure the module has description, content, or files for AI to analyze."
                    : errorMessage,
                  variant: isVideoError ? "default" : "destructive", // Use default (info) for video errors, not destructive
                  duration: 12000, // Show longer for important errors
                })
                
                // Still allow module completion without quiz if generation fails
                console.warn("⚠️ Allowing module completion without quiz due to generation error")
                console.log("✅ Module will be marked as complete. Quiz can be added manually later.")
                
                // Complete module without quiz if generation fails
                await completeModule(moduleId, updatedTimeSpent, updatedViewedFiles)
                
                // Show success message that module is complete
                toast({
                  title: "✅ Module Completed",
                  description: "Module marked as complete. Quiz questions can be added manually if needed.",
                  duration: 5000,
                })
              } finally {
                setIsGeneratingQuiz(false)
              }
            }
          } else {
            // Save progress
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
            
            // Close viewer
            setShowContentViewer(false)
            setCurrentViewerFile(null)
            setCurrentViewerModuleId(null)
            setCurrentViewerFileId(null)
            
            toast({
              title: "✅ Content Completed",
              description: "Keep going! View all content to complete this module.",
            })
          }
        }
      }
    } catch (error: any) {
      console.error("Error completing content:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to mark content as complete",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingProgress(false)
    }
  }
  
  const handleCloseViewer = () => {
    setShowContentViewer(false)
    setCurrentViewerFile(null)
    setCurrentViewerModuleId(null)
    setCurrentViewerFileId(null)
  }

  const completeModule = async (moduleId: string, updatedTimeSpent?: Record<string, number>, updatedViewedFiles?: Record<string, string[]>, updatedQuizScores?: Record<string, number>) => {
    try {
      // Prevent duplicate completion
      if (completedModules.includes(moduleId)) {
        console.log(`[MODULE COMPLETION] Module ${moduleId} already completed, skipping...`)
        return
      }
      
      const newCompleted = [...completedModules, moduleId]
      setCompletedModules(newCompleted)
      
      const totalModules = training.modules?.length || 1
      
      // Update badges when module is completed
      const updatedBadges = [...badges]
      
      // First Steps - Complete first module
      if (newCompleted.length >= 1 && !updatedBadges.includes("first_step")) {
        updatedBadges.push("first_step")
      }
      
      // Halfway Hero - Complete 50% of modules
      if (totalModules > 0 && newCompleted.length >= Math.ceil(totalModules / 2) && !updatedBadges.includes("halfway")) {
        updatedBadges.push("halfway")
      }
      
      // Champion - Complete all modules
      if (totalModules > 0 && newCompleted.length >= totalModules && !updatedBadges.includes("champion")) {
        updatedBadges.push("champion")
      }
      
      setBadges(updatedBadges)
      
      const newProgress = Math.round((newCompleted.length / totalModules) * 100)
      
      console.log(`[MODULE COMPLETION] Progress Update:`, {
        moduleId,
        completedModules: newCompleted,
        totalModules,
        completedCount: newCompleted.length,
        progress: newProgress,
        calculation: `${newCompleted.length} / ${totalModules} * 100 = ${newProgress}%`
      })
      
      // Award points - 50 points per completed module
      const newPoints = newCompleted.length * 50
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
          
          // Check for Perfectionist badge - all quizzes must be 100%
          const allScores = Object.values({ ...updatedQuizScores })
          if (allScores.length > 0 && allScores.every(s => s === 100)) {
            setBadges(prev => {
              if (!prev.includes("perfectionist")) {
                return [...prev, "perfectionist"]
              }
              return prev
            })
          }
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

  // If coming just to view certificate, show minimal loading
  if (loading && showCertificateParam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Award className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-900 text-xl font-semibold">Loading your certificate...</p>
          <p className="text-gray-600 text-sm mt-2">Please wait a moment</p>
        </div>
        {/* Certificate Modal will show on top when ready */}
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
            staffId={staffId}
            sourcePage={sourcePage}
          />
        )}
      </div>
    )
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

  // If viewing certificate only, show minimal UI with just the modal
  if (showCertificateParam && certificateData && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Certificate Modal */}
        <CertificateModal
          open={showCertificate}
          onOpenChange={(open) => setShowCertificate(open)}
          staffName={certificateData.staffName}
          trainingTitle={certificateData.trainingTitle}
          completionDate={certificateData.completionDate}
          ceuHours={certificateData.ceuHours}
          score={certificateData.score}
          certificateId={certificateData.certificateId}
          staffId={staffId}
          sourcePage={sourcePage}
        />
      </div>
    )
  }

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
          <div className={`lg:col-span-2 space-y-6 ${showQuiz && showContentViewer ? 'pt-[50vh]' : ''}`}>
            {/* Quiz Generation Loading */}
            {isGeneratingQuiz && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">🤖 Generating Quiz Questions...</h3>
                  <p className="text-gray-600">
                    Extracting content from file and creating questions. This may take a few moments...
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Quiz Section */}
            {!isCompleted && showQuiz && !isGeneratingQuiz && (
              <InteractiveQuiz
                questions={(() => {
                  if (currentQuizModuleId) {
                    // Check for generated quiz first
                    if (generatedQuizzes[currentQuizModuleId] && generatedQuizzes[currentQuizModuleId].length > 0) {
                      console.log("📝 Using auto-generated quiz for module:", currentQuizModuleId)
                      return generatedQuizzes[currentQuizModuleId]
                    }
                    
                    // Fall back to module's configured quiz
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
                // REMOVED onCancel - Quiz is required, cannot be cancelled
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
          staffId={staffId}
          sourcePage={sourcePage}
        />
      )}
      
      {/* Content Viewers */}
      {showContentViewer && currentViewerFile && (
        <>
          {/* Video Viewer - Modal Style */}
          {(currentViewerFile.type === "video" || currentViewerFile.fileType === "video") && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <Card className={`${showQuiz ? 'w-full max-w-4xl' : 'w-full max-w-5xl'} bg-black border-gray-800 shadow-2xl`}>
                <CardHeader className="border-b border-gray-800 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg font-semibold">
                      {currentViewerFile.fileName || currentViewerFile.name || "Training Video"}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCloseViewer}
                      className="text-white hover:bg-gray-800 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                <VideoPlayer
                  videoUrl={currentViewerFile.fileUrl}
                  title={currentViewerFile.fileName || currentViewerFile.name || "Training Video"}
                  onComplete={handleContentComplete}
                  bookmarks={bookmarks}
                  onAddBookmark={(time, note) => {
                    setBookmarks(prev => [...prev, { time, note }])
                  }}
                    extractFramesOnComplete={true} // Extract frames for large videos
                    onFramesExtracted={(frames) => {
                      console.log(`📸 Received ${frames.length} extracted frames`)
                      setExtractedVideoFrames(frames)
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* PDF Viewer - Auto-detects page count */}
          {(currentViewerFile.type === "pdf" || currentViewerFile.fileType === "pdf" || 
            currentViewerFile.fileName?.toLowerCase().endsWith('.pdf') ||
            currentViewerFile.name?.toLowerCase().endsWith('.pdf')) && (
            <EnhancedPDFViewer
              fileUrl={currentViewerFile.fileUrl}
              fileName={currentViewerFile.fileName || currentViewerFile.name || "Training Document"}
              totalPages={currentViewerFile.totalPages} // Optional - will auto-detect if not provided
              onComplete={handleContentComplete}
              onClose={handleCloseViewer}
              isPanelMode={showQuiz} // Pass prop to indicate panel mode
            />
          )}
          
          {/* PowerPoint Viewer */}
          {(currentViewerFile.type === "powerpoint" || currentViewerFile.fileType === "powerpoint" ||
            currentViewerFile.type === "ppt" || currentViewerFile.fileType === "ppt" ||
            currentViewerFile.type === "pptx" || currentViewerFile.fileType === "pptx" ||
            currentViewerFile.fileName?.toLowerCase().match(/\.(ppt|pptx)$/) ||
            currentViewerFile.name?.toLowerCase().match(/\.(ppt|pptx)$/)) && (
            <PowerPointViewer
              fileUrl={currentViewerFile.fileUrl}
              fileName={currentViewerFile.fileName || currentViewerFile.name || "Training Presentation"}
              totalSlides={currentViewerFile.totalSlides || 10}
              onComplete={handleContentComplete}
              onClose={handleCloseViewer}
              isPanelMode={showQuiz} // Pass prop to indicate panel mode
            />
          )}
          
          {/* Fallback for other file types */}
          {!(currentViewerFile.type === "video" || currentViewerFile.fileType === "video") &&
           !(currentViewerFile.type === "pdf" || currentViewerFile.fileType === "pdf" || 
             currentViewerFile.fileName?.toLowerCase().endsWith('.pdf') ||
             currentViewerFile.name?.toLowerCase().endsWith('.pdf')) &&
           !(currentViewerFile.type === "powerpoint" || currentViewerFile.fileType === "powerpoint" ||
             currentViewerFile.type === "ppt" || currentViewerFile.fileType === "ppt" ||
             currentViewerFile.type === "pptx" || currentViewerFile.fileType === "pptx" ||
             currentViewerFile.fileName?.toLowerCase().match(/\.(ppt|pptx)$/) ||
             currentViewerFile.name?.toLowerCase().match(/\.(ppt|pptx)$/)) && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8">
              <Card className="w-full max-w-3xl">
                <CardHeader>
                  <CardTitle className="text-2xl">View Content</CardTitle>
                  <CardDescription className="text-base">
                    {currentViewerFile.fileName || currentViewerFile.name || "Training Content"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This file type will open in a new tab. Please review the content completely before returning.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (currentViewerFile.fileUrl) {
                          window.open(currentViewerFile.fileUrl, "_blank")
                        }
                      }}
                      className="flex-1"
                      size="lg"
                    >
                      Open in New Tab
                    </Button>
                    <Button
                      onClick={handleContentComplete}
                      variant="outline"
                      className="flex-1"
                      size="lg"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Complete
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleCloseViewer}
                    className="w-full"
                    size="lg"
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
