"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, MapPin } from "lucide-react"

// Dynamically import Leaflet to avoid SSR issues
let L: any = null
if (typeof window !== "undefined") {
  L = require("leaflet")
  require("leaflet/dist/leaflet.css")
}

interface Location {
  lat: number
  lng: number
  accuracy?: number
  speed?: number
  heading?: number
  timestamp?: Date
}

interface TrackMapViewProps {
  currentLocation: Location | null
  routePoints?: Array<{ lat: number; lng: number; timestamp: string }>
  isTracking: boolean
}

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

export default function TrackMapView({ currentLocation, routePoints = [], isTracking }: TrackMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const accuracyCircleRef = useRef<any>(null)
  const routePolylineRef = useRef<any>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  useEffect(() => {
    if (!mapRef.current || !L) return

    fixLeafletIcons()

    // Initialize map
    if (!mapInstanceRef.current) {
      const centerLat = currentLocation?.lat || 40.7128
      const centerLng = currentLocation?.lng || -74.0060

      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([centerLat, centerLng], 13)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstanceRef.current)

      setIsMapLoaded(true)
    }

    const map = mapInstanceRef.current
    if (!map) return

    // Clean up old markers and circles properly
    if (markerRef.current) {
      try {
        if (map.hasLayer(markerRef.current)) {
          map.removeLayer(markerRef.current)
        }
      } catch (e) {
        console.warn('Error removing marker:', e)
      }
      markerRef.current = null
    }

    if (accuracyCircleRef.current) {
      try {
        if (map.hasLayer(accuracyCircleRef.current)) {
          map.removeLayer(accuracyCircleRef.current)
        }
      } catch (e) {
        console.warn('Error removing accuracy circle:', e)
      }
      accuracyCircleRef.current = null
    }

    // Update current location marker
    if (currentLocation) {
      // Create improved custom marker with heading indicator
      const markerColor = isTracking ? '#10b981' : '#3b82f6'
      const icon = currentLocation.heading !== null && currentLocation.heading !== undefined
        ? L.divIcon({
            className: 'custom-location-marker',
            html: `
              <div style="
                position: relative;
                width: 48px;
                height: 48px;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
              ">
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%) rotate(${currentLocation.heading}deg);
                  width: 0;
                  height: 0;
                  border-left: 10px solid transparent;
                  border-right: 10px solid transparent;
                  border-bottom: 24px solid ${markerColor};
                  transform-origin: center bottom;
                  z-index: 1;
                "></div>
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  width: 24px;
                  height: 24px;
                  background: ${markerColor};
                  border: 4px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                  z-index: 2;
                "></div>
              </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24]
          })
        : L.divIcon({
            className: 'custom-location-marker',
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
                  background: ${markerColor};
                  border: 4px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                  animation: pulse 2s infinite;
                "></div>
                <style>
                  @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                  }
                </style>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })

      const marker = L.marker([currentLocation.lat, currentLocation.lng], { 
        icon,
        zIndexOffset: 1000 // Ensure marker is on top
      }).addTo(map)

      markerRef.current = marker

      // Add accuracy circle if available (subtle, non-intrusive)
      if (currentLocation.accuracy && currentLocation.accuracy > 0) {
        const accuracyCircle = L.circle([currentLocation.lat, currentLocation.lng], {
          radius: currentLocation.accuracy,
          fillColor: markerColor,
          fillOpacity: 0.05, // Very subtle fill
          color: markerColor,
          weight: 1.5,
          opacity: 0.3,
          dashArray: '8, 4',
          className: 'accuracy-circle'
        }).addTo(map)

        accuracyCircleRef.current = accuracyCircle
      }

      // Update popup with location info
      const speedText = currentLocation.speed ? `${currentLocation.speed.toFixed(1)} mph` : 'N/A'
      const accuracyText = currentLocation.accuracy ? `±${currentLocation.accuracy.toFixed(0)}m` : 'N/A'
      marker.bindPopup(`
        <div style="font-weight: 600; margin-bottom: 6px; color: #1f2937;">📍 Current Location</div>
        <div style="font-size: 12px; color: #4b5563; line-height: 1.6;">
          <div style="margin-bottom: 4px;"><strong>Speed:</strong> ${speedText}</div>
          <div style="margin-bottom: 4px;"><strong>Accuracy:</strong> ${accuracyText}</div>
          ${currentLocation.timestamp ? `<div><strong>Time:</strong> ${new Date(currentLocation.timestamp).toLocaleTimeString()}</div>` : ''}
        </div>
      `, {
        className: 'custom-popup',
        closeButton: true,
        autoPan: true
      })

      // Smoothly center map on current location (only if tracking)
      if (isTracking) {
        map.setView([currentLocation.lat, currentLocation.lng], map.getZoom(), {
          animate: true,
          duration: 0.5
        })
      }
    }

    // Draw route polyline (only show route, no individual point markers)
    if (routePoints.length > 0) {
      // Remove old polyline
      if (routePolylineRef.current) {
        try {
          if (map.hasLayer(routePolylineRef.current)) {
            map.removeLayer(routePolylineRef.current)
          }
        } catch (e) {
          console.warn('Error removing polyline:', e)
        }
        routePolylineRef.current = null
      }

      // Filter out duplicate/very close points to reduce clutter
      const filteredPoints = routePoints.filter((point, index) => {
        if (index === 0) return true
        const prevPoint = routePoints[index - 1]
        const distance = Math.sqrt(
          Math.pow(point.lat - prevPoint.lat, 2) + 
          Math.pow(point.lng - prevPoint.lng, 2)
        )
        return distance > 0.0001 // Only include if moved at least this much
      })

      const routeCoordinates = filteredPoints.map(p => [p.lat, p.lng] as [number, number])
      
      if (routeCoordinates.length > 1) {
        const polyline = L.polyline(routeCoordinates, {
          color: isTracking ? '#10b981' : '#3b82f6',
          weight: 5,
          opacity: 0.8,
          smoothFactor: 1.5,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map)

        routePolylineRef.current = polyline

        // Fit map to show entire route (only if not tracking to avoid constant zoom changes)
        if (!isTracking && routeCoordinates.length > 1) {
          try {
            const bounds = L.latLngBounds(routeCoordinates)
            map.fitBounds(bounds.pad(0.15))
          } catch (e) {
            console.warn('Error fitting bounds:', e)
          }
        }
      }
    }

    return () => {
      // Cleanup on unmount
      if (markerRef.current && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.removeLayer(markerRef.current)
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (accuracyCircleRef.current && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.removeLayer(accuracyCircleRef.current)
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (routePolylineRef.current && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.removeLayer(routePolylineRef.current)
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [currentLocation, routePoints, isTracking])

  if (!L) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-lg" style={{ minHeight: '300px' }} />
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  )
}

