"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Building2,
  Heart,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Phone,
  MapPin,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const [accountType, setAccountType] = useState("applicant")
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",

    // Location
    address: "",
    city: "",
    state: "",
    zipCode: "",

    // Professional Info
    profession: "",
    experience: "",
    education: "",
    certifications: "",

    // Company Info (for employers)
    companyName: "",
    companyType: "",
    facilitySize: "",

    // Agreements
    termsAccepted: false,
    privacyAccepted: false,
    marketingOptIn: false,
  })

  const totalSteps = accountType === "employer" ? 4 : 4

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match!")
        setIsLoading(false)
        return
      }

      // Validate terms acceptance
      if (!formData.termsAccepted || !formData.privacyAccepted) {
        alert("Please accept the terms of service and privacy policy.")
        setIsLoading(false)
        return
      }

      // Call registration API
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountType,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          // Applicant fields
          profession: formData.profession,
          experience: formData.experience,
          education: formData.education,
          certifications: formData.certifications,
          // Employer fields
          companyName: formData.companyName,
          companyType: formData.companyType,
          facilitySize: formData.facilitySize,
          // Settings
          marketingOptIn: formData.marketingOptIn,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      // Success! Store user data and redirect based on account type
      alert("Account created successfully! Welcome to IrishTriplets!")
      
      // Store user data in localStorage for dashboard access
      const userData = {
        id: data.user.id,
        email: data.user.email,
        accountType: data.user.accountType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        // Add account-specific fields
        ...(accountType === "applicant" ? {
          profession: formData.profession,
          experience: formData.experience,
          education: formData.education,
          certifications: formData.certifications,
        } : {
          companyName: formData.companyName,
          companyType: formData.companyType,
          facilitySize: formData.facilitySize,
        })
      }
      
      localStorage.setItem('currentUser', JSON.stringify(userData))
      
      if (accountType === "applicant") {
        window.location.href = "/applicant-dashboard"
      } else if (accountType === "employer") {
        window.location.href = "/employer-dashboard"
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      alert("Registration failed: " + (error.message || "Please try again"))
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">IrishTriplets</h1>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
          <p className="text-gray-600">Join Michigan's leading healthcare staffing network</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Account Registration</CardTitle>
            <CardDescription>
              Step {currentStep} of {totalSteps} - {Math.round((currentStep / totalSteps) * 100)}% Complete
            </CardDescription>
            <Progress value={(currentStep / totalSteps) * 100} className="mt-2" />
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Account Type Selection - Step 1 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">Choose Your Account Type</h3>
                  <p className="text-gray-600 mb-6">Select the option that best describes you</p>
                </div>

                <Tabs value={accountType} onValueChange={setAccountType} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="applicant" className="text-sm">
                      Healthcare Professional
                    </TabsTrigger>
                    <TabsTrigger value="employer" className="text-sm">
                      Healthcare Facility
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-6 space-y-4">
                    {accountType === "applicant" && (
                      <Card className="border-2 border-blue-200 bg-blue-50">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                              <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-blue-900">Healthcare Professional</h4>
                              <p className="text-blue-700 text-sm">
                                Find job opportunities, manage applications, and advance your healthcare career
                              </p>
                              <ul className="text-xs text-blue-600 mt-2 space-y-1">
                                <li>• Browse and apply for jobs</li>
                                <li>• Track application status</li>
                                <li>• Manage your professional profile</li>
                                <li>• Access training and certifications</li>
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {accountType === "employer" && (
                      <Card className="border-2 border-green-200 bg-green-50">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-green-900">Healthcare Facility</h4>
                              <p className="text-green-700 text-sm">
                                Post jobs, manage applications, and find qualified healthcare professionals
                              </p>
                              <ul className="text-xs text-green-600 mt-2 space-y-1">
                                <li>• Post job openings</li>
                                <li>• Review and manage applications</li>
                                <li>• Access qualified candidate pool</li>
                                <li>• Manage your facility profile</li>
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </Tabs>
              </div>
            )}

            {/* Basic Information - Step 2 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
                  <p className="text-gray-600">Tell us about yourself</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(248) 555-0123"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Create a strong password"
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm your password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Password Requirements:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Include uppercase and lowercase letters</li>
                    <li>• Include at least one number</li>
                    <li>• Include at least one special character</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Location Information - Step 3 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Location Information</h3>
                  <p className="text-gray-600">Where are you located?</p>
                </div>

                <div>
                  <Label htmlFor="address">Street Address *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="123 Main Street"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Detroit"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Select value={formData.state} onValueChange={(value) => handleSelectChange("state", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MI">Michigan</SelectItem>
                        <SelectItem value="OH">Ohio</SelectItem>
                        <SelectItem value="IN">Indiana</SelectItem>
                        <SelectItem value="IL">Illinois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      placeholder="48201"
                      required
                    />
                  </div>
                </div>

                {accountType === "employer" && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-gray-900">Facility Information</h4>

                    <div>
                      <Label htmlFor="companyName">Facility/Company Name *</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="Sunrise Senior Living"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="companyType">Facility Type *</Label>
                        <Select
                          value={formData.companyType}
                          onValueChange={(value) => handleSelectChange("companyType", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hospital">Hospital</SelectItem>
                            <SelectItem value="nursing_home">Nursing Home</SelectItem>
                            <SelectItem value="assisted_living">Assisted Living</SelectItem>
                            <SelectItem value="home_health">Home Health Agency</SelectItem>
                            <SelectItem value="clinic">Medical Clinic</SelectItem>
                            <SelectItem value="rehabilitation">Rehabilitation Center</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="facilitySize">Facility Size *</Label>
                        <Select
                          value={formData.facilitySize}
                          onValueChange={(value) => handleSelectChange("facilitySize", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small (1-50 beds)</SelectItem>
                            <SelectItem value="medium">Medium (51-150 beds)</SelectItem>
                            <SelectItem value="large">Large (151-300 beds)</SelectItem>
                            <SelectItem value="enterprise">Enterprise (300+ beds)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Professional Information - Step 4 */}
            {currentStep === 4 && accountType === "applicant" && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Professional Information</h3>
                  <p className="text-gray-600">Tell us about your healthcare background</p>
                </div>

                <div>
                  <Label htmlFor="profession">Primary Profession *</Label>
                  <Select
                    value={formData.profession}
                    onValueChange={(value) => handleSelectChange("profession", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your profession" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registered_nurse">Registered Nurse (RN)</SelectItem>
                      <SelectItem value="licensed_practical_nurse">Licensed Practical Nurse (LPN)</SelectItem>
                      <SelectItem value="certified_nursing_assistant">Certified Nursing Assistant (CNA)</SelectItem>
                      <SelectItem value="physical_therapist">Physical Therapist (PT)</SelectItem>
                      <SelectItem value="occupational_therapist">Occupational Therapist (OT)</SelectItem>
                      <SelectItem value="speech_therapist">Speech Language Pathologist</SelectItem>
                      <SelectItem value="medical_assistant">Medical Assistant</SelectItem>
                      <SelectItem value="home_health_aide">Home Health Aide</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(value) => handleSelectChange("experience", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level (0-1 years)</SelectItem>
                      <SelectItem value="junior">Junior (1-3 years)</SelectItem>
                      <SelectItem value="mid">Mid-Level (3-5 years)</SelectItem>
                      <SelectItem value="senior">Senior (5-10 years)</SelectItem>
                      <SelectItem value="expert">Expert (10+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="education">Highest Education Level *</Label>
                  <Select value={formData.education} onValueChange={(value) => handleSelectChange("education", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">High School Diploma</SelectItem>
                      <SelectItem value="certificate">Certificate Program</SelectItem>
                      <SelectItem value="associate">Associate Degree</SelectItem>
                      <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                      <SelectItem value="master">Master's Degree</SelectItem>
                      <SelectItem value="doctorate">Doctorate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="certifications">Certifications & Licenses</Label>
                  <Textarea
                    id="certifications"
                    name="certifications"
                    value={formData.certifications}
                    onChange={handleInputChange}
                    placeholder="List your current certifications, licenses, and credentials (e.g., RN License, CPR, ACLS, etc.)"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Include license numbers, expiration dates, and issuing organizations
                  </p>
                </div>
              </div>
            )}

            {/* Final Step - Terms & Agreements */}
            {currentStep === totalSteps && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Terms & Agreements</h3>
                  <p className="text-gray-600">Review and accept our terms to complete registration</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      id="termsAccepted"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, termsAccepted: checked as boolean }))
                      }
                      required
                    />
                    <div className="text-sm">
                      <Label htmlFor="termsAccepted" className="font-medium">
                        I agree to the Terms of Service *
                      </Label>
                      <p className="text-gray-600 mt-1">
                        By checking this box, you agree to our{" "}
                        <Link href="/terms" className="text-blue-600 hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and acknowledge that you have read and understood them.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      id="privacyAccepted"
                      name="privacyAccepted"
                      checked={formData.privacyAccepted}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, privacyAccepted: checked as boolean }))
                      }
                      required
                    />
                    <div className="text-sm">
                      <Label htmlFor="privacyAccepted" className="font-medium">
                        I agree to the Privacy Policy *
                      </Label>
                      <p className="text-gray-600 mt-1">
                        You consent to our{" "}
                        <Link href="/privacy" className="text-blue-600 hover:underline">
                          Privacy Policy
                        </Link>{" "}
                        and the collection and use of your information as described.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg bg-gray-50">
                    <Checkbox
                      id="marketingOptIn"
                      name="marketingOptIn"
                      checked={formData.marketingOptIn}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, marketingOptIn: checked as boolean }))
                      }
                    />
                    <div className="text-sm">
                      <Label htmlFor="marketingOptIn" className="font-medium">
                        Send me job alerts and updates (Optional)
                      </Label>
                      <p className="text-gray-600 mt-1">
                        Receive email notifications about new job opportunities, industry news, and platform updates.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <h4 className="font-medium text-blue-900 mb-1">What happens next?</h4>
                      <ul className="text-blue-700 space-y-1">
                        <li>• Your account will be created and verified</li>
                        <li>• You'll receive a welcome email with next steps</li>
                        <li>
                          •{" "}
                          {accountType === "applicant"
                            ? "You can start browsing and applying for jobs"
                            : "You can start posting jobs and reviewing applications"}
                        </li>
                        <li>• Our team may contact you to complete your profile</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center space-x-2">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {currentStep < totalSteps ? (
                  <Button onClick={nextStep}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!formData.termsAccepted || !formData.privacyAccepted || isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                    {!isLoading && <CheckCircle className="h-4 w-4 ml-2" />}
                  </Button>
                )}
              </div>
            </div>

            {/* Sign In Link */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
