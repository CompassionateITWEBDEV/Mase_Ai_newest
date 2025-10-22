"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Heart,
  Phone,
  Calendar,
  Shield,
  HelpCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  User,
  Lock,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"

export default function PatientLogin() {
  const [loginMethod, setLoginMethod] = useState("patient-id")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    patientId: "",
    phoneNumber: "",
    dateOfBirth: "",
    password: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (loginMethod === "patient-id") {
      if (!formData.patientId.trim()) {
        newErrors.patientId = "Patient ID is required"
      } else if (formData.patientId.length < 6) {
        newErrors.patientId = "Patient ID must be at least 6 characters"
      }
    } else {
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = "Phone number is required"
      } else if (!/^$$\d{3}$$ \d{3}-\d{4}$/.test(formData.phoneNumber)) {
        newErrors.phoneNumber = "Please enter a valid phone number"
      }
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required"
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Demo login - redirect to patient portal
      window.location.href = "/patient-portal"
    } catch (error) {
      setErrors({ general: "Login failed. Please check your credentials and try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    handleInputChange("phoneNumber", formatted)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-rose-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-pink-200 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-red-200 rounded-full opacity-25"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back to Staff Login */}
        <div className="mb-6">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Staff Login
            </Button>
          </Link>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Patient Portal</CardTitle>
            <CardDescription className="text-gray-600">
              Secure access to your health information and care plans
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* HIPAA Notice */}
            <Alert className="border-rose-200 bg-rose-50">
              <Shield className="h-4 w-4 text-rose-600" />
              <AlertDescription className="text-rose-800 text-sm">
                Your health information is protected by HIPAA. This is a secure, encrypted connection.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Login Method Selection */}
              <Tabs value={loginMethod} onValueChange={setLoginMethod} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger value="patient-id" className="text-sm">
                    <User className="h-4 w-4 mr-2" />
                    Patient ID
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="text-sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone Number
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="patient-id" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="patientId" className="text-sm font-medium text-gray-700">
                      Patient ID
                    </Label>
                    <Input
                      id="patientId"
                      type="text"
                      placeholder="Enter your Patient ID (e.g., PT-123456)"
                      value={formData.patientId}
                      onChange={(e) => handleInputChange("patientId", e.target.value)}
                      className={`h-12 ${errors.patientId ? "border-red-300 focus:border-red-500" : "border-gray-300"}`}
                    />
                    {errors.patientId && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.patientId}
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="phone" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.phoneNumber}
                      onChange={handlePhoneChange}
                      maxLength={14}
                      className={`h-12 ${errors.phoneNumber ? "border-red-300 focus:border-red-500" : "border-gray-300"}`}
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.phoneNumber}
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                  Date of Birth
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    className={`h-12 pl-10 ${errors.dateOfBirth ? "border-red-300 focus:border-red-500" : "border-gray-300"}`}
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`h-12 pl-10 pr-10 ${errors.password ? "border-red-300 focus:border-red-500" : "border-gray-300"}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* General Error */}
              {errors.general && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{errors.general}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Access My Portal
                  </div>
                )}
              </Button>
            </form>

            <Separator />

            {/* Help Links */}
            <div className="space-y-3">
              <Link href="/auth/patient-forgot-password">
                <Button variant="ghost" className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                  <Lock className="h-4 w-4 mr-2" />
                  Forgot Password?
                </Button>
              </Link>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Need help accessing your account?</p>
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 border-rose-200 hover:bg-rose-50 bg-transparent"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Patient Support: (555) 123-4567
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 border-rose-200 hover:bg-rose-50 bg-transparent"
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Live Chat Support
                  </Button>
                </div>
              </div>
            </div>

            {/* Demo Credentials */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                <strong>Demo Credentials:</strong>
                <br />
                Patient ID: PT-123456 | Phone: (555) 123-4567
                <br />
                DOB: 1980-01-01 | Password: patient123
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© 2024 IrishTriplets Healthcare. All rights reserved.</p>
          <p className="mt-1">
            <Link href="/privacy" className="text-rose-600 hover:text-rose-700">
              Privacy Policy
            </Link>
            {" • "}
            <Link href="/terms" className="text-rose-600 hover:text-rose-700">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
