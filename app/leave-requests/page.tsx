"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  ArrowLeft,
  CalendarIcon,
  Eye,
  Plus,
  FileText,
  User,
  Plane,
  Heart,
  Baby,
  Briefcase,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"

export default function LeaveRequests() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [showNewRequestForm, setShowNewRequestForm] = useState(false)
  const [activeTab, setActiveTab] = useState("my-requests")
  const [formData, setFormData] = useState({
    type: "",
    startDate: "",
    endDate: "",
    totalDays: 0,
    reason: "",
    emergencyContact: "",
    workCoverage: "",
    returnDate: "",
    partialDays: false,
    medicalCertification: false,
  })

  // Mock staff performance data
  const staffProfile = {
    name: "Sarah Johnson",
    position: "Registered Nurse",
    department: "Medical/Surgical",
    hireDate: "2022-03-15",
    evaluationScore: 4.2,
    trainingScore: 95,
    complianceScore: 98,
    attendanceScore: 96,
    leaveEligibility: {
      vacation: { eligible: true, maxConsecutive: 14, requiresAdvanceNotice: 14 },
      sick: { eligible: true, maxConsecutive: 5, requiresAdvanceNotice: 0 },
      personal: { eligible: true, maxConsecutive: 3, requiresAdvanceNotice: 7 },
      fmla: { eligible: true, maxConsecutive: 84, requiresAdvanceNotice: 30 },
    },
    restrictions: [],
    recommendations: [
      "Excellent performance allows for flexible scheduling",
      "High training scores qualify for extended leave periods",
      "Strong compliance record supports leave approval",
    ],
  }

  // Mock data for leave requests
  const leaveRequests = [
    {
      id: "LR-001",
      type: "Vacation",
      startDate: "2024-02-15",
      endDate: "2024-02-22",
      totalDays: 6,
      status: "approved",
      submittedDate: "2024-01-20",
      approvedBy: "Dr. Wilson",
      approvedDate: "2024-01-22",
      reason: "Family vacation to Florida",
      emergencyContact: "Spouse - (248) 555-0123",
      workCoverage: "Michael Chen will cover patient assignments",
      returnDate: "2024-02-23",
      performanceImpact: "Low - High performance score allows extended leave",
      remainingBalance: {
        vacation: 12,
        sick: 8,
        personal: 3,
      },
    },
    {
      id: "LR-002",
      type: "Sick Leave",
      startDate: "2024-01-25",
      endDate: "2024-01-26",
      totalDays: 2,
      status: "approved",
      submittedDate: "2024-01-25",
      approvedBy: "HR Manager",
      approvedDate: "2024-01-25",
      reason: "Flu symptoms",
      emergencyContact: "Emergency contact on file",
      workCoverage: "Temporary coverage arranged",
      returnDate: "2024-01-27",
      medicalNote: "Doctor's note provided",
      performanceImpact: "None - Medical leave approved",
    },
    {
      id: "LR-003",
      type: "FMLA",
      startDate: "2024-03-01",
      endDate: "2024-05-01",
      totalDays: 60,
      status: "pending",
      submittedDate: "2024-01-18",
      reason: "Maternity leave",
      emergencyContact: "Husband - (248) 555-0456",
      workCoverage: "Temporary replacement being hired",
      returnDate: "2024-05-02",
      medicalCertification: "Required - submitted",
      fmlaEligible: true,
      performanceImpact: "Positive - Excellent performance supports extended leave",
    },
    {
      id: "LR-004",
      type: "Personal",
      startDate: "2024-02-05",
      endDate: "2024-02-05",
      totalDays: 1,
      status: "denied",
      submittedDate: "2024-02-01",
      deniedBy: "Department Manager",
      deniedDate: "2024-02-02",
      denialReason: "Insufficient staffing on requested date - recommend alternative dates",
      reason: "Personal appointment",
      emergencyContact: "Emergency contact on file",
      performanceImpact: "None - Scheduling conflict only",
    },
  ]

  const leaveTypes = [
    {
      value: "vacation",
      label: "Vacation",
      icon: Plane,
      description: "Planned time off for rest and recreation",
      eligibilityCheck: () => staffProfile.evaluationScore >= 3.0 && staffProfile.attendanceScore >= 85,
    },
    {
      value: "sick",
      label: "Sick Leave",
      icon: Heart,
      description: "Medical leave for illness or injury",
      eligibilityCheck: () => true, // Always eligible
    },
    {
      value: "personal",
      label: "Personal",
      icon: User,
      description: "Personal time off for various reasons",
      eligibilityCheck: () => staffProfile.evaluationScore >= 3.5 && staffProfile.complianceScore >= 90,
    },
    {
      value: "fmla",
      label: "FMLA",
      icon: Baby,
      description: "Family and Medical Leave Act",
      eligibilityCheck: () =>
        staffProfile.evaluationScore >= 3.0 &&
        new Date().getFullYear() - new Date(staffProfile.hireDate).getFullYear() >= 1,
    },
    {
      value: "bereavement",
      label: "Bereavement",
      icon: Heart,
      description: "Time off for loss of family member",
      eligibilityCheck: () => true, // Always eligible
    },
    {
      value: "jury",
      label: "Jury Duty",
      icon: Briefcase,
      description: "Court-mandated jury service",
      eligibilityCheck: () => true, // Always eligible
    },
    {
      value: "military",
      label: "Military",
      icon: Briefcase,
      description: "Military service obligations",
      eligibilityCheck: () => true, // Always eligible
    },
  ]

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Submitting leave request:", formData)
    // In real app, this would submit to API
    alert("Leave request submitted successfully. You will receive a confirmation email.")
    // Reset form and close modal
    setFormData({
      type: "",
      startDate: "",
      endDate: "",
      totalDays: 0,
      reason: "",
      emergencyContact: "",
      workCoverage: "",
      returnDate: "",
      partialDays: false,
      medicalCertification: false,
    })
    setShowNewRequestForm(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "denied":
        return <Badge className="bg-red-100 text-red-800">Denied</Badge>
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    const typeConfig = leaveTypes.find((t) => t.value === type.toLowerCase())
    if (typeConfig) {
      const Icon = typeConfig.icon
      return <Icon className="h-5 w-5" />
    }
    return <CalendarIcon className="h-5 w-5" />
  }

  const getPerformanceRecommendation = (type: string) => {
    const selectedType = leaveTypes.find((t) => t.value === type)
    if (!selectedType) return null

    const isEligible = selectedType.eligibilityCheck()
    const eligibility = staffProfile.leaveEligibility[type as keyof typeof staffProfile.leaveEligibility]

    return (
      <div
        className={`p-4 rounded-lg border ${isEligible ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}
      >
        <div className="flex items-center space-x-2 mb-2">
          {isEligible ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          )}
          <h4 className={`font-medium ${isEligible ? "text-green-900" : "text-yellow-900"}`}>
            {isEligible ? "Eligible for Leave" : "Limited Eligibility"}
          </h4>
        </div>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Performance Score:</strong> {staffProfile.evaluationScore}/5.0
          </p>
          <p>
            <strong>Training Score:</strong> {staffProfile.trainingScore}%
          </p>
          <p>
            <strong>Compliance Score:</strong> {staffProfile.complianceScore}%
          </p>
          {eligibility && (
            <>
              <p>
                <strong>Max Consecutive Days:</strong> {eligibility.maxConsecutive}
              </p>
              <p>
                <strong>Advance Notice Required:</strong> {eligibility.requiresAdvanceNotice} days
              </p>
            </>
          )}
        </div>
        {staffProfile.recommendations.length > 0 && (
          <div className="mt-3">
            <p className="font-medium text-sm mb-1">Recommendations:</p>
            <ul className="text-xs space-y-1">
              {staffProfile.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span>•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
                <p className="text-gray-600">Manage your time off and leave requests</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setShowNewRequestForm(true)
                setActiveTab("request-leave")
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Staff Performance Summary */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">{staffProfile.name}</h3>
                <p className="text-gray-600">
                  {staffProfile.position} - {staffProfile.department}
                </p>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{staffProfile.evaluationScore}</p>
                  <p className="text-xs text-gray-600">Evaluation</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{staffProfile.trainingScore}%</p>
                  <p className="text-xs text-gray-600">Training</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{staffProfile.complianceScore}%</p>
                  <p className="text-xs text-gray-600">Compliance</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{staffProfile.attendanceScore}%</p>
                  <p className="text-xs text-gray-600">Attendance</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="request-leave">Request Leave</TabsTrigger>
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
            <TabsTrigger value="balance">Leave Balance</TabsTrigger>
            <TabsTrigger value="calendar">Team Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="request-leave" className="space-y-6">
            {/* Leave Types Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaveTypes.map((type) => {
                const isEligible = type.eligibilityCheck()
                return (
                  <Card
                    key={type.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      formData.type === type.value ? "ring-2 ring-blue-500 bg-blue-50" : ""
                    } ${!isEligible ? "opacity-60" : ""}`}
                    onClick={() => isEligible && setFormData({ ...formData, type: type.value })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isEligible ? "bg-blue-100" : "bg-gray-100"
                          }`}
                        >
                          <type.icon className={`h-5 w-5 ${isEligible ? "text-blue-600" : "text-gray-400"}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{type.label}</h3>
                            {!isEligible && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                          </div>
                          <p className="text-xs text-gray-600">{type.description}</p>
                          {!isEligible && (
                            <p className="text-xs text-yellow-600 mt-1">Limited eligibility - check requirements</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Performance-based Recommendation */}
            {formData.type && getPerformanceRecommendation(formData.type)}

            {/* Leave Request Form */}
            <Card>
              <CardHeader>
                <CardTitle>Submit Leave Request</CardTitle>
                <CardDescription>Please provide all required information for your leave request</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="start-date">Start Date *</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => {
                          const newStartDate = e.target.value
                          setFormData({
                            ...formData,
                            startDate: newStartDate,
                            totalDays: calculateDays(newStartDate, formData.endDate),
                          })
                        }}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="end-date">End Date *</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => {
                          const newEndDate = e.target.value
                          setFormData({
                            ...formData,
                            endDate: newEndDate,
                            totalDays: calculateDays(formData.startDate, newEndDate),
                          })
                        }}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="total-days">Total Days</Label>
                      <Input id="total-days" type="number" value={formData.totalDays} readOnly className="bg-gray-50" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reason">Reason for Leave *</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Please provide a brief explanation for your leave request..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="emergency-contact">Emergency Contact</Label>
                      <Input
                        id="emergency-contact"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        placeholder="Name and phone number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="return-date">Expected Return Date</Label>
                      <Input
                        id="return-date"
                        type="date"
                        value={formData.returnDate}
                        onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="work-coverage">Work Coverage Plan</Label>
                    <Textarea
                      id="work-coverage"
                      value={formData.workCoverage}
                      onChange={(e) => setFormData({ ...formData, workCoverage: e.target.value })}
                      placeholder="Describe how your responsibilities will be covered during your absence..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="partial-days"
                        checked={formData.partialDays}
                        onCheckedChange={(checked) => setFormData({ ...formData, partialDays: checked as boolean })}
                      />
                      <Label htmlFor="partial-days">This request includes partial days</Label>
                    </div>

                    {(formData.type === "sick" || formData.type === "fmla") && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="medical-cert"
                          checked={formData.medicalCertification}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, medicalCertification: checked as boolean })
                          }
                        />
                        <Label htmlFor="medical-cert">Medical certification will be provided</Label>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button type="button" variant="outline">
                      Save Draft
                    </Button>
                    <Button type="submit">Submit Request</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-requests" className="space-y-6">
            {/* My Leave Requests */}
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          {getTypeIcon(request.type)}
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {request.type} - {request.totalDays} day{request.totalDays !== 1 ? "s" : ""}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {request.startDate} to {request.endDate}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span>Request #{request.id}</span>
                            <span>Submitted: {request.submittedDate}</span>
                            {request.approvedDate && <span>Approved: {request.approvedDate}</span>}
                          </div>
                          {request.performanceImpact && (
                            <p className="text-xs text-blue-600 mt-1">{request.performanceImpact}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(request.status)}
                        <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="balance" className="space-y-6">
            {/* Leave Balance */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Plane className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">15</p>
                      <p className="text-gray-600 text-sm">Vacation Days</p>
                      <p className="text-xs text-gray-500">Accrued: 2.5/month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Heart className="h-8 w-8 text-red-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">8</p>
                      <p className="text-gray-600 text-sm">Sick Days</p>
                      <p className="text-xs text-gray-500">Accrued: 1/month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <User className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">3</p>
                      <p className="text-gray-600 text-sm">Personal Days</p>
                      <p className="text-xs text-gray-500">Annual allocation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Baby className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">12</p>
                      <p className="text-gray-600 text-sm">FMLA Weeks</p>
                      <p className="text-xs text-gray-500">Available per year</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leave History */}
            <Card>
              <CardHeader>
                <CardTitle>Leave Usage History</CardTitle>
                <CardDescription>Your leave usage for the current year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">Vacation - Florida Trip</p>
                      <p className="text-sm text-gray-600">Feb 15-22, 2024</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">6 days</p>
                      <Badge className="bg-green-100 text-green-800">Approved</Badge>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">Sick Leave - Flu</p>
                      <p className="text-sm text-gray-600">Jan 25-26, 2024</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">2 days</p>
                      <Badge className="bg-green-100 text-green-800">Approved</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            {/* Team Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>Team Leave Calendar</CardTitle>
                <CardDescription>View upcoming leave for your team and department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Michael Chen</h4>
                        <Badge className="bg-blue-100 text-blue-800">Vacation</Badge>
                      </div>
                      <p className="text-sm text-gray-600">Feb 15-22, 2024</p>
                      <p className="text-xs text-gray-500">6 days</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Emily Davis</h4>
                        <Badge className="bg-red-100 text-red-800">Sick</Badge>
                      </div>
                      <p className="text-sm text-gray-600">Jan 25-26, 2024</p>
                      <p className="text-xs text-gray-500">2 days</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Robert Wilson</h4>
                        <Badge className="bg-purple-100 text-purple-800">FMLA</Badge>
                      </div>
                      <p className="text-sm text-gray-600">Mar 1 - May 1, 2024</p>
                      <p className="text-xs text-gray-500">60 days</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Upcoming Leave Requests</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div>
                          <p className="font-medium">John Smith - Personal Day</p>
                          <p className="text-sm text-gray-600">March 15, 2024</p>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Request Detail Modal */}
        {selectedRequest && (
          <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Leave Request Details - {selectedRequest.id}</span>
                  <div className="flex space-x-2">{getStatusBadge(selectedRequest.status)}</div>
                </DialogTitle>
                <DialogDescription>
                  {selectedRequest.type} - {selectedRequest.totalDays} day{selectedRequest.totalDays !== 1 ? "s" : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Leave Type</Label>
                    <p className="text-sm">{selectedRequest.type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Days</Label>
                    <p className="text-sm">{selectedRequest.totalDays}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Start Date</Label>
                    <p className="text-sm">{selectedRequest.startDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">End Date</Label>
                    <p className="text-sm">{selectedRequest.endDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Return Date</Label>
                    <p className="text-sm">{selectedRequest.returnDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Submitted Date</Label>
                    <p className="text-sm">{selectedRequest.submittedDate}</p>
                  </div>
                </div>

                {/* Performance Impact */}
                {selectedRequest.performanceImpact && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Performance Impact Assessment</h4>
                    <p className="text-sm text-blue-800">{selectedRequest.performanceImpact}</p>
                  </div>
                )}

                {/* Request Details */}
                <div>
                  <h4 className="font-medium mb-3">Request Details</h4>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Reason</Label>
                      <p className="text-sm mt-1">{selectedRequest.reason}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Emergency Contact</Label>
                      <p className="text-sm mt-1">{selectedRequest.emergencyContact}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Work Coverage Plan</Label>
                      <p className="text-sm mt-1">{selectedRequest.workCoverage}</p>
                    </div>
                  </div>
                </div>

                {/* Approval Information */}
                {selectedRequest.status === "approved" && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Approval Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Approved By</Label>
                        <p className="text-sm text-green-800">{selectedRequest.approvedBy}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Approved Date</Label>
                        <p className="text-sm text-green-800">{selectedRequest.approvedDate}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Denial Information */}
                {selectedRequest.status === "denied" && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">Denial Details</h4>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm font-medium">Denied By</Label>
                        <p className="text-sm text-red-800">{selectedRequest.deniedBy}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Denial Reason</Label>
                        <p className="text-sm text-red-800">{selectedRequest.denialReason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                {selectedRequest.medicalNote && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Medical Documentation</h4>
                    <p className="text-sm text-blue-800">{selectedRequest.medicalNote}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    {selectedRequest.status === "pending" && (
                      <Button variant="outline" size="sm">
                        Cancel Request
                      </Button>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Print Request
                    </Button>
                    <Button variant="outline" size="sm">
                      Export Details
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  )
}
