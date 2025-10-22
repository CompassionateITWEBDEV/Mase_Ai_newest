"use client"

import { EnhancedPatientPortal } from "@/components/patient-portal/enhanced-patient-portal"
import { Brain } from "lucide-react"

export default function PatientPortalEnhancedPage() {
  const handleEmergencyRequest = () => {
    console.log("Emergency request initiated!")
    // In real implementation, this would:
    // 1. Send alert to on-call nurse
    // 2. Initiate emergency protocol
    // 3. Connect to telehealth system
    // 4. Log emergency event
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
                Patient Care Portal
              </h1>
              <p className="text-gray-600">Your Personal Healthcare Dashboard</p>
            </div>
          </div>
        </div>
      </header>

      <main>
        <EnhancedPatientPortal
          patientName="Margaret Anderson"
          patientAvatar="/placeholder.svg?height=64&width=64"
          onEmergencyRequest={handleEmergencyRequest}
        />
      </main>
    </div>
  )
}
