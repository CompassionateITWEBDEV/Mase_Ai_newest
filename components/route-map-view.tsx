"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MapViewProps {
  waypoints: Array<{
    id: string
    name: string
    lat: number
    lng: number
  }>
  optimizedOrder?: string[]
  isOptimized?: boolean
}

export function RouteMapView({ waypoints, optimizedOrder, isOptimized = false }: MapViewProps) {
  const [error, setError] = useState<string | null>(null)

  // For now, return a placeholder component
  return (
    <div className="relative w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="text-center p-4">
            <div className="text-lg font-semibold mb-2">Map View</div>
            <div className="text-sm text-gray-600 mb-4">
              {waypoints.length} stops on route
            </div>
            <div className="grid grid-cols-1 gap-2 max-w-md mx-auto text-sm">
              {waypoints.map((point, index) => (
                <div key={point.id} className="flex items-center justify-between bg-white p-2 rounded shadow-sm">
                  <span className="font-medium">Stop {index + 1}: {point.name}</span>
                  <span className="text-gray-500 text-xs">
                    {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}