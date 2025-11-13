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

interface PatientLocation {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  visitType?: string
  scheduledTime?: string
  isLiveLocation?: boolean
}

interface TrackMapViewProps {
  currentLocation: Location | null
  routePoints?: Array<{ lat: number; lng: number; timestamp: string }>
  isTracking: boolean
  patientLocations?: PatientLocation[]
  selectedPatientId?: string | null
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

// Function to fetch actual road route from OpenStreetMap OSRM routing service
async function getRoadRoute(
  fromLat: number, 
  fromLng: number, 
  toLat: number, 
  toLng: number
): Promise<{ routePoints: Array<[number, number]>, distance: number, duration: number } | null> {
  try {
    // Use OpenStreetMap's OSRM routing service (FREE, no API key needed)
    // Format: /route/v1/{profile}/{coordinates}?overview=full&geometries=geojson
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`,
      {
        headers: {
          'User-Agent': 'MASE-AI-Intelligence/1.0'
        }
      }
    )
    
    if (!response.ok) {
      console.warn('⚠️ OSRM routing failed, will use straight line fallback')
      return null
    }
    
    const data = await response.json()
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      const coordinates = route.geometry.coordinates
      // Convert from [lng, lat] to [lat, lng] for Leaflet
      const routePoints: Array<[number, number]> = coordinates.map((coord: [number, number]) => [coord[1], coord[0]])
      
      // Get distance in meters, convert to miles
      const distanceMeters = route.distance || 0
      const distanceMiles = distanceMeters / 1609.34
      
      // Get duration in seconds, convert to minutes
      const durationSeconds = route.duration || 0
      const durationMinutes = Math.round(durationSeconds / 60)
      
      console.log('✅ Road route fetched:', {
        points: routePoints.length,
        distance: distanceMiles.toFixed(2) + ' mi',
        duration: durationMinutes + ' min'
      })
      
      return {
        routePoints,
        distance: distanceMiles,
        duration: durationMinutes
      }
    }
    
    return null
  } catch (error) {
    console.error('❌ Error fetching road route:', error)
    return null
  }
}

export default function TrackMapView({ currentLocation, routePoints = [], isTracking, patientLocations = [], selectedPatientId = null }: TrackMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const accuracyCircleRef = useRef<any>(null)
  const routePolylineRef = useRef<any>(null)
  const routeLineRef = useRef<any>(null) // For route guideline from staff to selected patient
  const patientMarkersRef = useRef<any[]>([])
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

    // Clean up patient markers and their labels - but only if they're not in the current patientLocations
    const currentPatientIds = new Set(patientLocations.map(p => p.id))
    
    patientMarkersRef.current = patientMarkersRef.current.filter(marker => {
      try {
        // Check if this marker's patient is still in the list
        const markerPatientId = marker._patientId
        if (markerPatientId && currentPatientIds.has(markerPatientId)) {
          // Keep this marker - patient still exists
          return true
        }
        
        // Remove marker if patient no longer exists
        if (map.hasLayer(marker)) {
          map.removeLayer(marker)
        }
        // Remove name label if exists
        if (marker._nameLabel && map.hasLayer(marker._nameLabel)) {
          map.removeLayer(marker._nameLabel)
        }
        // Remove address label if exists
        if (marker._addressLabel && map.hasLayer(marker._addressLabel)) {
          map.removeLayer(marker._addressLabel)
        }
        return false // Remove from array
      } catch (e) {
        console.warn('Error removing patient marker:', e)
        return false
      }
    })

    // Update current location marker - RED for staff (start point) like navigation apps
    if (currentLocation) {
      // Create improved custom marker with heading indicator
      // RED marker for staff (start point) - like navigation apps
      const markerColor = isTracking ? '#ef4444' : '#dc2626' // RED for staff
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
        <div style="font-weight: 600; margin-bottom: 6px; color: #dc2626;">📍 Your Location (Staff - Start Point)</div>
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
      // Remove route guideline when actual tracking starts
      if (routeLineRef.current && isTracking) {
        try {
          if (map.hasLayer(routeLineRef.current)) {
            map.removeLayer(routeLineRef.current)
          }
          if (routeLineRef.current._distanceLabel && map.hasLayer(routeLineRef.current._distanceLabel)) {
            map.removeLayer(routeLineRef.current._distanceLabel)
          }
        } catch (e) {
          console.warn('Error removing route guideline:', e)
        }
        routeLineRef.current = null
      }
      
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

    // Add patient location markers
    console.log('🗺️ Adding patient markers to map:', {
      patientCount: patientLocations?.length || 0,
      patients: patientLocations?.map(p => ({
        name: p.name,
        id: p.id,
        hasCoords: !!(p.lat && p.lng),
        lat: p.lat,
        lng: p.lng
      }))
    })

    if (patientLocations && patientLocations.length > 0) {
      console.log('🗺️ Processing', patientLocations.length, 'patient locations - markers will persist')
      
      patientLocations.forEach(patient => {
        if (patient.lat && patient.lng) {
          console.log('📍 Processing patient marker:', patient.name, { lat: patient.lat, lng: patient.lng, id: patient.id })
          const isSelected = selectedPatientId === patient.id
          const isLive = patient.isLiveLocation === true
          // GREEN marker for patient (destination) - like navigation apps
          const markerColor = isSelected ? '#10b981' : (isLive ? '#10b981' : '#22c55e') // Always green for patient
          const patientIcon = L.divIcon({
            className: 'patient-location-marker',
            html: `
              <div style="
                position: relative;
                width: ${isSelected ? '40px' : '32px'};
                height: ${isSelected ? '40px' : '32px'};
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
              ">
                <div style="
                  width: ${isSelected ? '36px' : '28px'};
                  height: ${isSelected ? '36px' : '28px'};
                  background: ${markerColor};
                  border: 4px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                  ${isSelected || isLive ? 'animation: pulse-patient 2s infinite;' : ''}
                "></div>
                <div style="
                  position: absolute;
                  top: -8px;
                  right: -8px;
                  width: 16px;
                  height: 16px;
                  background: ${markerColor};
                  border: 2px solid white;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 10px;
                  font-weight: bold;
                  color: white;
                ">👤</div>
                ${isLive ? `
                <div style="
                  position: absolute;
                  top: -4px;
                  left: -4px;
                  width: 12px;
                  height: 12px;
                  background: #10b981;
                  border: 2px solid white;
                  border-radius: 50%;
                  animation: pulse-live 1.5s infinite;
                "></div>
                ` : ''}
                ${isSelected || isLive ? `
                <style>
                  @keyframes pulse-patient {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.15); opacity: 0.9; }
                  }
                  @keyframes pulse-live {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.7; }
                  }
                </style>
                ` : ''}
              </div>
            `,
            iconSize: isSelected ? [40, 40] : [32, 32],
            iconAnchor: isSelected ? [20, 20] : [16, 16]
          })

          // Check if marker already exists for this patient
          const existingMarker = patientMarkersRef.current.find(m => m._patientId === patient.id)
          
          if (existingMarker) {
            // Update existing marker position if it changed
            const existingLat = existingMarker.getLatLng().lat
            const existingLng = existingMarker.getLatLng().lng
            if (Math.abs(existingLat - patient.lat) > 0.0001 || Math.abs(existingLng - patient.lng) > 0.0001) {
              existingMarker.setLatLng([patient.lat, patient.lng])
              if (existingMarker._nameLabel) {
                existingMarker._nameLabel.setLatLng([patient.lat, patient.lng])
              }
              if (existingMarker._addressLabel) {
                existingMarker._addressLabel.setLatLng([patient.lat, patient.lng])
              }
              console.log('📍 Updated existing patient marker position:', patient.name)
            }
            return // Skip creating new marker
          }
          
          const patientMarker = L.marker([patient.lat, patient.lng], {
            icon: patientIcon,
            zIndexOffset: isSelected ? 500 : 100
          }).addTo(map)
          
          // Store patient ID for tracking
          patientMarker._patientId = patient.id

          // Add name label below the marker (always visible) - GREEN for patient
          const nameLabel = L.marker([patient.lat, patient.lng], {
            icon: L.divIcon({
              className: 'patient-name-label',
              html: `
                <div style="
                  background: ${isSelected ? '#10b981' : '#22c55e'};
                  color: white;
                  padding: 5px 10px;
                  border-radius: 10px;
                  font-size: 12px;
                  font-weight: bold;
                  white-space: nowrap;
                  box-shadow: 0 3px 8px rgba(0,0,0,0.5);
                  border: 3px solid white;
                  margin-top: ${isSelected ? '24px' : '20px'};
                  text-align: center;
                  min-width: 70px;
                ">
                  👤 ${patient.name}
                </div>
              `,
              iconSize: [120, 35],
              iconAnchor: [60, 0],
              className: 'patient-name-label-marker'
            }),
            interactive: false,
            zIndexOffset: isSelected ? 501 : 101
          }).addTo(map)

          // Add location/address label below name
          const addressLabel = L.marker([patient.lat, patient.lng], {
            icon: L.divIcon({
              className: 'patient-address-label',
              html: `
                <div style="
                  background: rgba(255, 255, 255, 0.95);
                  color: #4b5563;
                  padding: 3px 6px;
                  border-radius: 6px;
                  font-size: 9px;
                  white-space: nowrap;
                  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                  border: 1px solid #e5e7eb;
                  margin-top: ${isSelected ? '50px' : '46px'};
                  text-align: center;
                  max-width: 120px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">
                  📍 ${patient.address || 'Location'}
                </div>
              `,
              iconSize: [120, 20],
              iconAnchor: [60, 0],
              className: 'patient-address-label-marker'
            }),
            interactive: false,
            zIndexOffset: isSelected ? 502 : 102
          }).addTo(map)

          const scheduledTimeText = patient.scheduledTime 
            ? new Date(patient.scheduledTime).toLocaleString()
            : 'Not scheduled'
          
          const locationType = patient.isLiveLocation ? '📍 Live Location' : '📍 Address Location'
          
          // Enhanced popup with more details
          patientMarker.bindPopup(`
            <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937; font-size: 14px;">👤 ${patient.name}</div>
            <div style="font-size: 12px; color: #4b5563; line-height: 1.8;">
              <div style="margin-bottom: 6px; color: ${patient.isLiveLocation ? '#10b981' : '#f59e0b'}; font-weight: 600; font-size: 11px;">
                ${locationType}
              </div>
              <div style="margin-bottom: 6px; padding: 4px; background: #f3f4f6; border-radius: 4px;">
                <strong>📍 Address:</strong><br/>
                <span style="font-size: 11px;">${patient.address}</span>
              </div>
              ${patient.visitType ? `<div style="margin-bottom: 6px;"><strong>Visit Type:</strong> ${patient.visitType}</div>` : ''}
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
                <strong>📅 Scheduled:</strong><br/>
                <span style="font-size: 11px;">${scheduledTimeText}</span>
              </div>
            </div>
          `, {
            className: 'custom-popup',
            closeButton: true,
            autoPan: true,
            maxWidth: 250
          })

          // Store references for cleanup and tracking
          patientMarker._nameLabel = nameLabel
          patientMarker._addressLabel = addressLabel
          patientMarker._patientId = patient.id // Store ID for tracking
          patientMarkersRef.current.push(patientMarker)
          
          console.log('✅ Patient marker added to map (will persist):', {
            name: patient.name,
            id: patient.id,
            lat: patient.lat,
            lng: patient.lng
          })
        }
      })

      // Fit map to show all markers, but prioritize selected patient
      if (selectedPatientId && patientLocations.length > 0) {
        const selectedPatient = patientLocations.find(p => p.id === selectedPatientId)
        
        if (selectedPatient && selectedPatient.lat && selectedPatient.lng) {
          // If we have a selected patient, center map on selected patient and current location
          try {
            const boundsPoints: [number, number][] = []
            
            // Add current location if available
            if (currentLocation) {
              boundsPoints.push([currentLocation.lat, currentLocation.lng])
            }
            
            // Add selected patient location (prioritized)
            boundsPoints.push([selectedPatient.lat, selectedPatient.lng])
            
            // Add other patient locations if space allows
            patientLocations.forEach(p => {
              if (p.id !== selectedPatientId && p.lat && p.lng) {
                boundsPoints.push([p.lat, p.lng])
              }
            })
            
            if (boundsPoints.length > 0) {
              const bounds = L.latLngBounds(boundsPoints)
              map.fitBounds(bounds.pad(0.15)) // Smaller padding to focus on selected patient
            }
          } catch (e) {
            console.warn('Error fitting bounds to selected patient:', e)
          }
        }
      } else if (currentLocation && patientLocations.length > 0) {
        // No selected patient - show all markers
        try {
          const bounds = L.latLngBounds([
            [currentLocation.lat, currentLocation.lng],
            ...patientLocations.map(p => [p.lat, p.lng] as [number, number])
          ])
          map.fitBounds(bounds.pad(0.2))
        } catch (e) {
          console.warn('Error fitting bounds:', e)
        }
      } else if (patientLocations.length > 0 && !isTracking) {
        // If no current location but we have patients, fit to patients
        try {
          const bounds = L.latLngBounds(patientLocations.map(p => [p.lat, p.lng] as [number, number]))
          map.fitBounds(bounds.pad(0.2))
        } catch (e) {
          console.warn('Error fitting bounds:', e)
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
      if (routeLineRef.current && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.removeLayer(routeLineRef.current)
          if (routeLineRef.current._distanceLabel && mapInstanceRef.current.hasLayer(routeLineRef.current._distanceLabel)) {
            mapInstanceRef.current.removeLayer(routeLineRef.current._distanceLabel)
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      patientMarkersRef.current.forEach(marker => {
        try {
          if (mapInstanceRef.current && mapInstanceRef.current.hasLayer(marker)) {
            mapInstanceRef.current.removeLayer(marker)
          }
          // Remove name label if exists
          if (marker._nameLabel && mapInstanceRef.current && mapInstanceRef.current.hasLayer(marker._nameLabel)) {
            mapInstanceRef.current.removeLayer(marker._nameLabel)
          }
          // Remove address label if exists
          if (marker._addressLabel && mapInstanceRef.current && mapInstanceRef.current.hasLayer(marker._addressLabel)) {
            mapInstanceRef.current.removeLayer(marker._addressLabel)
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      })
      patientMarkersRef.current = []
    }
  }, [currentLocation, routePoints, isTracking, patientLocations, selectedPatientId])

  // Separate effect to handle map centering and route guideline when patient is selected
  useEffect(() => {
    console.log('🔔 Route guideline effect triggered:', {
      hasMap: !!mapInstanceRef.current,
      selectedPatientId,
      patientLocationsCount: patientLocations.length,
      patientLocations: patientLocations.map(p => ({ id: p.id, name: p.name, hasCoords: !!(p.lat && p.lng) }))
    })
    
    // Wait for map to be ready - but don't require currentLocation immediately
    if (!mapInstanceRef.current) {
      console.warn('⚠️ Map not initialized yet')
      return
    }
    
    if (!selectedPatientId) {
      // No patient selected - this is OK, just return
      return
    }
    
    if (!patientLocations.length) {
      console.warn('⚠️ No patient locations available yet')
      return
    }

    const map = mapInstanceRef.current
    const selectedPatient = patientLocations.find(p => p.id === selectedPatientId)

    if (!selectedPatient) {
      console.warn('⚠️ Selected patient not found in locations:', {
        selectedPatientId,
        availableIds: patientLocations.map(p => p.id),
        availableNames: patientLocations.map(p => p.name)
      })
      return
    }

    if (!selectedPatient.lat || !selectedPatient.lng) {
      console.warn('⚠️ Selected patient has no coordinates:', {
        name: selectedPatient.name,
        lat: selectedPatient.lat,
        lng: selectedPatient.lng
      })
      return
    }

    console.log('📍 Route guideline: Drawing route', {
      selectedPatientId,
      selectedPatient: { 
        name: selectedPatient.name, 
        lat: selectedPatient.lat, 
        lng: selectedPatient.lng,
        isLive: selectedPatient.isLiveLocation 
      },
      currentLocation: currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : null
    })

    if (selectedPatient && selectedPatient.lat && selectedPatient.lng) {
      console.log('✅ Patient found with coordinates, drawing route guideline')
      
      // Center map on selected patient location
      const boundsPoints: [number, number][] = []
      
      // Add current location if available
      if (currentLocation && currentLocation.lat && currentLocation.lng) {
        boundsPoints.push([currentLocation.lat, currentLocation.lng])
        
        // Draw route guideline from staff to patient using actual road routing
        const drawRoute = async () => {
          try {
            console.log('✅ Drawing route guideline from staff to patient (using road routing)')
            
            // Remove existing route guideline if any
            if (routeLineRef.current) {
              try {
                if (map.hasLayer(routeLineRef.current)) {
                  map.removeLayer(routeLineRef.current)
                }
                if (routeLineRef.current._distanceLabel && map.hasLayer(routeLineRef.current._distanceLabel)) {
                  map.removeLayer(routeLineRef.current._distanceLabel)
                }
                if (routeLineRef.current._arrows) {
                  routeLineRef.current._arrows.forEach((arrow: any) => {
                    if (map.hasLayer(arrow)) map.removeLayer(arrow)
                  })
                }
              } catch (e) {
                console.warn('Error removing old route guideline:', e)
              }
              routeLineRef.current = null
            }
            
            // Try to get actual road route first
            const roadRoute = await getRoadRoute(
              currentLocation.lat,
              currentLocation.lng,
              selectedPatient.lat,
              selectedPatient.lng
            )
            
            // Use road route if available, otherwise fall back to straight line
            let routePoints: Array<[number, number]>
            let distance: number
            let etaMinutes: number
            
            if (roadRoute && roadRoute.routePoints.length > 0) {
              routePoints = roadRoute.routePoints
              distance = roadRoute.distance
              etaMinutes = roadRoute.duration
              console.log('✅ Using actual road route:', routePoints.length, 'points')
            } else {
              // Fallback to straight line
              routePoints = [
                [currentLocation.lat, currentLocation.lng],
                [selectedPatient.lat, selectedPatient.lng]
              ]
              
              // Calculate distance using Haversine formula
              const R = 3959 // Earth radius in miles
              const dLat = (selectedPatient.lat - currentLocation.lat) * Math.PI / 180
              const dLng = (selectedPatient.lng - currentLocation.lng) * Math.PI / 180
              const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(currentLocation.lat * Math.PI / 180) * Math.cos(selectedPatient.lat * Math.PI / 180) *
                        Math.sin(dLng/2) * Math.sin(dLng/2)
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
              distance = R * c
              
              // Calculate ETA (estimated time of arrival) - assume average speed of 30 mph
              const averageSpeed = 30 // mph
              etaMinutes = Math.round((distance / averageSpeed) * 60)
              
              console.log('⚠️ Using straight line fallback')
            }
            
            // Create route guideline following actual roads
            const routeGuideline = L.polyline(routePoints, {
              color: '#3b82f6', // BLUE route line like navigation apps
              weight: 8, // Thicker line for better visibility
              opacity: 0.85, // Slightly transparent but visible
              smoothFactor: 1,
              lineCap: 'round',
              lineJoin: 'round'
            }).addTo(map)
            
            console.log('✅ Route guideline line drawn:', {
              from: { lat: currentLocation.lat, lng: currentLocation.lng },
              to: { lat: selectedPatient.lat, lng: selectedPatient.lng },
              routeType: roadRoute ? 'road' : 'straight',
              points: routePoints.length
            })
            
            // Add animated pulse effect to route line (like navigation apps)
            routeGuideline.on('add', function() {
              const path = this._path
              if (path) {
                path.style.animation = 'routePulse 2s ease-in-out infinite'
              }
            })
            
            routeLineRef.current = routeGuideline
            
            // Add direction arrow markers along the route (like navigation apps) - RED ARROWS
            const numArrows = Math.min(5, Math.max(2, Math.floor(routePoints.length / 10))) // Adjust based on route points
            routeLineRef.current._arrows = []
            
            for (let i = 1; i < numArrows; i++) {
              const t = i / numArrows
              let arrowLat: number
              let arrowLng: number
              let nextPointIndex: number
              
              if (roadRoute && routePoints.length > 1) {
                // Use actual route points for arrow placement
                nextPointIndex = Math.floor(t * (routePoints.length - 1))
                const currentPoint = routePoints[nextPointIndex]
                const nextPoint = routePoints[Math.min(nextPointIndex + 1, routePoints.length - 1)]
                arrowLat = currentPoint[0]
                arrowLng = currentPoint[1]
                
                // Calculate bearing from current point to next point
                const dLng = (nextPoint[1] - currentPoint[1]) * Math.PI / 180
                const lat1 = currentPoint[0] * Math.PI / 180
                const lat2 = nextPoint[0] * Math.PI / 180
                const y = Math.sin(dLng) * Math.cos(lat2)
                const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
                const bearing = Math.atan2(y, x) * 180 / Math.PI
                
                const arrowMarker = L.marker([arrowLat, arrowLng], {
                  icon: L.divIcon({
                    className: 'route-arrow-marker',
                    html: `
                      <div style="
                        transform: rotate(${bearing}deg);
                        font-size: 24px;
                        color: #ef4444;
                        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.5));
                        font-weight: bold;
                      ">
                        ➤
                      </div>
                    `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                  }),
                  interactive: false,
                  zIndexOffset: 450
                }).addTo(map)
                
                routeLineRef.current._arrows.push(arrowMarker)
              } else {
                // Fallback: straight line arrow placement
                arrowLat = currentLocation.lat + (selectedPatient.lat - currentLocation.lat) * t
                arrowLng = currentLocation.lng + (selectedPatient.lng - currentLocation.lng) * t
                
                // Calculate bearing for arrow direction
                const dLng = (selectedPatient.lng - currentLocation.lng) * Math.PI / 180
                const lat1 = currentLocation.lat * Math.PI / 180
                const lat2 = selectedPatient.lat * Math.PI / 180
                const y = Math.sin(dLng) * Math.cos(lat2)
                const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
                const bearing = Math.atan2(y, x) * 180 / Math.PI
                
                const arrowMarker = L.marker([arrowLat, arrowLng], {
                  icon: L.divIcon({
                    className: 'route-arrow-marker',
                    html: `
                      <div style="
                        transform: rotate(${bearing}deg);
                        font-size: 24px;
                        color: #ef4444;
                        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.5));
                        font-weight: bold;
                      ">
                        ➤
                      </div>
                    `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                  }),
                  interactive: false,
                  zIndexOffset: 450
                }).addTo(map)
                
                routeLineRef.current._arrows.push(arrowMarker)
              }
            }
            
            console.log('✅ Added', routeLineRef.current._arrows.length, 'direction arrows along route')
            
            // Add distance label at midpoint of route
            let midLat: number
            let midLng: number
            
            if (roadRoute && routePoints.length > 0) {
              // Use middle point of route
              const midIndex = Math.floor(routePoints.length / 2)
              midLat = routePoints[midIndex][0]
              midLng = routePoints[midIndex][1]
            } else {
              // Fallback: use midpoint of straight line
              midLat = (currentLocation.lat + selectedPatient.lat) / 2
              midLng = (currentLocation.lng + selectedPatient.lng) / 2
            }
            
            const distanceLabel = L.marker([midLat, midLng], {
              icon: L.divIcon({
                className: 'route-distance-label',
                html: `
                  <div style="
                    background: ${selectedPatient.isLiveLocation ? '#10b981' : '#3b82f6'};
                    color: white;
                    padding: 6px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    font-weight: bold;
                    white-space: nowrap;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                    border: 3px solid white;
                    text-align: center;
                    min-width: 80px;
                  ">
                    <div style="font-size: 14px; margin-bottom: 2px;">${distance.toFixed(1)} mi</div>
                    <div style="font-size: 10px; opacity: 0.9;">~${etaMinutes} min</div>
                  </div>
                `,
                iconSize: [90, 50],
                iconAnchor: [45, 25]
              }),
              interactive: false,
              zIndexOffset: 500
            }).addTo(map)
            
            // Store reference for cleanup
            routeLineRef.current._distanceLabel = distanceLabel
            
            // Add CSS animation for route pulse effect
            if (typeof document !== 'undefined') {
              const style = document.createElement('style')
              style.textContent = `
                @keyframes routePulse {
                  0%, 100% { 
                    stroke-opacity: 0.9;
                    stroke-width: 8;
                  }
                  50% { 
                    stroke-opacity: 0.6;
                    stroke-width: 10;
                  }
                }
              `
              if (!document.getElementById('route-pulse-style')) {
                style.id = 'route-pulse-style'
                document.head.appendChild(style)
              }
            }
            
            console.log('✅✅✅ Route guideline drawn successfully!', {
              distance: distance.toFixed(2) + ' mi',
              eta: etaMinutes + ' min',
              arrows: routeLineRef.current._arrows?.length || 0,
              routeType: roadRoute ? 'road' : 'straight',
              from: { lat: currentLocation.lat, lng: currentLocation.lng },
              to: { lat: selectedPatient.lat, lng: selectedPatient.lng }
            })
            
            // Force map to update and show the route
            setTimeout(() => {
              map.invalidateSize()
              // Fit bounds to all route points if available
              if (roadRoute && routePoints.length > 0) {
                const bounds = L.latLngBounds(routePoints)
                map.fitBounds(bounds.pad(0.2))
              } else {
                map.fitBounds(L.latLngBounds([
                  [currentLocation.lat, currentLocation.lng],
                  [selectedPatient.lat, selectedPatient.lng]
                ]).pad(0.2))
              }
            }, 100)
          } catch (e) {
            console.error('❌ Error drawing route guideline:', e)
          }
        }
        
        // Call async function
        drawRoute()
      } else {
        console.warn('⚠️ Cannot draw route guideline: Staff location not available - will center on patient only')
      }
      
      // Add selected patient location (required) - always add even if no current location
      boundsPoints.push([selectedPatient.lat, selectedPatient.lng])
      
      // Center map on patient location (or both if staff location available)
      try {
        if (boundsPoints.length > 0) {
          const bounds = L.latLngBounds(boundsPoints)
          map.fitBounds(bounds.pad(0.2))
        } else {
          // If no bounds, just center on patient
          map.setView([selectedPatient.lat, selectedPatient.lng], 15)
        }
        
        // Also open popup for selected patient marker
        setTimeout(() => {
          const selectedMarker = patientMarkersRef.current.find((m: any) => {
            if (!m || !m.getLatLng) return false
            const markerLat = m.getLatLng().lat
            const markerLng = m.getLatLng().lng
            return Math.abs(markerLat - selectedPatient.lat) < 0.001 && 
                   Math.abs(markerLng - selectedPatient.lng) < 0.001
          })
          
          if (selectedMarker) {
            selectedMarker.openPopup()
            console.log('✅ Opened popup for selected patient marker')
          } else {
            console.warn('⚠️ Could not find selected patient marker to open popup')
          }
        }, 500)
      } catch (e) {
        console.warn('Error centering map on selected patient:', e)
        // Fallback: just center on patient
        try {
          map.setView([selectedPatient.lat, selectedPatient.lng], 15)
        } catch (e2) {
          console.error('Error setting map view:', e2)
        }
      }
    } else {
      console.warn('⚠️ Selected patient has invalid coordinates')
    }
    
    // Cleanup route guideline when selection changes
    return () => {
      if (mapInstanceRef.current && routeLineRef.current) {
        try {
          // Remove route guideline
          if (mapInstanceRef.current.hasLayer(routeLineRef.current)) {
            mapInstanceRef.current.removeLayer(routeLineRef.current)
          }
          // Remove distance label if exists
          if (routeLineRef.current._distanceLabel && mapInstanceRef.current.hasLayer(routeLineRef.current._distanceLabel)) {
            mapInstanceRef.current.removeLayer(routeLineRef.current._distanceLabel)
          }
          // Remove arrow markers if exists
          if (routeLineRef.current._arrows && Array.isArray(routeLineRef.current._arrows)) {
            routeLineRef.current._arrows.forEach((arrow: any) => {
              if (mapInstanceRef.current.hasLayer(arrow)) {
                mapInstanceRef.current.removeLayer(arrow)
              }
            })
          }
          routeLineRef.current = null
        } catch (e) {
          console.warn('Error cleaning up route guideline:', e)
        }
      }
    }
  }, [selectedPatientId, patientLocations, currentLocation])
  
  // Retry mechanism - if patient is selected but route not drawn, retry after a delay
  useEffect(() => {
    if (!selectedPatientId || !mapInstanceRef.current) return
    
    const selectedPatient = patientLocations.find(p => p.id === selectedPatientId)
    
    // If patient is selected but no route guideline exists, retry after 1 second
    if (selectedPatient && selectedPatient.lat && selectedPatient.lng && !routeLineRef.current) {
      console.log('🔄 Retrying route guideline draw...')
      const retryTimer = setTimeout(() => {
        // Force re-trigger by updating a dummy state or re-running the effect
        if (mapInstanceRef.current && selectedPatient) {
          console.log('🔄 Retry: Drawing route guideline')
          // The main effect should handle this, but we can force a map update
          mapInstanceRef.current.invalidateSize()
        }
      }, 1000)
      
      return () => clearTimeout(retryTimer)
    }
  }, [selectedPatientId, patientLocations, currentLocation])

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

