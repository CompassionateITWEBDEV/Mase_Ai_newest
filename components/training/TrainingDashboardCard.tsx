"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  Clock,
  Award,
  PlayCircle,
  Eye,
  ChevronRight,
  Target,
  TrendingUp,
} from "lucide-react"

interface TrainingDashboardCardProps {
  module: {
    id: string
    trainingId?: string
    name: string
    dueDate?: string
    completionDate?: string
    category?: string
    ceuHours?: number
    progress: number
    status: string
    completed?: boolean
    description?: string
    certificateId?: string
    score?: number
  }
  onContinue: () => void
  onViewCertificate?: () => void
  staffId?: string
}

export function TrainingDashboardCard({ module, onContinue, onViewCertificate, staffId }: TrainingDashboardCardProps) {
  const isCompleted = module.completed || module.status === "completed"
  const isInProgress = module.status === "in_progress"
  const isDueSoon = module.status === "upcoming"
  const isNotStarted = module.status === "assigned" || !module.status

  const getStatusConfig = () => {
    if (isCompleted) {
      return {
        gradient: "from-green-50 to-emerald-50",
        border: "border-green-300",
        iconBg: "bg-green-100",
        icon: <CheckCircle className="h-8 w-8 text-green-600" />,
        badge: { bg: "bg-green-600", text: "✓ Completed", icon: CheckCircle },
        progressColor: "text-green-600",
      }
    }
    if (isInProgress) {
      return {
        gradient: "from-blue-50 to-cyan-50",
        border: "border-blue-300",
        iconBg: "bg-blue-100",
        icon: <TrendingUp className="h-8 w-8 text-blue-600" />,
        badge: { bg: "bg-blue-600", text: "⟳ In Progress", icon: TrendingUp },
        progressColor: "text-blue-600",
      }
    }
    if (isDueSoon) {
      return {
        gradient: "from-orange-50 to-amber-50",
        border: "border-orange-300",
        iconBg: "bg-orange-100",
        icon: <Clock className="h-8 w-8 text-orange-600" />,
        badge: { bg: "bg-orange-600", text: "⚠ Due Soon", icon: Clock },
        progressColor: "text-orange-600",
      }
    }
    return {
      gradient: "from-yellow-50 to-amber-50",
      border: "border-yellow-300",
      iconBg: "bg-yellow-100",
      icon: <Target className="h-8 w-8 text-yellow-600" />,
      badge: { bg: "bg-yellow-600", text: "○ Not Started", icon: Target },
      progressColor: "text-gray-600",
    }
  }

  const config = getStatusConfig()
  const BadgeIcon = config.badge.icon

  return (
    <Card
      className={`transition-all hover:shadow-xl hover:scale-[1.02] border-2 ${config.border} bg-gradient-to-br ${config.gradient}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className={`flex-shrink-0 h-16 w-16 rounded-2xl ${config.iconBg} flex items-center justify-center shadow-sm`}>
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                  {module.name}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {module.dueDate && (
                    <span className="text-xs text-gray-600 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {module.dueDate}
                    </span>
                  )}
                  {module.category && (
                    <Badge variant="outline" className="text-xs">
                      {module.category}
                    </Badge>
                  )}
                  {module.ceuHours && (
                    <span className="text-xs text-gray-600 flex items-center">
                      <Award className="h-3 w-3 mr-1" />
                      {module.ceuHours} CEU
                    </span>
                  )}
                </div>
              </div>
              <Badge className={`${config.badge.bg} border-0 ml-2 flex items-center`}>
                <BadgeIcon className="h-3 w-3 mr-1" />
                {config.badge.text.split(' ')[1]}
              </Badge>
            </div>

            {/* Description */}
            {module.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{module.description}</p>
            )}

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="font-medium text-gray-700">Progress</span>
                <span className={`font-bold ${config.progressColor}`}>
                  {module.progress}%
                </span>
              </div>
              <Progress value={module.progress} className="h-2.5" />
            </div>

            {/* Date Display */}
            {isCompleted && module.completionDate && (
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-green-700 font-medium">
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Completed: {new Date(module.completionDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </p>
                {module.score !== undefined && (
                  <Badge className="bg-purple-600">
                    Score: {module.score}%
                  </Badge>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {!isCompleted ? (
                <Button
                  onClick={onContinue}
                  className={`flex-1 ${
                    isInProgress
                      ? "bg-blue-600 hover:bg-blue-700"
                      : isDueSoon
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-yellow-600 hover:bg-yellow-700"
                  }`}
                  size="sm"
                >
                  {isNotStarted ? (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Start Training
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Continue Training
                    </>
                  )}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center gap-2">
                    {onViewCertificate && (
                      <Button 
                        onClick={onViewCertificate}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        size="sm"
                      >
                        <Award className="h-4 w-4 mr-2" />
                        View Certificate
                      </Button>
                    )}
                    <Button 
                      onClick={onContinue} 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review Content
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

