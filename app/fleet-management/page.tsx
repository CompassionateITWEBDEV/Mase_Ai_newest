"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Map, Clock, DollarSign, Users, TrendingUp, ListFilter, RefreshCw, Route, Car, Timer, Loader2, AlertCircle, Phone, MessageSquare, Eye } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import StaffGpsTracker from "@/components/staff-gps-tracker"

interface StaffFleetMember {
  id: string
  name: string
  role: string
  status: "En Route" | "Driving" | "On Visit" | "Idle" | "Offline"
  currentSpeed: number
  etaToNext: string
  nextPatient: string
  totalDistanceToday: number
  totalDriveTimeToday: number
  totalVisitTimeToday: number
  numberOfVisits: number
  averageVisitDuration: number
  efficiencyScore: number
  location: { lat: number; lng: number } | null
  visitDetails: Array<{
    patient: string
    duration: number
    startTime: string
    endTime: string
    address: string
    status: string
    cancelReason?: string
  }>
  upcomingAppointments?: Array<{
    id: string
    patientName: string
    scheduledTime: string
    visitType: string
    address: string
  }>
  drivingCost: number
  phoneNumber?: string
  routeOptimization?: {
    currentDistance: number
    optimizedDistance: number
    distanceSaved: number
    timeSaved: number
    costSaved: number
    improvementPercent: number
    isOptimized: boolean
    optimizedOrder: string[]
    currentOrder: string[]
  }
}

export default function FleetManagementDashboard() {
  const [filter, setFilter] = useState("All")
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [staffFleet, setStaffFleet] = useState<StaffFleetMember[]>([])
  const [error, setError] = useState<string | null>(null)
  const [routeOptimizationData, setRouteOptimizationData] = useState<any[]>([])
  const [optimizingRoute, setOptimizingRoute] = useState<string | null>(null)
  const [applyingRoute, setApplyingRoute] = useState<string | null>(null)
  const { toast } = useToast()

  // Helper function to safely convert improvementPercent to number (API returns it as string)
  const parseImprovementPercent = (value: any): number => {
    if (value === null || value === undefined) return 0
    if (typeof value === 'string') {
      return parseFloat(value) || 0
    }
    return typeof value === 'number' ? value : 0
  }

  // Load route optimization data
  const loadRouteOptimizationData = async () => {
    try {
      const res = await fetch('/api/route-optimization/routes?prioritizeTimeSavings=true&considerTrafficPatterns=true&respectAppointmentWindows=true&minimizeFuelCosts=false', {
        cache: 'no-store'
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.routes) {
          setRouteOptimizationData(data.routes)
          
          // Merge route optimization data with staff fleet
          setStaffFleet(prev => prev.map(staff => {
            const routeData = data.routes.find((r: any) => r.staffId === staff.id)
            if (routeData) {
              const improvementPercent = parseImprovementPercent(routeData.improvementPercent)
              return {
                ...staff,
                routeOptimization: {
                  currentDistance: routeData.currentDistance || 0,
                  optimizedDistance: routeData.optimizedDistance || 0,
                  distanceSaved: routeData.distanceSaved || 0,
                  timeSaved: routeData.timeSaved || 0,
                  costSaved: routeData.costSaved || 0,
                  improvementPercent: improvementPercent,
                  isOptimized: improvementPercent > 0,
                  optimizedOrder: routeData.optimizedOrder || [],
                  currentOrder: routeData.currentOrder || []
                }
              }
            }
            return staff
          }))
        }
      }
    } catch (err) {
      console.error('Error loading route optimization data:', err)
      // Don't show error to user - route optimization is optional
    }
  }

  // Load real staff fleet data
  useEffect(() => {
    let isMounted = true
    
    const loadData = async () => {
      await loadFleetData()
      await loadRouteOptimizationData()
    }
    
    loadData()
    
    // Auto-refresh every 30 seconds for real-time updates (without loading spinner)
    const interval = setInterval(() => {
      if (isMounted) {
        loadFleetData(false) // Don't show loading spinner on auto-refresh
        loadRouteOptimizationData() // Also refresh route optimization data
      }
    }, 30000) // 30 seconds
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadFleetData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      setError(null)

      // Get all active staff
      const staffRes = await fetch('/api/staff/list', { cache: 'no-store' })

      if (!staffRes.ok) {
        // Try to capture server response for debugging (may be HTML error page)
        const txt = await staffRes.text().catch(() => '')
        console.error('Failed to fetch /api/staff/list:', staffRes.status, txt.slice(0, 300))
        throw new Error(`Failed to load staff list (status ${staffRes.status})`)
      }

      let staffData: any
      try {
        staffData = await staffRes.json()
      } catch (e) {
        const txt = await staffRes.text().catch(() => '')
        console.error('Invalid JSON from /api/staff/list:', txt.slice(0, 500))
        throw new Error('Failed to load staff list: invalid JSON response')
      }

      if (!staffData || !staffData.success || !Array.isArray(staffData.staff)) {
        console.error('Unexpected staff list payload:', staffData)
        const errorMessage = staffData?.error || 'Failed to load staff list'
        throw new Error(errorMessage)
      }

      const activeStaff = staffData.staff.filter((s: any) => s.is_active !== false)
      
      // Debug: Log phone number extraction
      console.log('📞 Staff phone numbers:', activeStaff.map((s: any) => ({
        name: s.name,
        phone_number: s.phone_number,
        phoneNumber: s.phoneNumber,
        extracted: s.phone_number || s.phoneNumber || 'N/A'
      })))

      // Load performance stats and GPS location for each staff
      const fleetData = await Promise.all(
        activeStaff.map(async (staff: any) => {
          try {
            // Get performance stats
            const statsRes = await fetch(
              `/api/staff-performance/stats?staff_id=${encodeURIComponent(staff.id)}&period=day`,
              { cache: 'no-store' }
            )
            const statsData = await statsRes.json()
            
            if (!statsData.success) {
              console.warn(`Failed to load stats for staff ${staff.id}:`, statsData.error)
            }

            // Get GPS location
            const locationRes = await fetch(
              `/api/gps/staff-location?staff_id=${encodeURIComponent(staff.id)}`,
              { cache: 'no-store' }
            )
            const locationData = await locationRes.json()
            
            if (!locationData.success) {
              console.warn(`Failed to load location for staff ${staff.id}:`, locationData.error)
            }

            // Get scheduled appointments
            const appointmentsRes = await fetch(
              `/api/visits/scheduled?staff_id=${encodeURIComponent(staff.id)}`,
              { cache: 'no-store' }
            )
            const appointmentsData = await appointmentsRes.json()
            
            const upcomingAppointments = (appointmentsData.success && appointmentsData.appointments) 
              ? appointmentsData.appointments.map((apt: any) => ({
                  id: apt.id,
                  patientName: apt.patient_name,
                  scheduledTime: apt.scheduled_time,
                  visitType: apt.visit_type,
                  address: apt.patient_address,
                }))
              : []

            // Determine status - FIXED: More accurate status detection
            let status: "En Route" | "Driving" | "On Visit" | "Idle" | "Offline" = "Offline"
            let currentSpeed = 0
            let nextPatient = ""
            let etaToNext = "N/A"
            
            if (locationData.currentVisit) {
              // Has active visit - definitely on visit
              status = "On Visit"
            } else if (locationData.activeTrip) {
              // Has active trip - check if actually moving
              const tripSpeed = locationData.currentLocation?.speed || 0
              if (tripSpeed > 10) {
                // Has speed > 10 mph - actively Driving
                status = "Driving"
                currentSpeed = tripSpeed
              } else if (tripSpeed > 5) {
                // Has speed 5-10 mph - En Route to next visit
                status = "En Route"
                currentSpeed = tripSpeed
              } else if (locationData.currentLocation?.isRecent) {
                // Recent location but no speed - might be stationary
                status = "Idle" // Active but not necessarily driving
              } else {
                // Active trip but no recent location - might be stale
                const tripAge = locationData.activeTrip.startTime 
                  ? Math.round((new Date().getTime() - new Date(locationData.activeTrip.startTime).getTime()) / 60000)
                  : null
                
                if (tripAge !== null && tripAge > 480) {
                  // Trip older than 8 hours - likely stale
                  status = "Offline"
                } else {
                  status = "Idle"
                }
              }
            } else if (locationData.currentLocation?.isRecent) {
              // Recent location but no active trip
              status = "Idle"
            }

            // Get visits to help determine status
            const visits = (statsData.success && statsData.visits) ? statsData.visits : []
            const inProgressVisit = visits.find((v: any) => v.status === 'in_progress')
            const hasActiveTrip = locationData.activeTrip

            // Get location FIRST - Priority: visit_location (if on visit) > currentLocation > GPS location
            // Calculate location BEFORE using it in ETA calculation
            let staffLocation: { lat: number; lng: number } | null = null
            
            // Priority 1: If on visit, use visit_location from the API response (locationData.currentVisit.visitLocation)
            if (locationData.currentVisit?.visitLocation) {
              try {
                const visitLoc = locationData.currentVisit.visitLocation as any
                const visitLat = visitLoc.lat || (Array.isArray(visitLoc) ? visitLoc[0] : null)
                const visitLng = visitLoc.lng || (Array.isArray(visitLoc) ? visitLoc[1] : null)
                
                if (visitLat && visitLng && !isNaN(visitLat) && !isNaN(visitLng)) {
                  staffLocation = {
                    lat: parseFloat(visitLat.toString()),
                    lng: parseFloat(visitLng.toString())
                  }
                  console.log(`📍 Using visit_location from API for ${staff.name}: ${staffLocation.lat}, ${staffLocation.lng}`)
                }
              } catch (e) {
                console.warn(`Error parsing visit_location from API for ${staff.name}:`, e)
              }
            }
            
            // Priority 2: If on visit but no visitLocation in API, check inProgressVisit
            if (!staffLocation && inProgressVisit && (inProgressVisit as any).visit_location) {
              try {
                const visitLoc = (inProgressVisit as any).visit_location as any
                const visitLat = visitLoc.lat || (Array.isArray(visitLoc) ? visitLoc[0] : null)
                const visitLng = visitLoc.lng || (Array.isArray(visitLoc) ? visitLoc[1] : null)
                
                if (visitLat && visitLng && !isNaN(visitLat) && !isNaN(visitLng)) {
                  staffLocation = {
                    lat: parseFloat(visitLat.toString()),
                    lng: parseFloat(visitLng.toString())
                  }
                  console.log(`📍 Using visit_location from inProgressVisit for ${staff.name}: ${staffLocation.lat}, ${staffLocation.lng}`)
                }
              } catch (e) {
                console.warn(`Error parsing visit_location from inProgressVisit for ${staff.name}:`, e)
              }
            }
            
            // Priority 3: Use currentLocation from GPS updates (always available, even during visits)
            if (!staffLocation && locationData.currentLocation) {
              const loc = locationData.currentLocation
              // For "On Visit" status, always use location if available (even if slightly old)
              const isRecent = loc.isRecent !== false || locationData.hasActiveTrip || (loc.ageMinutes !== null && loc.ageMinutes <= 60)
              // Don't use IP geolocation (low accuracy)
              const isAccurate = !loc.isIPGeolocation && (loc.accuracy === null || loc.accuracy <= 2000)
              
              if (isRecent && isAccurate && loc.latitude && loc.longitude) {
                staffLocation = {
                  lat: loc.latitude,
                  lng: loc.longitude
                }
                console.log(`📍 Using currentLocation for ${staff.name}: ${staffLocation.lat}, ${staffLocation.lng}`)
              }
            }

            // Get GPS data
            const hasLocation = locationData.currentLocation
            const locationAge = hasLocation && locationData.currentLocation.ageMinutes !== null 
              ? locationData.currentLocation.ageMinutes 
              : null
            const isLocationRecent = hasLocation && (locationData.currentLocation.isRecent !== false) && 
              (locationAge === null || locationAge <= 30) // Location is recent if within 30 minutes

            if (hasLocation && isLocationRecent) {
              // We have recent GPS location data - use it for accurate status
              currentSpeed = locationData.currentLocation.speed || 0
              
              // PRIORITY 1: Check if staff is on a visit (most important)
              if (inProgressVisit || locationData.status === 'on_visit') {
                status = "On Visit"
              }
              // PRIORITY 2: Differentiate between "Driving" and "En Route"
              else if (currentSpeed > 10) {
                // Staff is moving fast (> 10 mph) - actively Driving
                status = "Driving"
              }
              else if (currentSpeed > 5) {
                // Staff is moving at moderate speed (5-10 mph) - En Route to next visit
                status = "En Route"
              }
              // PRIORITY 3: Check if staff has active trip but is stationary (no speed or slow)
              else if (hasActiveTrip || locationData.status === 'active') {
                // Has active trip but NO significant speed - Idle (stationary but on duty)
                status = "Idle"
              }
              // PRIORITY 4: No active trip and no speed - Offline
              else {
                status = "Offline"
              }
            } else if (locationData.success && locationData.status) {
              // We have status but no recent location - use status with caution
              // Check if we have speed data even if location is not recent
              const speedFromLocation = locationData.currentLocation?.speed || 0
              
              if (inProgressVisit || locationData.status === 'on_visit') {
                status = "On Visit"
              } 
              // FIXED: Differentiate between "Driving" and "En Route" based on speed
              // Don't trust 'driving' status alone if there's no speed or recent location
              else if (speedFromLocation > 10 && locationData.currentLocation?.isRecent) {
                // Staff has high speed (> 10 mph) - actively Driving
                status = "Driving"
                currentSpeed = speedFromLocation
              }
              else if (speedFromLocation > 5 && locationData.currentLocation?.isRecent) {
                // Staff has moderate speed (5-10 mph) - En Route to next visit
                status = "En Route"
                currentSpeed = speedFromLocation
              } 
              // FIXED: If active trip but no speed/recent location, check if trip is stale
              else if (hasActiveTrip || locationData.status === 'active' || locationData.status === 'driving') {
                // Check if active trip is recent (not stale)
                const tripAge = locationData.activeTrip?.startTime 
                  ? Math.round((new Date().getTime() - new Date(locationData.activeTrip.startTime).getTime()) / 60000)
                  : null
                
                // If trip is older than 8 hours and no visits, likely stale - show Idle
                if (tripAge !== null && tripAge > 480 && !inProgressVisit && visits.length === 0) {
                  status = "Idle" // Stale trip, no activity
                } else if (speedFromLocation === 0 && !locationData.currentLocation?.isRecent) {
                  // No speed and no recent location - Idle (not actually moving)
                  status = "Idle"
                } else {
                  // Has active trip but can't determine if moving - default to Idle for safety
                  status = "Idle"
                }
              } else {
                status = "Offline"
              }
            } else if (statsData.success) {
              // Fallback: use visit data if GPS API fails
              if (inProgressVisit) {
                status = "On Visit"
              } else if (hasActiveTrip) {
                // Has active trip but no GPS - can't determine if driving or idle
                // Default to Idle (safer assumption - they might be stationary)
                status = "Idle"
              } else if (visits.length > 0) {
                // Has visits today but none in progress - between visits, likely Idle
                status = "Idle"
              } else {
                status = "Offline"
              }
            } else {
              // No data at all - Offline
              status = "Offline"
            }

            // Find next scheduled visit (not started yet) - prioritize in_progress, then scheduled, then any future visit
            const nextVisit = visits.find((v: any) => {
              // First priority: in_progress visits
              if (v.status === 'in_progress') return true
              // Second priority: scheduled visits (not completed, not cancelled)
              if (v.status !== 'completed' && v.status !== 'cancelled' && !v.endTime) return true
              return false
            })

            if (inProgressVisit) {
              nextPatient = inProgressVisit.patientName || "Current Patient"
              etaToNext = "In Progress"
            } else if (nextVisit) {
              nextPatient = nextVisit.patientName || "Unknown Patient"
              
              // Calculate ETA based on distance and current location
              let calculatedETA = "N/A"
              
              // Try to get next visit location from address or visit_location
              const nextVisitLocation = (nextVisit as any).visit_location || 
                                       (nextVisit as any).location ||
                                       null
              
              // Get current location (use staffLocation which is calculated above)
              const currentLoc = locationData.currentLocation 
                ? { lat: locationData.currentLocation.latitude, lng: locationData.currentLocation.longitude }
                : (staffLocation || null)
              
              // If we have both locations, calculate distance and ETA
              if (currentLoc && nextVisitLocation) {
                try {
                  const nextLat = nextVisitLocation.lat || (Array.isArray(nextVisitLocation) ? nextVisitLocation[0] : null)
                  const nextLng = nextVisitLocation.lng || (Array.isArray(nextVisitLocation) ? nextVisitLocation[1] : null)
                  
                  if (nextLat && nextLng && currentLoc.lat && currentLoc.lng) {
                    // Calculate distance using Haversine formula
                    const R = 3959 // Earth radius in miles
                    const dLat = (nextLat - currentLoc.lat) * Math.PI / 180
                    const dLon = (nextLng - currentLoc.lng) * Math.PI / 180
                    const a = 
                      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(currentLoc.lat * Math.PI / 180) * Math.cos(nextLat * Math.PI / 180) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2)
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
                    const distance = R * c
                    
                    // Calculate ETA based on current speed or average speed (25 mph)
                    const avgSpeed = currentSpeed > 0 ? currentSpeed : 25 // Use current speed if available, else 25 mph
                    const timeInMinutes = Math.round((distance / avgSpeed) * 60)
                    
                    if (timeInMinutes < 60) {
                      calculatedETA = `${timeInMinutes} min`
                    } else {
                      const hours = Math.floor(timeInMinutes / 60)
                      const minutes = timeInMinutes % 60
                      calculatedETA = `${hours}h ${minutes}m`
                    }
                  }
                } catch (e) {
                  console.warn('Error calculating ETA:', e)
                }
              }
              
              // If calculated ETA is available, use it; otherwise try to calculate from scheduled_time
              if (calculatedETA !== "N/A") {
                etaToNext = calculatedETA
              } else if ((nextVisit as any).scheduled_time) {
                // Calculate time remaining until scheduled_time
                try {
                  const scheduledTime = new Date((nextVisit as any).scheduled_time)
                  const now = new Date()
                  const timeDiff = scheduledTime.getTime() - now.getTime()
                  
                  if (timeDiff > 0) {
                    // Future visit - show time remaining
                    const minutesRemaining = Math.round(timeDiff / 60000)
                    if (minutesRemaining < 60) {
                      etaToNext = `${minutesRemaining} min`
                    } else {
                      const hours = Math.floor(minutesRemaining / 60)
                      const minutes = minutesRemaining % 60
                      etaToNext = `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
                    }
                  } else {
                    // Past scheduled time - show as overdue
                    const minutesOverdue = Math.abs(Math.round(timeDiff / 60000))
                    if (minutesOverdue < 60) {
                      etaToNext = `${minutesOverdue} min ago`
                    } else {
                      const hours = Math.floor(minutesOverdue / 60)
                      const minutes = minutesOverdue % 60
                      etaToNext = `${hours}h ${minutes > 0 ? `${minutes}m` : ''} ago`
                    }
                  }
                } catch (e) {
                  console.warn('Error calculating ETA from scheduled_time:', e)
                  etaToNext = "N/A"
                }
              } else if (nextVisit.startTime && nextVisit.startTime !== "TIME" && nextVisit.startTime !== "N/A") {
                // Fallback: if startTime is a valid time string (not "TIME"), show it
                try {
                  // Try to parse if it's a time string like "2:30 PM"
                  const timeMatch = nextVisit.startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
                  if (timeMatch) {
                    // It's a time string - calculate time remaining
                    const now = new Date()
                    const [hours, minutes, period] = timeMatch.slice(1, 4)
                    let hour24 = parseInt(hours)
                    if (period.toUpperCase() === 'PM' && hour24 !== 12) hour24 += 12
                    if (period.toUpperCase() === 'AM' && hour24 === 12) hour24 = 0
                    
                    const visitTime = new Date(now)
                    visitTime.setHours(hour24, parseInt(minutes), 0, 0)
                    
                    const timeDiff = visitTime.getTime() - now.getTime()
                    if (timeDiff > 0) {
                      const minutesRemaining = Math.round(timeDiff / 60000)
                      if (minutesRemaining < 60) {
                        etaToNext = `${minutesRemaining} min`
                      } else {
                        const hours = Math.floor(minutesRemaining / 60)
                        const minutes = minutesRemaining % 60
                        etaToNext = `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
                      }
                    } else {
                      etaToNext = nextVisit.startTime // Show time if it's past
                    }
                  } else {
                    // If it's ISO format, parse it and calculate time remaining
                    const visitTime = new Date(nextVisit.startTime)
                    if (!isNaN(visitTime.getTime())) {
                      const now = new Date()
                      const timeDiff = visitTime.getTime() - now.getTime()
                      if (timeDiff > 0) {
                        const minutesRemaining = Math.round(timeDiff / 60000)
                        if (minutesRemaining < 60) {
                          etaToNext = `${minutesRemaining} min`
                        } else {
                          const hours = Math.floor(minutesRemaining / 60)
                          const minutes = minutesRemaining % 60
                          etaToNext = `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
                        }
                      } else {
                        etaToNext = visitTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      }
                    } else {
                      etaToNext = "N/A"
                    }
                  }
                } catch (e) {
                  etaToNext = "N/A"
                }
              } else {
                // If no location data and no scheduled time, check if there's an address to geocode
                const nextAddress = nextVisit.address || (nextVisit as any).patientAddress
                if (nextAddress && nextAddress !== "N/A" && currentLoc) {
                  // Could geocode here, but for now show "Calculating..."
                  etaToNext = "Calculating..."
                } else {
                  etaToNext = "N/A"
                }
              }
            } else {
              // No next visit found - check if there are any future visits
              const futureVisits = visits.filter((v: any) => 
                v.status !== 'completed' && 
                v.status !== 'cancelled' && 
                v.status !== 'in_progress'
              )
              
              if (futureVisits.length > 0) {
                const firstFuture = futureVisits[0]
                nextPatient = firstFuture.patientName || "Scheduled Visit"
                
                // Calculate ETA from scheduled_time if available
                if ((firstFuture as any).scheduled_time) {
                  try {
                    const scheduledTime = new Date((firstFuture as any).scheduled_time)
                    const now = new Date()
                    const timeDiff = scheduledTime.getTime() - now.getTime()
                    
                    if (timeDiff > 0) {
                      const minutesRemaining = Math.round(timeDiff / 60000)
                      if (minutesRemaining < 60) {
                        etaToNext = `${minutesRemaining} min`
                      } else {
                        const hours = Math.floor(minutesRemaining / 60)
                        const minutes = minutesRemaining % 60
                        etaToNext = `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
                      }
                    } else {
                      etaToNext = "Overdue"
                    }
                  } catch (e) {
                    etaToNext = "Scheduled"
                  }
                } else if (firstFuture.startTime && firstFuture.startTime !== "TIME" && firstFuture.startTime !== "N/A") {
                  // Try to calculate from startTime if it's a valid time
                  try {
                    const visitTime = new Date(firstFuture.startTime)
                    if (!isNaN(visitTime.getTime())) {
                      const now = new Date()
                      const timeDiff = visitTime.getTime() - now.getTime()
                      if (timeDiff > 0) {
                        const minutesRemaining = Math.round(timeDiff / 60000)
                        if (minutesRemaining < 60) {
                          etaToNext = `${minutesRemaining} min`
                        } else {
                          const hours = Math.floor(minutesRemaining / 60)
                          const minutes = minutesRemaining % 60
                          etaToNext = `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
                        }
                      } else {
                        etaToNext = "Scheduled"
                      }
                    } else {
                      etaToNext = "Scheduled"
                    }
                  } catch (e) {
                    etaToNext = "Scheduled"
                  }
                } else {
                  etaToNext = "Scheduled"
                }
              } else {
                nextPatient = "No upcoming visits"
                etaToNext = "N/A"
              }
            }

            // Calculate efficiency score - Use database value if available, otherwise calculate
            const todayStats = (statsData.success && statsData.todayStats) ? statsData.todayStats : {}
            const totalDriveTime = Number(todayStats.totalDriveTime) || 0
            const totalVisitTime = Number(todayStats.totalVisitTime) || 0
            const totalTime = totalDriveTime + totalVisitTime
            
            // Efficiency Score = (Visit Time / (Visit Time + Drive Time)) × 100
            // Higher score = Better (more time with patients vs driving)
            // Target: 70%+ efficiency (more time with patients than driving)
            let efficiencyScore = 0
            
            if (totalTime > 0 && totalVisitTime >= 0 && totalDriveTime >= 0) {
              // Calculate from actual time data (both must be valid numbers)
              const calculatedScore = (totalVisitTime / totalTime) * 100
              efficiencyScore = Math.round(calculatedScore)
              // Ensure it's between 0-100
              efficiencyScore = Math.max(0, Math.min(100, efficiencyScore))
              
              // Debug log for troubleshooting
              if (isNaN(efficiencyScore) || !isFinite(efficiencyScore)) {
                console.warn(`Invalid efficiency calculation for ${staff.name}:`, {
                  totalVisitTime,
                  totalDriveTime,
                  totalTime,
                  calculatedScore
                })
                efficiencyScore = 0
              }
            } else if (todayStats.efficiencyScore && Number(todayStats.efficiencyScore) > 0) {
              // Use database value if available and valid
              const dbScore = Number(todayStats.efficiencyScore)
              if (!isNaN(dbScore) && isFinite(dbScore)) {
                efficiencyScore = Math.max(0, Math.min(100, Math.round(dbScore)))
              } else {
                efficiencyScore = 0
              }
            } else {
              // No data - default to 0
              efficiencyScore = 0
            }

            // Format visit details
            const visitDetails = visits.map((v: any) => ({
              patient: v.patientName || "Unknown",
              duration: v.duration || 0,
              startTime: v.startTime || "N/A",
              endTime: v.endTime || (v.status === 'in_progress' ? 'In Progress' : 'N/A'),
              address: v.address || "N/A",
              status: v.status || 'in_progress',
              cancelReason: v.cancelReason || undefined
            }))

            // Extract phone number - check multiple possible field names
            const extractedPhone = (
              staff.phone_number || 
              staff.phoneNumber || 
              (staff as any).phone ||
              ''
            ).toString().trim()
            const phoneNumber = extractedPhone || undefined

            return {
              id: staff.id,
              name: staff.name || "Unknown",
              role: staff.department || "Staff",
              status,
              currentSpeed: Math.round(currentSpeed),
              etaToNext,
              nextPatient,
              totalDistanceToday: todayStats.totalMiles || 0,
              totalDriveTimeToday: todayStats.totalDriveTime || 0,
              totalVisitTimeToday: todayStats.totalVisitTime || 0,
              numberOfVisits: todayStats.totalVisits || 0,
              averageVisitDuration: todayStats.avgVisitDuration || 0,
              efficiencyScore,
              location: staffLocation,
              visitDetails,
              upcomingAppointments,
              drivingCost: todayStats.totalCost || 0,
              phoneNumber
            }
          } catch (e: any) {
            console.error(`Error loading data for staff ${staff.id}:`, e)
            // Extract phone number even in error case
            const extractedPhone = (
              staff.phone_number || 
              staff.phoneNumber || 
              (staff as any).phone ||
              ''
            ).toString().trim()
            const phoneNumber = extractedPhone || undefined

            // Return minimal data if API fails
            return {
              id: staff.id,
              name: staff.name || "Unknown",
              role: staff.department || "Staff",
              status: "Offline" as const,
              currentSpeed: 0,
              etaToNext: "N/A",
              nextPatient: "N/A",
              totalDistanceToday: 0,
              totalDriveTimeToday: 0,
              totalVisitTimeToday: 0,
              numberOfVisits: 0,
              averageVisitDuration: 0,
              efficiencyScore: 0,
              location: null,
              visitDetails: [],
              drivingCost: 0,
              phoneNumber
            }
          }
        })
      )

      setStaffFleet(fleetData)
    } catch (e: any) {
      console.error('Error loading fleet data:', e)
      setError(e.message || 'Failed to load fleet data')
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  const handleRefresh = async () => {
    await loadFleetData()
    await loadRouteOptimizationData()
  }

  // Quick optimize route for a specific staff
  const handleQuickOptimize = async (staffId: string, staffName: string) => {
    try {
      setOptimizingRoute(staffId)
      
      // Call route optimization API for this specific staff
      const res = await fetch(`/api/route-optimization/routes?staff_id=${staffId}&prioritizeTimeSavings=true&considerTrafficPatterns=true&respectAppointmentWindows=true`, {
        cache: 'no-store'
      })
      
      if (!res.ok) {
        throw new Error('Failed to optimize route')
      }
      
      const data = await res.json()
      if (data.success && data.routes && data.routes.length > 0) {
        const routeData = data.routes[0]
        
        // Update staff fleet with optimization data
        setStaffFleet(prev => prev.map(staff => {
          if (staff.id === staffId) {
            const improvementPercent = parseImprovementPercent(routeData.improvementPercent)
            return {
              ...staff,
              routeOptimization: {
                currentDistance: routeData.currentDistance || 0,
                optimizedDistance: routeData.optimizedDistance || 0,
                distanceSaved: routeData.distanceSaved || 0,
                timeSaved: routeData.timeSaved || 0,
                costSaved: routeData.costSaved || 0,
                improvementPercent: improvementPercent,
                isOptimized: improvementPercent > 0,
                optimizedOrder: routeData.optimizedOrder || [],
                currentOrder: routeData.currentOrder || []
              }
            }
          }
          return staff
        }))
        
        toast({
          title: "Route Optimized",
          description: `${staffName}: Save ${routeData.distanceSaved.toFixed(1)} mi, ${routeData.timeSaved} min, $${routeData.costSaved.toFixed(2)}`,
        })
      }
    } catch (err: any) {
      console.error('Error optimizing route:', err)
      toast({
        title: "Optimization Failed",
        description: err.message || "Failed to optimize route",
        variant: "destructive"
      })
    } finally {
      setOptimizingRoute(null)
    }
  }

  // Apply optimized route to database
  const handleApplyOptimizedRoute = async (staffId: string, staffName: string) => {
    try {
      setApplyingRoute(staffId)
      
      const staff = staffFleet.find(s => s.id === staffId)
      if (!staff || !staff.routeOptimization) {
        throw new Error('No optimized route available')
      }
      
      const res = await fetch('/api/route-optimization/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: staffId,
          optimizedOrder: staff.routeOptimization.optimizedOrder
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(errorData.error || 'Failed to apply route')
      }
      
      toast({
        title: "Route Applied",
        description: `Optimized route has been applied for ${staffName}`,
      })
      
      // Refresh data to show updated route
      await loadFleetData(false)
      await loadRouteOptimizationData()
    } catch (err: any) {
      console.error('Error applying route:', err)
      toast({
        title: "Failed to Apply Route",
        description: err.message || "Failed to apply optimized route",
        variant: "destructive"
      })
    } finally {
      setApplyingRoute(null)
    }
  }

  const summaryStats = useMemo(() => {
    const totalStaff = staffFleet.length
    const driving = staffFleet.filter((s) => s.status === "Driving").length
    const enRoute = staffFleet.filter((s) => s.status === "En Route").length
    const onVisit = staffFleet.filter((s) => s.status === "On Visit").length
    const idle = staffFleet.filter((s) => s.status === "Idle").length
    const offline = staffFleet.filter((s) => s.status === "Offline").length
    const totalDistance = staffFleet.reduce((sum, s) => sum + s.totalDistanceToday, 0)
    const totalDriveTime = staffFleet.reduce((sum, s) => sum + s.totalDriveTimeToday, 0)
    const totalVisitTime = staffFleet.reduce((sum, s) => sum + s.totalVisitTimeToday, 0)
    const totalVisits = staffFleet.reduce((sum, s) => sum + s.numberOfVisits, 0)
    // Calculate average efficiency - only include staff with actual activity (totalTime > 0)
    const staffWithActivity = staffFleet.filter(s => (s.totalDriveTimeToday + s.totalVisitTimeToday) > 0)
    const avgEfficiency = staffWithActivity.length > 0
      ? Math.round(staffWithActivity.reduce((sum, s) => sum + s.efficiencyScore, 0) / staffWithActivity.length)
      : (totalStaff > 0
          ? Math.round(staffFleet.reduce((sum, s) => sum + s.efficiencyScore, 0) / totalStaff)
          : 0)
    const totalDrivingCost = staffFleet.reduce((sum, s) => sum + s.drivingCost, 0)
    
    // Calculate average cost per mile from actual staff data
    const staffWithDistance = staffFleet.filter(s => s.totalDistanceToday > 0)
    const avgCostPerMile = staffWithDistance.length > 0
      ? staffWithDistance.reduce((sum, s) => {
          const costPerMile = s.drivingCost > 0 && s.totalDistanceToday > 0
            ? s.drivingCost / s.totalDistanceToday
            : 0.67 // Default if no data
          return sum + costPerMile
        }, 0) / staffWithDistance.length
      : 0.67 // Default IRS rate
    
    // Calculate average visit duration
    const staffWithVisits = staffFleet.filter(s => s.numberOfVisits > 0)
    const avgVisitDuration = staffWithVisits.length > 0
      ? staffWithVisits.reduce((sum, s) => sum + (s.averageVisitDuration || 0), 0) / staffWithVisits.length
      : 0
    
    // Calculate total active time (drive + visit)
    const totalActiveTime = totalDriveTime + totalVisitTime
    
    // Calculate productivity metrics
    const productivityRatio = totalActiveTime > 0
      ? (totalVisitTime / totalActiveTime) * 100
      : 0
    
    const visitsPerHour = totalActiveTime > 0
      ? (totalVisits / totalActiveTime) * 60
      : 0
    
    const milesPerVisit = totalVisits > 0
      ? totalDistance / totalVisits
      : 0

    return {
      totalStaff,
      driving,
      enRoute,
      onVisit,
      idle,
      offline,
      totalDistance,
      totalDriveTime,
      totalVisitTime,
      totalVisits,
      avgEfficiency,
      totalDrivingCost,
      avgCostPerMile,
      avgVisitDuration,
      totalActiveTime,
      productivityRatio,
      visitsPerHour,
      milesPerVisit,
    }
  }, [staffFleet])

  const selectedStaffData = selectedStaff ? staffFleet.find((s) => s.id === selectedStaff) : null

  // Filter staff based on status
  const filteredFleet = useMemo(() => {
    if (filter === "All") return staffFleet
    if (filter === "En Route") return staffFleet.filter((s) => s.status === "En Route")
    if (filter === "Driving") return staffFleet.filter((s) => s.status === "Driving")
    return staffFleet.filter((s) => s.status === filter)
  }, [staffFleet, filter])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading fleet data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 pb-4 sm:pb-6 lg:pb-8 ml-0 lg:ml-0">
      <header className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Fleet Management & Route Optimization</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Real-time GPS tracking and performance analytics for field staff.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Badge variant="outline" className="text-xs">
              Auto-refresh: 30s
            </Badge>
            <Button onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Driving Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryStats.totalDrivingCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{summaryStats.totalDistance.toFixed(1)} miles driven</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drive vs Visit Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summaryStats.totalDriveTime / 60).toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">{(summaryStats.totalVisitTime / 60).toFixed(1)}h on visits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalVisits}</div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.driving} driving, {summaryStats.enRoute} en route, {summaryStats.onVisit} on visit
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Route Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summaryStats.avgEfficiency.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Time with patients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">{summaryStats.idle} idle</p>
          </CardContent>
        </Card>
        
        {/* Route Optimization Summary Card */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Route Optimization</CardTitle>
            <Route className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {routeOptimizationData.filter((r: any) => r.improvementPercent > 0).length}/{routeOptimizationData.length}
            </div>
            <p className="text-xs text-green-600">
              {routeOptimizationData.length > 0 
                ? `${routeOptimizationData.filter((r: any) => r.improvementPercent > 5).length} routes can be optimized`
                : 'No routes available'}
            </p>
            {routeOptimizationData.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full text-xs border-green-300 text-green-700 hover:bg-green-100"
                onClick={() => window.location.href = '/route-optimization'}
              >
                <Route className="h-3 w-3 mr-1" />
                Optimize All
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="map" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
          <TabsTrigger value="map">Live Map</TabsTrigger>
          <TabsTrigger value="performance">Staff Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Map className="h-6 w-6 mr-3 text-blue-600" />
                  <div>
                    <CardTitle>Live Staff Locations</CardTitle>
                    <CardDescription>Real-time map view of all active field staff</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <ListFilter className="h-4 w-4" />
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Staff</SelectItem>
                      <SelectItem value="Driving">Driving</SelectItem>
                      <SelectItem value="En Route">En Route</SelectItem>
                      <SelectItem value="On Visit">On Visit</SelectItem>
                      <SelectItem value="Idle">Idle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredFleet.length === 0 ? (
                <div className="text-center py-12">
                  <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No staff found with selected filter.</p>
                </div>
              ) : (
                <StaffGpsTracker staffFleet={filteredFleet} filter={filter} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Staff Performance Overview</CardTitle>
                <CardDescription>Detailed metrics for each staff member</CardDescription>
              </CardHeader>
              <CardContent>
                {staffFleet.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No staff data available.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                    <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                          <TableHead className="min-w-[150px]">Staff Member</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="min-w-[120px] hidden sm:table-cell">Next Patient</TableHead>
                          <TableHead className="min-w-[80px] hidden md:table-cell">ETA</TableHead>
                          <TableHead className="min-w-[80px]">Visits</TableHead>
                          <TableHead className="min-w-[100px] hidden lg:table-cell">Drive Time</TableHead>
                          <TableHead className="min-w-[100px] hidden lg:table-cell">Visit Time</TableHead>
                          <TableHead className="min-w-[80px] hidden md:table-cell">Miles</TableHead>
                          <TableHead className="min-w-[80px] hidden lg:table-cell">Cost</TableHead>
                          <TableHead className="min-w-[100px] hidden sm:table-cell">Efficiency</TableHead>
                          <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staffFleet.map((staff) => {
                          // Helper function to format phone number for WhatsApp
                          const formatPhoneForWhatsApp = (phone: string): string => {
                            if (!phone) return ''
                            // Remove all non-digit characters
                            let cleaned = phone.replace(/\D/g, '')
                            // If it's a 10-digit number, assume US and add country code
                            if (cleaned.length === 10) {
                              cleaned = '1' + cleaned
                            }
                            // If it already starts with 1 and is 11 digits, use as is
                            // Otherwise, ensure it has country code
                            if (cleaned.length > 0 && !cleaned.startsWith('1') && cleaned.length >= 10) {
                              cleaned = '1' + cleaned
                            }
                            return cleaned
                          }

                          // Helper function to validate phone number
                          const isValidPhoneNumber = (phone: string | undefined): boolean => {
                            if (!phone) return false
                            const cleaned = phone.replace(/\D/g, '')
                            // Valid if it has at least 10 digits
                            return cleaned.length >= 10
                          }

                          // Handle phone call - FUNCTIONAL
                          const handleCall = (e: React.MouseEvent) => {
                            e.stopPropagation()
                            e.preventDefault()
                            
                            const phone = staff.phoneNumber
                            
                            if (!isValidPhoneNumber(phone)) {
                              toast({
                                title: "Phone number unavailable",
                                description: `Phone number not available for ${staff.name}. Please update their contact information.`,
                                variant: "destructive",
                              })
                              return
                            }

                            // Clean phone number - remove all non-digits
                            const cleanedPhone = phone!.replace(/\D/g, '')
                            
                            // Create tel: link and navigate
                            const telLink = `tel:${cleanedPhone}`
                            
                            // Use window.location for better compatibility
                            window.location.href = telLink
                            
                            toast({
                              title: "Opening phone dialer",
                              description: `Calling ${staff.name}...`,
                            })
                          }

                          // Handle WhatsApp message - FUNCTIONAL
                          const handleWhatsApp = (e: React.MouseEvent) => {
                            e.stopPropagation()
                            e.preventDefault()
                            
                            const phone = staff.phoneNumber
                            
                            if (!isValidPhoneNumber(phone)) {
                              toast({
                                title: "Phone number unavailable",
                                description: `Phone number not available for ${staff.name}. Please update their contact information.`,
                                variant: "destructive",
                              })
                              return
                            }

                            // Format phone number for WhatsApp
                            const formattedPhone = formatPhoneForWhatsApp(phone!)
                            
                            if (!formattedPhone || formattedPhone.length < 10) {
                              toast({
                                title: "Invalid phone number",
                                description: "Phone number format is invalid. Please check the staff's contact information.",
                                variant: "destructive",
                              })
                              return
                            }
                            
                            // Open WhatsApp in new tab
                            const whatsappUrl = `https://wa.me/${formattedPhone}`
                            window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
                            
                            toast({
                              title: "Opening WhatsApp",
                              description: `Opening WhatsApp chat with ${staff.name}...`,
                            })
                          }

                          // Handle track location - FUNCTIONAL
                          const handleTrack = (e: React.MouseEvent) => {
                            e.stopPropagation()
                            e.preventDefault()
                            
                            const trackUrl = `/track/${staff.id}`
                            
                            // Try to open in new tab
                            const trackWindow = window.open(trackUrl, '_blank', 'noopener,noreferrer')
                            
                            if (trackWindow) {
                              toast({
                                title: "Opening GPS tracking",
                                description: `Opening real-time GPS tracking for ${staff.name}...`,
                              })
                            } else {
                              // Popup blocked - navigate in same window
                              window.location.href = trackUrl
                              toast({
                                title: "Opening GPS tracking",
                                description: `Opening real-time GPS tracking for ${staff.name}...`,
                              })
                            }
                          }

                          return (
                        <TableRow
                          key={staff.id}
                              className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedStaff(staff.id)}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{staff.name}</div>
                              <div className="text-sm text-gray-500">{staff.role}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    staff.status === "Driving" ? "border-indigo-600 text-indigo-700 bg-indigo-50" :
                                    staff.status === "En Route" ? "border-blue-500 text-blue-700 bg-blue-50" :
                                    staff.status === "On Visit" ? "border-green-500 text-green-700 bg-green-50" :
                                    staff.status === "Idle" ? "border-yellow-500 text-yellow-700 bg-yellow-50" :
                                    "border-gray-500 text-gray-700 bg-gray-50"
                                  }
                                >
                                  {staff.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">{staff.nextPatient}</div>
                                  {staff.upcomingAppointments && staff.upcomingAppointments.length > 0 && (
                                    <div className="mt-1 text-xs text-gray-500">
                                      <Clock className="h-3 w-3 inline mr-1" />
                                      {staff.upcomingAppointments.length} upcoming appointment{staff.upcomingAppointments.length !== 1 ? 's' : ''}
                                      {staff.upcomingAppointments.length > 0 && (
                                        <div className="mt-1 space-y-0.5">
                                          {staff.upcomingAppointments.slice(0, 2).map((apt) => (
                                            <div key={apt.id} className="text-xs text-gray-600">
                                              • {new Date(apt.scheduledTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {apt.patientName}
                                            </div>
                                          ))}
                                          {staff.upcomingAppointments.length > 2 && (
                                            <div className="text-xs text-gray-400">
                                              +{staff.upcomingAppointments.length - 2} more
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="text-sm">
                                  <div className="text-gray-600">{staff.etaToNext}</div>
                                </div>
                          </TableCell>
                          <TableCell>
                                <Badge variant="outline">{staff.numberOfVisits}</Badge>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                            {Math.floor(staff.totalDriveTimeToday / 60)}h {staff.totalDriveTimeToday % 60}m
                          </TableCell>
                              <TableCell className="hidden lg:table-cell">
                            {Math.floor(staff.totalVisitTimeToday / 60)}h {staff.totalVisitTimeToday % 60}m
                          </TableCell>
                              <TableCell className="hidden md:table-cell">{staff.totalDistanceToday.toFixed(1)} mi</TableCell>
                              <TableCell className="hidden lg:table-cell">${staff.drivingCost.toFixed(2)}</TableCell>
                              <TableCell className="hidden sm:table-cell">
                            <Badge
                              variant={
                                staff.efficiencyScore >= 90
                                  ? "default"
                                  : staff.efficiencyScore >= 70
                                    ? "secondary"
                                    : staff.efficiencyScore >= 50
                                      ? "outline"
                                      : "destructive"
                              }
                              className={
                                staff.efficiencyScore >= 90
                                  ? "bg-green-500 text-white"
                                  : staff.efficiencyScore >= 70
                                    ? "bg-blue-500 text-white"
                                    : staff.efficiencyScore >= 50
                                      ? "bg-yellow-500 text-white"
                                      : "bg-red-500 text-white"
                              }
                              title={`Efficiency: ${staff.efficiencyScore}% (${staff.totalVisitTimeToday} min visit time / ${staff.totalDriveTimeToday + staff.totalVisitTimeToday} min total time)`}
                            >
                              {staff.efficiencyScore}%
                            </Badge>
                          </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  {/* Route Optimization Status Badge */}
                                  {staff.routeOptimization && (
                                    <div className="mr-2">
                                      {staff.routeOptimization.improvementPercent > 5 ? (
                                        <Badge 
                                          variant="outline" 
                                          className="text-xs border-yellow-500 text-yellow-700 bg-yellow-50"
                                          title={`Can save ${staff.routeOptimization.distanceSaved.toFixed(1)} mi, ${staff.routeOptimization.timeSaved} min, $${staff.routeOptimization.costSaved.toFixed(2)}`}
                                        >
                                          <Route className="h-3 w-3 mr-1" />
                                          {staff.routeOptimization.improvementPercent.toFixed(0)}% better
                                        </Badge>
                                      ) : staff.routeOptimization.improvementPercent > 0 ? (
                                        <Badge 
                                          variant="outline" 
                                          className="text-xs border-green-500 text-green-700 bg-green-50"
                                          title="Route is optimized"
                                        >
                                          <Route className="h-3 w-3 mr-1" />
                                          Optimized
                                        </Badge>
                                      ) : null}
                                    </div>
                                  )}
                                  
                                  {/* Quick Optimize Button */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleQuickOptimize(staff.id, staff.name)
                                    }}
                                    className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600"
                                    title="Quick Optimize Route"
                                    disabled={optimizingRoute === staff.id}
                                  >
                                    {optimizingRoute === staff.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Route className="h-4 w-4" />
                                    )}
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleTrack}
                                    className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                    title="Track Location"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleCall}
                                    className="h-8 w-8 hover:bg-green-50 hover:text-green-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title={isValidPhoneNumber(staff.phoneNumber) ? `Call ${staff.name}` : "Phone number not available"}
                                    disabled={!isValidPhoneNumber(staff.phoneNumber)}
                                  >
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleWhatsApp}
                                    className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title={isValidPhoneNumber(staff.phoneNumber) ? `Message ${staff.name} on WhatsApp` : "Phone number not available"}
                                    disabled={!isValidPhoneNumber(staff.phoneNumber)}
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                        </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedStaffData && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">{selectedStaffData.name}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {selectedStaffData.role} • {selectedStaffData.visitDetails.length} visits today
                      </CardDescription>
                    </div>
                    <Badge 
                      className={
                        selectedStaffData.status === "Driving" ? "border-indigo-600 text-indigo-700 bg-indigo-50" :
                        selectedStaffData.status === "En Route" ? "border-blue-500 text-blue-700 bg-blue-50" :
                        selectedStaffData.status === "On Visit" ? "border-green-500 text-green-700 bg-green-50" :
                        selectedStaffData.status === "Idle" ? "border-yellow-500 text-yellow-700 bg-yellow-50" :
                        "border-gray-500 text-gray-700 bg-gray-50"
                      }
                    >
                      {selectedStaffData.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Route Optimization Section */}
                    {selectedStaffData.routeOptimization && (
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Route className="h-5 w-5 text-purple-600" />
                            <h3 className="text-sm font-semibold text-gray-900">Route Optimization</h3>
                          </div>
                          {selectedStaffData.routeOptimization.improvementPercent > 0 && (
                            <Badge className="bg-green-500 text-white">
                              {selectedStaffData.routeOptimization.improvementPercent.toFixed(1)}% Better
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                          <div className="text-xs">
                            <div className="text-gray-600">Current Distance</div>
                            <div className="font-bold text-gray-900">{selectedStaffData.routeOptimization.currentDistance.toFixed(1)} mi</div>
                          </div>
                          <div className="text-xs">
                            <div className="text-gray-600">Optimized Distance</div>
                            <div className="font-bold text-green-600">{selectedStaffData.routeOptimization.optimizedDistance.toFixed(1)} mi</div>
                          </div>
                          <div className="text-xs">
                            <div className="text-gray-600">Time Saved</div>
                            <div className="font-bold text-blue-600">{selectedStaffData.routeOptimization.timeSaved} min</div>
                          </div>
                          <div className="text-xs">
                            <div className="text-gray-600">Cost Saved</div>
                            <div className="font-bold text-green-600">${selectedStaffData.routeOptimization.costSaved.toFixed(2)}</div>
                          </div>
                        </div>
                        
                        {selectedStaffData.routeOptimization.improvementPercent > 0 && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApplyOptimizedRoute(selectedStaffData.id, selectedStaffData.name)}
                              disabled={applyingRoute === selectedStaffData.id}
                              className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            >
                              {applyingRoute === selectedStaffData.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                  Applying...
                                </>
                              ) : (
                                <>
                                  <Route className="h-3 w-3 mr-2" />
                                  Apply Optimized Route
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.location.href = `/route-optimization?staff=${selectedStaffData.id}`}
                              className="flex-1"
                            >
                              View Details
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-xs sm:text-sm text-gray-600">Total Visits</div>
                        <div className="text-xl sm:text-2xl font-bold">{selectedStaffData.numberOfVisits}</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-xs sm:text-sm text-gray-600">Efficiency</div>
                        <div className="text-xl sm:text-2xl font-bold">{selectedStaffData.efficiencyScore}%</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg col-span-2 sm:col-span-1">
                        <div className="text-xs sm:text-sm text-gray-600">Distance</div>
                        <div className="text-xl sm:text-2xl font-bold">{selectedStaffData.totalDistanceToday.toFixed(1)} mi</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2 border-t">
                      <div>
                        <div className="text-xs sm:text-sm text-gray-600 mb-1">Drive Time</div>
                        <div className="text-sm sm:text-base font-semibold">
                          {Math.floor(selectedStaffData.totalDriveTimeToday / 60)}h {selectedStaffData.totalDriveTimeToday % 60}m
                        </div>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm text-gray-600 mb-1">Visit Time</div>
                        <div className="text-sm sm:text-base font-semibold">
                          {Math.floor(selectedStaffData.totalVisitTimeToday / 60)}h {selectedStaffData.totalVisitTimeToday % 60}m
                        </div>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm text-gray-600 mb-1">Avg Visit Duration</div>
                        <div className="text-sm sm:text-base font-semibold">{Math.round(selectedStaffData.averageVisitDuration)} min</div>
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm text-gray-600 mb-1">Driving Cost</div>
                        <div className="text-sm sm:text-base font-semibold text-green-600">${selectedStaffData.drivingCost.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Today's Visits</h4>
                      {selectedStaffData.visitDetails.length === 0 ? (
                        <p className="text-sm text-gray-500">No visits today</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedStaffData.visitDetails.map((visit, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{visit.patient}</span>
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const status = visit.status || 'in_progress'
                                    if (status === 'completed') {
                                      return <Badge className="bg-green-500 hover:bg-green-600 text-white">Completed</Badge>
                                    } else if (status === 'cancelled') {
                                      return (
                                        <div className="flex flex-col items-end gap-1">
                                          <Badge variant="destructive">Cancelled</Badge>
                                          {visit.cancelReason && (
                                            <div className="text-xs text-gray-600 italic text-right max-w-[150px]">
                                              {visit.cancelReason}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    } else {
                                      return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">In Progress</Badge>
                                    }
                                  })()}
                                <Badge variant="secondary">{visit.duration} min</Badge>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                <div>
                                  {visit.startTime} - {visit.endTime}
                                </div>
                                <div>{visit.address}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Route className="h-5 w-5 mr-2" />
                  Distance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Miles Today</span>
                    <span className="font-bold">{summaryStats.totalDistance.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average per Staff</span>
                    <span className="font-bold">
                      {summaryStats.totalStaff > 0
                        ? (summaryStats.totalDistance / summaryStats.totalStaff).toFixed(1)
                        : "0.0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Cost per Mile</span>
                    <span className="font-bold">${summaryStats.avgCostPerMile.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Cost Today</span>
                    <span className="font-bold text-green-600">${summaryStats.totalDrivingCost.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Timer className="h-5 w-5 mr-2" />
                  Time Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Drive Time</span>
                    <span className="font-bold">
                      {Math.floor(summaryStats.totalDriveTime / 60)}h {summaryStats.totalDriveTime % 60}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Visit Time</span>
                    <span className="font-bold">
                      {Math.floor(summaryStats.totalVisitTime / 60)}h {summaryStats.totalVisitTime % 60}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Productivity Ratio</span>
                    <span className="font-bold">{summaryStats.productivityRatio.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Active Time</span>
                    <span className="font-bold">
                      {Math.floor(summaryStats.totalActiveTime / 60)}h {summaryStats.totalActiveTime % 60}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Visit Duration</span>
                    <span className="font-bold">{Math.round(summaryStats.avgVisitDuration)} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Efficiency Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Average Efficiency</span>
                    <span className="font-bold text-green-600">{summaryStats.avgEfficiency.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Visits per Hour</span>
                    <span className="font-bold">{summaryStats.visitsPerHour.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Miles per Visit</span>
                    <span className="font-bold">{summaryStats.milesPerVisit.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Staff Status</span>
                    <span className="font-bold">
                      {summaryStats.driving} Driving, {summaryStats.enRoute} En Route, {summaryStats.onVisit} On Visit, {summaryStats.idle} Idle
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
            
            {/* Additional Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <Users className="h-5 w-5 mr-2" />
                    Staff Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-indigo-600 rounded-full"></div>
                        <span className="text-sm font-medium">Driving</span>
                      </div>
                      <span className="font-bold">{summaryStats.driving}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">En Route</span>
                      </div>
                      <span className="font-bold">{summaryStats.enRoute}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">On Visit</span>
                      </div>
                      <span className="font-bold">{summaryStats.onVisit}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm font-medium">Idle</span>
                      </div>
                      <span className="font-bold">{summaryStats.idle}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
                        <span className="text-sm font-medium">Offline</span>
                      </div>
                      <span className="font-bold">{summaryStats.offline}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Cost Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium">Total Cost Today</span>
                      <span className="text-xl font-bold text-green-600">${summaryStats.totalDrivingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">Cost per Mile (Avg)</span>
                      <span className="text-lg font-bold">${summaryStats.avgCostPerMile.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium">Cost per Visit</span>
                      <span className="text-lg font-bold">
                        ${summaryStats.totalVisits > 0 
                          ? (summaryStats.totalDrivingCost / summaryStats.totalVisits).toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm font-medium">Projected Daily Cost</span>
                      <span className="text-lg font-bold">
                        ${(summaryStats.totalDrivingCost * 1.2).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
