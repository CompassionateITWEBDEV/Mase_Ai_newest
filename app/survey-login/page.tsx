"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Shield,
  Lock,
  Eye,
  Building2,
  FileCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  BarChart3,
} from "lucide-react"

export default function SurveyLogin() {
  const [credentials, setCredentials] = useState({
    surveyorId: "",
    accessCode: "",
    organization: "",
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Simulate authentication
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In real implementation, validate credentials against survey user database
      if (credentials.email && credentials.password) {
        // Redirect directly to survey dashboard
        router.push("/survey-ready")
      } else {
        setError("Invalid surveyor credentials. Please check your email and password.")
      }
    } catch (err) {
      setError("Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const surveyStats = [
    {
      title: "Survey Sections",
      value: "15",
      description: "Complete sections ready for review",
      icon: FileCheck,
      color: "text-green-600",
    },
    {
      title: "Last Updated",
      value: "Today",
      description: "All documentation current",
      icon: Clock,
      color: "text-blue-600",
    },
    {
      title: "Compliance Rate",
      value: "94.2%",
      description: "Overall compliance score",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Active Staff",
      value: "156",
      description: "Total active employees",
      icon: Users,
      color: "text-purple-600",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Panel - Survey Information */}
        <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Shield className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Survey Access Portal</h1>
                <p className="text-gray-600">Secure State Surveyor Dashboard</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center mb-4">
                  <Building2 className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">Irish Triplets Health Services</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Homecare Agency License: #HC-2024-001</p>
                  <p>• Medicare Provider: 12-3456</p>
                  <p>• Accreditation: Joint Commission</p>
                  <p>• Survey Type: Routine Compliance Review</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {surveyStats.map((stat, index) => (
                  <div key={index} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <stat.icon className={`h-4 w-4 ${stat.color} mr-2`} />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.title}</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-600">{stat.description}</div>
                  </div>
                ))}
              </div>

              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  This portal provides secure, read-only access to survey documentation. All access is logged and
                  monitored for compliance purposes.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-8">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Surveyor Login</CardTitle>
              <CardDescription>Enter your credentials to access the surveyor portal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    placeholder="surveyor@state.gov"
                    required
                    type="email"
                    value={credentials.email}
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link className="text-sm text-indigo-600 hover:text-indigo-500" href="#">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      required
                      type={showPassword ? "text" : "password"}
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="surveyorId">Surveyor ID</Label>
                    <Input
                      id="surveyorId"
                      placeholder="SUR-2024-001"
                      value={credentials.surveyorId}
                      onChange={(e) => setCredentials({ ...credentials, surveyorId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accessCode">Access Code</Label>
                    <Input
                      id="accessCode"
                      placeholder="AC-12345"
                      value={credentials.accessCode}
                      onChange={(e) => setCredentials({ ...credentials, accessCode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">State Organization</Label>
                  <Input
                    id="organization"
                    placeholder="Michigan Department of Health"
                    value={credentials.organization}
                    onChange={(e) => setCredentials({ ...credentials, organization: e.target.value })}
                  />
                </div>

                {error && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Secure Login
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Lock className="h-3 w-3" />
                <span>Secured with 256-bit SSL encryption</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <BarChart3 className="h-3 w-3" />
                <span>All access logged for audit compliance</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
