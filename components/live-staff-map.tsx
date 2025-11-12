"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Loader2, MapPin } from "lucide-react"

// Dynamically import Leaflet to avoid SSR issues
let L: any = null
if (typeof window !== "undefined") {
  L = require("leaflet")
  require("leaflet/dist/leaflet.css")
}

interface StaffMember {
  id: string
  name: string
  role: string
  status: string
  currentSpeed: number
  location: { lat: number; lng: number } | null
}

interface LiveStaffMapProps {
  staffFleet: StaffMember[]
  selectedStaff: StaffMember | null
  onStaffSelect: (staff: StaffMember) => void
}

// Fix for default marker icons in Leaflet with Next.js
const fixLeafletIcons = () => {
  if (typeof window !== "undefined" && L) {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    })
  }
}

export default function LiveStaffMap({ staffFleet, selectedStaff, onStaffSelect }: LiveStaffMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const popupsRef = useRef<Map<string, any>>(new Map())
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Check if any staff have locations
  const staffWithLocations = staffFleet.filter(s => s.location !== null)

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Driving":
        return "#6366f1" // indigo - actively driving fast
      case "En Route":
        return "#3b82f6" // blue - en route to next visit
      case "On Visit":
        return "#10b981" // green - at patient location
      case "Idle":
        return "#6b7280" // gray - stationary but on duty
      default:
        return "#ef4444" // red - offline
    }
  }

  const createStatusIcon = useCallback((status: string, isSelected: boolean) => {
    if (!L) return undefined
    
    const color = getStatusColor(status)
    const size = isSelected ? 24 : 18
    const borderWidth = isSelected ? 4 : 3

    // Different icon styles for different statuses
    let iconHtml = ''
    
    if (status === "Driving") {
      // Car icon for driving status
      iconHtml = `
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${size * 0.7}px;
            height: ${size * 0.7}px;
            background-color: ${color};
            border: ${borderWidth}px solid white;
            border-radius: 50% 50% 50% 0;
            transform: translate(-50%, -50%) rotate(-45deg);
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            ${isSelected ? 'animation: pulse 2s infinite;' : ''}
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${size * 0.4}px;
            height: ${size * 0.4}px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
      `
    } else if (status === "En Route") {
      // Arrow icon for en route
      iconHtml = `
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${size * 0.8}px;
            height: ${size * 0.8}px;
            background-color: ${color};
            border: ${borderWidth}px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            ${isSelected ? 'animation: pulse 2s infinite;' : ''}
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            width: 0;
            height: 0;
            border-left: ${size * 0.2}px solid transparent;
            border-right: ${size * 0.2}px solid transparent;
            border-bottom: ${size * 0.3}px solid white;
          "></div>
        </div>
      `
    } else {
      // Standard circle for other statuses
      iconHtml = `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border: ${borderWidth}px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          ${isSelected ? 'animation: pulse 2s infinite;' : ''}
        "></div>
      `
    }

    return L.divIcon({
      html: iconHtml,
      className: "custom-marker",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })
  }, [])

  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !L) return

    const map = mapInstanceRef.current

    // Check if map is still valid
    if (!map._container || !map._loaded) {
      return
    }

    try {
      // Remove old markers
      markersRef.current.forEach(marker => {
        try {
          if (map.hasLayer(marker)) {
            map.removeLayer(marker)
          }
        } catch (e) {
          // Ignore errors removing markers
        }
      })
      markersRef.current.clear()
      popupsRef.current.clear()

      // Add new markers for staff with locations
      staffFleet
        .filter(staff => staff.location !== null)
        .forEach(staff => {
          if (!staff.location) return

          try {
            const isSelected = selectedStaff?.id === staff.id

            // Create marker
            const marker = L.marker([staff.location.lat, staff.location.lng], {
              icon: createStatusIcon(staff.status, isSelected),
            }).addTo(map)

            // Create popup content
            const popupContent = `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">${staff.name}</h3>
                <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;">${staff.role}</p>
                <p style="margin: 0 0 4px 0; font-size: 12px;">
                  <strong>Status:</strong> <span style="color: ${getStatusColor(staff.status)}">${staff.status}</span>
                </p>
                ${staff.currentSpeed > 0 ? `<p style="margin: 0; font-size: 12px;"><strong>Speed:</strong> ${staff.currentSpeed} mph</p>` : ''}
              </div>
            `

            // Create and bind popup to the marker so Leaflet can derive position
            const popup = L.popup({ className: "custom-popup" }).setContent(popupContent)
            marker.bindPopup(popup)
            popupsRef.current.set(staff.id, popup)

            // Click handler: open popup via the marker (ensures correct lat/lng)
            marker.on("click", () => {
              onStaffSelect(staff)
              if (mapInstanceRef.current && mapInstanceRef.current.hasLayer(marker)) {
                marker.openPopup()
              }
            })

            // Show popup if selected
            if (isSelected) {
              // Use setTimeout to ensure marker is fully added to map
              setTimeout(() => {
                if (mapInstanceRef.current && mapInstanceRef.current.hasLayer(marker)) {
                  marker.openPopup()
                  marker.setIcon(createStatusIcon(staff.status, true))
                }
              }, 50)
            }

            markersRef.current.set(staff.id, marker)
          } catch (e) {
            console.error(`Error creating marker for staff ${staff.id}:`, e)
          }
        })
    } catch (error) {
      console.error("Error updating markers:", error)
    }
  }, [staffFleet, selectedStaff, createStatusIcon, onStaffSelect])

  // Initialize map - only run once on mount
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || typeof window === "undefined" || !L) return

    // Fix Leaflet icons
    fixLeafletIcons()

    let isMounted = true

    try {
      // Get center from staff locations or default
      const staffWithLocations = staffFleet.filter(s => s.location !== null)
      let center: [number, number] = [34.0522, -118.2437] // Default: Los Angeles

      if (staffWithLocations.length > 0) {
        // Calculate center from all staff locations
        const avgLat = staffWithLocations.reduce((sum, s) => sum + (s.location?.lat || 0), 0) / staffWithLocations.length
        const avgLng = staffWithLocations.reduce((sum, s) => sum + (s.location?.lng || 0), 0) / staffWithLocations.length
        center = [avgLat, avgLng]
      }

      // Create map using OpenStreetMap (free, no API key needed!)
      const map = L.map(mapRef.current, {
        center,
        zoom: staffWithLocations.length > 1 ? 11 : 13,
        zoomControl: true,
      })

      // Add OpenStreetMap tile layer (completely free!)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Wait for map to be fully ready before setting ref
      map.whenReady(() => {
        if (!isMounted) return
        
        mapInstanceRef.current = map
        setIsMapLoaded(true)
        
        // Update markers after map is ready
        setTimeout(() => {
          if (isMounted && mapInstanceRef.current) {
            updateMarkers()
          }
        }, 100)
      })
    } catch (error: any) {
      console.error("Error initializing map:", error)
      setMapError(error.message || "Failed to initialize map")
    }

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        try {
          // Clear all markers first
          markersRef.current.forEach(marker => {
            try {
              mapInstanceRef.current.removeLayer(marker)
            } catch (e) {
              // Ignore errors during cleanup
            }
          })
          markersRef.current.clear()
          popupsRef.current.clear()
          
          // Remove map
          mapInstanceRef.current.remove()
        } catch (e) {
          // Ignore errors during cleanup
        }
        mapInstanceRef.current = null
        setIsMapLoaded(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Update markers when staff fleet changes
  useEffect(() => {
    if (isMapLoaded && mapInstanceRef.current) {
      updateMarkers()
    }
  }, [isMapLoaded, updateMarkers])

  // Update map center when staff locations change
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || staffWithLocations.length === 0 || !L) {
      return
    }

    const map = mapInstanceRef.current

    // Check if map is still valid and ready
    if (!map._container || !map._loaded) {
      return
    }

    try {
      const bounds = L.latLngBounds([])
      staffWithLocations.forEach(staff => {
        if (staff.location) {
          bounds.extend([staff.location.lat, staff.location.lng])
        }
      })
      
      // Use requestAnimationFrame to ensure map is ready
      requestAnimationFrame(() => {
        if (!mapInstanceRef.current || !mapInstanceRef.current._loaded) {
          return
        }

        try {
          if (staffWithLocations.length === 1) {
            // Single location - center on it
            mapInstanceRef.current.setView(
              [staffWithLocations[0].location!.lat, staffWithLocations[0].location!.lng],
              13
            )
          } else if (bounds.isValid() && bounds.getNorth() !== bounds.getSouth()) {
            // Multiple locations - fit bounds (only if bounds are valid)
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
          }
        } catch (e) {
          console.error("Error updating map view:", e)
        }
      })
    } catch (error) {
      console.error("Error calculating bounds:", error)
    }
  }, [staffFleet, isMapLoaded, staffWithLocations.length])
  // Note: `getStatusColor`, `createStatusIcon`, and `updateMarkers` are
  // defined earlier as memoized callbacks (useCallback). The duplicates
  // here were removed to avoid redeclaration errors and keep a single
  // source of truth for marker rendering logic.

  if (mapError) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-4">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">{mapError}</p>
          <p className="text-sm text-gray-500 mt-2">
            Please refresh the page to try again
          </p>
        </div>
      </div>
    )
  }

  if (staffWithLocations.length === 0 && isMapLoaded) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-4">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">No staff locations available</p>
          <p className="text-sm text-gray-500 mt-2">
            Staff need to start GPS tracking to appear on the map
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: '600px' }} />
      <style jsx global>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}
