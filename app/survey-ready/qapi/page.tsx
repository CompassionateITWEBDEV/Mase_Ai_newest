"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  ArrowLeft,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileText,
  TrendingUp,
  Users,
  Target,
  Clock,
  Download,
  Edit,
} from "lucide-react"
import Link from "next/link"

export default function QAPIManagement() {
  const [selectedQuarter, setSelectedQuarter] = useState("Q1 2024")
  const [isAddingPIP, setIsAddingPIP] = useState(false)

  const qapiData = {
    currentQuarter: "Q1 2024",
    nextMeetingDue: "2024-04-01",
    daysUntilDue: 15,
    completedMeetings: 3,
    totalMeetings: 4,
    activePIPs: 2,
    resolvedPIPs: 5,
    performanceMetrics: {
      patientSatisfaction: 4.6,
      careQuality: 92,
      incidentRate: 0.8,
      complianceScore: 96,
      readmissionRate: 12.3,
      infectionRate: 2.1,
    },
    quarterlyMeetings: [
      {
        id: 1,
        quarter: "Q4 2023",
        date: "2024-01-15",
        status: "completed",
        attendees: 8,
        issues: 3,
        pipsCreated: 1,
        minutesUploaded: true,
      },
      {
        id: 2,
        quarter: "Q3 2023",
        date: "2023-10-15",
        status: "completed",
        attendees: 7,
        issues: 2,
        pipsCreated: 2,
        minutesUploaded: true,
      },
      {
        id: 3,
        quarter: "Q2 2023",
        date: "2023-07-15",
        status: "completed",
        attendees: 9,
        issues: 4,
        pipsCreated: 1,
        minutesUploaded: true,
      },
    ],
    pipPlans: [
      {
        id: 1,
        title: "Medication Administration Improvement",
        category: "Clinical Quality",
        status: "active",
        priority: "high",
        createdDate: "2024-01-15",
        targetDate: "2024-04-15",
        progress: 65,
        assignedTo: "Sarah Johnson, RN",
        description: "Improve medication administration accuracy and reduce errors",
        actions: [
          "Implement double-check system",
          "Additional training for high-risk medications",
          "Update medication protocols",
        ],
        metrics: {
          baseline: "4 errors/month",
          target: "1 error/month",
          current: "2 errors/month",
        },
      },
      {
        id: 2,
        title: "Patient Communication Enhancement",
        category: "Patient Satisfaction",
        status: "active",
        priority: "medium",
        createdDate: "2024-01-10",
        targetDate: "2024-03-31",
        progress: 40,
        assignedTo: "Michael Chen, PT",
        description: "Improve patient satisfaction scores through better communication",
        actions: [
          "Communication skills training",
          "Patient feedback system implementation",
          "Regular satisfaction surveys",
        ],
        metrics: {
          baseline: "4.2/5.0",
          target: "4.7/5.0",
          current: "4.4/5.0",
        },
      },
    ],
  }

  const upcomingAlerts = [
    {
      type: "meeting",
      message: "Q1 2024 QAPI meeting due in 15 days",
      priority: "high",
      dueDate: "2024-04-01",
    },
    {
      type: "pip",
      message: "Patient Communication PIP review due",
      priority: "medium",
      dueDate: "2024-03-31",
    },
    {
      type: "report",
      message: "Quarterly metrics report generation",
      priority: "low",
      dueDate: "2024-03-25",
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "active":
        return "bg-blue-100 text-blue-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/survey-ready">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Survey Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">QAPI Management</h1>
                <p className="text-gray-600">Quality Assurance & Performance Improvement</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New PIP Plan
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="meetings">Quarterly Meetings</TabsTrigger>
            <TabsTrigger value="pip-plans">PIP Plans</TabsTrigger>
            <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* QAPI Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{qapiData.daysUntilDue}</p>
                      <p className="text-gray-600 text-sm">Days Until Next Meeting</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{qapiData.completedMeetings}</p>
                      <p className="text-gray-600 text-sm">Meetings This Year</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Target className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{qapiData.activePIPs}</p>
                      <p className="text-gray-600 text-sm">Active PIP Plans</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-orange-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{qapiData.performanceMetrics.careQuality}%</p>
                      <p className="text-gray-600 text-sm">Care Quality Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts and Upcoming Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                  QAPI Alerts & Reminders
                </CardTitle>
                <CardDescription>Upcoming meetings, reviews, and deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        alert.priority === "high"
                          ? "bg-red-50 border-red-200"
                          : alert.priority === "medium"
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {alert.type === "meeting" && <Calendar className="h-4 w-4 text-blue-500" />}
                        {alert.type === "pip" && <Target className="h-4 w-4 text-purple-500" />}
                        {alert.type === "report" && <FileText className="h-4 w-4 text-green-500" />}
                        <div>
                          <p className="font-medium text-sm">{alert.message}</p>
                          <p className="text-xs text-gray-600">Due: {alert.dueDate}</p>
                        </div>
                      </div>
                      <Badge className={getPriorityColor(alert.priority)}>{alert.priority}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Key Performance Indicators</CardTitle>
                  <CardDescription>Current quarter performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Patient Satisfaction</span>
                        <span>{qapiData.performanceMetrics.patientSatisfaction}/5.0</span>
                      </div>
                      <Progress value={(qapiData.performanceMetrics.patientSatisfaction / 5) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Care Quality Score</span>
                        <span>{qapiData.performanceMetrics.careQuality}%</span>
                      </div>
                      <Progress value={qapiData.performanceMetrics.careQuality} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Compliance Score</span>
                        <span>{qapiData.performanceMetrics.complianceScore}%</span>
                      </div>
                      <Progress value={qapiData.performanceMetrics.complianceScore} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Incident Rate (Target: &lt;1%)</span>
                        <span>{qapiData.performanceMetrics.incidentRate}%</span>
                      </div>
                      <Progress value={100 - qapiData.performanceMetrics.incidentRate * 10} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active PIP Plans Summary</CardTitle>
                  <CardDescription>Current performance improvement initiatives</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {qapiData.pipPlans.map((pip) => (
                      <div key={pip.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{pip.title}</h4>
                          <Badge className={getPriorityColor(pip.priority)}>{pip.priority}</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Progress</span>
                            <span>{pip.progress}%</span>
                          </div>
                          <Progress value={pip.progress} className="h-1" />
                          <p className="text-xs text-gray-600">Assigned to: {pip.assignedTo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="meetings" className="space-y-6">
            {/* Meeting Schedule */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quarterly QAPI Meetings</CardTitle>
                    <CardDescription>Meeting schedule and documentation</CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Next Meeting
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {qapiData.quarterlyMeetings.map((meeting) => (
                    <div key={meeting.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{meeting.quarter} QAPI Meeting</h3>
                          <p className="text-sm text-gray-600">Date: {meeting.date}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(meeting.status)}>{meeting.status}</Badge>
                          {meeting.minutesUploaded && (
                            <Badge variant="outline" className="text-xs">
                              Minutes Available
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Attendees</p>
                          <p className="font-medium">{meeting.attendees}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Issues Discussed</p>
                          <p className="font-medium">{meeting.issues}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">PIPs Created</p>
                          <p className="font-medium">{meeting.pipsCreated}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            View Minutes
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Next Meeting Planning */}
            <Card>
              <CardHeader>
                <CardTitle>Next Meeting: {qapiData.currentQuarter}</CardTitle>
                <CardDescription>
                  Due: {qapiData.nextMeetingDue} ({qapiData.daysUntilDue} days remaining)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2">Meeting Preparation Checklist</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Quarterly metrics compiled</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Incident reports reviewed</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">PIP progress updates pending</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Attendee notifications to be sent</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="meeting-date">Meeting Date</Label>
                      <Input type="date" id="meeting-date" defaultValue="2024-04-01" />
                    </div>
                    <div>
                      <Label htmlFor="meeting-time">Meeting Time</Label>
                      <Input type="time" id="meeting-time" defaultValue="10:00" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="agenda-items">Agenda Items</Label>
                    <Textarea
                      id="agenda-items"
                      placeholder="Enter agenda items for the meeting..."
                      rows={4}
                      defaultValue="1. Review Q1 2024 performance metrics
2. Discuss active PIP plan progress
3. Review incident reports and trends
4. Identify new quality improvement opportunities
5. Plan for Q2 2024 initiatives"
                    />
                  </div>

                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pip-plans" className="space-y-6">
            {/* PIP Plans Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Performance Improvement Plans (PIPs)</CardTitle>
                    <CardDescription>Active and completed improvement initiatives</CardDescription>
                  </div>
                  <Dialog open={isAddingPIP} onOpenChange={setIsAddingPIP}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New PIP Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New PIP Plan</DialogTitle>
                        <DialogDescription>
                          Create a new Performance Improvement Plan to address quality issues
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="pip-title">Plan Title</Label>
                            <Input id="pip-title" placeholder="Enter PIP title" />
                          </div>
                          <div>
                            <Label htmlFor="pip-category">Category</Label>
                            <Input id="pip-category" placeholder="e.g., Clinical Quality" />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="pip-description">Description</Label>
                          <Textarea
                            id="pip-description"
                            placeholder="Describe the issue and improvement goals..."
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="pip-assigned">Assigned To</Label>
                            <Input id="pip-assigned" placeholder="Staff member name" />
                          </div>
                          <div>
                            <Label htmlFor="pip-target-date">Target Completion</Label>
                            <Input type="date" id="pip-target-date" />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsAddingPIP(false)}>
                            Cancel
                          </Button>
                          <Button onClick={() => setIsAddingPIP(false)}>Create PIP Plan</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {qapiData.pipPlans.map((pip) => (
                    <Card key={pip.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium text-lg">{pip.title}</h3>
                            <p className="text-sm text-gray-600">{pip.category}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(pip.priority)}>{pip.priority}</Badge>
                            <Badge className={getStatusColor(pip.status)}>{pip.status}</Badge>
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 mb-4">{pip.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Assigned To</p>
                            <p className="text-sm">{pip.assignedTo}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Created</p>
                            <p className="text-sm">{pip.createdDate}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Target Date</p>
                            <p className="text-sm">{pip.targetDate}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium">Progress</span>
                            <span>{pip.progress}%</span>
                          </div>
                          <Progress value={pip.progress} className="h-2" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Action Items</p>
                            <ul className="space-y-1">
                              {pip.actions.map((action, index) => (
                                <li key={index} className="text-sm text-gray-600 flex items-center">
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Metrics</p>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Baseline:</span>
                                <span>{pip.metrics.baseline}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Current:</span>
                                <span className="font-medium text-blue-600">{pip.metrics.current}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Target:</span>
                                <span className="font-medium text-green-600">{pip.metrics.target}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Update Progress
                          </Button>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            {/* Performance Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{qapiData.performanceMetrics.patientSatisfaction}</p>
                  <p className="text-sm text-gray-600">Patient Satisfaction</p>
                  <p className="text-xs text-gray-500">out of 5.0</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{qapiData.performanceMetrics.careQuality}%</p>
                  <p className="text-sm text-gray-600">Care Quality Score</p>
                  <p className="text-xs text-gray-500">Target: 90%</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-600">{qapiData.performanceMetrics.incidentRate}%</p>
                  <p className="text-sm text-gray-600">Incident Rate</p>
                  <p className="text-xs text-gray-500">Target: &lt;1%</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{qapiData.performanceMetrics.complianceScore}%</p>
                  <p className="text-sm text-gray-600">Compliance Score</p>
                  <p className="text-xs text-gray-500">Target: 95%</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">{qapiData.performanceMetrics.readmissionRate}%</p>
                  <p className="text-sm text-gray-600">Readmission Rate</p>
                  <p className="text-xs text-gray-500">Target: &lt;15%</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-600">{qapiData.performanceMetrics.infectionRate}%</p>
                  <p className="text-sm text-gray-600">Infection Rate</p>
                  <p className="text-xs text-gray-500">Target: &lt;3%</p>
                </CardContent>
              </Card>
            </div>

            {/* Metrics Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Quarterly performance comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Patient Satisfaction Trend</h4>
                    <div className="grid grid-cols-4 gap-4">
                      {["Q1 2023", "Q2 2023", "Q3 2023", "Q4 2023"].map((quarter, index) => (
                        <div key={quarter} className="text-center p-3 bg-gray-50 rounded">
                          <p className="text-sm font-medium">{quarter}</p>
                          <p className="text-lg font-bold text-blue-600">{[4.2, 4.3, 4.4, 4.6][index]}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Care Quality Score Trend</h4>
                    <div className="grid grid-cols-4 gap-4">
                      {["Q1 2023", "Q2 2023", "Q3 2023", "Q4 2023"].map((quarter, index) => (
                        <div key={quarter} className="text-center p-3 bg-gray-50 rounded">
                          <p className="text-sm font-medium">{quarter}</p>
                          <p className="text-lg font-bold text-green-600">{[88, 89, 91, 92][index]}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Reports Generation */}
            <Card>
              <CardHeader>
                <CardTitle>QAPI Reports</CardTitle>
                <CardDescription>Generate and download quality assurance reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Available Reports</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <FileText className="h-4 w-4 mr-2" />
                        Quarterly QAPI Summary Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Target className="h-4 w-4 mr-2" />
                        PIP Plans Status Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Performance Metrics Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Calendar className="h-4 w-4 mr-2" />
                        Meeting Minutes Archive
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Custom Report Generator</h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="report-period">Report Period</Label>
                        <select className="w-full p-2 border rounded">
                          <option>Q4 2023</option>
                          <option>Q3 2023</option>
                          <option>Q2 2023</option>
                          <option>Q1 2023</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="report-sections">Include Sections</Label>
                        <div className="space-y-2 mt-2">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked />
                            <span className="text-sm">Performance Metrics</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked />
                            <span className="text-sm">PIP Plans Progress</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" />
                            <span className="text-sm">Meeting Minutes</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" />
                            <span className="text-sm">Incident Analysis</span>
                          </label>
                        </div>
                      </div>
                      <Button className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Generate Custom Report
                      </Button>
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
