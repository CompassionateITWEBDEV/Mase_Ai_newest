"use client"

import { use } from "react"
import PatientETAView from "@/components/patient-eta-view"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Heart } from "lucide-react"

interface TrackingPageProps {
  params: Promise<{ staffId: string }>
}

export default function TrackingPage({ params }: TrackingPageProps) {
  const { staffId } = use(params)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Your Healthcare Provider is On The Way
          </h1>
          <p className="text-gray-600">Track your provider's location and estimated arrival time in real-time</p>
        </div>

        {/* Security Notice */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center text-sm text-gray-600">
              <Shield className="h-4 w-4 mr-2 text-green-600" />
              <span>
                This tracking link is secure and only shows location information when your provider is en route to your
                appointment.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Main Tracking Component */}
        <PatientETAView staffId={staffId} patientId="mock-patient-id" />

        {/* Additional Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">What to Expect</CardTitle>
            <CardDescription>Information about your upcoming visit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Your provider will call or text when they arrive</p>
                  <p className="text-gray-600">Please have your insurance card and ID ready</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Estimated visit duration: 30-45 minutes</p>
                  <p className="text-gray-600">This may vary based on your specific care needs</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Questions or concerns?</p>
                  <p className="text-gray-600">Use the contact buttons above to reach your provider directly</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Powered by M.A.S.E AI Healthcare Platform</p>
          <p>© 2024 Medical Automation & Smart Efficiency</p>
        </div>
      </div>
    </div>
  )
}
