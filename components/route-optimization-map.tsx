"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

// Dynamically import Leaflet to avoid SSR issues
let L: any = null
if (typeof window !== "undefined") {
  L = require("leaflet")
  require("leaflet/dist/leaflet.css")
}

interface Waypoint {
  id: string
  name: string
  address: string
  lat: number
  lng: number
}

interface RouteOptimizationMapProps {
  waypoints: Waypoint[]
  currentOrder: string[]
  optimizedOrder: string[]
  currentDistance: number
  optimizedDistance: number
  staffName: string
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

export default function RouteOptimizationMap({
  waypoints,
  currentOrder,
  optimizedOrder,
  currentDistance,
  optimizedDistance,
  staffName
}: RouteOptimizationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylinesRef = useRef<any[]>([])
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [showOptimized, setShowOptimized] = useState(true)

  useEffect(() => {
    if (!mapRef.current || !L) {
      console.log('Map not ready:', { hasRef: !!mapRef.current, hasL: !!L })
      return
    }

    if (waypoints.length === 0) {
      console.log('No waypoints to display')
      return
    }

    fixLeafletIcons()

    // Initialize map only once
    if (!mapInstanceRef.current) {
      try {
        const centerLat = waypoints.reduce((sum, w) => sum + w.lat, 0) / waypoints.length
        const centerLng = waypoints.reduce((sum, w) => sum + w.lng, 0) / waypoints.length

        console.log('Initializing map at:', { centerLat, centerLng, waypointCount: waypoints.length })

        mapInstanceRef.current = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true
        }).setView([centerLat, centerLng], 13)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(mapInstanceRef.current)

        setIsMapLoaded(true)
        console.log('Map initialized successfully')
      } catch (error) {
        console.error('Error initializing map:', error)
        return
      }
    }

    const map = mapInstanceRef.current
    if (!map || !map._container) {
      console.log('Map instance not valid')
      return
    }

    // Wait for map to be ready
    map.whenReady(() => {
      try {
        // Clear existing markers and polylines
        markersRef.current.forEach(marker => {
          try {
            if (map.hasLayer(marker)) {
              map.removeLayer(marker)
            }
          } catch (e) {
            console.warn('Error removing marker:', e)
          }
        })
        polylinesRef.current.forEach(polyline => {
          try {
            if (map.hasLayer(polyline)) {
              map.removeLayer(polyline)
            }
          } catch (e) {
            console.warn('Error removing polyline:', e)
          }
        })
        markersRef.current = []
        polylinesRef.current = []

        // Get order to display
        const orderToUse = showOptimized ? optimizedOrder : currentOrder
        
        if (!orderToUse || orderToUse.length === 0) {
          console.warn('⚠️ No route order provided')
          return
        }
        
        const orderedWaypoints = orderToUse
          .map(id => waypoints.find(w => w.id === id))
          .filter((w): w is Waypoint => w !== undefined && w !== null)

        console.log('🗺️ Displaying route on map:', {
          mode: showOptimized ? 'Optimized' : 'Current',
          orderLength: orderToUse.length,
          waypointsFound: orderedWaypoints.length,
          totalWaypoints: waypoints.length
        })

        if (orderedWaypoints.length === 0) {
          console.warn('⚠️ No valid waypoints to display')
          return
        }
        
        // Validate coordinates
        const invalid = orderedWaypoints.filter(w => 
          !w.lat || !w.lng || isNaN(w.lat) || isNaN(w.lng) || w.lat === 0 || w.lng === 0
        )
        if (invalid.length > 0) {
          console.error('❌ Invalid coordinates:', invalid)
          return
        }

        // Add markers for each waypoint
        orderedWaypoints.forEach((waypoint, index) => {
          try {
            const marker = L.marker([waypoint.lat, waypoint.lng], {
              icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                  background: ${showOptimized ? '#10b981' : '#3b82f6'};
                  color: white;
                  border-radius: 50%;
                  width: 30px;
                  height: 30px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  font-size: 12px;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">${index + 1}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              })
            }).addTo(map)

            marker.bindPopup(`
              <div style="font-weight: bold; margin-bottom: 4px;">${index + 1}. ${waypoint.name}</div>
              <div style="font-size: 12px; color: #666;">${waypoint.address || 'No address'}</div>
            `)

            markersRef.current.push(marker)
          } catch (e) {
            console.error('Error adding marker:', e)
          }
        })

        // Draw route polyline
        if (orderedWaypoints.length > 1) {
          try {
            const routePoints = orderedWaypoints.map(w => [w.lat, w.lng] as [number, number])
            const polyline = L.polyline(routePoints, {
              color: showOptimized ? '#10b981' : '#3b82f6',
              weight: 4,
              opacity: 0.7,
              dashArray: showOptimized ? undefined : '10, 10'
            }).addTo(map)

            polylinesRef.current.push(polyline)

            // Fit map to show all waypoints
            if (markersRef.current.length > 0) {
              const group = new L.FeatureGroup(markersRef.current)
              const bounds = group.getBounds()
              if (bounds.isValid()) {
                map.fitBounds(bounds.pad(0.1))
              }
            }
          } catch (e) {
            console.error('Error drawing polyline:', e)
          }
        }
      } catch (error) {
        console.error('Error updating map:', error)
      }
    })

    return () => {
      // Cleanup will happen on next render
    }
  }, [waypoints, currentOrder, optimizedOrder, showOptimized])

  if (!L) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-2 right-2 z-[1000] bg-white rounded-lg shadow-lg p-2 flex gap-2">
        <button
          onClick={() => setShowOptimized(false)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            !showOptimized
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Current ({currentDistance.toFixed(1)} mi)
        </button>
        <button
          onClick={() => setShowOptimized(true)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            showOptimized
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Optimized ({optimizedDistance.toFixed(1)} mi)
        </button>
      </div>
      <div ref={mapRef} className="h-full w-full rounded-lg" style={{ minHeight: '400px' }} />
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  )
}

