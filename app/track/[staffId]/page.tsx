"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Play, Square, Clock, Users, CheckCircle } from "lucide-react"
import { useParams } from "next/navigation"

export default function StaffTrackingPage() {
  const params = useParams()
  const staffId = params.staffId as string
  const [currentTrip, setCurrentTrip] = useState<any>(null)
  const [currentVisit, setCurrentVisit] = useState<any>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setLocationError(null)
      },
      (error) => {
        setLocationError(`Unable to get location: ${error.message}`)
      }
    )
  }

  useEffect(() => {
    getCurrentLocation()
    // Request location every 30 seconds when tracking
    const interval = setInterval(() => {
      if (isTracking && location) {
        updateLocation()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isTracking, location])

  // Update location to server
  const updateLocation = async () => {
    if (!location || !staffId) return

    try {
      await fetch('/api/gps/update-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          tripId: currentTrip?.id,
          latitude: location.lat,
          longitude: location.lng,
          accuracy: 10
        })
      })
    } catch (e) {
      console.error('Failed to update location:', e)
    }
  }

  // Start Trip
  const startTrip = async () => {
    if (!location) {
      getCurrentLocation()
      return
    }

    try {
      const res = await fetch('/api/gps/start-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          latitude: location.lat,
          longitude: location.lng
        })
      })

      const data = await res.json()
      if (data.success) {
        setCurrentTrip(data.trip)
        setIsTracking(true)
        // Start periodic location updates
        updateLocation()
      } else {
        alert(data.error || 'Failed to start trip')
      }
    } catch (e: any) {
      alert('Failed to start trip: ' + e.message)
    }
  }

  // End Trip
  const endTrip = async () => {
    if (!currentTrip) return

    try {
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
        setCurrentTrip(null)
        setCurrentVisit(null)
        setIsTracking(false)
        alert(`Trip ended. Drive time: ${data.trip.duration} minutes, Distance: ${data.trip.totalDistance} miles`)
      } else {
        alert(data.error || 'Failed to end trip')
      }
    } catch (e: any) {
      alert('Failed to end trip: ' + e.message)
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
      } else {
        alert(data.error || 'Failed to start visit')
      }
    } catch (e: any) {
      alert('Failed to start visit: ' + e.message)
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
        alert(`Visit completed. Duration: ${data.visit.duration} minutes`)
      } else {
        alert(data.error || 'Failed to end visit')
      }
    } catch (e: any) {
      alert('Failed to end visit: ' + e.message)
    }
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
            <CardDescription>Track your trips and visits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location Status */}
            <div className="p-3 bg-gray-100 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Location</span>
                <Button size="sm" variant="outline" onClick={getCurrentLocation}>
                  <MapPin className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
              {location ? (
                <div className="text-sm">
                  <div>Lat: {location.lat.toFixed(6)}</div>
                  <div>Lng: {location.lng.toFixed(6)}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Getting location...</div>
              )}
              {locationError && (
                <div className="text-sm text-red-600 mt-1">{locationError}</div>
              )}
            </div>

            {/* Trip Controls */}
            <div className="space-y-2">
              <Label>Trip Status</Label>
              {!currentTrip ? (
                <Button className="w-full" onClick={startTrip} disabled={!location}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Trip
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge className="bg-blue-500">Trip Active</Badge>
                        <div className="text-xs text-gray-600 mt-1">
                          Started: {new Date(currentTrip.startTime).toLocaleTimeString()}
                        </div>
                      </div>
                      {isTracking && (
                        <Badge variant="outline" className="bg-green-100">Tracking</Badge>
                      )}
            </div>
          </div>
                  <Button variant="destructive" className="w-full" onClick={endTrip}>
                    <Square className="h-4 w-4 mr-2" />
                    End Trip
                  </Button>
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
                <Button className="w-full" onClick={startVisit} disabled={!currentTrip}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Visit
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
                <Button className="w-full" variant="destructive" onClick={endVisit}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  End Visit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
