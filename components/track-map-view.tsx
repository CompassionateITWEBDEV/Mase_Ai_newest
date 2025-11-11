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

    // Update current location marker
    if (currentLocation) {
      // Remove old marker
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
      }

      // Create custom marker with heading indicator
      const icon = currentLocation.heading !== null && currentLocation.heading !== undefined
        ? L.divIcon({
            className: 'custom-location-marker',
            html: `
              <div style="
                position: relative;
                width: 40px;
                height: 40px;
              ">
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%) rotate(${currentLocation.heading}deg);
                  width: 0;
                  height: 0;
                  border-left: 8px solid transparent;
                  border-right: 8px solid transparent;
                  border-bottom: 20px solid #3b82f6;
                  transform-origin: center bottom;
                "></div>
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  width: 20px;
                  height: 20px;
                  background: #3b82f6;
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                "></div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          })
        : L.divIcon({
            className: 'custom-location-marker',
            html: `
              <div style="
                width: 24px;
                height: 24px;
                background: ${isTracking ? '#10b981' : '#3b82f6'};
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              "></div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })

      const marker = L.marker([currentLocation.lat, currentLocation.lng], { icon })
        .addTo(map)

      // Add accuracy circle if available (very minimal - just border, no fill to avoid blocking map)
      if (currentLocation.accuracy) {
        const accuracyCircle = L.circle([currentLocation.lat, currentLocation.lng], {
          radius: currentLocation.accuracy,
          fillColor: isTracking ? '#10b981' : '#3b82f6',
          fillOpacity: 0, // No fill - completely transparent
          color: isTracking ? '#10b981' : '#3b82f6',
          weight: 1,
          opacity: 0.2, // Very transparent border only
          dashArray: '5, 5' // Dashed line to make it less prominent
        }).addTo(map)

        markerRef.current = L.layerGroup([marker, accuracyCircle])
      } else {
        markerRef.current = marker
      }

      // Update popup with location info
      const speedText = currentLocation.speed ? `${currentLocation.speed.toFixed(1)} mph` : 'N/A'
      const accuracyText = currentLocation.accuracy ? `±${currentLocation.accuracy.toFixed(0)}m` : 'N/A'
      marker.bindPopup(`
        <div style="font-weight: bold; margin-bottom: 4px;">Current Location</div>
        <div style="font-size: 12px; color: #666;">
          <div>Speed: ${speedText}</div>
          <div>Accuracy: ${accuracyText}</div>
          ${currentLocation.timestamp ? `<div>Time: ${currentLocation.timestamp.toLocaleTimeString()}</div>` : ''}
        </div>
      `)

      // Center map on current location
      map.setView([currentLocation.lat, currentLocation.lng], map.getZoom())
    }

    // Draw route polyline
    if (routePoints.length > 0) {
      // Remove old polyline
      if (routePolylineRef.current) {
        map.removeLayer(routePolylineRef.current)
      }

      const routeCoordinates = routePoints.map(p => [p.lat, p.lng] as [number, number])
      const polyline = L.polyline(routeCoordinates, {
        color: isTracking ? '#10b981' : '#3b82f6',
        weight: 4,
        opacity: 0.7,
        smoothFactor: 1
      }).addTo(map)

      routePolylineRef.current = polyline

      // Fit map to show entire route
      if (routeCoordinates.length > 0) {
        try {
          const bounds = L.latLngBounds(routeCoordinates)
          map.fitBounds(bounds.pad(0.1))
        } catch (e) {
          console.warn('Error fitting bounds:', e)
        }
      }
    }

    return () => {
      // Cleanup handled above
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

