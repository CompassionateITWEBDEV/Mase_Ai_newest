"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
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
  Loader2,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"

export default function LeaveRequests() {
  const { toast } = useToast()
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [showNewRequestForm, setShowNewRequestForm] = useState(false)
  const [activeTab, setActiveTab] = useState("my-requests")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [leaveBalance, setLeaveBalance] = useState<any>({
    vacation_days: 15,
    sick_days: 8,
    personal_days: 3,
    fmla_weeks: 12,
    available: { vacation: 15, sick: 8, personal: 3, fmla_weeks: 12 },
    used: { vacation: 0, sick: 0, personal: 0, fmla: 0 },
  })
  const [currentUser, setCurrentUser] = useState<any>(null)
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

  // Get current user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setCurrentUser(user)
      } catch (e) {
        console.error("Error parsing current user:", e)
      }
    }
  }, [])

  // Fetch leave requests
  const fetchLeaveRequests = async () => {
    try {
      setIsLoading(true)
      const staffId = currentUser?.staffId || currentUser?.id
      const url = staffId 
        ? `/api/leave-requests?staffId=${encodeURIComponent(staffId)}`
        : `/api/leave-requests?all=true`
      
      const res = await fetch(url, { cache: "no-store" })
      const data = await res.json()
      
      if (data.success) {
        setLeaveRequests(data.requests || [])
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch leave balance
  const fetchLeaveBalance = async () => {
    try {
      const staffId = currentUser?.staffId || currentUser?.id
      if (!staffId) return

      const res = await fetch(`/api/leave-requests/balance?staffId=${encodeURIComponent(staffId)}`, { cache: "no-store" })
      const data = await res.json()
      
      if (data.success && data.balance) {
        setLeaveBalance(data.balance)
      }
    } catch (error) {
      console.error("Error fetching leave balance:", error)
    }
  }

  // Load data when user is available
  useEffect(() => {
    fetchLeaveRequests()
    fetchLeaveBalance()
  }, [currentUser])

  // Staff profile based on current user
  const staffProfile = {
    name: currentUser?.name || currentUser?.email?.split("@")[0] || "Staff Member",
    position: currentUser?.role || "Healthcare Professional",
    department: currentUser?.department || "General",
    hireDate: currentUser?.hireDate || "2022-01-01",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.type) {
      toast({
        title: "Error",
        description: "Please select a leave type",
        variant: "destructive",
      })
      return
    }

    if (!formData.startDate || !formData.endDate) {
      toast({
        title: "Error",
        description: "Please select start and end dates",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const staffId = currentUser?.staffId || currentUser?.id
      
      const res = await fetch("/api/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          staffName: staffProfile.name,
          staffEmail: currentUser?.email,
          staffPosition: staffProfile.position,
          staffDepartment: staffProfile.department,
          leaveType: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
          totalDays: formData.totalDays,
          returnDate: formData.returnDate,
          partialDays: formData.partialDays,
          reason: formData.reason,
          emergencyContact: formData.emergencyContact,
          workCoverage: formData.workCoverage,
          medicalCertification: formData.medicalCertification,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: "✓ Request Submitted",
          description: "Your leave request has been submitted for approval.",
        })
        
        // Reset form
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
        setActiveTab("my-requests")
        
        // Refresh requests
        await fetchLeaveRequests()
      } else {
        throw new Error(data.error || "Failed to submit request")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit leave request",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cancel a pending request
  const handleCancelRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return

    try {
      const res = await fetch("/api/leave-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          status: "cancelled",
          reviewedBy: staffProfile.name,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast({
          title: "Request Cancelled",
          description: "Your leave request has been cancelled.",
        })
        setSelectedRequest(null)
        await fetchLeaveRequests()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel leave request",
        variant: "destructive",
      })
    }
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
                    <Button type="button" variant="outline" onClick={() => setActiveTab("my-requests")}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !formData.type}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Request"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-requests" className="space-y-6">
            {/* Refresh Button */}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={fetchLeaveRequests} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* My Leave Requests */}
            <div className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Loading leave requests...</p>
                  </CardContent>
                </Card>
              ) : leaveRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">No Leave Requests</h3>
                    <p className="text-gray-600 mb-4">
                      You haven't submitted any leave requests yet.
                    </p>
                    <Button onClick={() => setActiveTab("request-leave")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Request Leave
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                leaveRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            {getTypeIcon(request.leave_type || request.type)}
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {(request.leave_type || request.type || "Leave").charAt(0).toUpperCase() + (request.leave_type || request.type || "leave").slice(1)} - {request.total_days || request.totalDays} day{(request.total_days || request.totalDays) !== 1 ? "s" : ""}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {request.start_date || request.startDate} to {request.end_date || request.endDate}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span>Request #{request.id?.substring(0, 8) || request.id}</span>
                              <span>Submitted: {(request.created_at || request.submittedDate)?.split("T")[0]}</span>
                              {request.reviewed_at && <span>Reviewed: {request.reviewed_at?.split("T")[0]}</span>}
                            </div>
                            {request.performance_impact && (
                              <p className="text-xs text-blue-600 mt-1">{request.performance_impact}</p>
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
                ))
              )}
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
                      <p className="text-2xl font-bold">{leaveBalance.available?.vacation || leaveBalance.vacation_days || 15}</p>
                      <p className="text-gray-600 text-sm">Vacation Days</p>
                      <p className="text-xs text-gray-500">
                        Used: {leaveBalance.used?.vacation || 0} | Total: {leaveBalance.vacation_days || 15}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Heart className="h-8 w-8 text-red-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{leaveBalance.available?.sick || leaveBalance.sick_days || 8}</p>
                      <p className="text-gray-600 text-sm">Sick Days</p>
                      <p className="text-xs text-gray-500">
                        Used: {leaveBalance.used?.sick || 0} | Total: {leaveBalance.sick_days || 8}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <User className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{leaveBalance.available?.personal || leaveBalance.personal_days || 3}</p>
                      <p className="text-gray-600 text-sm">Personal Days</p>
                      <p className="text-xs text-gray-500">
                        Used: {leaveBalance.used?.personal || 0} | Total: {leaveBalance.personal_days || 3}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Baby className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{leaveBalance.available?.fmla_weeks || leaveBalance.fmla_weeks || 12}</p>
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
                <CardDescription>Your approved leave requests for the current year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaveRequests.filter(r => r.status === "approved").length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No approved leave requests this year</p>
                  ) : (
                    leaveRequests
                      .filter(r => r.status === "approved")
                      .map((request) => (
                        <div key={request.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">
                              {(request.leave_type || request.type || "Leave").charAt(0).toUpperCase() + (request.leave_type || request.type || "leave").slice(1)}
                              {request.reason && ` - ${request.reason.substring(0, 30)}${request.reason.length > 30 ? '...' : ''}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {request.start_date || request.startDate} to {request.end_date || request.endDate}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{request.total_days || request.totalDays} days</p>
                            <Badge className="bg-green-100 text-green-800">Approved</Badge>
                          </div>
                        </div>
                      ))
                  )}
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
                  <span>Leave Request Details - {selectedRequest.id?.substring(0, 8) || selectedRequest.id}</span>
                  <div className="flex space-x-2">{getStatusBadge(selectedRequest.status)}</div>
                </DialogTitle>
                <DialogDescription>
                  {(selectedRequest.leave_type || selectedRequest.type || "Leave").charAt(0).toUpperCase() + (selectedRequest.leave_type || selectedRequest.type || "leave").slice(1)} - {selectedRequest.total_days || selectedRequest.totalDays} day{(selectedRequest.total_days || selectedRequest.totalDays) !== 1 ? "s" : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Leave Type</Label>
                    <p className="text-sm capitalize">{selectedRequest.leave_type || selectedRequest.type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Days</Label>
                    <p className="text-sm">{selectedRequest.total_days || selectedRequest.totalDays}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Start Date</Label>
                    <p className="text-sm">{selectedRequest.start_date || selectedRequest.startDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">End Date</Label>
                    <p className="text-sm">{selectedRequest.end_date || selectedRequest.endDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Return Date</Label>
                    <p className="text-sm">{selectedRequest.return_date || selectedRequest.returnDate || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Submitted Date</Label>
                    <p className="text-sm">{(selectedRequest.created_at || selectedRequest.submittedDate)?.split("T")[0]}</p>
                  </div>
                </div>

                {/* Performance Impact */}
                {(selectedRequest.performance_impact || selectedRequest.performanceImpact) && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Performance Impact Assessment</h4>
                    <p className="text-sm text-blue-800">{selectedRequest.performance_impact || selectedRequest.performanceImpact}</p>
                  </div>
                )}

                {/* Request Details */}
                <div>
                  <h4 className="font-medium mb-3">Request Details</h4>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Reason</Label>
                      <p className="text-sm mt-1">{selectedRequest.reason || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Emergency Contact</Label>
                      <p className="text-sm mt-1">{selectedRequest.emergency_contact || selectedRequest.emergencyContact || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Work Coverage Plan</Label>
                      <p className="text-sm mt-1">{selectedRequest.work_coverage || selectedRequest.workCoverage || "Not provided"}</p>
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
                        <p className="text-sm text-green-800">{selectedRequest.reviewed_by || selectedRequest.approvedBy || "HR Manager"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Approved Date</Label>
                        <p className="text-sm text-green-800">{(selectedRequest.reviewed_at || selectedRequest.approvedDate)?.split("T")[0]}</p>
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
                        <p className="text-sm text-red-800">{selectedRequest.reviewed_by || selectedRequest.deniedBy || "HR Manager"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Denial Reason</Label>
                        <p className="text-sm text-red-800">{selectedRequest.denial_reason || selectedRequest.denialReason || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cancelled Information */}
                {selectedRequest.status === "cancelled" && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Cancellation Details</h4>
                    <p className="text-sm text-gray-600">This request was cancelled on {(selectedRequest.reviewed_at || selectedRequest.updated_at)?.split("T")[0]}</p>
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleCancelRequest(selectedRequest.id)}
                      >
                        Cancel Request
                      </Button>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const printContent = `
                          <html>
                            <head>
                              <title>Leave Request - ${selectedRequest.id?.substring(0, 8) || selectedRequest.id}</title>
                              <style>
                                body { font-family: Arial, sans-serif; padding: 20px; }
                                h1 { color: #333; }
                                .section { margin-bottom: 20px; }
                                .label { font-weight: bold; color: #666; }
                                .value { margin-top: 5px; }
                              </style>
                            </head>
                            <body>
                              <h1>Leave Request Details</h1>
                              <div class="section">
                                <div class="label">Request ID</div>
                                <div class="value">${selectedRequest.id}</div>
                              </div>
                              <div class="section">
                                <div class="label">Leave Type</div>
                                <div class="value">${selectedRequest.leave_type || selectedRequest.type}</div>
                              </div>
                              <div class="section">
                                <div class="label">Dates</div>
                                <div class="value">${selectedRequest.start_date || selectedRequest.startDate} to ${selectedRequest.end_date || selectedRequest.endDate}</div>
                              </div>
                              <div class="section">
                                <div class="label">Total Days</div>
                                <div class="value">${selectedRequest.total_days || selectedRequest.totalDays}</div>
                              </div>
                              <div class="section">
                                <div class="label">Status</div>
                                <div class="value">${selectedRequest.status.toUpperCase()}</div>
                              </div>
                              <div class="section">
                                <div class="label">Reason</div>
                                <div class="value">${selectedRequest.reason || "Not provided"}</div>
                              </div>
                            </body>
                          </html>
                        `
                        const printWindow = window.open('', '_blank')
                        if (printWindow) {
                          printWindow.document.write(printContent)
                          printWindow.document.close()
                          printWindow.print()
                        }
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Print Request
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)}>
                      Close
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
