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
import { MapPin, Navigation, Play, Square, Clock, Users, CheckCircle, AlertCircle, Loader2, DollarSign, Route } from "lucide-react"
import { useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

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
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [tripStats, setTripStats] = useState<{ distance: number; cost: number; costPerMile: number } | null>(null)
  const [staffCostPerMile, setStaffCostPerMile] = useState<number>(0.67)
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
        // Validate that we got device GPS coordinates (not IP-based)
        const accuracy = position.coords.accuracy || 0
        
        // IP-based location typically has accuracy > 1000 meters
        // Device GPS should have accuracy < 100 meters (usually 5-50m)
        if (accuracy > 1000) {
          console.warn('Location accuracy is low - may be using IP geolocation instead of device GPS')
          toast({
            title: "Low Accuracy Warning",
            description: "Location accuracy is low. Please ensure GPS is enabled on your device.",
            variant: "destructive"
          })
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
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
        setLocation(newLocation)
        setLocationError(null)
        setLastUpdateTime(new Date())
        
        // Validate GPS accuracy - warn if IP-based location (accuracy > 1000m)
        if (newLocation.accuracy && newLocation.accuracy > 1000) {
          console.warn('Low GPS accuracy detected - may be using IP geolocation. Accuracy:', newLocation.accuracy)
          // Set error state to inform user
          setLocationError(`Low accuracy (${newLocation.accuracy.toFixed(0)}m) - Enable device GPS for accurate tracking`)
          // Don't update location if accuracy is too low - wait for device GPS
          return
        } else {
          // Clear error if we have good GPS
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
  useEffect(() => {
    if (isTracking && currentTrip && location) {
      // Start periodic updates every 15 seconds for real-time tracking during driving
      updateIntervalRef.current = setInterval(() => {
        if (location) {
          updateLocation()
        }
      }, 15000) // 15 seconds - more frequent updates while driving
      
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
  }, [isTracking, currentTrip?.id, location])

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
    if (!currentTrip) return

    if (currentVisit) {
      toast({
        title: "Active Visit",
        description: "Please end the current visit before ending the trip.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      const res = await fetch('/api/gps/end-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: currentTrip.id,
          latitude: location?.lat,
          longitude: location?.lng
        })
      })

      const data = await res.json()
      if (data.success) {
        setTripStats({
          distance: data.trip.totalDistance || 0,
          cost: data.trip.totalCost || 0,
          costPerMile: data.trip.costPerMile || 0.67
        })
        setCurrentTrip(null)
        setCurrentVisit(null)
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
    if (!currentTrip) {
      alert('Please start a trip first')
      return
    }

    if (!visitForm.patientName || !visitForm.patientAddress) {
      alert('Please fill in patient name and address')
      return
    }

    try {
      const res = await fetch('/api/visits/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          tripId: currentTrip.id,
          patientName: visitForm.patientName,
          patientAddress: visitForm.patientAddress,
          visitType: visitForm.visitType,
          latitude: location?.lat,
          longitude: location?.lng
        })
      })

      const data = await res.json()
      if (data.success) {
        setCurrentVisit(data.visit)
        setVisitForm({ patientName: '', patientAddress: '', visitType: 'Wound Care' })
        toast({
          title: "Visit Started",
          description: `Visit to ${data.visit.patientName} has started.`,
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Navigation className="h-5 w-5 mr-2" />
              GPS Tracking
            </CardTitle>
            <CardDescription>Track your trips and visits with real-time GPS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location Status */}
            <div className="p-3 bg-gray-100 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Current Location</span>
                <Button size="sm" variant="outline" onClick={() => getCurrentLocation()} disabled={isLoading}>
                  <MapPin className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
              {location ? (
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="font-medium">Lat:</span> {location.lat.toFixed(6)}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Lng:</span> {location.lng.toFixed(6)}
                  </div>
                  {location.accuracy && (
                    <div className="text-xs text-gray-500">
                      Accuracy: ±{location.accuracy.toFixed(0)}m
                    </div>
                  )}
                  {lastUpdateTime && (
                    <div className="text-xs text-gray-500">
                      Updated: {lastUpdateTime.toLocaleTimeString()}
                    </div>
                  )}
                  {isTracking && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 mt-2">
                      <Clock className="h-3 w-3 mr-1" />
                      Tracking Active
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Getting location...
                </div>
              )}
              {locationError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{locationError}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Trip Controls */}
            <div className="space-y-2">
              <Label>Trip Status</Label>
              {!currentTrip ? (
                <Button 
                  className="w-full" 
                  onClick={startTrip} 
                  disabled={!location || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Trip
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <Badge className="bg-blue-500 text-white">Trip Active</Badge>
                        {isTracking && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 ml-2">
                            <Clock className="h-3 w-3 mr-1" />
                            GPS Active
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Started: {new Date(currentTrip.startTime).toLocaleString()}</div>
                      {currentTrip.startTime && (
                        <div>
                          Duration: {Math.round((new Date().getTime() - new Date(currentTrip.startTime).getTime()) / 60000)} minutes
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Real-time Trip Stats */}
                  {currentTrip && !tripStats && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 mt-2">
                      <div className="text-xs font-medium text-purple-800 mb-2 flex items-center">
                        <Route className="h-3 w-3 mr-1" />
                        Current Trip Stats
                      </div>
                      <div className="text-xs text-gray-700 space-y-1">
                        <div className="flex justify-between">
                          <span>Cost per Mile:</span>
                          <span className="font-medium">${staffCostPerMile.toFixed(2)}</span>
                        </div>
                        <div className="text-gray-500 italic">
                          Cost will be calculated when trip ends
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Trip Summary (after trip ends) */}
                  {tripStats && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200 mt-2">
                      <div className="text-xs font-medium text-green-800 mb-1 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Trip Summary
                      </div>
                      <div className="text-xs text-gray-700 space-y-1">
                        <div className="flex justify-between">
                          <span>Distance:</span>
                          <span className="font-medium">{tripStats.distance.toFixed(2)} miles</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cost per Mile:</span>
                          <span className="font-medium">${tripStats.costPerMile.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-green-200">
                          <span className="font-semibold">Total Cost:</span>
                          <span className="font-bold text-green-700">${tripStats.cost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={endTrip}
                    disabled={isLoading || !!currentVisit}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Ending...
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        End Trip
                      </>
                    )}
                  </Button>
                  {currentVisit && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Please end the current visit before ending the trip.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Visit Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Patient Visit
            </CardTitle>
            <CardDescription>Track patient visits during your trip</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!currentVisit ? (
              <>
                <div>
                  <Label>Patient Name *</Label>
                  <Input
                    value={visitForm.patientName}
                    onChange={(e) => setVisitForm({ ...visitForm, patientName: e.target.value })}
                    placeholder="Enter patient name"
                  />
                </div>
                <div>
                  <Label>Patient Address *</Label>
                  <Input
                    value={visitForm.patientAddress}
                    onChange={(e) => setVisitForm({ ...visitForm, patientAddress: e.target.value })}
                    placeholder="Enter address"
                  />
              </div>
                <div>
                  <Label>Visit Type</Label>
                  <Select value={visitForm.visitType} onValueChange={(v) => setVisitForm({ ...visitForm, visitType: v })}>
                    <SelectTrigger>
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
                  className="w-full" 
                  onClick={startVisit} 
                  disabled={!currentTrip || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Visit
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-green-500">Visit In Progress</Badge>
                    <div className="text-xs text-gray-600">
                      Started: {new Date(currentVisit.startTime).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="font-medium">{currentVisit.patientName}</div>
                  <div className="text-sm text-gray-600">{currentVisit.patientAddress}</div>
              </div>
                <div>
                  <Label>Visit Notes (Optional)</Label>
                  <Textarea
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    placeholder="Add notes about this visit..."
                    rows={3}
                  />
                </div>
                <Button 
                  className="w-full" 
                  variant="destructive" 
                  onClick={endVisit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ending...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      End Visit
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
