"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, User, Phone, MessageSquare, Navigation, RefreshCw } from "lucide-react"

interface PatientETAViewProps {
  staffId: string
  patientId: string
}

interface StaffLocation {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: string
}

interface StaffInfo {
  name: string
  role: string
  phone: string
  estimatedArrival: string
  currentLocation: StaffLocation
  status: string
  distanceAway: number // in miles
}

export default function PatientETAView({ staffId, patientId }: PatientETAViewProps) {
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchStaffLocation = async () => {
    try {
      setLoading(true)
      // Use the correct API endpoint with query parameter
      const response = await fetch(`/api/gps/staff-location?staff_id=${encodeURIComponent(staffId)}`, {
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error("Unable to fetch staff location")
      }

      const data = await response.json()

      if (data.success && data.currentLocation) {
        // Get staff info
        const staffName = data.staff?.name || "Healthcare Provider"
        const staffRole = data.staff?.department || "Healthcare Provider"
        
        // Calculate estimated arrival (20 minutes from now as default)
        const estimatedArrival = new Date(Date.now() + 20 * 60000).toISOString()
        
        // Calculate distance (simplified - in production use actual patient location)
        const distance = calculateDistance(data.currentLocation)
        
        // Determine status
        let status = "En Route"
        if (data.status === "on_visit") {
          status = "On Visit"
        } else if (data.status === "driving") {
          status = "En Route"
        } else if (data.status === "active") {
          status = "Active"
        } else {
          status = "Offline"
        }
        
        setStaffInfo({
          name: staffName,
          role: staffRole,
          phone: "+1 (555) 123-4567", // Would come from staff data
          estimatedArrival: estimatedArrival,
          currentLocation: data.currentLocation,
          status: status,
          distanceAway: distance,
        })
        setError(null)
      } else {
        setError(data.error || "Location not available")
      }
    } catch (err) {
      setError("Unable to load staff location")
      console.error("Error fetching staff location:", err)
    } finally {
      setLoading(false)
      setLastUpdated(new Date())
    }
  }

  const calculateDistance = (location: StaffLocation): number => {
    // Simplified distance calculation
    // In production, you would:
    // 1. Get patient's address from patient data
    // 2. Use geocoding to get patient coordinates
    // 3. Calculate actual distance using Haversine formula
    
    // For now, return a reasonable estimate based on location accuracy
    // If accuracy is high (GPS), assume closer; if low (IP), assume farther
    if (location.accuracy && location.accuracy > 1000) {
      // IP geolocation - less accurate, assume farther
      return Math.random() * 10 + 5 // 5-15 miles
    } else {
      // GPS location - more accurate, assume closer
      return Math.random() * 5 + 0.5 // 0.5-5.5 miles
    }
  }

  const formatTimeUntilArrival = (arrivalTime: string): string => {
    const now = new Date()
    const arrival = new Date(arrivalTime)
    const diffMinutes = Math.max(0, Math.floor((arrival.getTime() - now.getTime()) / (1000 * 60)))

    if (diffMinutes === 0) return "Arriving now"
    if (diffMinutes < 60) return `${diffMinutes} minutes`

    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `${hours}h ${minutes}m`
  }

  useEffect(() => {
    fetchStaffLocation()

    // Update every 30 seconds
    const interval = setInterval(fetchStaffLocation, 30000)

    return () => clearInterval(interval)
  }, [staffId])

  if (loading && !staffInfo) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading staff location...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !staffInfo) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <MapPin className="h-12 w-12 mx-auto mb-2" />
              <p className="font-medium">Location Unavailable</p>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchStaffLocation} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!staffInfo) return null

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Staff Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                {staffInfo.name}
              </CardTitle>
              <CardDescription>{staffInfo.role}</CardDescription>
            </div>
            <Badge variant={staffInfo.status === "En Route" ? "default" : "secondary"} className="ml-2">
              {staffInfo.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* ETA Information */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="font-medium text-blue-900">Estimated Arrival</p>
                  <p className="text-sm text-blue-700">{formatTimeUntilArrival(staffInfo.estimatedArrival)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-600">
                  {new Date(staffInfo.estimatedArrival).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Distance Information */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <Navigation className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="font-medium text-green-900">Distance Away</p>
                  <p className="text-sm text-green-700">{staffInfo.distanceAway.toFixed(1)} miles</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="flex-1 bg-transparent" 
                size="sm"
                onClick={() => {
                  if (!staffInfo.phone) {
                    alert('Phone number not available')
                    return
                  }
                  window.location.href = `tel:${staffInfo.phone}`
                }}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 bg-transparent" 
                size="sm"
                onClick={() => {
                  if (!staffInfo.phone) {
                    alert('Phone number not available')
                    return
                  }
                  // Format phone number for WhatsApp (remove non-digits, add country code if needed)
                  let cleaned = staffInfo.phone.replace(/\D/g, '')
                  if (cleaned.length === 10) {
                    cleaned = '1' + cleaned
                  }
                  window.open(`https://wa.me/${cleaned}`, '_blank')
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Live Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center relative">
            <div className="text-center text-gray-500">
              <MapPin className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Live Map View</p>
              <p className="text-xs">Updated {lastUpdated.toLocaleTimeString()}</p>
            </div>

            {/* Mock staff location indicator */}
            <div
              className="absolute w-3 h-3 bg-blue-500 rounded-full ring-2 ring-white"
              style={{
                top: "40%",
                left: "60%",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            <Button variant="ghost" size="sm" onClick={fetchStaffLocation} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
