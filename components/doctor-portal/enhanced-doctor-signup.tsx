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
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

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
    licenseExpiration: "",
    yearsExperience: "",
    bio: "",
    hourlyRate: "125.00",
    agreeToTerms: false,
    agreeToHIPAA: false,
  })

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  console.log('🎨 [FRONTEND] EnhancedDoctorSignup component loaded')
  console.log('📍 [FRONTEND] Current step:', step)
  console.log('⏳ [FRONTEND] Loading state:', isLoading)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🏥 [FRONTEND] Starting doctor registration...')
    console.log('📋 [FRONTEND] Form data:', {
      ...formData,
      password: '[HIDDEN]',
      confirmPassword: '[HIDDEN]'
    })
    
    // Check agreement checkboxes first
    if (!formData.agreeToTerms || !formData.agreeToHIPAA) {
      console.log('❌ [FRONTEND] Validation failed: Agreements not checked')
      toast({
        title: "❌ Agreements Required",
        description: "Please check both agreement boxes to continue.",
        variant: "destructive",
      })
      alert('⚠️ AGREEMENTS REQUIRED\n\nYou must check both:\n✓ Terms of Service agreement\n✓ HIPAA compliance acknowledgment')
      return
    }
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      console.log('❌ [FRONTEND] Validation failed: Password mismatch')
      toast({
        title: "❌ Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      })
      alert('❌ PASSWORD MISMATCH\n\nYour passwords do not match. Please check and try again.')
      return
    }

    if (formData.password.length < 6) {
      console.log('❌ [FRONTEND] Validation failed: Password too short')
      toast({
        title: "❌ Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    if (!/^\d{10}$/.test(formData.npi)) {
      console.log('❌ [FRONTEND] Validation failed: Invalid NPI format')
      toast({
        title: "❌ Invalid NPI",
        description: "NPI must be exactly 10 digits.",
        variant: "destructive",
      })
      return
    }

    console.log('✅ [FRONTEND] All validations passed')
    setIsLoading(true)

    try {
      console.log('📤 [FRONTEND] Sending registration request to API...')
      console.log('📋 [FRONTEND] Registration data:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        npi: formData.npi,
        specialty: formData.specialty,
        licenseState: formData.licenseState,
      })

      const response = await fetch('/api/auth/register-doctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          npi: formData.npi,
          dea: formData.dea,
          specialty: formData.specialty,
          licenseNumber: formData.licenseNumber,
          licenseState: formData.licenseState,
          licenseExpiration: formData.licenseExpiration,
          yearsExperience: formData.yearsExperience,
          bio: formData.bio,
          hourlyRate: formData.hourlyRate,
        }),
      })

      console.log('📥 [FRONTEND] Received response:', response.status, response.statusText)
      const data = await response.json()
      console.log('📦 [FRONTEND] Response data:', data)

      if (!response.ok) {
        console.error('❌ [FRONTEND] Registration failed:', data.error)
        throw new Error(data.error || 'Registration failed')
      }

      console.log('✅ [FRONTEND] Registration successful!')
      console.log('🎉 [FRONTEND] Doctor created:', data.doctor)

      toast({
        title: "✅ Registration Successful!",
        description: data.message || "Your account has been created and is pending admin verification.",
        duration: 7000,
      })

      // Show success alert
      alert(`🎉 REGISTRATION SUCCESSFUL!\n\nDoctor Account Created:\n\nName: ${data.doctor.name}\nEmail: ${data.doctor.email}\nNPI: ${data.doctor.npi}\nSpecialty: ${data.doctor.specialty}\n\n⚠️ IMPORTANT:\nYour account is pending admin verification.\nYou will be notified once approved and able to login.\n\nYou will be redirected to the login page in 3 seconds.`)

      // Redirect to doctor portal login after 3 seconds
      setTimeout(() => {
        console.log('🔄 [FRONTEND] Redirecting to doctor portal...')
        router.push('/doctor-portal')
      }, 3000)

    } catch (error: any) {
      console.error('❌ [FRONTEND] Registration error:', error)
      console.error('❌ [FRONTEND] Error details:', {
        message: error.message,
        stack: error.stack,
      })
      
      toast({
        title: "❌ Registration Failed",
        description: error.message || "An error occurred during registration. Please try again.",
        variant: "destructive",
        duration: 7000,
      })

      // Show error alert
      alert(`❌ REGISTRATION FAILED\n\nError: ${error.message}\n\nPlease check the console for more details and try again.`)
    } finally {
      setIsLoading(false)
    }
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
                      <SelectItem value="MI">Michigan</SelectItem>
                      <SelectItem value="TX">Texas</SelectItem>
                      <SelectItem value="NY">New York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="licenseExpiration">License Expiration Date *</Label>
                <Input
                  type="date"
                  id="licenseExpiration"
                  value={formData.licenseExpiration}
                  onChange={(e) => handleInputChange("licenseExpiration", e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the expiration date of your medical license
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="hourlyRate">Hourly Rate ($) *</Label>
                  <Input
                    type="number"
                    id="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={(e) => handleInputChange("hourlyRate", e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
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
                  type="button"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={(e) => {
                    console.log('🖱️ [FRONTEND] Submit button clicked!')
                    console.log('📋 [FRONTEND] Current form data:', {
                      firstName: formData.firstName,
                      lastName: formData.lastName,
                      email: formData.email,
                      npi: formData.npi,
                      specialty: formData.specialty,
                      agreeToTerms: formData.agreeToTerms,
                      agreeToHIPAA: formData.agreeToHIPAA
                    })
                    // Call handleSubmit directly
                    handleSubmit(e as any)
                  }}
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
