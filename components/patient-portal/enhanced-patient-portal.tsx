"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  Heart,
  Pill,
  Calendar,
  FileText,
  Camera,
  Phone,
  Video,
  CheckCircle,
  User,
  Shield,
} from "lucide-react"

interface PatientPortalProps {
  patientName?: string
  patientAvatar?: string
  onEmergencyRequest: () => void
}

export function EnhancedPatientPortal({
  patientName = "Patient",
  patientAvatar,
  onEmergencyRequest,
}: PatientPortalProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isEmergencyMode, setIsEmergencyMode] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const upcomingAppointments = [
    {
      id: 1,
      type: "Nurse Visit",
      nurse: "Sarah Johnson, RN",
      date: "Today, 2:30 PM",
      status: "confirmed",
    },
    {
      id: 2,
      type: "Physical Therapy",
      therapist: "Mike Chen, PT",
      date: "Tomorrow, 10:00 AM",
      status: "pending",
    },
  ]

  const medications = [
    {
      id: 1,
      name: "Lisinopril 10mg",
      dosage: "Once daily",
      nextDose: "8:00 PM",
      remaining: 15,
    },
    {
      id: 2,
      name: "Metformin 500mg",
      dosage: "Twice daily",
      nextDose: "6:00 PM",
      remaining: 8,
    },
  ]

  const recentVisits = [
    {
      id: 1,
      date: "March 15, 2024",
      provider: "Dr. Smith",
      type: "Telehealth Consultation",
      summary: "Medication adjustment, blood pressure monitoring",
    },
    {
      id: 2,
      date: "March 12, 2024",
      provider: "Sarah Johnson, RN",
      type: "Home Visit",
      summary: "Wound care, vital signs assessment",
    },
  ]

  const handleEmergencyRequest = () => {
    setIsEmergencyMode(true)
    onEmergencyRequest()

    // Reset emergency mode after 30 seconds
    setTimeout(() => setIsEmergencyMode(false), 30000)
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 border-2 border-white">
                <AvatarImage src={patientAvatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-white text-blue-600 text-xl font-bold">
                  {patientName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">Welcome, {patientName}</h1>
                <p className="text-blue-100">Your health is our priority</p>
                <p className="text-blue-200 text-sm">
                  {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5" />
                <span className="text-sm">HIPAA Protected</span>
              </div>
              <Badge className="bg-green-500 hover:bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified Patient
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Button */}
      <Card className={`border-2 ${isEmergencyMode ? "border-red-500 bg-red-50" : "border-red-200"}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full ${isEmergencyMode ? "bg-red-500 animate-pulse" : "bg-red-100"}`}>
                <AlertTriangle className={`h-6 w-6 ${isEmergencyMode ? "text-white" : "text-red-600"}`} />
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Emergency Care Request</h3>
                <p className="text-red-700 text-sm">
                  {isEmergencyMode
                    ? "Emergency request sent! A nurse will contact you shortly."
                    : "Need immediate medical attention? Tap to request emergency care."}
                </p>
              </div>
            </div>
            <Button
              onClick={handleEmergencyRequest}
              disabled={isEmergencyMode}
              className={`${isEmergencyMode ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white px-8`}
            >
              {isEmergencyMode ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Request Sent
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Emergency Help
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="history">Visit History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Video className="h-4 w-4 mr-2" />
                  Request Video Call
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Nurse
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  View Care Plan
                </Button>
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Today's Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.filter((apt) => apt.date.includes("Today")).length > 0 ? (
                  <div className="space-y-3">
                    {upcomingAppointments
                      .filter((apt) => apt.date.includes("Today"))
                      .map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{appointment.type}</p>
                            <p className="text-sm text-gray-600">{appointment.nurse || appointment.therapist}</p>
                            <p className="text-sm text-blue-600">{appointment.date}</p>
                          </div>
                          <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                            {appointment.status}
                          </Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No appointments scheduled for today</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Medication Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Pill className="h-5 w-5 mr-2" />
                Medication Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medications.map((med) => (
                  <div key={med.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{med.name}</h4>
                        <p className="text-sm text-gray-600">{med.dosage}</p>
                      </div>
                      <Badge variant={med.remaining < 10 ? "destructive" : "secondary"}>{med.remaining} left</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Next dose:</span>
                      <span className="font-medium">{med.nextDose}</span>
                    </div>
                    {med.remaining < 10 && (
                      <div className="mt-2 p-2 bg-orange-50 rounded text-orange-800 text-xs">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />
                        Refill needed soon
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{appointment.type}</h4>
                        <p className="text-sm text-gray-600">{appointment.nurse || appointment.therapist}</p>
                        <p className="text-sm text-gray-500">{appointment.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                        {appointment.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Reschedule
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications">
          <Card>
            <CardHeader>
              <CardTitle>Current Medications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {medications.map((med) => (
                  <div key={med.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-lg">{med.name}</h4>
                        <p className="text-gray-600">{med.dosage}</p>
                      </div>
                      <Badge variant={med.remaining < 10 ? "destructive" : "secondary"}>
                        {med.remaining} pills remaining
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Next dose:</span>
                        <span className="font-medium">{med.nextDose}</span>
                      </div>

                      <Progress value={(med.remaining / 30) * 100} className="h-2" />

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Supply level</span>
                        <span>{Math.round((med.remaining / 30) * 100)}%</span>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-3">
                      <Button size="sm" variant="outline">
                        Mark as Taken
                      </Button>
                      <Button size="sm" variant="outline">
                        Request Refill
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentVisits.map((visit) => (
                  <div key={visit.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{visit.type}</h4>
                        <p className="text-sm text-gray-600">{visit.provider}</p>
                        <p className="text-sm text-gray-500">{visit.date}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        View Notes
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{visit.summary}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
