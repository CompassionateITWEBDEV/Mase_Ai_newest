"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { UserPlus, Shield, CheckCircle } from "lucide-react"

export function EnhancedDoctorSignup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    npi: "",
    dea: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    specialty: "",
    licenseNumber: "",
    licenseState: "",
    yearsExperience: "",
    bio: "",
    agreeToTerms: false,
    agreeToHIPAA: false,
  })

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)
    alert("Doctor registration submitted for review!")
  }

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3))
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <UserPlus className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Join Our Care Network</CardTitle>
        <CardDescription>
          Become part of our on-demand telehealth platform and help provide urgent care to patients in need.
        </CardDescription>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mt-6 space-x-4">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {step > stepNum ? <CheckCircle className="h-4 w-4" /> : stepNum}
              </div>
              {stepNum < 3 && <div className={`w-12 h-1 mx-2 ${step > stepNum ? "bg-blue-600" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    type="password"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Professional Credentials</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="npi">NPI Number *</Label>
                  <Input
                    id="npi"
                    value={formData.npi}
                    onChange={(e) => handleInputChange("npi", e.target.value)}
                    placeholder="10-digit NPI"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dea">DEA Number *</Label>
                  <Input
                    id="dea"
                    value={formData.dea}
                    onChange={(e) => handleInputChange("dea", e.target.value)}
                    placeholder="DEA Registration"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="specialty">Medical Specialty *</Label>
                <Select onValueChange={(value) => handleInputChange("specialty", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family-medicine">Family Medicine</SelectItem>
                    <SelectItem value="internal-medicine">Internal Medicine</SelectItem>
                    <SelectItem value="emergency-medicine">Emergency Medicine</SelectItem>
                    <SelectItem value="urgent-care">Urgent Care</SelectItem>
                    <SelectItem value="geriatrics">Geriatrics</SelectItem>
                    <SelectItem value="cardiology">Cardiology</SelectItem>
                    <SelectItem value="pulmonology">Pulmonology</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="licenseNumber">License Number *</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="licenseState">License State *</Label>
                  <Select onValueChange={(value) => handleInputChange("licenseState", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AL">Alabama</SelectItem>
                      <SelectItem value="AK">Alaska</SelectItem>
                      <SelectItem value="AZ">Arizona</SelectItem>
                      <SelectItem value="CA">California</SelectItem>
                      <SelectItem value="FL">Florida</SelectItem>
                      <SelectItem value="TX">Texas</SelectItem>
                      <SelectItem value="NY">New York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="yearsExperience">Years of Experience *</Label>
                <Input
                  type="number"
                  id="yearsExperience"
                  value={formData.yearsExperience}
                  onChange={(e) => handleInputChange("yearsExperience", e.target.value)}
                  min="0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Brief description of your experience and expertise..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Terms and Verification</h3>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">HIPAA Compliance</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      All telehealth encounters are HIPAA compliant with end-to-end encryption and secure documentation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                  />
                  <div className="text-sm">
                    <Label htmlFor="agreeToTerms" className="font-medium">
                      I agree to the Terms of Service and Provider Agreement *
                    </Label>
                    <p className="text-gray-600 mt-1">
                      By checking this box, you agree to provide on-demand telehealth services and maintain professional
                      standards.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToHIPAA"
                    checked={formData.agreeToHIPAA}
                    onCheckedChange={(checked) => handleInputChange("agreeToHIPAA", checked as boolean)}
                  />
                  <div className="text-sm">
                    <Label htmlFor="agreeToHIPAA" className="font-medium">
                      I acknowledge HIPAA compliance requirements *
                    </Label>
                    <p className="text-gray-600 mt-1">
                      I understand and will comply with all HIPAA regulations for patient privacy and data security.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">What happens next?</h4>
                    <ul className="text-sm text-green-700 mt-1 space-y-1">
                      <li>• Credential verification (1-2 business days)</li>
                      <li>• Background check and license validation</li>
                      <li>• Platform training and onboarding</li>
                      <li>• Access to doctor portal and scheduling</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                Previous
              </Button>
            )}

            <div className="ml-auto">
              {step < 3 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!formData.agreeToTerms || !formData.agreeToHIPAA || isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
