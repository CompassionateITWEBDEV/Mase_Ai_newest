"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Building2, User, FileText, AlertCircle, ArrowRight, QrCode } from "lucide-react"

export default function ReferralIntakePage() {
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [routingInfo, setRoutingInfo] = useState<any>(null)
  const [submittedReferral, setSubmittedReferral] = useState<any>(null)

  // Pre-fill form if coming from QR code or facility link
  const facilityId = searchParams.get("facility")
  const marketer = searchParams.get("marketer")
  const source = searchParams.get("source")

  const [formData, setFormData] = useState({
    facilityName: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    patientName: "",
    patientAge: "",
    serviceNeeded: "",
    urgencyLevel: "routine",
    referralDate: new Date().toISOString().split("T")[0],
    referredBy: marketer || "",
    insuranceType: "",
    notes: "",
  })

  useEffect(() => {
    // If coming from QR code, pre-fill facility information
    if (facilityId && source === "qr") {
      // In real implementation, fetch facility details from API
      setFormData((prev) => ({
        ...prev,
        facilityName: "Auto-filled from QR Code",
        referredBy: marketer || "",
      }))
    }
  }, [facilityId, marketer, source])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError("")

    try {
      const response = await fetch("/api/marketing/referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          source: source || "direct",
          facilityId: facilityId || null
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSubmitSuccess(true)
        setRoutingInfo(result.routing)
        setSubmittedReferral(result.referral)
        // Reset form
        setFormData({
          facilityName: "",
          contactName: "",
          contactPhone: "",
          contactEmail: "",
          patientName: "",
          patientAge: "",
          serviceNeeded: "",
          urgencyLevel: "routine",
          referralDate: new Date().toISOString().split("T")[0],
          referredBy: marketer || "",
          insuranceType: "",
          notes: "",
        })
        // Scroll to success message
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setSubmitError(result.error || "Failed to submit referral")
      }
    } catch (error) {
      setSubmitError("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Referral Submitted Successfully!</CardTitle>
            <CardDescription>Your referral has been processed and routed appropriately.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {submittedReferral && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Referral Created</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-green-900">
                      #{submittedReferral.referralNumber}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <strong>Facility:</strong> {submittedReferral.facilityName}
                      </div>
                      <div>
                        <strong>Contact:</strong> {submittedReferral.contactName}
                      </div>
                      <div>
                        <strong>Patient:</strong> {submittedReferral.patientName}
                      </div>
                      <div>
                        <strong>Service:</strong> {submittedReferral.serviceNeeded}
                      </div>
                      <div>
                        <Badge variant={submittedReferral.urgencyLevel === 'stat' ? 'destructive' : submittedReferral.urgencyLevel === 'urgent' ? 'default' : 'secondary'}>
                          {submittedReferral.urgencyLevel.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {routingInfo && (
              <Alert className="border-blue-200 bg-blue-50">
                <ArrowRight className="h-4 w-4" />
                <AlertTitle>Routing Information</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">
                    <strong>Routed to:</strong> {routingInfo.organization}
                  </p>
                  <p className="text-sm text-gray-600">
                    This referral will be handled by the <strong>{routingInfo.organization}</strong> team based on the service type.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded">
                <strong>Next Steps:</strong>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li>• Intake team will contact you within 2 hours</li>
                  <li>• Patient assessment will be scheduled</li>
                  <li>• Authorization process will begin</li>
                </ul>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <strong>Contact Information:</strong>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li>• Phone: (555) 123-4567</li>
                  <li>• Email: intake@masepro.com</li>
                  <li>• Emergency: (555) 911-HELP</li>
                </ul>
              </div>
            </div>

            <div className="flex space-x-4 justify-center">
              <Button onClick={() => setSubmitSuccess(false)}>Submit Another Referral</Button>
              <Button variant="outline" onClick={() => window.close()}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">M.A.S.E. Pro Referral Intake</h1>
          </div>
          <p className="text-gray-600">Submit new patient referrals for healthcare services</p>
          {source === "qr" && (
            <Badge className="mt-2 bg-blue-100 text-blue-800">
              <QrCode className="h-3 w-3 mr-1" />
              QR Code Referral
            </Badge>
          )}
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Patient Referral Form</span>
            </CardTitle>
            <CardDescription>Please provide complete information for proper routing and processing</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Facility Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Facility Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="facilityName">Facility Name *</Label>
                    <Input
                      id="facilityName"
                      value={formData.facilityName}
                      onChange={(e) => handleInputChange("facilityName", e.target.value)}
                      placeholder="Enter facility name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactName">Contact Person *</Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => handleInputChange("contactName", e.target.value)}
                      placeholder="Contact person name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                      placeholder="contact@facility.com"
                    />
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="patientName">Patient Name/Initials *</Label>
                    <Input
                      id="patientName"
                      value={formData.patientName}
                      onChange={(e) => handleInputChange("patientName", e.target.value)}
                      placeholder="Patient identifier"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="patientAge">Patient Age</Label>
                    <Input
                      id="patientAge"
                      type="number"
                      value={formData.patientAge}
                      onChange={(e) => handleInputChange("patientAge", e.target.value)}
                      placeholder="Age"
                      min="0"
                      max="120"
                    />
                  </div>
                  <div>
                    <Label htmlFor="insuranceType">Insurance Type</Label>
                    <Select
                      value={formData.insuranceType}
                      onValueChange={(value) => handleInputChange("insuranceType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select insurance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medicare">Medicare</SelectItem>
                        <SelectItem value="medicaid">Medicaid</SelectItem>
                        <SelectItem value="private">Private Insurance</SelectItem>
                        <SelectItem value="self-pay">Self Pay</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Service Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Service Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="serviceNeeded">Service Needed *</Label>
                    <Select
                      value={formData.serviceNeeded}
                      onValueChange={(value) => handleInputChange("serviceNeeded", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home-health">Home Health</SelectItem>
                        <SelectItem value="behavioral">Behavioral Health</SelectItem>
                        <SelectItem value="detox">Detox Services</SelectItem>
                        <SelectItem value="skilled-nursing">Skilled Nursing</SelectItem>
                        <SelectItem value="therapy">Physical Therapy</SelectItem>
                        <SelectItem value="hospice">Hospice Care</SelectItem>
                        <SelectItem value="mental-health">Mental Health</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="urgencyLevel">Urgency Level</Label>
                    <Select
                      value={formData.urgencyLevel}
                      onValueChange={(value) => handleInputChange("urgencyLevel", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="urgent">Urgent (24 hours)</SelectItem>
                        <SelectItem value="stat">STAT (Immediate)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="referralDate">Referral Date *</Label>
                    <Input
                      id="referralDate"
                      type="date"
                      value={formData.referralDate}
                      onChange={(e) => handleInputChange("referralDate", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Marketer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Marketer Information
                </h3>
                <div>
                  <Label htmlFor="referredBy">Referred By *</Label>
                  <Select
                    value={formData.referredBy}
                    onValueChange={(value) => handleInputChange("referredBy", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select marketer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sarah Johnson">Sarah Johnson - North Dallas</SelectItem>
                      <SelectItem value="Mike Rodriguez">Mike Rodriguez - South Dallas</SelectItem>
                      <SelectItem value="Emily Chen">Emily Chen - East Dallas</SelectItem>
                      <SelectItem value="David Wilson">David Wilson - West Dallas</SelectItem>
                      <SelectItem value="Lisa Thompson">Lisa Thompson - Central Dallas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Any additional information about the referral, patient condition, special requirements, etc."
                    rows={4}
                  />
                </div>
              </div>

              {/* Error Display */}
              {submitError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Submission Error</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {/* Routing Preview */}
              {formData.serviceNeeded && (
                <Alert className="border-blue-200 bg-blue-50">
                  <ArrowRight className="h-4 w-4" />
                  <AlertTitle>Routing Information</AlertTitle>
                  <AlertDescription>
                    This referral will be routed to:{" "}
                    <strong>
                      {["behavioral", "detox", "mental-health"].includes(formData.serviceNeeded)
                        ? "Serenity"
                        : ["home-health", "skilled-nursing", "therapy", "hospice"].includes(formData.serviceNeeded)
                          ? "CHHS"
                          : "General Intake"}
                    </strong>
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-32">
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Referral
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
