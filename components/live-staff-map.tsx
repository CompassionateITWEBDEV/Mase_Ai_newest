"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, MapPin } from "lucide-react"

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

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export default function LiveStaffMap({ staffFleet, selectedStaff, onStaffSelect }: LiveStaffMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Load Google Maps script
  useEffect(() => {
    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!googleMapsApiKey) {
      setMapError("Google Maps API key not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.")
      return
    }

    // Check if script is already loaded
    if (window.google && window.google.maps) {
      initializeMap()
      return
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval)
          initializeMap()
        }
      }, 100)
      return () => clearInterval(checkInterval)
    }

    // Load Google Maps script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      initializeMap()
    }
    script.onerror = () => {
      setMapError("Failed to load Google Maps. Please check your API key.")
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  // Initialize map
  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    try {
      // Get center from staff locations or default
      const staffWithLocations = staffFleet.filter(s => s.location !== null)
      let center = { lat: 34.0522, lng: -118.2437 } // Default: Los Angeles

      if (staffWithLocations.length > 0) {
        // Calculate center from all staff locations
        const avgLat = staffWithLocations.reduce((sum, s) => sum + (s.location?.lat || 0), 0) / staffWithLocations.length
        const avgLng = staffWithLocations.reduce((sum, s) => sum + (s.location?.lng || 0), 0) / staffWithLocations.length
        center = { lat: avgLat, lng: avgLng }
      }

      // Create map
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: staffWithLocations.length > 1 ? 11 : 13,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      })

      mapInstanceRef.current = map
      setIsMapLoaded(true)
      updateMarkers()
    } catch (error: any) {
      console.error("Error initializing map:", error)
      setMapError(error.message || "Failed to initialize map")
    }
  }

  // Check if any staff have locations
  const staffWithLocations = staffFleet.filter(s => s.location !== null)

  // Update markers when staff fleet changes
  useEffect(() => {
    if (isMapLoaded && mapInstanceRef.current) {
      updateMarkers()
    }
  }, [staffFleet, selectedStaff, isMapLoaded])

  // Update map center when staff locations change
  useEffect(() => {
    if (isMapLoaded && mapInstanceRef.current && staffWithLocations.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      staffWithLocations.forEach(staff => {
        if (staff.location) {
          bounds.extend(new window.google.maps.LatLng(staff.location.lat, staff.location.lng))
        }
      })
      
      if (staffWithLocations.length === 1) {
        // Single location - center on it
        mapInstanceRef.current.setCenter({
          lat: staffWithLocations[0].location!.lat,
          lng: staffWithLocations[0].location!.lng
        })
        mapInstanceRef.current.setZoom(13)
      } else {
        // Multiple locations - fit bounds
        mapInstanceRef.current.fitBounds(bounds)
      }
    }
  }, [staffFleet, isMapLoaded, staffWithLocations.length])

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "En Route":
      case "Driving":
        return "#3b82f6" // blue
      case "On Visit":
        return "#10b981" // green
      case "Idle":
        return "#6b7280" // gray
      default:
        return "#ef4444" // red
    }
  }

  const getStatusIcon = (status: string, isSelected: boolean) => {
    const color = getStatusColor(status)
    const scale = isSelected ? 1.3 : 1.0
    
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 10 * scale,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: isSelected ? 4 : 2,
    }
  }

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.google) return

    const map = mapInstanceRef.current

    // Remove old markers
    markersRef.current.forEach(marker => {
      marker.setMap(null)
    })
    markersRef.current.clear()

    // Add new markers for staff with locations
    staffFleet
      .filter(staff => staff.location !== null)
      .forEach(staff => {
        if (!staff.location) return

        const isSelected = selectedStaff?.id === staff.id

        const marker = new window.google.maps.Marker({
          position: {
            lat: staff.location.lat,
            lng: staff.location.lng
          },
          map,
          icon: getStatusIcon(staff.status, isSelected),
          title: `${staff.name} - ${staff.status}`,
          animation: isSelected ? window.google.maps.Animation.BOUNCE : null
        })

        // Info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">${staff.name}</h3>
              <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;">${staff.role}</p>
              <p style="margin: 0 0 4px 0; font-size: 12px;">
                <strong>Status:</strong> <span style="color: ${getStatusColor(staff.status)}">${staff.status}</span>
              </p>
              ${staff.currentSpeed > 0 ? `<p style="margin: 0; font-size: 12px;"><strong>Speed:</strong> ${staff.currentSpeed} mph</p>` : ''}
            </div>
          `
        })

        // Click handler
        marker.addListener('click', () => {
          onStaffSelect(staff)
          infoWindow.open(map, marker)
        })

        // Show info window if selected
        if (isSelected) {
          infoWindow.open(map, marker)
        }

        markersRef.current.set(staff.id, marker)
      })
  }

  if (mapError) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center p-4">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">{mapError}</p>
          <p className="text-sm text-gray-500 mt-2">
            To enable the map, add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file
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
    </div>
  )
}

