"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Trophy,
  Zap,
  Target,
  Star,
  Award,
  Flame,
  TrendingUp,
  CheckCircle,
} from "lucide-react"

interface GamificationBadgesProps {
  points: number
  badges: string[]
  streak: number
  modulesCompleted: number
  totalModules: number
}

export function GamificationBadges({
  points,
  badges,
  streak,
  modulesCompleted,
  totalModules,
}: GamificationBadgesProps) {
  const allBadges = [
    {
      id: "first_step",
      name: "First Steps",
      description: "Complete your first module",
      icon: Target,
      unlocked: modulesCompleted >= 1,
      color: "text-blue-500",
    },
    {
      id: "halfway",
      name: "Halfway Hero",
      description: "Complete 50% of the training",
      icon: TrendingUp,
      unlocked: modulesCompleted >= totalModules / 2,
      color: "text-purple-500",
    },
    {
      id: "speed_learner",
      name: "Speed Learner",
      description: "Complete 3 modules in one day",
      icon: Zap,
      unlocked: badges.includes("speed_learner"),
      color: "text-yellow-500",
    },
    {
      id: "streak_master",
      name: "Streak Master",
      description: "Maintain a 7-day learning streak",
      icon: Flame,
      unlocked: streak >= 7,
      color: "text-orange-500",
    },
    {
      id: "perfectionist",
      name: "Perfectionist",
      description: "Score 100% on all quizzes",
      icon: Star,
      unlocked: badges.includes("perfectionist"),
      color: "text-yellow-400",
    },
    {
      id: "champion",
      name: "Training Champion",
      description: "Complete the entire training",
      icon: Trophy,
      unlocked: modulesCompleted >= totalModules,
      color: "text-green-500",
    },
  ]

  const unlockedBadges = allBadges.filter((b) => b.unlocked)

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
          Your Achievements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Points */}
        <div className="bg-white rounded-lg p-4 border-2 border-yellow-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-2xl font-bold text-yellow-600">{points}</p>
              </div>
            </div>
            <Badge className="bg-yellow-500">
              Level {Math.floor(points / 100) + 1}
            </Badge>
          </div>
          <Progress value={(points % 100)} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">
            {100 - (points % 100)} points to next level
          </p>
        </div>

        {/* Streak */}
        <div className="bg-white rounded-lg p-4 border-2 border-orange-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Learning Streak</p>
                <p className="text-2xl font-bold text-orange-600">{streak} Days</p>
              </div>
            </div>
            {streak >= 7 && (
              <Badge className="bg-orange-500 animate-pulse">🔥 On Fire!</Badge>
            )}
          </div>
        </div>

        {/* Badges Grid */}
        <div>
          <h4 className="font-semibold text-sm mb-3 flex items-center">
            <Award className="h-4 w-4 mr-2" />
            Badges ({unlockedBadges.length}/{allBadges.length})
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {allBadges.map((badge) => {
              const Icon = badge.icon
              return (
                <div
                  key={badge.id}
                  className={`relative p-3 rounded-lg border-2 transition-all ${
                    badge.unlocked
                      ? "bg-white border-green-300 shadow-sm"
                      : "bg-gray-100 border-gray-300 opacity-50"
                  }`}
                  title={badge.description}
                >
                  <div
                    className={`h-12 w-12 mx-auto rounded-full flex items-center justify-center ${
                      badge.unlocked ? "bg-gradient-to-br from-yellow-100 to-orange-100" : "bg-gray-200"
                    }`}
                  >
                    <Icon
                      className={`h-7 w-7 ${badge.unlocked ? badge.color : "text-gray-400"}`}
                    />
                  </div>
                  {badge.unlocked && (
                    <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <p className="text-xs text-center mt-2 font-medium truncate">
                    {badge.name}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

