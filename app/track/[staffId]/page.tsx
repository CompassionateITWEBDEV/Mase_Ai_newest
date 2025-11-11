"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Navigation, Play, Square, Clock, Users, CheckCircle, AlertCircle, Loader2, DollarSign, Route, XCircle, Gauge, Compass, Activity, Zap } from "lucide-react"
import { useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import TrackMapView from "@/components/track-map-view"

// Helper function to calculate distance between two coordinates (in miles)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function StaffTrackingPage() {
  const params = useParams()
  const staffId = params.staffId as string
  const [currentTrip, setCurrentTrip] = useState<any>(null)
  const [currentVisit, setCurrentVisit] = useState<any>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy?: number; speed?: number; heading?: number } | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [tripStats, setTripStats] = useState<{ distance: number; cost: number; costPerMile: number } | null>(null)
  const [staffCostPerMile, setStaffCostPerMile] = useState<number>(0.67)
  const [lastTripDuration, setLastTripDuration] = useState<number | null>(null)
  const [routePoints, setRoutePoints] = useState<Array<{ lat: number; lng: number; timestamp: string }>>([])
  const [tripMetrics, setTripMetrics] = useState<{ distance: number; avgSpeed: number; maxSpeed: number; duration: number } | null>(null)
  const { toast } = useToast()

  // Fetch staff cost per mile
  useEffect(() => {
    const fetchStaffCostPerMile = async () => {
      if (!staffId) return

      try {
        const res = await fetch(`/api/staff/get-cost-per-mile?staff_id=${staffId}`)
        const data = await res.json()
        if (data.success && data.costPerMile) {
          setStaffCostPerMile(data.costPerMile)
        }
      } catch (e) {
        console.error('Error fetching staff cost per mile:', e)
        // Use default 0.67 if fetch fails
      }
    }

    fetchStaffCostPerMile()
  }, [staffId])

  // Check for active trip and visit on mount
  useEffect(() => {
    const checkActiveTrip = async () => {
      if (!staffId) {
        setIsLoading(false)
        return
      }

      try {
        // Check for active trip
        const tripRes = await fetch(`/api/gps/active-trip?staff_id=${staffId}`)
        const tripData = await tripRes.json()
        
        if (tripData.success && tripData.trip) {
          setCurrentTrip(tripData.trip)
          setIsTracking(true)
          
          // Check for active visit
          const visitRes = await fetch(`/api/visits/active?staff_id=${staffId}&trip_id=${tripData.trip.id}`)
          const visitData = await visitRes.json()
          
          if (visitData.success && visitData.visit) {
            setCurrentVisit(visitData.visit)
          }
          
          // Reset trip stats when resuming trip
          setTripStats(null)
        }
      } catch (e) {
        console.error('Error checking active trip/visit:', e)
      } finally {
        setIsLoading(false)
      }
    }

    checkActiveTrip()
  }, [staffId])

  // Get current location from device GPS (not IP geolocation)
  const getCurrentLocation = (options?: PositionOptions) => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      return
    }

    // Force device GPS with high accuracy - NOT IP-based location
    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true, // Use GPS, not IP/WiFi triangulation
      timeout: 20000, // Allow more time for GPS to acquire signal
      maximumAge: 0 // Don't use cached location - get fresh GPS reading
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Validate location accuracy
        const accuracy = position.coords.accuracy || 0
        
        // PC/Laptop: WiFi-based location (100-2000m) - acceptable
        // Mobile: Device GPS (< 100m) - preferred
        // IP geolocation: (> 2000m) - very inaccurate
        if (accuracy > 2000) {
          console.warn('Location accuracy is very low - may be using IP geolocation')
          toast({
            title: "Low Accuracy Warning",
            description: `Location accuracy is very low (${accuracy.toFixed(0)}m). Please enable location services. For best accuracy, use a mobile device with GPS.`,
            variant: "destructive"
          })
        } else if (accuracy > 1000) {
          // WiFi-based location on PC (acceptable but less accurate)
          console.info('WiFi-based location detected (PC/Laptop) - acceptable for tracking')
          // Don't show error - PC WiFi location works
        } else if (accuracy <= 100) {
          // Good GPS accuracy
          console.info('Device GPS detected - excellent accuracy')
        }

        // Verify coordinates are valid (not 0,0 or null)
        if (!position.coords.latitude || !position.coords.longitude) {
          setLocationError("Invalid GPS coordinates received")
          return
        }

        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: accuracy
        })
        setLocationError(null)
        setLastUpdateTime(new Date())
      },
      (error) => {
        let errorMessage = "Unable to get device GPS location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser settings to use device GPS."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Device GPS is unavailable. Please check your device's location settings and ensure GPS is enabled."
            break
          case error.TIMEOUT:
            errorMessage = "GPS signal timeout. Please ensure you have a clear view of the sky for better GPS accuracy."
            break
        }
        setLocationError(errorMessage)
        toast({
          title: "GPS Error",
          description: errorMessage,
          variant: "destructive"
        })
      },
      { ...defaultOptions, ...options }
    )
  }

  // Start watching position for continuous updates
  const startWatchingPosition = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      return
    }

    // Stop any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    // Use device GPS with high accuracy - NOT IP geolocation
    const options: PositionOptions = {
      enableHighAccuracy: true, // Force GPS hardware, not IP/WiFi triangulation
      timeout: 20000, // Allow time for GPS to acquire signal
      maximumAge: 3000 // Accept cached position up to 3 seconds old (for real-time updates)
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const speed = position.coords.speed ? position.coords.speed * 2.237 : null // Convert m/s to mph
        const heading = position.coords.heading !== null && position.coords.heading !== undefined ? position.coords.heading : null
        
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: speed,
          heading: heading
        }
        setLocation(newLocation)
        setLocationError(null)
        setLastUpdateTime(new Date())
        
        // Add to route points if tracking
        if (isTracking && currentTrip) {
          setRoutePoints(prev => [...prev, {
            lat: newLocation.lat,
            lng: newLocation.lng,
            timestamp: new Date().toISOString()
          }])
          
          // Calculate trip metrics
          if (prev.length > 0) {
            const totalDistance = prev.reduce((sum, point, idx) => {
              if (idx === 0) return sum
              return sum + calculateDistance(prev[idx - 1].lat, prev[idx - 1].lng, point.lat, point.lng)
            }, 0) + calculateDistance(prev[prev.length - 1].lat, prev[prev.length - 1].lng, newLocation.lat, newLocation.lng)
            
            const speeds = prev.filter(p => (p as any).speed).map(p => (p as any).speed)
            if (speed) speeds.push(speed)
            const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0
            const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0
            
            const duration = currentTrip.startTime 
              ? Math.round((new Date().getTime() - new Date(currentTrip.startTime).getTime()) / 60000)
              : 0
            
            setTripMetrics({
              distance: totalDistance,
              avgSpeed,
              maxSpeed,
              duration
            })
          }
        }
        
        // Validate GPS accuracy - warn if accuracy is very high (IP geolocation)
        // PC/Laptop WiFi location: 100-2000m (acceptable)
        // Mobile GPS: < 100m (preferred)
        // IP geolocation: > 2000m (reject)
        if (newLocation.accuracy && newLocation.accuracy > 2000) {
          console.warn('Very low accuracy detected - may be using IP geolocation. Accuracy:', newLocation.accuracy)
          setLocationError(`Very low accuracy (${newLocation.accuracy.toFixed(0)}m) - Please enable location services. For best accuracy, use mobile device with GPS.`)
          // Don't update location if accuracy is too low
          return
        } else if (newLocation.accuracy && newLocation.accuracy > 1000) {
          // WiFi-based location on PC (acceptable but less accurate)
          console.info('WiFi-based location detected (PC/Laptop). Accuracy:', newLocation.accuracy)
          setLocationError(`WiFi location (${newLocation.accuracy.toFixed(0)}m accuracy) - For better accuracy, use mobile device with GPS`)
        } else {
          // Good GPS accuracy
          setLocationError(null)
        }

        // If actively tracking a trip, send location update immediately when location changes significantly
        // This ensures real-time tracking while driving using device GPS
        if (isTracking && currentTrip) {
          // Only update if location changed significantly (more than 10 meters) to avoid too many API calls
          const prevLocation = location
          if (prevLocation) {
            const distance = calculateDistance(
              prevLocation.lat,
              prevLocation.lng,
              newLocation.lat,
              newLocation.lng
            )
            // If moved more than 10 meters, update immediately
            if (distance > 0.006) { // ~10 meters in degrees (rough approximation)
              updateLocation(newLocation)
            }
          } else {
            // First location, update immediately
            updateLocation(newLocation)
          }
        }
      },
      (error) => {
        let errorMessage = "Unable to track location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out."
            break
        }
        setLocationError(errorMessage)
      },
      options
    )
  }

  // Stop watching position
  const stopWatchingPosition = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }

  // Initialize location on mount
  useEffect(() => {
    getCurrentLocation()
    startWatchingPosition()

    return () => {
      stopWatchingPosition()
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [])

  // Start/stop tracking based on isTracking state
  // GPS tracking continues during trips AND visits (same as start trip)
  useEffect(() => {
    if (isTracking && location) {
      // Continue GPS tracking during trips AND visits
      // This ensures real-time location tracking even when staff is on a visit
      updateIntervalRef.current = setInterval(() => {
        if (location) {
          updateLocation()
        }
      }, 15000) // 15 seconds - real-time tracking during driving AND visits
      
      // Also send initial location update immediately
      updateLocation()
    } else {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTracking, location]) // Continue tracking even if trip ends but visit is active

  // Update location to server
  const updateLocation = async (loc?: { lat: number; lng: number; accuracy?: number }) => {
    const locToUse = loc || location
    if (!locToUse || !staffId) return

    try {
      // Get current position for speed and heading if available
      let speed: number | null = null
      let heading: number | null = null
      
      // Try to get speed and heading from watchPosition if available
      // Note: These may not always be available depending on device
      if (navigator.geolocation) {
        try {
          // Get fresh GPS position from device (not IP geolocation)
          const position = await new Promise<GeolocationPosition | null>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                // Validate GPS accuracy
                if (pos.coords.accuracy && pos.coords.accuracy > 1000) {
                  console.warn('Low GPS accuracy - may be using IP geolocation')
                }
                resolve(pos)
              },
              () => resolve(null),
              { 
                enableHighAccuracy: true, // Force device GPS
                maximumAge: 2000 // Accept position up to 2 seconds old
              }
            )
          })
          
          if (position) {
            speed = position.coords.speed ? position.coords.speed * 2.237 : null // Convert m/s to mph
            heading = position.coords.heading || null
          }
        } catch (e) {
          // Speed and heading not available, continue without them
        }
      }

      const res = await fetch('/api/gps/update-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          tripId: currentTrip?.id,
          latitude: locToUse.lat,
          longitude: locToUse.lng,
          accuracy: locToUse.accuracy || 10,
          speed: speed,
          heading: heading
        })
      })

      const data = await res.json()
      if (data.success) {
        // Update last update time on successful save
        setLastUpdateTime(new Date())
      } else {
        // If location was rejected due to low accuracy (IP geolocation)
        if (data.requiresDeviceGPS) {
          // Don't log as error - this is expected when IP geolocation is used
          // Just show user-friendly message
          toast({
            title: "Device GPS Required",
            description: "Please enable device GPS on your phone/device. IP geolocation is not accurate enough. Go to your device settings and enable Location/GPS, then allow browser access.",
            variant: "destructive",
            duration: 10000 // Show longer so user can read
          })
          // Set location error state so user knows GPS is needed
          setLocationError("Device GPS required - IP geolocation not accepted")
        } else {
          // Other errors - log but don't show as critical
          console.warn('Location update failed:', data.error)
        }
      }
    } catch (e) {
      console.error('Failed to update location:', e)
    }
  }

  // Start Trip
  const startTrip = async () => {
    try {
      setIsLoading(true)
      
      // Get accurate location first before starting trip
      const getAccurateLocation = (): Promise<{ lat: number; lng: number; accuracy: number }> => {
        return new Promise((resolve, reject) => {
          if (location && location.accuracy && location.accuracy < 50) {
            // If we have a recent accurate location, use it
            resolve({ lat: location.lat, lng: location.lng, accuracy: location.accuracy })
      return
    }

          // Get fresh location from device GPS (not IP geolocation)
          const options = {
            enableHighAccuracy: true, // Force device GPS hardware
            timeout: 20000, // Allow time for GPS signal acquisition
            maximumAge: 0 // Don't use cached location - get fresh GPS reading
          }
          
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy || 10
              })
            },
            (error) => {
              // If high accuracy fails, try with cached location if available
              if (location) {
                console.warn('High accuracy location failed, using available location')
                resolve({ 
                  lat: location.lat, 
                  lng: location.lng, 
                  accuracy: location.accuracy || 50 
                })
              } else {
                reject(new Error('Unable to get location: ' + error.message))
              }
            },
            options
          )
        })
      }
      
      // Get accurate location first
      toast({
        title: "Getting Location",
        description: "Acquiring accurate GPS location...",
      })
      
      const accurateLocation = await getAccurateLocation()
      
      // Update local location state
      setLocation({
        lat: accurateLocation.lat,
        lng: accurateLocation.lng,
        accuracy: accurateLocation.accuracy
      })
      
      // Start trip with accurate location
      const res = await fetch('/api/gps/start-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          latitude: accurateLocation.lat,
          longitude: accurateLocation.lng,
          accuracy: accurateLocation.accuracy
        })
      })

      const data = await res.json()
      if (data.success) {
        setCurrentTrip(data.trip)
        setIsTracking(true)
        setTripStats(null) // Reset trip stats when starting new trip
        
        // Immediately save location to database
        await updateLocation({
          lat: accurateLocation.lat,
          lng: accurateLocation.lng,
          accuracy: accurateLocation.accuracy
        })
        
        toast({
          title: "Trip Started",
          description: `GPS tracking active. Location: ${accurateLocation.lat.toFixed(6)}, ${accurateLocation.lng.toFixed(6)}`,
        })
      } else {
        toast({
          title: "Failed to Start Trip",
          description: data.error || 'Failed to start trip',
          variant: "destructive"
        })
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: 'Failed to start trip: ' + e.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // End Trip
  const endTrip = async () => {
    if (!currentTrip) {
      toast({
        title: "No Active Trip",
        description: "Please start a trip first before ending it.",
        variant: "destructive"
      })
      return
    }

    // Note: Visit can continue independently after trip ends
    // Driving time and visit time are separate
    // We don't require ending visit before ending trip

    try {
      setIsLoading(true)
      
      // Prepare request body with tripId and staffId as fallback
      const requestBody: any = {
        tripId: currentTrip.id,
        staffId: staffId, // Add staffId as fallback
        latitude: location?.lat?.toString() || null,
        longitude: location?.lng?.toString() || null
      }

      console.log('Ending trip with:', requestBody)

      const res = await fetch('/api/gps/end-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await res.json()
      
      if (!res.ok) {
        console.error('End trip error:', data)
        toast({
          title: "Failed to End Trip",
          description: data.error || `Error: ${res.status} ${res.statusText}`,
          variant: "destructive"
        })
        return
      }

      if (data.success) {
        // Save trip duration to use as drive time for next visit
        setLastTripDuration(data.trip.duration || 0)
        
        setTripStats({
          distance: data.trip.totalDistance || 0,
          cost: data.trip.totalCost || 0,
          costPerMile: data.trip.costPerMile || 0.67
        })
        setCurrentTrip(null)
        // Don't clear currentVisit - visit can continue independently
        // setCurrentVisit(null) // Removed - visits are independent
        setIsTracking(false)
        stopWatchingPosition()
        toast({
          title: "Trip Ended",
          description: `Drive time: ${data.trip.duration} minutes, Distance: ${data.trip.totalDistance?.toFixed(2)} miles, Cost: $${data.trip.totalCost?.toFixed(2)}`,
        })
      } else {
        toast({
          title: "Failed to End Trip",
          description: data.error || 'Failed to end trip',
          variant: "destructive"
        })
      }
    } catch (e: any) {
      console.error('End trip exception:', e)
      toast({
        title: "Error",
        description: 'Failed to end trip: ' + e.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Start Visit
  const [visitForm, setVisitForm] = useState({
    patientName: '',
    patientAddress: '',
    visitType: 'Wound Care'
  })

  const startVisit = async () => {
    // Visit can be started independently - doesn't require active trip
    // Driving time and visit time are separate

    if (!visitForm.patientName || !visitForm.patientAddress) {
      toast({
        title: "Required Fields",
        description: "Please fill in patient name and address",
        variant: "destructive"
      })
      return
    }

    try {
      const res = await fetch('/api/visits/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          tripId: currentTrip?.id || null, // Optional - visit can be independent
          patientName: visitForm.patientName,
          patientAddress: visitForm.patientAddress,
          visitType: visitForm.visitType,
          latitude: location?.lat,
          longitude: location?.lng,
          driveTimeFromLastTrip: lastTripDuration // Pass the saved trip duration as drive time
        })
      })

      const data = await res.json()
      if (data.success) {
        setCurrentVisit(data.visit)
        setVisitForm({ patientName: '', patientAddress: '', visitType: 'Wound Care' })
        // Clear last trip duration after using it for visit
        setLastTripDuration(null)
        toast({
          title: "Visit Started",
          description: `Visit to ${data.visit.patientName} has started. Drive time: ${data.visit.driveTime || 0} minutes`,
        })
      } else {
        toast({
          title: "Failed to Start Visit",
          description: data.error || 'Failed to start visit',
          variant: "destructive"
        })
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: 'Failed to start visit: ' + e.message,
        variant: "destructive"
      })
    }
  }

  // End Visit
  const [visitNotes, setVisitNotes] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const endVisit = async () => {
    if (!currentVisit) return

    try {
      const res = await fetch('/api/visits/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId: currentVisit.id,
          notes: visitNotes
        })
      })

      const data = await res.json()
      if (data.success) {
        setCurrentVisit(null)
        setVisitNotes('')
        toast({
          title: "Visit Completed",
          description: `Visit duration: ${data.visit.duration} minutes`,
        })
      } else {
        toast({
          title: "Failed to End Visit",
          description: data.error || 'Failed to end visit',
          variant: "destructive"
        })
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: 'Failed to end visit: ' + e.message,
        variant: "destructive"
      })
    }
  }

  // Cancel Visit
  const cancelVisit = async () => {
    if (!currentVisit) return

    if (!cancelReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancelling the visit",
        variant: "destructive"
      })
      return
    }

    try {
      const res = await fetch('/api/visits/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId: currentVisit.id,
          reason: cancelReason
        })
      })

      const data = await res.json()
      if (data.success) {
        setCurrentVisit(null)
        setCancelReason('')
        setShowCancelDialog(false)
        toast({
          title: "Visit Cancelled",
          description: "The visit has been cancelled successfully",
        })
      } else {
        toast({
          title: "Failed to Cancel Visit",
          description: data.error || 'Failed to cancel visit',
          variant: "destructive"
        })
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: 'Failed to cancel visit: ' + e.message,
        variant: "destructive"
      })
    }
  }

  if (isLoading && !currentTrip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tracking page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Navigation className="h-6 w-6 text-white" />
                </div>
                GPS Tracking Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1 ml-14">Real-time location tracking with high-precision GPS technology</p>
            </div>
            {isTracking && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Live Tracking</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Map Section - Professional Layout */}
        <Card className="shadow-xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
                  <MapPin className="h-6 w-6" />
                  Live Location Map
                </CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Interactive real-time GPS tracking with route visualization
                </CardDescription>
              </div>
              {location && (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => getCurrentLocation()} 
                  disabled={isLoading}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Refresh Location
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {location ? (
              <div className="h-[450px] relative">
                <TrackMapView
                  currentLocation={{
                    ...location,
                    timestamp: lastUpdateTime || undefined
                  }}
                  routePoints={routePoints}
                  isTracking={isTracking}
                />
                {/* Map Overlay Info */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-gray-200 z-[1000]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-2 w-2 rounded-full ${
                      location.accuracy && location.accuracy <= 100 ? 'bg-green-500' :
                      location.accuracy && location.accuracy <= 1000 ? 'bg-yellow-500' :
                      'bg-red-500'
                    } animate-pulse`}></div>
                    <span className="text-xs font-semibold text-gray-700">GPS Status</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">Accuracy:</span>
                      <span className={`font-bold ${
                        location.accuracy && location.accuracy <= 100 ? 'text-green-600' :
                        location.accuracy && location.accuracy <= 1000 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        ±{location.accuracy?.toFixed(0) || 'N/A'}m
                      </span>
                    </div>
                    {lastUpdateTime && (
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">Updated:</span>
                        <span className="font-medium text-gray-800">{lastUpdateTime.toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[450px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Acquiring GPS location...</p>
                  <p className="text-sm text-gray-500 mt-2">Please allow location access</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real-time Metrics Grid */}
        {isTracking && location && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Gauge className="h-5 w-5 text-green-600" />
                  </div>
                  <Badge className="bg-green-500 text-white">Live</Badge>
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">Current Speed</div>
                <div className="text-3xl font-bold text-green-700">
                  {location.speed ? `${location.speed.toFixed(1)}` : '0.0'}
                  <span className="text-lg text-gray-500 ml-1">mph</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Compass className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">Heading</div>
                <div className="text-3xl font-bold text-blue-700">
                  {location.heading !== null && location.heading !== undefined 
                    ? `${Math.round(location.heading)}°` 
                    : 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">GPS Accuracy</div>
                <div className={`text-3xl font-bold ${
                  location.accuracy && location.accuracy <= 100 ? 'text-green-700' :
                  location.accuracy && location.accuracy <= 1000 ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {location.accuracy ? `±${location.accuracy.toFixed(0)}` : 'N/A'}
                  <span className="text-lg text-gray-500 ml-1">m</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-xl transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Route className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">Distance Traveled</div>
                <div className="text-3xl font-bold text-orange-700">
                  {tripMetrics ? tripMetrics.distance.toFixed(2) : '0.00'}
                  <span className="text-lg text-gray-500 ml-1">mi</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trip Management Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Navigation className="h-5 w-5" />
                </div>
                Trip Management
              </CardTitle>
              <CardDescription className="text-indigo-100">Track driving time, distance, and costs</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Location Coordinates Display */}
              {location && (
                <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">GPS Coordinates</span>
                    {isTracking && (
                      <Badge className="bg-green-500 text-white">
                        <Clock className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Latitude:</span>
                      <div className="font-mono font-semibold text-gray-800">{location.lat.toFixed(6)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Longitude:</span>
                      <div className="font-mono font-semibold text-gray-800">{location.lng.toFixed(6)}</div>
                    </div>
                  </div>
                  {locationError && (
                    <Alert variant="destructive" className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{locationError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Trip Status */}
              {!currentTrip ? (
                <Button 
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg" 
                  onClick={startTrip} 
                  disabled={!location || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Starting Trip...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Start New Trip
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  {/* Active Trip Header */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-600 text-white px-3 py-1 text-sm">Trip Active</Badge>
                        {isTracking && (
                          <Badge className="bg-green-500 text-white px-3 py-1 text-sm">
                            <Clock className="h-3 w-3 mr-1" />
                            GPS Tracking
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Started:</span>
                        <span className="font-semibold text-gray-800">{new Date(currentTrip.startTime).toLocaleString()}</span>
                      </div>
                      {currentTrip.startTime && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-semibold text-blue-700">
                            {Math.round((new Date().getTime() - new Date(currentTrip.startTime).getTime()) / 60000)} minutes
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Real-time Trip Metrics */}
                  {currentTrip && !tripStats && tripMetrics && (
                    <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 shadow-md">
                      <div className="flex items-center gap-2 mb-4">
                        <Route className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-base font-bold text-indigo-800">Real-time Trip Metrics</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                          <div className="text-xs font-medium text-gray-600 mb-1">Distance</div>
                          <div className="text-2xl font-bold text-indigo-700">
                            {tripMetrics.distance.toFixed(2)}
                            <span className="text-sm text-gray-500 ml-1">mi</span>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                          <div className="text-xs font-medium text-gray-600 mb-1">Avg Speed</div>
                          <div className="text-2xl font-bold text-indigo-700">
                            {tripMetrics.avgSpeed.toFixed(1)}
                            <span className="text-sm text-gray-500 ml-1">mph</span>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                          <div className="text-xs font-medium text-gray-600 mb-1">Max Speed</div>
                          <div className="text-2xl font-bold text-indigo-700">
                            {tripMetrics.maxSpeed.toFixed(1)}
                            <span className="text-sm text-gray-500 ml-1">mph</span>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                          <div className="text-xs font-medium text-gray-600 mb-1">Duration</div>
                          <div className="text-2xl font-bold text-indigo-700">
                            {tripMetrics.duration}
                            <span className="text-sm text-gray-500 ml-1">min</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-indigo-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Cost per Mile:</span>
                          <span className="text-lg font-bold text-indigo-800">${staffCostPerMile.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic">
                          Final cost will be calculated when trip ends
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Trip Summary (after trip ends) */}
                  {tripStats && (
                    <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-md">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h3 className="text-base font-bold text-green-800">Trip Completed</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-green-100">
                          <span className="text-sm text-gray-600">Distance:</span>
                          <span className="text-lg font-bold text-gray-800">{tripStats.distance.toFixed(2)} miles</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-green-100">
                          <span className="text-sm text-gray-600">Cost per Mile:</span>
                          <span className="text-lg font-bold text-gray-800">${tripStats.costPerMile.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-green-100 p-4 rounded-lg border-2 border-green-300">
                          <span className="text-base font-bold text-green-800">Total Cost:</span>
                          <span className="text-2xl font-bold text-green-700">${tripStats.cost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    variant="destructive" 
                    className="w-full h-12 text-base font-semibold shadow-lg" 
                    onClick={endTrip}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Ending Trip...
                      </>
                    ) : (
                      <>
                        <Square className="h-5 w-5 mr-2" />
                        End Trip
                      </>
                    )}
                  </Button>
                  
                  {currentVisit && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm text-blue-800">
                        <strong>Note:</strong> You have an active visit. Visit time is tracked separately from drive time. You can end the trip and continue the visit.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visit Management Section */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
              <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
                Patient Visit Management
              </CardTitle>
              <CardDescription className="text-emerald-100">Track patient visits independently from trip tracking</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {!currentVisit ? (
                <div className="space-y-5">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Patient Name *</Label>
                    <Input
                      value={visitForm.patientName}
                      onChange={(e) => setVisitForm({ ...visitForm, patientName: e.target.value })}
                      placeholder="Enter patient name"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Patient Address *</Label>
                    <Input
                      value={visitForm.patientAddress}
                      onChange={(e) => setVisitForm({ ...visitForm, patientAddress: e.target.value })}
                      placeholder="Enter real address (e.g., 123 Main St, City, State ZIP)"
                      className="h-11"
                    />
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Real address required for accurate route optimization. AI will validate using free OpenStreetMap (no API key needed).</span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Visit Type</Label>
                    <Select value={visitForm.visitType} onValueChange={(v) => setVisitForm({ ...visitForm, visitType: v })}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Wound Care">Wound Care</SelectItem>
                        <SelectItem value="Medication Management">Medication Management</SelectItem>
                        <SelectItem value="Physical Assessment">Physical Assessment</SelectItem>
                        <SelectItem value="Physical Therapy">Physical Therapy</SelectItem>
                        <SelectItem value="Occupational Therapy">Occupational Therapy</SelectItem>
                        <SelectItem value="ADL Training">ADL Training</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg" 
                    onClick={startVisit} 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Starting Visit...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Start New Visit
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Active Visit Header */}
                  <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-emerald-600 text-white px-3 py-1 text-sm">Visit In Progress</Badge>
                      <div className="text-sm text-gray-600">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Started: {new Date(currentVisit.startTime).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Patient Name</div>
                        <div className="text-lg font-bold text-gray-800">{currentVisit.patientName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Address</div>
                        <div className="text-sm text-gray-700">{currentVisit.patientAddress}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Visit Notes (Optional)</Label>
                    <Textarea
                      value={visitNotes}
                      onChange={(e) => setVisitNotes(e.target.value)}
                      placeholder="Add notes about this visit..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg" 
                      onClick={endVisit}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Complete Visit
                        </>
                      )}
                    </Button>
                    <Button 
                      className="flex-1 h-12 text-base font-semibold" 
                      variant="outline"
                      onClick={() => setShowCancelDialog(true)}
                      disabled={isLoading}
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Cancel Visit
                    </Button>
                  </div>
                  
                  {/* Cancel Dialog */}
                  {showCancelDialog && (
                    <Card className="border-2 border-red-200 shadow-lg">
                      <CardHeader className="bg-red-50 border-b border-red-200">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-bold text-red-800 flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            Cancel Visit
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowCancelDialog(false)
                              setCancelReason('')
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-5 space-y-4">
                        <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-2 block">Reason for Cancellation *</Label>
                          <Textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Enter reason for cancelling this visit..."
                            rows={4}
                            className="resize-none"
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="destructive"
                            className="flex-1 h-11 font-semibold"
                            onClick={cancelVisit}
                            disabled={isLoading || !cancelReason.trim()}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <XCircle className="h-5 w-5 mr-2" />
                                Confirm Cancellation
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 h-11 font-semibold"
                            onClick={() => {
                              setShowCancelDialog(false)
                              setCancelReason('')
                            }}
                            disabled={isLoading}
                          >
                            Go Back
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
