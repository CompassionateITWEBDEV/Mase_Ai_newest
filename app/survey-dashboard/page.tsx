"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Shield,
  Download,
  Eye,
  CheckCircle,
  Users,
  Heart,
  FileText,
  BarChart3,
  Building2,
  Lock,
  Package,
  Printer,
  RefreshCw,
  LogOut,
} from "lucide-react"
import { getSurveyUser } from "@/lib/auth"

export default function SurveyDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isExporting, setIsExporting] = useState(false)
  const surveyUser = getSurveyUser()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const surveyData = {
    facility: {
      name: "Irish Triplets Health Services",
      license: "HC-2024-001",
      medicare: "12-3456",
      address: "123 Healthcare Blvd, Medical City, MC 12345",
      administrator: "Sarah Johnson, RN",
      phone: "(555) 123-4567",
    },
    overview: {
      totalSections: 15,
      completeSections: 15,
      lastUpdated: "2024-01-22",
      complianceRate: 94.2,
      totalStaff: 156,
      activePatients: 247,
    },
    sections: [
      {
        id: "census",
        title: "Census Reports",
        status: "complete",
        lastUpdated: "2024-01-22",
        items: 4,
        compliance: 100,
      },
      {
        id: "hr-files",
        title: "HR Files",
        status: "complete",
        lastUpdated: "2024-01-20",
        items: 156,
        compliance: 94.2,
      },
      {
        id: "training",
        title: "Training Records",
        status: "complete",
        lastUpdated: "2024-01-21",
        items: 127,
        compliance: 87.3,
      },
      {
        id: "policies",
        title: "Policy Manual",
        status: "complete",
        lastUpdated: "2024-01-01",
        items: 127,
        compliance: 98.4,
      },
      {
        id: "patient-packet",
        title: "Patient Packet",
        status: "complete",
        lastUpdated: "2024-01-01",
        items: 5,
        compliance: 100,
      },
      {
        id: "qapi",
        title: "QAPI Reports",
        status: "complete",
        lastUpdated: "2024-01-15",
        items: 12,
        compliance: 92.0,
      },
    ],
    recentActivity: [
      {
        action: "Census Report Updated",
        timestamp: "2024-01-22 10:30:00",
        user: "System",
        type: "update",
      },
      {
        action: "Training Completion - HIPAA",
        timestamp: "2024-01-22 09:15:00",
        user: "15 Staff Members",
        type: "training",
      },
      {
        action: "Policy Review Completed",
        timestamp: "2024-01-21 16:45:00",
        user: "Clinical Director",
        type: "review",
      },
    ],
  }

  const generateSurveyBundle = async () => {
    setIsExporting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      // Create mock download
      const element = document.createElement("a")
      element.href = "data:text/plain;charset=utf-8," + encodeURIComponent("Survey Bundle Generated")
      element.download = `Survey_Bundle_${new Date().toISOString().split("T")[0]}.zip`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-indigo-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Survey Dashboard</h1>
                  <p className="text-sm text-gray-600">Secure State Surveyor Access</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">
                <Lock className="h-3 w-3 mr-1" />
                Secure Access
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{surveyUser.name}</div>
                <div className="text-xs text-gray-500">{surveyUser.organization}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{currentTime.toLocaleTimeString()}</div>
                <div className="text-xs text-gray-500">{currentTime.toLocaleDateString()}</div>
              </div>
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Facility Information */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Building2 className="h-6 w-6 text-indigo-600" />
                <div>
                  <CardTitle className="text-xl">{surveyData.facility.name}</CardTitle>
                  <CardDescription>Healthcare Facility Survey Information</CardDescription>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={generateSurveyBundle} disabled={isExporting}>
                  {isExporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Export Bundle
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Summary
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-500">License Number</Label>
                <p className="text-lg font-semibold">{surveyData.facility.license}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Medicare Provider</Label>
                <p className="text-lg font-semibold">{surveyData.facility.medicare}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Administrator</Label>
                <p className="text-lg font-semibold">{surveyData.facility.administrator}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Contact</Label>
                <p className="text-lg font-semibold">{surveyData.facility.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Complete Sections</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {surveyData.overview.completeSections}/{surveyData.overview.totalSections}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{surveyData.overview.totalStaff}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{surveyData.overview.activePatients}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{surveyData.overview.complianceRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sections" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sections">Survey Sections</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="sections" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {surveyData.sections.map((section) => (
                <Card key={section.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">{section.title}</h3>
                      <Badge className="bg-green-100 text-green-800">Complete</Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Items</span>
                        <span className="font-medium">{section.items}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Compliance</span>
                        <span className="font-medium">{section.compliance}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last Updated</span>
                        <span className="font-medium">{section.lastUpdated}</span>
                      </div>
                      <Progress value={section.compliance} className="h-2" />
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{section.title}</DialogTitle>
                            <DialogDescription>Detailed section information and documentation</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h4 className="font-medium mb-2">Section Summary</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Total Items:</span>
                                  <span className="ml-2 font-medium">{section.items}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Compliance Rate:</span>
                                  <span className="ml-2 font-medium">{section.compliance}%</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Last Updated:</span>
                                  <span className="ml-2 font-medium">{section.lastUpdated}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Status:</span>
                                  <Badge className="ml-2 bg-green-100 text-green-800">Complete</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export Section
                              </Button>
                              <Button variant="outline" size="sm">
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates and changes to survey documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {surveyData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-2 rounded-lg ${
                            activity.type === "update"
                              ? "bg-blue-100"
                              : activity.type === "training"
                                ? "bg-green-100"
                                : "bg-purple-100"
                          }`}
                        >
                          {activity.type === "update" ? (
                            <RefreshCw className="h-4 w-4 text-blue-600" />
                          ) : activity.type === "training" ? (
                            <Users className="h-4 w-4 text-green-600" />
                          ) : (
                            <FileText className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-gray-600">by {activity.user}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{activity.timestamp}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Overview</CardTitle>
                <CardDescription>Overall compliance status across all survey areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="text-4xl font-bold text-green-600 mb-2">{surveyData.overview.complianceRate}%</div>
                    <div className="text-lg font-medium text-gray-900">Overall Compliance Rate</div>
                    <div className="text-sm text-gray-600">All sections meet or exceed requirements</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Compliance by Section</h4>
                      {surveyData.sections.map((section) => (
                        <div key={section.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{section.title}</span>
                            <span className="font-medium">{section.compliance}%</span>
                          </div>
                          <Progress value={section.compliance} className="h-2" />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Key Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm font-medium">Staff Compliance</span>
                          <span className="text-sm font-bold">94.2%</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm font-medium">Training Completion</span>
                          <span className="text-sm font-bold">87.3%</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm font-medium">Policy Updates</span>
                          <span className="text-sm font-bold">98.4%</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm font-medium">Documentation</span>
                          <span className="text-sm font-bold">96.1%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
