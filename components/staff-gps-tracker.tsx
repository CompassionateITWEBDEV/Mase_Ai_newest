"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MapPin, User, Clock, Gauge, Sparkles, MessageSquare, Phone, BarChart3 } from "lucide-react"

interface StaffMember {
  id: string
  name: string
  role: string
  status: string
  currentSpeed: number
  etaToNext: string
  nextPatient: string
  totalDistanceToday: number
  totalDriveTimeToday: number
  totalVisitTimeToday: number
  efficiencyScore: number
  location: { lat: number; lng: number }
}

interface StaffGpsTrackerProps {
  staffFleet: StaffMember[]
  filter: string
}

export default function StaffGpsTracker({ staffFleet, filter }: StaffGpsTrackerProps) {
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(staffFleet[0] || null)

  const filteredFleet = staffFleet.filter((staff) => {
    if (filter === "All") return true
    if (filter === "En Route") return staff.status === "En Route" || staff.status === "Driving"
    return staff.status === filter
  })

  const handleSendLocationLink = async (staffId: string) => {
    // In a real app, you'd get the patient's number associated with the staff's next visit
    const patientPhoneNumber = "+15551234567" // Mock phone number
    await fetch("/api/gps/send-location-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, patientPhoneNumber }),
    })
    alert(`Location link sent to patient for staff ${staffId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "En Route":
      case "Driving":
        return "bg-blue-500"
      case "On Visit":
        return "bg-green-500"
      case "Idle":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map View */}
      <div className="lg:col-span-2">
        <Card className="h-[600px]">
          <CardContent className="p-0 h-full relative">
            {/* This is a placeholder for a real map component like React Leaflet or Google Maps */}
            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-16 w-16 mx-auto" />
                <p>Live Map View</p>
              </div>
            </div>
            {/* Render staff markers on the map */}
            {filteredFleet.map((staff) => (
              <div
                key={staff.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{
                  top: `${50 + (staff.location.lat - 34.0522) * 2000}%`,
                  left: `${50 + (staff.location.lng + 118.2437) * 2000}%`,
                }}
                onClick={() => setSelectedStaff(staff)}
              >
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(staff.status)} ring-2 ring-white ${
                    selectedStaff?.id === staff.id ? "ring-blue-500 ring-4" : ""
                  }`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Staff Details & List */}
      <div className="space-y-4">
        {selectedStaff && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedStaff.name}</CardTitle>
              <CardDescription>{selectedStaff.role}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={`${getStatusColor(selectedStaff.status)} text-white`}>{selectedStaff.status}</Badge>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 bg-transparent"
                      onClick={() => handleSendLocationLink(selectedStaff.id)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <Gauge className="h-4 w-4 mr-2 text-muted-foreground" /> Speed: {selectedStaff.currentSpeed} mph
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" /> ETA: {selectedStaff.etaToNext}
                  </div>
                  <div className="flex items-center col-span-2">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" /> Next: {selectedStaff.nextPatient}
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <h4 className="text-sm font-medium mb-2">Route Optimization</h4>
                  <div className="flex items-center justify-between text-sm">
                    <span>Efficiency Score:</span>
                    <span className="font-bold text-green-600">{selectedStaff.efficiencyScore}%</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Sparkles className="h-3 w-3 mr-1 text-blue-500" />
                    <span>3.2 miles & 8 mins saved today</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Staff List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFleet.map((staff) => (
                  <TableRow
                    key={staff.id}
                    onClick={() => setSelectedStaff(staff)}
                    className={`cursor-pointer ${selectedStaff?.id === staff.id ? "bg-blue-50" : ""}`}
                  >
                    <TableCell>
                      <div className="font-medium">{staff.name}</div>
                      <div className="text-xs text-muted-foreground">{staff.role}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {staff.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
