"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Phone,
  Video,
  MessageSquare,
  Clock,
  AlertTriangle,
  User,
  Stethoscope,
  CheckCircle,
  X,
  DollarSign,
} from "lucide-react"

interface ConsultRequest {
  id: string
  nurseName: string
  nurseAvatar?: string
  patientInitials: string
  patientAge: number
  reasonForConsult: string
  urgencyLevel: "low" | "medium" | "high" | "critical"
  symptoms: string[]
  vitalSigns?: {
    bloodPressure?: string
    heartRate?: number
    temperature?: number
    oxygenSaturation?: number
  }
  timestamp: Date
  estimatedDuration: number
  compensation: number
}

interface EnhancedLiveConsultPanelProps {
  consultRequest?: ConsultRequest
  onAccept: (requestId: string) => void
  onReject: (requestId: string) => void
  onStartVideo: (requestId: string) => void
}

export function EnhancedLiveConsultPanel({
  consultRequest,
  onAccept,
  onReject,
  onStartVideo,
}: EnhancedLiveConsultPanelProps) {
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isAccepted, setIsAccepted] = useState(false)

  useEffect(() => {
    if (consultRequest) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - consultRequest.timestamp.getTime()) / 1000)
        setTimeElapsed(elapsed)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [consultRequest])

  if (!consultRequest) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Active Consultations</h3>
          <p className="text-gray-500">You'll see incoming consultation requests here when you're available.</p>
        </CardContent>
      </Card>
    )
  }

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Incoming Consultation</span>
            </div>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(timeElapsed)}
            </Badge>
            <Badge className={`${getUrgencyColor(consultRequest.urgencyLevel)} text-white`}>
              {consultRequest.urgencyLevel.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Patient & Nurse Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center">
              <User className="h-4 w-4 mr-2" />
              Patient Information
            </h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">{consultRequest.patientInitials}</p>
              <p className="text-sm text-gray-600">Age: {consultRequest.patientAge}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium flex items-center">
              <Stethoscope className="h-4 w-4 mr-2" />
              Attending Nurse
            </h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={consultRequest.nurseAvatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {consultRequest.nurseName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{consultRequest.nurseName}</p>
                  <p className="text-xs text-gray-600">RN, BSN</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Chief Complaint */}
        <div>
          <h4 className="font-medium mb-2 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Chief Complaint
          </h4>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-blue-900">{consultRequest.reasonForConsult}</p>
          </div>
        </div>

        {/* Symptoms */}
        {consultRequest.symptoms.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Reported Symptoms</h4>
            <div className="flex flex-wrap gap-2">
              {consultRequest.symptoms.map((symptom, index) => (
                <Badge key={index} variant="secondary">
                  {symptom}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Vital Signs */}
        {consultRequest.vitalSigns && (
          <div>
            <h4 className="font-medium mb-2">Vital Signs</h4>
            <div className="grid grid-cols-2 gap-3">
              {consultRequest.vitalSigns.bloodPressure && (
                <div className="bg-gray-50 p-2 rounded text-center">
                  <p className="text-xs text-gray-600">Blood Pressure</p>
                  <p className="font-medium">{consultRequest.vitalSigns.bloodPressure}</p>
                </div>
              )}
              {consultRequest.vitalSigns.heartRate && (
                <div className="bg-gray-50 p-2 rounded text-center">
                  <p className="text-xs text-gray-600">Heart Rate</p>
                  <p className="font-medium">{consultRequest.vitalSigns.heartRate} bpm</p>
                </div>
              )}
              {consultRequest.vitalSigns.temperature && (
                <div className="bg-gray-50 p-2 rounded text-center">
                  <p className="text-xs text-gray-600">Temperature</p>
                  <p className="font-medium">{consultRequest.vitalSigns.temperature}°F</p>
                </div>
              )}
              {consultRequest.vitalSigns.oxygenSaturation && (
                <div className="bg-gray-50 p-2 rounded text-center">
                  <p className="text-xs text-gray-600">O2 Sat</p>
                  <p className="font-medium">{consultRequest.vitalSigns.oxygenSaturation}%</p>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Consultation Details */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Est. {consultRequest.estimatedDuration} min
            </span>
            <span className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />${consultRequest.compensation}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {!isAccepted ? (
          <div className="flex space-x-3">
            <Button
              onClick={() => {
                setIsAccepted(true)
                onAccept(consultRequest.id)
              }}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Consultation
            </Button>
            <Button
              variant="outline"
              onClick={() => onReject(consultRequest.id)}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-green-800 font-medium">Consultation Accepted</p>
              <p className="text-green-600 text-sm">Connecting with nurse and patient...</p>
            </div>

            <div className="flex space-x-2">
              <Button onClick={() => onStartVideo(consultRequest.id)} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Video className="h-4 w-4 mr-2" />
                Start Video Call
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                <Phone className="h-4 w-4 mr-2" />
                Audio Only
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
