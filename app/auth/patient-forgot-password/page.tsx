"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Heart,
  ArrowLeft,
  Mail,
  Phone,
  PhoneCall,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Shield,
  Clock,
} from "lucide-react"
import Link from "next/link"

export default function PatientForgotPassword() {
  const [step, setStep] = useState(1)
  const [recoveryMethod, setRecoveryMethod] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    patientId: "",
    dateOfBirth: "",
    email: "",
    phoneNumber: "",
    verificationCode: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.patientId.trim()) {
      newErrors.patientId = "Patient ID is required"
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}

    if (!recoveryMethod) {
      newErrors.recoveryMethod = "Please select a recovery method"
    }

    if (recoveryMethod === "email" && !formData.email.trim()) {
      newErrors.email = "Email address is required"
    }

    if (recoveryMethod === "sms" && !formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.verificationCode.trim()) {
      newErrors.verificationCode = "Verification code is required"
    } else if (formData.verificationCode.length !== 6) {
      newErrors.verificationCode = "Verification code must be 6 digits"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep4 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "New password is required"
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters"
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep1()) return

    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setStep(2)
    } catch (error) {
      setErrors({ general: "Unable to verify identity. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return

    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setSuccessMessage(
        recoveryMethod === "email"
          ? "Verification code sent to your email address"
          : recoveryMethod === "sms"
            ? "Verification code sent via SMS"
            : "You will receive a call shortly with your verification code",
      )
      setStep(3)
    } catch (error) {
      setErrors({ general: "Unable to send verification code. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep3()) return

    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setStep(4)
    } catch (error) {
      setErrors({ verificationCode: "Invalid verification code. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep4Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep4()) return

    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setSuccessMessage("Password reset successfully! You can now log in with your new password.")
      setTimeout(() => {
        window.location.href = "/auth/patient-login"
      }, 3000)
    } catch (error) {
      setErrors({ general: "Unable to reset password. Please try again." })
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
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/auth/patient-login">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Reset Password</CardTitle>
            <CardDescription className="text-gray-600">
              {step === 1 && "Verify your identity to reset your password"}
              {step === 2 && "Choose how you'd like to receive your verification code"}
              {step === 3 && "Enter the verification code we sent you"}
              {step === 4 && "Create your new password"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Progress Indicator */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      stepNumber <= step ? "bg-rose-500 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {stepNumber < step ? <CheckCircle className="h-4 w-4" /> : stepNumber}
                  </div>
                  {stepNumber < 4 && (
                    <div className={`w-12 h-1 mx-2 ${stepNumber < step ? "bg-rose-500" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Success Message */}
            {successMessage && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Identity Verification */}
            {step === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patientId" className="text-sm font-medium text-gray-700">
                    Patient ID
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="patientId"
                      type="text"
                      placeholder="Enter your Patient ID"
                      value={formData.patientId}
                      onChange={(e) => handleInputChange("patientId", e.target.value)}
                      className={`h-12 pl-10 ${errors.patientId ? "border-red-300" : "border-gray-300"}`}
                    />
                  </div>
                  {errors.patientId && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.patientId}
                    </p>
                  )}
                </div>

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
                      className={`h-12 pl-10 ${errors.dateOfBirth ? "border-red-300" : "border-gray-300"}`}
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </div>
                  ) : (
                    "Verify Identity"
                  )}
                </Button>
              </form>
            )}

            {/* Step 2: Recovery Method Selection */}
            {step === 2 && (
              <form onSubmit={handleStep2Submit} className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    How would you like to receive your verification code?
                  </Label>

                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant={recoveryMethod === "email" ? "default" : "outline"}
                      className={`w-full h-16 justify-start ${
                        recoveryMethod === "email"
                          ? "bg-rose-500 hover:bg-rose-600 text-white"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setRecoveryMethod("email")}
                    >
                      <Mail className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">Email</div>
                        <div className="text-sm opacity-75">Send code to your email address</div>
                      </div>
                    </Button>

                    <Button
                      type="button"
                      variant={recoveryMethod === "sms" ? "default" : "outline"}
                      className={`w-full h-16 justify-start ${
                        recoveryMethod === "sms"
                          ? "bg-rose-500 hover:bg-rose-600 text-white"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setRecoveryMethod("sms")}
                    >
                      <Phone className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">Text Message</div>
                        <div className="text-sm opacity-75">Send code via SMS</div>
                      </div>
                    </Button>

                    <Button
                      type="button"
                      variant={recoveryMethod === "call" ? "default" : "outline"}
                      className={`w-full h-16 justify-start ${
                        recoveryMethod === "call"
                          ? "bg-rose-500 hover:bg-rose-600 text-white"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setRecoveryMethod("call")}
                    >
                      <PhoneCall className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">Phone Call</div>
                        <div className="text-sm opacity-75">Receive code via automated call</div>
                      </div>
                    </Button>
                  </div>

                  {errors.recoveryMethod && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.recoveryMethod}
                    </p>
                  )}
                </div>

                {/* Contact Info Input */}
                {recoveryMethod === "email" && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`h-12 ${errors.email ? "border-red-300" : "border-gray-300"}`}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                )}

                {recoveryMethod === "sms" && (
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
                      className={`h-12 ${errors.phoneNumber ? "border-red-300" : "border-gray-300"}`}
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.phoneNumber}
                      </p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                  disabled={isLoading || !recoveryMethod}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending Code...
                    </div>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              </form>
            )}

            {/* Step 3: Verification Code */}
            {step === 3 && (
              <form onSubmit={handleStep3Submit} className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Please check your {recoveryMethod === "email" ? "email" : "phone"} for the 6-digit verification
                    code. The code will expire in 10 minutes.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="verificationCode" className="text-sm font-medium text-gray-700">
                    Verification Code
                  </Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={formData.verificationCode}
                    onChange={(e) =>
                      handleInputChange("verificationCode", e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className={`h-12 text-center text-2xl tracking-widest ${errors.verificationCode ? "border-red-300" : "border-gray-300"}`}
                    maxLength={6}
                  />
                  {errors.verificationCode && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.verificationCode}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </div>
                  ) : (
                    "Verify Code"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-rose-600 hover:text-rose-700"
                  onClick={() => setStep(2)}
                >
                  Didn't receive the code? Try a different method
                </Button>
              </form>
            )}

            {/* Step 4: New Password */}
            {step === 4 && (
              <form onSubmit={handleStep4Submit} className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <Shield className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Create a strong password with at least 8 characters, including letters and numbers.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange("newPassword", e.target.value)}
                    className={`h-12 ${errors.newPassword ? "border-red-300" : "border-gray-300"}`}
                  />
                  {errors.newPassword && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className={`h-12 ${errors.confirmPassword ? "border-red-300" : "border-gray-300"}`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Resetting Password...
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}

            {/* General Error */}
            {errors.general && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{errors.general}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
