"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Heart,
  Shield,
  Users,
  TrendingUp,
  CheckCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Star,
  Building2,
  Stethoscope,
  Activity,
} from "lucide-react"

export default function EnhancedLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate login process
    setTimeout(() => {
      setIsLoading(false)
      // Redirect to dashboard
      window.location.href = "/enhanced-dashboard"
    }, 2000)
  }

  const features = [
    {
      icon: <Heart className="h-6 w-6 text-red-500" />,
      title: "Patient-Centered Care",
      description: "Comprehensive tools for managing patient care and outcomes",
    },
    {
      icon: <Shield className="h-6 w-6 text-blue-500" />,
      title: "HIPAA Compliant",
      description: "Enterprise-grade security and compliance standards",
    },
    {
      icon: <Users className="h-6 w-6 text-green-500" />,
      title: "Staff Management",
      description: "Streamlined workforce management and scheduling",
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-purple-500" />,
      title: "Advanced Analytics",
      description: "Real-time insights and predictive analytics",
    },
  ]

  const stats = [
    { label: "Healthcare Organizations", value: "2,500+", icon: <Building2 className="h-5 w-5" /> },
    { label: "Active Users", value: "50,000+", icon: <Users className="h-5 w-5" /> },
    { label: "Patient Records", value: "1M+", icon: <Stethoscope className="h-5 w-5" /> },
    { label: "Uptime", value: "99.9%", icon: <Activity className="h-5 w-5" /> },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/healthcare-hero-bg.png')] bg-cover bg-center"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Heart className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">HealthStaff Pro</h1>
                <p className="text-blue-100 text-sm">Healthcare Workforce Intelligence</p>
              </div>
            </div>
          </div>

          {/* Main Message */}
          <div className="mb-12">
            <h2 className="text-4xl font-bold leading-tight mb-6">
              The Future of Healthcare
              <br />
              <span className="text-blue-200">Workforce Management</span>
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              Empower your healthcare organization with AI-driven insights, streamlined operations, and comprehensive
              staff management tools.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-6 mb-12">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  {feature.icon}
                  <h3 className="font-semibold">{feature.title}</h3>
                </div>
                <p className="text-sm text-blue-100">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  {stat.icon}
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
                <p className="text-sm text-blue-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-900">HealthStaff Pro</h1>
                <p className="text-gray-600 text-sm">Healthcare Intelligence</p>
              </div>
            </div>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="mb-4">
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Secure Login
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
              <CardDescription className="text-gray-600">
                Sign in to access your healthcare management dashboard
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="demo">Demo Access</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-10 pr-10"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember"
                          checked={loginData.rememberMe}
                          onCheckedChange={(checked) => setLoginData({ ...loginData, rememberMe: checked as boolean })}
                        />
                        <Label htmlFor="remember" className="text-sm text-gray-600">
                          Remember me
                        </Label>
                      </div>
                      <Button variant="link" className="text-sm text-blue-600 p-0">
                        Forgot password?
                      </Button>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>Sign In</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="demo">
                  <div className="space-y-4">
                    <Alert>
                      <Star className="h-4 w-4" />
                      <AlertDescription>
                        Experience our platform with pre-configured demo data. No registration required.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        variant="outline"
                        className="justify-start h-auto p-4 bg-transparent"
                        onClick={() => (window.location.href = "/enhanced-dashboard?demo=admin")}
                      >
                        <div className="text-left">
                          <div className="font-medium">Administrator Demo</div>
                          <div className="text-sm text-gray-500">Full access to all features</div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-start h-auto p-4 bg-transparent"
                        onClick={() => (window.location.href = "/enhanced-dashboard?demo=staff")}
                      >
                        <div className="text-left">
                          <div className="font-medium">Staff Member Demo</div>
                          <div className="text-sm text-gray-500">Staff-level access and features</div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-start h-auto p-4 bg-transparent"
                        onClick={() => (window.location.href = "/enhanced-dashboard?demo=manager")}
                      >
                        <div className="text-left">
                          <div className="font-medium">Manager Demo</div>
                          <div className="text-sm text-gray-500">Management dashboard and tools</div>
                        </div>
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Button variant="link" className="text-blue-600 p-0 h-auto">
                    Request Access
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Shield className="h-4 w-4" />
              <span>Protected by enterprise-grade security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
