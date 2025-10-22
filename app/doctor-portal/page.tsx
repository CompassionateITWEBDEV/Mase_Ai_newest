"use client"

import { EnhancedDoctorSignup } from "@/components/doctor-portal/enhanced-doctor-signup"
import { EnhancedAvailabilityToggle } from "@/components/doctor-portal/enhanced-availability-toggle"
import { EnhancedLiveConsultPanel } from "@/components/doctor-portal/enhanced-live-consult-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Activity } from "lucide-react"

export default function DoctorPortalPage() {
  const mockConsultRequest = {
    id: "consult-123",
    nurseName: "Sarah Johnson",
    nurseAvatar: "/placeholder.svg?height=40&width=40",
    patientInitials: "J.D.",
    patientAge: 67,
    reasonForConsult: "Patient experiencing chest pain and shortness of breath",
    urgencyLevel: "high" as const,
    symptoms: ["Chest pain", "Shortness of breath", "Dizziness", "Nausea"],
    vitalSigns: {
      bloodPressure: "160/95",
      heartRate: 98,
      temperature: 99.2,
      oxygenSaturation: 94,
    },
    timestamp: new Date(Date.now() - 120000), // 2 minutes ago
    estimatedDuration: 15,
    compensation: 125,
  }

  const handleAcceptConsult = (requestId: string) => {
    console.log("Accepting consultation:", requestId)
  }

  const handleRejectConsult = (requestId: string) => {
    console.log("Rejecting consultation:", requestId)
  }

  const handleStartVideo = (requestId: string) => {
    console.log("Starting video call for:", requestId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mr-4">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Doctor Portal
              </h1>
              <p className="text-gray-600">AI-Powered Telehealth Platform</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="consultations">Live Consultations</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="signup">Join Network</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2" />
                      Dashboard Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">12</div>
                        <div className="text-sm text-gray-600">Today's Consultations</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">$875</div>
                        <div className="text-sm text-gray-600">Today's Earnings</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">4.9</div>
                        <div className="text-sm text-gray-600">Average Rating</div>
                      </div>
                    </div>
                    <p className="text-gray-600">
                      Welcome to the AI-powered telehealth platform. You can manage your availability, accept
                      consultations, and provide urgent care to patients in need.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <EnhancedAvailabilityToggle />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="consultations">
            <EnhancedLiveConsultPanel
              consultRequest={mockConsultRequest}
              onAccept={handleAcceptConsult}
              onReject={handleRejectConsult}
              onStartVideo={handleStartVideo}
            />
          </TabsContent>

          <TabsContent value="availability">
            <EnhancedAvailabilityToggle />
          </TabsContent>

          <TabsContent value="signup">
            <EnhancedDoctorSignup />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
