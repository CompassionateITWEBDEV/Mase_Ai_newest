"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Circle, Lock, Clock } from "lucide-react"

interface Module {
  id: string
  title: string
  duration?: number
  completed: boolean
  locked: boolean
  current: boolean
}

interface LearningPathProps {
  modules: Module[]
  currentModuleIndex: number
}

export function LearningPath({ modules, currentModuleIndex }: LearningPathProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Your Learning Path</h3>
        <Badge className="bg-blue-600">
          {modules.filter((m) => m.completed).length}/{modules.length} Complete
        </Badge>
      </div>

      <div className="space-y-4">
        {modules.map((module, index) => {
          const isLast = index === modules.length - 1

          return (
            <div key={module.id} className="relative">
              <div
                className={`flex items-start space-x-4 p-4 rounded-lg transition-all ${
                  module.current
                    ? "bg-white border-2 border-blue-500 shadow-lg"
                    : module.completed
                    ? "bg-white/50 border border-green-300"
                    : module.locked
                    ? "bg-gray-100 border border-gray-300 opacity-60"
                    : "bg-white border border-gray-200"
                }`}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {module.completed ? (
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  ) : module.current ? (
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                      <Circle className="h-6 w-6 text-blue-600 fill-blue-600" />
                    </div>
                  ) : module.locked ? (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-gray-500" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <Circle className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            module.current
                              ? "bg-blue-100 border-blue-300 text-blue-700"
                              : "bg-gray-100 border-gray-300 text-gray-600"
                          }`}
                        >
                          Module {index + 1}
                        </Badge>
                        {module.current && (
                          <Badge className="text-xs bg-blue-600 animate-pulse">
                            Current
                          </Badge>
                        )}
                      </div>
                      <h4
                        className={`font-semibold ${
                          module.locked ? "text-gray-500" : "text-gray-900"
                        }`}
                      >
                        {module.title}
                      </h4>
                      {module.duration && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {module.duration} min
                        </p>
                      )}
                    </div>

                    {module.completed && (
                      <Badge className="bg-green-100 text-green-800 border border-green-300">
                        ✓ Done
                      </Badge>
                    )}
                  </div>

                  {module.current && !module.completed && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-2">In Progress</p>
                      <Progress value={50} className="h-2" />
                    </div>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="absolute left-9 top-16 bottom-[-16px] w-0.5 bg-gradient-to-b from-gray-300 to-transparent" />
              )}
            </div>
          )
        })}
      </div>

      {/* Progress Summary */}
      <div className="mt-6 pt-6 border-t border-blue-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Overall Progress</span>
          <span className="font-bold text-blue-600">
            {Math.round((modules.filter((m) => m.completed).length / modules.length) * 100)}%
          </span>
        </div>
        <Progress
          value={(modules.filter((m) => m.completed).length / modules.length) * 100}
          className="h-3 mt-2"
        />
      </div>
    </Card>
  )
}

