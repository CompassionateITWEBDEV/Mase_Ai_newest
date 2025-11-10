"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Navigation, MapPin, Loader2 } from "lucide-react"

interface Waypoint {
  id: string
  name: string
  address: string
  lat: number
  lng: number
}

interface ApplyRouteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staffName: string
  currentOrder: string[]
  optimizedOrder: string[]
  waypoints: Waypoint[]
  currentDistance: number
  optimizedDistance: number
  distanceSaved: number
  timeSaved: number
  costSaved: number
  onConfirm: () => void
  isApplying: boolean
}

export function ApplyRouteModal({
  open,
  onOpenChange,
  staffName,
  currentOrder,
  optimizedOrder,
  waypoints,
  currentDistance,
  optimizedDistance,
  distanceSaved,
  timeSaved,
  costSaved,
  onConfirm,
  isApplying
}: ApplyRouteModalProps) {
  // Get waypoint details by ID
  const getWaypointById = (id: string) => waypoints.find(w => w.id === id)

  // Build current route order
  const currentRoute = currentOrder.map(id => getWaypointById(id)).filter(Boolean) as Waypoint[]
  const optimizedRoute = optimizedOrder.map(id => getWaypointById(id)).filter(Boolean) as Waypoint[]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Apply Optimized Route
          </DialogTitle>
          <DialogDescription>
            Review the optimized route for <strong>{staffName}</strong> before applying
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Route Comparison Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Current Distance</div>
              <div className="text-lg font-semibold">{currentDistance} mi</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Optimized Distance</div>
              <div className="text-lg font-semibold text-green-600">{optimizedDistance} mi</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Savings</div>
              <div className="text-lg font-semibold text-green-600">
                {distanceSaved.toFixed(1)} mi
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Time Saved</div>
              <div className="text-lg font-semibold text-blue-600">{timeSaved} min</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Cost Saved</div>
              <div className="text-lg font-semibold text-green-600">${costSaved.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Efficiency</div>
              <div className="text-lg font-semibold text-orange-600">
                {currentDistance > 0 ? ((distanceSaved / currentDistance) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>

          {/* Current Route */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-gray-100">
                Current Route
              </Badge>
              <span className="text-sm text-muted-foreground">
                {currentDistance.toFixed(1)} miles
              </span>
            </div>
            <div className="space-y-2 border-l-2 border-gray-300 pl-4">
              {currentRoute.map((waypoint, index) => (
                <div key={waypoint.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-6 h-6 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    {index < currentRoute.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-300 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="font-medium text-sm">{waypoint.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {waypoint.address}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center py-2">
            <ArrowRight className="h-6 w-6 text-green-600" />
          </div>

          {/* Optimized Route */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-green-600 text-white">
                Optimized Route
              </Badge>
              <span className="text-sm text-muted-foreground">
                {optimizedDistance.toFixed(1)} miles
              </span>
            </div>
            <div className="space-y-2 border-l-2 border-green-500 pl-4">
              {optimizedRoute.map((waypoint, index) => (
                <div key={waypoint.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    {index < optimizedRoute.length - 1 && (
                      <div className="w-0.5 h-8 bg-green-500 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="font-medium text-sm">{waypoint.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {waypoint.address}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isApplying}
            className="bg-green-600 hover:bg-green-700"
          >
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Apply Route
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

