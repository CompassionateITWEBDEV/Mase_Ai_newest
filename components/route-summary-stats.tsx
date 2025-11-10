"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, DollarSign, TrendingUp, MapPin } from "lucide-react"

interface RouteSummaryStatsProps {
  totalSavings: number
  totalTimeSaved: number
  totalDistanceSaved: number
  avgEfficiencyGain: number
  routesOptimized: number
  loading?: boolean
}

export function RouteSummaryStats({
  totalSavings,
  totalTimeSaved,
  totalDistanceSaved,
  avgEfficiencyGain,
  routesOptimized,
  loading = false
}: RouteSummaryStatsProps) {
  const stats = [
    {
      title: "Potential Savings",
      value: `$${totalSavings.toFixed(2)}`,
      description: "Per day across all routes",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Time Savings",
      value: `${totalTimeSaved} min`,
      description: "Total time saved per day",
      icon: Clock,
      color: "text-blue-600"
    },
    {
      title: "Distance Saved",
      value: `${totalDistanceSaved.toFixed(1)} mi`,
      description: `${routesOptimized} routes optimized`,
      icon: MapPin,
      color: "text-purple-600"
    },
    {
      title: "Efficiency Gain",
      value: `${avgEfficiencyGain.toFixed(1)}%`,
      description: "Average improvement",
      icon: TrendingUp,
      color: "text-orange-600"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color} ${loading ? 'animate-pulse' : ''}`}>
              {loading ? '--' : stat.value}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}