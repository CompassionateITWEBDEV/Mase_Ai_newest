"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Users, Activity, BarChart3, DollarSign, Star } from "lucide-react"

export function EnhancedAvailabilityToggle() {
  const [isAvailable, setIsAvailable] = useState(false)
  const [availabilityMode, setAvailabilityMode] = useState("immediate")
  const [sessionCount, setSessionCount] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [averageRating, setAverageRating] = useState(4.8)

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      if (isAvailable) {
        // Simulate incoming consultation requests
        if (Math.random() > 0.9) {
          setSessionCount((prev) => prev + 1)
          setTotalEarnings((prev) => prev + 75) // $75 per consultation
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isAvailable])

  const handleToggle = () => {
    setIsAvailable(!isAvailable)
    console.log("Availability changed to:", !isAvailable)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Availability Status
            </span>
            <Badge
              variant={isAvailable ? "default" : "secondary"}
              className={isAvailable ? "bg-green-500 hover:bg-green-600" : "bg-gray-500"}
            >
              {isAvailable ? "Available" : "Offline"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Online Status</h3>
              <p className="text-sm text-gray-600">
                {isAvailable
                  ? "You're available for urgent telehealth consultations"
                  : "You're currently offline and won't receive consultation requests"}
              </p>
            </div>
            <Switch
              id="available"
              checked={isAvailable}
              onCheckedChange={handleToggle}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          {isAvailable && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium">Availability Mode</label>
                <Select value={availabilityMode} onValueChange={setAvailabilityMode}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate Response</SelectItem>
                    <SelectItem value="within-5min">Within 5 minutes</SelectItem>
                    <SelectItem value="within-15min">Within 15 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Expected response time for new consultation requests</p>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm font-medium">Active and ready for consultations</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Today's Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-blue-600">{sessionCount}</div>
              <div className="text-sm text-gray-600">Consultations</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-600">${totalEarnings}</div>
              <div className="text-sm text-gray-600">Earnings</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-purple-600">2.3m</div>
              <div className="text-sm text-gray-600">Avg Response</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <Star className="h-6 w-6 text-orange-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-orange-600">{averageRating}</div>
              <div className="text-sm text-gray-600">Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
