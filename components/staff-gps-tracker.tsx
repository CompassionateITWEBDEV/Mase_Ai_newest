"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MapPin, User, Clock, Gauge, Sparkles, MessageSquare, Phone, BarChart3 } from "lucide-react"
import LiveStaffMap from "@/components/live-staff-map"

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
  location: { lat: number; lng: number } | null
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

interface StaffGpsTrackerProps {
  staffFleet: StaffMember[]
  filter: string
}

export default function StaffGpsTracker({ staffFleet, filter }: StaffGpsTrackerProps) {
  const filteredFleet = staffFleet.filter((staff) => {
    if (filter === "All") return true
    if (filter === "En Route") return staff.status === "En Route"
    if (filter === "Driving") return staff.status === "Driving"
    return staff.status === filter
  })

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(
    filteredFleet.find(s => s.location !== null) || filteredFleet[0] || null
  )

  // Update selectedStaff when filteredFleet changes
  useEffect(() => {
    // If current selected staff is not in filtered list, select a new one
    const currentSelectedId = selectedStaff?.id
    if (currentSelectedId && !filteredFleet.find(s => s.id === currentSelectedId)) {
      const newSelection = filteredFleet.find(s => s.location !== null) || filteredFleet[0] || null
      setSelectedStaff(newSelection)
    } else if (!selectedStaff && filteredFleet.length > 0) {
      // If no selection and we have staff, select the first one with location or first one
      const newSelection = filteredFleet.find(s => s.location !== null) || filteredFleet[0] || null
      setSelectedStaff(newSelection)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredFleet])

  // Helper function to format phone number for WhatsApp (remove non-digits, add country code if needed)
  const formatPhoneForWhatsApp = (phone: string): string => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '')
    
    // If it doesn't start with a country code, assume US (+1)
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned
    }
    
    return cleaned
  }

  // Handle phone call
  const handleCall = (phoneNumber?: string) => {
    if (!phoneNumber) {
      alert('Phone number not available for this staff member')
      return
    }
    // Open phone dialer
    window.location.href = `tel:${phoneNumber}`
  }

  // Handle WhatsApp message
  const handleWhatsAppMessage = (phoneNumber?: string) => {
    if (!phoneNumber) {
      alert('Phone number not available for this staff member')
      return
    }
    // Format phone number for WhatsApp
    const formattedPhone = formatPhoneForWhatsApp(phoneNumber)
    // Open WhatsApp with the phone number
    window.open(`https://wa.me/${formattedPhone}`, '_blank')
  }

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Map View */}
      <div className="lg:col-span-2 order-2 lg:order-1">
        <Card className="h-[400px] sm:h-[500px] lg:h-[600px]">
          <CardContent className="p-0 h-full relative">
            <LiveStaffMap
              staffFleet={filteredFleet}
              selectedStaff={selectedStaff}
              onStaffSelect={setSelectedStaff}
            />
          </CardContent>
        </Card>
      </div>

      {/* Staff Details & List */}
      <div className="space-y-4 order-1 lg:order-2">
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
                      onClick={() => handleWhatsAppMessage(selectedStaff.phoneNumber)}
                      title="Send WhatsApp message"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 bg-transparent"
                      onClick={() => handleCall(selectedStaff.phoneNumber)}
                      title="Call staff member"
                    >
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
                  {selectedStaff.routeOptimization && selectedStaff.routeOptimization.improvementPercent > 0 ? (
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Sparkles className="h-3 w-3 mr-1 text-blue-500" />
                      <span>
                        {selectedStaff.routeOptimization.distanceSaved > 0 && selectedStaff.routeOptimization.timeSaved > 0
                          ? `${selectedStaff.routeOptimization.distanceSaved.toFixed(1)} miles & ${selectedStaff.routeOptimization.timeSaved} mins ${selectedStaff.routeOptimization.isOptimized ? 'saved' : 'can be saved'} today`
                          : selectedStaff.routeOptimization.distanceSaved > 0
                            ? `${selectedStaff.routeOptimization.distanceSaved.toFixed(1)} miles ${selectedStaff.routeOptimization.isOptimized ? 'saved' : 'can be saved'} today`
                            : selectedStaff.routeOptimization.timeSaved > 0
                              ? `${selectedStaff.routeOptimization.timeSaved} mins ${selectedStaff.routeOptimization.isOptimized ? 'saved' : 'can be saved'} today`
                              : 'Route optimized'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Sparkles className="h-3 w-3 mr-1" />
                      <span>No route optimization available</span>
                    </div>
                  )}
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
