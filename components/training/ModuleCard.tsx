"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  Lock,
  Play,
  FileText,
  Video,
  Award,
  Clock,
  Eye,
  HelpCircle,
} from "lucide-react"

interface ModuleFile {
  id: string
  fileName: string
  fileUrl: string
  type?: string
  viewed?: boolean
}

interface ModuleCardProps {
  moduleId: string
  title: string
  description?: string
  index: number
  completed: boolean
  locked: boolean
  current: boolean
  duration?: number
  files: ModuleFile[]
  viewedFiles: string[]
  hasQuiz: boolean
  quizScore?: number | null
  timeSpent?: number
  onFileView: (fileId: string, file: ModuleFile) => void
  onStartQuiz?: () => void
  isUpdating?: boolean
}

export function ModuleCard({
  moduleId,
  title,
  description,
  index,
  completed,
  locked,
  current,
  duration,
  files,
  viewedFiles,
  hasQuiz,
  quizScore,
  timeSpent,
  onFileView,
  onStartQuiz,
  isUpdating = false,
}: ModuleCardProps) {
  const filesProgress = files.length > 0 
    ? Math.round((viewedFiles.length / files.length) * 100)
    : 0

  const allFilesViewed = filesProgress === 100

  const getFileIcon = (fileName: string, fileType?: string) => {
    const ext = fileName?.toLowerCase().split('.').pop() || ''
    if (['mp4', 'avi', 'mov', 'webm'].includes(ext) || fileType === 'video') {
      return <Video className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <Card
      className={`transition-all transform hover:scale-[1.01] ${
        locked
          ? "opacity-60 bg-gray-50 border-gray-300"
          : completed
          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-sm"
          : current
          ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-400 shadow-lg ring-2 ring-blue-200"
          : filesProgress > 0
          ? "bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200"
          : "bg-white border-2 border-gray-200 hover:border-blue-300"
      }`}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4 flex-1">
            {/* Module Icon */}
            <div
              className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${
                completed
                  ? "bg-green-100 ring-4 ring-green-200"
                  : current
                  ? "bg-blue-100 ring-4 ring-blue-200 animate-pulse"
                  : locked
                  ? "bg-gray-200"
                  : "bg-blue-50"
              }`}
            >
              {completed ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : locked ? (
                <Lock className="h-6 w-6 text-gray-500" />
              ) : (
                <span className="text-lg font-bold text-blue-600">{index + 1}</span>
              )}
            </div>

            {/* Module Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1 flex-wrap gap-1">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    current
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : completed
                      ? "bg-green-100 border-green-300 text-green-700"
                      : "bg-gray-100 border-gray-300 text-gray-600"
                  }`}
                >
                  Module {index + 1}
                </Badge>
                
                {current && !completed && (
                  <Badge className="bg-blue-600 animate-pulse">
                    ← You are here
                  </Badge>
                )}
                
                {locked && (
                  <Badge variant="outline" className="bg-gray-200 text-gray-600">
                    🔒 Locked
                  </Badge>
                )}
              </div>

              <h3 className={`font-bold text-lg ${locked ? "text-gray-500" : "text-gray-900"}`}>
                {title}
              </h3>

              {description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
              )}

              {/* Meta Info */}
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                {duration && (
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {duration} min
                  </span>
                )}
                {timeSpent && timeSpent > 0 && (
                  <span className="flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    Spent: {formatTime(timeSpent)}
                  </span>
                )}
                {hasQuiz && (
                  <span className="flex items-center">
                    <HelpCircle className="h-3 w-3 mr-1" />
                    Quiz included
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-col items-end space-y-2">
            {completed && (
              <Badge className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
            {quizScore !== null && quizScore !== undefined && (
              <Badge className="bg-purple-600">
                <Award className="h-3 w-3 mr-1" />
                {quizScore}%
              </Badge>
            )}
            {!completed && !locked && filesProgress > 0 && (
              <Badge variant="outline" className="bg-blue-50">
                {filesProgress}%
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Bar for Current/In-Progress Modules */}
        {!completed && !locked && filesProgress > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Content Progress</span>
              <span>{viewedFiles.length}/{files.length} items</span>
            </div>
            <Progress value={filesProgress} className="h-2" />
          </div>
        )}

        {/* Files List */}
        {!locked && files.length > 0 && (
          <div className="space-y-2 mb-4">
            {files.map((file, fileIndex) => {
              const isViewed = viewedFiles.includes(file.id)
              return (
                <div
                  key={file.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isViewed
                      ? "bg-gray-50 border-gray-300"
                      : "bg-white border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {getFileIcon(file.fileName, file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.fileName}
                        </p>
                      </div>
                      {isViewed && (
                        <Badge variant="outline" className="text-xs bg-green-50 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Viewed
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={isViewed ? "outline" : "default"}
                      onClick={() => onFileView(file.id, file)}
                      disabled={isUpdating}
                      className="ml-3"
                    >
                      {isViewed ? (
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
                </div>
              )
            })}
          </div>
        )}

        {/* Locked Message */}
        {locked && (
          <p className="text-sm text-gray-500 italic">
            Complete previous modules to unlock this content.
          </p>
        )}

        {/* Quiz Button */}
        {!completed && !locked && allFilesViewed && hasQuiz && !quizScore && onStartQuiz && (
          <Button
            onClick={onStartQuiz}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Take Module Quiz
          </Button>
        )}

        {/* Completion Message */}
        {completed && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-3">
            <p className="text-xs text-green-800 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              <strong>Module completed!</strong>
              {quizScore && ` Quiz score: ${quizScore}%`}
              {timeSpent && timeSpent > 0 && ` • Time spent: ${formatTime(timeSpent)}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

