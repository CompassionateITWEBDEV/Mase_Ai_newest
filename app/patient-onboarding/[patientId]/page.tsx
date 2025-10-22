"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  User,
  Shield,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Activity,
  Eye,
  FilePenLineIcon as Signature,
  UserCheck,
  ClipboardCheck,
  Timer,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"

interface Patient {
  id: string
  name: string
  phone: string
  address: string
  dateOfBirth: string
  emergencyContact: string
  emergencyPhone: string
  firstVisitScheduled: string
  assignedNurse: string
  services: string[]
  priority: "high" | "medium" | "low"
  insuranceProvider: string
  insuranceId: string
  primaryDiagnosis: string
}

interface OnboardingStep {
  id: string
  title: string
  description: string
  required: boolean
  completed: boolean
  nurseWitnessRequired: boolean
  patientSignatureRequired: boolean
  notes?: string
}

export default function PatientOnboardingPage() {
  const params = useParams()
  const patientId = params.patientId as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [nurseAuthenticated, setNurseAuthenticated] = useState(false)
  const [nurseName, setNurseName] = useState("")
  const [nurseLicense, setNurseLicense] = useState("")
  const [patientPresent, setPatientPresent] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [sessionNotes, setSessionNotes] = useState("")
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)

  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([
    {
      id: "identity-verification",
      title: "Patient Identity Verification",
      description: "Verify patient identity with photo ID and confirm personal information",
      required: true,
      completed: false,
      nurseWitnessRequired: true,
      patientSignatureRequired: false,
    },
    {
      id: "consent-forms",
      title: "Consent for Treatment",
      description: "Review and obtain signatures for treatment consent forms",
      required: true,
      completed: false,
      nurseWitnessRequired: true,
      patientSignatureRequired: true,
    },
    {
      id: "hipaa-authorization",
      title: "HIPAA Authorization",
      description: "Explain and obtain HIPAA privacy authorization",
      required: true,
      completed: false,
      nurseWitnessRequired: true,
      patientSignatureRequired: true,
    },
    {
      id: "insurance-verification",
      title: "Insurance Information Review",
      description: "Verify insurance information and coverage details",
      required: true,
      completed: false,
      nurseWitnessRequired: true,
      patientSignatureRequired: false,
    },
    {
      id: "emergency-contacts",
      title: "Emergency Contact Information",
      description: "Confirm and update emergency contact information",
      required: true,
      completed: false,
      nurseWitnessRequired: true,
      patientSignatureRequired: true,
    },
    {
      id: "care-plan-review",
      title: "Care Plan Review",
      description: "Review initial care plan and service expectations",
      required: true,
      completed: false,
      nurseWitnessRequired: true,
      patientSignatureRequired: true,
    },
    {
      id: "patient-rights",
      title: "Patient Rights & Responsibilities",
      description: "Review patient rights, responsibilities, and complaint procedures",
      required: true,
      completed: false,
      nurseWitnessRequired: true,
      patientSignatureRequired: true,
    },
    {
      id: "portal-setup",
      title: "Patient Portal Setup",
      description: "Set up patient portal access and provide login credentials",
      required: true,
      completed: false,
      nurseWitnessRequired: true,
      patientSignatureRequired: false,
    },
  ])

  // Load patient data
  useEffect(() => {
    const loadPatientData = async () => {
      try {
        const response = await fetch(`/api/patients/${patientId}`)
        if (response.ok) {
          const data = await response.json()
          setPatient(data.patient)
        }
      } catch (error) {
        console.error("Error loading patient data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (patientId) {
      loadPatientData()
    }
  }, [patientId])

  const authenticateNurse = () => {
    if (nurseName && nurseLicense) {
      setNurseAuthenticated(true)
    }
  }

  const startOnboardingSession = () => {
    if (patientPresent && nurseAuthenticated) {
      setSessionStarted(true)
    }
  }

  const completeStep = (stepIndex: number) => {
    const updatedSteps = [...onboardingSteps]
    updatedSteps[stepIndex].completed = true
    setOnboardingSteps(updatedSteps)

    // Move to next step
    if (stepIndex < onboardingSteps.length - 1) {
      setCurrentStep(stepIndex + 1)
    }
  }

  const completeOnboarding = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "onboarded",
          onboardingCompletedBy: nurseName,
          onboardingCompletedAt: new Date().toISOString(),
          sessionNotes: sessionNotes,
        }),
      })

      if (response.ok) {
        // Redirect to success page or dashboard
        window.location.href = "/staff-dashboard?tab=pending-onboarding&success=onboarding-completed"
      }
    } catch (error) {
      console.error("Error completing onboarding:", error)
    }
  }

  const completedSteps = onboardingSteps.filter((step) => step.completed).length
  const progressPercentage = (completedSteps / onboardingSteps.length) * 100

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient information...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Patient Not Found</h2>
            <p className="text-gray-600 mb-4">The requested patient could not be found.</p>
            <Link href="/staff-dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/staff-dashboard?tab=pending-onboarding">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Patient Onboarding</h1>
                <p className="text-gray-600">First Visit Documentation & Portal Setup</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-red-100 text-red-800">FIRST VISIT REQUIRED</Badge>
              {sessionStarted && <Badge className="bg-green-100 text-green-800">SESSION ACTIVE</Badge>}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Information Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <User className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium">Patient Details</span>
                </div>
                <p className="font-semibold">{patient.name}</p>
                <p className="text-sm text-gray-600">{patient.id}</p>
                <p className="text-sm text-gray-600">DOB: {patient.dateOfBirth}</p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <MapPin className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium">Contact Information</span>
                </div>
                <p className="text-sm">{patient.address}</p>
                <p className="text-sm text-gray-600">{patient.phone}</p>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <Activity className="h-4 w-4 text-purple-600 mr-2" />
                  <span className="text-sm font-medium">Scheduled Visit</span>
                </div>
                <p className="font-semibold text-purple-600">{patient.firstVisitScheduled}</p>
                <p className="text-sm text-gray-600">{patient.assignedNurse}</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <FileText className="h-4 w-4 text-gray-600 mr-2" />
                <span className="text-sm font-medium">Services Required</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {patient.services.map((service, index) => (
                  <Badge key={index} variant="outline">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nurse Authentication */}
        {!nurseAuthenticated && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                Nurse Authentication Required
              </CardTitle>
              <CardDescription>Verify your identity to begin the onboarding session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nurseName">Full Name</Label>
                  <Input
                    id="nurseName"
                    value={nurseName}
                    onChange={(e) => setNurseName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="nurseLicense">License Number</Label>
                  <Input
                    id="nurseLicense"
                    value={nurseLicense}
                    onChange={(e) => setNurseLicense(e.target.value)}
                    placeholder="Enter your license number"
                  />
                </div>
              </div>
              <Button className="mt-4" onClick={authenticateNurse} disabled={!nurseName || !nurseLicense}>
                <UserCheck className="h-4 w-4 mr-2" />
                Authenticate
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Session Start */}
        {nurseAuthenticated && !sessionStarted && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Timer className="h-5 w-5 mr-2 text-blue-600" />
                Start Onboarding Session
              </CardTitle>
              <CardDescription>Confirm patient presence and begin the onboarding process</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4 border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Legal Requirements</AlertTitle>
                <AlertDescription className="text-blue-700">
                  • Nurse must be physically present during entire onboarding process
                  <br />• Patient identity must be verified with photo ID
                  <br />• All documents must be explained before patient signs
                  <br />• Nurse witness signature required for all legal documents
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium mb-2">Authenticated Nurse:</p>
                  <p className="text-sm">{nurseName}</p>
                  <p className="text-sm text-gray-600">License: {nurseLicense}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="patientPresent"
                    checked={patientPresent}
                    onCheckedChange={(checked) => setPatientPresent(checked as boolean)}
                  />
                  <Label htmlFor="patientPresent" className="text-sm">
                    I confirm that the patient is physically present and ready to begin onboarding
                  </Label>
                </div>

                <Button onClick={startOnboardingSession} disabled={!patientPresent} className="w-full">
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Start Onboarding Session
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Onboarding Progress */}
        {sessionStarted && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <ClipboardCheck className="h-5 w-5 mr-2 text-green-600" />
                    Onboarding Progress
                  </span>
                  <span className="text-sm text-gray-600">
                    {completedSteps} of {onboardingSteps.length} completed
                  </span>
                </CardTitle>
                <Progress value={progressPercentage} className="h-3" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <UserCheck className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium">Session Details</span>
                    </div>
                    <p className="text-sm">Nurse: {nurseName}</p>
                    <p className="text-sm">License: {nurseLicense}</p>
                    <p className="text-sm">Started: {new Date().toLocaleTimeString()}</p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Shield className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium">Legal Compliance</span>
                    </div>
                    <p className="text-sm">✓ Nurse authenticated</p>
                    <p className="text-sm">✓ Patient present confirmed</p>
                    <p className="text-sm">✓ Session documented</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Onboarding Steps */}
            <div className="space-y-6">
              {onboardingSteps.map((step, index) => (
                <Card
                  key={step.id}
                  className={`${
                    step.completed
                      ? "border-green-200 bg-green-50"
                      : index === currentStep
                        ? "border-blue-200 bg-blue-50"
                        : "border-gray-200"
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        {step.completed ? (
                          <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                        ) : index === currentStep ? (
                          <Clock className="h-5 w-5 mr-2 text-blue-600" />
                        ) : (
                          <div className="h-5 w-5 mr-2 rounded-full border-2 border-gray-300" />
                        )}
                        Step {index + 1}: {step.title}
                      </span>
                      <div className="flex items-center space-x-2">
                        {step.required && (
                          <Badge variant="outline" className="text-xs">
                            REQUIRED
                          </Badge>
                        )}
                        {step.completed && <Badge className="bg-green-100 text-green-800 text-xs">COMPLETED</Badge>}
                      </div>
                    </CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>

                  {(index === currentStep || step.completed) && (
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-3 bg-white rounded border">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center mb-2">
                                <Eye className="h-4 w-4 text-blue-600 mr-2" />
                                <span className="text-sm font-medium">Nurse Requirements</span>
                              </div>
                              <div className="space-y-1 text-sm">
                                {step.nurseWitnessRequired && (
                                  <p className="flex items-center">
                                    <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                    Witness signature required
                                  </p>
                                )}
                                <p className="flex items-center">
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                  Explain process to patient
                                </p>
                                <p className="flex items-center">
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                  Verify understanding
                                </p>
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center mb-2">
                                <Signature className="h-4 w-4 text-purple-600 mr-2" />
                                <span className="text-sm font-medium">Patient Requirements</span>
                              </div>
                              <div className="space-y-1 text-sm">
                                {step.patientSignatureRequired && (
                                  <p className="flex items-center">
                                    <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                    Digital signature required
                                  </p>
                                )}
                                <p className="flex items-center">
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                  Review all information
                                </p>
                                <p className="flex items-center">
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                  Ask questions if needed
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {!step.completed && index === currentStep && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor={`notes-${step.id}`}>Step Notes (Optional)</Label>
                              <Textarea
                                id={`notes-${step.id}`}
                                placeholder="Add any observations or notes about this step..."
                                rows={3}
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox id={`explained-${step.id}`} />
                              <Label htmlFor={`explained-${step.id}`} className="text-sm">
                                I have explained this step to the patient and verified their understanding
                              </Label>
                            </div>

                            {step.patientSignatureRequired && (
                              <div className="flex items-center space-x-2">
                                <Checkbox id={`signature-${step.id}`} />
                                <Label htmlFor={`signature-${step.id}`} className="text-sm">
                                  Patient has provided digital signature
                                </Label>
                              </div>
                            )}

                            <Button onClick={() => completeStep(index)} className="w-full">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Complete Step {index + 1}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Session Notes */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Session Notes
                </CardTitle>
                <CardDescription>Add any additional notes about the onboarding session</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Add session notes, observations, or any issues encountered..."
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Complete Onboarding */}
            {completedSteps === onboardingSteps.length && (
              <Card className="mt-6 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-800">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Onboarding Complete
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    All required steps have been completed. Patient portal will be activated.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">Ready to Complete</AlertTitle>
                      <AlertDescription className="text-green-700">
                        • All {onboardingSteps.length} steps completed
                        <br />• Legal documentation witnessed and signed
                        <br />• Patient portal will be activated automatically
                        <br />• Care services enabled for scheduling
                      </AlertDescription>
                    </Alert>

                    <Button onClick={completeOnboarding} className="w-full bg-green-600 hover:bg-green-700" size="lg">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Complete Patient Onboarding
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}
