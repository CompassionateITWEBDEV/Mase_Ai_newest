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
import { MapPin, Navigation, Play, Square, Clock, Users, CheckCircle, AlertCircle, Loader2, DollarSign, Route, XCircle, Gauge, Compass, Activity, Zap, Calendar, Stethoscope, Video } from "lucide-react"
import { useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import TrackMapView from "@/components/track-map-view"
import { ConsultationRequestDialog } from "@/components/telehealth/ConsultationRequestDialog"
import { PeerJSVideoCall } from "@/components/telehealth/PeerJSVideoCall"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

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
  const [routePoints, setRoutePoints] = useState<Array<{ lat: number; lng: number; timestamp: string; speed?: number }>>([])
  const [tripMetrics, setTripMetrics] = useState<{ distance: number; avgSpeed: number; maxSpeed: number; duration: number } | null>(null)
  const [scheduledAppointments, setScheduledAppointments] = useState<any[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)
  const [patientLocations, setPatientLocations] = useState<Array<{ id: string; name: string; address: string; lat: number; lng: number; visitType?: string; scheduledTime?: string }>>([])
  const [visitDuration, setVisitDuration] = useState<number>(0) // Current visit duration in minutes
  const { toast } = useToast()
  
  // Telehealth consultation states
  const [showConsultDialog, setShowConsultDialog] = useState(false)
  const [activeConsultation, setActiveConsultation] = useState<any>(null)
  const [activeConsultationId, setActiveConsultationId] = useState<string>('')
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [videoSession, setVideoSession] = useState<any>(null)
  const [staffName, setStaffName] = useState<string>('')
  
  // Update visit duration in real-time
  useEffect(() => {
    if (!currentVisit || !currentVisit.startTime) {
      setVisitDuration(0)
      return
    }
    
    // Calculate initial duration
    const calculateDuration = () => {
      const startTime = new Date(currentVisit.startTime)
      const now = new Date()
      const minutes = Math.max(0, Math.round((now.getTime() - startTime.getTime()) / 60000))
      setVisitDuration(minutes)
    }
    
    // Calculate immediately
    calculateDuration()
    
    // Update every 10 seconds for real-time display (more frequent for better UX)
    const interval = setInterval(calculateDuration, 10000) // Update every 10 seconds
    
    return () => clearInterval(interval)
  }, [currentVisit])

  // Fetch staff cost per mile and name
  useEffect(() => {
    const fetchStaffData = async () => {
      if (!staffId) return

      try {
        const res = await fetch(`/api/staff/get-cost-per-mile?staff_id=${staffId}`)
        const data = await res.json()
        if (data.success && data.costPerMile) {
          setStaffCostPerMile(data.costPerMile)
        }
        
        // Fetch staff name
        const staffRes = await fetch(`/api/staff?id=${staffId}`)
        const staffData = await staffRes.json()
        console.log('✅ [TRACK] Staff data loaded:', staffData)
        if (staffData.success && staffData.staff) {
          console.log('✅ [TRACK] Setting staff name:', staffData.staff.name)
          setStaffName(staffData.staff.name || 'Nurse')
        } else {
          console.warn('⚠️ [TRACK] Staff data not found or incomplete:', staffData)
          console.warn('⚠️ [TRACK] Staff ID:', staffId)
          setStaffName('Nurse')
        }
      } catch (e) {
        console.error('❌ [TRACK] Error fetching staff data:', e)
        // Use defaults if fetch fails
        setStaffName('Nurse')
      }
    }

    fetchStaffData()
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
            console.log('✅ [TRACK] Active visit loaded:', visitData.visit)
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

  // Geocode patient address
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!address || address === "Home Visit") return null
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MASE-AI-Intelligence/1.0'
          }
        }
      )
      
      if (!response.ok) return null
      
      const data = await response.json()
      if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        }
      }
    } catch (e) {
      console.error('Error geocoding address:', e)
    }
    return null
  }

  // Fetch scheduled appointments and geocode addresses
  useEffect(() => {
    const fetchScheduledAppointments = async () => {
      if (!staffId) return

      setLoadingAppointments(true)
      try {
        const res = await fetch(`/api/visits/scheduled?staff_id=${staffId}`)
        const data = await res.json()
        if (data.success) {
          const appointments = data.appointments || []
          setScheduledAppointments(appointments)
          
          // Geocode patient addresses for map display
          const locations: Array<{ id: string; name: string; address: string; lat: number; lng: number; visitType?: string; scheduledTime?: string }> = []
          
          for (const appointment of appointments) {
            console.log('🔍 Processing appointment:', appointment.patient_name, {
              hasVisitLocation: !!appointment.visit_location,
              visitLocation: appointment.visit_location,
              patientAddress: appointment.patient_address
            })
            
            // Priority 1: Use live patient location if available (from location sharing)
            if (appointment.visit_location && appointment.visit_location.lat && appointment.visit_location.lng) {
              // Check if it's a live location (from patient device)
              const locationTimestamp = appointment.visit_location.timestamp 
                ? new Date(appointment.visit_location.timestamp).getTime() 
                : null
              const isRecent = locationTimestamp && (Date.now() - locationTimestamp < 600000) // Within last 10 minutes
              const isLiveLocation = appointment.visit_location.source === 'patient_live_location' || 
                                    (isRecent && !appointment.visit_location.address) // Recent and no address = live
              
              if (isLiveLocation) {
                // Use live location from patient device
                console.log('✅ Using LIVE patient location for:', appointment.patient_name, {
                  lat: appointment.visit_location.lat,
                  lng: appointment.visit_location.lng,
                  accuracy: appointment.visit_location.accuracy,
                  timestamp: appointment.visit_location.timestamp
                })
                locations.push({
                  id: appointment.id,
                  name: appointment.patient_name,
                  address: appointment.patient_address,
                  lat: appointment.visit_location.lat,
                  lng: appointment.visit_location.lng,
                  visitType: appointment.visit_type,
                  scheduledTime: appointment.scheduled_time,
                  isLiveLocation: true
                })
                continue // Skip geocoding if we have live location
              } else {
                // Use geocoded address location (fallback)
                console.log('✅ Using geocoded address location for:', appointment.patient_name)
                locations.push({
                  id: appointment.id,
                  name: appointment.patient_name,
                  address: appointment.patient_address,
                  lat: appointment.visit_location.lat,
                  lng: appointment.visit_location.lng,
                  visitType: appointment.visit_type,
                  scheduledTime: appointment.scheduled_time,
                  isLiveLocation: false
                })
                continue
              }
            }
            
            // Priority 2: Geocode address if no live location available
            if (appointment.patient_address && appointment.patient_address !== "Home Visit") {
              console.log('🔄 Geocoding address for:', appointment.patient_name, appointment.patient_address)
              // Geocode the address
              const coords = await geocodeAddress(appointment.patient_address)
              if (coords) {
                console.log('✅ Geocoded successfully:', coords)
                locations.push({
                  id: appointment.id,
                  name: appointment.patient_name,
                  address: appointment.patient_address,
                  lat: coords.lat,
                  lng: coords.lng,
                  visitType: appointment.visit_type,
                  scheduledTime: appointment.scheduled_time,
                  isLiveLocation: false
                })
              } else {
                console.warn('⚠️ Failed to geocode address for:', appointment.patient_name)
              }
              // Add delay to respect Nominatim rate limit (1 req/sec)
              await new Promise(resolve => setTimeout(resolve, 1100))
            } else {
              console.warn('⚠️ No address to geocode for:', appointment.patient_name, '- Address:', appointment.patient_address)
            }
          }
          
          console.log('📊 Final patient locations:', locations.map(l => ({
            name: l.name,
            lat: l.lat,
            lng: l.lng,
            hasCoords: !!(l.lat && l.lng)
          })))
          
          // Merge with existing locations to prevent losing patient markers
          setPatientLocations(prev => {
            const existingMap = new Map(prev.map(p => [p.id, p]))
            
            // Update or add new locations
            locations.forEach(loc => {
              if (loc.lat && loc.lng) {
                existingMap.set(loc.id, loc)
              }
            })
            
            const merged = Array.from(existingMap.values())
            console.log('🔄 Merged patient locations:', {
              previous: prev.length,
              new: locations.length,
              merged: merged.length
            })
            return merged
          })
        }
      } catch (e) {
        console.error('Error fetching scheduled appointments:', e)
      } finally {
        setLoadingAppointments(false)
      }
    }

    fetchScheduledAppointments()
    // Refresh every 10 seconds to get live patient location updates more frequently
    const interval = setInterval(fetchScheduledAppointments, 10000)
    return () => clearInterval(interval)
  }, [staffId])
  
  // Effect to update patient location when appointment is selected - FORCE UPDATE
  useEffect(() => {
    if (!selectedAppointment || !staffId) {
      console.log('⚠️ Cannot refresh patient location:', { hasAppointment: !!selectedAppointment, hasStaffId: !!staffId })
      return
    }
    
    console.log('🔄 Refreshing patient location for selected appointment:', selectedAppointment.patient_name, selectedAppointment.id)
    
    const refreshPatientLocation = async () => {
      try {
        // First, try to get patient's live location from the location API
        console.log('📍 Fetching patient live location from API...')
        const locationRes = await fetch(`/api/patients/location?patient_name=${encodeURIComponent(selectedAppointment.patient_name)}`)
        const locationData = await locationRes.json()
        
        if (locationData.success && locationData.location && locationData.location.lat && locationData.location.lng) {
          console.log('✅ Found live patient location:', locationData.location)
          
          setPatientLocations(prev => {
            const updated = [...prev]
            const existingIndex = updated.findIndex(p => p.id === selectedAppointment.id)
            
            const locationInfo = {
              id: selectedAppointment.id,
              name: selectedAppointment.patient_name,
              address: selectedAppointment.patient_address,
              lat: locationData.location.lat,
              lng: locationData.location.lng,
              visitType: selectedAppointment.visit_type,
              scheduledTime: selectedAppointment.scheduled_time,
              isLiveLocation: locationData.location.source === 'patient_live_location' || 
                            (locationData.location.timestamp && 
                             new Date(locationData.location.timestamp).getTime() > Date.now() - 600000)
            }
            
            if (existingIndex >= 0) {
              updated[existingIndex] = locationInfo
            } else {
              updated.push(locationInfo)
            }
            
            console.log('✅✅✅ Patient location added to map:', locationInfo)
            return updated
          })
          return // Success, exit early
        }
        
        // Fallback: Try to get from scheduled appointments
        console.log('📍 Live location not found, trying scheduled appointments...')
        const res = await fetch(`/api/visits/scheduled?staff_id=${staffId}`)
        const data = await res.json()
        console.log('📥 Fetched appointments:', data.success, data.appointments?.length)
        
        if (data.success && data.appointments) {
          const updatedAppointment = data.appointments.find((a: any) => a.id === selectedAppointment.id)
          console.log('🔍 Found appointment:', updatedAppointment ? 'YES' : 'NO', {
            appointmentId: selectedAppointment.id,
            hasVisitLocation: !!updatedAppointment?.visit_location,
            visitLocation: updatedAppointment?.visit_location
          })
          
          if (updatedAppointment) {
            // Try to get location from visit_location first
            let patientLat = null
            let patientLng = null
            let isLive = false
            
            if (updatedAppointment.visit_location && updatedAppointment.visit_location.lat && updatedAppointment.visit_location.lng) {
              patientLat = updatedAppointment.visit_location.lat
              patientLng = updatedAppointment.visit_location.lng
              isLive = updatedAppointment.visit_location.source === 'patient_live_location' || 
                      (updatedAppointment.visit_location.timestamp && 
                       new Date(updatedAppointment.visit_location.timestamp).getTime() > Date.now() - 600000)
              console.log('✅ Using visit_location:', { lat: patientLat, lng: patientLng, isLive })
            } else if (updatedAppointment.patient_address && updatedAppointment.patient_address !== "Home Visit") {
              // If no visit_location, try to geocode the address with better error handling
              console.log('🔄 Geocoding address for selected patient:', updatedAppointment.patient_address)
              try {
                const coords = await geocodeAddress(updatedAppointment.patient_address)
                if (coords) {
                  patientLat = coords.lat
                  patientLng = coords.lng
                  console.log('✅ Geocoded address successfully:', coords)
                } else {
                  console.warn('⚠️ Geocoding returned null for:', updatedAppointment.patient_address)
                }
              } catch (geoError) {
                console.error('❌ Geocoding error:', geoError)
              }
            }
            
            if (patientLat && patientLng) {
              setPatientLocations(prev => {
                const updated = [...prev]
                const existingIndex = updated.findIndex(p => p.id === selectedAppointment.id)
                
                const locationData = {
                  id: selectedAppointment.id,
                  name: selectedAppointment.patient_name,
                  address: selectedAppointment.patient_address,
                  lat: patientLat,
                  lng: patientLng,
                  visitType: selectedAppointment.visit_type,
                  scheduledTime: selectedAppointment.scheduled_time,
                  isLiveLocation: isLive
                }
                
                if (existingIndex >= 0) {
                  updated[existingIndex] = locationData
                  console.log('✅ Updated existing patient location (will persist):', locationData)
                } else {
                  updated.push(locationData)
                  console.log('✅ Added new patient location (will persist):', locationData)
                }
                
                return updated // Return updated array - this ensures it persists
              })
            } else {
              console.warn('⚠️ No coordinates found for patient:', selectedAppointment.patient_name)
            }
          }
        }
      } catch (e) {
        console.error('❌ Error refreshing patient location:', e)
      }
    }
    
    refreshPatientLocation()
  }, [selectedAppointment?.id, staffId])

  // Get current location from device GPS (not IP geolocation) - Enhanced for accuracy
  const getCurrentLocation = (options?: PositionOptions) => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      toast({
        title: "Not Supported",
        description: "Your browser does not support geolocation. Please use a modern browser with GPS support.",
        variant: "destructive"
      })
      return
    }

    // Show loading state
    setIsLoading(true)
    setLocationError(null)

    // Force device GPS with high accuracy - NOT IP-based location
    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true, // Use GPS, not IP/WiFi triangulation
      timeout: 30000, // Increased timeout for better GPS acquisition
      maximumAge: 0 // Don't use cached location - get fresh GPS reading
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLoading(false)
        
        // Validate location accuracy
        const accuracy = position.coords.accuracy || 0
        const speed = position.coords.speed ? position.coords.speed * 2.237 : null // Convert m/s to mph
        const heading = position.coords.heading !== null && position.coords.heading !== undefined ? position.coords.heading : null
        
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
          toast({
            title: "Location Updated",
            description: `Location refreshed (WiFi-based, ${accuracy.toFixed(0)}m accuracy). For better accuracy, use a mobile device with GPS.`,
            variant: "default"
          })
        } else if (accuracy <= 100) {
          // Good GPS accuracy
          console.info('Device GPS detected - excellent accuracy')
          toast({
            title: "Location Updated",
            description: `GPS location refreshed successfully (${accuracy.toFixed(0)}m accuracy)`,
            variant: "default"
          })
        } else {
          // Medium accuracy (100-1000m)
          toast({
            title: "Location Updated",
            description: `Location refreshed (${accuracy.toFixed(0)}m accuracy)`,
            variant: "default"
          })
        }

        // Verify coordinates are valid (not 0,0 or null)
        if (!position.coords.latitude || !position.coords.longitude) {
          setLocationError("Invalid GPS coordinates received")
          toast({
            title: "Invalid Location",
            description: "Received invalid GPS coordinates. Please try again.",
            variant: "destructive"
          })
          return
        }

        // Update location with all available data
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: accuracy,
          speed: speed,
          heading: heading
        }
        
        setLocation(newLocation)
        setLocationError(null)
        setLastUpdateTime(new Date())
        
        // If tracking is active, add this point to route points
        if (isTracking && currentTrip) {
          setRoutePoints(prev => {
            const updatedPoints = [...prev, {
              lat: newLocation.lat,
              lng: newLocation.lng,
              timestamp: new Date().toISOString(),
              speed: speed || undefined
            }]
            
            // Calculate trip metrics using the same logic as end-trip API (matches staff-performance)
            if (updatedPoints.length > 1) {
              let totalDistance = 0
              
              // Calculate distance from route points (same as end-trip API)
              for (let i = 1; i < updatedPoints.length; i++) {
                const prevPoint = updatedPoints[i - 1]
                const currPoint = updatedPoints[i]
                
                // Calculate distance using Haversine formula (same as end-trip API)
                const R = 3959 // Earth radius in miles
                const dLat = (currPoint.lat - prevPoint.lat) * Math.PI / 180
                const dLon = (currPoint.lng - prevPoint.lng) * Math.PI / 180
                const a = 
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(prevPoint.lat * Math.PI / 180) * Math.cos(currPoint.lat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2)
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
                const segmentDistance = R * c
                
                // Filter out idle time and GPS drift (same logic as end-trip API)
                // Only count if:
                // 1. Speed > 5 mph (definitely driving), OR
                // 2. No speed data but distance > 0.01 miles (significant movement)
                const hasValidSpeed = currPoint.speed && currPoint.speed > 5
                const hasNoSpeedData = !currPoint.speed
                
                if (hasValidSpeed || (hasNoSpeedData && segmentDistance > 0.01)) {
                  totalDistance += segmentDistance
                }
              }
              
              // Calculate speeds (filter valid speeds)
              const speeds = updatedPoints
                .filter(p => (p as any).speed !== undefined && (p as any).speed !== null && (p as any).speed > 0)
                .map(p => (p as any).speed)
              
              const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0
              const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0
              
              const duration = currentTrip.startTime 
                ? Math.round((new Date().getTime() - new Date(currentTrip.startTime).getTime()) / 60000)
                : 0
              
              setTripMetrics({
                distance: parseFloat(totalDistance.toFixed(2)), // Same format as end-trip API
                avgSpeed: parseFloat(avgSpeed.toFixed(1)),
                maxSpeed: parseFloat(maxSpeed.toFixed(1)),
                duration
              })
            } else if (updatedPoints.length === 1) {
              // First point - initialize with 0 distance
              setTripMetrics({
                distance: 0,
                avgSpeed: speed || 0,
                maxSpeed: speed || 0,
                duration: currentTrip.startTime 
                  ? Math.round((new Date().getTime() - new Date(currentTrip.startTime).getTime()) / 60000)
                  : 0
              })
            }
            
            return updatedPoints
          })
        }
        
        // If watching position is active, restart it to ensure continuous updates
        if (isTracking && watchIdRef.current === null) {
          startWatchingPosition()
        }
      },
      (error) => {
        setIsLoading(false)
        let errorMessage = "Unable to get device GPS location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser settings to use device GPS."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Device GPS is unavailable. Please check your device's location settings and ensure GPS is enabled."
            break
          case error.TIMEOUT:
            errorMessage = "GPS signal timeout. Please ensure you have a clear view of the sky for better GPS accuracy. Try again in a moment."
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
          setRoutePoints(prev => {
            const updatedPoints = [...prev, {
              lat: newLocation.lat,
              lng: newLocation.lng,
              timestamp: new Date().toISOString(),
              speed: speed || undefined
            }]
            
            // Calculate trip metrics using the same logic as end-trip API (matches staff-performance)
            if (updatedPoints.length > 1) {
              let totalDistance = 0
              
              // Calculate distance from route points (same as end-trip API)
              for (let i = 1; i < updatedPoints.length; i++) {
                const prevPoint = updatedPoints[i - 1]
                const currPoint = updatedPoints[i]
                
                // Calculate distance using Haversine formula (same as end-trip API)
                const R = 3959 // Earth radius in miles
                const dLat = (currPoint.lat - prevPoint.lat) * Math.PI / 180
                const dLon = (currPoint.lng - prevPoint.lng) * Math.PI / 180
                const a = 
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(prevPoint.lat * Math.PI / 180) * Math.cos(currPoint.lat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2)
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
                const segmentDistance = R * c
                
                // Filter out idle time and GPS drift (same logic as end-trip API)
                // Only count if:
                // 1. Speed > 5 mph (definitely driving), OR
                // 2. No speed data but distance > 0.01 miles (significant movement)
                const hasValidSpeed = currPoint.speed && currPoint.speed > 5
                const hasNoSpeedData = !currPoint.speed
                
                if (hasValidSpeed || (hasNoSpeedData && segmentDistance > 0.01)) {
                  totalDistance += segmentDistance
                }
              }
              
              // Calculate speeds (filter valid speeds)
              const speeds = updatedPoints
                .filter(p => (p as any).speed !== undefined && (p as any).speed !== null && (p as any).speed > 0)
                .map(p => (p as any).speed)
              
              const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0
              const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0
              
              const duration = currentTrip.startTime 
                ? Math.round((new Date().getTime() - new Date(currentTrip.startTime).getTime()) / 60000)
                : 0
              
              setTripMetrics({
                distance: parseFloat(totalDistance.toFixed(2)), // Same format as end-trip API
                avgSpeed: parseFloat(avgSpeed.toFixed(1)),
                maxSpeed: parseFloat(maxSpeed.toFixed(1)),
                duration
              })
            } else if (updatedPoints.length === 1) {
              // First point - initialize with 0 distance
              setTripMetrics({
                distance: 0,
                avgSpeed: speed || 0,
                maxSpeed: speed || 0,
                duration: currentTrip.startTime 
                  ? Math.round((new Date().getTime() - new Date(currentTrip.startTime).getTime()) / 60000)
                  : 0
              })
            }
            
            return updatedPoints
          })
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

  // Select appointment to start trip - immediately show on map with road route
  const selectAppointment = (appointment: any) => {
    console.log('🎯 SELECTING APPOINTMENT:', {
      patientName: appointment.patient_name,
      appointmentId: appointment.id,
      patientAddress: appointment.patient_address,
      hasVisitLocation: !!appointment.visit_location
    })
    
    setSelectedAppointment(appointment)
    
    // Check if patient location already exists
    const existingLocation = patientLocations.find(p => p.id === appointment.id)
    console.log('📍 Existing patient location:', existingLocation ? {
      name: existingLocation.name,
      lat: existingLocation.lat,
      lng: existingLocation.lng
    } : 'NOT FOUND')
    
    // Show toast
    if (existingLocation && existingLocation.lat && existingLocation.lng) {
      toast({
        title: "Appointment Selected",
        description: `Selected ${appointment.patient_name}. Road route will appear on map.`,
      })
    } else {
      toast({
        title: "Appointment Selected",
        description: `Selected ${appointment.patient_name}. Loading patient location...`,
      })
    }
  }

  // Start trip to selected appointment
  const startTripToAppointment = async () => {
    if (!selectedAppointment) {
      toast({
        title: "No Appointment Selected",
        description: "Please select an appointment first",
        variant: "destructive"
      })
      return
    }

    if (!location) {
      toast({
        title: "Location Required",
        description: "Please enable GPS location to start the trip",
        variant: "destructive"
      })
      return
    }

    // Start the trip (same as regular startTrip but with appointment context)
    await startTrip()
  }

  // Start visit after ending trip (for selected appointment)
  const startVisitForSelectedAppointment = async () => {
    if (!selectedAppointment) {
      toast({
        title: "No Appointment Selected",
        description: "Please select an appointment first",
        variant: "destructive"
      })
      return
    }

    if (!location) {
      toast({
        title: "Location Required",
        description: "Please enable GPS location to start the visit",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      const res = await fetch('/api/visits/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          tripId: currentTrip?.id || null,
          patientName: selectedAppointment.patient_name,
          patientAddress: selectedAppointment.patient_address,
          visitType: selectedAppointment.visit_type,
          scheduledVisitId: selectedAppointment.id,
          latitude: location.lat,
          longitude: location.lng,
          driveTimeFromLastTrip: lastTripDuration
        })
      })

      const data = await res.json()
      if (data.success) {
        console.log('✅ [VISIT START] Visit started, data received:', data.visit)
        setCurrentVisit(data.visit)
        setSelectedAppointment(null) // Clear selection after starting visit
        // Refresh scheduled appointments list
        const refreshRes = await fetch(`/api/visits/scheduled?staff_id=${staffId}`)
        const refreshData = await refreshRes.json()
        if (refreshData.success) {
          setScheduledAppointments(refreshData.appointments || [])
        }
        toast({
          title: "Visit Started",
          description: `Visit to ${selectedAppointment.patient_name} has started`,
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
    } finally {
      setIsLoading(false)
    }
  }

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
        console.log('✅ [MANUAL VISIT] Visit started, data received:', data.visit)
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

  // Telehealth consultation handlers
  const handleConsultationCreated = async (consultationId: string) => {
    console.log('🩺 [NURSE] Consultation created:', consultationId)
    setActiveConsultationId(consultationId)
    setActiveConsultation({ id: consultationId, status: 'pending' })
    
    // Poll for doctor acceptance
    console.log('🔄 [NURSE] Starting to poll for doctor acceptance...')
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/telehealth/consultation?status=accepted&nurseId=${staffId}`)
        const data = await response.json()
        
        if (data.success && data.consultations.length > 0) {
          const accepted = data.consultations.find((c: any) => c.id === consultationId && c.status === 'accepted')
          
          if (accepted) {
            console.log('✅ [NURSE] Doctor accepted consultation!', accepted)
            clearInterval(pollInterval)
            setActiveConsultation(accepted)
            
            // With PeerJS, no need to fetch session
            // Just open the video call and PeerJS will connect
            console.log('🎥 [NURSE] Starting PeerJS video call...')
            setShowVideoCall(true)
            
            toast({
              title: "Doctor Accepted!",
              description: `Dr. ${accepted.doctor_name} has joined the consultation`,
            })
          }
        }
      } catch (error) {
        console.error('❌ [NURSE] Poll error:', error)
      }
    }, 3000) // Poll every 3 seconds
    
    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000)
  }
  
  const handleVideoCallEnd = async () => {
    setShowVideoCall(false)
    setVideoSession(null)
    
    // Mark consultation as completed
    if (activeConsultationId) {
      await fetch('/api/telehealth/consultation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultationId: activeConsultationId,
          action: 'complete'
        })
      })
    }
    
    setActiveConsultation(null)
    setActiveConsultationId('')
    
    toast({
      title: "Consultation Ended",
      description: "Video call has been completed",
    })
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
        setSelectedAppointment(null) // Clear selection after visit ends
        // Refresh scheduled appointments list
        const refreshRes = await fetch(`/api/visits/scheduled?staff_id=${staffId}`)
        const refreshData = await refreshRes.json()
        if (refreshData.success) {
          setScheduledAppointments(refreshData.appointments || [])
        }
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
        setSelectedAppointment(null) // Clear selection after visit cancelled
        // Refresh scheduled appointments list
        const refreshRes = await fetch(`/api/visits/scheduled?staff_id=${staffId}`)
        const refreshData = await refreshRes.json()
        if (refreshData.success) {
          setScheduledAppointments(refreshData.appointments || [])
        }
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
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-4 lg:pb-8 ml-0 lg:ml-0">
      {/* Enhanced Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-md sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
                    <Navigation className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  GPS Tracking Dashboard
                </h1>
                <div className="text-xs sm:text-sm text-gray-600 mt-2 ml-0 sm:ml-14 flex items-center gap-2">
                  <span>Real-time location tracking with high-precision GPS technology</span>
                  {location && (
                    <Badge variant="outline" className="text-xs border-green-500 text-green-700 bg-green-50">
                      <div className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                      Connected
                    </Badge>
                  )}
                </div>
            </div>
            {isTracking && (
              <div className="flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-md">
                <div className="relative">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 h-3 w-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-sm font-semibold text-green-700">Live Tracking Active</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Enhanced Map Section - Professional Layout */}
        <Card className="shadow-2xl border-0 overflow-hidden hover:shadow-3xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-4 sm:p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3 mb-2 drop-shadow-lg">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    Live Location Map
                  </CardTitle>
                  <CardDescription className="text-blue-100 text-sm sm:text-base font-medium">
                    Interactive real-time GPS tracking with route visualization
                  </CardDescription>
                </div>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={() => getCurrentLocation()} 
                disabled={isLoading}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Refresh Location
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
            <CardContent className="p-0">
              {location ? (
                <div className="h-[300px] sm:h-[400px] lg:h-[450px] relative">
                <TrackMapView
                  currentLocation={{
                    ...location,
                    timestamp: lastUpdateTime || undefined
                  }}
                  routePoints={routePoints}
                  isTracking={isTracking}
                  patientLocations={patientLocations}
                  selectedPatientId={selectedAppointment?.id || null}
                />
                {/* Enhanced Map Overlay Info */}
                <div className="absolute top-4 left-4 bg-white/98 backdrop-blur-md rounded-xl shadow-2xl p-4 border-2 border-gray-200/50 z-[1000] min-w-[200px]">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                    <div className={`h-3 w-3 rounded-full ${
                      location.accuracy && location.accuracy <= 100 ? 'bg-green-500' :
                      location.accuracy && location.accuracy <= 1000 ? 'bg-yellow-500' :
                      'bg-red-500'
                    } animate-pulse shadow-lg`}></div>
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">GPS Status</span>
                  </div>
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between items-center gap-4 p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-600 font-medium">Accuracy:</span>
                      <span className={`font-bold text-sm px-2 py-1 rounded ${
                        location.accuracy && location.accuracy <= 100 ? 'text-green-700 bg-green-100' :
                        location.accuracy && location.accuracy <= 1000 ? 'text-yellow-700 bg-yellow-100' :
                        'text-red-700 bg-red-100'
                      }`}>
                        ±{location.accuracy?.toFixed(0) || 'N/A'}m
                      </span>
                    </div>
                    {lastUpdateTime && (
                      <div className="flex justify-between items-center gap-4 p-2 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium">Updated:</span>
                        <span className="font-semibold text-gray-800">{lastUpdateTime.toLocaleTimeString()}</span>
                      </div>
                    )}
                    {location.speed !== undefined && location.speed !== null && (
                      <div className="flex justify-between items-center gap-4 p-2 bg-blue-50 rounded-lg">
                        <span className="text-gray-600 font-medium">Speed:</span>
                        <span className="font-bold text-blue-700">{location.speed.toFixed(1)} mph</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[450px] flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
                <div className="text-center p-8">
                  <div className="relative mb-6">
                    <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin className="h-8 w-8 text-blue-400 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-gray-700 font-bold text-lg mb-2">Acquiring GPS location...</p>
                  <p className="text-sm text-gray-500 font-medium">Please allow location access in your browser</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

          {/* Enhanced Real-time Metrics Grid */}
          {isTracking && location && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-green-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow-md">
                    <Gauge className="h-5 w-5 text-green-600" />
                  </div>
                  <Badge className="bg-green-500 text-white shadow-md animate-pulse">Live</Badge>
                </div>
                <div className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Current Speed</div>
                <div className="text-3xl sm:text-4xl font-bold text-green-700 flex items-baseline">
                  {location.speed ? `${location.speed.toFixed(1)}` : '0.0'}
                  <span className="text-base text-gray-500 ml-1.5 font-normal">mph</span>
                </div>
                {location.speed && location.speed > 0 && (
                  <div className="mt-2 text-xs text-green-600 font-medium">Moving</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-blue-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl shadow-md">
                    <Compass className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Heading</div>
                <div className="text-3xl sm:text-4xl font-bold text-blue-700 flex items-baseline">
                  {location.heading !== null && location.heading !== undefined 
                    ? `${Math.round(location.heading)}°` 
                    : 'N/A'}
                </div>
                {location.heading !== null && location.heading !== undefined && (
                  <div className="mt-2 text-xs text-blue-600 font-medium">
                    {location.heading >= 0 && location.heading < 45 ? 'North' :
                     location.heading >= 45 && location.heading < 135 ? 'East' :
                     location.heading >= 135 && location.heading < 225 ? 'South' :
                     location.heading >= 225 && location.heading < 315 ? 'West' : 'North'}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={`border-0 shadow-xl bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 ${
              location.accuracy && location.accuracy <= 100 ? 'border-green-500' :
              location.accuracy && location.accuracy <= 1000 ? 'border-yellow-500' :
              'border-red-500'
            }`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl shadow-md ${
                    location.accuracy && location.accuracy <= 100 ? 'bg-gradient-to-br from-green-100 to-emerald-100' :
                    location.accuracy && location.accuracy <= 1000 ? 'bg-gradient-to-br from-yellow-100 to-amber-100' :
                    'bg-gradient-to-br from-red-100 to-rose-100'
                  }`}>
                    <Activity className={`h-5 w-5 ${
                      location.accuracy && location.accuracy <= 100 ? 'text-green-600' :
                      location.accuracy && location.accuracy <= 1000 ? 'text-yellow-600' :
                      'text-red-600'
                    }`} />
                  </div>
                </div>
                <div className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">GPS Accuracy</div>
                <div className={`text-3xl sm:text-4xl font-bold flex items-baseline ${
                  location.accuracy && location.accuracy <= 100 ? 'text-green-700' :
                  location.accuracy && location.accuracy <= 1000 ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {location.accuracy ? `±${location.accuracy.toFixed(0)}` : 'N/A'}
                  <span className="text-base text-gray-500 ml-1.5 font-normal">m</span>
                </div>
                {location.accuracy && (
                  <div className={`mt-2 text-xs font-medium ${
                    location.accuracy <= 100 ? 'text-green-600' :
                    location.accuracy <= 1000 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {location.accuracy <= 100 ? 'Excellent' :
                     location.accuracy <= 1000 ? 'Good' :
                     'Poor'}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-orange-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl shadow-md">
                    <Route className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
                <div className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Distance Traveled</div>
                <div className="text-3xl sm:text-4xl font-bold text-orange-700 flex items-baseline">
                  {tripMetrics ? tripMetrics.distance.toFixed(2) : '0.00'}
                  <span className="text-base text-gray-500 ml-1.5 font-normal">mi</span>
                </div>
                {tripMetrics && tripMetrics.distance > 0 && (
                  <div className="mt-2 text-xs text-orange-600 font-medium">
                    {tripMetrics.duration} min active
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Trip Management Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="shadow-2xl border-0 hover:shadow-3xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative z-10">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-3 mb-2 drop-shadow-lg">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                    <Navigation className="h-5 w-5" />
                  </div>
                  Trip Management
                </CardTitle>
                <CardDescription className="text-indigo-100 font-medium">Track driving time, distance, and costs</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Enhanced Location Coordinates Display */}
              {location && (
                <div className="p-5 bg-gradient-to-br from-gray-50 via-white to-blue-50 rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">GPS Coordinates</span>
                    {isTracking && (
                      <Badge className="bg-green-500 text-white shadow-lg animate-pulse">
                        <Clock className="h-3 w-3 mr-1.5" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <span className="text-xs text-gray-500 font-medium block mb-1">Latitude</span>
                      <div className="font-mono font-bold text-gray-900 text-base">{location.lat.toFixed(6)}</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <span className="text-xs text-gray-500 font-medium block mb-1">Longitude</span>
                      <div className="font-mono font-bold text-gray-900 text-base">{location.lng.toFixed(6)}</div>
                    </div>
                  </div>
                  {locationError && (
                    <Alert variant="destructive" className="mt-4 border-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs font-medium">{locationError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Enhanced Trip Status */}
              {!currentTrip ? (
                <div className="space-y-4">
                  {selectedAppointment ? (
                    <div className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-300 shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-600 mb-1">Selected Appointment</div>
                          <div className="text-lg font-bold text-gray-900">{selectedAppointment.patient_name}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {selectedAppointment.patient_address}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAppointment(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Route Info Card - Like Grab/Food Delivery */}
                      {location && patientLocations.find(p => p.id === selectedAppointment.id) && (() => {
                        const patientLoc = patientLocations.find(p => p.id === selectedAppointment.id)
                        if (patientLoc && patientLoc.lat && patientLoc.lng) {
                          // Calculate distance
                          const R = 3959 // Earth radius in miles
                          const dLat = (patientLoc.lat - location.lat) * Math.PI / 180
                          const dLng = (patientLoc.lng - location.lng) * Math.PI / 180
                          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                    Math.cos(location.lat * Math.PI / 180) * Math.cos(patientLoc.lat * Math.PI / 180) *
                                    Math.sin(dLng/2) * Math.sin(dLng/2)
                          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
                          const distance = R * c
                          const etaMinutes = Math.round((distance / 30) * 60) // Assume 30 mph average
                          
                          return (
                            <div className="bg-white rounded-lg p-3 border-2 border-blue-400 shadow-md mt-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-center flex-1">
                                  <div className="text-xs text-gray-600 mb-1">Distance</div>
                                  <div className="text-xl font-bold text-blue-700">{distance.toFixed(1)} mi</div>
                                </div>
                                <div className="w-px h-12 bg-gray-300 mx-2"></div>
                                <div className="text-center flex-1">
                                  <div className="text-xs text-gray-600 mb-1">Est. Time</div>
                                  <div className="text-xl font-bold text-indigo-700">~{etaMinutes} min</div>
                                </div>
                                <div className="w-px h-12 bg-gray-300 mx-2"></div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    // Open in Google Maps for navigation
                                    const url = `https://www.google.com/maps/dir/?api=1&destination=${patientLoc.lat},${patientLoc.lng}`
                                    window.open(url, '_blank')
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                                >
                                  <Navigation className="h-4 w-4 mr-1" />
                                  Navigate
                                </Button>
                              </div>
                              {patientLoc.isLiveLocation && (
                                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-600 font-semibold">
                                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                                  Live Location Active
                                </div>
                              )}
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  ) : null}
                  
                  {/* Show Start Visit button if trip ended (tripStats exists) and has selected appointment */}
                  {tripStats && selectedAppointment && !currentVisit ? (
                    <Button 
                      className="w-full h-14 text-base font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]" 
                      onClick={startVisitForSelectedAppointment} 
                      disabled={!location || isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Starting Visit...
                        </>
                      ) : (
                        <>
                          <Users className="h-5 w-5 mr-2" />
                          Start Visit - {selectedAppointment.patient_name}
                        </>
                      )}
                    </Button>
                  ) : (
                    /* Show Start Trip button only if trip hasn't ended yet */
                    !tripStats && (
                      <Button 
                        className="w-full h-14 text-base font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]" 
                        onClick={selectedAppointment ? startTripToAppointment : startTrip} 
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
                            {selectedAppointment ? `Start Trip to ${selectedAppointment.patient_name}` : 'Start New Trip'}
                          </>
                        )}
                      </Button>
                    )
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Enhanced Active Trip Header */}
                  <div className="p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-300 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-blue-600 text-white px-4 py-1.5 text-sm font-semibold shadow-md">Trip Active</Badge>
                        {isTracking && (
                          <Badge className="bg-green-500 text-white px-4 py-1.5 text-sm font-semibold shadow-md animate-pulse">
                            <Clock className="h-3.5 w-3.5 mr-1.5" />
                            GPS Tracking
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                        <span className="text-gray-600 font-medium">Started:</span>
                        <span className="font-bold text-gray-900">{new Date(currentTrip.startTime).toLocaleString()}</span>
                      </div>
                      {currentTrip.startTime && (
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                          <span className="text-gray-600 font-medium">Duration:</span>
                          <span className="font-bold text-blue-700 text-base">
                            {Math.round((new Date().getTime() - new Date(currentTrip.startTime).getTime()) / 60000)} minutes
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Enhanced Real-time Trip Metrics */}
                  {currentTrip && !tripStats && tripMetrics && (
                    <div className="p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-300 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <Route className="h-5 w-5 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-bold text-indigo-900">Real-time Trip Metrics</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border-2 border-indigo-200 shadow-md hover:shadow-lg transition-shadow">
                          <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Distance</div>
                          <div className="text-2xl sm:text-3xl font-bold text-indigo-700 flex items-baseline">
                            {tripMetrics.distance.toFixed(2)}
                            <span className="text-sm text-gray-500 ml-1.5 font-normal">mi</span>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border-2 border-indigo-200 shadow-md hover:shadow-lg transition-shadow">
                          <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Avg Speed</div>
                          <div className="text-2xl sm:text-3xl font-bold text-indigo-700 flex items-baseline">
                            {tripMetrics.avgSpeed.toFixed(1)}
                            <span className="text-sm text-gray-500 ml-1.5 font-normal">mph</span>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border-2 border-indigo-200 shadow-md hover:shadow-lg transition-shadow">
                          <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Max Speed</div>
                          <div className="text-2xl sm:text-3xl font-bold text-indigo-700 flex items-baseline">
                            {tripMetrics.maxSpeed.toFixed(1)}
                            <span className="text-sm text-gray-500 ml-1.5 font-normal">mph</span>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border-2 border-indigo-200 shadow-md hover:shadow-lg transition-shadow">
                          <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Duration</div>
                          <div className="text-2xl sm:text-3xl font-bold text-indigo-700 flex items-baseline">
                            {tripMetrics.duration}
                            <span className="text-sm text-gray-500 ml-1.5 font-normal">min</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 pt-5 border-t-2 border-indigo-200 bg-white/50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">Cost per Mile:</span>
                          <span className="text-xl font-bold text-indigo-900">${staffCostPerMile.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 italic font-medium">
                          Final cost will be calculated when trip ends
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Enhanced Trip Summary (after trip ends) */}
                  {tripStats && (
                    <div className="p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-xl border-2 border-green-300 shadow-xl hover:shadow-2xl transition-shadow">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-green-900">Trip Completed</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border-2 border-green-200 shadow-md">
                          <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Distance:</span>
                          <span className="text-lg font-bold text-gray-900">{tripStats.distance.toFixed(2)} miles</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border-2 border-green-200 shadow-md">
                          <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Cost per Mile:</span>
                          <span className="text-lg font-bold text-gray-900">${tripStats.costPerMile.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-gradient-to-r from-green-100 to-emerald-100 p-5 rounded-xl border-2 border-green-400 shadow-lg">
                          <span className="text-base font-bold text-green-900 uppercase tracking-wide">Total Cost:</span>
                          <span className="text-3xl font-bold text-green-700">${tripStats.cost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <Button 
                      variant="destructive" 
                      className="w-full h-14 text-base font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]" 
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
                    
                    {/* Show Start Visit button when trip is active and has selected appointment */}
                    {selectedAppointment && !currentVisit && (
                      <Button 
                        className="w-full h-14 text-base font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]" 
                        onClick={startVisitForSelectedAppointment}
                        disabled={isLoading || !location}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Starting Visit...
                          </>
                        ) : (
                          <>
                            <Users className="h-5 w-5 mr-2" />
                            Start Visit - {selectedAppointment.patient_name}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
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

          {/* Scheduled Appointments Section */}
          {scheduledAppointments.length > 0 && (
            <Card className="shadow-2xl border-0 hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative z-10">
                  <CardTitle className="text-xl font-bold text-white flex items-center gap-3 mb-2 drop-shadow-lg">
                    <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                      <Calendar className="h-5 w-5" />
                    </div>
                    Scheduled Appointments
                  </CardTitle>
                  <CardDescription className="text-blue-100 font-medium">
                    {scheduledAppointments.length} upcoming appointment{scheduledAppointments.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {loadingAppointments ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading appointments...</span>
                  </div>
                ) : (
                  scheduledAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 shadow-md hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                              {appointment.visit_type || "Home Visit"}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(appointment.scheduled_time).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })} at {new Date(appointment.scheduled_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <h3 className="font-bold text-lg text-gray-900 mb-1">{appointment.patient_name}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {appointment.patient_address || "Home Visit"}
                          </p>
                          {appointment.notes && (
                            <p className="text-xs text-gray-500 mt-2 italic">{appointment.notes}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => selectAppointment(appointment)}
                          disabled={isLoading || !!currentVisit || !!currentTrip}
                          className={`shadow-md ${
                            selectedAppointment?.id === appointment.id
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                          }`}
                        >
                          {selectedAppointment?.id === appointment.id ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Selected
                            </>
                          ) : (
                            <>
                              <Navigation className="h-4 w-4 mr-2" />
                              Select
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Active Visit Status Section */}
          {currentVisit && (
                <div className="space-y-5" key={currentVisit.id}>
                  {/* Enhanced Active Visit Header */}
                  <div className="p-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl border-2 border-emerald-300 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <Badge className="bg-emerald-600 text-white px-4 py-1.5 text-sm font-semibold shadow-md">Visit In Progress</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-sm">
                        <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Patient Name</div>
                        <div className="text-lg font-bold text-gray-900">{currentVisit.patientName}</div>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-sm">
                        <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Address</div>
                        <div className="text-sm text-gray-800 font-medium">{currentVisit.patientAddress}</div>
                      </div>
                      
                      {/* Arrival Time - when staff arrived at patient location */}
                      <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200 shadow-sm">
                        <div className="text-xs text-blue-600 font-medium mb-1 uppercase tracking-wide flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Arrival Time
                        </div>
                        <div className="text-base font-bold text-blue-900">
                          {new Date(currentVisit.startTime).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Staff arrived at patient location
                        </div>
                      </div>
                      
                      {/* Visit Duration - current duration in minutes */}
                      <div className="p-3 bg-emerald-50 rounded-lg border-2 border-emerald-200 shadow-sm">
                        <div className="text-xs text-emerald-600 font-medium mb-1 uppercase tracking-wide flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Visit Duration
                        </div>
                        <div className="text-2xl font-bold text-emerald-900">
                          {visitDuration} 
                          <span className="text-sm font-normal text-emerald-700 ml-1">minutes</span>
                        </div>
                        <div className="text-xs text-emerald-600 mt-1">
                          Time spent visiting patient
                        </div>
                      </div>
                      
                      {/* Drive Time if available */}
                      {currentVisit.driveTime && (
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 shadow-sm">
                          <div className="text-xs text-purple-600 font-medium mb-1 uppercase tracking-wide">Drive Time</div>
                          <div className="text-base font-bold text-purple-900">{currentVisit.driveTime} minutes</div>
                        </div>
                      )}
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
                  
                  {/* Emergency Doctor Consultation */}
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-red-900 mb-1">Need Immediate Doctor Consultation?</p>
                          <p className="text-xs text-red-700">Request emergency video consultation with an available doctor</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="lg"
                          onClick={() => {
                            console.log('🩺 [CONSULTATION] Opening dialog with data:', {
                              currentVisit,
                              staffName,
                              staffId,
                              patientId: currentVisit?.patient_id,
                              patientName: currentVisit?.patient_name
                            })
                            setShowConsultDialog(true)
                          }}
                          disabled={!currentVisit || activeConsultation}
                          className="ml-4"
                        >
                          <Stethoscope className="h-4 w-4 mr-2" />
                          {activeConsultation ? 'Consultation Pending...' : 'Request Doctor'}
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 h-14 text-base font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]" 
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
                      className="flex-1 h-14 text-base font-bold border-2 hover:bg-red-50 transition-all duration-300" 
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
        </div>
      </div>
    </div>
    
    {/* Consultation Request Dialog */}
    {currentVisit && (
      <ConsultationRequestDialog
        open={showConsultDialog}
        onOpenChange={setShowConsultDialog}
        patientId={currentVisit.patient_id}
        patientName={currentVisit.patient_name || 'Unknown Patient'}
        nurseId={staffId}
        nurseName={staffName || 'Nurse'}
        onConsultationCreated={handleConsultationCreated}
      />
    )}
    
    {/* Video Call Interface */}
    {showVideoCall && activeConsultationId && (
      <Dialog open={showVideoCall} onOpenChange={(open) => !open && handleVideoCallEnd()}>
        <DialogContent className="max-w-full h-screen p-0 m-0">
          <VisuallyHidden>
            <DialogTitle>Video Consultation</DialogTitle>
          </VisuallyHidden>
          <PeerJSVideoCall
            consultationId={activeConsultationId}
            participantName={staffName || 'Nurse'}
            participantRole="nurse"
            onCallEnd={handleVideoCallEnd}
          />
        </DialogContent>
      </Dialog>
    )}
    </>
  )
}
