"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, User, Phone, MessageSquare, Navigation, RefreshCw, Loader2 } from "lucide-react"

// Dynamically import Leaflet to avoid SSR issues
let L: any = null
if (typeof window !== "undefined") {
  L = require("leaflet")
  require("leaflet/dist/leaflet.css")
}

// Fix Leaflet default icon issue
const fixLeafletIcons = () => {
  if (L && typeof window !== "undefined") {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    })
  }
}

// Simple map component for patient tracking
function PatientTrackingMap({ 
  staffLocation, 
  patientLocation, 
  distance,
  lastUpdated,
  routePoints = [],
  status = "En Route"
}: { 
  staffLocation: StaffLocation | null
  patientLocation?: { lat: number; lng: number } | null
  distance: number
  lastUpdated: Date
  routePoints?: Array<{ lat: number; lng: number; timestamp?: string }>
  status?: string
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const staffMarkerRef = useRef<any>(null)
  const patientMarkerRef = useRef<any>(null)
  const routeLineRef = useRef<any>(null)
  const remainingRouteRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || !L) return

    // Always show map even if staffLocation is not available yet
    // Staff location will be added when available
    fixLeafletIcons()

    // Initialize map - prioritize staff location for centering
    if (!mapInstanceRef.current) {
      // Always prioritize staff location if available
      const centerLat = (staffLocation && staffLocation.latitude) ? staffLocation.latitude : (patientLocation?.lat || 0)
      const centerLng = (staffLocation && staffLocation.longitude) ? staffLocation.longitude : (patientLocation?.lng || 0)
      
      // Only initialize if we have valid coordinates
      if (centerLat !== 0 && centerLng !== 0) {
        mapInstanceRef.current = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true
        }).setView([centerLat, centerLng], 13)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(mapInstanceRef.current)
      }
    }

    const map = mapInstanceRef.current
    if (!map) return

    // CRITICAL: ALWAYS show staff location marker when available
    // This is the PRIMARY requirement - staff location MUST be visible
    if (staffLocation && staffLocation.latitude && staffLocation.longitude) {
      console.log('📍 Rendering staff location on map:', {
        lat: staffLocation.latitude,
        lng: staffLocation.longitude,
        status: status,
        hasMarker: !!staffMarkerRef.current,
        mapReady: !!map
      })
      // Determine marker color and icon based on status
      let statusText = "En Route"
      let markerColor = "#3b82f6" // Blue for En Route
      let shouldPulse = true
      
      if (status === "Driving") {
        statusText = "Driving"
        markerColor = "#10b981" // Green for actively driving
        shouldPulse = true
      } else if (status === "Idle") {
        statusText = "Idle"
        markerColor = "#f59e0b" // Orange for idle
        shouldPulse = false
      } else if (status === "On Visit") {
        statusText = "On Visit"
        markerColor = "#8b5cf6" // Purple for on visit
        shouldPulse = false
      }
      
      const staffIcon = L.divIcon({
        className: 'staff-location-marker',
        html: `
          <div style="
            position: relative;
            width: 36px;
            height: 36px;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          ">
            <div style="
              width: 32px;
              height: 32px;
              background: ${markerColor};
              border: 4px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
              ${shouldPulse ? 'animation: pulse-staff 2s infinite;' : ''}
            "></div>
            <div style="
              position: absolute;
              top: -2px;
              left: -2px;
              width: 12px;
              height: 12px;
              background: ${markerColor};
              border: 2px solid white;
              border-radius: 50%;
              ${shouldPulse ? 'animation: pulse-dot 1.5s infinite;' : ''}
            "></div>
            <style>
              @keyframes pulse-staff {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.9; }
              }
              @keyframes pulse-dot {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.4); opacity: 0.7; }
              }
            </style>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      })

      // Update existing marker position or create new one
      // This ensures real-time location updates are displayed accurately
      if (staffMarkerRef.current) {
        // Always update position for real-time tracking - even small changes matter for accuracy
        const currentPos = staffMarkerRef.current.getLatLng()
        const newPos = [staffLocation.latitude, staffLocation.longitude] as [number, number]
        
        // Update position if it changed (even slightly for accuracy)
        const latDiff = Math.abs(currentPos.lat - newPos[0])
        const lngDiff = Math.abs(currentPos.lng - newPos[1])
        
        if (latDiff > 0.00001 || lngDiff > 0.00001) {
          // Update position immediately for real-time accuracy
          staffMarkerRef.current.setLatLng(newPos)
          
          // Log position update for debugging (only in dev)
          if (process.env.NODE_ENV === 'development') {
            console.log('📍 Staff location updated on map:', {
              lat: newPos[0].toFixed(6),
              lng: newPos[1].toFixed(6),
              status: status,
              speed: staffLocation.speed
            })
          }
        }
        
        // Always update icon in case status changed
        staffMarkerRef.current.setIcon(staffIcon)
      } else {
        // Create new marker for staff location - MUST be visible
        console.log('🆕 Creating NEW staff marker...')
        try {
          // Create marker first
          staffMarkerRef.current = L.marker([staffLocation.latitude, staffLocation.longitude], {
            icon: staffIcon,
            title: 'Healthcare Provider - Live Location',
            zIndexOffset: 1000,
            draggable: false
          })
          
          // FORCE add to map - this is critical
          map.addLayer(staffMarkerRef.current)
          
          console.log('✅ Staff marker CREATED and FORCE ADDED to map:', {
            lat: staffLocation.latitude.toFixed(6),
            lng: staffLocation.longitude.toFixed(6),
            status: status,
            mapHasMarker: map.hasLayer(staffMarkerRef.current),
            markerExists: !!staffMarkerRef.current
          })
          
          // Double verify - if still not on map, try again
          if (!map.hasLayer(staffMarkerRef.current)) {
            console.error('❌ CRITICAL: Marker still not on map! Force re-adding...')
            // Remove and re-add
            try {
              map.removeLayer(staffMarkerRef.current)
            } catch (e) {}
            map.addLayer(staffMarkerRef.current)
            console.log('✅ Re-added marker, now on map:', map.hasLayer(staffMarkerRef.current))
          }
        } catch (error) {
          console.error('❌ ERROR creating staff marker:', error)
          // Try one more time
          try {
            staffMarkerRef.current = L.marker([staffLocation.latitude, staffLocation.longitude], {
              icon: staffIcon
            })
            map.addLayer(staffMarkerRef.current)
            console.log('✅ Retry successful, marker added')
          } catch (e2) {
            console.error('❌ Retry also failed:', e2)
          }
        }
      }
      
      // CRITICAL: ALWAYS ensure marker is on map - triple check
      if (staffMarkerRef.current) {
        // Check if marker is actually on the map
        const isOnMap = map.hasLayer(staffMarkerRef.current)
        if (!isOnMap) {
          console.error('❌ CRITICAL ERROR: Staff marker NOT on map! FORCE ADDING NOW...')
          try {
            map.addLayer(staffMarkerRef.current)
            console.log('✅ FORCE ADDED - Marker now on map:', map.hasLayer(staffMarkerRef.current))
          } catch (error) {
            console.error('❌ Failed to force add marker:', error)
            // Last resort - recreate
            try {
              const newMarker = L.marker([staffLocation.latitude, staffLocation.longitude], {
                icon: staffIcon,
                zIndexOffset: 1000
              })
              map.addLayer(newMarker)
              staffMarkerRef.current = newMarker
              console.log('✅ Recreated marker and added to map')
            } catch (e) {
              console.error('❌ Complete failure to add marker:', e)
            }
          }
        } else {
          console.log('✅ Staff marker confirmed on map')
        }
        
        // Ensure it's always on top and visible
        staffMarkerRef.current.setZIndexOffset(1000)
        
        // Make sure marker is visible (not hidden)
        if (staffMarkerRef.current.getElement) {
          const element = staffMarkerRef.current.getElement()
          if (element) {
            element.style.display = 'block'
            element.style.visibility = 'visible'
            element.style.opacity = '1'
          }
        }
      }
      
      // Update popup with current status and distance info
      const distanceInfo = distance > 0 ? 
        `<div style="font-size: 12px; color: #4b5563; margin-top: 4px;">
          Distance: ${distance.toFixed(1)} miles away
        </div>` : ''
      
      staffMarkerRef.current.bindPopup(`
        <div style="font-weight: 600; margin-bottom: 4px;">🚗 Healthcare Provider</div>
        <div style="font-size: 12px; color: #4b5563; margin-bottom: 2px;">
          Status: <span style="color: ${markerColor}; font-weight: 600;">${statusText}</span>
        </div>
        <div style="font-size: 12px; color: #4b5563;">
          ${staffLocation.speed ? `Speed: ${Math.round(staffLocation.speed)} mph` : 'Location updated'}
        </div>
        ${distanceInfo}
        ${routePoints.length > 0 ? `<div style="font-size: 11px; color: #6b7280; margin-top: 4px;">Route points: ${routePoints.length}</div>` : ''}
      `)
      
      // Open popup on hover for better UX
      staffMarkerRef.current.on('mouseover', function() {
        this.openPopup()
      })
      
      // Ensure staff marker is always on top (highest z-index) and visible
      staffMarkerRef.current.setZIndexOffset(1000)
      
      // Make staff marker clickable to show info
      staffMarkerRef.current.on('click', function() {
        this.openPopup()
      })
    } else {
      // Staff location not available - log for debugging
      console.warn('⚠️ Staff location not available for map marker:', {
        hasStaffLocation: !!staffLocation,
        hasLat: staffLocation?.latitude,
        hasLng: staffLocation?.longitude,
        waitingForLocation: true
      })
      
      // If we have a marker but no location, keep it visible (don't remove)
      if (staffMarkerRef.current && map.hasLayer(staffMarkerRef.current)) {
        console.log('📍 Keeping existing staff marker visible')
      }
    }

    // Add patient location marker (green) - update position if exists
    if (patientLocation && patientLocation.lat && patientLocation.lng) {
      const patientIcon = L.divIcon({
        className: 'patient-location-marker',
        html: `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          ">
            <div style="
              width: 28px;
              height: 28px;
              background: #10b981;
              border: 4px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })

      // Update existing marker position or create new one
      if (patientMarkerRef.current) {
        patientMarkerRef.current.setLatLng([patientLocation.lat, patientLocation.lng])
      } else {
        patientMarkerRef.current = L.marker([patientLocation.lat, patientLocation.lng], {
          icon: patientIcon
        }).addTo(map)
      }

      // Update popup with current distance
      patientMarkerRef.current.bindPopup(`
        <div style="font-weight: 600; margin-bottom: 4px;">📍 Your Location</div>
        <div style="font-size: 12px; color: #4b5563;">
          Distance: ${distance.toFixed(1)} miles
        </div>
      `)
    }

    // Draw route line - show actual route if available, otherwise straight line
    if (staffLocation.latitude && staffLocation.longitude && 
        patientLocation && patientLocation.lat && patientLocation.lng) {
      
      // If we have route points, draw the actual route path showing staff's movement
      if (routePoints && routePoints.length > 0) {
        // Create route path from route points (shows where staff has been)
        const routePath = routePoints
          .filter((p: any) => p.lat && p.lng)
          .map((p: any) => [p.lat, p.lng])
        
        // Add current staff location to the end (most recent position)
        routePath.push([staffLocation.latitude, staffLocation.longitude])
        
        // Draw the path staff has traveled (past route)
        if (routePath.length > 1) {
          // Determine color based on status
          let routeColor = '#3b82f6' // Blue for En Route
          if (status === "Driving") {
            routeColor = '#10b981' // Green for actively driving
          } else if (status === "Idle") {
            routeColor = '#f59e0b' // Orange for idle
          }
          
          // Update or create route line
          if (routeLineRef.current) {
            routeLineRef.current.setLatLngs(routePath)
            routeLineRef.current.setStyle({ color: routeColor })
          } else {
            routeLineRef.current = L.polyline(routePath, {
              color: routeColor,
              weight: 4,
              opacity: 0.7,
              smoothFactor: 1
            }).addTo(map)
          }
        }
        
        // Draw line from current location to patient (remaining route)
        if (patientLocation.lat && patientLocation.lng) {
          const remainingPath = [
            [staffLocation.latitude, staffLocation.longitude],
            [patientLocation.lat, patientLocation.lng]
          ]
          
          if (remainingRouteRef.current) {
            remainingRouteRef.current.setLatLngs(remainingPath)
            remainingRouteRef.current.setStyle({ 
              color: status === "Driving" ? '#10b981' : '#3b82f6'
            })
          } else {
            remainingRouteRef.current = L.polyline(remainingPath, {
              color: status === "Driving" ? '#10b981' : '#3b82f6',
              weight: 3,
              opacity: 0.5,
              dashArray: '10, 5'
            }).addTo(map)
          }
        }
      } else {
        // No route points yet - draw straight line to destination
        if (routeLineRef.current) {
          routeLineRef.current.setLatLngs([
            [staffLocation.latitude, staffLocation.longitude],
            [patientLocation.lat, patientLocation.lng]
          ])
        } else {
          routeLineRef.current = L.polyline(
            [
              [staffLocation.latitude, staffLocation.longitude],
              [patientLocation.lat, patientLocation.lng]
            ],
            {
              color: '#3b82f6',
              weight: 3,
              opacity: 0.7,
              dashArray: '10, 5'
            }
          ).addTo(map)
        }
      }
    }

    // Fit map to show both locations - ALWAYS prioritize showing staff location
    // Staff location is the primary marker that must be visible and accurate
    if (staffLocation && staffLocation.latitude && staffLocation.longitude) {
      if (patientLocation && patientLocation.lat && patientLocation.lng) {
        // Both locations available - fit bounds to show both, prioritizing staff
        const bounds = L.latLngBounds(
          [[staffLocation.latitude, staffLocation.longitude]],
          [[patientLocation.lat, patientLocation.lng]]
        )
        
        // Check if this is a significant position change
        const currentCenter = map.getCenter()
        const distanceToCenter = currentCenter ? 
          Math.sqrt(
            Math.pow(staffLocation.latitude - currentCenter.lat, 2) + 
            Math.pow(staffLocation.longitude - currentCenter.lng, 2)
          ) : 1
        
        // Only refit bounds if marker is far from current view or on initial load
        // This prevents jarring map movements during real-time updates
        if (!staffMarkerRef.current || distanceToCenter > 0.01) {
          map.fitBounds(bounds.pad(0.2))
        }
      } else {
        // Only staff location available - ALWAYS center on staff location for accuracy
        // This ensures staff location is always visible and accurately displayed
        if (!staffMarkerRef.current) {
          // Initial load - center on staff with appropriate zoom
          map.setView([staffLocation.latitude, staffLocation.longitude], 15) // Higher zoom for accuracy
        } else {
          // Update view to keep staff in view if it moves significantly
          // Use smaller threshold for more responsive tracking
          const currentCenter = map.getCenter()
          if (currentCenter) {
            const distanceToCenter = Math.sqrt(
              Math.pow(staffLocation.latitude - currentCenter.lat, 2) + 
              Math.pow(staffLocation.longitude - currentCenter.lng, 2)
            )
            // If staff moved significantly, pan smoothly to keep them in view
            // Lower threshold (0.01) for more responsive real-time tracking
            if (distanceToCenter > 0.01) {
              map.panTo([staffLocation.latitude, staffLocation.longitude], { 
                animate: true, 
                duration: 0.5 // Faster animation for real-time feel
              })
            }
          }
        }
      }
    } else if (patientLocation && patientLocation.lat && patientLocation.lng) {
      // Only patient location available - center on patient
      if (!patientMarkerRef.current) {
        map.setView([patientLocation.lat, patientLocation.lng], 13)
      }
    }

    // Don't remove markers in cleanup - keep them for continuous display
    // Only cleanup on component unmount
    return () => {
      // Only cleanup on unmount, not on every update
      // Markers should persist for real-time updates
    }
  }, [staffLocation, patientLocation, distance, routePoints, status])

  if (!L) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="relative h-64 w-full rounded-lg overflow-hidden border border-gray-200">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  )
}

interface PatientETAViewProps {
  staffId: string
  patientId: string
  patientName?: string
  patientLocation?: { lat: number; lng: number; accuracy?: number } | null
}

interface StaffLocation {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: string
  speed?: number | null
  heading?: number | null
}

interface StaffInfo {
  name: string
  role: string
  phone: string
  estimatedArrival: string
  currentLocation: StaffLocation
  status: string
  distanceAway: number // in miles - current distance from staff to patient (updates in real-time)
  distanceFromStart: number // in miles - total distance from starting point to patient
  hasActiveTrip?: boolean
  routePoints?: Array<{ lat: number; lng: number; timestamp?: string }>
  startLocation?: { lat: number; lng: number } | null
}

export default function PatientETAView({ staffId, patientId, patientName, patientLocation }: PatientETAViewProps) {
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchStaffLocation = async () => {
    try {
      setLoading(true)
      
      // First, try to get patient's live location if not provided
      let patientLoc = patientLocation
      if (!patientLoc && patientName) {
        try {
          const patientLocRes = await fetch(`/api/patients/location?patient_name=${encodeURIComponent(patientName)}`, {
            cache: 'no-store'
          })
          if (patientLocRes.ok) {
            const patientLocData = await patientLocRes.json()
            if (patientLocData.success && patientLocData.location) {
              patientLoc = {
                lat: patientLocData.location.lat,
                lng: patientLocData.location.lng,
                accuracy: patientLocData.location.accuracy
              }
            }
          }
        } catch (e) {
          console.warn('Could not fetch patient location:', e)
        }
      }
      
      // Use the correct API endpoint with query parameter
      const response = await fetch(`/api/gps/staff-location?staff_id=${encodeURIComponent(staffId)}`, {
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error("Unable to fetch staff location")
      }

      const data = await response.json()

      if (data.success && data.currentLocation) {
        // Store activeTrip data for speed calculation
        const activeTripData = data.activeTrip || null
        const hasActiveTrip = data.hasActiveTrip || false
        
        // Get staff info
        const staffName = data.staff?.name || "Healthcare Provider"
        const staffRole = data.staff?.department || "Healthcare Provider"
        
        // Extract start location from active trip
        let startLocation: { lat: number; lng: number } | null = null
        if (activeTripData?.startLocation) {
          const start = activeTripData.startLocation
          if (start && (start.lat || start[0])) {
            startLocation = {
              lat: start.lat || start[0],
              lng: start.lng || start[1]
            }
          }
        }
        
        // Calculate distances - always calculate if we have both staff and patient locations
        let currentDistance = 0 // Current distance from staff to patient
        let distanceFromStart = 0 // Distance from starting point to patient (this is "Distance Away")
        let estimatedArrival = new Date(Date.now() + 20 * 60000).toISOString()
        
        if (patientLoc) {
          // Calculate current distance from staff to patient
          currentDistance = calculateDistance(data.currentLocation, patientLoc)
          
          // Calculate distance from starting point to patient (if start location exists)
          // This is the "Distance Away" that should be displayed
          if (startLocation) {
            distanceFromStart = calculateDistance(
              { latitude: startLocation.lat, longitude: startLocation.lng },
              patientLoc
            )
          } else {
            // If no start location, use current location as starting point
            distanceFromStart = currentDistance
          }
          
          // Calculate estimated arrival time based on REMAINING distance (current location to patient)
          // This is more accurate than using distance from start
          let estimatedMinutes = 20 // Default fallback
          let avgSpeed = 30 // Default average speed (mph)
          
          // Use currentDistance (remaining distance) for accurate ETA calculation
          const remainingDistance = currentDistance
          
          if (remainingDistance > 0 && hasActiveTrip) {
            // Priority 1: Use staff's current GPS speed if available and valid (most accurate)
            if (data.currentLocation.speed && data.currentLocation.speed > 5) {
              // Staff is actively moving - use current speed
              avgSpeed = data.currentLocation.speed
              // Clamp to reasonable range
              avgSpeed = Math.max(10, Math.min(70, avgSpeed))
              estimatedMinutes = Math.round((remainingDistance / avgSpeed) * 60)
              
              // Add buffer for traffic/red lights (10% extra time)
              estimatedMinutes = Math.round(estimatedMinutes * 1.1)
            } 
            // Priority 2: Calculate average speed from recent route points
            else if (activeTripData?.routePoints && activeTripData.routePoints.length >= 2) {
              const routePoints = activeTripData.routePoints
              
              // Get last 10 route points (more data = more accurate) for better average
              const recentPoints = routePoints.slice(-10)
              let totalDistance = 0
              let totalTime = 0
              
              for (let i = 1; i < recentPoints.length; i++) {
                const prev = recentPoints[i - 1]
                const curr = recentPoints[i]
                
                if (prev.lat && prev.lng && curr.lat && curr.lng && prev.timestamp && curr.timestamp) {
                  // Calculate distance between points using Haversine formula
                  const R = 3959 // Earth radius in miles
                  const dLat = (curr.lat - prev.lat) * Math.PI / 180
                  const dLon = (curr.lng - prev.lng) * Math.PI / 180
                  const a = 
                    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2)
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
                  const segmentDistance = R * c
                  
                  // Calculate time difference in hours
                  const timeDiff = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / (1000 * 60 * 60)
                  
                  // Only count if significant movement and valid time
                  if (timeDiff > 0 && segmentDistance > 0.01) {
                    totalDistance += segmentDistance
                    totalTime += timeDiff
                  }
                }
              }
              
              if (totalTime > 0 && totalDistance > 0) {
                avgSpeed = totalDistance / totalTime
                // Clamp speed to reasonable range (10-70 mph for urban driving)
                avgSpeed = Math.max(10, Math.min(70, avgSpeed))
                estimatedMinutes = Math.round((remainingDistance / avgSpeed) * 60)
                
                // Add buffer for traffic/red lights (15% extra time for calculated speed)
                estimatedMinutes = Math.round(estimatedMinutes * 1.15)
              } else {
                // No valid speed data from route points, use default based on status
                if (data.status === "driving" || data.status === "active") {
                  avgSpeed = 25 // Conservative speed for urban areas
                } else {
                  avgSpeed = 20 // Slower if idle/stopped
                }
                estimatedMinutes = Math.round((remainingDistance / avgSpeed) * 60)
                // Add 20% buffer for unknown conditions
                estimatedMinutes = Math.round(estimatedMinutes * 1.2)
              }
            } 
            // Priority 3: Use default speed based on status
            else {
              if (data.status === "driving" || data.status === "active") {
                avgSpeed = 25 // Conservative average for urban driving
              } else {
                avgSpeed = 20 // Slower if idle
              }
              estimatedMinutes = Math.round((remainingDistance / avgSpeed) * 60)
              // Add 20% buffer for unknown conditions
              estimatedMinutes = Math.round(estimatedMinutes * 1.2)
            }
            
            // Minimum ETA of 2 minutes if very close
            if (estimatedMinutes < 2 && remainingDistance < 0.1) {
              estimatedMinutes = 2
            }
          }
          
          estimatedArrival = new Date(Date.now() + estimatedMinutes * 60000).toISOString()
        }
        
        // Determine status - more accurate status detection
        let status = "Offline"
        if (data.status === "on_visit") {
          status = "On Visit"
        } else if (data.status === "driving") {
          // Check actual speed to determine if really driving
          if (data.currentLocation.speed && data.currentLocation.speed > 10) {
            status = "Driving"
          } else if (data.currentLocation.speed && data.currentLocation.speed > 5) {
          status = "En Route"
          } else {
            status = "En Route" // Has active trip but slow speed
          }
        } else if (data.status === "active" && hasActiveTrip) {
          status = "Idle" // Active trip but not moving
        } else if (data.status === "active") {
          status = "Active"
        }
        
        setStaffInfo({
          name: staffName,
          role: staffRole,
          phone: "+1 (555) 123-4567", // Would come from staff data
          estimatedArrival: estimatedArrival,
          currentLocation: data.currentLocation,
          status: status,
          distanceAway: currentDistance, // Distance Away = current distance (changes as staff moves closer)
          distanceFromStart: distanceFromStart, // Total distance from start to patient
          hasActiveTrip: hasActiveTrip,
          routePoints: activeTripData?.routePoints || [],
          startLocation: startLocation
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

  // Calculate distance using Haversine formula
  const calculateDistance = (staffLocation: StaffLocation, patientLoc?: { lat: number; lng: number } | null): number => {
    // If patient location is available, calculate actual distance
    if (patientLoc && patientLoc.lat && patientLoc.lng) {
      const R = 3959 // Earth radius in miles
      const dLat = (patientLoc.lat - staffLocation.latitude) * Math.PI / 180
      const dLon = (patientLoc.lng - staffLocation.longitude) * Math.PI / 180
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(staffLocation.latitude * Math.PI / 180) * Math.cos(patientLoc.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }
    
    // Fallback: Simplified distance calculation if patient location not available
    // If accuracy is high (GPS), assume closer; if low (IP), assume farther
    if (staffLocation.accuracy && staffLocation.accuracy > 1000) {
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
    // Fetch immediately on mount for instant display
    fetchStaffLocation()

    // Real-time location updates - very frequent for accurate tracking
    // Update more frequently when staff is actively driving (every 3 seconds) for real-time tracking
    // Update every 5 seconds when trip is active but not driving
    // Otherwise update every 15 seconds
    const getUpdateInterval = () => {
      if (staffInfo?.status === "Driving" || staffInfo?.status === "En Route") {
        return 3000 // 3 seconds when actively driving - very frequent for real-time accuracy
      } else if (staffInfo?.hasActiveTrip) {
        return 5000 // 5 seconds when trip is active
      } else {
        return 15000 // 15 seconds when no active trip (reduced from 30 for better responsiveness)
      }
    }

    // Use dynamic interval based on current status
    let intervalId: NodeJS.Timeout
    
    const setupInterval = () => {
      if (intervalId) clearInterval(intervalId)
      const interval = getUpdateInterval()
      intervalId = setInterval(() => {
        fetchStaffLocation()
      }, interval)
    }
    
    // Setup initial interval
    setupInterval()
    
    // Re-setup interval when status changes for optimal update frequency
    const statusCheckInterval = setInterval(() => {
      setupInterval()
    }, 10000) // Check every 10 seconds if status changed

    return () => {
      if (intervalId) clearInterval(intervalId)
      clearInterval(statusCheckInterval)
    }
  }, [staffId, patientLocation, staffInfo?.hasActiveTrip, staffInfo?.status])

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

  // Check if we have staff location - ALWAYS show map if staff location is available
  // Staff location is the primary requirement for the Live Location Map
  const hasStaffLocation = staffInfo.currentLocation && 
    staffInfo.currentLocation.latitude && staffInfo.currentLocation.longitude
  
  // Check if we have both staff and patient locations
  const hasBothLocations = hasStaffLocation && patientLocation && 
    patientLocation.lat && patientLocation.lng

  // Only show ETA if staff has started a trip
  const showTrackingInfo = staffInfo.hasActiveTrip

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
            <Badge 
              variant={
                staffInfo.status === "Driving" ? "default" : 
                staffInfo.status === "En Route" ? "default" :
                staffInfo.status === "On Visit" ? "secondary" :
                staffInfo.status === "Idle" ? "outline" :
                "secondary"
              } 
              className="ml-2"
            >
              {staffInfo.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {showTrackingInfo ? (
              <>
                {/* ETA Information - Only show when trip is active */}
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

                {/* Distance Away - current distance (updates in real-time as staff moves) */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <Navigation className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="font-medium text-green-900">Distance Away</p>
                  <p className="text-sm text-green-700">{staffInfo.distanceAway.toFixed(1)} miles</p>
                  <p className="text-xs text-green-600 mt-0.5">Current distance - updates in real-time</p>
                </div>
              </div>
            </div>

                {/* Total Distance from Start - optional info */}
            {staffInfo.startLocation && staffInfo.distanceFromStart !== staffInfo.distanceAway && (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-600 mr-2" />
                  <div>
                    <p className="text-xs font-medium text-gray-700">Total Distance</p>
                    <p className="text-xs text-gray-600">{staffInfo.distanceFromStart.toFixed(1)} miles from start</p>
                  </div>
                </div>
              </div>
            )}
              </>
            ) : hasBothLocations ? (
              <>
                {/* Show distance away even if trip hasn't started */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Navigation className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="font-medium text-green-900">Distance Away</p>
                      <p className="text-sm text-green-700">{staffInfo.distanceAway.toFixed(1)} miles</p>
                      <p className="text-xs text-green-600 mt-0.5">Current distance - updates in real-time</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-600">
                    Waiting for provider to start trip for ETA...
                  </p>
                </div>
              </>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-600">
                  Waiting for provider to start trip...
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ETA and distance will appear once trip begins
                </p>
              </div>
            )}

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

      {/* Live Map View - ALWAYS show if staff location is available */}
      {hasStaffLocation ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Live Location Map
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={fetchStaffLocation} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <PatientTrackingMap 
              staffLocation={staffInfo.currentLocation}
              patientLocation={patientLocation}
              distance={staffInfo.distanceAway}
              lastUpdated={lastUpdated}
              routePoints={staffInfo.routePoints || []}
              status={staffInfo.status}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
              <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
              {hasBothLocations ? (
                <span className="text-green-600 font-medium">
                  Distance Away: {staffInfo.distanceAway.toFixed(1)} miles
                </span>
              ) : (
                <span className="text-blue-600 font-medium">
                  Staff location active
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Live Location Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">Waiting for staff location</p>
                <p className="text-xs mt-1">
                  Staff location will appear here when available
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
